import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { prepararFavorito } from './src/core.js';
import { abrirFavoritos } from './src/favoritos-db.js';

const arquivos = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['/script.js', ['script.js', 'text/javascript; charset=utf-8']],
  ['/src/core.js', ['src/core.js', 'text/javascript; charset=utf-8']],
  ['/src/api.js', ['src/api.js', 'text/javascript; charset=utf-8']],
  ['/src/icones.js', ['src/icones.js', 'text/javascript; charset=utf-8']],
]);

const dataPadrao = fileURLToPath(new URL('./data/', import.meta.url));
const limiteJSON = 8192;

function json(req, res, codigo, dados, headers = {}) {
  res.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(req.method === 'HEAD' || codigo === 204 ? undefined : JSON.stringify(dados));
}

class ErroRequisicao extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

async function lerJSON(req) {
  const tipo = req.headers['content-type']?.split(';')[0].trim().toLowerCase();
  if (tipo !== 'application/json') {
    req.resume();
    throw new ErroRequisicao(415, 'Envie os dados no formato JSON.');
  }
  if (Number(req.headers['content-length']) > limiteJSON) {
    req.resume();
    throw new ErroRequisicao(413, 'Dados da cidade excedem o tamanho permitido.');
  }
  const partes = [];
  let total = 0;
  for await (const parte of req.iterator({ destroyOnReturn: false })) {
    total += parte.length;
    if (total > limiteJSON) {
      req.resume();
      throw new ErroRequisicao(413, 'Dados da cidade excedem o tamanho permitido.');
    }
    partes.push(parte);
  }
  try {
    return JSON.parse(Buffer.concat(partes).toString('utf8'));
  } catch {
    throw new ErroRequisicao(400, 'JSON inválido.');
  }
}

export function criarServidor({ env = process.env, caminhoBanco } = {}) {
  const favoritos = abrirFavoritos(caminhoBanco ?? resolve(env.DATA_DIR || dataPadrao, 'climaflow.sqlite'));

  const servidor = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Cache-Control', 'no-store');

    try {
      const caminho = new URL(req.url, 'http://localhost').pathname;
      if (caminho === '/api/favoritos') {
        if (req.method === 'GET' || req.method === 'HEAD') {
          return json(req, res, 200, favoritos.listar());
        }
        if (req.method === 'POST') {
          const cidade = await lerJSON(req);
          let favorito;
          try {
            favorito = prepararFavorito(cidade);
          } catch (erro) {
            throw new ErroRequisicao(400, erro.message);
          }
          const salvo = favoritos.salvar(favorito);
          if (!salvo) {
            return json(req, res, 409, {
              code: 'FAVORITO_DUPLICADO', mensagem: 'Essa cidade já está nos favoritos.',
            });
          }
          return json(req, res, 201, salvo, { Location: '/api/favoritos/' + salvo.id });
        }
        return json(req, res, 405, { mensagem: 'Método não permitido.' }, { Allow: 'GET, HEAD, POST' });
      }

      if (caminho.startsWith('/api/favoritos/')) {
        const idTexto = caminho.slice('/api/favoritos/'.length);
        const id = Number(idTexto);
        if (!/^[1-9]\d*$/.test(idTexto) || !Number.isSafeInteger(id)) {
          throw new ErroRequisicao(400, 'Identificador do favorito inválido.');
        }
        if (req.method !== 'DELETE') {
          return json(req, res, 405, { mensagem: 'Método não permitido.' }, { Allow: 'DELETE' });
        }
        return favoritos.excluir(id)
          ? json(req, res, 204)
          : json(req, res, 404, { mensagem: 'Favorito não encontrado.' });
      }

      if (caminho.startsWith('/api/')) {
        return json(req, res, 404, { mensagem: 'Rota não encontrada.' });
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return json(req, res, 405, { mensagem: 'Método não permitido.' }, { Allow: 'GET, HEAD' });
      }
      if (caminho === '/health') return json(req, res, 200, { status: 'ok' });

      const arquivo = arquivos.get(caminho);
      if (!arquivo) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Página não encontrada.');
      }
      const conteudo = await readFile(new URL(arquivo[0], import.meta.url));
      res.writeHead(200, { 'Content-Type': arquivo[1] });
      res.end(req.method === 'HEAD' ? undefined : conteudo);
    } catch (erro) {
      if (erro instanceof ErroRequisicao) return json(req, res, erro.status, { mensagem: erro.message });
      json(req, res, 500, { mensagem: 'Não foi possível concluir a operação.' });
    }
  });

  servidor.once('close', () => favoritos.fechar());
  return servidor;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 8080);
  const host = process.env.HOST || '127.0.0.1';
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT deve ser um número entre 1 e 65535.');
  }
  const servidor = criarServidor();
  servidor.listen(port, host, () => {
    console.log('ClimaFlow disponível em http://localhost:' + port);
  });
  for (const sinal of ['SIGINT', 'SIGTERM']) {
    process.once(sinal, () => servidor.close());
  }
}
