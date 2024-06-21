// Copyright 2024 Google LLC
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
