"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addManualShow } from "@/lib/actions/listItems";
import { SHOW_GENRE_TAGS } from "@/lib/shows/genres";

// Lives inside a Modal now (see components/shows/AddShowFab.tsx) — no
// longer renders its own section/title. There's still no AI/onboarding
// path for Shows (the original static feature never had one either) —
// this is the only way a non-Juz user builds up their Shows list at all.
// See AddBookForm.tsx for why `initialGenre` doesn't need an effect to
// stay in sync.
export function AddShowForm({
  initialGenre,
  onSuccess,
}: {
  initialGenre?: string;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("");
  const [genre, setGenre] = useState(
    initialGenre && SHOW_GENRE_TAGS.includes(initialGenre) ? initialGenre : SHOW_GENRE_TAGS[0]
  );
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await addManualShow({ title, platform, genre });
        router.refresh();
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add that show");
      }
    });
  }

  return (
    <>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="show-title">Title</label>
          <input
            id="show-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="field">
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
        <div className="field">
          <label htmlFor="show-genre">Genre</label>
          <select id="show-genre" value={genre} onChange={(e) => setGenre(e.target.value)}>
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
    </>
  );
}
