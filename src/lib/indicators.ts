export interface PricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalAnalysisResult {
  currentPrice: number;
  change: number;
  changePercent: number;
  high52Week: number;
  low52Week: number;
  rsi14: number;
  rsiSignal: "Sobrevendido (Oportunidade)" | "Neutro" | "Sobrecomprado (Alerta de Venda)";
  ema20: number;
  sma50: number;
  sma200: number;
  goldenCross: boolean;
  deathCross: boolean;
  maTrend: "Fortemente Altista" | "Altista" | "Neutra" | "Baixista" | "Fortemente Baixista";
  macd: {
    line: number;
    signal: number;
    histogram: number;
    status: "Cruzamento Altista (Compra)" | "Cruzamento Baixista (Venda)" | "Neutro";
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    position: "Banda Superior (Resistência)" | "Meio da Banda" | "Banda Inferior (Suporte)";
  };
  stochastic: {
    k: number;
    d: number;
    status: "Sobrevendido (<20)" | "Neutro" | "Sobrecomprado (>80)";
  };
  atr14: number;
  supportLevel: number;
  resistanceLevel: number;
  volumeTrend: "Volume Acima da Média (Forte Validação)" | "Volume Normal" | "Volume Fraco (Baixa Convicção)";
  scoreTecnico: number; // 0 - 100
}

export interface FundamentalData {
  peRatio?: number;
  forwardPE?: number;
  priceToBook?: number;
  dividendYield?: number;
  marketCap?: number;
  enterpriseToEbitda?: number;
  debtToEquity?: number;
  returnOnEquity?: number;
  profitMargin?: number;
  grahamValue?: number;
  dcfFairValue?: number;
  valuationStatus: "Subavaliada (Grande Desconto)" | "Preço Justo" | "Sobreavaliada (Risco Elevado)" | "Dados insuficientes";
  scoreFundamental: number; // 0 - 100
}

export interface StockExpectationVerdict {
  verdict: "FORTE_SUBIDA" | "SUBIDA_MODERADA" | "NEUTRO" | "QUEDA_MODERADA" | "FORTE_QUEDA";
  verdictLabel: string;
  verdictEmoji: string;
  verdictColor: string; // Tailwind color classes
  direction: "SOBE" | "DESCE" | "NEUTRO";
  probability: number; // e.g. 78%
  confidenceLevel: "Alta Convicção" | "Média Convicção" | "Baixa / Cautela";
  overallScore: number; // 0 - 100
  timeHorizonShort: {
    period: "1 a 4 Semanas (Swing Trade)";
    targetPrice: number;
    targetPercent: number;
    stopLossPrice: number;
    riskPercent: number;
    riskRewardRatio: string;
  };
  timeHorizonMedium: {
    period: "1 a 6 Meses (Posição)";
    targetPrice: number;
    targetPercent: number;
  };
  keyBullishFactors: string[];
  keyBearishRisks: string[];
  tradingPlan: string;
}

export function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(data[i]);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const sum = slice.reduce((a, b) => a + b, 0);
      result.push(Number((sum / period).toFixed(2)));
    }
  }
  return result;
}

export function calculateEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [];
  if (data.length === 0) return result;
  result.push(data[0]);

  for (let i = 1; i < data.length; i++) {
    const val = data[i] * k + result[i - 1] * (1 - k);
    result.push(Number(val.toFixed(2)));
  }
  return result;
}

export function calculateRSI(closes: number[], period: number = 14): number[] {
  if (closes.length <= period) {
    return closes.map(() => 50);
  }

  const rsi: number[] = new Array(period).fill(50);
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  const firstRs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi.push(Number((100 - 100 / (1 + firstRs)).toFixed(2)));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(Number((100 - 100 / (1 + rs)).toFixed(2)));
    }
  }

  return rsi;
}

export function calculateMACD(closes: number[]): { line: number[]; signal: number[]; histogram: number[] } {
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdLine = ema12.map((val, idx) => Number((val - (ema26[idx] || val)).toFixed(2)));
  const signalLine = calculateEMA(macdLine, 9);
  const histogram = macdLine.map((val, idx) => Number((val - (signalLine[idx] || val)).toFixed(2)));

  return { line: macdLine, signal: signalLine, histogram };
}

export function calculateBollingerBands(closes: number[], period: number = 20, stdDevMult: number = 2) {
  const sma = calculateSMA(closes, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      upper.push(closes[i]);
      lower.push(closes[i]);
    } else {
      const slice = closes.slice(i - period + 1, i + 1);
      const mean = sma[i];
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      upper.push(Number((mean + stdDev * stdDevMult).toFixed(2)));
      lower.push(Number((mean - stdDev * stdDevMult).toFixed(2)));
    }
  }

  return { middle: sma, upper, lower };
}

export function calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
  if (closes.length < 2) return 1.0;
  const trs: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trs.push(tr);
  }
  const slice = trs.slice(-period);
  const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
  return Number(avg.toFixed(2));
}

export function calculateTechnicalAnalysis(history: PricePoint[]): TechnicalAnalysisResult {
  if (!history || history.length === 0) {
    return {
      currentPrice: 100,
      change: 0,
      changePercent: 0,
      high52Week: 120,
      low52Week: 80,
      rsi14: 50,
      rsiSignal: "Neutro",
      ema20: 100,
      sma50: 100,
      sma200: 100,
      goldenCross: false,
      deathCross: false,
      maTrend: "Neutra",
      macd: { line: 0, signal: 0, histogram: 0, status: "Neutro" },
      bollingerBands: { upper: 105, middle: 100, lower: 95, position: "Meio da Banda" },
      stochastic: { k: 50, d: 50, status: "Neutro" },
      atr14: 2.5,
      supportLevel: 95,
      resistanceLevel: 105,
      volumeTrend: "Volume Normal",
      scoreTecnico: 50
    };
  }

  const closes = history.map(h => h.close);
  const highs = history.map(h => h.high);
  const lows = history.map(h => h.low);
  const volumes = history.map(h => h.volume);

  const currentPrice = closes[closes.length - 1];
  const prevPrice = closes.length > 1 ? closes[closes.length - 2] : currentPrice;
  const change = Number((currentPrice - prevPrice).toFixed(2));
  const changePercent = Number(((change / prevPrice) * 100).toFixed(2));

  const high52Week = Math.max(...highs);
  const low52Week = Math.min(...lows);

  // Indicators
  const rsiSeries = calculateRSI(closes, 14);
  const currentRsi = rsiSeries[rsiSeries.length - 1];
  let rsiSignal: TechnicalAnalysisResult["rsiSignal"] = "Neutro";
  if (currentRsi <= 32) rsiSignal = "Sobrevendido (Oportunidade)";
  else if (currentRsi >= 68) rsiSignal = "Sobrecomprado (Alerta de Venda)";

  const ema20Series = calculateEMA(closes, 20);
  const sma50Series = calculateSMA(closes, 50);
  const sma200Series = calculateSMA(closes, Math.min(200, closes.length));

  const ema20 = ema20Series[ema20Series.length - 1];
  const sma50 = sma50Series[sma50Series.length - 1];
  const sma200 = sma200Series[sma200Series.length - 1];

  const goldenCross = sma50 > sma200 && (sma50Series[sma50Series.length - 5] || 0) <= (sma200Series[sma200Series.length - 5] || 0);
  const deathCross = sma50 < sma200 && (sma50Series[sma50Series.length - 5] || 0) >= (sma200Series[sma200Series.length - 5] || 0);

  let maTrend: TechnicalAnalysisResult["maTrend"] = "Neutra";
  if (currentPrice > ema20 && ema20 > sma50 && sma50 > sma200) {
    maTrend = "Fortemente Altista";
  } else if (currentPrice > sma50) {
    maTrend = "Altista";
  } else if (currentPrice < ema20 && ema20 < sma50 && sma50 < sma200) {
    maTrend = "Fortemente Baixista";
  } else if (currentPrice < sma50) {
    maTrend = "Baixista";
  }

  // MACD
  const macdData = calculateMACD(closes);
  const macdLine = macdData.line[macdData.line.length - 1];
  const macdSignal = macdData.signal[macdData.signal.length - 1];
  const macdHist = macdData.histogram[macdData.histogram.length - 1];
  let macdStatus: TechnicalAnalysisResult["macd"]["status"] = "Neutro";
  if (macdHist > 0 && macdLine > macdSignal) {
    macdStatus = "Cruzamento Altista (Compra)";
  } else if (macdHist < 0 && macdLine < macdSignal) {
    macdStatus = "Cruzamento Baixista (Venda)";
  }

  // Bollinger Bands
  const bb = calculateBollingerBands(closes, 20, 2);
  const bbUpper = bb.upper[bb.upper.length - 1];
  const bbMiddle = bb.middle[bb.middle.length - 1];
  const bbLower = bb.lower[bb.lower.length - 1];
  let bbPos: TechnicalAnalysisResult["bollingerBands"]["position"] = "Meio da Banda";
  if (currentPrice >= bbUpper * 0.985) bbPos = "Banda Superior (Resistência)";
  else if (currentPrice <= bbLower * 1.015) bbPos = "Banda Inferior (Suporte)";

  // Stochastic (14)
  const recentHigh14 = Math.max(...highs.slice(-14));
  const recentLow14 = Math.min(...lows.slice(-14));
  const stochK = recentHigh14 === recentLow14 ? 50 : Number((((currentPrice - recentLow14) / (recentHigh14 - recentLow14)) * 100).toFixed(1));
  const stochD = stochK; // simplified D
  let stochStatus: TechnicalAnalysisResult["stochastic"]["status"] = "Neutro";
  if (stochK <= 20) stochStatus = "Sobrevendido (<20)";
  else if (stochK >= 80) stochStatus = "Sobrecomprado (>80)";

  // ATR
  const atr14 = calculateATR(highs, lows, closes, 14);

  // Support & Resistance (swing levels)
  const recentSlice = history.slice(-30);
  const sortedLows = [...recentSlice.map(p => p.low)].sort((a, b) => a - b);
  const sortedHighs = [...recentSlice.map(p => p.high)].sort((a, b) => b - a);
  const supportLevel = Number((sortedLows[Math.floor(sortedLows.length * 0.15)] || currentPrice * 0.95).toFixed(2));
  const resistanceLevel = Number((sortedHighs[Math.floor(sortedHighs.length * 0.15)] || currentPrice * 1.05).toFixed(2));

  // Volume trend
  const recentVolAvg = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const longVolAvg = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  let volumeTrend: TechnicalAnalysisResult["volumeTrend"] = "Volume Normal";
  if (recentVolAvg > longVolAvg * 1.25) volumeTrend = "Volume Acima da Média (Forte Validação)";
  else if (recentVolAvg < longVolAvg * 0.75) volumeTrend = "Volume Fraco (Baixa Convicção)";

  // Score Técnico (0 - 100)
  let techScore = 50;

  // RSI points
  if (currentRsi < 30) techScore += 18; // oversold rebound potential
  else if (currentRsi < 45) techScore += 8;
  else if (currentRsi > 70) techScore -= 18; // overbought risk
  else if (currentRsi > 60) techScore -= 5;

  // MA trend points
  if (maTrend === "Fortemente Altista") techScore += 22;
  else if (maTrend === "Altista") techScore += 12;
  else if (maTrend === "Fortemente Baixista") techScore -= 22;
  else if (maTrend === "Baixista") techScore -= 12;

  // MACD points
  if (macdStatus === "Cruzamento Altista (Compra)") techScore += 12;
  else if (macdStatus === "Cruzamento Baixista (Venda)") techScore -= 12;

  // Bollinger position
  if (bbPos === "Banda Inferior (Suporte)") techScore += 10;
  else if (bbPos === "Banda Superior (Resistência)") techScore -= 10;

  // Golden / Death Cross
  if (goldenCross) techScore += 15;
  if (deathCross) techScore -= 15;

  techScore = Math.max(5, Math.min(95, Math.round(techScore)));

  return {
    currentPrice,
    change,
    changePercent,
    high52Week,
    low52Week,
    rsi14: currentRsi,
    rsiSignal,
    ema20,
    sma50,
    sma200,
    goldenCross,
    deathCross,
    maTrend,
    macd: { line: macdLine, signal: macdSignal, histogram: macdHist, status: macdStatus },
    bollingerBands: { upper: bbUpper, middle: bbMiddle, lower: bbLower, position: bbPos },
    stochastic: { k: stochK, d: stochD, status: stochStatus },
    atr14,
    supportLevel,
    resistanceLevel,
    volumeTrend,
    scoreTecnico: techScore
  };
}

export function evaluateStockExpectation(
  tech: TechnicalAnalysisResult,
  fund: FundamentalData,
  ticker: string
): StockExpectationVerdict {
  // Consolidated score weighted: 60% Technical, 40% Fundamental
  const overallScore = Math.round(tech.scoreTecnico * 0.6 + fund.scoreFundamental * 0.4);

  let verdict: StockExpectationVerdict["verdict"];
  let verdictLabel: string;
  let verdictEmoji: string;
  let verdictColor: string;
  let direction: StockExpectationVerdict["direction"];
  let probability: number;
  let confidenceLevel: StockExpectationVerdict["confidenceLevel"];

  if (overallScore >= 76) {
    verdict = "FORTE_SUBIDA";
    verdictLabel = "FORTE SUBIDA (COMPRA FORTE / STRONG BULLISH)";
    verdictEmoji = "🚀";
    verdictColor = "emerald";
    direction = "SOBE";
    probability = Math.min(94, 75 + Math.round((overallScore - 75) * 0.8));
    confidenceLevel = "Alta Convicção";
  } else if (overallScore >= 58) {
    verdict = "SUBIDA_MODERADA";
    verdictLabel = "SUBIDA MODERADA (VIÉS ALTISTA / LEAN BULLISH)";
    verdictEmoji = "📈";
    verdictColor = "green";
    direction = "SOBE";
    probability = Math.min(74, 60 + Math.round((overallScore - 58) * 0.8));
    confidenceLevel = "Média Convicção";
  } else if (overallScore >= 43) {
    verdict = "NEUTRO";
    verdictLabel = "NEUTRO / LATERALIZAÇÃO (AGUARDAR CONFIRMAÇÃO)";
    verdictEmoji = "⚖️";
    verdictColor = "amber";
    direction = "NEUTRO";
    probability = 50;
    confidenceLevel = "Baixa / Cautela";
  } else if (overallScore >= 26) {
    verdict = "QUEDA_MODERADA";
    verdictLabel = "QUEDA MODERADA (VIÉS BAIXISTA / LEAN BEARISH)";
    verdictEmoji = "📉";
    verdictColor = "orange";
    direction = "DESCE";
    probability = Math.min(74, 60 + Math.round((43 - overallScore) * 0.8));
    confidenceLevel = "Média Convicção";
  } else {
    verdict = "FORTE_QUEDA";
    verdictLabel = "FORTE QUEDA (VENDA / STRONG BEARISH)";
    verdictEmoji = "🔴";
    verdictColor = "rose";
    direction = "DESCE";
    probability = Math.min(95, 75 + Math.round((26 - overallScore) * 0.8));
    confidenceLevel = "Alta Convicção";
  }

  // Price targets calculation
  const current = tech.currentPrice;
  const atr = tech.atr14 || current * 0.02;

  let targetShortPrice = current;
  let stopLossPrice = current;
  let targetMediumPrice = current;

  if (direction === "SOBE") {
    targetShortPrice = Number(Math.max(tech.resistanceLevel, current + atr * 2.2).toFixed(2));
    stopLossPrice = Number(Math.min(tech.supportLevel, current - atr * 1.5).toFixed(2));
    targetMediumPrice = Number((current * (1 + (overallScore > 75 ? 0.18 : 0.09))).toFixed(2));
  } else if (direction === "DESCE") {
    targetShortPrice = Number(Math.min(tech.supportLevel, current - atr * 2.2).toFixed(2));
    stopLossPrice = Number(Math.max(tech.resistanceLevel, current + atr * 1.5).toFixed(2));
    targetMediumPrice = Number((current * (1 - (overallScore < 25 ? 0.16 : 0.08))).toFixed(2));
  } else {
    targetShortPrice = Number((current * 1.025).toFixed(2));
    stopLossPrice = Number((current * 0.975).toFixed(2));
    targetMediumPrice = Number((current * 1.04).toFixed(2));
  }

  const targetPercent = Number((((targetShortPrice - current) / current) * 100).toFixed(2));
  const riskPercent = Number((((stopLossPrice - current) / current) * 100).toFixed(2));
  const riskRewardVal = Math.abs(targetPercent / (riskPercent || 1)).toFixed(1);
  const targetMedPercent = Number((((targetMediumPrice - current) / current) * 100).toFixed(2));

  // Build Bullish & Bearish factor lists
  const bullish: string[] = [];
  const bearish: string[] = [];

  if (tech.rsi14 <= 35) bullish.push(`RSI(14) em ${tech.rsi14} indica forte condição de sobrevenda com potencial ressalto.`);
  if (tech.rsi14 >= 68) bearish.push(`RSI(14) em ${tech.rsi14} em zona de sobrecompra extrema (risco de correção imediata).`);

  if (tech.maTrend.includes("Altista")) bullish.push(`Preço acima das Médias Móveis principais (EMA 20 e SMA 50) com estrutura altista.`);
  if (tech.maTrend.includes("Baixista")) bearish.push(`Preço negociando sob pressão abaixo das médias de 50 e 200 períodos.`);

  if (tech.goldenCross) bullish.push(`Golden Cross recente: cruzamento altista da média de 50 dias sobre a de 200 dias.`);
  if (tech.deathCross) bearish.push(`Death Cross recente: sinal técnico perigoso com média de 50 cruzando abaixo da de 200.`);

  if (tech.macd.status.includes("Altista")) bullish.push(`Histograma MACD com expansão positiva e linha MACD acima da linha de sinal.`);
  if (tech.macd.status.includes("Baixista")) bearish.push(`Histograma MACD em território negativo confirmando aceleração vendedora.`);

  if (fund.valuationStatus.includes("Subavaliada")) bullish.push(`Valuation favorável: rácio P/L atrativo e modelo DCF sugerindo ação com desconto face ao valor intrínseco.`);
  if (fund.valuationStatus.includes("Sobreavaliada")) bearish.push(`Valuation esticado com múltiplos P/L elevados face à média histórica e pares do setor.`);

  if (fund.dividendYield && fund.dividendYield > 3.0) bullish.push(`Yield de dividendo sólido de ${fund.dividendYield.toFixed(1)}% oferece suporte defensivo.`);

  if (bullish.length === 0) bullish.push("Manutenção do suporte crítico imediato e consolidação da base de preços.");
  if (bearish.length === 0) bearish.push("Possível desaceleração macroeconómica ou realização pontual de lucros após ganhos.");

  let tradingPlan = "";
  if (direction === "SOBE") {
    tradingPlan = `Estratégia Recomendada: Posicionamento comprador (LONG) junto aos níveis atuais ou em retração até ${tech.supportLevel}. Colocar Stop Loss rigoroso em ${stopLossPrice} (-${Math.abs(riskPercent)}%) e realizar lucros parciais no primeiro alvo em ${targetShortPrice} (+${Math.abs(targetPercent)}%). Rácio Risco/Retorno projetado de 1:${riskRewardVal}.`;
  } else if (direction === "DESCE") {
    tradingPlan = `Estratégia Recomendada: Evitar compras de momento ou considerar proteção/hedge. Se negociar vendido (SHORT), acionar na quebra de suporte com alvo em ${targetShortPrice} e Stop de proteção acima de ${stopLossPrice}.`;
  } else {
    tradingPlan = `Estratégia Recomendada: Aguardar que o preço quebre decisivamente a resistência (${tech.resistanceLevel}) ou o suporte (${tech.supportLevel}) com volume confirmatório antes de abrir novas posições direcionais.`;
  }

  return {
    verdict,
    verdictLabel,
    verdictEmoji,
    verdictColor,
    direction,
    probability,
    confidenceLevel,
    overallScore,
    timeHorizonShort: {
      period: "1 a 4 Semanas (Swing Trade)",
      targetPrice: targetShortPrice,
      targetPercent,
      stopLossPrice,
      riskPercent,
      riskRewardRatio: `1:${riskRewardVal}`
    },
    timeHorizonMedium: {
      period: "1 a 6 Meses (Posição)",
      targetPrice: targetMediumPrice,
      targetPercent: targetMedPercent
    },
    keyBullishFactors: bullish,
    keyBearishRisks: bearish,
    tradingPlan
  };
}
