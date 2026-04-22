const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { v4: uuid } = require('uuid');
const { requireAuth } = require('../middleware/auth');
const { Folder, File } = require('../models');

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.join(__dirname, '../uploads/folders')),
  filename: (_, file, cb) => cb(null, uuid() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

router.get('/', requireAuth, async (req, res) => {
  try {
    const folders = await Folder.find({ deleted: false }).sort({ createdAt: -1 });
    const result = await Promise.all(folders.map(async f => {
      const count = await File.countDocuments({ folderId: f._id, deleted: false });
      return { ...f.toObject(), fileCount: count };
    }));
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    res.json(await Folder.create({ name: req.body.name, description: req.body.description }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/upload', requireAuth, upload.array('files'), async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: 'No files' });
    const paths = req.body.relativePaths
      ? (Array.isArray(req.body.relativePaths) ? req.body.relativePaths : [req.body.relativePaths])
      : req.files.map(f => f.originalname);
    const folderName = req.body.folderName || paths[0]?.split('/')[0] || 'Uploaded Folder';
    const folder = await Folder.create({ name: folderName, description: `${req.files.length} files` });
    await Promise.all(req.files.map((file, i) =>
      File.create({
        title: file.originalname, originalName: file.originalname,
        fileURL: `/uploads/folders/${file.filename}`, filePath: file.path,
        mimeType: file.mimetype, size: file.size,
        folderId: folder._id, folderPath: paths[i] || file.originalname
      })
    ));
    res.json({ folder, count: req.files.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/files', requireAuth, async (req, res) => {
  try {
    res.json(await File.find({ folderId: req.params.id, deleted: false }).sort({ createdAt: -1 }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/file-download/:fileId', requireAuth, async (req, res) => {
  try {
    const f = await File.findById(req.params.fileId);
    if (!f || !fs.existsSync(f.filePath)) return res.status(404).json({ error: 'Not found' });
    res.setHeader('Content-Type', f.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(f.originalName)}"`);
    fs.createReadStream(f.filePath).pipe(res);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/download-zip', requireAuth, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ error: 'Not found' });
    const files = await File.find({ folderId: req.params.id, deleted: false });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(folder.name)}.zip"`);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);
    files.forEach(f => fs.existsSync(f.filePath) && archive.file(f.filePath, { name: f.folderPath || f.originalName }));
    await archive.finalize();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await Folder.findByIdAndUpdate(req.params.id, { deleted: true, deletedAt: new Date() });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
