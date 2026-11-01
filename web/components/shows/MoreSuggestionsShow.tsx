"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Mirrors components/books/MoreSuggestions.tsx exactly — same
// loading/error handling, just posts to /api/shows/suggest. Kept as a
// separate sibling component rather than a shared one: matches the
// ticket's "port the same architecture" framing without touching the
// working, tested Books component.
export function MoreSuggestionsShow({ genre }: { genre: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/shows/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genre }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      if (!data.inserted) {
        alert("No new suggestions came back — try again in a moment.");
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Could not fetch new suggestions right now — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className="mq-suggest-btn"
      disabled={loading}
      onClick={handleClick}
    >
      {!loading && (
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
        </svg>
      )}
      {loading ? "Finding more…" : "Suggest more"}
    </button>
  );
}
