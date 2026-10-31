import { type PricePoint, type TechnicalAnalysisResult, type FundamentalData, type StockExpectationVerdict, calculateTechnicalAnalysis } from "./indicators";
import { GLOBAL_STOCKS_DIRECTORY, type StockDirectoryItem } from "@/data/globalStocks";
import { fetchStockNews } from "./news";
import { getMarketData } from "./research/market-data";
import { analyzeMarket, RESEARCH_VERSION } from "./research/analyze-market";
import type { StockAnalysis } from "./research/engine";

export interface StockFullAnalysis {
  symbol: string; name: string; exchange: string; currency: string; market: string; country: string;
  sector: string; industry: string; description: string; currentPrice: number; change: number; changePercent: number;
  open: number; high: number; low: number; volume: number; high52Week: number; low52Week: number;
  history: PricePoint[]; technical: TechnicalAnalysisResult; fundamental: FundamentalData;
  expectation: StockExpectationVerdict; lastUpdated: string;
  research: StockAnalysis; version: string;
}
const USER_AGENT = "Mozilla/5.0";

/** Apenas preços e indicadores observados. Falhas das fontes nunca geram um histórico fictício. */
export async function fetchStockData(symbol: string): Promise<StockFullAnalysis> {
  const cleanSymbol = symbol.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9.\-]{0,23}$/.test(cleanSymbol)) throw new Error("Símbolo de ação inválido.");
  const directory = GLOBAL_STOCKS_DIRECTORY.find(s => s.symbol.toUpperCase() === cleanSymbol);
  const [md, news] = await Promise.all([
    getMarketData(cleanSymbol, "2y", "1d", directory?.currency),
    fetchStockNews({symbol:cleanSymbol,name:directory?.name,countryCode:cleanSymbol.endsWith(".LS") ? "PT" : cleanSymbol.endsWith(".SA") ? "BR" : null}).catch(() => null),
  ]);
  const kind = String(md.scanner?.type ?? md.meta?.instrumentType ?? "EQUITY").toUpperCase();
  if (!["STOCK", "EQUITY", "DR"].includes(kind)) throw new Error("Esta plataforma analisa exclusivamente ações.");
  const analysis = analyzeMarket(md, { name: directory?.name, exchange: directory?.exchange, sector: directory?.sector, market: directory?.market }, news);
  if (!analysis) throw new Error(`Sem dados reais disponíveis para ${cleanSymbol}. Tenta novamente mais tarde; não apresentamos preços simulados como cotações.`);
  const history: PricePoint[] = (md.candles ?? []).map(c => ({ date: new Date(c.t).toISOString().slice(0,10), open:c.o, high:c.h, low:c.l, close:c.c, volume:c.v }));
  const technical = calculateTechnicalAnalysis(history);
  const ind = analysis.indicators;
  technical.currentPrice = analysis.price; technical.change = analysis.change; technical.changePercent = analysis.changePct;
  technical.high52Week = analysis.high52; technical.low52Week = analysis.low52;
  technical.rsi14 = ind.rsi14 ?? 0; technical.ema20 = ind.ema21 ?? 0; technical.sma50 = ind.sma50 ?? 0; technical.sma200 = ind.sma200 ?? 0;
  technical.macd = { line: ind.macd ?? 0, signal: ind.macdSignal ?? 0, histogram: ind.macdHist ?? 0, status: ind.macdHist == null ? "Neutro" : ind.macdHist >= 0 ? "Cruzamento Altista (Compra)" : "Cruzamento Baixista (Venda)" };
  technical.scoreTecnico = Math.round((analysis.score + 100) / 2);
  // Campos do contrato legado mantidos para compatibilidade. Só valores REAIS são
  // mostrados no novo painel fundamental (analysis.fundamentals); zero não é interpretado como medição.
  const f = analysis.fundamentals;
  const fundamental: FundamentalData = { peRatio:f?.pe ?? undefined, priceToBook:f?.priceBook ?? undefined,
    dividendYield:f?.dividendYield ?? undefined, marketCap:f?.marketCap ?? undefined, returnOnEquity:f?.roe ?? undefined,
    valuationStatus:"Dados insuficientes", scoreFundamental:0 };
  const direction = analysis.verdict === "SUBIR" ? "SOBE" : analysis.verdict === "DESCER" ? "DESCE" : "NEUTRO";
  const expectation: StockExpectationVerdict = {
    verdict: direction === "SOBE" ? analysis.score >= 45 ? "FORTE_SUBIDA" : "SUBIDA_MODERADA" : direction === "DESCE" ? analysis.score <= -45 ? "FORTE_QUEDA" : "QUEDA_MODERADA" : "NEUTRO",
    verdictLabel:analysis.verdictLabel, verdictEmoji:analysis.verdictEmoji, verdictColor:direction === "SOBE" ? "emerald" : direction === "DESCE" ? "rose" : "slate",
    direction, probability:direction === "DESCE" ? 100-analysis.probabilityUp : analysis.probabilityUp,
    confidenceLevel:analysis.confidence >= 70 ? "Alta Convicção" : analysis.confidence >= 45 ? "Média Convicção" : "Baixa / Cautela",
    overallScore:Math.round((analysis.score+100)/2),
    timeHorizonShort:{period:"1 a 4 Semanas (Swing Trade)",targetPrice:analysis.plan.target1,targetPercent:Number(((analysis.plan.target1/analysis.price-1)*100).toFixed(2)),stopLossPrice:analysis.plan.stop,riskPercent:Number(Math.abs(analysis.plan.downsidePct ?? 0).toFixed(2)),riskRewardRatio:analysis.plan.riskReward == null ? "—" : `1 : ${analysis.plan.riskReward.toFixed(2)}`},
    timeHorizonMedium:{period:"1 a 6 Meses (Posição)",targetPrice:analysis.plan.target2,targetPercent:Number((analysis.plan.upsidePct ?? 0).toFixed(2))},
    keyBullishFactors:analysis.signals.filter(s=>s.bias>=12).slice(0,5).map(s=>s.name+": "+s.detail),
    keyBearishRisks:analysis.risks,
    tradingPlan:analysis.summary,
  };
  const last = history[history.length-1];
  return { symbol:cleanSymbol,name:analysis.name,exchange:analysis.exchange,currency:analysis.currency,market:directory?.market ?? detectMarketByExchange(analysis.exchange,cleanSymbol),country:directory?.country ?? detectCountry(cleanSymbol,analysis.currency),sector:analysis.sector,industry:f?.industry ?? "",description:directory?.description ?? "Análise técnica com dados reais e notícias da empresa.",
    currentPrice:analysis.price,change:analysis.change,changePercent:analysis.changePct,open:last?.open ?? analysis.price,high:analysis.dayRange[1],low:analysis.dayRange[0],volume:last?.volume ?? 0,
    high52Week:analysis.high52,low52Week:analysis.low52,history,technical,fundamental,expectation,lastUpdated:new Date(analysis.updatedAt).toISOString(),research:analysis,version:RESEARCH_VERSION };
}

export async function searchGlobalStocks(query: string): Promise<StockDirectoryItem[]> {
  const q = query.trim().toUpperCase();
  if (!q) return GLOBAL_STOCKS_DIRECTORY.slice(0, 20);

  // 1. First search in local directory (fast, curated)
  const localMatches = GLOBAL_STOCKS_DIRECTORY.filter(s =>
    s.symbol.toUpperCase().includes(q) ||
    s.name.toUpperCase().includes(q) ||
    s.sector.toUpperCase().includes(q) ||
    s.country.toUpperCase().includes(q) ||
    s.exchange.toUpperCase().includes(q)
  );

  // 2. Fetch from Yahoo Finance Search API for universal ticker search
  const externalMatches: StockDirectoryItem[] = [];
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=12&newsCount=0`, {
      headers: { "User-Agent": USER_AGENT }
    });
    if (res.ok) {
      const data = await res.json();
      const quotes = data?.quotes || [];
      for (const item of quotes) {
        // STRICTLY EQUITIES ONLY ("SO AÇÕES!")
        if (item.quoteType === "EQUITY" && item.symbol) {
          const sym = item.symbol;
          if (!localMatches.some(l => l.symbol.toUpperCase() === sym.toUpperCase())) {
            externalMatches.push({
              symbol: sym,
              name: item.longname || item.shortname || sym,
              exchange: item.exchDisp || item.exchange || "Bolsa",
              market: detectMarketByExchange(item.exchDisp || item.exchange, sym),
              country: detectCountry(sym, "USD"),
              currency: "USD",
              sector: item.sectorDisp || item.sector || "Ações Diversas",
              industry: item.industryDisp || item.industry || "Mercado de Ações",
              description: `Ação ${item.longname || sym} cotada na bolsa ${item.exchDisp || item.exchange}.`
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("Search API error:", err);
  }

  return [...localMatches, ...externalMatches];
}

function detectMarketByExchange(exchange: string = "", symbol: string = ""): StockDirectoryItem["market"] {
  const ex = exchange.toUpperCase();
  const sym = symbol.toUpperCase();
  if (sym.endsWith(".LS") || ex.includes("LISBON") || ex.includes("LIS")) return "Portugal";
  if (sym.endsWith(".SA") || ex.includes("SAO") || ex.includes("B3") || ex.includes("BRAZIL")) return "Brasil";
  if (sym.endsWith(".PA") || sym.endsWith(".DE") || sym.endsWith(".AS") || sym.endsWith(".MC") || sym.endsWith(".L") || sym.endsWith(".SW") || ex.includes("EURONEXT") || ex.includes("XETRA") || ex.includes("LONDON") || ex.includes("MADRID")) return "Europa";
  if (sym.endsWith(".T") || sym.endsWith(".HK") || sym.endsWith(".AX") || sym.endsWith(".SS") || sym.endsWith(".SZ") || ex.includes("TOKYO") || ex.includes("HONG KONG")) return "Ásia";
  if (sym.endsWith(".TO") || sym.endsWith(".V") || ex.includes("TORONTO") || ex.includes("TSX")) return "Canadá";
  if (ex.includes("NASDAQ") || ex.includes("NYSE") || ex.includes("NMS") || ex.includes("NYQ") || ex.includes("AMEX")) return "EUA";
  return "EUA";
}

function detectCountry(symbol: string, currency: string): string {
  const sym = symbol.toUpperCase();
  if (sym.endsWith(".LS")) return "Portugal";
  if (sym.endsWith(".SA")) return "Brasil";
  if (sym.endsWith(".PA")) return "França";
  if (sym.endsWith(".DE")) return "Alemanha";
  if (sym.endsWith(".AS")) return "Holanda";
  if (sym.endsWith(".MC")) return "Espanha";
  if (sym.endsWith(".L")) return "Reino Unido";
  if (sym.endsWith(".SW")) return "Suíça";
  if (sym.endsWith(".T")) return "Japão";
  if (sym.endsWith(".HK")) return "Hong Kong";
  if (sym.endsWith(".TO")) return "Canadá";
  if (currency === "EUR") return "Zona Euro";
  return "Estados Unidos";
}

function generateFundamentalData(symbol: string, currentPrice: number, sector: string = ""): FundamentalData {
  // Deterministic seed based on symbol letters
  const hash = symbol.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Reasonable financial multiples
  const peRatio = Number((12 + (hash % 28) + (sector.includes("Tecnologia") ? 10 : 0)).toFixed(1));
  const forwardPE = Number((peRatio * 0.88).toFixed(1));
  const priceToBook = Number((1.2 + (hash % 8) * 0.6).toFixed(1));
  const dividendYield = sector.includes("Energia") || sector.includes("Utilities") || sector.includes("Financeiro") 
    ? Number((3.5 + (hash % 4) * 0.8).toFixed(2)) 
    : Number(((hash % 5) * 0.4).toFixed(2));
  const debtToEquity = Number((0.4 + (hash % 12) * 0.1).toFixed(2));
  const returnOnEquity = Number((10 + (hash % 18)).toFixed(1));
  const profitMargin = Number((8 + (hash % 20)).toFixed(1));

  // Graham Number & DCF Fair Value estimates
  const estimatedEPS = Number((currentPrice / peRatio).toFixed(2));
  const estimatedBVPS = Number((currentPrice / priceToBook).toFixed(2));
  const grahamValue = Number(Math.sqrt(22.5 * Math.max(0.5, estimatedEPS) * Math.max(1, estimatedBVPS)).toFixed(2));
  
  // DCF Fair value estimation
  const growthRate = sector.includes("Tecnologia") ? 0.14 : 0.06;
  const dcfFairValue = Number((currentPrice * (1 + (hash % 40 - 15) / 100)).toFixed(2));

  let valuationStatus: FundamentalData["valuationStatus"] = "Preço Justo";
  let fundScore = 50;

  if (dcfFairValue > currentPrice * 1.15) {
    valuationStatus = "Subavaliada (Grande Desconto)";
    fundScore += 25;
  } else if (dcfFairValue < currentPrice * 0.88) {
    valuationStatus = "Sobreavaliada (Risco Elevado)";
    fundScore -= 20;
  } else {
    fundScore += 5;
  }

  if (peRatio < 20) fundScore += 12;
  else if (peRatio > 40) fundScore -= 12;

  if (returnOnEquity > 18) fundScore += 10;
  if (debtToEquity < 0.8) fundScore += 8;
  if (dividendYield > 2.5) fundScore += 5;

  fundScore = Math.max(10, Math.min(95, fundScore));

  return {
    peRatio,
    forwardPE,
    priceToBook,
    dividendYield,
    returnOnEquity,
    debtToEquity,
    profitMargin,
    grahamValue,
    dcfFairValue,
    valuationStatus,
    scoreFundamental: fundScore
  };
}
