export type Segugio = {
  owner: string; // unique address of the owner of the segugio
  privateKey: string; // private key of the segugio bot
  address: string; // address of the segugio bot
  target: string;
  ensDomain: string | null;
  resolvedEnsDomain: string | null;
  timeRange: string;
  onlyBuyTrades: boolean;
  portfolioPercentage: number;
  tokenFrom: string;
  trades: Trade[]; // trades that the segugio has made
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
