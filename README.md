# 🧩 WordUp - Multi-Puzzle Setup

## 📁 Folder Structure

```
bonza-multi/
├── index.html                    # Main landing page (puzzle selector)
├── christmas-cookies/            # Puzzle 1
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── puzzle.json
├── christmas-cities/             # Puzzle 2
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── puzzle.json
├── product-moscow/               # Puzzle 3
│   ├── index.html
│   ├── style.css (professional blue theme)
│   ├── script.js
│   └── puzzle.json
└── tech-millionaires/            # Puzzle 4
    ├── index.html
    ├── style.css
    ├── script.js
    └── puzzle.json
```

## 🌐 Live URLs

Once deployed to GitHub Pages, your URLs will be:

- **Main Landing**: `https://username.github.io/bonza-multi/`
- **Christmas Cookies**: `https://username.github.io/bonza-multi/christmas-cookies/`
- **Christmas Cities**: `https://username.github.io/bonza-multi/christmas-cities/`
- **Product MoSCoW**: `https://username.github.io/bonza-multi/product-moscow/`
- **Tech Millionaires**: `https://username.github.io/bonza-multi/tech-millionaires/`

## 🚀 Deployment Instructions

### GitHub Pages Setup

1. **Create Repository**:
   - Go to GitHub
   - Create new repository named `bonza-multi` (or any name)
   - Make it public

2. **Upload Files**:
   - Upload the entire `bonza-multi` folder contents to your repository
   - Make sure to keep the folder structure intact

3. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Source: `main` branch, `/ (root)` folder
   - Save

4. **Access Your Puzzles**:
   - Main page: `https://username.github.io/bonza-multi/`
   - Individual puzzles: Add folder name to URL

## 🎯 Sharing Links

### With Family & Friends (Christmas Puzzles):
- **Cookies**: Share `yoursite.com/christmas-cookies/`
- **Cities**: Share `yoursite.com/christmas-cities/`

### With Colleagues (Professional Puzzles):
- **MoSCoW Framework**: Share `yoursite.com/product-moscow/`
- **Tech Millionaires**: Share `yoursite.com/tech-millionaires/`

## ➕ Adding New Puzzles

### Quick Setup:

1. **Create new folder**:
   ```
   mkdir my-new-puzzle
   ```

2. **Copy template files**:
   ```
   cp christmas-cookies/* my-new-puzzle/
   ```

3. **Update puzzle.json** with your new content

4. **Update index.html** (main landing page) to add your new puzzle card

5. **Deploy** and your new puzzle will be live at:
   ```
   https://username.github.io/bonza-multi/my-new-puzzle/
   ```

## 🎨 Customizing Themes

Each puzzle folder has its own `style.css`:

- **Christmas puzzles**: Green theme (RGB 5, 99, 1)
- **Professional puzzles**: Blue theme (#1e3a8a to #3b82f6)

To create a new theme:
1. Copy `style.css` from any folder
2. Change the colors in the CSS file
3. Save to your new puzzle folder

## 📊 Benefits of This Structure

✅ **Independent URLs**: Share specific puzzles without confusion
✅ **Different Themes**: Each puzzle can have unique styling
✅ **Easy Management**: Add/remove puzzles without affecting others
✅ **Clean URLs**: Professional-looking links for sharing
✅ **Scalable**: Add unlimited puzzles as separate folders

## 🎓 Puzzle Collection

### Holiday Theme (Christmas Colors)
1. **Christmas Cookies** - 5 tempting holiday treats
2. **Christmas Cities** - 5 US towns with unique Christmas themes

### Professional Theme (Blue Colors)
3. **MoSCoW Framework** - Product Management prioritization
4. **Tech Millionaires** - 7 technology billionaires

## 💡 Pro Tips

1. **Custom Domain**: Point `puzzles.yourcompany.com` to GitHub Pages
2. **Analytics**: Add Google Analytics to each puzzle's `index.html`
3. **SEO**: Update meta tags in each puzzle's HTML
4. **Branding**: Customize the landing page with your logo

## 🆘 Troubleshooting

**Puzzle doesn't load?**
- Check that `puzzle.json` exists in the folder
- Verify JSON format is valid

**Styling looks wrong?**
- Ensure `style.css` exists in puzzle folder
- Check browser console for errors

**404 Error?**
- Verify folder names match exactly
- GitHub Pages needs a few minutes to update

## 📈 Next Steps

- ✅ Deploy to GitHub Pages
- ✅ Test all puzzle URLs
- ✅ Share with friends and colleagues
- ✅ Add Google Analytics (optional)
- ✅ Setup custom domain (optional)

---

**Ready to Deploy!** Upload this entire folder to GitHub and enable Pages.

*Built for the 2025 season*
