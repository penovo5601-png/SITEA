import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { watchlist } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const items = await db.select().from(watchlist).orderBy(desc(watchlist.createdAt));
    return NextResponse.json({ watchlist: items });
  } catch (error: any) {
    console.error("Watchlist GET error:", error);
    return NextResponse.json({ watchlist: [], warning: "Base de dados não configurada" });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, name, exchange, currency, addedPrice, targetPrice, notes } = body;

    if (!symbol) {
      return NextResponse.json({ error: "Símbolo obrigatório" }, { status: 400 });
    }

    // Check if already in watchlist
    const existing = await db.select().from(watchlist).where(eq(watchlist.symbol, symbol.toUpperCase()));
    if (existing.length > 0) {
      return NextResponse.json({ message: "Ação já se encontra na tua watchlist", item: existing[0] });
    }

    const [inserted] = await db
      .insert(watchlist)
      .values({
        symbol: symbol.toUpperCase(),
        name: name || symbol.toUpperCase(),
        exchange: exchange || "Bolsa",
        currency: currency || "EUR",
        addedPrice: addedPrice ? Number(addedPrice) : null,
        targetPrice: targetPrice ? Number(targetPrice) : null,
        notes: notes || null
      })
      .returning();

    return NextResponse.json({ success: true, item: inserted });
  } catch (error: any) {
    console.error("Watchlist POST error:", error);
    return NextResponse.json({ error: "Erro ao adicionar à watchlist", details: error?.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const symbol = searchParams.get("symbol");

    if (id) {
      await db.delete(watchlist).where(eq(watchlist.id, Number(id)));
    } else if (symbol) {
      await db.delete(watchlist).where(eq(watchlist.symbol, symbol.toUpperCase()));
    } else {
      return NextResponse.json({ error: "ID ou Símbolo é obrigatório" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Watchlist DELETE error:", error);
    return NextResponse.json({ error: "Erro ao remover da watchlist" }, { status: 500 });
  }
}
