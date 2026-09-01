import { describe, expect, it } from 'vitest';
import { getBoardRotation, getPlayerCamera } from './view';

describe('getPlayerCamera', () => {
  it('alinha a câmera ao centro das fileiras, sem ângulo diagonal', () => {
    const { position, target } = getPlayerCamera();

    expect(position).toEqual([0, 7.6, 10.8]);
    expect(target).toEqual([0, 0, -0.45]);
  });
});

describe('getBoardRotation', () => {
  it('mantém a perspectiva das peças brancas', () => {
    expect(getBoardRotation('branco')).toBe(0);
  });

  it('gira o tabuleiro em 180 graus para as peças pretas', () => {
    expect(getBoardRotation('preto')).toBe(Math.PI);
  });
});
