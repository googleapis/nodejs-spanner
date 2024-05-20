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

  async function insertData() {
    const instance = spanner.instance(instanceId);
    const database = instance.database(databaseId);

    const singersTable = database.table('Singers');
    const albumsTable = database.table('Albums');

    try {
      const option = {
        excludeTxnFromChangeStreams: true,
      };
      // await singersTable.insert(
      //   [{SingerId: '18', FirstName: 'Marc', LastName: 'Richards'}],
      //   option
      // );
      // await singersTable.insert([
      //   {SingerId: '1', FirstName: 'Marc', LastName: 'Richards'},
      //   {SingerId: '2', FirstName: 'Catalina', LastName: 'Smith'},
      //   {SingerId: '3', FirstName: 'Alice', LastName: 'Trentor'},
      //   {SingerId: '4', FirstName: 'Lea', LastName: 'Martin'},
      //   {SingerId: '5', FirstName: 'David', LastName: 'Lomond'},
      // ]);

      await albumsTable.insert([
        {SingerId: '4', AlbumId: '3', AlbumTitle: 'Total Junk'},
        {SingerId: '7', AlbumId: '4', AlbumTitle: 'Go, Go, Go'},
      ]);
      console.log('Inserted data.');
    } catch (err) {
      console.error('ERROR:', err);
    } finally {
      await database.close();
    }
  }

  await insertData();
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
