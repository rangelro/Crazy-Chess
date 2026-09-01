import type { IncomingMessage } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import type { Sala, Papel } from '../game/types.js';
import { RoomService } from '../rooms/rooms.js';
import type { StatePublisher } from '../rooms/rooms.js';

type Contexto={codigoSala:string;papel:Papel};
const aberto=(ws:WebSocket)=>ws.readyState===WebSocket.OPEN;
export class RealtimeGateway implements StatePublisher {
  private sockets=new Map<WebSocket,Contexto>(); private service?:RoomService;
  constructor(private readonly wss:WebSocketServer) { wss.on('connection',(ws,req)=>this.connection(ws,req)); }
  attach(service:RoomService){this.service=service;}
  publish(room:Sala){for(const [ws,c] of this.sockets)if(c.codigoSala===room.codigo)this.send(ws,{acao:'ESTADO_ATUALIZADO',estado:this.clientState(room,c.papel)});}
  publishRooms(){for(const ws of this.wss.clients)this.send(ws,{acao:'SALAS_ATIVAS',salas:this.activeRooms()});}
  private connection(ws:WebSocket,_req:IncomingMessage){this.send(ws,{acao:'CONEXAO_ESTABELECIDA'});this.send(ws,{acao:'SALAS_ATIVAS',salas:this.activeRooms()});ws.on('message',raw=>this.message(ws,raw.toString()));ws.on('close',()=>this.leave(ws));}
  private message(ws:WebSocket,raw:string){let d:any;try{d=JSON.parse(raw);}catch{return;}const s=this.service;if(!s)return;const ctx=this.sockets.get(ws);
    if(d.acao==='CRIAR_SALA'){try{const room=s.create(d.codigoSala);this.bind(ws,room,'branco',room.jogadores.branco.token);}catch(e){this.send(ws,{acao:'ERRO_SALA',mensagem:(e as Error).message});}return;}
    if(d.acao==='LISTAR_SALAS'){this.send(ws,{acao:'SALAS_ATIVAS',salas:this.activeRooms()});return;}
    if(d.acao==='SAIR_SALA'){this.leave(ws);this.send(ws,{acao:'SALA_SAIDA'});this.publishRooms();return;}
    if(d.acao==='ENTRAR_SALA'){const room=s.get(d.codigoSala);if(!room){this.send(ws,{acao:'ERRO_SALA',mensagem:'Sala não encontrada.'});return;}const role=s.role(room,d.tokenJogador,Boolean(d.forcarEspectador));this.bind(ws,room,role,role==='espectador'?undefined:d.tokenJogador);return;}
    if(!ctx)return;const room=s.get(ctx.codigoSala);if(!room)return;
    if(d.acao==='PEDIR_MOVIMENTOS_VALIDOS'){const r=s.moves(room,ctx.papel,d.origem,d.cartaId);if(r.movimentos.length||ctx.papel===room.turno)this.send(ws,{acao:'MOVIMENTOS_PERMITIDOS',...r});return;}
    if(d.acao==='TENTATIVA_MOVIMENTO'){if(ctx.papel!=='espectador'&&s.requiresPromotion(room,d.origem,d.destino)&&!d.promocao){this.send(ws,{acao:'PROMOCAO_PENDENTE',origem:d.origem,destino:d.destino,opcoes:['rainha','torre','bispo','cavalo']});return;}s.move(room,ctx.papel,d.origem,d.destino,d.promocao);}
    if(d.acao==='USAR_CARTA')s.card(room,ctx.papel,d);
  }
  private bind(ws:WebSocket,room:Sala,role:Papel,supplied?:string){this.leave(ws);if(role!=='espectador'){for(const [old,c] of this.sockets)if(old!==ws&&c.codigoSala===room.codigo&&c.papel===role){this.sockets.delete(old);old.close(4001,'Reconectado por outro cliente');}this.service!.connect(room,role,supplied);}this.sockets.set(ws,{codigoSala:room.codigo,papel:role});this.send(ws,{acao:'SALA_ATRIBUIDA',sala:{codigo:room.codigo,papel:role,tokenJogador:role==='espectador'?null:room.jogadores[role].token}});this.publish(room);this.publishRooms();}
  private leave(ws:WebSocket){const c=this.sockets.get(ws);if(!c)return;this.sockets.delete(ws);const room=this.service?.get(c.codigoSala);if(room&&c.papel!=='espectador')this.service!.disconnect(room,c.papel);}
  private activeRooms(){return this.service?.list().filter(room=>[...this.sockets.values()].some(c=>c.codigoSala===room.codigo)).map(room=>({codigo:room.codigo,turno:room.turno,brancoConectado:room.jogadores.branco.conectado,pretoConectado:room.jogadores.preto.conectado,espectadores:[...this.sockets.values()].filter(c=>c.codigoSala===room.codigo&&c.papel==='espectador').length})).sort((a,b)=>a.codigo.localeCompare(b.codigo))??[];}
  private clientState(s:Sala,p:Papel){const j=p==='espectador'?undefined:s.jogadores[p];return {codigoSala:s.codigo,papel:p,tabuleiro:s.tabuleiro,turno:s.turno,placar:s.placar,resultado:s.resultado,reiEmXeque:s.resultado.estado==='xeque',maoAtual:j?.mao.map(x=>({...x} ) )??[],maoAtualTamanho:j?.mao.length??0,maoAdversarioTamanho:j?s.jogadores[p==='branco'?'preto':'branco'].mao.length:0,jogadores:{branco:{conectado:s.jogadores.branco.conectado,maoTamanho:s.jogadores.branco.mao.length,cemiterioTamanho:s.jogadores.branco.cemiterio.length},preto:{conectado:s.jogadores.preto.conectado,maoTamanho:s.jogadores.preto.mao.length,cemiterioTamanho:s.jogadores.preto.cemiterio.length}},espectadoresConectados:[...this.sockets.values()].filter(c=>c.codigoSala===s.codigo&&c.papel==='espectador').length};}
  private send(ws:WebSocket,message:unknown){if(aberto(ws))ws.send(JSON.stringify(message));}
}
