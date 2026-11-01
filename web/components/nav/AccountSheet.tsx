"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";

// Bottom nav's "Account" item — web/REDESIGN_SPEC.md section 4.3: "Small
// sheet with the signed-in email and Sign out." Reuses the shared Modal
// (now the section 7 bottom-sheet variant) rather than a one-off dialog,
// so this gets the same focus-trap/Esc/return-focus behaviour as the Add
// sheets.
export function AccountSheet({
  open,
  onClose,
  returnFocusRef,
  email,
}: {
  open: boolean;
  onClose: () => void;
  returnFocusRef: React.RefObject<HTMLElement | null>;
  email: string;
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <Modal open={open} onClose={onClose} title="Account" returnFocusRef={returnFocusRef}>
      <h2 className="sheet-title">Account</h2>
      <p className="sheet-account-email">
        Signed in as <strong>{email}</strong>
      </p>
      <button type="button" className="sheet-signout-btn" onClick={handleSignOut} disabled={signingOut}>
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </Modal>
  );
}
