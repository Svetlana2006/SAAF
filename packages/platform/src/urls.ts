const fromEnv = (name: string, fallback: string) => process.env[name] ?? fallback;

export const portalUrls = {
  entry: fromEnv("NEXT_PUBLIC_ENTRY_PORTAL_URL", "http://localhost:3000"),
  citizen: fromEnv("NEXT_PUBLIC_CITIZEN_PORTAL_URL", "http://localhost:3001"),
  ngo: fromEnv("NEXT_PUBLIC_NGO_PORTAL_URL", "http://localhost:3002"),
  csr: fromEnv("NEXT_PUBLIC_CSR_PORTAL_URL", "http://localhost:3003"),
  admin: fromEnv("NEXT_PUBLIC_ADMIN_PORTAL_URL", "http://localhost:3004"),
  api: fromEnv("NEXT_PUBLIC_API_URL", "http://localhost:3005"),
} as const;
