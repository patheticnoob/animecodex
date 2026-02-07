const crypto = require("crypto");
const { readDb, writeDb } = require('./_lib/db');
const { hashPassword, verifyPassword, signToken } = require('./_lib/auth');
const { send, parseBody, enforceRateLimit } = require('./_lib/http');

module.exports = async (req, res) => {
  if (!enforceRateLimit(req, res)) return;
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });

  const body = await parseBody(req);
  const { action, email, password, name } = body;
  if (!action || !email || !password) return send(res, 400, { error: 'Missing fields' });

  const db = readDb();
  if (action === 'signup') {
    if (db.users.some((u) => u.email === email)) return send(res, 409, { error: 'Email already used' });
    const user = { id: crypto.randomUUID(), email, name: name || email.split('@')[0], password: hashPassword(password) };
    db.users.push(user);
    writeDb(db);
    const token = signToken({ userId: user.id, email: user.email, name: user.name });
    return send(res, 201, { token, user: { id: user.id, email: user.email, name: user.name } });
  }

  if (action === 'login') {
    const user = db.users.find((u) => u.email === email);
    if (!user || !verifyPassword(password, user.password)) return send(res, 401, { error: 'Invalid credentials' });
    const token = signToken({ userId: user.id, email: user.email, name: user.name });
    return send(res, 200, { token, user: { id: user.id, email: user.email, name: user.name } });
  }

  return send(res, 400, { error: 'Unknown action' });
};
