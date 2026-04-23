const attempts = {}, lockouts = {};
const MAX = 5, LOCK_MS = 60000;

function checkLock(key) {
  if (lockouts[key] && Date.now() < lockouts[key]) {
    return { locked: true, remaining: Math.ceil((lockouts[key] - Date.now()) / 1000) };
  }
  if (lockouts[key]) { delete lockouts[key]; delete attempts[key]; }
  return { locked: false };
}

function recordFail(key) {
  attempts[key] = (attempts[key] || 0) + 1;
  if (attempts[key] >= MAX) {
    lockouts[key] = Date.now() + LOCK_MS;
    delete attempts[key];
    return { locked: true, remaining: 60 };
  }
  return { locked: false, attemptsLeft: MAX - attempts[key] };
}

function clearAttempts(key) { delete attempts[key]; delete lockouts[key]; }

const sessions = new Set(), vaultSessions = new Set();

function genToken() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function requireAuth(req, res, next) {
  // Accept token from header OR query param (query param needed for blob fetch in browser)
  const token = req.headers['x-auth-token'] || req.query.token;
  if (!sessions.has(token)) return res.status(401).json({ error: 'Unauthorized' });
  next();
}
function requireVault(req, res, next) {
  if (!vaultSessions.has(req.headers['x-vault-token'])) return res.status(401).json({ error: 'Vault locked' });
  next();
}

module.exports = { checkLock, recordFail, clearAttempts, sessions, vaultSessions, genToken, requireAuth, requireVault };