import { z } from "zod";

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
  defaultAmountIn: z
    .number()
    .nullish()
    .describe(
      "The default amount of token to be used for the swap - in USD"
    )
    .default(1),
  defaultTokenIn: z
    .string()
    .nullish()
    .describe("The default token to be used for the swap")
    .default("ETH"),
  xmtpGroupId: z
    .string({
      required_error: "XMTP group id is required",
    })
    .describe("The group id for the XMTP"),
});

export const fireTxSchema = z.object({
  from: z
    .string({
      required_error: "From address is required",
    })
    .describe("The address of the user to copy trade"),
  protocol: z
    .string({
      required_error: "Protocol is required",
    })
    .describe("The protocol of the trade"),
  tokenIn: z
    .string({
      required_error: "Token in is required",
    })
    .describe("The token to be swapped - address"),
  tokenOut: z
    .string({
      required_error: "Token out is required",
    })
    .describe("The token to receive - address"),
  amountIn: z
    .string({
      required_error: "Amount in is required",
    })
    .describe("The amount of token to swap - bigint"),
  amountOut: z
    .string({
      required_error: "Amount out is required",
    })
    .describe("The amount of token to receive - bigint"),
});