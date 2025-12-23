import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { network } from "hardhat";
import {
  parseEther,
  getAddress,
  keccak256,
  toHex,
  erc20Abi,
  getContract,
} from "viem";

// Contract addresses (Base Mainnet)
const ONCHAT_CONTRACT_ADDRESS = "0x898D291C2160A9CB110398e9dF3693b7f2c4af2D";
const HUNT_TOKEN_ADDRESS = "0x37f0c2915CeCC7e977183B8543Fc0864d03E064C";
const ONCHAT_TOKEN_ADDRESS = "0xD8F76e1e31a85bE129155d8CF699D3056f9DA301";
const DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD";

describe("OnChatBuyBackBurner", async function () {
  const connection = await network.connect("baseFork");
  const { viem, networkHelpers } = connection;
  const { impersonateAccount, stopImpersonatingAccount, setBalance } =
    networkHelpers;

  async function deployBurnerFixture() {
    const [deployer, alice] = await viem.getWalletClients();
    const publicClient = await viem.getPublicClient();
    // Deploy the burner contract
    const burner = await viem.deployContract("OnChatBuyBackBurner");

    // Get existing OnChat contract
    const onChat = await viem.getContractAt("OnChat", ONCHAT_CONTRACT_ADDRESS);

    // Set alice's balance
    await setBalance(alice.account.address, parseEther("10"));

    // Impersonate OnChat owner to set the treasury wallet to our burner
    const ownerAddress = await onChat.read.owner();
    await impersonateAccount(ownerAddress);
    await setBalance(ownerAddress, parseEther("1")); // Ensure owner has gas

    await onChat.write.setTreasuryWallet([burner.address], {
      account: ownerAddress,
    });

    await stopImpersonatingAccount(ownerAddress);

    return { burner, onChat, alice, publicClient };
  }

  it("should claim treasury, swap ETH for HUNT, and mint ONCHAT to dead address", async function () {
    const { burner, onChat, alice, publicClient } =
      await networkHelpers.loadFixture(deployBurnerFixture);

    // 1. Accumulate treasury balance in OnChat
    // Channel creation fee is 0.0025 ETH
    const creationFee = await onChat.read.channelCreationFee();

    // Create a few channels to get a decent amount of ETH for the swap
    for (let i = 0; i < 5; i++) {
      const slug = `burn-test-${String.fromCharCode(97 + i)}`;
      await onChat.write.createChannel([slug], {
        account: alice.account,
        value: creationFee,
      });
    }

    const treasuryBalance = await onChat.read.treasuryBalance();
    assert.ok(
      treasuryBalance >= creationFee * 5n,
      "Treasury should have accumulated ETH"
    );

    // 2. Check dead address ONCHAT balance before
    const onchatToken = getContract({
      address: ONCHAT_TOKEN_ADDRESS,
      abi: erc20Abi,
      client: publicClient,
    });
    const deadBalanceBefore = await onchatToken.read.balanceOf([DEAD_ADDRESS]);

    // 3. Trigger the burn function
    // Anyone can call this
    const txHash = await burner.write.burn({
      account: alice.account,
    });
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });
    assert.equal(receipt.status, "success");

    // 4. Verify treasury balance is emptied
    const treasuryBalanceAfter = await onChat.read.treasuryBalance();
    assert.equal(treasuryBalanceAfter, 0n, "Treasury balance should be 0");

    // 5. Verify ONCHAT was minted to the dead address
    const deadBalanceAfter = await onchatToken.read.balanceOf([DEAD_ADDRESS]);
    assert.ok(
      deadBalanceAfter > deadBalanceBefore,
      "Dead address should have received ONCHAT tokens"
    );

    // 6. Verify remaining HUNT was burned (sent to dead address)
    const huntToken = getContract({
      address: HUNT_TOKEN_ADDRESS,
      abi: erc20Abi,
      client: publicClient,
    });
    const burnerHuntBalance = await huntToken.read.balanceOf([burner.address]);
    assert.equal(burnerHuntBalance, 0n, "Burner should have no HUNT left");

    const aliceHuntBalance = await huntToken.read.balanceOf([
      alice.account.address,
    ]);
    assert.equal(
      aliceHuntBalance,
      0n,
      "Alice should not have received HUNT incentive"
    );

    // 7. Verify stats
    const stats: any = await burner.read.stats();
    // console.log("STATS:", stats);
    assert.equal(stats[0], deadBalanceAfter - deadBalanceBefore);
    assert.equal(stats[2], treasuryBalance);
    assert.equal(stats[3], 1n);
  });

  it("should revert if there is nothing to burn", async function () {
    const { burner, onChat, alice } = await networkHelpers.loadFixture(
      deployBurnerFixture
    );

    // Ensure treasury is empty
    const balance = await onChat.read.treasuryBalance();
    if (balance > 0n) {
      // If there's already balance in the fork, we might need to burn it first
      // or just accept that it will burn.
      // For this test, we assume a fresh state or we've just burned it.
      await burner.write.burn({ account: alice.account });
    }

    await assert.rejects(
      burner.write.burn({ account: alice.account }),
      /OnChatBuyBackBurner__NothingToBurn|0x1b47cc81/
    );
  });
});
