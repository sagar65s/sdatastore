const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { Folder, Note, File, Album, Image, Password } = require('../models');

router.get('/stats', requireAuth, async (req, res) => {
  try {
    const [folders, notes, files, albums, images, passwords,
      trashF, trashN, trashFi, trashI, fileSz, imgSz] = await Promise.all([
      Folder.countDocuments({ deleted: false }),
      Note.countDocuments({ deleted: false }),
      File.countDocuments({ deleted: false, folderId: null }),
      Album.countDocuments({ deleted: false }),
      Image.countDocuments({ deleted: false }),
      Password.countDocuments({ deleted: false }),
      Folder.countDocuments({ deleted: true }),
      Note.countDocuments({ deleted: true }),
      File.countDocuments({ deleted: true }),
      Image.countDocuments({ deleted: true }),
      File.aggregate([{ $match: { deleted: false } }, { $group: { _id: null, t: { $sum: '$size' } } }]),
      Image.aggregate([{ $match: { deleted: false } }, { $group: { _id: null, t: { $sum: '$size' } } }])
    ]);

    const recentFiles = await File.find({ deleted: false }).sort({ createdAt: -1 }).limit(4);
    const recentNotes = await Note.find({ deleted: false }).sort({ createdAt: -1 }).limit(3);
    const recentImages = await Image.find({ deleted: false }).sort({ createdAt: -1 }).limit(3);

    const recent = [
      ...recentFiles.map(f => ({ type: 'file', name: f.title, date: f.createdAt, size: f.size })),
      ...recentNotes.map(n => ({ type: 'note', name: n.title, date: n.createdAt })),
      ...recentImages.map(i => ({ type: 'image', name: i.title, date: i.createdAt, size: i.size }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    res.json({
      stats: { folders, notes, files, albums, images, passwords, trash: trashF + trashN + trashFi + trashI },
      recent,
      storage: { files: fileSz[0]?.t || 0, images: imgSz[0]?.t || 0 }
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
