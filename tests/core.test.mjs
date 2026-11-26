import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarBusca, coordenadasValidas, prepararFavorito, cidadeDoFavorito,
  jaFavoritada, traduzirTempo, formatarNumero, formatarTemperatura, formatarDia } from '../src/core.js';
const cidade = { nome: 'Brasília', estado: 'Distrito Federal', pais: 'Brasil', latitude: -15.78, longitude: -47.93 };

test('rejeita busca vazia, curta, extensa e tipos inesperados', () => {
  for (const entrada of ['', ' ', 'a', 'x'.repeat(101), null, 2]) assert.throws(() => validarBusca(entrada));
});
test('preserva acentos e normaliza espaços da busca', () => {
  assert.equal(validarBusca('  São   Paulo  '), 'São Paulo');
});
test('aceita coordenadas zero e os limites geográficos', () => {
  assert.equal(coordenadasValidas(0, 0), true);
  assert.equal(coordenadasValidas(-90, 180), true);
});
test('rejeita coordenadas inválidas sem converter null para zero', () => {
  for (const [lat, lon] of [[91, 0], [0, -181], [NaN, 0], [null, 0], ['0', 0], [0, Infinity]]) {
    assert.equal(coordenadasValidas(lat, lon), false);
  }
});
test('prepara a cidade com os campos exigidos pelo banco', () => {
  assert.deepEqual(prepararFavorito(cidade), {
    nome_item: 'Brasília, Distrito Federal, Brasil', dados_extra: cidade,
  });
});
test('não tenta salvar um favorito sem localização válida', () => {
  assert.throws(() => prepararFavorito({ ...cidade, latitude: null }));
});
test('distingue cidades homônimas no identificador único do banco', () => {
  const a = prepararFavorito({ ...cidade, nome: 'Palmas', estado: 'Tocantins' });
  const b = prepararFavorito({ ...cidade, nome: 'Palmas', estado: 'Paraná' });
  assert.notEqual(a.nome_item, b.nome_item);
});
test('continua lendo os favoritos da Etapa 02 sem migração', () => {
  const { nome, ...antigo } = cidade;
  assert.deepEqual(cidadeDoFavorito({ nome_item: nome, dados_extra: antigo }), cidade);
});
test('detecta cidade já salva por coordenadas, inclusive no formato anterior', () => {
  assert.equal(jaFavoritada(cidade, [{ nome_item: 'Brasília', dados_extra: cidade }]), true);
  assert.equal(jaFavoritada(cidade, [{ nome_item: 'Brasília', dados_extra: {} }]), false);
  assert.equal(jaFavoritada({ ...cidade, latitude: 0 }, [{ dados_extra: cidade }]), false);
});
test('traduz códigos de neve e de trovoada sem confundir as condições', () => {
  assert.equal(traduzirTempo(85).descricao, 'Pancadas de neve');
  assert.equal(traduzirTempo(95).descricao, 'Trovoadas');
  assert.equal(traduzirTempo(999).descricao, 'Condição não informada');
});
test('converte Celsius para Fahrenheit, incluindo zero e valores negativos', () => {
  assert.equal(formatarTemperatura(0, 'F'), '32°F');
  assert.equal(formatarTemperatura(100, 'F'), '212°F');
  assert.equal(formatarTemperatura(-40, 'F'), '-40°F');
  assert.equal(formatarTemperatura(0), '0°C');
});
test('não transforma ausência de leitura meteorológica em zero', () => {
  assert.equal(formatarTemperatura(null), '—');
  assert.equal(formatarNumero(undefined), '—');
  assert.equal(formatarNumero(0), '0');
});
test('formata previsão sem deslocar o dia pelo fuso horário do computador', () => {
  assert.equal(formatarDia('2026-10-20', 0), 'Hoje');
  assert.equal(formatarDia('2026-10-21', 1), 'Amanhã');
  assert.match(formatarDia('2026-10-22', 2), /qui/);
});
