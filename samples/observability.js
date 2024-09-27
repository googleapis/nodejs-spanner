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
} = require('@opentelemetry/sdk-trace-node');
const {
  BatchSpanProcessor,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} = require('@opentelemetry/sdk-trace-base');
const {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
} = require('@opentelemetry/semantic-conventions');

const resource = Resource.default().merge(
  new Resource({
    [SEMRESATTRS_SERVICE_NAME]: 'spanner-sample',
    [SEMRESATTRS_SERVICE_VERSION]: 'v1.0.0', // The version of your app running.,
  })
);

// Create the Google Cloud Trace exporter for OpenTelemetry.
const {
  TraceExporter,
} = require('@google-cloud/opentelemetry-cloud-trace-exporter');
const exporter = new TraceExporter();

// Optionally, you can enable gRPC instrumentation.
if (process.env.ENABLE_GRPC_TRACING === 'true') {
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

  // This makes a global tracerProvider but you could optionally
  // instead pass in the provider while creating the Spanner client.
  provider.register();

  // Acquire the tracer.
  const tracer = provider.getTracer('MyApp');

  // Start our user defined trace.
  tracer.startActiveSpan('deleteAndCreateDatabase', async span => {
    // Create the Cloud Spanner Client.
    const {Spanner} = require('@google-cloud/spanner');
    const spanner = new Spanner({
      projectId: projectId,
      observabilityConfig: {
        // Optional, can rather register the global tracerProvider
        tracerProvider: provider,
        enableExtendedTracing: true, // Optional but can also use SPANNER_EXTENDED_TRACING=true
      },
    });

    // Acquire the database and databaseAdminClient handles.
    const instance = spanner.instance(instanceId);
    const database = instance.database(databaseId);
    const databaseAdminClient = spanner.getDatabaseAdminClient();

    const databasePath = databaseAdminClient.databasePath(
      projectId,
      instanceId,
      databaseId
    );

    // Mimicking how in real world code, there will be a pause after
    // application startup, as the service waits to serve traffic.
    await new Promise((resolve, reject) => setTimeout(resolve, 5000));

    /*
     * This code path exercises deleting then creating a Cloud Spanner database,
     * inserting data into the database and then reading from it.
     */
    deleteDatabase(databaseAdminClient, databasePath, () => {
      createDatabase(
        databaseAdminClient,
        projectId,
        instanceId,
        databaseId,
        () => {
          insertUsingDml(tracer, database, async () => {
            try {
              const query = {
                sql: 'SELECT SingerId, FirstName, LastName FROM Singers',
              };
              const [rows] = await database.run(query);

              for (const row of rows) {
                const json = row.toJSON();

                console.log(
                  `SingerId: ${json.SingerId}, FirstName: ${json.FirstName}, LastName: ${json.LastName}`
                );
              }
            } catch (err) {
              console.error('ERROR:', err);
              await new Promise((resolve, reject) => setTimeout(resolve, 2000));
            } finally {
              span.end();
              spanner.close();
              console.log('main span.end');
            }

            // This sleep gives ample time for the trace
            // spans to be exported to Google Cloud Trace.
            await new Promise((resolve, reject) => {
              setTimeout(() => {
                console.log('finished delete and creation of the database');
              }, 8800);
            });
          });
        }
      );
    });
  });

  // [END spanner_trace_and_export_spans]
}

/*
 * insertUsingDml exercises the path of inserting
 * data into the Cloud Spanner database.
 */
function insertUsingDml(tracer, database, callback) {
  tracer.startActiveSpan('insertUsingDML', span => {
    database.runTransaction(async (err, transaction) => {
      if (err) {
        span.end();
        console.error(err);
        return;
      }

      try {
        const [delCount] = await transaction.runUpdate({
          sql: 'DELETE FROM Singers WHERE 1=1',
        });

        console.log(`Deletion count ${delCount}`);

        const [rowCount] = await transaction.runUpdate({
          sql: 'INSERT Singers (SingerId, FirstName, LastName) VALUES (10, @firstName, @lastName)',
          params: {
            firstName: 'Virginia',
            lastName: 'Watson',
          },
        });

        console.log(
          `Successfully inserted ${rowCount} record into the Singers table.`
        );

        await transaction.commit();
      } catch (err) {
        console.error('ERROR:', err);
      } finally {
        // Close the database when finished.
        console.log('exiting insertUsingDml');
        tracer.startActiveSpan('timingOutToExport-insertUsingDML', eSpan => {
          setTimeout(() => {
            if (callback) {
              callback();
            }
            eSpan.end();
            span.end();
          }, 500);
        });
      }
    });
  });
}

function createDatabase(
  databaseAdminClient,
  projectId,
  instanceId,
  databaseId,
  callback
) {
  async function doCreateDatabase() {
    if (databaseId) {
      callback();
      return;
    }

    // Create the database with default tables.
    const createSingersTableStatement = `
      CREATE TABLE Singers (
        SingerId   INT64 NOT NULL,
        FirstName  STRING(1024),
        LastName   STRING(1024),
        SingerInfo BYTES(MAX)
      ) PRIMARY KEY (SingerId)`;

    const [operation] = await databaseAdminClient.createDatabase({
      createStatement: 'CREATE DATABASE `' + databaseId + '`',
      extraStatements: [createSingersTableStatement],
      parent: databaseAdminClient.instancePath(projectId, instanceId),
    });

    console.log(`Waiting for creation of ${databaseId} to complete...`);
    await operation.promise();
    console.log(`Created database ${databaseId}`);
    callback();
  }
  doCreateDatabase();
}

function deleteDatabase(databaseAdminClient, databasePath, callback) {
  async function doDropDatabase() {
    if (databasePath) {
      callback();
      return;
    }

    const [operation] = await databaseAdminClient.dropDatabase({
      database: databasePath,
    });

    await operation;
    console.log('Finished dropping the database');
    callback();
  }

  doDropDatabase();
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
