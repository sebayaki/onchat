# OnChat Frontend

The web client for OnChat, a decentralized messaging platform on Base.

## Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org) (App Router)
- **Web3**: [Wagmi](https://wagmi.sh), [Viem](https://viem.sh), and [Reown AppKit](https://reown.com/appkit)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)

## Getting Started

### Prerequisites

- Node.js (Latest LTS)
- npm

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id
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
