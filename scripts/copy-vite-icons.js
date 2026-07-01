import { copyFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const iconsDir = join(root, "src-tauri", "icons");
const publicDir = join(root, "public");

const copies = [
  ["32x32.png", "favicon-32x32.png"],
  ["128x128.png", "apple-touch-icon.png"],
  ["icon.ico", "favicon.ico"],
];

if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

for (const [from, to] of copies) {
  const src = join(iconsDir, from);
  const dest = join(publicDir, to);
  if (existsSync(src)) {
    copyFileSync(src, dest);
    console.log(`Copied ${from} -> public/${to}`);
  } else {
    console.warn(`Skipped ${from} (not found). Run \`tauri icon\` first.`);
  }
}
