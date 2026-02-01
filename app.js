const tg = window.Telegram.WebApp;
tg.expand();

let chart;

async function carregar() {
  const simbolo = document.getElementById("acao").value;

  const r = await fetch(`http://localhost:3000/historico?acao=${simbolo}`);
  const dados = await r.json();

  renderCards(dados.resumo);
  renderGrafico(dados.historico, simbolo);
}

function renderCards(d) {
  const cls = d.variacao >= 0 ? "pos" : "neg";

  document.getElementById("cards").innerHTML = `
    <div class="card">
      <strong>${d.simbolo}</strong><br>
      Preço atual: ${d.preco_atual.toFixed(2)} ${d.moeda}<br>
      Preço anterior: ${d.preco_anterior.toFixed(2)}<br>
      <span class="${cls}">
        Variação: ${d.variacao.toFixed(2)} (${d.variacao_percent.toFixed(2)}%)
      </span>
    </div>
  `;
}


chart = new Chart(document.getElementById("grafico"), {
  type: "line",
  data: {
    labels: historico.map(p => p.data),
    datasets: [{
      label: simbolo,
      data: historico.map(p => p.preco),
      borderWidth: 2,
      tension: 0.4,
      fill: true
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => `R$ ${ctx.raw.toFixed(2)}`
        }
      }
    },
    scales: {
      x: { ticks: { color: "#aaa" } },
      y: {
        ticks: {
          color: "#aaa",
          callback: v => `R$ ${v}`
        }
      }
    }
  }
});


carregar();
