# Manifest Specification v1.0

Every entry in BRV Hub requires a `manifest.json` file.

## Required Fields

### `id` (string)
Unique identifier in kebab-case. Must match the directory name. Must be unique across all entries.
- Pattern: `^[a-z0-9]([a-z0-9]|-(?!-))*[a-z0-9]$` (no consecutive hyphens)
- Length: 3-64 characters

### `name` (string)
Human-readable name, 3-100 characters. Must be unique across all entries.

### `version` (string)
Semantic version: `MAJOR.MINOR.PATCH` (e.g. `1.0.0`).

### `description` (string)
Description of what this entry does and when to use it, max 1024 characters.

### `type` (string)
Content type. Determines which directory the entry belongs in.

| Type | Directory |
|------|-----------|
| `agent-skill` | `skills/` |
| `bundle` | `bundles/` |

### `author` (object)
- `name` (string, required)
- `email` (string, optional)
- `url` (string, optional)

### `tags` (array)
1-10 string tags for search and discovery.

### `category` (string)
One of: `productivity`, `code-quality`, `testing`, `documentation`, `refactoring`, `debugging`, `deployment`, `analysis`, `security`, `learning`.

## Optional Fields

### `long_description` (string)
Detailed description without character limit.

### `license` (string)
License identifier. Defaults to `MIT`.

### `dependencies` (array)
IDs of other BRV Hub entries this depends on.

### `metadata` (object)
Arbitrary key-value mapping for additional metadata. The following keys are documented conventions:
- `use_cases` (array of strings)

### `created_at` (string)
ISO 8601 timestamp.

### `updated_at` (string)
ISO 8601 timestamp.

## Example

```json
{
  "id": "code-review",
  "name": "Code Review Assistant",
  "version": "1.0.0",
  "description": "Comprehensive code review skill for pull requests and code changes",
  "type": "agent-skill",
  "author": {
    "name": "BRV Hub Team",
    "url": "https://github.com/campfirein"
  },
  "tags": ["code-review", "quality", "security"],
  "category": "code-quality"
}
```
