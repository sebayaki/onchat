# OnChat + Next.js App Router Example

This example shows how to integrate OnChat into a Next.js 14+ application using the App Router.

## Features

- ✅ Next.js 14 App Router
- ✅ TypeScript
- ✅ OnChat widget with custom theme
- ✅ Server Components + Client Components
- ✅ Optimized loading (Script component)
- ✅ Responsive design

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
nextjs-app-router/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── components/
│       └── OnChatWidget.tsx # Client component wrapper
├── public/
└── package.json
```

## Integration Steps

### 1. Create Client Component

Since OnChat requires browser APIs, wrap it in a Client Component:

```tsx
// app/components/OnChatWidget.tsx
'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

export default function OnChatWidget() {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (scriptLoaded && widgetRef.current && window.OnChat) {
      window.OnChat.mount('#onchat-widget', {
        channel: 'your-channel',
        theme: 'dracula',
        height: '600px'
      });
    }
  }, [scriptLoaded]);

  return (
    <>
      <Script 
        src="https://onchat.sebayaki.com/widget.js"
        onLoad={() => setScriptLoaded(true)}
        strategy="lazyOnload"
      />
      <div id="onchat-widget" ref={widgetRef} />
    </>
  );
}
```

### 2. Use in Server Component

```tsx
// app/page.tsx
import OnChatWidget from './components/OnChatWidget';

export default function Home() {
  return (
    <main>
      <h1>My dApp</h1>
      <OnChatWidget />
    </main>
  );
}
```

## Configuration

Edit `app/components/OnChatWidget.tsx` to customize:

```tsx
window.OnChat.mount('#onchat-widget', {
  channel: 'your-channel-name',
  height: '600px',
  theme: 'dracula',
  hideBrand: true,
  colors: {
    primary: 'FF79C6',
    bgPrimary: '282A36'
  }
});
```

See [INTEGRATION.md](../../INTEGRATION.md) for all options.

## TypeScript Support

Add type definitions:

```tsx
declare global {
  interface Window {
    OnChat: {
      mount: (selector: string, options: OnChatOptions) => void;
    };
  }
}

interface OnChatOptions {
  channel: string;
  height?: string;
  theme?: string;
  hideBrand?: boolean;
  hideMobileTabs?: boolean;
  colors?: {
    primary?: string;
    bgPrimary?: string;
    // ... other color options
  };
}
```

## Production Considerations

### 1. Environment Variables

```env
# .env.local
NEXT_PUBLIC_ONCHAT_CHANNEL=your-channel
```

```tsx
window.OnChat.mount('#onchat-widget', {
  channel: process.env.NEXT_PUBLIC_ONCHAT_CHANNEL
});
```

### 2. Loading States

```tsx
export default function OnChatWidget() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (scriptLoaded) {
      setIsLoading(false);
    }
  }, [scriptLoaded]);

  return (
    <>
      <Script src="..." onLoad={() => setScriptLoaded(true)} />
      {isLoading && <div>Loading chat...</div>}
      <div id="onchat-widget" style={{ display: isLoading ? 'none' : 'block' }} />
    </>
  );
}
```

### 3. Error Handling

```tsx
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  if (scriptLoaded && widgetRef.current) {
    try {
      if (!window.OnChat) {
        throw new Error('OnChat failed to load');
      }
      window.OnChat.mount('#onchat-widget', options);
    } catch (err) {
      setError(err.message);
    }
  }
}, [scriptLoaded]);
```

## Resources

- [Next.js Script Component](https://nextjs.org/docs/app/api-reference/components/script)
- [OnChat Integration Guide](../../INTEGRATION.md)
- [OnChat Themes](../../INTEGRATION.md#themes)

## License

MIT
