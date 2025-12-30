# Architecture Documentation

## Current Structure (Pre-Refactor)

```
wordupgame/
├── accounting-principles/
│   ├── index.html
│   ├── style.css (400 lines, duplicated)
│   ├── script.js (752 lines, duplicated)
│   └── puzzle.json
├── product-moscow/
│   ├── [same structure, duplicated code]
└── [8 more puzzle folders...]
```

**Issue:** Game engine duplicated across 10 folders. Code has diverged (different snap settings in `accounting-equation/`).

---

## Target Structure (Refactoring)

```
wordupgame/
├── shared/
│   ├── core.js          # Game engine
│   ├── styles.css       # Base styles with CSS variables
│   └── sounds/
├── accounting-principles/  # Refactored
│   ├── index.html          # <script src="../shared/core.js">
│   └── config.json         # Enhanced with theme + gameSettings
└── [other puzzles...]      # To be migrated later
```

---

## Configuration System

### Old Format (`puzzle.json`)
```json
{
  "title": "...",
  "description": "...",
  "words": [...]
}
```

### New Format (`config.json`)
```json
{
  "title": "...",
  "description": "...",

  "theme": {
    "colors": {
      "primary": "#10b981",
      "gradientStart": "#065f46",
      "gradientEnd": "#10b981"
    }
  },

  "gameSettings": {
    "snapDistance": 200,
    "snapTolerance": 30,
    "completionDelay": 100
  },

  "words": [...]
}
```

**All fields optional except `words`.** Missing values use defaults from `DEFAULT_CONFIG` in `core.js`.

### Merge Strategy (Safari 11.1 compatible)
```javascript
var DEFAULT_CONFIG = {
  gameSettings: { snapDistance: 150, snapTolerance: 5, ... },
  theme: { colors: { primary: '#3b82f6', ... } }
};

// Merge configs (no spread operator for Safari 11.1)
var config = Object.assign({}, DEFAULT_CONFIG, loadedConfig);
var settings = Object.assign({}, DEFAULT_CONFIG.gameSettings, loadedConfig.gameSettings || {});
```

---

## Safari 11.1 Compatibility

### Safe:
- `const`, `let`, arrow functions, template literals
- `async/await`, Promises, `fetch()`
- `Object.assign()`
- CSS Custom Properties (`--primary-color`)
- Flexbox

### Avoid:
- ES6 modules (`import/export`) → use `<script src="...">`
- Optional chaining (`obj?.prop`) → use `obj && obj.prop`
- Nullish coalescing (`??`) → use `||`
- Object spread (`{...obj}`) → use `Object.assign()`

---

## Game Mechanics

### Core Loop
1. Load `config.json` → merge with defaults
2. Create letter fragments as draggable pieces
3. Randomly position pieces (50 attempts to avoid overlap)
4. Listen for drag/touch events
5. Snap pieces to same-word fragments when close
6. Validate word completion (fragments touching + correct order)
7. Lock completed words, check victory

### Key Parameters

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `snapDistance` | 150px | Max distance to snap pieces together |
| `snapTolerance` | 5px | Max gap between pieces for validation |
| `completionDelay` | 350ms | Delay before checking word completion |
| `cellSize.desktop` | 50px | Letter cell size on desktop |
| `cellSize.tablet` | 40px | Letter cell size on tablet |
| `cellSize.mobile` | 35px | Letter cell size on mobile |

**Note:** `accounting-equation/` currently uses 200px snap, 30px tolerance, 100ms delay (hardcoded). New system allows this via config overrides.

---

## Theme System

### CSS Variables (in `shared/styles.css`)
```css
:root {
  --primary-color: #3b82f6;
  --gradient-start: #1e3a8a;
  --gradient-end: #3b82f6;
  --piece-bg: white;
}

body {
  background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
}

.piece {
  border: 3px solid var(--primary-color);
}
```

### Per-Puzzle Override (in `index.html`)
```html
<style>
:root {
  --primary-color: #10b981;
  --gradient-start: #065f46;
  --gradient-end: #10b981;
}
</style>
<script src="../shared/core.js"></script>
```

Or dynamically injected from `config.json` theme section.

---

## Testing Strategy

1. **Pilot:** Refactor `accounting-principles/` only
2. **Validate:** Test Safari 11.1 (macOS & iOS), Chrome, Firefox
3. **Compare:** Ensure behavior matches original version
4. **Iterate:** Fix bugs, adjust defaults
5. **Migrate:** Apply to remaining 9 puzzles

### Test Matrix
- [ ] Safari 11.1 macOS
- [ ] Safari 11.1 iOS
- [ ] Mobile touch drag
- [ ] Desktop mouse drag
- [ ] Config overrides work
- [ ] Missing config fields use defaults
- [ ] Victory modal displays
- [ ] Analytics events fire

---

## Migration Checklist (Per Puzzle)

1. Rename `puzzle.json` → `config.json`
2. Add `theme` section (if custom colors)
3. Add `gameSettings` section (if custom behavior)
4. Update `index.html` to link `../shared/core.js` and `../shared/styles.css`
5. Delete old `script.js` and `style.css`
6. Test locally
7. Deploy
