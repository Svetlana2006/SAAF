import assert from "node:assert/strict";
import test from "node:test";
import { buildAdminAuditCsv, calculateAdminDashboardMetrics, canCompleteMission, canTransitionReportStatus } from "../../../packages/platform/src/admin-policy";

test("Admin report status transitions require a compatible mission relationship", () => {
  assert.equal(canTransitionReportStatus({ from: "open", to: "assigned", hasMission: false, hasCompletedMission: false }), false);
  assert.equal(canTransitionReportStatus({ from: "open", to: "assigned", hasMission: true, hasCompletedMission: false }), true);
  assert.equal(canTransitionReportStatus({ from: "assigned", to: "completed", hasMission: true, hasCompletedMission: false }), false);
  assert.equal(canTransitionReportStatus({ from: "assigned", to: "completed", hasMission: true, hasCompletedMission: true }), true);
  assert.equal(canTransitionReportStatus({ from: "completed", to: "open", hasMission: false, hasCompletedMission: false }), false);
});

test("Mission completion requires review-pending status and approved after evidence", () => {
  assert.equal(canCompleteMission("in_progress", ["approved"]), false);
  assert.equal(canCompleteMission("review_pending", []), false);
  assert.equal(canCompleteMission("review_pending", ["approved", "pending"]), false);
  assert.equal(canCompleteMission("review_pending", ["approved", "approved"]), true);
});

test("Admin dashboard aggregates actual grouped report, mission and internal grant totals", () => {
  const metrics = calculateAdminDashboardMetrics({
    reports: [{ status: "open", count: 2 }, { status: "assigned", count: 3 }],
    missions: [{ status: "in_progress", count: 2 }, { status: "completed", count: 1 }],
    grants: [{ status: "committed", count: 2, amount: 500 }, { status: "released", count: 1, amount: 125 }, { status: "cancelled", count: 1, amount: 900 }],
    activeNgos: 4, registeredVolunteers: 12, pendingEvidence: 5, approvedEvidence: 7, activeHotspots: 3, legacyFundingRecords: 6,
  });
  assert.equal(metrics.reportTotal, 5);
  assert.equal(metrics.reportStatuses.open, 2);
  assert.equal(metrics.missionTotal, 3);
  assert.equal(metrics.csrCommitmentTotal, 625);
  assert.equal(metrics.grantStatuses.cancelled.amount, 900);
  assert.equal(metrics.registeredVolunteers, 12);
});

test("Admin audit CSV escapes commas, quotes, JSON and newlines", () => {
  const output = buildAdminAuditCsv([{
    auditId: "a1", createdAt: new Date("2026-10-25T00:00:00.000Z"), actorUserId: "admin-1", actionType: "report.status_changed", recordType: "report", recordId: "report-1",
    previousValue: { status: "open" }, newValue: { status: "assigned" }, note: "Checked, then \"approved\"\nby admin",
  }]);
  assert.match(output, /^"audit_id","timestamp","administrator_id"/);
  const escapedPrevious = `"${JSON.stringify({ status: "open" }).replace(/"/g, '""')}"`;
  assert.ok(output.includes(escapedPrevious));
  assert.match(output, /"Checked, then ""approved""\nby admin"$/);
});
