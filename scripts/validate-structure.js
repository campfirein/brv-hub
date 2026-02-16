const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const TYPE_DIR_MAP = {
  'agent-skill': 'skills',
  'bundle': 'bundles'
};

const contentDirs = Object.values(TYPE_DIR_MAP);
const manifestFiles = [];

for (const dir of contentDirs) {
  const dirPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(dirPath)) {
    manifestFiles.push(...globSync(`${dir}/*/manifest.json`, { cwd: path.join(__dirname, '..') }));
  }
}

if (manifestFiles.length === 0) {
  console.log('No manifests found. Nothing to validate.');
  process.exit(0);
}

let allValid = true;

for (const file of manifestFiles) {
  const fullPath = path.join(__dirname, '..', file);
  let manifest;

  try {
    manifest = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch {
    continue; // validate-manifest.js handles parse errors
  }

  // Check type-to-directory mapping
  const parentDir = file.split('/')[0];
  const expectedDir = TYPE_DIR_MAP[manifest.type];

  if (!expectedDir) {
    console.error(`\u274C Unknown type "${manifest.type}" in ${file}`);
    allValid = false;
    continue;
  }

  if (parentDir !== expectedDir) {
    console.error(`\u274C Type mismatch in ${file}: type "${manifest.type}" should be in "${expectedDir}/" but found in "${parentDir}/"`);
    allValid = false;
    continue;
  }

  // Check that all referenced files exist
  const entryDir = path.dirname(fullPath);
  const missingFiles = [];

  if (manifest.files) {
    for (const [key, value] of Object.entries(manifest.files)) {
      if (Array.isArray(value)) {
        for (const f of value) {
          if (!fs.existsSync(path.join(entryDir, f))) {
            missingFiles.push(f);
          }
        }
      } else if (typeof value === 'string') {
        if (!fs.existsSync(path.join(entryDir, value))) {
          missingFiles.push(value);
        }
      }
    }
  }

  if (missingFiles.length > 0) {
    console.error(`\u274C Missing files in ${file}: ${missingFiles.join(', ')}`);
    allValid = false;
    continue;
  }

  console.log(`\u2705 Structure OK: ${manifest.id} (${manifest.type} \u2192 ${parentDir}/)`);
}

if (!allValid) {
  console.error('\nStructure validation failed.');
  process.exit(1);
}

console.log(`\n\u2705 All ${manifestFiles.length} entries have valid structure.`);
