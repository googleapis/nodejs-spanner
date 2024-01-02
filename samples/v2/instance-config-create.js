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

// sample-metadata:
//  title: Creates a user-managed instance configuration.
//  usage: node instance-config-create <INSTANCE_CONFIG_ID> <BASE_INSTANCE_CONFIG_ID> <PROJECT_ID>

'use strict';

function main(
  instanceConfigID = 'custom-my-instance-config-18',
  baseInstanceConfigID = 'asia2',
  projectID = 'span-cloud-testing'
) {

  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const instanceConfigId = 'custom-my-instance-config-id'
  // const baseInstanceConfigId = 'my-base-instance-config-id';
  // const projectId = 'my-project-id';
  const {InstanceAdminClient} = require('@google-cloud/spanner/build/src/v1');

  // creates an instance admin client
  const instanceAdminClient = new InstanceAdminClient({
    projectId: projectID,
  });
  async function createInstanceConfig() {
    const [baseInstanceConfig] = await instanceAdminClient.getInstanceConfig({
        name: instanceAdminClient.instanceConfigPath(
            projectID,
            baseInstanceConfigID,
        ),
    });
    try {
        console.log(`Creating instance config ${instanceConfigID}.`);
        const [operation] = await instanceAdminClient.createInstanceConfig({
        
            instanceConfigId: instanceConfigID,
            instanceConfig: {
                name: instanceAdminClient.instanceConfigPath(
                    projectID,
                    instanceConfigID,
                ),
                baseConfig: instanceAdminClient.instanceConfigPath(
                    projectID,
                    baseInstanceConfigID,
                ),
                displayName: instanceConfigID,
                replicas: baseInstanceConfig.replicas,
                optionalReplicas: baseInstanceConfig.optionalReplicas,
            },
            parent: instanceAdminClient.projectPath(projectID),
    
        });
        console.log(
            `Waiting for create operation for ${instanceConfigID} to complete...`
        );
        await operation.promise();
        console.log(`Created instance config ${instanceConfigID}.`);
    } catch (err) {
        console.error(
            'ERROR: Creating instance config ',
            instanceConfigID,
            ' failed with error message ',
            err
        );
    }
  }
  createInstanceConfig();
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));