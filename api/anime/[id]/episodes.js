const { send, enforceRateLimit } = require('../../_lib/http');
const { client, cached } = require('../../_lib/hianime');

module.exports = async (req, res) => {
  if (!enforceRateLimit(req, res)) return;
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });

  const id = req.query?.id || req.url.split('/').at(-2);
  try {
    const episodes = await cached(`episodes:${id}`, () => client.getEpisodes(String(id)));
    return send(res, 200, { episodes });
  } catch (error) {
    return send(res, 502, { error: error.message });
  }
};
