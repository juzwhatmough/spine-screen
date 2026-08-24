"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addManualBook } from "@/lib/actions/listItems";
import { GENRE_TAGS } from "@/lib/books/genres";

// Mirrors AddShowForm.tsx's pattern exactly. Genre is a strict dropdown
// (no free-text "Other" like onboarding's GenrePicker allows) — this form
// is for adding to an existing shelf, not defining a new one, so it keeps
// shelving consistent per the ticket's requirement.
export function AddBookForm() {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState(GENRE_TAGS[0]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await addManualBook({ title, author, genre });
        setTitle("");
        setAuthor("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add that book");
      }
    });
  }

  return (
    <section className="shelf" style={{ borderTop: "none", paddingTop: 0 }}>
      <div className="shelf-head">
        <h2 style={{ fontSize: 20 }}>Add a book</h2>
      </div>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="field" style={{ margin: 0, flex: "1 1 200px" }}>
          <label htmlFor="book-title">Title</label>
          <input
            id="book-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="field" style={{ margin: 0, flex: "1 1 160px" }}>
          <label htmlFor="book-author">Author</label>
          <input
            id="book-author"
            type="text"
            required
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </div>
        <div className="field" style={{ margin: 0, flex: "1 1 200px" }}>
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
    </section>
  );
}
