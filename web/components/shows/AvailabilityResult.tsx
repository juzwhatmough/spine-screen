"use client";

import type { AvailabilityResult as Result } from "@/lib/actions/showAvailability";

// Shared by the per-card check and the bulk review. Purely presentational:
// it shows what the lookup found and lets the user accept a service or keep
// what they have. Nothing is saved until a button here is pressed.
export function AvailabilityResult({
  result,
  currentPlatform,
  onAccept,
  onDismiss,
}: {
  result: Result;
  currentPlatform: string;
  onAccept: (platform: string) => void;
  onDismiss: () => void;
}) {
  if (result.status === "error") {
    return (
      <div className="avail" role="status">
        <p>Couldn’t check right now — try again in a moment.</p>
        <button type="button" className="avail-link" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    );
  }
  if (result.status === "no-match") {
    return (
      <div className="avail" role="status">
        <p>No match found for this title.</p>
        <button type="button" className="avail-link" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    );
  }

  const matched = `${result.matchedTitle}${result.year ? ` (${result.year})` : ""}`;

  if (result.status === "none") {
    return (
      <div className="avail" role="status">
        <p>
          No Australian streaming service listed for {matched} — it may be rent/buy only.
        </p>
        <button type="button" className="avail-link" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    );
  }

  const stillOn = result.providers.find(
    (p) => p.toLowerCase() === currentPlatform.trim().toLowerCase()
  );

  return (
    <div className="avail" role="status">
      <p className="avail-match">Matched: {matched}</p>
      {stillOn ? (
        <>
          <p>Still on {stillOn} ✓</p>
          <button type="button" className="avail-chip" onClick={() => onAccept(stillOn)}>
            Mark checked
          </button>
        </>
      ) : (
        <>
          <p>Now streaming on — tap to use:</p>
          <div className="avail-chips">
            {result.providers.map((p) => (
              <button key={p} type="button" className="avail-chip" onClick={() => onAccept(p)}>
                {p}
              </button>
            ))}
          </div>
        </>
      )}
      <button type="button" className="avail-link" onClick={onDismiss}>
        Keep {currentPlatform}
      </button>
    </div>
  );
}
