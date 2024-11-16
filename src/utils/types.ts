export type Segugio = {
  owner: string; // unique address of the owner of the segugio
  privateKey: string; // private key of the segugio bot
  address: string; // address of the segugio bot
  targets: Target[]; // addresses of the users to copy trades from
  trades: Trade[]; // trades that the segugio has made
};

export type Target = {
  ensDomain: string | null;
  address: string | null;
  resolvedEnsDomain: string | null;
  timeRange: string;
  onlyBuyTrades: boolean;
  portfolioPercentage: number;
  tokenFrom: string;
};

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
