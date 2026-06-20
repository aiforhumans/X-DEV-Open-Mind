# LM Studio Authentication Fix

## Problem

When running the backend with `start.bat`, you see this error:

```
Failed to authenticate: The LM Studio API token provided was not recognized. 
Ensure you are using a valid token. Learn more at: https://lmstudio.ai/docs/developer/core/authentication.
```

## Root Cause

**LM Studio has authentication enabled** on your instance. The @lmstudio/sdk library doesn't support passing API tokens via code configuration — authentication is managed at the LM Studio application level.

## Solution

### Step 1: Disable LM Studio Authentication

1. Open **LM Studio** desktop application
2. Click **Settings** (⚙️ gear icon) in the top-right
3. Navigate to: **Server** → **Security**
4. Find the toggle: **"Require authentication"**
5. **Toggle it OFF**
6. **Restart LM Studio**

### Step 2: Restart Backend

After disabling auth in LM Studio:

```bash
# Stop current backend (Ctrl+C)
# Then:
npm run build:all
start.bat
```

### Step 3: Verify

You should see in console (NO auth errors):

```
LM Studio backend listening on http://127.0.0.1:3000
Connecting to LM Studio at http://localhost:1234
```

Open http://localhost:3000 and verify:
- ✅ Model dropdown populates with available models
- ✅ Can load a model
- ✅ Can send prompts in Playground
- ✅ No red error messages

## Configuration

### Environment Variables (`.env` file)

```env
# LM Studio connection
LM_STUDIO_BASE_URL=http://localhost:1234

# Backend server
HOST=127.0.0.1
PORT=3000

# Debug mode
VERBOSE_ERRORS=true
```

### For Advanced Users

If you want to keep authentication enabled in LM Studio:
- You'll need to use an API token directly with LM Studio's OpenAI-compatible endpoint
- Our backend currently connects via the WebSocket API which requires the auth to be disabled
- Alternatively, use `http://localhost:1234/v1/*` endpoints directly (OpenAI-compatible)

## Troubleshooting

### Still seeing auth errors?

1. **Verify LM Studio settings:**
   - Open LM Studio → Settings → Server
   - Confirm "Require authentication" is **OFF**

2. **Check LM Studio is running:**
   - Make sure LM Studio desktop app is open and running
   - Look for the spinning icon or status indicator

3. **Verify port 1234:**
   ```bash
   # Check if LM Studio is on default port
   curl http://localhost:1234/health
   # Should return: {"status":"ok"}
   ```

4. **Clear cache and restart:**
   ```bash
   npm run clean
   npm install
   npm run build:all
   start.bat
   ```

5. **Check logs:**
   - LM Studio logs: `C:\Users\<username>\.lmstudio\server-logs`
   - Our backend logs print to console when you run `start.bat`

## Files Modified

- `.env` - Configuration file with LM Studio URL and settings
- `X-DEV-LM-Studio/src/index.ts` - Better environment variable support
- `X-DEV-LM-Studio/src/settingsUI.tsx` - UI for testing connection and playground

## Next Steps

Once authentication is fixed:

1. **Try the UI:** Open http://localhost:3000
   - Test backend connection
   - Load a model
   - Use Playground to test prompts

2. **Try the API:** 
   ```bash
   curl -X POST http://localhost:3000/v1/chat/completions \
     -H "Content-Type: application/json" \
     -d '{"messages": [{"role": "user", "content": "Hello"}]}'
   ```

3. **Check other docs:**
   - `README.md` - Overall project info
   - `QUICK_START.md` - Quick setup guide
   - `TROUBLESHOOTING.md` - More troubleshooting tips

## Support

For more info on LM Studio settings: https://lmstudio.ai/docs/
