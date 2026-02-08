const { send, enforceRateLimit } = require('../_lib/http');
const { client, mapAnime, cached } = require('../_lib/hianime');

const loaders = [
  () => client.getMostPopular(1),
  () => client.getTopAiring(1),
  () => client.getSubbedAnime(1),
  () => client.getDubbedAnime(1),
];

module.exports = async (req, res) => {
  if (!enforceRateLimit(req, res)) return;
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });

  const id = String(req.query?.id || req.url.split('/').pop());

  try {
    for (let index = 0; index < loaders.length; index += 1) {
      const data = await cached(`anime-summary:${index}`, loaders[index]);
      const match = (data.results || []).find((item) => String(item.dataId) === id);
      if (match) return send(res, 200, mapAnime(match));
    }
    return send(res, 404, { error: 'Anime not found in available listings' });
  } catch (error) {
    return send(res, 502, { error: error.message });
  }
};
