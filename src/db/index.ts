import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

// A ligação é opcional: se DATABASE_URL não existir (ex.: deploy simples na Vercel),
// usamos uma connection string local de fallback. As rotas que usam a BD já têm
// try/catch e degradam graciosamente (watchlist vazia, histórico vazio).
export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl || "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
    connectionTimeoutMillis: 4000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const hasDatabase = Boolean(databaseUrl);

export const db = drizzle(pool);
