# OnChat

A fully decentralized, real-time chat platform built on the Base network. OnChat combines on-chain messaging with Farcaster profile integration for a seamless Web3 social experience.

## Project Structure

This repository is organized as a monorepo:

- **[`contracts/`](./contracts)**: Smart contracts for the OnChat protocol, including channel management, messaging, and reward systems. Built with Hardhat.
- **[`web/`](./web)**: A modern React-based frontend for interacting with the OnChat protocol. Built with Next.js, Wagmi, and Tailwind CSS.

## Getting Started

### Smart Contracts

To explore or deploy the contracts:

```bash
cd contracts
npm install
npx hardhat test
```

For more details, see the [contracts documentation](./contracts/README.md).

### Web Application

To run the frontend locally:

```bash
cd web
npm install
npm run dev
```

For more details, see the [web documentation](./web/README.md).

## Technology Stack

- **Blockchain**: Base Network (Ethereum Layer 2)
- **Smart Contracts**: Solidity, Hardhat, OpenZeppelin
- **Frontend**: Next.js (App Router), React, TypeScript
- **Web3 Libraries**: Wagmi, Viem, Reown AppKit
- **Styling**: Tailwind CSS
