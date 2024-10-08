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
//   usage: node observability-traces.js <PROJECT-ID> <INSTANCE-ID> <DATABASE-ID>

'use strict';

// Setup OpenTelemetry and the trace exporter.
// [START spanner_trace_and_export_spans]
const {Resource} = require('@opentelemetry/resources');
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

function main(
  projectId = 'my-project-id',
  instanceId = 'my-instance-id',
  databaseId = 'my-project-id'
) {
  // Create the OpenTelemetry tracerProvider that the exporter shall be attached to.
  const provider = new NodeTracerProvider({
    // Trace every single request to ensure that we generate
    // enough traffic for proper examination of traces.
    sampler: new TraceIdRatioBasedSampler(1.0),
    resource: resource,
  });
  provider.addSpanProcessor(new BatchSpanProcessor(exporter));

  // Uncomment this to make it a global tracerProvider instead
  // of passing it into SpannerOptions.observabilityOptions.
  // provider.register();

  // Acquire the tracer.
  const tracer = provider.getTracer('MyApp');

  // Start our user defined trace.
  tracer.startActiveSpan('SpannerTracingQuickstart', async span => {
    // Create the Cloud Spanner Client.
    const {Spanner} = require('@google-cloud/spanner');

    /**
     * TODO(developer): Uncomment these variables before running the sample.
     */
    // const projectId = 'my-project-id';
    // const instanceId = 'my-instance-id';
    // const databaseId = 'my-database-id';

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
      rows.forEach(row => console.log(row));
    } finally {
      spanner.close();
      span.end();
    }

    provider.forceFlush();

    // This sleep gives ample time for the trace
    // spans to be exported to Google Cloud Trace.
    await new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, 8800);
    });
  });

  // [END spanner_trace_and_export_spans]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
