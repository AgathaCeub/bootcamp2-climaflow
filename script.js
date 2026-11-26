import { criarApiClima, criarApiFavoritos } from './src/api.js';
import { criarIconeTempo } from './src/icones.js';
import { validarBusca, cidadeDoFavorito, coordenadasValidas, jaFavoritada,
  traduzirTempo, formatarNumero, formatarTemperatura, formatarDia } from './src/core.js';

const $ = (id) => document.getElementById(id);
const climaApi = criarApiClima();
const favoritosApi = criarApiFavoritos();
let favoritosDisponiveis = false;
let favoritos = [];
let cidadeAtual = null;
let climaAtual = null;
let sequenciaBusca = 0;
let unidade = 'C';
try { unidade = localStorage.getItem('climaflow-unidade') === 'F' ? 'F' : 'C'; } catch { /* Preferência opcional. */ }

function elemento(tag, classe, texto) {
  const node = document.createElement(tag);
  if (classe) node.className = classe;
  if (texto !== undefined) node.textContent = texto;
  return node;
}
function status(id, mensagem, erro = false) {
  $(id).textContent = mensagem;
  $(id).classList.toggle('erro', erro);
}
function ajustarBotaoFavorito() {
  const botao = $('botao-favoritar');
  if (!botao || !cidadeAtual) return;
  const salva = jaFavoritada(cidadeAtual, favoritos);
  botao.disabled = salva || !favoritosDisponiveis;
  botao.textContent = salva ? '✓ Cidade salva' : '☆ Salvar cidade';
}
function exibirClima() {
  if (!cidadeAtual || !climaAtual) return;
  const atual = climaAtual.current;
  const tempo = traduzirTempo(atual.weather_code);
  const topo = elemento('div', 'clima-topo');
  const local = elemento('div');
  local.append(elemento('p', 'agora', 'AGORA'), elemento('h2', '', cidadeAtual.nome),
    elemento('p', 'local', [cidadeAtual.estado, cidadeAtual.pais].filter(Boolean).join(', ')));
  const icone = criarIconeTempo(atual.weather_code, 'icone-clima');
  icone.setAttribute('aria-hidden', 'true');
  topo.append(local, icone);
  const grade = elemento('dl', 'grade-clima');
  [['Sensação térmica', formatarTemperatura(atual.apparent_temperature, unidade)],
    ['Umidade', `${formatarNumero(atual.relative_humidity_2m)}%`],
    ['Vento', `${formatarNumero(atual.wind_speed_10m, 1)} km/h`]].forEach(([rotulo, valor]) => {
    const item = elemento('div', 'item-clima');
    item.append(elemento('dt', '', rotulo), elemento('dd', '', valor));
    grade.append(item);
  });
  const rodape = elemento('div', 'clima-rodape');
  const horario = atual.time?.replace('T', ' às ') || 'Horário indisponível';
  const botao = elemento('button', 'botao-favoritar', '☆ Salvar cidade');
  botao.type = 'button'; botao.id = 'botao-favoritar';
  botao.addEventListener('click', salvarFavorito);
  rodape.append(elemento('p', 'detalhe', `Referência: ${horario} · ${climaAtual.timezone || ''}`), botao);
  $('resultado').replaceChildren(topo,
    elemento('p', 'temperatura', formatarTemperatura(atual.temperature_2m, unidade)),
    elemento('p', 'condicao', tempo.descricao), grade, rodape);
  ajustarBotaoFavorito(); exibirPrevisao();
}
function exibirPrevisao() {
  const diario = climaAtual.daily;
  $('lista-previsao').replaceChildren();
  $('previsao').hidden = !diario?.time?.length;
  if ($('previsao').hidden) return;
  diario.time.slice(0, 5).forEach((dia, i) => {
    const tempo = traduzirTempo(diario.weather_code?.[i]);
    const item = elemento('div', 'dia-previsao');
    const icone = criarIconeTempo(diario.weather_code?.[i], 'icone');
    icone.setAttribute('role', 'img'); icone.setAttribute('aria-label', tempo.descricao);
    item.append(elemento('span', '', formatarDia(dia, i)), icone,
      elemento('strong', '', formatarTemperatura(diario.temperature_2m_max?.[i], unidade)),
      elemento('span', 'minima', formatarTemperatura(diario.temperature_2m_min?.[i], unidade)),
      elemento('span', 'chuva', `Chuva ${formatarNumero(diario.precipitation_probability_max?.[i])}%`));
    $('lista-previsao').append(item);
  });
}
async function consultarCidade(cidade, sequencia = ++sequenciaBusca) {
  status('status-busca', `Consultando o clima de ${cidade.nome}...`);
  $('resultado').setAttribute('aria-busy', 'true');
  try {
    const dados = await climaApi.consultarClima(cidade);
    if (sequencia !== sequenciaBusca) return;
    cidadeAtual = cidade; climaAtual = dados;
    $('cidades-encontradas').replaceChildren();
    status('status-busca', ''); exibirClima();
  } catch (erro) {
    if (sequencia === sequenciaBusca) status('status-busca', erro.message, true);
  } finally {
    if (sequencia === sequenciaBusca) $('resultado').removeAttribute('aria-busy');
  }
}
async function buscarCidade(valor) {
  const sequencia = ++sequenciaBusca;
  $('resultado').removeAttribute('aria-busy');
  $('cidades-encontradas').replaceChildren();
  try {
    const nome = validarBusca(valor);
    status('status-busca', 'Buscando cidades...');
    const cidades = await climaApi.buscarCidades(nome);
    if (sequencia !== sequenciaBusca) return;
    if (!cidades.length) throw new Error('Cidade não encontrada. Confira o nome e tente novamente.');
    if (cidades.length === 1) return await consultarCidade(cidades[0], sequencia);
    status('status-busca', 'Qual destas cidades você quer consultar?');
    cidades.forEach((cidade) => {
      const botao = elemento('button', 'opcao-cidade'); botao.type = 'button';
      botao.append(elemento('strong', '', cidade.nome),
        elemento('span', '', [cidade.estado, cidade.pais].filter(Boolean).join(', ')));
      botao.addEventListener('click', () => consultarCidade(cidade));
      $('cidades-encontradas').append(botao);
    });
  } catch (erro) {
    if (sequencia === sequenciaBusca) status('status-busca', erro.message, true);
  }
}
function exibirFavoritos() {
  $('lista-favoritos').replaceChildren();
  if (!favoritos.length) {
    $('lista-favoritos').append(elemento('div', 'vazio', 'Sua próxima cidade favorita começa com uma busca.'));
  }
  favoritos.forEach((favorito) => {
    const cidade = cidadeDoFavorito(favorito);
    const item = elemento('div', 'favorito-item');
    const consultar = elemento('button', 'favorito-consultar'); consultar.type = 'button';
    consultar.append(elemento('strong', '', cidade.nome),
      elemento('span', '', [cidade.estado, cidade.pais].filter(Boolean).join(', ') || 'Local salvo'));
    consultar.setAttribute('aria-label', `Consultar clima de ${cidade.nome}`);
    consultar.disabled = !coordenadasValidas(cidade.latitude, cidade.longitude);
    consultar.addEventListener('click', () => {
      $('campo-busca').value = cidade.nome; consultarCidade(cidade);
    });
    const excluir = elemento('button', 'botao-excluir', '×'); excluir.type = 'button';
    excluir.setAttribute('aria-label', `Excluir ${cidade.nome} dos favoritos`);
    excluir.addEventListener('click', () => removerFavorito(favorito.id, excluir));
    item.append(consultar, excluir); $('lista-favoritos').append(item);
  });
  ajustarBotaoFavorito();
}
async function listarFavoritos(mensagem = '') {
  const botao = $('botao-atualizar-favoritos'); botao.disabled = true;
  status('status-favoritos', 'Carregando cidades...');
  try {
    favoritos = await favoritosApi.listar();
    favoritosDisponiveis = true;
    exibirFavoritos();
    status('status-favoritos', mensagem || (favoritos.length ? `${favoritos.length} cidade(s) salva(s)` : ''));
  } catch (erro) {
    status('status-favoritos', erro.status === 404
      ? 'Para salvar cidades, abra a versão do ClimaFlow executada com Node.js ou Docker.'
      : erro.message, true);
    if (!$('lista-favoritos').children.length) {
      $('lista-favoritos').append(elemento('div', 'vazio', 'Não foi possível carregar a lista. Clique em atualizar para tentar novamente.'));
    }
  } finally { botao.disabled = false; }
}
async function salvarFavorito() {
  if (!cidadeAtual || !favoritosDisponiveis) return;
  $('botao-favoritar').disabled = true;
  status('status-favoritos', 'Salvando cidade...');
  try {
    const salvo = await favoritosApi.salvar(cidadeAtual);
    favoritos = [salvo, ...favoritos];
    exibirFavoritos();
    status('status-favoritos', 'Cidade salva nos favoritos.');
  } catch (erro) {
    status('status-favoritos', erro.message, true);
    if (erro.code === 'FAVORITO_DUPLICADO') await listarFavoritos(erro.message);
  } finally { ajustarBotaoFavorito(); }
}
async function removerFavorito(id, botao) {
  botao.disabled = true; status('status-favoritos', 'Excluindo cidade...');
  try {
    await favoritosApi.excluir(id);
    favoritos = favoritos.filter((item) => String(item.id) !== String(id));
    exibirFavoritos(); status('status-favoritos', 'Cidade removida dos favoritos.');
  } catch (erro) { status('status-favoritos', erro.message, true); botao.disabled = false; }
}
$('form-busca').addEventListener('submit', (evento) => {
  evento.preventDefault(); buscarCidade($('campo-busca').value);
});
document.querySelectorAll('[data-cidade]').forEach((botao) => {
  botao.addEventListener('click', () => {
    $('campo-busca').value = botao.dataset.cidade; buscarCidade(botao.dataset.cidade);
  });
});
function ajustarUnidades() {
  document.querySelectorAll('[data-unidade]').forEach((botao) => {
    botao.setAttribute('aria-pressed', String(botao.dataset.unidade === unidade));
  });
}
document.querySelectorAll('[data-unidade]').forEach((botao) => {
  botao.addEventListener('click', () => {
    unidade = botao.dataset.unidade;
    try { localStorage.setItem('climaflow-unidade', unidade); } catch { /* Preferência opcional. */ }
    ajustarUnidades(); exibirClima();
  });
});
$('botao-atualizar-favoritos').addEventListener('click', () => listarFavoritos());
ajustarUnidades();
listarFavoritos();
