const { send, enforceRateLimit, hianimeRequest } = require('./_lib/http');

const categoryMap = {
  'most-popular': '/api/v2/hianime/top-10',
  'top-airing': '/api/v2/hianime/top-airing',
  movies: '/api/v2/hianime/movie',
  tv: '/api/v2/hianime/tv',
  ova: '/api/v2/hianime/ova',
  ona: '/api/v2/hianime/ona',
  special: '/api/v2/hianime/special',
  subbed: '/api/v2/hianime/subbed-anime',
  dubbed: '/api/v2/hianime/dubbed-anime',
};

module.exports = async (req, res) => {
  if (!enforceRateLimit(req, res)) return;
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
  const url = new URL(req.url, 'http://localhost');
  const category = url.searchParams.get('category') || 'most-popular';
  const page = Number(url.searchParams.get('page') || '1');
  const endpoint = categoryMap[category];
  if (!endpoint) return send(res, 400, { error: 'Invalid category' });

  try {
    const path = endpoint.includes('?') ? `${endpoint}&page=${page}` : `${endpoint}?page=${page}`;
    const data = await hianimeRequest(path);
    return send(res, 200, { category, page, data });
  } catch (error) {
    return send(res, 502, { error: error.message });
  }
};
