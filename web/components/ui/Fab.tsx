"use client";

import { forwardRef } from "react";

// Fixed bottom-right "+" button. Label is CSS-only (:hover/:focus-visible
// expanding a collapsed span) rather than JS hover state — simpler and
// works for keyboard focus too, not just mouse hover.
export const Fab = forwardRef<HTMLButtonElement, { label: string; onClick: () => void }>(
  function Fab({ label, onClick }, ref) {
    return (
      <button type="button" className="fab" onClick={onClick} ref={ref} aria-label={label}>
        <span className="fab-icon" aria-hidden="true">
          +
        </span>
        <span className="fab-label">{label}</span>
      </button>
    );
  }
);
