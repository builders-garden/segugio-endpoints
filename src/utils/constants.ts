import { ProtocolEvent, ProtocolEventType } from "./types.js";

export const TransferAbi = "event Transfer(address indexed from, address indexed to, uint256 value)";

export const events: ProtocolEvent[] = [
  {
    protocol: "OKX Dex",
    topic: "0x1bb43f2da90e35f7b0cf38521ca95a49e68eb42fac49924930a5bd73cdf7576c",
    name: "event OrderRecord(address fromToken, address toToken, address sender, uint256 fromAmount, uint256 returnAmount)",
    type: ProtocolEventType.Aggregator,
    tokenIn: "fromToken",
    tokenOut: "toToken",
    amountIn: "fromAmount",
    amountOut: "returnAmount"
  },
  {
    protocol: "OdosV2",
    topic: "0x823eaf01002d7353fbcadb2ea3305cc46fa35d799cb0914846d185ac06f8ad05",
    name: "event Swap(address sender, uint256 inputAmount, address inputToken, uint256 amountOut, address outputToken, int256 slippage, uint32 referralCode)",
    type: ProtocolEventType.Aggregator,
    tokenIn: "inputToken",
    tokenOut: "outputToken",
    amountIn: "inputAmount",
    amountOut: "amountOut"
  },
  {
    protocol: "CowSwap",
    topic: "0xa07a543ab8a018198e99ca0184c93fe9050a79400a0a723441f84de1d972cc17",
    name: "event Trade(address indexed owner, address sellToken, address buyToken, uint256 sellAmount, uint256 buyAmount, uint256 feeAmount, bytes orderUid)",
    type: ProtocolEventType.Aggregator,
    tokenIn: "sellToken",
    tokenOut: "buyToken",
    amountIn: "sellAmount",
    amountOut: "buyAmount"
  },
  {
    protocol: "UniswapV3",
    topic: "0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67",
    name: "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
    type: ProtocolEventType.Dex,
    tokenIn: undefined,
    tokenOut: undefined,
    amountIn: "amount0",
    amountOut: "amount1"
  },
  {
    protocol: "UniswapV2",
    topic: "0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822",
    name: "event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)",
    type: ProtocolEventType.Dex,
    tokenIn: undefined,
    tokenOut: undefined,
    amountIn: ["amount0In", "amount1In"],
    amountOut: ["amount0Out", "amount1Out"]
  }
]