import { env } from "../env.js";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { and, eq } from "drizzle-orm";

import { segugioTable, tradeTable } from "./schemas/db.schema.js";
import { Segugio } from "./types.js";

export const tursoClient = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(tursoClient, {
  schema: { segugioTable, tradeTable },
});

export const checkDuplicateSegugio = async (owner: string, target: string) => {
  const segugio = await db.query.segugioTable.findFirst({
    where: and(eq(segugioTable.owner, owner), eq(segugioTable.target, target)),
  });
  return !!segugio;
}

export const saveSegugio = async (segugioValues: Segugio) => {
  await db.insert(segugioTable).values({
    owner: segugioValues.owner,
    target: segugioValues.target,
    privateKey: segugioValues.privateKey,
    address: segugioValues.address,
    ensDomain: segugioValues.ensDomain,
    resolvedEnsDomain: segugioValues.resolvedEnsDomain,
    timeRange: segugioValues.timeRange,
    onlyBuyTrades: segugioValues.onlyBuyTrades,
    defaultAmountIn: segugioValues.defaultAmountIn,
    defaultTokenIn: segugioValues.defaultTokenIn,
    xmtpGroupId: segugioValues.xmtpGroupId,
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

export const getSegugiosByTarget = async (target: string) => {
  const segugio = await db.query.segugioTable.findMany({
    where: eq(segugioTable.target, target),
  });
  return segugio;
};

export const getSegugiosByOwner = async (owner: string) => {
  const segugio = await db.query.segugioTable.findMany({
    where: eq(segugioTable.owner, owner),
  });
  return segugio;
};

export const getTrades = async (segugioId: number) => {
  const trades = await db.query.tradeTable.findMany({
    where: eq(tradeTable.segugioId, segugioId),
  });
  return trades;
};
