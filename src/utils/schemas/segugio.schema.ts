import { z } from "zod";
import { TradeFromQuickNode } from "../types.js";

export const createSegugioSchema = z.object({
  owner: z
    .string()
    .min(1)
    .max(42)
    .describe("The Ethereum address of the owner"),
  segugioToolParams: z.object({
    ensDomain: z
      .string()
      .nullish()
      .describe("The Ethereum ENS domain of the user to copy trade"),
    address: z
      .string()
      .nullish()
      .describe("The Ethereum address of the user to copy trade"),
    resolvedEnsDomain: z
      .string()
      .nullish()
      .describe("The Ethereum address of the user to copy trade"),
  }),
  addressToFollow: z
    .string({
      required_error: "Address to follow is required",
    })
    .describe("The Ethereum address of the user to copy trade"),
  timeRange: z
    .enum(["1h", "1d", "1w", "1m", "1y"])
    .describe("The time range for how long to copy trades")
    .default("1w"),
  onlyBuyTrades: z
    .boolean()
    .nullish()
    .describe("Whether to only copy buy trades and ignore all sell trades")
    .default(true),
  portfolioPercentage: z
    .number()
    .nullish()
    .describe(
      "The maximum percentage of the portfolio to allocate to each trade"
    )
    .default(0.1),
  tokenFrom: z
    .string()
    .nullish()
    .describe("The default token to be used for the swap")
    .default("USDC"),
});

export const fireTxSchema = z.custom<TradeFromQuickNode>((trade: TradeFromQuickNode) => {
  if (!trade.amountIn || !trade.amountOut) {
    throw new Error("Trade must have an amountIn and amountOut");
  }
  if (!trade.from) {
    throw new Error("Trade must have a from address");
  }
  if (!trade.protocol) {
    throw new Error("Trade must have a protocol");
  }
  if (!trade.tokenIn) {
    throw new Error("Trade must have a tokenIn");
  }
  if (!trade.tokenOut) {
    throw new Error("Trade must have a tokenOut");
  }
})