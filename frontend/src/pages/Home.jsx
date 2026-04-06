import styles from './Home.module.css';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Button from '../components/Button';
import Card, { CardBody } from '../components/Card';
import Input from '../components/Input';
import { socketService } from '../services/socket';
import { storageService } from '../services/storage';

export default function Home() {
  const navigate = useNavigate();
  const [codigoSala, setCodigoSala] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCriarSala = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await socketService.request(
        'CRIAR_SALA',
        {},
        (message) => message.action === 'SALA_ATRIBUIDA' || message.action === 'ERRO_SALA'
      );

      if (response.action === 'ERRO_SALA') {
        setError(response.mensagem || 'Erro ao criar sala');
        setLoading(false);
        return;
      }

      const { codigo, papel, tokenJogador } = response.sala;
      storageService.salvarSessao(codigo, papel, tokenJogador);
      setLoading(false);
      navigate('/game', { state: { codigoSala: codigo, papel, tokenJogador } });
    } catch (err) {
      setError('Não foi possível criar sala. Verifique se o servidor está online e tente novamente.');
      setLoading(false);
    }
  };

  const handleEntrarSala = async () => {
    if (!codigoSala.trim()) {
      setError('Digite o código da sala');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await socketService.request(
        'ENTRAR_SALA',
        { codigoSala },
        (message) => message.action === 'SALA_ATRIBUIDA' || message.action === 'ERRO_SALA'
      );

      if (response.action === 'ERRO_SALA') {
        setError(response.mensagem || 'Erro ao entrar na sala');
        setLoading(false);
        return;
      }

      const { papel, tokenJogador } = response.sala;
      storageService.salvarSessao(codigoSala.toUpperCase(), papel, tokenJogador);
      setLoading(false);
      navigate('/game', {
        state: { codigoSala: codigoSala.toUpperCase(), papel, tokenJogador },
      });
    } catch (err) {
      setError('Não foi possível entrar na sala. Verifique se o servidor está online e tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>♟ Crazy Chess ♟</h1>
          <p>Uma nova forma de jogar xadrez</p>
        </div>

        <Card className={styles.card}>
          <CardBody>
            <div className={styles.section}>
              <h2>Criar Nova Partida</h2>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleCriarSala}
                disabled={loading}
              >
                {loading ? 'Criando...' : 'Criar Sala'}
              </Button>
            </div>

            <div className={styles.divider} />

            <div className={styles.section}>
              <h2>Entrar em Partida Existente</h2>
              <Input
                type="text"
                placeholder="Digite o código da sala"
                value={codigoSala}
                onChange={(e) => setCodigoSala(e.target.value)}
                error={!!error}
                helperText={error}
                onKeyPress={(e) => e.key === 'Enter' && handleEntrarSala()}
              />
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={handleEntrarSala}
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </div>

            <div className={styles.divider} />

            <div className={styles.section}>
              <h2>Salas Ativas</h2>
              <Button
                variant="outline"
                size="lg"
                fullWidth
                onClick={() => navigate('/rooms')}
              >
                Ver Salas Ativas
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className={styles.info}>
          <h3>Como Jogar</h3>
          <ul>
            <li>1. Crie uma sala ou entre em uma existente</li>
            <li>2. Espere outro jogador entrar</li>
            <li>3. Jogue xadrez com cartas especiais!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
