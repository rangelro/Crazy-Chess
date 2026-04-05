const express = require('express');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'crazy-chess.sqlite');

fs.mkdirSync(DB_DIR, { recursive: true });

const db = new sqlite3.Database(DB_PATH);

function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (error) {
            if (error) {
                reject(error);
                return;
            }

            resolve(this);
        });
    });
}

function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (error, rows) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(rows);
        });
    });
}

const VALORES_PECAS = {
    'peao': 1,
    'cavalo': 3,
    'bispo': 3,
    'torre': 5,
    'rainha': 9,
    'rei': 0
};

const LIMITE_MAO = 3;

const DEFINICOES_CARTAS = {
    marcha_lateral: {
        id: 'marcha_lateral',
        nome: 'Marcha Lateral',
        descricao: 'Concede a um peão a habilidade de mover 1 casa na horizontal até ele usar o movimento.'
    },
    salto_cavaleiro: {
        id: 'salto_cavaleiro',
        nome: 'Salto do Cavalo',
        descricao: 'Concede a qualquer peça um salto em L como o cavalo.'
    },
    reviver_aliado: {
        id: 'reviver_aliado',
        nome: 'Reviver Aliado',
        descricao: 'Permite que um bispo reviva uma peça capturada em uma casa vazia adjacente.'
    }
};

const BARALHO_BASE = [
    'marcha_lateral',
    'marcha_lateral',
    'marcha_lateral',
    'salto_cavaleiro',
    'salto_cavaleiro',
    'reviver_aliado',
    'reviver_aliado'
];

function embaralhar(lista) {
    const resultado = [...lista];

    for (let i = resultado.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [resultado[i], resultado[j]] = [resultado[j], resultado[i]];
    }

    return resultado;
}

function criarBaralho() {
    return embaralhar(BARALHO_BASE);
}

function gerarTokenJogador() {
    return crypto.randomBytes(12).toString('hex');
}

function criarPeca(tipo, cor) {
    return { tipo, cor, modificadores: [] };
}

function copiarPeca(peca) {
    return {
        ...peca,
        modificadores: [...(peca.modificadores || [])]
    };
}

const salas = new Map();
const sockets = new Map();

async function inicializarPersistencia() {
    await dbRun(`
        CREATE TABLE IF NOT EXISTS rooms (
            code TEXT PRIMARY KEY,
            state TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )
    `);

    const registros = await dbAll('SELECT code, state FROM rooms ORDER BY updated_at ASC');

    registros.forEach(registro => {
        try {
            const estadoPersistido = JSON.parse(registro.state);
            const sala = criarSala(estadoPersistido.codigo || registro.code, estadoPersistido);
            salas.set(sala.codigo, sala);
        } catch (erro) {
            console.error(`Falha ao carregar sala persistida ${registro.code}:`, erro);
        }
    });
}

// 1. Inicialização do Tabuleiro
function iniciarTabuleiro() {
    const tabuleiro = Array(8).fill(null).map(() => Array(8).fill(null));
    const pecasTraseiras = ['torre', 'cavalo', 'bispo', 'rainha', 'rei', 'bispo', 'cavalo', 'torre'];

    for (let i = 0; i < 8; i++) {
        // Pretas (Linhas 0 e 1)
        tabuleiro[0][i] = criarPeca(pecasTraseiras[i], 'preto');
        tabuleiro[1][i] = criarPeca('peao', 'preto');
        
        // Brancas (Linhas 6 e 7)
        tabuleiro[7][i] = criarPeca(pecasTraseiras[i], 'branco');
        tabuleiro[6][i] = criarPeca('peao', 'branco');
    }
    
    return tabuleiro;
}

function criarJogador(dados = {}) {
    return {
        token: dados.token || gerarTokenJogador(),
        baralho: Array.isArray(dados.baralho) ? [...dados.baralho] : criarBaralho(),
        mao: Array.isArray(dados.mao) ? dados.mao.map(copiarCarta) : [],
        cemiterio: Array.isArray(dados.cemiterio) ? dados.cemiterio.map(copiarPeca) : [],
        cartaUsadaNesteTurno: Boolean(dados.cartaUsadaNesteTurno),
        conectado: false
    };
}

function serializarJogador(jogador) {
    return {
        token: jogador.token,
        baralho: [...jogador.baralho],
        mao: jogador.mao.map(copiarCarta),
        cemiterio: jogador.cemiterio.map(copiarPeca),
        cartaUsadaNesteTurno: jogador.cartaUsadaNesteTurno
    };
}

function serializarSala(sala) {
    return {
        codigo: sala.codigo,
        tabuleiro: sala.tabuleiro,
        jogadores: {
            branco: serializarJogador(sala.jogadores.branco),
            preto: serializarJogador(sala.jogadores.preto)
        },
        turno: sala.turno,
        placar: sala.placar
    };
}

function criarSala(codigo, estadoPersistido = {}) {
    const sala = {
        codigo: normalizarCodigoSala(codigo),
        tabuleiro: Array.isArray(estadoPersistido.tabuleiro) ? estadoPersistido.tabuleiro : iniciarTabuleiro(),
        jogadores: {
            branco: criarJogador(estadoPersistido.jogadores?.branco),
            preto: criarJogador(estadoPersistido.jogadores?.preto)
        },
        turno: estadoPersistido.turno || 'branco',
        placar: {
            branco: estadoPersistido.placar?.branco || 0,
            preto: estadoPersistido.placar?.preto || 0
        },
        conexoes: {
            branco: null,
            preto: null,
            espectadores: new Set()
        }
    };

    ['branco', 'preto'].forEach(cor => {
        for (let i = 0; i < LIMITE_MAO; i++) {
            comprarCarta(sala, cor);
        }
    });

    return sala;
}

function normalizarCodigoSala(codigo) {
    return String(codigo || '').trim().toUpperCase();
}

function normalizarToken(token) {
    return String(token || '').trim();
}

function gerarCodigoSala() {
    let codigo = '';

    do {
        codigo = crypto.randomBytes(3).toString('hex').toUpperCase();
    } while (salas.has(codigo));

    return codigo;
}

function obterSala(codigo) {
    return salas.get(normalizarCodigoSala(codigo));
}

function encontrarPapelPorToken(sala, token) {
    if (!token) {
        return null;
    }

    if (sala.jogadores.branco.token === token) {
        return 'branco';
    }

    if (sala.jogadores.preto.token === token) {
        return 'preto';
    }

    return null;
}

function copiarCarta(carta) {
    return {
        ...carta,
        modificadores: [...(carta.modificadores || [])]
    };
}

function comprarCarta(sala, cor) {
    const jogador = sala.jogadores[cor];

    if (jogador.mao.length >= LIMITE_MAO) {
        return null;
    }

    if (jogador.baralho.length === 0) {
        jogador.baralho = criarBaralho();
    }

    const cartaId = jogador.baralho.pop();
    const definicao = DEFINICOES_CARTAS[cartaId];

    if (!definicao) {
        return null;
    }

    const carta = { ...definicao };
    jogador.mao.push(carta);
    return carta;
}

function iniciarTurno(sala, cor) {
    const jogador = sala.jogadores[cor];
    jogador.cartaUsadaNesteTurno = false;
    comprarCarta(sala, cor);
}

function montarEstadoParaCliente(sala, papel) {
    const jogadorVisualizado = papel === 'branco' || papel === 'preto' ? sala.jogadores[papel] : null;

    return {
        codigoSala: sala.codigo,
        papel,
        tabuleiro: sala.tabuleiro,
        turno: sala.turno,
        placar: sala.placar,
        maoAtual: jogadorVisualizado ? jogadorVisualizado.mao.map(copiarCarta) : [],
        maoAtualTamanho: jogadorVisualizado ? jogadorVisualizado.mao.length : 0,
        maoAdversarioTamanho: jogadorVisualizado ? sala.jogadores[papel === 'branco' ? 'preto' : 'branco'].mao.length : 0,
        jogadores: {
            branco: {
                conectado: Boolean(sala.conexoes.branco),
                maoTamanho: sala.jogadores.branco.mao.length,
                cemiterioTamanho: sala.jogadores.branco.cemiterio.length
            },
            preto: {
                conectado: Boolean(sala.conexoes.preto),
                maoTamanho: sala.jogadores.preto.mao.length,
                cemiterioTamanho: sala.jogadores.preto.cemiterio.length
            }
        },
        espectadoresConectados: sala.conexoes.espectadores.size
    };
}

function enviarEstado(ws, sala, papel) {
    if (ws.readyState !== WebSocket.OPEN) {
        return;
    }

    ws.send(JSON.stringify({
        acao: 'ESTADO_ATUALIZADO',
        estado: montarEstadoParaCliente(sala, papel)
    }));
}

async function persistirSala(sala) {
    const estado = JSON.stringify(serializarSala(sala));

    await dbRun(
        `
            INSERT INTO rooms (code, state, created_at, updated_at)
            VALUES (?, ?, strftime('%s', 'now'), strftime('%s', 'now'))
            ON CONFLICT(code) DO UPDATE SET
                state = excluded.state,
                updated_at = excluded.updated_at
        `,
        [sala.codigo, estado]
    );
}

function publicarEstadoSala(sala) {
    if (sala.conexoes.branco) {
        enviarEstado(sala.conexoes.branco, sala, 'branco');
    }

    if (sala.conexoes.preto) {
        enviarEstado(sala.conexoes.preto, sala, 'preto');
    }

    sala.conexoes.espectadores.forEach(ws => {
        enviarEstado(ws, sala, 'espectador');
    });

    persistirSala(sala).catch(error => {
        console.error(`Falha ao persistir sala ${sala.codigo}:`, error);
    });
}

function registrarCaptura(sala, pecaCapturada, corAtacante) {
    sala.placar[corAtacante] += VALORES_PECAS[pecaCapturada.tipo];
    sala.jogadores[pecaCapturada.cor].cemiterio.push(copiarPeca(pecaCapturada));
}

function caminhoLivre(origem, destino, tabuleiro) {
    const passoLinha = Math.sign(destino.linha - origem.linha);
    const passoColuna = Math.sign(destino.coluna - origem.coluna);

    let linhaAtual = origem.linha + passoLinha;
    let colunaAtual = origem.coluna + passoColuna;

    while (linhaAtual !== destino.linha || colunaAtual !== destino.coluna) {
        if (tabuleiro[linhaAtual][colunaAtual] !== null) {
            return false;
        }

        linhaAtual += passoLinha;
        colunaAtual += passoColuna;
    }

    return true;
}

function validarMovimentoPeao(origem, destino, tabuleiro) {
    const peca = tabuleiro[origem.linha][origem.coluna];
    const alvo = tabuleiro[destino.linha][destino.coluna];

    const direcao = peca.cor === 'branco' ? -1 : 1;
    const linhaInicial = peca.cor === 'branco' ? 6 : 1;
    const difLinha = destino.linha - origem.linha;
    const difColuna = Math.abs(destino.coluna - origem.coluna);

    if (peca.modificadores.includes('marcha_lateral') && difLinha === 0 && difColuna === 1 && alvo === null) {
        return true;
    }

    if (difColuna === 0 && difLinha === direcao && alvo === null) {
        return true;
    }

    if (difColuna === 0 && origem.linha === linhaInicial && difLinha === 2 * direcao && alvo === null) {
        if (tabuleiro[origem.linha + direcao][origem.coluna] === null) {
            return true;
        }
    }

    if (difColuna === 1 && difLinha === direcao && alvo !== null && alvo.cor !== peca.cor) {
        return true;
    }

    return false;
}

function validarMovimentoGeral(origem, destino, tabuleiro) {
    const peca = tabuleiro[origem.linha][origem.coluna];
    const alvo = tabuleiro[destino.linha][destino.coluna];

    if (!peca) {
        return false;
    }

    if (origem.linha === destino.linha && origem.coluna === destino.coluna) {
        return false;
    }

    if (alvo !== null && alvo.cor === peca.cor) {
        return false;
    }

    const dx = Math.abs(destino.coluna - origem.coluna);
    const dy = Math.abs(destino.linha - origem.linha);

    if (peca.modificadores.includes('salto_cavaleiro') && ((dx === 2 && dy === 1) || (dx === 1 && dy === 2))) {
        return true;
    }

    switch (peca.tipo) {
        case 'peao':
            return validarMovimentoPeao(origem, destino, tabuleiro);
        case 'torre':
            if (dx !== 0 && dy !== 0) return false;
            return caminhoLivre(origem, destino, tabuleiro);
        case 'bispo':
            if (dx !== dy) return false;
            return caminhoLivre(origem, destino, tabuleiro);
        case 'rainha':
            if (dx !== 0 && dy !== 0 && dx !== dy) return false;
            return caminhoLivre(origem, destino, tabuleiro);
        case 'cavalo':
            return (dx === 2 && dy === 1) || (dx === 1 && dy === 2);
        case 'rei':
            return dx <= 1 && dy <= 1;
        default:
            return false;
    }
}

function removerSocketDaSala(ws) {
    const contexto = sockets.get(ws);

    if (!contexto) {
        return;
    }

    const sala = salas.get(contexto.codigoSala);

    if (sala) {
        if (contexto.papel === 'espectador') {
            sala.conexoes.espectadores.delete(ws);
        } else if (sala.conexoes[contexto.papel] === ws) {
            sala.conexoes[contexto.papel] = null;
            sala.jogadores[contexto.papel].conectado = false;
        }

        publicarEstadoSala(sala);
    }

    sockets.delete(ws);
}

function vincularSocketASala(ws, sala, papel, tokenJogador = null) {
    const contextoAnterior = sockets.get(ws);

    if (contextoAnterior) {
        removerSocketDaSala(ws);
    }

    if (papel === 'espectador') {
        sala.conexoes.espectadores.add(ws);
    } else {
        const socketAnterior = sala.conexoes[papel];

        if (socketAnterior && socketAnterior !== ws) {
            const contextoSocketAnterior = sockets.get(socketAnterior);
            if (contextoSocketAnterior) {
                sockets.delete(socketAnterior);
            }

            try {
                socketAnterior.close(4001, 'Reconectado por outro cliente');
            } catch (erro) {
                // Ignora falhas de fechamento.
            }
        }

        sala.conexoes[papel] = ws;
        sala.jogadores[papel].conectado = true;

        if (tokenJogador) {
            sala.jogadores[papel].token = tokenJogador;
        }
    }

    sockets.set(ws, { codigoSala: sala.codigo, papel });
    enviarEstado(ws, sala, papel);
    publicarEstadoSala(sala);
}

function anunciarVinculo(ws, sala, papel) {
    if (ws.readyState !== WebSocket.OPEN) {
        return;
    }

    ws.send(JSON.stringify({
        acao: 'SALA_ATRIBUIDA',
        sala: {
            codigo: sala.codigo,
            papel,
            tokenJogador: papel === 'espectador' ? null : sala.jogadores[papel].token
        }
    }));
}

function publicarEstado() {
    salas.forEach(sala => publicarEstadoSala(sala));
}

function registrarJogada(sala, origem, destino) {
    const peca = sala.tabuleiro[origem.linha][origem.coluna];
    const alvo = sala.tabuleiro[destino.linha][destino.coluna];

    if (alvo) {
        registrarCaptura(sala, alvo, peca.cor);
    }

    sala.tabuleiro[destino.linha][destino.coluna] = peca;
    sala.tabuleiro[origem.linha][origem.coluna] = null;

    if (peca.modificadores.length > 0) {
        peca.modificadores = peca.modificadores.filter(modificador => modificador !== 'marcha_lateral' && modificador !== 'salto_cavaleiro');
    }

    sala.turno = sala.turno === 'branco' ? 'preto' : 'branco';
    iniciarTurno(sala, sala.turno);
    publicarEstadoSala(sala);
}

function ehUsuarioDoTurno(sala, papel) {
    return papel === sala.turno;
}

function movimentosDaCarta(sala, cartaId, origem) {
    const peca = sala.tabuleiro[origem.linha]?.[origem.coluna];

    if (!peca || peca.cor !== sala.turno) {
        return [];
    }

    if (cartaId === 'reviver_aliado') {
        if (peca.tipo !== 'bispo' || sala.jogadores[peca.cor].cemiterio.length === 0) {
            return [];
        }

        const movimentos = [];

        for (let linha = origem.linha - 1; linha <= origem.linha + 1; linha++) {
            for (let coluna = origem.coluna - 1; coluna <= origem.coluna + 1; coluna++) {
                if (linha < 0 || linha > 7 || coluna < 0 || coluna > 7) {
                    continue;
                }

                const destino = { linha, coluna };
                if (ehCasaAdjacente(origem, destino) && sala.tabuleiro[linha][coluna] === null) {
                    movimentos.push(destino);
                }
            }
        }

        return movimentos;
    }

    return [];
}

function aplicarCarta(sala, papel, dados) {
    const jogador = sala.jogadores[papel];

    if (papel !== sala.turno || jogador.cartaUsadaNesteTurno) {
        return false;
    }

    const indiceCarta = jogador.mao.findIndex(carta => carta.id === dados.cartaId);
    if (indiceCarta === -1) {
        return false;
    }

    const carta = jogador.mao[indiceCarta];
    const peca = sala.tabuleiro[dados.origem?.linha]?.[dados.origem?.coluna];

    if (!peca || peca.cor !== papel) {
        return false;
    }

    if (carta.id === 'marcha_lateral') {
        if (peca.tipo !== 'peao') {
            return false;
        }

        if (!peca.modificadores.includes('marcha_lateral')) {
            peca.modificadores.push('marcha_lateral');
        }
    } else if (carta.id === 'salto_cavaleiro') {
        if (!peca.modificadores.includes('salto_cavaleiro')) {
            peca.modificadores.push('salto_cavaleiro');
        }
    } else if (carta.id === 'reviver_aliado') {
        if (peca.tipo !== 'bispo' || !dados.destino) {
            return false;
        }

        if (!ehCasaAdjacente(dados.origem, dados.destino)) {
            return false;
        }

        if (sala.tabuleiro[dados.destino.linha][dados.destino.coluna] !== null) {
            return false;
        }

        const cemiterio = jogador.cemiterio;
        if (cemiterio.length === 0) {
            return false;
        }

        const pecaRevivida = cemiterio.pop();
        sala.tabuleiro[dados.destino.linha][dados.destino.coluna] = {
            tipo: pecaRevivida.tipo,
            cor: pecaRevivida.cor,
            modificadores: []
        };
    } else {
        return false;
    }

    jogador.mao.splice(indiceCarta, 1);
    jogador.cartaUsadaNesteTurno = true;
    publicarEstadoSala(sala);
    return true;
}

function criarOuEntrarEmSala(codigoSolicitado) {
    const codigo = normalizarCodigoSala(codigoSolicitado);

    if (!codigo) {
        const novoCodigo = gerarCodigoSala();
        const sala = criarSala(novoCodigo);
        salas.set(novoCodigo, sala);
        return sala;
    }

    let sala = salas.get(codigo);
    if (!sala) {
        sala = criarSala(codigo);
        salas.set(codigo, sala);
    }

    return sala;
}

function atribuirEntrada(ws, dados) {
    const codigo = normalizarCodigoSala(dados.codigoSala);
    const salaExiste = salas.get(codigo);

    if (!salaExiste) {
        return null;
    }

    let papel = 'espectador';

    if (!salaExiste.conexoes.branco) {
        papel = 'branco';
    } else if (!salaExiste.conexoes.preto) {
        papel = 'preto';
    }

    vincularSocketASala(ws, salaExiste, papel);
    anunciarVinculo(ws, salaExiste, papel);
    return papel;
}

// 7. Conexão e Recebimento de Ações
wss.on('connection', (ws) => {
    console.log('Novo jogador conectado!');

    ws.send(JSON.stringify({
        acao: 'CONEXAO_ESTABELECIDA'
    }));

    ws.on('message', (message) => {
        let dados;

        try {
            dados = JSON.parse(message);
        } catch (erro) {
            return;
        }

        const contexto = sockets.get(ws);

        if (dados.acao === 'CRIAR_SALA') {
            const codigoSolicitado = normalizarCodigoSala(dados.codigoSala);
            const codigoSala = codigoSolicitado || gerarCodigoSala();

            if (salas.has(codigoSala)) {
                ws.send(JSON.stringify({ acao: 'ERRO_SALA', mensagem: 'Já existe uma sala com esse código.' }));
                return;
            }

            const sala = criarSala(codigoSala);
            salas.set(codigoSala, sala);
            vincularSocketASala(ws, sala, 'branco', sala.jogadores.branco.token);
            anunciarVinculo(ws, sala, 'branco');
            return;
        }

        if (dados.acao === 'ENTRAR_SALA') {
            const sala = obterSala(dados.codigoSala);

            if (!sala) {
                ws.send(JSON.stringify({ acao: 'ERRO_SALA', mensagem: 'Sala não encontrada.' }));
                return;
            }

            const tokenJogador = normalizarToken(dados.tokenJogador);

            let papel = null;

            if (!dados.forcarEspectador) {
                papel = encontrarPapelPorToken(sala, tokenJogador);

                if (!papel) {
                    if (!sala.conexoes.branco) {
                        papel = 'branco';
                    } else if (!sala.conexoes.preto) {
                        papel = 'preto';
                    }
                }
            }

            if (!papel) {
                papel = 'espectador';
            }

            const tokenFinal = papel === 'espectador'
                ? null
                : (tokenJogador || sala.jogadores[papel].token || gerarTokenJogador());

            sala.jogadores[papel].token = tokenFinal || sala.jogadores[papel].token;
            vincularSocketASala(ws, sala, papel, tokenFinal);
            anunciarVinculo(ws, sala, papel);
            return;
        }

        if (!contexto) {
            return;
        }

        const sala = salas.get(contexto.codigoSala);

        if (!sala) {
            return;
        }

        if (dados.acao === 'PEDIR_MOVIMENTOS_VALIDOS') {
            if (contexto.papel === 'espectador' || !ehUsuarioDoTurno(sala, contexto.papel)) {
                return;
            }

            const { origem } = dados;
            const peca = sala.tabuleiro[origem.linha][origem.coluna];

            if (!peca || peca.cor !== sala.turno) {
                return;
            }

            let movimentosPermitidos = [];

            if (dados.cartaId === 'reviver_aliado') {
                movimentosPermitidos = movimentosDaCarta(sala, dados.cartaId, origem);
            } else {
                for (let linha = 0; linha < 8; linha++) {
                    for (let coluna = 0; coluna < 8; coluna++) {
                        const destino = { linha, coluna };
                        if (validarMovimentoGeral(origem, destino, sala.tabuleiro)) {
                            movimentosPermitidos.push(destino);
                        }
                    }
                }
            }

            ws.send(JSON.stringify({ acao: 'MOVIMENTOS_PERMITIDOS', movimentos: movimentosPermitidos }));
            return;
        }

        if (dados.acao === 'USAR_CARTA') {
            if (aplicarCarta(sala, contexto.papel, dados)) {
                publicarEstadoSala(sala);
            }

            return;
        }

        if (dados.acao === 'TENTATIVA_MOVIMENTO') {
            if (contexto.papel === 'espectador' || !ehUsuarioDoTurno(sala, contexto.papel)) {
                return;
            }

            const { origem, destino } = dados;
            const peca = sala.tabuleiro[origem.linha][origem.coluna];

            if (!peca || peca.cor !== sala.turno) {
                return;
            }

            if (validarMovimentoGeral(origem, destino, sala.tabuleiro)) {
                registrarJogada(sala, origem, destino);
            }
        }
    });

    ws.on('close', () => {
        removerSocketDaSala(ws);
    });
});

    async function iniciarServidor() {
        await inicializarPersistencia();

        const porta = Number(process.env.PORT || 3000);

        server.listen(porta, () => {
            console.log(`Servidor de Xadrez rodando na porta ${porta}`);
        });
    }

    iniciarServidor().catch(error => {
        console.error('Falha ao iniciar o servidor:', error);
        process.exit(1);
    });