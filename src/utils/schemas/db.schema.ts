import { sql } from "drizzle-orm";
import { text, sqliteTable, integer, real,  } from "drizzle-orm/sqlite-core";

export const segugioTable = sqliteTable("segugio", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  owner: text("owner").notNull(), // address of the owner of the segugio
  target: text("target").notNull(), // address of the target to copy trades from
  privateKey: text("private_key").notNull(), // private key of the segugio bot
  address: text("address").notNull(), // address of the segugio bot
  // this data should be here because the relation is changed
  ensDomain: text("ens_domain"),
  resolvedEnsDomain: text("resolved_ens_domain"),
  timeRange: text("time_range").notNull(),
  onlyBuyTrades: integer("only_buy_trades")
    .$type<boolean>()
    .notNull()
    .default(true),
  defaultAmountIn: real("default_amount_in").notNull(),
  defaultTokenIn: text("default_token_in").notNull(),
  xmtpGroupId: text("xmtp_group_id").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const tradeTable = sqliteTable("trade", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  segugioId: integer("segugio_id").references(() => segugioTable.id),
  txHash: text("tx_hash"),
  status: text("status").notNull().default("pending"), // pending, confirmed, failed
  from: text("from").notNull(),
  protocol: text("protocol").notNull(),
  tokenIn: text("token_in").notNull(),
  tokenOut: text("token_out").notNull(),
  amountIn: text("amount_in").notNull(),
  amountOut: text("amount_out").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
