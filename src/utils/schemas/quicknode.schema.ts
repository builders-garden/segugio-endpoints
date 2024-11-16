import { z } from "zod";

export const addAddressQuickNodeSchema = z.object({
  address: z
    .string({
      required_error: "Address to add is required",
    })
    .describe("The Ethereum address of the user to copy trade"),
});

export const notifyTxQuickNodeSchema = z.array(
  z.object({
    blockHash: z.string(),
    blockNumber: z.string(),
    contractAddress: z.string(),
    cumulativeGasUsed: z.string(),
    effectiveGasPrice: z.string(),
    from: z.string(),
    gasUsed: z.string(),
    logs: z.array(
      z.object({
        address: z.string(),
        blockHash: z.string(),
        blockNumber: z.string(),
        data: z.string(),
        logIndex: z.string(),
        removed: z.boolean(),
        topics: z.array(z.string()),
        transactionHash: z.string(),
        transactionIndex: z.string(),
      })
    ),
    logsBloom: z.string(),
    status: z.string(),
    to: z.string(),
    transactionHash: z.string(),
    transactionIndex: z.string(),
    type: z.string(),
  })
);
