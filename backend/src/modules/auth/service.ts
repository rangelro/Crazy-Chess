import bcrypt from 'bcrypt'; import { randomUUID } from 'node:crypto';
export interface User {id:string;nome:string;email:string;senhaHash:string;} export type PublicUser=Omit<User,'senhaHash'>;
export class AuthService {private users=new Map<string,User>();private sessions=new Map<string,{userId:string;revoked:boolean}>();
  private public(u:User):PublicUser{const {senhaHash,...p}=u;return p;} private valid(nome:string,email:string,senha:string){if(!nome.trim()||!/^\S+@\S+\.\S+$/.test(email)||senha.length<8)throw new Error('Dados inválidos');}
  async register(nome:string,email:string,senha:string){email=email.trim().toLowerCase();this.valid(nome,email,senha);if([...this.users.values()].some(u=>u.email===email))throw new Error('E-mail já cadastrado');const u={id:randomUUID(),nome:nome.trim(),email,senhaHash:await bcrypt.hash(senha,12)};this.users.set(u.id,u);return this.public(u);}
  async login(email:string,senha:string){const u=[...this.users.values()].find(x=>x.email===email.trim().toLowerCase());if(!u||!await bcrypt.compare(senha,u.senhaHash))throw new Error('Credenciais inválidas');return this.public(u);}
  get(id:string){const u=this.users.get(id);return u&&this.public(u);} createSession(userId:string){const id=randomUUID();this.sessions.set(id,{userId,revoked:false});return id;} consumeSession(id:string){const s=this.sessions.get(id);if(!s||s.revoked)throw new Error('Sessão inválida');s.revoked=true;return s.userId;} revoke(id:string){const s=this.sessions.get(id);if(s)s.revoked=true;}
}
