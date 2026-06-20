# Findings and Recommendations

## Critical Findings

### 1. LM Studio build currently fails

The LM Studio workspace includes backend Node files, React TSX files, CSS imports, and test files under one strict `tsconfig.json`.

Observed failure categories:

- React is imported but not declared as a dependency.
- JSX is used but `tsconfig.json` does not set `jsx`.
- Browser APIs such as `document`, `Blob`, `FileReader`, and DOM element types are used but `lib` excludes `DOM`.
- CSS files are imported from TSX but there is no bundler/type declaration setup for CSS modules/imports.
- Some LM Studio SDK usage in `settingsIntegration.ts` no longer matches installed SDK types.
- `settingsUI.test.ts` is included in production compilation and contains a partial override TypeScript rejects.

Recommendation:

Split the LM Studio workspace into separate build targets:

1. Backend target:
   - Include only backend/library files needed for Node output.
   - Exclude TSX, CSS, and test files.

2. Frontend/prototype target:
   - Add React, React DOM, type packages, JSX compiler options, DOM libs, and a bundler such as Vite/esbuild.
   - Serve or package it intentionally.

3. Test target:
   - Use a real test runner or exclude tests from production compile.

### 2. React settings UI backend route mismatch

`settingsUI.tsx` tests backend connectivity with:

```ts
fetch(`${apiUrl}/models`)
```

The backend exposes:

- `/v1/models`
- `/api/models`

Recommendation:

Change the tester to use `/v1/models` or `/api/models`, or add a compatibility route if `/models` is intended.

### 3. Settings integration appears to use stale SDK option names

`settingsIntegration.ts` constructs `LMStudioClient` with `host` and `port`, but the backend uses `baseUrl`. The TypeScript compiler rejects `host`.

It also passes model load options such as `contextLength` in a shape the installed SDK types reject.

Recommendation:

Align `settingsIntegration.ts` with the SDK usage already present in `index.ts`, or pin/update `@lmstudio/sdk` to the version those examples were written for.

### 4. Root README contains stale or simplified examples

Root and LM Studio README examples show:

```ts
await server.infer("Say hello in one sentence.");
```

That method exists, but broader README language implies both projects build successfully. Current verification shows LM Studio does not build.

Recommendation:

Update root docs after build stabilization, and distinguish:

- Implemented backend behavior.
- Prototype settings UI.
- Future roadmap.

## Medium Findings

### 5. Obsidian plugin only shows answer previews

Ask and summarize commands show `answer.slice(0, 250)` in an Obsidian notice. The full answer is not inserted into the note or shown in a persistent modal.

Recommendation:

Add commands for:

- Insert answer at cursor.
- Replace selection with answer.
- Open full answer in a modal.

### 6. Obsidian plugin "autoConnect" does not actually connect

When `autoConnect` is true, `onload()` creates a service and shows "LM Studio client ready." The actual SDK client is created lazily on first request.

This is not necessarily wrong, but the label is slightly misleading.

Recommendation:

Either:

- Rename behavior to "prepare client on startup", or
- Add an actual connection/model availability check.

### 7. No validation on Obsidian LM Studio URL

The setting accepts arbitrary text and recreates the service immediately.

Recommendation:

Add simple validation for empty values and unsupported schemes.

### 8. Backend error details are intentionally broad

Unknown errors expose `error.message` as `internal_error`. That is useful for local development, but if the backend is bound beyond localhost it may leak operational details.

Recommendation:

Keep default host as localhost. If remote binding is introduced, add a production-safe error mode.

### 9. Backend has no CORS handling

The built-in UI is served same-origin, so this is fine for that page. External browser clients will hit CORS restrictions.

Recommendation:

Only add CORS if there is a real external browser-client use case, and make allowed origins explicit.

### 10. Backend current model tracking is partial

`currentModels` is updated only when this wrapper loads/unloads models. If LM Studio state changes outside this backend, the tracked value may drift.

Recommendation:

Use `listLoadedModels()` or SDK active model resolution for live truth in user-facing endpoints.

## Low Findings

### 11. `textResponse` appears unused

It can be removed or kept for future text endpoints.

### 12. Duplicate helper scripts

PowerShell and Bash scripts share concepts but differ in implementation details. This is normal for cross-platform scripts, but it means future changes must be made twice.

Recommendation:

Keep the scripts, but document differences or route both through npm workspace scripts where practical.

### 13. Test suite is not integrated into npm scripts

`X-DEV-LM-Studio/package.json` has:

```json
"test": "echo \"Error: no test specified\" && exit 1"
```

But `settingsUI.test.ts` exports a test runner.

Recommendation:

Add a real test runner or a script that compiles/runs the test file in an isolated test tsconfig.

## Suggested Stabilization Plan

1. Fix LM Studio build boundary.
   - Exclude React UI and test files from backend `tsconfig`, or create separate `tsconfig.backend.json`.

2. Decide whether the React settings UI is production code or prototype code.
   - If production: add proper frontend dependencies and build scripts.
   - If prototype: move it under `examples/` or exclude from production compile.

3. Align `settingsIntegration.ts` with current `@lmstudio/sdk`.
   - Reuse `baseUrl` normalization and option mapping from `index.ts`.

4. Add tests for backend request readers and route behavior.
   - Start with pure validation helpers and request parsing.

5. Improve Obsidian output UX.
   - Add insert/replace/full modal options.
