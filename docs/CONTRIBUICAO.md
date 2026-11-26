# Revisão, CI e publicação

A Etapa 03 foi preparada com uma participante após a saída da dupla. A aprovação deve ser feita por uma pessoa real indicada pelo professor, se a adaptação individual for aceita.

## Publicar a branch

A alteração está preparada para a branch `feature/etapa03-climaflow-individual` do repositório `AgathaCeub/bootcamp2-climaflow`, com base na versão da Etapa 02. O texto da PR está em [PR_ETAPA03.md](PR_ETAPA03.md). O pacote contém um patch e um script opcional para publicar a branch e abrir a PR em rascunho com a conta AgathaCeub. A PR deve ser marcada como pronta para revisão quando o responsável pela revisão estiver definido.

## Proteger a main

Após a primeira execução do workflow, em **Settings → Branches**, configure uma regra para `main`:

1. Exigir PR e uma aprovação. Aplicar também a quem administra o repositório.
2. Exigir os checks **Testes** e **Container** e a branch atualizada.
3. Exigir resolução das conversas antes do merge. Manter force push e exclusão da main bloqueados.

O script `bash scripts/configurar-github.sh` pode aplicar essa regra com uma conta administradora já autenticada na GitHub CLI. Ele deve ser usado após os checks aparecerem.

## Comprovar o bloqueio pelo CI

1. Com a proteção ativada, faça um commit temporário **na branch da PR** alterando uma expectativa de um teste central, por exemplo o resultado esperado da conversão de 0 °C para °F. Não altere o código da função.
2. Aguarde a falha do check **Testes**. Na PR, capture a área de checks com o merge bloqueado. Guarde o print em `evidencias/ci-bloqueado.png` e acrescente ao README o link do run e a imagem.
3. Corrija a expectativa em outro commit na mesma branch e confirme os checks verdes. Solicite a revisão real e faça o merge apenas após aprovação. Registre conflito somente se ele ocorrer.

## Publicar a imagem Docker

Com Docker Desktop aberto na conta responsável e na pasta do projeto:

~~~bash
docker login
docker buildx build --platform linux/amd64,linux/arm64 \
  -t agathacastro/bootcamp2-climaflow:3.1.0 --push .
~~~

Também é possível usar o workflow **Publicar no Docker Hub** da `main` com o secret `DOCKERHUB_TOKEN` configurado no GitHub. O token deve ser cadastrado na configuração de secrets do repositório.

Depois de publicar, teste a imagem pelo `docker run` do README. Atualize no README o link da tag, a PR, o check obrigatório e a evidência capturada. Envie somente o README no Moodle se a entrega individual fora do prazo for aceita.
