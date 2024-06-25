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

const projectId = process.env.SPANNER_TEST_PROJECTID || 'test-project';

describe('gRPC instrumentation with sampling on', () => {
  const assert = require('assert');
  const {registerInstrumentations} = require('@opentelemetry/instrumentation');
  const {SimpleSpanProcessor} = require('@opentelemetry/sdk-trace-base');
  const {
    AlwaysOnSampler,
    InMemorySpanExporter,
    NodeTracerProvider,
  } = require('@opentelemetry/sdk-trace-node');
  const {
    AsyncHooksContextManager,
  } = require('@opentelemetry/context-async-hooks');
  const {GrpcInstrumentation} = require('@opentelemetry/instrumentation-grpc');
  const fini = registerInstrumentations({
    instrumentations: [new GrpcInstrumentation()],
  });
  const {startTrace} = require('../src/instrument');
  const {
    disableContextAndManager,
    setGlobalContextManager,
  } = require('./helper');
  const {ContextManager} = require('@opentelemetry/api');

  const {SEMATTRS_DB_SYSTEM} = require('@opentelemetry/semantic-conventions');

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

    contextManager = new AsyncHooksContextManager();
    setGlobalContextManager(contextManager);

    spanner = new Spanner({
      projectId: projectId,
    });

    const instance = spanner.instance('test-instance');
    database = instance.database('test-db');

    // Warm up session creation.
    await database.run('SELECT 2');
    // Mimick usual customer usage in which at setup time, the
    // Spanner and Database handles are created once then sit
    // and wait until they service HTTP or gRPC calls that
    // come in say 5+ seconds after the service is fully started.
    // This gives time for the batch session creation to be be completed.
    await new Promise((resolve, reject) => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    spanner.close();
    exporter.forceFlush();
    exporter.reset();
    await provider.shutdown();
    disableContextAndManager(contextManager);
  });

  after(() => {
    fini();
  });

  it('Invoking database methods creates spans: gRPC enabled', () => {
    const tracer = provider.getTracer();

    tracer.startActiveSpan('test', async span => {
      const query = {sql: 'SELECT * FROM INFORMATION_SCHEMA.TABLES'};
      const [rows] = await database.run(query);
      assert.ok(rows.length > 1);

      // Read from the rows until completion.
      for (const row of rows) {
        const _ = row.toJSON();
      }

      span.end();

      await new Promise((resolve, reject) => setTimeout(resolve, 600));
      await exporter.forceFlush();

      // We need to ensure that spans were generated and exported.
      const spans = exporter.getFinishedSpans();
      assert.ok(spans.length > 0, 'at least 1 span must have been created');

      // Sort the spans by duration, in the natural
      // trace view order by longer duration first.
      spans.sort((spanA, spanB) => {
        return spanA.duration > spanB.duration;
      });

      const got: string[] = [];
      spans.forEach(span => {
        got.push(span.name);
      });

      const want = [
        'cloud.google.com/nodejs/spanner/Database.run',
        'cloud.google.com/nodejs/spanner/Database.runStream',
        'grpc.google.spanner.v1.Spanner/ExecuteStreamingSql',
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
        if (span.name.startsWith('cloud.google.com')) {
          assert.equal(
            span.attributes[SEMATTRS_DB_SYSTEM],
            'spanner',
            'Invalid DB_SYSTEM attribute'
          );
        }
      });
    });
  });
});
