# Contributing to BRV Hub

## How to Submit

1. **Fork** this repository
2. **Create a directory** for your content:
   - Agent skills go in `skills/<your-skill-id>/`
   - Bundles go in `bundles/<your-bundle-id>/`
3. **Add required files:**
   - `manifest.json` — metadata (see [Manifest Spec](./manifest-spec.md))
   - `README.md` — usage documentation
   - Main content file (`SKILL.md` for skills, `context.md` for bundles)
4. **Open a Pull Request**

## Directory Naming

- Use kebab-case: `my-cool-skill`, not `myCoolSkill`
- 3-64 characters, no consecutive hyphens
- Must match the `id` field in your `manifest.json`

## Naming Rules

- The `id` field **must** match the directory name exactly
- The `name` field **must** be unique across all entries (skills and bundles)
- No two entries can share the same `id` or `name`

## Manifest Requirements

Your `manifest.json` must include:

| Field | Description |
|-------|-------------|
| `id` | Matches directory name, kebab-case, unique |
| `name` | Human-readable name, unique across all entries |
| `version` | Semver (e.g. `1.0.0`) |
| `description` | Description of what the entry does, max 1024 chars |
| `type` | `agent-skill` or `bundle` |
| `author` | Object with `name` (required), `email` and `url` (optional) |
| `tags` | 1-10 search tags |
| `category` | See categories below |

Optional fields: `long_description`, `license`, `dependencies`, `metadata`, `created_at`, `updated_at`. See the full [Manifest Spec](./manifest-spec.md).

## Categories

`productivity` `code-quality` `testing` `documentation` `refactoring` `debugging` `deployment` `analysis` `security` `learning`

## Validation

Before submitting, validate locally:

```bash
npm install
npm run validate
```

This checks:
- Schema compliance (required fields, types, formats)
- `id` matches directory name
- `type` matches parent directory (`agent-skill` in `skills/`, `bundle` in `bundles/`)
- No duplicate `id` or `name` across all entries
- Required files (`README.md`, `manifest.json`) exist in each entry directory

## Review Process

1. Automated validation runs on your PR
2. A maintainer reviews your submission
3. Once approved, your content is merged and the registry is updated
