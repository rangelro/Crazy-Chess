import test from 'node:test';
import assert from 'node:assert/strict';
import { casaAtacada, iniciarTabuleiro, movimentosLegais, validarMovimento } from '../src/modules/game/game.js';

test('peões brancos avançam para linhas menores e não atravessam peças', () => {
  const tabuleiro = iniciarTabuleiro();
  assert.equal(validarMovimento({ linha: 6, coluna: 0 }, { linha: 4, coluna: 0 }, tabuleiro), true);
  assert.equal(validarMovimento({ linha: 6, coluna: 0 }, { linha: 3, coluna: 0 }, tabuleiro), false);
  assert.equal(validarMovimento({ linha: 7, coluna: 0 }, { linha: 5, coluna: 0 }, tabuleiro), false);
});

test('não permite movimento que deixe o próprio rei em xeque', () => {
  const t = Array.from({ length: 8 }, () => Array(8).fill(null));
  t[7][4] = { tipo: 'rei', cor: 'branco', modificadores: [] };
  t[6][4] = { tipo: 'torre', cor: 'branco', modificadores: [] };
  t[0][4] = { tipo: 'torre', cor: 'preto', modificadores: [] };
  t[0][0] = { tipo: 'rei', cor: 'preto', modificadores: [] };
  assert.equal(casaAtacada({ linha: 7, coluna: 4 }, 'preto', t), false);
  assert.equal(movimentosLegais({ linha: 6, coluna: 4 }, 'branco', t).some(x => x.coluna !== 4), false);
});

test('roque exige caminho livre, rei seguro e direitos preservados', () => {
  const t = Array.from({ length: 8 }, () => Array(8).fill(null));
  t[7][4] = { tipo: 'rei', cor: 'branco', modificadores: [] };
  t[7][7] = { tipo: 'torre', cor: 'branco', modificadores: [] };
  t[0][4] = { tipo: 'rei', cor: 'preto', modificadores: [] };
  assert.ok(movimentosLegais({ linha: 7, coluna: 4 }, 'branco', t, { direitosRoque: { branco: { curto: true, longo: true }, preto: { curto: true, longo: true } } }).some(x => x.linha === 7 && x.coluna === 6));
});
