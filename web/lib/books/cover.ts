// Book cover lookup via Open Library (free, no API key). Server-side only.
//
// We store just Open Library's numeric cover id in list_items.meta.coverId
// and build the image URL at render time with coverUrl().

export type CoverLookup =
  | { status: "found"; id: number }
  | { status: "none" } // Open Library answered, but no confident match
  | { status: "error" }; // network failure etc. — worth retrying later

function normalise(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Title, ignoring a trailing subtitle: "Dune: Deluxe Edition" -> "dune".
function mainTitle(s: string): string {
  return normalise(s.split(/[:(]/)[0]);
}

// Conservative on purpose. A cover is only accepted when the title matches
// exactly (after normalising) AND the author's surname appears among the
// result's authors AND the result has a cover. Wrong covers are worse than
// the coloured fallback — author mix-ups have been caught in this list before.
export async function findCoverId(title: string, author: string | null): Promise<CoverLookup> {
  try {
    const params = new URLSearchParams({
      title,
      limit: "8",
      fields: "title,author_name,cover_i",
    });
    if (author) params.set("author", author);

    const res = await fetch(`https://openlibrary.org/search.json?${params}`, {
      headers: { "User-Agent": "TheShelf/1.0 (personal reading list)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { status: "error" };

    const data: {
      docs?: { title?: string; author_name?: string[]; cover_i?: number }[];
    } = await res.json();

    const wantedTitle = mainTitle(title);
    const wantedSurname = author ? normalise(author.split(",")[0]).split(" ").pop() : undefined;

    const match = (data.docs ?? []).find((d) => {
      if (!d.cover_i || !d.title) return false;
      if (mainTitle(d.title) !== wantedTitle) return false;
      if (!wantedSurname) return true;
      return (d.author_name ?? []).some((a) => normalise(a).split(" ").includes(wantedSurname));
    });

    return match?.cover_i ? { status: "found", id: match.cover_i } : { status: "none" };
  } catch {
    return { status: "error" };
  }
}

// `?default=false` makes Open Library return a 404 instead of a blank
// placeholder image when it has no cover, so the card's onError fallback
// kicks in rather than showing a grey rectangle.
export function coverUrl(id: number): string {
  return `https://covers.openlibrary.org/b/id/${id}-L.jpg?default=false`;
}
