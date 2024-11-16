import type { Request, Response } from "express";
import { decodeEventLog, parseAbi, type TransactionReceipt } from "viem";
import { events, TransferAbi } from "../constants";
import { ProtocolEventType, type DecodedEvent, type DecodedTransferEvent, type Trade } from "../types";

export function txIndex(req: Request, res: Response) {
  const txs = req.body;
  const transferAbi = parseAbi([TransferAbi]);

  let trade: Trade;
  let tradeTokenIn: string | undefined;
  let tradeTokenOut: string | undefined;
  let tradeAmountIn: bigint = 0n;
  let tradeAmountOut: bigint = 0n;

  txs.forEach((tx: TransactionReceipt) => {
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
              topics: log.topics,
              data: log.data,
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
                  encodedLog: log,
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
            topics: log.topics,
            data: log.data,
          });
          if (decodedSwapLog?.args && !swapEvents.includes({encodedLog: log, ...decodedSwapLog})) {
            swapEvents.push({encodedLog: log, ...decodedSwapLog})
          }
        } catch {
          try {
            const decodedTransferLog = decodeEventLog({
              abi: transferAbi,
              topics: log.topics,
              data: log.data
            })
            if (decodedTransferLog?.args) {
              transferEvents.push({encodedLog: log, ...decodedTransferLog})
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

    console.log(trade);
  });

  res.send("ok");
}
