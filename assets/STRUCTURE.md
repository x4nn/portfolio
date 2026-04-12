# Portfolio Asset Structure

Overzichtelijke organisatie van CSS en JavaScript per pagina.

## 📁 Folder Opbouw

```
assets/
├── css/
│   ├── style.css                 # Global styles (foundation, typography, etc)
│   └── pages/
│       ├── index.css             # Index page specific styles
│       └── projects.css          # Projects page specific styles
│
├── js/
│   ├── main.js                   # Global JavaScript (navigation, shared logic)
│   └── pages/
│       ├── index.js              # Index page specific scripts
│       └── projects.js           # Projects page specific scripts
│
└── media/
    └── vids/
        └── pypong-gameplay.mp4   # Project demo videos
```

## 🔗 Load Order

### In HTML `<head>`:
1. Global CSS (`style.css`)
2. Page-specific CSS (`pages/[page].css`)

### Before `</body>`:
1. Global JS (`main.js`)
2. Page-specific JS (`pages/[page].js`)

## 💡 Best Practices

- **Global styles** (`style.css`): Colors, typography, layout, components
- **Global JS** (`main.js`): Navigation, shared utilities, profile data
- **Page-specific CSS**: Unique layouts, sections for that page only
- **Page-specific JS**: Page initialization, event handlers specific to that page

## 🆕 Adding New Pages

Bij een nieuwe pagina (bijv. `blog.html`):

1. Maak `assets/css/pages/blog.css`
2. Maak `assets/js/pages/blog.js`
3. Link in HTML:
   ```html
   <link rel="stylesheet" href="assets/css/pages/blog.css">
   <script src="assets/js/pages/blog.js" defer></script>
   ```

---
**Last updated**: April 2026
