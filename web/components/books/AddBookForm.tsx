"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addManualBook } from "@/lib/actions/listItems";
import { GENRE_TAGS } from "@/lib/books/genres";

// Lives inside a Modal now (see components/books/AddBookFab.tsx) — no
// longer renders its own section/title, the modal provides that. Fields,
// validation, and submit logic are unchanged from the inline version.
// `initialGenre` pre-fills from whichever shelf is currently active in
// the scroll-spy nav; the form remounts fresh each time the modal opens
// (Modal doesn't render children while closed), so a plain useState
// initializer is enough — no effect needed to keep it in sync.
export function AddBookForm({
  initialGenre,
  onSuccess,
}: {
  initialGenre?: string;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState(
    initialGenre && GENRE_TAGS.includes(initialGenre) ? initialGenre : GENRE_TAGS[0]
  );
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await addManualBook({ title, author, genre });
        router.refresh();
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add that book");
      }
    });
  }

  return (
    <>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="book-title">Title</label>
          <input
            id="book-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="book-author">Author</label>
          <input
            id="book-author"
            type="text"
            required
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="book-genre">Genre</label>
          <select id="book-genre" value={genre} onChange={(e) => setGenre(e.target.value)}>
            {GENRE_TAGS.map((tag) => (
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
