import test from 'node:test'; import assert from 'node:assert/strict'; import { readFile } from 'node:fs/promises';
test('Compose fornece os segredos JWT exigidos pelo container de produção',async()=>{const compose=await readFile(new URL('../../docker-compose.yml',import.meta.url),'utf8');assert.match(compose,/JWT_ACCESS_SECRET:/);assert.match(compose,/JWT_REFRESH_SECRET:/);});
