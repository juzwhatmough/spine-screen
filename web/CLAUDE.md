@AGENTS.md

# CLAUDE.md — The Shelf (Books & Shows, multi-user)

Context for anyone (human or Claude Code) picking this project up.

## What this is

The account-backed successor to `the-to-read-shelf` (one folder up, still
a separate live static site — see its own CLAUDE.md). Same visual system
and card/read-or-watch/rate interaction, but backed by Supabase auth +
Postgres instead of `localStorage`, so a list follows a user between
devices. Anyone can sign in via magic link and get their own private
Books and Shows shelves — a Books/Shows tab switcher (`components/nav/TabNav.tsx`)
sits in the header of both.

**Books and Shows are close to symmetrical now, with one real
difference:** both have onboarding-free manual add forms, filters, and AI
"🔄 Suggest more" — but Books' onboarding flow (new users answer a few
questions and get an auto-seeded starter shelf) has no Shows equivalent.
Non-Juz Shows users just land on an empty shelf with the "Add a show" FAB
(see "Add-a-book / Add-a-show: FAB + modal" below) as their only way in.
Both tabs give Juz (matched by `JUZ_EMAIL`) a silent,
automatic seed of her existing library on first visit — 70 books, 93
shows — no UI shown to her either way.

**Shows' AI suggestions never assert a streaming platform.** There's no
live Australian streaming-availability data source wired into this
project (no JustWatch API or equivalent), so unlike Books' AI suggestions
(which do carry a real author), every AI-suggested show is inserted with
`creator: "Unconfirmed"` and `meta.unconfirmed: true`, and the card shows
a distinct "⚠ Unconfirmed — verify streaming availability" badge instead
of a platform name. Wiring in a real availability source is a future
batch, explicitly out of scope here — don't have an AI suggestion assert
a platform without one.

This project was built without a prior "Batch 1" scaffold existing — the
Next.js app, Supabase schema, and auth were all built from scratch in the
same pass that ported the Books UI (originally planned as a separate
earlier phase). See `supabase/migrations/0001_init.sql` for the schema.

## Stack

- Next.js 16 (App Router, TypeScript), deployed on Vercel as its own
  project (Root Directory `web`) from the same GitHub repo as the static
  site
- Supabase: Postgres + Row Level Security + magic-link/email-OTP auth,
  via `@supabase/ssr` (not the deprecated `@supabase/auth-helpers-*`)
- Anthropic API for book suggestions, server-side only (`ANTHROPIC_API_KEY`)

### Next.js 16 note

This version renamed the `middleware.ts` file convention to `proxy.ts`
(middleware is deprecated) — session refresh lives at `proxy.ts` (root) +
`lib/supabase/proxy.ts` (the actual logic), not `middleware.ts`. If a
future Next.js upgrade changes this again, check
`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/`
before assuming either name is still current — see `AGENTS.md` above,
which flags that this Next.js version may differ from an LLM's training
data.

## File structure

```
supabase/migrations/0001_init.sql   schema — user runs this in Supabase's SQL editor, not Claude
proxy.ts                             session-refresh entrypoint (was middleware.ts pre-Next-16)
app/
  layout.tsx, globals.css             fonts + design tokens, ported from index.html/DESIGN_SPEC.md
  page.tsx                            redirect: signed-in -> /books, signed-out -> /login
  login/page.tsx                      magic-link email form
  auth/callback/route.ts               exchanges the auth code for a session
  onboarding/page.tsx                  gate + form (Books only; Juz never sees this)
  books/page.tsx                       gate (auth, onboarding, Juz auto-seed) + groupItems -> BooksShelvesView
  shows/page.tsx                       gate (auth, Juz auto-seed — no onboarding) + groupShowItems -> ShowsShelvesView
  api/books/suggest/route.ts            AI suggestions (real author, real book)
  api/shows/suggest/route.ts             AI suggestions (creator: "Unconfirmed", never a real platform)
components/books/
  BooksShelvesView.tsx                   CLIENT boundary: owns filter + status-view state, the active-shelf
                                          tracking used to pre-fill the Add modal's genre, and the stats bar
                                          (moved here from the server page so it can react to both); does the
                                          actual filtering; renders StatusToggle + FilterBar + ShelfNav +
                                          shelves/empty-state + AddBookFab
  ShelfNav.tsx (shared with Shows) — takes an onActiveChange callback, used only by the Fab's genre pre-fill
  BookShelf.tsx, AuthorGroup.tsx — pass isDone/getRating/animatingOut and the onItemStatusChange/
                                          onItemRatingChange callbacks straight through to BookCard
  BookCard.tsx, MoreSuggestions.tsx
  AddBookFab.tsx                          owns the modal's open/close state + the FAB's ref; wires Fab + Modal + AddBookForm
  AddBookForm.tsx                         fields/validation/submit only now — no section wrapper, lives inside the Modal
components/shows/
  ShowsShelvesView.tsx                   same pattern as BooksShelvesView.tsx (Genre + Platform, flat items not author-grouped)
  ShowShelf.tsx, ShowCard.tsx, MoreSuggestionsShow.tsx
  AddShowFab.tsx, AddShowForm.tsx         mirror the Books pair exactly
components/ui/StatusToggle.tsx          "On the Shelf" / "Finished" segmented control — reuses .tab-nav's
                                          exact CSS (see globals.css: `.tab-nav a, .tab-nav button`), not a
                                          new visual style
lib/hooks/useStatusTransitions.ts       shared by both *ShelvesView components — see "Status view" below,
                                          read this before touching card status/rating logic on either tab
components/ui/
  Fab.tsx                                 generic fixed-position "+" button, forwardRef'd so callers can
                                          pass it to Modal's returnFocusRef
  Modal.tsx                               generic accessible modal (portal, focus trap, Esc/overlay-click
                                          close, returns focus to whatever ref it's given on close) — both
                                          Add-a-book and Add-a-show modals use this, don't build a second one
components/filters/FilterBar.tsx        shared dropdown-row component — Books and Shows both use this,
                                          don't build a second filter UI
components/onboarding/                 OnboardingForm, GenrePicker (Books only)
components/nav/TabNav.tsx              Books/Shows tab switcher, used by both pages' headers
lib/supabase/                          client.ts (browser), server.ts (RSC/actions), proxy.ts (session refresh)
lib/books/                             genres.ts, kindLabel.ts, groupItems.ts, seedData.ts (Juz's 70 books)
lib/shows/                             genres.ts, groupItems.ts, seedData.ts (Juz's 93 shows)
lib/anthropic/                          suggestBooks.ts, suggestShows.ts (mirror each other; suggestShows
                                          never solicits a platform field at all — see prompt text)
lib/actions/listItems.ts               toggleRead/setRating (shared, generic across media_type),
                                          addManualBook, addManualShow — both validate genre against
                                          the canonical GENRE_TAGS/SHOW_GENRE_TAGS list (no free-text genre)
lib/actions/                           onboarding.ts, seedJuz.ts, seedJuzShows.ts (all Server Actions)
types/database.ts                     hand-written — regenerate with `supabase gen types typescript` if the CLI ever gets wired up
```

## Filtering architecture

`app/books/page.tsx` and `app/shows/page.tsx` are Server Components that
fetch + group data as before, but no longer render shelves directly — they
hand the full grouped array to `BooksShelvesView`/`ShowsShelvesView`
(Client Components), which own filter state and do plain `.filter()`
logic client-side (no reload, no server round-trip). `BookShelf` /
`AuthorGroup` / `ShowShelf` have no server-only imports, so they're safe
to render from inside a Client Component even without a `"use client"`
directive of their own — Next.js just bundles them for the client since
nothing forces them server-side. Filter dropdown options are always
derived from the *full* unfiltered dataset (not narrowed by the other
active filter) — a standard, simpler filter UX than trying to keep
cross-filter option lists in sync.

## Status view (On the Shelf / Finished) — and a real bug this design fixes

`StatusToggle` (`components/ui/StatusToggle.tsx`) adds a third filter
dimension alongside genre/author/platform: `statusView` (`'shelf'` shows
`status !== 'done'`, `'finished'` shows `status === 'done'`), combined
with AND logic same as the others. The stats bar and ShelfNav both react
to it the same way they already reacted to genre/author.

**`BookCard`/`ShowCard` do not own local `done`/`rating` state — they're
fully controlled components now**, reading `done`/`rating` as props
computed by `lib/hooks/useStatusTransitions.ts` in the parent
`*ShelvesView`, not derived from `item.status`/`item.rating` themselves.
This was a deliberate fix for a real bug found while building this
feature, not a stylistic preference:

Switching `statusView` naturally unmounts a card (when it leaves the
filtered list) and can remount it later (when it re-enters, e.g. after
switching back). Before this fix, each card derived its own `done`/
`rating` from `useState(item.status === 'done')` — a one-time
initializer. A card that had just been marked done, then left "On the
Shelf" and was later viewed under "Finished", would remount and
re-initialize from `item.status` — the *server's last confirmed value* at
the time the page was rendered — which is correct once the Server
Action's `revalidatePath` round-trip has landed, but wrong (silently
reverts to the pre-click state) if the round-trip hasn't finished yet by
the time the remount happens. Verified this failure mode directly against
a throwaway test route before fixing it: marking an item done, switching
to Finished, was showing the card as still-unread and toggling it back
open silently failed to remove it from the Finished view. Lifting
`done`/`rating` to the parent's `statusOverrides`/`ratingOverrides` maps
(which persist regardless of mount state) fixes it: a remounted card
always reads the correct optimistic value immediately, independent of
server timing.

`animatingOut` is a *separate*, purely-visual concern from the above — a
fixed 280ms window (see `.card.exiting` in globals.css) during which an
item that just left the active status view is kept in the filtered
array and rendered with a fade instead of vanishing the instant its
status flips. It has no bearing on the actual include/exclude filtering
decision, which is why it's tracked independently rather than folded into
the override maps.

## Add-a-book / Add-a-show: FAB + modal

Both forms moved out of the page flow into a fixed-position FAB +
centered modal (`components/ui/Fab.tsx` + `components/ui/Modal.tsx`,
generic and shared by both tabs — don't build a per-tab variant of
either). `AddBookFab.tsx`/`AddShowFab.tsx` own the open/close state and a
`ref` to the FAB button, which they pass to `Modal` as `returnFocusRef` —
closing the modal (Esc, overlay click, or a successful submit calling
`onSuccess`) always returns focus there.

- **Genre pre-fill**: `ShelfNav` takes an `onActiveChange(tag)` callback,
  fired from the same effect that already tracks scroll-spy `active`
  state — it doesn't need that data for anything of its own, this is
  purely for the Fab's benefit. `BooksShelvesView`/`ShowsShelvesView`
  wire it straight to a `useState` setter (referentially stable, so it's
  safe in `ShelfNav`'s effect dependency array without extra memoization)
  and pass the result down as `AddBookFab`/`AddShowFab`'s `activeGenre`
  prop. `AddBookForm`/`AddShowForm` read it only as a `useState`
  initializer, not in an effect — safe because `Modal` unmounts its
  children while closed, so the form remounts fresh (and re-reads
  whatever the current active genre is) every time it opens.
- **Portal + SSR**: `Modal` renders via `createPortal` to `document.body`,
  gated on a client-only flag from `useSyncExternalStore` rather than the
  more common `useState` + `useEffect(() => setMounted(true), [])`
  pattern — this project's `eslint-config-next` flags that pattern as a
  synchronous-setState-in-effect render cascade. `useSyncExternalStore`
  expresses the same "are we past the initial SSR pass" check without
  tripping it.
- **Initial focus** lands on the first real form field, not the modal's
  close button, even though the close button is earlier in DOM order —
  `Modal` explicitly looks for `input, select, textarea` first before
  falling back to the general focusable-element query.
- Verified interactively (Fab click, Esc, overlay-click-vs-content-click,
  Tab-trap wraparound in both directions, genre pre-fill, focus return)
  against a throwaway test route before this was removed — not covered
  by any automated test in the repo, there isn't a test setup here yet.

## Content model

`list_items` (RLS: a user only ever sees/writes their own rows) holds both
books (`media_type = 'book'`) and shows (`media_type = 'show'`).

Mapping from the original prototype's fields:
- card "read"/"watched" (stamped) -> `status = 'done'`
- 👍 -> `rating = 'liked'`, 👎 -> `rating = 'disliked'`
- book `hook` -> `meta.hook`; book `source_status` -> `meta.source_status`
  — kept as **5** values (`want`/`more`/`discover`/`ai`/`ai-known`), not
  the 3 a planning doc for the Books work originally described, because
  the original app's `kindLabel()` genuinely branches on 5 to produce 4
  distinct card labels ("Suggested for you" vs "New to you" are different
  things)
- **Shows only:** `creator` stores the streaming **platform**, not an
  author (shows don't have one) — this is a deliberate reuse of an
  existing column rather than a schema change, so the
  `list_items_user_unique_title` dedup index (which includes `creator`)
  still works correctly. `ShowCard.tsx` reads `item.creator` into the
  `.kind` badge instead of rendering an author line. Show `note` and
  `currentlyStreaming` live in `meta` (see `types/database.ts`'s
  `ListItemMeta`) — there was no natural column for either.

`rating` (schema: `loved`/`liked`/`disliked`) and `status` (schema:
`want`/`in_progress`/`done`) are both wider than what the card UI
currently uses — see "Known simplifications" below.

`user_profile` holds Books onboarding answers (`favorite_authors`,
`favorite_genres`, `loved_books`, `disliked_books`) plus `loved_shows`/
`disliked_shows` — the latter two are unused placeholders; Shows never
got (and doesn't need) an onboarding flow to write them from.

## Known simplifications (deliberate, not oversights)

- **Card interactions stay binary in v1.** Thumbs are liked/disliked only
  (no `loved` from the card — `loved` books only come from the onboarding
  free-text field, a separate mechanism). Tap-to-toggle is want↔done only
  (no `in_progress` UI trigger). Both are schema-supported for later if a
  richer interaction is ever wanted.
- **Author-group "why" subtitles don't exist here.** The original app's
  author groups had hand-written curation text (e.g. "German Midwife &
  Secret Messenger → both yours already") specific to Juz's list — there's
  no generic way to derive that per-user, so author groups here show just
  the author name.
- **"Other" free-text genres** (from onboarding) get a neutral fallback
  shelf color and are not auto-seeded with AI suggestions — no prompt
  scaffolding exists for an arbitrary genre string. They work fine for
  manually-added books.
- **Shows still has no onboarding** (unlike Books) — that's unchanged.
  What *did* change: Shows now has AI suggestions and a manual add form,
  same as Books, just without the platform claim (see above).
- **Manual add forms (`AddBookForm`, `AddShowForm`) both require genre to
  match an existing canonical shelf** — no free-text "Other" like
  onboarding's `GenrePicker` allows. Enforced both client-side (dropdown
  only offers real options) and server-side in `lib/actions/listItems.ts`
  (throws if the genre isn't in `GENRE_TAGS`/`SHOW_GENRE_TAGS`).
- **`MoreSuggestionsShow.tsx` is a near-duplicate of `MoreSuggestions.tsx`**,
  not a shared component — same fetch/loading/error logic, different
  endpoint. Deliberate: "port the same architecture" was read as porting
  the pattern, not refactoring the working, tested Books component to
  share code with a new, less-proven one.
- **Juz gets no onboarding UI at all, for either tab.** If the signed-in
  email matches `JUZ_EMAIL`, `app/books/page.tsx` silently seeds her 70
  books (`lib/books/seedData.ts`) and `app/shows/page.tsx` silently seeds
  her 93 shows (`lib/shows/seedData.ts`) — both re-derived from
  `the-to-read-shelf/index.html`'s live data, already fact-checked.
  Everyone else: Books sends them through `/onboarding`; Shows just shows
  them an empty shelf.

## Data integrity note

`lib/books/seedData.ts` and `lib/shows/seedData.ts` were both generated
programmatically from `the-to-read-shelf/index.html`'s live `shelves`/
`shows` arrays (a script flattened/copied the data), not retyped by hand
— so they inherit that data's existing fact-checked state (including the
Nightingale `currentlyStreaming` fix documented in that project's
DESIGN_SPEC.md) without introducing new transcription errors. If new seed
data is ever added here directly, hold it to the same bar as
`the-to-read-shelf/CLAUDE.md` describes: Juz has caught real attribution
errors in this list before.

## Working style notes

Same as `the-to-read-shelf/CLAUDE.md`: no coding background, comfortable
with the Claude Code → GitHub → Vercel loop, prefers verbatim step-by-step
instructions for anything requiring a dashboard or the terminal (see this
folder's own `README.md`), values design coherence over generic UI
patterns, and would rather be asked than have a data or UX judgment call
made silently.
