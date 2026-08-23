import type { ListItemRow } from "@/types/database";
import { GENRES, genreColor, genreNote } from "./genres";

export type AuthorGroup = {
  author: string;
  items: ListItemRow[];
};

export type BookShelfData = {
  id: string;
  tag: string;
  color: string;
  note: string;
  groups: AuthorGroup[];
};

// Reshapes flat `list_items` rows into the genre -> author-group -> books
// structure index.html's hardcoded `shelves` array used, so BookShelf /
// AuthorGroup can render near-identically. Note: the original app's
// author-group "why" subtitle (e.g. "German Midwife & Secret Messenger →
// both yours already") was hand-written curation text specific to Juz's
// list — there's no generic way to derive that per-user, so author groups
// here render with just the author name, no subtitle.
export function groupItems(items: ListItemRow[]): BookShelfData[] {
  const byGenre = new Map<string, ListItemRow[]>();
  items.forEach((item) => {
    const genre = item.genre ?? "Other";
    if (!byGenre.has(genre)) byGenre.set(genre, []);
    byGenre.get(genre)!.push(item);
  });

  // Canonical genres first, in their defined display order; anything else
  // (e.g. onboarding's free-text "Other" genres) after, in first-seen order.
  const orderedGenres = [
    ...GENRES.map((g) => g.tag).filter((tag) => byGenre.has(tag)),
    ...[...byGenre.keys()].filter(
      (g) => !GENRES.some((def) => def.tag === g)
    ),
  ];

  return orderedGenres.map((genre) => {
    const genreItems = byGenre.get(genre)!;
    const byAuthor = new Map<string, ListItemRow[]>();
    genreItems.forEach((item) => {
      const author = item.creator ?? "Unknown author";
      if (!byAuthor.has(author)) byAuthor.set(author, []);
      byAuthor.get(author)!.push(item);
    });

    const def = GENRES.find((g) => g.tag === genre);
    return {
      id: def?.id ?? genre.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      tag: genre,
      color: genreColor(genre),
      note: genreNote(genre),
      groups: [...byAuthor.entries()].map(([author, authorItems]) => ({
        author,
        items: authorItems,
      })),
    };
  });
}
