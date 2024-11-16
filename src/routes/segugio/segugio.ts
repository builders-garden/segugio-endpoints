import type { Request, Response } from "express";
import { createSegugioSchema } from "../../utils/schemas/segugio.schema.js";
import { Logger } from "../../utils/logger.js";
import { env } from "../../env.js";
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http, publicActions } from "viem";
import { base } from "viem/chains";
import { brianTransact } from "../../utils/brian.js";
import { Token } from "@brian-ai/sdk";

const logger = new Logger("testHandler");
export function createSegugio(req: Request, res: Response): void {
  logger.log("Creating segugio...");
  const parsedBody = createSegugioSchema.safeParse(req.body);

  if (!parsedBody.success) {
    logger.error(`Error ${JSON.stringify(parsedBody.error.errors)}`);
    res.status(400).json({ error: parsedBody.error.errors });
  } else {
    logger.log(`Successfully parsed body ${JSON.stringify(parsedBody.data)}`);
    // TODO: create segugio
    // if no priv key for user address, create one
    // else, add to segugio list
    res.status(200).json({
      address: parsedBody.data.addressToFollow,
      message: `Successfully created segugio for ${parsedBody.data.addressToFollow}`,
    });
  }
}

// This function will be used by the Caso's webhook when he finds a new transaction from the address we are following
// or will be called by the Converse app to perform transaction
/*
  {
    "prompt": "Swap 1 ETH to DAI on Base mainnet",
    "originWallet": "0x1234567890",
  } || {
    "from": "0x1234567890",
    "protocol": "Uniswap",
    "tokenIn": "ETH" | "0x32434354354354"
    "tokenOut": "DAI",
    "amountIn": "1",
    "amountOut": "100",
  }
*/
export async function fireTx(req: Request, res: Response): Promise<void> {
  console.log(req.body);
  const parsedBody = req.body;

  let prompt = parsedBody.prompt;
  if (!prompt) {
    if (!parsedBody.tokenIn) {
      res
        .status(400)
        .json({ error: "tokenIn is required if you do not provide a prompt" });
      return;
    }
    prompt = `Swap ${parsedBody.amount} ${parsedBody.defaultUserToken} to ${parsedBody.tokenIn} on Base mainnet`;
  }
  // take here the segugios from db to get the targets of the transaction
  // const segugios = [""];

  // TODO: this will be replaced by private key on backend
  const privateKey = env.PRIVATE_KEY;

  const account = privateKeyToAccount(`0x${privateKey}`);
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(),
  }).extend(publicActions);

  const brianResponse = await brianTransact(prompt, account.address);
  console.log(JSON.stringify(brianResponse, null, 2));

  const executedTransactions: {
    hash: string;
    action: string;
    fromToken: Token | undefined;
    toToken: Token | undefined;
    receiver: string;
  }[] = [];
  for (var transactionResult of brianResponse) {
    logger.log(
      `reading transaction result with solver ${transactionResult.solver} and action ${transactionResult.action}`
    );
    if (transactionResult.action !== "swap") {
      logger.error(
        `Action ${transactionResult.action} is not supported. Skipping...`
      );
      continue;
    }
    if (
      transactionResult.data.steps &&
      transactionResult.data.steps?.length >= 0
    ) {
      for (var step of transactionResult.data.steps) {
        const result = await walletClient.sendTransaction({
          from: step.from,
          to: step.to,
          data: step.data,
          value: BigInt(step.value),
        });
        logger.log(`Transaction result hash: ${result}`);
        executedTransactions.push({
          hash: result,
          action: transactionResult.action,
          fromToken: transactionResult.data.fromToken,
          toToken: transactionResult.data.toToken,
          receiver: (transactionResult.data as any).receiver,
        });
      }
    }
  }
  res.status(200).json({
    status: "ok",
    data: {
      prompt,
      executedTransactions,
    },
  });
}
