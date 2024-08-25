'use strict';

async function main(
  instanceId = 'my-instance',
  databaseId = 'my-database',
  projectId = 'my-project-id'
) {
  const {Spanner} = require('../build/src');
  const spanner = new Spanner({
    projectId: projectId,
  });
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);
  const queries = [{sql: 'SELECT 1'}, {sql: 'SELECT 2'}, {sql: 'SELECT 3'}];
  async function runQueriesConcurrently() {
    // await database.run('SELECT 1');
    const promises = queries.map(async query => {
      const [rows] = await database.run(query);
      console.log(`Query: ${query.sql} returned ${rows.length} rows.`);
      rows.forEach(row => console.log(row));
    });

    await Promise.all(promises);
  }
  runQueriesConcurrently().catch(console.error);
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});

main(...process.argv.slice(2));
