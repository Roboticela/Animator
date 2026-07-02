export function downloadViewportScreenshot(canvas: HTMLCanvasElement, filename = "animator-viewport.png") {
  const url = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.replace(/\.png$/i, "") + ".png";
  link.click();
}

export function getViewportCanvas(root: HTMLElement | null): HTMLCanvasElement | null {
  return root?.querySelector("canvas") ?? null;
}
