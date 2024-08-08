// Copyright 2024 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const assert = require('assert');

const {
  AlwaysOffSampler,
  AlwaysOnSampler,
  NodeTracerProvider,
  InMemorySpanExporter,
} = require('@opentelemetry/sdk-trace-node');
const {SimpleSpanProcessor} = require('@opentelemetry/sdk-trace-base');
const {
  disableContextAndManager,
  setGlobalContextManager,
  startTrace,
  setTracerProvider,
} = require('../src/instrument');
const {
  SEMATTRS_DB_STATEMENT,
  SEMATTRS_DB_SYSTEM,
} = require('@opentelemetry/semantic-conventions');

const {ContextManager} = require('@opentelemetry/api');
const {
  AsyncHooksContextManager,
} = require('@opentelemetry/context-async-hooks');

const projectId = process.env.SPANNER_TEST_PROJECTID || 'test-project';

describe('Testing spans produced with a sampler on', () => {
  const exporter = new InMemorySpanExporter();
  const sampler = new AlwaysOnSampler();

  const {Database, Spanner} = require('../src');

  let provider: typeof NodeTracerProvider;
  let contextManager: typeof ContextManager;
  let spanner: typeof Spanner;
  let database: typeof Database;

  beforeEach(async () => {
    provider = new NodeTracerProvider({
      sampler: sampler,
      exporter: exporter,
    });
    provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
    provider.register();
    setTracerProvider(provider);

    contextManager = new AsyncHooksContextManager();
    setGlobalContextManager(contextManager);

    spanner = new Spanner({
      projectId: projectId,
    });

    const instance = spanner.instance('test-instance');
    database = instance.database('test-db');

    // Warm up session creation.
    await database.run('SELECT 2');
    // await new Promise((resolve, reject) => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    spanner.close();
    exporter.forceFlush();
    exporter.reset();
    await provider.shutdown();
    disableContextAndManager(contextManager);
  });

  it('Invoking database methods creates spans: no gRPC instrumentation', () => {
    const query = {sql: 'SELECT 1'};
    database.run(query, async (err, rows, stats, metadata) => {
      assert.strictEqual(rows.length, 1);

      // Give sometime for spans to be exported.
      await new Promise((resolve, reject) => setTimeout(resolve, 500));

      const spans = exporter.getFinishedSpans();
      // We need to ensure that spans were generated and exported
      // correctly.
      assert.ok(spans.length > 0, 'at least 1 span must have been created');

      // Now sort the spans by duration, in reverse magnitude order.
      spans.sort((spanA, spanB) => {
        return spanA.duration > spanB.duration;
      });

      const got: string[] = [];
      spans.forEach(span => {
        got.push(span.name);
      });

      const want = [
        'cloud.google.com/nodejs/spanner/Database.runStream',
        'cloud.google.com/nodejs/spanner/Database.run',
        'cloud.google.com/nodejs/spanner/Transaction.runStream',
      ];

      assert.deepEqual(
        want,
        got,
        'The spans order by duration has been violated:\n\tGot:  ' +
          got.toString() +
          '\n\tWant: ' +
          want.toString()
      );

      // Ensure that each span has the attribute
      //  SEMATTRS_DB_SYSTEM, set to 'spanner'
      spans.forEach(span => {
        assert.equal(
          span.attributes[SEMATTRS_DB_SYSTEM],
          'spanner',
          'Missing DB_SYSTEM attribute'
        );
        assert.equal(
          span.attributes[SEMATTRS_DB_STATEMENT],
          undefined,
          'unexpected DB_STATEMENT attribute without it being toggled'
        );
      });
    });
  });
});

describe('Extended tracing', () => {
  const exporter = new InMemorySpanExporter();
  const sampler = new AlwaysOnSampler();

  const {Database, Spanner} = require('../src');

  let provider: typeof NodeTracerProvider;
  let contextManager: typeof ContextManager;
  let spanner: typeof Spanner;
  let database: typeof Database;

  beforeEach(async () => {
    provider = new NodeTracerProvider({
      sampler: sampler,
      exporter: exporter,
    });
    provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
    provider.register();
    setTracerProvider(provider);

    contextManager = new AsyncHooksContextManager();
    setGlobalContextManager(contextManager);
  });

  afterEach(async () => {
    spanner.close();
    exporter.forceFlush();
    exporter.reset();
    await provider.shutdown();
    disableContextAndManager(contextManager);
  });

  after(async () => {});

  const methodsTakingSQL = {
    'cloud.google.com/nodejs/spanner/Database.run': true,
    'cloud.google.com/nodejs/spanner/Database.runStream': true,
    'cloud.google.com/nodejs/spanner/Transaction.runStream': true,
  };

  it('Opt-ing into PII-risk SQL annotation on spans works', async () => {
    spanner = new Spanner({
      projectId: projectId,
      observabilityConfig: {
        tracerProvider: provider,
        enableExtendedTracing: true,
      },
    });

    const instance = spanner.instance('test-instance');
    database = instance.database('test-db');
    const query = {sql: 'SELECT CURRENT_TIMESTAMP'};
    const [rows] = await database.run(query);
    assert.strictEqual(rows.length, 1);

    const spans = exporter.getFinishedSpans();
    // We need to ensure that spans were generated and exported
    // correctly.
    assert.ok(spans.length > 0, 'at least 1 span must have been created');

    // Ensure that each span has the attribute
    //  SEMATTRS_DB_SYSTEM, set to 'spanner'
    spans.forEach(span => {
      if (!methodsTakingSQL[span.name]) {
        return;
      }

      const got = span.attributes[SEMATTRS_DB_STATEMENT];
      const want = query.sql;
      assert.strictEqual(
        got,
        want,
        `${span.name} has Invalid DB_STATEMENT attribute\n\tGot:  ${got}\n\tWant: ${want}\n\n${JSON.stringify(span.attributes)}`
      );
    });
  });

  it('By default or with extended tracing disabled', () => {
    const sopts = {sql: 'SELECT 1', enableExtendedTracing: false};

    startTrace('extendedTracingOff', sopts, span => {
      const got = span.attributes[SEMATTRS_DB_STATEMENT];
      const want = undefined;
      assert.strictEqual(
        got,
        want,
        `${span.name} has an unexpected DB_STATEMENT attribute\n\tGot:  ${got}\n\tWant: ${want}\n\n${JSON.stringify(span.attributes)}`
      );
    });
  });

  it('startTrace with enableExtendedTracing=true', () => {
    const opts = {sql: 'SELECT 1', enableExtendedTracing: true};
    startTrace('extendedTracingOn', opts, span => {
      const got = span.attributes[SEMATTRS_DB_STATEMENT];
      const want = opts.sql;
      assert.strictEqual(
        got,
        want,
        `${span.name} has an unexpected DB_STATEMENT attribute\n\tGot:  ${got}\n\tWant: ${want}\n\n${JSON.stringify(span.attributes)}`
      );
    });
  });
});

describe('Capturing sessionPool annotations', () => {
  const {Database, Spanner} = require('../src');

  const exporter = new InMemorySpanExporter();
  const sampler = new AlwaysOnSampler();

  let provider: typeof NodeTracerProvider;
  let contextManager: typeof ContextManager;
  let spanner: typeof Spanner;
  let database: typeof Database;

  beforeEach(async () => {
    spanner = new Spanner({
      projectId: projectId,
    });
    const instance = spanner.instance('test-instance');
    database = instance.database('test-db');
    // Pre-warm the session pool to ensure cached sessions are
    // available and can easily test out our attributes matches.
    await database.run('SELECT 1');

    provider = new NodeTracerProvider({
      sampler: sampler,
      exporter: exporter,
    });
    provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
    provider.register();
    setTracerProvider(provider);

    contextManager = new AsyncHooksContextManager();
    setGlobalContextManager(contextManager);
  });

  afterEach(async () => {
    database.close();
    spanner.close();
    exporter.forceFlush();
    exporter.reset();
    await provider.shutdown();
    disableContextAndManager(contextManager);
  });

  it('Check for annotations, cached session', async () => {
    const query = {sql: 'SELECT * FROM INFORMATION_SCHEMA.TABLES'};
    const [rows] = await database.run(query);
    assert.ok(rows.length > 1, 'at least 1 table result should be returned');

    exporter.forceFlush();

    const spans = exporter.getFinishedSpans();
    assert.ok(spans.length >= 1, 'at least 1 span should be exported');

    spans.sort((spanA, spanB) => {
      return spanA.startTime < spanB.startTime;
    });

    const wantSpans = [
      'cloud.google.com/nodejs/spanner/Database.runStream',
      'cloud.google.com/nodejs/spanner/Database.run',
      'cloud.google.com/nodejs/spanner/Transaction.runStream',
    ];

    const gotSpans: string[] = [];
    spans.forEach(span => {
      gotSpans.push(span.name);
    });

    assert.deepEqual(
      wantSpans,
      gotSpans,
      'The spans order by startTime has been violated:\n\tGot:  ' +
        gotSpans.toString() +
        '\n\tWant: ' +
        wantSpans.toString()
    );

    const runStreamSpanEvents = spans[0];
    assert.ok(
      runStreamSpanEvents.events.length > 0,
      'at least one event should have been added'
    );

    // Already sessions were created, given that database was created outside
    // of this method, hence we shall be re-using sessions.
    const mandatoryEvents = [
      'Attempting to get session',
      'Cache hit: has usable session',
      'popped session from inventory',
      'acquired a valid session',
    ];

    const optionalEvents = [
      'creating transaction for session',
      'created transaction for session',
      'prepareGapicRequest',
    ];

    const gotEvents: string[] = [];
    runStreamSpanEvents.events.forEach(event => {
      gotEvents.push(event.name);
    });

    assert.deepEqual(
      mandatoryEvents,
      gotEvents,
      'The events order has been violated:\n\tGot:  ' +
        gotEvents.toString() +
        '\n\tWant: ' +
        mandatoryEvents.toString()
    );
  });
});

describe('Close span', () => {
  const exporter = new InMemorySpanExporter();
  const sampler = new AlwaysOnSampler();

  const {Spanner} = require('../src');

  const provider = new NodeTracerProvider({
    sampler: sampler,
    exporter: exporter,
  });
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.register();
  setTracerProvider(provider);

  const contextManager = new AsyncHooksContextManager();
  setGlobalContextManager(contextManager);

  afterEach(async () => {
    exporter.forceFlush();
    exporter.reset();
    await provider.shutdown();
    disableContextAndManager(contextManager);
  });

  it('Close span must be emitted', async () => {
    const spanner = new Spanner({
      projectId: projectId,
    });
    spanner.close();

    const spans = exporter.getFinishedSpans();

    spans.sort((spanA, spanB) => {
      return spanA.startTime < spanB.startTime;
    });
    const gotSpans: string[] = [];
    spans.forEach(span => {
      gotSpans.push(span.name);
    });
    // We need to ensure that spans were generated and exported
    // correctly.
    assert.strictEqual(
      spans.length,
      1,
      'exactly 1 span must have been emitted ' + gotSpans.toString()
    );

    const got = spans[0].name;
    const want = 'cloud.google.com/nodejs/spanner/Spanner.close';
    assert.deepEqual(
      want,
      got,
      'Mismatched span:\n\tGot:  ' + got + '\n\tWant: ' + want
    );
  });
});

describe('Always off sampler used', () => {
  const exporter = new InMemorySpanExporter();
  const sampler = new AlwaysOffSampler();

  const {Database, Spanner} = require('../src');

  let provider: typeof NodeTracerProvider;
  let contextManager: typeof ContextManager;
  let spanner: typeof Spanner;
  let database: typeof Database;

  beforeEach(() => {
    provider = new NodeTracerProvider({
      sampler: sampler,
      exporter: exporter,
    });
    provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
    provider.register();
    setTracerProvider(provider);

    contextManager = new AsyncHooksContextManager();
    setGlobalContextManager(contextManager);

    spanner = new Spanner({
      projectId: projectId,
    });
    const instance = spanner.instance('test-instance');
    database = instance.database('test-db');
  });

  afterEach(async () => {
    database.close();
    spanner.close();
    disableContextAndManager(contextManager);
    exporter.forceFlush();
    exporter.reset();
    await provider.shutdown();
  });

  it('Querying with gRPC enabled', async () => {
    const query = {sql: 'SELECT 1'};
    const [rows] = await database.run(query);
    assert.strictEqual(rows.length, 1);

    const spans = exporter.getFinishedSpans();
    assert.strictEqual(spans.length, 0, 'no spans should be exported');
  });

  it('Opt-ing into PII-risk SQL annotation', async () => {
    const query = {sql: 'SELECT CURRENT_TIMESTAMP()'};
    const [rows] = await database.run(query);
    assert.strictEqual(rows.length, 1);

    const spans = exporter.getFinishedSpans();
    assert.strictEqual(spans.length, 0, 'no spans must be created');
  });
});
