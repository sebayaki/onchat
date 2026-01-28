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

### AI Agent
**Directory**: `ai-agent/`

A TypeScript CLI for AI agents to read, write, and engage with on-chain conversations. Uses viem for direct smart contract interaction — no browser or frontend needed.

Perfect for:
- AI agents that monitor and engage in on-chain chats
- Bot integrations (Discord, Telegram, Farcaster → OnChat bridge)
- Automated community engagement
- CLI-based on-chain messaging

**To run**:
```bash
cd ai-agent
npm install
npx tsx onchat.ts channels          # Browse channels
npx tsx onchat.ts read onchat       # Read messages
ONCHAT_PRIVATE_KEY=0x... npx tsx onchat.ts send onchat "gm!"  # Send a message
```

---

## 📚 More Examples Coming Soon

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
