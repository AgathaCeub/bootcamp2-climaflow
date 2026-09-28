# ClimaFlow

## Autor
Ágatha Castro — Matrícula: 22601851

## Descrição
O ClimaFlow é uma aplicação web para consultar o clima atual de uma cidade. Na Etapa 02, o projeto passou a permitir salvar e excluir cidades favoritas usando persistência de dados no Supabase.

## API utilizada
- **Open-Meteo**
- Documentação: https://open-meteo.com/en/docs
- Geocoding: `https://geocoding-api.open-meteo.com/v1/search`
- Previsão atual: `https://api.open-meteo.com/v1/forecast`

## Persistência de dados
Foi utilizado o **Supabase**, com banco PostgreSQL.

Tabela: `favoritos`

Campos:
- `id`: identificador do registro
- `created_at`: data e hora em que a cidade foi salva
- `nome_item`: nome da cidade
- `dados_extra`: estado, país, latitude e longitude em JSON

A aplicação permite criar, listar e excluir favoritos. Nesta etapa, as políticas RLS foram configuradas para permitir leitura, inclusão e exclusão pelo papel `anon`, conforme a proposta acadêmica do exercício.

## Funcionalidades
- Buscar uma cidade pelo nome.
- Consultar os dados atuais usando `fetch`.
- Exibir temperatura, sensação térmica, umidade e velocidade do vento.
- Salvar cidades favoritas no Supabase.
- Listar cidades favoritas ao abrir a aplicação.
- Excluir cidades favoritas.

## Como executar localmente
1. Clone: `git clone https://github.com/AgathaCeub/bootcamp2-climaflow.git`
2. Configure `config.js` com a Project URL e a Publishable key (ou anon key, em projeto legado) do Supabase.
3. Abra `index.html` no navegador.

## Docker

### Construir a imagem
```bash
docker build -t bootcamp2-climaflow .
```

### Executar localmente
```bash
docker run -d -p 8080:80 --name climaflow bootcamp2-climaflow
```

### Executar dois containers
```bash
docker run -d -p 8080:80 --name climaflow-1 bootcamp2-climaflow
docker run -d -p 8081:80 --name climaflow-2 bootcamp2-climaflow
docker ps
```

## Sidequests

### SQ1 - .dockerignore
Foi criado um `.dockerignore` para não enviar ao build arquivos desnecessários, deixando a imagem mais limpa e o processo mais rápido.

### SQ2 - Versionamento da imagem
Tags no Docker Hub: `1.0`, `1.1` e `latest`.

### SQ3 - Docker Hub
O repositório no Docker Hub terá a descrição do projeto, comando `docker run` e link do GitHub.

### SQ4 - Explorando a orquestração
Foram executados dois containers simultaneamente nas portas 8080 e 8081.

**Evidência:** adicionar o print do `docker ps` depois do teste.

Se eu tivesse 100 containers, não seria viável administrar cada um manualmente. O Kubernetes poderia organizar esses containers em um cluster, usando pods para executar as instâncias e réplicas para manter a quantidade necessária da aplicação rodando. Isso facilita escalar, substituir containers com falha e distribuir a aplicação entre diferentes máquinas.

## Links
- **Aplicação no ar (GitHub Pages):** https://agathaceub.github.io/bootcamp2-climaflow/
- **Repositório GitHub:** https://github.com/AgathaCeub/bootcamp2-climaflow
- **Docker Hub:** ADICIONAR_LINK_DEPOIS
