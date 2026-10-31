import { NextRequest, NextResponse } from "next/server";
import { fetchStockData } from "@/lib/stockApi";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    if (!symbol) {
      return NextResponse.json({ error: "Símbolo obrigatório" }, { status: 400 });
    }

    const data = await fetchStockData(symbol);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API stock error:", error);
    return NextResponse.json(
      { error: "Erro ao analisar ação", details: error?.message },
      { status: 503 }
    );
  }
}
