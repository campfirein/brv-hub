const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { globSync } = require("glob");

const HUB_BASE_URL = "https://hub.byterover.dev";

// Cache GitHub user lookups to avoid duplicate API calls
const githubUserCache = new Map();

async function getGitAuthor(entryPath) {
  try {
    const result = execSync(
      `git log --diff-filter=A --no-merges --format='%aN|%aE' --reverse -- "${entryPath}" | head -1`,
      { encoding: "utf8", cwd: path.join(__dirname, "..") },
    ).trim();

    if (!result) return null;

    const [name, email] = result.split("|");

    // Try to extract GitHub username from noreply email
    // Format: <id>+<username>@users.noreply.github.com or <username>@users.noreply.github.com
    const noreplyMatch = email.match(
      /(?:\d+\+)?([^@]+)@users\.noreply\.github\.com/,
    );
    const username = noreplyMatch ? noreplyMatch[1] : name;

    return { username, email };
  } catch {
    return null;
  }
}

async function getPRAuthor(entryPath) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  try {
    const sha = execSync(
      `git log --diff-filter=A --no-merges --format='%H' --reverse -- "${entryPath}" | head -1`,
      { encoding: "utf8", cwd: path.join(__dirname, "..") },
    ).trim();

    if (!sha) return null;

    const repo = process.env.GITHUB_REPOSITORY || "byterover/brv-hub";
    const res = await fetch(
      `https://api.github.com/repos/${repo}/commits/${sha}/pulls`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      },
    );

    if (!res.ok) return null;

    const pulls = await res.json();
    if (pulls.length === 0) return null;

    return { username: pulls[0].user.login };
  } catch {
    return null;
  }
}

async function resolveGitHubAuthor(authorInfo) {
  if (!authorInfo) {
    return { username: "unknown", avatar_url: "https://github.com/ghost.png" };
  }

  const { username } = authorInfo;

  if (githubUserCache.has(username)) {
    return githubUserCache.get(username);
  }

  try {
    const res = await fetch(`https://api.github.com/users/${username}`);
    if (res.ok) {
      const data = await res.json();
      const author = {
        name: data.name || data.login,
        url: data.html_url,
        username: data.login,
        avatar_url: `https://avatars.githubusercontent.com/u/${data.id}?s=64&v=4`,
      };
      githubUserCache.set(username, author);
      return author;
    }
  } catch {
    // Fallback on API failure
  }

  const fallback = {
    name: authorInfo.username,
    url: `https://github.com/${username}`,
    username,
    avatar_url: `https://github.com/${username}.png`,
  };
  githubUserCache.set(username, fallback);
  return fallback;
}

const TYPE_DIR_MAP = {
  "agent-skill": "skills",
  bundle: "bundles",
};

const contentDirs = Object.values(TYPE_DIR_MAP);

async function main() {
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

      // Derive author from PR (reliable) or fall back to git history
      const prAuthor = await getPRAuthor(entryPath);
      const gitAuthor = prAuthor || (await getGitAuthor(entryPath));
      const author = await resolveGitHubAuthor(gitAuthor);

      const newEntry = {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        long_description: manifest.long_description || null,
        type: manifest.type,
        author,
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
}

main().catch((err) => {
  console.error(`\u274C Fatal error: ${err.message}`);
  process.exit(1);
});
