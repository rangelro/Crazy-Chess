# Refatoração do Backend para TypeScript Modular e Deploy

## Objetivo

Substituir o `server.js` monolítico por `backend/`, um monólito modular em TypeScript. A primeira produção usa container Docker, Postgres e uma instância WebSocket. O contrato WebSocket atual deve ser preservado. As salas SQLite existentes não serão migradas: o Postgres começa vazio.

## Estrutura e interfaces

```text
backend/src/
  bootstrap/     # criação do processo, shutdown e composição
  config/        # PORT, DATABASE_URL, CORS
  http/          # /health e frontend estático
  modules/
    game/        # tabuleiro, movimento, turno e captura
    cards/       # baralho, mão e efeitos especiais
    rooms/       # criar/entrar/sair/reconectar partidas
    realtime/    # WebSocket e tradução de mensagens
    persistence/ # Drizzle, schema, migrations e repositórios
```

- `game` e `cards` são módulos puros: recebem estado e comandos e retornam resultado ou erro, sem banco ou socket.
- `rooms` é o módulo profundo que coordena regras, persistência e conexões.
- `realtime` mantém as mensagens existentes: `CRIAR_SALA`, `ENTRAR_SALA`, `PEDIR_MOVIMENTOS_VALIDOS`, `TENTATIVA_MOVIMENTO`, `USAR_CARTA` e `SAIR_SALA`, além das respostas atuais.
- `persistence` expõe apenas operações de salas; SQL e Drizzle ficam internos.
- `GET /health` serve para deploy e monitoramento.
- O estado durável fica no Postgres. A publicação de estado fica atrás de uma interface para futura sincronização entre réplicas, sem Redis nesta fase.

## Etapas de implementação

1. Criar a fundação TypeScript, scripts de desenvolvimento, build e teste; criar bootstrap HTTP, configuração tipada e testes de configuração e inicialização.
2. Extrair o núcleo de regras: tabuleiro inicial, peças, caminhos, captura, turnos e serialização; testar movimentos, bloqueios, capturas, turno e peões.
3. Extrair cartas: geração e normalização de baralho e mão, modificadores, marcha lateral, salto de cavalo e revive; testar limites, efeitos e casos inválidos.
4. Criar persistência Postgres com Drizzle: schema, migration e repositório para carregar, salvar e listar salas; testar mapeamento e integração com Postgres efêmero.
5. Implementar casos de uso de salas: criar, entrar, reconectar, sair, listar, jogar e usar carta; centralizar autorização e publicação; testar com adaptadores falsos.
6. Criar adaptador WebSocket compatível com o protocolo existente e testar tradução, erros de sala e permissão de espectador.
7. Adicionar HTTP, Docker e deploy: `/health`, frontend compilado, shutdown gracioso, Dockerfile multi-stage, compose de desenvolvimento, scripts raiz e documentação operacional.
8. Validar integração independente contra Postgres real: migration, backend compilado, WebSockets reais (criar, entrar, movimentos, cartas, revive, reconexão e persistência após reinício), `/health` e ausência de SQLite no backend novo.

## Critérios de aceite

- Cada módulo recebe testes unitários escritos antes da implementação.
- Build TypeScript, testes unitários, testes de integração, migration limpa e `docker compose up` passam.
- A integração usa Postgres efêmero real.
- O frontend atual funciona com o backend novo, sem alterações no protocolo WebSocket.
- O relatório final documenta o que foi testado, resultados esperados e obtidos e a cobertura por módulo.

## Premissas

- Postgres inicia vazio, sem migração das salas SQLite.
- A primeira produção suporta centenas de jogadores com uma instância WebSocket.
- Redis, múltiplas réplicas e microserviços não fazem parte desta fase, mas a arquitetura não impede sua introdução posterior.
