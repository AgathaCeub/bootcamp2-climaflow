# ClimaFlow | Bootcamp II, Etapa 03

Aplicação web para consultar o tempo atual, acompanhar a previsão de cinco dias e salvar cidades favoritas. Esta versão dá continuidade ao ClimaFlow das etapas anteriores.

**Repositório:** [AgathaCeub/bootcamp2-climaflow](https://github.com/AgathaCeub/bootcamp2-climaflow)

**Versão:** 3.1.0 · **Branch:** `feature/etapa03-entrega-final`

**Pull request:** [#1 — Previsão, favoritos SQLite e CI](https://github.com/AgathaCeub/bootcamp2-climaflow/pull/1)

**CI verificado:** [Testes e Container aprovados](https://github.com/AgathaCeub/bootcamp2-climaflow/actions/runs/45825875186)

**Atividade:** Desafio — Entrega Final · Bootcamp II

**Prazo informado no enunciado:** 25/10/2026, às 23h59. Essa data identifica o prazo da atividade; o histórico do GitHub registra as datas reais das alterações.

**Situação:** código preparado para revisão. As evidências de colaboração, proteção da main e publicação da imagem 3.1.0 ainda precisam ser concluídas.

## Integrantes

| Nome | Matrícula | GitHub | Responsabilidade | PR principal |
| --- | --- | --- | --- | --- |
| Ágatha Castro da Costa | 22601851 | [AgathaCeub](https://github.com/AgathaCeub) | Interface, integração com Open-Meteo, favoritos em SQLite, testes, CI e Docker preparados nesta versão | [#1](https://github.com/AgathaCeub/bootcamp2-climaflow/pull/1) |
| Anna Rocha | A confirmar | A confirmar | Participação no grupo informada por Ágatha; divisão de código e PR a confirmar com Anna | A confirmar |

## O que a aplicação faz

- Busca cidades por nome e permite selecionar a localização quando há vários resultados.
- Exibe temperatura, sensação térmica, umidade, vento e previsão de cinco dias.
- Alterna entre °C e °F.
- Cria, lista e exclui favoritos. Um favorito permite consultar novamente a cidade sem refazer a busca.

## API externa e banco de dados

A [Open-Meteo](https://open-meteo.com/en/docs) fornece os dados de clima e previsão. O [Geocoding da Open-Meteo](https://open-meteo.com/en/docs/geocoding-api) localiza cidades e devolve suas coordenadas. A previsão é solicitada para a cidade selecionada e usa o fuso local dela. O uso não requer uma chave para esta execução acadêmica.

Os favoritos ficam em um banco **SQLite** real, no arquivo `data/climaflow.sqlite`. O servidor em Node.js cria o arquivo e a tabela `favoritos` ao iniciar. São armazenados nome, estado, país, latitude, longitude e data de inclusão. As coordenadas impedem duplicatas; a exclusão é feita pelo identificador de cada registro.

| Operação | Rota |
| --- | --- |
| Listar | `GET /api/favoritos` |
| Criar | `POST /api/favoritos` |
| Excluir | `DELETE /api/favoritos/:id` |

A Etapa 02 usava Supabase/PostgreSQL. Nesta versão, os favoritos são armazenados no SQLite pelo backend; os dados antigos não são migrados automaticamente.

O banco desta etapa começa vazio e pertence à instalação que está rodando. O navegador guarda somente a preferência de unidade de temperatura. A execução completa usa o servidor Node.js ou Docker; uma hospedagem apenas de arquivos estáticos não executa o banco.

## Executar no computador

Com **Node.js 24 ou superior**, baixe a branch desta entrega e execute:

~~~bash
git clone --branch feature/etapa03-entrega-final https://github.com/AgathaCeub/bootcamp2-climaflow.git
cd bootcamp2-climaflow
~~~

~~~bash
npm ci
npm start
~~~

Abra [http://localhost:8080](http://localhost:8080). O banco é criado automaticamente. A consulta meteorológica precisa de internet. Para ver os dados permanecerem, salve uma cidade, encerre o servidor e execute `npm start` novamente.

## Executar com Docker

O [repositório no Docker Hub](https://hub.docker.com/r/agathacastro/bootcamp2-climaflow) é o da etapa anterior. A tag **3.1.0** desta entrega ainda precisa ser publicada.

Enquanto a tag não for publicada, construa e rode a imagem a partir da pasta do código:

~~~bash
docker build -t climaflow:3.1.0 .
docker run --rm -p 127.0.0.1:8080:8080 -v climaflow-dados:/app/data climaflow:3.1.0
~~~

Com a tag publicada, o comando em uma máquina limpa será:

~~~bash
docker run --rm -p 127.0.0.1:8080:8080 -v climaflow-dados:/app/data agathacastro/bootcamp2-climaflow:3.1.0
~~~

Abra [http://localhost:8080](http://localhost:8080). A porta interna é `8080`. O volume `climaflow-dados` preserva os favoritos ao recriar o container. As variáveis padrão já estão no Dockerfile e nenhum segredo é necessário para executar a aplicação.

## Testes e integração contínua

~~~bash
npm test
~~~

A suíte tem **35 testes**, incluindo busca, conversão de unidades, validação de coordenadas, duplicatas e o ciclo de criação, leitura e exclusão. Um teste de integração cria um arquivo SQLite, fecha o servidor, abre novamente o mesmo banco e confirma que os dados foram preservados.

O workflow em `.github/workflows/ci.yml` está configurado para rodar em PRs para a `main`. O job **Testes** roda a suíte e o job **Container** constrói a imagem e verifica a persistência ao recriar o container. O procedimento de proteção da branch e a demonstração do bloqueio estão em [docs/CONTRIBUICAO.md](docs/CONTRIBUICAO.md).

## Evidências

| Item | Situação |
| --- | --- |
| Testes locais | 35 aprovados; [registro da execução](evidencias/testes-etapa03.txt) |
| Persistência real | Criação, leitura após reabrir o banco e exclusão verificadas em SQLite |
| Open-Meteo | Consulta real de Brasília retornou dados atuais e cinco dias de previsão |
| Pull request | [#1 aberta](https://github.com/AgathaCeub/bootcamp2-climaflow/pull/1), aguardando revisão de outra integrante |
| GitHub Actions | [Testes e Container aprovados](https://github.com/AgathaCeub/bootcamp2-climaflow/actions/runs/45825875186); imagem construída e persistência validada ao recriar container |
| Proteção da `main` | Formulário configurado com uma aprovação e checks Testes/Container; salvamento aguarda confirmação de acesso do GitHub |
| Print da PR bloqueada pelo CI | Pendente da ativação do check obrigatório e de execução controlada com falha |
| Imagem Docker Hub 3.1.0 | Pendente de publicação e verificação |
| Conflito de merge | Nenhum ocorrido na preparação local desta versão |

## Entrega no Moodle

Cada integrante deve enviar individualmente o mesmo arquivo **README.md** atualizado. O código fica no repositório. Antes do envio, completar matrícula e GitHub da Anna, registrar a contribuição de código de cada integrante, concluir as revisões e merges, ativar os checks obrigatórios, incluir o print real de CI bloqueado e publicar/testar a imagem 3.1.0.

O README e as evidências devem corresponder à versão de código aprovada no GitHub.
