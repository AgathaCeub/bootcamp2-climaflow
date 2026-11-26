#!/usr/bin/env bash
set -euo pipefail

imagem="$1"
container="climaflow-teste-$$-$RANDOM"
volume="$container-dados"

limpar() {
  resultado=$?
  if [ "$resultado" -ne 0 ]; then docker logs "$container" || true; fi
  docker rm -f "$container" >/dev/null 2>&1 || true
  docker volume rm "$volume" >/dev/null 2>&1 || true
}
trap limpar EXIT

subir() {
  docker run -d --name "$container" -p 127.0.0.1::8080 \
    --mount "type=volume,source=$volume,target=/app/data" "$imagem" >/dev/null
  endereco="$(docker port "$container" 8080/tcp)"
  base="http://$endereco"
  for tentativa in $(seq 1 20); do
    if curl --fail --silent "$base/health" >/dev/null; then return 0; fi
    sleep 1
  done
  return 1
}

docker volume create "$volume" >/dev/null
subir
pagina="$(curl --fail --silent "$base/")"
[[ "$pagina" == *ClimaFlow* ]]
id="$(node --input-type=module - "$base" <<'JS'
import assert from 'node:assert/strict';
const url = process.argv[2] + '/api/favoritos';
const r = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nome:'Brasília', estado:'Distrito Federal', pais:'Brasil', latitude:-15.78, longitude:-47.93 })
});
assert.equal(r.status, 201);
const cidade = await r.json();
assert.ok(Number.isSafeInteger(cidade.id));
console.log(cidade.id);
JS
)"

docker rm -f "$container" >/dev/null
subir
node --input-type=module - "$base" "$id" <<'JS'
import assert from 'node:assert/strict';
const url = process.argv[2] + '/api/favoritos';
const id = Number(process.argv[3]);
const listar = async () => {
  const resposta = await fetch(url);
  assert.equal(resposta.status, 200);
  return resposta.json();
};
assert.ok((await listar()).some(item => item.id === id && item.dados_extra.nome === 'Brasília'));
assert.equal((await fetch(url + '/' + id, { method: 'DELETE' })).status, 204);
assert.deepEqual(await listar(), []);
console.log('Container saudável; SQLite persistiu após recriar o container; exclusão confirmada.');
JS
