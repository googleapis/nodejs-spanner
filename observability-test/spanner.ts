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
import * as mock from '../test/mockserver/mockspanner';
import * as mockInstanceAdmin from '../test/mockserver/mockinstanceadmin';
import * as mockDatabaseAdmin from '../test/mockserver/mockdatabaseadmin';
const {
  AlwaysOnSampler,
  NodeTracerProvider,
  InMemorySpanExporter,
} = require('@opentelemetry/sdk-trace-node');
// eslint-disable-next-line n/no-extraneous-require
const {SimpleSpanProcessor} = require('@opentelemetry/sdk-trace-base');
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

describe('EndToEnd', () => {
  let server: grpc.Server;
  let spanner: Spanner;
  let database: Database;
  let spannerMock: mock.MockSpanner;
  let traceExporter: typeof InMemorySpanExporter;

  const contextManager = new AsyncHooksContextManager();
  setGlobalContextManager(contextManager);

  afterEach(() => {
    disableContextAndManager(contextManager);
  });

  beforeEach(async () => {
    traceExporter = new InMemorySpanExporter();
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

    spanner = setupResult.spanner;
    server = setupResult.server;
    spannerMock = setupResult.spannerMock;

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
    traceExporter.reset();
    spannerMock.resetRequests();
    spanner.close();
    server.tryShutdown(() => {});
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

        transaction!.run('SELECT 1', (err, rows) => {
          assert.ifError(err);

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
      database.getTransaction((err, transaction) => {
        assert.ifError(err);
        assert.ok(transaction);

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
        .on('error', assert.ifError)
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
      database.runTransaction((err, transaction) => {
        assert.ifError(err);
        transaction!.run('SELECT 1', (err, rows) => {
          assert.ifError(err);

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
            'CloudSpanner.Database.runTransaction',
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

        tx!.run('SELECT 1', (err, rows) => {
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
        tx!.runUpdate(updateSql, (err, rowCount) => {
          assert.ifError(err);

          traceExporter.forceFlush();

          const spans = traceExporter.getFinishedSpans();
          withAllSpansHaveDBName(spans);
          assert.strictEqual(spans.length, 4);

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
          .on('end', () => {
            tx!.end();

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
          tx!.rollback(err => {
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
