import type { Request, Response } from "express";
import { Logger } from "../../utils/logger.js";
import { addAddressQuickNodeSchema, notifyTxQuickNodeSchema } from "../../utils/schemas/quicknode.schema.js";
import { DecodedEvent, DecodedTransferEvent, ProtocolEventType, QuickNodeNotification, QuickNodeTrade } from "../../utils/types.js";
import { env } from "../../env.js";
import { decodeEventLog, Log, parseAbi } from "viem";
import { events, TransferAbi } from "../../utils/constants.js";

const logger = new Logger("quicknode");

const QUICKNODE_API_KEY = env.QUICKNODE_API_KEY
const QUICKNODE_NOTIFICATION_ID = env.QUICKNODE_NOTIFICATION_ID

async function getNotification() {
  var myHeaders = new Headers()
  myHeaders.append('accept', 'application/json')
  myHeaders.append('x-api-key', QUICKNODE_API_KEY)

  var requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow' as RequestRedirect
  }

  try {
    let response = await fetch(
      `https://api.quicknode.com/quickalerts/rest/v1/notifications/${QUICKNODE_NOTIFICATION_ID}`,
      requestOptions
    )
    let result = await response.text()
    return JSON.parse(result) as QuickNodeNotification
  } catch (err) {
    logger.error(err as string)
    return undefined
  }
}

export async function addAddressToScan(req: Request, res: Response) {
  logger.log("Adding Address to QuickNode webhook...");
  const parsedBody = addAddressQuickNodeSchema.safeParse(req.body);

  if (!parsedBody.success) {
    logger.error(`Error ${JSON.stringify(parsedBody.error.errors)}`);
    res.status(400).json({ error: parsedBody.error.errors });
  } else {
    let notification = await getNotification()

    if (!notification) {
      res.status(500).json({ error: 'Error getting notification' })
      return
    }

    if (notification.expression.includes(parsedBody.data.address)) {
      res.status(200).json({
        status: "ok",
        data: {
          address: parsedBody.data.address,
          message: `Address already exists in QuickNode for ${parsedBody.data.address}`,
        }
      });
      return
    }

    const newExpression = `${notification.expression} && ((tx_to == '${parsedBody.data.address}') || (tx_from == '${parsedBody.data.address}'))`
    const encodedNewExpression = Buffer.from(newExpression).toString('base64')

    var myHeaders = new Headers()
    myHeaders.append('accept', 'application/json')
    myHeaders.append('Content-Type', 'application/json')
    myHeaders.append('x-api-key', QUICKNODE_API_KEY)

    var requestOptions = {
      method: 'PATCH',
      headers: myHeaders,
      redirect: 'follow' as RequestRedirect,
      body: JSON.stringify({
        expression: encodedNewExpression,
      }),
    }

    try {
      await fetch(
        `https://api.quicknode.com/quickalerts/rest/v1/notifications/${QUICKNODE_NOTIFICATION_ID}`,
        requestOptions
      )
    } catch (err) {
      logger.error(err as string)
      res.status(500).json({ error: 'Error updating notification' })
    }

    res.status(200).json({
      status: "ok",
      data: {
        address: parsedBody.data.address,
        message: `Successfully added address to QuickNode for ${parsedBody.data.address}`,
      }
    });
  }
}

export async function notifyTx(req: Request, res: Response) {
  try {
    const parsed = notifyTxQuickNodeSchema.safeParse(req.body);

    if (!parsed.success) {
      logger.error(`Error ${JSON.stringify(parsed.error.errors)}`);
      res.status(400).json({ error: parsed.error.errors });
    }

    const transferAbi = parseAbi([TransferAbi]);
  
    let trade: QuickNodeTrade;
    let tradeTokenIn: string | undefined;
    let tradeTokenOut: string | undefined;
    let tradeAmountIn: bigint = 0n;
    let tradeAmountOut: bigint = 0n;
  
    parsed.data!.forEach((tx) => {
      let swapEvents: DecodedEvent[] = []
      let transferEvents: DecodedTransferEvent[] = []
      mainLoop:
      for (let event of events) {
        const argTokenIn = event.tokenIn!;
        const argTokenOut = event.tokenOut!;
        const argAmountIn = event.amountIn!;
        const argAmountOut = event.amountOut!;
        let eventFound = false;
        firstLogsLoop:
        for (let log of tx.logs) {
          if (event.topic === log.topics[0]) {
            eventFound = true;
            try {
              const abi = parseAbi([event.name]);
              const decodedSwapLog = decodeEventLog({
                abi,
                topics: log.topics as [signature: `0x${string}`, ...args: `0x${string}`[]],
                data: log.data as `0x${string}`,
              });
              if (decodedSwapLog?.args) {
                if (event.type === ProtocolEventType.Aggregator) {
                  trade = {
                    from: tx.from,
                    protocol: event.protocol,
                    tokenIn: decodedSwapLog.args[argTokenIn as keyof typeof decodedSwapLog.args] as string,
                    tokenOut: decodedSwapLog.args[argTokenOut as keyof typeof decodedSwapLog.args] as string,
                    amountIn: decodedSwapLog.args[argAmountIn as keyof typeof decodedSwapLog.args] as bigint,
                    amountOut: decodedSwapLog.args[argAmountOut as keyof typeof decodedSwapLog.args] as bigint,
                  };
                  break mainLoop;
                } else {
                  swapEvents.push({
                    encodedLog: log as unknown as Log<bigint, number, false>,
                    ...decodedSwapLog
                  })
                  break firstLogsLoop;
                }
              }
            } catch {}
          }
        }
        if (!eventFound) {
          continue;
        }
        for (let log of tx.logs) {
          try {
            const decodedSwapLog = decodeEventLog({
              abi: parseAbi([event.name]),
              topics: log.topics as [signature: `0x${string}`, ...args: `0x${string}`[]],
              data: log.data as `0x${string}`,
            });
            if (decodedSwapLog?.args && !swapEvents.includes({encodedLog: log as unknown as Log<bigint, number, false>, ...decodedSwapLog})) {
              swapEvents.push({encodedLog: log as unknown as Log<bigint, number, false>, ...decodedSwapLog})
            }
          } catch {
            try {
              const decodedTransferLog = decodeEventLog({
                abi: transferAbi,
                topics: log.topics as [signature: `0x${string}`, ...args: `0x${string}`[]],
                data: log.data as `0x${string}`,
              })
              if (decodedTransferLog?.args) {
                transferEvents.push({encodedLog: log as unknown as Log<bigint, number, false>, ...decodedTransferLog})
              }
            } catch {}
          }
        }
        if (swapEvents.length === 0) {
            break mainLoop;
        }
        if (swapEvents.length === 1) {
          let swapEvent = swapEvents[0]
          if (argAmountIn instanceof Array) {
            for (let arg of argAmountIn) {
              const amountInToAdd = swapEvent.args?.[arg as keyof typeof swapEvent.args] as bigint;
              tradeAmountIn += amountInToAdd;
            }
          } else {
            const amount0 = BigInt(swapEvent.args?.[argAmountIn as keyof typeof swapEvent.args] as string);
            if (amount0 < 0n) {
              tradeAmountOut = -amount0;
            } else {
              tradeAmountIn = amount0;
            }
          }
          if (argAmountOut instanceof Array) {
            for (let arg of argAmountOut) {
              const amountOutToAdd = swapEvent.args?.[arg as keyof typeof swapEvent.args] as bigint;
              tradeAmountOut += amountOutToAdd;
            }
          } else {
            const amount1 = BigInt(swapEvent.args?.[argAmountOut as keyof typeof swapEvent.args] as string);
            if (amount1 < 0n) {
              tradeAmountOut = -amount1;
            } else {
              tradeAmountIn = amount1;
            }
          }
          for (let transferEvent of transferEvents) {
            let transferValue = 0n;
            if (transferEvent.args) {
              transferValue = BigInt(transferEvent.args.value)
            }
            if (tradeAmountIn === transferValue) {
              tradeTokenIn = transferEvent.encodedLog.address;
            } else if (tradeAmountOut === transferValue) {
              tradeTokenOut = transferEvent.encodedLog.address;
            }
          }
          if (tradeTokenIn && tradeTokenOut && tradeAmountIn && tradeAmountOut) {
            trade = {
              from: tx.from,
              protocol: event.protocol,
              tokenIn: tradeTokenIn,
              tokenOut: tradeTokenOut,
              amountIn: tradeAmountIn,
              amountOut: tradeAmountOut,
            };
            break mainLoop;
          }
        } else {
          let firstSwapEvent = swapEvents[0];
          let lastSwapEvent = swapEvents[swapEvents.length - 1];
          if (argAmountIn instanceof Array) {
            for (let arg of argAmountIn) {
              const amountInToAdd = firstSwapEvent.args?.[arg as keyof typeof firstSwapEvent.args] as bigint;
              tradeAmountIn += amountInToAdd;
            }
          } else {
            const amount0 = BigInt(firstSwapEvent.args?.[argAmountIn as keyof typeof firstSwapEvent.args] as string);
            const amount1 = BigInt(firstSwapEvent.args?.[argAmountOut as keyof typeof lastSwapEvent.args] as string);
            tradeAmountIn = amount0 > 0n ? amount0 : amount1;
          }
          if (argAmountOut instanceof Array) {
            for (let arg of argAmountOut) {
              const amountOutToAdd = lastSwapEvent.args?.[arg as keyof typeof lastSwapEvent.args] as bigint;
              tradeAmountOut += amountOutToAdd;
            }
          } else {
            const amount0 = BigInt(lastSwapEvent.args?.[argAmountIn as keyof typeof lastSwapEvent.args] as string);
            const amount1 = BigInt(lastSwapEvent.args?.[argAmountOut as keyof typeof lastSwapEvent.args] as string);
            tradeAmountOut = amount0 < 0n ? -amount0 : -amount1;
          }
          for (let transferEvent of transferEvents) {
            let transferValue = 0n;
            if (transferEvent.args) {
              transferValue = BigInt(transferEvent.args.value)
            }
            if (tradeAmountIn === transferValue) {
              tradeTokenIn = transferEvent.encodedLog.address;
            } else if (tradeAmountOut === transferValue) {
              tradeTokenOut = transferEvent.encodedLog.address;
            }
          }
          if (tradeTokenIn && tradeTokenOut && tradeAmountIn && tradeAmountOut) {
            trade = {
              from: tx.from,
              protocol: event.protocol,
              tokenIn: tradeTokenIn,
              tokenOut: tradeTokenOut,
              amountIn: tradeAmountIn,
              amountOut: tradeAmountOut,
            };
            break mainLoop;
          }
        }
      }
  
      logger.log(`New Trade:${
        JSON.stringify(trade, (_, value) => typeof value === 'bigint' ? value.toString() : value, 2)
      }`);
    });
  
    res.send("ok");
  } catch (err) {
    logger.error(err as string)
    res.status(500).json({ error: 'Error processing trade' })
  }
}
