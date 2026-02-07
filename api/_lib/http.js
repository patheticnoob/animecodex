const cache = new Map();
const rate = new Map();

const API_BASE = process.env.HIANIME_API_BASE || 'https://hianime-api-6z7m.onrender.com';

function send(res, status, data) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return {};
  }
}

function enforceRateLimit(req, res, limit = 80) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const info = rate.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > info.resetAt) {
    info.count = 0;
    info.resetAt = now + windowMs;
  }
  info.count += 1;
  rate.set(ip, info);
  if (info.count > limit) {
    send(res, 429, { error: 'Too many requests' });
    return false;
  }
  return true;
}

async function hianimeRequest(path, ttlMs = 45_000) {
  const key = `${path}`;
  const item = cache.get(key);
  if (item && item.expires > Date.now()) return item.value;

  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Hianime upstream failed: ${response.status}`);
  }
  const json = await response.json();
  cache.set(key, { value: json, expires: Date.now() + ttlMs });
  return json;
}

module.exports = { send, parseBody, enforceRateLimit, hianimeRequest };
