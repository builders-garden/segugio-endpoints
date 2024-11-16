import { z } from "zod";
import { TransactionReceipt } from "viem";

export const addAddressQuickNodeSchema = z.object({
  address: z
    .string({
      required_error: "Address to add is required",
    })
    .describe("The Ethereum address of the user to copy trade"),
});

export const notifyTxQuickNodeSchema = z.array(z.custom<TransactionReceipt>((tx: TransactionReceipt) => {
  if (tx.status !== "success") {
    throw new Error("Transaction must have a success status");
  }
}))
