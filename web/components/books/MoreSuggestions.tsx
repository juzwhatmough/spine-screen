"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Ported from fetchMoreSuggestions() in index.html. The route handler now
// does the insert server-side (so it can dedupe via the DB's unique
// index) — this component just triggers it and refreshes the Server
// Component tree to pick up whatever actually got inserted.
export function MoreSuggestions({ genre }: { genre: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/books/suggest", {
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
      {loading ? "Finding more…" : "🔄 More suggestions"}
    </button>
  );
}
