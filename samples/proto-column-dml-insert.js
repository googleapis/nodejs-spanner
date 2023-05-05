// Copyright 2023 Google LLC
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

// eslint-disable-next-line node/no-unpublished-require
const singer = require('./resource/singer.js');
const music = singer.spanner.examples.music;

function main(
  instanceId = 'my-instance',
  databaseId = 'my-database',
  projectId = 'my-project-id'
) {
  // [START spanner_insert_proto_columns_data_with_dml]
  /**
   * TODO(developer): Uncomment these variables before running the sample.
   */
  // const instanceId = 'my-instance';
  // const databaseId = 'my-database';
  // const projectId = 'my-project-id';

  // Imports the Google Cloud Spanner client library
  const {Spanner} = require('@google-cloud/spanner');

  // Instantiates a client
  const spanner = new Spanner({
    projectId: projectId,
  });

  async function protoDMLInsert() {
    // Gets a reference to a Cloud Spanner instance and database.
    const instance = spanner.instance(instanceId);
    const database = instance.database(databaseId);

    const genre = music.Genre.ROCK;
    const singerInfo = music.SingerInfo.create({
      singerId: 1,
      genre: genre,
      birthDate: 'January',
      nationality: 'Country1',
    });

    const protoMessage = Spanner.protoMessage({
      value: singerInfo,
      messageFunction: music.SingerInfo,
      fullName: 'spanner.examples.music.SingerInfo',
    });

    const protoEnum = Spanner.protoEnum({
      value: genre,
      enumObject: music.Genre,
      fullName: 'spanner.examples.music.Genre',
    });

    // Instantiate Spanner table objects.
    database.runTransaction(async (err, transaction) => {
      if (err) {
        console.error(err);
        return;
      }
      try {
        const [, stats] = await transaction.run({
          sql: `INSERT INTO Singers (SingerId, FirstName, LastName,
                                     SingerInfo, SingerGenre,
                                     SingerInfoArray,
                                     SingerGenreArray)
                VALUES (1, 'Virginia', 'Watson', @id1, @id2, @id3, @id4)`,
          params: {
            id1: protoMessage,
            id2: genre,
            id3: [protoMessage],
            id4: [protoEnum],
          },
        });

        const rowCount = Math.floor(stats[stats.rowCount]);
        console.log(
          `Successfully inserted ${rowCount} record into the Singers table.`
        );

        await transaction.commit();
      } catch (err) {
        console.error('ERROR:', err);
      } finally {
        // Close the database when finished.
        database.close();
      }
    });
  }

  protoDMLInsert();
  // [END spanner_insert_proto_columns_data_with_dml]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
