export const missionStatusTransitions: Readonly<Record<string, readonly string[]>> = {
  planned: ["mobilizing"],
  mobilizing: ["in_progress", "planned"],
  in_progress: ["review_pending", "mobilizing"],
};

export function canTransitionMission(from: string, to: string): boolean {
  return missionStatusTransitions[from]?.includes(to) ?? false;
}

export function hasMissionCapacity(filledSlots: number, totalSlots: number): boolean {
  return Number.isInteger(filledSlots) && Number.isInteger(totalSlots) && filledSlots >= 0 && totalSlots > 0 && filledSlots < totalSlots;
}

export function isValidReportPhotoCount(count: number): boolean {
  return Number.isInteger(count) && count >= 3 && count <= 5;
}

export function canAcceptOpportunity(offerStatus: string, reportStatus: string, hasLocation: boolean): boolean {
  return offerStatus === "offered" && reportStatus === "open" && hasLocation;
}

export function reportImageCreateData(images: readonly { photoUrl: string; cloudinaryId: string; purpose: string }[]) {
  return images.map((image) => ({ ...image }));
}
