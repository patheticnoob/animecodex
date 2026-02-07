const { send, enforceRateLimit, hianimeRequest } = require('../_lib/http');

module.exports = async (req, res) => {
  if (!enforceRateLimit(req, res)) return;
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });

  const id = req.query?.id || req.url.split('/').pop();
  try {
    const data = await hianimeRequest(`/api/v2/hianime/anime/${id}`);
    return send(res, 200, data);
  } catch (error) {
    return send(res, 502, { error: error.message });
  }
};
