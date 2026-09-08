# ♟ Crazy Chess

Jogo de xadrez multiplayer em tempo real com cartas especiais. O frontend React comunica-se por WebSocket com um backend TypeScript modular; as partidas duráveis ficam no Postgres.

## Recursos

- Partidas em tempo real via WebSocket.
- Autenticação por JWT: cadastro, login, sessão renovável e logout.
- Persistência de salas no Postgres.
- Cartas especiais: Marcha Lateral, Salto do Cavalo e Reviver Aliado.
- Healthcheck HTTP em `GET /health`.
- Frontend responsivo em React, Vite e CSS Modules.

## Arquitetura

```text
backend/src/
  bootstrap/       # Composição HTTP, WebSocket e shutdown
  config/          # Leitura de PORT, DATABASE_URL e CORS_ORIGIN
  modules/
    game/          # Regras puras do tabuleiro e movimentos
    cards/         # Baralho, mão e efeitos das cartas
    rooms/         # Casos de uso e autorização das salas
    realtime/      # Adaptador do protocolo WebSocket
    persistence/   # Repositório Postgres, schema e migration
frontend/          # Aplicação React/Vite
```

O backend não usa SQLite. Bases SQLite antigas, se presentes em `data/`, não são lidas nem migradas.

## Requisitos

- Node.js 24 ou superior
- npm
- Postgres 16 ou superior para persistência local
- Docker e Docker Compose

## Desenvolvimento local

Instale as dependências:

```bash
npm install
npm --prefix frontend install
```

Para executar backend e frontend em paralelo, sem Postgres:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend/WebSocket: `http://localhost:3000` e `ws://localhost:3000/ws`

Para usar um Postgres local, defina `DATABASE_URL` antes de iniciar:

```bash
DATABASE_URL=postgres://usuario:senha@localhost:5432/crazy_chess npm run dev:backend
```

A tabela `rooms` é criada automaticamente na inicialização. Também é possível executá-la explicitamente com `npm run db:migrate`.

## Docker Compose

O Compose cria Postgres e a aplicação, já com `DATABASE_URL` configurada:

```bash
docker compose up --build
```

- Aplicação: `http://localhost:3001`
- Healthcheck: `http://localhost:3001/health`
- Postgres exposto em `localhost:5432`

Para parar e remover os containers do projeto:

```bash
docker compose down
```

## Produção

```bash
npm run build
DATABASE_URL=postgres://usuario:senha@host:5432/crazy_chess npm start
```

`npm start` executa o JavaScript compilado em `backend/dist`. Em produção, `DATABASE_URL` deve estar definido.

### Variáveis de ambiente

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP e WebSocket. |
| `DATABASE_URL` | — | URL de conexão Postgres. Sem ela, o processo usa repositório em memória. |
| `CORS_ORIGIN` | — | Origem permitida no cabeçalho CORS. |
| `JWT_ACCESS_SECRET` | — | Obrigatório em produção; assina access tokens. |
| `JWT_REFRESH_SECRET` | — | Obrigatório em produção; assina refresh tokens. |
| `JWT_ACCESS_TTL` | `15m` | Duração do access token. |
| `JWT_REFRESH_TTL` | `7d` | Duração do refresh token. |

## Autenticação HTTP

`POST /api/auth/register` e `POST /api/auth/login` recebem nome (somente cadastro), e-mail e senha de pelo menos oito caracteres. Ambos retornam um access token; envie-o como `Authorization: Bearer <jwt>` para `GET /api/auth/me`. O refresh token é um cookie `HttpOnly`, `SameSite=Lax` (e `Secure` em produção), rotacionado por `POST /api/auth/refresh` e revogado por `POST /api/auth/logout`.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Backend em watch e frontend Vite. |
| `npm run dev:backend` | Backend TypeScript em watch. |
| `npm run build` | Compila backend e frontend. |
| `npm start` | Inicia o backend compilado. |
| `npm test` | Executa testes unitários e de integração sem Postgres externo. |
| `npm run coverage` | Gera cobertura com c8. |
| `npm run db:migrate` | Cria a tabela de salas no Postgres configurado. |

O teste de persistência Postgres é condicional. Para incluí-lo na suíte, forneça `DATABASE_URL`:

```bash
DATABASE_URL=postgres://usuario:senha@localhost:5432/crazy_chess npm test
```

## Protocolo WebSocket

O endpoint é `/ws`. O backend preserva as ações consumidas pelo frontend:

| Cliente → servidor | Payload relevante |
| --- | --- |
| `CRIAR_SALA` | `codigoSala` opcional |
| `ENTRAR_SALA` | `codigoSala`, `tokenJogador` opcional, `forcarEspectador` opcional |
| `LISTAR_SALAS` | — |
| `PEDIR_MOVIMENTOS_VALIDOS` | `origem`, `cartaId` opcional |
| `TENTATIVA_MOVIMENTO` | `origem`, `destino` |
| `USAR_CARTA` | `cartaId`, `origem`, `destino` e `indiceRevivido` quando aplicável |
| `SAIR_SALA` | — |

As principais respostas são `CONEXAO_ESTABELECIDA`, `SALAS_ATIVAS`, `SALA_ATRIBUIDA`, `ESTADO_ATUALIZADO`, `MOVIMENTOS_PERMITIDOS`, `SALA_SAIDA` e `ERRO_SALA`.


## Prints da aplicação

![Captura de tela 1](docs/prints/Captura_de_tela_20260908_152013.png)

![Captura de tela 2](docs/prints/Captura_de_tela_20260908_152054.png)

