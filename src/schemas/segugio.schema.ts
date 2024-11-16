import { z } from "zod";

export const createSegugioSchema = z.object({
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
    .nullish()
    .describe("The time range for how long to copy trades")
    .default("1w"),
  onlyBuyTrades: z
    .boolean()
    .nullish()
    .describe("Whether to only copy buy trades and ignore all sell trades")
    .default(false),
});
