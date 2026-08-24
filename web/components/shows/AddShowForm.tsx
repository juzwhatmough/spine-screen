"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addManualShow } from "@/lib/actions/listItems";
import { SHOW_GENRE_TAGS } from "@/lib/shows/genres";

// There's no AI/onboarding path for Shows (the original static feature
// never had one either) — this is the only way a non-Juz user builds up
// their Shows list at all, so it's always visible, not tucked behind a
// one-time flow.
export function AddShowForm() {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("");
  const [genre, setGenre] = useState(SHOW_GENRE_TAGS[0]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await addManualShow({ title, platform, genre });
        setTitle("");
        setPlatform("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add that show");
      }
    });
  }

  return (
    <section className="shelf" style={{ borderTop: "none", paddingTop: 0 }}>
      <div className="shelf-head">
        <h2 style={{ fontSize: 20 }}>Add a show</h2>
      </div>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="field" style={{ margin: 0, flex: "1 1 200px" }}>
          <label htmlFor="show-title">Title</label>
          <input
            id="show-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="field" style={{ margin: 0, flex: "1 1 160px" }}>
          <label htmlFor="show-platform">Platform</label>
          <input
            id="show-platform"
            type="text"
            required
            placeholder="Netflix, Stan…"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          />
        </div>
        <div className="field" style={{ margin: 0, flex: "1 1 200px" }}>
          <label htmlFor="show-genre">Genre</label>
          <select
            id="show-genre"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            style={{
              width: "100%",
              fontFamily: "'Source Serif 4', serif",
              fontSize: 15,
              color: "var(--ink)",
              background: "#FBF8F1",
              border: "1px solid var(--line)",
              borderRadius: 3,
              padding: "10px 12px",
            }}
          >
            {SHOW_GENRE_TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="primary-btn" disabled={isPending}>
          {isPending ? "Adding…" : "Add"}
        </button>
      </form>
    </section>
  );
}
