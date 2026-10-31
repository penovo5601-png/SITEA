"use client";

import { useState } from "react";
import type { StockFullAnalysis } from "@/lib/stockApi";
import { StockChart } from "./StockChart";
import ConfluencePanel from "./ConfluencePanel";
import StockNews from "./StockNews";
import { Bookmark, Check, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface Props { stock: StockFullAnalysis; onAddToWatchlist?: (stock: StockFullAnalysis) => void; isWatchlisted?: boolean }
const number = (n: number | null | undefined, digits = 2) => n == null || !Number.isFinite(n) ? "—" : n.toLocaleString("pt-PT", { maximumFractionDigits: digits, minimumFractionDigits: digits });
const tint = (n: number) => n >= 12 ? "text-emerald-400" : n <= -12 ? "text-rose-400" : "text-amber-300";

export function StockDetailView({ stock, onAddToWatchlist, isWatchlisted = false }: Props) {
  const [added, setAdded] = useState(isWatchlisted);
  const a = stock.research;
  const bullish = a.verdict === "SUBIR", bearish = a.verdict === "DESCER";
  const color = bullish ? "text-emerald-400" : bearish ? "text-rose-400" : "text-amber-300";
  const border = bullish ? "border-emerald-500/40" : bearish ? "border-rose-500/40" : "border-amber-500/30";
  const f = a.fundamentals;
  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><div className="flex flex-wrap items-center gap-2"><span className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1 font-mono text-sm font-bold text-blue-300">{stock.symbol}</span><span className="text-xs text-slate-500">{stock.exchange} · {stock.country}</span><span className="rounded border border-slate-700 px-2 py-0.5 text-[10px] font-bold text-emerald-300">AÇÃO</span></div><h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">{stock.name}</h1><p className="mt-1 text-xs text-slate-400">{stock.sector} {stock.industry ? `· ${stock.industry}` : ""}</p></div>
          <div className="text-right"><div className="font-mono text-3xl font-bold text-white">{number(a.price, a.price < 1 ? 4 : 2)} <span className="text-sm text-slate-500">{a.currency}</span></div><div className={`mt-1 font-mono text-sm font-bold ${stock.change >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{stock.change >= 0 ? "▲ +" : "▼ "}{number(stock.change)} ({stock.changePercent >= 0 ? "+" : ""}{number(stock.changePercent)}%)</div><button onClick={() => { onAddToWatchlist?.(stock); setAdded(true); }} disabled={added} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-600/20 px-3 py-2 text-xs font-semibold text-blue-200 disabled:border-emerald-700 disabled:text-emerald-300">{added ? <Check className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}{added ? "Na tua watchlist" : "Seguir ação"}</button></div>
        </div>
        <div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-slate-800 pt-3 font-mono text-[11px] text-slate-500"><span>52 semanas: {number(a.low52)} — {number(a.high52)} {a.currency}</span><span>{a.signals.length} sinais · {a.confluence?.observations ?? 0} barras reais</span><time dateTime={stock.lastUpdated}>Consulta {new Date(stock.lastUpdated).toLocaleString("pt-PT")}</time></div>
      </header>

      <section className={`overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl ${border}`} aria-label="Expectativa: sobe ou desce">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.17em] text-slate-500">Expectativa conjugada · AçõesRadar</p><div className={`mt-2 flex items-center gap-3 text-3xl font-black sm:text-4xl ${color}`}>{bullish ? <TrendingUp className="h-9 w-9" /> : bearish ? <TrendingDown className="h-9 w-9" /> : <Activity className="h-9 w-9" />}{bullish ? "SOBE" : bearish ? "DESCE" : "NEUTRO · AGUARDAR"}</div><p className="mt-2 text-xs text-slate-400">Horizonte de referência: {a.horizon}. Leitura condicional dos dados disponíveis.</p></div>
          <div className="flex gap-6"><div className="text-right"><span className="text-[10px] uppercase tracking-wider text-slate-500">Score conjugado</span><div className={`mt-1 font-mono text-3xl font-bold ${color}`}>{a.score > 0 ? "+" : ""}{a.score.toFixed(1)}<span className="text-xs text-slate-600">/100</span></div></div><div className="text-right"><span className="text-[10px] uppercase tracking-wider text-slate-500">Convergência / qualidade</span><div className="mt-1 font-mono text-3xl font-bold text-slate-100">{a.confidence}<span className="text-xs text-slate-600">/100</span></div></div></div>
        </div>
        <p className="mt-5 border-t border-slate-800 pt-4 text-sm leading-relaxed text-slate-300">{a.summary}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">{a.timeframes.map(t => <div key={t.label} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><div className="text-[10px] uppercase tracking-wider text-slate-500">{t.label}</div><div className={`mt-2 flex justify-between gap-3 font-mono text-sm font-bold ${tint(t.score)}`}><span>{t.verdict === "SUBIR" ? "▲ SOBE" : t.verdict === "DESCER" ? "▼ DESCE" : "◆ NEUTRO"}</span><span>{t.score > 0 ? "+" : ""}{t.score.toFixed(1)}</span></div></div>)}</div>
        <p className="mt-4 text-[11px] text-slate-500">Viés heurístico de subida: {a.probabilityUp}%. Não é uma probabilidade calibrada ou taxa de acerto. Os indicadores não garantem movimentos futuros.</p>
      </section>

      <ConfluencePanel report={a.confluence} />
      <StockNews key={stock.symbol} symbol={stock.symbol} />

      {a.sourceNotes.length > 0 && <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-xs leading-relaxed text-amber-200/90">{a.sourceNotes.map(note => <p key={note}>{note}</p>)}</div>}
      {stock.history.length > 0 ? <StockChart history={stock.history} symbol={stock.symbol} currency={stock.currency} /> : <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-7 text-center"><p className="text-sm font-semibold text-slate-300">Sem histórico de velas nesta consulta</p><p className="mt-2 text-xs text-slate-500">A análise usa apenas os indicadores reais disponibilizados pelo scanner. Nenhum gráfico simulado foi gerado.</p></div>}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5"><h2 className="text-sm font-bold text-slate-100">Cenário de preço e gestão de risco</h2><p className="mt-1 text-[11px] text-slate-500">Referências técnicas por ATR, não preços garantidos. Num cenário neutro, aguardar confirmação.</p><div className="mt-4 grid grid-cols-2 gap-3">{[["Referência / entrada", a.plan.entry], ["Alvo 1", a.plan.target1], ["Alvo 2", a.plan.target2], ["Stop / invalidação", a.plan.stop]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"><div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div><div className="mt-1 font-mono text-lg font-bold text-slate-100">{number(value as number)} <span className="text-xs text-slate-500">{a.currency}</span></div></div>)}</div><p className="mt-3 text-xs text-slate-400">Risco / retorno: {a.plan.riskReward == null ? "—" : `1 : ${a.plan.riskReward.toFixed(2)}`}</p></section>
        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5"><h2 className="text-sm font-bold text-slate-100">Riscos e sinais contrários</h2><ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-400">{a.risks.map(r => <li key={r} className="rounded-lg border border-amber-500/15 bg-amber-500/5 p-2.5">⚠ {r}</li>)}</ul></section>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5"><h2 className="text-sm font-bold text-slate-100">Todos os sinais disponíveis</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{a.signals.map(s => <div key={s.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"><div className="flex justify-between gap-3"><h3 className="text-xs font-semibold text-slate-300">{s.name}</h3><span className={`font-mono text-xs font-bold ${tint(s.bias)}`}>{s.bias > 0 ? "+" : ""}{s.bias.toFixed(0)}</span></div><div className="mt-1 font-mono text-xs text-sky-300">{s.value}</div><p className="mt-2 text-[11px] leading-relaxed text-slate-500">{s.detail}</p></div>)}</div></section>
      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5"><h2 className="text-sm font-bold text-slate-100">Fundamentais observados · sem valores simulados</h2><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["P/E (TTM)", f?.pe], ["P/Book", f?.priceBook], ["EPS (TTM)", f?.eps], ["Dividendo (%)", f?.dividendYield], ["Beta", f?.beta], ["ROE (%)", f?.roe], ["Cap. bolsista", f?.marketCap], ["P/Sales", f?.priceSales]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3"><div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div><div className="mt-1 font-mono text-sm font-bold text-slate-200">{number(value as number | null | undefined)}</div></div>)}</div><p className="mt-3 text-[11px] text-slate-500">Valores indisponíveis aparecem como «—». Não são criados preços justos, rácios ou lucros fictícios.</p></section>
    </div>
  );
}
