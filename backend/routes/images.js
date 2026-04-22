// images.js
const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const { requireAuth } = require('../middleware/auth');
const { Album, Image } = require('../models');

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.join(__dirname, '../uploads/images')),
  filename: (_, file, cb) => cb(null, uuid() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.get('/albums', requireAuth, async (req, res) => {
  try {
    const albums = await Album.find({ deleted: false }).sort({ createdAt: -1 });
    const result = await Promise.all(albums.map(async a => {
      const count = await Image.countDocuments({ albumId: a._id, deleted: false });
      const cover = await Image.findOne({ albumId: a._id, deleted: false });
      return { ...a.toObject(), imageCount: count, coverURL: cover?.fileURL };
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/albums', requireAuth, async (req, res) => {
  try { res.json(await Album.create({ name: req.body.name, description: req.body.description })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/albums/:id', requireAuth, async (req, res) => {
  try {
    await Album.findByIdAndUpdate(req.params.id, { deleted: true, deletedAt: new Date() });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const q = { deleted: false };
    if (req.query.albumId) q.albumId = req.query.albumId;
    res.json(await Image.find(q).sort({ createdAt: -1 }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/upload', requireAuth, upload.array('images'), async (req, res) => {
  try {
    const images = await Promise.all(req.files.map(f =>
      Image.create({
        title: f.originalname, originalName: f.originalname,
        fileURL: `/uploads/images/${f.filename}`, filePath: f.path,
        mimeType: f.mimetype, size: f.size, albumId: req.body.albumId || null
      })
    ));
    res.json(images);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/download/:id', requireAuth, async (req, res) => {
  try {
    const img = await Image.findById(req.params.id);
    if (!img || !fs.existsSync(img.filePath)) return res.status(404).json({ error: 'Not found' });
    res.setHeader('Content-Type', img.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(img.originalName)}"`);
    fs.createReadStream(img.filePath).pipe(res);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await Image.findByIdAndUpdate(req.params.id, { deleted: true, deletedAt: new Date() });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
