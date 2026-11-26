# Adiciona previsão de cinco dias e favoritos persistentes

O ClimaFlow passa a oferecer escolha entre cidades de mesmo nome, previsão de cinco dias e conversão de temperatura. Os favoritos são criados, listados e excluídos pela API local e ficam em SQLite mesmo após reiniciar o servidor.

Para testar, execute `npm ci`, `npm test` e `npm start`. Abra `http://localhost:8080`, busque Brasília, salve a cidade e recarregue a página. Exclua o favorito para verificar a última operação.

**Validação local:** 35 testes aprovados, incluindo persistência em arquivo SQLite após reinício. A Open-Meteo retornou clima atual e cinco dias de previsão na consulta real.

A PR aguarda a revisão indicada pelo professor para a preparação em dupla e os checks do GitHub Actions. A tag Docker Hub 3.1.0 será publicada após a validação.
