import { NextResponse } from "next/server";
import { applyNewsWindow, fetchStockNews } from "@/lib/news";
import { GLOBAL_STOCKS_DIRECTORY } from "@/data/globalStocks";
import { RESEARCH_VERSION } from "@/lib/research/analyze-market";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
export async function GET(req: Request) {
 const url = new URL(req.url);
 const symbol = (url.searchParams.get("symbol") ?? "").trim().toUpperCase();
 if (!/^[A-Z0-9][A-Z0-9.\-]{0,23}$/.test(symbol)) return NextResponse.json({error:"Símbolo de ação inválido."},{status:400});
 const hours = Number(url.searchParams.get("hours") ?? 72);
 if (![24,48,72].includes(hours)) return NextResponse.json({error:"A janela deve ser 24, 48 ou 72 horas."},{status:400});
 const stock = GLOBAL_STOCKS_DIRECTORY.find(s=>s.symbol.toUpperCase()===symbol);
 const countryCode = symbol.endsWith(".LS") ? "PT" : symbol.endsWith(".SA") ? "BR" : null;
 const feed = await fetchStockNews({symbol,name:stock?.name,countryCode},url.searchParams.get("refresh")==="1");
 return NextResponse.json({...applyNewsWindow(feed,hours),version:RESEARCH_VERSION},{headers:{"Cache-Control":"no-store"}});
}
