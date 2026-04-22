const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const { requireAuth } = require('../middleware/auth');
const { File } = require('../models');

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.join(__dirname, '../uploads/files')),
  filename: (_, file, cb) => cb(null, uuid() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

router.get('/', requireAuth, async (req, res) => {
  try {
    const q = { deleted: false, folderId: null };
    if (req.query.search) q.title = { $regex: req.query.search, $options: 'i' };
    res.json(await File.find(q).sort({ createdAt: -1 }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const f = await File.create({
      title: req.file.originalname, originalName: req.file.originalname,
      fileURL: `/uploads/files/${req.file.filename}`, filePath: req.file.path,
      mimeType: req.file.mimetype, size: req.file.size, folderId: null
    });
    res.json(f);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/download/:id', requireAuth, async (req, res) => {
  try {
    const f = await File.findById(req.params.id);
    if (!f || f.deleted || !fs.existsSync(f.filePath)) return res.status(404).json({ error: 'Not found' });
    res.setHeader('Content-Type', f.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(f.originalName)}"`);
    fs.createReadStream(f.filePath).pipe(res);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await File.findByIdAndUpdate(req.params.id, { deleted: true, deletedAt: new Date() });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
