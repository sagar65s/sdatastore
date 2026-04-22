// trash.js
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { Folder, Note, File, Image } = require('../models');

router.get('/', requireAuth, async (req, res) => {
  try {
    const [folders, notes, files, images] = await Promise.all([
      Folder.find({ deleted: true }).sort({ deletedAt: -1 }),
      Note.find({ deleted: true }).sort({ deletedAt: -1 }),
      File.find({ deleted: true }).sort({ deletedAt: -1 }),
      Image.find({ deleted: true }).sort({ deletedAt: -1 })
    ]);
    res.json({
      folders: folders.map(f => ({ ...f.toObject(), type: 'folder' })),
      notes: notes.map(n => ({ ...n.toObject(), type: 'note' })),
      files: files.map(f => ({ ...f.toObject(), type: 'file' })),
      images: images.map(i => ({ ...i.toObject(), type: 'image' }))
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/restore/:type/:id', requireAuth, async (req, res) => {
  try {
    const M = { folder: Folder, note: Note, file: File, image: Image }[req.params.type];
    if (!M) return res.status(400).json({ error: 'Invalid type' });
    await M.findByIdAndUpdate(req.params.id, { deleted: false, $unset: { deletedAt: 1 } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/permanent/:type/:id', requireAuth, async (req, res) => {
  try {
    const M = { folder: Folder, note: Note, file: File, image: Image }[req.params.type];
    if (!M) return res.status(400).json({ error: 'Invalid type' });
    await M.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
