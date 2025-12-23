// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.31;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title OnChatBuyBackBurner
 * @notice Treasury wallet for OnChat that automatically buys back and burns ONCHAT tokens.
 * @dev Swaps claimed ETH for HUNT via Uniswap V4, then mints ONCHAT via Mint Club Bond Periphery to the dead address.
 */
contract OnChatBuyBackBurner {
    using SafeERC20 for IERC20;

    // ============ Structs ============
    struct BurnStats {
        uint128 totalOnchatBurned;
        uint128 totalHuntSpent;
        uint128 totalEthSpent;
        uint128 burnCount;
    }

    // ============ Token Addresses (Base Mainnet) ============
    address public constant HUNT = 0x37f0c2915CeCC7e977183B8543Fc0864d03E064C;
    address public constant ONCHAT = 0xD8F76e1e31a85bE129155d8CF699D3056f9DA301;
    address public constant ETH_ADDRESS = address(0);
    address public constant DEAD_ADDRESS =
        0x000000000000000000000000000000000000dEaD;

    // ============ Uniswap V4 Pool Parameters (0.3% fee) ============
    uint24 public constant POOL_FEE = 3000;
    int24 public constant TICK_SPACING = 60;

    // ============ External Contracts (Base Mainnet) ============
    IOnChat public constant ONCHAT_CONTRACT =
        IOnChat(0x898D291C2160A9CB110398e9dF3693b7f2c4af2D);
    IUniversalRouter public constant UNIVERSAL_ROUTER =
        IUniversalRouter(0x6fF5693b99212Da76ad316178A184AB56D299b43);
    IMCV2_BondPeriphery public constant BOND_PERIPHERY =
        IMCV2_BondPeriphery(0x492C412369Db76C9cdD9939e6C521579301473a3);

    // ============ Uniswap V4 Actions/Commands ============
    uint8 private constant COMMAND_V4_SWAP = 0x10;
    uint8 private constant COMMAND_SWEEP = 0x04;
    uint8 private constant ACTION_SWAP_EXACT_IN_SINGLE = 0x06;
    uint8 private constant ACTION_SETTLE_ALL = 0x0c;
    uint8 private constant ACTION_TAKE = 0x0e;
    uint256 private constant OPEN_DELTA = 0;

    // ============ State Variables ============
    BurnStats public stats;

    // ============ Errors ============
    error OnChatBuyBackBurner__NothingToBurn();

    // ============ Events ============
    event Burned(
        address indexed burner,
        uint128 ethSpent,
        uint128 huntSpent,
        uint128 onchatBurned,
        uint128 burnedAt
    );

    constructor() {
        IERC20(HUNT).approve(address(BOND_PERIPHERY), type(uint256).max);
    }

    receive() external payable {}

    /**
     * @notice Claims treasury balance from OnChat, swaps ETH to HUNT,
     *         and mints ONCHAT to the dead address.
     * @dev Anyone can call this function.
     */
    function burn() external {
        // 1. Claim ETH from OnChat
        ONCHAT_CONTRACT.claimTreasuryBalance();

        uint256 ethBalance = address(this).balance;
        if (ethBalance == 0) revert OnChatBuyBackBurner__NothingToBurn();

        // 2. Swap ETH to HUNT via Uniswap V4
        _swapETHToHUNT(ethBalance);

        uint256 huntBalance = IERC20(HUNT).balanceOf(address(this));
        if (huntBalance == 0) revert OnChatBuyBackBurner__NothingToBurn();

        // 3. Mint ONCHAT with HUNT and send to dead address
        // mintWithReserveAmount consumes huntBalance and returns tokensMinted
        uint256 onchatMinted = BOND_PERIPHERY.mintWithReserveAmount(
            ONCHAT,
            huntBalance,
            0, // minTokensToMint (slippage protection not critical for burn)
            DEAD_ADDRESS
        );

        // Update stats
        stats.totalOnchatBurned += uint128(onchatMinted);
        stats.totalHuntSpent += uint128(huntBalance);
        stats.totalEthSpent += uint128(ethBalance);
        stats.burnCount += 1;

        emit Burned(
            msg.sender,
            uint128(ethBalance),
            uint128(huntBalance),
            uint128(onchatMinted),
            uint128(block.timestamp)
        );

        // 4. Burn any remaining HUNT tokens by sending to dead address
        uint256 remainingHunt = IERC20(HUNT).balanceOf(address(this));
        if (remainingHunt > 0) {
            IERC20(HUNT).safeTransfer(DEAD_ADDRESS, remainingHunt);
        }
    }

    /**
     * @dev Swaps ETH to HUNT using Uniswap V4 Universal Router
     * @param amountIn Amount of ETH to swap
     */
    function _swapETHToHUNT(uint256 amountIn) private {
        bytes memory actions = abi.encodePacked(
            ACTION_SWAP_EXACT_IN_SINGLE,
            ACTION_SETTLE_ALL,
            ACTION_TAKE
        );

        PoolKey memory poolKey = PoolKey({
            currency0: ETH_ADDRESS,
            currency1: HUNT,
            fee: POOL_FEE,
            tickSpacing: TICK_SPACING,
            hooks: address(0)
        });

        bytes[] memory params = new bytes[](3);
        params[0] = abi.encode(
            ExactInputSingleParams({
                poolKey: poolKey,
                zeroForOne: true, // ETH (0) < HUNT address
                amountIn: uint128(amountIn),
                amountOutMinimum: 0,
                hookData: bytes("")
            })
        );
        params[1] = abi.encode(ETH_ADDRESS, amountIn);
        params[2] = abi.encode(HUNT, address(this), OPEN_DELTA);

        bytes memory swapInput = abi.encode(actions, params);

        bytes memory commands = abi.encodePacked(
            COMMAND_V4_SWAP,
            COMMAND_SWEEP
        );
        bytes[] memory inputs = new bytes[](2);
        inputs[0] = swapInput;
        inputs[1] = abi.encode(ETH_ADDRESS, address(this), 0);

        UNIVERSAL_ROUTER.execute{value: amountIn}(
            commands,
            inputs,
            block.timestamp
        );
    }
}

interface IOnChat {
    function claimTreasuryBalance() external;
}

interface IMCV2_BondPeriphery {
    function mintWithReserveAmount(
        address token,
        uint256 reserveAmount,
        uint256 minTokensToMint,
        address receiver
    ) external returns (uint256 tokensMinted);
}

interface IUniversalRouter {
    function execute(
        bytes calldata commands,
        bytes[] calldata inputs,
        uint256 deadline
    ) external payable;
}

struct PoolKey {
    address currency0;
    address currency1;
    uint24 fee;
    int24 tickSpacing;
    address hooks;
}

struct ExactInputSingleParams {
    PoolKey poolKey;
    bool zeroForOne;
    uint128 amountIn;
    uint128 amountOutMinimum;
    bytes hookData;
}
