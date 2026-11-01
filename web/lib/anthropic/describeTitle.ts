// Writes the same kind of one-sentence "hook" the More suggestions cards
// have, for titles added by hand. Best-effort: any failure (no key, timeout,
// model unsure what the title is) returns null and the card simply has no
// description — adding a title must never fail because of this.
//
// Shows: like the suggestions, the prompt never asks for (or accepts) a
// streaming platform or availability claim.
export async function describeTitle(input: {
  kind: "book" | "show";
  title: string;
  creator?: string | null; // author for books; ignored for shows (it's a platform)
}): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const what =
    input.kind === "book"
      ? `the book "${input.title}"${input.creator ? ` by ${input.creator}` : ""}`
      : `the TV show or film "${input.title}"`;

  const prompt = `Write a one-sentence hook for ${what}, for a personal ${
    input.kind === "book" ? "reading list" : "watchlist"
  } card: under 20 words, no spoilers${
    input.kind === "show" ? ", and no mention of any streaming service or where to watch it" : ""
  }.
If you are not confident you know this exact title, reply with exactly UNKNOWN instead of guessing.
Reply with only the sentence (or UNKNOWN), no quotes, no preamble.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 120,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = (data.content ?? [])
      .filter((c: { type: string }) => c.type === "text")
      .map((c: { text: string }) => c.text)
      .join(" ")
      .trim()
      .replace(/^["“]|["”]$/g, "");
    if (!text || /^unknown\b/i.test(text) || text.length > 240) return null;
    return text;
  } catch {
    return null;
  }
}
