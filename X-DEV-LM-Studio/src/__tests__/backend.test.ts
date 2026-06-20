/**
 * Backend Request Parser Tests
 * Simple unit tests for validation helpers in index.ts
 *
 * Run with: npx tsx src/__tests__/backend.test.ts
 * Or integrate with Jest/Vitest for automated CI testing
 */

// Mock the request parser functions from index.ts
// These would be extracted and exported from index.ts for testability

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    results.push({ name, passed: true });
  } catch (error) {
    results.push({ name, passed: false, error: String(error) });
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
}

// Test Helpers (extracted from backend)
function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
}

function getString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function getOptionalString(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function getOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value !== "boolean") return undefined;
  return value;
}

function getOptionalNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !isFinite(value)) return undefined;
  return value;
}

function normalizeBaseUrl(apiUrl: string): string {
  apiUrl = apiUrl.trim().replace(/\/$/, "");

  if (apiUrl.startsWith("ws://") || apiUrl.startsWith("wss://")) return apiUrl;
  if (apiUrl.startsWith("https://")) return "wss://" + apiUrl.slice(8);
  if (apiUrl.startsWith("http://")) return "ws://" + apiUrl.slice(7);

  return "ws://" + apiUrl;
}

// Tests: String Validation
test("getString accepts non-empty string", () => {
  assertEqual(getString("hello", "name"), "hello", "Should return trimmed string");
});

test("getString trims whitespace", () => {
  assertEqual(getString("  hello  ", "name"), "hello", "Should trim whitespace");
});

test("getString rejects empty string", () => {
  try {
    getString("", "name");
    throw new Error("Should have thrown");
  } catch (e) {
    assert(String(e).includes("non-empty"), "Should mention non-empty");
  }
});

test("getString rejects non-string", () => {
  try {
    getString(123 as unknown, "name");
    throw new Error("Should have thrown");
  } catch (e) {
    assert(String(e).includes("non-empty"), "Should mention non-empty");
  }
});

// Tests: Optional String Validation
test("getOptionalString accepts non-empty string", () => {
  assertEqual(getOptionalString("hello"), "hello", "Should return string");
});

test("getOptionalString returns undefined for null", () => {
  assertEqual(getOptionalString(null), undefined, "Should return undefined");
});

test("getOptionalString returns undefined for empty string", () => {
  assertEqual(getOptionalString(""), undefined, "Should return undefined");
});

test("getOptionalString returns undefined for whitespace", () => {
  assertEqual(getOptionalString("   "), undefined, "Should return undefined");
});

test("getOptionalString returns undefined for non-string", () => {
  assertEqual(getOptionalString(123 as unknown), undefined, "Should return undefined");
});

// Tests: Optional Boolean Validation
test("getOptionalBoolean accepts true", () => {
  assertEqual(getOptionalBoolean(true), true, "Should return true");
});

test("getOptionalBoolean accepts false", () => {
  assertEqual(getOptionalBoolean(false), false, "Should return false");
});

test("getOptionalBoolean returns undefined for non-boolean", () => {
  assertEqual(getOptionalBoolean("true" as unknown), undefined, "Should return undefined");
  assertEqual(getOptionalBoolean(1 as unknown), undefined, "Should return undefined");
  assertEqual(getOptionalBoolean(null), undefined, "Should return undefined");
});

// Tests: Optional Number Validation
test("getOptionalNumber accepts integer", () => {
  assertEqual(getOptionalNumber(42), 42, "Should return number");
});

test("getOptionalNumber accepts float", () => {
  assertEqual(getOptionalNumber(3.14), 3.14, "Should return float");
});

test("getOptionalNumber rejects Infinity", () => {
  assertEqual(getOptionalNumber(Infinity), undefined, "Should reject Infinity");
});

test("getOptionalNumber rejects NaN", () => {
  assertEqual(getOptionalNumber(NaN), undefined, "Should reject NaN");
});

test("getOptionalNumber returns undefined for non-number", () => {
  assertEqual(getOptionalNumber("42" as unknown), undefined, "Should return undefined");
  assertEqual(getOptionalNumber(null), undefined, "Should return undefined");
});

// Tests: URL Normalization
test("normalizeBaseUrl converts http to ws", () => {
  assertEqual(
    normalizeBaseUrl("http://localhost:1234"),
    "ws://localhost:1234",
    "Should convert http to ws"
  );
});

test("normalizeBaseUrl converts https to wss", () => {
  assertEqual(
    normalizeBaseUrl("https://example.com"),
    "wss://example.com",
    "Should convert https to wss"
  );
});

test("normalizeBaseUrl preserves ws", () => {
  assertEqual(
    normalizeBaseUrl("ws://localhost:1234"),
    "ws://localhost:1234",
    "Should preserve ws"
  );
});

test("normalizeBaseUrl preserves wss", () => {
  assertEqual(
    normalizeBaseUrl("wss://example.com"),
    "wss://example.com",
    "Should preserve wss"
  );
});

test("normalizeBaseUrl adds ws to bare host", () => {
  assertEqual(normalizeBaseUrl("localhost:1234"), "ws://localhost:1234", "Should add ws prefix");
});

test("normalizeBaseUrl removes trailing slash", () => {
  assertEqual(normalizeBaseUrl("http://localhost:1234/"), "ws://localhost:1234", "Should remove slash");
});

// Tests: Record Type Guard
test("isRecord identifies plain objects", () => {
  assert(isRecord({}), "Should identify empty object");
  assert(isRecord({ key: "value" }), "Should identify object with properties");
});

test("isRecord rejects arrays", () => {
  assert(!isRecord([]), "Should reject array");
  assert(!isRecord([1, 2, 3]), "Should reject array");
});

test("isRecord rejects null and primitives", () => {
  assert(!isRecord(null), "Should reject null");
  assert(!isRecord(undefined), "Should reject undefined");
  assert(!isRecord("string"), "Should reject string");
  assert(!isRecord(42), "Should reject number");
  assert(!isRecord(true), "Should reject boolean");
});

test("isRecord rejects Date objects", () => {
  assert(!isRecord(new Date()), "Should reject Date");
});

// Report results
console.log("\n========== Backend Parser Tests ==========\n");

let passed = 0;
let failed = 0;

for (const result of results) {
  if (result.passed) {
    console.log(`✅ ${result.name}`);
    passed++;
  } else {
    console.log(`❌ ${result.name}`);
    console.log(`   Error: ${result.error}`);
    failed++;
  }
}

console.log(`\n========== Results ==========`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${results.length}`);

if (failed > 0) {
  process.exit(1);
}
