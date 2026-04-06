import styles from './Reconnect.module.css';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card, { CardBody } from '../components/Card';
import { storageService } from '../services/storage';
import { socketService } from '../services/socket';

export default function Reconnect() {
  const navigate = useNavigate();

  useEffect(() => {
    const sessao = storageService.carregarSessao();
    if (!sessao) {
      navigate('/');
      return;
    }

    const tentarReconectar = async () => {
      try {
        await socketService.connect();
        const response = await socketService.request('ENTRAR_SALA', {
          codigoSala: sessao.codigoSala,
          tokenJogador: sessao.tokenJogador,
        }, (message) => {
          return message.action === 'SALA_ATRIBUIDA' || message.action === 'ERRO_SALA';
        });

        if (response.action === 'SALA_ATRIBUIDA') {
          const { codigo, papel, tokenJogador } = response.sala;
          navigate('/game', { state: { codigoSala: codigo, papel, tokenJogador } });
        }
      } catch (error) {
        console.error('Falha na reconexão:', error);
      }
    };

    tentarReconectar();
  }, [navigate]);

  const handleVoltar = () => {
    storageService.limparSessao();
    navigate('/');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardBody className={styles.body}>
          <div className={styles.icon}>⚠️</div>
          <h1>Reconectando...</h1>
          <p>Tentando restabelecer conexão com a partida</p>
          <div className={styles.loader} />
          <Button variant="outline" onClick={handleVoltar}>
            Voltar ao Menu
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
