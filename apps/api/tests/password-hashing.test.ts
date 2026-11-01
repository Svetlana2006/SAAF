import test from "node:test";
import assert from "node:assert/strict";
import { hashNgoPassword, verifyNgoPassword, needsPasswordRehash } from "../../../packages/platform/src/ngo-password";

test("hashes password with scrypt and verifies correct password", async () => {
  const password = "SuperSecretPassword123!";
  const hash = await hashNgoPassword(password);

  assert.match(hash, /^scrypt\$N=32768,r=8,p=1\$[a-f0-9]{64}\$[a-f0-9]{128}$/);

  const isValid = await verifyNgoPassword(password, hash);
  assert.equal(isValid, true, "Correct password must verify successfully");

  const isInvalid = await verifyNgoPassword("WrongPassword123!", hash);
  assert.equal(isInvalid, false, "Wrong password must fail verification");

  assert.equal(needsPasswordRehash(hash), false, "Fresh hash should not need rehash");
});

test("handles legacy hash format and flags it for rehash", async () => {
  // Legacy format: scrypt$<32-hex-salt>$<128-hex-hash>
  // Let's create a known legacy hash with Node default scrypt(16384, 8, 1)
  const { scryptSync } = await import("node:crypto");
  const salt = "0123456789abcdef0123456789abcdef";
  const derived = scryptSync("LegacyTestPassword!", salt, 64);
  const legacyHash = `scrypt$${salt}$${derived.toString("hex")}`;

  const isValid = await verifyNgoPassword("LegacyTestPassword!", legacyHash);
  assert.equal(isValid, true, "Legacy hash must verify successfully");

  const isInvalid = await verifyNgoPassword("WrongPassword!", legacyHash);
  assert.equal(isInvalid, false, "Wrong password against legacy hash must fail");

  assert.equal(needsPasswordRehash(legacyHash), true, "Legacy hash must be flagged for rehash");
});

test("safely handles malformed, truncated, or tampered hashes without throwing RangeError", async () => {
  const badHashes = [
    "",
    "not-a-hash",
    "bcrypt$xyz",
    "scrypt$",
    "scrypt$salt",
    "scrypt$salt$short", // short key (not 64 bytes)
    "scrypt$salt$xyznonhex",
    "scrypt$N=invalid,r=8,p=1$salt$hash",
    "scrypt$N=32768,r=8,p=1$0123456789abcdef$tooshort",
  ];

  for (const bad of badHashes) {
    const result = await verifyNgoPassword("TestPassword123!", bad);
    assert.equal(result, false, `Bad hash "${bad}" must return false without crashing`);
  }
});

test("rejects passwords that are too short or oversized", async () => {
  await assert.rejects(async () => {
    await hashNgoPassword("short");
  }, /at least 8 characters/);

  const hugePassword = "a".repeat(2000);
  await assert.rejects(async () => {
    await hashNgoPassword(hugePassword);
  }, /exceeds maximum/);
});
