import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const TIMEOUT = 8000;
const USER_AGENT = "Mozilla/5.0";

// =======================
// FUNÇÃO PRINCIPAL (Yahoo)
// =======================
async function pegarYahoo(simbolo) {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${simbolo}?range=5d&interval=1d`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8"
      },
      signal: controller.signal
    });

    if (!r.ok) {
      console.error("Yahoo HTTP:", r.status);
      return null;
    }

    const json = await r.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta || {};
    const timestamps = Array.isArray(result.timestamp) ? result.timestamp : [];
    const quote = result.indicators?.quote?.[0];
    const closes = Array.isArray(quote?.close) ? quote.close : [];

    const historico = timestamps
      .map((ts, i) => {
        const preco = closes[i];
        if (typeof preco !== "number") return null;

        return {
          data: new Date(ts * 1000).toLocaleDateString("pt-BR"),
          preco: Number(preco.toFixed(2))
        };
      })
      .filter(Boolean);

    const atual = meta.regularMarketPrice;
    const anterior = meta.chartPreviousClose;

    if (typeof atual !== "number" || typeof anterior !== "number") {
      return null;
    }

    const variacao = atual - anterior;
    const variacaoPercent = (variacao / anterior) * 100;

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

  } catch (err) {
    console.error("ERRO YAHOO:", err.name, err.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// =======================
// ENDPOINT HISTÓRICO
// =======================
app.get("/historico", async (req, res) => {
  const { acao } = req.query;

  if (!acao) {
    return res.status(400).json({ erro: "Parâmetro 'acao' é obrigatório" });
  }

  const dados = await pegarYahoo(acao);

  if (!dados) {
    return res.status(502).json({ erro: "Falha ao obter dados do Yahoo" });
  }

  res.json(dados);
});

// =======================
// TESTE RÁPIDO
// =======================
app.get("/", (_, res) => {
  res.send("API de ações online 🚀");
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
