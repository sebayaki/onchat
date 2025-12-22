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

- OnChat: [0x898D291C2160A9CB110398e9dF3693b7f2c4af2D](https://basescan.org/address/0x898D291C2160A9CB110398e9dF3693b7f2c4af2D#code)
