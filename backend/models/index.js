const mongoose = require('mongoose');
const { Schema } = mongoose;

const FolderSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  color: { type: String, default: '#4ade80' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  deletedAt: Date
});

const NoteSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, default: '' },
  tags: [String],
  color: { type: String, default: '#f0fdf4' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  deletedAt: Date
});

const FileSchema = new Schema({
  title: { type: String, required: true },
  originalName: { type: String, required: true },
  fileURL: String,
  filePath: String,
  mimeType: { type: String, default: 'application/octet-stream' },
  size: { type: Number, default: 0 },
  folderId: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
  folderPath: String,
  createdAt: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  deletedAt: Date
});

const AlbumSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  createdAt: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  deletedAt: Date
});

const ImageSchema = new Schema({
  title: { type: String, required: true },
  originalName: { type: String, required: true },
  fileURL: String,
  filePath: String,
  mimeType: { type: String, default: 'image/jpeg' },
  size: { type: Number, default: 0 },
  albumId: { type: Schema.Types.ObjectId, ref: 'Album', default: null },
  createdAt: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  deletedAt: Date
});

const PasswordSchema = new Schema({
  title: { type: String, required: true },
  username: String,
  email: String,
  password: { type: String, required: true },
  website: String,
  notes: String,
  category: { type: String, default: 'General' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false },
  deletedAt: Date
});

module.exports = {
  Folder: mongoose.model('Folder', FolderSchema),
  Note: mongoose.model('Note', NoteSchema),
  File: mongoose.model('File', FileSchema),
  Album: mongoose.model('Album', AlbumSchema),
  Image: mongoose.model('Image', ImageSchema),
  Password: mongoose.model('Password', PasswordSchema)
};
