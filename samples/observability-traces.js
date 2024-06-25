// Copyright 2024 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

async function exportSpans(instanceId, databaseId, projectId) {
  // [START spanner_export_traces]
  // Imports the Google Cloud client library and OpenTelemetry libraries for exporting traces.
  const {Resource} = require('@opentelemetry/resources');
  const {NodeSDK} = require('@opentelemetry/sdk-node');
  const {trace} = require('@opentelemetry/api');
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
      [SEMRESATTRS_SERVICE_VERSION]: 'v1.0.0', // Whatever version of your app is running.,
    })
  );

  const options = {serviceName: 'nodejs-spanner'};
  const {
    TraceExporter,
  } = require('@google-cloud/opentelemetry-cloud-trace-exporter');
  const exporter = new TraceExporter();
  // const {ZipkinExporter} = require('@opentelemetry/exporter-zipkin');
  // const exporter = new ZipkinExporter({});

  const {registerInstrumentations} = require('@opentelemetry/instrumentation');
  const {GrpcInstrumentation} = require('@opentelemetry/instrumentation-grpc');
  const {HttpInstrumentation} = require('@opentelemetry/instrumentation-http');
  registerInstrumentations({
    instrumentations: [new GrpcInstrumentation(), new HttpInstrumentation()],
  });

  const sdk = new NodeSDK({
    resource: resource,
    traceExporter: exporter,
    // Trace every single request to ensure that we generate
    // enough traffic for proper examination of traces.
    sampler: new TraceIdRatioBasedSampler(1.0),
  });
  sdk.start();

  const provider = new NodeTracerProvider({resource: resource});
  provider.addSpanProcessor(new BatchSpanProcessor(exporter));
  provider.register();

  const tracer = provider.getTracer('nodejs-spanner');

  const {Spanner} = require('@google-cloud/spanner');

  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const projectId = 'my-project-id';
  // const instanceId = 'my-instance';
  // const databaseId = 'my-database';

  // Creates a client
  const spanner = new Spanner({
    projectId: projectId,
    observability: {
      tracerProvider: provider,
      enableExtendedTracing: true,
    },
  });

  // Gets a reference to a Cloud Spanner instance and database
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);
  const databaseAdminClient = spanner.getDatabaseAdminClient();

  const databasePath = databaseAdminClient.databasePath(
    projectId,
    instanceId,
    databaseId
  );

  await new Promise((resolve, reject) => setTimeout(resolve, 5000));

  tracer.startActiveSpan('deleteAndCreateDatabase', span => {
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

  // [END spanner_export_traces]
}

function quickstart() {}

function createDropIndices(
  tracer,
  databaseAdminClient,
  database,
  databasePath
) {
  async function createIndex(tracer, callback) {
    const span = tracer.startSpan('createIndex');
    const request = ['CREATE INDEX AlbumsByAlbumTitle ON Albums(AlbumTitle)'];

    // Creates a new index in the database
    try {
      const [operation] = await databaseAdminClient.updateDatabaseDdl({
        database: databasePath,
        statements: request,
      });

      console.log('Waiting for operation to complete...');
      await operation.promise();

      console.log('Added the AlbumsByAlbumTitle index.');
      spanner.close();
      span.end();
    } catch (err) {
      console.error('ERROR:', err);
      dropIndex(() => {});
    } finally {
      span.end();
    }
  }

  async function dropIndex(
    tracer,
    databaseAdminClient,
    callback,
    databasePath
  ) {
    const span = tracer.startSpan('dropIndex');
    const request = ['DROP INDEX AlbumsByAlbumTitle'];

    // Creates a new index in the database
    try {
      const [operation] = await databaseAdminClient.updateDatabaseDdl({
        database: databasePath,
        statements: request,
      });

      console.log('Waiting for operation to complete...');
      await operation.promise();
      span.end();
      console.log('Added the AlbumsByAlbumTitle index.');
    } catch (err) {
      console.error('ERROR:', err);
      createIndex(tracer, () => {});
    } finally {
      setTimeout(() => {
        callback();
      }, 5000);
    }
  }

  // Gets a transaction object that captures the database state
  // at a specific point in time
  tracer.startActiveSpan('runOperations', span => {
    createIndex(tracer, () => {
      setTimeout(() => {
        span.end();
      }, 10000);
    });
  });
}

function runMutations(tracer, database) {
  const {MutationGroup} = require('@google-cloud/spanner');

  // Create Mutation Groups
  /**
   * Related mutations should be placed in a group, such as insert mutations for both a parent and a child row.
   * A group must contain related mutations.
   * Please see {@link https://cloud.google.com/spanner/docs/reference/rpc/google.spanner.v1#google.spanner.v1.BatchWriteRequest.MutationGroup}
   * for more details and examples.
   */
  tracer.startActiveSpan('runMutations', span => {
    const mutationGroup1 = new MutationGroup();
    mutationGroup1.insert('Singers', {
      SingerId: 1,
      FirstName: 'Scarlet',
      LastName: 'Terry',
    });

    const mutationGroup2 = new MutationGroup();
    mutationGroup2.insert('Singers', {
      SingerId: 2,
      FirstName: 'Marc',
    });
    mutationGroup2.insert('Singers', {
      SingerId: 3,
      FirstName: 'Catalina',
      LastName: 'Smith',
    });
    mutationGroup2.insert('Albums', {
      AlbumId: 1,
      SingerId: 2,
      AlbumTitle: 'Total Junk',
    });
    mutationGroup2.insert('Albums', {
      AlbumId: 2,
      SingerId: 3,
      AlbumTitle: 'Go, Go, Go',
    });

    const options = {
      transactionTag: 'batch-write-tag',
    };

    try {
      database
        .batchWriteAtLeastOnce([mutationGroup1, mutationGroup2], options)
        .on('error', console.error)
        .on('data', response => {
          // Check the response code of each response to determine whether the mutation group(s) were applied successfully.
          if (response.status.code === 0) {
            console.log(
              `Mutation group indexes ${
                response.indexes
              }, have been applied with commit timestamp ${Spanner.timestamp(
                response.commitTimestamp
              ).toJSON()}`
            );
          }
          // Mutation groups that fail to commit trigger a response with a non-zero status code.
          else {
            console.log(
              `Mutation group indexes ${response.indexes}, could not be applied with error code ${response.status.code}, and error message ${response.status.message}`
            );
          }
        })
        .on('end', () => {
          console.log('Request completed successfully');
          database.close();
          span.end();
        });
    } catch (err) {
      console.log(err);
      span.end();
    } finally {
      setTimeout(() => {
        database.close();
        span.end();
      }, 8000);
    }
  });
}

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

function createTableWithForeignKeyDeleteCascade(
  databaseAdminClient,
  databasePath
) {
  const requests = [
    'DROP TABLE Customers',
    'DROP TABLE ShoppingCarts',
    `CREATE TABLE Customers (
        CustomerId INT64,
        CustomerName STRING(62) NOT NULL
        ) PRIMARY KEY (CustomerId)`,
    `CREATE TABLE ShoppingCarts (
        CartId INT64 NOT NULL,
        CustomerId INT64 NOT NULL,
        CustomerName STRING(62) NOT NULL,
        CONSTRAINT FKShoppingCartsCustomerId FOREIGN KEY (CustomerId)
        REFERENCES Customers (CustomerId) ON DELETE CASCADE,    
      ) PRIMARY KEY (CartId)`,
  ];

  async function doDDL() {
    const [operation] = await databaseAdminClient.updateDatabaseDdl({
      database: databasePath,
      statements: requests,
    });

    console.log(
      'Waiting for createTableWithForeignKeyDeleteCasscae operation...'
    );
    await operation.promise();
  }

  doDDL();
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
    const createAlbumsStatement = `
      CREATE TABLE Albums (
        SingerId     INT64 NOT NULL,
        AlbumId      INT64 NOT NULL,
        AlbumTitle   STRING(MAX)
      ) PRIMARY KEY (SingerId, AlbumId),
        INTERLEAVE IN PARENT Singers ON DELETE CASCADE`;

    const [operation] = await databaseAdminClient.createDatabase({
      createStatement: 'CREATE DATABASE `' + databaseId + '`',
      extraStatements: [createSingersTableStatement, createAlbumsStatement],
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
    'export <instanceName> <databaseName> <projectId>',
    'Execute a read-only transaction on an example Cloud Spanner table.',
    {},
    opts => exportSpans(opts.instanceName, opts.databaseName, opts.projectId)
  )
  .example('node $0 export "my-instance" "my-database" "my-project-id"')
  .wrap(120)
  .recommendCommands()
  .epilogue('For more information, see https://cloud.google.com/spanner/docs')
  .strict()
  .help().argv;
