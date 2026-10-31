"use client";

import React, { useState, useEffect, useRef } from "react";
import { HeaderNav } from "@/components/HeaderNav";
import { StockDetailView } from "@/components/StockDetailView";
import StockNews from "@/components/StockNews";
import ResilientCandleChart from "@/components/ResilientCandleChart";
import { ChartPhotoAnalyzer } from "@/components/ChartPhotoAnalyzer";
import { MarketExplorer } from "@/components/MarketExplorer";
import { WatchlistView } from "@/components/WatchlistView";
import { ValuationCalculator } from "@/components/ValuationCalculator";
import { StockFullAnalysis } from "@/lib/stockApi";
import {
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  Zap
} from "lucide-react";

export default function HomePage() {
  const [currentSymbol, setCurrentSymbol] = useState<string>("EDP.LS");
  const [stockData, setStockData] = useState<StockFullAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "stock" | "chart-photo" | "market-explorer" | "watchlist" | "calculator"
  >("stock");
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([]);

  const requestId = useRef(0);

  // Fetch initial stock data & watchlist on mount
  useEffect(() => {
    const initialSymbol = new URLSearchParams(window.location.search).get("symbol") || currentSymbol;
    loadStock(initialSymbol);
    fetchWatchlistSymbols();
  }, []);

  const fetchWatchlistSymbols = async () => {
    try {
      const res = await fetch("/api/watchlist");
      if (res.ok) {
        const data = await res.json();
        const symbols = (data.watchlist || []).map((w: any) => w.symbol.toUpperCase());
        setWatchlistSymbols(symbols);
      }
    } catch (err) {
      console.error("Watchlist fetch error:", err);
    }
  };

  const loadStock = async (symbol: string) => {
    const currentRequest = ++requestId.current;
    try {
      setLoading(true);
      setStockData(null);
      setError(null);
      setCurrentSymbol(symbol.toUpperCase());

      const res = await fetch(`/api/stocks/${encodeURIComponent(symbol.toUpperCase())}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Não foi possível carregar a ação.");
      }

      const data: StockFullAnalysis = await res.json();
      if (currentRequest !== requestId.current) return;
      setStockData(data);
      window.history.replaceState(null, "", `?symbol=${encodeURIComponent(symbol.toUpperCase())}`);
    } catch (err: any) {
      if (currentRequest !== requestId.current) return;
      setError(err.message || "Erro ao carregar dados da ação.");
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  };

  const handleSelectStock = (symbol: string) => {
    loadStock(symbol);
    setActiveTab("stock");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddToWatchlist = async (stock: StockFullAnalysis) => {
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: stock.symbol,
          name: stock.name,
          exchange: stock.exchange,
          currency: stock.currency,
          addedPrice: stock.currentPrice,
          targetPrice: stock.expectation.timeHorizonShort.targetPrice
        })
      });

      if (res.ok) {
        setWatchlistSymbols((prev) => [...prev, stock.symbol.toUpperCase()]);
      }
    } catch (err) {
      console.error("Error adding to watchlist:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Header & Navigation */}
      <HeaderNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSearchSelect={handleSelectStock}
        currentSymbol={currentSymbol}
      />
      {activeTab === "stock" && (loading || error) && <div className="mx-auto max-w-7xl px-4 py-4"><ResilientCandleChart symbol={currentSymbol} /><StockNews key={currentSymbol} symbol={currentSymbol} /></div>}

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        {/* Quick Stock Selector Bar for Popular International Tickers */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-semibold">
            <Zap className="h-4 w-4 text-amber-400" /> Acesso Imediato a Ações de Referência:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { s: "EDP.LS", label: "🇵🇹 EDP" },
              { s: "GALP.LS", label: "🇵🇹 Galp" },
              { s: "BCP.LS", label: "🇵🇹 BCP" },
              { s: "JMT.LS", label: "🇵🇹 Jerónimo" },
              { s: "NVDA", label: "🇺🇸 Nvidia" },
              { s: "AAPL", label: "🇺🇸 Apple" },
              { s: "MSFT", label: "🇺🇸 Microsoft" },
              { s: "TSLA", label: "🇺🇸 Tesla" },
              { s: "PETR4.SA", label: "🇧🇷 Petrobras" },
              { s: "VALE3.SA", label: "🇧🇷 Vale" },
              { s: "ASML.AS", label: "🇪🇺 ASML" },
              { s: "MC.PA", label: "🇪🇺 LVMH" },
              { s: "SAP.DE", label: "🇪🇺 SAP" }
            ].map((item) => (
              <button
                key={item.s}
                onClick={() => handleSelectStock(item.s)}
                className={`rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold transition ${
                  currentSymbol.toUpperCase() === item.s.toUpperCase() && activeTab === "stock"
                    ? "bg-blue-600 text-white shadow"
                    : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Primary Stock Evaluation & Expectation */}
        {activeTab === "stock" && (
          <div>
            {loading ? (
              <div className="flex min-h-[450px] flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/50 p-12 text-center">
                <div className="relative h-16 w-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                  <div className="absolute inset-2 rounded-full border-4 border-emerald-500 border-b-transparent animate-spin [animation-direction:reverse]" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  A carregar e a calcular indicadores de {currentSymbol}...
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  A processar RSI(14), Médias Móveis, Bandas de Bollinger, MACD e Projeção de Expectativas (Sobe/Desce).
                </p>
              </div>
            ) : error ? (
              <div className="rounded-3xl border border-rose-900/60 bg-rose-950/30 p-8 text-center space-y-3">
                <AlertCircle className="mx-auto h-12 w-12 text-rose-400" />
                <h3 className="text-lg font-bold text-white">Erro ao analisar ação</h3>
                <p className="text-xs text-rose-300 max-w-md mx-auto">{error}</p>
                <button
                  onClick={() => loadStock(currentSymbol)}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  <RefreshCw className="h-4 w-4" /> Tentar Novamente
                </button>
              </div>
            ) : stockData ? (
              <StockDetailView
                stock={stockData}
                onAddToWatchlist={handleAddToWatchlist}
                isWatchlisted={watchlistSymbols.includes(stockData.symbol.toUpperCase())}
              />
            ) : null}
          </div>
        )}

        {/* Tab 2: Chart Photo Analyzer (AI Vision) */}
        {activeTab === "chart-photo" && <ChartPhotoAnalyzer />}

        {/* Tab 3: Global Market Explorer */}
        {activeTab === "market-explorer" && (
          <MarketExplorer
            onSelectStock={handleSelectStock}
            selectedSymbol={currentSymbol}
          />
        )}

        {/* Tab 4: Watchlist */}
        {activeTab === "watchlist" && (
          <WatchlistView onSelectStock={handleSelectStock} />
        )}

        {/* Tab 5: Valuation DCF Calculator */}
        {activeTab === "calculator" && <ValuationCalculator />}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-300">AÇÕESRADAR AI</span>
              <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-emerald-400 border border-slate-800">
                100% Dedicado a Ações
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Plataforma de inteligência financeira e avaliação técnica/fundamental com cobertura para todos os tickers e bolsas mundiais.
            </p>
          </div>

          <div className="text-[11px] text-slate-500 max-w-md text-right sm:text-right text-left">
            Aviso de Risco: Todas as análises, projeções de subida/descida e cálculos de valuation são gerados algorítmicamente para fins informativos e analíticos, não constituindo recomendação financeira formal.
          </div>
        </div>
      </footer>
    </div>
  );
}
