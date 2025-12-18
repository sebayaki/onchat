// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title OnChat
 * @notice On-chain chatting protocol on Base
 * @dev All data is queryable via RPC calls with pagination support.
 *      Uses EnumerableSet for O(1) add/remove/contains operations.
 *      Structs are packed for optimal gas efficiency.
 */
contract OnChat is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    // MARK: - Errors
    error OnChat__InvalidParams(string param);
    error OnChat__ChannelAlreadyExists();
    error OnChat__ChannelNotFound();
    error OnChat__InsufficientPayment();
    error OnChat__NotChannelOwner();
    error OnChat__NotChannelOwnerOrModerator();
    error OnChat__UserBanned();
    error OnChat__UserNotBanned();
    error OnChat__AlreadyModerator();
    error OnChat__NotModerator();
    error OnChat__AlreadyMember();
    error OnChat__NotMember();
    error OnChat__MessageNotFound();
    error OnChat__NothingToClaim();
    error OnChat__TransferFailed();

    // MARK: - Structs (Gas-optimized packing)

    /**
     * @notice Message struct - packed into 2 storage slots
     */
    struct Message {
        address sender; // 20 bytes
        uint40 timestamp; // 5 bytes  - sufficient until year 36812
        bool isHidden; // 1 byte
        string content; // separate slot (dynamic)
    }

    /**
     * @notice Channel struct - packed into 2 storage slots
     */
    struct Channel {
        address owner; // 20 bytes
        uint40 createdAt; // 5 bytes  - sufficient until year 36812
        bool exists; // 1 byte
        string name; // separate slot (dynamic)
    }

    /**
     * @notice ChannelInfo struct for view function returns - packed into 4 storage slots
     */
    struct ChannelInfo {
        string slug;
        address owner;
        string name;
        uint40 createdAt; // 5 bytes - sufficient until year 36812
        uint40 memberCount; // 5 bytes - up to ~1.1 trillion members
        uint64 messageCount; // 8 bytes - up to ~18 quintillion messages
    }

    // MARK: - Constants
    uint256 public constant OWNER_SHARE_BP = 8000; // 80%
    uint256 public constant TREASURY_SHARE_BP = 2000; // 20%
    uint256 private constant BP_DENOMINATOR = 10000;

    // MARK: - Immutables
    address public immutable TREASURY_WALLET;

    // MARK: - State Variables

    uint256 public channelCreationFee;
    uint256 public messageFeeBase;
    uint256 public messageFeePerChar;

    /// @notice All channel slugs in registration order
    string[] public channelSlugs;

    /// @notice Channel slug => Channel data
    mapping(string => Channel) private _channels;

    /// @notice Channel slug => Messages array
    mapping(string => Message[]) private _channelMessages;

    /// @notice Channel slug => Moderators set (O(1) operations)
    mapping(string => EnumerableSet.AddressSet) private _channelModerators;

    /// @notice Channel slug => Members set (O(1) operations)
    mapping(string => EnumerableSet.AddressSet) private _channelMembers;

    /// @notice Channel slug => Banned users set (O(1) operations)
    mapping(string => EnumerableSet.AddressSet) private _channelBannedUsers;

    /// @notice User => Joined channel slug hashes (O(1) operations)
    mapping(address => EnumerableSet.Bytes32Set) private _userChannelHashes;

    /// @notice Slug hash => Slug string (for reverse lookup)
    mapping(bytes32 => string) private _slugHashToSlug;

    /// @notice Channel owner address => Claimable balance (ETH)
    mapping(address => uint256) public ownerBalances;

    /// @notice Treasury claimable balance (ETH)
    uint256 public treasuryBalance;

    // MARK: - Events
    event ChannelCreated(
        string indexed slugHash,
        string slug,
        address indexed owner,
        string name
    );
    event ChannelJoined(
        string indexed slugHash,
        string slug,
        address indexed user
    );
    event ChannelLeft(
        string indexed slugHash,
        string slug,
        address indexed user
    );
    event MessageSent(
        string indexed slugHash,
        string slug,
        address indexed sender,
        uint256 indexed messageIndex,
        string content
    );
    event MessageHidden(
        string indexed slugHash,
        string slug,
        uint256 indexed messageIndex,
        address indexed hiddenBy
    );
    event MessageUnhidden(
        string indexed slugHash,
        string slug,
        uint256 indexed messageIndex,
        address indexed unhiddenBy
    );
    event UserBanned(
        string indexed slugHash,
        string slug,
        address indexed user,
        address indexed bannedBy
    );
    event UserUnbanned(
        string indexed slugHash,
        string slug,
        address indexed user,
        address indexed unbannedBy
    );
    event ModeratorAdded(
        string indexed slugHash,
        string slug,
        address indexed moderator,
        address indexed addedBy
    );
    event ModeratorRemoved(
        string indexed slugHash,
        string slug,
        address indexed moderator,
        address indexed removedBy
    );
    event OwnerBalanceClaimed(address indexed owner, uint256 amount);
    event TreasuryBalanceClaimed(address indexed treasury, uint256 amount);
    event ChannelCreationFeeUpdated(uint256 newFee);
    event MessageFeeBaseUpdated(uint256 newFee);
    event MessageFeePerCharUpdated(uint256 newFee);

    // MARK: - Constructor
    /**
     * @notice Initializes the OnChat contract
     * @param treasuryWallet Address to receive treasury share of fees
     * @param initialChannelCreationFee Initial fee to create a channel (in Wei)
     * @param initialMessageFeeBase Base fee for sending a message (in Wei)
     * @param initialMessageFeePerChar Fee per character in message (in Wei)
     */
    constructor(
        address treasuryWallet,
        uint256 initialChannelCreationFee,
        uint256 initialMessageFeeBase,
        uint256 initialMessageFeePerChar
    ) Ownable(msg.sender) {
        if (treasuryWallet == address(0))
            revert OnChat__InvalidParams("zero treasury");

        TREASURY_WALLET = treasuryWallet;
        channelCreationFee = initialChannelCreationFee;
        messageFeeBase = initialMessageFeeBase;
        messageFeePerChar = initialMessageFeePerChar;
    }

    // MARK: - Modifiers
    modifier onlyExistingChannel(string calldata slug) {
        if (!_channels[slug].exists) revert OnChat__ChannelNotFound();
        _;
    }

    modifier onlyChannelOwner(string calldata slug) {
        if (_channels[slug].owner != msg.sender)
            revert OnChat__NotChannelOwner();
        _;
    }

    modifier onlyChannelOwnerOrModerator(string calldata slug) {
        if (
            _channels[slug].owner != msg.sender &&
            !_channelModerators[slug].contains(msg.sender)
        ) {
            revert OnChat__NotChannelOwnerOrModerator();
        }
        _;
    }

    modifier notBanned(string calldata slug) {
        if (_channelBannedUsers[slug].contains(msg.sender))
            revert OnChat__UserBanned();
        _;
    }

    // MARK: - Admin Functions

    /**
     * @notice Updates the channel creation fee
     * @param newFee New fee amount in Wei
     */
    function setChannelCreationFee(uint256 newFee) external onlyOwner {
        channelCreationFee = newFee;
        emit ChannelCreationFeeUpdated(newFee);
    }

    /**
     * @notice Updates the base message fee
     * @param newFee New fee amount in Wei
     */
    function setMessageFeeBase(uint256 newFee) external onlyOwner {
        messageFeeBase = newFee;
        emit MessageFeeBaseUpdated(newFee);
    }

    /**
     * @notice Updates the per-character message fee
     * @param newFee New fee amount in Wei
     */
    function setMessageFeePerChar(uint256 newFee) external onlyOwner {
        messageFeePerChar = newFee;
        emit MessageFeePerCharUpdated(newFee);
    }

    // MARK: - Channel Functions

    /**
     * @notice Creates a new channel
     * @param slug Unique channel identifier (lowercase letters and hyphens, 1-20 chars)
     * @param name Display name for the channel
     * @dev Requires payment of channelCreationFee
     */
    function createChannel(
        string calldata slug,
        string calldata name
    ) external payable {
        // Validate slug format: [a-z-]{1,20}
        bytes memory slugBytes = bytes(slug);
        uint256 slugLength = slugBytes.length;

        if (slugLength == 0 || slugLength > 20) {
            revert OnChat__InvalidParams("slug length must be 1-20");
        }

        for (uint256 i = 0; i < slugLength; ) {
            bytes1 char = slugBytes[i];
            // Must be lowercase letter (a-z) or hyphen (-)
            if (!((char >= 0x61 && char <= 0x7A) || char == 0x2D)) {
                revert OnChat__InvalidParams("slug must be [a-z-]");
            }
            unchecked {
                ++i;
            }
        }

        // Validate name
        if (bytes(name).length == 0) {
            revert OnChat__InvalidParams("empty name");
        }

        // Check channel doesn't already exist
        if (_channels[slug].exists) {
            revert OnChat__ChannelAlreadyExists();
        }

        // Cache fee to avoid multiple SLOADs
        uint256 fee = channelCreationFee;

        // Check payment
        if (msg.value < fee) {
            revert OnChat__InsufficientPayment();
        }

        // Create channel (packed struct)
        _channels[slug] = Channel({
            owner: msg.sender,
            createdAt: uint40(block.timestamp),
            exists: true,
            name: name
        });

        channelSlugs.push(slug);

        // Store slug hash mapping for reverse lookup
        bytes32 slugHash = keccak256(bytes(slug));
        _slugHashToSlug[slugHash] = slug;

        // Auto-join creator to the channel (O(1) operations)
        _channelMembers[slug].add(msg.sender);
        _userChannelHashes[msg.sender].add(slugHash);

        // Split creation fee: 80% to owner (themselves initially), 20% to treasury
        if (fee > 0) {
            uint256 ownerShare;
            uint256 treasuryShare;
            unchecked {
                ownerShare = (fee * OWNER_SHARE_BP) / BP_DENOMINATOR;
                treasuryShare = fee - ownerShare;
            }

            ownerBalances[msg.sender] += ownerShare;
            treasuryBalance += treasuryShare;
        }

        // Refund excess payment
        if (msg.value > fee) {
            unchecked {
                uint256 refund = msg.value - fee;
                (bool success, ) = msg.sender.call{value: refund}("");
                if (!success) revert OnChat__TransferFailed();
            }
        }

        emit ChannelCreated(slug, slug, msg.sender, name);
    }

    /**
     * @notice Join a channel
     * @param slug Channel slug to join
     */
    function joinChannel(
        string calldata slug
    ) external onlyExistingChannel(slug) notBanned(slug) {
        if (_channelMembers[slug].contains(msg.sender))
            revert OnChat__AlreadyMember();

        bytes32 slugHash = keccak256(bytes(slug));

        // O(1) add operations
        _channelMembers[slug].add(msg.sender);
        _userChannelHashes[msg.sender].add(slugHash);

        emit ChannelJoined(slug, slug, msg.sender);
    }

    /**
     * @notice Leave a channel
     * @param slug Channel slug to leave
     */
    function leaveChannel(
        string calldata slug
    ) external onlyExistingChannel(slug) {
        if (!_channelMembers[slug].contains(msg.sender))
            revert OnChat__NotMember();

        bytes32 slugHash = keccak256(bytes(slug));

        // O(1) remove operations
        _channelMembers[slug].remove(msg.sender);
        _userChannelHashes[msg.sender].remove(slugHash);

        // Remove moderator status if applicable (O(1))
        _channelModerators[slug].remove(msg.sender);

        emit ChannelLeft(slug, slug, msg.sender);
    }

    // MARK: - Message Functions

    /**
     * @notice Send a message to a channel
     * @param slug Channel slug
     * @param content Message content
     * @dev Requires payment of messageFeeBase + (content.length * messageFeePerChar)
     */
    function sendMessage(
        string calldata slug,
        string calldata content
    ) external payable onlyExistingChannel(slug) notBanned(slug) {
        if (!_channelMembers[slug].contains(msg.sender))
            revert OnChat__NotMember();

        uint256 contentLength = bytes(content).length;
        if (contentLength == 0) revert OnChat__InvalidParams("empty content");

        // Cache fees to avoid multiple SLOADs
        uint256 feeBase = messageFeeBase;
        uint256 feePerChar = messageFeePerChar;

        // Calculate message fee
        uint256 messageFee;
        unchecked {
            messageFee = feeBase + (contentLength * feePerChar);
        }

        if (msg.value < messageFee) {
            revert OnChat__InsufficientPayment();
        }

        // Store message (packed struct)
        uint256 messageIndex = _channelMessages[slug].length;
        _channelMessages[slug].push(
            Message({
                sender: msg.sender,
                timestamp: uint40(block.timestamp),
                isHidden: false,
                content: content
            })
        );

        // Split fee: 80% to channel owner, 20% to treasury
        if (messageFee > 0) {
            address channelOwner = _channels[slug].owner;
            uint256 ownerShare;
            uint256 treasuryShare;
            unchecked {
                ownerShare = (messageFee * OWNER_SHARE_BP) / BP_DENOMINATOR;
                treasuryShare = messageFee - ownerShare;
            }

            ownerBalances[channelOwner] += ownerShare;
            treasuryBalance += treasuryShare;
        }

        // Refund excess payment
        if (msg.value > messageFee) {
            unchecked {
                uint256 refund = msg.value - messageFee;
                (bool success, ) = msg.sender.call{value: refund}("");
                if (!success) revert OnChat__TransferFailed();
            }
        }

        emit MessageSent(slug, slug, msg.sender, messageIndex, content);
    }

    /**
     * @notice Hide a message (owner or moderator only)
     * @param slug Channel slug
     * @param messageIndex Index of the message to hide
     */
    function hideMessage(
        string calldata slug,
        uint256 messageIndex
    ) external onlyExistingChannel(slug) onlyChannelOwnerOrModerator(slug) {
        if (messageIndex >= _channelMessages[slug].length) {
            revert OnChat__MessageNotFound();
        }

        _channelMessages[slug][messageIndex].isHidden = true;

        emit MessageHidden(slug, slug, messageIndex, msg.sender);
    }

    /**
     * @notice Unhide a message (owner or moderator only)
     * @param slug Channel slug
     * @param messageIndex Index of the message to unhide
     */
    function unhideMessage(
        string calldata slug,
        uint256 messageIndex
    ) external onlyExistingChannel(slug) onlyChannelOwnerOrModerator(slug) {
        if (messageIndex >= _channelMessages[slug].length) {
            revert OnChat__MessageNotFound();
        }

        _channelMessages[slug][messageIndex].isHidden = false;

        emit MessageUnhidden(slug, slug, messageIndex, msg.sender);
    }

    // MARK: - Moderation Functions

    /**
     * @notice Ban a user from a channel
     * @param slug Channel slug
     * @param user User address to ban
     */
    function banUser(
        string calldata slug,
        address user
    ) external onlyExistingChannel(slug) onlyChannelOwnerOrModerator(slug) {
        if (user == address(0)) revert OnChat__InvalidParams("zero address");
        if (user == _channels[slug].owner)
            revert OnChat__InvalidParams("cannot ban owner");
        if (_channelBannedUsers[slug].contains(user))
            revert OnChat__UserBanned();

        // O(1) add to banned set
        _channelBannedUsers[slug].add(user);

        // Remove from members if they are a member (O(1))
        if (_channelMembers[slug].contains(user)) {
            _channelMembers[slug].remove(user);
            bytes32 slugHash = keccak256(bytes(slug));
            _userChannelHashes[user].remove(slugHash);
        }

        // Remove moderator status if applicable (O(1))
        _channelModerators[slug].remove(user);

        emit UserBanned(slug, slug, user, msg.sender);
    }

    /**
     * @notice Unban a user from a channel
     * @param slug Channel slug
     * @param user User address to unban
     */
    function unbanUser(
        string calldata slug,
        address user
    ) external onlyExistingChannel(slug) onlyChannelOwnerOrModerator(slug) {
        if (user == address(0)) revert OnChat__InvalidParams("zero address");
        if (!_channelBannedUsers[slug].contains(user))
            revert OnChat__UserNotBanned();

        // O(1) remove from banned set
        _channelBannedUsers[slug].remove(user);

        emit UserUnbanned(slug, slug, user, msg.sender);
    }

    /**
     * @notice Add a moderator to a channel
     * @param slug Channel slug
     * @param moderator Address to make moderator
     */
    function addModerator(
        string calldata slug,
        address moderator
    ) external onlyExistingChannel(slug) onlyChannelOwner(slug) {
        if (moderator == address(0))
            revert OnChat__InvalidParams("zero address");
        if (_channelModerators[slug].contains(moderator))
            revert OnChat__AlreadyModerator();
        if (!_channelMembers[slug].contains(moderator))
            revert OnChat__NotMember();

        // O(1) add
        _channelModerators[slug].add(moderator);

        emit ModeratorAdded(slug, slug, moderator, msg.sender);
    }

    /**
     * @notice Remove a moderator from a channel
     * @param slug Channel slug
     * @param moderator Address to remove as moderator
     */
    function removeModerator(
        string calldata slug,
        address moderator
    ) external onlyExistingChannel(slug) onlyChannelOwner(slug) {
        if (moderator == address(0))
            revert OnChat__InvalidParams("zero address");
        if (!_channelModerators[slug].contains(moderator))
            revert OnChat__NotModerator();

        // O(1) remove
        _channelModerators[slug].remove(moderator);

        emit ModeratorRemoved(slug, slug, moderator, msg.sender);
    }

    // MARK: - Claim Functions

    /**
     * @notice Claim accumulated owner balance
     * @dev Channel owners can claim their share of fees
     */
    function claimOwnerBalance() external {
        uint256 amount = ownerBalances[msg.sender];
        if (amount == 0) revert OnChat__NothingToClaim();

        ownerBalances[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) revert OnChat__TransferFailed();

        emit OwnerBalanceClaimed(msg.sender, amount);
    }

    /**
     * @notice Claim treasury balance
     * @dev Only callable by TREASURY_WALLET
     */
    function claimTreasuryBalance() external {
        if (msg.sender != TREASURY_WALLET)
            revert OnChat__InvalidParams("not treasury");

        uint256 amount = treasuryBalance;
        if (amount == 0) revert OnChat__NothingToClaim();

        treasuryBalance = 0;

        (bool success, ) = TREASURY_WALLET.call{value: amount}("");
        if (!success) revert OnChat__TransferFailed();

        emit TreasuryBalanceClaimed(TREASURY_WALLET, amount);
    }

    // MARK: - View Functions

    /**
     * @notice Get channel information
     * @param slug Channel slug
     * @return info Channel information struct
     */
    function getChannel(
        string calldata slug
    ) external view returns (ChannelInfo memory info) {
        Channel storage channel = _channels[slug];
        if (!channel.exists) revert OnChat__ChannelNotFound();

        return
            ChannelInfo({
                slug: slug,
                owner: channel.owner,
                name: channel.name,
                createdAt: channel.createdAt,
                memberCount: uint40(_channelMembers[slug].length()),
                messageCount: uint64(_channelMessages[slug].length)
            });
    }

    /**
     * @notice Get total number of channels
     * @return Total channel count
     */
    function getChannelCount() external view returns (uint256) {
        return channelSlugs.length;
    }

    /**
     * @notice Get latest channels with pagination (newest first)
     * @param offset Number of channels to skip from the end
     * @param limit Maximum number of channels to return
     * @return channels Array of ChannelInfo in reverse chronological order
     */
    function getLatestChannels(
        uint256 offset,
        uint256 limit
    ) external view returns (ChannelInfo[] memory channels) {
        uint256 length = channelSlugs.length;

        if (length == 0 || offset >= length) {
            return new ChannelInfo[](0);
        }

        unchecked {
            uint256 available = length - offset;
            uint256 count = available < limit ? available : limit;

            channels = new ChannelInfo[](count);
            uint256 startIndex = length - 1 - offset;

            for (uint256 i = 0; i < count; ++i) {
                string storage slug = channelSlugs[startIndex - i];
                Channel storage channel = _channels[slug];
                channels[i] = ChannelInfo({
                    slug: slug,
                    owner: channel.owner,
                    name: channel.name,
                    createdAt: channel.createdAt,
                    memberCount: uint40(_channelMembers[slug].length()),
                    messageCount: uint64(_channelMessages[slug].length)
                });
            }
        }
    }

    /**
     * @notice Get message count for a channel
     * @param slug Channel slug
     * @return Message count
     */
    function getMessageCount(
        string calldata slug
    ) external view onlyExistingChannel(slug) returns (uint256) {
        return _channelMessages[slug].length;
    }

    /**
     * @notice Get latest messages from a channel with pagination (newest first)
     * @param slug Channel slug
     * @param offset Number of messages to skip from the end
     * @param limit Maximum number of messages to return
     * @return messages Array of Message structs in reverse chronological order
     */
    function getLatestMessages(
        string calldata slug,
        uint256 offset,
        uint256 limit
    )
        external
        view
        onlyExistingChannel(slug)
        returns (Message[] memory messages)
    {
        Message[] storage channelMsgs = _channelMessages[slug];
        uint256 length = channelMsgs.length;

        if (length == 0 || offset >= length) {
            return new Message[](0);
        }

        unchecked {
            uint256 available = length - offset;
            uint256 count = available < limit ? available : limit;

            messages = new Message[](count);
            uint256 startIndex = length - 1 - offset;

            for (uint256 i = 0; i < count; ++i) {
                messages[i] = channelMsgs[startIndex - i];
            }
        }
    }

    /**
     * @notice Get messages from a specific range (oldest first)
     * @param slug Channel slug
     * @param startIndex Start index (inclusive)
     * @param endIndex End index (exclusive)
     * @return messages Array of Message structs
     */
    function getMessagesRange(
        string calldata slug,
        uint256 startIndex,
        uint256 endIndex
    )
        external
        view
        onlyExistingChannel(slug)
        returns (Message[] memory messages)
    {
        Message[] storage channelMsgs = _channelMessages[slug];
        uint256 length = channelMsgs.length;

        if (startIndex >= length || startIndex >= endIndex) {
            return new Message[](0);
        }

        unchecked {
            uint256 actualEnd = endIndex > length ? length : endIndex;
            uint256 count = actualEnd - startIndex;

            messages = new Message[](count);
            for (uint256 i = 0; i < count; ++i) {
                messages[i] = channelMsgs[startIndex + i];
            }
        }
    }

    /**
     * @notice Get channel members with pagination
     * @param slug Channel slug
     * @param offset Number of members to skip
     * @param limit Maximum number of members to return
     * @return members Array of member addresses
     */
    function getChannelMembers(
        string calldata slug,
        uint256 offset,
        uint256 limit
    )
        external
        view
        onlyExistingChannel(slug)
        returns (address[] memory members)
    {
        EnumerableSet.AddressSet storage memberSet = _channelMembers[slug];
        uint256 length = memberSet.length();

        if (length == 0 || offset >= length) {
            return new address[](0);
        }

        unchecked {
            uint256 available = length - offset;
            uint256 count = available < limit ? available : limit;

            members = new address[](count);
            for (uint256 i = 0; i < count; ++i) {
                members[i] = memberSet.at(offset + i);
            }
        }
    }

    /**
     * @notice Get channel member count
     * @param slug Channel slug
     * @return Member count
     */
    function getChannelMemberCount(
        string calldata slug
    ) external view onlyExistingChannel(slug) returns (uint256) {
        return _channelMembers[slug].length();
    }

    /**
     * @notice Get all moderators for a channel
     * @param slug Channel slug
     * @return moderators Array of moderator addresses
     */
    function getChannelModerators(
        string calldata slug
    )
        external
        view
        onlyExistingChannel(slug)
        returns (address[] memory moderators)
    {
        return _channelModerators[slug].values();
    }

    /**
     * @notice Get all banned users for a channel
     * @param slug Channel slug
     * @return bannedUsers Array of banned user addresses
     */
    function getBannedUsers(
        string calldata slug
    )
        external
        view
        onlyExistingChannel(slug)
        returns (address[] memory bannedUsers)
    {
        return _channelBannedUsers[slug].values();
    }

    /**
     * @notice Get channels joined by a user with pagination (newest first)
     * @param user User address
     * @param offset Number of channels to skip from the end
     * @param limit Maximum number of channels to return
     * @return channels Array of channel slugs
     */
    function getUserChannels(
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (string[] memory channels) {
        EnumerableSet.Bytes32Set storage hashSet = _userChannelHashes[user];
        uint256 length = hashSet.length();

        if (length == 0 || offset >= length) {
            return new string[](0);
        }

        unchecked {
            uint256 available = length - offset;
            uint256 count = available < limit ? available : limit;

            channels = new string[](count);
            uint256 startIndex = length - 1 - offset;

            for (uint256 i = 0; i < count; ++i) {
                bytes32 slugHash = hashSet.at(startIndex - i);
                channels[i] = _slugHashToSlug[slugHash];
            }
        }
    }

    /**
     * @notice Get count of channels joined by a user
     * @param user User address
     * @return Channel count
     */
    function getUserChannelCount(address user) external view returns (uint256) {
        return _userChannelHashes[user].length();
    }

    /**
     * @notice Check if a user is a member of a channel
     * @param slug Channel slug
     * @param user User address
     * @return True if user is a member
     */
    function isMember(
        string calldata slug,
        address user
    ) external view returns (bool) {
        return _channelMembers[slug].contains(user);
    }

    /**
     * @notice Check if a user is a moderator of a channel
     * @param slug Channel slug
     * @param user User address
     * @return True if user is a moderator
     */
    function isModerator(
        string calldata slug,
        address user
    ) external view returns (bool) {
        return _channelModerators[slug].contains(user);
    }

    /**
     * @notice Check if a user is banned from a channel
     * @param slug Channel slug
     * @param user User address
     * @return True if user is banned
     */
    function isBanned(
        string calldata slug,
        address user
    ) external view returns (bool) {
        return _channelBannedUsers[slug].contains(user);
    }

    /**
     * @notice Calculate message fee for a given content length
     * @param contentLength Length of message content in bytes
     * @return fee Total fee required
     */
    function calculateMessageFee(
        uint256 contentLength
    ) external view returns (uint256 fee) {
        unchecked {
            return messageFeeBase + (contentLength * messageFeePerChar);
        }
    }
}
