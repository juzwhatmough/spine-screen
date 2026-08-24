// Ported from the Shows section of the-to-read-shelf/index.html — same
// genre order, colors, and intro notes.

export type ShowGenreDef = {
  id: string;
  tag: string;
  color: string;
  note: string;
};

export const SHOW_GENRES: ShowGenreDef[] = [
  {
    id: "show-thriller-mystery",
    tag: "Thriller & Mystery",
    color: "#7A2E27",
    note: "Twisty procedurals, slow-burn conspiracies, and a few outright whodunits — scattered across just about every app you pay for.",
  },
  {
    id: "show-drama",
    tag: "Drama",
    color: "#5F6E56",
    note: "The ones that sit with you after the credits roll — prestige dramas, character studies, based-on-a-true-story sagas.",
  },
  {
    id: "show-comedy",
    tag: "Comedy",
    color: "#AD8A4E",
    note: "Sharp, funny, sometimes-dark comedies for when you want to laugh instead of doom-scroll.",
  },
  {
    id: "show-period-drama",
    tag: "Period Drama",
    color: "#9C4136",
    note: "Corsets, court intrigue, and history rendered in gorgeous detail — from Tudor England to 1920s Italy.",
  },
  {
    id: "show-true-crime",
    tag: "True Crime",
    color: "#7A2E27",
    note: "Real cases, dramatised — somehow scarier for being true.",
  },
  {
    id: "show-romance",
    tag: "Romance",
    color: "#5F6E56",
    note: "Slow-burn, will-they-won't-they — the kind that makes you miss being twenty-two.",
  },
  {
    id: "show-scifi-fantasy",
    tag: "Sci-Fi & Fantasy",
    color: "#AD8A4E",
    note: "Superpowers and bigger-than-life stakes, for when realism isn't the assignment.",
  },
  {
    id: "show-documentary",
    tag: "Documentary",
    color: "#9C4136",
    note: "Real people, real stories, no script required.",
  },
];

export const OTHER_SHOW_GENRE_COLOR = "#AD8A4E";

export function showGenreColor(genre: string): string {
  return SHOW_GENRES.find((g) => g.tag === genre)?.color ?? OTHER_SHOW_GENRE_COLOR;
}

export function showGenreNote(genre: string): string {
  return (
    SHOW_GENRES.find((g) => g.tag === genre)?.note ??
    "Shows outside the usual genres — added by you."
  );
}

export const SHOW_GENRE_TAGS = SHOW_GENRES.map((g) => g.tag);
