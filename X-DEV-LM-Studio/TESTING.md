# Testing Guide

## Current Test Suite

### Backend Parser Tests

Located in `src/__tests__/backend.test.ts`

Tests for request validation helpers:
- `getString()` - Required string validation
- `getOptionalString()` - Optional string parsing
- `getOptionalBoolean()` - Boolean flag parsing
- `getOptionalNumber()` - Numeric parameter parsing
- `normalizeBaseUrl()` - WebSocket URL conversion
- `isRecord()` - Type guard for plain objects

**Run tests:**

```bash
# Install tsx if needed
npm install -g tsx

# Run tests
npx tsx src/__tests__/backend.test.ts
```

**Expected output:**
```
========== Backend Parser Tests ==========

✅ getString accepts non-empty string
✅ getString trims whitespace
...
✅ isRecord rejects Date objects

========== Results ==========
Passed: 24
Failed: 0
Total: 24
```

## Expanded Testing Strategy

### Phase 1: Extract and Export Helpers (Recommended)

Currently, test helpers are duplicated. To improve maintainability:

1. **Extract helpers into `src/helpers.ts`:**
   ```typescript
   export function isRecord(value: unknown): value is Record<string, unknown> { ... }
   export function getString(value: unknown, field: string): string { ... }
   // etc.
   ```

2. **Import in `index.ts`:**
   ```typescript
   import { isRecord, getString, ... } from './helpers';
   ```

3. **Import in tests:**
   ```typescript
   import { isRecord, getString, ... } from '../helpers';
   ```

### Phase 2: Add Jest/Vitest (For CI/Automated Testing)

1. **Install test framework:**
   ```bash
   npm install --save-dev vitest @vitest/ui
   ```

2. **Add `vitest.config.ts`:**
   ```typescript
   import { defineConfig } from 'vitest/config';
   export default defineConfig({
     test: {
       include: ['src/__tests__/**/*.test.ts'],
     },
   });
   ```

3. **Update `package.json`:**
   ```json
   {
     "scripts": {
       "test": "vitest run",
       "test:watch": "vitest",
       "test:coverage": "vitest run --coverage"
     }
   }
   ```

### Phase 3: Add Route Integration Tests

Once helpers are extracted, add tests for:
- Request body parsing (`readJsonBody`, `readCompleteRequest`, etc.)
- Error handling (`toSerializableError`)
- Model configuration validation
- Built-in tool selection

Example:
```typescript
test('readCompleteRequest requires prompt field', () => {
  const result = readCompleteRequest({});
  expect(() => result).toThrow('prompt');
});
```

### Phase 4: Add End-to-End Tests

Test actual HTTP endpoints:
- `GET /health` → 200 with service info
- `POST /v1/completions` with mock model → 200 with response
- `POST /v1/chat/completions` → 200 with chat response
- Error cases: 400 for missing fields, 500 for server errors

## Settings UI Tests

The React settings UI has hand-written tests in `examples/settings-ui-react/settingsUI.test.ts`.

If building the React UI, integrate with Jest or Vitest:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

Then run:
```bash
npm test -w X-DEV-LM-Studio
```

## Next Steps

1. **Immediate:** Run manual backend tests to verify validators work
2. **Short-term:** Extract helpers to `src/helpers.ts` and add Jest
3. **Medium-term:** Add route and integration tests
4. **Long-term:** Consider end-to-end testing with testcontainers or Docker
