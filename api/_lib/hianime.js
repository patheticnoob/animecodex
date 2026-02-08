const { default: Hianime } = require('hianime');

const cache = new Map();
const client = new Hianime();

function mapAnime(result) {
  return {
    id: result.id,
    dataId: result.dataId,
    title: result.title,
    name: result.title,
    image: result.image,
    poster: result.image,
    type: result.type,
    language: result.language,
  };
}

async function cached(key, load, ttlMs = 45_000) {
  const item = cache.get(key);
  if (item && item.expires > Date.now()) return item.value;

  const value = await load();
  cache.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}

function normalizeEpisodeSource(source) {
  return {
    ...source,
    sources: (source.sources || []).map((entry) => ({
      ...entry,
      url: entry.url || entry.file,
    })),
  };
}

module.exports = {
  client,
  mapAnime,
  cached,
  normalizeEpisodeSource,
};
