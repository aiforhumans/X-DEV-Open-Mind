/**
 * Settings UI Tests
 * Comprehensive test suite for the LM Studio Settings Testing UI
 */

import { validateSettings, createDefaultSettings, SettingsManager } from "./settingsIntegration";
import type { ExportedSettings } from "./settingsIntegration";

// Test utilities
const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
};

const testGroup = (name: string, fn: () => void | Promise<void>) => {
  console.log(`\n📋 ${name}`);
  try {
    fn();
    console.log(`✓ ${name} passed`);
  } catch (error) {
    console.error(`✗ ${name} failed:`, error);
    throw error;
  }
};

// ============================================================================
// VALIDATION TESTS
// ============================================================================

const testValidation = () => {
  testGroup("Validate default settings", () => {
    const settings = createDefaultSettings();
    const validation = validateSettings(settings);
    assert(validation.isValid, "Default settings should be valid");
    assert(validation.errors.length === 0, "Should have no errors");
  });

  testGroup("Reject missing model name", () => {
    const settings = createDefaultSettings();
    settings.model.name = "";
    const validation = validateSettings(settings);
    assert(!validation.isValid, "Should reject empty model name");
    assert(validation.errors.length > 0, "Should have validation errors");
  });

  testGroup("Reject invalid temperature", () => {
    const settings = createDefaultSettings();
    settings.inference.temperature = 3; // Out of range
    const validation = validateSettings(settings);
    assert(!validation.isValid, "Should reject temperature > 2");
  });

  testGroup("Reject invalid topP", () => {
    const settings = createDefaultSettings();
    settings.inference.topP = 1.5; // Out of range
    const validation = validateSettings(settings);
    assert(!validation.isValid, "Should reject topP > 1");
  });

  testGroup("Reject invalid topK", () => {
    const settings = createDefaultSettings();
    settings.inference.topK = 0; // Too small
    const validation = validateSettings(settings);
    assert(!validation.isValid, "Should reject topK < 1");
  });

  testGroup("Reject invalid maxTokens", () => {
    const settings = createDefaultSettings();
    settings.inference.maxTokens = 0; // Too small
    const validation = validateSettings(settings);
    assert(!validation.isValid, "Should reject maxTokens < 1");
  });

  testGroup("Reject invalid context length", () => {
    const settings = createDefaultSettings();
    settings.model.contextLength = 256; // Too small
    const validation = validateSettings(settings);
    assert(!validation.isValid, "Should reject contextLength < 512");
  });

  testGroup("Reject invalid port", () => {
    const settings = createDefaultSettings();
    settings.backend.port = 99999; // Out of range
    const validation = validateSettings(settings);
    assert(!validation.isValid, "Should reject port > 65535");
  });

  testGroup("Accept valid temperature values", () => {
    for (const temp of [0, 0.5, 1, 1.5, 2]) {
      const settings = createDefaultSettings();
      settings.inference.temperature = temp;
      const validation = validateSettings(settings);
      assert(validation.isValid, `Should accept temperature ${temp}`);
    }
  });

  testGroup("Accept valid topP values", () => {
    for (const p of [0, 0.5, 0.9, 1]) {
      const settings = createDefaultSettings();
      settings.inference.topP = p;
      const validation = validateSettings(settings);
      assert(validation.isValid, `Should accept topP ${p}`);
    }
  });
};

// ============================================================================
// SETTINGS MANAGER TESTS
// ============================================================================

const testSettingsManager = () => {
  testGroup("Create settings manager with defaults", () => {
    const manager = new SettingsManager();
    const settings = manager.getSettings();
    assert(settings.model.name === "default-model", "Should have default model name");
    assert(settings.inference.temperature === 0.7, "Should have default temperature");
  });

  testGroup("Create settings manager with custom settings", () => {
    const custom = createDefaultSettings({
      model: { name: "custom-model" },
    });
    const manager = new SettingsManager(custom);
    const settings = manager.getSettings();
    assert(settings.model.name === "custom-model", "Should use custom model name");
  });

  testGroup("Update settings", () => {
    const manager = new SettingsManager();
    manager.updateSettings({
      inference: { temperature: 0.5 },
    });
    const settings = manager.getSettings();
    assert(settings.inference.temperature === 0.5, "Should update temperature");
    assert(settings.model.name === "default-model", "Should preserve other settings");
  });

  testGroup("Validate through manager", () => {
    const manager = new SettingsManager();
    assert(manager.validateSettings(), "Default settings should be valid");

    manager.updateSettings({
      inference: { temperature: 3 },
    });
    assert(!manager.validateSettings(), "Invalid settings should fail validation");
  });

  testGroup("Export settings as JSON", () => {
    const manager = new SettingsManager();
    const exported = manager.exportSettings();
    assert(typeof exported === "string", "Should export as string");
    const parsed = JSON.parse(exported);
    assert(parsed.model.name === "default-model", "Exported JSON should be valid");
  });

  testGroup("Import settings from JSON", () => {
    const manager = new SettingsManager();
    const custom: ExportedSettings = {
      model: {
        name: "imported-model",
        contextLength: 8192,
      },
      inference: {
        temperature: 0.8,
      },
      backend: {
        host: "localhost",
        port: 5000,
      },
      exportedAt: new Date().toISOString(),
    };

    const success = manager.importSettings(JSON.stringify(custom));
    assert(success, "Should import successfully");

    const settings = manager.getSettings();
    assert(settings.model.name === "imported-model", "Should import model name");
    assert(settings.backend.port === 5000, "Should import backend port");
  });

  testGroup("Reset to defaults", () => {
    const manager = new SettingsManager();
    manager.updateSettings({
      model: { name: "modified" },
    });
    manager.resetToDefaults();
    const settings = manager.getSettings();
    assert(settings.model.name === "default-model", "Should reset to defaults");
  });
};

// ============================================================================
// SETTINGS CREATION TESTS
// ============================================================================

const testSettingsCreation = () => {
  testGroup("Create default settings", () => {
    const settings = createDefaultSettings();
    assert(settings.model.name === "default-model", "Should have model name");
    assert(settings.inference.temperature === 0.7, "Should have temperature");
    assert(settings.backend.host === "localhost", "Should have host");
    assert(settings.backend.port === 1234, "Should have port");
  });

  testGroup("Create settings with overrides", () => {
    const settings = createDefaultSettings({
      model: { name: "custom", contextLength: 4096 },
      inference: { maxTokens: 2048 },
    });
    assert(settings.model.name === "custom", "Should apply model overrides");
    assert(settings.model.contextLength === 4096, "Should apply context override");
    assert(settings.inference.maxTokens === 2048, "Should apply inference override");
  });

  testGroup("Create settings with partial overrides", () => {
    const settings = createDefaultSettings({
      backend: { host: "192.168.1.1" },
    });
    assert(settings.backend.host === "192.168.1.1", "Should override host");
    assert(settings.backend.port === 1234, "Should keep default port");
  });
};

// ============================================================================
// EDGE CASES
// ============================================================================

const testEdgeCases = () => {
  testGroup("Handle undefined inference options", () => {
    const settings = createDefaultSettings();
    settings.inference = {}; // Empty inference options
    // Should not throw
    const validation = validateSettings(settings);
    assert(validation.isValid, "Should handle empty inference options");
  });

  testGroup("Handle zero values", () => {
    const settings = createDefaultSettings();
    settings.inference.temperature = 0;
    settings.inference.topP = 0;
    const validation = validateSettings(settings);
    assert(validation.isValid, "Should accept zero temperature and topP");
  });

  testGroup("Handle extreme valid values", () => {
    const settings = createDefaultSettings();
    settings.model.contextLength = 32768;
    settings.inference.temperature = 2;
    settings.inference.topP = 1;
    settings.inference.topK = 100;
    settings.inference.maxTokens = 4096;
    const validation = validateSettings(settings);
    assert(validation.isValid, "Should accept extreme valid values");
  });

  testGroup("Handle special characters in strings", () => {
    const settings = createDefaultSettings();
    settings.model.name = "test-model-!@#$%^&*()";
    settings.backend.host = "localhost.test.com";
    const validation = validateSettings(settings);
    assert(validation.isValid, "Should accept special characters in strings");
  });
};

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

const testIntegration = () => {
  testGroup("Complete workflow: create -> validate -> export -> import", () => {
    // Step 1: Create
    const original = createDefaultSettings({
      model: { name: "workflow-test" },
      inference: { temperature: 0.9 },
    });

    // Step 2: Validate
    const validation = validateSettings(original);
    assert(validation.isValid, "Original settings should be valid");

    // Step 3: Export
    const manager1 = new SettingsManager(original);
    const exported = manager1.exportSettings();

    // Step 4: Import
    const manager2 = new SettingsManager();
    const imported = manager2.importSettings(exported);
    assert(imported, "Should import successfully");

    // Step 5: Compare
    const reimported = manager2.getSettings();
    assert(
      reimported.model.name === original.model.name,
      "Model name should match after round-trip"
    );
    assert(
      reimported.inference.temperature === original.inference.temperature,
      "Temperature should match after round-trip"
    );
  });
};

// ============================================================================
// RUN ALL TESTS
// ============================================================================

export async function runAllTests() {
  console.log("\n🧪 LM Studio Settings UI Tests\n");
  console.log("========================================");

  try {
    console.log("\n📝 Validation Tests");
    testValidation();

    console.log("\n📝 Settings Manager Tests");
    testSettingsManager();

    console.log("\n📝 Settings Creation Tests");
    testSettingsCreation();

    console.log("\n📝 Edge Cases");
    testEdgeCases();

    console.log("\n📝 Integration Tests");
    testIntegration();

    console.log("\n========================================");
    console.log("✅ All tests passed!\n");
    return { success: true, passed: 0, failed: 0 };
  } catch (error) {
    console.error("\n========================================");
    console.error("❌ Test suite failed!\n");
    console.error(error);
    return { success: false, error };
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

export default { runAllTests };
