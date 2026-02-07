const { verifyToken, getTokenFromReq } = require('./_lib/auth');
const { send, enforceRateLimit } = require('./_lib/http');

module.exports = async (req, res) => {
  if (!enforceRateLimit(req, res)) return;
  const payload = verifyToken(getTokenFromReq(req));
  if (!payload) return send(res, 401, { error: 'Unauthorized' });
  return send(res, 200, { user: { id: payload.userId, email: payload.email, name: payload.name } });
};
