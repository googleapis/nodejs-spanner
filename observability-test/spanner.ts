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
import {Database, Spanner} from '../src';
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
const {disableContextAndManager, setGlobalContextManager} = require('./helper');
const {
  AsyncHooksContextManager,
} = require('@opentelemetry/context-async-hooks');

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

async function setup(): Promise<setupResults> {
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

  const selectSql = 'SELECT 1';
  const updateSql = 'UPDATE FOO SET BAR=1 WHERE BAZ=2';
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
  });

  return Promise.resolve({
    spanner: spanner,
    server: server,
    spannerMock: spannerMock,
  });
}

describe('EndToEnd', () => {
  describe('Database', () => {
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
      const setupResult = await setup();
      spanner = setupResult.spanner;
      server = setupResult.server;
      spannerMock = setupResult.spannerMock;

      const selectSql = 'SELECT 1';
      const updateSql = 'UPDATE FOO SET BAR=1 WHERE BAZ=2';
      spannerMock.putStatementResult(
        selectSql,
        mock.StatementResult.resultSet(createSelect1ResultSet())
      );
      spannerMock.putStatementResult(
        updateSql,
        mock.StatementResult.updateCount(1)
      );

      traceExporter = new InMemorySpanExporter();
      const sampler = new AlwaysOnSampler();

      const provider = new NodeTracerProvider({
        sampler: sampler,
        exporter: traceExporter,
      });
      provider.addSpanProcessor(new SimpleSpanProcessor(traceExporter));

      const instance = spanner.instance('instance');
      database = instance.database('database');
      database.observabilityConfig = {
        tracerProvider: provider,
        enableExtendedTracing: false,
      };
    });

    afterEach(() => {
      traceExporter.reset();
      spannerMock.resetRequests();
      spanner.close();
      server.tryShutdown(() => {});
    });

    it('getSessions', async () => {
      const [rows] = await database.getSessions();

      traceExporter.forceFlush();
      const spans = traceExporter.getFinishedSpans();
      assert.strictEqual(spans.length, 1, 'Exactly 1 span expected');

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
      database.getSnapshot((err, transaction) => {
        assert.ifError(err);

        transaction!.run('SELECT 1', (err, rows) => {
          assert.ifError(err);

          traceExporter.forceFlush();
          const spans = traceExporter.getFinishedSpans();
          assert.strictEqual(spans.length, 1, 'Exactly 1 span expected');

          const actualSpanNames: string[] = [];
          const actualEventNames: string[] = [];
          spans.forEach(span => {
            actualSpanNames.push(span.name);
            span.events.forEach(event => {
              actualEventNames.push(event.name);
            });
          });

          const expectedSpanNames = ['CloudSpanner.Database.getSnapshot'];
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

    it('getTransaction', done => {
      database.getTransaction((err, transaction) => {
        assert.ifError(err);
        assert.ok(transaction);

        traceExporter.forceFlush();
        const spans = traceExporter.getFinishedSpans();
        assert.strictEqual(spans.length, 1, 'Exactly 1 span expected');

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

        const expectedEventNames = ['Using Session'];
        assert.deepStrictEqual(
          actualEventNames,
          expectedEventNames,
          `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
        );

        done();
      });
    });

    it('runStream', done => {
      database
        .runStream('SELECT 1')
        .on('data', row => {})
        .on('error', assert.ifError)
        .on('end', () => {
          traceExporter.forceFlush();
          const spans = traceExporter.getFinishedSpans();
          assert.strictEqual(spans.length, 1, 'Exactly 1 span expected');

          const actualSpanNames: string[] = [];
          const actualEventNames: string[] = [];
          spans.forEach(span => {
            actualSpanNames.push(span.name);
            span.events.forEach(event => {
              actualEventNames.push(event.name);
            });
          });

          const expectedSpanNames = ['CloudSpanner.Database.runStream'];
          assert.deepStrictEqual(
            actualSpanNames,
            expectedSpanNames,
            `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
          );

          const expectedEventNames = ['Using Session'];
          assert.deepStrictEqual(
            actualEventNames,
            expectedEventNames,
            `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
          );

          done();
        });
    });

    it('run', async () => {
      const [rows] = await database.run('SELECT 1');

      traceExporter.forceFlush();
      const spans = traceExporter.getFinishedSpans();
      assert.strictEqual(spans.length, 2, 'Exactly 2 spans expected');

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

      const expectedEventNames = ['Using Session'];
      assert.deepStrictEqual(
        actualEventNames,
        expectedEventNames,
        `Unexpected events:\n\tGot:  ${actualEventNames}\n\tWant: ${expectedEventNames}`
      );
    });

    it('runTransaction', done => {
      database.runTransaction((err, transaction) => {
        assert.ifError(err);
        transaction!.run('SELECT 1', (err, rows) => {
          assert.ifError(err);

          traceExporter.forceFlush();
          const spans = traceExporter.getFinishedSpans();
          assert.strictEqual(spans.length, 1, 'Exactly 1 span expected');

          const actualEventNames: string[] = [];
          const actualSpanNames: string[] = [];
          spans.forEach(span => {
            actualSpanNames.push(span.name);
            span.events.forEach(event => {
              actualEventNames.push(event.name);
            });
          });

          const expectedSpanNames = ['CloudSpanner.Database.runTransaction'];
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

    it('writeAtLeastOnce', done => {
      const blankMutations = new MutationSet();
      database.writeAtLeastOnce(blankMutations, (err, response) => {
        assert.ifError(err);
        assert.ok(response);

        traceExporter.forceFlush();
        const spans = traceExporter.getFinishedSpans();
        assert.strictEqual(spans.length, 1, 'Exactly 1 span expected');

        const actualEventNames: string[] = [];
        const actualSpanNames: string[] = [];
        spans.forEach(span => {
          actualSpanNames.push(span.name);
          span.events.forEach(event => {
            actualEventNames.push(event.name);
          });
        });

        const expectedSpanNames = ['CloudSpanner.Database.writeAtLeastOnce'];
        assert.deepStrictEqual(
          actualSpanNames,
          expectedSpanNames,
          `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
        );

        const expectedEventNames = ['Using Session'];
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