const { send, enforceRateLimit } = require('../../../_lib/http');
const { client, cached, normalizeEpisodeSource } = require('../../../_lib/hianime');

module.exports = async (req, res) => {
  if (!enforceRateLimit(req, res)) return;
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });

  const url = new URL(req.url, 'http://localhost');
  const preferredServer = (url.searchParams.get('server') || 'hd-1').toLowerCase();
  const category = (url.searchParams.get('category') || 'sub').toLowerCase();
  const parts = req.url.split('/').filter(Boolean);
  const number = String(req.query?.number || parts.at(-1).split('?')[0]);
  const animeId = String(req.query?.id || parts.at(-3));

  try {
    const episodes = await cached(`episodes:${animeId}`, () => client.getEpisodes(animeId));
    const episode = episodes.find((entry) => String(entry.number) === number);
    if (!episode) return send(res, 404, { error: 'Episode not found' });

    const servers = await cached(`servers:${episode.id}`, () => client.getEpisodeServers(String(episode.id)));
    const pool = category === 'dub' ? servers.dub || [] : servers.sub || [];
    const selected =
      pool.find((entry) => entry.name?.toLowerCase() === preferredServer) ||
      pool.find((entry) => entry.name?.toLowerCase().replace(/\s+/g, '-') === preferredServer) ||
      pool[0];

    if (!selected?.id) {
      return send(res, 404, { error: 'No streaming servers available for this episode' });
    }

    const sourceData = await cached(`source:${selected.id}`, () => client.getEpisodeSources(String(selected.id)), 20_000);
    const source = normalizeEpisodeSource(sourceData);

    return send(res, 200, { episode, servers, source, selectedServer: selected });
  } catch (error) {
    return send(res, 502, { error: error.message });
  }
};
