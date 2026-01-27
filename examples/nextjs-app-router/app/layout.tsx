import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OnChat + Next.js Example',
  description: 'On-chain chat integration for Base dApps using Next.js App Router',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
              'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 
              'Helvetica Neue', sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          code {
            font-family: 'Courier New', Courier, monospace;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
