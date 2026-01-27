# OnChat Integration Guide

Add decentralized, on-chain chat to your Base dApp in 2 minutes.

## 🚀 Quick Start

### 1. Add the Widget Script

Add this to your HTML:

```html
<!-- OnChat Widget -->
<div id="onchat-widget"></div>
<script src="https://onchat.sebayaki.com/widget.js"></script>
<script>
  OnChat.mount('#onchat-widget', {
    channel: 'your-channel-name'
  });
</script>
```

That's it! Your dApp now has on-chain chat with Farcaster profiles.

---

## 📖 Configuration Options

### Basic Options

```javascript
OnChat.mount('#onchat-widget', {
  // Required: Your channel name
  channel: 'your-channel',
  
  // Optional: Widget height (default: '600px')
  height: '500px',
  
  // Optional: Hide mobile tabs (default: false)
  hideMobileTabs: true,
  
  // Optional: Hide OnChat branding (default: false)
  hideBrand: true,
  
  // Optional: Theme (see Themes section)
  theme: 'classic-blue'
});
```

### All Available Options

```typescript
interface OnChatWidgetOptions {
  // Channel to display messages from
  channel: string;
  
  // Widget dimensions
  height?: string; // CSS height value (e.g., '600px', '100%')
  
  // UI customization
  theme?: string; // Theme ID (see themes below)
  hideMobileTabs?: boolean; // Hide mobile navigation tabs
  hideBrand?: boolean; // Hide "Powered by OnChat" footer
  
  // Color overrides (hex colors without #)
  colors?: {
    primary?: string;
    primaryMuted?: string;
    textDim?: string;
    colorSystem?: string;
    colorError?: string;
    colorInfo?: string;
    colorAction?: string;
    colorNick?: string;
    colorChannel?: string;
    colorTimestamp?: string;
    colorContent?: string;
    bgPrimary?: string;
    bgSecondary?: string;
    bgTertiary?: string;
    bgHover?: string;
  };
}
```

---

## 🎨 Themes

OnChat comes with several built-in themes:

### Available Themes

```javascript
// Classic IRC-style themes
'classic-blue'     // Blue on black (default)
'classic-green'    // Green on black
'classic-amber'    // Amber on black
'classic-purple'   // Purple on black

// Modern themes
'dracula'          // Dark purple theme
'nord'             // Nordic inspired
'solarized-dark'   // Solarized color scheme
'tokyo-night'      // Dark blue-purple
'catppuccin-mocha' // Warm dark theme

// Light themes
'light-modern'     // Clean light theme
'github-light'     // GitHub inspired
```

### Example: Custom Theme

```javascript
OnChat.mount('#onchat-widget', {
  channel: 'my-dapp',
  theme: 'dracula',
  colors: {
    primary: 'FF79C6',        // Pink accents
    bgPrimary: '282A36',      // Dark background
    colorContent: 'F8F8F2'    // Light text
  }
});
```

---

## 💡 Use Cases

### DeFi Protocol
Add community chat for traders to discuss strategies:

```html
<div id="onchat-widget"></div>
<script src="https://onchat.sebayaki.com/widget.js"></script>
<script>
  OnChat.mount('#onchat-widget', {
    channel: 'my-defi-protocol',
    height: '500px',
    theme: 'tokyo-night'
  });
</script>
```

### NFT Marketplace
Let collectors discuss drops and trades:

```html
<div id="onchat-widget"></div>
<script src="https://onchat.sebayaki.com/widget.js"></script>
<script>
  OnChat.mount('#onchat-widget', {
    channel: 'nft-marketplace',
    theme: 'catppuccin-mocha',
    hideBrand: true
  });
</script>
```

### Gaming dApp
In-game chat without managing servers:

```html
<div id="onchat-widget"></div>
<script src="https://onchat.sebayaki.com/widget.js"></script>
<script>
  OnChat.mount('#onchat-widget', {
    channel: 'game-lobby',
    height: '400px',
    theme: 'dracula',
    hideMobileTabs: true
  });
</script>
```

---

## 🔧 Framework Integration

### React / Next.js

Create a component:

```tsx
// components/OnChatWidget.tsx
'use client'; // For Next.js App Router

import { useEffect, useRef } from 'react';

interface OnChatWidgetProps {
  channel: string;
  height?: string;
  theme?: string;
  hideBrand?: boolean;
}

export default function OnChatWidget({
  channel,
  height = '600px',
  theme = 'classic-blue',
  hideBrand = false
}: OnChatWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load script
    const script = document.createElement('script');
    script.src = 'https://onchat.sebayaki.com/widget.js';
    script.async = true;
    
    script.onload = () => {
      if (containerRef.current && (window as any).OnChat) {
        (window as any).OnChat.mount(containerRef.current, {
          channel,
          height,
          theme,
          hideBrand
        });
      }
    };
    
    document.body.appendChild(script);
    
    return () => {
      // Cleanup
      if ((window as any).OnChat) {
        (window as any).OnChat.unmount(containerRef.current);
      }
    };
  }, [channel, height, theme, hideBrand]);

  return <div ref={containerRef} style={{ height }} />;
}
```

Usage:
```tsx
import OnChatWidget from '@/components/OnChatWidget';

export default function Page() {
  return (
    <div>
      <h1>My dApp</h1>
      <OnChatWidget 
        channel="my-channel"
        theme="dracula"
        height="500px"
      />
    </div>
  );
}
```

### Vue 3

```vue
<!-- components/OnChatWidget.vue -->
<template>
  <div ref="container" :style="{ height }"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface Props {
  channel: string;
  height?: string;
  theme?: string;
  hideBrand?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  height: '600px',
  theme: 'classic-blue',
  hideBrand: false
});

const container = ref<HTMLDivElement | null>(null);

onMounted(() => {
  const script = document.createElement('script');
  script.src = 'https://onchat.sebayaki.com/widget.js';
  script.async = true;
  
  script.onload = () => {
    if (container.value && (window as any).OnChat) {
      (window as any).OnChat.mount(container.value, {
        channel: props.channel,
        height: props.height,
        theme: props.theme,
        hideBrand: props.hideBrand
      });
    }
  };
  
  document.body.appendChild(script);
});

onUnmounted(() => {
  if ((window as any).OnChat && container.value) {
    (window as any).OnChat.unmount(container.value);
  }
});
</script>
```

### Svelte

```svelte
<!-- OnChatWidget.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  export let channel: string;
  export let height: string = '600px';
  export let theme: string = 'classic-blue';
  export let hideBrand: boolean = false;
  
  let container: HTMLDivElement;
  
  onMount(() => {
    const script = document.createElement('script');
    script.src = 'https://onchat.sebayaki.com/widget.js';
    script.async = true;
    
    script.onload = () => {
      if ((window as any).OnChat) {
        (window as any).OnChat.mount(container, {
          channel,
          height,
          theme,
          hideBrand
        });
      }
    };
    
    document.body.appendChild(script);
  });
  
  onDestroy(() => {
    if ((window as any).OnChat) {
      (window as any).OnChat.unmount(container);
    }
  });
</script>

<div bind:this={container} style="height: {height}"></div>
```

---

## 🌐 CDN & Versioning

### Latest Version (Recommended)
```html
<script src="https://onchat.sebayaki.com/widget.js"></script>
```

### Pinned Version (for production)
```html
<!-- Replace X.X.X with specific version -->
<script src="https://onchat.sebayaki.com/widget@X.X.X.js"></script>
```

---

## 🔐 Security & Privacy

### On-Chain by Default
- All messages are stored on Base blockchain
- Messages are permanent and publicly readable
- Users sign transactions with their wallet

### Farcaster Integration
- Users authenticate with their Farcaster account
- Profile pictures and usernames from Farcaster
- No separate login required

### Style Isolation
- Widget uses Shadow DOM
- Your dApp's CSS won't affect the widget
- Widget's CSS won't affect your dApp

---

## 🐛 Troubleshooting

### Widget doesn't appear
1. Check browser console for errors
2. Ensure the container element exists when script loads
3. Try using `DOMContentLoaded` event:
   ```javascript
   document.addEventListener('DOMContentLoaded', () => {
     OnChat.mount('#onchat-widget', { channel: 'test' });
   });
   ```

### Styling conflicts
- The widget uses Shadow DOM, so conflicts are rare
- If you see issues, ensure you're not forcing styles on all elements
- Custom colors can be set via the `colors` option

### Performance concerns
- Widget is lazy-loaded and doesn't impact initial page load
- Messages are paginated (won't load entire history at once)
- Shadow DOM prevents CSS recalculation impact

---

## 📚 Advanced Usage

### Multiple Widgets
You can embed multiple channels on the same page:

```html
<div id="chat-general"></div>
<div id="chat-support"></div>

<script src="https://onchat.sebayaki.com/widget.js"></script>
<script>
  OnChat.mount('#chat-general', { channel: 'general' });
  OnChat.mount('#chat-support', { channel: 'support' });
</script>
```

### Programmatic Control
```javascript
// Mount widget
const widget = OnChat.mount('#onchat-widget', {
  channel: 'my-channel'
});

// Later: unmount widget
widget.unmount();
```

### Get Available Themes
```javascript
// Returns array of theme objects
const themes = OnChat.themes;
console.log(themes.map(t => t.id));
```

---

## 💬 Support & Community

- **GitHub**: [github.com/sebayaki/onchat](https://github.com/sebayaki/onchat)
- **Farcaster**: [@clawd](https://warpcast.com/clawd) or /onchat channel
- **Website**: [onchat.sebayaki.com](https://onchat.sebayaki.com)

---

## 📄 License

OnChat is fully open source under the MIT License.

Built with ❤️ for the Base ecosystem.
