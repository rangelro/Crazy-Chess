# Relatório de construção e testes do backend

## Resultado geral

O backend TypeScript modular foi compilado com sucesso. A suíte executou 15 testes: 14 aprovados, 0 falhos e 1 condicionalmente ignorado sem `DATABASE_URL`. O build completo (backend e frontend) passou. O Compose foi construído e iniciado com Postgres saudável; `GET http://localhost:3001/health` retornou `{"status":"ok"}`.

## O que foi testado

| Área | Resultado esperado | Resultado obtido |
| --- | --- | --- |
| Configuração | `PORT` padrão, `DATABASE_URL` e CORS opcionais | Valores padrão corretos |
| Jogo | Peão branco avança na orientação correta e não atravessa peça | Correto |
| Cartas | Baralho com três cartas e no máximo um revive; marcha e revive aplicam regras | Correto |
| Salas | Alternância de turno e reconexão por token | Correto |
| Regras de xadrez | Xeque, roque, en passant, promoção e xeque-mate | Correto |
| HTTP | Processo inicializado responde `200` em `/health` | Correto |
| WebSocket | Criar sala, entrar como segundo jogador e pedir movimentos mantêm os payloads | Correto |
| Postgres | Migration, escrita e nova instância carregando uma sala persistida | Correto |
| Docker | Imagem multi-stage constrói e app conecta ao Postgres | Correto |

## Cobertura medida

Medição realizada com `DATABASE_URL=postgres://crazy_chess:crazy_chess@127.0.0.1:5432/crazy_chess npm run coverage`.

| Módulo | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| bootstrap | 100% | 66,66% | 100% | 100% |
| config | 100% | 66,66% | 100% | 100% |
| game | 51,72% | 87,73% | 90,90% | 51,72% |
| cards | 100% | 75,00% | 100% | 100% |
| rooms | 100% | 73,01% | 92,59% | 100% |
| realtime | 96,77% | 68,42% | 100% | 96,77% |
| persistence | 73,33% | 87,50% | 86,66% | 73,33% |
| Total executável | 79,13% | 77,94% | 83,33% | 79,13% |

`types.ts`, `schema.ts`, `migrate.ts`, `index.ts` e a configuração do Drizzle não entram no total executável de módulos: são declarações, inicializadores de processo ou arquivos de configuração. O relatório bruto do c8 está em `coverage/coverage-final.json`.

## Comandos executados

```bash
npm run build:backend
npm test
DATABASE_URL=postgres://crazy_chess:crazy_chess@127.0.0.1:5432/crazy_chess npm run coverage
npm run build
docker compose up --build -d
curl --fail --silent http://localhost:3001/health
```
