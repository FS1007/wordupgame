# CLAUDE.md

*Quick context for AI assistants working on this project*

## What is this?
Educational drag-and-drop word puzzle game (Bonza-style). Puzzles covering accounting, product management, and cybersecurity topics. Deployed on GitHub Pages.

## Current State (2026-01-14)
**Pre-refactor:** Each puzzle is a standalone folder with duplicated game engine code.
**Goal:** Move to shared core architecture with per-puzzle configuration overrides.
**Status:** Shared `shared/core.js` and `shared/styles.css` architecture in use.

## Key Constraints
- **Safari 11.1+ compatibility required** (mobile & desktop)
- No ES6 modules, optional chaining, or nullish coalescing
- CSS Variables are safe (supported since Safari 9.1)
- Google Analytics tracking active (G-378739910)

## Architecture
See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for:
- Current vs planned file structure
- Configuration override system
- Safari compatibility details
- Game mechanics overview

## Critical Knowledge
1. **Code divergence exists:** `accounting-equation/` uses different snap settings than other puzzles
2. **Per-puzzle experimentation is intentional:** New architecture supports UX parameter overrides
3. **Three themes:** Green (accounting), Blue (product management), Red (cybersecurity)

## Quick Start
```bash
# Local development (no build step required!)
# Any static server works - fetch API requires http://
python3 -m http.server 8000

# Visit puzzle
open http://localhost:8000/accounting-principles/
```

## Optional Testing (Node.js required)
Automated tests are **optional** - not needed for development or deployment.

```bash
# Install Playwright (optional)
npm install
npx playwright install

# Run tests - auto-starts server for you
npm test
```

If you don't have Node.js, just use the local server commands above and test manually in a browser.

## Files
- `ARCHITECTURE.md` - Technical design & implementation details
- `README.md` - Deployment guide & project overview
- `DEPLOYMENT-GUIDE.md` - GitHub Pages setup
