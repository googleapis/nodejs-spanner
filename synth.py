import synthtool as s
import synthtool.gcp as gcp
import logging
from pathlib import Path
import subprocess

logging.basicConfig(level=logging.DEBUG)

gapic = gcp.GAPICGenerator()

spanner = gapic.node_library(
    'spanner', 'v1',
    config_path='/google/spanner/artman_spanner.yaml')

spanner_admin_database = gapic.node_library(
    'spanner-admin-database', 'v1',
    config_path='/google/spanner/admin/database/artman_spanner_admin_database.yaml')

spanner_admin_instance = gapic.node_library(
    'spanner-admin-instance', 'v1',
    config_path='/google/spanner/admin/instance/artman_spanner_admin_instance.yaml')

# Copy all files except for 'README.md' and 'package.json'
s.copy(spanner, excludes=["src/index.js", "README.md", "package.json"])
s.copy(spanner_admin_database, excludes=["src/v1/index.js", "src/index.js", "README.md", "package.json"])
s.copy(spanner_admin_instance, excludes=["src/v1/index.js", "src/index.js", "README.md", "package.json"])

common_templates = gcp.CommonTemplates()
templates = common_templates.node_library()
s.copy(templates)

# nodejs-spanner is composed of 3 APIs: SpannerClient, SpannerAdminDatabase and
# SpannerAdminInstance, export all 3 in src/v1/index.js
s.replace(
    "src/v1/index.js",
    "(const SpannerClient = require\('\./spanner_client\'\);)",
    """const DatabaseAdminClient = require('./database_admin_client');
const InstanceAdminClient = require('./instance_admin_client');
\g<1>""")

s.replace(
    "src/v1/index.js",
    "(module\.exports\.SpannerClient = SpannerClient;)",
    """module.exports.DatabaseAdminClient = DatabaseAdminClient;
module.exports.InstanceAdminClient = InstanceAdminClient;
\g<1>""")


# '''
# Node.js specific cleanup
# '''
subprocess.run(['npm', 'install'])
subprocess.run(['npm', 'run', 'prettier'])
subprocess.run(['npm', 'run', 'lint'])
