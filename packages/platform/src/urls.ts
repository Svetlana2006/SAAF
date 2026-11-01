const appOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN;
const portalUrl = (configured: string | undefined, path: string, local: string) =>
  appOrigin ? `${appOrigin}${path}` : configured ?? local;

export const portalUrls = {
  entry: portalUrl(process.env.NEXT_PUBLIC_ENTRY_PORTAL_URL, "", "http://localhost:3000"),
  citizen: portalUrl(process.env.NEXT_PUBLIC_CITIZEN_PORTAL_URL, "/citizen", "http://localhost:3001"),
  ngo: portalUrl(process.env.NEXT_PUBLIC_NGO_PORTAL_URL, "/ngo", "http://localhost:3002"),
  csr: portalUrl(process.env.NEXT_PUBLIC_CSR_PORTAL_URL, "/csr", "http://localhost:3003"),
  admin: portalUrl(process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL, "/admin", "http://localhost:3004"),
  api: portalUrl(process.env.NEXT_PUBLIC_API_URL, "", "http://localhost:3005"),
} as const;
