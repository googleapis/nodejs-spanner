// Copyright 2021 Google LLC
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

async function updateWithJsonData(instanceId, databaseId, projectId) {
  // [START spanner_update_data_with_json_column]
  // Imports the Google Cloud client library.
  const {Spanner} = require('@google-cloud/spanner');

  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const projectId = 'my-project-id';
  // const instanceId = 'my-instance';
  // const databaseId = 'my-database';

  // Creates a client.
  const spanner = new Spanner({
    projectId: projectId,
  });

  // Gets a reference to a Cloud Spanner instance and database.
  const instance = spanner.instance(instanceId);
  const database = instance.database(databaseId);

  // Instantiate Spanner table objects.
  const venuesTable = database.table('Venues');

  const data = [
    {
      VenueId: '19',
      VenueDetails: {rating: 9, description: 'This is a nice place'},
      LastUpdateTime: 'spanner.commit_timestamp()',
    },
    {
      VenueId: '4',
      // VenueDetails must be specified as a string, as it contains a top-level
      // array of objects that should be inserted into a JSON column. If we were
      // to specify this value as an array instead of a string, the client
      // library would encode this value as ARRAY<JSON> instead of JSON.
      VenueDetails: `[
        {
          "wing1": {
            "description": "the first wing",
            "size": "5"
          }
        },
        {
          "wing2": {
            "description": "the second wing",
            "size": "10"
          }
        },
        {
          "main hall": {
            "description": "this is the biggest space",
            "size": "200"
          }
        }
      ]`,
      LastUpdateTime: 'spanner.commit_timestamp()',
    },
    {
      VenueId: '42',
      VenueDetails: {
        id: 'central123',
        name: 'Central Park',
        description: '🏞∮πρότερονแผ่นดินฮั่นเสื่อมሰማይᚻᛖ',
        location: {
          address: '59th St to 110th St',
          crossStreet: '5th Ave to Central Park West',
          lat: 40.78408342593807,
          lng: -73.96485328674316,
          postalCode: '10028',
          cc: 'US',
          city: 'New York',
          state: 'NY',
          country: 'United States',
          formattedAddress: [
            '59th St to 110th St (5th Ave to Central Park West)',
            'New York, NY 10028',
            'United States',
          ],
        },
        hours: {
          status: 'Likely open',
          isOpen: true,
          isLocalHoliday: false,
          timeframes: [
            {
              days: 'Tue–Thu',
              open: [{time: 'Noon–8:00PM'}],
            },
            {
              days: 'Fri',
              open: [{time: '11:00 AM–7:00 PM'}],
            },
            {
              days: 'Sat',
              open: [{time: '8:00 AM–8:00PM'}],
            },
            {
              days: 'Sun',
              open: [{time: '8:00 AM–7:00 PM'}],
            },
          ],
        },
      },
      LastUpdateTime: 'spanner.commit_timestamp()',
    },
  ];
  // Updates rows in the Venues table.
  try {
    await venuesTable.update(data);
    console.log('Updated data.');
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    // Close the database when finished.
    database.close();
  }
  // [END spanner_update_data_with_json_column]
}

module.exports.updateWithJsonData = updateWithJsonData;
