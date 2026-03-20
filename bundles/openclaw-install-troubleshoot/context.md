# OpenClaw Installation Troubleshooting

This bundle covers the most common failures encountered when installing and configuring OpenClaw (the AI Gateway/Agent framework) and provides step-by-step solutions for each. Use it to quickly diagnose and resolve setup issues across all supported platforms.

## Table of Contents

1. [Node.js Version Mismatch](#1-nodejs-version-mismatch)
2. [Command Not Found (PATH)](#2-command-not-found-path)
3. [EACCES Permission Denied](#3-eacces-permission-denied)
4. [Missing Configuration File](#4-missing-configuration-file)
5. [Windows / PowerShell Failures](#5-windows--powershell-failures)
6. [Missing Build Tools & Dependencies](#6-missing-build-tools--dependencies)
7. [Sharp Native Module Failure](#7-sharp-native-module-failure)
8. [Gateway Port Conflict](#8-gateway-port-conflict)
9. [Onboarding Stuck at URL](#9-onboarding-stuck-at-url)
10. [Control UI Origin Rejection](#10-control-ui-origin-rejection)
11. [Docker Networking Issues](#11-docker-networking-issues)
12. [Headless / VPS Installation](#12-headless--vps-installation)
13. [Plugin Package Missing Extensions](#13-plugin-package-missing-extensions)
14. [Diagnostic Commands Reference](#14-diagnostic-commands-reference)

---

## 1. Node.js Version Mismatch

**[INST-01] OpenClaw requires Node.js 22 or later.**

**Symptom:** Error message `unsupported Node version`, obscure syntax errors, or the `openclaw` command is not recognized after installation.

**Root Cause:** The installed Node.js version is older than 22 (e.g., v18, v20). OpenClaw relies on language features and APIs only available in Node.js 22+.

**Solution:**

1. Check your current version:
   ```bash
   node --version
   ```
2. If the version is below 22, update using nvm (Node Version Manager):
   ```bash
   nvm install 22
   nvm use 22
   ```
   Alternatively, download the latest LTS from [nodejs.org](https://nodejs.org).
3. Reinstall OpenClaw:
   ```bash
   npm install -g openclaw@latest
   ```

---

## 2. Command Not Found (PATH)

**[INST-02] The `openclaw` binary is not on the system PATH.**

**Symptom:** Installation completes successfully via npm, but running `openclaw` returns `command not found` or is not recognized.

**Root Cause:** The npm global binary directory is not included in the system's `PATH` environment variable.

**Solution:**

- **macOS / Linux:**
  1. Find the npm global prefix:
     ```bash
     npm config get prefix
     ```
  2. Add the binary directory to your shell profile (`~/.zshrc` or `~/.bashrc`):
     ```bash
     export PATH=$PATH:$(npm config get prefix)/bin
     ```
  3. Reload the profile:
     ```bash
     source ~/.zshrc
     ```

- **Windows:**
  1. Find the npm global prefix:
     ```powershell
     npm config get prefix
     ```
  2. Add the resulting path (typically `%AppData%\npm`) to the system environment variables via **Settings > System > About > Advanced system settings > Environment Variables**.

---

## 3. EACCES Permission Denied

**[INST-03] npm cannot write to the global packages directory.**

**Symptom:** Running `npm install -g openclaw` fails with `Error: EACCES: permission denied`.

**Root Cause:** The default npm global directory is owned by root or another user, and the current user lacks write access.

**Solution (recommended — avoid `sudo`):**

1. Create a dedicated directory for global packages:
   ```bash
   mkdir ~/.npm-global
   ```
2. Configure npm to use it:
   ```bash
   npm config set prefix '~/.npm-global'
   ```
3. Add the new binary path to your shell profile (`~/.zshrc` or `~/.bashrc`):
   ```bash
   export PATH=$PATH:~/.npm-global/bin
   ```
4. Reload the profile and reinstall:
   ```bash
   source ~/.zshrc
   npm install -g openclaw@latest
   ```

> **Note:** Using `sudo npm install -g` is discouraged — it can cause cascading permission issues with future packages.

---

## 4. Missing Configuration File

**[INST-04] OpenClaw cannot find `~/.openclaw/config.json`.**

**Symptom:** After installation, OpenClaw fails to start or reports a missing configuration file. The onboarding wizard did not run or failed silently.

**Root Cause:** The first-run onboarding wizard (`openclaw onboard`) did not complete, so no config directory or file was created.

**Solution:**

1. Create the config directory manually:
   ```bash
   mkdir -p ~/.openclaw
   ```
2. Create a minimal `config.json`:
   ```bash
   cat > ~/.openclaw/config.json << 'EOF'
   {
     "providers": {},
     "agents": {}
   }
   EOF
   ```
3. Run the onboarding wizard to populate it properly:
   ```bash
   openclaw onboard
   ```

---

## 5. Windows / PowerShell Failures

**[INST-05] Installation via PowerShell fails or the command is not recognized.**

**Symptom:** The install script does not execute, PowerShell reports an unrecognized command, or administrator privileges are required.

**Solution:**

1. Install Git if not already present:
   ```powershell
   winget install git.git
   ```
2. Close and reopen PowerShell **as Administrator**.
3. Run the install script:
   ```powershell
   iwr -useb https://openclaw.ai/install.ps1 | iex
   ```
4. If the script still fails, consider using **WSL2** (Windows Subsystem for Linux) as an alternative environment and follow the Linux installation steps instead.

---

## 6. Missing Build Tools & Dependencies

**[INST-06] Native npm modules fail to compile due to missing system build tools.**

**Symptom:** Installation fails during the `node-gyp` compilation step with errors about missing compilers or header files (e.g., `make: not found`, `gcc: not found`).

**Root Cause:** Many npm packages include native C/C++ addons that require build tools to compile from source.

**Solution:**

- **Debian / Ubuntu:**
  ```bash
  sudo apt-get install build-essential
  ```
- **Fedora / RHEL:**
  ```bash
  sudo dnf groupinstall 'Development Tools'
  ```
- **Arch Linux:**
  ```bash
  sudo pacman -S base-devel
  ```

After installing the build tools, retry the OpenClaw installation:
```bash
npm install -g openclaw@latest
```

---

## 7. Sharp Native Module Failure

**[INST-07] The `sharp` image-processing dependency fails to install on macOS or Linux.**

**Symptom:** Installation fails at `sharp@0.34.x` with errors about missing prebuilt binaries and `node-gyp` compilation failures.

**Root Cause:** No prebuilt binary is available for the current platform/architecture, and the build toolchain (Xcode CLI tools on macOS, or `libvips` on Linux) is not installed.

**Solution (macOS):**

1. Install Xcode Command Line Tools:
   ```bash
   xcode-select --install
   ```
2. Set the environment variable to skip the global libvips check:
   ```bash
   export SHARP_IGNORE_GLOBAL_LIBVIPS=1
   ```
3. Reinstall:
   ```bash
   npm install -g openclaw@latest
   ```

**Solution (Linux):**

Install the `libvips` development package for your distribution (e.g., `sudo apt-get install libvips-dev` on Debian/Ubuntu), then retry the installation.

---

## 8. Gateway Port Conflict

**[INST-08] The OpenClaw Gateway fails to bind because the default port is already in use.**

**Symptom:** The gateway does not start, hangs at "Waiting for gateway", or logs an `EADDRINUSE` error. Default ports are `9090` and `18789`.

**Root Cause:** Another process is already listening on the same port.

**Solution:**

1. Identify the conflicting process:
   ```bash
   # macOS / Linux
   lsof -i :18789

   # Windows
   netstat -ano | findstr :18789
   ```
2. Either stop the conflicting process or start the gateway on a different port:
   ```bash
   openclaw gateway --port 19000 --verbose
   ```
3. To permanently change the port:
   ```bash
   openclaw config set gateway.port 19000
   ```

---

## 9. Onboarding Stuck at URL

**[INST-09] The onboarding screen displays a URL but the Web UI never loads or the token is not accepted.**

**Symptom:** The setup process prints a URL to open in the browser, but the page does not load, or the gateway does not receive the authentication token.

**Root Cause:** The `pending.json` file inside the OpenClaw config directory has an incorrect `"silent"` flag state, preventing the gateway from completing the handshake.

**Solution:**

1. Locate `pending.json` (typically at `~/.openclaw/pending.json` or `%UserProfile%\.openclaw\pending.json` on Windows).
2. Open the file and change `"silent": false` to `"silent": true`.
3. Save the file and restart the gateway.

---

## 10. Control UI Origin Rejection

**[INST-10] The gateway rejects WebSocket connections from the Control UI with an origin error.**

**Symptom:** Error message: `open the Control UI from the gateway host or allow it in gateway.controlUi.allowedOrigins`.

**Root Cause:** The gateway performs an HTTP `Origin` header check on incoming WebSocket connections. If the browser's origin (e.g., `http://localhost:18790`) is not in the allowed list, the connection is rejected. This is especially common when running inside Docker, where the Control UI is accessed from a different network origin.

**Solution:**

1. Add the origin to the gateway config (`~/.openclaw/openclaw.json`):
   ```json
   {
     "gateway": {
       "controlUi": {
         "allowedOrigins": ["http://localhost:18790"]
       }
     }
   }
   ```
   Replace `http://localhost:18790` with the actual URL you use to open the Control UI (including protocol and port).

2. Alternatively, use the CLI:
   ```bash
   openclaw config set gateway.controlUi.allowedOrigins '["http://localhost:18790"]'
   ```

> **Security note:** Do not use `"*"` as an allowed origin in production — it permits connections from any origin. If the gateway binds on LAN (`--bind lan`), add the LAN IP origin as well (e.g., `http://192.168.1.x:18790`).

---

## 11. Docker Networking Issues

**[INST-11] The Docker-based installation gets stuck or the gateway URL is unreachable.**

**Symptom:** Running OpenClaw via Docker results in the gateway URL not opening in the browser, or the container starts but the service is inaccessible from the host.

**Root Cause:** Docker's default bridge network isolates container ports. If port mapping is missing or incorrect, the host cannot reach the gateway.

**Solution:**

1. Pull the latest code and run the Docker script with explicit port mapping:
   ```bash
   docker run -p 18789:18789 openclaw/gateway
   ```
2. Alternatively, use host networking to bypass port mapping entirely:
   ```bash
   docker run --network host openclaw/gateway
   ```
3. If the default port conflicts with another service, remap to a different host port:
   ```bash
   docker run -p 18790:18789 openclaw/gateway
   ```

---

## 12. Headless / VPS Installation

**[INST-12] The TUI (terminal UI) installer hangs on headless servers without a proper TTY.**

**Symptom:** The interactive installer freezes or renders garbled output on a VPS, CI runner, or SSH session without full terminal support.

**Root Cause:** The TUI installer requires an interactive terminal (TTY). Minimal server environments, CI containers, or restricted SSH sessions may not provide one.

**Solution:**

1. Exit the TUI installer (press `Ctrl+C`).
2. Install directly via npm:
   ```bash
   npm install -g openclaw@latest
   ```
3. Run the non-interactive setup:
   ```bash
   openclaw doctor --non-interactive
   ```

---

## 13. Plugin Package Missing Extensions

**[INST-13] A plugin package fails to load because it is missing the `openclaw.extensions` field.**

**Symptom:** Running `openclaw plugins install <package>` succeeds, but the plugin does not appear or throws a load error.

**Root Cause:** The plugin's `package.json` does not declare the `openclaw.extensions` field, so OpenClaw cannot locate the entry point.

**Solution:**

1. Add the `openclaw` field to the plugin's `package.json`:
   ```json
   {
     "openclaw": {
       "extensions": ["./dist/index.js"]
     }
   }
   ```
2. Republish the plugin package.
3. Reinstall:
   ```bash
   openclaw plugins install <npm-spec>
   ```

---

## 14. Diagnostic Commands Reference

Use these commands to inspect the current state of your OpenClaw installation:

| Command | Purpose |
|---------|---------|
| `openclaw status` | Show overall system status |
| `openclaw status --all` | Show detailed status for all components |
| `openclaw gateway probe` | Test gateway connectivity |
| `openclaw gateway status` | Show gateway runtime status |
| `openclaw doctor` | Run a full diagnostic check |
| `openclaw channels status --probe` | Check channel connectivity |
| `openclaw logs --follow` | Stream live logs for debugging |
