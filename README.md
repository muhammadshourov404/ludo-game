# 🎲 LUDO NEXUS — Ultimate Edition
**Developer & Copyright Owner:** Muhammad Shourov (V4MPIR3)  
**GitHub:** https://github.com/muhammadshourov404/ludo-game  
**License:** © 2025 Muhammad Shourov. All rights reserved.

---

## 🚀 Features

| Feature | Status |
|---|---|
| Classic Mode | ✅ |
| Rush Mode (15s timer) | ✅ |
| Magical Mode (cards) | ✅ |
| Team Battle Mode | ✅ |
| AI Bots (Easy/Medium/Hard/Expert) | ✅ |
| Online Multiplayer (Firebase) | ✅ |
| LAN/WiFi Play | ✅ |
| 5 Premium Themes | ✅ |
| PWA (Install as App) | ✅ |
| Offline Support | ✅ |
| Web Audio (no files) | ✅ |
| Canvas Board Renderer | ✅ |
| Magic Cards System | ✅ |
| Responsive Mobile UI | ✅ |

---

## 📁 Project Structure

```
Ludo-game/
├── index.html          ← Main entry point
├── manifest.json       ← PWA config
├── sw.js               ← Service Worker (offline)
├── css/
│   ├── style.css       ← Main styles
│   ├── themes.css      ← 5 themes
│   └── animations.css  ← All animations
├── js/
│   ├── sound.js        ← Web Audio API sounds
│   ├── board.js        ← Canvas board renderer
│   ├── cards.js        ← Magic card system
│   ├── ai.js           ← AI bot engine
│   ├── network.js      ← Firebase + LAN
│   └── game.js         ← Core game logic + UI
├── assets/
│   ├── icons/          ← PWA icons (icon.svg provided)
│   ├── sounds/         ← (optional, for future audio)
│   └── images/         ← (optional, for future graphics)
└── generate-icons.js   ← Icon generation helper
```

---

## 🔧 Setup on GitHub Pages

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit — Ludo Nexus v1.0"
git remote add origin https://github.com/muhammadshourov404/ludo-game.git
git push -u origin main
```

### Step 2: Enable GitHub Pages
- Go to repo → Settings → Pages
- Source: **main** branch, **/ (root)**
- Save → Your game is live at:  
  `https://muhammadshourov404.github.io/ludo-game/`

---

## 📱 Install as App (PWA)
1. Open the game URL in Chrome/Safari
2. Settings → "Add to Home Screen" / "Install App"
3. Works fully offline after install!

---

## 🎮 How to Play

### Classic Mode
- Roll a **6** to bring a token out of home
- Race all 4 tokens to the center
- Land on opponents to cut them back to home
- ⭐ Stars = safe squares (no cuts)

### Rush Mode
- **15 seconds** per turn — run out = skip!
- Same rules but faster pace

### Magical Mode  
- 15% chance to draw a magic card each turn
- Cards: 🚀 Boost, 🛡 Shield, 🌀 Swap, ❄ Freeze, ⚡ Double, 🔄 Reverse, 🌟 Teleport, 💣 Bomb

### Online Multiplayer
1. Enter your name → Create Room
2. Share the 6-character code with friends
3. Up to 4 players
4. Host clicks **START** when ready

### LAN/WiFi Play
- All players on same WiFi network
- Same as Online but uses local Firebase room

---

## 🎨 Themes
- 🌌 **Dark** — Deep space vibes (default)
- ⚡ **Neon** — Cyberpunk green glow
- 👑 **Royal** — Purple luxury
- 🌿 **Nature** — Forest green
- 🔥 **Fire** — Burning orange

---

## 🔊 Audio
All sounds generated via Web Audio API — no external files needed!

---

## 📲 PWA Icons
The SVG icon is at `assets/icons/icon.svg`.  
To generate PNG icons, open `icon.svg` in browser and export at:
- 192×192 → `assets/icons/icon-192.png`
- 512×512 → `assets/icons/icon-512.png`

Or use online converter: https://convertio.co/svg-png/

---

## 🛠 Tech Stack
- **HTML5 Canvas** — Board rendering
- **Web Audio API** — Sound system
- **Firebase Realtime DB** — Online/LAN multiplayer
- **Service Worker** — Offline PWA
- **Vanilla JS** — No frameworks, maximum performance
- **CSS Variables** — Theme system

---

## 🤝 Contributing
Pull requests welcome! Please maintain code style.

---

**© 2025 Muhammad Shourov (V4MPIR3). All rights reserved.**
