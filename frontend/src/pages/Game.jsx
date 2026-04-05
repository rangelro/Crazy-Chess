import styles from './Game.module.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Button from '../components/Button';
import Card, { CardBody } from '../components/Card';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { socketService } from '../services/socket';
import { storageService } from '../services/storage';

const PIECE_SYMBOL = {
  branco: {
    rei: '♔',
    rainha: '♕',
    torre: '♖',
    bispo: '♗',
    cavalo: '♘',
    peao: '♙',
  },
  preto: {
    rei: '♚',
    rainha: '♛',
    torre: '♜',
    bispo: '♝',
    cavalo: '♞',
    peao: '♟',
  },
};

function keyCasa(casa) {
  return `${casa.linha}-${casa.coluna}`;
}

function toFile(coluna) {
  return 'abcdefgh'[coluna] || '?';
}

function toRank(linha) {
  return String(8 - linha);
}

export default function Game() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sala, setSala] = useState(null);
  const [jogadorCor, setJogadorCor] = useState(null);
  const [oponente, setOponente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviveModal, setShowReviveModal] = useState(false);
  const [opcoesRevive, setOpcoesRevive] = useState([]);
  const [casaSelecionada, setCasaSelecionada] = useState(null);
  const [movimentosPermitidos, setMovimentosPermitidos] = useState([]);
  const [solicitandoMovimentos, setSolicitandoMovimentos] = useState(false);
  const [erroJogo, setErroJogo] = useState('');
  const [cartaSelecionada, setCartaSelecionada] = useState(null);
  const [reviveDestinoPendente, setReviveDestinoPendente] = useState(null);

  useEffect(() => {
    // Pegar dados da sessão ou da navegação
    const sessao = storageService.carregarSessao();
    const state = location.state;
    const codigoSala = state?.codigoSala || sessao?.codigoSala;
    const papel = state?.papel || sessao?.papel;
    const tokenJogador = state?.tokenJogador || sessao?.tokenJogador;

    if (!codigoSala || !papel || !tokenJogador) {
      navigate('/');
      return;
    }

    let unsubscribe = null;

    socketService.connect().then(() => {
      if (!state?.codigoSala) {
        socketService.send('ENTRAR_SALA', { codigoSala, tokenJogador });
      }

      setJogadorCor(papel);
      setLoading(false);

      unsubscribe = socketService.onMessage((message) => {
        if (message.action === 'ESTADO_ATUALIZADO') {
          setSala(message.estado);
          setCasaSelecionada(null);
          setMovimentosPermitidos([]);
          setReviveDestinoPendente(null);
          const players = message.estado?.jogadores;
          const meuLado = papel;
          const ladoOponente = meuLado === 'branco' ? 'preto' : 'branco';
          setOponente(players?.[ladoOponente]?.conectado ? ladoOponente : null);
        } else if (message.action === 'MOVIMENTOS_PERMITIDOS') {
          setOpcoesRevive(message.opcoesReviviveis || []);
          if ((message.opcoesReviviveis || []).length > 0) {
            setShowReviveModal(true);
          }
        }
      });
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleSairSala = () => {
    storageService.limparSessao();
    storageService.limparEstadoPartida();
    socketService.send('SAIR_SALA');
    navigate('/');
  };

  const ehMeuTurno = sala?.turno === jogadorCor;
  const minhaMao = sala?.maoAtual || [];
  const linhasExibicao = jogadorCor === 'preto'
    ? [7, 6, 5, 4, 3, 2, 1, 0]
    : [0, 1, 2, 3, 4, 5, 6, 7];
  const colunasExibicao = jogadorCor === 'preto'
    ? [7, 6, 5, 4, 3, 2, 1, 0]
    : [0, 1, 2, 3, 4, 5, 6, 7];

  const solicitarMovimentos = async (origem, cartaId = null) => {
    setErroJogo('');
    setSolicitandoMovimentos(true);

    try {
      const response = await socketService.request(
        'PEDIR_MOVIMENTOS_VALIDOS',
        { origem, ...(cartaId ? { cartaId } : {}) },
        (message) => message.action === 'MOVIMENTOS_PERMITIDOS',
        3000
      );

      setCasaSelecionada(origem);
      setMovimentosPermitidos(response.movimentos || []);
    } catch (error) {
      setCasaSelecionada(null);
      setMovimentosPermitidos([]);
      setErroJogo('Não foi possível obter movimentos válidos agora.');
    } finally {
      setSolicitandoMovimentos(false);
    }
  };

  const usarCartaSelecionada = () => {
    if (!cartaSelecionada) {
      setErroJogo('Selecione uma carta da sua mão.');
      return;
    }

    if (!casaSelecionada) {
      setErroJogo('Selecione uma peça sua no tabuleiro para usar a carta.');
      return;
    }

    if (cartaSelecionada.id === 'reviver_aliado') {
      setErroJogo('Com Reviver, selecione uma casa destacada para posicionar a peça revivida.');
      return;
    }

    socketService.send('USAR_CARTA', {
      cartaId: cartaSelecionada.id,
      origem: casaSelecionada,
    });

    setCartaSelecionada(null);
    setCasaSelecionada(null);
    setMovimentosPermitidos([]);
    setErroJogo('');
  };

  const toggleCarta = async (carta) => {
    const proximaCarta = cartaSelecionada?.id === carta.id ? null : carta;
    setCartaSelecionada(proximaCarta);
    setErroJogo('');

    if (casaSelecionada) {
      await solicitarMovimentos(casaSelecionada, proximaCarta?.id || null);
    }
  };

  const enviarMovimento = (destino) => {
    if (!casaSelecionada) {
      return;
    }

    if (cartaSelecionada?.id === 'reviver_aliado') {
      if (opcoesRevive.length === 0) {
        setErroJogo('Nenhuma peça no cemitério para reviver.');
        return;
      }

      setReviveDestinoPendente(destino);
      setShowReviveModal(true);
      return;
    }

    socketService.send('TENTATIVA_MOVIMENTO', {
      origem: casaSelecionada,
      destino,
    });

    setCasaSelecionada(null);
    setMovimentosPermitidos([]);
  };

  const handleClickCasa = (linha, coluna) => {
    if (!sala || !sala.tabuleiro) {
      return;
    }

    const destino = { linha, coluna };
    const destinoKey = keyCasa(destino);
    const ehDestinoValido = movimentosPermitidos.some((casa) => keyCasa(casa) === destinoKey);

    if (ehDestinoValido) {
      enviarMovimento(destino);
      return;
    }

    const peca = sala.tabuleiro[linha][coluna];

    if (!peca) {
      setCasaSelecionada(null);
      setMovimentosPermitidos([]);
      return;
    }

    if (!ehMeuTurno || peca.cor !== jogadorCor || solicitandoMovimentos) {
      return;
    }

    if (casaSelecionada && casaSelecionada.linha === linha && casaSelecionada.coluna === coluna) {
      setCasaSelecionada(null);
      setMovimentosPermitidos([]);
      return;
    }

    solicitarMovimentos({ linha, coluna }, cartaSelecionada?.id || null);
  };

  const renderizarCasa = (linha, coluna, mostrarRank, mostrarFile) => {
    const peca = sala?.tabuleiro?.[linha]?.[coluna] || null;
    const isLight = (linha + coluna) % 2 === 0;
    const isSelected = casaSelecionada?.linha === linha && casaSelecionada?.coluna === coluna;
    const isPossibleMove = movimentosPermitidos.some((casa) => casa.linha === linha && casa.coluna === coluna);

    const classes = [styles.casa, isLight ? styles.light : styles.dark];
    if (isSelected) {
      classes.push(styles.selected);
    }
    if (isPossibleMove) {
      classes.push(styles.possibleMove);
    }

    return (
      <button
        key={`${linha}-${coluna}`}
        className={classes.join(' ')}
        onClick={() => handleClickCasa(linha, coluna)}
        type="button"
        disabled={solicitandoMovimentos}
        aria-label={`Casa ${toFile(coluna)}${toRank(linha)}`}
      >
        {mostrarRank && <span className={styles.coordRank}>{toRank(linha)}</span>}
        {mostrarFile && <span className={styles.coordFile}>{toFile(coluna)}</span>}
        {peca && (
          <span className={`${styles.peca} ${peca.cor === 'branco' ? styles.whitePiece : styles.blackPiece}`}>
            {PIECE_SYMBOL[peca.cor][peca.tipo]}
          </span>
        )}
        {isPossibleMove && <span className={styles.moveDot} />}
      </button>
    );
  };

  const renderizarTabuleiro = () => {
    if (!sala?.tabuleiro) {
      return <div className={styles.placeholder}>Aguardando estado da partida...</div>;
    }

    return (
      <div className={styles.chessBoard}>
        {linhasExibicao.flatMap((linha, idxLinha) =>
          colunasExibicao.map((coluna, idxColuna) => (
            renderizarCasa(
              linha,
              coluna,
              idxColuna === 0,
              idxLinha === 7
            )
          ))
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando partida...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.gameContainer}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.playerInfo}>
            <Badge variant="primary" size="lg">
              Você: {jogadorCor}
            </Badge>
            {oponente && <Badge variant="secondary" size="lg">Oponente: {oponente}</Badge>}
            {!oponente && <Badge variant="warning" size="lg">Aguardando oponente...</Badge>}
          </div>
          <Button variant="danger" onClick={handleSairSala}>
            Sair da Sala
          </Button>
        </div>

        {/* Game Board */}
        <Card className={styles.boardContainer}>
          <CardBody className={styles.board}>
            <div className={styles.tabuleiro}>
              {renderizarTabuleiro()}
            </div>
          </CardBody>
        </Card>

        {/* Game Info */}
        <div className={styles.gameInfo}>
          <Card>
            <CardBody>
              <h3>Sua Mão</h3>
              {minhaMao.length === 0 ? (
                <p>Sem cartas disponíveis.</p>
              ) : (
                <div className={styles.handGrid}>
                  {minhaMao.map((carta) => {
                    const ativa = cartaSelecionada?.id === carta.id;

                    return (
                      <button
                        key={`${carta.id}-${carta.nome}`}
                        type="button"
                        className={`${styles.handCard} ${ativa ? styles.handCardActive : ''}`}
                        onClick={() => toggleCarta(carta)}
                      >
                        <strong>{carta.nome}</strong>
                        <span>{carta.descricao}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {cartaSelecionada && (
                <div className={styles.cardActions}>
                  <p>
                    Carta selecionada: <strong>{cartaSelecionada.nome}</strong>
                  </p>
                  {cartaSelecionada.id !== 'reviver_aliado' && (
                    <Button variant="success" onClick={usarCartaSelecionada}>
                      Aplicar Carta na Peça Selecionada
                    </Button>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3>Informações da Partida</h3>
              {sala && (
                <div>
                  <p>Sala: {sala.codigoSala}</p>
                  <p>Turno atual: {sala.turno}</p>
                  <p>Status: {ehMeuTurno ? 'Seu turno' : 'Turno do oponente'}</p>
                  {erroJogo && <p className={styles.errorMessage}>{erroJogo}</p>}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Revive Modal */}
        <Modal
          isOpen={showReviveModal}
          title="Selecionar Peça para Reviver"
          size="md"
          onClose={() => setShowReviveModal(false)}
        >
          <div className={styles.reviveOptions}>
            {opcoesRevive.length === 0 ? (
              <p>Nenhuma peça disponível para reviver</p>
            ) : (
              <div className={styles.optionsList}>
                {opcoesRevive.map((opcao, idx) => (
                  <Button
                    key={idx}
                    variant="primary"
                    fullWidth
                    onClick={() => {
                      socketService.send('USAR_CARTA', {
                        cartaId: 'reviver_aliado',
                        origem: casaSelecionada,
                        destino: reviveDestinoPendente,
                        indiceRevivido: opcao.indice,
                      });
                      setShowReviveModal(false);
                      setReviveDestinoPendente(null);
                      setCartaSelecionada(null);
                    }}
                  >
                    Reviver {opcao.tipo} ({opcao.cor})
                  </Button>
                ))}
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}
