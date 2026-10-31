import { jsonb, varchar, pgTable, text, serial, timestamp, doublePrecision, boolean } from "drizzle-orm/pg-core";

export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  exchange: text("exchange").notNull(),
  currency: text("currency").notNull().default("USD"),
  addedPrice: doublePrecision("added_price"),
  targetPrice: doublePrecision("target_price"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chartAnalyses = pgTable("chart_analyses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  symbol: text("symbol"),
  imageUrl: text("image_url"),
  verdict: text("verdict").notNull(), // 'SOBE' | 'DESCE' | 'NEUTRO'
  confidence: doublePrecision("confidence").notNull(), // e.g. 78
  patternDetected: text("pattern_detected").notNull(),
  trend: text("trend").notNull(), // 'ALTA' | 'BAIXA' | 'LATERAL'
  entryPrice: text("entry_price"),
  stopLoss: text("stop_loss"),
  takeProfit1: text("take_profit_1"),
  takeProfit2: text("take_profit_2"),
  riskReward: text("risk_reward"),
  rationale: text("rationale").notNull(),
  keyIndicators: text("key_indicators"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stockAlerts = pgTable("stock_alerts", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  condition: text("condition").notNull(), // 'ACIMA' | 'ABAIXO'
  targetValue: doublePrecision("target_value").notNull(),
  isTriggered: boolean("is_triggered").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Cache persistente de OHLC real, separada dos relatórios de análise. */
export const marketHistoryCache = pgTable("market_history_cache", {
  symbol: varchar("symbol", {length:32}).primaryKey(),
  payload: jsonb("payload").notNull(),
  updatedAt: timestamp("updated_at", {withTimezone:true}).defaultNow().notNull(),
});
