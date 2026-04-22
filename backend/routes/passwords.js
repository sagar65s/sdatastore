// passwords.js
const router = require('express').Router();
const { requireAuth, requireVault } = require('../middleware/auth');
const { Password } = require('../models');

router.get('/', requireAuth, requireVault, async (req, res) => {
  try {
    const q = { deleted: false };
    if (req.query.search) q.$or = [{ title: { $regex: req.query.search, $options: 'i' } }, { username: { $regex: req.query.search, $options: 'i' } }];
    res.json(await Password.find(q).sort({ createdAt: -1 }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireAuth, requireVault, async (req, res) => {
  try { res.json(await Password.create(req.body)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', requireAuth, requireVault, async (req, res) => {
  try { res.json(await Password.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, requireVault, async (req, res) => {
  try {
    await Password.findByIdAndUpdate(req.params.id, { deleted: true, deletedAt: new Date() });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/export', requireAuth, requireVault, async (req, res) => {
  try {
    const pwds = await Password.find({ deleted: false });
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="vault-passwords.json"');
    res.send(JSON.stringify({ exportedAt: new Date(), count: pwds.length, data: pwds }, null, 2));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
