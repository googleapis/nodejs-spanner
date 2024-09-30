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

// sample-metadata:
//   title: Observability (Tracing) with OpenTelemetry
//   usage: node observability.js trace <INSTANCE> <DATABASE> <PROJECT-ID>

'use strict';

// Setup OpenTelemetry and the trace exporter.
// [START spanner_trace_and_export_spans]
const {Resource} = require('@opentelemetry/resources');
const {NodeSDK} = require('@opentelemetry/sdk-node');
const {
  NodeTracerProvider,
  TraceIdRatioBasedSampler,
  // eslint-disable-next-line n/no-extraneous-require
} = require('@opentelemetry/sdk-trace-node');
// eslint-disable-next-line n/no-extraneous-require
const {BatchSpanProcessor} = require('@opentelemetry/sdk-trace-base');
const {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  // eslint-disable-next-line n/no-extraneous-require
} = require('@opentelemetry/semantic-conventions');

const resource = Resource.default().merge(
  new Resource({
    [SEMRESATTRS_SERVICE_NAME]: 'spanner-sample',
    [SEMRESATTRS_SERVICE_VERSION]: 'v1.0.0', // The version of your app running.,
  })
);

/*
 * Uncomment these lines to debug OpenTelemetry.
const {diag, DiagConsoleLogger, DiagLogLevel} = require('@opentelemetry/api');
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);
*/

// Create the Google Cloud Trace exporter for OpenTelemetry.
const {
  TraceExporter,
} = require('@google-cloud/opentelemetry-cloud-trace-exporter');
const exporter = new TraceExporter();

// Optionally, you can enable gRPC instrumentation, by removing this guard.
if (process.env.SPANNER_ENABLE_GRPC_INSTRUMENTATION === 'true') {
  // eslint-disable-next-line n/no-extraneous-require
  const {registerInstrumentations} = require('@opentelemetry/instrumentation');
  const {GrpcInstrumentation} = require('@opentelemetry/instrumentation-grpc');
  registerInstrumentations({
    instrumentations: [new GrpcInstrumentation()],
  });
}

function traceAndExportSpans(instanceId, databaseId, projectId) {
  // Wire up the OpenTelemetry SDK instance with the exporter and sampler.
  const sdk = new NodeSDK({
    resource: resource,
    traceExporter: exporter,
    // Trace every single request to ensure that we generate
    // enough traffic for proper examination of traces.
    sampler: new TraceIdRatioBasedSampler(1.0),
  });
  sdk.start();

  // Create the tracerProvider that the exporter shall be attached to.
  const provider = new NodeTracerProvider({resource: resource});
  provider.addSpanProcessor(new BatchSpanProcessor(exporter));

  // Uncomment this line to make this a global tracerProvider instead of
  // passing it into SpannerOptions.observabilityConfig.
  // provider.register();

  // Acquire the tracer.
  const tracer = provider.getTracer('MyApp');

  // Start our user defined trace.
  tracer.startActiveSpan('SpannerTracingQuickstart', async span => {
    // Create the Cloud Spanner Client.
    const {Spanner} = require('@google-cloud/spanner');
    const spanner = new Spanner({
      projectId: projectId,
      observabilityOptions: {
        // Optional, but you could rather register the global tracerProvider.
        tracerProvider: provider,
        // This option can also be enabled by setting the environment
        // variable `SPANNER_ENABLE_EXTENDED_TRACING=true`.
        enableExtendedTracing: true,
      },
    });

    // Acquire the database handle.
    const instance = spanner.instance(instanceId);
    const database = instance.database(databaseId);

    try {
      const query = {
        sql: 'SELECT 1',
      };
      const [rows] = await database.run(query);

      for (const row of rows) {
        console.log(`Result: ${row.toString()}`);
      }
    } catch (err) {
      console.error('ERROR:', err);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      span.end();
      spanner.close();
      console.log('main span.end');
    }

    // This sleep gives ample time for the trace
    // spans to be exported to Google Cloud Trace.
    await new Promise(resolve => {
      setTimeout(() => {
        console.log('Finished running the code');
        resolve();
      }, 8800);
    });
  });

  // [END spanner_trace_and_export_spans]
}

require('yargs')
  .demand(1)
  .command(
    'trace <instanceName> <databaseName> <projectId>',
    'Run an end-to-end traced sample.',
    {},
    opts =>
      traceAndExportSpans(opts.instanceName, opts.databaseName, opts.projectId)
  )
  .example('node $0 trace "my-instance" "my-database" "my-project-id"')
  .wrap(120)
  .recommendCommands()
  .epilogue('For more information, see https://cloud.google.com/spanner/docs')
  .strict()
  .help().argv;
