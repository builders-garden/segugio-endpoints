import { env } from "../env.js";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";

import { segugioTable, targetTable, tradeTable } from "./schemas/db.schema.js";
import { Segugio, Target } from "./types.js";

export const tursoClient = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(tursoClient, {
  schema: { segugioTable, targetTable, tradeTable },
});

export const saveSegugio = async (segugioValues: Segugio) => {
  await db.insert(segugioTable).values({
    owner: segugioValues.owner,
    privateKey: segugioValues.privateKey,
    address: segugioValues.address,
  });
};

export const saveTarget = async (segugioId: number, targetValues: Target) => {
  await db.insert(targetTable).values({
    segugioId: segugioId,
    ensDomain: targetValues.ensDomain,
    address: targetValues.address,
    resolvedEnsDomain: targetValues.resolvedEnsDomain,
    timeRange: targetValues.timeRange,
    onlyBuyTrades: targetValues.onlyBuyTrades,
    portfolioPercentage: targetValues.portfolioPercentage,
    tokenFrom: targetValues.tokenFrom,
  });
};

// export const saveTrade = async (segugioId: number, tradeValues: Trade) => {
//   await db.insert(tradeTable).values({
//     segugioId: segugioId,
//     txHash: tradeValues.txHash,
//     status: tradeValues.status,
//     from: tradeValues.from,
//     protocol: tradeValues.protocol,
//     tokenIn: tradeValues.tokenIn,
//     tokenOut: tradeValues.tokenOut,
//     amountIn: tradeValues.amountIn,
//     amountOut: tradeValues.amountOut,
//   });
// };

export const getSegugio = async (address: string) => {
  const segugio = await db.query.segugioTable.findFirst({
    where: eq(segugioTable.address, address),
    with: {
      targets: true,
      trades: true,
    },
  });
  return segugio;
};

export const getTargets = async (segugioId: number) => {
  const targets = await db.query.targetTable.findMany({
    where: eq(targetTable.segugioId, segugioId),
  });
  return targets;
};

export const getTrades = async (segugioId: number) => {
  const trades = await db.query.tradeTable.findMany({
    where: eq(tradeTable.segugioId, segugioId),
  });
  return trades;
};
