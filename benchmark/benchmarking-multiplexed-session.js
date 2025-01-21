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

const thread_execution_times = [];
const transaction_times = [];
async function main(
  instanceId,
  databaseId,
  projectId,
  method,
  multiplexedEnabled,
  numThreads,
  numQueries
) {
  multiplexedEnabled === 'true'
    ? (process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS = true)
    : (process.env.GOOGLE_CLOUD_SPANNER_MULTIPLEXED_SESSIONS = false);

  const {Spanner} = require('../build/src');
  const {performance} = require('perf_hooks');
  const spanner = new Spanner({
    projectId: projectId,
    apiEndpoint: 'staging-wrenchworks.sandbox.googleapis.com',
    observabilityOptions: {
      tracerProvider: provider,
      enableExtendedTracing: true,
      enableEndToEndTracing: true,
    },
  });

  // Gets a reference to a Cloud Spanner instance and database
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId, {min: 1, max: 5});

  function generateQuery() {
    const id = Math.floor(Math.random() * 10) + 1;
    const query = {
      sql: 'SELECT SingerId from Singers WHERE SingerId = @id',
      params: {id: id},
    };
    return query;
  }
  // warm up query
  for (let i = 0; i < 10; i++) {
    await database.run(generateQuery());
  }

  async function singleUseTxn() {
    const startThreadTime = performance.now();

    for (let i = 0; i < numQueries; i++) {
      const startTime = performance.now();
      await database.run(generateQuery());
      const operationTime = performance.now() - startTime;
      transaction_times.push(operationTime);
    }

    thread_execution_times.push(
      (performance.now() - startThreadTime).toFixed(2)
    );
  }

  async function multiUseTxn() {
    const startThreadTime = performance.now();

    for (let i = 0; i < numQueries; i++) {
      const startTime = performance.now();
      const [txn] = await database.getSnapshot();
      await txn.run(generateQuery());
      await txn.run(generateQuery());
      await txn.run(generateQuery());
      await txn.run(generateQuery());
      txn.end();
      const operationTime = (performance.now() - startTime).toFixed(2);
      transaction_times.push(operationTime);
    }

    thread_execution_times.push(
      (performance.now() - startThreadTime).toFixed(2)
    );
  }

  function calculatePercentiles(latencies) {
    // Step 1: Sort the array
    const sortedLatencies = latencies.slice().sort((a, b) => a - b);

    // Step 2: Calculate average
    const sum = sortedLatencies.reduce((acc, num) => acc + parseFloat(num), 0);
    const average = (sum / sortedLatencies.length).toFixed(2);

    // Step 3: Calculate p50 (50th percentile)
    const p50Index = Math.floor(0.5 * sortedLatencies.length);
    const p50Latency = parseFloat(sortedLatencies[p50Index]).toFixed(2);

    // Step 4: Calculate p90 (90th percentile)
    const p90Index = Math.floor(0.9 * sortedLatencies.length);
    const p90Latency = parseFloat(sortedLatencies[p90Index]).toFixed(2);

    // Step 5: Calculate p99 (99th percentile)
    const p99Index = Math.floor(0.99 * sortedLatencies.length);
    const p99Latency = parseFloat(sortedLatencies[p99Index]).toFixed(2);

    return {
      avg: average,
      p50: p50Latency,
      p90: p90Latency,
      p99: p99Latency,
    };
  }

  async function runConcurrently() {
    const promises = [];
    for (let i = 0; i < numThreads; i++) {
      method === 'singleUseTxn'
        ? promises.push(singleUseTxn())
        : promises.push(multiUseTxn());
    }
    await Promise.all(promises);
    console.log('excution time taken by threads are: ');
    thread_execution_times.forEach(executionTime => {
      console.log(executionTime);
    });
  }

  try {
    await runConcurrently();
    const percentiles = calculatePercentiles(transaction_times);
    console.log(`average Latency: ${percentiles.avg}`);
    console.log(`p50 Latency: ${percentiles.p50}`);
    console.log(`p90 Latency: ${percentiles.p90}`);
    console.log(`p99 Latency: ${percentiles.p99}`);
  } catch (error) {
    console.log('error: ', error);
  }

  provider.forceFlush();

  // This sleep gives ample time for the trace
  // spans to be exported to Google Cloud Trace.
  await new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, 8800);
  });

  // await runConcurrently()
  //   .then(() => {
  //     const percentiles = calculatePercentiles(transaction_times);
  //     console.log(`average Latency: ${percentiles.avg}`);
  //     console.log(`p50 Latency: ${percentiles.p50}`);
  //     console.log(`p90 Latency: ${percentiles.p90}`);
  //     console.log(`p99 Latency: ${percentiles.p99}`);
  //   })
  //   .catch(error => {
  //     console.log('error: ', error);
  //   });
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
