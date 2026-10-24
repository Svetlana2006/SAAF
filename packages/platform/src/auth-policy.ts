export type TrustedRole = "admin" | "csr" | "citizen" | "volunteer";

/** Supabase app_metadata is server managed; user_metadata is user editable. */
export function hasTrustedRole(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | null, allowed: readonly TrustedRole[]) {
  const role = user?.app_metadata?.role;
  return typeof role === "string" && allowed.includes(role as TrustedRole);
}

/** Build a Prisma filter from the server-resolved organization ID. */
export function ngoScopedWhere<T extends Record<string, unknown>>(ngoId: string, where: T = {} as T) {
  return { ...where, ngoId };
}
