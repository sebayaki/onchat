import OnChatWidget from './components/OnChatWidget';

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <header style={{
          textAlign: 'center',
          marginBottom: '40px',
          color: 'white'
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            marginBottom: '16px',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            OnChat + Next.js
          </h1>
          <p style={{
            fontSize: '20px',
            opacity: 0.9
          }}>
            On-chain chat for Base dApps
          </p>
        </header>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            marginBottom: '20px',
            padding: '20px',
            background: '#f8f9fa',
            borderRadius: '8px',
            borderLeft: '4px solid #667eea'
          }}>
            <h2 style={{ marginBottom: '10px', color: '#333' }}>
              📝 Integration Example
            </h2>
            <p style={{ color: '#666', lineHeight: '1.6' }}>
              This Next.js App Router example shows how to integrate OnChat using a Client Component.
              The widget loads lazily and handles loading/error states gracefully.
            </p>
          </div>

          <OnChatWidget
            channel="nextjs-demo"
            height="600px"
            theme="dracula"
            hideBrand={false}
          />

          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: '#fff9e6',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#856404'
          }}>
            💡 <strong>Tip:</strong> Edit{' '}
            <code style={{
              background: 'rgba(0,0,0,0.1)',
              padding: '2px 6px',
              borderRadius: '3px'
            }}>
              app/components/OnChatWidget.tsx
            </code>{' '}
            to customize the widget options.
          </div>
        </div>

        <footer style={{
          textAlign: 'center',
          marginTop: '40px',
          color: 'white',
          opacity: 0.8
        }}>
          <p>
            Built with <a
              href="https://github.com/sebayaki/onchat"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'white',
                textDecoration: 'underline'
              }}
            >
              OnChat
            </a> • Powered by{' '}
            <a
              href="https://base.org"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'white',
                textDecoration: 'underline'
              }}
            >
              Base
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
