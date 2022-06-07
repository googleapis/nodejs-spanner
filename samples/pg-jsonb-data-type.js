// Copyright 2022 Google LLC
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

// sample-metadata:
//  title: Showcase how to work with the PostgreSQL JSONB data type on a Spanner PostgreSQL database.
//  usage: node pg-jsonb-data-type.js <INSTANCE_ID> <DATABASE_ID> <PROJECT_ID>

'use strict';

function main(
  instanceId = 'my-instance',
  databaseId = 'my-database',
  projectId = 'my-project-id'
) {
  // [START spanner_postgresql_jsonb_data_type]
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

  async function pgJsonbDataType() {
    // Gets a reference to a Cloud Spanner instance and database.
    const instance = spanner.instance(instanceId);
    const database = instance.database(databaseId);

    const request = ['ALTER TABLE Venues ADD COLUMN VenueDetails JSONB'];

    // Updates schema by adding a new table.
    const [operation] = await database.updateSchema(request);
    console.log(`Waiting for operation on ${databaseId} to complete...`);
    await operation.promise();
    console.log(
      `Added jsonb column to table venues to database ${databaseId}.`
    );

    // Instantiate Spanner table objects.
    const venuesTable = database.table('venues');
    const data = [
      {
        VenueId: '19',
        VenueDetails: {rating: 9, open: true},
      },
      {
        VenueId: '4',
        VenueDetails: `[
        {
          "name": null,
          "open": true
        },
        {
          "name": "room 2",
          "open": false
        },
        {
          "main hall": {
            "description": "this is the biggest space",
            "size": 200
          }
        }
      ]`,
      },
      {
        VenueId: '42',
        VenueDetails: {
          name: null,
          open: {
            Monday: true,
            Tuesday: false,
          },
          tags: ['large', 'airy'],
        },
      },
    ];

    try {
      await venuesTable.update(data);
      console.log('Updated data.');
    } catch (err) {
      console.error('ERROR:', err);
    }

    const insert_query = {
      sql: 'INSERT INTO venues(venueid, name, venuedetails) VALUES ($1, $2, $3);',
      params: {
        p1: '702',
        p2: 'room 9',
        p3: {rating: 6},
      },
      types: {
        p1: 'int64',
        p2: 'string',
        p3: 'jsonb',
      },
    };

    try {
      await database.runTransactionAsync(async transaction => {
        await transaction.runUpdate(insert_query);
        console.log('Inserted data using DML.');
        await transaction.commit();
      });
    } catch (err) {
      console.error('ERROR:', err);
    }

    const select_query = {
      sql: `SELECT venueid, venuedetails FROM Venues
          WHERE CAST(venuedetails ->> 'rating' AS INTEGER) > $1`,
      params: {
        p1: 2,
      },
      types: {
        p1: 'int64',
      },
      json: true,
    };

    // Queries row from the Venues table.
    try {
      const [rows] = await database.run(select_query);

      rows.forEach(row => {
        console.log(
          `VenueId: ${row.venueid}, Details: ${JSON.stringify(
            row.venuedetails
          )}`
        );
      });
    } finally {
      // Close the database when finished.
      await database.close();
    }
  }
  pgJsonbDataType();
  // [END spanner_postgresql_jsonb_data_type]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
