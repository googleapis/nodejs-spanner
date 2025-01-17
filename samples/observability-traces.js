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
const {
  NodeTracerProvider,
  TraceIdRatioBasedSampler,
} = require('@opentelemetry/sdk-trace-node');
const {BatchSpanProcessor} = require('@opentelemetry/sdk-trace-base');

// Create the Google Cloud Trace exporter for OpenTelemetry.
const {
  TraceExporter,
} = require('@google-cloud/opentelemetry-cloud-trace-exporter');
const exporter = new TraceExporter();

// Create the OpenTelemetry tracerProvider that the exporter shall be attached to.
const provider = new NodeTracerProvider({
  // Modify the following line to adjust the sampling rate.
  // It is currently set to 1.0, meaning all requests will be traced.
  sampler: new TraceIdRatioBasedSampler(1.0),
});
provider.addSpanProcessor(new BatchSpanProcessor(exporter));

// Set global propagator to propogate the trace context for end to end tracing.
const {propagation} = require('@opentelemetry/api');
const {W3CTraceContextPropagator} = require('@opentelemetry/core');
propagation.setGlobalPropagator(new W3CTraceContextPropagator());

// Uncomment following line to register global tracerProvider instead
// of passing it into SpannerOptions.observabilityOptions.
// provider.register();

// Set `enableGrpcInstrumentation` to `true` to enable gRPC instrumentation.
const enableGrpcInstrumentation = false;
if (enableGrpcInstrumentation) {
  const {registerInstrumentations} = require('@opentelemetry/instrumentation');
  const {GrpcInstrumentation} = require('@opentelemetry/instrumentation-grpc');
  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [new GrpcInstrumentation()],
  });
}

async function main(
  projectId = 'my-project-id',
  instanceId = 'my-instance-id',
  databaseId = 'my-project-id'
) {
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
      tracerProvider: provider,
      enableExtendedTracing: true,
      enableEndToEndTracing: true,
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
    console.log(`Query: ${rows.length} found.`);
    rows.forEach(row => console.log(row));
  } finally {
    spanner.close();
  }

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
