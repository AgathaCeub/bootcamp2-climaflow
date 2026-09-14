const botaoBuscar = document.getElementById("botao-buscar");
const campoBusca = document.getElementById("campo-busca");
const areaResultado = document.getElementById("resultado");

function traduzirTempo(codigo) {
  if (codigo === 0) return "Céu limpo";
  if (codigo === 1 || codigo === 2) return "Parcialmente nublado";
  if (codigo === 3) return "Nublado";
  if (codigo === 45 || codigo === 48) return "Neblina";
  if (codigo >= 51 && codigo <= 57) return "Garoa";
  if (codigo >= 61 && codigo <= 67) return "Chuva";
  if (codigo >= 71 && codigo <= 77) return "Neve";
  if (codigo >= 80 && codigo <= 82) return "Pancadas de chuva";
  if (codigo >= 95) return "Trovoadas";
  return "Condição variável";
}

async function buscarClima(cidade) {
  areaResultado.innerHTML = '<div class="carregando">Buscando dados...</div>';

  try {
    const urlCidade = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=1&language=pt&format=json`;
    const respostaCidade = await fetch(urlCidade);

    if (!respostaCidade.ok) throw new Error("Não foi possível consultar a cidade.");

    const dadosCidade = await respostaCidade.json();

    if (!dadosCidade.results || dadosCidade.results.length === 0) {
      throw new Error("Cidade não encontrada. Confira o nome e tente novamente.");
    }

    const local = dadosCidade.results[0];
    const urlClima =
      `https://api.open-meteo.com/v1/forecast?latitude=${local.latitude}` +
      `&longitude=${local.longitude}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
      `&timezone=auto`;

    const respostaClima = await fetch(urlClima);
    if (!respostaClima.ok) throw new Error("Não foi possível carregar os dados do clima.");

    const dadosClima = await respostaClima.json();
    exibirClima(local, dadosClima.current, dadosClima.timezone);
  } catch (erro) {
    areaResultado.innerHTML = `
      <div class="erro">
        <strong>Ops!</strong>
        <p>${erro.message}</p>
      </div>`;
  }
}

function exibirClima(local, atual, timezone) {
  const descricao = traduzirTempo(atual.weather_code);

  areaResultado.innerHTML = `
    <h2>${local.name}</h2>
    <p>${local.admin1 ? local.admin1 + ", " : ""}${local.country}</p>
    <p class="condicao">${descricao}</p>

    <div class="grade-clima">
      <div class="item-clima"><span>Temperatura</span><strong>${atual.temperature_2m} °C</strong></div>
      <div class="item-clima"><span>Sensação</span><strong>${atual.apparent_temperature} °C</strong></div>
      <div class="item-clima"><span>Umidade</span><strong>${atual.relative_humidity_2m}%</strong></div>
      <div class="item-clima"><span>Vento</span><strong>${atual.wind_speed_10m} km/h</strong></div>
    </div>

    <p class="detalhe">Fuso horário: ${timezone}</p>`;
}

botaoBuscar.addEventListener("click", () => {
  const cidade = campoBusca.value.trim();

  if (!cidade) {
    areaResultado.innerHTML = `
      <div class="erro">
        <strong>Informe uma cidade.</strong>
        <p>Exemplo: Brasília, Recife ou Lisboa.</p>
      </div>`;
    return;
  }

  buscarClima(cidade);
});

campoBusca.addEventListener("keydown", (evento) => {
  if (evento.key === "Enter") botaoBuscar.click();
});
