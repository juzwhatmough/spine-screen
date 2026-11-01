"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Landing page for the magic link (implicit flow). supabase-js parses the
// session out of the URL hash on init (detectSessionInUrl, on by default),
// writes the auth cookies, and fires SIGNED_IN. We then do a full-page
// navigation to /books so the server sees the new cookies. No PKCE
// code-verifier is involved, so this works even when the email opens in a
// different browser than the one that requested the link (the usual case
// on phones).
export default function ConfirmPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let done = false;

    const go = () => {
      if (done) return;
      done = true;
      window.location.replace("/books");
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) go();
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        go();
        return;
      }
      // Give detectSessionInUrl a beat to finish, then give up.
      setTimeout(async () => {
        const { data: retry } = await supabase.auth.getSession();
        if (retry.session) {
          go();
          return;
        }
        const hashError = new URLSearchParams(
          window.location.hash.replace(/^#/, "")
        ).get("error_description");
        setError(
          hashError ??
            "This sign-in link couldn't be completed — it may have expired or already been used. Request a fresh one."
        );
      }, 2000);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <>
      <header>
        <div className="spine-strip" />
        <p className="eyebrow">Personal library · Est. Aug 2026</p>
        <h1>
          The <em>Shelf</em>
        </h1>
      </header>

      <div className="auth-shell">
        {error ? (
          <>
            <h2>Sign-in link problem</h2>
            <p className="form-error">{error}</p>
            <p>
              <a href="/login">Back to sign in</a>
            </p>
          </>
        ) : (
          <>
            <h2>Signing you in…</h2>
            <p>One moment — finishing up.</p>
          </>
        )}
      </div>
    </>
  );
}
