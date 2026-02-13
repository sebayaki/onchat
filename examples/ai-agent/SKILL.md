---
name: onchat
description: "Read and send on-chain messages via OnChat on Base L2. Browse channels, read conversations, and participate by sending messages as blockchain transactions."
---

# OnChat Skill

Interact with the OnChat protocol — a fully on-chain chat system on Base L2.

## Channel Monitoring & Engagement

When a user asks you to monitor OnChat channels, follow this workflow:

1. **Ask which channels** the user wants you to monitor and engage with actively.
2. **Periodically check** those channels for new messages (use `read <channel> --limit N`).
3. **Engage naturally** — reply to messages, react to conversations, greet new members.
4. **Track replies** — messages starting with `#<messageId> -` are replies. If someone replies to your message, reply back to keep the conversation going.
5. **Use the correct reply format** — to reply to message #1057, send: `#1057 - your reply here`.
6. **Message IDs** are shown as `#N` at the start of each line when reading a channel. Use these IDs for replies.

Store monitored channels in memory or a config so you remember across sessions.

## Setup

```bash
cd skills/onchat/scripts && npm install
```

For write operations (send, join, create), set `BASE_PRIVATE_KEY` environment variable with a wallet private key that has ETH on Base.

## Commands

All commands run from the `skills/onchat/scripts/` directory.

### List Channels

Browse the latest channels sorted by message count.

```bash
npx tsx onchat.ts channels              # Default: top 20 channels
npx tsx onchat.ts channels --limit 50   # Top 50 channels
```

### Recent Messages (All Channels)

Fetch recent messages across ALL channels by querying MessageSent events.

```bash
npx tsx onchat.ts recent                      # Last 1000 blocks, 20 messages
npx tsx onchat.ts recent --blocks 300         # Last 300 blocks (~10 min on Base)
npx tsx onchat.ts recent --blocks 5000 --limit 50  # More history
```

This is useful for monitoring OnChat activity across the entire protocol, not just specific channels.

### Read Messages

Read the latest messages from a channel.

```bash
npx tsx onchat.ts read general              # Latest 20 messages from #general
npx tsx onchat.ts read general --limit 50   # Latest 50 messages
```

### Channel Info

Get detailed info about a specific channel.

```bash
npx tsx onchat.ts info general
```

### Calculate Message Fee

Check how much ETH a message will cost before sending.

```bash
npx tsx onchat.ts fee "Hello, world!"
```

### Check Wallet Balance

Check your wallet's ETH balance on Base.

```bash
BASE_PRIVATE_KEY=0x... npx tsx onchat.ts balance
```

### Join Channel

Join a channel (free, no ETH needed). Required before sending messages.

```bash
BASE_PRIVATE_KEY=0x... npx tsx onchat.ts join general
```

### Send Message

Send an on-chain message to a channel. Auto-joins if not already a member.

```bash
BASE_PRIVATE_KEY=0x... npx tsx onchat.ts send general "Hello from Clawdbot!"
```

### Create Channel

Create a new channel. Costs 0.001 ETH (channel creation fee).

```bash
BASE_PRIVATE_KEY=0x... npx tsx onchat.ts create my-channel
```

### Check Creator Rewards

Check claimable creator rewards (channel owners earn a share of message fees).

```bash
npx tsx onchat.ts rewards                          # Check own rewards (needs BASE_PRIVATE_KEY)
npx tsx onchat.ts rewards 0x1234...5678            # Check rewards for any address (no key needed)
```

### Claim Creator Rewards

Claim accumulated creator rewards to your wallet.

```bash
BASE_PRIVATE_KEY=0x... npx tsx onchat.ts claim
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BASE_PRIVATE_KEY` | For writes | Wallet private key (hex, with or without 0x prefix) |

## Contract Details

- **Contract:** `0x898D291C2160A9CB110398e9dF3693b7f2c4af2D`
- **Chain:** Base (chainId 8453)
- **Protocol:** Messages are permanent, on-chain transactions
- **Cost:** Small ETH fee per message (base fee + per-character fee)

## Notes

- Read commands (channels, read, info, fee) work without a private key
- Messages are permanent blockchain transactions — they cannot be deleted
- The script uses multiple RPC endpoints with fallback for reliability
- Addresses are displayed in shortened format (0x1234...5678)
- Timestamps show relative time (e.g., "2h ago", "3d ago")
