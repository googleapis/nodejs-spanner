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

import * as assert from 'assert';
import {grpc} from 'google-gax';
import {google} from '../protos/protos';
import {Database, Instance, Spanner} from '../src';
import {MutationSet} from '../src/transaction';
import protobuf = google.spanner.v1;
import v1 = google.spanner.v1;
import PartialResultSet = google.spanner.v1.PartialResultSet;
import * as mock from '../test/mockserver/mockspanner';
import * as mockInstanceAdmin from '../test/mockserver/mockinstanceadmin';
import * as mockDatabaseAdmin from '../test/mockserver/mockdatabaseadmin';
import * as sinon from 'sinon';
import {Row} from '../src/partial-result-stream';
import {Json} from '../src/codec';
const {
  AlwaysOnSampler,
  NodeTracerProvider,
  InMemorySpanExporter,
} = require('@opentelemetry/sdk-trace-node');
// eslint-disable-next-line n/no-extraneous-require
const {SimpleSpanProcessor} = require('@opentelemetry/sdk-trace-base');
const {SpanStatusCode} = require('@opentelemetry/api');
const {
  disableContextAndManager,
  generateWithAllSpansHaveDBName,
  setGlobalContextManager,
} = require('./helper');
const {
  AsyncHooksContextManager,
} = require('@opentelemetry/context-async-hooks');

const {ObservabilityOptions} = require('../src/instrument');
import {SessionPool} from '../src/session-pool';

const selectSql = 'SELECT 1';
const updateSql = 'UPDATE FOO SET BAR=1 WHERE BAZ=2';

/** A simple result set for SELECT 1. */
function createSelect1ResultSet(): protobuf.ResultSet {
  const fields = [
    protobuf.StructType.Field.create({
      name: 'NUM',
      type: protobuf.Type.create({code: protobuf.TypeCode.INT64}),
    }),
  ];
  const metadata = new protobuf.ResultSetMetadata({
    rowType: new protobuf.StructType({
      fields,
    }),
  });
  return protobuf.ResultSet.create({
    metadata,
    rows: [{values: [{stringValue: '1'}]}],
  });
}

interface setupResults {
  server: grpc.Server;
  spanner: Spanner;
  spannerMock: mock.MockSpanner;
}

async function setup(
  observabilityOptions?: typeof ObservabilityOptions
): Promise<setupResults> {
  const server = new grpc.Server();

  const spannerMock = mock.createMockSpanner(server);
  mockInstanceAdmin.createMockInstanceAdmin(server);
  mockDatabaseAdmin.createMockDatabaseAdmin(server);

  const port: number = await new Promise((resolve, reject) => {
    server.bindAsync(
      '0.0.0.0:0',
      grpc.ServerCredentials.createInsecure(),
      (err, assignedPort) => {
        if (err) {
          reject(err);
        } else {
          resolve(assignedPort);
        }
      }
    );
  });

  spannerMock.putStatementResult(
    selectSql,
    mock.StatementResult.resultSet(createSelect1ResultSet())
  );
  spannerMock.putStatementResult(
    updateSql,
    mock.StatementResult.updateCount(1)
  );

  const spanner = new Spanner({
    projectId: 'observability-project-id',
    servicePath: 'localhost',
    port,
    sslCreds: grpc.credentials.createInsecure(),
    observabilityOptions: observabilityOptions,
  });

  return Promise.resolve({
    spanner: spanner,
    server: server,
    spannerMock: spannerMock,
  });
}

describe('EndToEnd', async () => {
  const contextManager = new AsyncHooksContextManager();
  setGlobalContextManager(contextManager);
  afterEach(() => {
    disableContextAndManager(contextManager);
  });

  const traceExporter = new InMemorySpanExporter();
  const sampler = new AlwaysOnSampler();
  const tracerProvider = new NodeTracerProvider({
    sampler: sampler,
    exporter: traceExporter,
  });
  tracerProvider.addSpanProcessor(new SimpleSpanProcessor(traceExporter));

  const setupResult = await setup({
    tracerProvider: tracerProvider,
    enableExtendedTracing: false,
  });

  const server = setupResult.server;
  const spannerMock = setupResult.spannerMock;
  const spanner = setupResult.spanner;
  const instance = spanner.instance('instance');

  after(async () => {
    spanner.close();
    await server.tryShutdown(() => {});
  });

  afterEach(async () => {
    await tracerProvider.forceFlush();
    await traceExporter.reset();
    spannerMock.resetRequests();
  });

  const database = instance.database('database');

  beforeEach(async () => {
    // To deflake expectations of session creation, let's
    // issue out a warm-up request request that'll ensure
    // that the SessionPool is created deterministically.
    const [rows] = await database.run('SELECT 1');
    // Clear out any present traces to make a clean slate for testing.
    traceExporter.forceFlush();
    traceExporter.reset();
  });

  describe('Database', () => {
    it('getSessions', async () => {
      const [rows] = await database.getSessions();

      const withAllSpansHaveDBName = generateWithAllSpansHaveDBName(
        database.formattedName_
      );
      traceExporter.forceFlush();
      const spans = traceExporter.getFinishedSpans();
      assert.strictEqual(spans.length, 1, 'Exactly 1 span expected');
      withAllSpansHaveDBName(spans);

      const actualSpanNames: string[] = [];
      const actualEventNames: string[] = [];
      spans.forEach(span => {
        actualSpanNames.push(span.name);
        span.events.forEach(event => {
          actualEventNames.push(event.name);
        });
      });

      const expectedSpanNames = ['CloudSpanner.Database.getSessions'];
      assert.deepStrictEqual(
        actualSpanNames,
        expectedSpanNames,
        `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
      );

      const expectedEventNames = [];
      assert.deepStrictEqual(
        actualEventNames,
        expectedEventNames,
        `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
      );
    });

    it('getSnapshot', done => {
      const withAllSpansHaveDBName = generateWithAllSpansHaveDBName(
        database.formattedName_
      );

      database.getSnapshot((err, transaction) => {
        assert.ifError(err);

        transaction!.run('SELECT 1', async (err, rows) => {
          assert.ifError(err);
          transaction!.end();

          await tracerProvider.forceFlush();
          traceExporter.forceFlush();
          const spans = traceExporter.getFinishedSpans();
          withAllSpansHaveDBName(spans);

          const actualSpanNames: string[] = [];
          const actualEventNames: string[] = [];
          spans.forEach(span => {
            actualSpanNames.push(span.name);
            span.events.forEach(event => {
              actualEventNames.push(event.name);
            });
          });

          const expectedSpanNames = [
            'CloudSpanner.Snapshot.begin',
            'CloudSpanner.Database.getSnapshot',
            'CloudSpanner.Snapshot.runStream',
            'CloudSpanner.Snapshot.run',
          ];
          assert.deepStrictEqual(
            actualSpanNames,
            expectedSpanNames,
            `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
          );

          const expectedEventNames = [
            'Begin Transaction',
            'Transaction Creation Done',
            'Acquiring session',
            'Cache hit: has usable session',
            'Acquired session',
            'Starting stream',
          ];
          assert.deepStrictEqual(
            actualEventNames,
            expectedEventNames,
            `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
          );

          done();
        });
      });
    });

    it('getTransaction', done => {
      const withAllSpansHaveDBName = generateWithAllSpansHaveDBName(
        database.formattedName_
      );
      database.getTransaction(async (err, transaction) => {
        assert.ifError(err);
        assert.ok(transaction);
        transaction!.end();
        transaction!.commit();

        await tracerProvider.forceFlush();
        traceExporter.forceFlush();
        const spans = traceExporter.getFinishedSpans();
        withAllSpansHaveDBName(spans);

        const actualEventNames: string[] = [];
        const actualSpanNames: string[] = [];
        spans.forEach(span => {
          actualSpanNames.push(span.name);
          span.events.forEach(event => {
            actualEventNames.push(event.name);
          });
        });

        const expectedSpanNames = ['CloudSpanner.Database.getTransaction'];
        assert.deepStrictEqual(
          actualSpanNames,
          expectedSpanNames,
          `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
        );

        const expectedEventNames = [
          'Acquiring session',
          'Cache hit: has usable session',
          'Acquired session',
          'Using Session',
        ];
        assert.deepStrictEqual(
          actualEventNames,
          expectedEventNames,
          `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
        );

        done();
      });
    });

    it('runStream', done => {
      const withAllSpansHaveDBName = generateWithAllSpansHaveDBName(
        database.formattedName_
      );
      database
        .runStream('SELECT 1')
        .on('data', row => {})
        .once('error', assert.ifError)
        .on('end', () => {
          traceExporter.forceFlush();
          const spans = traceExporter.getFinishedSpans();
          withAllSpansHaveDBName(spans);

          const actualSpanNames: string[] = [];
          const actualEventNames: string[] = [];
          spans.forEach(span => {
            actualSpanNames.push(span.name);
            span.events.forEach(event => {
              actualEventNames.push(event.name);
            });
          });

          const expectedSpanNames = [
            'CloudSpanner.Snapshot.runStream',
            'CloudSpanner.Database.runStream',
          ];
          assert.deepStrictEqual(
            actualSpanNames,
            expectedSpanNames,
            `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
          );

          const expectedEventNames = [
            'Starting stream',
            'Acquiring session',
            'Cache hit: has usable session',
            'Acquired session',
            'Using Session',
          ];
          assert.deepStrictEqual(
            actualEventNames,
            expectedEventNames,
            `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
          );

          done();
        });
    });

    it('run', async () => {
      const withAllSpansHaveDBName = generateWithAllSpansHaveDBName(
        database.formattedName_
      );
      const [rows] = await database.run('SELECT 1');

      traceExporter.forceFlush();
      const spans = traceExporter.getFinishedSpans();
      withAllSpansHaveDBName(spans);

      // Sort the spans by duration.
      spans.sort((spanA, spanB) => {
        spanA.duration < spanB.duration;
      });

      const actualEventNames: string[] = [];
      const actualSpanNames: string[] = [];
      spans.forEach(span => {
        actualSpanNames.push(span.name);
        span.events.forEach(event => {
          actualEventNames.push(event.name);
        });
      });

      const expectedSpanNames = [
        'CloudSpanner.Snapshot.runStream',
        'CloudSpanner.Database.runStream',
        'CloudSpanner.Database.run',
      ];
      assert.deepStrictEqual(
        actualSpanNames,
        expectedSpanNames,
        `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
      );

      // Ensure that RunStream is a child span of createQueryPartitions.
      const spanRunStream = spans[0];
      const spanRun = spans[1];
      assert.ok(
        spanRun.spanContext().traceId,
        'Expected that createQueryPartitions has a defined traceId'
      );
      assert.ok(
        spanRunStream.spanContext().traceId,
        'Expected that RunStream has a defined traceId'
      );
      assert.ok(
        spanRun.spanContext().spanId,
        'Expected that createQueryPartitions has a defined spanId'
      );
      assert.ok(
        spanRunStream.spanContext().spanId,
        'Expected that RunStream has a defined spanId'
      );

      const expectedEventNames = [
        'Starting stream',
        'Acquiring session',
        'Cache hit: has usable session',
        'Acquired session',
        'Using Session',
      ];
      assert.deepStrictEqual(
        actualEventNames,
        expectedEventNames,
        `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
      );
    });

    it('runTransaction', done => {
      const withAllSpansHaveDBName = generateWithAllSpansHaveDBName(
        database.formattedName_
      );

      database.runTransaction(async (err, transaction) => {
        assert.ifError(err);
        await transaction!.run('SELECT 1');
        await transaction!.commit();
        await transaction!.end();
        await traceExporter.forceFlush();

        const spans = traceExporter.getFinishedSpans();
        withAllSpansHaveDBName(spans);

        const actualEventNames: string[] = [];
        const actualSpanNames: string[] = [];
        spans.forEach(span => {
          actualSpanNames.push(span.name);
          span.events.forEach(event => {
            actualEventNames.push(event.name);
          });
        });

        const expectedSpanNames = [
          'CloudSpanner.Snapshot.runStream',
          'CloudSpanner.Snapshot.run',
          'CloudSpanner.Transaction.commit',
          'CloudSpanner.Database.runTransaction',
        ];
        assert.deepStrictEqual(
          actualSpanNames,
          expectedSpanNames,
          `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
        );

        const expectedEventNames = [
          'Starting stream',
          'Transaction Creation Done',
          'Starting Commit',
          'Commit Done',
          'Acquiring session',
          'Cache hit: has usable session',
          'Acquired session',
        ];
        assert.deepStrictEqual(
          actualEventNames,
          expectedEventNames,
          `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
        );
        done();
      });
    });

    it('runTransactionAsync', async () => {
      const withAllSpansHaveDBName = generateWithAllSpansHaveDBName(
        database.formattedName_
      );
      await database.runTransactionAsync(async transaction => {
        await transaction!.run('SELECT 1');
      });

      traceExporter.forceFlush();
      const spans = traceExporter.getFinishedSpans();
      withAllSpansHaveDBName(spans);

      const actualEventNames: string[] = [];
      const actualSpanNames: string[] = [];
      spans.forEach(span => {
        actualSpanNames.push(span.name);
        span.events.forEach(event => {
          actualEventNames.push(event.name);
        });
      });

      const expectedSpanNames = [
        'CloudSpanner.Snapshot.runStream',
        'CloudSpanner.Snapshot.run',
        'CloudSpanner.Database.runTransactionAsync',
      ];
      assert.deepStrictEqual(
        actualSpanNames,
        expectedSpanNames,
        `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
      );

      const expectedEventNames = [
        'Starting stream',
        'Transaction Creation Done',
        'Acquiring session',
        'Cache hit: has usable session',
        'Acquired session',
        'Using Session',
      ];
      assert.deepStrictEqual(
        actualEventNames,
        expectedEventNames,
        `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
      );
    });

    it('writeAtLeastOnce', done => {
      const withAllSpansHaveDBName = generateWithAllSpansHaveDBName(
        database.formattedName_
      );
      const blankMutations = new MutationSet();
      database.writeAtLeastOnce(blankMutations, (err, response) => {
        assert.ifError(err);
        assert.ok(response);

        traceExporter.forceFlush();
        const spans = traceExporter.getFinishedSpans();
        withAllSpansHaveDBName(spans);

        const actualEventNames: string[] = [];
        const actualSpanNames: string[] = [];
        spans.forEach(span => {
          actualSpanNames.push(span.name);
          span.events.forEach(event => {
            actualEventNames.push(event.name);
          });
        });

        const expectedSpanNames = [
          'CloudSpanner.Transaction.commit',
          'CloudSpanner.Database.writeAtLeastOnce',
        ];
        assert.deepStrictEqual(
          actualSpanNames,
          expectedSpanNames,
          `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
        );

        const expectedEventNames = [
          'Starting Commit',
          'Commit Done',
          'Acquiring session',
          'Cache hit: has usable session',
          'Acquired session',
          'Using Session',
        ];
        assert.deepStrictEqual(
          actualEventNames,
          expectedEventNames,
          `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
        );

        done();
      });
    });

    it('batchCreateSessions', done => {
      database.batchCreateSessions(5, (err, sessions) => {
        assert.ifError(err);

        traceExporter.forceFlush();
        const spans = traceExporter.getFinishedSpans();

        const actualEventNames: string[] = [];
        const actualSpanNames: string[] = [];
        spans.forEach(span => {
          actualSpanNames.push(span.name);
          span.events.forEach(event => {
            actualEventNames.push(event.name);
          });
        });

        const expectedSpanNames = ['CloudSpanner.Database.batchCreateSessions'];
        assert.deepStrictEqual(
          actualSpanNames,
          expectedSpanNames,
          `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
        );

        const expectedEventNames = [];
        assert.deepStrictEqual(
          actualEventNames,
          expectedEventNames,
          `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
        );

        done();
      });
    });
  });
});

describe('SessionPool', async () => {
  const traceExporter = new InMemorySpanExporter();
  const sampler = new AlwaysOnSampler();
  const provider = new NodeTracerProvider({
    sampler: sampler,
    exporter: traceExporter,
  });
  provider.addSpanProcessor(new SimpleSpanProcessor(traceExporter));

  const setupResult = await setup({
    tracerProvider: provider,
    enableExtendedTracing: false,
  });

  const spanner = setupResult.spanner;
  const server = setupResult.server;
  const spannerMock = setupResult.spannerMock;
  const instance = spanner.instance('instance');

  after(async () => {
    traceExporter.reset();
    await provider.shutdown();
    spannerMock.resetRequests();
    spanner.close();
    server.tryShutdown(() => {});
  });

  it('_createSessions', async () => {
    // The first invocation of new SessionPool shall implicitly happen in here.
    const database = instance.database('database');
    await database.run('SELECT 1');

    await provider.forceFlush();
    traceExporter.reset();

    // Explicitly invoking new SessionPool.
    const sessionPool = new SessionPool(database);

    const OPTIONS = 3;
    await sessionPool._createSessions(OPTIONS);

    traceExporter.forceFlush();
    const spans = traceExporter.getFinishedSpans();

    const actualSpanNames: string[] = [];
    const actualEventNames: string[] = [];
    spans.forEach(span => {
      actualSpanNames.push(span.name);
      span.events.forEach(event => {
        actualEventNames.push(event.name);
      });
    });

    const expectedSpanNames = [
      'CloudSpanner.Database.batchCreateSessions',
      'CloudSpanner.SessionPool.createSessions',
    ];
    assert.deepStrictEqual(
      actualSpanNames,
      expectedSpanNames,
      `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
    );

    const expectedEventNames = [
      'Requesting 3 sessions',
      'Creating 3 sessions',
      'Requested for 3 sessions returned 3',
    ];
    assert.deepStrictEqual(
      actualEventNames,
      expectedEventNames,
      `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
    );
  });
});

describe('ObservabilityOptions injection and propagation', async () => {
  it('Passed into Spanner, Instance and Database', async () => {
    const traceExporter = new InMemorySpanExporter();
    const tracerProvider = new NodeTracerProvider({
      sampler: new AlwaysOnSampler(),
      exporter: traceExporter,
    });
    tracerProvider.addSpanProcessor(new SimpleSpanProcessor(traceExporter));

    const observabilityOptions: typeof ObservabilityOptions = {
      tracerProvider: tracerProvider,
      enableExtendedTracing: true,
    };

    const setupResult = await setup(observabilityOptions);
    const spanner = setupResult.spanner;
    const server = setupResult.server;
    const spannerMock = setupResult.spannerMock;

    after(async () => {
      traceExporter.reset();
      await tracerProvider.shutdown();
      spannerMock.resetRequests();
      spanner.close();
      server.tryShutdown(() => {});
    });

    // Ensure that the same observability configuration is set on the Spanner client.
    assert.deepStrictEqual(spanner._observabilityOptions, observabilityOptions);

    // Acquire a handle to the Instance through spanner.instance.
    const instanceByHandle = spanner.instance('instance');
    assert.deepStrictEqual(
      instanceByHandle._observabilityOptions,
      observabilityOptions
    );

    // Create the Instance by means of a constructor directly.
    const instanceByConstructor = new Instance(spanner, 'myInstance');
    assert.deepStrictEqual(
      instanceByConstructor._observabilityOptions,
      observabilityOptions
    );

    // Acquire a handle to the Database through instance.database.
    const databaseByHandle = instanceByHandle.database('database');
    assert.deepStrictEqual(
      databaseByHandle._observabilityOptions,
      observabilityOptions
    );

    // Create the Database by means of a constructor directly.
    const databaseByConstructor = new Database(
      instanceByConstructor,
      'myDatabase'
    );
    assert.deepStrictEqual(
      databaseByConstructor._observabilityOptions,
      observabilityOptions
    );
  });

  describe('Transaction', async () => {
    const traceExporter = new InMemorySpanExporter();
    const tracerProvider = new NodeTracerProvider({
      sampler: new AlwaysOnSampler(),
      exporter: traceExporter,
    });
    tracerProvider.addSpanProcessor(new SimpleSpanProcessor(traceExporter));

    const observabilityOptions: typeof ObservabilityOptions = {
      tracerProvider: tracerProvider,
      enableExtendedTracing: true,
    };
    const setupResult = await setup(observabilityOptions);
    const spanner = setupResult.spanner;
    const server = setupResult.server;
    const spannerMock = setupResult.spannerMock;

    after(async () => {
      traceExporter.reset();
      await tracerProvider.shutdown();
      spannerMock.resetRequests();
      spanner.close();
      server.tryShutdown(() => {});
    });

    let database: Database;
    beforeEach(async () => {
      const instance = spanner.instance('instance');
      database = instance.database('database');

      // To deflake expectations of session creation, let's
      // issue out a warm-up request request that'll ensure
      // that the SessionPool is created deterministically.
      const [rows] = await database.run('SELECT 1');
      // Clear out any present traces to make a clean slate for testing.
      traceExporter.forceFlush();
      traceExporter.reset();
    });

    afterEach(() => {
      spannerMock.resetRequests();
    });

    const db = spanner.instance('instance').database('database');
    const withAllSpansHaveDBName = generateWithAllSpansHaveDBName(
      db.formattedName_
    );

    it('run', done => {
      database.getTransaction((err, tx) => {
        assert.ifError(err);

        tx!.run('SELECT 1', async (err, rows) => {
          tx!.end();

          await tracerProvider.forceFlush();
          traceExporter.forceFlush();

          const spans = traceExporter.getFinishedSpans();
          withAllSpansHaveDBName(spans);

          const actualSpanNames: string[] = [];
          const actualEventNames: string[] = [];
          spans.forEach(span => {
            actualSpanNames.push(span.name);
            span.events.forEach(event => {
              actualEventNames.push(event.name);
            });
          });

          const expectedSpanNames = [
            'CloudSpanner.Database.getTransaction',
            'CloudSpanner.Snapshot.runStream',
            'CloudSpanner.Snapshot.run',
          ];
          assert.deepStrictEqual(
            actualSpanNames,
            expectedSpanNames,
            `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
          );

          const expectedEventNames = [
            'Acquiring session',
            'Cache hit: has usable session',
            'Acquired session',
            'Using Session',
            'Starting stream',
            'Transaction Creation Done',
          ];
          assert.strictEqual(
            actualEventNames.every(value => expectedEventNames.includes(value)),
            true,
            `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
          );

          done();
        });
      });
    });

    it('Transaction.begin+Dml.runUpdate', done => {
      database.getTransaction((err, tx) => {
        assert.ifError(err);

        // Firstly erase the prior spans so that we can have only Transaction spans.
        traceExporter.reset();

        tx!.begin();
        tx!.runUpdate(updateSql, async (err, rowCount) => {
          assert.ifError(err);
          tx!.end();

          await tracerProvider.forceFlush();
          await traceExporter.forceFlush();

          const spans = traceExporter.getFinishedSpans();
          withAllSpansHaveDBName(spans);

          const actualSpanNames: string[] = [];
          const actualEventNames: string[] = [];
          spans.forEach(span => {
            actualSpanNames.push(span.name);
            span.events.forEach(event => {
              actualEventNames.push(event.name);
            });
          });

          const expectedSpanNames = [
            'CloudSpanner.Snapshot.begin',
            'CloudSpanner.Snapshot.runStream',
            'CloudSpanner.Snapshot.run',
            'CloudSpanner.Dml.runUpdate',
          ];
          assert.deepStrictEqual(
            actualSpanNames,
            expectedSpanNames,
            `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
          );

          const expectedEventNames = [
            'Begin Transaction',
            'Transaction Creation Done',
            'Starting stream',
          ];
          assert.deepStrictEqual(
            actualEventNames.every(value => expectedEventNames.includes(value)),
            true,
            `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
          );

          done();
        });
      });
    });

    it('runStream', done => {
      let rowCount = 0;
      database.getTransaction((err, tx) => {
        assert.ifError(err);
        tx!
          .runStream(selectSql)
          .on('data', () => rowCount++)
          .on('error', assert.ifError)
          .on('stats', _stats => {})
          .on('end', async () => {
            tx!.end();

            await tracerProvider.forceFlush();
            traceExporter.forceFlush();

            const spans = traceExporter.getFinishedSpans();
            withAllSpansHaveDBName(spans);

            const actualSpanNames: string[] = [];
            const actualEventNames: string[] = [];
            spans.forEach(span => {
              actualSpanNames.push(span.name);
              span.events.forEach(event => {
                actualEventNames.push(event.name);
              });
            });

            const expectedSpanNames = [
              'CloudSpanner.Database.getTransaction',
              'CloudSpanner.Snapshot.runStream',
            ];
            assert.deepStrictEqual(
              actualSpanNames,
              expectedSpanNames,
              `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
            );

            const expectedEventNames = [
              'Acquiring session',
              'Cache hit: has usable session',
              'Acquired session',
              'Using Session',
              'Starting stream',
            ];
            assert.deepStrictEqual(
              actualEventNames,
              expectedEventNames,
              `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
            );

            done();
          });
      });
    });

    it('rollback', done => {
      database.getTransaction((err, tx) => {
        assert.ifError(err);

        // Firstly erase the prior spans so that we can have only Transaction spans.
        traceExporter.reset();

        tx!.begin();

        tx!.runUpdate(updateSql, async (err, rowCount) => {
          assert.ifError(err);
          tx!.rollback(async err => {
            tx!.end();
            await tracerProvider.forceFlush();
            traceExporter.forceFlush();

            const spans = traceExporter.getFinishedSpans();
            withAllSpansHaveDBName(spans);

            const actualSpanNames: string[] = [];
            const actualEventNames: string[] = [];
            spans.forEach(span => {
              actualSpanNames.push(span.name);
              span.events.forEach(event => {
                actualEventNames.push(event.name);
              });
            });

            const expectedSpanNames = [
              'CloudSpanner.Snapshot.begin',
              'CloudSpanner.Snapshot.runStream',
              'CloudSpanner.Snapshot.run',
              'CloudSpanner.Dml.runUpdate',
              'CloudSpanner.Transaction.rollback',
            ];
            assert.deepStrictEqual(
              actualSpanNames,
              expectedSpanNames,
              `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
            );

            const expectedEventNames = [
              'Begin Transaction',
              'Transaction Creation Done',
              'Starting stream',
            ];
            assert.strictEqual(
              actualEventNames.every(value =>
                expectedEventNames.includes(value)
              ),
              true,
              `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
            );

            done();
          });
        });
      });
    });
  });

  it('Propagates spans to the injected not global TracerProvider', async () => {
    const globalTraceExporter = new InMemorySpanExporter();
    const globalTracerProvider = new NodeTracerProvider({
      sampler: new AlwaysOnSampler(),
      exporter: globalTraceExporter,
    });
    globalTracerProvider.addSpanProcessor(
      new SimpleSpanProcessor(globalTraceExporter)
    );
    globalTracerProvider.register();

    const injectedTraceExporter = new InMemorySpanExporter();
    const injectedTracerProvider = new NodeTracerProvider({
      sampler: new AlwaysOnSampler(),
      exporter: injectedTraceExporter,
    });
    injectedTracerProvider.addSpanProcessor(
      new SimpleSpanProcessor(injectedTraceExporter)
    );

    const observabilityOptions: typeof ObservabilityOptions = {
      tracerProvider: injectedTracerProvider,
      enableExtendedTracing: true,
    };
    const setupResult = await setup(observabilityOptions);
    const spanner = setupResult.spanner;
    const server = setupResult.server;
    const spannerMock = setupResult.spannerMock;

    after(async () => {
      injectedTraceExporter.reset();
      await injectedTracerProvider.shutdown();
      spannerMock.resetRequests();
      spanner.close();
      server.tryShutdown(() => {});
    });

    const instance = spanner.instance('instance');
    const database = instance.database('database');

    const withAllSpansHaveDBName = generateWithAllSpansHaveDBName(
      database.formattedName_
    );

    database.run('SELECT 1', (err, rows) => {
      assert.ifError(err);

      injectedTraceExporter.forceFlush();
      globalTraceExporter.forceFlush();
      const spansFromInjected = injectedTraceExporter.getFinishedSpans();
      const spansFromGlobal = globalTraceExporter.getFinishedSpans();

      assert.strictEqual(
        spansFromGlobal.length,
        0,
        'Expecting no spans from the global exporter'
      );
      assert.strictEqual(
        spansFromInjected.length > 0,
        true,
        'Expecting spans from the injected exporter'
      );

      spansFromInjected.sort((spanA, spanB) => {
        spanA.startTime < spanB.startTime;
      });
      withAllSpansHaveDBName(spansFromInjected);
      const actualSpanNames: string[] = [];
      const actualEventNames: string[] = [];
      spansFromInjected.forEach(span => {
        actualSpanNames.push(span.name);
        span.events.forEach(event => {
          actualEventNames.push(event.name);
        });
      });

      const expectedSpanNames = [
        'CloudSpanner.Database.batchCreateSessions',
        'CloudSpanner.SessionPool.createSessions',
        'CloudSpanner.Snapshot.runStream',
        'CloudSpanner.Database.runStream',
        'CloudSpanner.Database.run',
      ];
      assert.deepStrictEqual(
        actualSpanNames,
        expectedSpanNames,
        `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
      );

      const expectedEventNames = [
        'Requesting 25 sessions',
        'Creating 25 sessions',
        'Requested for 25 sessions returned 25',
        'Starting stream',
        'Acquiring session',
        'Waiting for a session to become available',
        'Acquired session',
        'Using Session',
      ];
      assert.deepStrictEqual(
        actualEventNames,
        expectedEventNames,
        `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
      );
    });
  });
});

describe('E2E traces with async/await', async () => {
  let server: grpc.Server;
  let spanner: Spanner;
  let database: Database;
  let spannerMock: mock.MockSpanner;
  let traceExporter: typeof InMemorySpanExporter;
  let provider: typeof TracerProvider;
  let observabilityOptions: typeof ObservabilityOptions;

  beforeEach(async () => {
    traceExporter = new InMemorySpanExporter();
    provider = new NodeTracerProvider({
      sampler: new AlwaysOnSampler(),
      exporter: traceExporter,
    });
    provider.addSpanProcessor(new SimpleSpanProcessor(traceExporter));

    observabilityOptions = {
      tracerProvider: provider,
      enableExtendedTracing: true,
    };
    const setupResult = await setup(observabilityOptions);
    spanner = setupResult.spanner;
    server = setupResult.server;
    spannerMock = setupResult.spannerMock;
  });

  afterEach(async () => {
    traceExporter.reset();
    provider.shutdown();
    spannerMock.resetRequests();
    spanner.close();
    server.tryShutdown(() => {});
  });

  function assertAsyncAwaitExpectations() {
    // See https://github.com/googleapis/nodejs-spanner/issues/2146.
    traceExporter.forceFlush();
    const spans = traceExporter.getFinishedSpans();

    const actualSpanNames: string[] = [];
    const actualEventNames: string[] = [];
    spans.forEach(span => {
      actualSpanNames.push(span.name);
      span.events.forEach(event => {
        actualEventNames.push(event.name);
      });
    });

    const expectedSpanNames = [
      'CloudSpanner.Database.batchCreateSessions',
      'CloudSpanner.SessionPool.createSessions',
      'CloudSpanner.Snapshot.runStream',
      'CloudSpanner.Database.runStream',
      'CloudSpanner.Database.run',
    ];
    assert.deepStrictEqual(
      actualSpanNames,
      expectedSpanNames,
      `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
    );

    // We need to ensure a strict relationship between the spans.
    // runSpan -------------------|
    //     |-runStream ----------|
    const runStreamSpan = spans[spans.length - 2];
    const runSpan = spans[spans.length - 1];
    assert.ok(
      runSpan.spanContext().traceId,
      'Expected that runSpan has a defined traceId'
    );
    assert.ok(
      runStreamSpan.spanContext().traceId,
      'Expected that runStreamSpan has a defined traceId'
    );
    assert.deepStrictEqual(
      runStreamSpan.parentSpanId,
      runSpan.spanContext().spanId,
      `Expected that runSpan(spanId=${runSpan.spanContext().spanId}) is the parent to runStreamSpan(parentSpanId=${runStreamSpan.parentSpanId})`
    );
    assert.deepStrictEqual(
      runSpan.spanContext().traceId,
      runStreamSpan.spanContext().traceId,
      'Expected that both spans share a traceId'
    );
    assert.ok(
      runStreamSpan.spanContext().spanId,
      'Expected that runStreamSpan has a defined spanId'
    );
    assert.ok(
      runSpan.spanContext().spanId,
      'Expected that runSpan has a defined spanId'
    );

    const databaseBatchCreateSessionsSpan = spans[0];
    assert.strictEqual(
      databaseBatchCreateSessionsSpan.name,
      'CloudSpanner.Database.batchCreateSessions'
    );
    const sessionPoolCreateSessionsSpan = spans[1];
    assert.strictEqual(
      sessionPoolCreateSessionsSpan.name,
      'CloudSpanner.SessionPool.createSessions'
    );
    assert.ok(
      sessionPoolCreateSessionsSpan.spanContext().traceId,
      'Expecting a defined sessionPoolCreateSessions traceId'
    );
    assert.deepStrictEqual(
      sessionPoolCreateSessionsSpan.spanContext().traceId,
      databaseBatchCreateSessionsSpan.spanContext().traceId,
      'Expected the same traceId'
    );
    assert.deepStrictEqual(
      databaseBatchCreateSessionsSpan.parentSpanId,
      sessionPoolCreateSessionsSpan.spanContext().spanId,
      'Expected that sessionPool.createSessions is the parent to db.batchCreassionSessions'
    );

    // Assert that despite all being exported, SessionPool.createSessions
    // is not in the same trace as runStream, createSessions is invoked at
    // Spanner Client instantiation, thus before database.run is invoked.
    assert.notEqual(
      sessionPoolCreateSessionsSpan.spanContext().traceId,
      runSpan.spanContext().traceId,
      'Did not expect the same traceId'
    );

    // Finally check for the collective expected event names.
    const expectedEventNames = [
      'Requesting 25 sessions',
      'Creating 25 sessions',
      'Requested for 25 sessions returned 25',
      'Starting stream',
      'Acquiring session',
      'Waiting for a session to become available',
      'Acquired session',
      'Using Session',
    ];
    assert.deepStrictEqual(
      actualEventNames,
      expectedEventNames,
      `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
    );
  }

  it('async/await correctly parents trace spans', async () => {
    // See https://github.com/googleapis/nodejs-spanner/issues/2146.
    async function main() {
      const instance = spanner.instance('testing');
      const database = instance.database('db-1');

      const query = {
        sql: selectSql,
      };

      const [rows] = await database.run(query);

      rows.forEach(row => {
        const json = row.toJSON();
      });

      provider.forceFlush();
    }

    await main();
    assertAsyncAwaitExpectations();
  });

  it('callback correctly parents trace spans', done => {
    function main(onComplete) {
      const instance = spanner.instance('testing');
      const database = instance.database('db-1');

      const query = {
        sql: selectSql,
      };

      database.run(query, (err, rows) => {
        rows.forEach(row => {
          const json = row.toJSON();
        });

        provider.forceFlush();
        onComplete();
      });
    }

    main(() => {
      assertAsyncAwaitExpectations();
      done();
    });
  });
});

describe('Negative cases', async () => {
  let server: grpc.Server;
  let spanner: Spanner;
  let database: Database;
  let spannerMock: mock.MockSpanner;
  let traceExporter: typeof InMemorySpanExporter;
  let provider: typeof TracerProvider;
  let observabilityOptions: typeof ObservabilityOptions;

  const selectSql1p = 'SELECT 1p';
  const messageBadSelect1p = `Missing whitespace between literal and alias [at 1:9]
SELECT 1p
        ^`;
  const insertAlreadyExistentDataSql =
    "INSERT INTO Singers(firstName, SingerId) VALUES('Foo', 1)";
  const messageBadInsertAlreadyExistent =
    'Failed to insert row with primary key ({pk#SingerId:1}) due to previously existing row';

  beforeEach(async () => {
    traceExporter = new InMemorySpanExporter();
    provider = new NodeTracerProvider({
      sampler: new AlwaysOnSampler(),
      exporter: traceExporter,
    });
    provider.addSpanProcessor(new SimpleSpanProcessor(traceExporter));

    observabilityOptions = {
      tracerProvider: provider,
      enableExtendedTracing: true,
    };
    const setupResult = await setup(observabilityOptions);
    spanner = setupResult.spanner;
    server = setupResult.server;
    spannerMock = setupResult.spannerMock;

    const serverErr = {
      message: messageBadSelect1p,
      code: grpc.status.INVALID_ARGUMENT,
    } as mock.MockError;
    spannerMock.putStatementResult(
      selectSql1p,
      mock.StatementResult.error(serverErr)
    );

    const insertAlreadyExistentErr = {
      message: messageBadInsertAlreadyExistent,
      code: grpc.status.ALREADY_EXISTS,
    } as mock.MockError;
    spannerMock.putStatementResult(
      insertAlreadyExistentDataSql,
      mock.StatementResult.error(insertAlreadyExistentErr)
    );
  });

  afterEach(async () => {
    traceExporter.reset();
    provider.shutdown();
    spannerMock.resetRequests();
    spanner.close();
    server.tryShutdown(() => {});
  });

  function assertRunBadSyntaxExpectations() {
    traceExporter.forceFlush();
    const spans = traceExporter.getFinishedSpans();
    spans.sort((spanA, spanB) => {
      return spanA.startTime < spanB.startTime;
    });

    const actualSpanNames: string[] = [];
    const actualEventNames: string[] = [];
    spans.forEach(span => {
      actualSpanNames.push(span.name);
      span.events.forEach(event => {
        actualEventNames.push(event.name);
      });
    });

    const expectedSpanNames = [
      'CloudSpanner.Database.batchCreateSessions',
      'CloudSpanner.SessionPool.createSessions',
      'CloudSpanner.Snapshot.runStream',
      'CloudSpanner.Database.runStream',
      'CloudSpanner.Database.run',
    ];
    assert.deepStrictEqual(
      actualSpanNames,
      expectedSpanNames,
      `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
    );

    // We need to ensure a strict relationship between the spans.
    // runSpan -------------------|
    //     |-runStream ----------|
    const runStreamSpan = spans[spans.length - 2];
    const runSpan = spans[spans.length - 1];
    assert.ok(
      runSpan.spanContext().traceId,
      'Expected that runSpan has a defined traceId'
    );
    assert.ok(
      runStreamSpan.spanContext().traceId,
      'Expected that runStreamSpan has a defined traceId'
    );
    assert.deepStrictEqual(
      runStreamSpan.parentSpanId,
      runSpan.spanContext().spanId,
      `Expected that runSpan(spanId=${runSpan.spanContext().spanId}) is the parent to runStreamSpan(parentSpanId=${runStreamSpan.parentSpanId})`
    );
    assert.deepStrictEqual(
      runSpan.spanContext().traceId,
      runStreamSpan.spanContext().traceId,
      'Expected that both spans share a traceId'
    );
    assert.ok(
      runStreamSpan.spanContext().spanId,
      'Expected that runStreamSpan has a defined spanId'
    );
    assert.ok(
      runSpan.spanContext().spanId,
      'Expected that runSpan has a defined spanId'
    );

    const databaseBatchCreateSessionsSpan = spans[0];
    assert.strictEqual(
      databaseBatchCreateSessionsSpan.name,
      'CloudSpanner.Database.batchCreateSessions'
    );
    const sessionPoolCreateSessionsSpan = spans[1];
    assert.strictEqual(
      sessionPoolCreateSessionsSpan.name,
      'CloudSpanner.SessionPool.createSessions'
    );
    assert.ok(
      sessionPoolCreateSessionsSpan.spanContext().traceId,
      'Expecting a defined sessionPoolCreateSessions traceId'
    );
    assert.deepStrictEqual(
      sessionPoolCreateSessionsSpan.spanContext().traceId,
      databaseBatchCreateSessionsSpan.spanContext().traceId,
      'Expected the same traceId'
    );
    assert.deepStrictEqual(
      databaseBatchCreateSessionsSpan.parentSpanId,
      sessionPoolCreateSessionsSpan.spanContext().spanId,
      'Expected that sessionPool.createSessions is the parent to db.batchCreassionSessions'
    );

    // Assert that despite all being exported, SessionPool.createSessions
    // is not in the same trace as runStream, createSessions is invoked at
    // Spanner Client instantiation, thus before database.run is invoked.
    assert.notEqual(
      sessionPoolCreateSessionsSpan.spanContext().traceId,
      runSpan.spanContext().traceId,
      'Did not expect the same traceId'
    );

    // Ensure that the last span has an error.
    assert.deepStrictEqual(
      runStreamSpan.status.code,
      SpanStatusCode.ERROR,
      'Expected an error status'
    );

    const want = '3 INVALID_ARGUMENT: ' + messageBadSelect1p;
    assert.deepStrictEqual(
      runStreamSpan.status.message,
      want,
      `Mismatched status message:\n\n\tGot:  '${runStreamSpan.status.message}'\n\tWant: '${want}'`
    );

    // Finally check for the collective expected event names.
    const expectedEventNames = [
      'Requesting 25 sessions',
      'Creating 25 sessions',
      'Requested for 25 sessions returned 25',
      'Starting stream',
      'Acquiring session',
      'Waiting for a session to become available',
      'Acquired session',
      'Using Session',
    ];
    assert.deepStrictEqual(
      actualEventNames,
      expectedEventNames,
      `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
    );
  }

  it('database.run with bad syntax: async/await', async () => {
    const instance = spanner.instance('instance');
    const database = instance.database('database');

    try {
      const [rows] = await database.run(selectSql1p);
    } catch (e) {
      // This catch is meant to ensure that we
      // can assert on the generated spans.
    } finally {
      provider.forceFlush();
    }

    assertRunBadSyntaxExpectations();
  });

  it('database.run with bad syntax: callback', done => {
    const instance = spanner.instance('instance');
    const database = instance.database('database');

    database.run(selectSql1p, (err, rows) => {
      assert.ok(err);
      provider.forceFlush();
      assertRunBadSyntaxExpectations();
      done();
    });
  });

  function assertDatabaseRunPlusAwaitTransactionForAlreadyExistentData() {
    traceExporter.forceFlush();
    const spans = traceExporter.getFinishedSpans();
    spans.sort((spanA, spanB) => {
      return spanA.startTime < spanB.startTime;
    });

    const actualSpanNames: string[] = [];
    const actualEventNames: string[] = [];
    spans.forEach(span => {
      actualSpanNames.push(span.name);
      span.events.forEach(event => {
        actualEventNames.push(event.name);
      });
    });

    const expectedSpanNames = [
      'CloudSpanner.Database.batchCreateSessions',
      'CloudSpanner.SessionPool.createSessions',
      'CloudSpanner.Snapshot.runStream',
      'CloudSpanner.Snapshot.run',
      'CloudSpanner.Snapshot.begin',
      'CloudSpanner.Snapshot.begin',
      'CloudSpanner.Transaction.commit',
      'CloudSpanner.Transaction.commit',
      'CloudSpanner.Database.runTransactionAsync',
    ];
    assert.deepStrictEqual(
      actualSpanNames,
      expectedSpanNames,
      `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
    );
    const spanSnapshotRun = spans[3];
    assert.strictEqual(spanSnapshotRun.name, 'CloudSpanner.Snapshot.run');
    const wantSpanErr = '6 ALREADY_EXISTS: ' + messageBadInsertAlreadyExistent;
    assert.deepStrictEqual(
      spanSnapshotRun.status.code,
      SpanStatusCode.ERROR,
      'Unexpected status code'
    );
    assert.deepStrictEqual(
      spanSnapshotRun.status.message,
      wantSpanErr,
      'Unexpexcted error message'
    );

    const databaseBatchCreateSessionsSpan = spans[0];
    assert.strictEqual(
      databaseBatchCreateSessionsSpan.name,
      'CloudSpanner.Database.batchCreateSessions'
    );
    const sessionPoolCreateSessionsSpan = spans[1];
    assert.strictEqual(
      sessionPoolCreateSessionsSpan.name,
      'CloudSpanner.SessionPool.createSessions'
    );
    assert.ok(
      sessionPoolCreateSessionsSpan.spanContext().traceId,
      'Expecting a defined sessionPoolCreateSessions traceId'
    );
    assert.deepStrictEqual(
      sessionPoolCreateSessionsSpan.spanContext().traceId,
      databaseBatchCreateSessionsSpan.spanContext().traceId,
      'Expected the same traceId'
    );
    assert.deepStrictEqual(
      databaseBatchCreateSessionsSpan.parentSpanId,
      sessionPoolCreateSessionsSpan.spanContext().spanId,
      'Expected that sessionPool.createSessions is the parent to db.batchCreassionSessions'
    );

    // We need to ensure a strict relationship between the spans.
    // |-Database.runTransactionAsync |-------------------------------------|
    //   |-Snapshot.run                |------------------------|
    //      |-Snapshot.runStream           |---------------------|
    //   |-Transaction.commit                                 |--------|
    //      |-Snapshot.begin                                   |------|
    //       |-Snapshot.commit                                  |-----|
    const spanDatabaseRunTransactionAsync = spans[spans.length - 1];
    assert.deepStrictEqual(
      spanDatabaseRunTransactionAsync.name,
      'CloudSpanner.Database.runTransactionAsync',
      `${actualSpanNames}`
    );
    const spanTransactionCommit0 = spans[spans.length - 2];
    assert.strictEqual(
      spanTransactionCommit0.name,
      'CloudSpanner.Transaction.commit'
    );
    assert.deepStrictEqual(
      spanTransactionCommit0.parentSpanId,
      spanDatabaseRunTransactionAsync.spanContext().spanId,
      'Expected that Database.runTransaction is the parent to Transaction.commmit'
    );

    assert.deepStrictEqual(
      spanSnapshotRun.parentSpanId,
      spanDatabaseRunTransactionAsync.spanContext().spanId,
      'Expected that Database.runTransaction is the parent to Snapshot.run'
    );

    // Assert that despite all being exported, SessionPool.createSessions
    // is not in the same trace as runStream, createSessions is invoked at
    // Spanner Client instantiation, thus before database.run is invoked.
    assert.notEqual(
      sessionPoolCreateSessionsSpan.spanContext().traceId,
      spanDatabaseRunTransactionAsync.spanContext().traceId,
      'Did not expect the same traceId'
    );

    // Finally check for the collective expected event names.
    const expectedEventNames = [
      'Requesting 25 sessions',
      'Creating 25 sessions',
      'Requested for 25 sessions returned 25',
      'Starting stream',
      'Stream broken. Safe to retry',
      'Begin Transaction',
      'Transaction Creation Done',
      'Begin Transaction',
      'Transaction Creation Done',
      'Starting Commit',
      'Commit Done',
      'Acquiring session',
      'Waiting for a session to become available',
      'Acquired session',
      'Using Session',
      'exception',
    ];
    assert.deepStrictEqual(
      actualEventNames,
      expectedEventNames,
      `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
    );
  }

  it('database.runTransaction with async/await for INSERT with existent data + transaction.commit', async () => {
    const instance = spanner.instance('instance');
    const database = instance.database('database');

    const update = {
      sql: insertAlreadyExistentDataSql,
    };

    try {
      await database.runTransactionAsync(async transaction => {
        try {
          await transaction!.run(update);
        } finally {
          await transaction!.commit();
        }
      });
    } catch (e) {
      assert.strictEqual(
        (e as grpc.ServiceError).code,
        grpc.status.ALREADY_EXISTS
      );
    }

    provider.forceFlush();
    assertDatabaseRunPlusAwaitTransactionForAlreadyExistentData();
  });
});

describe('Traces for ExecuteStream broken stream retries', () => {
  let sandbox: sinon.SinonSandbox;
  const selectSql = 'SELECT NUM, NAME FROM NUMBERS';
  const select1 = 'SELECT 1';
  const invalidSql = 'SELECT * FROM FOO';
  const insertSql = "INSERT INTO NUMBER (NUM, NAME) VALUES (4, 'Four')";
  const selectAllTypes = 'SELECT * FROM TABLE_WITH_ALL_TYPES';
  const insertSqlForAllTypes = `INSERT INTO TABLE_WITH_ALL_TYPES(
        COLBOOL, COLINT64, COLFLOAT64, COLNUMERIC, COLSTRING, COLBYTES, COLJSON, COLDATE, COLTIMESTAMP
  ) VALUES (
        @bool, @int64, @float64, @numeric, @string, @bytes, @json, @date, @timestamp
  )`;
  const updateSql = "UPDATE NUMBER SET NAME='Unknown' WHERE NUM IN (5, 6)";
  const fooNotFoundErr = Object.assign(new Error('Table FOO not found'), {
    code: grpc.status.NOT_FOUND,
  });
  const server = new grpc.Server();
  const spannerMock = mock.createMockSpanner(server);
  mockInstanceAdmin.createMockInstanceAdmin(server);
  mockDatabaseAdmin.createMockDatabaseAdmin(server);
  let port: number;
  let spanner: Spanner;
  let instance: Instance;
  let dbCounter = 1;

  const traceExporter = new InMemorySpanExporter();
  const tracerProvider = new NodeTracerProvider({
    sampler: new AlwaysOnSampler(),
    exporter: traceExporter,
  });
  tracerProvider.addSpanProcessor(new SimpleSpanProcessor(traceExporter));

  function newTestDatabase(): Database {
    return instance.database(`database-${dbCounter++}`);
  }

  before(async () => {
    sandbox = sinon.createSandbox();
    port = await new Promise((resolve, reject) => {
      server.bindAsync(
        '0.0.0.0:0',
        grpc.ServerCredentials.createInsecure(),
        (err, assignedPort) => {
          if (err) {
            reject(err);
          } else {
            resolve(assignedPort);
          }
        }
      );
    });
    spannerMock.putStatementResult(
      selectSql,
      mock.StatementResult.resultSet(mock.createSimpleResultSet())
    );
    spannerMock.putStatementResult(
      select1,
      mock.StatementResult.resultSet(mock.createSelect1ResultSet())
    );
    spannerMock.putStatementResult(
      selectAllTypes,
      mock.StatementResult.resultSet(mock.createResultSetWithAllDataTypes())
    );
    spannerMock.putStatementResult(
      invalidSql,
      mock.StatementResult.error(fooNotFoundErr)
    );
    spannerMock.putStatementResult(
      insertSql,
      mock.StatementResult.updateCount(1)
    );
    spannerMock.putStatementResult(
      insertSqlForAllTypes,
      mock.StatementResult.updateCount(1)
    );
    spannerMock.putStatementResult(
      updateSql,
      mock.StatementResult.updateCount(2)
    );

    const observabilityOptions: typeof ObservabilityOptions = {
      tracerProvider: tracerProvider,
      enableExtendedTracing: true,
    };

    spanner = new Spanner({
      servicePath: 'localhost',
      port,
      sslCreds: grpc.credentials.createInsecure(),
      observabilityOptions: observabilityOptions,
    });
    // Gets a reference to a Cloud Spanner instance and database
    instance = spanner.instance('instance');
  });

  after(() => {
    spanner.close();
    server.tryShutdown(() => {});
    sandbox.restore();
  });

  beforeEach(async () => {
    spannerMock.resetRequests();
    spannerMock.removeExecutionTimes();
    await tracerProvider.forceFlush();
    await traceExporter.forceFlush();
    await traceExporter.reset();
  });

  describe('PartialResultStream', () => {
    const streamIndexes = [1, 2];
    streamIndexes.forEach(index => {
      it('should retry UNAVAILABLE during streaming', async () => {
        const database = newTestDatabase();
        const err = {
          message: 'Temporary unavailable',
          code: grpc.status.UNAVAILABLE,
          streamIndex: index,
        } as mock.MockError;
        spannerMock.setExecutionTime(
          spannerMock.executeStreamingSql,
          mock.SimulatedExecutionTime.ofError(err)
        );
        const [rows] = await database.run(selectSql);
        assert.strictEqual(rows.length, 3);
        await database.close();
      });

      it('should retry UNAVAILABLE during streaming with txn ID from inline begin response', async () => {
        const err = {
          message: 'Temporary unavailable',
          code: grpc.status.UNAVAILABLE,
          streamIndex: index,
        } as mock.MockError;
        spannerMock.setExecutionTime(
          spannerMock.executeStreamingSql,
          mock.SimulatedExecutionTime.ofError(err)
        );
        const database = newTestDatabase();

        await database.runTransactionAsync(async tx => {
          await tx.run(selectSql);
          await tx.commit();
        });
        await database.close();

        const requests = spannerMock
          .getRequests()
          .filter(val => (val as v1.ExecuteSqlRequest).sql)
          .map(req => req as v1.ExecuteSqlRequest);
        assert.strictEqual(requests.length, 2);
        assert.ok(
          requests[0].transaction?.begin!.readWrite,
          'inline txn is not set.'
        );
        assert.ok(
          requests[1].transaction!.id,
          'Transaction ID is not used for retries.'
        );
        assert.ok(
          requests[1].resumeToken,
          'Resume token is not set for the retried'
        );
      });

      it('should retry UNAVAILABLE during streaming with txn ID from inline begin response with parallel queries', async () => {
        const err = {
          message: 'Temporary unavailable',
          code: grpc.status.UNAVAILABLE,
          streamIndex: index,
        } as mock.MockError;
        spannerMock.setExecutionTime(
          spannerMock.executeStreamingSql,
          mock.SimulatedExecutionTime.ofError(err)
        );
        const database = newTestDatabase();

        await database.runTransactionAsync(async tx => {
          const [rows1, rows2] = await Promise.all([
            tx!.run(selectSql),
            tx!.run(selectSql),
          ]);
          assert.equal(rows1.length, 3);
          assert.equal(rows2.length, 3);
          await tx.commit();
        });
        await database.close();

        const requests = spannerMock
          .getRequests()
          .filter(val => (val as v1.ExecuteSqlRequest).sql)
          .map(req => req as v1.ExecuteSqlRequest);
        assert.strictEqual(requests.length, 3);
        assert.ok(
          requests[0].transaction?.begin!.readWrite,
          'inline txn is not set.'
        );
        assert.ok(
          requests[1].transaction!.id,
          'Transaction ID is not used for retries.'
        );
        assert.ok(
          requests[1].resumeToken,
          'Resume token is not set for the retried'
        );
        const commitRequests = spannerMock
          .getRequests()
          .filter(val => (val as v1.CommitRequest).mutations)
          .map(req => req as v1.CommitRequest);
        assert.strictEqual(commitRequests.length, 1);
        assert.deepStrictEqual(
          requests[1].transaction!.id,
          requests[2].transaction!.id
        );
        assert.deepStrictEqual(
          requests[1].transaction!.id,
          commitRequests[0].transactionId
        );
        const beginTxnRequests = spannerMock
          .getRequests()
          .filter(val => (val as v1.BeginTransactionRequest).options?.readWrite)
          .map(req => req as v1.BeginTransactionRequest);
        assert.deepStrictEqual(beginTxnRequests.length, 0);
      });

      it('should not retry non-retryable error during streaming', async () => {
        const database = newTestDatabase();
        const err = {
          message: 'Test error',
          streamIndex: index,
        } as mock.MockError;
        spannerMock.setExecutionTime(
          spannerMock.executeStreamingSql,
          mock.SimulatedExecutionTime.ofError(err)
        );
        try {
          await database.run(selectSql);
          assert.fail('missing expected error');
        } catch (e) {
          assert.strictEqual(
            (e as grpc.ServiceError).message,
            '2 UNKNOWN: Test error'
          );
        }
        await database.close();
      });

      it('should retry UNAVAILABLE during streaming with a callback', done => {
        const database = newTestDatabase();
        const err = {
          message: 'Temporary unavailable',
          code: grpc.status.UNAVAILABLE,
          streamIndex: index,
        } as mock.MockError;
        spannerMock.setExecutionTime(
          spannerMock.executeStreamingSql,
          mock.SimulatedExecutionTime.ofError(err)
        );
        database.run(selectSql, (err, rows) => {
          assert.ifError(err);
          assert.strictEqual(rows!.length, 3);
          database
            .close()
            .catch(done)
            .then(() => done());
        });
      });

      it('should not retry non-retryable error during streaming with a callback', done => {
        const database = newTestDatabase();
        const err = {
          message: 'Non-retryable error',
          streamIndex: index,
        } as mock.MockError;
        spannerMock.setExecutionTime(
          spannerMock.executeStreamingSql,
          mock.SimulatedExecutionTime.ofError(err)
        );
        database.run(selectSql, err => {
          assert.ok(err, 'Missing expected error');
          assert.strictEqual(err!.message, '2 UNKNOWN: Non-retryable error');
          database
            .close()
            .catch(done)
            .then(() => done());
        });
      });

      it('should emit non-retryable error during streaming to stream', done => {
        const database = newTestDatabase();

        const err = {
          message: 'Non-retryable error',
          streamIndex: index,
        } as mock.MockError;
        spannerMock.setExecutionTime(
          spannerMock.executeStreamingSql,
          mock.SimulatedExecutionTime.ofError(err)
        );
        const receivedRows: Row[] = [];
        database
          .runStream(selectSql)
          // We will receive data for the partial result sets that are
          // returned before the error occurs.
          .on('data', row => {
            receivedRows.push(row);
          })
          .on('end', () => {
            assert.fail('Missing expected error');
          })
          .on('error', err => {
            assert.strictEqual(err.message, '2 UNKNOWN: Non-retryable error');
            database
              .close()
              .catch(done)
              .then(() => {
                traceExporter.forceFlush();
                const spans = traceExporter.getFinishedSpans();
                spans.sort((spanA, spanB) => {
                  return spanA.startTime < spanB.startTime;
                });

                const actualSpanNames: string[] = [];
                const actualEventNames: string[] = [];
                spans.forEach(span => {
                  actualSpanNames.push(span.name);
                  span.events.forEach(event => {
                    actualEventNames.push(event.name);
                  });
                });

                const expectedSpanNames = [
                  'CloudSpanner.Database.batchCreateSessions',
                  'CloudSpanner.SessionPool.createSessions',
                  'CloudSpanner.Snapshot.runStream',
                  'CloudSpanner.Database.runStream',
                ];
                assert.deepStrictEqual(
                  actualSpanNames,
                  expectedSpanNames,
                  `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
                );

                // Finally check for the collective expected event names.
                const expectedEventNames = [
                  'Requesting 25 sessions',
                  'Creating 25 sessions',
                  'Requested for 25 sessions returned 25',
                  'Starting stream',
                  'Acquiring session',
                  'Waiting for a session to become available',
                  'Acquired session',
                  'Using Session',
                  'Transaction Creation Done',
                ];
                assert.deepStrictEqual(
                  actualEventNames,
                  expectedEventNames,
                  `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
                );

                done();
              });
          });
      });
    });
  });

  it('should retry UNAVAILABLE from executeStreamingSql with multiple errors during streaming', async () => {
    const database = newTestDatabase();
    const errors: mock.MockError[] = [];
    for (const index of [0, 1, 1, 2, 2]) {
      errors.push({
        message: 'Temporary unavailable',
        code: grpc.status.UNAVAILABLE,
        streamIndex: index,
      } as mock.MockError);
    }
    spannerMock.setExecutionTime(
      spannerMock.executeStreamingSql,
      mock.SimulatedExecutionTime.ofErrors(errors)
    );
    const [rows] = await database.run(selectSql);
    assert.strictEqual(rows.length, 3);
    await database.close();

    traceExporter.forceFlush();
    const spans = traceExporter.getFinishedSpans();
    spans.sort((spanA, spanB) => {
      return spanA.startTime < spanB.startTime;
    });

    const actualSpanNames: string[] = [];
    const actualEventNames: string[] = [];
    spans.forEach(span => {
      actualSpanNames.push(span.name);
      span.events.forEach(event => {
        actualEventNames.push(event.name);
      });
    });

    const expectedSpanNames = [
      'CloudSpanner.Database.batchCreateSessions',
      'CloudSpanner.SessionPool.createSessions',
      'CloudSpanner.Snapshot.runStream',
      'CloudSpanner.Database.runStream',
      'CloudSpanner.Database.run',
    ];
    assert.deepStrictEqual(
      actualSpanNames,
      expectedSpanNames,
      `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
    );

    // Finally check for the collective expected event names.
    const expectedEventNames = [
      'Requesting 25 sessions',
      'Creating 25 sessions',
      'Requested for 25 sessions returned 25',
      'Starting stream',
      'Re-attempting start stream',
      'Resuming stream',
      'Resuming stream',
      'Resuming stream',
      'Resuming stream',
      'Acquiring session',
      'Waiting for a session to become available',
      'Acquired session',
      'Using Session',
    ];
    assert.deepStrictEqual(
      actualEventNames,
      expectedEventNames,
      `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
    );
  });

  it('should retry UNAVAILABLE on update', async () => {
    const database = newTestDatabase();
    const err = {
      message: 'Temporary unavailable',
      code: grpc.status.UNAVAILABLE,
    } as mock.MockError;
    spannerMock.setExecutionTime(
      spannerMock.executeStreamingSql,
      mock.SimulatedExecutionTime.ofError(err)
    );

    await database.runTransactionAsync(async tx => {
      const [updateCount] = await tx!.runUpdate(insertSql);
      assert.strictEqual(updateCount, 1);
      await tx!.commit();
    });
    await database.close();

    // The span for a successful invocation of database.runTransaction
    // can only be ended after the calling function is completed.
    traceExporter.forceFlush();
    const spans = traceExporter.getFinishedSpans();
    const actualSpanNames: string[] = [];
    const actualEventNames: string[] = [];
    spans.forEach(span => {
      actualSpanNames.push(span.name);
      span.events.forEach(event => {
        actualEventNames.push(event.name);
      });
    });

    const expectedSpanNames = [
      'CloudSpanner.Database.batchCreateSessions',
      'CloudSpanner.SessionPool.createSessions',
      'CloudSpanner.Snapshot.runStream',
      'CloudSpanner.Snapshot.run',
      'CloudSpanner.Dml.runUpdate',
      'CloudSpanner.Snapshot.begin',
      'CloudSpanner.Transaction.commit',
      'CloudSpanner.Transaction.commit',
      'CloudSpanner.Database.runTransactionAsync',
    ];
    assert.deepStrictEqual(
      actualSpanNames,
      expectedSpanNames,
      `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
    );

    // Finally check for the collective expected event names.
    const expectedEventNames = [
      'Requesting 25 sessions',
      'Creating 25 sessions',
      'Requested for 25 sessions returned 25',
      'Starting stream',
      'Re-attempting start stream',
      'Begin Transaction',
      'Transaction Creation Done',
      'Starting Commit',
      'Commit Done',
      'Acquiring session',
      'Waiting for a session to become available',
      'Acquired session',
      'Using Session',
    ];
    assert.deepStrictEqual(
      actualEventNames,
      expectedEventNames,
      `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
    );
  });

  it('should not retry non-retryable error on update', async () => {
    const database = newTestDatabase();
    const err = {
      message: 'Permanent error',
      // We need to specify a non-retryable error code to prevent the entire
      // transaction to retry. Not specifying an error code, will result in
      // an error with code UNKNOWN, which again will retry the transaction.
      code: grpc.status.INVALID_ARGUMENT,
    } as mock.MockError;
    spannerMock.setExecutionTime(
      spannerMock.executeStreamingSql,
      mock.SimulatedExecutionTime.ofError(err)
    );
    let attempts = 0;

    await database.runTransactionAsync(async tx => {
      attempts++;
      await tx!.runUpdate(insertSql, err => {
        assert.ok(err, 'Missing expected error');
        assert.strictEqual(err!.code, grpc.status.INVALID_ARGUMENT);
        assert.strictEqual(attempts, 1);
        tx!
          .commit()
          .then(() => {
            database.close().catch(assert.ifError);
          })
          .catch(assert.ifError);
      });
    });
    assert.deepStrictEqual(
      attempts,
      1,
      'runTransactionAsync.attempt must be 1'
    );

    traceExporter.forceFlush();
    const spans = traceExporter.getFinishedSpans();

    const actualSpanNames: string[] = [];
    const actualEventNames: string[] = [];
    spans.forEach(span => {
      actualSpanNames.push(span.name);
      span.events.forEach(event => {
        actualEventNames.push(event.name);
      });
    });

    const expectedSpanNames = [
      'CloudSpanner.Database.batchCreateSessions',
      'CloudSpanner.SessionPool.createSessions',
      'CloudSpanner.Database.runTransactionAsync',
    ];
    assert.deepStrictEqual(
      actualSpanNames,
      expectedSpanNames,
      `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
    );

    const expectedEventNames = [
      'Requesting 25 sessions',
      'Creating 25 sessions',
      'Requested for 25 sessions returned 25',
      'Acquiring session',
      'Waiting for a session to become available',
      'Acquired session',
      'Using Session',
    ];
    assert.deepStrictEqual(
      actualEventNames,
      expectedEventNames,
      `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
    );
  });
});
