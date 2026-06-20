# X-DEV Open Mind - Troubleshooting Guide

## Common Issues & Solutions

---

## ❌ Error: "Node.js not found"

### Problem
```
ERROR: Node.js not found!
Please install Node.js 20+ from https://nodejs.org/
```

### Solution
1. Download **Node.js 20 LTS** from https://nodejs.org/
2. Run the installer and follow the prompts
3. **Restart your computer** or open a new Command Prompt
4. Verify installation:
   ```batch
   node --version
   npm --version
   ```
5. Try running `start.bat` again

---

## ❌ Error: "npm install failed"

### Problem
```
ERROR: Failed to install dependencies!
```

### Solution
1. Open Command Prompt in the project folder
2. Try a clean install:
   ```batch
   npm cache clean --force
   npm install
   ```
3. If that fails, try:
   ```batch
   clean-build.bat
   ```

---

## ❌ Error: "Build failed"

### Problem
```
ERROR: Failed to build LM Studio!
ERROR: Failed to build Obsidian plugin!
```

### Solutions

**Try #1 - Clean rebuild:**
```batch
clean-build.bat
```

**Try #2 - Manual rebuild:**
```batch
npm run build:all
```

**Try #3 - Check for TypeScript errors:**
```batch
npm run build:lm
npm run build:obsidian
```

If these fail, check:
- Do you have the latest Node.js? (`node --version` should be 20+)
- Is the project folder path too long? (Windows has a limit, try moving it)
- Are there special characters in the folder path? (Try renaming it)

---

## ❌ Error: "Obsidian not found"

### Problem
```
Obsidian not found in standard locations.
Please ensure Obsidian is installed or launch it manually.
```

### Solution
1. Download and install **Obsidian** from https://obsidian.md/
2. Run the installer
3. Try `start.bat` again - it should now find Obsidian

**Manual Alternative:** Launch Obsidian yourself, then run `start.bat`

---

## ❌ Backend Server Won't Start

### Problem
```
Backend server starting on http://localhost:3000
(but nothing starts, or you get connection refused)
```

### Causes & Solutions

**Cause #1 - Port 3000 already in use**
```batch
REM Find what's using port 3000
netstat -ano | findstr :3000

REM If something is using it, stop all processes
stop-all.bat

REM Then try again
start.bat
```

**Cause #2 - LM Studio backend not running**
- The backend server needs **LM Studio** running separately
- Download from https://lmstudio.ai/ and start it first
- Then run `start.bat`
- If you still see the old UI in the browser, refresh with Ctrl+F5 after restart
- The UI at http://localhost:3000 is served by the backend, so a stale browser cache can make it look unchanged

**Cause #3 - Build not complete**
```batch
REM Rebuild everything
setup.bat

REM Then try starting
start.bat
```

---

## ❌ Obsidian Plugin Not Working

### Problem
"Can't connect to LM Studio" or "Ask LM Studio" command doesn't work

### Solution #1 - Check LM Studio is Running
1. Make sure **LM Studio app is open** with a model loaded
2. Visit http://localhost:1234 in your browser
3. You should see the LM Studio interface
4. If not, start LM Studio
5. If the backend logs show connection refused on port 1234, confirm LM Studio's local server is enabled and listening on `http://localhost:1234`

### Solution #2 - Check Plugin Configuration
1. Open **Obsidian Settings**
2. Go to **Community Plugins → X-DEV Obsidian**
3. Verify settings:
   - **LM Studio URL:** `http://localhost:1234` (exact)
   - **Model Name:** Match the loaded model in LM Studio
   - **Auto Connect:** Can be checked or unchecked
4. Click **Connect to LM Studio** button
5. You should see "Connected!" message

### Solution #3 - Restart Everything
1. Close `start.bat` console (Ctrl+C)
2. Close Obsidian
3. Close LM Studio
4. Restart all in order:
   - Open LM Studio
   - Load a model
   - Run `start.bat`
   - Open Obsidian
   - Try the plugin

---

## ❌ Backend API Not Responding

### Problem
`http://localhost:3000` shows connection refused or times out

### Solution
1. Make sure `start.bat` is still running (console window open)
2. Check if Node.js crashed:
   ```batch
   netstat -ano | findstr :3000
   ```
3. If nothing shows, the backend crashed. Close `start.bat` and run it again
4. If something shows but port seems dead, try:
   ```batch
   stop-all.bat
   start.bat
   ```

---

## ❌ "Port 1234 already in use"

### Problem
LM Studio can't start because port 1234 is in use

### Solution
1. Kill the process using port 1234:
   ```batch
   netstat -ano | findstr :1234
   ```
2. Note the PID (Process ID)
3. Kill it:
   ```batch
   taskkill /PID <PID> /F
   ```
4. Restart LM Studio and `start.bat`

---

## ❌ Windows Defender/Antivirus Blocking

### Problem
Windows blocks the .bat files or Node.js processes

### Solution
1. Open **Windows Defender** (or your antivirus)
2. Add an exception for:
   - Your project folder
   - Node.js installation folder (usually `C:\Program Files\nodejs`)
3. Try running `start.bat` again

---

## ⚠️ Slow Startup

### Problem
Takes a very long time to start (first time is expected, but later runs too)

### Solution
First run (5-10 minutes):
- This is normal! It's installing and building
- Subsequent runs should be much faster (~10 seconds)

If later runs are still slow:
```batch
REM Rebuild everything
clean-build.bat
```

---

## ⚠️ "npm install" Gets Stuck

### Problem
`setup.bat` hangs during npm install

### Solution
1. Press **Ctrl+C** to stop it
2. Try clearing npm cache:
   ```batch
   npm cache clean --force
   ```
3. Try installing again:
   ```batch
   npm install
   ```
4. If it still hangs, try:
   ```batch
   npm install --verbose
   ```
   (This shows more details)

---

## 🔍 Checking What's Running

### See All Running Processes
```batch
tasklist | findstr /i "node"
tasklist | findstr /i "Obsidian"
```

### Stop Specific Processes
```batch
REM Kill all Node processes (backend)
taskkill /IM node.exe /F

REM Kill Obsidian
taskkill /IM Obsidian.exe /F

REM Or just run
stop-all.bat
```

### Check Open Ports
```batch
REM See what's using port 3000
netstat -ano | findstr :3000

REM See what's using port 1234
netstat -ano | findstr :1234
```

---

## ✅ Verify Everything Works

**Backend API:**
```bash
curl http://localhost:3000/health
```

Should return:
```json
{"status": "ok"}
```

**List Models:**
```bash
curl http://localhost:3000/v1/models
```

Should return a list of available models.

**Check LM Studio:**
Visit http://localhost:1234 in your browser - should see LM Studio interface

**Check Obsidian:**
- Open Obsidian
- Command palette: `Ctrl+P`
- Type "Ask LM Studio"
- Should show the plugin command

---

## 📝 Reporting Issues

If you still have problems:

1. **Collect information:**
   - Windows version (`winver`)
   - Node.js version (`node --version`)
   - Error messages (copy the exact text)
   - What you were doing when it broke

2. **Create an issue** on GitHub with this info

3. **Include console output:**
   - Screenshot of `start.bat` console window
   - Any red ERROR messages

---

## 🆘 Still Stuck?

Try the **nuclear option - full clean rebuild:**

```batch
clean-build.bat
```

This will:
1. Stop all running processes ✓
2. Remove all node_modules ✓
3. Remove all build artifacts ✓
4. Reinstall everything ✓
5. Rebuild everything ✓
6. Start the system ✓

Takes ~5 minutes but fixes most issues.

---

## Need More Help?

See the full documentation:
- [README.md](./README.md) - Project overview
- [X-DEV-LM-Studio/README.md](./X-DEV-LM-Studio/README.md) - Backend API docs
- [X-DEV-Obsidian/README.md](./X-DEV-Obsidian/README.md) - Plugin docs
