# ♟ Crazy Chess

Um jogo de xadrez multiplayer em tempo real com cartas especiais. Implemente estratégias criativas usando poderes especiais para derrotar seu oponente.

## 🎮 Features

- **Multiplayer em Tempo Real**: WebSocket para sincronização instantânea
- **Persistência**: Salva salas e partidas em SQLite
- **Reconexão Automática**: Reconecte à mesma partida se a conexão cair
- **Cartas Especiais**: 3 cartas por jogo com até 1 revive
  - Marcha Lateral
  - Salto de Cavaleiro
  - Reviver Aliado (com sacrifice de bispo)
- **UI Moderna**: React + Vite com design system (sem Tailwind)
- **Responsivo**: Funciona em desktop e mobile

## 🛠️ Tech Stack

### Backend
- **Node.js + Express**: Servidor HTTP e WebSocket
- **ws**: WebSocket server
- **SQLite3**: Persistência de dados

### Frontend
- **React 18**: UI library
- **Vite**: Build tool ultrarrápido
- **React Router**: Navegação multi-página
- **CSS Modules**: Estilos isolados

## 📁 Estrutura do Projeto

```
├── server.js              # Servidor Node + WebSocket
├── package.json           # Dependências backend
├── frontend/              # Aplicação React (Vite)
│   ├── src/
│   │   ├── pages/         # Home, Rooms, Game, Reconnect
│   │   ├── components/    # Button, Card, Input, Badge, etc
│   │   ├── services/      # WebSocket e Storage
│   │   └── styles/        # CSS Modules + Tokens
│   └── package.json
└── data/                  # Banco de dados SQLite
```

## 🚀 Como Executar

### Desenvolvimento (Backend + Frontend)
```bash
npm install                 # Instala dependências root
cd frontend && npm install  # Instala dependências frontend
cd ..
npm run dev                 # Roda ambos simultaneamente
```

Acesse:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

### Produção (apenas servidor)
```bash
npm start                   # Roda servidor na porta 3000
```

## 🎯 Como Jogar

1. **Criar/Entrar em Sala**: Escolha uma opção na tela inicial
2. **Compartilhe o Código**: Envie o código para um amigo
3. **Aguarde Oponente**: Ambos jogadores entram na mesma sala
4. **Jogue**: Xadrez com movimentos especiais via cartas
5. **Ganhe**: Derrote o rei do oponente

## 🎨 Design System

Sem Tailwind - usando CSS Variables:

**Cores:**
- Primária: `#1a472a`
- Secundária: `#d4af37`
- Neutras: Escala de cinza

**Componentes:**
- Button (múltiplas variantes)
- Card (header, body, footer)
- Input (com validação)
- Badge (etiqueta)
- Modal (dialog)
- Toast (notificação)

## 🔌 WebSocket Actions

**Client → Server**
```
CRIAR_SALA
ENTRAR_SALA { codigoSala }
TENTATIVA_MOVIMENTO { de, para }
USAR_CARTA { tipo, dados }
LISTAR_SALAS
SAIR_SALA
```

## 📱 Responsividade

- Mobile-first
- Funciona em todos os breakpoints
- Otimizado para toque

## 🐛 Troubleshooting

**Erro de conexão?**
```bash
npm install  # Reinstalar dependências
npm run dev  # Limpar e reconectar
```

**Banco corrompido?**
```bash
rm -f data/crazy_chess.db
npm start  # Recria automaticamente
```

## 📄 Licença

Conforme [LICENSE.txt](LICENSE.txt)

---

**Status**: Em desenvolvimento ✨
