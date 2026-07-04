import * as THREE from "three";
import { collectSkeletonGroups, computeSceneStats } from "@/lib/bone-utils";
import type { ModelData } from "@/types/model";
import { yieldToMain } from "@/lib/yield-main";

export type HtmlTo3dCodeTarget = "vanilla" | "react";

export interface HtmlTo3dSource {
  html: string;
  css: string;
  js: string;
  width: number;
  height: number;
  planeWidth: number;
  name?: string;
}

export interface HtmlTo3dRenderResult {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  mesh: THREE.Mesh;
}

export const DEFAULT_HTML = `<div class="panel">
  <span class="badge">HTML → 3D</span>
  <h1>Hello World</h1>
  <p>Your UI rendered on a 3D plane.</p>
</div>`;

export const DEFAULT_CSS = `.panel {
  font-family: system-ui, sans-serif;
  color: #f8fafc;
  background: linear-gradient(145deg, #0f172a, #0d9488);
  padding: 28px 32px;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
  width: 100%;
  min-height: 100%;
}
.badge {
  display: inline-block;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.12);
  padding: 4px 10px;
  border-radius: 999px;
  margin-bottom: 12px;
}
h1 { margin: 0 0 8px; font-size: 32px; font-weight: 700; }
p { margin: 0; opacity: 0.9; font-size: 15px; line-height: 1.5; }`;

export const DEFAULT_JS = `// Optional: run after the panel loads
// document.querySelector('h1').textContent = 'Updated from JS';`;

function buildSrcDoc(source: HtmlTo3dSource): string {
  const { html, css, js, width, height } = source;
  const safeCss = css.replace(/<\/style/gi, "<\\/style");
  const safeJs = js.replace(/<\/script/gi, "<\\/script");
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; width: ${width}px; min-height: ${height}px; overflow: hidden; }
  ${safeCss}
</style>
</head>
<body>${html}</body>
<script>
  try { ${safeJs} } catch (err) { console.error(err); }
<\/script>
</html>`;
}

function escapeForSvgXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function rasterizeElementToCanvas(
  element: HTMLElement,
  css: string,
  width: number,
  height: number
): Promise<HTMLCanvasElement> {
  const w = Math.min(Math.max(element.scrollWidth || width, 1), 4096);
  const h = Math.min(Math.max(element.scrollHeight || height, 1), 4096);
  const safeCss = escapeForSvgXml(css);
  const inner = escapeForSvgXml(element.innerHTML);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width:${w}px;height:${h}px;">
      <style>${safeCss}</style>
      ${inner}
    </div>
  </foreignObject>
</svg>`;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not available.");

  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to rasterize HTML into a texture."));
    };
    img.src = url;
  });

  return canvas;
}

/** Renders HTML/CSS/JS in a sandboxed iframe and captures it to a canvas. */
export async function renderHtmlToCanvas(
  source: HtmlTo3dSource
): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
  iframe.style.cssText = `position:fixed;left:-12000px;top:0;width:${source.width}px;height:${source.height}px;border:0;opacity:0;pointer-events:none;`;
  iframe.srcdoc = buildSrcDoc(source);
  document.body.appendChild(iframe);

  try {
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error("HTML preview timed out.")), 20_000);
      iframe.onload = () => {
        window.clearTimeout(timer);
        resolve();
      };
    });

    await yieldToMain();
    await new Promise((r) => window.setTimeout(r, 120));

    const doc = iframe.contentDocument;
    if (!doc?.body) throw new Error("Could not access the HTML preview document.");

    const canvas = await rasterizeElementToCanvas(doc.body, source.css, source.width, source.height);
    return { canvas, width: canvas.width, height: canvas.height };
  } finally {
    iframe.remove();
  }
}

export function createMeshFromCanvas(
  canvas: HTMLCanvasElement,
  pixelWidth: number,
  pixelHeight: number,
  planeWidth: number,
  name = "HTML Panel"
): THREE.Mesh {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  const aspect = pixelWidth / Math.max(pixelHeight, 1);
  const planeHeight = planeWidth / aspect;

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(planeWidth, planeHeight),
    new THREE.MeshPhongMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    })
  );
  mesh.name = name;
  mesh.userData._animatorHtmlPanel = true;
  return mesh;
}

export async function buildHtmlTo3dMesh(source: HtmlTo3dSource): Promise<HtmlTo3dRenderResult> {
  const { canvas, width, height } = await renderHtmlToCanvas(source);
  const mesh = createMeshFromCanvas(canvas, width, height, source.planeWidth, source.name ?? "HTML Panel");
  return { canvas, width, height, mesh };
}

export function createModelFromHtmlMesh(mesh: THREE.Mesh, sourceName: string): ModelData {
  const root = new THREE.Group();
  root.name = "HTML Scene";
  root.add(mesh);
  mesh.position.set(0, mesh.scale.y * 0.5, 0);

  const skeletonGroups = collectSkeletonGroups(root);
  const stats = computeSceneStats(root);

  return {
    object3D: root,
    skeletonGroups,
    embeddedClips: [],
    stats,
    sourceName,
    sourceExt: "glb",
    texturesEmbedded: true,
  };
}

function encodeForTemplate(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

/** Standalone Three.js HTML page that renders the panel on a 3D plane. */
export function generateVanillaThreeCode(source: HtmlTo3dSource): string {
  const html = encodeForTemplate(source.html);
  const css = encodeForTemplate(source.css);
  const js = encodeForTemplate(source.js);
  const w = source.width;
  const h = source.height;
  const planeW = source.planeWidth;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HTML to 3D — Vanilla Three.js</title>
  <style>
    * { margin: 0; box-sizing: border-box; }
    body { overflow: hidden; background: #0b0f14; }
    #app { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script type="importmap">
    { "imports": { "three": "https://unpkg.com/three@0.185.0/build/three.module.js" } }
  </script>
  <script type="module">
    import * as THREE from "three";
    import { OrbitControls } from "https://unpkg.com/three@0.185.0/examples/jsm/controls/OrbitControls.js";

    const HTML = \`${html}\`;
    const CSS = \`${css}\`;
    const JS = \`${js}\`;
    const PANEL_W = ${w};
    const PANEL_H = ${h};
    const PLANE_W = ${planeW};

    async function renderPanelTexture() {
      const iframe = document.createElement("iframe");
      iframe.sandbox = "allow-scripts allow-same-origin";
      iframe.style.cssText = "position:fixed;left:-9999px;width:" + PANEL_W + "px;height:" + PANEL_H + "px;border:0;";
      iframe.srcdoc = \`<!DOCTYPE html><html><head><style>\${CSS}</style></head><body>\${HTML}</body><script>try{\${JS}}catch(e){console.error(e)}<\\/script></html>\`;
      document.body.appendChild(iframe);
      await new Promise((r) => (iframe.onload = r));
      await new Promise((r) => setTimeout(r, 120));
      const body = iframe.contentDocument.body;
      const canvas = document.createElement("canvas");
      canvas.width = body.scrollWidth || PANEL_W;
      canvas.height = body.scrollHeight || PANEL_H;
      const ctx = canvas.getContext("2d");
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + canvas.width + '" height="' + canvas.height + '"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml"><style>' + CSS + '</style>' + body.innerHTML + '</div></foreignObject></svg>';
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, 0, 0); iframe.remove(); resolve(); };
        img.onerror = reject;
        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      });
      return canvas;
    }

    const canvas = await renderPanelTexture();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f14);
    const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
    camera.position.set(0, 1.2, 3.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    document.getElementById("app").appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.8, 0);
    controls.update();

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(2, 4, 3);
    scene.add(key);

    const aspect = canvas.width / canvas.height;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(PLANE_W, PLANE_W / aspect),
      new THREE.MeshPhongMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })
    );
    mesh.position.y = (PLANE_W / aspect) * 0.5;
    scene.add(mesh);

    window.addEventListener("resize", () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });

    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });
  </script>
</body>
</html>`;
}

/** React Three Fiber component source that renders the panel on a 3D plane. */
export function generateReactThreeCode(source: HtmlTo3dSource): string {
  const html = JSON.stringify(source.html);
  const css = JSON.stringify(source.css);
  const js = JSON.stringify(source.js);

  return `import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

const HTML = ${html};
const CSS = ${css};
const JS = ${js};
const PANEL_W = ${source.width};
const PANEL_H = ${source.height};
const PLANE_W = ${source.planeWidth};

async function renderPanelTexture() {
  const iframe = document.createElement("iframe");
  iframe.sandbox = "allow-scripts allow-same-origin";
  iframe.style.cssText = \`position:fixed;left:-9999px;width:\${PANEL_W}px;height:\${PANEL_H}px;border:0;\`;
  iframe.srcdoc = \`<!DOCTYPE html><html><head><style>\${CSS}</style></head><body>\${HTML}</body><script>try{\${JS}}catch(e){console.error(e)}<\\/script></html>\`;
  document.body.appendChild(iframe);
  await new Promise<void>((r) => (iframe.onload = () => r()));
  await new Promise((r) => setTimeout(r, 120));
  const body = iframe.contentDocument!.body;
  const canvas = document.createElement("canvas");
  canvas.width = body.scrollWidth || PANEL_W;
  canvas.height = body.scrollHeight || PANEL_H;
  const ctx = canvas.getContext("2d")!;
  const svg = \`<svg xmlns="http://www.w3.org/2000/svg" width="\${canvas.width}" height="\${canvas.height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml"><style>\${CSS}</style>\${body.innerHTML}</div></foreignObject></svg>\`;
  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => { ctx.drawImage(img, 0, 0); iframe.remove(); resolve(); };
    img.onerror = reject;
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
  return canvas;
}

function HtmlPanelMesh() {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    let disposed = false;
    void renderPanelTexture().then((canvas) => {
      if (disposed) return;
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      setTexture(tex);
    });
    return () => { disposed = true; };
  }, []);

  const size = useMemo(() => {
    if (!texture?.image) return [PLANE_W, PLANE_W * 0.6] as [number, number];
    const img = texture.image as HTMLCanvasElement;
    const aspect = img.width / Math.max(img.height, 1);
    return [PLANE_W, PLANE_W / aspect] as [number, number];
  }, [texture]);

  if (!texture) return null;

  return (
    <mesh position={[0, size[1] * 0.5, 0]}>
      <planeGeometry args={size} />
      <meshPhongMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

export function HtmlTo3dScene() {
  return (
    <Canvas camera={{ position: [0, 1.2, 3.2], fov: 45 }}>
      <color attach="background" args={["#0b0f14"]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[2, 4, 3]} intensity={0.9} />
      <HtmlPanelMesh />
      <OrbitControls target={[0, 0.8, 0]} />
    </Canvas>
  );
}`;
}

export function generateHtmlTo3dCode(source: HtmlTo3dSource, target: HtmlTo3dCodeTarget): string {
  return target === "react" ? generateReactThreeCode(source) : generateVanillaThreeCode(source);
}
