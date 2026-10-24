const signatures: Record<string, (bytes: Uint8Array) => boolean> = {
  "image/jpeg": bytes => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  "image/png": bytes => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47,
  "image/webp": bytes => String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP",
};

export async function isAllowedImage(file: File) {
  const check = signatures[file.type];
  if (!check || file.size === 0) return false;
  return check(new Uint8Array(await file.slice(0, 12).arrayBuffer()));
}
