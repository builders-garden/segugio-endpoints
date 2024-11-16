import type { Request, Response } from "express";
import { createSegugioSchema, fireTxSchema } from "../../utils/schemas/segugio.schema.js";
import { Logger } from "../../utils/logger.js";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  Address,
  createWalletClient,
  http,
  publicActions,
  SendTransactionErrorType,
} from "viem";
import { base } from "viem/chains";
import { brianTransact } from "../../utils/brian.js";
import { Token } from "@brian-ai/sdk";
import { getSegugiosByTarget, saveSegugio } from "../../utils/db.js";

const logger = new Logger("segugio-controller");
export async function createSegugio(
  req: Request,
  res: Response
): Promise<void> {
  logger.log("Creating segugio...");
  const parsedBody = createSegugioSchema.safeParse(req.body);

  if (!parsedBody.success) {
    logger.error(`Error ${JSON.stringify(parsedBody.error.errors)}`);
    res.status(400).json({ error: parsedBody.error.errors });
  } else {
    // create new Segugio wallet
    const newPrivateKey = generatePrivateKey();
    const account = privateKeyToAccount(newPrivateKey);

    const segugio = {
      owner: parsedBody.data.owner,
      target: parsedBody.data.addressToFollow,
      privateKey: newPrivateKey,
      address: account.address,
      ensDomain: parsedBody.data.segugioToolParams.ensDomain || null,
      resolvedEnsDomain:
        parsedBody.data.segugioToolParams.resolvedEnsDomain || null,
      timeRange: parsedBody.data.timeRange,
      onlyBuyTrades: parsedBody.data.onlyBuyTrades ?? true,
      portfolioPercentage: parsedBody.data.portfolioPercentage ?? 0.1,
      tokenFrom: parsedBody.data.tokenFrom ?? "USDC",
    };
    // console.log("the new segugio will be: ", segugio);
    // store the Segugio in the database
    await saveSegugio(segugio);
    logger.log(
      `New Segugio created and stored for ${parsedBody.data.addressToFollow} with address ${segugio.address}`
    );

    // TODO: add here a ping to the webhook of the Caso to notify the new segugio

    res.status(200).json({
      status: "ok",
      data: {
        message: `Successfully created segugio for ${parsedBody.data.addressToFollow} with address ${segugio.address}`,
        segugio: {
          owner: segugio.owner,
          address: segugio.address,
          target: segugio.target,
          ensDomain: segugio.ensDomain,
          resolvedEnsDomain: segugio.resolvedEnsDomain,
          timeRange: segugio.timeRange,
          onlyBuyTrades: segugio.onlyBuyTrades,
          portfolioPercentage: segugio.portfolioPercentage,
          tokenFrom: segugio.tokenFrom,
        },
      },
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
    "tokenIn": "ETH" | "0x32434354354354",
    "tokenOut": "DAI",
    "amountIn": "1",
    "amountOut": "100",
  }
*/
export async function fireTx(req: Request, res: Response): Promise<void> {
  const parsedBody = fireTxSchema.safeParse(req.body);

  if (!parsedBody.success) {
    logger.error(`Error ${JSON.stringify(parsedBody.error.errors)}`);
    res.status(400).json({ error: parsedBody.error.errors });
  }

  const reqBody = parsedBody.data!;

  // take here the segugios from db to get the targets of the transaction
  logger.log(`looking for segugios for target ${reqBody.from}`);
  const segugios = await getSegugiosByTarget(reqBody.from);
  logger.log(`found ${segugios.length} segugios for target ${reqBody.from}`);

  const executedTransactions: {
    hash: string;
    action: string;
    fromToken: Token | undefined;
    toToken: Token | undefined;
    receiver: string;
    prompt: string;
  }[] = [];
  const failedTransactions: {
    segugioId: number;
    target: string;
    owner: string;
    error: SendTransactionErrorType;
  }[] = [];
  for (var segugio of segugios) {
    let prompt;
    // if (!prompt) {
    if (!reqBody.tokenOut || !reqBody.amountOut) {
      res.status(400).json({
        error: "tokenIn is required if you do not provide a prompt",
      });
      return;
    }
    prompt = `Swap ${reqBody.amountOut}$ ${segugio.tokenFrom} to ${reqBody.tokenOut} on Base mainnet`;
    // }
    logger.log(`Using prompt: ${prompt}`);
    logger.log(
      `executing transaction for segugio ${segugio.address} from user ${segugio.owner}`
    );
    const privateKey = segugio.privateKey;

    const account = privateKeyToAccount(
      (privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as Address
    );
    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(),
    }).extend(publicActions);

    const brianResponse = await brianTransact(prompt, account.address);
    // console.log(JSON.stringify(brianResponse, null, 2));

    for (var transactionResult of brianResponse) {
      logger.log(
        `reading transaction result with solver ${transactionResult.solver} and action ${transactionResult.action}`
      );
      if (transactionResult.action !== "swap") {
        logger.error(
          `action ${transactionResult.action} is not supported. Skipping...`
        );
        continue;
      }
      if (
        transactionResult.data.steps &&
        transactionResult.data.steps?.length >= 0
      ) {
        for (var step of transactionResult.data.steps) {
          try {
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
              prompt: prompt,
            });
          } catch (error) {
            const e = error as SendTransactionErrorType;
            logger.error(
              `error executing tx for segugio ${segugio.id}: ${e.message.slice(
                0,
                e.message.indexOf("\n")
              )}`
            );
            failedTransactions.push({
              segugioId: segugio.id,
              target: segugio.target,
              owner: segugio.owner,
              error: e,
            });
          }
        }
      }
    }
  }

  res.status(200).json({
    status: "ok",
    data: {
      executedTransactions,
      failedTransactions,
    },
  });
}
