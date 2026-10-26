import test from "node:test";
import assert from "node:assert/strict";
import { hasTrustedRole } from "../../../packages/platform/src/auth-policy";
import { allocationWithinMissionBudget, csrMissionViewScope, missionCanReceiveCsrCommitment, missionStatusAllowsCsrCommitment, scopeMissionDetailsToOwnGrants } from "../../../packages/platform/src/csr-policy";
import { buildCsrCsv, calculateCsrDashboardMetrics, csvCell, getFollowUpWindow, summarizeCsrFollowUps } from "../../../packages/platform/src/csr-metrics";
import { CsrGrantInputSchema, CsrMissionQuerySchema, isDuplicateCsrGrantError } from "../lib/csr-input";

test("CSR protected access accepts only trusted CSR app metadata", () => {
  assert.equal(hasTrustedRole(null, ["csr"]), false);
  assert.equal(hasTrustedRole({ app_metadata: { role: "admin" } }, ["csr"]), false);
  assert.equal(hasTrustedRole({ user_metadata: { role: "csr" } }, ["csr"]), false);
  assert.equal(hasTrustedRole({ app_metadata: { role: "csr" } }, ["csr"]), true);
});

test("CSR supported mission queries are always scoped to the authenticated organization", () => {
  assert.deepEqual(csrMissionViewScope("org-a", "supported"), { csrGrants: { some: { csrOrganizationId: "org-a" } } });
  assert.deepEqual(csrMissionViewScope("org-a", "available"), { isActive: true, status: { in: ["planned", "mobilizing", "in_progress"] }, csrGrants: { none: { csrOrganizationId: "org-a" } } });
  const all = csrMissionViewScope("org-a", "all");
  assert.equal(JSON.stringify(all).includes("org-b"), false);
  assert.equal(JSON.stringify(all).includes("org-a"), true);
});

test("unfunded mission opportunities do not expose another organization's private progress or evidence", () => {
  const opportunity = scopeMissionDetailsToOwnGrants({ csrGrants: [], impactReports: [{ impactId: "private-impact" }], evidences: [{ evidenceId: "private-evidence" }], missionActivities: [{ progressPercent: 88 }], statusEvents: [{ toStatus: "in_progress" }] });
  assert.equal(opportunity.supportedByOrganization, false);
  assert.deepEqual(opportunity.impactReports, []);
  assert.deepEqual(opportunity.evidences, []);
  assert.deepEqual(opportunity.missionActivities, []);
  assert.deepEqual(opportunity.statusEvents, []);
  const supported = scopeMissionDetailsToOwnGrants({ csrGrants: [{ grantId: "org-a-grant" }], impactReports: [{ impactId: "org-a-impact" }], evidences: [], missionActivities: [], statusEvents: [] });
  assert.equal(supported.supportedByOrganization, true);
  assert.equal(supported.impactReports.length, 1);
});

test("funding amount validation rejects invalid values and enforces remaining proposed budget", () => {
  assert.equal(allocationWithinMissionBudget(40, 100, 60), true);
  assert.equal(allocationWithinMissionBudget(40.01, 100, 60), false);
  assert.equal(allocationWithinMissionBudget(1, 100, 100), false);
  assert.equal(allocationWithinMissionBudget(-1, 100, 0), false);
  assert.equal(allocationWithinMissionBudget(Number.NaN, 100, 0), false);
});

test("completed or inactive missions and missions without an approved budget cannot receive commitments", () => {
  assert.equal(missionCanReceiveCsrCommitment({ isActive: true, status: "planned", estimatedCost: 100 }), true);
  assert.equal(missionCanReceiveCsrCommitment({ isActive: true, status: "mobilizing", estimatedCost: 100 }), true);
  assert.equal(missionCanReceiveCsrCommitment({ isActive: false, status: "planned", estimatedCost: 100 }), false);
  assert.equal(missionCanReceiveCsrCommitment({ isActive: true, status: "completed", estimatedCost: 100 }), false);
  assert.equal(missionCanReceiveCsrCommitment({ isActive: true, status: "review_pending", estimatedCost: 100 }), false);
  assert.equal(missionCanReceiveCsrCommitment({ isActive: true, status: "planned", estimatedCost: null }), false);
  assert.equal(missionStatusAllowsCsrCommitment({ isActive: true, status: "unknown" }), false);
});

test("CSR commitment request validates amount and duplicate constraint conflicts return a conflict", () => {
  assert.equal(CsrGrantInputSchema.safeParse({ missionId: "mission-1", amount: 20.5 }).success, true);
  assert.equal(CsrGrantInputSchema.safeParse({ missionId: "mission-1", amount: 0 }).success, false);
  assert.equal(CsrGrantInputSchema.safeParse({ missionId: "mission-1", amount: 1.001 }).success, false);
  assert.equal(isDuplicateCsrGrantError({ code: "P2002" }), true);
  assert.equal(isDuplicateCsrGrantError({ code: "P2034" }), false);
  const forgedOrganization = CsrGrantInputSchema.parse({ missionId: "mission-1", amount: 20, csrOrganizationId: "org-b" });
  assert.equal("csrOrganizationId" in forgedOrganization, false);
  const forgedMissionQuery = CsrMissionQuerySchema.parse({ view: "supported", csrOrganizationId: "org-b", ngoId: "ngo-b" });
  assert.equal("csrOrganizationId" in forgedMissionQuery, false);
  assert.equal("ngoId" in forgedMissionQuery, false);
});

test("30-day follow-up excludes ineligible missions and counts only same-window repeat reports", () => {
  const completedAt = new Date("2026-01-01T00:00:00.000Z");
  const window = getFollowUpWindow(completedAt);
  assert.equal(window.start.toISOString(), "2026-01-01T00:00:00.000Z");
  assert.equal(window.end.toISOString(), "2026-01-31T00:00:00.000Z");
  const summary = summarizeCsrFollowUps([
    { missionId: "m1", locationId: "l1", completedAt, reportsAfterCompletion: 0 },
    { missionId: "m2", locationId: "l2", completedAt, reportsAfterCompletion: 2 },
    { missionId: "m3", locationId: "l3", completedAt: new Date("2026-01-20T00:00:00Z"), reportsAfterCompletion: 0 },
  ], new Date("2026-02-01T00:00:00Z"));
  assert.deepEqual(summary, { windowDays: 30, eligibleMissions: 2, missionsWithNoRecordedRepeatReports: 1, repeatReports: 2 });
});

test("dashboard totals and statuses are calculated from scoped database aggregates", () => {
  assert.deepEqual(calculateCsrDashboardMetrics({ committedAmount: 1250.5, approvedFundingBudget: 2000, grantRecords: 2, missionStatuses: ["planned", "in_progress", "completed"], verifiedImpactReports: 1 }), {
    committedAmount: 1250.5, allocatedAmount: 1250.5, approvedFundingBudget: 2000, availableFunding: 749.5, overAllocatedAmount: 0, supportedMissions: 3,
    inProgressMissions: 1, completedMissions: 1, verifiedImpactReports: 1, grantRecords: 2,
  });
  assert.equal(calculateCsrDashboardMetrics({ committedAmount: 10, approvedFundingBudget: null, grantRecords: 1, missionStatuses: [], verifiedImpactReports: 0 }).availableFunding, null);
  assert.equal(calculateCsrDashboardMetrics({ committedAmount: 120, approvedFundingBudget: 100, grantRecords: 1, missionStatuses: [], verifiedImpactReports: 0 }).overAllocatedAmount, 20);
});

test("CSV cells escape quotes and preserve commas as one field", () => {
  assert.equal(csvCell('north, "ward"'), '"north, ""ward"""');
  assert.equal(csvCell(null), '""');
  assert.equal(buildCsrCsv(["mission", "location"], [["m1", 'north, "ward"']]), '"mission","location"\r\n"m1","north, ""ward"""');
});
