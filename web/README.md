# The Shelf — Books (multi-user)

A real account-backed version of The To-Read Shelf: anyone can sign in with
a magic link, answer a couple of quick questions, and get their own genre
shelves with the same "🔄 More suggestions" AI feature — backed by a
database instead of `localStorage`.

This is a separate app from the static `the-to-read-shelf` project one
folder up — that one keeps running untouched at its existing URL. This one
deploys as its own, second Vercel project from the same GitHub repo.

## One-time setup — no terminal required

**1. Create (or use an existing) Supabase project**
- Go to [supabase.com](https://supabase.com) and create a project if you
  don't have one already for this app.

**2. Run the database schema**
- In your Supabase project, go to **SQL Editor** → **New query**
- Open `supabase/migrations/0001_init.sql` in this folder, copy its full
  contents, and paste them into the query editor
- Click **Run**

**3. Set up sign-in redirect URLs**
- Go to **Authentication → URL Configuration**
- You'll come back and set **Site URL** once you have your Vercel URL
  (step 6) — for now, just note this page
- Add `https://*.vercel.app/**` to **Redirect URLs** so preview deploys
  work too

**4. Copy your API keys**
- Go to **Settings → API**
- Copy the **Project URL** and the **anon public** key — you'll need both
  in step 7

**5. Push this code to GitHub** — handled for you; this folder lives in
the same `spine-screen` repo as the static site.

**6. Create a new Vercel project**
- Go to [vercel.com](https://vercel.com) → **Add New → Project**
- Choose **Import Git Repository** and pick `spine-screen` again — yes, a
  second time. This creates an independent project from the same repo
- Before deploying, expand **Root Directory** and set it to `web`
- Click **Deploy**

**7. Add environment variables**
- In the new Vercel project, go to **Settings → Environment Variables**
  and add:
  - `NEXT_PUBLIC_SUPABASE_URL` — the Project URL from step 4
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the anon public key from step 4
  - `ANTHROPIC_API_KEY` — your Anthropic API key from
    [console.anthropic.com](https://console.anthropic.com)
  - `JUZ_EMAIL` — the email address you'll sign in with (this account
    gets your existing 70 books automatically, no onboarding questions)
- Go to **Deployments** → **Redeploy** so the variables take effect

**8. Finish the redirect URL setup**
- Copy the real `*.vercel.app` URL Vercel gave you
- Back in Supabase (**Authentication → URL Configuration**), set
  **Site URL** to that URL

**9. Try it**
- Visit your new URL, enter your email, click the link that arrives
- If you signed in with the address in `JUZ_EMAIL`, your 70 books should
  already be there — no questions asked
- Any other email goes through a short onboarding (favourite authors,
  genres, a couple of loved/disliked books) before landing on their own
  shelf

## What's different from the static version

- Accounts instead of `localStorage` — your list follows you between
  devices
- A short one-time onboarding for new (non-Juz) users, which also
  auto-populates a starter shelf per genre they picked
- Everything else — the card design, the read/rate interaction, the
  "More suggestions" AI feature — works the same way, same visual system

## Local development

```bash
cd web
npm install
cp .env.local.example .env.local   # fill in your real values
npm run dev
```
