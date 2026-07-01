<div align="center">

<img src="public/favicon.svg" alt="App Logo" width="128" />

# Vite · Express · Tauri Template (DevKit)

<a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
<a href="https://tauri.app/"><img src="https://img.shields.io/badge/Tauri-2.x-blue.svg" alt="Tauri" /></a>
<a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-19-blue.svg" alt="React" /></a>
<a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-blue.svg" alt="TypeScript" /></a>
<a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-7-blue.svg" alt="Vite" /></a>
<a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express-5-green.svg" alt="Express" /></a>

**A full-stack template: React + Vite frontend, Express API server, and Tauri desktop/mobile apps — with GitHub Actions for multi-platform builds and releases.**

[Features](#-features) • [Installation](#-installation) • [Running & Building](#-running-the-application) • [GitHub Actions](#-github-actions-build--release) • [Icons](#-icons-generation) • [Contributing](#-contributing)

---

</div>

## 📖 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [Building for Production](#-building-for-production)
- [GitHub Actions (Build & Release)](#-github-actions-build--release)
- [Icons Generation](#-icons-generation)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Contributing](#-contributing)
- [Support](#-support)
- [License](#-license)
- [About Roboticela](#-about-roboticela)

---

## 🌟 About

**Animator** is a client-side 3D model animation studio built on the Roboticela DevKit stack. Import rigged models (GLB, GLTF, FBX, OBJ), inspect armatures and bones, preview embedded clips, apply procedural premade humanoid animations, hand-author custom keyframe clips with a bone gizmo + timeline, and export the result as a new **`.glb`** file — in the browser or inside the Tauri desktop shell.

### Animator at a glance

| Capability | Details |
|------------|---------|
| **Import** | Drag-and-drop or file picker; native open dialog on desktop (Tauri) |
| **Inspection** | Armature/bone tree, mesh stats, per-bone transform readout |
| **Embedded clips** | Plays animations baked into the imported file |
| **Premade clips** | Procedural idle, walk, run, wave, jump, spin, dance (bone-name heuristics) |
| **Custom authoring** | Move/rotate/scale gizmo, per-bone keyframes, timeline scrub/play, undo/redo |
| **Export** | GLB only (native Save dialog on desktop; download in browser) |
| **Try without a file** | Built-in procedural sample humanoid rig |

**Keyboard shortcuts:** `W` / `E` / `R` — gizmo mode · `Space` — play/pause · `Esc` — deselect bone · `Ctrl+Z` / `Ctrl+Y` — undo/redo

**Known limitations:** FBX import is best-effort (three-stdlib). Export is always `.glb`. Premade animations match common humanoid bone naming (Mixamo/Unity/VRM style); unusual rigs may animate partially.

---

**Vite-Express-Tauri-Template-DevKit** (Roboticela DevKit) is the underlying production-ready starter for building cross-platform applications with a **React + TypeScript** frontend (Vite), an **Express** backend API, and **Tauri 2** for desktop (Linux, Windows, macOS) and mobile (Android; iOS coming soon). It includes a **GitHub Actions** workflow for building and releasing installers and packages across platforms, plus scripts for **icon generation** (desktop, Android, web).

### Why This Template?

- ✅ **Full-Stack** — Frontend (Vite + React), API (Express), and native shells (Tauri)
- ✅ **Cross-Platform** — Linux, Windows, macOS (desktop); Android (and iOS planned)
- ✅ **CI/CD Ready** — One workflow to build .deb, .rpm, .AppImage, .exe, .msi, .apk, .aab
- ✅ **Icon Pipeline** — Single SVG → desktop, Android adaptive, and web favicons
- ✅ **Version Patching** — Workflow patches version in `package.json`, `Cargo.toml`, `tauri.conf.json`, and server
- ✅ **Android Signing** — Optional secrets for release signing or auto-generated keystore for testing

---

## ✨ Features

### 🖥️ Desktop & Web
- **Vite 7** — Fast HMR and optimized production builds
- **React 19** + **TypeScript** — Type-safe UI
- **Tauri 2** — Small binaries, system WebView
- **TailwindCSS 4** — Utility-first styling

### 🔧 Backend
- **Express 5** — REST API server in `server/` (TypeScript, ts-node-dev for dev)
- Separate `server/package.json` and build scripts: `server:dev`, `server:build`, `server:start`

### 📦 Build & Release
- **GitHub Actions** — Manual workflow with inputs: version, prerelease, draft, and per-platform toggles (Linux, Windows, Android; macOS/iOS placeholders)
- **Multi-arch** — Linux: x86_64, aarch64, armv7; Windows: x86_64, i686, aarch64; Android: all ABIs + AAB
- **Checksums** — SHA256 and SHA512 for release assets
- **Android** — APK (split per ABI) and AAB; optional keystore secrets for signing

### 🎨 Icons
- **Single source** — `public/favicon.svg` (or custom path)
- **Tauri icon** — Desktop and Windows Store assets
- **Android** — Adaptive icon with configurable background color and icon scale
- **Web** — Favicons and apple-touch-icon copied to `public/`

---

## 🛠️ Technology Stack

| Layer        | Technology |
|-------------|------------|
| Frontend    | React 19, TypeScript 5.x, Vite 7, TailwindCSS 4 |
| 3D / Animator | three.js, React Three Fiber, drei, zustand |
| Backend     | Express 5 (Node.js) — optional; Animator is fully client-side |
| Desktop/Mobile | Tauri 2, Rust |
| Tooling     | ESLint, npm |

---

## 📋 Prerequisites

### Required
- **Node.js** (v20+, workflow uses 24) — [Download](https://nodejs.org/)
- **npm** — Node package manager
- **Rust** (latest stable) — [Install](https://www.rust-lang.org/tools/install)

### Platform-specific (for local builds)

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev \
  patchelf libsoup-3.0-dev libjavascriptcoregtk-4.1-dev
```

#### Linux (Fedora)
```bash
sudo dnf install webkit2gtk4.1-devel openssl-devel libappindicator-gtk3-devel librsvg2-devel
```

#### macOS
```bash
xcode-select --install
```

#### Windows
- [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (usually on Windows 10/11)

#### Android (local)
- JDK 17, Android SDK, NDK (e.g. 27.0.12077973 as in workflow)
- `npx tauri android init` once; see [Tauri Android](https://v2.tauri.app/develop/android/)
- **Windows only:** enable [Developer Mode](https://learn.microsoft.com/en-us/windows/apps/get-started/enable-your-device-for-development) (Settings → System → For developers). Tauri links `libapp_lib.so` into `src-tauri/gen/android/.../jniLibs` with a **symbolic link**; without Developer Mode (or the “create symbolic links” privilege) the build fails with *“Creation symbolic link is not allowed for this system”* ([upstream discussion](https://github.com/tauri-apps/tauri/issues/10937)). Keep the project on an **NTFS** drive (not exFAT/FAT32 on external disks).
- If Gradle/Kotlin reports *“this and base files have different roots”* (e.g. repo on **D:** and Cargo/registry on **C:**), the Kotlin daemon may fall back; builds can still succeed. If problems persist, put the **project on the same drive** as your user profile (where `.cargo` lives) or add `kotlin.incremental=false` in `src-tauri/gen/android/gradle.properties` after `tauri android init` (re-apply if you regenerate `gen/android`).

---

## 📥 Installation

```bash
git clone https://github.com/Roboticela/Vite-Express-Tauri-Template-DevKit.git
cd Vite-Express-Tauri-Template-DevKit
npm install
```

Optional: build Rust for desktop once:
```bash
cd src-tauri && cargo build && cd ..
```

---

## 🚀 Running the Application

### Frontend only (web)
```bash
npm run dev
```
Then open http://localhost:5173.

### Desktop (Tauri + Vite dev server)
```bash
npm run tauri dev
```
Starts Vite and opens the Tauri window with hot-reload.

### Backend API only
```bash
npm run server:dev
```
Runs Express from `server/` with ts-node-dev (default port as in `server`).

### Web + backend together
Run in two terminals:
```bash
npm run dev
npm run server:dev
```

---

## 📦 Building for Production

### Frontend
```bash
npm run build
```
Output: `dist/`.

### Backend
```bash
npm run server:build
npm run server:start
```
Output: `server/dist/`.

### Desktop (current platform)
```bash
npm run build
npm run tauri build
```
Or:
```bash
npm run build && npm run tauri:build
```
Output:
- **Linux:** `src-tauri/target/<target>/release/bundle/` (deb, rpm, AppImage)
- **Windows:** `src-tauri/target/<target>/release/bundle/` (nsis .exe, msi)
- **macOS:** `src-tauri/target/<target>/release/bundle/` (dmg, app)

### Desktop for a specific target (cross-compile)
Examples:
```bash
# Linux x86_64 (default on Linux)
npm run tauri:build -- --target x86_64-unknown-linux-gnu

# Linux ARM64
npm run tauri:build -- --target aarch64-unknown-linux-gnu

# Windows (from Linux/macOS with cross-compile setup)
npm run tauri:build -- --target x86_64-pc-windows-msvc
```
Rust targets must be installed (e.g. `rustup target add <target>`).

### Android
Prerequisites: Android SDK, NDK, and `npx tauri android init` done once.
```bash
# APK (split per ABI)
npx tauri android build --apk --split-per-abi

# AAB (bundle for Play Store)
npx tauri android build --aab
```
Set `NDK_HOME` if needed (e.g. `$ANDROID_HOME/ndk/<version>`).

### Build summary by platform

| Platform  | Command / note |
|-----------|-----------------|
| Web       | `npm run build` → `dist/` |
| Linux     | `npm run tauri:build` (or `--target x86_64-unknown-linux-gnu` etc.) |
| Windows   | `npm run tauri:build` on Windows (or cross-compile with MSVC target) |
| macOS     | `npm run tauri:build` on macOS |
| Android   | `npx tauri android build --apk` or `--aab` (after `tauri android init`) |

---

## 🤖 GitHub Actions (Build & Release)

The workflow file is **`.github/workflows/build-release.yml`**. It is triggered **manually** (workflow_dispatch) and:

1. **Prepares** — Patches version in `package.json`, `server/package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml`
2. **Builds** — Linux, Windows, and Android (each can be toggled on/off)
3. **Releases** — Creates a GitHub Release with artifacts and SHA256/SHA512 checksums

### Workflow inputs (manual trigger)

| Input | Type | Default | Description |
|-------|------|--------|-------------|
| `version` | string | `"0.1.0"` | Release version (e.g. `1.0.0`) |
| `prerelease` | boolean | `false` | Mark release as pre-release |
| `draft` | boolean | `false` | Create as draft release |
| `build_linux` | boolean | `true` | Build for Linux (.deb, .rpm, .AppImage) |
| `build_windows` | boolean | `true` | Build for Windows (.exe, .msi) |
| `build_android` | boolean | `true` | Build for Android (.apk, .aab) |
| `build_macos` | boolean | `false` | Reserved (coming soon) |
| `build_ios` | boolean | `false` | Reserved (coming soon) |

### Environment variables (workflow)

Set at the top level of the workflow:

| Variable | Example | Description |
|----------|---------|-------------|
| `APP_NAME` | `"Roboticela DevKit"` | Display name used in release title and Android signing DN |
| `NDK_VERSION` | `"27.0.12077973"` | Android NDK version installed via `sdkmanager` |
| `NODE_VERSION` | `"24"` | Node version for `actions/setup-node` |

### Secrets (optional, for Android signing)

If you want **release signing** for Android (e.g. for Play Store), add these repository secrets:

| Secret | Description |
|--------|-------------|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded `.keystore` file (contents of the keystore binary) |
| `ANDROID_KEY_ALIAS` | Key alias inside the keystore |
| `ANDROID_KEY_PASSWORD` | Private key password |
| `ANDROID_STORE_PASSWORD` | Keystore password |

If **none** of these are set, the workflow generates a **self-signed keystore** and uses it for the build (suitable for testing, not for Play Store distribution).

### Built artifacts

| Platform | Architectures | Formats |
|----------|----------------|--------|
| Linux | x86_64, aarch64, armv7 | .deb, .rpm, .AppImage |
| Windows | x86_64, i686, aarch64 | .exe (NSIS), .msi |
| Android | arm64-v8a, armeabi-v7a, x86, x86_64 | .apk (per ABI), .aab |

The release step uploads all artifacts and adds **SHA256SUMS** and **SHA512SUMS** to the release. Verify with:
```bash
sha256sum -c SHA256SUMS
# or
sha512sum -c SHA512SUMS
```

### How to run the workflow

1. Open the repo on GitHub → **Actions** → **Build and Release**.
2. Click **Run workflow**.
3. Fill in **version** (required) and optionally change **prerelease**, **draft**, and platform toggles.
4. Run; when all selected builds succeed, a release is created (or updated) with the given tag (e.g. `v1.0.0`).

---

## 🎨 Icons Generation

Icons are generated from a **single source image** (default: `public/favicon.svg`) so that desktop, Android, and web all stay in sync.

### Command

```bash
npm run icons:generate
```

Or with a custom source path (relative to project root or absolute):

```bash
npm run icons:generate -- public/logo.svg
node scripts/icons-generate.js path/to/icon.svg
```

### What it does

1. **Prompts (interactive)**  
   - **Android launcher background color** — Hex color (e.g. `#ffffff`). Previous value is read from `src-tauri/icons/android/values/ic_launcher_background.xml` and used as default.  
   - **Android icon scale** — Icon size as percentage of canvas (e.g. `50` = 50%). Stored in `src-tauri/icons/android/icon-options.json` and reused as default next time.

2. **Standard Tauri icons**  
   Runs `tauri icon "<inputPath>"` to generate desktop icons (e.g. 32x32, 128x128, icon.ico, icon.icns) in `src-tauri/icons/`.

3. **Android background color**  
   After `tauri icon`, overwrites the Android background color in `src-tauri/icons/android/values/ic_launcher_background.xml` with the color you chose (so `tauri icon` doesn’t override it).

4. **Android mipmap icons**  
   Builds scaled, padded PNGs for Android adaptive icon:
   - **Launcher:** `ic_launcher.png`, `ic_launcher_round.png` (mdpi → xxxhdpi)
   - **Foreground:** `ic_launcher_foreground.png` (2.25× sizes for adaptive layer)

   Padding is applied so the icon is not clipped by the adaptive icon mask; the **scale** (e.g. 50%) controls how large the logo is within the canvas.

5. **Web icons**  
   Runs `node scripts/copy-vite-icons.js`, which copies from `src-tauri/icons/` to `public/`:
   - `32x32.png` → `public/favicon-32x32.png`
   - `128x128.png` → `public/apple-touch-icon.png`
   - `icon.ico` → `public/favicon.ico`

### Icon options (saved)

| Option | File | Description |
|--------|------|-------------|
| Android background color | `src-tauri/icons/android/values/ic_launcher_background.xml` | `<color name="ic_launcher_background">#rrggbb</color>` |
| Scale (percent) | `src-tauri/icons/android/icon-options.json` | `{ "scalePercent": 50 }` — used as default for next run |

### Scale input format

When prompted for **Android icon scale**, you can enter:
- A number 1–100 (e.g. `50`) → treated as percent.
- A number 0.01–1 (e.g. `0.5`) → treated as fraction.
- With or without `%` (e.g. `50%`).

### Non-interactive / CI

The script is interactive by default. For CI or scripts, you would need to either:
- Pipe answers into it (e.g. `echo -e " #ffffff\n 50" | npm run icons:generate`), or
- Pre-create/update `icon-options.json` and `values/ic_launcher_background.xml` and adapt the script to read from env or args (not implemented in the current script).

---

## 📁 Project Structure

```
Vite-Express-Tauri-Template-DevKit/
├── .github/
│   └── workflows/
│       └── build-release.yml    # Build & release workflow
├── public/
│   └── favicon.svg              # Default icon source for icons:generate
├── server/                      # Express API
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── src/                         # React frontend (Animator app)
│   ├── App.tsx                  # Import screen → AppShell when model loaded
│   ├── components/
│   │   ├── import/              # ImportDropzone landing
│   │   ├── layout/              # AppHeader, AppShell
│   │   ├── modals/              # About, Guide, Export
│   │   ├── panels/              # Bone tree, scene info, animation library, transform
│   │   ├── timeline/            # Keyframe editor + transport controls
│   │   ├── viewport/            # R3F canvas, gizmo, skeleton overlay
│   │   └── ui/                  # Button, Panel, Modal, Tabs, NumberInput
│   ├── contexts/                # ThemeContext (dark/light)
│   ├── hooks/                   # useOpenModel
│   ├── lib/                     # loaders, clip-builder, procedural anims, export, tauri
│   ├── store/                   # modelStore, animationStore (zustand)
│   └── types/                   # ModelData, ClipMeta, keyframe types
├── RefDesign/                   # UI reference only (not bundled)
├── src-tauri/                   # Tauri + Rust
│   ├── src/
│   │   ├── main.rs
│   │   └── lib.rs
│   ├── icons/                   # Generated + Android custom
│   │   ├── 32x32.png, 128x128.png, icon.ico, icon.icns, ...
│   │   └── android/
│   │       ├── values/ic_launcher_background.xml
│   │       ├── icon-options.json
│   │       └── mipmap-*/        # Launcher & foreground PNGs
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── ...
├── scripts/
│   ├── icons-generate.js        # Icon generation (tauri + Android + web)
│   └── copy-vite-icons.js       # Copy Tauri icons → public/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── LICENSE
└── README.md
```

---

## ⚙️ Configuration

### Tauri
- **`src-tauri/tauri.conf.json`** — App name, version, identifier, window size, `beforeDevCommand` / `beforeBuildCommand`, bundle targets and icon list. Change here for product name and desktop behavior.

### Frontend
- **`vite.config.ts`** — Vite and React plugin; dev server port (default 5173).
- **`index.html`** — Title and favicon links (use `npm run icons:generate` to refresh favicons in `public/`).

### Backend
- **`server/`** — Port and environment in `server/src/index.ts` (or env vars as you add them).

### Version (for releases)
The GitHub Actions workflow patches version in:
- `package.json`
- `server/package.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`

For local releases, keep these in sync manually or run your own patch step.

---

## 🤝 Contributing

1. Fork the repository.
2. Create a branch: `git checkout -b feature/your-feature` or `fix/your-fix`.
3. Make changes; follow existing style (ESLint, TypeScript, Rust fmt/clippy).
4. Commit with a clear message (e.g. `Add: ...`, `Fix: ...`, `Docs: ...`).
5. Push and open a Pull Request.

---

## 💬 Support

- **Issues:** [GitHub Issues](https://github.com/Roboticela/Vite-Express-Tauri-Template-DevKit/issues) for bugs and feature requests.
- **Repository:** [Roboticela/Vite-Express-Tauri-Template-DevKit](https://github.com/Roboticela/Vite-Express-Tauri-Template-DevKit).

---

## 📄 License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for the full text.

---

## 🏢 About Roboticela

<div align="center">
   <img src="public/CompanyLogo.png" alt="Roboticela Logo" width="200" style="padding:30px;" />
</div>

**[Roboticela](https://github.com/Roboticela)** maintains this template for building cross-platform apps with Vite, Express, and Tauri. Star the repo if you find it useful.

---

<div align="center">

**Built with ❤️ by [Roboticela](https://github.com/Roboticela)**

[⬆ Back to Top](#-vite--express--tauri-template-devkit)

</div>
