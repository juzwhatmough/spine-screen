"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (signInError) {
      setError(signInError.message);
      setStatus("error");
      return;
    }
    setStatus("sent");
  }

  return (
    <>
      <header>
        <div className="spine-strip" />
        <p className="eyebrow">Personal library · Est. Aug 2026</p>
        <h1>
          The <em>Shelf</em>
        </h1>
        <p className="sub">
          Sign in to build your own reading list — genre shelves, an AI
          &ldquo;Suggest more&rdquo; feature, and your own private copy,
          synced to your account.
        </p>
      </header>

      <div className="auth-shell">
        {status === "sent" ? (
          <>
            <h2>Check your email</h2>
            <p>
              We sent a sign-in link to <strong>{email}</strong>. Click it to
              finish signing in — you can close this tab.
            </p>
          </>
        ) : (
          <>
            <h2>Sign in</h2>
            <p>
              No password needed — enter your email and we&rsquo;ll send you a
              magic link.
            </p>
            {error && <p className="form-error">{error}</p>}
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                className="primary-btn"
                disabled={status === "sending"}
              >
                {status === "sending" ? "Sending…" : "Send magic link"}
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}
