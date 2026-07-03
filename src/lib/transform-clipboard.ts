export type Vec3 = [number, number, number];

export interface TransformClipboardValues {
  position: Vec3;
  rotationDeg: Vec3;
  scale: Vec3;
}

function parseNumbers(text: string): number[] {
  return text
    .trim()
    .split(/[\s,;]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
}

export function formatVec3(vec: Vec3, precision: number): string {
  return vec.map((v) => v.toFixed(precision)).join(", ");
}

export function parseVec3(text: string): Vec3 | null {
  const nums = parseNumbers(text);
  if (nums.length < 3) return null;
  return [nums[0]!, nums[1]!, nums[2]!];
}

export function formatTransform(values: TransformClipboardValues): string {
  return JSON.stringify({
    position: values.position.map((v) => Number(v.toFixed(4))),
    rotationDeg: values.rotationDeg.map((v) => Number(v.toFixed(2))),
    scale: values.scale.map((v) => Number(v.toFixed(4))),
  });
}

export function parseTransform(text: string): Partial<TransformClipboardValues> | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    const json = JSON.parse(trimmed) as Record<string, unknown>;
    const result: Partial<TransformClipboardValues> = {};

    const readVec = (raw: unknown): Vec3 | null => {
      if (!Array.isArray(raw) || raw.length < 3) return null;
      const nums = raw.map(Number);
      if (nums.some((n) => Number.isNaN(n))) return null;
      return [nums[0]!, nums[1]!, nums[2]!];
    };

    if (json.position) result.position = readVec(json.position) ?? undefined;
    if (json.rotationDeg) result.rotationDeg = readVec(json.rotationDeg) ?? undefined;
    if (json.rotation) result.rotationDeg = readVec(json.rotation) ?? undefined;
    if (json.scale) result.scale = readVec(json.scale) ?? undefined;

    if (result.position || result.rotationDeg || result.scale) return result;
  } catch {
    /* fall through to line format */
  }

  const result: Partial<TransformClipboardValues> = {};
  const lines = trimmed.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^(position|rotation|rotationdeg|scale)\s*[:=]\s*(.+)$/i);
    if (!match) continue;
    const vec = parseVec3(match[2]!);
    if (!vec) continue;
    const key = match[1]!.toLowerCase();
    if (key === "position") result.position = vec;
    else if (key.startsWith("rotation")) result.rotationDeg = vec;
    else if (key === "scale") result.scale = vec;
  }

  if (result.position || result.rotationDeg || result.scale) return result;

  const nums = parseNumbers(trimmed);
  if (nums.length >= 9) {
    return {
      position: [nums[0]!, nums[1]!, nums[2]!],
      rotationDeg: [nums[3]!, nums[4]!, nums[5]!],
      scale: [nums[6]!, nums[7]!, nums[8]!],
    };
  }

  return null;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function readClipboardText(): Promise<string | null> {
  try {
    return await navigator.clipboard.readText();
  } catch {
    return null;
  }
}
