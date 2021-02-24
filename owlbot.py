# Copyright 2021 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import synthtool as s
import synthtool.gcp as gcp
import synthtool.languages.node as node
import logging
from pathlib import Path
from synthtool import _tracked_paths
import shutil

staging = Path("owl-bot-staging")

if staging.is_dir():
    logging.info(f"Copying files from staging directory ${staging}.")

    # nodejs-spanner is composed of 3 APIs: SpannerClient, SpannerAdminDatabase and
    # SpannerAdminInstance, all 3 are exported in src/v1/index.js
    # Excluding auto-generated system test since Spanner has its own packing test
    excludes=["src/index.ts", "src/v1/index.ts", "README.md", "package.json",
            "system-test/*", "system-test/fixtures/sample/*", "system-test/fixtures/sample/src/*",
            "tsconfig.json"]

    # Copy spanner library.
    for version in ['v1']:
        library = staging / version
        _tracked_paths.add(library)
        s.copy([library], excludes=excludes)

    excludes += ["webpack.config.js", ".jsdoc.js"]

    # Copy the admin/database library.
    for version in ['v1']:
        library = staging / 'admin' / 'database' / version
        _tracked_paths.add(library)
        s.copy([library], excludes=excludes)

    # Copy the admin/instance library.
    for version in ['v1']:
        library = staging / 'admin' / 'instance' / version
        _tracked_paths.add(library)
        s.copy([library], excludes=excludes)

    # The staging directory should never be merged into the main branch.
    shutil.rmtree(staging)

common_templates = gcp.CommonTemplates()
templates = common_templates.node_library(source_location='build/src')
s.copy(templates)

node.postprocess_gapic_library_hermetic()