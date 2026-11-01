import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <main style={{ display: "grid", minHeight: "100vh", placeContent: "center", padding: 24 }}>
      <p role="alert">Citizen sign-in is not configured. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in the Citizen portal deployment.</p>
    </main>;
  }
  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
      <SignIn />
    </div>
  );
}
