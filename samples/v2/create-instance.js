/**
 * Copyright 2023 Google LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

// creates an instance using Instance Admin Client
async function createInstanceUsingAdminClient(instanceID, projectID) {
  const {InstanceAdminClient} = require('@google-cloud/spanner/build/src/v1');

  // creates an instance admin client
  const instanceAdminClient = new InstanceAdminClient({
    projectId: projectID,
  });

  // Creates a new instance
  try {
    const [operation] = await instanceAdminClient.createInstance({
      instanceId: instanceID,
      instance: {
        config: instanceAdminClient.instanceConfigPath(
          projectID,
          'regional-us-central1'
        ),
        displayName: 'Display name for the instance.',
        nodeCount: 1,
      },
      parent: instanceAdminClient.projectPath(projectID),
    });

    console.log(`Waiting for operation on ${instanceID} to complete...`);
    await operation.promise();
    console.log(`Created instance ${instanceID}.`);
  } catch (err) {
    console.error('ERROR:', err);
  }
}

require('yargs')
  .demand(1)
  .command(
    'createInstanceUsingAdminClient <instanceName> <projectId>',
    'Creates an example instance in a Cloud Spanner instance using Instance Admin Client.',
    {},
    opts => createInstanceUsingAdminClient(opts.instanceName, opts.projectId)
  )
  .example(
    'node $0 createInstanceUsingAdminClient "my-instance" "my-project-id"'
  )
  .wrap(120)
  .recommendCommands()
  .epilogue('For more information, see https://cloud.google.com/spanner/docs')
  .strict()
  .help().argv;