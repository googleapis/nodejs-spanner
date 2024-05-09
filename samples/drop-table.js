'use strict';

async function main(instanceId = 'my-instance', databaseId = 'my-database') {
  const {Spanner} = require('@google-cloud/spanner');
  const spanner = new Spanner();
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);
  const table = database.table('Albums');
  await table.delete();
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
