import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { createRateLimitBucketKey, getRateLimitClientAddress } from "../../../packages/platform/src/rate-limit";

test("rate limiting only uses a valid normalized client IP header", () => {
  const spoofableForwardedFor = new NextRequest("https://api.example.test", {
    headers: {
      "x-forwarded-for": "203.0.113.99",
      "x-real-ip": "192.0.2.10",
    },
  });
  assert.equal(getRateLimitClientAddress(spoofableForwardedFor, "x-real-ip"), "192.0.2.10");
  assert.equal(getRateLimitClientAddress(spoofableForwardedFor, undefined), "unknown");

  const invalidAddress = new NextRequest("https://api.example.test", {
    headers: { "x-real-ip": "attacker-controlled" },
  });
  assert.equal(getRateLimitClientAddress(invalidAddress, "x-real-ip"), "unknown");
});

test("rate-limit bucket keys do not expose client addresses", () => {
  const key = createRateLimitBucketKey("signup", "192.0.2.10", "test-secret");
  assert.equal(key.length, 64);
  assert.equal(key.includes("192.0.2.10"), false);
  assert.notEqual(key, createRateLimitBucketKey("signup", "198.51.100.20", "test-secret"));
});
