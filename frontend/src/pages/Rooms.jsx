import styles from './Rooms.module.css';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Button from '../components/Button';
import Card, { CardBody, CardHeader } from '../components/Card';
import Badge from '../components/Badge';
import { socketService } from '../services/socket';
import { storageService } from '../services/storage';

export default function Rooms() {
  const navigate = useNavigate();
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const iniciar = async () => {
      await socketService.connect();
      socketService.send('LISTAR_SALAS');
    };

    iniciar().catch(() => {
      setLoading(false);
    });

    const unsubscribe = socketService.onMessage((message) => {
      if (message.action === 'SALAS_ATIVAS') {
        setSalas(message.salas || []);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleEntrarSala = async (codigoSala) => {
    try {
      const response = await socketService.request(
        'ENTRAR_SALA',
        { codigoSala },
        (message) => message.action === 'SALA_ATRIBUIDA' || message.action === 'ERRO_SALA'
      );

      if (response.action === 'ERRO_SALA') {
        return;
      }

      const { papel, tokenJogador } = response.sala;
      storageService.salvarSessao(codigoSala, papel, tokenJogador);
      navigate('/game', { state: { codigoSala, papel, tokenJogador } });
    } catch (error) {
      // Mantém a tela funcional mesmo com falha de rede.
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="outline" onClick={() => navigate('/')}>
          ← Voltar
        </Button>
        <h1>Salas Ativas</h1>
      </div>

      {loading ? (
        <div className={styles.loading}>Carregando...</div>
      ) : salas.length === 0 ? (
        <Card>
          <CardBody className={styles.empty}>
            <p>Nenhuma sala ativa</p>
            <Button variant="primary" onClick={() => navigate('/')}>
              Criar Nova Sala
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className={styles.salas}>
          {salas.map((sala) => (
            <Card key={sala.codigo} hoverable className={styles.sala}>
              <CardHeader>
                <div className={styles.salaHeader}>
                  <div>
                    <strong>Sala: {sala.codigo}</strong>
                    <div className={styles.players}>
                      <Badge variant={sala.brancoConectado ? 'success' : 'info'}>
                        {sala.brancoConectado ? '● Branco' : '○ Branco livre'}
                      </Badge>
                      <Badge variant={sala.pretoConectado ? 'success' : 'info'}>
                        {sala.pretoConectado ? '● Preto' : '○ Preto livre'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => handleEntrarSala(sala.codigo)}
                  disabled={sala.brancoConectado && sala.pretoConectado}
                >
                  {sala.brancoConectado && sala.pretoConectado ? 'Sala Cheia' : 'Entrar'}
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
