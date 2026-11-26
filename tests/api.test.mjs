import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarApiClima, criarApiFavoritos, requisitarJSON } from '../src/api.js';
const cidade = { nome: 'Brasília', estado: 'Distrito Federal', pais: 'Brasil', latitude: -15.78, longitude: -47.93 };
const base = 'http://localhost:8080/api/favoritos';
const resposta = (data, status = 200) => new Response(status === 204 ? null : JSON.stringify(data), { status });

test('envia cidade com acentos corretamente na consulta de geocoding', async () => {
  const api = criarApiClima(async (url) => {
    assert.equal(new URL(url).searchParams.get('name'), 'São Paulo');
    return resposta({ results: [{ name: 'São Paulo', admin1: 'São Paulo', country: 'Brasil', latitude: -23.5, longitude: -46.6 }] });
  });
  const lista = await api.buscarCidades('São Paulo');
  assert.equal(lista[0].nome, 'São Paulo');
});
test('trata cidade inexistente como lista vazia', async () => {
  const api = criarApiClima(async () => resposta({}));
  assert.deepEqual(await api.buscarCidades('inexistente'), []);
});
test('descarta resultados com coordenadas inválidas', async () => {
  const api = criarApiClima(async () => resposta({ results: [{ latitude: null, longitude: 0 }] }));
  assert.deepEqual(await api.buscarCidades('cidade'), []);
});
test('consulta previsão de cinco dias e fuso local na Open-Meteo', async () => {
  const api = criarApiClima(async (url) => {
    const params = new URL(url).searchParams;
    assert.equal(params.get('forecast_days'), '5');
    assert.equal(params.get('timezone'), 'auto');
    assert.match(params.get('daily'), /precipitation_probability_max/);
    return resposta({ current: { temperature_2m: 0 } });
  });
  assert.equal((await api.consultarClima(cidade)).current.temperature_2m, 0);
});
test('rejeita uma resposta climática sem dados atuais', async () => {
  const api = criarApiClima(async () => resposta({}));
  await assert.rejects(() => api.consultarClima(cidade), /não retornou o clima/);
});
test('traduz falha de rede para mensagem útil', async () => {
  await assert.rejects(() => requisitarJSON('https://exemplo.test', {}, async () => { throw new TypeError('network'); }), /Sem conexão/);
});
test('traduz cancelamento por demora e encerra o temporizador', async () => {
  const erro = new Error('abort'); erro.name = 'AbortError';
  await assert.rejects(() => requisitarJSON('https://exemplo.test', {}, async () => { throw erro; }), /demorou demais/);
});
test('usa o endpoint de favoritos da própria aplicação', async () => {
  const api = criarApiFavoritos(base, async (url) => {
    assert.equal(url, base);
    return resposta([{ id: 1, nome_item: 'Brasília', dados_extra: cidade }]);
  });
  assert.equal((await api.listar())[0].id, 1);
});
test('envia os dados da cidade para o servidor validar e salvar', async () => {
  const api = criarApiFavoritos(base, async (_url, options) => {
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(options.body), cidade);
    return resposta({ id: 3 }, 201);
  });
  assert.equal((await api.salvar(cidade)).id, 3);
});
test('informa duplicidade retornada pela API de favoritos', async () => {
  const mensagem = 'Essa cidade já está nos favoritos.';
  const api = criarApiFavoritos(base, async () => resposta({ code: 'FAVORITO_DUPLICADO', mensagem }, 409));
  await assert.rejects(() => api.salvar(cidade), { code: 'FAVORITO_DUPLICADO', message: mensagem });
});
test('exclui somente o identificador solicitado e aceita resposta sem corpo', async () => {
  const api = criarApiFavoritos(base, async (url, options) => {
    assert.equal(url, base + '/12');
    assert.equal(options.method, 'DELETE');
    return resposta(null, 204);
  });
  assert.equal(await api.excluir(12), null);
});
test('recusa um identificador inválido sem enviar a solicitação', async () => {
  let chamado = false;
  const api = criarApiFavoritos(base, async () => { chamado = true; });
  await assert.rejects(() => api.excluir('1/2'), /Identificador/);
  assert.equal(chamado, false);
});
test('rejeita uma resposta de lista inválida', async () => {
  await assert.rejects(() => criarApiFavoritos(base, async () => resposta({})).listar(), /lista inválida/);
});
test('trata respostas de erro não JSON sem exibir o texto do servidor externo', async () => {
  const indisponivel = () => new Response('upstream connection failed', { status: 503 });
  await assert.rejects(() => requisitarJSON(base, {}, indisponivel), {
    message: 'Não foi possível concluir a consulta. Tente novamente.', status: 503,
  });
});
