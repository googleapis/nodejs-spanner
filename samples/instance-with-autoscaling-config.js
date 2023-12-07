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

// [START spanner_create_instance_with_autoscaling_config]

'use strict';

async function createInstanceWithAutoscalingConfig(instanceId, projectId) {
  // Imports the Google Cloud client library
  const {Spanner, protos} = require('@google-cloud/spanner');

  // Creates a client
  const spanner = new Spanner({
    projectId: projectId,
  });

  const instance = spanner.instance(instanceId);
  const autoscalingConfig =
    protos.google.spanner.admin.instance.v1.AutoscalingConfig.create({
      // Only one of minNodes/maxNodes or minProcessingUnits/maxProcessingUnits
      // can be set. Both min and max need to be set and
      // maxNodes/maxProcessingUnits can be at most 10X of
      // minNodes/minProcessingUnits.
      autoscalingLimits:
        protos.google.spanner.admin.instance.v1.AutoscalingConfig.AutoscalingLimits.create(
          {
            minNodes: 1,
            maxNodes: 2,
          }
        ),
      // highPriorityCpuUtilizationPercent and storageUtilizationPercent are both
      // percentages and must lie between 0 and 100.
      autoscalingTargets:
        protos.google.spanner.admin.instance.v1.AutoscalingConfig.AutoscalingTargets.create(
          {
            highPriorityCpuUtilizationPercent: 65,
            storageUtilizationPercent: 95,
          }
        ),
    });
  // Creates a new instance with autoscalingConfig
  try {
    console.log(`Creating instance ${instance.formattedName_}.`);
    const [, operation] = await instance.create({
      config: 'regional-us-west1',
      autoscalingConfig: autoscalingConfig,
      displayName: 'This is a display name.',
      labels: {
        ['cloud_spanner_samples']: 'true',
      },
    });

    console.log(`Waiting for operation on ${instance.id} to complete...`);
    await operation.promise();

    console.log(`Created instance ${instanceId}.`);

    const [metadata] = await instance.getMetadata({
      fieldNames: ['autoscalingConfig'],
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
        `Storage utilization percent: ${metadata.autoscalingConfig.autoscalingTargets.storageUtilizationPercent}.`
    );
  } catch (err) {
    console.error('ERROR:', err);
  }
}

// [END spanner_create_instance_with_autoscaling_config]
module.exports.createInstanceWithAutoscalingConfig =
  createInstanceWithAutoscalingConfig;
