import synthtool as s
import synthtool.gcp as gcp
import logging
from pathlib import Path
import subprocess

logging.basicConfig(level=logging.DEBUG)

AUTOSYNTH_MULTIPLE_COMMITS = True

gapic = gcp.GAPICMicrogenerator()

spanner = gapic.typescript_library(
    'spanner', 'v1',
    proto_path='google/spanner/v1',
    generator_args={
      'grpc-service-config': 'google/spanner/v1/spanner_grpc_service_config.json',
      'main-service': 'spanner'
    }
)

spanner_admin_database = gapic.typescript_library(
    'spanner-admin-database', 'v1',
    proto_path='google/spanner/admin/database/v1',
    generator_args={
      'grpc-service-config': 'google/spanner/admin/database/v1/spanner_admin_database_grpc_service_config.json'
    }
)

spanner_admin_instance = gapic.typescript_library(
    'spanner-admin-instance', 'v1',
    proto_path='google/spanner/admin/instance/v1',
    generator_args={
      'grpc-service-config': 'google/spanner/admin/instance/v1/spanner_admin_instance_grpc_service_config.json'
    }
)

# nodejs-spanner is composed of 3 APIs: SpannerClient, SpannerAdminDatabase and
# SpannerAdminInstance, all 3 are exported in src/v1/index.js
# Excluding auto-generated system test since Spanner has its own packing test
excludes=["src/index.ts", "src/v1/index.ts", "README.md", "package.json",
          "system-test/*", "system-test/fixtures/sample/*", "system-test/fixtures/sample/src/*",
          "tsconfig.json"]
s.copy(spanner, excludes=excludes)
s.copy(spanner_admin_database, excludes=excludes+["webpack.config.js"])
s.copy(spanner_admin_instance, excludes=excludes+["webpack.config.js"])

common_templates = gcp.CommonTemplates()
templates = common_templates.node_library(source_location='build/src')
s.copy(templates)

# '''
# Node.js specific cleanup
# '''
subprocess.run(['npm', 'install'])
subprocess.run(['npm', 'run', 'fix'])
subprocess.run(['npx', 'compileProtos', 'src'])
