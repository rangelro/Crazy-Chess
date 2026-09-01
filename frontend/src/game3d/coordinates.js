const BOARD_CENTER_OFFSET = 3.5;

export function squareToPosition(linha, coluna) {
  return [coluna - BOARD_CENTER_OFFSET, 0, linha - BOARD_CENTER_OFFSET];
}

export function displaySquares(cor) {
  const linhas = cor === 'preto' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const colunas = cor === 'preto' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  return linhas.flatMap((linha) => colunas.map((coluna) => ({ linha, coluna })));
}
