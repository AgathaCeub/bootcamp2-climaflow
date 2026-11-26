// Ícones vetoriais locais para não depender de fontes de emoji ou de uma CDN.
const sol = '<circle cx="24" cy="24" r="9"/><path d="M24 3v5m0 32v5M3 24h5m32 0h5M9 9l4 4m22 22 4 4M9 39l4-4m22-22 4-4"/>';
const nuvem = '<path d="M13 32h22a8 8 0 0 0 0-16 12 12 0 0 0-23-1 8.5 8.5 0 0 0 1 17Z"/>';
const desenhos = {
  sol,
  parcial: '<circle cx="15" cy="13" r="7"/><path d="M15 1v3M3 13h3M6 4l3 3m15-3-3 3"/>' + nuvem,
  nuvem,
  neblina: nuvem + '<path d="M8 38h32M12 44h24"/>',
  chuva: nuvem + '<path d="m15 37-3 6m14-6-3 6m14-6-3 6"/>',
  neve: nuvem + '<path d="M16 36v10m-4-8 8 6m-8 0 8-6m12-2v10m-4-8 8 6m-8 0 8-6"/>',
  trovoada: nuvem + '<path d="m24 32-6 9h7l-3 6 12-12h-8l3-3"/>',
  desconhecido: '<circle cx="24" cy="24" r="16"/><path d="M19 19a5 5 0 0 1 10 0c0 5-5 4-5 9m0 5v1"/>',
};

export function criarIconeTempo(codigo, classe = '') {
  let tipo = 'desconhecido';
  if (codigo === 0 || codigo === 1) tipo = 'sol';
  else if (codigo === 2) tipo = 'parcial';
  else if (codigo === 3) tipo = 'nuvem';
  else if ([45, 48].includes(codigo)) tipo = 'neblina';
  else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(codigo)) tipo = 'chuva';
  else if ([71, 73, 75, 77, 85, 86].includes(codigo)) tipo = 'neve';
  else if ([95, 96, 99].includes(codigo)) tipo = 'trovoada';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 48 48');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2.2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('class', classe);
  svg.setAttribute('focusable', 'false');
  svg.innerHTML = desenhos[tipo];
  return svg;
}
