// Shared Anthropic-calling logic — used by app/api/books/suggest/route.ts
// (the "More suggestions" button) AND lib/actions/onboarding.ts (cold-start
// seeding on first sign-in), so onboarding doesn't need an internal HTTP
// round-trip. Same Messages API call and JSON-parsing approach as the
// original the-to-read-shelf/api/suggest.js, generalized to accept
// liked/disliked titles and a variable count instead of being hardcoded to
// the in-browser ratings cache.

export type SuggestionItem = { title: string; author: string; hook: string };

type SuggestParams = {
  genre: string;
  authorsOnShelf: string[];
  likedTitles: string[];
  dislikedTitles: string[];
  avoidTitles: string[];
  count?: number;
};

export async function suggestBooks({
  genre,
  authorsOnShelf,
  likedTitles,
  dislikedTitles,
  avoidTitles,
  count = 4,
}: SuggestParams): Promise<SuggestionItem[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Server is missing ANTHROPIC_API_KEY. Add it in Vercel > Project Settings > Environment Variables."
    );
  }

  const authorsStr = authorsOnShelf.length ? authorsOnShelf.join(", ") : "none yet";
  const likedStr = likedTitles.length ? likedTitles.join("; ") : "none rated yet";
  const dislikedStr = dislikedTitles.length ? dislikedTitles.join("; ") : "none rated yet";
  const avoidStr = avoidTitles.length ? avoidTitles.join("; ") : "none";
  const minByShelfAuthor = Math.min(2, count);

  const prompt = `You are a book recommendation engine inside a personal reading-list app.
Genre shelf: "${genre}".
Authors already on this shelf, whose other books the reader may not have discovered yet: ${authorsStr}.
Reader has liked: ${likedStr}.
Reader has disliked: ${dislikedStr}.
Do not suggest any of these titles, already shown on this shelf: ${avoidStr}.
Suggest exactly ${count} books for this shelf, as a mix:
- If any authors are listed above, at least ${minByShelfAuthor} should be other novels by those authors that are not in the "already shown" list.
- The rest can be from new authors similar in style/genre, leaning toward what the reader liked and away from anything similar to what they disliked.
Respond with ONLY a JSON array, no prose, no markdown code fences, in exactly this shape:
[{"title":"...","author":"...","hook":"one sentence, under 20 words, no spoilers"}]`;

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await anthropicRes.json();

  if (!anthropicRes.ok) {
    throw new Error(data?.error?.message || "Anthropic API error");
  }

  const textBlocks = (data.content || [])
    .filter((c: { type: string }) => c.type === "text")
    .map((c: { text: string }) => c.text)
    .join("\n");
  const clean = textBlocks.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean) as SuggestionItem[];
  } catch {
    throw new Error("Could not parse the model response");
  }
}
