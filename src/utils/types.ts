import type { Log } from "viem";

export type Segugio = {
  owner: string; // unique address of the owner of the segugio
  privateKey: string; // private key of the segugio bot
  address: string; // address of the segugio bot
  target: string;
  ensDomain: string | null;
  resolvedEnsDomain: string | null;
  timeRange: string;
  onlyBuyTrades: boolean;
  defaultAmountIn: number;
  defaultTokenIn: string;
  xmtpGroupId: string;
  trades?: Trade[]; // trades that the segugio has made
};

// export type Target = {
//   ensDomain: string | null;
//   address: string | null;
//   resolvedEnsDomain: string | null;
//   timeRange: string;
//   onlyBuyTrades: boolean;
//   portfolioPercentage: number;
//   tokenFrom: string;
// };

export type Trade = {
  txHash?: string;
  status?: "pending" | "confirmed" | "failed";
  from: string;
  protocol: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: bigint;
  amountOut: bigint;
};

export type QuickNodeNotification = {
  id: string
  created_at: string
  updated_at: string
  name: string
  expression: string
  network: string
  destinations: Array<{
    id: string
    name: string
    to: string
    webhook_type: string
    service: string
    payload_type: number
  }>
  enabled: boolean
}

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

export type QuickNodeTrade = {
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

export type QuickNodeTx = {
  blockHash: string;
  blockNumber: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  effectiveGasPrice: string;
  from: string;
  gasUsed: string;
  logs: Array<{
    address: string;
    blockHash: string;
    blockNumber: bigint;
    data: string;
    logIndex: number;
    removed: boolean;
    topics: string[];
    transactionHash: string;
    transactionIndex: number;
  }>;
  logsBloom: string;
  status: string;
  to: string;
  transactionHash: string;
  transactionIndex: string;
  type: string;
}

export type OneInchTokenData = {
  [address: string]: {
    address: string;
    chainId: number;
    decimals: number;
    name: string;
    symbol: string;
    providers: string[];
    logoURI: string;
    eip2612: boolean;
    tags: string[];
    rating: number;
  }
}