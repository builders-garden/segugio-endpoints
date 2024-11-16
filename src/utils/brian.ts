import { BrianSDK } from "@brian-ai/sdk";
import { env } from "../env.js";

const options = {
  apiKey: env.BRIAN_API_KEY,
};
const brian = new BrianSDK(options);
const chainId = "8453";

export async function brianTransact(prompt: string, originWallet: string) {
  try {
    // Ask brian to generate a data payload starting from the prompt
    const brianResponse = await brian.transact({
      prompt,
      address: originWallet,
      chainId: chainId,
    });

    return brianResponse;
  } catch (error) {
    console.error(error);
    throw new Error("Brian failed to transact");
  }
}
