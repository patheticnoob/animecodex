const { send, enforceRateLimit } = require('./_lib/http');
const { client, mapAnime, cached } = require('./_lib/hianime');

const categoryMap = {
  'most-popular': (page) => client.getMostPopular(page),
  'top-airing': (page) => client.getTopAiring(page),
  movies: (page) => client.getMovies(page),
  tv: (page) => client.getTVShows(page),
  ova: (page) => client.getOVAList(page),
  ona: (page) => client.getONAList(page),
  special: (page) => client.getSpecialList(page),
  subbed: (page) => client.getSubbedAnime(page),
  dubbed: (page) => client.getDubbedAnime(page),
};

module.exports = async (req, res) => {
  if (!enforceRateLimit(req, res)) return;
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });

  const url = new URL(req.url, 'http://localhost');
  const category = url.searchParams.get('category') || 'most-popular';
  const page = Number(url.searchParams.get('page') || '1');
  const loadCategory = categoryMap[category];
  if (!loadCategory) return send(res, 400, { error: 'Invalid category' });

  try {
    const data = await cached(`discovery:${category}:${page}`, () => loadCategory(page));
    const animes = (data.results || []).map(mapAnime);
    return send(res, 200, {
      category,
      page,
      data: {
        ...data,
        animes,
      },
    });
  } catch (error) {
    return send(res, 502, { error: error.message });
  }
};
