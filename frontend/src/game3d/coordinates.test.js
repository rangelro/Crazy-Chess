import { describe, expect, it } from 'vitest';
import { displaySquares, squareToPosition } from './coordinates';

describe('squareToPosition', () => {
  it('centraliza a casa a8 no canto superior esquerdo do tabuleiro', () => {
    expect(squareToPosition(0, 0)).toEqual([-3.5, 0, -3.5]);
  });

  it('centraliza a casa h1 no canto inferior direito do tabuleiro', () => {
    expect(squareToPosition(7, 7)).toEqual([3.5, 0, 3.5]);
  });
});

describe('displaySquares', () => {
  it('exibe as casas da perspectiva branca', () => {
    expect(displaySquares('branco').slice(0, 2)).toEqual([
      { linha: 0, coluna: 0 },
      { linha: 0, coluna: 1 },
    ]);
  });

  it('inverte as casas para a perspectiva preta', () => {
    expect(displaySquares('preto').slice(0, 2)).toEqual([
      { linha: 7, coluna: 7 },
      { linha: 7, coluna: 6 },
    ]);
  });
});
