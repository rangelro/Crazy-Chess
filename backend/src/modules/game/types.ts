export type Cor = 'branco' | 'preto';
export type Papel = Cor | 'espectador';
export type TipoPeca = 'peao' | 'cavalo' | 'bispo' | 'torre' | 'rainha' | 'rei';
export type Modificador = 'marcha_lateral' | 'salto_cavaleiro';
export interface Peca { tipo: TipoPeca; cor: Cor; modificadores: Modificador[]; }
export interface Casa { linha: number; coluna: number; }
export type Tabuleiro = (Peca | null)[][];
export interface Carta { id: CartaId; nome: string; descricao: string; }
export type CartaId = 'marcha_lateral' | 'salto_cavaleiro' | 'reviver_aliado';
export interface Jogador { token: string; baralho: CartaId[]; mao: Carta[]; cemiterio: Peca[]; cartaUsadaNesteTurno: boolean; conectado: boolean; }
export interface DireitosRoque { curto: boolean; longo: boolean; }
export type EstadoPartida = 'em_andamento' | 'xeque' | 'xeque_mate' | 'afogamento' | 'empate_repeticao' | 'empate_50_lances' | 'empate_75_lances' | 'empate_material_insuficiente';
export interface ResultadoPartida { estado: EstadoPartida; vencedor: Cor | null; }
export interface Sala { codigo: string; tabuleiro: Tabuleiro; jogadores: Record<Cor, Jogador>; turno: Cor; placar: Record<Cor, number>; direitosRoque: Record<Cor, DireitosRoque>; enPassant: Casa | null; meioLances: number; historicoPosicoes: Record<string, number>; resultado: ResultadoPartida; }
