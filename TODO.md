# TODO

## ✅ Done
- [x] Refactored accounting-principles/ to use shared code
- [x] Created shared/core.js (Safari 11.1+ compatible)
- [x] Created shared/styles.css with CSS variables
- [x] Implemented dual config system (puzzle.json + optional config.json)

## 🧪 Testing
- [ ] Test accounting-principles/ locally (http://localhost:8765/accounting-principles/)
- [ ] Verify theme colors load correctly (green)
- [ ] Test drag/drop and snapping
- [ ] Check Safari 11.1 compatibility (if available)

## 📋 Next
- [ ] Migrate 1-2 more puzzles (product-moscow, accounting-equation)
- [ ] Validate config override system with different settings
- [ ] Document migration process for remaining puzzles
- [ ] Clean up old .backup files after testing

## 💡 Future
- [ ] Move success.mp3 to shared/sounds/ (if all puzzles use same audio)
- [ ] Add puzzle difficulty indicators
- [ ] localStorage auto-save feature
- [ ] A/B test different snap distances (150px vs 200px)
