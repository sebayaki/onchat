// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.28;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {Message} from "./Types.sol";

/**
 * @title Pagination
 * @notice Library for paginating collections
 * @dev Provides gas-efficient pagination for EnumerableSets and arrays
 */
library Pagination {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    /**
     * @notice Paginate an AddressSet (forward iteration)
     * @param set The AddressSet to paginate
     * @param offset Number of items to skip
     * @param limit Maximum number of items to return
     * @return result Array of addresses
     */
    function paginate(
        EnumerableSet.AddressSet storage set,
        uint256 offset,
        uint256 limit
    ) internal view returns (address[] memory result) {
        uint256 length = set.length();
        if (length == 0 || offset >= length) return new address[](0);

        unchecked {
            uint256 count = length - offset;
            if (count > limit) count = limit;

            result = new address[](count);
            for (uint256 i = 0; i < count; ++i) {
                result[i] = set.at(offset + i);
            }
        }
    }

    /**
     * @notice Paginate an AddressSet in reverse order (newest first)
     * @param set The AddressSet to paginate
     * @param offset Number of items to skip from the end
     * @param limit Maximum number of items to return
     * @return result Array of addresses in reverse order
     */
    function paginateReverse(
        EnumerableSet.AddressSet storage set,
        uint256 offset,
        uint256 limit
    ) internal view returns (address[] memory result) {
        uint256 length = set.length();
        if (length == 0 || offset >= length) return new address[](0);

        unchecked {
            uint256 count = length - offset;
            if (count > limit) count = limit;

            result = new address[](count);
            uint256 startIndex = length - 1 - offset;

            for (uint256 i = 0; i < count; ++i) {
                result[i] = set.at(startIndex - i);
            }
        }
    }

    /**
     * @notice Paginate a Bytes32Set (forward iteration)
     * @param set The Bytes32Set to paginate
     * @param offset Number of items to skip
     * @param limit Maximum number of items to return
     * @return result Array of bytes32 values
     */
    function paginate(
        EnumerableSet.Bytes32Set storage set,
        uint256 offset,
        uint256 limit
    ) internal view returns (bytes32[] memory result) {
        uint256 length = set.length();
        if (length == 0 || offset >= length) return new bytes32[](0);

        unchecked {
            uint256 count = length - offset;
            if (count > limit) count = limit;

            result = new bytes32[](count);
            for (uint256 i = 0; i < count; ++i) {
                result[i] = set.at(offset + i);
            }
        }
    }

    /**
     * @notice Paginate a Bytes32Set in reverse order (newest first)
     * @param set The Bytes32Set to paginate
     * @param offset Number of items to skip from the end
     * @param limit Maximum number of items to return
     * @return result Array of bytes32 values in reverse order
     */
    function paginateReverse(
        EnumerableSet.Bytes32Set storage set,
        uint256 offset,
        uint256 limit
    ) internal view returns (bytes32[] memory result) {
        uint256 length = set.length();
        if (length == 0 || offset >= length) return new bytes32[](0);

        unchecked {
            uint256 count = length - offset;
            if (count > limit) count = limit;

            result = new bytes32[](count);
            uint256 startIndex = length - 1 - offset;

            for (uint256 i = 0; i < count; ++i) {
                result[i] = set.at(startIndex - i);
            }
        }
    }

    // =========================================================================
    // Message[] Array Pagination
    // =========================================================================

    /**
     * @notice Paginate a Message array in reverse order (newest first)
     * @param arr The Message array to paginate
     * @param offset Number of items to skip from the end
     * @param limit Maximum number of items to return
     * @return result Array of Messages in reverse order
     */
    function paginateReverse(
        Message[] storage arr,
        uint256 offset,
        uint256 limit
    ) internal view returns (Message[] memory result) {
        uint256 length = arr.length;
        if (length == 0 || offset >= length) return new Message[](0);

        unchecked {
            uint256 count = length - offset;
            if (count > limit) count = limit;

            result = new Message[](count);
            uint256 startIndex = length - 1 - offset;

            for (uint256 i = 0; i < count; ++i) {
                result[i] = arr[startIndex - i];
            }
        }
    }

    /**
     * @notice Get a range of Messages (forward iteration)
     * @param arr The Message array to paginate
     * @param startIndex Start index (inclusive)
     * @param endIndex End index (exclusive)
     * @return result Array of Messages
     */
    function paginateRange(
        Message[] storage arr,
        uint256 startIndex,
        uint256 endIndex
    ) internal view returns (Message[] memory result) {
        uint256 length = arr.length;
        if (startIndex >= length || startIndex >= endIndex)
            return new Message[](0);

        unchecked {
            uint256 actualEnd = endIndex > length ? length : endIndex;
            uint256 count = actualEnd - startIndex;

            result = new Message[](count);
            for (uint256 i = 0; i < count; ++i) {
                result[i] = arr[startIndex + i];
            }
        }
    }

    // =========================================================================
    // string[] Array Pagination (for channel slugs)
    // =========================================================================

    /**
     * @notice Calculate pagination bounds for reverse iteration
     * @param length Total length of array
     * @param offset Number of items to skip from the end
     * @param limit Maximum number of items to return
     * @return count Number of items to return
     * @return startIndex Starting index for iteration
     */
    function calcReverseBounds(
        uint256 length,
        uint256 offset,
        uint256 limit
    ) internal pure returns (uint256 count, uint256 startIndex) {
        if (length == 0 || offset >= length) return (0, 0);

        unchecked {
            count = length - offset;
            if (count > limit) count = limit;
            startIndex = length - 1 - offset;
        }
    }
}
