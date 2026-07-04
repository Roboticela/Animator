const GZIP_MAGIC_0 = 0x1f;
const GZIP_MAGIC_1 = 0x8b;

export function isGzipBytes(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === GZIP_MAGIC_0 && bytes[1] === GZIP_MAGIC_1;
}

async function streamToBytes(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.byteLength;
    }
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

export async function gzipBytes(input: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream === "undefined") {
    return input;
  }
  const stream = new Blob([input]).stream().pipeThrough(new CompressionStream("gzip"));
  return streamToBytes(stream);
}

export async function gunzipBytes(input: Uint8Array): Promise<Uint8Array> {
  if (!isGzipBytes(input) || typeof DecompressionStream === "undefined") {
    return input;
  }
  const stream = new Blob([input]).stream().pipeThrough(new DecompressionStream("gzip"));
  return streamToBytes(stream);
}
