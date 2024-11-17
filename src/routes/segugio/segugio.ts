import type { Request, Response } from "express";
import {
  createSegugioSchema,
  fireTxSchema,
} from "../../utils/schemas/segugio.schema.js";
import { Logger } from "../../utils/logger.js";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  Address,
  createWalletClient,
  getAddress,
  http,
  PrivateKeyAccount,
  publicActions,
  SendTransactionErrorType,
} from "viem";
import { base } from "viem/chains";
import { brianTransact } from "../../utils/brian.js";
import { Token } from "@brian-ai/sdk";
import {
  checkDuplicateSegugio,
  getSegugioByTargetAndOwner,
  getSegugiosByOwner,
  getSegugiosByTarget,
  saveSegugio,
} from "../../utils/db.js";
import axios from "axios";
import { env } from "../../env.js";
import { OneInchGeneralValue, OneInchPnL, OneInchTokenData } from "../../utils/types.js";
import { Segugio } from "../../utils/types.js";

const logger = new Logger("segugio");

const BLOCKSCOUT_URL = "https://base.blockscout.com";

export async function createSegugio(
  req: Request,
  res: Response
): Promise<void> {
  try {
    logger.log("Creating segugio...");
    const parsedBody = createSegugioSchema.safeParse(req.body);

    if (!parsedBody.success) {
      logger.error(`Error ${JSON.stringify(parsedBody.error.errors)}`);
      res.status(400).json({ error: parsedBody.error.errors });
    } else {
      const isDuplicated = await checkDuplicateSegugio(
        parsedBody.data.owner,
        parsedBody.data.addressToFollow
      );

      if (isDuplicated) {
        logger.error(
          `Segugio already exists for ${parsedBody.data.addressToFollow}`
        );
        res.status(200).json({
          status: "ok",
          data: {
            message: `Segugio already exists for ${
              parsedBody.data.segugioToolParams.ensDomain ??
              parsedBody.data.addressToFollow
            }`,
          },
        });
        return;
      }

      // create new Segugio wallet
      const newPrivateKey = generatePrivateKey();
      const account = privateKeyToAccount(newPrivateKey);

      const segugio = {
        owner: parsedBody.data.owner,
        target: getAddress(parsedBody.data.addressToFollow),
        privateKey: newPrivateKey,
        address: account.address,
        ensDomain: parsedBody.data.segugioToolParams.ensDomain || null,
        resolvedEnsDomain:
          parsedBody.data.segugioToolParams.resolvedEnsDomain || null,
        timeRange: parsedBody.data.timeRange,
        onlyBuyTrades: parsedBody.data.onlyBuyTrades ?? true,
        defaultAmountIn: parsedBody.data.defaultAmountIn ?? 1,
        defaultTokenIn: parsedBody.data.defaultTokenIn ?? "ETH",
        xmtpGroupId: parsedBody.data.xmtpGroupId,
      };

      let result = await axios(
        `${env.APP_BASE_URL}/quicknode/add-address-to-scan`,
        {
          method: "POST",
          data: {
            address: segugio.target,
          },
        }
      );

      if (result.status !== 200) {
        logger.error(
          `Error adding address ${segugio.target} to QuickNode: ${result.data}`
        );
        res.status(500).json({
          error: `Error adding address ${segugio.target} to QuickNode: ${result.data}`,
        });
        return;
      }

      logger.log(
        `Address ${segugio.target} added to QuickNode with status ${result.status}`
      );

      await saveSegugio(segugio);

      logger.log(
        `New Segugio created and stored for ${parsedBody.data.addressToFollow} with address ${segugio.address}`
      );

      result = await axios(
        `${env.APP_BASE_URL}/1inch/profit-and-loss?addresses=${parsedBody.data.addressToFollow}`,
        {
          method: "GET",
        }
      );
  
      if (result.status !== 200) {
        logger.error(
          `Error getting profit and loss for ${parsedBody.data.addressToFollow}: ${result.data}`
        );
        res.status(500).json({
          error: `Error getting profit and loss for ${parsedBody.data.addressToFollow}: ${result.data}`,
        });
        return;
      }

      const profitAndLoss = result.data.data.profitAndLoss as OneInchPnL;
      const baseResult = profitAndLoss.result.find(
        (pnl) => pnl.chain_id === base.id
      );
      const pnlUsd = baseResult?.abs_profit_usd.toFixed(2);
      const roi = baseResult?.roi ? (baseResult?.roi * 100).toFixed(4) : 0;

      result = await axios(
        `${env.APP_BASE_URL}/1inch/current-value?addresses=${parsedBody.data.addressToFollow}`,
        {
          method: "GET",
        }
      );

      if (result.status !== 200) {
        logger.error(
          `Error getting current value for ${parsedBody.data.addressToFollow}: ${result.data}`
        );
        res.status(500).json({
          error: `Error getting current value for ${parsedBody.data.addressToFollow}: ${result.data}`,
        });
        return;
      }

      const currentValue = (result.data.data.currentValue as OneInchGeneralValue).result[0].value_usd.toFixed(2);

      res.status(200).json({
        status: "ok",
        data: {
          message: `Segugio created successfully for ${
            segugio.ensDomain ?? segugio.target
          } with address ${segugio.address}. PnL in USD: \$${pnlUsd}, ROI: ${roi}\%, Current Value: \$${currentValue}`,
          segugio: {
            owner: segugio.owner,
            address: segugio.address,
            target: segugio.target,
            ensDomain: segugio.ensDomain,
            resolvedEnsDomain: segugio.resolvedEnsDomain,
            timeRange: segugio.timeRange,
            onlyBuyTrades: segugio.onlyBuyTrades,
            defaultAmountIn: segugio.defaultAmountIn,
            defaultTokenIn: segugio.defaultTokenIn,
            xmtpGroupId: segugio.xmtpGroupId,
          },
        },
      });
    }
  } catch (err) {
    logger.error(`Error creating segugio: ${err}`);
    res.status(500).json({
      status: "nok",
      data: {
        message: `Error creating segugio: ${err}`,
      },
    });
  }
}

// This function will be used by the Caso's webhook when he finds a new transaction from the address we are following
export async function fireTx(req: Request, res: Response): Promise<void> {
  try {
    const parsedBody = fireTxSchema.safeParse(req.body);

    if (!parsedBody.success) {
      logger.error(`Error ${JSON.stringify(parsedBody.error.errors)}`);
      res.status(400).json({ error: parsedBody.error.errors });
    }

    const reqBody = parsedBody.data!;

    // take here the segugios from db to get the targets of the transaction
    logger.log(`looking for segugios for target ${getAddress(reqBody.from)}`);
    const segugios = await getSegugiosByTarget(getAddress(reqBody.from));
    logger.log(
      `found ${segugios.length} segugios for target ${getAddress(reqBody.from)}`
    );

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

    let result = await axios(
      `${env.APP_BASE_URL}/1inch/tokens-data?addresses=${reqBody.tokenOut}`,
      {
        method: "GET",
      }
    );

    if (result.status !== 200) {
      logger.error(
        `Error getting tokens data for ${reqBody.tokenOut}: ${result.data}`
      );
      res.status(500).json({
        error: `Error getting tokens data for ${reqBody.tokenOut}: ${result.data}`,
      });
      return;
    }

    const tokensData = result.data.data.tokensData as OneInchTokenData;
    const tokenOutData = tokensData[reqBody.tokenOut];

    for (var segugio of segugios) {
      let prompt;
      if (!reqBody.tokenOut || !reqBody.amountOut) {
        res.status(400).json({
          error: "tokenIn is required if you do not provide a prompt",
        });
        return;
      }
      prompt = `Swap ${segugio.defaultAmountIn}$ ${segugio.defaultTokenIn} to ${tokenOutData.symbol} (${tokenOutData.name}) on Base mainnet`;
      logger.log(`Using prompt: ${prompt}`);
      logger.log(
        `executing transaction for segugio ${segugio.address} from user ${segugio.owner}`
      );
      const privateKey = segugio.privateKey;

      const account = privateKeyToAccount(
        (privateKey.startsWith("0x")
          ? privateKey
          : `0x${privateKey}`) as Address
      );

      const { executedTransactions: executed, failedTransactions: failed } =
        await executeBrianTransactionsForSegugio(account, prompt, segugio);

      executedTransactions.push(...executed);
      failedTransactions.push(...failed);

      logger.log(
        `Brian transactions were processed. Executed count: ${executedTransactions.length}, Failed count: ${failedTransactions.length}`
      );
      await sendMessageToXmtpBot(
        segugio.xmtpGroupId,
        segugio.owner,
        segugio.address,
        `Transaction executed: ${prompt}`,
        executedTransactions[0].hash
      );
      logger.log(
        `Message sent to XMTP bot for segugio ${segugio.address} and owner ${segugio.owner}`
      );
    }

    res.status(200).json({
      status: "ok",
      data: {
        executedTransactions,
        failedTransactions,
      },
    });
  } catch (err) {
    logger.error(`Error firing transaction: ${err}`);
    res.status(500).json({
      status: "nok",
      data: {
        message: `Error firing transaction: ${err}`,
      },
    });
  }
}

export async function swapTx(req: Request, res: Response): Promise<void> {
  try {
    const { owner, target: tmpTarget, amount, tokenOut, tokenIn } = req.body;
    const target = getAddress(tmpTarget);
    const segugio = await getSegugioByTargetAndOwner(target, owner);
    if (!segugio) {
      res.status(404).json({
        status: "nok",
        data: {
          message: `Segugio not found for target ${target} and owner ${owner}`,
        },
      });
      return;
    }

    const prompt = `Swap ${amount}$ of ${tokenIn} for ${tokenOut} on Base mainnet`;
    const privateKey = segugio.privateKey;
    const account = privateKeyToAccount(
      (privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as Address
    );

    const { executedTransactions, failedTransactions } =
      await executeBrianTransactionsForSegugio(account, prompt, segugio);

    res.status(200).json({
      status: "ok",
      data: {
        message: `Transaction executed in your segugio ${segugio.address}. Swapped ${amount}$ of ${tokenIn} for ${tokenOut}`,
        blockScoutUrl: `${BLOCKSCOUT_URL}/tx/${executedTransactions[0].hash}`,
        executedTransactions,
        failedTransactions,
      },
    });
  } catch (error) {
    logger.error(`Error selling token: ${error}`);
    res.status(500).json({
      status: "nok",
      data: {
        message: `Error selling token: ${error}`,
      },
    });
  }
}

export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const { owner, target } = req.body;

    if (!owner) {
      res.status(400).json({
        status: "nok",
        data: {
          message: "Owner is required",
        },
      });
      return;
    }

    let message = "";

    if (target) {
      const segugio = await getSegugioByTargetAndOwner(target, owner);
      if (!segugio) {
        res.status(404).json({
          status: "nok",
          data: {
            message: `Segugio not found for target ${target} and owner ${owner}`,
          },
        });
        return;
      }

      let result = await axios(
        `${env.APP_BASE_URL}/1inch/profit-and-loss?addresses=${target}`,
        {
          method: "GET",
        }
      );

      if (result.status !== 200) {
        logger.error(
          `Error getting profit and loss for ${target}: ${result.data}`
        );
        res.status(500).json({
          error: `Error getting profit and loss for ${target}: ${result.data}`,
        });
        return;
      }

      const profitAndLoss = result.data.data.profitAndLoss as OneInchPnL;
      const baseResult = profitAndLoss.result.find(
        (pnl) => pnl.chain_id === base.id
      );
      const pnlUsd = baseResult?.abs_profit_usd.toFixed(2);
      const roi = baseResult?.roi ? (baseResult?.roi * 100).toFixed(4) : 0;

      result = await axios(
        `${env.APP_BASE_URL}/1inch/current-value?addresses=${target}`,
        {
          method: "GET",
        }
      );

      if (result.status !== 200) {
        logger.error(
          `Error getting current value for ${target}: ${result.data}`
        );
        res.status(500).json({
          error: `Error getting current value for ${target}: ${result.data}`,
        });
        return;
      }

      const currentValue = (result.data.data.currentValue as OneInchGeneralValue).result[0].value_usd.toFixed(2);

      message += `Segugio stats for ${segugio.ensDomain ?? segugio.target}\n\nPnL in USD: \$${pnlUsd}\nROI: ${roi}\%\nCurrent Value: \$${currentValue}`;
    }

    const segugios = await getSegugiosByOwner(owner);
    
    // we want to do again the calls, but this time we'll have in the queries ?addresses=${segugio0}&addresses=${segugio1}&addresses=${segugio2}&....
    let addresses = "addresses=" + segugios[0].target;
    for (var segugio of segugios) {
      if (segugio.target === segugios[0].target) {
        continue;
      }
      addresses += "&addresses=" + segugio.target;
    }

    let result = await axios(
      `${env.APP_BASE_URL}/1inch/profit-and-loss?${addresses}`,
      {
        method: "GET",
      }
    );

    if (result.status !== 200) {
      logger.error(
        `Error getting profit and loss for ${addresses}: ${result.data}`
      );
      res.status(500).json({
        error: `Error getting profit and loss for ${addresses}: ${result.data}`,
      });
      return;
    }

    const profitAndLoss = result.data.data.profitAndLoss as OneInchPnL;
    const baseResult = profitAndLoss.result.find(
      (pnl) => pnl.chain_id === base.id
    );
    const pnlUsd = baseResult?.abs_profit_usd.toFixed(2);
    const roi = baseResult?.roi ? (baseResult?.roi * 100).toFixed(4) : 0;

    result = await axios(
      `${env.APP_BASE_URL}/1inch/current-value?${addresses}`,
      {
        method: "GET",
      }
    );

    if (result.status !== 200) {
      logger.error(
        `Error getting current value for ${addresses}: ${result.data}`
      );
      res.status(500).json({
        error: `Error getting current value for ${addresses}: ${result.data}`,
      });
      return;
    }

    const currentValue = (result.data.data.currentValue as OneInchGeneralValue).result[0].value_usd.toFixed(2);

    message += `\n\nGeneral stats for your segugios\n\nPnL in USD: \$${pnlUsd}\nROI: ${roi}\%\nCurrent Value: \$${currentValue}`;

    res.status(200).json({
      status: "ok",
      data: {
        message,
      },
    });
  } catch  {
    logger.error(`Error getting stats`);
    res.status(500).json({
      status: "nok",
      data: {
        message: `Error getting stats`,
      },
    });
  }
}

export async function withdraw(req: Request, res: Response): Promise<void> {
  try {
    const { owner, target: tmpTarget, amount, tokenToTransfer } = req.body;
    const target = getAddress(tmpTarget);
    const segugio = await getSegugioByTargetAndOwner(target, owner);
    logger.log(
      `Correctly found segugio for target ${target} and owner ${owner}`
    );
    if (!segugio) {
      res.status(404).json({
        status: "nok",
        data: {
          message: `Segugio not found for target ${target} and owner ${owner}`,
        },
      });
      return;
    }

    const prompt = `Transfer ${amount}$ of ${tokenToTransfer} to ${segugio.owner} on Base mainnet`;
    const privateKey = segugio.privateKey;
    const account = privateKeyToAccount(
      (privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as Address
    );

    const { executedTransactions, failedTransactions } =
      await executeBrianTransactionsForSegugio(account, prompt, segugio, true);
    logger.log(
      `Brian transactions were processed. Executed count: ${executedTransactions.length}, Failed count: ${failedTransactions.length}`
    );

    res.status(200).json({
      status: "ok",
      data: {
        message: `Transaction executed in your segugio ${segugio.address}. Transferred ${amount}$ of ${tokenToTransfer} to ${segugio.owner}`,
        blockScoutUrl: `${BLOCKSCOUT_URL}/tx/${executedTransactions[0].hash}`,
        executedTransactions,
        failedTransactions,
      },
    });
  } catch (error) {
    logger.error(`Error selling token: ${error}`);
    res.status(500).json({
      status: "nok",
      data: {
        message: `Error selling token: ${error}`,
      },
    });
  }
}

async function executeBrianTransactionsForSegugio(
  account: PrivateKeyAccount,
  prompt: string,
  segugio: Segugio & { id: number },
  withdraw = false
) {
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
    prompt: string;
  }[] = [];
  const failedTransactions: {
    segugioId: number;
    target: string;
    owner: string;
    error: SendTransactionErrorType;
  }[] = [];
  for (var transactionResult of brianResponse) {
    logger.log(
      `reading transaction result with solver ${transactionResult.solver} and action ${transactionResult.action}`
    );
    if (transactionResult.action !== "swap" && withdraw == false) {
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

  return { executedTransactions, failedTransactions };
}

async function sendMessageToXmtpBot(
  groupId: string,
  userAddress: string,
  botAddress: string,
  message: string,
  txHash: string
) {
  message += `\nCheck the transaction on Blockscout: ${BLOCKSCOUT_URL}/tx/${txHash}`;

  const result = await axios(`${env.XMTP_BOT_URL}/send-message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "1234567890",
    },
    data: {
      groupId,
      userAddress,
      botAddress,
      message,
      txHash,
      blockScoutUrl: `${BLOCKSCOUT_URL}/tx/${txHash}`,
    },
  });

  if (result.status !== 200) {
    logger.error(
      `Error sending message to XMTP bot for segugio ${groupId}: ${result.data}`
    );
    return false;
  }

  logger.log(`Message sent to XMTP bot for segugio ${groupId}`);
  return true;
}
