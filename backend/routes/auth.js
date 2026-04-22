const router = require('express').Router();
const { checkLock, recordFail, clearAttempts, sessions, vaultSessions, genToken } = require('../middleware/auth');

router.post('/verify-pin', (req, res) => {
  const key = 'main_' + (req.ip || 'x');
  const lock = checkLock(key);
  if (lock.locked) return res.status(429).json({ error: `Locked for ${lock.remaining}s`, remaining: lock.remaining });
  if (String(req.body.pin) !== String(process.env.MAIN_PIN)) {
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
  const key = 'vault_' + (req.ip || 'x');
  const lock = checkLock(key);
  if (lock.locked) return res.status(429).json({ error: `Locked for ${lock.remaining}s`, remaining: lock.remaining });
  if (String(req.body.pin) !== String(process.env.VAULT_PIN)) {
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

module.exports = router;
