const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { Note } = require('../models');

router.get('/', requireAuth, async (req, res) => {
  try {
    const q = { deleted: false };
    if (req.query.search) q.$or = [{ title: { $regex: req.query.search, $options: 'i' } }, { content: { $regex: req.query.search, $options: 'i' } }];
    res.json(await Note.find(q).sort({ updatedAt: -1 }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireAuth, async (req, res) => {
  try { res.json(await Note.create(req.body)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', requireAuth, async (req, res) => {
  try { res.json(await Note.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await Note.findByIdAndUpdate(req.params.id, { deleted: true, deletedAt: new Date() });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/download/:id/txt', requireAuth, async (req, res) => {
  try {
    const n = await Note.findById(req.params.id);
    if (!n) return res.status(404).json({ error: 'Not found' });
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(n.title)}.txt"`);
    res.send(`${n.title}\n${'='.repeat(n.title.length)}\n\n${n.content}\n\nCreated: ${n.createdAt}`);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/download/:id/html', requireAuth, async (req, res) => {
  try {
    const n = await Note.findById(req.params.id);
    if (!n) return res.status(404).json({ error: 'Not found' });
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${n.title}</title><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:20px;color:#111}h1{border-bottom:2px solid #4ade80;padding-bottom:10px}.content{white-space:pre-wrap;line-height:1.8}.meta{color:#666;font-size:.85em;margin-top:40px;border-top:1px solid #eee;padding-top:10px}</style></head><body><h1>${n.title}</h1><div class="content">${n.content}</div><div class="meta"><p>Created: ${new Date(n.createdAt).toLocaleString()}</p></div></body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(n.title)}.html"`);
    res.send(html);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
