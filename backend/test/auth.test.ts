import test from 'node:test'; import assert from 'node:assert/strict';
import { TokenService } from '../src/modules/auth/tokens.js';

const tokens=()=>new TokenService('access-secret','refresh-secret','15m','7d');
test('cria e verifica access token',()=>{const t=tokens().signAccess({userId:'u1',email:'u@example.com'});assert.deepEqual(tokens().verifyAccess(t),{userId:'u1',email:'u@example.com'});});
test('rejeita assinatura inválida',()=>{const t=tokens().signAccess({userId:'u1',email:'u@example.com'});assert.throws(()=>new TokenService('outro','refresh-secret','15m','7d').verifyAccess(t),/Token inválido/);});
test('rejeita token expirado',()=>{const t=new TokenService('a','r','-1s','7d').signAccess({userId:'u1',email:'u@example.com'});assert.throws(()=>new TokenService('a','r','15m','7d').verifyAccess(t),/Token expirado/);});
