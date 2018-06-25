// Copyright 2018 Google LLC
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

'use strict';

const DatabaseAdminClient = require('./database_admin_client');
const InstanceAdminClient = require('./instance_admin_client');
const SpannerClient = require('./spanner_client');

module.exports.DatabaseAdminClient = DatabaseAdminClient;
module.exports.InstanceAdminClient = InstanceAdminClient;
module.exports.SpannerClient = SpannerClient;
