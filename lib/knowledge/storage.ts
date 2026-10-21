import { binding, secret } from "./platform";
function blobURL(key: string) {
  const container = secret("AZURE_BLOB_CONTAINER_URL").replace(/\/$/, "");
  const sas = secret("AZURE_BLOB_SAS_TOKEN").replace(/^\?/, "");
  return `${container}/${encodeURIComponent(key)}${sas ? "?" + sas : ""}`;
}
export async function storeFile(key: string, bytes: Uint8Array, type: string) {
  if (secret("AZURE_BLOB_CONTAINER_URL")) {
    const response = await fetch(blobURL(key), {
      method: "PUT",
      headers: { "x-ms-blob-type": "BlockBlob", "Content-Type": type },
      body: bytes as BodyInit,
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok)
      throw new Error(`Blob upload failed (${response.status}).`);
    return;
  }
  const bucket = binding("BUCKET");
  if (bucket) {
    await bucket.put(key, bytes, { httpMetadata: { contentType: type } });
    return;
  }
  const root = secret("LOCAL_STORAGE_PATH");
  if (!root) throw new Error("File storage is not configured.");
  const fs = await import("node:fs/promises");
  await fs.mkdir(root, { recursive: true });
  await fs.writeFile(`${root}/${key}`, bytes);
}
export async function readFile(key: string) {
  if (secret("AZURE_BLOB_CONTAINER_URL")) {
    const response = await fetch(blobURL(key), {
      signal: AbortSignal.timeout(30000),
    });
    if (response.status === 404) return null;
    if (!response.ok)
      throw new Error(`Blob download failed (${response.status}).`);
    return {
      bytes: await response.arrayBuffer(),
      type: response.headers.get("content-type") || "application/octet-stream",
    };
  }
  const bucket = binding("BUCKET");
  if (bucket) {
    const f = await bucket.get(key);
    return f
      ? {
          bytes: await f.arrayBuffer(),
          type: f.httpMetadata?.contentType ?? "application/octet-stream",
        }
      : null;
  }
  const root = secret("LOCAL_STORAGE_PATH");
  if (!root) return null;
  const fs = await import("node:fs/promises");
  try {
    return {
      bytes: await fs.readFile(`${root}/${key}`),
      type: "application/octet-stream",
    };
  } catch {
    return null;
  }
}
export async function deleteFile(key: string) {
  if (secret("AZURE_BLOB_CONTAINER_URL")) {
    const response = await fetch(blobURL(key), {
      method: "DELETE",
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok && response.status !== 404)
      throw new Error(`Blob deletion failed (${response.status}).`);
    return;
  }
  const bucket = binding("BUCKET");
  if (bucket) await bucket.delete(key);
  else if (secret("LOCAL_STORAGE_PATH")) {
    const fs = await import("node:fs/promises");
    await fs.unlink(`${secret("LOCAL_STORAGE_PATH")}/${key}`).catch(() => {});
  }
}
