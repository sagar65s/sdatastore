const router = require('express').Router();
const { checkLock, recordFail, clearAttempts, sessions, vaultSessions, genToken } = require('../middleware/auth');

router.post('/verify-pin', (req, res) => {
  const MAIN_PIN = process.env.MAIN_PIN;
  if (!MAIN_PIN) {
    console.error('❌ MAIN_PIN environment variable is not set!');
    return res.status(500).json({ error: 'Server misconfiguration: MAIN_PIN not set.' });
  }

  const key = 'main_' + (req.ip || 'x');
  const lock = checkLock(key);
  if (lock.locked) return res.status(429).json({ error: `Locked for ${lock.remaining}s`, remaining: lock.remaining });

  if (String(req.body.pin) !== String(MAIN_PIN)) {
    const r = recordFail(key);
    if (r.locked) return res.status(429).json({ error: 'Locked for 60 seconds', remaining: 60 });
    return res.status(401).json({ error: 'Wrong PIN', attemptsLeft: r.attemptsLeft });
  }
  clearAttempts(key);
  const token = genToken();
  sessions.add(token);
  setTimeout(() => sessions.delete(token), 86400000);
  res.json({ success: true, token });
});

router.post('/verify-vault', (req, res) => {
  const VAULT_PIN = process.env.VAULT_PIN;
  if (!VAULT_PIN) {
    console.error('❌ VAULT_PIN environment variable is not set!');
    return res.status(500).json({ error: 'Server misconfiguration: VAULT_PIN not set.' });
  }

  const key = 'vault_' + (req.ip || 'x');
  const lock = checkLock(key);
  if (lock.locked) return res.status(429).json({ error: `Locked for ${lock.remaining}s`, remaining: lock.remaining });

  if (String(req.body.pin) !== String(VAULT_PIN)) {
    const r = recordFail(key);
    if (r.locked) return res.status(429).json({ error: 'Locked for 60 seconds', remaining: 60 });
    return res.status(401).json({ error: 'Wrong vault PIN', attemptsLeft: r.attemptsLeft });
  }
  clearAttempts(key);
  const token = genToken();
  vaultSessions.add(token);
  setTimeout(() => vaultSessions.delete(token), 86400000);
  res.json({ success: true, token });
});

// ✅ NEW: Token validation endpoint — called by frontend on startup
router.get('/validate', (req, res) => {
  const token = req.headers['x-auth-token'];
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ valid: false });
  }
  res.json({ valid: true });
});

module.exports = router;
