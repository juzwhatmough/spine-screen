import type { ListItemRow } from "@/types/database";
import { SHOW_GENRES, showGenreColor, showGenreNote } from "./genres";

export type ShowShelfData = {
  id: string;
  tag: string;
  color: string;
  note: string;
  items: ListItemRow[];
};

// Flat genre grouping only — no author/platform subgrouping, matching the
// original static Shows section (platform is shown per-card instead, via
// the `creator` column — see lib/shows/seedData.ts for why).
export function groupShowItems(items: ListItemRow[]): ShowShelfData[] {
  const byGenre = new Map<string, ListItemRow[]>();
  items.forEach((item) => {
    const genre = item.genre ?? "Other";
    if (!byGenre.has(genre)) byGenre.set(genre, []);
    byGenre.get(genre)!.push(item);
  });

  const orderedGenres = [
    ...SHOW_GENRES.map((g) => g.tag).filter((tag) => byGenre.has(tag)),
    ...[...byGenre.keys()].filter(
      (g) => !SHOW_GENRES.some((def) => def.tag === g)
    ),
  ];

  return orderedGenres.map((genre) => {
    const def = SHOW_GENRES.find((g) => g.tag === genre);
    return {
      id: def?.id ?? "show-" + genre.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      tag: genre,
      color: showGenreColor(genre),
      note: showGenreNote(genre),
      items: byGenre.get(genre)!,
    };
  });
}
