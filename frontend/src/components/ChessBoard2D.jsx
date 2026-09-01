import styles from './ChessBoard2D.module.css';

const PIECE_SYMBOL = {
  branco: { rei: '♔', rainha: '♕', torre: '♖', bispo: '♗', cavalo: '♘', peao: '♙' },
  preto: { rei: '♚', rainha: '♛', torre: '♜', bispo: '♝', cavalo: '♞', peao: '♟' },
};

const keyCasa = (casa) => `${casa.linha}-${casa.coluna}`;
const files = 'abcdefgh';

export default function ChessBoard2D({ tabuleiro, jogadorCor, casaSelecionada, movimentosPermitidos, onSquareClick, disabled }) {
  const linhas = jogadorCor === 'preto' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const colunas = jogadorCor === 'preto' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  return <div className={styles.board} aria-label="Tabuleiro de xadrez 2D">
    {linhas.flatMap((linha, rowIndex) => colunas.map((coluna, colIndex) => {
      const peca = tabuleiro[linha][coluna];
      const selecionada = casaSelecionada?.linha === linha && casaSelecionada?.coluna === coluna;
      const destino = movimentosPermitidos.some((casa) => keyCasa(casa) === `${linha}-${coluna}`);
      return <button
        key={`${linha}-${coluna}`}
        type="button"
        className={`${styles.square} ${(linha + coluna) % 2 === 0 ? styles.light : styles.dark} ${selecionada ? styles.selected : ''} ${destino ? styles.destination : ''}`}
        onClick={() => onSquareClick(linha, coluna)}
        disabled={disabled}
        aria-label={`Casa ${files[coluna]}${8 - linha}`}
      >
        {colIndex === 0 && <span className={styles.rank}>{8 - linha}</span>}
        {rowIndex === 7 && <span className={styles.file}>{files[coluna]}</span>}
        {peca && <span className={`${styles.piece} ${peca.cor === 'branco' ? styles.whitePiece : styles.blackPiece}`}>{PIECE_SYMBOL[peca.cor][peca.tipo]}</span>}
        {destino && <span className={styles.dot} />}
      </button>;
    }))}
  </div>;
}
