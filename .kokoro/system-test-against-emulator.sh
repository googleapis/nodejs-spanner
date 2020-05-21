#!/bin/bash

# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License..

# Fail on any error
set -eo pipefail

# Display commands being run
set -x

export SPANNER_EMULATOR_HOST=localhost:9010
export GCLOUD_PROJECT=emulator-test-project
echo "Running the Cloud Spanner emulator: $SPANNER_EMULATOR_HOST";

# Download the emulator
EMULATOR_VERSION=0.7.3
wget https://storage.googleapis.com/cloud-spanner-emulator/releases/${EMULATOR_VERSION}/cloud-spanner-emulator_linux_amd64-${EMULATOR_VERSION}.tar.gz
tar zxvf cloud-spanner-emulator_linux_amd64-${EMULATOR_VERSION}.tar.gz
chmod u+x emulator_main

# Start the emulator
./emulator_main --host_port $SPANNER_EMULATOR_HOST &

EMULATOR_PID=$!

# Stop the emulator & clean the environment variable
function cleanup() {
    kill -2 $EMULATOR_PID
    unset SPANNER_EMULATOR_HOST
    unset GCLOUD_PROJECT
    echo "Cleanup the emulator";
}
trap cleanup EXIT

cd $(dirname $0)/..

# Run a pre-test hook, if a pre-system-test.sh is in the project
if [ -f .kokoro/pre-system-test.sh ]; then
    set +x
    . .kokoro/pre-system-test.sh
    set -x
fi

npm install

# If tests are running against master, configure Build Cop
# to open issues on failures:
if [[ $KOKORO_BUILD_ARTIFACTS_SUBDIR = *"continuous"* ]]; then
  export MOCHA_REPORTER_OUTPUT=test_output_sponge_log.xml
  export MOCHA_REPORTER=xunit
  cleanup() {
    chmod +x $KOKORO_GFILE_DIR/linux_amd64/buildcop
    $KOKORO_GFILE_DIR/linux_amd64/buildcop
  }
  trap cleanup EXIT HUP
fi

npm run system-test

# codecov combines coverage across integration and unit tests. Include
# the logic below for any environment you wish to collect coverage for:
COVERAGE_NODE=10
if npx check-node-version@3.3.0 --silent --node $COVERAGE_NODE; then
  NYC_BIN=./node_modules/nyc/bin/nyc.js
  if [ -f "$NYC_BIN" ]; then
    $NYC_BIN report || true
  fi
  bash $KOKORO_GFILE_DIR/codecov.sh
else
  echo "coverage is only reported for Node $COVERAGE_NODE"
fi
