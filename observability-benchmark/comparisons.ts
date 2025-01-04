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
import {
  Database as DatabaseUntraced,
  Instance as InstanceUntraced,
  Spanner as SpannerUntraced,
} from '@google-cloud/spanner';
import protobuf = google.spanner.v1;
import * as mock from '../test/mockserver/mockspanner';
import * as mockInstanceAdmin from '../test/mockserver/mockinstanceadmin';
import * as mockDatabaseAdmin from '../test/mockserver/mockdatabaseadmin';
const {
  AlwaysOnSampler,
  NodeTracerProvider,
  InMemorySpanExporter,
} = require('@opentelemetry/sdk-trace-node');
const {SimpleSpanProcessor} = require('@opentelemetry/sdk-trace-base');
import {humanizeBytes, humanizeTime, runBenchmarks} from './benchmark';
const {diag, DiagConsoleLogger, DiagLogLevel} = require('@opentelemetry/api');
// diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const {
  getTracer,
  startTrace,
  traceConfig,
  ObservabilityOptions,
} = require('../src/instrument');

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
  spanner: Spanner | SpannerUntraced;
  spannerMock: mock.MockSpanner;
}

async function setup(
  traced: boolean,
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

  let spanner: Spanner | SpannerUntraced;

  if (traced) {
    spanner = new Spanner({
      projectId: 'observability-project-id',
      servicePath: 'localhost',
      port,
      sslCreds: grpc.credentials.createInsecure(),
      observabilityOptions: observabilityOptions,
    });
  } else {
    spanner = new SpannerUntraced({
      projectId: 'observability-project-id',
      servicePath: 'localhost',
      port,
      sslCreds: grpc.credentials.createInsecure(),
    });
  }

  return Promise.resolve({
    spanner: spanner,
    server: server,
    spannerMock: spannerMock,
  });
}

interface percentiles {
  p50: number;
  p50_s: string;
}

interface description {
  ram: percentiles;
  timeSpent: percentiles;
}

describe('Benchmarking Database', () => {
  if (!process.env.SPANNER_RUN_BENCHMARKS) {
    console.log(
      'Skipping micro-benchmarking because SPANNER_RUN_BENCHMARKS is not set'
    );
    return;
  }

  async function setItUp(
    traced: boolean,
    withExporters?: boolean
  ): Promise<Map<string, unknown>> {
    // Setup firstly.
    let observabilityOptions: typeof ObservabilityOptions = null;
    if (withExporters) {
      const traceExporter = new InMemorySpanExporter();
      const sampler = new AlwaysOnSampler();
      const provider = new NodeTracerProvider({
        sampler: sampler,
        exporter: traceExporter,
      });
      provider.addSpanProcessor(new SimpleSpanProcessor(traceExporter));

      observabilityOptions = {
        tracerProvider: provider,
        enableExtendedTracing: true,
      } as typeof ObservabilityOptions;
    }

    const setupResult = await setup(traced, observabilityOptions);
    const spanner = setupResult.spanner;
    const instance = spanner.instance('instance');
    const database = instance.database('database');
    const server = setupResult.server;

    after(async () => {
      if (observabilityOptions) {
        await observabilityOptions.tracerProvider!.shutdown();
      }
      database.close();
      spanner.close();
      server.tryShutdown(() => {});
    });

    const runners: Function[] = [
      async function databaseRunSelect1AsyncAwait() {
        if (traced) {
          const [rows] = await (database as Database).run('SELECT 1');
          for (const row of rows) {
            var _ = row;
          }
          return rows;
        } else {
          const [rows] = await (database as DatabaseUntraced).run('SELECT 1');
          for (const row of rows) {
            var _ = row;
          }
          return rows;
        }
      },

      async function databaseRunSelect1Callback() {
        return new Promise((resolve, reject) => {
          const callback = (err, rows) => {
            if (err) {
              reject(err);
              return;
            }

            for (const row of rows) {
              const _ = row;
            }
            resolve(rows);
          };

          if (traced) {
            (database as Database).run('SELECT 1', callback);
          } else {
            (database as DatabaseUntraced).run('SELECT 1', callback);
          }
        });
      },

      async function databaseRunTransactionAsyncTxRunUpdate() {
        const withTx = async tx => {
          await tx!.begin();
          const result = await tx!.runUpdate(updateSql);
          tx!.end();
          return result;
        };

        try {
          if (traced) {
            return await (database as Database).runTransactionAsync(withTx);
          } else {
            return await (database as DatabaseUntraced).runTransactionAsync(
              withTx
            );
          }
        } catch (e) {
          return null;
        }
      },

      async function databaseRunTransactionAsyncTxRun() {
        const withTx = async tx => {
          await tx!.begin();
          const result = await tx!.runUpdate('SELECT 1');
          tx!.end();
          return result;
        };

        try {
          if (traced) {
            return await (database as Database).runTransactionAsync(withTx);
          } else {
            return await (database as DatabaseUntraced).runTransactionAsync(
              withTx
            );
          }
        } catch (e) {
          return null;
        }
      },
    ];

    return new Promise(resolve => {
      runBenchmarks(runners, results => {
        resolve(results);
      });
    });
  }

  it('Database runs compared', async () => {
    const traced = await setItUp(true);
    const untraced = await setItUp(false);
    const tracedWithOTELOn = await setItUp(true, true);

    console.log(
      `Total Runs:   ${traced['_totalRuns']}\nWarm up runs: ${traced['_warmRuns']}`
    );
    for (const tracedM in traced) {
      const tracedV = traced[tracedM];
      if (typeof tracedV !== 'object') {
        continue;
      }
      const tracedMethod = tracedM as string;
      const tracedValue = tracedV as description;
      const untracedValue = untraced[tracedMethod] as description;
      const tracedWithOTELValue = tracedWithOTELOn[tracedMethod] as description;
      const tracedRAM = tracedValue!.ram;
      const tracedWithOTELRAM = tracedWithOTELValue!.ram;
      const untracedRAM = untracedValue!.ram;
      console.log(`${tracedMethod}`);
      console.log(
        `\tRAM Untraced(${untracedRAM.p50_s}) vs Traced     (${tracedRAM.p50_s}): increase by (${humanizeBytes(tracedRAM.p50 - untracedRAM.p50)}) or ${percentDiff(untracedRAM.p50, tracedRAM.p50).toFixed(2)}%`
      );
      console.log(
        `\tRAM Untraced(${untracedRAM.p50_s}) vs Traced+OTEL(${tracedWithOTELRAM.p50_s}): increase by (${humanizeBytes(tracedWithOTELRAM.p50 - untracedRAM.p50)}) or ${percentDiff(untracedRAM.p50, tracedWithOTELRAM.p50).toFixed(2)}%`
      );
      const tracedTime = tracedValue.timeSpent;
      const tracedWithOTELTime = tracedWithOTELValue.timeSpent;
      const untracedTime = untracedValue.timeSpent;
      console.log(
        `\tTime Untraced(${untracedTime.p50_s}) vs Traced     (${tracedTime.p50_s}):  increase by (${humanizeTime(tracedTime.p50 - untracedTime.p50)}) or ${percentDiff(untracedTime.p50, tracedTime.p50).toFixed(2)}%`
      );
      console.log(
        `\tTime Untraced(${untracedTime.p50_s}) vs Traced+OTEL(${tracedWithOTELTime.p50_s}):  increase by (${humanizeTime(tracedWithOTELTime.p50 - untracedTime.p50)}) or ${percentDiff(untracedTime.p50, tracedWithOTELTime.p50).toFixed(2)}%\n`
      );
    }
  });
});

function percentDiff(orig, fresh) {
  return ((Number(fresh) - Number(orig)) * 100.0) / Number(orig);
}

describe('Benchmark getTracer', () => {
  it('No tracerProvider/global tracerProvider', async () => {
    console.log('tracerProvider');
    const results = await benchmarkStartTrace();

    console.log(
      `Total Runs:   ${results['_totalRuns']}\nWarm up runs: ${results['_warmRuns']}`
    );

    for (const method in results) {
      const values = results[method];
      if (typeof values !== 'object') {
        continue;
      }
      const desc = values as description;
      const ram = desc.ram;
      const timeSpent = desc!.timeSpent;
      console.log(`${method}`);
      console.log(`\tRAM (${ram.p50_s})`);
      console.log(`\tTimeSpent (${timeSpent.p50_s})`);
    }
  });
});

function benchmarkGetTracer(): Promise<Map<string, unknown>> {
  const customTracerProvider = new NodeTracerProvider();
  let trapDoorCalled = false;

  const runners: Function[] = [
    function getTracerNullTracerProviderUnsetGlobalTracerProvider() {
      return getTracer(null);
    },

    function getTracerDefinedTracerProvider() {
      return getTracer(customTracerProvider);
    },

    function getTracerRegisteredGlobally() {
      if (!trapDoorCalled) {
        customTracerProvider.register();
        trapDoorCalled = true;
      }
      return getTracer(null);
    },
  ];

  return new Promise(resolve => {
    runBenchmarks(runners, results => {
      resolve(results);
    });
  });
}

function benchmarkStartSpan(): Promise<Map<string, unknown>> {
  const customTracerProvider = new NodeTracerProvider();
  let trapDoorCalled = false;

  const runners: Function[] = [
    function withNullTracerProviderUnsetGlobalTracerProvider() {
      return new Promise(resolve => {
        getTracer(null).startActiveSpan('aSpan', {}, span => {
          resolve(span);
        });
      });
    },

    function withTracerDefinedTracerProvider() {
      return new Promise(resolve => {
        getTracer(customTracerProvider).startActiveSpan('aSpan', {}, span => {
          resolve(span);
        });
      });
    },

    function getTracerRegisteredGlobally() {
      if (!trapDoorCalled) {
        customTracerProvider.register();
        trapDoorCalled = true;
      }
      return new Promise(resolve => {
        getTracer(null).startActiveSpan('aSpan', {}, span => {
          resolve(span);
        });
      });
    },
  ];

  return new Promise(resolve => {
    runBenchmarks(runners, results => {
      resolve(results);
    });
  });
}

function benchmarkStartTrace(): Promise<Map<string, unknown>> {
  const customTracerProvider = new NodeTracerProvider();
  let trapDoorCalled = false;

  const runners: Function[] = [
    async function withNullTracerProviderUnsetGlobalTracerProvider() {
      const promise = new Promise((resolve, reject) => {
        const opts: typeof traceConfig = {
          opts: {tracerProvider: null},
        };
        startTrace('aspan', null, span => {
          span.end();
          resolve(span);
        });
      });
      return promise;
    },

    function withTracerDefinedTracerProvider() {
      return new Promise(resolve => {
        const opts: typeof traceConfig = {
          opts: {tracerProvider: customTracerProvider},
        };
        startTrace('aspan', opts, span => {
          span.end();
          resolve(span);
        });
      });
    },

    function withTracerRegisteredGlobally() {
      if (!trapDoorCalled) {
        customTracerProvider.register();
        trapDoorCalled = true;
      }
      return new Promise(resolve => {
        const opts: typeof traceConfig = {
          opts: {tracerProvider: null},
        };
        startTrace('aspan', opts, span => {
          span.end();
          resolve(span);
        });
      });
    },
  ];

  return new Promise(resolve => {
    runBenchmarks(runners, results => {
      resolve(results);
    });
  });
}
