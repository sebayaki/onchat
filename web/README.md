# OnChat Frontend

The web client for OnChat, a decentralized messaging platform on Base.

## Tech Stack

- **Framework**: [Vite](https://vite.dev) and React
- **Web3**: [Wagmi](https://wagmi.sh) and [Viem](https://viem.sh)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Structure

- `src/app/`: App router pages and layouts.
- `src/components/`: UI components (chat, modals, rewards).
- `src/hooks/`: Chat logic (`useChat`) and profile fetching.
- `src/context/`: Blockchain event and state providers.
- `src/helpers/`: Contract interactions and utilities.
- `src/configs/`: Wagmi/Viem configuration and ABIs.
