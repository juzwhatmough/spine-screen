# The Shelf: "Marquee" redesign spec

Handoff for Claude Code. Applies to the Next.js app in `web/` (not the
static `the-to-read-shelf/index.html` site). Read `web/CLAUDE.md` first:
everything in it about data, actions and status transitions still holds.
This is a **visual and interaction** redesign. No schema migration is
needed.

Reference designs live in `web/docs/redesign/marquee/` as `.dc.html`
files (HTML with inline styles plus a small logic class). Treat them as
the source of truth for exact spacing, colours and states. They are
design files, not production code: do not import or ship them.

| Reference file | Screen |
|---|---|
| `A-SignIn.dc.html` | Login (`app/login/page.tsx`, idle state) |
| `A-CheckEmail.dc.html` | Login, "sent" state |
| `A-Books.dc.html` | Books shelf: cards, quick mark, stamp, ratings, filter chips, author sheet, search, empty state |
| `A-Shows.dc.html` | Shows shelf: same, with service chips |
| `A-Detail.dc.html` | Detail sheet (book and show variants) |
| `A-Add.dc.html` | Add a title sheet (Book/Show switch) |
| `Main.dc.html` | Early home concept: "Picked for you" card (future, see section 11) |

---

## 1. Goals

1. Replace the paper/card-catalogue look with a dark, cinematic
   "Marquee" look: a navy ground, gold marquee lights, a condensed
   display face and bright cover art.
2. Make the app feel like a phone app: bottom navigation, bottom sheets,
   chips instead of dropdowns, and 44px minimum touch targets.
3. Keep every existing behaviour (listed in section 9). Nothing that works
   today should be lost.
4. Add three things: a **detail sheet**, a **Loved** (heart) rating, and
   **search**.

## 2. Design tokens

Replace the `:root` block in `app/globals.css`. Keep the old tokens
only until nothing references them, then delete them.

```css
:root{
  /* ground and surfaces */
  --mq-bg: #0D1020;          /* page */
  --mq-surface: #171B2E;     /* sheets, inputs, nav, segmented controls */
  --mq-line: #2A3050;        /* borders, dividers */
  --mq-line-strong: #3A4166; /* grabbers, dashed empty states */
  --mq-scrim: rgba(6,8,18,0.72);

  /* text */
  --mq-text: #F4F1EA;
  --mq-muted: #A3A9C2;       /* secondary text, passes 4.5:1 on --mq-bg */
  --mq-dim: #8C93AE;         /* inactive tab labels, meta lines */

  /* accents */
  --mq-gold: #F2B83B;        /* primary action, active state, stamp */
  --mq-gold-off: #4A3F25;    /* unlit marquee bulb */
  --mq-coral: #FF6B57;       /* the "+" add button only */
  --mq-love: #FF6B8A;        /* Loved rating */
  --mq-warn: #FF9A6B;        /* not streaming, stale verified note */
  --mq-warn-line: #7A3B26;
  --mq-warn-bg: rgba(255,154,107,0.10);

  /* radii */
  --mq-r-chip: 20px; --mq-r-input: 14px; --mq-r-btn: 16px;
  --mq-r-card: 16px; --mq-r-sheet: 28px;

  /* motion */
  --mq-ease-out: cubic-bezier(.2,.8,.2,1);
  --mq-ease-pop: cubic-bezier(.2,.9,.3,1.2);
}
```

Text on gold (`--mq-gold`) is always `--mq-bg`, never white.

### Cover palette

Covers and posters get a solid colour picked **deterministically from
the item id** (a simple string hash mod the palette length), so a title
keeps its colour forever. Each entry is a background/foreground pair:

```
#E4572E/#FFF6F2  #3D5AFE/#F2F4FF  #F2C14E/#1D1606  #2EC4B6/#06201D
#7A2E27/#FFF1EC  #9B8CFF/#120D2E  #5F6E56/#F2F5EF  #FF6B57/#1A0B08
```

Put this in a new `lib/ui/coverColor.ts` exporting
`coverColor(id: string): { bg: string; fg: string }`.

Genre shelf colours in `lib/books/genres.ts` and `lib/shows/genres.ts`
are no longer used for cards. Leave the fields in place, unused for now.

## 3. Typography

Replace the Google Fonts link in `app/layout.tsx` with:

```
https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&display=swap
```

Better still, use `next/font/google` for both, so fonts are self-hosted
and there's no layout shift.

| Role | Font | Size / line-height | Notes |
|---|---|---|---|
| App title "THE SHELF" | Anton 400 | 38px / 1 (sign-in: 56px / 0.92) | uppercase |
| Screen / sheet headings | Anton 400 | 26 to 44px / ~1 | uppercase |
| Shelf heading | Anton 400 | 28px / 1 | uppercase |
| Cover/poster title | Anton 400 | 22px / 1.02 (detail thumb 17px) | uppercase |
| Body | Inter 400/500 | 15 to 16px / 1.5 | |
| Labels, buttons | Inter 600/700 | 13 to 16px | |
| Eyebrow | Inter 600 | 11px, letter-spacing 0.18em | uppercase, gold |
| Tag pill on covers | Inter 700 | 10px, letter-spacing 0.1em | uppercase |

Fraunces, Source Serif 4 and IBM Plex Mono are removed.

## 4. App shell

### 4.1 Marquee lights
There's a row of 14 dots across the very top of the shelf and auth
screens (padding 18px 22px 0, `justify-content: space-between`):

- Each dot is 6px.
- Every third dot (index % 3 === 1) is "off" (`--mq-gold-off`, no glow).
- The rest are on (`--mq-gold`, `box-shadow: 0 0 8px var(--mq-gold)`).

Make it a decorative `aria-hidden` component, `components/ui/MarqueeLights.tsx`.

Optional delight: a slow twinkle (on dots fade between 100% and 60%
opacity, staggered, 3s loop). It must be off under
`prefers-reduced-motion`.

### 4.2 Header (Books and Shows)
- A row containing "THE SHELF" (h1) and a 44px round search button
  (surface bg, 1px line border, magnifier icon).
- Below it, the **Books / Shows segmented control**. It's a 4px-padded
  surface track with 16px radius, two equal segments 44px high, 12px
  radius. The active segment is gold with bg-coloured text; inactive is
  transparent with `--mq-muted` text.
  - This replaces `TabNav`'s look. Keep it as `<Link>`s to `/books` and
    `/shows`, with `role="tablist"` and `aria-selected`.
  - Drop the 📚/📺 emoji.
- The long intro paragraph (`.sub`) and the "Est. Aug 2026" eyebrow are
  removed from shelf screens.
- The footer is removed.

### 4.3 Bottom navigation (new, `components/nav/BottomNav.tsx`)
- Floating bar, fixed at `left: 14px; right: 14px; bottom: 18px` (plus
  `env(safe-area-inset-bottom)`), 68px tall, 24px radius.
- Background `rgba(23,27,46,0.94)`, `backdrop-filter: blur(16px)`, 1px
  line border.
- Items:

| Slot | Item | Does |
|---|---|---|
| 1 | Shelf | Sets the status view to "On the shelf" |
| 2 | Add (+) | Opens the Add sheet (replaces the old FAB) |
| 3 | Finished | Sets the status view to "Finished" |
| 4 | Account | Small sheet with the signed-in email and Sign out |

- **The status toggle moves here.** `StatusToggle` is no longer rendered
  on the page, but the `statusView` state and all its logic stay exactly
  as they are. Store it in the URL (`?view=finished`) so the nav can
  switch it and the back button works.
- The Add button is a 52px coral rounded square (18px radius) with a
  bg-coloured "+" and `box-shadow: 0 8px 20px rgba(255,107,87,0.35)`.
  `aria-label="Add a title"`.
- The active item is gold, inactive items `--mq-muted`. Each item is an
  icon plus an 11px label. Mark the active one with `aria-current="page"`.
- Add `padding-bottom: 110px` to `main` so the last row isn't hidden
  behind the nav.

The concept screens show "For you" and "Me" tabs. "For you" is a future
feature (section 11) and isn't built now. "Me" is the Account item above.

## 5. Shelf screen (Books and Shows)

Order, top to bottom:

1. Marquee lights
2. Header (4.2)
3. Filter chip row (5.3)
4. Genre tabs (5.2)
5. Shelves
6. Bottom nav

### 5.1 Stats
The stats bar is removed as its own band. Each shelf heading's subline
shows a live count instead:

- Books: "Mandy Robotham · 8 titles" when an author filter is active,
  otherwise "All authors · N titles".
- Shows: "Stan · 4 shows" or "All services · N shows".

These come from the same filtered arrays the stats bar used.

### 5.2 Genre tabs
`ShelfNav` keeps its scroll-spy and jump-to-shelf behaviour and its
`onActiveChange` callback (it pre-fills the Add sheet's genre). Only its
look changes:

- Horizontal scroll, no visible scrollbar, `gap: 20px`, a 1px
  `--mq-line` bottom border on the row.
- Each tab is 44px high: Inter 600 13px, letter-spacing 0.04em,
  uppercase.
- Inactive tabs are `--mq-dim`. The active tab is `--mq-text` with a 2px
  gold bottom border.
- It stays sticky at the top of the viewport while scrolling, with an
  `--mq-bg` background.
- Short labels are allowed (for example "THRILLER" for "Psychological
  Thriller & Domestic Suspense"). Add an optional `short` field to each
  genre def and fall back to `tag`.

### 5.3 Filter chips (replace `FilterBar` dropdowns)
A horizontal scroll row of chips:

- Each chip is 40px high with a 20px radius and Inter 600 13px text.
- Off: transparent background, 1px line border, `--mq-text`.
- On: `--mq-text` background, `--mq-bg` text.
- Each chip is a `<button aria-pressed>`.

**Books:**

| Chip | Behaviour |
|---|---|
| **Author ▾** (person icon, chevron) | Opens the Author sheet (5.4). When an author is set, the chip shows the name and the On style. |
| All / Your list / More by author / To explore | Single-select. Maps to `meta.source_status`: Your list = `want`; More by author = `more`; To explore = `discover`, `ai` or `ai-known`. |

**Shows:**

| Chip | Behaviour |
|---|---|
| All, then one chip per platform | Single-select. Platforms are derived from the loaded data (`creator`), excluding "Unconfirmed", sorted alphabetically. |
| "N not streaming" | Only shown when N > 0. Off style uses `--mq-warn` text and a `--mq-warn-line` border. Filters to `meta.currentlyStreaming === false`. |
| "N unconfirmed" | Only shown when N > 0, same warn styling. Filters to `meta.unconfirmed`. |

There's no genre chip: the genre tabs cover that. Drop the current genre
dropdown.

All filters combine with AND, together with `statusView` and search,
exactly as the current `filtered` memo does. Option lists still come from
the full unfiltered data, as they do today.

### 5.4 Author sheet (Books)
A bottom sheet (section 7) titled "FILTER BY AUTHOR":

- Rows are 56px high: author name, a muted count, and a 24px round
  radio tick on the right. Selected = gold fill with a bg-coloured check.
- The first row is "All authors".
- Picking a row applies the filter and closes the sheet.
- Use `role="radio"` rows inside a `role="radiogroup"`, or
  `aria-pressed` buttons.
- Authors come from the existing `authorOptions`.

### 5.5 Search (new)
- Tapping the header search button swaps the title row for a search
  field: a 44px pill, gold border, magnifier icon, a "Cancel" text
  button, and autofocus.
- It matches case-insensitively on `title` and `creator`, so books match
  on author and shows match on platform.
- Results filter live, debounced at about 120ms.
- **Scope is the whole current tab** (all shelves), not just the visible
  one. Shelves with no matches are hidden.
- It combines with the chips and the status view.
- Cancel clears the query and restores the title row.
- `Esc` also cancels.
- The query is not persisted.

### 5.6 Shelf section
- Heading: genre name in Anton 28px uppercase, plus the subline from 5.1.
- **Suggest more** button on the right: 40px high, 12px radius, 1px gold
  border, gold text, sparkle icon. It replaces the "🔄 Suggest more"
  button and keeps the existing `MoreSuggestions` /
  `MoreSuggestionsShow` logic.
- Books keep their author grouping (`AuthorGroup`). The author name
  becomes a small heading above each author's covers: Inter 600 13px
  `--mq-muted`, uppercase, letter-spacing 0.08em. Covers flow in one grid
  per author.
- **Grid:** two columns on phones, with a 14px row gap and a 12px column
  gap. From 640px wide use `repeat(auto-fill, minmax(160px, 1fr))`.
  Content max-width is 1080px, centred.

### 5.7 Empty states
Shown in place of the shelves:

- A dashed `--mq-line-strong` box with a 20px radius, centred text, an
  Anton 22px heading, and a 14px `--mq-muted` line.
- Search with no hits: "NOTHING ON THIS SHELF" / "No match for "{q}".
  Try another title or author, or add it." The gold button says
  'Add "{q}"' and opens the Add sheet with the title pre-filled.
- Filters with no hits: "NOTHING HERE YET" plus a "Clear filters" button.
- Finished view with nothing in it: keep the current copy, restyled.

## 6. Cover card (replaces `BookCard` / `ShowCard` markup)

Each card is a vertical stack (8px gap) inside a `position: relative`
wrapper.

### 6.1 Cover (the main tap target)
- It's a `<button>` that **opens the detail sheet**. This is a change:
  tapping no longer marks the item read.
  `aria-label="Open details for {title}"`.
- Height 200px for books, 190px for shows.
- Background and text colour come from `coverColor(item.id)`.
- Padding 12px.
- Contents use `display: flex; flex-direction: column;
  justify-content: space-between`:
  - **Top:** a tag pill, 22px high, 6px radius,
    `rgba(13,16,32,0.78)` background.
    - Books: the `kindLabel()` text. "From your list" is gold text; the
      others are `--mq-text`.
    - Shows: the platform in caps, or "UNCONFIRMED" in `--mq-warn`.
  - **Middle/bottom:** the title in Anton 22px uppercase.
  - **Books only:** the author at the bottom, Inter 600 9px,
    letter-spacing 0.12em, 85% opacity.
- **Book look:** radius `6px 14px 14px 6px`, left padding 20px, and a
  spine made of `box-shadow: inset 8px 0 0 rgba(0,0,0,.18), inset 10px 0
  0 rgba(255,255,255,.12), 0 12px 26px rgba(0,0,0,.45)`.
- **Show look:** 16px radius all round, outer shadow only.
- Shows that aren't currently streaming get a small 18px warn-triangle
  badge in the bottom-right corner (`--mq-warn` on the dark pill). The
  full note lives in the detail sheet.
- Press feedback: `transform: scale(0.97)` on `:active`, 160ms.
- Focus: a 2px gold `outline` with a 3px offset.

### 6.2 Quick-mark tick (new)
- A separate 44px round `<button>` absolutely positioned at
  `top: 6px; right: 6px` over the cover, with `backdrop-filter: blur(6px)`.
  It is a sibling of the cover button, not nested inside it.
- Off: `rgba(13,16,32,0.72)` background, a 2px `rgba(244,241,234,0.55)`
  border, a `--mq-text` check.
- On: gold background and border, a `--mq-bg` check.
- `aria-pressed`. `aria-label` is "Mark {title} as read" or "Mark
  {title} as watched", and "{title}, read. Tap to undo" when on.
- Calls the existing `onStatusChange` and `toggleRead` path, unchanged.

### 6.3 Done state
When `done` / `watched`:

- A dim overlay `rgba(13,16,32,0.62)` fades in over the cover (240ms).
- A **stamp** lands in the centre:
  - Gold 3px border, 10px radius, gold Anton text "READ" (30px) or
    "WATCHED" (26px), letter-spacing 0.06 to 0.1em.
  - Glow: `box-shadow: 0 0 24px rgba(242,184,59,.35), inset 0 0 12px
    rgba(242,184,59,.2)`.
  - Rotated -14deg.
  - It replaces the old strike-through on the title.

Stamp animation (420ms, `--mq-ease-pop`, runs on mount of the stamp
element):

```css
@keyframes mq-stamp{
  0%{opacity:0;transform:scale(2.2) rotate(-14deg)}
  55%{opacity:1;transform:scale(.9) rotate(-14deg)}
  75%{transform:scale(1.06) rotate(-14deg)}
  100%{opacity:1;transform:scale(1) rotate(-14deg)}
}
```

Optional: a 10ms `navigator.vibrate` on mark, where supported.

### 6.4 Rating row
- It replaces "To read" / "To watch" under the cover once the item is
  done, rising in over 260ms with a 120ms delay.
- Three equal buttons, 44px high, 12px radius, 6px gap. All are icon-only
  with an `aria-label`. Use SVG icons, not emoji.

| Button | aria-label | On colour |
|---|---|---|
| Thumbs up | Thumbs up | gold |
| Thumbs down | Thumbs down | gold |
| Heart | Loved it | `--mq-love`, filled heart |

- Off state: surface background, 1px line border, `--mq-muted` icon.
- On state: that button's colour as the background and border, with a
  `--mq-bg` icon.
- Tapping the active one clears it, matching today's behaviour.
- When not done, the slot shows "TO READ" / "TO WATCH" (Inter 600 12px,
  letter-spacing 0.08em, `--mq-muted`) with a small 8px ring, all 44px
  high so the grid doesn't jump.

### 6.5 Exit behaviour (unchanged, do not regress)
Keep `useStatusTransitions` exactly as it is:

- **Rate window first.** `RATE_WINDOW_MS` (1400ms) of full
  interactivity, so the rating row is usable.
- **Then the fade.** Only after that does `.exiting` run for
  `EXIT_ANIMATION_MS` (280ms).
- **Filter on `leavingView`.** The `filtered` arrays must check
  `leavingView`, not `animatingOut`.
- **Restyle only.** Restyle `.exiting` as `opacity: 0;
  transform: scale(.96)`, nothing else.

## 7. Bottom sheet (restyle `components/ui/Modal.tsx`)

Keep `Modal`'s portal, focus trap, Esc/overlay close, `returnFocusRef`,
initial-focus rules and the `useSyncExternalStore` mount check. Add a
`variant: "sheet"` (make it the default) that renders:

- **Scrim:** `--mq-scrim` with `backdrop-filter: blur(6px)`.
- **Panel:** pinned to the bottom, full width, max-width 560px and
  centred on wider screens.
  - `--mq-surface` background, a 1px line top border, radius 28px 28px 0 0.
  - Padding 10px 22px, plus 30px and the safe-area inset at the bottom.
  - `box-shadow: 0 -20px 60px rgba(0,0,0,.5)`.
  - Max-height 90dvh, scrolling internally.
- **Grabber:** a 40×5px `--mq-line-strong` bar, decorative.
- **Close:** a 44px round button, `--mq-bg` background, X icon,
  `aria-label="Close"`.
- **Enter:** 320ms `--mq-ease-out`, from `translateY(40px)` and opacity 0.
- **Exit:** reverse, 200ms.
- **Optional:** swipe-down on the grabber to close.

## 8. Screens

### 8.1 Detail sheet (new, `components/shared/DetailSheet.tsx`)
It opens from the cover tap, as a sheet (section 7), with
`aria-labelledby` pointing at the title. It's one shared component for
books and shows. Laid out top to bottom:

1. **Top row.** A 108×160 thumbnail of the cover on the left (same
   colour and style, title 17px).
   - If done, the thumbnail carries the stamp too.
   - On the right, stacked:
     - **Tag pill** (kind label, or the platform's verified state).
     - **Title** in Anton 28px.
     - **Creator line:**
       - Books: the author, Inter 600 15px.
       - Shows: the platform, Inter 600 15px, plus a 36px pencil button
         ("Edit platform"). This is the existing inline platform edit,
         moved here from the card. Keep the `updateShowPlatform`
         behaviour, validation, optimistic update and "Platform is
         required" error.
       - Under the platform, the `verified-note` ("Checked 6 days ago",
         12px `--mq-dim`, `--mq-warn` when stale, via `isStale`).
     - **Genre pill:** 28px high, 14px radius, line border, muted text.
2. **Hook.** `meta.hook`, Inter 16px / 1.55, `#D9DCE8`. If empty, omit it.
3. **Warning panel** (shows only, when relevant):
   - A `role="note"` box: 14px radius, `--mq-warn-bg`, a
     `--mq-warn-line` border, warn triangle icon.
   - Not streaming: **"Not currently streaming."** followed by
     `meta.note`, or "rent/buy only" if there's no note.
   - Unconfirmed: **"Unconfirmed."** "Verify streaming availability, then
     edit the platform above."
4. **Primary button**, 56px, full width:
   - Not done: gold, with a check icon and "Mark as read" / "Mark as
     watched".
   - Done: outline gold, "Read · tap to undo" / "Watched · tap to undo".
   - Same `onStatusChange` path. When marking done from here, the sheet
     **stays open** so the user can rate.
5. **Rating group** (only when done):
   - Label: "How was it? This shapes Suggest more." (13px muted).
   - Three 48px buttons with icon plus text: "Liked", "Not for me",
     "Loved". Same colours as 6.4.

**State.** The sheet reads `done` and `rating` from
`useStatusTransitions` (`isDone(item)` / `getRating(item)`), never from
`item.status`. That keeps it in sync with the card under it.

**Status view clash.** Marking an item done while the sheet is open in
"On the shelf" view must not unmount the sheet. Render the sheet at the
`*ShelvesView` level keyed by item id, not inside the card.

### 8.2 Add sheet (restyle `AddBookFab` / `AddShowFab`)
- One entry point: the bottom nav "+" opens a single **Add sheet**.
- At the top, a **Book / Show segmented control**, defaulting to the
  current tab.
- Switching it swaps the form body (`AddBookForm` / `AddShowForm`).
  Keep both forms' fields, validation, server actions and the title
  type-ahead (Google Books / TMDB).
- Heading: "ADD TO YOUR SHELF" in Anton 32px.
- **Inputs:** 52px high, `--mq-bg` background, 1px line border, 14px
  radius, Inter 500 16px.
  - Placeholder `#7F86A3`.
  - Focus: gold border plus `box-shadow: 0 0 0 3px rgba(242,184,59,.25)`.
- Labels: Inter 600 13px, visible (not placeholder-only).
- **Show platform:** single-select chips (Netflix, Stan, Binge, Disney+,
  Prime Video, Apple TV+, Other). "Other" reveals a text input.
  - The platform is still **typed or picked by the user, never
    autofilled**. The TMDB pick must still not set it.
- **Genre:** single-select chips instead of the `<select>`, from
  `GENRE_TAGS` / `SHOW_GENRE_TAGS`. Pre-select `activeGenre` as today.
- **Submit:** full-width 56px gold button, "+ Add book" / "+ Add show".
- **Autocomplete dropdown:** restyle to a surface panel, 1px line,
  14px radius, 48px rows.

### 8.3 Login (`app/login/page.tsx`)
**Idle state:**
- Marquee lights.
- A decorative fan of three covers (`aria-hidden`).
- Eyebrow "BOOKS + SHOWS, ONE LIST".
- "THE SHELF" in Anton 56px.
- One line of copy: "Genre shelves, AI picks that learn from your
  ratings, and your list synced to your account."
- At the bottom: an Email label and input, a gold "Email me a sign-in
  link" button, and a small line "No password needed. Your list stays
  private."

**Sent state:**
- A 132px round envelope badge with a soft gold glow.
- "CHECK YOUR EMAIL".
- "We sent a sign-in link to" followed by **{email}** in bold.
- "Tap the link on this device and you will land straight on your shelf."
- A gold "Open email app" button (`mailto:` link).
- Two actions underneath:
  - **Resend link**, with a 60s countdown before it can be tapped.
    Disabled during the countdown, labelled "Resend in 0:42".
  - **Use a different email**, which returns to the idle state.

**Error state:** inline under the input, `--mq-warn`, `role="alert"`.

### 8.4 Onboarding (`app/onboarding`, Books only)
Restyle to the Marquee look using the same field and chip rules (8.2).
There are no flow changes. The canvas also has a 3-step **Shows**
onboarding concept, but the web app has no Shows onboarding today, so
it's **out of scope** for this spec (section 11).

## 9. Behaviour that must not change

- Supabase auth, RLS, `proxy.ts`, magic-link callback.
- Juz's silent seeding of both tabs (`JUZ_EMAIL`), and the onboarding
  redirect for everyone else on Books.
- `toggleRead` clears the rating on unmark.
- `useStatusTransitions` override maps and the two-phase exit
  (see 6.5 and `web/CLAUDE.md`).
- Shows never assert a platform from AI or TMDB. "Unconfirmed" stays
  distinct from "Not currently streaming".
- `platformVerifiedAt` is set on manual add and edit. The stale
  threshold stays at 60 days.
- Genre must match the canonical lists, enforced server-side.
- `ShelfNav` scroll-spy and Add genre pre-fill.
- `Modal` accessibility (focus trap, Esc, return focus).

## 10. Data and logic changes

1. **Loved rating.** `rating` already allows `loved` in the schema.
   - Widen `setRating(itemId, rating: "liked" | "disliked" | "loved")`
     in `lib/actions/listItems.ts` (same toggle-off logic) and the
     matching types in `useStatusTransitions`.
   - Update the comment that says card thumbs stay binary.
2. **Suggestions use Loved.**
   - In `suggestBooks.ts` and `suggestShows.ts`, add a `lovedTitles`
     list. Prompt line: "Reader has loved (strongest signal, weight these
     most): …".
   - Pass loved titles from both suggest routes. Loved titles also count
     as liked wherever a single liked list is still used.
3. **Search and new filters** are client-side only, added to the
   existing `filtered` memos.
4. **No migration.** If `user_profile.loved_books` is used by
   onboarding, leave it alone. It's a separate mechanism.

## 11. Out of scope (later)

- **"For you" tab:** a cross-shelf AI picks feed (see the "Picked for
  you" card in `Main.dc.html`).
- **Shows onboarding:** country, services and taste
  (`A-Onboard.dc.html`).
- **Platform logos:** keep text names for now.
- **Real cover art:** Google Books thumbnails or TMDB posters. The
  `coverColor` blocks are the v1 look. Leave a hook for an image `src`
  later.

## 12. Accessibility checklist

- **Touch targets:** every interactive element is at least 44×44px.
- **Real controls:** use `<button>`, `<a>` and `<input>`, never a
  clickable `div`. The cover and the quick-mark tick are sibling
  buttons, not nested.
- **Labels:** icon-only buttons have `aria-label`. Toggles use
  `aria-pressed`. Tabs use `aria-selected` / `aria-current`.
- **Contrast:**
  - Body text uses `--mq-text` or `--mq-muted` on `--mq-bg` /
    `--mq-surface`, which pass 4.5:1.
  - Cover foreground/background pairs in the palette pass 4.5:1. Check
    any new pair you add.
- **Reduced motion:** under `prefers-reduced-motion: reduce`, disable
  the stamp, sheet, rise and twinkle animations (instant state changes).
- **Focus:** keep a visible 2px gold `focus-visible` outline on all
  controls.

## 13. Suggested PR sequence

One PR per step, each deployable on its own:

1. Tokens, fonts, `MarqueeLights`, header with Books/Shows segmented
   control, bottom nav (status view moves to `?view=`), page background.
2. Cover card: `coverColor`, cover button, quick-mark tick, stamp,
   rating row with Loved (plus `setRating` and suggest prompt changes).
3. Sheet variant of `Modal`, plus the detail sheet (with platform edit
   moved off the card).
4. Filter chips, author sheet, search, empty states (remove
   `FilterBar` dropdowns).
5. Add sheet (single entry, Book/Show switch, chips).
6. Login and onboarding restyle.

After each PR:

- Check on a phone-width viewport (390px).
- Mark an item done, then rate it within the 1.4s window. It must
  still be clickable.
- Switch to Finished and back. Ratings and done state must persist.
- Run `npm run lint` and `npm run build`.
