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
    error OnChat__ZeroAddress();
    error OnChat__InvalidSlugLength();
    error OnChat__InvalidSlugChars();
    error OnChat__EmptyContent();
    error OnChat__NotTreasury();
    error OnChat__CannotBanOwner();

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
     * @notice Channel struct - packed into 1 storage slot
     */
    struct Channel {
        address owner; // 20 bytes
        uint40 createdAt; // 5 bytes  - sufficient until year 36812
        bool exists; // 1 byte
    }

    // MARK: - Constants
    uint256 public constant OWNER_SHARE_BP = 8000; // 80%
    uint256 public constant TREASURY_SHARE_BP = 2000; // 20%
    uint256 private constant BP_DENOMINATOR = 10000;

    // MARK: - State Variables

    address public treasuryWallet;

    uint256 public channelCreationFee;
    uint256 public messageFeeBase;
    uint256 public messageFeePerChar;

    /// @notice All channel slugs in registration order
    string[] public channelSlugs;

    /// @notice Channel slugHash => Channel data
    mapping(bytes32 => Channel) private _channels;

    /// @notice Channel slugHash => Messages array
    mapping(bytes32 => Message[]) private _channelMessages;

    /// @notice Channel slugHash => Moderators set (O(1) operations)
    mapping(bytes32 => EnumerableSet.AddressSet) private _channelModerators;

    /// @notice Channel slugHash => Members set (O(1) operations)
    mapping(bytes32 => EnumerableSet.AddressSet) private _channelMembers;

    /// @notice Channel slugHash => Banned users set (O(1) operations)
    mapping(bytes32 => EnumerableSet.AddressSet) private _channelBannedUsers;

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
        bytes32 indexed slugHash,
        string slug,
        address indexed owner
    );
    event ChannelJoined(bytes32 indexed slugHash, address indexed user);
    event ChannelLeft(bytes32 indexed slugHash, address indexed user);
    event MessageSent(
        bytes32 indexed slugHash,
        address indexed sender,
        uint256 indexed messageIndex,
        string content
    );
    event MessageHidden(
        bytes32 indexed slugHash,
        uint256 indexed messageIndex,
        address indexed hiddenBy
    );
    event MessageUnhidden(
        bytes32 indexed slugHash,
        uint256 indexed messageIndex,
        address indexed unhiddenBy
    );
    event UserBanned(
        bytes32 indexed slugHash,
        address indexed user,
        address indexed bannedBy
    );
    event UserUnbanned(
        bytes32 indexed slugHash,
        address indexed user,
        address indexed unbannedBy
    );
    event ModeratorAdded(
        bytes32 indexed slugHash,
        address indexed moderator,
        address indexed addedBy
    );
    event ModeratorRemoved(
        bytes32 indexed slugHash,
        address indexed moderator,
        address indexed removedBy
    );
    event OwnerBalanceClaimed(address indexed owner, uint256 amount);
    event TreasuryBalanceClaimed(address indexed treasury, uint256 amount);
    event TreasuryWalletUpdated(address indexed newTreasury);
    event ChannelCreationFeeUpdated(uint256 newFee);
    event MessageFeeBaseUpdated(uint256 newFee);
    event MessageFeePerCharUpdated(uint256 newFee);

    // MARK: - Constructor
    /**
     * @notice Initializes the OnChat contract
     * @param initialChannelCreationFee Initial fee to create a channel (in Wei)
     * @param initialMessageFeeBase Base fee for sending a message (in Wei)
     * @param initialMessageFeePerChar Fee per character in message (in Wei)
     * @dev Treasury wallet is initially set to the contract deployer (owner)
     */
    constructor(
        uint256 initialChannelCreationFee,
        uint256 initialMessageFeeBase,
        uint256 initialMessageFeePerChar
    ) Ownable(msg.sender) {
        treasuryWallet = msg.sender;
        channelCreationFee = initialChannelCreationFee;
        messageFeeBase = initialMessageFeeBase;
        messageFeePerChar = initialMessageFeePerChar;
    }

    // MARK: - Modifiers

    modifier onlyExistingChannel(bytes32 slugHash) {
        if (!_channels[slugHash].exists) revert OnChat__ChannelNotFound();
        _;
    }

    modifier onlyChannelOwner(bytes32 slugHash) {
        if (_channels[slugHash].owner != msg.sender)
            revert OnChat__NotChannelOwner();
        _;
    }

    modifier onlyChannelOwnerOrModerator(bytes32 slugHash) {
        if (
            _channels[slugHash].owner != msg.sender &&
            !_channelModerators[slugHash].contains(msg.sender)
        ) {
            revert OnChat__NotChannelOwnerOrModerator();
        }
        _;
    }

    modifier notBanned(bytes32 slugHash) {
        if (_channelBannedUsers[slugHash].contains(msg.sender))
            revert OnChat__UserBanned();
        _;
    }

    modifier onlyMember(bytes32 slugHash) {
        if (!_channelMembers[slugHash].contains(msg.sender))
            revert OnChat__NotMember();
        _;
    }

    // MARK: - Internal Helpers

    /// @dev Reverts if address is zero
    function _requireNonZero(address addr) private pure {
        if (addr == address(0)) revert OnChat__ZeroAddress();
    }

    // MARK: - Admin Functions

    /**
     * @notice Updates the treasury wallet address
     * @param newTreasury New treasury wallet address
     */
    function setTreasuryWallet(address newTreasury) external onlyOwner {
        _requireNonZero(newTreasury);
        treasuryWallet = newTreasury;
        emit TreasuryWalletUpdated(newTreasury);
    }

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
     * @return slugHash The keccak256 hash of the slug for future interactions
     * @dev Requires payment of channelCreationFee
     */
    function createChannel(
        string calldata slug
    ) external payable returns (bytes32 slugHash) {
        // Validate slug format: [a-z-]{1,20}
        bytes memory slugBytes = bytes(slug);
        uint256 slugLength = slugBytes.length;

        if (slugLength == 0 || slugLength > 20)
            revert OnChat__InvalidSlugLength();

        for (uint256 i = 0; i < slugLength; ) {
            bytes1 char = slugBytes[i];
            // Must be lowercase letter (a-z) or hyphen (-)
            if (!((char >= 0x61 && char <= 0x7A) || char == 0x2D)) {
                revert OnChat__InvalidSlugChars();
            }
            unchecked {
                ++i;
            }
        }

        slugHash = keccak256(slugBytes);

        if (_channels[slugHash].exists) revert OnChat__ChannelAlreadyExists();

        uint256 fee = channelCreationFee;
        if (msg.value < fee) revert OnChat__InsufficientPayment();

        _channels[slugHash] = Channel({
            owner: msg.sender,
            createdAt: uint40(block.timestamp),
            exists: true
        });

        channelSlugs.push(slug);
        _slugHashToSlug[slugHash] = slug;

        // Auto-join creator to the channel
        _channelMembers[slugHash].add(msg.sender);
        _userChannelHashes[msg.sender].add(slugHash);

        emit ChannelCreated(slugHash, slug, msg.sender);

        _distributeFee(fee, msg.sender);
        _refundExcess(fee);
    }

    /**
     * @notice Join a channel
     * @param slugHash Channel slug hash
     */
    function joinChannel(
        bytes32 slugHash
    ) external onlyExistingChannel(slugHash) notBanned(slugHash) {
        if (_channelMembers[slugHash].contains(msg.sender))
            revert OnChat__AlreadyMember();

        _channelMembers[slugHash].add(msg.sender);
        _userChannelHashes[msg.sender].add(slugHash);

        emit ChannelJoined(slugHash, msg.sender);
    }

    /**
     * @notice Leave a channel
     * @param slugHash Channel slug hash
     */
    function leaveChannel(
        bytes32 slugHash
    ) external onlyExistingChannel(slugHash) onlyMember(slugHash) {
        _channelMembers[slugHash].remove(msg.sender);
        _userChannelHashes[msg.sender].remove(slugHash);
        _channelModerators[slugHash].remove(msg.sender);

        emit ChannelLeft(slugHash, msg.sender);
    }

    // MARK: - Message Functions

    /**
     * @notice Send a message to a channel
     * @param slugHash Channel slug hash
     * @param content Message content
     * @dev Requires payment of messageFeeBase + (content.length * messageFeePerChar)
     */
    function sendMessage(
        bytes32 slugHash,
        string calldata content
    )
        external
        payable
        onlyExistingChannel(slugHash)
        notBanned(slugHash)
        onlyMember(slugHash)
    {
        uint256 contentLength = bytes(content).length;
        if (contentLength == 0) revert OnChat__EmptyContent();

        uint256 messageFee = messageFeeBase +
            (contentLength * messageFeePerChar);
        if (msg.value < messageFee) revert OnChat__InsufficientPayment();

        uint256 messageIndex = _channelMessages[slugHash].length;
        _channelMessages[slugHash].push(
            Message({
                sender: msg.sender,
                timestamp: uint40(block.timestamp),
                isHidden: false,
                content: content
            })
        );

        emit MessageSent(slugHash, msg.sender, messageIndex, content);

        _distributeFee(messageFee, _channels[slugHash].owner);
        _refundExcess(messageFee);
    }

    /**
     * @dev Distributes fee between owner and treasury
     */
    function _distributeFee(uint256 fee, address channelOwner) private {
        if (fee > 0) {
            uint256 ownerShare = (fee * OWNER_SHARE_BP) / BP_DENOMINATOR;
            ownerBalances[channelOwner] += ownerShare;
            treasuryBalance += fee - ownerShare;
        }
    }

    /**
     * @dev Refunds excess payment to sender
     */
    function _refundExcess(uint256 requiredFee) private {
        if (msg.value > requiredFee) {
            uint256 refund = msg.value - requiredFee;
            (bool success, ) = msg.sender.call{value: refund}("");
            if (!success) revert OnChat__TransferFailed();
        }
    }

    /**
     * @notice Hide a message (owner or moderator only)
     * @param slugHash Channel slug hash
     * @param messageIndex Index of the message to hide
     */
    function hideMessage(
        bytes32 slugHash,
        uint256 messageIndex
    )
        external
        onlyExistingChannel(slugHash)
        onlyChannelOwnerOrModerator(slugHash)
    {
        if (messageIndex >= _channelMessages[slugHash].length)
            revert OnChat__MessageNotFound();

        _channelMessages[slugHash][messageIndex].isHidden = true;
        emit MessageHidden(slugHash, messageIndex, msg.sender);
    }

    /**
     * @notice Unhide a message (owner or moderator only)
     * @param slugHash Channel slug hash
     * @param messageIndex Index of the message to unhide
     */
    function unhideMessage(
        bytes32 slugHash,
        uint256 messageIndex
    )
        external
        onlyExistingChannel(slugHash)
        onlyChannelOwnerOrModerator(slugHash)
    {
        if (messageIndex >= _channelMessages[slugHash].length)
            revert OnChat__MessageNotFound();

        _channelMessages[slugHash][messageIndex].isHidden = false;
        emit MessageUnhidden(slugHash, messageIndex, msg.sender);
    }

    // MARK: - Moderation Functions

    /**
     * @notice Ban a user from a channel
     * @param slugHash Channel slug hash
     * @param user User address to ban
     */
    function banUser(
        bytes32 slugHash,
        address user
    )
        external
        onlyExistingChannel(slugHash)
        onlyChannelOwnerOrModerator(slugHash)
    {
        _requireNonZero(user);
        if (user == _channels[slugHash].owner) revert OnChat__CannotBanOwner();
        if (_channelBannedUsers[slugHash].contains(user))
            revert OnChat__UserBanned();

        _channelBannedUsers[slugHash].add(user);

        // Remove from members if they are a member
        if (_channelMembers[slugHash].contains(user)) {
            _channelMembers[slugHash].remove(user);
            _userChannelHashes[user].remove(slugHash);
        }

        _channelModerators[slugHash].remove(user);

        emit UserBanned(slugHash, user, msg.sender);
    }

    /**
     * @notice Unban a user from a channel
     * @param slugHash Channel slug hash
     * @param user User address to unban
     */
    function unbanUser(
        bytes32 slugHash,
        address user
    )
        external
        onlyExistingChannel(slugHash)
        onlyChannelOwnerOrModerator(slugHash)
    {
        _requireNonZero(user);
        if (!_channelBannedUsers[slugHash].contains(user))
            revert OnChat__UserNotBanned();

        _channelBannedUsers[slugHash].remove(user);

        emit UserUnbanned(slugHash, user, msg.sender);
    }

    /**
     * @notice Add a moderator to a channel
     * @param slugHash Channel slug hash
     * @param moderator Address to make moderator
     */
    function addModerator(
        bytes32 slugHash,
        address moderator
    ) external onlyExistingChannel(slugHash) onlyChannelOwner(slugHash) {
        _requireNonZero(moderator);
        if (_channelModerators[slugHash].contains(moderator))
            revert OnChat__AlreadyModerator();
        if (!_channelMembers[slugHash].contains(moderator))
            revert OnChat__NotMember();

        _channelModerators[slugHash].add(moderator);

        emit ModeratorAdded(slugHash, moderator, msg.sender);
    }

    /**
     * @notice Remove a moderator from a channel
     * @param slugHash Channel slug hash
     * @param moderator Address to remove as moderator
     */
    function removeModerator(
        bytes32 slugHash,
        address moderator
    ) external onlyExistingChannel(slugHash) onlyChannelOwner(slugHash) {
        _requireNonZero(moderator);
        if (!_channelModerators[slugHash].contains(moderator))
            revert OnChat__NotModerator();

        _channelModerators[slugHash].remove(moderator);

        emit ModeratorRemoved(slugHash, moderator, msg.sender);
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
     * @dev Only callable by treasuryWallet
     */
    function claimTreasuryBalance() external {
        if (msg.sender != treasuryWallet) revert OnChat__NotTreasury();

        uint256 amount = treasuryBalance;
        if (amount == 0) revert OnChat__NothingToClaim();

        treasuryBalance = 0;

        (bool success, ) = treasuryWallet.call{value: amount}("");
        if (!success) revert OnChat__TransferFailed();

        emit TreasuryBalanceClaimed(treasuryWallet, amount);
    }

    // MARK: - View Functions

    /**
     * @notice Get total number of channels
     * @return Total channel count
     */
    function getChannelCount() external view returns (uint256) {
        return channelSlugs.length;
    }

    /**
     * @notice ChannelInfo struct for view function returns
     */
    struct ChannelInfo {
        bytes32 slugHash;
        string slug;
        address owner;
        uint40 createdAt;
        uint256 memberCount;
        uint256 messageCount;
    }

    /**
     * @notice Get channel information by slugHash
     * @param slugHash Channel slug hash
     * @return info Channel information struct
     */
    function getChannel(
        bytes32 slugHash
    )
        external
        view
        onlyExistingChannel(slugHash)
        returns (ChannelInfo memory info)
    {
        Channel storage channel = _channels[slugHash];

        return
            ChannelInfo({
                slugHash: slugHash,
                slug: _slugHashToSlug[slugHash],
                owner: channel.owner,
                createdAt: channel.createdAt,
                memberCount: _channelMembers[slugHash].length(),
                messageCount: _channelMessages[slugHash].length
            });
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
                bytes32 slugHash = keccak256(bytes(slug));
                Channel storage channel = _channels[slugHash];
                channels[i] = ChannelInfo({
                    slugHash: slugHash,
                    slug: slug,
                    owner: channel.owner,
                    createdAt: channel.createdAt,
                    memberCount: _channelMembers[slugHash].length(),
                    messageCount: _channelMessages[slugHash].length
                });
            }
        }
    }

    /**
     * @notice Get message count for a channel
     * @param slugHash Channel slug hash
     * @return Message count
     */
    function getMessageCount(
        bytes32 slugHash
    ) external view onlyExistingChannel(slugHash) returns (uint256) {
        return _channelMessages[slugHash].length;
    }

    /**
     * @notice Get latest messages from a channel with pagination (newest first)
     * @param slugHash Channel slug hash
     * @param offset Number of messages to skip from the end
     * @param limit Maximum number of messages to return
     * @return messages Array of Message structs in reverse chronological order
     */
    function getLatestMessages(
        bytes32 slugHash,
        uint256 offset,
        uint256 limit
    )
        external
        view
        onlyExistingChannel(slugHash)
        returns (Message[] memory messages)
    {
        Message[] storage channelMsgs = _channelMessages[slugHash];
        uint256 length = channelMsgs.length;

        if (length == 0 || offset >= length) return new Message[](0);

        unchecked {
            uint256 available = length - offset;
            uint256 count = available < limit ? available : limit;
            uint256 startIndex = length - 1 - offset;

            messages = new Message[](count);
            for (uint256 i = 0; i < count; ++i) {
                messages[i] = channelMsgs[startIndex - i];
            }
        }
    }

    /**
     * @notice Get messages from a specific range (oldest first)
     * @param slugHash Channel slug hash
     * @param startIndex Start index (inclusive)
     * @param endIndex End index (exclusive)
     * @return messages Array of Message structs
     */
    function getMessagesRange(
        bytes32 slugHash,
        uint256 startIndex,
        uint256 endIndex
    )
        external
        view
        onlyExistingChannel(slugHash)
        returns (Message[] memory messages)
    {
        Message[] storage channelMsgs = _channelMessages[slugHash];
        uint256 length = channelMsgs.length;

        if (startIndex >= length || startIndex >= endIndex)
            return new Message[](0);

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
     * @param slugHash Channel slug hash
     * @param offset Number of members to skip
     * @param limit Maximum number of members to return
     * @return members Array of member addresses
     */
    function getChannelMembers(
        bytes32 slugHash,
        uint256 offset,
        uint256 limit
    )
        external
        view
        onlyExistingChannel(slugHash)
        returns (address[] memory members)
    {
        EnumerableSet.AddressSet storage memberSet = _channelMembers[slugHash];
        uint256 length = memberSet.length();

        if (length == 0 || offset >= length) return new address[](0);

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
     * @param slugHash Channel slug hash
     * @return Member count
     */
    function getChannelMemberCount(
        bytes32 slugHash
    ) external view onlyExistingChannel(slugHash) returns (uint256) {
        return _channelMembers[slugHash].length();
    }

    /**
     * @notice Get all moderators for a channel
     * @param slugHash Channel slug hash
     * @return moderators Array of moderator addresses
     */
    function getChannelModerators(
        bytes32 slugHash
    )
        external
        view
        onlyExistingChannel(slugHash)
        returns (address[] memory moderators)
    {
        return _channelModerators[slugHash].values();
    }

    /**
     * @notice Get all banned users for a channel
     * @param slugHash Channel slug hash
     * @return bannedUsers Array of banned user addresses
     */
    function getBannedUsers(
        bytes32 slugHash
    )
        external
        view
        onlyExistingChannel(slugHash)
        returns (address[] memory bannedUsers)
    {
        return _channelBannedUsers[slugHash].values();
    }

    /**
     * @notice Get channels joined by a user with pagination (newest first)
     * @param user User address
     * @param offset Number of channels to skip from the end
     * @param limit Maximum number of channels to return
     * @return slugHashes Array of channel slug hashes
     */
    function getUserChannels(
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (bytes32[] memory slugHashes) {
        EnumerableSet.Bytes32Set storage hashSet = _userChannelHashes[user];
        uint256 length = hashSet.length();

        if (length == 0 || offset >= length) {
            return new bytes32[](0);
        }

        unchecked {
            uint256 available = length - offset;
            uint256 count = available < limit ? available : limit;

            slugHashes = new bytes32[](count);
            uint256 startIndex = length - 1 - offset;

            for (uint256 i = 0; i < count; ++i) {
                slugHashes[i] = hashSet.at(startIndex - i);
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
     * @param slugHash Channel slug hash
     * @param user User address
     * @return True if user is a member
     */
    function isMember(
        bytes32 slugHash,
        address user
    ) external view returns (bool) {
        return _channelMembers[slugHash].contains(user);
    }

    /**
     * @notice Check if a user is a moderator of a channel
     * @param slugHash Channel slug hash
     * @param user User address
     * @return True if user is a moderator
     */
    function isModerator(
        bytes32 slugHash,
        address user
    ) external view returns (bool) {
        return _channelModerators[slugHash].contains(user);
    }

    /**
     * @notice Check if a user is banned from a channel
     * @param slugHash Channel slug hash
     * @param user User address
     * @return True if user is banned
     */
    function isBanned(
        bytes32 slugHash,
        address user
    ) external view returns (bool) {
        return _channelBannedUsers[slugHash].contains(user);
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

    /**
     * @notice Compute slug hash from slug string
     * @param slug Channel slug
     * @return slugHash The keccak256 hash of the slug
     * @dev Helper for clients to compute slugHash from slug
     */
    function computeSlugHash(
        string calldata slug
    ) external pure returns (bytes32) {
        return keccak256(bytes(slug));
    }

    /**
     * @notice Get slug string from slug hash
     * @param slugHash Channel slug hash
     * @return slug The original slug string
     */
    function getSlug(bytes32 slugHash) external view returns (string memory) {
        return _slugHashToSlug[slugHash];
    }
}
