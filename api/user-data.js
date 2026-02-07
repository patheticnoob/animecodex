const { readDb, writeDb } = require('./_lib/db');
const { verifyToken, getTokenFromReq } = require('./_lib/auth');
const { send, parseBody, enforceRateLimit } = require('./_lib/http');

module.exports = async (req, res) => {
  if (!enforceRateLimit(req, res)) return;
  const payload = verifyToken(getTokenFromReq(req));
  if (!payload) return send(res, 401, { error: 'Unauthorized' });

  const db = readDb();
  const userId = payload.userId;
  db.watchlists[userId] ||= [];
  db.progress[userId] ||= {};
  db.history[userId] ||= [];

  if (req.method === 'GET') {
    return send(res, 200, {
      watchlist: db.watchlists[userId],
      progress: db.progress[userId],
      history: db.history[userId].slice(0, 200),
    });
  }

  if (req.method === 'PUT') {
    const body = await parseBody(req);
    const { type, payload: data } = body;

    if (type === 'watchlist.add') {
      if (!db.watchlists[userId].some((a) => a.id === data.id)) db.watchlists[userId].push(data);
    }
    if (type === 'watchlist.remove') {
      db.watchlists[userId] = db.watchlists[userId].filter((a) => a.id !== data.id);
    }
    if (type === 'progress.save') {
      const key = `${data.animeId}::${data.episodeNumber}`;
      db.progress[userId][key] = { ...data, updatedAt: new Date().toISOString() };
      db.history[userId].unshift({ ...data, watchedAt: new Date().toISOString() });
    }

    writeDb(db);
    return send(res, 200, { ok: true });
  }

  return send(res, 405, { error: 'Method not allowed' });
};
