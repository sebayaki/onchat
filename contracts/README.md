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

- OnChat: [0x322974Eec5113bc011F4691aC15D2C1Ffac83505](https://basescan.org/address/0x322974Eec5113bc011F4691aC15D2C1Ffac83505#code)
