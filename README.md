# BRV Hub

Community-driven hub for AI coding agent content.

Browse, search, and install pre-built agent skills, context bundles, and more — all powered by GitHub with zero backend infrastructure.

## Structure

```
brv-hub/
├── skills/       Agent skills (type: agent-skill)
├── bundles/      Context bundles (type: bundle)
├── schemas/      JSON Schema for manifest validation
├── scripts/      Registry and validation tooling
└── registry.json Auto-generated content catalog
```

## Content Types

| Type | Directory | Description |
|------|-----------|-------------|
| `agent-skill` | `skills/` | Reusable skills for AI coding agents |
| `bundle` | `bundles/` | Context packs, knowledge bundles |

## Web UI

Browse the registry at the [BRV Hub website](https://campfirein.github.io/brv-hub/) (GitHub Pages).

To enable GitHub Pages on your fork: Settings > Pages > Source: Deploy from branch `main`, directory `/` (root).

## Quick Start

```bash
npm install
npm run validate    # validate all manifests and structure
npm run dev         # preview the registry website locally
```

## Contributing

Want to share your content? See the [Contributing Guide](./docs/contributing.md).

Key rules:
- `id` must match the directory name and be unique
- `name` must be unique across all entries
- Run `npm run validate` before submitting

## Documentation

- [Manifest Specification](./docs/manifest-spec.md)
- [Contributing Guide](./docs/contributing.md)

## License

[MIT](./LICENSE)
