import type { Log } from "viem";

export enum ProtocolEventType {
  Aggregator = "Aggregator",
  Dex = "Dex"
}

export type ProtocolEvent = {
  protocol: string;
  topic: string;
  name: string;
  type: ProtocolEventType;
  tokenIn: string | undefined;
  tokenOut: string | undefined;
  amountIn: string | string[] | undefined;
  amountOut: string | string[] | undefined;
}

export type Trade = {
  from: string;
  protocol: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: bigint;
  amountOut: bigint;
}

export type DecodedEvent = {
  encodedLog: Log<bigint, number, false>
  eventName: undefined;
  args: readonly unknown[] | undefined;
}

export type DecodedTransferEvent = {
  encodedLog: Log<bigint, number, false>
  eventName: "Transfer";
  args: {
    from: `0x${string}`;
    to: `0x${string}`;
    value: bigint;
  }
}