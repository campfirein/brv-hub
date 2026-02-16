## Description

Brief description of the content being added or changed.

## Type

- [ ] Agent Skill (`skills/`)
- [ ] Bundle (`bundles/`)

## Checklist

- [ ] `manifest.json` is valid and follows the [Manifest Specification](./docs/manifest-spec.md)
- [ ] `README.md` is included with usage instructions
- [ ] All files referenced in `manifest.json` exist
- [ ] `id` in manifest matches the directory name
- [ ] `name` is unique (not used by any existing entry)
- [ ] `type` matches the directory (`agent-skill` → `skills/`, `bundle` → `bundles/`)
- [ ] `npm run validate` passes locally
