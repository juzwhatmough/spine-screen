# The To-Read Shelf

A personal reading list, organised by genre, with an AI-powered "More suggestions"
button that learns from the books you rate 👍 or 👎.

## What's in here

- `index.html` — the whole app (no build step, just one file)
- `api/suggest.js` — a small serverless function that talks to Anthropic's API
  so your API key never sits in the browser where anyone could see it
- `package.json` — minimal project info Vercel needs
- `.env.example` — shows the one environment variable you'll need to set

## Deploy it — no terminal required

**1. Put it on GitHub**
- Go to github.com, click **New repository**, name it something like `the-to-read-shelf`
- Click **uploading an existing file** (or "Add file → Upload files" once the repo exists)
- Drag in every file from this folder, keeping the `api` folder as a folder
- Commit the upload

**2. Connect it to Vercel**
- Go to vercel.com and click **Add New → Project**
- Choose **Import Git Repository** and pick the repo you just created
- Leave all the build settings as default (there's nothing to configure — it's a static site)
- Click **Deploy**

**3. Add your API key**
- Get a key from console.anthropic.com (this is separate from your Claude.ai
  subscription — API usage is billed per request, a few cents at most per click
  of "More suggestions")
- In your Vercel project, go to **Settings → Environment Variables**
- Add one: Name = `ANTHROPIC_API_KEY`, Value = the key you just copied
- Go to the **Deployments** tab and **Redeploy** so the new variable takes effect

That's it — Vercel gives you a URL like `the-to-read-shelf.vercel.app` you can
send to anyone. Every future change (new books, new authors) just means
uploading an updated `index.html` to the same GitHub repo — Vercel redeploys
automatically, exactly like your other projects.

## A couple of things worth knowing

- Each visitor's "read" checkmarks and 👍/👎 ratings are stored in their own
  browser (via `localStorage`), not shared between people. Everyone gets their
  own private copy of the shelf, even though they're all looking at the same app.
- If you ever want a custom domain instead of the `.vercel.app` one, that's a
  couple of clicks under **Settings → Domains** in the same Vercel project.
