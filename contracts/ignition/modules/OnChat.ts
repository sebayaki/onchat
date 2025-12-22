import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

export default buildModule("OnChatModule", (m) => {
  const onChat = m.contract("OnChat", [
    // parseEther("0.0025"), // ~$10
    parseEther("0.000025"), // ~$0.1 for testing
    parseEther("0.00001"), // ~$0.03
    parseEther("0.0000002"), // ~$0.0006 per char (~$0.06 per 100 chars)
  ]);

  return { onChat };
});
