'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

interface OnChatOptions {
  channel: string;
  height?: string;
  theme?: string;
  hideBrand?: boolean;
  hideMobileTabs?: boolean;
  colors?: {
    primary?: string;
    primaryMuted?: string;
    textDim?: string;
    bgPrimary?: string;
    bgSecondary?: string;
    bgTertiary?: string;
    bgHover?: string;
    colorSystem?: string;
    colorError?: string;
    colorInfo?: string;
    colorAction?: string;
    colorNick?: string;
    colorChannel?: string;
    colorTimestamp?: string;
    colorContent?: string;
  };
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
  className?: string;
}

export default function OnChatWidget({
  channel,
  height = '600px',
  theme = 'classic-blue',
  hideBrand = false,
  className = ''
}: OnChatWidgetProps) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (scriptLoaded && widgetRef.current) {
      try {
        if (!window.OnChat) {
          throw new Error('OnChat library failed to load');
        }

        window.OnChat.mount('#onchat-widget', {
          channel,
          height,
          theme,
          hideBrand
        });

        setIsLoading(false);
      } catch (err) {
        console.error('OnChat mount error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chat');
        setIsLoading(false);
      }
    }
  }, [scriptLoaded, channel, height, theme, hideBrand]);

  return (
    <>
      <Script
        src="https://onchat.sebayaki.com/widget.js"
        onLoad={() => {
          setScriptLoaded(true);
        }}
        onError={() => {
          setError('Failed to load OnChat script');
          setIsLoading(false);
        }}
        strategy="lazyOnload"
      />

      <div className={className}>
        {isLoading && (
          <div style={{
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #333',
            borderRadius: '8px',
            background: '#1a1a1a',
            color: '#888'
          }}>
            Loading chat...
          </div>
        )}

        {error && (
          <div style={{
            height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #ff4444',
            borderRadius: '8px',
            background: '#1a1a1a',
            color: '#ff4444',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ marginBottom: '10px', fontSize: '18px' }}>⚠️</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        <div
          id="onchat-widget"
          ref={widgetRef}
          style={{ display: isLoading || error ? 'none' : 'block' }}
        />
      </div>
    </>
  );
}
