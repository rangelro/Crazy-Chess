import test from 'node:test';
import assert from 'node:assert/strict';
import { readConfig } from '../src/config/config.js';

test('lê configuração com valores padrão seguros', () => {
  assert.deepEqual(readConfig({}), {
    port: 3000, databaseUrl: undefined, corsOrigin: undefined,
    jwtAccessSecret: 'desenvolvimento-access-secret-inseguro',
    jwtRefreshSecret: 'desenvolvimento-refresh-secret-inseguro',
    accessTokenTtl: '15m', refreshTokenTtl: '7d', isProduction: false,
  });
});

test('exige os segredos JWT em produção', () => {
  assert.throws(() => readConfig({ NODE_ENV: 'production' }), /JWT_ACCESS_SECRET/);
});
