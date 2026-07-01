import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "fs";
import { createInterface } from "readline";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const ANDROID_BG_XML = join(root, "src-tauri", "icons", "android", "values", "ic_launcher_background.xml");
const ANDROID_ICON_OPTIONS = join(root, "src-tauri", "icons", "android", "icon-options.json");

/** Normalize hex color to #rrggbb (Android color format). */
function normalizeHex(color) {
  const hex = color.replace(/^#/, "").trim();
  if (hex.length === 3) {
    const r = hex[0] + hex[0], g = hex[1] + hex[1], b = hex[2] + hex[2];
    return `#${r}${g}${b}`;
  }
  if (hex.length === 6 || hex.length === 8) return `#${hex.slice(0, 6)}`;
  return null;
}

/** Read current Android launcher background color from values XML (exact string for display). */
function getCurrentAndroidBgColorRaw() {
  if (!existsSync(ANDROID_BG_XML)) return "#ffffff";
  try {
    const xml = readFileSync(ANDROID_BG_XML, "utf8");
    const m = xml.match(/ic_launcher_background">\s*(#[\da-fA-F]{3,8})/);
    return m ? m[1].trim() : "#ffffff";
  } catch {
    return "#ffffff";
  }
}

/** Read current Android launcher background color normalized (#rrggbb). */
function getCurrentAndroidBgColor() {
  return normalizeHex(getCurrentAndroidBgColorRaw()) || "#ffffff";
}

/** Read last-used icon options (scalePercent). Returns { scalePercent: 50 } if missing. */
function readIconOptions() {
  if (!existsSync(ANDROID_ICON_OPTIONS)) return { scalePercent: 50 };
  try {
    const data = JSON.parse(readFileSync(ANDROID_ICON_OPTIONS, "utf8"));
    const p = Number(data.scalePercent);
    return { scalePercent: Number.isFinite(p) && p >= 1 && p <= 100 ? p : 50 };
  } catch {
    return { scalePercent: 50 };
  }
}

/** Write last-used icon options. */
function writeIconOptions(opts) {
  const dir = dirname(ANDROID_ICON_OPTIONS);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(ANDROID_ICON_OPTIONS, JSON.stringify(opts, null, 2), "utf8");
}

/** Ask user for a string; default used when they press Enter. */
function promptLine(question, defaultValue) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve((answer || defaultValue).trim());
    });
  });
}

/** Ask user for Android background color; default = previous value. Returns normalized #rrggbb. */
async function promptAndroidBgColor(previousColorRaw) {
  const defaultDisplay = previousColorRaw.toLowerCase();
  const raw = await promptLine(
    `Android launcher icon background color [${defaultDisplay}]: `,
    defaultDisplay
  );
  const normalized = normalizeHex(raw || defaultDisplay);
  return normalized || normalizeHex(previousColorRaw) || "#ffffff";
}

/** Parse scale from user input (e.g. "50", "50%", "0.5"). Returns 0.01–1, or null if invalid. */
function parseScale(input) {
  if (input == null || input === "") return null;
  const s = String(input).replace(/%/g, "").trim();
  const n = parseFloat(s);
  if (Number.isNaN(n)) return null;
  if (n > 1 && n <= 100) return n / 100; // 50 → 0.5
  if (n >= 0.01 && n <= 1) return n;
  return null;
}

/** Ask user for icon scale (icon size as % of canvas); default 50%. Returns 0.01–1. */
async function promptScale(defaultPercent = 50) {
  const defaultStr = `${defaultPercent}%`;
  const raw = await promptLine(
    `Android icon scale (icon size as % of canvas) [${defaultStr}]: `,
    defaultStr
  );
  const parsed = parseScale(raw || defaultStr);
  return parsed != null ? parsed : defaultPercent / 100;
}

/** Write Android launcher background color to values XML. */
function writeAndroidBgColor(hex) {
  const dir = dirname(ANDROID_BG_XML);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <color name="ic_launcher_background">${hex}</color>
</resources>
`;
  writeFileSync(ANDROID_BG_XML, xml, "utf8");
}

const input = process.argv[2] || "public/favicon.svg";
const inputPath = input.startsWith("/") ? input : join(root, input);

console.log(`Generating icons from: ${inputPath}\n`);

// ── Ask for inputs first (defaults = previous values) ───────────────────────
const previousBgRaw = getCurrentAndroidBgColorRaw();
const previousIconOpts = readIconOptions();

const androidBgColor = await promptAndroidBgColor(previousBgRaw);
const scale = await promptScale(previousIconOpts.scalePercent);

writeIconOptions({ scalePercent: Math.round(scale * 100) });
console.log(`   Background: ${androidBgColor}, scale: ${Math.round(scale * 100)}%\n`);

// ── Step 1: Standard icons (desktop, Windows Store, iOS) via tauri icon ───────
console.log("→ Standard icons (tauri icon)...");
execSync(`tauri icon "${inputPath}"`, { cwd: root, stdio: "inherit" });

// tauri icon overwrites Android XML; restore our chosen background color
writeAndroidBgColor(androidBgColor);

// ── Step 2: Android mipmap icons — source image padded by scale ───────────────
//
//  Original image is centered in a canvas; scale = icon size as fraction of
//  canvas (e.g. 50% → icon is half of each dimension). Then resized to each
//  mipmap resolution.  This prevents the icon from being clipped by the
//  Android adaptive-icon mask or rounded-corner shape.
//
//  Sizes follow Android density buckets:
//    ic_launcher / ic_launcher_round : standard launcher icon
//    ic_launcher_foreground           : foreground layer for adaptive icons (2.25×)

console.log("\n→ Android icons with scale " + Math.round(scale * 100) + "%...");

const MIPMAP_SIZES = {
  "mipmap-mdpi":    { launcher: 48,  foreground: 108 },
  "mipmap-hdpi":    { launcher: 72,  foreground: 162 },
  "mipmap-xhdpi":   { launcher: 96,  foreground: 216 },
  "mipmap-xxhdpi":  { launcher: 144, foreground: 324 },
  "mipmap-xxxhdpi": { launcher: 192, foreground: 432 },
};

// Rasterize source to a large, square, high-quality PNG first so the padding
// maths are consistent regardless of whether the source is SVG or raster.
const BASE_SIZE = 1024;
// scale = icon size / total size → total = BASE_SIZE/scale → pad each side = (total - BASE_SIZE)/2
const PAD = Math.round((BASE_SIZE / scale - BASE_SIZE) / 2);

const sourceBuffer = await sharp(inputPath, { density: 300 })
  .resize(BASE_SIZE, BASE_SIZE, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

// Add the transparent padding border
const paddedBuffer = await sharp(sourceBuffer)
  .extend({
    top: PAD,
    bottom: PAD,
    left: PAD,
    right: PAD,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

const androidDir = join(root, "src-tauri", "icons", "android");

for (const [mipmap, sizes] of Object.entries(MIPMAP_SIZES)) {
  const dir = join(androidDir, mipmap);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  for (const name of ["ic_launcher.png", "ic_launcher_round.png"]) {
    await sharp(paddedBuffer)
      .resize(sizes.launcher, sizes.launcher)
      .png()
      .toFile(join(dir, name));
    console.log(`   ${mipmap}/${name} (${sizes.launcher}×${sizes.launcher})`);
  }

  await sharp(paddedBuffer)
    .resize(sizes.foreground, sizes.foreground)
    .png()
    .toFile(join(dir, "ic_launcher_foreground.png"));
  console.log(`   ${mipmap}/ic_launcher_foreground.png (${sizes.foreground}×${sizes.foreground})`);
}

// ── Step 3: Copy icons for the web frontend ────────────────────────────────────
console.log("\n→ Copying icons for web...");
execSync("node scripts/copy-vite-icons.js", { cwd: root, stdio: "inherit" });

console.log("\n✅ All icons generated.");
