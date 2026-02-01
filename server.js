import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = 3000;

const TIMEOUT = 8000;
const USER_AGENT = "Mozilla/5.0";

// =======================
// FUNÇÃO PRINCIPAL (Yahoo)
// =======================
async function pegarYahoo(simbolo) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${simbolo}?range=5d&interval=1d`;

  const controller = new AbortController();
  setTimeout(() => controller.abort(), TIMEOUT);

  const r = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: controller.signal
  });

  const json = await r.json();
  const result = json.chart.result?.[0];
  if (!result) return null;

  const meta = result.meta;
  const timestamps = result.timestamp || [];
  const closes = result.indicators.quote[0].close || [];

  const historico = timestamps.map((ts, i) => ({
    data: new Date(ts * 1000).toLocaleDateString("pt-BR"),
    preco: Number(closes[i].toFixed(2))
  })).filter(p => !isNaN(p.preco));

  const atual = meta.regularMarketPrice;
  const anterior = meta.chartPreviousClose;

  if (atual == null || anterior == null) return null;

  const variacao = atual - anterior;
  const variacaoPercent = anterior ? (variacao / anterior) * 100 : 0;

  return {
    resumo: {
      simbolo,
      preco_atual: atual,
      preco_anterior: anterior,
      variacao,
      variacao_percent: variacaoPercent,
      moeda: meta.currency || "N/A",
      exchange: meta.exchangeName || "N/A"
    },
    historico
  };
}

// =======================
// ENDPOINT HISTÓRICO
// =======================
app.get("/historico", async (req, res) => {
  const { acao } = req.query;

  if (!acao) {
    return res.status(400).json({ erro: "Parâmetro 'acao' é obrigatório" });
  }

  try {
    const dados = await pegarYahoo(acao);
    if (!dados) {
      return res.status(404).json({ erro: "Dados não encontrados" });
    }

    res.json(dados);
  } catch (e) {
    res.status(500).json({ erro: "Erro ao buscar dados" });
  }
});

// =======================
// TESTE RÁPIDO
// =======================
app.get("/", (_, res) => {
  res.send("API de ações online 🚀");
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
