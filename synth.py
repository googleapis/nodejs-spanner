import synthtool as s
import synthtool.gcp as gcp
import synthtool.languages.node as node
import logging
from pathlib import Path

logging.basicConfig(level=logging.DEBUG)

AUTOSYNTH_MULTIPLE_COMMITS = True

gapic = gcp.GAPICBazel()

spanner = gapic.node_library('spanner', 'v1', proto_path='google/spanner/v1')

spanner_admin_database = gapic.node_library('admin-database', 'v1', proto_path='google/spanner/admin/database/v1')

spanner_admin_instance = gapic.node_library('admin-instance', 'v1', proto_path='google/spanner/admin/instance/v1')

# nodejs-spanner is composed of 3 APIs: SpannerClient, SpannerAdminDatabase and
# SpannerAdminInstance, all 3 are exported in src/v1/index.js
# Excluding auto-generated system test since Spanner has its own packing test
excludes=["src/index.ts", "src/v1/index.ts", "README.md", "package.json",
          "system-test/*", "system-test/fixtures/sample/*", "system-test/fixtures/sample/src/*",
          "tsconfig.json"]
s.copy(spanner, excludes=excludes)
s.copy(spanner_admin_database, excludes=excludes+["webpack.config.js", ".jsdoc.js"])
s.copy(spanner_admin_instance, excludes=excludes+["webpack.config.js", ".jsdoc.js"])

common_templates = gcp.CommonTemplates()
templates = common_templates.node_library(source_location='build/src')
s.copy(templates)

node.postprocess_gapic_library()
