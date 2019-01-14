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
templates = common_templates.node_library(source_location='build/src')
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

# Update path discovery due to build/ dir and TypeScript conversion.
s.replace("src/v1/database_admin_client.js", "../../package.json", "../../../package.json")
s.replace("src/v1/instance_admin_client.js", "../../package.json", "../../../package.json")
s.replace("src/v1/spanner_client.js", "../../package.json", "../../../package.json")


# [START fix-dead-link]
s.replace('**/doc/google/protobuf/doc_timestamp.js',
        'https:\/\/cloud\.google\.com[\s\*]*http:\/\/(.*)[\s\*]*\)',
        r"https://\1)")

s.replace('**/doc/google/protobuf/doc_timestamp.js',
        'toISOString\]',
        'toISOString)')

# Fix a dead link issue with specifying regex in comments that looks
# similar to a Markdown link.
s.replace("src/v1/doc/google/spanner/**/doc_spanner*.js",
    "`\[a-z\]\(https:\/\/cloud\.google\.com\[-a-z0-9\]\*\[a-z0-9\]\)\?`",
    "`\[a-z]([-a-z0-9]*[a-z0-9])?`")

s.replace("src/v1/doc/google/spanner/**/doc_spanner*.js",
    "`\(\[a-z\]\(https:\/\/cloud\.google\.com\[-a-z0-9\]\*\[a-z0-9\]\)\?\)\?`",
    "`(\[a-z]([-a-z0-9]*[a-z0-9])?)?`")
# [END fix-dead-link]

# '''
# Node.js specific cleanup
# '''
subprocess.run(['npm', 'install'])
subprocess.run(['npm', 'run', 'fix'])
