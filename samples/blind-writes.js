'use strict';

async function main(
  instanceId = 'my-instance',
  databaseId = 'my-database',
  projectId = 'my-project-id'
) {
  const {Spanner} = require('../build/src');
  const {Mutation} = require('../build/src/transaction');

  const spanner = new Spanner({
    projectId: projectId,
  });
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);

  const mutation = new Mutation();
  mutation.insert('Singers', {SingerId: 1, FirstName: 'xyz'});

  try {
    const response = await database.blindWrite();
    console.log("response: ", response);
  } catch (err) {
    console.error('Error during batchWrite:', err);
  }
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});

main(...process.argv.slice(2));