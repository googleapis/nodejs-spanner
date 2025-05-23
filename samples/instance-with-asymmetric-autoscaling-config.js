/**
 * Copyright 2025 Google LLC
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
//  title: Creates a instance with asymmetric autoscaling config.
//  usage: node instance-with-asymmetric-autoscaling-config.js <INSTANCE_ID> <PROJECT_ID>

'use strict';

function main(instanceId = 'my-instance', projectId = 'my-project-id') {
  async function createInstanceWithAsymmetricAutoscalingConfig() {
    // [START spanner_create_instance_with_asymmetric_autoscaling_config]
    // Imports the Google Cloud client library
    const {Spanner, protos} = require('@google-cloud/spanner');

    /**
     * TODO(developer): Uncomment the following lines before running the sample.
     */
    // const projectId = 'my-project-id';
    // const instanceId = 'my-instance';

    // Creates a client
    const spanner = new Spanner({
      projectId: projectId,
    });

    // Get the instance admin client
    const instanceAdminClient = spanner.getInstanceAdminClient();

    const autoscalingConfig =
      protos.google.spanner.admin.instance.v1.AutoscalingConfig.create({
        // Only one of minNodes/maxNodes or minProcessingUnits/maxProcessingUnits can be set.
        autoscalingLimits:
          protos.google.spanner.admin.instance.v1.AutoscalingConfig.AutoscalingLimits.create(
            {
              minNodes: 1,
              maxNodes: 2,
            },
          ),
        // highPriorityCpuUtilizationPercent and storageUtilizationPercent are both
        // percentages and must lie between 0 and 100.
        autoscalingTargets:
          protos.google.spanner.admin.instance.v1.AutoscalingConfig.AutoscalingTargets.create(
            {
              highPriorityCpuUtilizationPercent: 65,
              storageUtilizationPercent: 95,
            },
          ),
        // The read-only replicas listed in the asymmetric autoscaling options scale independently
        // from other replicas.
        asymmetricAutoscalingOptions: [
          protos.google.spanner.admin.instance.v1.AutoscalingConfig.AsymmetricAutoscalingOption.create(
            {
              replicaSelection:
                protos.google.spanner.admin.instance.v1.ReplicaSelection.create(
                  {
                    location: 'europe-west1',
                  },
                ),
            },
          ),
          protos.google.spanner.admin.instance.v1.AutoscalingConfig.AsymmetricAutoscalingOption.create(
            {
              replicaSelection:
                protos.google.spanner.admin.instance.v1.ReplicaSelection.create(
                  {
                    location: 'europe-west4',
                  },
                ),
            },
          ),
          protos.google.spanner.admin.instance.v1.AutoscalingConfig.AsymmetricAutoscalingOption.create(
            {
              replicaSelection:
                protos.google.spanner.admin.instance.v1.ReplicaSelection.create(
                  {
                    location: 'asia-east1',
                  },
                ),
            },
          ),
        ],
      });

    // Creates a new instance with autoscaling configuration and asymmetric autoscaling option
    // When autoscalingConfig is enabled, nodeCount and processingUnits fields
    // need not be specified.
    try {
      console.log(
        `Creating instance ${instanceAdminClient.instancePath(
          projectId,
          instanceId,
        )}.`,
      );
      const [operation] = await instanceAdminClient.createInstance({
        instanceId: instanceId,
        parent: instanceAdminClient.projectPath(projectId),
        instance: {
          config: instanceAdminClient.instanceConfigPath(
            projectId,
            'nam-eur-asia3',
          ),
          displayName: 'Display name for the instance.',
          autoscalingConfig: autoscalingConfig,
          labels: {
            cloud_spanner_samples: 'true',
            created: Math.round(Date.now() / 1000).toString(), // current time
          },
          // Feature MULTI_REGION is available only for ENTERPRISE_PLUS edition
          edition:
            protos.google.spanner.admin.instance.v1.Instance.Edition
              .ENTERPRISE_PLUS,
        },
      });

      console.log(`Waiting for operation on ${instanceId} to complete...`);
      await operation.promise();
      console.log(`Created instance ${instanceId}.`);

      // get instance metadata
      const [metadata] = await instanceAdminClient.getInstance({
        name: instanceAdminClient.instancePath(projectId, instanceId),
      });
      console.log(
        `Autoscaling configurations of ${instanceId} are:  ` +
          '\n' +
          `Min nodes: ${metadata.autoscalingConfig.autoscalingLimits.minNodes} ` +
          'nodes.' +
          '\n' +
          `Max nodes: ${metadata.autoscalingConfig.autoscalingLimits.maxNodes}` +
          ' nodes.' +
          '\n' +
          `High priority cpu utilization percent: ${metadata.autoscalingConfig.autoscalingTargets.highPriorityCpuUtilizationPercent}.` +
          '\n' +
          `Storage utilization percent: ${metadata.autoscalingConfig.autoscalingTargets.storageUtilizationPercent}.` +
          '\n' +
          `Asymmetric Autoscaling Options: ${
            metadata.autoscalingConfig.asymmetricAutoscalingOptions &&
            metadata.autoscalingConfig.asymmetricAutoscalingOptions.length > 0
              ? metadata.autoscalingConfig.asymmetricAutoscalingOptions
                  .map(option =>
                    option.replicaSelection && option.replicaSelection.location
                      ? option.replicaSelection.location
                      : 'N/A',
                  )
                  .join(', ')
              : 'None'
          }`,
      );
    } catch (err) {
      console.error('ERROR:', err);
    }
    // [END spanner_create_instance_with_asymmetric_autoscaling_config]
  }
  createInstanceWithAsymmetricAutoscalingConfig();
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});
main(...process.argv.slice(2));
