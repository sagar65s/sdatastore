# 🔐 MyVault v3 — Dark Luxury Edition

**Single MongoDB · Playfair Display + DM Sans · Obsidian Dark + Emerald + Gold**

## Design Philosophy
- **Background**: Deep obsidian (#080d0b) — NOT green
- **Accent**: Emerald (#34d399) used sparingly for CTAs and highlights
- **Highlights**: Gold (#f0c060) for premium moments — folders, storage, logo
- **Text**: Warm cream (#f0ebe0) — readable, luxurious
- **Each section has its own color identity** (purple for images, amber for notes, red for trash)

## Quick Start

```bash
# Backend (port 5000)
cd backend
npm install
# Edit .env
npm start

# Frontend (port 3000)  
cd frontend
npm install
npm start
```

## .env
```
MAIN_PIN=1234
VAULT_PIN=5678
MONGODB_URI=mongodb://localhost:27017/myvault
PORT=5000
```

## UI Animations
| Page | Animations |
|---|---|
| PIN Entry | Scanning bg lines, vault door shimmer, spring logo, dot pulse glow |
| Layout | Ripple nav clicks, icon wiggle on active, blur page transitions |
| Dashboard | Spring stagger stat cards, animated number counters, progress bar wipe |
| Files | Slide-in rows, left-border accent on hover, download progress bar |
| Folders | Gold-themed cards, spring pop-in, folder icon bounce on hover |
| Images | Zoom-on-hover, full lightbox with prev/next, cross-fade |
| Notes | 6-color palette, top accent bar reveal, tilt on hover |
| Passwords | Vault gate with shimmer shield, copy flash, per-category color bars |
| Trash | Per-type color system, exit blur animation, confirm shake |
