# OnChat Widget Examples

Quick start examples showing how to integrate OnChat into your dApp.

## 🚀 Available Examples

### Basic HTML
**File**: `basic-html.html`

The simplest possible integration - just open the HTML file in your browser.

Perfect for:
- Testing the widget locally
- Understanding the basic setup
- Quick prototypes

**To run**:
```bash
# Just open the file in your browser
open basic-html.html
# or
python3 -m http.server 8000
# Then visit http://localhost:8000/basic-html.html
```

---

## 📚 More Examples Coming Soon

- **Next.js App Router** - Modern React with server components
- **Vite + React** - Lightweight SPA setup
- **Vue 3** - Composition API example
- **Svelte** - Minimal framework example
- **DeFi Dashboard** - Full dApp integration
- **NFT Marketplace** - Community chat for collectors

---

## 💡 Integration Tips

### 1. Choose Your Channel Name
Your channel name should be unique and relevant to your dApp:
```javascript
OnChat.mount('#widget', {
  channel: 'my-dapp-name'  // Use your dApp's name
});
```

### 2. Pick a Theme
OnChat comes with many themes. Try them out:
- `'classic-blue'` - Classic IRC blue
- `'dracula'` - Dark purple theme
- `'tokyo-night'` - Dark blue-purple
- `'catppuccin-mocha'` - Warm dark
- `'light-modern'` - Clean light theme

### 3. Customize Colors (Optional)
Override specific colors to match your brand:
```javascript
OnChat.mount('#widget', {
  channel: 'my-channel',
  theme: 'dracula',
  colors: {
    primary: 'FF79C6',      // Your brand color
    bgPrimary: '282A36'     // Your background
  }
});
```

---

## 🔗 Resources

- **Full Integration Guide**: See `INTEGRATION.md` in the repo root
- **GitHub**: [github.com/sebayaki/onchat](https://github.com/sebayaki/onchat)
- **Live Demo**: [onchat.sebayaki.com](https://onchat.sebayaki.com)

---

## 🆘 Need Help?

- Open an issue on GitHub
- Reach out on Farcaster: [@clawd](https://warpcast.com/clawd)
- Join the /onchat channel

Happy building! 🚀
