# AçõesRadar AI — Site A 📈

Plataforma de avaliação de ações com veredito **SOBE ou DESCE** baseado em indicadores técnicos e fundamentais, cobertura de todos os tickers mundiais (só ações) e analisador de fotos de gráficos.

## Funcionalidades
- **Pesquisa universal de ações** (EUA, Euronext Lisboa, Brasil B3, Europa, Ásia, Canadá).
- **Veredito preditivo**: Forte Subida / Subida Moderada / Neutro / Queda Moderada / Forte Queda, com probabilidade e nível de convicção.
- **Metas de preço**: alvo curto prazo, alvo médio prazo, stop loss e rácio risco/retorno.
- **Indicadores técnicos**: RSI(14), MACD, EMA 20 / SMA 50 / SMA 200 (Golden/Death Cross), Bandas de Bollinger, ATR, Estocástico, Suporte e Resistência, Volume.
- **Valuation fundamental**: P/E, P/B, Dividend Yield, ROE, DCF e Fórmula de Graham.
- **Gráfico interativo** de velas japonesas com overlays.
- **Analisador de foto de gráfico** (`/analise-grafico`): upload, drag & drop ou Ctrl+V.
- **Watchlist** e histórico (requer PostgreSQL — opcional).

## Deploy na Vercel
1. Importar este repositório em [vercel.com/new](https://vercel.com/new).
2. Clicar em **Deploy** — não são necessárias variáveis de ambiente.

### Variáveis opcionais
| Variável | Para quê |
|---|---|
| `DATABASE_URL` | Ativa a Watchlist e o histórico de análises (PostgreSQL grátis em neon.tech). |
| `OPENAI_API_KEY` | Usa GPT-4o Vision na análise de fotos (sem ela usa o motor de padrões interno). |

## Desenvolvimento local
```bash
npm install
npx drizzle-kit push   # se tiveres DATABASE_URL
npm run dev
```
