import { describe, expect, it, vi } from 'vitest';
import { authService } from './auth';
describe('authService',()=>{it('envia credenciais e mantém o access token somente em memória',async()=>{global.fetch=vi.fn().mockResolvedValue({ok:true,json:async()=>({usuario:{id:'1',nome:'Ana',email:'ana@example.com'},accessToken:'token'})});const session=await authService.login('ana@example.com','senha123');expect(session.accessToken).toBe('token');expect(fetch).toHaveBeenCalledWith('/api/auth/login',expect.objectContaining({credentials:'include'}));});});
