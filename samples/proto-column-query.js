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
const music = singer.spanner.examples.music;

function main(
  instanceId = 'my-instance',
  databaseId = 'my-database',
  projectId = 'my-project-id'
) {
  // [START spanner_query_proto_columns_data]
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

  async function protoColumnQuery() {
    // Gets a reference to a Cloud Spanner instance and database.
    const instance = spanner.instance(instanceId);
    const database = instance.database(databaseId);

    const query = {
      sql: `SELECT SingerId,
                   FirstName,
                   LastName,
                   SingerInfo,
                   SingerGenre,
                   SingerInfoArray,
                   SingerGenreArray
            FROM Singers 
            WHERE SingerId = 1`,
      // `columnInfo` is an optional parameter and is used to deserialize the proto message and enum object back from bytearray,
      // if columnInfo is not passed for proto messages and enums then data for these columns will be bytes and int respectively.
      columnInfo: {
        SingerInfo: music.SingerInfo,
        SingerInfoArray: music.SingerInfo,
        SingerGenre: music.Genre,
        SingerGenreArray: music.Genre,
      },
    };

    // Queries rows from the Singers table.
    try {
      const [rows] = await database.run(query);

      rows.forEach(row => {
        const json = row.toJSON();
        console.log(
          `SingerId: ${json.singerid}, FirstName: ${json.firstname}, LastName: ${json.lastname}`
        );
      });
    } catch (err) {
      console.error('ERROR:', err);
    } finally {
      // Close the database when finished.
      database.close();
    }
  }

  protoColumnQuery();
  // [END spanner_query_proto_columns_data]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
