import { z } from "zod";

export const createAddAddressQuickNode = z.object({
  address: z
    .string({
      required_error: "Address to add is required",
    })
    .describe("The Ethereum address of the user to copy trade"),
});
