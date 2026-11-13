"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, TrendingUp, Camera, Globe, Bookmark, Calculator, Sparkles, Activity } from "lucide-react";
import { StockDirectoryItem } from "@/data/globalStocks";

interface HeaderNavProps {
  activeTab: "stock" | "chart-photo" | "market-explorer" | "watchlist" | "calculator";
  setActiveTab: (tab: "stock" | "chart-photo" | "market-explorer" | "watchlist" | "calculator") => void;
  onSearchSelect: (symbol: string) => void;
  currentSymbol: string;
}

const TICKER_TAPE_ITEMS=[{s:"EDP.LS",name:"EDP"},{s:"GALP.LS",name:"Galp"},{s:"BCP.LS",name:"Millennium"},{s:"AAPL",name:"Apple"},{s:"NVDA",name:"Nvidia"},{s:"PETR4.SA",name:"Petrobras"},{s:"JMT.LS",name:"Jerónimo Martins"},{s:"ASML.AS",name:"ASML"}];

export function HeaderNav({ activeTab, setActiveTab, onSearchSelect, currentSymbol }: HeaderNavProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<StockDirectoryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live search query
  useEffect(() => {
    if (!query || query.trim().length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (symbol: string) => {
    onSearchSelect(symbol);
    setQuery("");
    setIsOpen(false);
    setActiveTab("stock");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      handleSelect(query.trim());
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl">
      {/* Ticker tape bar */}
      <div className="overflow-hidden border-b border-slate-900 bg-slate-950 py-1.5 text-[11px] text-slate-300">
        <div className="flex animate-marquee whitespace-nowrap gap-6 items-center">
          {TICKER_TAPE_ITEMS.concat(TICKER_TAPE_ITEMS).map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(item.s)}
              className="inline-flex items-center gap-1.5 hover:text-white transition cursor-pointer"
            >
              <span className="font-mono font-bold text-white">{item.s}</span>
              <span className="text-slate-500">{item.name} · referência</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Bar */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveTab("stock")}
            className="flex cursor-pointer items-center gap-2.5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20 text-white">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white">
                  AÇÕES<span className="text-blue-500">RADAR</span>
                </span>
                <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-black text-blue-400 border border-blue-500/30">
                  AI
                </span>
              </div>
              <span className="block text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                SÓ AÇÕES • TODOS OS MERCADOS
              </span>
            </div>
          </div>
        </div>

        {/* Global Live Search Bar */}
        <div ref={searchBoxRef} className="relative flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar qualquer ação mundial (ex: EDP.LS, GALP, AAPL, NVDA, PETR4)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-2xl bg-slate-900 border border-slate-700/80 pl-10 pr-10 py-2 text-xs font-medium text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-inner"
            />
            {isSearching && (
              <div className="absolute right-3.5 top-2.5 h-4 w-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && results.length > 0 && (
            <div className="absolute top-full mt-2 w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl z-50">
              <div className="p-2 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-800">
                Ações Encontradas (Clica para Analisar):
              </div>
              <div className="max-h-80 overflow-y-auto">
                {results.slice(0, 8).map((item) => (
                  <button
                    key={item.symbol}
                    onClick={() => handleSelect(item.symbol)}
                    className="flex w-full items-center justify-between p-3 text-left hover:bg-slate-800/80 transition border-b border-slate-800/50 last:border-b-0"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-blue-400">
                          {item.symbol}
                        </span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                          {item.country}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-medium">
                          {item.exchange}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-white block mt-0.5">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">
                      Analisar →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap items-center gap-1.5">
          <a href="/carteiras" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300">Carteiras até 100k</a>
          <a href="/guia" className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-3.5 py-2 text-xs font-bold text-sky-300">Guia & pares</a>
          <button
            onClick={() => setActiveTab("stock")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === "stock"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Avaliação &amp; Expectativa</span>
          </button>

          <a
            href="/analise-grafico"
            className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 hover:brightness-110"
          >
            <Camera className="h-4 w-4 text-purple-200" />
            <span>Foto de Gráfico (Site 2)</span>
            <span className="rounded bg-purple-900/60 px-1.5 py-0.5 text-[9px] font-black text-purple-200 border border-purple-400/40">
              LINK DEDICADO
            </span>
          </a>

          <button
            onClick={() => setActiveTab("market-explorer")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === "market-explorer"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>Mercados Globais</span>
          </button>

          <button
            onClick={() => setActiveTab("watchlist")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === "watchlist"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Bookmark className="h-4 w-4" />
            <span>Watchlist</span>
          </button>

          <button
            onClick={() => setActiveTab("calculator")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === "calculator"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Calculator className="h-4 w-4" />
            <span>Valuation DCF</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
