# Autenticação JWT

## Escopo

Adicionar autenticação de usuários ao Crazy Chess para HTTP e WebSocket. Esta entrega cobre cadastro, login, renovação e encerramento de sessão, além da identidade persistente nas salas. Não inclui recuperação de senha, confirmação de e-mail, OAuth ou perfis administrativos.

## Decisões de segurança

- Senhas são armazenadas somente como hash bcrypt com custo 12.
- Access tokens JWT duram 15 minutos e são enviados em `Authorization: Bearer <token>`.
- Refresh tokens JWT duram 7 dias, são rotacionados em cada renovação e a sessão anterior é revogada.
- O refresh token fica exclusivamente em cookie `HttpOnly`, `SameSite=Lax` e com `Secure` em produção; o access token fica somente em memória no navegador.
- Em produção, a inicialização falha sem `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET` configurados.
- E-mails são normalizados (trim + minúsculas) e únicos.

## Contrato HTTP

- `POST /api/auth/register`: recebe `{ nome, email, senha }`, cria o usuário e devolve usuário e access token; também grava o refresh cookie.
- `POST /api/auth/login`: recebe `{ email, senha }` e devolve o mesmo formato.
- `POST /api/auth/refresh`: usa o refresh cookie, o rotaciona e devolve novo access token.
- `POST /api/auth/logout`: revoga a sessão do refresh cookie e a remove do navegador.
- `GET /api/auth/me`: exige `Authorization: Bearer <jwt>` e devolve o usuário autenticado.

Respostas de validação ou autenticação inválida usam status 400 ou 401; e-mail já cadastrado usa 409. As respostas nunca expõem hashes ou refresh tokens.

## Contrato WebSocket

A primeira ação relevante deve ser `AUTENTICAR { token }`, usando um access token válido. Ações de criar sala, entrar, mover peça e usar carta são recusadas antes da autenticação com `{ acao: "ERRO_AUTENTICACAO" }`. A criação e a entrada associam os lados ao `userId`; uma nova conexão do mesmo usuário substitui o socket anterior. Espectadores também precisam estar autenticados.

## Implementação planejada

1. Fundação: dependências, configuração, tipos, JWT e erros de autenticação.
2. Persistência: tabelas `users` e `refresh_sessions`, repositórios e rotação/revogação.
3. HTTP: serviço, controlador, middleware e as cinco rotas de autenticação.
4. Realtime: ação `AUTENTICAR`, bloqueios e identidade de usuário das salas.
5. Frontend: login/cadastro, estado em memória, restauração por cookie, guarda de rota e autenticação no socket.
6. Integração: build, testes, cobertura, Postgres efêmero e validações HTTP/WebSocket reais.
7. Documentação operacional: README, `.env.example` e Docker Compose.

## Critérios de aceite

- Cadastro, login, `/me`, refresh rotativo e logout funcionam com os contratos acima.
- Segredos JWT inválidos ou ausentes em produção impedem a inicialização.
- Access tokens expirados ou com assinatura inválida são rejeitados por HTTP e WebSocket.
- Senhas incorretas, campos inválidos e e-mail duplicado são tratados sem vazar informações sensíveis.
- Nenhuma ação de jogo ocorre em WebSocket não autenticado; a reconexão mantém a identidade do usuário.
- As suítes de backend e frontend, build e cobertura passam; a configuração de Docker e variáveis de ambiente está documentada.

## Processo TDD

Cada comportamento será introduzido por teste que falha pela ausência do comportamento, seguido da implementação mínima e nova execução do teste. A verificação final executará toda a suíte e o build.
