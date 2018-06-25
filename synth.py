import synthtool as s
import synthtool.gcp as gcp
import logging
from pathlib import Path
import subprocess

logging.basicConfig(level=logging.DEBUG)

gapic = gcp.GAPICGenerator()

# tasks has two product names, and a poorly named artman yaml
v2beta2_library = gapic._generate_code(
    'spanner', 'v1', 'nodejs',
    config_path='/google/spanner/artman_spanner.yaml')

# Copy all files except for 'README.md' and 'package.json'
s.copy(v2beta2_library / 'src/v1', excludes="src/v1/index.js")

# '''
# Node.js specific cleanup
# '''
# # prettify and lint
subprocess.run(['npm', 'run', 'prettier'])
subprocess.run(['npm', 'run', 'lint'])
