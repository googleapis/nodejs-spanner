/*!
 * Copyright 2025 Google LLC. All Rights Reserved.
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

// sample-metadata:
//   title: Observability (Tracing) with OpenTelemetry
//   usage: node observability-traces.js <PROJECT-ID> <INSTANCE-ID> <DATABASE-ID>

'use strict';

async function main(
  projectId = 'my-project-id',
  instanceId = 'my-instance-id',
  databaseId = 'my-project-id',
) {
  // [START spanner_opentelemetry_traces_cloudtrace_usage]

  const {NodeTracerProvider} = require('@opentelemetry/sdk-trace-node');
  const {NodeSDK} = require('@opentelemetry/sdk-node');
  // const {
  //   TraceExporter,
  // } = require('@google-cloud/opentelemetry-cloud-trace-exporter');
  const {
    ConsoleSpanExporter,
    BatchSpanProcessor,
    TraceIdRatioBasedSampler,
  } = require('@opentelemetry/sdk-trace-base');
  const {diag, DiagConsoleLogger, DiagLogLevel} = require('@opentelemetry/api');
  const {Spanner} = require('../build/src');
  const {
    getNodeAutoInstrumentations,
  } = require('@opentelemetry/auto-instrumentations-node');

  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel['ALL']);

  const traceExporter = new ConsoleSpanExporter();

  // Create a provider with a custom sampler
  // const provider = new NodeTracerProvider({
  //   sampler: new TraceIdRatioBasedSampler(1.0), // Sample 100% of traces
  //   spanProcessors: [new BatchSpanProcessor(traceExporter)],
  // });

  // Uncomment following line to register tracerProvider globally or pass it in Spanner object
  // provider.register();

  // Set global propagator to propogate the trace context for end to end tracing.
  // const {propagation} = require('@opentelemetry/api');
  const {
    W3CTraceContextPropagator,
    CompositePropagator,
  } = require('@opentelemetry/core');
  // propagation.setGlobalPropagator(new W3CTraceContextPropagator());

  const sdk = new NodeSDK({
    // resource: detectedResourceAttributes.merge(resource),
    traceExporter: traceExporter,
    batchSpanProcessor: [new BatchSpanProcessor(traceExporter)],
    sampler: new TraceIdRatioBasedSampler(1.0), // Sample 100% of traces
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable file system instrumentation to reduce noise
        '@opentelemetry/instrumentation-fs': {
          enabled: false,
        },
        '@opentelemetry/instrumentation-net': {
          enabled: false,
        },
        '@opentelemetry/instrumentation-dns': {
          enabled: false,
        },
      }),
    ],
    textMapPropagator: new CompositePropagator({
      propagators: [new W3CTraceContextPropagator()],
    }),
  });

  // Initialize the SDK
  sdk.start();
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch(error => console.log('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });

  const spanner = new Spanner({
    projectId: projectId,
    observabilityOptions: {
      // tracerProvider: provider,
      // Enable extended tracing to allow your SQL statements to be annotated.
      enableExtendedTracing: true,
      // Enable end to end tracing.
      enableEndToEndTracing: true,
    },
  });

  // [END spanner_opentelemetry_traces_cloudtrace_usage]

  // Acquire the database handle.
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);

  try {
    const query = {
      sql: 'SELECT 1',
    };
    const [rows] = await database.run(query);
    console.log(`Query: ${rows.length} found.`);
    rows.forEach(row => console.log(row));
  } finally {
    // spanner.close();
  }

  database.getSnapshot(async (err, transaction) => {
    if (err) {
      console.error(err);
      return;
    }
    const queryOne = 'SELECT SingerId, AlbumId, AlbumTitle FROM Albums';

    try {
      // Read #1, using SQL
      const [qOneRows] = await transaction.run(queryOne);

      qOneRows.forEach(row => {
        const json = row.toJSON();
        console.log(
          `SingerId: ${json.SingerId}, AlbumId: ${json.AlbumId}, AlbumTitle: ${json.AlbumTitle}`,
        );
      });

      const queryTwo = {
        columns: ['SingerId', 'AlbumId', 'AlbumTitle'],
      };

      // Read #2, using the `read` method. Even if changes occur
      // in-between the reads, the transaction ensures that both
      // return the same data.
      const [qTwoRows] = await transaction.read('Albums', queryTwo);

      qTwoRows.forEach(row => {
        const json = row.toJSON();
        console.log(
          `SingerId: ${json.SingerId}, AlbumId: ${json.AlbumId}, AlbumTitle: ${json.AlbumTitle}`,
        );
      });

      console.log('Successfully executed read-only transaction.');
    } catch (err) {
      console.error('ERROR:', err);
    } finally {
      transaction.end();
      // Close the database when finished.
      await database.close();
    }
  });

  provider.forceFlush();

  // This sleep gives ample time for the trace
  // spans to be exported to Google Cloud Trace.
  await new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, 8800);
  });
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
