const PLAYER_CAMERA = Object.freeze({
  position: Object.freeze([0, 7.6, 10.8]),
  target: Object.freeze([0, 0, -0.45]),
});

export function getPlayerCamera() {
  return PLAYER_CAMERA;
}

export function getBoardRotation(cor) {
  return cor === 'preto' ? Math.PI : 0;
}
