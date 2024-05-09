'use strict';

async function main(instanceId = 'my-instance', databaseId = 'my-database') {
  const {Spanner} = require('../build/src');
  const spanner = new Spanner();
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);
  const table = database.table('Albums');
  // table.delete((err, res));
  table.delete((err, op) => {
    if (err) {
        console.log(err);
    }
    console.log("inside callback");
});
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
