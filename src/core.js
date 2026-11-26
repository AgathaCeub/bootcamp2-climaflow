export function validarBusca(valor) {
  if (typeof valor !== 'string') throw new Error('Informe o nome de uma cidade.');
  const nome = valor.trim().replace(/\s+/g, ' ');
  if (nome.length < 2) throw new Error('Digite pelo menos 2 letras para buscar uma cidade.');
  if (nome.length > 100) throw new Error('O nome da cidade deve ter até 100 caracteres.');
  return nome;
}

export function coordenadasValidas(latitude, longitude) {
  return typeof latitude === 'number' && Number.isFinite(latitude)
    && typeof longitude === 'number' && Number.isFinite(longitude)
    && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

export function nomeCompleto(cidade) {
  return [cidade.nome, cidade.estado, cidade.pais].filter(Boolean).join(', ');
}

export function prepararFavorito(cidade) {
  if (!cidade || !coordenadasValidas(cidade.latitude, cidade.longitude)) {
    throw new Error('A cidade precisa ter coordenadas válidas.');
  }
  const nome = validarBusca(cidade.nome);
  const estado = typeof cidade.estado === 'string' ? cidade.estado.trim().slice(0, 150) : '';
  const pais = typeof cidade.pais === 'string' ? cidade.pais.trim().slice(0, 150) : '';
  // O rótulo completo distingue cidades homônimas na lista.
  return {
    nome_item: nomeCompleto({ nome, estado, pais }),
    dados_extra: { nome, estado, pais, latitude: cidade.latitude, longitude: cidade.longitude },
  };
}

export function cidadeDoFavorito(favorito) {
  const extra = favorito.dados_extra || {};
  return {
    nome: extra.nome || favorito.nome_item,
    estado: extra.estado || '', pais: extra.pais || '',
    latitude: extra.latitude, longitude: extra.longitude,
  };
}

export function jaFavoritada(cidade, favoritos) {
  return favoritos.some((item) => {
    const salvo = cidadeDoFavorito(item);
    return coordenadasValidas(salvo.latitude, salvo.longitude)
      && Math.abs(salvo.latitude - cidade.latitude) < 0.00001
      && Math.abs(salvo.longitude - cidade.longitude) < 0.00001;
  });
}

export function traduzirTempo(codigo) {
  const condicoes = {
    0: ['Céu limpo', '☀'], 1: ['Predominantemente limpo', '🌤'],
    2: ['Parcialmente nublado', '⛅'], 3: ['Nublado', '☁'],
    45: ['Neblina', '🌫'], 48: ['Neblina com geada', '🌫'],
    51: ['Garoa leve', '🌦'], 53: ['Garoa moderada', '🌦'], 55: ['Garoa forte', '🌧'],
    56: ['Garoa congelante', '🌧'], 57: ['Garoa congelante forte', '🌧'],
    61: ['Chuva leve', '🌧'], 63: ['Chuva moderada', '🌧'], 65: ['Chuva forte', '🌧'],
    66: ['Chuva congelante', '🌧'], 67: ['Chuva congelante forte', '🌧'],
    71: ['Neve leve', '❄'], 73: ['Neve moderada', '❄'], 75: ['Neve forte', '❄'],
    77: ['Grãos de neve', '❄'], 80: ['Pancadas de chuva leves', '🌦'],
    81: ['Pancadas de chuva', '🌧'], 82: ['Pancadas de chuva fortes', '🌧'],
    85: ['Pancadas de neve', '🌨'], 86: ['Pancadas de neve fortes', '🌨'],
    95: ['Trovoadas', '⛈'], 96: ['Trovoadas com granizo', '⛈'],
    99: ['Trovoadas com granizo forte', '⛈'],
  };
  const [descricao, icone] = condicoes[codigo] || ['Condição não informada', '◌'];
  return { descricao, icone };
}

export function formatarNumero(numero, casas = 0) {
  return typeof numero === 'number' && Number.isFinite(numero)
    ? new Intl.NumberFormat('pt-BR', { maximumFractionDigits: casas }).format(numero) : '—';
}

export function formatarTemperatura(celsius, unidade = 'C') {
  if (typeof celsius !== 'number' || !Number.isFinite(celsius)) return '—';
  const valor = unidade === 'F' ? celsius * 9 / 5 + 32 : celsius;
  return `${formatarNumero(valor)}°${unidade === 'F' ? 'F' : 'C'}`;
}

export function formatarDia(data, indice) {
  if (indice === 0) return 'Hoje';
  if (indice === 1) return 'Amanhã';
  const dia = new Date(`${data}T12:00:00Z`);
  return Number.isNaN(dia.valueOf()) ? '—'
    : new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' }).format(dia);
}
