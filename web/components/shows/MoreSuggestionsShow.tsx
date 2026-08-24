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
      className="refresh-btn"
      disabled={loading}
      onClick={handleClick}
    >
      {loading ? "Finding more…" : "🔄 Suggest more"}
    </button>
  );
}
