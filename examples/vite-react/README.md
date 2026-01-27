# OnChat + Vite + React Example

Minimal example of integrating OnChat into a Vite + React application.

## Features

- ⚡ Vite for fast dev server
- ⚛️ React 18 with TypeScript
- 🎨 OnChat widget with custom styling
- 📦 Small bundle size
- 🔥 Hot Module Replacement (HMR)

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Project Structure

```
vite-react/
├── src/
│   ├── App.tsx
│   ├── components/
│   │   └── OnChatWidget.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── index.html
├── package.json
└── vite.config.ts
```

## Integration

### 1. Install (optional - we use CDN)

OnChat can be used via CDN (no install needed) or npm:

```bash
# Optional: if OnChat has an npm package
npm install @onchat/widget
```

### 2. Create Widget Component

```tsx
// src/components/OnChatWidget.tsx
import { useEffect, useRef } from 'react';

export default function OnChatWidget() {
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load OnChat script
    const script = document.createElement('script');
    script.src = 'https://onchat.sebayaki.com/widget.js';
    script.async = true;
    script.onload = () => {
      if (window.OnChat && widgetRef.current) {
        window.OnChat.mount('#onchat-widget', {
          channel: 'vite-demo',
          theme: 'tokyo-night',
          height: '600px'
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div id="onchat-widget" ref={widgetRef} />;
}
```

### 3. Use in App

```tsx
// src/App.tsx
import OnChatWidget from './components/OnChatWidget';

function App() {
  return (
    <div>
      <h1>My Vite dApp</h1>
      <OnChatWidget />
    </div>
  );
}
```

## Configuration

Customize the widget in `src/components/OnChatWidget.tsx`:

```tsx
window.OnChat.mount('#onchat-widget', {
  channel: 'your-channel',
  height: '600px',
  theme: 'dracula',
  hideBrand: false,
  colors: {
    primary: '7C3AED',
    bgPrimary: '1A1A1A'
  }
});
```

## TypeScript Types

Add to `src/vite-env.d.ts`:

```tsx
interface OnChatOptions {
  channel: string;
  height?: string;
  theme?: string;
  hideBrand?: boolean;
  colors?: Record<string, string>;
}

interface Window {
  OnChat?: {
    mount: (selector: string, options: OnChatOptions) => void;
  };
}
```

## Production Build

```bash
npm run build
```

The build outputs to `dist/` and can be deployed to any static host:

- Vercel
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront
- IPFS

## Environment Variables

Create `.env`:

```env
VITE_ONCHAT_CHANNEL=your-channel
```

Use in code:

```tsx
window.OnChat.mount('#onchat-widget', {
  channel: import.meta.env.VITE_ONCHAT_CHANNEL
});
```

## Bundle Size

OnChat widget loads lazily and doesn't add to your main bundle:

```
dist/index.html                   0.46 kB
dist/assets/index-abc123.css      1.23 kB
dist/assets/index-def456.js      143.21 kB
```

Widget loads separately (~50kb gzipped).

## Resources

- [Vite Documentation](https://vitejs.dev)
- [OnChat Integration Guide](../../INTEGRATION.md)
- [React Documentation](https://react.dev)

## License

MIT
