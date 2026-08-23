// Canonical genre list, ported from the `shelves` array in
// the-to-read-shelf/index.html. Order here is display order.

export type GenreDef = {
  id: string;
  tag: string;
  color: string;
  note: string;
};

export const GENRES: GenreDef[] = [
  {
    id: "wartime",
    tag: "WWII & Historical Fiction",
    color: "#7A2E27",
    note: "Your list actually spans several authors — worth knowing so you can find more of each.",
  },
  {
    id: "literary",
    tag: "Literary Fiction",
    color: "#5F6E56",
    note: "Quieter, character-driven, beautifully written — books you'll want to underline.",
  },
  {
    id: "thriller",
    tag: "Psychological Thriller & Domestic Suspense",
    color: "#AD8A4E",
    note: "Twisty, character-driven suspense.",
  },
  {
    id: "comedy",
    tag: "Contemporary Comedy & Family Life",
    color: "#7A2E27",
    note: "Sharp, funny, warm — the ones that make you laugh out loud on public transport.",
  },
  {
    id: "nonfiction",
    tag: "Narrative Nonfiction",
    color: "#5F6E56",
    note: "True stories, reported and written like novels.",
  },
];

// Fallback color for onboarding's free-text "Other" genre — not one of the
// 5 canonical shelves, so it has no hardcoded color of its own.
export const OTHER_GENRE_COLOR = "#AD8A4E";

export function genreColor(genre: string): string {
  return GENRES.find((g) => g.tag === genre)?.color ?? OTHER_GENRE_COLOR;
}

export function genreNote(genre: string): string {
  return (
    GENRES.find((g) => g.tag === genre)?.note ??
    "Books outside the usual shelves — added by you."
  );
}

export const GENRE_TAGS = GENRES.map((g) => g.tag);
