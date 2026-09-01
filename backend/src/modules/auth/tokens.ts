import jwt, { type JwtPayload } from 'jsonwebtoken';
export interface AccessClaims { userId:string; email:string; sessionId?:string; }
export class TokenService {
  constructor(private accessSecret:string,private refreshSecret:string,private accessTtl:string,private refreshTtl:string){}
  signAccess(c:AccessClaims|{id:string;email:string}){const claims='id' in c?{userId:c.id,email:c.email}:c;return jwt.sign(claims,this.accessSecret,{expiresIn:this.accessTtl as jwt.SignOptions['expiresIn']});}
  signRefresh(c:AccessClaims|{id:string;email:string;sessionId:string}){const claims='id' in c?{userId:c.id,email:c.email,sessionId:c.sessionId}:c;return jwt.sign(claims,this.refreshSecret,{expiresIn:this.refreshTtl as jwt.SignOptions['expiresIn']});}
  private verify(token:string,secret:string):AccessClaims {try {const c=jwt.verify(token,secret) as JwtPayload; if(typeof c.userId!=='string'||typeof c.email!=='string')throw new Error(); return typeof c.sessionId==='string'?{userId:c.userId,email:c.email,sessionId:c.sessionId}:{userId:c.userId,email:c.email};}catch(e){if(e instanceof jwt.TokenExpiredError)throw new Error('Token expirado');throw new Error('Token inválido');}}
  verifyAccess(t:string){return this.verify(t,this.accessSecret);} verifyRefresh(t:string){return this.verify(t,this.refreshSecret);}
}
