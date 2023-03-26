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

const singer = require('./resource/singer.js');

function main(instanceId = 'my-instance', databaseId = 'my-database',
    projectId = 'my-project-id') {
  // [START spanner_insert_proto_columns_data]
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
    projectId: projectId
  });

  async function protoColumnMutationInsert() {
    // Gets a reference to a Cloud Spanner instance and database.
    const instance = spanner.instance(instanceId);
    const database = instance.database(databaseId);

    const genre = singer.spanner.examples.music.Genre.ROCK;
    const singerInfo = singer.spanner.examples.music.SingerInfo.create({
      "singerId": 1,
      "genre": genre,
      "birthDate": "January",
      "nationality": "Country1"
    });

    const protoMessage = Spanner.protoMessage({
      value: singerInfo,
      messageFunction: singer.spanner.examples.music.SingerInfo,
      fullName: "spanner.examples.music.SingerInfo"
    });

    const protoEnum = Spanner.protoEnum({
      value: genre,
      enumObject: singer.spanner.examples.music.Genre,
      fullName: "spanner.examples.music.Genre"
    });

    // Instantiate Spanner table object.
    const table = database.table("Singers");

    const data = [
      {
        SingerId: '1',
        FirstName: 'Virginia',
        LastName: 'Watson',
        SingerInfo: protoMessage,
        SingerGenre: protoEnum,
        SingerInfoArray: [protoMessage],
        SingerGenreArray: [protoEnum],

      },
    ];

    try {
      await table.insert(data);
      console.log('Updated data.');
    } catch (err) {
      console.error('ERROR:', err);
    } finally {
      // Close the database when finished.
      await database.close();
    }
  }

  protoColumnMutationInsert();
  // [END spanner_insert_proto_columns_data]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
