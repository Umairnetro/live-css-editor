# 🛠️ Live CSS Dev Tools

A powerful Chrome extension for web developers that provides in-page CSS editing, element inspection, and complete CSS extraction capabilities.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)

## ✨ Features

- **🎨 Live CSS Editor** - Write CSS that applies instantly to any webpage with syntax highlighting
- **🔍 Smart Inspector** - Hover over elements and navigate the DOM tree with visual highlighting
- **📋 Complete CSS Extractor** - Extract all styles from any element including:
  - Base styles
  - Pseudo-elements (::before, ::after, ::marker)
  - Interactive states (:hover, :focus, :active)
  - Media queries
  - Animations and keyframes
- **🎨 CSS Variables Extractor** - Extract all CSS custom properties from the page
- **🖼️ Iframe Support** - Inject the tool into same-origin iframes
- **💾 Auto-Save** - Your CSS changes persist per domain using localStorage
- **⌨️ Keyboard Shortcuts** - Fast workflow with comprehensive keyboard controls
- **🎯 DOM Navigation** - Use arrow keys to navigate through parent, child, and sibling elements

## 🚀 Installation

### Download & Install

1. **Download the latest release**
   - Go to [Releases](../../releases)
   - Download `live-css-devtools-v1.0.0.zip`

2. **Extract the ZIP file**
   - Extract to a permanent location on your computer
   - ⚠️ Don't delete this folder after installation!

3. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **"Developer mode"** (toggle in top right)
   - Click **"Load unpacked"**
   - Select the extracted folder

4. **Start using!**
   - Click the extension icon in your toolbar
   - Or press `Ctrl+Shift+E` (Mac: `Cmd+Shift+E`)

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+E` | Toggle Dev Tools Panel |
| `Ctrl+Alt+I` | Activate Inspector Mode |
| `Ctrl+Alt+X` | Activate CSS Extractor Mode |
| `Ctrl+Alt+V` | Extract All CSS Variables |
| `Ctrl+Alt+F` | Inject into Iframe |
| `Ctrl+Alt+E` | Hide/Show Editor Panel |

*On Mac, use `Cmd` instead of `Ctrl`*

## 📖 Usage Guide

### Live CSS Editor

1. Activate the dev tools (click icon or press `Ctrl+Shift+E`)
2. Type CSS in the editor
3. Changes apply instantly to the page
4. CSS is automatically saved per domain

### Inspector Mode

1. Click the 🔍 button or press `Ctrl+Alt+I`
2. Hover over elements to inspect them
3. Use navigation:
   - `↑` Arrow - Navigate to parent element
   - `↓` Arrow - Navigate to first child
   - `←` Arrow - Navigate to previous sibling
   - `→` Arrow - Navigate to next sibling
   - `Enter` - Insert selector into editor
4. Click pseudo-element buttons to add `::before`, `::after`, or `::marker` selectors

### CSS Extractor Mode

1. Click the 📋 button or press `Ctrl+Alt+X`
2. Hover over elements to preview
3. Use arrow keys to navigate
4. Press `Enter` or click "Extract" to extract complete CSS including:
   - All matching CSS rules from stylesheets
   - Pseudo-element styles
   - Interactive state styles
   - Media query rules
   - Associated animations

### CSS Variables

1. Click the 🎨 button or press `Ctrl+Alt+V`
2. All CSS custom properties from `:root` and `html` will be extracted
3. Variables are inserted at the top of your editor

## 🎯 Use Cases

- **Rapid Prototyping** - Test CSS changes without touching source code
- **Design Tweaking** - Fine-tune styles on live websites
- **Learning** - Understand how elements are styled
- **Debugging** - Isolate and fix CSS issues quickly
- **Style Extraction** - Copy styles from any website for learning
- **Theme Development** - Quickly iterate on color schemes and layouts

## ⚠️ Limitations

- Cannot inject into browser internal pages (`chrome://`, `edge://`, `about:`)
- Iframe injection only works for same-origin iframes
- CSS stored in localStorage (5-10MB limit per domain)

## 🔒 Privacy & Security

This extension:
- ✅ Only activates when you click the button or use keyboard shortcuts
- ✅ Stores all data locally in your browser (localStorage)
- ✅ Does NOT collect, transmit, or store any of your data externally
- ✅ Does NOT track your browsing activity
- ✅ Works completely offline
- ✅ Open for inspection (obfuscated for IP protection)

## 📄 License

Copyright (c) 2025 Umair Ahmed. All Rights Reserved.

This software is proprietary and confidential. See [LICENSE.txt](LICENSE.txt) for details.

**Permitted Use:**
- ✅ Personal use
- ✅ Educational purposes
- ✅ Non-commercial use

**Prohibited:**
- ❌ Commercial use without written permission
- ❌ Redistribution or modification
- ❌ Removal of copyright notices

For commercial licensing inquiries, contact: [your-email@example.com]

## 🐛 Known Issues

None currently reported.

## 📧 Support

For bug reports, feature requests, or questions:
- Open an issue in the [Issues](../../issues) section
- Email: umair.ahmed7829@gmail.com

## 🔄 Updates

### Version 1.0.0 (November 2025)
- Initial release
- Live CSS editor with syntax highlighting
- Element inspector with DOM navigation
- Complete CSS extractor
- CSS variables extractor
- Iframe injection support
- Keyboard shortcuts
- Auto-save functionality

## 👏 Credits

Developed by Umair Ahmed

---

⭐ If you find this tool useful, consider starring this repository!

**Note:** This extension is distributed outside the Chrome Web Store to maintain free access for developers.
