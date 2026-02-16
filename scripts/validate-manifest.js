const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const fs = require("fs");
const path = require("path");
const { globSync } = require("glob");

const schema = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../schemas/manifest.schema.json"),
    "utf8",
  ),
);

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const contentDirs = ["skills", "bundles"];
const manifestFiles = [];

for (const dir of contentDirs) {
  const dirPath = path.join(__dirname, "..", dir);
  if (fs.existsSync(dirPath)) {
    manifestFiles.push(
      ...globSync(`${dir}/*/manifest.json`, {
        cwd: path.join(__dirname, ".."),
      }),
    );
  }
}

if (manifestFiles.length === 0) {
  console.log("No manifests found. Nothing to validate.");
  process.exit(0);
}

let allValid = true;
const seenIds = new Map();
const seenNames = new Map();

for (const file of manifestFiles) {
  const fullPath = path.join(__dirname, "..", file);
  let manifest;

  try {
    manifest = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch (err) {
    console.error(`\u274C Failed to parse ${file}: ${err.message}`);
    allValid = false;
    continue;
  }

  const valid = validate(manifest);

  if (!valid) {
    console.error(`\u274C Validation failed for ${file}:`);
    for (const err of validate.errors) {
      console.error(`   ${err.instancePath || "/"} ${err.message}`);
    }
    allValid = false;
    continue;
  }

  // Check that id matches directory name
  const dirName = path.basename(path.dirname(fullPath));
  if (manifest.id !== dirName) {
    console.error(
      `\u274C ID mismatch in ${file}: manifest id "${manifest.id}" does not match directory "${dirName}"`,
    );
    allValid = false;
    continue;
  }

  // Check ID uniqueness
  if (seenIds.has(manifest.id)) {
    console.error(
      `\u274C Duplicate ID "${manifest.id}" in ${file} (already seen in ${seenIds.get(manifest.id)})`,
    );
    allValid = false;
    continue;
  }

  // Check name uniqueness
  if (seenNames.has(manifest.name)) {
    console.error(
      `\u274C Duplicate name "${manifest.name}" in ${file} (already seen in ${seenNames.get(manifest.name)})`,
    );
    allValid = false;
    continue;
  }

  seenIds.set(manifest.id, file);
  seenNames.set(manifest.name, file);
  console.log(`\u2705 Valid: ${manifest.name} v${manifest.version} (${file})`);
}

if (!allValid) {
  console.error("\nValidation failed.");
  process.exit(1);
}

console.log(`\n\u2705 All ${manifestFiles.length} manifests are valid.`);
