const { send, enforceRateLimit, hianimeRequest } = require('./_lib/http');

module.exports = async (req, res) => {
  if (!enforceRateLimit(req, res)) return;
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
  const url = new URL(req.url, 'http://localhost');
  const q = url.searchParams.get('q') || '';
  const page = Number(url.searchParams.get('page') || '1');
  if (!q) return send(res, 400, { error: 'Missing query' });

  try {
    const data = await hianimeRequest(`/api/v2/hianime/search?q=${encodeURIComponent(q)}&page=${page}`);
    return send(res, 200, { q, page, data });
  } catch (error) {
    return send(res, 502, { error: error.message });
  }
};
