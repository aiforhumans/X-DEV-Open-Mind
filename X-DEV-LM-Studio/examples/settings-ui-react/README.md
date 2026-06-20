# React Settings UI Prototype

**Status:** Prototype/Example (not production)

This directory contains a React-based settings UI for configuring LM Studio parameters. It's useful for development and testing but is not integrated into the main backend.

## What This Is

A standalone React application that demonstrates:
- Model configuration (name, domain, context length, GPU settings)
- Inference options (temperature, top-p, top-k, max tokens)
- Backend connection settings
- Test validation and settings export/import

## What This Is NOT

- Not served by the backend
- Not required for backend functionality
- Not part of the production build
- Not integrated into the Obsidian plugin

The backend includes its own built-in HTML UI (served at `/` from `index.ts`).

## How to Use This

If you want to build and run this React UI:

1. Add React dependencies to the workspace:
   ```bash
   npm install react react-dom @types/react @types/react-dom --save-dev -w X-DEV-LM-Studio
   ```

2. Create a separate `tsconfig.frontend.json` for React compilation with:
   - `"jsx": "react-jsx"`
   - `"lib": ["ES2020", "DOM", "DOM.Iterable"]`

3. Set up a bundler (Vite, esbuild, etc.) or build with separate config

4. The test file `../src/settingsUI.test.ts` contains hand-written tests for validation logic

## Integration Options

- **Option A:** Keep as example/reference code
- **Option B:** Create a separate frontend build target (Vite/Next.js)
- **Option C:** Port to built-in backend UI (write HTML/JS instead of React)

## Files

- `settingsUI.tsx` - Main React component with all settings UI
- `app.tsx` - React app wrapper
- `settingsUI.css` - Styling for settings UI
- `app.css` - App-level styling
