export function canTransitionReportStatus(input: { from: string; to: string; hasMission: boolean; hasCompletedMission: boolean }): boolean {
  if (input.from === input.to) return false;
  if (input.from === "open") return input.to === "assigned" && input.hasMission;
  if (input.from === "assigned") {
    if (input.to === "completed") return input.hasCompletedMission;
    if (input.to === "open") return !input.hasMission;
  }
  return false;
}

export function canCompleteMission(status: string, afterEvidenceStatuses: readonly string[]): boolean {
  return status === "review_pending" && afterEvidenceStatuses.length > 0 && afterEvidenceStatuses.every(value => value === "approved");
}

export function calculateAdminDashboardMetrics(input: {
  reports: readonly { status: string; count: number }[];
  missions: readonly { status: string; count: number }[];
  grants: readonly { status: string; count: number; amount: number }[];
  activeNgos: number;
  registeredVolunteers: number;
  pendingEvidence: number;
  approvedEvidence: number;
  activeHotspots: number;
  legacyFundingRecords: number;
}) {
  const reportStatuses = Object.fromEntries(input.reports.map(item => [item.status, item.count]));
  const missionStatuses = Object.fromEntries(input.missions.map(item => [item.status, item.count]));
  const grantStatuses = Object.fromEntries(input.grants.map(item => [item.status, { count: item.count, amount: item.amount }]));
  return {
    reportTotal: input.reports.reduce((sum, item) => sum + item.count, 0),
    reportStatuses,
    missionTotal: input.missions.reduce((sum, item) => sum + item.count, 0),
    missionStatuses,
    grantStatuses,
    csrCommitmentTotal: (grantStatuses.committed?.amount ?? 0) + (grantStatuses.released?.amount ?? 0),
    activeNgos: input.activeNgos,
    registeredVolunteers: input.registeredVolunteers,
    pendingEvidence: input.pendingEvidence,
    approvedEvidence: input.approvedEvidence,
    activeHotspots: input.activeHotspots,
    legacyFundingRecords: input.legacyFundingRecords,
  };
}

export type AdminAuditCsvRow = {
  auditId: string; createdAt: Date; actorUserId: string; actionType: string; recordType: string; recordId: string;
  previousValue: unknown; newValue: unknown; note: string | null;
};

function csvCell(value: unknown): string {
  const text = value == null ? "" : typeof value === "string" ? value : JSON.stringify(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildAdminAuditCsv(events: readonly AdminAuditCsvRow[]): string {
  const rows: unknown[][] = [["audit_id", "timestamp", "administrator_id", "action", "record_type", "record_id", "previous_value", "new_value", "note"]];
  for (const event of events) rows.push([event.auditId, event.createdAt.toISOString(), event.actorUserId, event.actionType, event.recordType, event.recordId, event.previousValue, event.newValue, event.note]);
  return rows.map(row => row.map(csvCell).join(",")).join("\r\n");
}
