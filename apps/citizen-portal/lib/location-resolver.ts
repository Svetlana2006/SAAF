/**
 * lib/location-resolver.ts
 * Resolves a GPS coordinate pair to the nearest Location in the database.
 * Replaces the old ward-resolver.ts to match the new EER-based schema.
 */
import { prisma } from "./prisma";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function resolveLocation(
  latitude: number,
  longitude: number
): Promise<{ locationId: string; wardZone: string; nameArea: string } | null> {
  const locations = await prisma.location.findMany();
  if (!locations.length) return null;

  let nearest = locations[0];
  let nearestDist = haversineKm(latitude, longitude, locations[0].latitude, locations[0].longitude);

  for (const loc of locations.slice(1)) {
    const dist = haversineKm(latitude, longitude, loc.latitude, loc.longitude);
    if (dist < nearestDist) {
      nearest = loc;
      nearestDist = dist;
    }
  }

  return {
    locationId: nearest.locationId,
    wardZone: nearest.wardZone,
    nameArea: nearest.nameArea,
  };
}
