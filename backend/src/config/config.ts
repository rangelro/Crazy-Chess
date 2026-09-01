export interface Config {
  port: number;
  databaseUrl?: string;
  corsOrigin?: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  accessTokenTtl: string;
  refreshTokenTtl: string;
  isProduction: boolean;
}
export function readConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT inválida');
  const isProduction = env.NODE_ENV === 'production';
  const jwtAccessSecret = env.JWT_ACCESS_SECRET;
  const jwtRefreshSecret = env.JWT_REFRESH_SECRET;
  if (isProduction && !jwtAccessSecret) throw new Error('JWT_ACCESS_SECRET é obrigatória em produção');
  if (isProduction && !jwtRefreshSecret) throw new Error('JWT_REFRESH_SECRET é obrigatória em produção');
  return {
    port,
    databaseUrl: env.DATABASE_URL || undefined,
    corsOrigin: env.CORS_ORIGIN || undefined,
    jwtAccessSecret: jwtAccessSecret || 'desenvolvimento-access-secret-inseguro',
    jwtRefreshSecret: jwtRefreshSecret || 'desenvolvimento-refresh-secret-inseguro',
    accessTokenTtl: env.JWT_ACCESS_TTL || '15m',
    refreshTokenTtl: env.JWT_REFRESH_TTL || '7d',
    isProduction,
  };
}
