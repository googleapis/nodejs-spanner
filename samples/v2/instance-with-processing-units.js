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
async function createInstanceWithProcessingUnits(instanceID, projectID) {
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
        processingUnits: 500,
      },
      parent: instanceAdminClient.projectPath(projectID),
    });

    console.log(`Waiting for operation on ${instanceID} to complete...`);
    await operation.promise();
    console.log(`Created instance ${instanceID}.`);
    const [metadata] = await instanceAdminClient.getInstance({
      name: instanceAdminClient.instancePath(
        projectID,
        instanceID,
      ),
    });
    console.log(
    `Instance ${instanceID} has ${metadata.processingUnits} ` +
        'processing units.'
    );
  } catch (err) {
    console.error('ERROR:', err);
  }
}

// createInstanceWithProcessingUnits("alka-autogen-instance-18", "span-cloud-testing");

module.exports.createInstanceWithProcessingUnits = createInstanceWithProcessingUnits;