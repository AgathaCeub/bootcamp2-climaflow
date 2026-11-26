import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { criarServidor } from '../server.mjs';
import { criarApiFavoritos } from '../src/api.js';

async function abrir(caminhoBanco = ':memory:') {
  const servidor = criarServidor({ caminhoBanco });
  await new Promise((resolve, reject) => {
    servidor.once('error', reject);
    servidor.listen(0, '127.0.0.1', resolve);
  });
  return {
    base: 'http://127.0.0.1:' + servidor.address().port,
    fechar: () => new Promise((resolve, reject) => {
      servidor.close((erro) => erro ? reject(erro) : resolve());
      servidor.closeAllConnections();
    }),
  };
}
let app;
let base;
before(async () => {
  app = await abrir();
  base = app.base;
});
after(async () => { await app?.fechar(); });

const brasilia = { nome: 'Brasília', estado: 'Distrito Federal', pais: 'Brasil', latitude: -15.78, longitude: -47.93 };
const lisboa = { nome: 'Lisboa', estado: 'Lisboa', pais: 'Portugal', latitude: 38.72, longitude: -9.14 };
const enviar = (origem, cidade) => fetch(origem + '/api/favoritos', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cidade),
});

test('serve a interface e os módulos com o tipo de conteúdo correto', async () => {
  const pagina = await fetch(base);
  assert.equal(pagina.status, 200);
  assert.match(await pagina.text(), /ClimaFlow/);
  const modulo = await fetch(base + '/src/api.js');
  assert.match(modulo.headers.get('content-type'), /javascript/);
});
test('responde ao healthcheck usado pelo Docker', async () => {
  assert.deepEqual(await (await fetch(base + '/health')).json(), { status: 'ok' });
});
test('recusa arquivos internos e o arquivo do banco', async () => {
  for (const caminho of ['/.env', '/.git/config', '/package.json', '/README.md', '/src/favoritos-db.js', '/data/climaflow.sqlite']) {
    assert.equal((await fetch(base + caminho)).status, 404);
  }
});
test('recusa escrita no servidor de arquivos', async () => {
  const res = await fetch(base, { method: 'POST', body: 'x' });
  assert.equal(res.status, 405);
  assert.equal(res.headers.get('allow'), 'GET, HEAD');
});
test('requisição HEAD não retorna o corpo da página', async () => {
  const res = await fetch(base, { method: 'HEAD' });
  assert.equal(res.status, 200);
  assert.equal(await res.text(), '');
});
test('recusa cidade inválida, JSON malformado e corpo grande sem criar registros', async () => {
  const sandbox = await abrir();
  const endpoint = sandbox.base + '/api/favoritos';
  try {
    assert.equal((await enviar(sandbox.base, { ...brasilia, latitude: 91 })).status, 400);
    assert.equal((await fetch(endpoint, { method: 'POST', body: '{}' })).status, 415);
    const cab = { method: 'POST', headers: { 'Content-Type': 'application/json' } };
    assert.equal((await fetch(endpoint, { ...cab, body: '{' })).status, 400);
    assert.equal((await fetch(endpoint, { ...cab, body: 'x'.repeat(9000) })).status, 413);
    assert.deepEqual(await (await fetch(endpoint)).json(), []);
  } finally { await sandbox.fechar(); }
});
test('impede coordenadas duplicadas e mantém outras cidades ao excluir pelo ID', async () => {
  const sandbox = await abrir();
  const endpoint = sandbox.base + '/api/favoritos';
  const favoritos = criarApiFavoritos(endpoint);
  try {
    const primeiro = await favoritos.salvar(brasilia);
    await assert.rejects(() => favoritos.salvar(brasilia), { code: 'FAVORITO_DUPLICADO', status: 409 });
    const segundo = await favoritos.salvar(lisboa);
    assert.deepEqual((await favoritos.listar()).map(item => item.id), [segundo.id, primeiro.id]);
    await favoritos.excluir(primeiro.id);
    await assert.rejects(() => favoritos.excluir(primeiro.id), { status: 404 });
    assert.deepEqual((await favoritos.listar()).map(item => item.id), [segundo.id]);
  } finally { await sandbox.fechar(); }
});
test('mantém os favoritos no SQLite real depois de fechar e reabrir o servidor', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'climaflow-teste-'));
  const caminho = join(dir, 'favoritos.sqlite');
  let sandbox;
  try {
    sandbox = await abrir(caminho);
    const api = criarApiFavoritos(sandbox.base + '/api/favoritos');
    const criado = await api.salvar(brasilia);
    await sandbox.fechar();
    sandbox = undefined;

    const cabecalho = (await readFile(caminho)).subarray(0, 16).toString();
    assert.equal(cabecalho, 'SQLite format 3\0');

    sandbox = await abrir(caminho);
    const aposReinicio = criarApiFavoritos(sandbox.base + '/api/favoritos');
    assert.deepEqual(await aposReinicio.listar(), [criado]);
    await aposReinicio.excluir(criado.id);
    assert.deepEqual(await aposReinicio.listar(), []);
  } finally {
    await sandbox?.fechar();
    await rm(dir, { recursive: true, force: true });
  }
});
