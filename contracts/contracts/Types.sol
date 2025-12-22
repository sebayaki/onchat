// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.28;

/**
 * @title Types
 * @notice Shared struct definitions for OnChat protocol
 */

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

/**
 * @notice Channel info for view functions
 */
struct ChannelInfo {
    bytes32 slugHash;
    string slug;
    address owner;
    uint40 createdAt;
    uint256 memberCount;
    uint256 messageCount;
}
