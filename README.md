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


## Confluência + notícias (v2)

Motor partilhado com o TickerLab em `src/lib/research`, preservando a interface
AçõesRadar. O veredicto SOBE/DESCE/NEUTRO cruza famílias ponderadas, mais de uma
dezena de indicadores adicionais e cobertura real dos dados. A pontuação não
usa preços, históricos ou fundamentais gerados artificialmente.

Cada ação carrega `GET /api/news?symbol=...` automaticamente: manchetes Yahoo
Finance e Google News com publicador, data, link, idioma e estado das fontes.
O feed falhar não impede a análise técnica. Sem notícias não mostramos notícias
de outra ação. Percentuais são heurísticos, não probabilidades calibradas.

`GET /api/health` e `GET /api/stocks/BCP.LS` incluem a versão implantada.
Pode abrir uma empresa diretamente em `/?symbol=BCP.LS`.


## Protocolo v3 — notícias ≤72h, cenários e diagnóstico histórico

A política agora usa a publicação original e filtra notícias com mais de 72 horas,
inclusive cache válida, cache de emergência e a página aberta. O utilizador pode
selecionar 24/48/72h. Datas futuras/inválidas são rejeitadas. Atualidade não comprova
impacto e manchetes não recebem votos automáticos na direção do preço.

A página da ação contém cenários altista, baixista e lateral com confirmação,
invalidação e pesos de hipótese (não probabilidades). A direção requer pelo menos
duas famílias alinhadas e score absoluto ≥12. Sem critérios, o veredicto é aguardar;
sem evidência histórica suficiente, o sinal fica explicitamente provisório.

Há um walk-forward de regras fixas: 320 barras de informação anterior, execução
na abertura seguinte, horizonte 20 sessões, janelas de resultados sem sobreposição,
custo assumido 20 bps, referência comparável, Wilson 95%, amostra, métricas por
sentido e retorno líquido. Não usa notícias atuais ou scanner atual no passado.
Os limites do teste são visíveis: não certifica uma taxa de acerto nem rentabilidade.

O zoom do gráfico não muda a janela do modelo. É possível descarregar o registo
com dados usados, hashes, versão, notícias admissíveis e operações do diagnóstico.

**Regras completas:** [docs/DECISION-METHODOLOGY.md](docs/DECISION-METHODOLOGY.md).

**Testes:** `node --import tsx --test scripts/research.test.ts scripts/rigor.test.ts`.
