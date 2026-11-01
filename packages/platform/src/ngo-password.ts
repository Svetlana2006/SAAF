import { randomBytes, scrypt as scryptCallback, timingSafeEqual, type ScryptOptions } from "node:crypto";

function scryptAsync(
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options?: ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    if (options) {
      scryptCallback(password, salt, keylen, options, (err, derivedKey) => {
        if (err) return reject(err);
        resolve(derivedKey);
      });
    } else {
      scryptCallback(password, salt, keylen, (err, derivedKey) => {
        if (err) return reject(err);
        resolve(derivedKey);
      });
    }
  });
}

/** OWASP-recommended scrypt parameters for password storage */
const CURRENT_COST = 32768; // 2^15
const CURRENT_BLOCK_SIZE = 8;
const CURRENT_PARALLELIZATION = 1;
const KEY_LENGTH = 64; // 512-bit key
const MAX_MEM = 64 * 1024 * 1024; // 64 MB
const MAX_PASSWORD_LENGTH = 1024;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Hashes a password using scrypt with modern OWASP-compliant parameters and 256-bit salt.
 * Formats hash as: scrypt$N=<cost>,r=<blockSize>,p=<parallelization>$<saltHex>$<derivedKeyHex>
 */
export async function hashNgoPassword(password: string): Promise<string> {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new Error(`Password exceeds maximum supported length of ${MAX_PASSWORD_LENGTH} characters.`);
  }

  const salt = randomBytes(32).toString("hex");
  const options: ScryptOptions = {
    cost: CURRENT_COST,
    blockSize: CURRENT_BLOCK_SIZE,
    parallelization: CURRENT_PARALLELIZATION,
    maxmem: MAX_MEM,
  };

  const key = await scryptAsync(password, salt, KEY_LENGTH, options);
  const paramStr = `N=${CURRENT_COST},r=${CURRENT_BLOCK_SIZE},p=${CURRENT_PARALLELIZATION}`;
  return `scrypt$${paramStr}$${salt}$${key.toString("hex")}`;
}

/**
 * Constant-time verification of candidate password against stored scrypt hash.
 * Supports both modern parameterized format and legacy `scrypt$<salt>$<hash>` format.
 */
export async function verifyNgoPassword(password: string, passwordHash: string): Promise<boolean> {
  if (typeof password !== "string" || !password || typeof passwordHash !== "string" || !passwordHash) {
    return false;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return false;
  }

  try {
    const parts = passwordHash.split("$");

    let cost = 16384;
    let blockSize = 8;
    let parallelization = 1;
    let salt = "";
    let storedHex = "";

    if (parts.length === 4 && parts[0] === "scrypt") {
      // Modern format: scrypt$N=...,r=...,p=...$salt$hash
      const [, paramStr, saltPart, hashPart] = parts;
      const params = Object.fromEntries(
        paramStr.split(",").map((item) => item.split("=").map((s) => s.trim()))
      );
      cost = Number(params.N) || CURRENT_COST;
      blockSize = Number(params.r) || CURRENT_BLOCK_SIZE;
      parallelization = Number(params.p) || CURRENT_PARALLELIZATION;
      salt = saltPart;
      storedHex = hashPart;
    } else if (parts.length === 3 && parts[0] === "scrypt") {
      // Legacy format: scrypt$salt$hash (Node crypto default params)
      const [, saltPart, hashPart] = parts;
      cost = 16384;
      blockSize = 8;
      parallelization = 1;
      salt = saltPart;
      storedHex = hashPart;
    } else {
      return false;
    }

    if (!salt || !storedHex || !/^[a-f0-9]+$/i.test(storedHex) || !/^[a-f0-9]+$/i.test(salt)) {
      return false;
    }

    const storedKey = Buffer.from(storedHex, "hex");
    const options: ScryptOptions = {
      cost,
      blockSize,
      parallelization,
      maxmem: Math.max(MAX_MEM, 128 * cost * blockSize * 2),
    };

    const candidateKey = await scryptAsync(password, salt, storedKey.length, options);

    if (storedKey.length !== candidateKey.length) {
      return false;
    }

    return timingSafeEqual(storedKey, candidateKey);
  } catch {
    return false;
  }
}

/**
 * Returns true if the stored hash uses outdated parameters and should be upgraded.
 */
export function needsPasswordRehash(passwordHash: string): boolean {
  if (!passwordHash || typeof passwordHash !== "string") return true;
  const parts = passwordHash.split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt") return true;
  const expectedParams = `N=${CURRENT_COST},r=${CURRENT_BLOCK_SIZE},p=${CURRENT_PARALLELIZATION}`;
  return parts[1] !== expectedParams;
}

