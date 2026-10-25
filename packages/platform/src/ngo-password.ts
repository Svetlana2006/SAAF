import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export async function hashNgoPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, KEY_LENGTH) as Buffer;
  return `scrypt$${salt}$${key.toString("hex")}`;
}

export async function verifyNgoPassword(password: string, passwordHash: string) {
  const [algorithm, salt, storedHex, ...extra] = passwordHash.split("$");
  if (algorithm !== "scrypt" || !salt || !storedHex || extra.length > 0 || !/^[a-f0-9]{128}$/i.test(storedHex)) return false;
  const storedKey = Buffer.from(storedHex, "hex");
  const candidateKey = await scrypt(password, salt, KEY_LENGTH) as Buffer;
  return timingSafeEqual(storedKey, candidateKey);
}
