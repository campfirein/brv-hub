# TypeScript Project Context

## tsconfig.json Best Practices

Use `"strict": true` as a baseline. Key compiler options:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

## Project Structure

```
project/
├── src/
│   ├── index.ts          Entry point
│   ├── types/            Type definitions
│   └── utils/            Utility functions
├── tests/
├── tsconfig.json
├── package.json
└── .gitignore
```

## Common Utility Types

```typescript
// Make specific properties optional
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Make specific properties required
type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// Extract non-nullable properties
type NonNullableFields<T> = { [K in keyof T]: NonNullable<T[K]> };
```

## Recommended Tooling

- **Build**: `tsc` for libraries, `tsup` or `esbuild` for applications
- **Linting**: `eslint` with `@typescript-eslint/parser`
- **Formatting**: `prettier`
- **Testing**: `vitest` (native TypeScript support)
- **Package manager**: `pnpm` for monorepos, `npm` for single packages

## Error Handling Pattern

```typescript
class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```
