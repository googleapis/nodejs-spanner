'use strict';

async function main(
  instanceId = 'my-instance',
  databaseId = 'my-database',
  projectId = 'my-project-id'
) {
  const {Spanner} = require('../build/src');
  const {Mutations} = require('../build/src/transaction');

  const spanner = new Spanner({
    projectId: projectId,
  });
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);

  const mutations = new Mutations();
  mutations.insert('Singers', {SingerId: 1, FirstName: 'xyz1'});
  mutations.insert('Singers', {SingerId: 2, FirstName: 'xyz2'});
  mutations.insert('Singers', {SingerId: 3, FirstName: 'xyz3'});
  mutations.insert('Singers', {SingerId: 4, FirstName: 'xyz4'});
  mutations.insert('Singers', {SingerId: 5, FirstName: 'xyz5'});
  mutations.insert('Singers', {SingerId: 6, FirstName: 'xyz6'});
  mutations.insert('Singers', {SingerId: 7, FirstName: 'xyz7'});
  mutations.insert('Singers', {SingerId: 8, FirstName: 'xyz8'});
  mutations.insert('Singers', {SingerId: 9, FirstName: 'xyz9'});
  mutations.update('Singers', {SingerId: 9, FirstName: 'xyz19'});

  try {
    const response = await database.blindWrite(mutations);
    console.log('response: ', response);
  } catch (err) {
    console.error('Error during batchWrite:', err);
  }
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});

main(...process.argv.slice(2));
