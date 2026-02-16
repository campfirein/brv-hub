const fs = require("fs");
const path = require("path");
const { globSync } = require("glob");

const REPO_BASE_URL =
  "https://raw.githubusercontent.com/campfirein/brv-hub/main";
const GITHUB_TREE_URL = "https://github.com/campfirein/brv-hub/tree/main";
const GITHUB_BLOB_URL = "https://github.com/campfirein/brv-hub/blob/main";

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

const entries = [];

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

    // Scan directory for file tree (exclude manifest.json itself and hidden files)
    const entryDir = path.dirname(fullPath);
    const entryPath = `${parentDir}/${entryId}`;
    const allFiles = globSync(`**/*`, {
      cwd: entryDir,
      nodir: true,
      dot: false,
    }).sort();
    const fileTree = allFiles.map((f) => ({
      name: f,
      url: `${GITHUB_BLOB_URL}/${entryPath}/${f}`,
    }));

    entries.push({
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      type: manifest.type,
      author: manifest.author.name,
      tags: manifest.tags,
      category: manifest.category,
      path: entryPath,
      path_url: `${GITHUB_TREE_URL}/${entryPath}`,
      content_url: `${REPO_BASE_URL}/${entryPath}/${manifest.files.main}`,
      manifest_url: `${REPO_BASE_URL}/${entryPath}/manifest.json`,
      readme_url: `${REPO_BASE_URL}/${entryPath}/${manifest.files.readme}`,
      file_tree: fileTree,
      created_at: manifest.created_at || new Date().toISOString(),
      updated_at: manifest.updated_at || new Date().toISOString(),
      compatibility: manifest.compatibility || null,
      metadata: manifest.metadata || null,
    });
  } catch (err) {
    console.error(`\u274C Error processing ${file}: ${err.message}`);
  }
}

entries.sort((a, b) => a.name.localeCompare(b.name));

const registry = {
  version: "1.0.0",
  generated_at: new Date().toISOString(),
  count: entries.length,
  entries,
};

const registryPath = path.join(__dirname, "../registry.json");
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
