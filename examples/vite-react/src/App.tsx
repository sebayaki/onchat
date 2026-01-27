import OnChatWidget from './components/OnChatWidget';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>⚡ OnChat + Vite</h1>
        <p>Lightning-fast on-chain chat for Base dApps</p>
      </header>

      <main className="main">
        <div className="info-card">
          <h2>🚀 Quick Integration Example</h2>
          <p>
            This Vite + React example shows how easy it is to add OnChat to your dApp.
            The widget loads in milliseconds and provides instant community engagement.
          </p>
          <div className="features">
            <span className="badge">⚡ Fast HMR</span>
            <span className="badge">📦 Small Bundle</span>
            <span className="badge">🎨 Customizable</span>
            <span className="badge">🔵 Base Chain</span>
          </div>
        </div>

        <div className="widget-container">
          <OnChatWidget
            channel="vite-demo"
            height="600px"
            theme="tokyo-night"
            hideBrand={false}
          />
        </div>

        <div className="tip-card">
          <strong>💡 Tip:</strong> Edit{' '}
          <code>src/components/OnChatWidget.tsx</code> to customize the theme,
          colors, and options.
        </div>
      </main>

      <footer className="footer">
        <p>
          Built with{' '}
          <a
            href="https://github.com/sebayaki/onchat"
            target="_blank"
            rel="noopener noreferrer"
          >
            OnChat
          </a>{' '}
          •{' '}
          <a
            href="https://vitejs.dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vite
          </a>{' '}
          •{' '}
          <a
            href="https://base.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Base
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
