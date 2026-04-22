// DNS Fix for Node.js v22+ on Windows (MongoDB Atlas querySrv ECONNREFUSED)
try { require('node:dns/promises').setServers(['1.1.1.1', '8.8.8.8', '1.0.0.1']); } catch(e) {}

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const fs = require('fs');

const app = express();

// Ensure upload directories exist
['files','folders','images'].forEach(dir => {
  const p = path.join(__dirname, 'uploads', dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// Single DB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected:', process.env.MONGODB_URI))
  .catch(err => console.error('❌ MongoDB error:', err.message));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/files', require('./routes/files'));
app.use('/api/folders', require('./routes/folders'));
app.use('/api/images', require('./routes/images'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/passwords', require('./routes/passwords'));
app.use('/api/trash', require('./routes/trash'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 MyVault running on http://localhost:${PORT}`));
