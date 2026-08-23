"use client";

import { useState, useTransition } from "react";
import { submitOnboarding } from "@/lib/actions/onboarding";
import { GenrePicker } from "./GenrePicker";

function splitList(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type ManualBook = { title: string; author: string };

export function OnboardingForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [authors, setAuthors] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [loved, setLoved] = useState("");
  const [disliked, setDisliked] = useState("");
  const [manualBooks, setManualBooks] = useState<ManualBook[]>([{ title: "", author: "" }]);

  function updateManualBook(index: number, field: keyof ManualBook, value: string) {
    setManualBooks((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function addManualBookRow() {
    setManualBooks((rows) => [...rows, { title: "", author: "" }]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      // No try/catch here on purpose — submitOnboarding redirects on
      // success (which throws internally as part of how Next.js redirects
      // work), and a try/catch around this call would incorrectly catch
      // that. It returns { error } instead of throwing for real failures.
      const result = await submitOnboarding({
        favoriteAuthors: splitList(authors),
        favoriteGenres: genres,
        lovedBooks: splitList(loved),
        dislikedBooks: splitList(disliked),
        manualBooks: manualBooks.filter((b) => b.title.trim()),
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="auth-shell">
      <h2>Tell us what you love to read</h2>
      <p>
        A couple of quick questions so your first shelf isn&rsquo;t empty —
        you can always add more later.
      </p>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="authors">Favourite authors</label>
          <textarea
            id="authors"
            placeholder="Kristin Hannah, Freida McFadden…"
            value={authors}
            onChange={(e) => setAuthors(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Favourite genres</label>
          <GenrePicker value={genres} onChange={setGenres} />
        </div>

        <div className="field">
          <label htmlFor="loved">Books you&rsquo;ve loved (optional)</label>
          <textarea
            id="loved"
            placeholder="One per line, or comma-separated"
            value={loved}
            onChange={(e) => setLoved(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="disliked">Books that weren&rsquo;t for you (optional)</label>
          <textarea
            id="disliked"
            placeholder="One per line, or comma-separated"
            value={disliked}
            onChange={(e) => setDisliked(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Already meaning to read something? (optional)</label>
          {manualBooks.map((book, i) => (
            <div className="manual-book-row" key={i}>
              <input
                type="text"
                placeholder="Title"
                value={book.title}
                onChange={(e) => updateManualBook(i, "title", e.target.value)}
              />
              <input
                type="text"
                placeholder="Author"
                value={book.author}
                onChange={(e) => updateManualBook(i, "author", e.target.value)}
              />
            </div>
          ))}
          <button type="button" className="link-btn" onClick={addManualBookRow}>
            + add another
          </button>
        </div>

        <button type="submit" className="primary-btn" disabled={isPending}>
          {isPending ? "Building your shelf…" : "Build my shelf"}
        </button>
      </form>
    </div>
  );
}
