

## Fix: Dev Server Not Starting After Cursor Push

### Root Cause

The Cursor push added a `bun.lock` file to the repo. The Lovable build system sees this and tries to use Bun as the package manager, but can't resolve the dev command properly. A `lovable.toml` configuration file is needed to explicitly tell the platform how to run the project.

### Fix

**Create `lovable.toml`** at the project root with:

```toml
[run]
dev = "npx vite --host 0.0.0.0 --port 8080"
```

This explicitly tells the Lovable platform which command to use for the dev server, bypassing the package manager detection confusion caused by the `bun.lock` file.

That's the only change needed — `package.json`, `vite.config.ts`, and all source files are intact and correct.

