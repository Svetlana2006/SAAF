import test from "node:test";
import assert from "node:assert/strict";
import { hasTrustedRole, ngoScopedWhere } from "../../../packages/platform/src/auth-policy";
import { OpportunityDecisionSchema, PublicReportBodySchema, VolunteerSignupSchema } from "../lib/public-input";
import { canAcceptOpportunity, canTransitionMission, hasMissionCapacity, isValidReportPhotoCount, reportImageCreateData } from "../../../packages/platform/src/workflow-policy";
import { isAllowedImage } from "../../../packages/platform/src/image-validation";
import { platformUnavailableMessage } from "../../../packages/platform/src/api-helpers";

test("unauthenticated and wrong-role users are denied", () => {
  assert.equal(hasTrustedRole(null, ["admin"]), false);
  assert.equal(hasTrustedRole({ app_metadata: { role: "csr" } }, ["admin"]), false);
});

test("only a trusted app_metadata role grants portal access", () => {
  assert.equal(hasTrustedRole({ app_metadata: { role: "admin" } }, ["admin"]), true);
  const userEditableMetadata = { user_metadata: { role: "admin" } };
  assert.equal(hasTrustedRole(userEditableMetadata, ["admin"]), false);
});

test("NGO query scope always uses the server-resolved organization", () => {
  assert.deepEqual(ngoScopedWhere("ngo-a", { status: "open" }), { status: "open", ngoId: "ngo-a" });
  assert.deepEqual(ngoScopedWhere("ngo-a", { ngoId: "ngo-b" }), { ngoId: "ngo-a" });
  assert.notDeepEqual(ngoScopedWhere("ngo-a"), ngoScopedWhere("ngo-b"));
});

test("report input accepts valid anonymous reports and rejects invalid coordinates or status fields", () => {
  const valid = { category: "Choked Storm Drain", severity: "Urgent / Obstruction", latitude: "28.6", longitude: "77.2", address: "Market road" };
  assert.equal(PublicReportBodySchema.safeParse(valid).success, true);
  assert.equal(PublicReportBodySchema.safeParse({ ...valid, latitude: "999" }).success, false);
  const withForgedStatus = PublicReportBodySchema.safeParse({ ...valid, status: "completed" });
  assert.equal(withForgedStatus.success && "status" in withForgedStatus.data, false);
});

test("volunteer signup rejects malformed personal data and accepts valid input", () => {
  const valid = { missionId: "mission-1", name: "Asha Rao", email: "asha@example.org", phone: "1234567890", skills: ["Cleanup"], preferredShift: "Morning", consentGiven: true };
  assert.equal(VolunteerSignupSchema.safeParse(valid).success, true);
  assert.equal(VolunteerSignupSchema.safeParse({ ...valid, email: "bad", consentGiven: false }).success, false);
});

test("report image persistence preserves all uploaded photos and their Cloudinary metadata", () => {
  const uploaded = [
    { photoUrl: "https://images.example/one", cloudinaryId: "saaf/reports/one", purpose: "report" },
    { photoUrl: "https://images.example/two", cloudinaryId: "saaf/reports/two", purpose: "report" },
    { photoUrl: "https://images.example/three", cloudinaryId: "saaf/reports/three", purpose: "report" },
  ];
  assert.deepEqual(reportImageCreateData(uploaded), uploaded);
  assert.equal(reportImageCreateData(uploaded).length, 3);
});

test("report submissions require three to five photos", () => {
  assert.equal(isValidReportPhotoCount(2), false);
  assert.equal(isValidReportPhotoCount(3), true);
  assert.equal(isValidReportPhotoCount(5), true);
  assert.equal(isValidReportPhotoCount(6), false);
});

test("NGO mission status transitions accept only the configured next states", () => {
  assert.equal(canTransitionMission("planned", "mobilizing"), true);
  assert.equal(canTransitionMission("mobilizing", "in_progress"), true);
  assert.equal(canTransitionMission("in_progress", "review_pending"), true);
  assert.equal(canTransitionMission("completed", "planned"), false);
  assert.equal(canTransitionMission("planned", "completed"), false);
});

test("public and NGO volunteer assignment capacity is bounded", () => {
  assert.equal(hasMissionCapacity(0, 1), true);
  assert.equal(hasMissionCapacity(1, 1), false);
  assert.equal(hasMissionCapacity(-1, 5), false);
  assert.equal(hasMissionCapacity(1.5, 5), false);
});

test("mission opportunity decisions allow accept or decline and reject other actions", () => {
  assert.equal(OpportunityDecisionSchema.safeParse({ decision: "accept" }).success, true);
  assert.equal(OpportunityDecisionSchema.safeParse({ decision: "decline" }).success, true);
  assert.equal(OpportunityDecisionSchema.safeParse({ decision: "delete" }).success, false);
});

test("an NGO can accept only an offered, open report with a resolved location", () => {
  assert.equal(canAcceptOpportunity("offered", "open", true), true);
  assert.equal(canAcceptOpportunity("declined", "open", true), false);
  assert.equal(canAcceptOpportunity("offered", "assigned", true), false);
  assert.equal(canAcceptOpportunity("offered", "open", false), false);
});

test("evidence upload accepts matching image signatures and rejects spoofed content", async () => {
  const jpg = new File([new Uint8Array([0xff, 0xd8, 0xff, 0x00])], "evidence.jpg", { type: "image/jpeg" });
  const spoofed = new File([new Uint8Array([0x00, 0x00, 0x00, 0x00])], "evidence.png", { type: "image/png" });
  const empty = new File([], "empty.png", { type: "image/png" });
  assert.equal(await isAllowedImage(jpg), true);
  assert.equal(await isAllowedImage(spoofed), false);
  assert.equal(await isAllowedImage(empty), false);
});

test("API service errors distinguish missing configuration from an unreachable database", () => {
  assert.match(platformUnavailableMessage(new Error("Environment variable not found: DATABASE_URL")) ?? "", /apps\/api\/\.env/);
  assert.match(platformUnavailableMessage(new Error("Can't reach database server at host")) ?? "", /PostgreSQL is running and accessible/);
  assert.equal(platformUnavailableMessage(new Error("Cloudinary upload failed")), null);
});
