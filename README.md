# 🧩 WordUp - Educational Puzzle Game

Drag-and-drop word puzzle game (Bonza-style) with 10 educational puzzles covering accounting and product management topics.

## 🏗️ Architecture

```
wordupgame/
├── shared/
│   ├── core.js               # Game engine (Safari 11.1+)
│   ├── styles.css            # Base styles with CSS variables
│   └── sounds/               # Audio assets
├── accounting-principles/
│   ├── index.html            # Links to ../shared/
│   ├── puzzle.json           # Word data
│   └── config.json           # Theme + settings (optional)
└── [other puzzles...]
```

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for technical details.

## 🌐 Live URLs

Once deployed to GitHub Pages:

- **Main Landing**: `https://username.github.io/wordupgame/`
- **Individual Puzzles**: `https://username.github.io/wordupgame/[puzzle-name]/`

## 🚀 Deployment

See [`DEPLOYMENT-GUIDE.md`](./DEPLOYMENT-GUIDE.md) for GitHub Pages setup instructions.

## ✨ Features

- **Interactive Animations**: Smooth drag-and-drop with spring physics and wobble effects
- **Visual Polish**: Gradient backgrounds, depth shadows, and subtle idle animations
- **Celebration Effects**: Particle bursts and confetti when completing words
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Theme Support**: Easy color customization via `config.json`
- **Safari 11.1+ Compatible**: No modern ES6 features that break older browsers

## 🎓 Puzzles

10 educational puzzles covering:
- **Accounting**: GAAP principles, financial statements, accounting equation
- **Product Management**: MoSCoW prioritization, agile methodologies

## 🔧 Local Development

```bash
# Start local server (required for fetch API)
python3 -m http.server 8000

# Visit puzzle
open http://localhost:8000/accounting-principles/
```

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical design and implementation
- **[DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)** - GitHub Pages setup
- **[CLAUDE.md](./CLAUDE.md)** - Quick context for AI assistants

## 🎨 Customization

Each puzzle can override default settings via `config.json`:

```json
{
  "theme": {
    "colors": {
      "primary": "#10b981",
      "gradientStart": "#065f46",
      "gradientEnd": "#10b981"
    }
  },
  "gameSettings": {
    "snapDistance": 150,
    "snapTolerance": 5
  }
}
```

---

**Ready to play!** Visit any puzzle folder in your browser.
