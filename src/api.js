import { validarBusca, coordenadasValidas } from './core.js';

export async function requisitarJSON(url, options = {}, fetchImpl = globalThis.fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const resposta = await fetchImpl(url, { ...options, signal: controller.signal });
    let dados = null;
    if (resposta.status !== 204) {
      try { dados = await resposta.json(); }
      catch (erro) {
        if (erro.name !== 'SyntaxError') throw erro;
        if (resposta.ok) throw new Error('O serviço retornou uma resposta inválida.');
      }
    }
    if (!resposta.ok) {
      const erro = new Error(typeof dados?.mensagem === 'string'
        ? dados.mensagem : 'Não foi possível concluir a consulta. Tente novamente.');
      erro.code = dados?.code;
      erro.status = resposta.status;
      throw erro;
    }
    return dados;
  } catch (erro) {
    if (erro.name === 'AbortError') throw new Error('A consulta demorou demais. Tente novamente.');
    if (erro instanceof TypeError) throw new Error('Sem conexão com o serviço. Confira sua internet.');
    throw erro;
  } finally { clearTimeout(timeout); }
}

export function criarApiClima(fetchImpl = globalThis.fetch) {
  return {
    async buscarCidades(busca) {
      const nome = validarBusca(busca);
      const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
      url.search = new URLSearchParams({ name: nome, count: '5', language: 'pt', format: 'json' });
      const dados = await requisitarJSON(url, {}, fetchImpl);
      return (dados?.results || [])
        .filter((local) => coordenadasValidas(local.latitude, local.longitude))
        .map((local) => ({ nome: local.name, estado: local.admin1 || '',
          pais: local.country || '', latitude: local.latitude, longitude: local.longitude }));
    },
    async consultarClima(cidade) {
      if (!coordenadasValidas(cidade.latitude, cidade.longitude)) {
        throw new Error('A cidade precisa ter coordenadas válidas.');
      }
      const url = new URL('https://api.open-meteo.com/v1/forecast');
      url.search = new URLSearchParams({
        latitude: String(cidade.latitude), longitude: String(cidade.longitude),
        current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
        forecast_days: '5', timezone: 'auto', temperature_unit: 'celsius', wind_speed_unit: 'kmh',
      });
      const dados = await requisitarJSON(url, {}, fetchImpl);
      if (!dados?.current || typeof dados.current.temperature_2m !== 'number') {
        throw new Error('O serviço não retornou o clima desta cidade. Tente novamente.');
      }
      return dados;
    },
  };
}

export function criarApiFavoritos(base = './api/favoritos', fetchImpl = globalThis.fetch) {
  return {
    async listar() {
      const dados = await requisitarJSON(base, {}, fetchImpl);
      if (!Array.isArray(dados)) throw new Error('O banco retornou uma lista inválida.');
      return dados;
    },
    async salvar(cidade) {
      return requisitarJSON(base, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cidade),
      }, fetchImpl);
    },
    async excluir(id) {
      if (!/^[1-9]\d*$/.test(String(id)) || !Number.isSafeInteger(Number(id))) {
        throw new Error('Identificador do favorito inválido.');
      }
      return requisitarJSON(base + '/' + id, { method: 'DELETE' }, fetchImpl);
    },
  };
}
