# X-DEV Open Mind Code Deep Dive

Date: 2026-06-20

This folder documents the current codebase after a source-level review and a build verification pass.

## Contents

- [ARCHITECTURE.md](./ARCHITECTURE.md) - repository map, project boundaries, runtime flow, and integration points.
- [LOGIC_AND_FUNCTIONS.md](./LOGIC_AND_FUNCTIONS.md) - function-by-function logic analysis for the LM Studio backend, settings UI helpers, and Obsidian plugin.
- [FINDINGS.md](./FINDINGS.md) - implementation gaps, risks, mismatches, and recommended fixes.
- [BUILD_AND_TEST_REPORT.md](./BUILD_AND_TEST_REPORT.md) - commands run and current verification result.

## High-Level Summary

The repository contains two workspace projects:

1. `X-DEV-LM-Studio`
   - A TypeScript LM Studio HTTP backend in `src/index.ts`.
   - A built-in plain HTML web UI served by the backend.
   - A separate React settings tester prototype in `src/settingsUI.tsx`, plus integration helper examples and hand-rolled tests.

2. `X-DEV-Obsidian`
   - An Obsidian plugin that connects directly to LM Studio through the LM Studio SDK.
   - Commands for connecting, asking a prompt, and summarizing the active note.
   - A settings tab for endpoint, model, system prompt, temperature, max tokens, and auto-connect.

The root project is an npm workspace wrapper with install/build/dev scripts and cross-platform helper scripts.

## Current Verification Status

- Root dependency installation: passed with `npm install`.
- Obsidian production build: passed during `npm run build:all`.
- LM Studio build: failed due to TypeScript/project configuration and SDK API mismatches. Details are in [BUILD_AND_TEST_REPORT.md](./BUILD_AND_TEST_REPORT.md).

## Most Important Takeaway

The backend and plugin contain useful real implementation, but the LM Studio project currently mixes a Node backend, React browser UI files, test files, and example integration files under one strict `tsconfig`. That causes the build to fail. The fastest stabilization path is to separate Node backend compilation from React/prototype/test files or add a proper frontend build configuration and dependencies.
