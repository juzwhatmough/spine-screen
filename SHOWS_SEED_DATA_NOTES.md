# shows-seed-data.json — notes for whoever builds the Shows shelf

Extracted from Juz's existing `watchlist.html` (93 titles, already verified
against real Australian streaming availability — see her past
conversation "Organize streaming shows by Australian platform" for the
full verification history if useful context).

## Shape

```json
{
  "title": "The Fall",
  "app": "Prime Video",
  "genre": "Thriller & Mystery",
  "note": "Gillian Anderson thriller. Was unassigned in your ChatGPT list — confirmed here.",
  "currently_streaming": true
}
```

- **86 of 93** titles were `currently_streaming: true` in the source data
  — confirmed available as part of a normal Australian subscription.
  (One of these, "Nightingale," turned out to be a data error — see
  "Resolved decisions" below.)
- **7** were `currently_streaming: false` (The Loudest Voice, Judy,
  Hamnet, Miss Scarlet and The Duke, State of the Union, Mrs. Harris Goes
  to Paris, The Holdovers) — rent/purchase-only or unlisted when last
  checked.

## Genre breakdown (86 active titles, per the original source notes)

| Genre | Count |
|---|---|
| Thriller & Mystery | 27 |
| Drama | 23 |
| Comedy | 19 |
| Period Drama | 16 |
| True Crime | 3 |
| Romance | 3 |
| Sci-Fi & Fantasy | 1 |
| Documentary | 1 |

## Resolved decisions

Two open questions were flagged here for Juz rather than guessed at when
the Shows shelf was actually built. Both are now resolved and reflected
in `index.html`:

1. **Card copy — hooks vs. raw verification notes.** Decided: write proper
   one-line hooks matching the Books cards' tone, one per show. The
   original `note` field (provenance/verification text like "Also
   streaming on Stan," "Fell off Stan — now purchase/rent only") is now
   only surfaced on-card for titles that aren't currently streaming,
   where it explains where to actually find them.
2. **Not-currently-streaming titles — keep or exclude.** Decided: keep
   all of them visible, flagged with a small orange "⚠ Not currently
   streaming" warning badge — matching how Juz's original `watchlist.html`
   handled them, rather than deleting them outright.

## Data issue caught while building

The source data listed **"Nightingale"** as `currently_streaming: true`
even though its `app` field was `"Not Currently Streaming"` and its own
`note` explained the film adaptation isn't out until March 2027. That's
an internal contradiction in the source data — corrected to `false` in
`index.html` (and it now carries the warning badge like the other seven).
Worth a quick heads-up to Juz, and worth double-checking any future data
drops for the same kind of inconsistency before wiring them in.
