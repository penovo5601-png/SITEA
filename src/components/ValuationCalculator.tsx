"use client";

import React, { useState } from "react";
import { Calculator, DollarSign, TrendingUp, Sparkles, Scale, Info } from "lucide-react";

export function ValuationCalculator() {
  const [currentPrice, setCurrentPrice] = useState<number>(100);
  const [eps, setEps] = useState<number>(5.5);
  const [bvps, setBvps] = useState<number>(35.0);
  const [growthRate, setGrowthRate] = useState<number>(12); // %
  const [discountRate, setDiscountRate] = useState<number>(9); // %
  const [terminalMultiple, setTerminalMultiple] = useState<number>(15);

  // Graham Formula: V = sqrt(22.5 * EPS * BVPS)
  const grahamValue = eps > 0 && bvps > 0 ? Math.sqrt(22.5 * eps * bvps) : 0;
  const grahamMarginOfSafety = currentPrice > 0 ? ((grahamValue - currentPrice) / currentPrice) * 100 : 0;

  // 5-Year DCF Estimation
  let dcfSum = 0;
  let projectedEps = eps;
  for (let i = 1; i <= 5; i++) {
    projectedEps *= (1 + growthRate / 100);
    const discounted = projectedEps / Math.pow(1 + discountRate / 100, i);
    dcfSum += discounted;
  }
  const terminalVal = (projectedEps * terminalMultiple) / Math.pow(1 + discountRate / 100, 5);
  const dcfFairValue = dcfSum + terminalVal;
  const dcfMarginOfSafety = currentPrice > 0 ? ((dcfFairValue - currentPrice) / currentPrice) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 mb-2">
          <Calculator className="h-3.5 w-3.5" /> FERRAMENTA DE VALUATION AVANÇADA
        </div>
        <h2 className="text-2xl font-black text-white sm:text-3xl">
          Calculadora de Preço Justo (DCF &amp; Benjamin Graham)
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl">
          Ferramenta hipotética: os números iniciais são exemplos, não dados da ação aberta. Substitui-os pelos relatórios reais. Calcula cenários de valor com base nas metodologias mais consagradas de Wall Street (Benjamin Graham e Fluxo de Caixa Descontado).
        </p>

        {/* Inputs */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-1">
            <label className="text-xs font-semibold text-slate-400">Preço Atual da Ação (€ / $)</label>
            <input
              type="number"
              step="any"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(Number(e.target.value) || 0)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-1">
            <label className="text-xs font-semibold text-slate-400">EPS (Lucro por Ação)</label>
            <input
              type="number"
              step="any"
              value={eps}
              onChange={(e) => setEps(Number(e.target.value) || 0)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-1">
            <label className="text-xs font-semibold text-slate-400">BVPS (Valor Contabilístico p/ Ação)</label>
            <input
              type="number"
              step="any"
              value={bvps}
              onChange={(e) => setBvps(Number(e.target.value) || 0)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-1">
            <label className="text-xs font-semibold text-slate-400">Taxa de Crescimento Anual Estimada (%)</label>
            <input
              type="number"
              step="any"
              value={growthRate}
              onChange={(e) => setGrowthRate(Number(e.target.value) || 0)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-1">
            <label className="text-xs font-semibold text-slate-400">Taxa de Desconto / WACC (%)</label>
            <input
              type="number"
              step="any"
              value={discountRate}
              onChange={(e) => setDiscountRate(Number(e.target.value) || 0)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-1">
            <label className="text-xs font-semibold text-slate-400">Múltiplo Terminal P/E</label>
            <input
              type="number"
              step="any"
              value={terminalMultiple}
              onChange={(e) => setTerminalMultiple(Number(e.target.value) || 0)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Results Comparison Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* DCF Card */}
          <div className="rounded-3xl border border-emerald-900/60 bg-gradient-to-br from-emerald-950/40 to-slate-950 p-6 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Modelo 1: Desconto de Fluxo de Caixa (DCF)
              </span>
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </div>

            <div className="text-3xl font-black text-white">
              {dcfFairValue.toFixed(2)} € / $
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300">Margem de Segurança / Desconto:</span>
              <span
                className={`text-sm font-black ${
                  dcfMarginOfSafety >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {dcfMarginOfSafety >= 0 ? "+" : ""}
                {dcfMarginOfSafety.toFixed(1)}%
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              {dcfMarginOfSafety > 15
                ? "🟢 Ação com desconto atrativo face ao valor presente dos lucros futuros projetados."
                : dcfMarginOfSafety < -15
                ? "🔴 Ação a negociar com prémio substancial face às projeções conservadoras."
                : "⚖️ Ação a cotar muito próximo do seu valor justo estimado."}
            </p>
          </div>

          {/* Benjamin Graham Card */}
          <div className="rounded-3xl border border-indigo-900/60 bg-gradient-to-br from-indigo-950/40 to-slate-950 p-6 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Modelo 2: Fórmula Clássica de Benjamin Graham
              </span>
              <Scale className="h-4 w-4 text-indigo-400" />
            </div>

            <div className="text-3xl font-black text-white">
              {grahamValue.toFixed(2)} € / $
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300">Margem Graham:</span>
              <span
                className={`text-sm font-black ${
                  grahamMarginOfSafety >= 0 ? "text-indigo-400" : "text-rose-400"
                }`}
              >
                {grahamMarginOfSafety >= 0 ? "+" : ""}
                {grahamMarginOfSafety.toFixed(1)}%
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              Fórmula baseada na obra de culto &ldquo;O Investidor Inteligente&rdquo; calculada como √(22.5 × EPS × BVPS), combinando lucros reais e valor patrimonial líquido.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
