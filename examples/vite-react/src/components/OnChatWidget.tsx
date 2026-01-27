import { useEffect, useRef, useState } from 'react';

interface OnChatOptions {
  channel: string;
  height?: string;
  theme?: string;
  hideBrand?: boolean;
  hideMobileTabs?: boolean;
  colors?: Record<string, string>;
}

declare global {
  interface Window {
    OnChat?: {
      mount: (selector: string, options: OnChatOptions) => void;
    };
  }
}

interface OnChatWidgetProps {
  channel: string;
  height?: string;
  theme?: string;
  hideBrand?: boolean;
}

export default function OnChatWidget({
  channel = 'vite-demo',
  height = '600px',
  theme = 'tokyo-night',
  hideBrand = false
}: OnChatWidgetProps) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://onchat.sebayaki.com/widget.js';
    script.async = true;

    script.onload = () => {
      try {
        if (!window.OnChat) {
          throw new Error('OnChat failed to load');
        }

        if (widgetRef.current) {
          window.OnChat.mount('#onchat-widget', {
            channel,
            height,
            theme,
            hideBrand
          });
          setIsLoading(false);
        }
      } catch (err) {
        console.error('OnChat error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load');
        setIsLoading(false);
      }
    };

    script.onerror = () => {
      setError('Failed to load OnChat script');
      setIsLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector(
        `script[src="https://onchat.sebayaki.com/widget.js"]`
      );
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, [channel, height, theme, hideBrand]);

  if (error) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #ef4444',
        borderRadius: '8px',
        background: '#1f1f1f',
        color: '#ef4444',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>⚠️</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #333',
          borderRadius: '8px',
          background: '#1f1f1f',
          color: '#888'
        }}>
          <div>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>💬</div>
            <div>Loading OnChat...</div>
          </div>
        </div>
      )}
      <div
        id="onchat-widget"
        ref={widgetRef}
        style={{ display: isLoading ? 'none' : 'block' }}
      />
    </>
  );
}
