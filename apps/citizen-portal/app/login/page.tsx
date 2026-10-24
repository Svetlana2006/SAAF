import CitizenAuthPage from "@/components/citizen/CitizenAuthPage";

export default function CitizenLoginPage() {
  return <CitizenAuthPage authConfigured={Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)} />;
}
