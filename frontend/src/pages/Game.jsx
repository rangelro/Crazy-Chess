import styles from './Game.module.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ChessBoard2D from '../components/ChessBoard2D';
import ChessBoard3D from '../components/ChessBoard3D';
import { socketService } from '../services/socket';
import { storageService } from '../services/storage';

function keyCasa(casa) {
  return `${casa.linha}-${casa.coluna}`;
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
  const [threeUnavailable, setThreeUnavailable] = useState(false);
  const [promocaoPendente, setPromocaoPendente] = useState(null);

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
        } else if (message.action === 'PROMOCAO_PENDENTE') {
          setPromocaoPendente({ origem: message.origem, destino: message.destino, opcoes: message.opcoes || [] });
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

  const partidaEncerrada = sala?.resultado?.estado && !['em_andamento', 'xeque'].includes(sala.resultado.estado);
  const ehMeuTurno = sala?.turno === jogadorCor && !partidaEncerrada;
  const minhaMao = sala?.maoAtual || [];

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

  const confirmarPromocao = (promocao) => {
    if (!promocaoPendente) return;
    socketService.send('TENTATIVA_MOVIMENTO', { ...promocaoPendente, promocao });
    setPromocaoPendente(null);
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

  const renderizarTabuleiro = () => {
    if (!sala?.tabuleiro) {
      return <div className={styles.placeholder}>Aguardando estado da partida...</div>;
    }

    const boardProps = {
      tabuleiro: sala.tabuleiro,
      jogadorCor,
      casaSelecionada,
      movimentosPermitidos,
      onSquareClick: handleClickCasa,
      disabled: solicitandoMovimentos || partidaEncerrada,
    };

    return threeUnavailable
      ? <ChessBoard2D {...boardProps} />
      : <ChessBoard3D {...boardProps} onFallback={() => setThreeUnavailable(true)} />;
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
        <div className={styles.header}>
          <div className={styles.identity}>
            <span className={styles.eyebrow}>Crazy Chess</span>
            <strong>{partidaEncerrada ? 'Partida encerrada' : ehMeuTurno ? 'Sua vez de jogar' : 'Aguardando jogada'}</strong>
          </div>
          <div className={styles.playerInfo}>
            <span className={styles.playerBadge}>
              <i className={`${styles.pieceColor} ${jogadorCor === 'branco' ? styles.pieceColorLight : styles.pieceColorDark}`} />
              Você joga de {jogadorCor}
            </span>
            <span className={`${styles.connectionBadge} ${oponente ? styles.connected : ''}`}>
              <i />
              {oponente ? `Oponente ${oponente}` : 'Aguardando oponente'}
            </span>
          </div>
          <button type="button" className={styles.exitButton} onClick={handleSairSala}>
            Sair
          </button>
        </div>

        <main className={styles.boardContainer}>
          <div className={styles.tabuleiro}>
            {renderizarTabuleiro()}
          </div>
          {threeUnavailable && <p className={styles.fallbackNotice}>Modo 2D ativo</p>}
        </main>

        <aside className={`${styles.panel} ${styles.matchPanel}`}>
          <span className={styles.panelLabel}>Partida</span>
          {sala && (
            <dl className={styles.matchDetails}>
              <div><dt>Sala</dt><dd>{sala.codigoSala}</dd></div>
              <div><dt>Turno</dt><dd>{sala.turno}</dd></div>
              <div><dt>Estado</dt><dd className={ehMeuTurno ? styles.yourTurn : ''}>{partidaEncerrada ? sala.resultado.estado.replaceAll('_', ' ') : sala.reiEmXeque ? 'Xeque' : ehMeuTurno ? 'Sua vez' : 'Oponente'}</dd></div>
            </dl>
          )}
          {erroJogo && <p className={styles.errorMessage} role="alert">{erroJogo}</p>}
        </aside>

        <aside className={`${styles.panel} ${styles.handPanel}`}>
          <div className={styles.panelHeading}>
            <span className={styles.panelLabel}>Sua mão</span>
            <span className={styles.cardCount}>{minhaMao.length}</span>
          </div>
          {minhaMao.length === 0 ? (
            <p className={styles.emptyHand}>Sem cartas disponíveis.</p>
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
                    aria-pressed={ativa}
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
              <p><strong>{cartaSelecionada.nome}</strong> selecionada</p>
              {cartaSelecionada.id !== 'reviver_aliado' && (
                <Button className={styles.applyButton} variant="success" size="sm" onClick={usarCartaSelecionada}>
                  Aplicar na peça
                </Button>
              )}
            </div>
          )}
        </aside>

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
                    className={styles.reviveButton}
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

        <Modal isOpen={Boolean(promocaoPendente)} title="Promover peão" onClose={() => {}}>
          <div className={styles.optionsList}>
            {(promocaoPendente?.opcoes || []).map((tipo) => (
              <Button key={tipo} variant="primary" fullWidth onClick={() => confirmarPromocao(tipo)}>
                Promover para {tipo}
              </Button>
            ))}
          </div>
        </Modal>
      </div>
    </div>
  );
}
