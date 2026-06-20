# Fix for LM Studio Authentication Error

## Problem Summary
You're seeing: "Failed to authenticate: The LM Studio API token provided was not recognized"

This error is coming from LM Studio itself, indicating that your LM Studio instance has authentication enabled and is rejecting requests without proper credentials.

## Quick Fix (Most Common)

### Step 1: Check LM Studio Settings
1. **Open LM Studio** on your computer
2. Click the **⚙️ Settings** icon (gear/cog)
3. Go to **"Server"** or **"API"** section
4. Look for an authentication option - it might be labeled:
   - "Enable API Authentication"
   - "Require API Key"
   - "API Token Protection"
   - Similar variations
5. **Disable this option** (toggle it off)
6. Save the settings
7. **Restart LM Studio**

### Step 2: Restart the Application
```batch
stop-all.bat
start.bat
```

### Step 3: Test the Connection
- Open `http://localhost:3000` in your browser
- Go to the Backend Settings tab
- Click "Test Backend Connection"
- Should now show "Connected successfully"

---

## Alternative Fixes (If Above Doesn't Work)

### Option A: Get Your API Token from LM Studio
If you prefer to keep authentication enabled:

1. In LM Studio Settings > Server/API
2. Find where it displays your **API Token** or **API Key**
3. Copy this token
4. In the app at `http://localhost:3000`:
   - Backend Settings tab
   - Paste the token in the "LM Studio API Token" field
   - Click "Test Backend Connection"

### Option B: Full Clean Rebuild
If the issue persists:

```batch
clean-build.bat
start.bat
```

---

## What Was Changed

The following improvements were made to help with authentication:

1. **Settings UI Updated**
   - Added "LM Studio API Token" field to Backend Settings
   - You can now input your API token directly in the UI
   - Settings are saved when you export them

2. **Documentation Added**
   - `LM_STUDIO_AUTH_GUIDE.md` - Comprehensive authentication troubleshooting
   - `.env.example` - Environment variable configuration template

3. **Settings Export/Import Enhanced**
   - Backend settings now include API token and passkey
   - Saved settings files preserve your authentication configuration

---

## Common Authentication Scenarios

| Scenario | Solution |
|----------|----------|
| LM Studio has authentication **enabled** | Get token from LM Studio settings and enter it in the app |
| LM Studio has authentication **disabled** | Just disable it in LM Studio and try again |
| You don't know if it's enabled | Check Settings > Server in LM Studio |
| Getting 401 errors | API token is invalid, regenerate in LM Studio |
| Connection timeout | LM Studio might not be running, check port 1234 |

---

## Verification Steps

After applying the fix, verify everything works:

**Test 1: Check Backend**
```bash
curl http://localhost:3000/health
```
Should return: `{"status": "ok"}`

**Test 2: Check LM Studio**
Visit `http://localhost:1234` in your browser - should see the LM Studio interface

**Test 3: Test Connection in App**
- Open `http://localhost:3000`
- Backend Settings tab
- Click "Test Backend Connection"
- Should succeed

---

## Still Not Working?

1. Check that LM Studio is actually running (window should be visible)
2. Verify LM Studio is on `http://localhost:1234` (can visit in browser)
3. Make sure port 1234 isn't already in use:
   ```bash
   netstat -ano | findstr :1234
   ```
4. Try restarting LM Studio completely
5. See `LM_STUDIO_AUTH_GUIDE.md` for more detailed troubleshooting

---

## Need More Help?

- **LM Studio Docs**: https://lmstudio.ai/docs/
- **LM Studio API**: https://lmstudio.ai/docs/developer/core/
- **This Project**: https://github.com/aiforhumans/X-DEV-Open-Mind
- **Troubleshooting Guide**: See `TROUBLESHOOTING.md`
