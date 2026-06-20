# LM Studio Authentication Troubleshooting

## Error: "Failed to authenticate: The LM Studio API token provided was not recognized"

This error occurs when trying to connect to LM Studio without proper authentication configuration.

### Causes

1. **LM Studio API authentication is enabled** - Your LM Studio instance requires a valid API token
2. **Missing or invalid API token** - The token provided doesn't match LM Studio's configuration
3. **LM Studio version mismatch** - Newer versions of LM Studio may have different authentication requirements

---

## Solutions

### Solution 1: Check LM Studio Settings (Recommended)

1. **Open LM Studio** on your system
2. Go to **Settings** (gear icon) → **Server**
3. Look for **"Enable API Authentication"** or similar option
4. If it's enabled, you'll see an **API Key** or **Token** field
5. Copy this token and save it for later

### Solution 2: Disable LM Studio Authentication (Development Only)

⚠️ **Only for local development/testing. Do NOT disable on production servers.**

1. Open **LM Studio**
2. Go to **Settings** → **Server**
3. Find the authentication setting (may be labeled "API Key Protection", "Require Authentication", etc.)
4. **Disable** it
5. Click **Save**
6. Restart LM Studio
7. Try running the application again

### Solution 3: Configure Your Environment

If you have an API token from LM Studio:

1. Create a file named `.env` in the root directory (same level as `start.bat`)
2. Add the following:
   ```
   LM_STUDIO_API_TOKEN=your_actual_token_here
   ```
3. Save the file
4. Rebuild and restart:
   ```batch
   clean-build.bat
   start.bat
   ```

### Solution 4: Update LM Studio Client Configuration

If you need to pass the API token to the backend programmatically:

1. Open `X-DEV-LM-Studio/src/index.ts`
2. In the `LMStudioServer` constructor (around line 672), you can modify how the client connects:
   ```typescript
   const authHeaders = options.apiToken ? 
     { 'Authorization': `Bearer ${options.apiToken}` } : {};
   ```

---

## Verification

Once configured, test the connection:

1. **Via Browser:**
   - Open `http://localhost:3000` in your browser
   - Go to the Backend Settings tab
   - Click "Test Backend Connection"
   - Should show "Connected successfully"

2. **Via Command Line:**
   ```bash
   curl http://localhost:3000/health
   ```
   Should return: `{"status": "ok"}`

---

## Still Having Issues?

1. **Verify LM Studio is Running:**
   - Open `http://localhost:1234` in browser
   - Should show the LM Studio interface
   - Check that a model is loaded

2. **Check Ports:**
   ```bash
   netstat -ano | findstr :1234  # LM Studio port
   netstat -ano | findstr :3000  # Backend port
   ```

3. **Restart Everything:**
   ```bash
   stop-all.bat
   start.bat
   ```

4. **Full Clean Rebuild:**
   ```bash
   clean-build.bat
   ```

---

## Getting Help

- LM Studio Documentation: https://lmstudio.ai/docs/
- LM Studio API Reference: https://lmstudio.ai/docs/developer/core/
- Project GitHub: https://github.com/aiforhumans/X-DEV-Open-Mind

---

## Environment Variables Reference

You can set these in a `.env` file:

| Variable | Purpose | Example |
|----------|---------|---------|
| `LM_STUDIO_API_URL` | LM Studio server URL | `http://localhost:1234` |
| `LM_STUDIO_API_TOKEN` | API token from LM Studio | `abc123def456...` |
| `BACKEND_HOST` | Backend server host | `localhost` |
| `BACKEND_PORT` | Backend server port | `3000` |
| `CLIENT_IDENTIFIER` | Client ID for requests | `my-app` |
| `CLIENT_PASSKEY` | Client authentication key | `secret-passkey` |
| `VERBOSE_ERRORS` | Show detailed errors | `true` or `false` |
