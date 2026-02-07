const { send, enforceRateLimit, hianimeRequest } = require('../../../_lib/http');

module.exports = async (req, res) => {
  if (!enforceRateLimit(req, res)) return;
  const url = new URL(req.url, 'http://localhost');
  const server = url.searchParams.get('server') || 'hd-1';
  const category = url.searchParams.get('category') || 'sub';
  const parts = req.url.split('/').filter(Boolean);
  const number = req.query?.number || parts.at(-1).split('?')[0];
  const id = req.query?.id || parts.at(-3);

  try {
    const servers = await hianimeRequest(`/api/v2/hianime/episode/servers?animeEpisodeId=${id}$episode$${number}`);
    const source = await hianimeRequest(`/api/v2/hianime/episode/sources?animeEpisodeId=${id}$episode$${number}&server=${server}&category=${category}`);
    return send(res, 200, { servers, source });
  } catch (error) {
    return send(res, 502, { error: error.message });
  }
};
