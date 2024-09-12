/*!
 * Copyright 2024 Google LLC. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const assert = require('assert');
const {createReadStream, ReadStream} = require('fs');
const {
  AlwaysOffSampler,
  AlwaysOnSampler,
  NodeTracerProvider,
  InMemorySpanExporter,
} = require('@opentelemetry/sdk-trace-node');
const {SpanStatusCode, TracerProvider} = require('@opentelemetry/api');
// eslint-disable-next-line n/no-extraneous-require
const {SimpleSpanProcessor} = require('@opentelemetry/sdk-trace-base');
const {
  ObservabilityOptions,
  TRACER_NAME,
  TRACER_VERSION,
  SPAN_NAMESPACE_PREFIX,
  SQLStatement,
  getActiveOrNoopSpan,
  setSpanError,
  setSpanErrorAndException,
  startTrace,
  traceUnwrap,
  traceWrap,
} = require('../src/instrument');
import {PartialResultStream} from '../src/partial-result-stream';
const {
  ATTR_OTEL_SCOPE_NAME,
  ATTR_OTEL_SCOPE_VERSION,
  SEMATTRS_DB_NAME,
  SEMATTRS_DB_SQL_TABLE,
  SEMATTRS_DB_STATEMENT,
  SEMATTRS_DB_SYSTEM,
  SEMATTRS_EXCEPTION_MESSAGE,
} = require('@opentelemetry/semantic-conventions');
const {ExecuteSqlRequest} = require('../src/transaction');

const {disableContextAndManager, setGlobalContextManager} = require('./helper');

const {
  AsyncHooksContextManager,
} = require('@opentelemetry/context-async-hooks');
import {EventEmitter} from 'events';

describe('startTrace', () => {
  const globalExporter = new InMemorySpanExporter();
  const sampler = new AlwaysOnSampler();

  const globalProvider = new NodeTracerProvider({
    sampler: sampler,
    exporter: globalExporter,
  });
  globalProvider.addSpanProcessor(new SimpleSpanProcessor(globalExporter));
  globalProvider.register();

  const contextManager = new AsyncHooksContextManager();
  setGlobalContextManager(contextManager);

  afterEach(() => {
    globalExporter.forceFlush();
  });

  after(async () => {
    globalExporter.forceFlush();
    await globalProvider.shutdown();
    disableContextAndManager(contextManager);
  });

  it('with TracerProvider in global configuration', () => {
    startTrace('mySpan', {}, span => {
      span.end();

      assert.equal(
        span.name,
        SPAN_NAMESPACE_PREFIX + '.mySpan',
        'name mismatch'
      );
    });
  });

  it('with TracerProvider in options, skips using global TracerProvider', () => {
    const overridingExporter = new InMemorySpanExporter();
    const overridingProvider = new NodeTracerProvider({
      sampler: sampler,
      exporter: overridingExporter,
    });
    overridingProvider.addSpanProcessor(
      new SimpleSpanProcessor(overridingExporter)
    );

    startTrace(
      'aSpan',
      {opts: {tracerProvider: overridingProvider}},
      async span => {
        await new Promise((resolve, reject) => setTimeout(resolve, 400));
        span.end();

        const gotSpansFromGlobal = globalExporter.getFinishedSpans();
        assert.strictEqual(
          gotSpansFromGlobal.length,
          0,
          'Expected no spans from the global tracerProvider and exporter but got ${gotSpansFromGlobal.length}'
        );

        const gotSpansFromCurrent = overridingExporter.getFinishedSpans();
        assert.strictEqual(
          gotSpansFromCurrent.length,
          1,
          'Expected exactly 1 span but got ${gotSpansFromCurrent.length}'
        );

        overridingExporter.forceFlush();
        await overridingProvider.shutdown();
      }
    );
  });

  it('with semantic attributes', () => {
    const opts = {tableName: 'table', dbName: 'db'};
    startTrace('aSpan', opts, span => {
      assert.equal(
        span.attributes[ATTR_OTEL_SCOPE_NAME],
        TRACER_NAME,
        'Missing OTEL_SCOPE_NAME attribute'
      );

      assert.equal(
        span.attributes[ATTR_OTEL_SCOPE_VERSION],
        TRACER_VERSION,
        'Missing OTEL_SCOPE_VERSION attribute'
      );

      assert.equal(
        span.attributes[SEMATTRS_DB_SYSTEM],
        'spanner',
        'Missing DB_SYSTEM attribute'
      );

      assert.equal(
        span.attributes[SEMATTRS_DB_SQL_TABLE],
        'table',
        'Missing DB_SQL_TABLE attribute'
      );

      assert.equal(
        span.attributes[SEMATTRS_DB_NAME],
        'db',
        'Missing DB_NAME attribute'
      );
    });
  });

  it('with enableExtendedTracing=true, no sql value set', () => {
    const opts = {opts: {enableExtendedTracing: true}};
    startTrace('aSpan', opts, span => {
      assert.equal(
        span.attributes[SEMATTRS_DB_STATEMENT],
        undefined,
        'Unexpected DB_STATEMENT attribute'
      );
    });
  });

  it('with enableExtendedTracing=true, sql string value set', () => {
    const opts = {
      opts: {enableExtendedTracing: true},
      sql: 'SELECT CURRENT_TIMESTAMP()',
    };

    startTrace('aSpan', opts, span => {
      assert.equal(
        span.attributes[SEMATTRS_DB_STATEMENT],
        'SELECT CURRENT_TIMESTAMP()',
        'Mismatched DB_STATEMENT attribute'
      );
    });
  });

  it('with enableExtendedTracing=false, sql string value set', () => {
    const opts = {
      opts: {enableExtendedTracing: false},
      sql: 'SELECt CURRENT_TIMESTAMP()',
    };

    startTrace('aSpan', opts, span => {
      assert.equal(
        span.attributes[SEMATTRS_DB_STATEMENT],
        undefined,
        'Mismatched DB_STATEMENT attribute'
      );
    });
  });

  it('with enableExtendedTracing=true, sql ExecuteSqlRequest value set', () => {
    const req = {sql: 'SELECT 1=1'};
    const opts = {
      opts: {enableExtendedTracing: true},
      sql: req,
    };

    startTrace('aSpan', opts, span => {
      assert.equal(
        span.attributes[SEMATTRS_DB_STATEMENT],
        'SELECT 1=1',
        'Mismatched DB_STATEMENT attribute'
      );
    });
  });

  it('with enableExtendedTracing=false, sql ExecuteSqlRequest value set', () => {
    const req = {sql: 'SELECT 1=1'};
    const opts = {
      opts: {enableExtendedTracing: true},
      sql: req,
    };

    startTrace('aSpan', opts, span => {
      assert.equal(
        span.attributes[SEMATTRS_DB_STATEMENT],
        req.sql,
        'Mismatched DB_STATEMENT attribute'
      );
    });
  });

  it('alwaysOffSampler used, no spans exported', () => {
    const overridingExporter = new InMemorySpanExporter();
    const overridingProvider = new NodeTracerProvider({
      sampler: new AlwaysOffSampler(),
      exporter: overridingExporter,
    });
    overridingProvider.addSpanProcessor(
      new SimpleSpanProcessor(overridingExporter)
    );
    overridingProvider.register();

    startTrace(
      'aSpan',
      {opts: {tracerProvider: overridingProvider}},
      async span => {
        await new Promise((resolve, reject) => setTimeout(resolve, 400));
        span.end();

        const gotSpansFromGlobal = globalExporter.getFinishedSpans();
        assert.strictEqual(
          gotSpansFromGlobal.length,
          0,
          'Expected no spans but got ${gotSpansFromGlobal.length}'
        );

        const gotSpansFromCurrent = overridingExporter.getFinishedSpans();
        assert.strictEqual(
          gotSpansFromCurrent.length,
          0,
          'Expected no spans but got ${gotSpansFromCurrent.length}'
        );

        overridingExporter.forceFlush();
        await overridingProvider.shutdown();
      }
    );
  });
});

describe('getActiveOrNoopSpan', () => {
  let globalProvider: typeof TracerProvider;
  let exporter: typeof InMemorySpanExporter;

  before(() => {
    exporter = new InMemorySpanExporter();
    globalProvider = new NodeTracerProvider({
      sampler: new AlwaysOffSampler(),
      exporter: exporter,
    });
    globalProvider.addSpanProcessor(new SimpleSpanProcessor(exporter));
    globalProvider.register();
  });

  beforeEach(() => {
    exporter.forceFlush();
  });

  after(async () => {
    await globalProvider.shutdown();
  });

  it('with no value should return a noopSpan and nothing exported', () => {
    const span = getActiveOrNoopSpan();
    assert.strictEqual(!span, false, 'the span MUST not be null regardless');
    span.updateName('aSpan should not crash');
    span.setStatus({message: 'done here'});
  });

  it('with a started span should return the currently active one', () => {
    startTrace('aSpan', {}, span => {
      const activeSpan = getActiveOrNoopSpan();
      assert.strictEqual(
        span.name,
        SPAN_NAMESPACE_PREFIX + '.aSpan',
        'names must match'
      );
      assert.strictEqual(
        span.name,
        activeSpan.name,
        `names must match between activeSpan or current one\n\tGot:  ${span.name}\n\tWant: ${activeSpan.name}`
      );
      assert.strictEqual(
        span.startTime,
        activeSpan.startTime,
        'startTimes must match'
      );
      assert.ok(
        span.duration,
        undefined,
        'the unended span must have an undefined duration'
      );
      assert.ok(
        activeSpan.duration,
        undefined,
        'the unended span must have an undefined duration, got ${activeSpan.duration}'
      );
      assert.strictEqual(
        span.duration,
        activeSpan.duration,
        'durations must match'
      );
      span.end();
    });
  });
});

describe('setError', () => {
  const exporter = new InMemorySpanExporter();
  const provider = new NodeTracerProvider({
    sampler: new AlwaysOnSampler(),
    exporter: exporter,
  });
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.register();

  const contextManager = new AsyncHooksContextManager();
  setGlobalContextManager(contextManager);

  afterEach(() => {
    exporter.forceFlush();
  });

  after(async () => {
    exporter.forceFlush();
    await provider.shutdown();
    disableContextAndManager(contextManager);
  });

  it('passing in null error or null span should have no effect', () => {
    startTrace('aSpan', {opts: {tracerProvider: provider}}, span => {
      const status1 = span.status;
      let res = setSpanError(span, null);
      assert.strictEqual(res, false, 'nothing was set');
      const status2 = span.status;
      assert.strictEqual(
        status1,
        status2,
        'setting null error should have no effect'
      );

      res = setSpanError(null, null);
      assert.strictEqual(res, false, 'nothing was set');
    });
  });

  it('a non-empty string should set the message', () => {
    startTrace('aSpan', {opts: {tracerProvider: provider}}, span => {
      const status1 = span.status;
      const res = setSpanError(span, 'this one');
      assert.strictEqual(res, true, 'value was set');
      span.end();

      const spans = exporter.getFinishedSpans();
      assert.strictEqual(spans.length, 1, 'exactly 1 span must be exported');

      const expSpan = spans[0];
      const status2 = expSpan.status;
      assert.strictEqual(status2.message, 'this one');
      assert.strictEqual(status2.code, SpanStatusCode.ERROR);
    });
  });
});

describe('setErrorAndException', () => {
  const exporter = new InMemorySpanExporter();
  const provider = new NodeTracerProvider({
    sampler: new AlwaysOnSampler(),
    exporter: exporter,
  });
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.register();

  const contextManager = new AsyncHooksContextManager();
  setGlobalContextManager(contextManager);

  afterEach(() => {
    exporter.forceFlush();
  });

  after(async () => {
    await provider.shutdown();
    disableContextAndManager(contextManager);
  });

  it('passing in null error or null span should have no effect', () => {
    startTrace('aSpan', {opts: {tracerProvider: provider}}, span => {
      const status1 = span.status;
      let res = setSpanErrorAndException(span, null);
      assert.strictEqual(res, false, 'nothing was set');
      const status2 = span.status;
      assert.strictEqual(
        status1,
        status2,
        'setting null error should have no effect'
      );

      res = setSpanErrorAndException(null, null);
      assert.strictEqual(res, false, 'nothing was set');
    });
  });

  it('a non-empty string should set the message', () => {
    startTrace('aSpan', {opts: {tracerProvider: provider}}, span => {
      const status1 = span.status;
      const res = setSpanErrorAndException(span, 'this one');
      assert.strictEqual(res, true, 'value was set');
      span.end();

      const spans = exporter.getFinishedSpans();
      assert.strictEqual(spans.length, 1, 'exactly 1 span must be exported');

      const expSpan = spans[0];
      const status2 = expSpan.status;
      assert.strictEqual(status2.message, 'this one');
      assert.strictEqual(status2.code, SpanStatusCode.ERROR);

      assert.strictEqual(
        expSpan.events[0].attributes[SEMATTRS_EXCEPTION_MESSAGE],
        'this one',
        'the exception must have been recorded'
      );
    });
  });
});

class TestWrapObject {
  observabilityOptions: typeof ObservabilityOptions;

  constructor(opts: typeof ObservabilityOptions) {
    this.observabilityOptions = opts;
  }

  withCallback(card: number, callback: (err: Error | null, res: any) => void) {
    if (card <= 0) {
      callback(new Error('only positive numbers expected'), null);
    } else {
      callback(null, card * 2);
    }
  }

  withPartialResultStream(card: number): PartialResultStream {
    const stream = new PartialResultStream({});
    if (card <= 0) {
      stream.destroy(new Error('only positive numbers expected'));
    } else {
      stream.write(JSON.stringify(card * 2));
    }
    return stream;
  }

  withPromise(card: number): Promise<number> {
    return new Promise((resolve, reject) => {
      if (card <= 0) {
        reject(new Error('only positive numbers expected'));
      } else {
        resolve(card * 2);
      }
    });
  }

  withEventEmitter(): typeof ReadStream {
    return createReadStream(__filename, 'utf8');
  }

  withIterable(card: number): Iterable<number> {
    let i = 0;
    const iter = {
      next() {
        if (i > 0) {
          return {value: 0, done: true};
        }

        i++;

        if (card <= 0) {
          throw new Error('only positive numbers expected');
        } else {
          return {value: card * 2, done: false};
        }
      },

      [Symbol.iterator]() {
        return this;
      },
    };

    return iter as Iterable<number>;
  }

  withAsyncIterable(card: number): AsyncIterable<number> {
    let i = 0;
    const asyncIter = {
      async next() {
        if (i > 0) {
          return Promise.resolve({value: 0, done: true});
        }

        i++;

        if (card <= 0) {
          return Promise.reject(new Error('only positive numbers expected'));
        } else {
          return Promise.resolve({value: card * 2, done: false});
        }
      },

      [Symbol.asyncIterator]() {
        return this;
      },
    };

    return asyncIter as AsyncIterable<number>;
  }

  /*
   * This method is necessary to test enableExtendedTracing=true and annotating spans with SQL.
   */
  withSQLLikeQuery(query: string | typeof SQLStatement | any): Promise<string> {
    return Promise.resolve('invoked');
  }
}

describe('traceWrap', () => {
  const methods = [
    'withCallback',
    'withPromise',
    'withEventEmitter',
    'withPartialResultStream',
    'withIterable',
    'withAsyncIterable',
    'withSQLLikeQuery',
  ];

  const contextManager = new AsyncHooksContextManager();
  setGlobalContextManager(contextManager);

  const exporter = new InMemorySpanExporter();
  const provider = new NodeTracerProvider({
    sampler: new AlwaysOnSampler(),
    exporter: exporter,
  });
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));

  before(() => {
    traceWrap(TestWrapObject, methods);
  });

  afterEach(() => {
    exporter.forceFlush();
  });

  after(async () => {
    traceUnwrap(TestWrapObject, methods);
    await provider.shutdown();
  });

  it('Callback', () => {
    const wrapCheck = new TestWrapObject({tracerProvider: provider});
    wrapCheck.withCallback(10, (err, res) => {
      assert.strictEqual(err, null, 'A nil error is expected');
      assert.strictEqual(res, 10 * 2);

      const spans = exporter.getFinishedSpans();
      assert.strictEqual(spans.length > 0, true, 'Atleast 1 span expected');

      // We expect a span with the name of the class.method.
      const wantName = `${SPAN_NAMESPACE_PREFIX}.${TestWrapObject.name}.withCallback`;
      assert.strictEqual(
        spans[spans.length - 1].name,
        wantName,
        'Name mismatch'
      );
    });
  });

  it('PartialResultStream', done => {
    const wrapCheck = new TestWrapObject({tracerProvider: provider});
    const stream = wrapCheck.withPartialResultStream(10);
    stream.on('error', done);
    stream
      .on('data', row => {
        const result = JSON.parse(row.value);
        assert.strictEqual(result, 10 * 2);
      })
      .on('end', () => {
        const spans = exporter.getFinishedSpans();
        assert.strictEqual(spans.length > 0, true, 'Atleast 1 span expected');

        // We expect a span with the name of the class.method.
        const wantName = `${SPAN_NAMESPACE_PREFIX}.${TestWrapObject.name}.withPartialResultStream`;
        assert.strictEqual(
          spans[spans.length - 1].name,
          wantName,
          'Name mismatch'
        );
        done();
      });

    stream.end();
  });

  it('Promise', async () => {
    const wrapCheck = new TestWrapObject({tracerProvider: provider});
    const result = await wrapCheck.withPromise(10);
    assert.strictEqual(result, 10 * 2);

    const spans = exporter.getFinishedSpans();
    assert.strictEqual(spans.length > 0, true, 'Atleast 1 span expected');

    // We expect a span with the name of the class.method.
    const wantName = `${SPAN_NAMESPACE_PREFIX}.${TestWrapObject.name}.withPromise`;
    assert.strictEqual(spans[spans.length - 1].name, wantName, 'Name mismatch');
  });

  it('EventEmitter', done => {
    const wrapCheck = new TestWrapObject({tracerProvider: provider});
    const fh = wrapCheck.withEventEmitter();
    fh.on('data', chunk => {})
      .on('error', done)
      .on('close', () => {
        const spans = exporter.getFinishedSpans();
        assert.strictEqual(spans.length > 0, true, 'Atleast 1 span expected');

        // We expect a span with the name of the class.method.
        const wantName = `${SPAN_NAMESPACE_PREFIX}.${TestWrapObject.name}.withEventEmitter`;
        assert.strictEqual(
          spans[spans.length - 1].name,
          wantName,
          'Name mismatch'
        );
        done();
      });

    fh.close();
  });

  it('Iterator', () => {
    const wrapCheck = new TestWrapObject({tracerProvider: provider});
    const iter = wrapCheck.withIterable(10);
    const results: number[] = [];
    for (const value of iter) {
      results.push(value);
    }
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0], 10 * 2);

    const spans = exporter.getFinishedSpans();
    assert.strictEqual(spans.length > 0, true, 'Atleast 1 span expected');

    // We expect a span with the name of the class.method.
    const wantName = `${SPAN_NAMESPACE_PREFIX}.${TestWrapObject.name}.withIterable`;
    assert.strictEqual(spans[spans.length - 1].name, wantName, 'Name mismatch');
  });

  it('AsyncIterator', async () => {
    const wrapCheck = new TestWrapObject({tracerProvider: provider});
    const iter = wrapCheck.withAsyncIterable(10);
    const results: number[] = [];
    for await (const value of iter) {
      results.push(value);
    }
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0], 10 * 2);

    const spans = exporter.getFinishedSpans();
    assert.strictEqual(spans.length > 0, true, 'Atleast 1 span expected');

    // We expect a span with the name of the class.method.
    const wantName = `${SPAN_NAMESPACE_PREFIX}.${TestWrapObject.name}.withAsyncIterable`;
    assert.strictEqual(spans[spans.length - 1].name, wantName, 'Name mismatch');
  });

  it('traceWrap with extendedTracing=true, string', async () => {
    const wrapCheck = new TestWrapObject({
      tracerProvider: provider,
      enableExtendedTracing: true,
    });
    const sql = 'SELECT * FROM Table';
    const [result] = await wrapCheck.withSQLLikeQuery(sql);

    const spans = exporter.getFinishedSpans();
    assert.strictEqual(spans.length > 0, true, 'Atleast 1 span expected');

    // We expect a span with the name of the class.method.
    const wantName = `${SPAN_NAMESPACE_PREFIX}.${TestWrapObject.name}.withSQLLikeQuery`;
    const targetSpan = spans[spans.length - 1];
    assert.strictEqual(targetSpan.name, wantName, 'Name mismatch');

    // Ensure that the span was annotated with the SQL statement.
    assert.strictEqual(
      targetSpan.attributes[SEMATTRS_DB_STATEMENT],
      sql,
      'Expecting the annotated SQL'
    );
  });

  it('traceWrap with extendedTracing=false, string', async () => {
    const wrapCheck = new TestWrapObject({tracerProvider: provider});
    const sql = 'SELECT * FROM Table';
    const [result] = await wrapCheck.withSQLLikeQuery(sql);

    const spans = exporter.getFinishedSpans();
    assert.strictEqual(spans.length > 0, true, 'Atleast 1 span expected');

    // We expect a span with the name of the class.method.
    const wantName = `${SPAN_NAMESPACE_PREFIX}.${TestWrapObject.name}.withSQLLikeQuery`;
    const targetSpan = spans[spans.length - 1];
    assert.strictEqual(targetSpan.name, wantName, 'Name mismatch');

    // Ensure that the span was annotated with the SQL statement.
    assert.strictEqual(
      targetSpan.attributes[SEMATTRS_DB_STATEMENT],
      undefined,
      'Expecting undefined for the annotated SQL'
    );
  });

  it('traceWrap with extendedTracing=true, ExecuteSqlRequest', async () => {
    const wrapCheck = new TestWrapObject({
      tracerProvider: provider,
      enableExtendedTracing: true,
    });
    const query: typeof ExecuteSqlRequest = {sql: 'SELECT * FROM Table'};
    const [result] = await wrapCheck.withSQLLikeQuery(query);

    const spans = exporter.getFinishedSpans();
    assert.strictEqual(spans.length > 0, true, 'Atleast 1 span expected');

    // We expect a span with the name of the class.method.
    const wantName = `${SPAN_NAMESPACE_PREFIX}.${TestWrapObject.name}.withSQLLikeQuery`;
    const targetSpan = spans[spans.length - 1];
    assert.strictEqual(targetSpan.name, wantName, 'Name mismatch');

    // Ensure that the span was annotated with the SQL statement.
    assert.strictEqual(
      targetSpan.attributes[SEMATTRS_DB_STATEMENT],
      query.sql,
      'Expecting the annotated SQL'
    );
  });

  it('traceWrap with extendedTracing=false, ExecuteSqlRequest', async () => {
    const wrapCheck = new TestWrapObject({tracerProvider: provider});
    const query: typeof ExecuteSqlRequest = {sql: 'SELECT * FROM Table'};
    const [result] = await wrapCheck.withSQLLikeQuery(query);

    const spans = exporter.getFinishedSpans();
    assert.strictEqual(spans.length > 0, true, 'Atleast 1 span expected');

    // We expect a span with the name of the class.method.
    const wantName = `${SPAN_NAMESPACE_PREFIX}.${TestWrapObject.name}.withSQLLikeQuery`;
    const targetSpan = spans[spans.length - 1];
    assert.strictEqual(targetSpan.name, wantName, 'Name mismatch');

    // Ensure that the span was annotated with the SQL statement.
    assert.strictEqual(
      targetSpan.attributes[SEMATTRS_DB_STATEMENT],
      undefined,
      'Expecting undefined for the annotated SQL'
    );
  });

  it('traceWrap with extendedTracing=true, non-annotatable', async () => {
    const wrapCheck = new TestWrapObject({
      tracerProvider: provider,
      enableExtendedTracing: true,
    });
    const [result] = await wrapCheck.withSQLLikeQuery(1000);

    const spans = exporter.getFinishedSpans();
    assert.strictEqual(spans.length > 0, true, 'Atleast 1 span expected');

    // We expect a span with the name of the class.method.
    const wantName = `${SPAN_NAMESPACE_PREFIX}.${TestWrapObject.name}.withSQLLikeQuery`;
    const targetSpan = spans[spans.length - 1];
    assert.strictEqual(targetSpan.name, wantName, 'Name mismatch');

    // Ensure that the span was annotated with the SQL statement.
    assert.strictEqual(
      targetSpan.attributes[SEMATTRS_DB_STATEMENT],
      undefined,
      'Non-annotable first query should produce undefined'
    );
  });

  it('traceWrap with extendedTracing=false, non-annotatable', async () => {
    const wrapCheck = new TestWrapObject({
      tracerProvider: provider,
      enableExtendedTracing: false,
    });
    const [result] = await wrapCheck.withSQLLikeQuery(1000);

    const spans = exporter.getFinishedSpans();
    assert.strictEqual(spans.length > 0, true, 'Atleast 1 span expected');

    // We expect a span with the name of the class.method.
    const wantName = `${SPAN_NAMESPACE_PREFIX}.${TestWrapObject.name}.withSQLLikeQuery`;
    const targetSpan = spans[spans.length - 1];
    assert.strictEqual(targetSpan.name, wantName, 'Name mismatch');

    // Ensure that the span was annotated with the SQL statement.
    assert.strictEqual(
      targetSpan.attributes[SEMATTRS_DB_STATEMENT],
      undefined,
      'Non-annotable first query should produce undefined'
    );
  });
});
