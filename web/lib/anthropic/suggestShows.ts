// Mirrors lib/anthropic/suggestBooks.ts's architecture (same server-side-key
// pattern, same fenced-JSON parsing) but with one deliberate difference:
// the prompt never asks for a streaming platform, and the response schema
// has no field for one. There's no live AU streaming-availability data
// source wired into this project, so we never let the model assert where
// something streams — see app/api/shows/suggest/route.ts, which inserts
// every result with creator: "Unconfirmed" and meta.unconfirmed: true.

export type ShowSuggestionItem = { title: string; hook: string };

type SuggestParams = {
  genre: string;
  titlesOnShelf: string[];
  likedTitles: string[];
  dislikedTitles: string[];
  avoidTitles: string[];
  count?: number;
};

export async function suggestShows({
  genre,
  titlesOnShelf,
  likedTitles,
  dislikedTitles,
  avoidTitles,
  count = 4,
}: SuggestParams): Promise<ShowSuggestionItem[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Server is missing ANTHROPIC_API_KEY. Add it in Vercel > Project Settings > Environment Variables."
    );
  }

  const shelfStr = titlesOnShelf.length ? titlesOnShelf.join("; ") : "none yet";
  const likedStr = likedTitles.length ? likedTitles.join("; ") : "none rated yet";
  const dislikedStr = dislikedTitles.length ? dislikedTitles.join("; ") : "none rated yet";
  const avoidStr = avoidTitles.length ? avoidTitles.join("; ") : "none";

  const prompt = `You are a TV/film recommendation engine inside a personal watchlist app.
Genre shelf: "${genre}".
Shows/films already on this shelf: ${shelfStr}.
Reader has liked (after watching): ${likedStr}.
Reader has disliked (after watching): ${dislikedStr}.
Do not suggest any of these titles, already in the reader's list: ${avoidStr}.
Suggest exactly ${count} shows or films for this genre that the reader doesn't already have, leaning toward what they liked and away from anything similar to what they disliked.
IMPORTANT: Do not name a streaming platform or make any claim about where or whether this is currently available to watch — we cannot verify real-time Australian streaming availability, so never assert one. Only return a title and a one-sentence hook.
Respond with ONLY a JSON array, no prose, no markdown code fences, in exactly this shape:
[{"title":"...","hook":"one sentence, under 20 words, no spoilers, no mention of any streaming service"}]`;

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
    return JSON.parse(clean) as ShowSuggestionItem[];
  } catch {
    throw new Error("Could not parse the model response");
  }
}
