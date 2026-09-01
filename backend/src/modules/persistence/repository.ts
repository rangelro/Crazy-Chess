import { Pool } from 'pg';
import type { Sala } from '../game/types.js';
export interface RoomRepository { loadAll(): Promise<Sala[]>; save(room: Sala): Promise<void>; close(): Promise<void>; }
export class PostgresRoomRepository implements RoomRepository {
  constructor(private readonly pool: Pool) {}
  async migrate() { await this.pool.query('CREATE TABLE IF NOT EXISTS rooms (code TEXT PRIMARY KEY, state TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())'); }
  async loadAll() { const { rows }=await this.pool.query<{state:string}>('SELECT state FROM rooms ORDER BY updated_at ASC'); return rows.map(x=>JSON.parse(x.state) as Sala); }
  async save(room:Sala) { await this.pool.query('INSERT INTO rooms(code,state) VALUES($1,$2) ON CONFLICT(code) DO UPDATE SET state=EXCLUDED.state, updated_at=NOW()', [room.codigo,JSON.stringify(room)]); }
  async close(){await this.pool.end();}
}
export class MemoryRoomRepository implements RoomRepository { private rooms=new Map<string,Sala>(); async loadAll(){return [...this.rooms.values()].map(x=>structuredClone(x));} async save(room:Sala){this.rooms.set(room.codigo,structuredClone(room));} async close(){} }
