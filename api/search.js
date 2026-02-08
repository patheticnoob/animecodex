const { send, enforceRateLimit } = require('./_lib/http');
const { client, mapAnime, cached } = require('./_lib/hianime');

module.exports = async (req, res) => {
  if (!enforceRateLimit(req, res)) return;
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });

  const url = new URL(req.url, 'http://localhost');
  const q = url.searchParams.get('q') || '';
  const page = Number(url.searchParams.get('page') || '1');
  if (!q) return send(res, 400, { error: 'Missing query' });

  try {
    const data = await cached(`search:${q}:${page}`, () => client.search(q, page));
    return send(res, 200, {
      q,
      page,
      data: {
        ...data,
        animes: (data.results || []).map(mapAnime),
      },
    });
  } catch (error) {
    return send(res, 502, { error: error.message });
  }
};
