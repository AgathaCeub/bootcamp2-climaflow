import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export function abrirFavoritos(caminho) {
  if (caminho !== ':memory:') mkdirSync(dirname(caminho), { recursive: true });
  const db = new DatabaseSync(caminho);
  db.exec([
    'PRAGMA busy_timeout = 3000;',
    'PRAGMA journal_mode = WAL;',
    'CREATE TABLE IF NOT EXISTS favoritos (',
    '  id INTEGER PRIMARY KEY AUTOINCREMENT,',
    '  nome_item TEXT NOT NULL,',
    '  nome TEXT NOT NULL,',
    '  estado TEXT NOT NULL,',
    '  pais TEXT NOT NULL,',
    '  latitude REAL NOT NULL CHECK (latitude BETWEEN -90 AND 90),',
    '  longitude REAL NOT NULL CHECK (longitude BETWEEN -180 AND 180),',
    "  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),",
    '  UNIQUE (latitude, longitude)',
    ') STRICT;',
  ].join('\n'));

  const campos = 'id, nome_item, nome, estado, pais, latitude, longitude, created_at';
  const listar = db.prepare('SELECT ' + campos + ' FROM favoritos ORDER BY id DESC');
  const inserir = db.prepare(
    'INSERT INTO favoritos (nome_item, nome, estado, pais, latitude, longitude) ' +
    'VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (latitude, longitude) DO NOTHING RETURNING ' + campos,
  );
  const excluir = db.prepare('DELETE FROM favoritos WHERE id = ?');
  const registro = ({ id, nome_item, created_at, nome, estado, pais, latitude, longitude }) =>
    ({ id, nome_item, created_at, dados_extra: { nome, estado, pais, latitude, longitude } });

  return {
    listar: () => listar.all().map(registro),
    salvar({ nome_item, dados_extra: { nome, estado, pais, latitude, longitude } }) {
      const linha = inserir.get(nome_item, nome, estado, pais, latitude, longitude);
      return linha ? registro(linha) : null;
    },
    excluir: (id) => excluir.run(id).changes === 1,
    fechar: () => db.close(),
  };
}
