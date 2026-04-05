export const storageService = {
  // Sessão
  salvarSessao: (codigoSala, papel, tokenJogador) => {
    localStorage.setItem(
      'sessao',
      JSON.stringify({ codigoSala, papel, tokenJogador })
    );
  },

  carregarSessao: () => {
    const sessao = localStorage.getItem('sessao');
    return sessao ? JSON.parse(sessao) : null;
  },

  limparSessao: () => {
    localStorage.removeItem('sessao');
  },

  // Estado do jogo
  salvarEstadoPartida: (estado) => {
    localStorage.setItem('estadoPartida', JSON.stringify(estado));
  },

  carregarEstadoPartida: () => {
    const estado = localStorage.getItem('estadoPartida');
    return estado ? JSON.parse(estado) : null;
  },

  limparEstadoPartida: () => {
    localStorage.removeItem('estadoPartida');
  },
};
