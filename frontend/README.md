# Crazy Chess Frontend

Frontend React + Vite para o jogo Crazy Chess com suporte multi-página.

## Instalação

```bash
npm install
# ou
yarn install
```

## Desenvolvimento

```bash
npm run dev
# ou
yarn dev
```

O aplicativo estará disponível em `http://localhost:5173`

## Build

```bash
npm run build
# ou
yarn build
```

## Estrutura

```
src/
├── components/        # Componentes reutilizáveis
├── pages/             # Páginas da aplicação
├── services/          # Serviços (WebSocket, Storage)
├── styles/            # Estilos globais e tokens CSS
├── App.jsx            # Router principal
└── main.jsx           # Entry point
```

## Componentes Disponíveis

- **Button**: Botão com múltiplas variantes e tamanhos
- **Card**: Container de conteúdo com header, body e footer
- **Input**: Campo de entrada com label e mensagem de erro
- **Badge**: Etiqueta com múltiplas variantes
- **Modal**: Dialog reutilizável
- **Toast**: Notificação temporária

## Páginas

- **Home** (`/`): Tela inicial com opções para criar/entrar em sala
- **Rooms** (`/rooms`): Lista de salas ativas
- **Game** (`/game`): Tela principal de jogo
- **Reconnect** (`/reconnect`): Tela de reconexão automática

## Serviços

- **socketService**: Gerencia conexão WebSocket com o servidor
- **storageService**: Gerencia dados locais (localStorage)

## Design System

Utiliza CSS Modules com variáveis CSS (tokens) para tema unificado:

- **Cores**: Primária, secundária, sucess, error, warning
- **Espaçamento**: xs, sm, md, lg, xl, 2xl, 3xl
- **Tipografia**: Múltiplos tamanhos e pesos
- **Sombras**: sm, md, lg, xl
- **Animações**: fadeIn, slideDown

## Notas

- Sem dependência do Tailwind CSS
- Suporte a reconexão automática
- Persistência de sessão via localStorage
