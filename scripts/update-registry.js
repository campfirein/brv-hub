const fs = require("fs");
const path = require("path");
const { globSync } = require("glob");

const HUB_BASE_URL = "https://hub.byterover.dev";

const TYPE_DIR_MAP = {
  "agent-skill": "skills",
  bundle: "bundles",
};

const contentDirs = Object.values(TYPE_DIR_MAP);
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

// Load existing registry to preserve timestamps
const registryPath = path.join(__dirname, "../registry.json");
let existingRegistry = null;
const existingEntries = new Map();
if (fs.existsSync(registryPath)) {
  try {
    existingRegistry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    for (const entry of existingRegistry.entries || []) {
      existingEntries.set(entry.id, entry);
    }
  } catch {
    // Ignore parse errors, will regenerate
  }
}

const now = new Date().toISOString();
const entries = [];

// Check if an entry's content has changed (ignoring timestamps)
function hasEntryChanged(newEntry, oldEntry) {
  if (!oldEntry) return true;
  const strip = ({ created_at, updated_at, ...rest }) => rest;
  return JSON.stringify(strip(newEntry)) !== JSON.stringify(strip(oldEntry));
}

for (const file of manifestFiles) {
  const fullPath = path.join(__dirname, "..", file);

  try {
    const manifest = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    const entryId = path.basename(path.dirname(fullPath));
    const parentDir = file.split("/")[0];

    if (manifest.id !== entryId) {
      console.warn(`\u26A0\uFE0F  Skipping ${file}: id mismatch`);
      continue;
    }

    // Scan directory for file tree (exclude manifest.json, README.md, and hidden files)
    const entryDir = path.dirname(fullPath);
    const entryPath = `${parentDir}/${entryId}`;
    const allFiles = globSync(`**/*`, {
      cwd: entryDir,
      nodir: true,
      dot: false,
    }).sort();
    const excludedFiles = new Set(["manifest.json", "README.md"]);
    const fileTree = allFiles
      .filter((f) => !excludedFiles.has(f))
      .map((f) => ({
        name: f,
        url: `${HUB_BASE_URL}/r/${entryPath}/${f}`,
      }));

    const existing = existingEntries.get(manifest.id);

    const newEntry = {
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      long_description: manifest.long_description || null,
      type: manifest.type,
      author: manifest.author,
      license: manifest.license || "MIT",
      tags: manifest.tags,
      category: manifest.category,
      path: entryPath,
      path_url: `${HUB_BASE_URL}/${entryId}`,
      manifest_url: `${HUB_BASE_URL}/v/${entryPath}/manifest.json`,
      readme_url: `${HUB_BASE_URL}/v/${entryPath}/README.md`,
      file_tree: fileTree,
      created_at: existing?.created_at || now,
      updated_at: existing?.updated_at || now,
      dependencies: manifest.dependencies || [],
      metadata: manifest.metadata || null,
    };

    if (hasEntryChanged(newEntry, existing)) {
      newEntry.updated_at = now;
    }

    entries.push(newEntry);
  } catch (err) {
    console.error(`\u274C Error processing ${file}: ${err.message}`);
  }
}

entries.sort((a, b) => a.name.localeCompare(b.name));

const registry = {
  version: "1.0.0",
  generated_at: existingRegistry?.generated_at || now,
  count: entries.length,
  entries,
};

// Only update generated_at if content actually changed
const existingOutput = existingRegistry
  ? JSON.stringify({ ...existingRegistry, generated_at: "" })
  : null;
const newOutput = JSON.stringify({ ...registry, generated_at: "" });

if (existingOutput !== newOutput) {
  registry.generated_at = now;
}

fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));

console.log(`\u2705 Registry updated: ${entries.length} entries`);

// Print stats
const byType = {};
const byCategory = {};

for (const entry of entries) {
  byType[entry.type] = (byType[entry.type] || 0) + 1;
  byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;
}

console.log("\nStats:");
console.log(`  Total: ${entries.length}`);
console.log("  By type:", byType);
console.log("  By category:", byCategory);
