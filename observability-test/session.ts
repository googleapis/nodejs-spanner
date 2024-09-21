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
import {Database, Session, Spanner} from '../src';
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

describe('Session', () => {
  let server: grpc.Server;
  let spanner: Spanner;
  let database: Database;
  let spannerMock: mock.MockSpanner;
  let traceExporter: typeof InMemorySpanExporter;

  after(() => {
    spanner.close();
    server.tryShutdown(() => {});
  });

  before(async () => {
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

  beforeEach(() => {
    spannerMock.resetRequests();
  });

  afterEach(() => {
    traceExporter.reset();
  });

  it('create with constructor', done => {
    const session = new Session(database);
    session.create(err => {
      traceExporter.forceFlush();
      const spans = traceExporter.getFinishedSpans();
      assert.strictEqual(spans.length, 1, 'Exactly 1 span expected');

      const actualSpanNames: string[] = [];
      spans.forEach(span => {
        actualSpanNames.push(span.name);
      });

      const expectedSpanNames = ['CloudSpanner.Session.create'];
      assert.deepStrictEqual(
        actualSpanNames,
        expectedSpanNames,
        `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
      );

      done();
    });
  });

  it('create with database.session()', done => {
    const session = database.session();
    session.create(err => {
      assert.ifError(err);
      traceExporter.forceFlush();
      const spans = traceExporter.getFinishedSpans();
      assert.strictEqual(spans.length, 1, 'Exactly 1 span expected');

      const actualSpanNames: string[] = [];
      spans.forEach(span => {
        actualSpanNames.push(span.name);
      });

      const expectedSpanNames = ['CloudSpanner.Session.create'];
      assert.deepStrictEqual(
        actualSpanNames,
        expectedSpanNames,
        `span names mismatch:\n\tGot:  ${actualSpanNames}\n\tWant: ${expectedSpanNames}`
      );

      done();
    });
  });

  it('getMetadata', done => {
    const session = database.session();
    session.create(err => {
      assert.ifError(err);
      traceExporter.forceFlush();
      traceExporter.reset();

      session.getMetadata((err, metadata) => {
        const spans = traceExporter.getFinishedSpans();
        assert.strictEqual(spans.length, 1, 'Exactly 1 span expected');
        const span = spans[0];

        const expectedSpanName = 'CloudSpanner.Session.getMetadata';
        assert.deepStrictEqual(
          span.name,
          expectedSpanName,
          `span names mismatch:\n\tGot:  ${span.name}\n\tWant: ${expectedSpanName}`
        );

        done();
      });
    });
  });

  it('keepAlive produces no spans', done => {
    // It is imperative that the .keepAlive() / ping method is not
    // traced, because that spams trace views/logs unecessarily.
    // Please see https://github.com/googleapis/google-cloud-go/issues/1691
    const session = database.session();
    session.create(err => {
      assert.ifError(err);
      traceExporter.forceFlush();
      traceExporter.reset();

      session.keepAlive(err => {
        traceExporter.forceFlush();
        const spans = traceExporter.getFinishedSpans();
        assert.strictEqual(spans.length, 0, 'No spans should be exported');
        done();
      });
    });
  });
});
