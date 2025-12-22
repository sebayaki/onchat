# OnChat

Fully permissionless, on-chain, chat.

## 🧪 Running Tests

```sh
npx hardhat test
```

## 🚀 Deploy

```sh
npx hardhat keystore set BASE_PRIVATE_KEY
npx hardhat ignition deploy ignition/modules/OnChat.ts --network base --verify --reset

# if verification failed
npx hardhat ignition verify chain-8453 --network base
```

## 🔵 Deployed Contracts on Base

- OnChat: [0x9e98d93fAa405eE7Bc85C97DD31e0bDd5Ce5747f](https://basescan.org/address/0x9e98d93fAa405eE7Bc85C97DD31e0bDd5Ce5747f#code)
