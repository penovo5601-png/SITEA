import { db, hasDatabase } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  let database = false;
  try {
    await db.execute(sql`select 1`);
    database = true;
  } catch {
    database = false;
  }

  // Em ambiente local (com DATABASE_URL definido) a BD é obrigatória.
  // Em deploys sem BD (ex.: Vercel sem variáveis), o site continua saudável.
  if (hasDatabase && !database) {
    return Response.json({ ok: false, database }, { status: 500 });
  }

  return Response.json({ ok: true, database });
}
