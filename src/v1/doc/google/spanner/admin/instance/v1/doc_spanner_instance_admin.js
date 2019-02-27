// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Note: this file is purely for documentation. Any contents are not expected
// to be loaded as the JS file.

/**
 * A possible configuration for a Cloud Spanner instance. Configurations
 * define the geographic placement of nodes and their replication.
 *
 * @property {string} name
 *   A unique identifier for the instance configuration.  Values
 *   are of the form
 *   `projects/<project>/instanceConfigs/[a-z][-a-z0-9]*`
 *
 * @property {string} displayName
 *   The name of this instance configuration as it appears in UIs.
 *
 * @typedef InstanceConfig
 * @memberof google.spanner.admin.instance.v1
 * @see [google.spanner.admin.instance.v1.InstanceConfig definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/instance/v1/spanner_instance_admin.proto}
 */
const InstanceConfig = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * An isolated set of Cloud Spanner resources on which databases can be hosted.
 *
 * @property {string} name
 *   Required. A unique identifier for the instance, which cannot be changed
 *   after the instance is created. Values are of the form
 *   `projects/<project>/instances/[a-z][-a-z0-9]*[a-z0-9]`. The final
 *   segment of the name must be between 6 and 30 characters in length.
 *
 * @property {string} config
 *   Required. The name of the instance's configuration. Values are of the form
 *   `projects/<project>/instanceConfigs/<configuration>`. See
 *   also InstanceConfig and
 *   ListInstanceConfigs.
 *
 * @property {string} displayName
 *   Required. The descriptive name for this instance as it appears in UIs.
 *   Must be unique per project and between 4 and 30 characters in length.
 *
 * @property {number} nodeCount
 *   Required. The number of nodes allocated to this instance. This may be zero
 *   in API responses for instances that are not yet in state `READY`.
 *
 *   See [the
 *   documentation](https://cloud.google.com/spanner/docs/instances#node_count)
 *   for more information about nodes.
 *
 * @property {number} state
 *   Output only. The current instance state. For
 *   CreateInstance,
 *   the state must be either omitted or set to `CREATING`. For
 *   UpdateInstance,
 *   the state must be either omitted or set to `READY`.
 *
 *   The number should be among the values of [State]{@link google.spanner.admin.instance.v1.State}
 *
 * @property {Object.<string, string>} labels
 *   Cloud Labels are a flexible and lightweight mechanism for organizing cloud
 *   resources into groups that reflect a customer's organizational needs and
 *   deployment strategies. Cloud Labels can be used to filter collections of
 *   resources. They can be used to control how resource metrics are aggregated.
 *   And they can be used as arguments to policy management rules (e.g. route,
 *   firewall, load balancing, etc.).
 *
 *    * Label keys must be between 1 and 63 characters long and must conform to
 *      the following regular expression: `\[a-z]([-a-z0-9]*[a-z0-9])?`.
 *    * Label values must be between 0 and 63 characters long and must conform
 *      to the regular expression `(\[a-z]([-a-z0-9]*[a-z0-9])?)?`.
 *    * No more than 64 labels can be associated with a given resource.
 *
 *   See https://goo.gl/xmQnxf for more information on and examples of labels.
 *
 *   If you plan to use labels in your own code, please note that additional
 *   characters may be allowed in the future. And so you are advised to use an
 *   internal label representation, such as JSON, which doesn't rely upon
 *   specific characters being disallowed.  For example, representing labels
 *   as the string:  name + "_" + value  would prove problematic if we were to
 *   allow "_" in a future release.
 *
 * @typedef Instance
 * @memberof google.spanner.admin.instance.v1
 * @see [google.spanner.admin.instance.v1.Instance definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/instance/v1/spanner_instance_admin.proto}
 */
const Instance = {
  // This is for documentation. Actual contents will be loaded by gRPC.

  /**
   * Indicates the current state of the instance.
   *
   * @enum {number}
   * @memberof google.spanner.admin.instance.v1
   */
  State: {

    /**
     * Not specified.
     */
    STATE_UNSPECIFIED: 0,

    /**
     * The instance is still being created. Resources may not be
     * available yet, and operations such as database creation may not
     * work.
     */
    CREATING: 1,

    /**
     * The instance is fully created and ready to do work such as
     * creating databases.
     */
    READY: 2
  }
};

/**
 * The request for
 * ListInstanceConfigs.
 *
 * @property {string} parent
 *   Required. The name of the project for which a list of supported instance
 *   configurations is requested. Values are of the form
 *   `projects/<project>`.
 *
 * @property {number} pageSize
 *   Number of instance configurations to be returned in the response. If 0 or
 *   less, defaults to the server's maximum allowed page size.
 *
 * @property {string} pageToken
 *   If non-empty, `page_token` should contain a
 *   next_page_token
 *   from a previous
 *   ListInstanceConfigsResponse.
 *
 * @typedef ListInstanceConfigsRequest
 * @memberof google.spanner.admin.instance.v1
 * @see [google.spanner.admin.instance.v1.ListInstanceConfigsRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/instance/v1/spanner_instance_admin.proto}
 */
const ListInstanceConfigsRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The response for
 * ListInstanceConfigs.
 *
 * @property {Object[]} instanceConfigs
 *   The list of requested instance configurations.
 *
 *   This object should have the same structure as [InstanceConfig]{@link google.spanner.admin.instance.v1.InstanceConfig}
 *
 * @property {string} nextPageToken
 *   `next_page_token` can be sent in a subsequent
 *   ListInstanceConfigs
 *   call to fetch more of the matching instance configurations.
 *
 * @typedef ListInstanceConfigsResponse
 * @memberof google.spanner.admin.instance.v1
 * @see [google.spanner.admin.instance.v1.ListInstanceConfigsResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/instance/v1/spanner_instance_admin.proto}
 */
const ListInstanceConfigsResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for
 * GetInstanceConfigRequest.
 *
 * @property {string} name
 *   Required. The name of the requested instance configuration. Values are of
 *   the form `projects/<project>/instanceConfigs/<config>`.
 *
 * @typedef GetInstanceConfigRequest
 * @memberof google.spanner.admin.instance.v1
 * @see [google.spanner.admin.instance.v1.GetInstanceConfigRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/instance/v1/spanner_instance_admin.proto}
 */
const GetInstanceConfigRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for
 * GetInstance.
 *
 * @property {string} name
 *   Required. The name of the requested instance. Values are of the form
 *   `projects/<project>/instances/<instance>`.
 *
 * @typedef GetInstanceRequest
 * @memberof google.spanner.admin.instance.v1
 * @see [google.spanner.admin.instance.v1.GetInstanceRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/instance/v1/spanner_instance_admin.proto}
 */
const GetInstanceRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for
 * CreateInstance.
 *
 * @property {string} parent
 *   Required. The name of the project in which to create the instance. Values
 *   are of the form `projects/<project>`.
 *
 * @property {string} instanceId
 *   Required. The ID of the instance to create.  Valid identifiers are of the
 *   form `[a-z][-a-z0-9]*[a-z0-9]` and must be between 6 and 30 characters in
 *   length.
 *
 * @property {Object} instance
 *   Required. The instance to create.  The name may be omitted, but if
 *   specified must be `<parent>/instances/<instance_id>`.
 *
 *   This object should have the same structure as [Instance]{@link google.spanner.admin.instance.v1.Instance}
 *
 * @typedef CreateInstanceRequest
 * @memberof google.spanner.admin.instance.v1
 * @see [google.spanner.admin.instance.v1.CreateInstanceRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/instance/v1/spanner_instance_admin.proto}
 */
const CreateInstanceRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for
 * ListInstances.
 *
 * @property {string} parent
 *   Required. The name of the project for which a list of instances is
 *   requested. Values are of the form `projects/<project>`.
 *
 * @property {number} pageSize
 *   Number of instances to be returned in the response. If 0 or less, defaults
 *   to the server's maximum allowed page size.
 *
 * @property {string} pageToken
 *   If non-empty, `page_token` should contain a
 *   next_page_token
 *   from a previous
 *   ListInstancesResponse.
 *
 * @property {string} filter
 *   An expression for filtering the results of the request. Filter rules are
 *   case insensitive. The fields eligible for filtering are:
 *
 *     * `name`
 *     * `display_name`
 *     * `labels.key` where key is the name of a label
 *
 *   Some examples of using filters are:
 *
 *     * `name:*` --> The instance has a name.
 *     * `name:Howl` --> The instance's name contains the string "howl".
 *     * `name:HOWL` --> Equivalent to above.
 *     * `NAME:howl` --> Equivalent to above.
 *     * `labels.env:*` --> The instance has the label "env".
 *     * `labels.env:dev` --> The instance has the label "env" and the value of
 *                          the label contains the string "dev".
 *     * `name:howl labels.env:dev` --> The instance's name contains "howl" and
 *                                    it has the label "env" with its value
 *                                    containing "dev".
 *
 * @typedef ListInstancesRequest
 * @memberof google.spanner.admin.instance.v1
 * @see [google.spanner.admin.instance.v1.ListInstancesRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/instance/v1/spanner_instance_admin.proto}
 */
const ListInstancesRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The response for
 * ListInstances.
 *
 * @property {Object[]} instances
 *   The list of requested instances.
 *
 *   This object should have the same structure as [Instance]{@link google.spanner.admin.instance.v1.Instance}
 *
 * @property {string} nextPageToken
 *   `next_page_token` can be sent in a subsequent
 *   ListInstances
 *   call to fetch more of the matching instances.
 *
 * @typedef ListInstancesResponse
 * @memberof google.spanner.admin.instance.v1
 * @see [google.spanner.admin.instance.v1.ListInstancesResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/instance/v1/spanner_instance_admin.proto}
 */
const ListInstancesResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for
 * UpdateInstance.
 *
 * @property {Object} instance
 *   Required. The instance to update, which must always include the instance
 *   name.  Otherwise, only fields mentioned in
 *   [][google.spanner.admin.instance.v1.UpdateInstanceRequest.field_mask] need
 *   be included.
 *
 *   This object should have the same structure as [Instance]{@link google.spanner.admin.instance.v1.Instance}
 *
 * @property {Object} fieldMask
 *   Required. A mask specifying which fields in
 *   [][google.spanner.admin.instance.v1.UpdateInstanceRequest.instance] should
 *   be updated. The field mask must always be specified; this prevents any
 *   future fields in
 *   [][google.spanner.admin.instance.v1.Instance] from being erased
 *   accidentally by clients that do not know about them.
 *
 *   This object should have the same structure as [FieldMask]{@link google.protobuf.FieldMask}
 *
 * @typedef UpdateInstanceRequest
 * @memberof google.spanner.admin.instance.v1
 * @see [google.spanner.admin.instance.v1.UpdateInstanceRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/instance/v1/spanner_instance_admin.proto}
 */
const UpdateInstanceRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request for
 * DeleteInstance.
 *
 * @property {string} name
 *   Required. The name of the instance to be deleted. Values are of the form
 *   `projects/<project>/instances/<instance>`
 *
 * @typedef DeleteInstanceRequest
 * @memberof google.spanner.admin.instance.v1
 * @see [google.spanner.admin.instance.v1.DeleteInstanceRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/instance/v1/spanner_instance_admin.proto}
 */
const DeleteInstanceRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * Metadata type for the operation returned by
 * CreateInstance.
 *
 * @property {Object} instance
 *   The instance being created.
 *
 *   This object should have the same structure as [Instance]{@link google.spanner.admin.instance.v1.Instance}
 *
 * @property {Object} startTime
 *   The time at which the
 *   CreateInstance
 *   request was received.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @property {Object} cancelTime
 *   The time at which this operation was cancelled. If set, this operation is
 *   in the process of undoing itself (which is guaranteed to succeed) and
 *   cannot be cancelled again.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @property {Object} endTime
 *   The time at which this operation failed or was completed successfully.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @typedef CreateInstanceMetadata
 * @memberof google.spanner.admin.instance.v1
 * @see [google.spanner.admin.instance.v1.CreateInstanceMetadata definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/instance/v1/spanner_instance_admin.proto}
 */
const CreateInstanceMetadata = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * Metadata type for the operation returned by
 * UpdateInstance.
 *
 * @property {Object} instance
 *   The desired end state of the update.
 *
 *   This object should have the same structure as [Instance]{@link google.spanner.admin.instance.v1.Instance}
 *
 * @property {Object} startTime
 *   The time at which
 *   UpdateInstance
 *   request was received.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @property {Object} cancelTime
 *   The time at which this operation was cancelled. If set, this operation is
 *   in the process of undoing itself (which is guaranteed to succeed) and
 *   cannot be cancelled again.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @property {Object} endTime
 *   The time at which this operation failed or was completed successfully.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @typedef UpdateInstanceMetadata
 * @memberof google.spanner.admin.instance.v1
 * @see [google.spanner.admin.instance.v1.UpdateInstanceMetadata definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/spanner/admin/instance/v1/spanner_instance_admin.proto}
 */
const UpdateInstanceMetadata = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};