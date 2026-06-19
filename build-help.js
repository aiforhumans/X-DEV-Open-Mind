#!/usr/bin/env node
/**
 * X-DEV Quick Command Reference
 * Run: npm run help (or node build-help.js)
 */

const commands = {
  "Installation & Building": {
    "npm run install:all": "Install all dependencies for both projects",
    "npm run build:all": "Build both LM Studio and Obsidian Plugin",
    "npm run build:lm": "Build LM Studio only",
    "npm run build:obsidian": "Build Obsidian Plugin only",
    "npm run clean": "Remove all build artifacts and node_modules",
  },
  "Development": {
    "npm run dev:all": "Watch both projects (runs in parallel)",
    "npm run dev:lm": "Watch LM Studio only",
    "npm run dev:obsidian": "Watch Obsidian Plugin only",
    "npm start": "Run the LM Studio server",
  },
  "Scripts": {
    "./install-and-build.ps1": "PowerShell auto-builder (Windows)",
    "./install-and-build.sh": "Bash auto-builder (macOS/Linux)",
  },
  "Common Workflows": {
    "Full Setup": "npm run install:all && npm run build:all",
    "Dev Mode": "npm run build:all && npm run dev:all",
    "Run Server": "npm start",
    "Clean Build": "npm run clean && npm run install:all && npm run build:all",
  }
};

console.log(`
╔════════════════════════════════════════════════════════════╗
║      X-DEV Open Mind - Build System Quick Reference        ║
╚════════════════════════════════════════════════════════════╝
`);

Object.entries(commands).forEach(([category, cmds]) => {
  console.log(`\n📦 ${category}:`);
  console.log("─".repeat(56));
  Object.entries(cmds).forEach(([cmd, desc]) => {
    console.log(`  ${cmd.padEnd(35)} → ${desc}`);
  });
});

console.log(`
📚 Full documentation: Read BUILDER.md

💡 Tips:
  • Use npm workspaces for simplified command structure
  • Run install:all before building for the first time
  • Use dev:all to watch both projects simultaneously
  • Scripts auto-detect missing dependencies

✨ Everything is configured and ready to go!
`);
