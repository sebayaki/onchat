import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * @dev OnChat contract address on Base Mainnet
 */
const ONCHAT_ADDRESS = "0x898D291C2160A9CB110398e9dF3693b7f2c4af2D";

export default buildModule("OnChatBuyBackBurnerModule", (m) => {
  const onChatBuyBackBurner = m.contract("OnChatBuyBackBurner");

  // Get existing OnChat contract instance
  const onChat = m.contractAt("OnChat", ONCHAT_ADDRESS);

  // Set the treasury wallet to the new burner contract
  // Note: This call must be executed by the owner of the OnChat contract
  m.call(onChat, "setTreasuryWallet", [onChatBuyBackBurner]);

  return { onChatBuyBackBurner };
});
