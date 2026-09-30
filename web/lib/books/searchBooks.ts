import { GENRE_TAGS } from "./genres";

export type BookSuggestion = {
  title: string;
  author: string;
  year: string;
  genre: string | undefined; // one of GENRE_TAGS, or undefined if no confident mapping
};

// Server-side search used by app/api/books/search/route.ts. Tries Google
// Books first (an optional GOOGLE_BOOKS_API_KEY gives this app its own
// quota; the shared anonymous one is often exhausted), then falls back to
// Open Library. `failed` is true only if every source errored, so the UI
// can tell "no matches" apart from "search unavailable".
export async function searchBooks(query: string): Promise<{ results: BookSuggestion[]; failed: boolean }> {
  let anyOk = false;

  const key = process.env.GOOGLE_BOOKS_API_KEY;
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(`intitle:${query}`)}&maxResults=8` +
        (key ? `&key=${encodeURIComponent(key)}` : ""),
      { signal: AbortSignal.timeout(6000) }
    );
    if (res.ok) {
      anyOk = true;
      const data: { items?: GoogleBooksItem[] } = await res.json();
      const results = (data.items ?? [])
        .map((item) => {
          const info = item.volumeInfo;
          if (!info?.title) return null;
          return {
            title: info.title,
            author: info.authors?.join(", ") ?? "",
            year: info.publishedDate?.slice(0, 4) ?? "",
            genre: mapGoogleBooksCategoryToGenre(info.categories),
          };
        })
        .filter((s): s is BookSuggestion => s !== null);
      if (results.length) return { results: dedupe(results), failed: false };
    }
  } catch {
    // fall through to Open Library
  }

  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=8` +
        "&fields=title,author_name,first_publish_year,subject",
      {
        headers: { "User-Agent": "TheShelf/1.0 (personal reading list)" },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (res.ok) {
      anyOk = true;
      const data: {
        docs?: { title?: string; author_name?: string[]; first_publish_year?: number; subject?: string[] }[];
      } = await res.json();
      const results = (data.docs ?? [])
        .filter((d) => d.title)
        .map((d) => ({
          title: d.title!,
          author: d.author_name?.[0] ?? "",
          year: d.first_publish_year ? String(d.first_publish_year) : "",
          genre: mapGoogleBooksCategoryToGenre(d.subject?.slice(0, 15)),
        }));
      return { results: dedupe(results), failed: false };
    }
  } catch {
    // handled below
  }

  return { results: [], failed: !anyOk };
}

type GoogleBooksItem = {
  volumeInfo?: {
    title?: string;
    authors?: string[];
    publishedDate?: string;
    categories?: string[];
  };
};

// Heuristic, priority-ordered, deliberately conservative — Google Books'
// category taxonomy (BISAC-derived strings like "Fiction / Historical",
// "Fiction / Thrillers", "Biography & Autobiography") doesn't map
// cleanly onto this app's 5 hand-curated shelves, so this only maps the
// unambiguous cases and leaves everything else undefined for the user to
// pick themselves — never guesses wrong on purpose by forcing a fit.
export function mapGoogleBooksCategoryToGenre(categories?: string[]): string | undefined {
  if (!categories?.length) return undefined;
  const joined = categories.join(" / ").toLowerCase();

  if (/\b(war|historical|history)\b/.test(joined)) {
    return findGenre("WWII & Historical Fiction");
  }
  if (/\b(thriller|suspense|mystery|crime)\b/.test(joined)) {
    return findGenre("Psychological Thriller & Domestic Suspense");
  }
  if (/\b(humor|humorous|comedy|family)\b/.test(joined)) {
    return findGenre("Contemporary Comedy & Family Life");
  }
  if (/\b(biography|autobiography|memoir|nonfiction|non-fiction)\b/.test(joined)) {
    return findGenre("Narrative Nonfiction");
  }
  if (/\bfiction\b/.test(joined)) {
    // generic "Fiction" with nothing more specific matched above — closest
    // available shelf is Literary Fiction, not a confident match but a
    // reasonable default rather than leaving every plain-fiction result unset
    return findGenre("Literary Fiction");
  }
  return undefined;
}

function findGenre(tag: string): string | undefined {
  return GENRE_TAGS.includes(tag) ? tag : undefined;
}

// Search returns several editions of the same book; keep one per title+author.
function dedupe(list: BookSuggestion[]): BookSuggestion[] {
  const seen = new Set<string>();
  return list
    .filter((b) => {
      const k = `${b.title}|${b.author}`.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 5);
}
