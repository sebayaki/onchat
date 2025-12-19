import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { network } from "hardhat";
import { parseEther, getAddress, keccak256, toHex } from "viem";

// Helper to get slug hash for event assertions
function getSlugHash(slug: string): `0x${string}` {
  return keccak256(toHex(slug));
}

// Constants for testing
const CHANNEL_CREATION_FEE = parseEther("0.0025"); // ~$10
const MESSAGE_FEE_BASE = parseEther("0.00001"); // ~$0.03
const MESSAGE_FEE_PER_CHAR = parseEther("0.0000002"); // ~$0.0006 per char (~$0.06 per 100 chars)

// Test data
const TEST_SLUG = "test-channel";
const TEST_SLUG_2 = "another-channel";
const TEST_NAME = "Test Channel";
const TEST_NAME_2 = "Another Channel";
const TEST_MESSAGE = "Hello, OnChat!";
const TEST_MESSAGE_2 = "Another message";

describe("OnChat", async function () {
  const connection = await network.connect();
  const { viem, networkHelpers } = connection;
  const { time } = networkHelpers;

  async function deployOnChatFixture() {
    const [deployer, alice, bob, carol] = await viem.getWalletClients();
    const publicClient = await viem.getPublicClient();

    // Deploy OnChat contract
    const onChat = await viem.deployContract("OnChat", [
      CHANNEL_CREATION_FEE,
      MESSAGE_FEE_BASE,
      MESSAGE_FEE_PER_CHAR,
    ]);

    return { onChat, publicClient, deployer, alice, bob, carol };
  }

  let onChat: any;
  let publicClient: any;
  let deployer: any;
  let alice: any;
  let bob: any;
  let carol: any;

  beforeEach(async function () {
    ({ onChat, publicClient, deployer, alice, bob, carol } =
      await networkHelpers.loadFixture(deployOnChatFixture));
  });

  // ============================================
  // Contract Initialization Tests
  // ============================================
  describe("Contract initialization", function () {
    it("should deploy with correct constructor parameters", async function () {
      const channelCreationFee = await onChat.read.channelCreationFee();
      const messageFeeBase = await onChat.read.messageFeeBase();
      const messageFeePerChar = await onChat.read.messageFeePerChar();

      assert.equal(channelCreationFee, CHANNEL_CREATION_FEE);
      assert.equal(messageFeeBase, MESSAGE_FEE_BASE);
      assert.equal(messageFeePerChar, MESSAGE_FEE_PER_CHAR);
    });

    it("should set deployer as owner", async function () {
      const owner = await onChat.read.owner();
      assert.equal(owner.toLowerCase(), deployer.account.address.toLowerCase());
    });

    it("should set deployer as treasury wallet", async function () {
      const treasury = await onChat.read.treasuryWallet();
      assert.equal(
        treasury.toLowerCase(),
        deployer.account.address.toLowerCase()
      );
    });

    it("should initialize with correct constants", async function () {
      const ownerShareBp = await onChat.read.OWNER_SHARE_BP();
      const treasuryShareBp = await onChat.read.TREASURY_SHARE_BP();

      assert.equal(ownerShareBp, 8000n); // 80%
      assert.equal(treasuryShareBp, 2000n); // 20%
    });

    it("should initialize with zero channels", async function () {
      const channelCount = await onChat.read.getChannelCount();
      assert.equal(channelCount, 0n);
    });
  }); // Contract initialization

  // ============================================
  // Admin Functions Tests
  // ============================================
  describe("Admin functions", function () {
    describe("setTreasuryWallet", function () {
      it("should allow owner to update treasury wallet", async function () {
        await onChat.write.setTreasuryWallet([alice.account.address], {
          account: deployer.account,
        });

        const newTreasury = await onChat.read.treasuryWallet();
        assert.equal(
          newTreasury.toLowerCase(),
          alice.account.address.toLowerCase()
        );
      });

      it("should emit TreasuryWalletUpdated event", async function () {
        await viem.assertions.emitWithArgs(
          onChat.write.setTreasuryWallet([alice.account.address], {
            account: deployer.account,
          }),
          onChat,
          "TreasuryWalletUpdated",
          [getAddress(alice.account.address)]
        );
      });

      it("should revert with zero address", async function () {
        await assert.rejects(
          onChat.write.setTreasuryWallet(
            ["0x0000000000000000000000000000000000000000"],
            {
              account: deployer.account,
            }
          ),
          /OnChat__InvalidParams\("zero address"\)/
        );
      });

      it("should revert when non-owner tries to update", async function () {
        await assert.rejects(
          onChat.write.setTreasuryWallet([bob.account.address], {
            account: alice.account,
          }),
          /OwnableUnauthorizedAccount/
        );
      });
    }); // setTreasuryWallet

    describe("setChannelCreationFee", function () {
      it("should allow owner to update channel creation fee", async function () {
        const newFee = parseEther("0.005");
        await onChat.write.setChannelCreationFee([newFee], {
          account: deployer.account,
        });

        const fee = await onChat.read.channelCreationFee();
        assert.equal(fee, newFee);
      });

      it("should emit ChannelCreationFeeUpdated event", async function () {
        const newFee = parseEther("0.005");
        await viem.assertions.emitWithArgs(
          onChat.write.setChannelCreationFee([newFee], {
            account: deployer.account,
          }),
          onChat,
          "ChannelCreationFeeUpdated",
          [newFee]
        );
      });

      it("should revert when non-owner tries to update", async function () {
        await assert.rejects(
          onChat.write.setChannelCreationFee([parseEther("0.005")], {
            account: alice.account,
          }),
          /OwnableUnauthorizedAccount/
        );
      });
    }); // setChannelCreationFee

    describe("setMessageFeeBase", function () {
      it("should allow owner to update message fee base", async function () {
        const newFee = parseEther("0.0005");
        await onChat.write.setMessageFeeBase([newFee], {
          account: deployer.account,
        });

        const fee = await onChat.read.messageFeeBase();
        assert.equal(fee, newFee);
      });

      it("should emit MessageFeeBaseUpdated event", async function () {
        const newFee = parseEther("0.0005");
        await viem.assertions.emitWithArgs(
          onChat.write.setMessageFeeBase([newFee], {
            account: deployer.account,
          }),
          onChat,
          "MessageFeeBaseUpdated",
          [newFee]
        );
      });

      it("should revert when non-owner tries to update", async function () {
        await assert.rejects(
          onChat.write.setMessageFeeBase([parseEther("0.0005")], {
            account: alice.account,
          }),
          /OwnableUnauthorizedAccount/
        );
      });
    }); // setMessageFeeBase

    describe("setMessageFeePerChar", function () {
      it("should allow owner to update message fee per char", async function () {
        const newFee = parseEther("0.00005");
        await onChat.write.setMessageFeePerChar([newFee], {
          account: deployer.account,
        });

        const fee = await onChat.read.messageFeePerChar();
        assert.equal(fee, newFee);
      });

      it("should emit MessageFeePerCharUpdated event", async function () {
        const newFee = parseEther("0.00005");
        await viem.assertions.emitWithArgs(
          onChat.write.setMessageFeePerChar([newFee], {
            account: deployer.account,
          }),
          onChat,
          "MessageFeePerCharUpdated",
          [newFee]
        );
      });

      it("should revert when non-owner tries to update", async function () {
        await assert.rejects(
          onChat.write.setMessageFeePerChar([parseEther("0.00005")], {
            account: alice.account,
          }),
          /OwnableUnauthorizedAccount/
        );
      });
    }); // setMessageFeePerChar
  }); // Admin functions

  // ============================================
  // Channel Creation Tests
  // ============================================
  describe("createChannel", function () {
    describe("Parameter validation", function () {
      it("should revert with empty slug", async function () {
        await assert.rejects(
          onChat.write.createChannel(["", TEST_NAME], {
            account: alice.account,
            value: CHANNEL_CREATION_FEE,
          }),
          /OnChat__InvalidParams\("slug length must be 1-20"\)/
        );
      });

      it("should revert with slug longer than 20 characters", async function () {
        await assert.rejects(
          onChat.write.createChannel(["this-is-a-very-long-slug", TEST_NAME], {
            account: alice.account,
            value: CHANNEL_CREATION_FEE,
          }),
          /OnChat__InvalidParams\("slug length must be 1-20"\)/
        );
      });

      it("should revert with invalid characters in slug (uppercase)", async function () {
        await assert.rejects(
          onChat.write.createChannel(["Test-Channel", TEST_NAME], {
            account: alice.account,
            value: CHANNEL_CREATION_FEE,
          }),
          /OnChat__InvalidParams\("slug must be \[a-z-\]"\)/
        );
      });

      it("should revert with invalid characters in slug (numbers)", async function () {
        await assert.rejects(
          onChat.write.createChannel(["test123", TEST_NAME], {
            account: alice.account,
            value: CHANNEL_CREATION_FEE,
          }),
          /OnChat__InvalidParams\("slug must be \[a-z-\]"\)/
        );
      });

      it("should revert with invalid characters in slug (underscore)", async function () {
        await assert.rejects(
          onChat.write.createChannel(["test_channel", TEST_NAME], {
            account: alice.account,
            value: CHANNEL_CREATION_FEE,
          }),
          /OnChat__InvalidParams\("slug must be \[a-z-\]"\)/
        );
      });

      it("should revert with empty name", async function () {
        await assert.rejects(
          onChat.write.createChannel([TEST_SLUG, ""], {
            account: alice.account,
            value: CHANNEL_CREATION_FEE,
          }),
          /OnChat__InvalidParams\("empty name"\)/
        );
      });

      it("should revert if channel already exists", async function () {
        await onChat.write.createChannel([TEST_SLUG, TEST_NAME], {
          account: alice.account,
          value: CHANNEL_CREATION_FEE,
        });

        await assert.rejects(
          onChat.write.createChannel([TEST_SLUG, "Another Name"], {
            account: bob.account,
            value: CHANNEL_CREATION_FEE,
          }),
          /OnChat__ChannelAlreadyExists/
        );
      });

      it("should revert with insufficient payment", async function () {
        await assert.rejects(
          onChat.write.createChannel([TEST_SLUG, TEST_NAME], {
            account: alice.account,
            value: CHANNEL_CREATION_FEE - 1n,
          }),
          /OnChat__InsufficientPayment/
        );
      });
    }); // Parameter validation

    describe("Success cases", function () {
      it("should create channel with valid inputs", async function () {
        await onChat.write.createChannel([TEST_SLUG, TEST_NAME], {
          account: alice.account,
          value: CHANNEL_CREATION_FEE,
        });

        const channel = await onChat.read.getChannel([TEST_SLUG]);
        assert.equal(channel.slug, TEST_SLUG);
        assert.equal(channel.name, TEST_NAME);
        assert.equal(
          channel.owner.toLowerCase(),
          alice.account.address.toLowerCase()
        );
      });

      it("should accept slug with only hyphens", async function () {
        await onChat.write.createChannel(["---", TEST_NAME], {
          account: alice.account,
          value: CHANNEL_CREATION_FEE,
        });

        const channel = await onChat.read.getChannel(["---"]);
        assert.equal(channel.slug, "---");
      });

      it("should accept single character slug", async function () {
        await onChat.write.createChannel(["a", TEST_NAME], {
          account: alice.account,
          value: CHANNEL_CREATION_FEE,
        });

        const channel = await onChat.read.getChannel(["a"]);
        assert.equal(channel.slug, "a");
      });

      it("should accept 20 character slug", async function () {
        const maxSlug = "abcdefghij-klmnopqr"; // exactly 20 chars
        await onChat.write.createChannel([maxSlug, TEST_NAME], {
          account: alice.account,
          value: CHANNEL_CREATION_FEE,
        });

        const channel = await onChat.read.getChannel([maxSlug]);
        assert.equal(channel.slug, maxSlug);
      });

      it("should auto-join creator to the channel", async function () {
        await onChat.write.createChannel([TEST_SLUG, TEST_NAME], {
          account: alice.account,
          value: CHANNEL_CREATION_FEE,
        });

        const isMember = await onChat.read.isMember([
          TEST_SLUG,
          alice.account.address,
        ]);
        assert.equal(isMember, true);
      });

      it("should add channel to user's joined channels", async function () {
        await onChat.write.createChannel([TEST_SLUG, TEST_NAME], {
          account: alice.account,
          value: CHANNEL_CREATION_FEE,
        });

        const userChannels = await onChat.read.getUserChannels([
          alice.account.address,
          0n,
          10n,
        ]);
        assert.equal(userChannels.length, 1);
        assert.equal(userChannels[0], TEST_SLUG);
      });

      it("should increment channel count", async function () {
        const initialCount = await onChat.read.getChannelCount();

        await onChat.write.createChannel([TEST_SLUG, TEST_NAME], {
          account: alice.account,
          value: CHANNEL_CREATION_FEE,
        });

        const newCount = await onChat.read.getChannelCount();
        assert.equal(newCount, initialCount + 1n);
      });

      it("should emit ChannelCreated event", async function () {
        await viem.assertions.emitWithArgs(
          onChat.write.createChannel([TEST_SLUG, TEST_NAME], {
            account: alice.account,
            value: CHANNEL_CREATION_FEE,
          }),
          onChat,
          "ChannelCreated",
          [
            getSlugHash(TEST_SLUG),
            TEST_SLUG,
            getAddress(alice.account.address),
            TEST_NAME,
          ]
        );
      });

      it("should split fee correctly (80% owner, 20% treasury)", async function () {
        await onChat.write.createChannel([TEST_SLUG, TEST_NAME], {
          account: alice.account,
          value: CHANNEL_CREATION_FEE,
        });

        const ownerBalance = await onChat.read.ownerBalances([
          alice.account.address,
        ]);
        const treasuryBalance = await onChat.read.treasuryBalance();

        const expectedOwnerShare = (CHANNEL_CREATION_FEE * 8000n) / 10000n;
        const expectedTreasuryShare = CHANNEL_CREATION_FEE - expectedOwnerShare;

        assert.equal(ownerBalance, expectedOwnerShare);
        assert.equal(treasuryBalance, expectedTreasuryShare);
      });

      it("should refund excess payment", async function () {
        const excessAmount = parseEther("0.01");
        const initialBalance = await publicClient.getBalance({
          address: alice.account.address,
        });

        const tx = await onChat.write.createChannel([TEST_SLUG, TEST_NAME], {
          account: alice.account,
          value: CHANNEL_CREATION_FEE + excessAmount,
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: tx,
        });
        const gasUsed =
          BigInt(receipt.gasUsed) * BigInt(receipt.effectiveGasPrice);

        const finalBalance = await publicClient.getBalance({
          address: alice.account.address,
        });

        // Final balance should be: initial - fee - gas (excess was refunded)
        const expectedBalance = initialBalance - CHANNEL_CREATION_FEE - gasUsed;
        assert.equal(finalBalance, expectedBalance);
      });

      it("should set correct createdAt timestamp", async function () {
        await onChat.write.createChannel([TEST_SLUG, TEST_NAME], {
          account: alice.account,
          value: CHANNEL_CREATION_FEE,
        });

        const channel = await onChat.read.getChannel([TEST_SLUG]);
        const currentTime = await time.latest();
        assert.equal(Number(channel.createdAt), currentTime);
      });
    }); // Success cases
  }); // createChannel

  // ============================================
  // Channel Join/Leave Tests
  // ============================================
  describe("joinChannel", function () {
    beforeEach(async function () {
      // Create a channel first
      await onChat.write.createChannel([TEST_SLUG, TEST_NAME], {
        account: alice.account,
        value: CHANNEL_CREATION_FEE,
      });
    });

    it("should allow user to join existing channel", async function () {
      await onChat.write.joinChannel([TEST_SLUG], {
        account: bob.account,
      });

      const isMember = await onChat.read.isMember([
        TEST_SLUG,
        bob.account.address,
      ]);
      assert.equal(isMember, true);
    });

    it("should add channel to user's joined channels", async function () {
      await onChat.write.joinChannel([TEST_SLUG], {
        account: bob.account,
      });

      const userChannels = await onChat.read.getUserChannels([
        bob.account.address,
        0n,
        10n,
      ]);
      assert.equal(userChannels.length, 1);
      assert.equal(userChannels[0], TEST_SLUG);
    });

    it("should increment member count", async function () {
      const initialCount = await onChat.read.getChannelMemberCount([TEST_SLUG]);

      await onChat.write.joinChannel([TEST_SLUG], {
        account: bob.account,
      });

      const newCount = await onChat.read.getChannelMemberCount([TEST_SLUG]);
      assert.equal(newCount, initialCount + 1n);
    });

    it("should emit ChannelJoined event", async function () {
      await viem.assertions.emitWithArgs(
        onChat.write.joinChannel([TEST_SLUG], {
          account: bob.account,
        }),
        onChat,
        "ChannelJoined",
        [getSlugHash(TEST_SLUG), TEST_SLUG, getAddress(bob.account.address)]
      );
    });

    it("should revert if channel does not exist", async function () {
      await assert.rejects(
        onChat.write.joinChannel(["nonexistent"], {
          account: bob.account,
        }),
        /OnChat__ChannelNotFound/
      );
    });

    it("should revert if user is already a member", async function () {
      await onChat.write.joinChannel([TEST_SLUG], {
        account: bob.account,
      });

      await assert.rejects(
        onChat.write.joinChannel([TEST_SLUG], {
          account: bob.account,
        }),
        /OnChat__AlreadyMember/
      );
    });

    it("should revert if user is banned", async function () {
      // Ban bob
      await onChat.write.banUser([TEST_SLUG, bob.account.address], {
        account: alice.account,
      });

      await assert.rejects(
        onChat.write.joinChannel([TEST_SLUG], {
          account: bob.account,
        }),
        /OnChat__UserBanned/
      );
    });
  }); // joinChannel

  describe("leaveChannel", function () {
    beforeEach(async function () {
      // Create a channel and have bob join
      await onChat.write.createChannel([TEST_SLUG, TEST_NAME], {
        account: alice.account,
        value: CHANNEL_CREATION_FEE,
      });
      await onChat.write.joinChannel([TEST_SLUG], {
        account: bob.account,
      });
    });

    it("should allow user to leave channel", async function () {
      await onChat.write.leaveChannel([TEST_SLUG], {
        account: bob.account,
      });

      const isMember = await onChat.read.isMember([
        TEST_SLUG,
        bob.account.address,
      ]);
      assert.equal(isMember, false);
    });

    it("should remove channel from user's joined channels", async function () {
      await onChat.write.leaveChannel([TEST_SLUG], {
        account: bob.account,
      });

      const userChannels = await onChat.read.getUserChannels([
        bob.account.address,
        0n,
        10n,
      ]);
      assert.equal(userChannels.length, 0);
    });

    it("should decrement member count", async function () {
      const initialCount = await onChat.read.getChannelMemberCount([TEST_SLUG]);

      await onChat.write.leaveChannel([TEST_SLUG], {
        account: bob.account,
      });

      const newCount = await onChat.read.getChannelMemberCount([TEST_SLUG]);
      assert.equal(newCount, initialCount - 1n);
    });

    it("should remove moderator status when leaving", async function () {
      // Make bob a moderator
      await onChat.write.addModerator([TEST_SLUG, bob.account.address], {
        account: alice.account,
      });

      assert.equal(
        await onChat.read.isModerator([TEST_SLUG, bob.account.address]),
        true
      );

      await onChat.write.leaveChannel([TEST_SLUG], {
        account: bob.account,
      });

      assert.equal(
        await onChat.read.isModerator([TEST_SLUG, bob.account.address]),
        false
      );
    });

    it("should emit ChannelLeft event", async function () {
      await viem.assertions.emitWithArgs(
        onChat.write.leaveChannel([TEST_SLUG], {
          account: bob.account,
        }),
        onChat,
        "ChannelLeft",
        [getSlugHash(TEST_SLUG), TEST_SLUG, getAddress(bob.account.address)]
      );
    });

    it("should revert if channel does not exist", async function () {
      await assert.rejects(
        onChat.write.leaveChannel(["nonexistent"], {
          account: bob.account,
        }),
        /OnChat__ChannelNotFound/
      );
    });

    it("should revert if user is not a member", async function () {
      await assert.rejects(
        onChat.write.leaveChannel([TEST_SLUG], {
          account: carol.account,
        }),
        /OnChat__NotMember/
      );
    });
  }); // leaveChannel

  // ============================================
  // Message Functions Tests
  // ============================================
  describe("sendMessage", function () {
    beforeEach(async function () {
      // Create a channel
      await onChat.write.createChannel([TEST_SLUG, TEST_NAME], {
        account: alice.account,
        value: CHANNEL_CREATION_FEE,
      });
    });

    describe("Parameter validation", function () {
      it("should revert with empty content", async function () {
        const messageFee = await onChat.read.calculateMessageFee([0n]);

        await assert.rejects(
          onChat.write.sendMessage([TEST_SLUG, ""], {
            account: alice.account,
            value: messageFee,
          }),
          /OnChat__InvalidParams\("empty content"\)/
        );
      });

      it("should revert if channel does not exist", async function () {
        const messageFee = await onChat.read.calculateMessageFee([
          BigInt(TEST_MESSAGE.length),
        ]);

        await assert.rejects(
          onChat.write.sendMessage(["nonexistent", TEST_MESSAGE], {
            account: alice.account,
            value: messageFee,
          }),
          /OnChat__ChannelNotFound/
        );
      });

      it("should revert if user is not a member", async function () {
        const messageFee = await onChat.read.calculateMessageFee([
          BigInt(TEST_MESSAGE.length),
        ]);

        await assert.rejects(
          onChat.write.sendMessage([TEST_SLUG, TEST_MESSAGE], {
            account: bob.account,
            value: messageFee,
          }),
          /OnChat__NotMember/
        );
      });

      it("should revert if user is banned", async function () {
        // Bob joins then gets banned
        await onChat.write.joinChannel([TEST_SLUG], { account: bob.account });
        await onChat.write.banUser([TEST_SLUG, bob.account.address], {
          account: alice.account,
        });

        const messageFee = await onChat.read.calculateMessageFee([
          BigInt(TEST_MESSAGE.length),
        ]);

        await assert.rejects(
          onChat.write.sendMessage([TEST_SLUG, TEST_MESSAGE], {
            account: bob.account,
            value: messageFee,
          }),
          /OnChat__UserBanned/
        );
      });

      it("should revert with insufficient payment", async function () {
        const messageFee = await onChat.read.calculateMessageFee([
          BigInt(TEST_MESSAGE.length),
        ]);

        await assert.rejects(
          onChat.write.sendMessage([TEST_SLUG, TEST_MESSAGE], {
            account: alice.account,
            value: messageFee - 1n,
          }),
          /OnChat__InsufficientPayment/
        );
      });
    }); // Parameter validation

    describe("Success cases", function () {
      it("should send message successfully", async function () {
        const messageFee = await onChat.read.calculateMessageFee([
          BigInt(TEST_MESSAGE.length),
        ]);

        await onChat.write.sendMessage([TEST_SLUG, TEST_MESSAGE], {
          account: alice.account,
          value: messageFee,
        });

        const messageCount = await onChat.read.getMessageCount([TEST_SLUG]);
        assert.equal(messageCount, 1n);
      });

      it("should store message data correctly", async function () {
        const messageFee = await onChat.read.calculateMessageFee([
          BigInt(TEST_MESSAGE.length),
        ]);

        await onChat.write.sendMessage([TEST_SLUG, TEST_MESSAGE], {
          account: alice.account,
          value: messageFee,
        });

        const messages = await onChat.read.getLatestMessages([
          TEST_SLUG,
          0n,
          10n,
        ]);
        assert.equal(messages.length, 1);
        assert.equal(messages[0].content, TEST_MESSAGE);
        assert.equal(
          messages[0].sender.toLowerCase(),
          alice.account.address.toLowerCase()
        );
        assert.equal(messages[0].isHidden, false);
      });

      it("should emit MessageSent event", async function () {
        const messageFee = await onChat.read.calculateMessageFee([
          BigInt(TEST_MESSAGE.length),
        ]);

        await viem.assertions.emitWithArgs(
          onChat.write.sendMessage([TEST_SLUG, TEST_MESSAGE], {
            account: alice.account,
            value: messageFee,
          }),
          onChat,
          "MessageSent",
          [
            getSlugHash(TEST_SLUG),
            TEST_SLUG,
            getAddress(alice.account.address),
            0n,
            TEST_MESSAGE,
          ]
        );
      });

      it("should calculate message fee correctly", async function () {
        const contentLength = BigInt(TEST_MESSAGE.length);
        const expectedFee =
          MESSAGE_FEE_BASE + contentLength * MESSAGE_FEE_PER_CHAR;

        const calculatedFee = await onChat.read.calculateMessageFee([
          contentLength,
        ]);
        assert.equal(calculatedFee, expectedFee);
      });

      it("should split fee correctly (80% owner, 20% treasury)", async function () {
        const messageFee = await onChat.read.calculateMessageFee([
          BigInt(TEST_MESSAGE.length),
        ]);

        const initialOwnerBalance = await onChat.read.ownerBalances([
          alice.account.address,
        ]);
        const initialTreasuryBalance = await onChat.read.treasuryBalance();

        await onChat.write.sendMessage([TEST_SLUG, TEST_MESSAGE], {
          account: alice.account,
          value: messageFee,
        });

        const finalOwnerBalance = await onChat.read.ownerBalances([
          alice.account.address,
        ]);
        const finalTreasuryBalance = await onChat.read.treasuryBalance();

        const expectedOwnerShare = (messageFee * 8000n) / 10000n;
        const expectedTreasuryShare = messageFee - expectedOwnerShare;

        assert.equal(
          finalOwnerBalance - initialOwnerBalance,
          expectedOwnerShare
        );
        assert.equal(
          finalTreasuryBalance - initialTreasuryBalance,
          expectedTreasuryShare
        );
      });

      it("should refund excess payment", async function () {
        const messageFee = await onChat.read.calculateMessageFee([
          BigInt(TEST_MESSAGE.length),
        ]);
        const excessAmount = parseEther("0.01");

        const initialBalance = await publicClient.getBalance({
          address: alice.account.address,
        });

        const tx = await onChat.write.sendMessage([TEST_SLUG, TEST_MESSAGE], {
          account: alice.account,
          value: messageFee + excessAmount,
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: tx,
        });
        const gasUsed =
          BigInt(receipt.gasUsed) * BigInt(receipt.effectiveGasPrice);

        const finalBalance = await publicClient.getBalance({
          address: alice.account.address,
        });

        const expectedBalance = initialBalance - BigInt(messageFee) - gasUsed;
        assert.equal(finalBalance, expectedBalance);
      });

      it("should handle multiple messages", async function () {
        const messageFee = await onChat.read.calculateMessageFee([
          BigInt(TEST_MESSAGE.length),
        ]);

        await onChat.write.sendMessage([TEST_SLUG, TEST_MESSAGE], {
          account: alice.account,
          value: messageFee,
        });

        await onChat.write.sendMessage([TEST_SLUG, TEST_MESSAGE_2], {
          account: alice.account,
          value: await onChat.read.calculateMessageFee([
            BigInt(TEST_MESSAGE_2.length),
          ]),
        });

        const messageCount = await onChat.read.getMessageCount([TEST_SLUG]);
        assert.equal(messageCount, 2n);
      });
    }); // Success cases
  }); // sendMessage

  describe("hideMessage and unhideMessage", function () {
    beforeEach(async function () {
      // Create a channel and send a message
      await onChat.write.createChannel([TEST_SLUG, TEST_NAME], {
        account: alice.account,
        value: CHANNEL_CREATION_FEE,
      });

      const messageFee = await onChat.read.calculateMessageFee([
        BigInt(TEST_MESSAGE.length),
      ]);
      await onChat.write.sendMessage([TEST_SLUG, TEST_MESSAGE], {
        account: alice.account,
        value: messageFee,
      });
    });

    describe("hideMessage", function () {
      it("should allow owner to hide message", async function () {
        await onChat.write.hideMessage([TEST_SLUG, 0n], {
          account: alice.account,
        });

        const messages = await onChat.read.getLatestMessages([
          TEST_SLUG,
          0n,
          10n,
        ]);
        assert.equal(messages[0].isHidden, true);
      });

      it("should allow moderator to hide message", async function () {
        await onChat.write.joinChannel([TEST_SLUG], { account: bob.account });
        await onChat.write.addModerator([TEST_SLUG, bob.account.address], {
          account: alice.account,
        });

        await onChat.write.hideMessage([TEST_SLUG, 0n], {
          account: bob.account,
        });

        const messages = await onChat.read.getLatestMessages([
          TEST_SLUG,
          0n,
          10n,
        ]);
        assert.equal(messages[0].isHidden, true);
      });

      it("should emit MessageHidden event", async function () {
        await viem.assertions.emitWithArgs(
          onChat.write.hideMessage([TEST_SLUG, 0n], {
            account: alice.account,
          }),
          onChat,
          "MessageHidden",
          [
            getSlugHash(TEST_SLUG),
            TEST_SLUG,
            0n,
            getAddress(alice.account.address),
          ]
        );
      });

      it("should revert if message does not exist", async function () {
        await assert.rejects(
          onChat.write.hideMessage([TEST_SLUG, 999n], {
            account: alice.account,
          }),
          /OnChat__MessageNotFound/
        );
      });

      it("should revert if called by non-owner/non-moderator", async function () {
        await onChat.write.joinChannel([TEST_SLUG], { account: bob.account });

        await assert.rejects(
          onChat.write.hideMessage([TEST_SLUG, 0n], {
            account: bob.account,
          }),
          /OnChat__NotChannelOwnerOrModerator/
        );
      });
    }); // hideMessage

    describe("unhideMessage", function () {
      beforeEach(async function () {
        await onChat.write.hideMessage([TEST_SLUG, 0n], {
          account: alice.account,
        });
      });

      it("should allow owner to unhide message", async function () {
        await onChat.write.unhideMessage([TEST_SLUG, 0n], {
          account: alice.account,
        });

        const messages = await onChat.read.getLatestMessages([
          TEST_SLUG,
          0n,
          10n,
        ]);
        assert.equal(messages[0].isHidden, false);
      });

      it("should allow moderator to unhide message", async function () {
        await onChat.write.joinChannel([TEST_SLUG], { account: bob.account });
        await onChat.write.addModerator([TEST_SLUG, bob.account.address], {
          account: alice.account,
        });

        await onChat.write.unhideMessage([TEST_SLUG, 0n], {
          account: bob.account,
        });

        const messages = await onChat.read.getLatestMessages([
          TEST_SLUG,
          0n,
          10n,
        ]);
        assert.equal(messages[0].isHidden, false);
      });

      it("should emit MessageUnhidden event", async function () {
        await viem.assertions.emitWithArgs(
          onChat.write.unhideMessage([TEST_SLUG, 0n], {
            account: alice.account,
          }),
          onChat,
          "MessageUnhidden",
          [
            getSlugHash(TEST_SLUG),
            TEST_SLUG,
            0n,
            getAddress(alice.account.address),
          ]
        );
      });

      it("should revert if message does not exist", async function () {
        await assert.rejects(
          onChat.write.unhideMessage([TEST_SLUG, 999n], {
            account: alice.account,
          }),
          /OnChat__MessageNotFound/
        );
      });

      it("should revert if called by non-owner/non-moderator", async function () {
        await onChat.write.joinChannel([TEST_SLUG], { account: bob.account });

        await assert.rejects(
          onChat.write.unhideMessage([TEST_SLUG, 0n], {
            account: bob.account,
          }),
          /OnChat__NotChannelOwnerOrModerator/
        );
      });
    }); // unhideMessage
  }); // hideMessage and unhideMessage

  // ============================================
  // Moderation Functions Tests
  // ============================================
  describe("Moderation functions", function () {
    beforeEach(async function () {
      // Create a channel and have bob join
      await onChat.write.createChannel([TEST_SLUG, TEST_NAME], {
        account: alice.account,
        value: CHANNEL_CREATION_FEE,
      });
      await onChat.write.joinChannel([TEST_SLUG], { account: bob.account });
      await onChat.write.joinChannel([TEST_SLUG], { account: carol.account });
    });

    describe("banUser", function () {
      it("should allow owner to ban user", async function () {
        await onChat.write.banUser([TEST_SLUG, bob.account.address], {
          account: alice.account,
        });

        const isBanned = await onChat.read.isBanned([
          TEST_SLUG,
          bob.account.address,
        ]);
        assert.equal(isBanned, true);
      });

      it("should allow moderator to ban user", async function () {
        await onChat.write.addModerator([TEST_SLUG, bob.account.address], {
          account: alice.account,
        });

        await onChat.write.banUser([TEST_SLUG, carol.account.address], {
          account: bob.account,
        });

        const isBanned = await onChat.read.isBanned([
          TEST_SLUG,
          carol.account.address,
        ]);
        assert.equal(isBanned, true);
      });

      it("should remove banned user from members", async function () {
        const isMemberBefore = await onChat.read.isMember([
          TEST_SLUG,
          bob.account.address,
        ]);
        assert.equal(isMemberBefore, true);

        await onChat.write.banUser([TEST_SLUG, bob.account.address], {
          account: alice.account,
        });

        const isMemberAfter = await onChat.read.isMember([
          TEST_SLUG,
          bob.account.address,
        ]);
        assert.equal(isMemberAfter, false);
      });

      it("should remove banned user from moderators", async function () {
        await onChat.write.addModerator([TEST_SLUG, bob.account.address], {
          account: alice.account,
        });

        assert.equal(
          await onChat.read.isModerator([TEST_SLUG, bob.account.address]),
          true
        );

        await onChat.write.banUser([TEST_SLUG, bob.account.address], {
          account: alice.account,
        });

        assert.equal(
          await onChat.read.isModerator([TEST_SLUG, bob.account.address]),
          false
        );
      });

      it("should remove channel from user's joined channels", async function () {
        await onChat.write.banUser([TEST_SLUG, bob.account.address], {
          account: alice.account,
        });

        const userChannels = await onChat.read.getUserChannels([
          bob.account.address,
          0n,
          10n,
        ]);
        assert.equal(userChannels.length, 0);
      });

      it("should emit UserBanned event", async function () {
        await viem.assertions.emitWithArgs(
          onChat.write.banUser([TEST_SLUG, bob.account.address], {
            account: alice.account,
          }),
          onChat,
          "UserBanned",
          [
            getSlugHash(TEST_SLUG),
            TEST_SLUG,
            getAddress(bob.account.address),
            getAddress(alice.account.address),
          ]
        );
      });

      it("should revert with zero address", async function () {
        await assert.rejects(
          onChat.write.banUser(
            [TEST_SLUG, "0x0000000000000000000000000000000000000000"],
            {
              account: alice.account,
            }
          ),
          /OnChat__InvalidParams/
        );
      });

      it("should revert when trying to ban owner", async function () {
        await assert.rejects(
          onChat.write.banUser([TEST_SLUG, alice.account.address], {
            account: alice.account,
          }),
          /OnChat__InvalidParams/
        );
      });

      it("should revert if user is already banned", async function () {
        await onChat.write.banUser([TEST_SLUG, bob.account.address], {
          account: alice.account,
        });

        await assert.rejects(
          onChat.write.banUser([TEST_SLUG, bob.account.address], {
            account: alice.account,
          }),
          /OnChat__UserBanned/
        );
      });

      it("should revert if called by non-owner/non-moderator", async function () {
        await assert.rejects(
          onChat.write.banUser([TEST_SLUG, carol.account.address], {
            account: bob.account,
          }),
          /OnChat__NotChannelOwnerOrModerator/
        );
      });
    }); // banUser

    describe("unbanUser", function () {
      beforeEach(async function () {
        await onChat.write.banUser([TEST_SLUG, bob.account.address], {
          account: alice.account,
        });
      });

      it("should allow owner to unban user", async function () {
        await onChat.write.unbanUser([TEST_SLUG, bob.account.address], {
          account: alice.account,
        });

        const isBanned = await onChat.read.isBanned([
          TEST_SLUG,
          bob.account.address,
        ]);
        assert.equal(isBanned, false);
      });

      it("should allow moderator to unban user", async function () {
        await onChat.write.addModerator([TEST_SLUG, carol.account.address], {
          account: alice.account,
        });

        await onChat.write.unbanUser([TEST_SLUG, bob.account.address], {
          account: carol.account,
        });

        const isBanned = await onChat.read.isBanned([
          TEST_SLUG,
          bob.account.address,
        ]);
        assert.equal(isBanned, false);
      });

      it("should emit UserUnbanned event", async function () {
        await viem.assertions.emitWithArgs(
          onChat.write.unbanUser([TEST_SLUG, bob.account.address], {
            account: alice.account,
          }),
          onChat,
          "UserUnbanned",
          [
            getSlugHash(TEST_SLUG),
            TEST_SLUG,
            getAddress(bob.account.address),
            getAddress(alice.account.address),
          ]
        );
      });

      it("should revert with zero address", async function () {
        await assert.rejects(
          onChat.write.unbanUser(
            [TEST_SLUG, "0x0000000000000000000000000000000000000000"],
            {
              account: alice.account,
            }
          ),
          /OnChat__InvalidParams/
        );
      });

      it("should revert if user is not banned", async function () {
        await assert.rejects(
          onChat.write.unbanUser([TEST_SLUG, carol.account.address], {
            account: alice.account,
          }),
          /OnChat__UserNotBanned/
        );
      });

      it("should revert if called by non-owner/non-moderator", async function () {
        await assert.rejects(
          onChat.write.unbanUser([TEST_SLUG, bob.account.address], {
            account: carol.account,
          }),
          /OnChat__NotChannelOwnerOrModerator/
        );
      });
    }); // unbanUser

    describe("addModerator", function () {
      it("should allow owner to add moderator", async function () {
        await onChat.write.addModerator([TEST_SLUG, bob.account.address], {
          account: alice.account,
        });

        const isModerator = await onChat.read.isModerator([
          TEST_SLUG,
          bob.account.address,
        ]);
        assert.equal(isModerator, true);
      });

      it("should add moderator to channel moderators list", async function () {
        await onChat.write.addModerator([TEST_SLUG, bob.account.address], {
          account: alice.account,
        });

        const moderators = await onChat.read.getChannelModerators([TEST_SLUG]);
        assert.equal(moderators.length, 1);
        assert.equal(
          moderators[0].toLowerCase(),
          bob.account.address.toLowerCase()
        );
      });

      it("should emit ModeratorAdded event", async function () {
        await viem.assertions.emitWithArgs(
          onChat.write.addModerator([TEST_SLUG, bob.account.address], {
            account: alice.account,
          }),
          onChat,
          "ModeratorAdded",
          [
            getSlugHash(TEST_SLUG),
            TEST_SLUG,
            getAddress(bob.account.address),
            getAddress(alice.account.address),
          ]
        );
      });

      it("should revert with zero address", async function () {
        await assert.rejects(
          onChat.write.addModerator(
            [TEST_SLUG, "0x0000000000000000000000000000000000000000"],
            {
              account: alice.account,
            }
          ),
          /OnChat__InvalidParams/
        );
      });

      it("should revert if user is already a moderator", async function () {
        await onChat.write.addModerator([TEST_SLUG, bob.account.address], {
          account: alice.account,
        });

        await assert.rejects(
          onChat.write.addModerator([TEST_SLUG, bob.account.address], {
            account: alice.account,
          }),
          /OnChat__AlreadyModerator/
        );
      });

      it("should revert if user is not a member", async function () {
        await assert.rejects(
          onChat.write.addModerator([TEST_SLUG, deployer.account.address], {
            account: alice.account,
          }),
          /OnChat__NotMember/
        );
      });

      it("should revert if called by non-owner", async function () {
        await assert.rejects(
          onChat.write.addModerator([TEST_SLUG, carol.account.address], {
            account: bob.account,
          }),
          /OnChat__NotChannelOwner/
        );
      });

      it("should revert if called by moderator (not owner)", async function () {
        await onChat.write.addModerator([TEST_SLUG, bob.account.address], {
          account: alice.account,
        });

        await assert.rejects(
          onChat.write.addModerator([TEST_SLUG, carol.account.address], {
            account: bob.account,
          }),
          /OnChat__NotChannelOwner/
        );
      });
    }); // addModerator

    describe("removeModerator", function () {
      beforeEach(async function () {
        await onChat.write.addModerator([TEST_SLUG, bob.account.address], {
          account: alice.account,
        });
      });

      it("should allow owner to remove moderator", async function () {
        await onChat.write.removeModerator([TEST_SLUG, bob.account.address], {
          account: alice.account,
        });

        const isModerator = await onChat.read.isModerator([
          TEST_SLUG,
          bob.account.address,
        ]);
        assert.equal(isModerator, false);
      });

      it("should remove moderator from channel moderators list", async function () {
        await onChat.write.removeModerator([TEST_SLUG, bob.account.address], {
          account: alice.account,
        });

        const moderators = await onChat.read.getChannelModerators([TEST_SLUG]);
        assert.equal(moderators.length, 0);
      });

      it("should emit ModeratorRemoved event", async function () {
        await viem.assertions.emitWithArgs(
          onChat.write.removeModerator([TEST_SLUG, bob.account.address], {
            account: alice.account,
          }),
          onChat,
          "ModeratorRemoved",
          [
            getSlugHash(TEST_SLUG),
            TEST_SLUG,
            getAddress(bob.account.address),
            getAddress(alice.account.address),
          ]
        );
      });

      it("should revert with zero address", async function () {
        await assert.rejects(
          onChat.write.removeModerator(
            [TEST_SLUG, "0x0000000000000000000000000000000000000000"],
            {
              account: alice.account,
            }
          ),
          /OnChat__InvalidParams/
        );
      });

      it("should revert if user is not a moderator", async function () {
        await assert.rejects(
          onChat.write.removeModerator([TEST_SLUG, carol.account.address], {
            account: alice.account,
          }),
          /OnChat__NotModerator/
        );
      });

      it("should revert if called by non-owner", async function () {
        await onChat.write.addModerator([TEST_SLUG, carol.account.address], {
          account: alice.account,
        });

        await assert.rejects(
          onChat.write.removeModerator([TEST_SLUG, carol.account.address], {
            account: bob.account,
          }),
          /OnChat__NotChannelOwner/
        );
      });
    }); // removeModerator
  }); // Moderation functions

  // ============================================
  // Claim Functions Tests
  // ============================================
  describe("Claim functions", function () {
    beforeEach(async function () {
      // Create a channel to generate some fees
      await onChat.write.createChannel([TEST_SLUG, TEST_NAME], {
        account: alice.account,
        value: CHANNEL_CREATION_FEE,
      });
    });

    describe("claimOwnerBalance", function () {
      it("should allow owner to claim balance", async function () {
        const ownerBalance = await onChat.read.ownerBalances([
          alice.account.address,
        ]);
        assert.ok(ownerBalance > 0n);

        const initialBalance = await publicClient.getBalance({
          address: alice.account.address,
        });

        const tx = await onChat.write.claimOwnerBalance({
          account: alice.account,
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: tx,
        });
        const gasUsed =
          BigInt(receipt.gasUsed) * BigInt(receipt.effectiveGasPrice);

        const finalBalance = await publicClient.getBalance({
          address: alice.account.address,
        });

        assert.equal(finalBalance, initialBalance + ownerBalance - gasUsed);
      });

      it("should reset owner balance to zero after claim", async function () {
        await onChat.write.claimOwnerBalance({
          account: alice.account,
        });

        const newBalance = await onChat.read.ownerBalances([
          alice.account.address,
        ]);
        assert.equal(newBalance, 0n);
      });

      it("should emit OwnerBalanceClaimed event", async function () {
        const ownerBalance = await onChat.read.ownerBalances([
          alice.account.address,
        ]);

        await viem.assertions.emitWithArgs(
          onChat.write.claimOwnerBalance({
            account: alice.account,
          }),
          onChat,
          "OwnerBalanceClaimed",
          [getAddress(alice.account.address), ownerBalance]
        );
      });

      it("should revert if nothing to claim", async function () {
        await assert.rejects(
          onChat.write.claimOwnerBalance({
            account: bob.account,
          }),
          /OnChat__NothingToClaim/
        );
      });
    }); // claimOwnerBalance

    describe("claimTreasuryBalance", function () {
      it("should allow treasury to claim balance", async function () {
        const treasuryBalance = await onChat.read.treasuryBalance();
        assert.ok(treasuryBalance > 0n);

        const initialBalance = await publicClient.getBalance({
          address: deployer.account.address,
        });

        const tx = await onChat.write.claimTreasuryBalance({
          account: deployer.account,
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: tx,
        });
        const gasUsed =
          BigInt(receipt.gasUsed) * BigInt(receipt.effectiveGasPrice);

        const finalBalance = await publicClient.getBalance({
          address: deployer.account.address,
        });

        assert.equal(finalBalance, initialBalance + treasuryBalance - gasUsed);
      });

      it("should reset treasury balance to zero after claim", async function () {
        await onChat.write.claimTreasuryBalance({
          account: deployer.account,
        });

        const newBalance = await onChat.read.treasuryBalance();
        assert.equal(newBalance, 0n);
      });

      it("should emit TreasuryBalanceClaimed event", async function () {
        const treasuryBalance = await onChat.read.treasuryBalance();

        await viem.assertions.emitWithArgs(
          onChat.write.claimTreasuryBalance({
            account: deployer.account,
          }),
          onChat,
          "TreasuryBalanceClaimed",
          [getAddress(deployer.account.address), treasuryBalance]
        );
      });

      it("should revert if called by non-treasury", async function () {
        await assert.rejects(
          onChat.write.claimTreasuryBalance({
            account: alice.account,
          }),
          /OnChat__InvalidParams\("not treasury"\)/
        );
      });

      it("should revert if nothing to claim", async function () {
        // First claim to empty the balance
        await onChat.write.claimTreasuryBalance({
          account: deployer.account,
        });

        await assert.rejects(
          onChat.write.claimTreasuryBalance({
            account: deployer.account,
          }),
          /OnChat__NothingToClaim/
        );
      });
    }); // claimTreasuryBalance
  }); // Claim functions

  // ============================================
  // View Functions Tests
  // ============================================
  describe("View functions", function () {
    beforeEach(async function () {
      // Create multiple channels
      await onChat.write.createChannel([TEST_SLUG, TEST_NAME], {
        account: alice.account,
        value: CHANNEL_CREATION_FEE,
      });
      await onChat.write.createChannel([TEST_SLUG_2, TEST_NAME_2], {
        account: bob.account,
        value: CHANNEL_CREATION_FEE,
      });

      // Have users join and send messages
      await onChat.write.joinChannel([TEST_SLUG], { account: bob.account });

      const messageFee = await onChat.read.calculateMessageFee([
        BigInt(TEST_MESSAGE.length),
      ]);
      await onChat.write.sendMessage([TEST_SLUG, TEST_MESSAGE], {
        account: alice.account,
        value: messageFee,
      });
      await onChat.write.sendMessage([TEST_SLUG, TEST_MESSAGE_2], {
        account: bob.account,
        value: await onChat.read.calculateMessageFee([
          BigInt(TEST_MESSAGE_2.length),
        ]),
      });
    });

    describe("getChannel", function () {
      it("should return correct channel info", async function () {
        const channel = await onChat.read.getChannel([TEST_SLUG]);

        assert.equal(channel.slug, TEST_SLUG);
        assert.equal(channel.name, TEST_NAME);
        assert.equal(
          channel.owner.toLowerCase(),
          alice.account.address.toLowerCase()
        );
        assert.equal(channel.memberCount, 2n); // alice and bob
        assert.equal(channel.messageCount, 2n);
      });

      it("should revert for non-existent channel", async function () {
        await assert.rejects(
          onChat.read.getChannel(["nonexistent"]),
          /OnChat__ChannelNotFound/
        );
      });
    }); // getChannel

    describe("getLatestChannels", function () {
      it("should return channels in reverse chronological order", async function () {
        const channels = await onChat.read.getLatestChannels([0n, 10n]);

        assert.equal(channels.length, 2);
        assert.equal(channels[0].slug, TEST_SLUG_2); // newest first
        assert.equal(channels[1].slug, TEST_SLUG);
      });

      it("should handle pagination correctly", async function () {
        const channels = await onChat.read.getLatestChannels([1n, 10n]);

        assert.equal(channels.length, 1);
        assert.equal(channels[0].slug, TEST_SLUG);
      });

      it("should return empty array when offset >= length", async function () {
        const channels = await onChat.read.getLatestChannels([10n, 10n]);
        assert.equal(channels.length, 0);
      });

      it("should limit results to specified limit", async function () {
        const channels = await onChat.read.getLatestChannels([0n, 1n]);
        assert.equal(channels.length, 1);
      });
    }); // getLatestChannels

    describe("getLatestMessages", function () {
      it("should return messages in reverse chronological order", async function () {
        const messages = await onChat.read.getLatestMessages([
          TEST_SLUG,
          0n,
          10n,
        ]);

        assert.equal(messages.length, 2);
        assert.equal(messages[0].content, TEST_MESSAGE_2); // newest first
        assert.equal(messages[1].content, TEST_MESSAGE);
      });

      it("should handle pagination correctly", async function () {
        const messages = await onChat.read.getLatestMessages([
          TEST_SLUG,
          1n,
          10n,
        ]);

        assert.equal(messages.length, 1);
        assert.equal(messages[0].content, TEST_MESSAGE);
      });

      it("should return empty array for channel with no messages", async function () {
        const messages = await onChat.read.getLatestMessages([
          TEST_SLUG_2,
          0n,
          10n,
        ]);
        assert.equal(messages.length, 0);
      });
    }); // getLatestMessages

    describe("getMessagesRange", function () {
      it("should return messages in chronological order", async function () {
        const messages = await onChat.read.getMessagesRange([
          TEST_SLUG,
          0n,
          10n,
        ]);

        assert.equal(messages.length, 2);
        assert.equal(messages[0].content, TEST_MESSAGE); // oldest first
        assert.equal(messages[1].content, TEST_MESSAGE_2);
      });

      it("should handle partial range", async function () {
        const messages = await onChat.read.getMessagesRange([
          TEST_SLUG,
          0n,
          1n,
        ]);

        assert.equal(messages.length, 1);
        assert.equal(messages[0].content, TEST_MESSAGE);
      });

      it("should cap endIndex at array length", async function () {
        const messages = await onChat.read.getMessagesRange([
          TEST_SLUG,
          0n,
          100n,
        ]);
        assert.equal(messages.length, 2);
      });

      it("should return empty array if startIndex >= endIndex", async function () {
        const messages = await onChat.read.getMessagesRange([
          TEST_SLUG,
          5n,
          5n,
        ]);
        assert.equal(messages.length, 0);
      });
    }); // getMessagesRange

    describe("getChannelMembers", function () {
      it("should return channel members with pagination", async function () {
        const members = await onChat.read.getChannelMembers([
          TEST_SLUG,
          0n,
          10n,
        ]);

        assert.equal(members.length, 2);
      });

      it("should handle pagination offset", async function () {
        const members = await onChat.read.getChannelMembers([
          TEST_SLUG,
          1n,
          10n,
        ]);

        assert.equal(members.length, 1);
      });
    }); // getChannelMembers

    describe("getUserChannels", function () {
      it("should return user's joined channels", async function () {
        const channels = await onChat.read.getUserChannels([
          alice.account.address,
          0n,
          10n,
        ]);

        assert.equal(channels.length, 1);
        assert.equal(channels[0], TEST_SLUG);
      });

      it("should return multiple channels if user joined multiple", async function () {
        // Carol joins both channels
        await onChat.write.joinChannel([TEST_SLUG], { account: carol.account });
        await onChat.write.joinChannel([TEST_SLUG_2], {
          account: carol.account,
        });

        const channels = await onChat.read.getUserChannels([
          carol.account.address,
          0n,
          10n,
        ]);

        assert.equal(channels.length, 2);
      });

      it("should return channels in reverse order (newest first)", async function () {
        // Carol joins both channels in order
        await onChat.write.joinChannel([TEST_SLUG], { account: carol.account });
        await onChat.write.joinChannel([TEST_SLUG_2], {
          account: carol.account,
        });

        const channels = await onChat.read.getUserChannels([
          carol.account.address,
          0n,
          10n,
        ]);

        assert.equal(channels[0], TEST_SLUG_2); // joined second
        assert.equal(channels[1], TEST_SLUG); // joined first
      });
    }); // getUserChannels

    describe("getBannedUsers", function () {
      it("should return banned users list", async function () {
        await onChat.write.banUser([TEST_SLUG, bob.account.address], {
          account: alice.account,
        });

        const bannedUsers = await onChat.read.getBannedUsers([TEST_SLUG]);
        assert.equal(bannedUsers.length, 1);
        assert.equal(
          bannedUsers[0].toLowerCase(),
          bob.account.address.toLowerCase()
        );
      });

      it("should return empty array if no users are banned", async function () {
        const bannedUsers = await onChat.read.getBannedUsers([TEST_SLUG]);
        assert.equal(bannedUsers.length, 0);
      });
    }); // getBannedUsers

    describe("Helper view functions", function () {
      it("isMember should return correct status", async function () {
        assert.equal(
          await onChat.read.isMember([TEST_SLUG, alice.account.address]),
          true
        );
        assert.equal(
          await onChat.read.isMember([TEST_SLUG, carol.account.address]),
          false
        );
      });

      it("isModerator should return correct status", async function () {
        assert.equal(
          await onChat.read.isModerator([TEST_SLUG, bob.account.address]),
          false
        );

        await onChat.write.addModerator([TEST_SLUG, bob.account.address], {
          account: alice.account,
        });

        assert.equal(
          await onChat.read.isModerator([TEST_SLUG, bob.account.address]),
          true
        );
      });

      it("isBanned should return correct status", async function () {
        assert.equal(
          await onChat.read.isBanned([TEST_SLUG, bob.account.address]),
          false
        );

        await onChat.write.banUser([TEST_SLUG, bob.account.address], {
          account: alice.account,
        });

        assert.equal(
          await onChat.read.isBanned([TEST_SLUG, bob.account.address]),
          true
        );
      });

      it("getChannelCount should return correct count", async function () {
        const count = await onChat.read.getChannelCount();
        assert.equal(count, 2n);
      });

      it("getMessageCount should return correct count", async function () {
        const count = await onChat.read.getMessageCount([TEST_SLUG]);
        assert.equal(count, 2n);
      });

      it("getChannelMemberCount should return correct count", async function () {
        const count = await onChat.read.getChannelMemberCount([TEST_SLUG]);
        assert.equal(count, 2n);
      });

      it("getUserChannelCount should return correct count", async function () {
        // bob is a member of 2 channels: TEST_SLUG (joined) and TEST_SLUG_2 (owner/auto-joined)
        const count = await onChat.read.getUserChannelCount([
          bob.account.address,
        ]);
        assert.equal(count, 2n);
      });

      it("calculateMessageFee should return correct fee", async function () {
        const contentLength = 100n;
        const expectedFee =
          MESSAGE_FEE_BASE + contentLength * MESSAGE_FEE_PER_CHAR;

        const fee = await onChat.read.calculateMessageFee([contentLength]);
        assert.equal(fee, expectedFee);
      });
    }); // Helper view functions
  }); // View functions

  // ============================================
  // Edge Cases and Integration Tests
  // ============================================
  describe("Edge cases and integration tests", function () {
    it("should handle zero fees correctly", async function () {
      // Set all fees to zero
      await onChat.write.setChannelCreationFee([0n], {
        account: deployer.account,
      });
      await onChat.write.setMessageFeeBase([0n], {
        account: deployer.account,
      });
      await onChat.write.setMessageFeePerChar([0n], {
        account: deployer.account,
      });

      // Create channel with no fee
      await onChat.write.createChannel([TEST_SLUG, TEST_NAME], {
        account: alice.account,
        value: 0n,
      });

      // Send message with no fee
      await onChat.write.sendMessage([TEST_SLUG, TEST_MESSAGE], {
        account: alice.account,
        value: 0n,
      });

      const messageCount = await onChat.read.getMessageCount([TEST_SLUG]);
      assert.equal(messageCount, 1n);
    });

    it("should handle channel owner joining their own channel (no-op)", async function () {
      await onChat.write.createChannel([TEST_SLUG, TEST_NAME], {
        account: alice.account,
        value: CHANNEL_CREATION_FEE,
      });

      // Owner is already a member, should revert
      await assert.rejects(
        onChat.write.joinChannel([TEST_SLUG], {
          account: alice.account,
        }),
        /OnChat__AlreadyMember/
      );
    });

    it("should allow unbanned user to rejoin channel", async function () {
      await onChat.write.createChannel([TEST_SLUG, TEST_NAME], {
        account: alice.account,
        value: CHANNEL_CREATION_FEE,
      });

      await onChat.write.joinChannel([TEST_SLUG], { account: bob.account });

      // Ban and unban bob
      await onChat.write.banUser([TEST_SLUG, bob.account.address], {
        account: alice.account,
      });
      await onChat.write.unbanUser([TEST_SLUG, bob.account.address], {
        account: alice.account,
      });

      // Bob should be able to rejoin
      await onChat.write.joinChannel([TEST_SLUG], { account: bob.account });

      const isMember = await onChat.read.isMember([
        TEST_SLUG,
        bob.account.address,
      ]);
      assert.equal(isMember, true);
    });

    it("should accumulate balances across multiple operations", async function () {
      await onChat.write.createChannel([TEST_SLUG, TEST_NAME], {
        account: alice.account,
        value: CHANNEL_CREATION_FEE,
      });

      const initialOwnerBalance = await onChat.read.ownerBalances([
        alice.account.address,
      ]);

      // Send multiple messages
      const messageFee = await onChat.read.calculateMessageFee([
        BigInt(TEST_MESSAGE.length),
      ]);

      for (let i = 0; i < 3; i++) {
        await onChat.write.sendMessage([TEST_SLUG, TEST_MESSAGE], {
          account: alice.account,
          value: messageFee,
        });
      }

      const finalOwnerBalance = await onChat.read.ownerBalances([
        alice.account.address,
      ]);
      const expectedIncrease = ((messageFee * 8000n) / 10000n) * 3n;

      assert.equal(finalOwnerBalance - initialOwnerBalance, expectedIncrease);
    });

    it("should handle unicode characters in messages", async function () {
      await onChat.write.createChannel([TEST_SLUG, TEST_NAME], {
        account: alice.account,
        value: CHANNEL_CREATION_FEE,
      });

      const unicodeMessage = "Hello 🌍 世界 مرحبا";
      const contentLength = Buffer.from(unicodeMessage, "utf8").length;
      const messageFee = await onChat.read.calculateMessageFee([
        BigInt(contentLength),
      ]);

      await onChat.write.sendMessage([TEST_SLUG, unicodeMessage], {
        account: alice.account,
        value: messageFee,
      });

      const messages = await onChat.read.getLatestMessages([
        TEST_SLUG,
        0n,
        10n,
      ]);
      assert.equal(messages[0].content, unicodeMessage);
    });

    it("should handle long messages", async function () {
      await onChat.write.createChannel([TEST_SLUG, TEST_NAME], {
        account: alice.account,
        value: CHANNEL_CREATION_FEE,
      });

      const longMessage = "a".repeat(1000);
      const messageFee = await onChat.read.calculateMessageFee([
        BigInt(longMessage.length),
      ]);

      await onChat.write.sendMessage([TEST_SLUG, longMessage], {
        account: alice.account,
        value: messageFee,
      });

      const messages = await onChat.read.getLatestMessages([
        TEST_SLUG,
        0n,
        10n,
      ]);
      assert.equal(messages[0].content, longMessage);
    });
  }); // Edge cases and integration tests
}); // OnChat
