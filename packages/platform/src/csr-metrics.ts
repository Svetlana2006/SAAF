export type CsrImpactFollowUp = {
  missionId: string;
  locationId: string;
  completedAt: Date;
  reportsAfterCompletion: number;
};

const FOLLOW_UP_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export function calculateCsrDashboardMetrics(input: { committedAmount: number; approvedFundingBudget: number | null; grantRecords: number; missionStatuses: string[]; verifiedImpactReports: number }) {
  const availableFunding = input.approvedFundingBudget == null ? null : Math.max(0, Math.round((input.approvedFundingBudget - input.committedAmount) * 100) / 100);
  return {
    committedAmount: input.committedAmount,
    allocatedAmount: input.committedAmount,
    approvedFundingBudget: input.approvedFundingBudget,
    availableFunding,
    overAllocatedAmount: input.approvedFundingBudget == null ? null : Math.max(0, Math.round((input.committedAmount - input.approvedFundingBudget) * 100) / 100),
    supportedMissions: input.missionStatuses.length,
    inProgressMissions: input.missionStatuses.filter(status => status === "in_progress").length,
    completedMissions: input.missionStatuses.filter(status => status === "completed").length,
    verifiedImpactReports: input.verifiedImpactReports,
    grantRecords: input.grantRecords,
  };
}

export function getFollowUpWindow(completedAt: Date) {
  const start = new Date(completedAt);
  const end = new Date(start.getTime() + FOLLOW_UP_DAYS * DAY_MS);
  return { start, end, eligibleAt: end };
}

export function summarizeCsrFollowUps(records: CsrImpactFollowUp[], now = new Date()) {
  const eligible = records.filter(record => getFollowUpWindow(record.completedAt).eligibleAt <= now);
  const withNoRecordedRepeatReports = eligible.filter(record => record.reportsAfterCompletion === 0).length;
  return {
    windowDays: FOLLOW_UP_DAYS,
    eligibleMissions: eligible.length,
    missionsWithNoRecordedRepeatReports: withNoRecordedRepeatReports,
    repeatReports: eligible.reduce((sum, record) => sum + record.reportsAfterCompletion, 0),
  };
}

export function csvCell(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildCsrCsv(headers: string[], rows: (string | number | null | undefined)[][]) {
  return [headers, ...rows].map(row => headers.map((_, index) => csvCell(row[index])).join(",")).join("\r\n");
}
