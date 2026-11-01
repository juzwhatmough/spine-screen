// Vercel serverless function: type-ahead search for the "Add a show" form.
// Keeps the TMDB key on the server. Requires a TMDB_API_KEY environment
// variable in the Vercel project. Without it the form simply falls back to
// manual entry. Returns { results: [{ title, year, genre }] } where genre is
// one of the app's show shelves, or null if there's no confident match.

const GENRE_IDS = {
  35: 'Comedy', 80: 'Crime', 99: 'Documentary', 18: 'Drama', 14: 'Fantasy',
  36: 'History', 9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
  10765: 'Sci-Fi & Fantasy', 53: 'Thriller'
};

function mapGenre(ids) {
  const names = new Set((ids || []).map(id => GENRE_IDS[id]).filter(Boolean));
  const has = n => names.has(n);
  if (has('Crime') && has('Documentary')) return 'True Crime';
  if (has('Documentary')) return 'Documentary';
  if (has('Mystery') || has('Thriller') || has('Crime')) return 'Thriller & Mystery';
  if (has('History')) return 'Period Drama';
  if (has('Romance')) return 'Romance';
  if (has('Science Fiction') || has('Fantasy') || has('Sci-Fi & Fantasy')) return 'Sci-Fi & Fantasy';
  if (has('Comedy')) return 'Comedy';
  if (has('Drama')) return 'Drama';
  return null;
}

module.exports = async (req, res) => {
  const q = String((req.query && req.query.q) || '').trim();
  if (q.length < 3) { res.status(200).json({ results: [] }); return; }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing TMDB_API_KEY. Add it in Vercel > Project Settings > Environment Variables.' });
    return;
  }

  try {
    const r = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(q)}&include_adult=false`);
    if (!r.ok) { res.status(502).json({ error: 'TMDB request failed' }); return; }
    const data = await r.json();
    const results = (data.results || [])
      .filter(x => x.media_type === 'movie' || x.media_type === 'tv')
      .slice(0, 5)
      .map(x => ({
        title: x.title || x.name || '',
        year: String(x.release_date || x.first_air_date || '').slice(0, 4),
        genre: mapGenre(x.genre_ids)
      }))
      .filter(x => x.title);
    res.status(200).json({ results });
  } catch (e) {
    res.status(502).json({ error: 'TMDB request failed' });
  }
};
