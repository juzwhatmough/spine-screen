"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";

// Bottom nav's "Account" item — web/REDESIGN_SPEC.md section 4.3: "Small
// sheet with the signed-in email and Sign out." Reuses the shared Modal
// (still its pre-redesign centred-card look; the bottom-sheet variant is
// a later PR — see section 7) rather than a one-off dialog, so this gets
// the same focus-trap/Esc/return-focus behaviour as the Add modals.
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
      <p>
        Signed in as <strong>{email}</strong>
      </p>
      <button type="button" className="primary-btn" onClick={handleSignOut} disabled={signingOut}>
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </Modal>
  );
}
