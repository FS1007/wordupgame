# CLAUDE.md

*Quick context for AI assistants working on this project*

## What is this?
Educational drag-and-drop word puzzle game (Bonza-style). 10 puzzles covering accounting & product management topics. Deployed on GitHub Pages.

## Current State (2025-12-30)
**Pre-refactor:** Each puzzle is a standalone folder with duplicated game engine code.
**Goal:** Move to shared core architecture with per-puzzle configuration overrides.
**Status:** Refactoring `accounting-principles/` as pilot implementation.

## Key Constraints
- **Safari 11.1+ compatibility required** (mobile & desktop)
- No ES6 modules, optional chaining, or nullish coalescing
- CSS Variables are safe (supported since Safari 9.1)
- Google Analytics tracking active (G-D6CE3JE34J)

## Architecture
See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for:
- Current vs planned file structure
- Configuration override system
- Safari compatibility details
- Game mechanics overview

## Critical Knowledge
1. **Code divergence exists:** `accounting-equation/` uses different snap settings than other puzzles
2. **Per-puzzle experimentation is intentional:** New architecture supports UX parameter overrides
3. **Two themes:** Green (accounting) and Blue (product management) color schemes

## Quick Start
```bash
# Local testing (fetch requires http://)
python3 -m http.server 8000

# Visit puzzle
open http://localhost:8000/accounting-principles/
```

## Files
- `ARCHITECTURE.md` - Technical design & implementation details
- `README.md` - Deployment guide & project overview
- `DEPLOYMENT-GUIDE.md` - GitHub Pages setup
