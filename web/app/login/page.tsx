"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MarqueeLights } from "@/components/ui/MarqueeLights";

const RESEND_COOLDOWN_S = 60;

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Marquee redesign, section 8.3. Idle/sent are two views of the same
// page (not routes) so the email the user typed survives switching
// between them. Resend/"Use a different email" are new — there was no
// way to retry or restart a sign-in before this.
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("error");
  });
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function sendLink(e?: React.FormEvent) {
    e?.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });

    if (signInError) {
      setError(signInError.message);
      setStatus("error");
      return;
    }
    setStatus("sent");
    setResendCooldown(RESEND_COOLDOWN_S);
  }

  function useDifferentEmail() {
    setStatus("idle");
    setEmail("");
    setError(null);
    setResendCooldown(0);
  }

  if (status === "sent") {
    return (
      <>
        <MarqueeLights />
        <div style={{ padding: "18px 22px 0" }}>
          <button type="button" aria-label="Back" className="mq-round-btn" onClick={() => setStatus("idle")}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
        </div>

        <div className="mq-envelope-row">
          <div className="mq-envelope-badge" aria-hidden="true">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--mq-gold)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2.5" />
              <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
            </svg>
          </div>
        </div>

        <div className="mq-auth-copy" style={{ textAlign: "center" }}>
          <h1 className="mq-auth-heading">Check your email</h1>
          <p className="mq-auth-sub">We sent a sign-in link to</p>
          <p style={{ margin: "4px 0 0", fontSize: 16, fontWeight: 700, color: "var(--mq-text)" }}>{email}</p>
          <p className="mq-auth-sub">
            Tap the link on this device and you will land straight on your shelf.
          </p>
        </div>

        <div className="mq-login-bottom">
          <a href="mailto:" className="mq-auth-submit" style={{ textDecoration: "none" }}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
            </svg>
            Open email app
          </a>
          <div className="mq-login-resend-row">
            <p>
              Nothing yet?{" "}
              {resendCooldown > 0 ? (
                <span>Resend in {formatCountdown(resendCooldown)}</span>
              ) : (
                <button type="button" className="mq-login-link-btn" onClick={() => sendLink()}>
                  Resend link
                </button>
              )}
            </p>
            <button type="button" className="mq-login-link-btn" onClick={useDifferentEmail}>
              Use a different email
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MarqueeLights />

      <div aria-hidden="true" className="mq-login-fan">
        <div className="mq-login-fan-book mq-login-fan-left" style={{ background: "#3D5AFE", color: "#F2F4FF" }}>
          THE BERLIN GIRL
        </div>
        <div className="mq-login-fan-book mq-login-fan-right" style={{ background: "#2EC4B6", color: "#06201D" }}>
          DEAR LIFE
        </div>
        <div className="mq-login-fan-book mq-login-fan-center" style={{ background: "#E4572E", color: "#FFF6F2" }}>
          <span className="mq-login-fan-title">THE SECRET MESSENGER</span>
          <span className="mq-login-fan-author">MANDY ROBOTHAM</span>
        </div>
      </div>

      <div className="mq-auth-copy">
        <p className="mq-auth-eyebrow">BOOKS + SHOWS, ONE LIST</p>
        <h1 className="mq-auth-heading mq-auth-heading-lg">The Shelf</h1>
        <p className="mq-auth-sub">
          Genre shelves, AI picks that learn from your ratings, and your list
          synced to your account.
        </p>
      </div>

      <form className="mq-login-bottom" onSubmit={sendLink}>
        <label htmlFor="email" style={{ fontSize: 13, fontWeight: 600 }}>
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mq-login-input"
        />
        {error && (
          <p role="alert" className="mq-login-error">
            {error}
          </p>
        )}
        <button type="submit" className="mq-auth-submit" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Email me a sign-in link"}
        </button>
        <p className="mq-login-footnote">No password needed. Your list stays private.</p>
      </form>
    </>
  );
}
