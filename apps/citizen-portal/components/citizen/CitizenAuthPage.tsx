"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { useSignIn, useSignUp } from "@clerk/nextjs/legacy";
import styles from "./CitizenAuthPage.module.css";

type Mode = "signin" | "signup";

export default function CitizenAuthPage({ authConfigured }: { authConfigured: boolean }) {
  if (!authConfigured) {
    return <main className={styles.page}>
      <section className={styles.card}>
        <Link href="/" className={styles.brand}>SAAF <span>Citizen Hub</span></Link>
        <p className={styles.eyebrow}>COMMUNITY ACCOUNT</p>
        <h1>Sign-in unavailable</h1>
        <p role="alert" className={styles.error}>Citizen sign-in is not configured. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in the Citizen portal deployment and CLERK_SECRET_KEY in the Citizen portal and API deployments.</p>
        <p className={styles.guest}>You can still <Link href="/">continue as a guest</Link> and submit anonymous reports.</p>
      </section>
    </main>;
  }
  return <ConfiguredCitizenAuthPage />;
}

function ConfiguredCitizenAuthPage() {
  const router = useRouter();
  const { isLoaded: signInLoaded, signIn, setActive: setActiveSignIn } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setActiveSignUp } = useSignUp();
  const { isLoaded: userLoaded, user } = useUser();
  const { getToken } = useAuth();
  const clerk = useClerk();
  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [recoveringPassword, setRecoveringPassword] = useState(false);
  const [awaitingPasswordResetCode, setAwaitingPasswordResetCode] = useState(false);
  const [passwordResetCode, setPasswordResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [profileSyncState, setProfileSyncState] = useState<"checking" | "saved" | "error">("checking");
  const [profileSyncError, setProfileSyncError] = useState("");

  const syncProfile = useCallback(async (token: string) => {
    setProfileSyncState("checking");
    setProfileSyncError("");
    try {
      const response = await fetch("/api/citizen/profile", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Your account could not be saved.");
      if (!payload.profile?.citizenId) throw new Error("The server did not confirm a saved Citizen profile.");
      setProfileSyncState("saved");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Your Citizen profile could not be saved.";
      setProfileSyncState("error");
      setProfileSyncError(message);
      throw cause;
    }
  }, []);

  useEffect(() => {
    const primaryEmail = user?.primaryEmailAddress?.emailAddress;
    if (!userLoaded || !primaryEmail) return;
    let active = true;
    void getToken().then(async (token) => {
      if (!token) throw new Error("Your sign-in session is not ready. Please try again.");
      await syncProfile(token);
    }).catch((cause: unknown) => {
      if (active) {
        setProfileSyncState("error");
        setProfileSyncError(cause instanceof Error ? cause.message : "Your Citizen profile could not be saved.");
      }
    });
    return () => { active = false; };
  }, [getToken, userLoaded, user, syncProfile]);

  async function saveSignedInProfile() {
    const token = await getToken();
    if (!token) throw new Error("Your sign-in session is not ready. Please try again.");
    await syncProfile(token);
  }

  async function requestPasswordResetCode() {
    if (!signInLoaded || !signIn) throw new Error("Authentication is still loading. Please try again.");
    try {
      await signIn.create({ strategy: "reset_password_email_code", identifier: email.trim() });
    } catch {
      throw new Error("We couldn't start password recovery. Check the email and try again.");
    }
    setNotice("If an account with that email exists, a password reset code has been sent.");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (!signInLoaded || !signIn || !signUpLoaded || !signUp) throw new Error("Authentication is still loading. Please try again.");
      if (recoveringPassword && !awaitingPasswordResetCode) {
        await requestPasswordResetCode();
        setAwaitingPasswordResetCode(true);
      } else if (recoveringPassword) {
        const reset = await signIn.attemptFirstFactor({
          strategy: "reset_password_email_code",
          code: passwordResetCode.trim(),
          password: newPassword,
        });
        if (reset.status !== "complete" || !reset.createdSessionId) {
          throw new Error("The password could not be reset. Check the code and try again.");
        }
        await setActiveSignIn({ session: reset.createdSessionId });
        router.replace("/");
        router.refresh();
      } else if (mode === "signup" && !awaitingOtp) {
        const created = await signUp.create({
          emailAddress: email.trim(),
          password,
          unsafeMetadata: { fullName: fullName.trim(), phone: phone.trim() || null },
        });
        if (created.status === "complete" && created.createdSessionId) {
          await setActiveSignUp({ session: created.createdSessionId });
          await saveSignedInProfile();
          router.replace("/");
          router.refresh();
          return;
        }
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setAwaitingOtp(true);
        setNotice(`A verification code was sent to ${email.trim()}.`);
      } else if (awaitingOtp) {
        const verified = await signUp.attemptEmailAddressVerification({ code: otp.trim() });
        if (verified.status !== "complete" || !verified.createdSessionId) {
          throw new Error("The code was accepted, but account setup is incomplete. Please try again.");
        }
        await setActiveSignUp({ session: verified.createdSessionId });
        await saveSignedInProfile();
        router.replace("/");
        router.refresh();
      } else {
        const signedIn = await signIn.create({ strategy: "password", identifier: email.trim(), password });
        if (signedIn.status !== "complete" || !signedIn.createdSessionId) {
          throw new Error("Sign-in requires an additional verification step. Check the sign-in options configured for this account.");
        }
        await setActiveSignIn({ session: signedIn.createdSessionId });
        await saveSignedInProfile();
        router.replace("/");
        router.refresh();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not complete sign-in.");
    } finally {
      setBusy(false);
    }
  }

  async function resendOtp() {
    if (!signUpLoaded) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setNotice(`A new verification code was sent to ${email.trim()}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not resend the verification code.");
    } finally {
      setBusy(false);
    }
  }

  function changeEmail() {
    setAwaitingOtp(false);
    setOtp("");
    setError("");
    setNotice("");
  }

  function startPasswordRecovery() {
    setRecoveringPassword(true);
    setAwaitingPasswordResetCode(false);
    setPasswordResetCode("");
    setNewPassword("");
    setError("");
    setNotice("");
  }

  function cancelPasswordRecovery() {
    setRecoveringPassword(false);
    setAwaitingPasswordResetCode(false);
    setPasswordResetCode("");
    setNewPassword("");
    setPassword("");
    setError("");
    setNotice("");
  }

  const signedInEmail = user?.primaryEmailAddress?.emailAddress ?? "";
  const isReady = signInLoaded && signUpLoaded && userLoaded;

  return <main className={styles.page}>
    <section className={styles.card}>
      <Link href="/" className={styles.brand}>SAAF <span>Citizen Hub</span></Link>
      <p className={styles.eyebrow}>COMMUNITY ACCOUNT</p>
      <h1>{signedInEmail ? "Your Citizen account" : recoveringPassword ? "Reset your password" : awaitingOtp ? "Verify your email" : mode === "signin" ? "Welcome back" : "Create your account"}</h1>
      <p className={styles.intro}>{recoveringPassword ? awaitingPasswordResetCode ? "Enter the reset code from your email and choose a new password." : "Enter the email address associated with your Citizen account." : awaitingOtp ? "Enter the verification code from your email to activate your Citizen account." : "Sign in to manage your Citizen profile and choose whether each report shares your name."}</p>
      {signedInEmail ? <div className={styles.account}>
        <b>{signedInEmail}</b>
        <p>{profileSyncState === "saved" ? "Your Citizen profile is saved in the SAAF database." : profileSyncState === "checking" ? "Saving your Citizen profile to the SAAF database…" : "Your profile has not been saved to the SAAF database."}</p>
        {profileSyncError && <p role="alert" className={styles.error}>{profileSyncError}</p>}
        {profileSyncState === "error" && <button className={styles.submit} type="button" onClick={() => { void saveSignedInProfile().catch(() => undefined); }} disabled={busy}>Retry profile save</button>}
        <button className={styles.submit} type="button" onClick={() => { void clerk.signOut().then(() => router.refresh()); }} disabled={busy}>Sign out</button>
        <Link href="/" className={styles.guest}>Continue to the Citizen portal</Link>
      </div> : <>
        {!awaitingOtp && !recoveringPassword && <div className={styles.tabs} role="tablist" aria-label="Citizen account action">
          <button type="button" role="tab" aria-selected={mode === "signin"} className={mode === "signin" ? styles.activeTab : ""} onClick={() => { setMode("signin"); setError(""); setNotice(""); }}>Sign in</button>
          <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? styles.activeTab : ""} onClick={() => { setMode("signup"); setError(""); setNotice(""); }}>Create account</button>
        </div>}
        <form onSubmit={submit} className={styles.form}>
          {!recoveringPassword && mode === "signup" && !awaitingOtp && <>
            <label>Full name<input required autoComplete="name" maxLength={120} value={fullName} onChange={event => setFullName(event.target.value)} /></label>
            <label>Phone <small>Optional</small><input type="tel" autoComplete="tel" maxLength={32} value={phone} onChange={event => setPhone(event.target.value)} /></label>
          </>}
          <label>Email<input required type="email" autoComplete="email" maxLength={254} value={email} readOnly={awaitingOtp || awaitingPasswordResetCode} onChange={event => setEmail(event.target.value)} /></label>
          {recoveringPassword ? awaitingPasswordResetCode && <>
            <label>Reset code<input required type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={16} value={passwordResetCode} onChange={event => setPasswordResetCode(event.target.value)} /></label>
            <label>New password<input required type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={event => setNewPassword(event.target.value)} /></label>
          </> : awaitingOtp ? <label>Verification code<input required type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={event => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} /></label> : <label>Password<input required type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} value={password} onChange={event => setPassword(event.target.value)} />{mode === "signup" && <small>Use at least 8 characters. Clerk requires 8 or more; six-character passwords aren&apos;t accepted.</small>}</label>}
          {error && <p role="alert" className={styles.error}>{error}</p>}
          {notice && <p role="status" className={styles.notice}>{notice}</p>}
          <button className={styles.submit} disabled={busy || !isReady}>{busy ? "Please wait…" : recoveringPassword ? awaitingPasswordResetCode ? "Reset password" : "Send reset code" : awaitingOtp ? "Verify email and create account" : mode === "signin" ? "Sign in" : "Send verification code"}</button>
        </form>
        {!recoveringPassword && !awaitingOtp && mode === "signin" && <button className={styles.textButton} type="button" onClick={startPasswordRecovery}>Forgot password?</button>}
        {recoveringPassword && <div className={styles.otpActions}><button type="button" onClick={cancelPasswordRecovery} disabled={busy}>Back to sign in</button>{awaitingPasswordResetCode && <button type="button" onClick={async () => {
          setBusy(true);
          setError("");
          setNotice("");
          try {
            await requestPasswordResetCode();
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Could not resend the password reset code.");
          } finally {
            setBusy(false);
          }
        }} disabled={busy}>Resend code</button>}</div>}
        {awaitingOtp && <div className={styles.otpActions}><button type="button" onClick={resendOtp} disabled={busy}>Resend code</button><button type="button" onClick={changeEmail} disabled={busy}>Change email</button></div>}
        <p className={styles.guest}>You can still <Link href="/">continue as a guest</Link> and submit anonymous reports.</p>
      </>}
    </section>
  </main>;
}
