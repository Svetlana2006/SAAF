export type CsrMissionView = "available" | "supported" | "all";
export const csrCommittableMissionStatuses = ["planned", "mobilizing", "in_progress"] as const;

/** Organization IDs passed here must come from the authenticated CSR membership. */
export function csrMissionViewScope(csrOrganizationId: string, view: CsrMissionView) {
  const own = { csrOrganizationId };
  if (view === "supported") return { csrGrants: { some: own } };
  const uncommittedActive = { isActive: true, status: { in: [...csrCommittableMissionStatuses] }, csrGrants: { none: own } };
  if (view === "available") return uncommittedActive;
  return { OR: [
    { csrGrants: { some: own } },
    uncommittedActive,
  ] };
}

export function missionCanReceiveCsrCommitment(mission: { isActive: boolean; status: string; estimatedCost: number | null }) {
  return mission.isActive && csrCommittableMissionStatuses.includes(mission.status as typeof csrCommittableMissionStatuses[number]) && mission.estimatedCost != null && mission.estimatedCost > 0;
}

export function missionStatusAllowsCsrCommitment(mission: { isActive: boolean; status: string }) {
  return mission.isActive && csrCommittableMissionStatuses.includes(mission.status as typeof csrCommittableMissionStatuses[number]);
}

export function allocationWithinMissionBudget(amount: number, proposedBudget: number, alreadyAllocated: number) {
  if (![amount, proposedBudget, alreadyAllocated].every(Number.isFinite) || amount <= 0 || proposedBudget <= 0 || alreadyAllocated < 0) return false;
  return Math.round(amount * 100) <= Math.max(0, Math.round((proposedBudget - alreadyAllocated) * 100));
}

export function scopeMissionDetailsToOwnGrants<T extends { csrGrants: unknown[]; impactReports: unknown[]; evidences: unknown[]; missionActivities: unknown[]; statusEvents: unknown[] }>(mission: T) {
  const supportedByOrganization = mission.csrGrants.length > 0;
  return {
    ...mission,
    supportedByOrganization,
    impactReports: supportedByOrganization ? mission.impactReports : [],
    evidences: supportedByOrganization ? mission.evidences : [],
    missionActivities: supportedByOrganization ? mission.missionActivities : [],
    statusEvents: supportedByOrganization ? mission.statusEvents : [],
  };
}
