async function main(
  projectId = 'span-cloud-testing',
  instanceId = 'sakthi-spanner-testing',
  databaseId = 'testing-database'
) {
  const {Spanner} = require('../build/src');
  const spanner = new Spanner({
    projectId: projectId,
  });

  // Acquire the database handle.
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);

  const startTime = new Date();
  console.log(startTime.toISOString(), 'running spanner query');
  database.run('Select * from Employees Limit 1', (err, rows) => {
    if (err) {
      console.error('Error running query', err);
    } else {
      console.log(
        new Date().toISOString(),
        'Query ran successfully, total rows',
        rows.length,
        'time taken',
        (new Date().getTime() - startTime.getTime()) / 1000,
        's'
      );
    }
  });

  console.log(new Date().toISOString(), 'finished query run');
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
