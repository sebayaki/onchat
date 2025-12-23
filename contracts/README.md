# OnChat Smart Contracts

This directory contains the core smart contracts for the OnChat protocol.

## Contracts

- **OnChat.sol**: The main messaging contract handling channels, messages, and user interactions.
- **OnChatBuyBackBurner.sol**: Handles the buyback and burning of tokens/rewards within the ecosystem.
- **Pagination.sol**: Utility for paginating on-chain data.
- **Types.sol**: Common data types and structures.

## Development

### Prerequisites

- Node.js
- npm

### Installation

```bash
npm install
```

### 🧪 Running Tests

```bash
npx hardhat test
```

### 🚀 Deployment

Deployment is handled via Hardhat Ignition.

```bash
# Set your deployment private key
npx hardhat keystore set BASE_PRIVATE_KEY

# Deploy OnChat
npx hardhat ignition deploy ignition/modules/OnChat.ts --network base --verify --reset

# Deploy BuyBackBurner
npx hardhat ignition deploy ignition/modules/OnChatBuyBackBurner.ts --network base --verify --reset

# Manual verification if needed
npx hardhat ignition verify chain-8453 --network base
```

## 🔵 Deployed Contracts on Base

- **OnChat**: [`0x898D291C2160A9CB110398e9dF3693b7f2c4af2D`](https://basescan.org/address/0x898D291C2160A9CB110398e9dF3693b7f2c4af2D#code)
- **OnChatBuyBackBurner**: [`0xb1fc1c145b758dc3cECE71F633b4cAB1a9A7c66d`](https://basescan.org/address/0xb1fc1c145b758dc3cECE71F633b4cAB1a9A7c66d#code)
