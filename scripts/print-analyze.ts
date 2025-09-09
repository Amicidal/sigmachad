import { APIGateway } from '../src/api/APIGateway.js';
import { KnowledgeGraphService } from '../src/services/KnowledgeGraphService.js';
import { DatabaseService } from '../src/services/DatabaseService.js';

async function main() {
  const db = new DatabaseService({
    falkor: { host: '127.0.0.1', port: 6380 },
    qdrant: { host: '127.0.0.1', port: 6333, grpcPort: 6334 },
    postgres: { host: '127.0.0.1', port: 5433, database: 'memento_test', user: 'memento_test', password: 'memento_test' },
    redis: { host: '127.0.0.1', port: 6381 },
  } as any);
  await db.initialize();
  const kg = new KnowledgeGraphService(db);
  const api = new APIGateway(kg, db);
  const app = api.getApp();
  await api.start();

  const resp = await app.inject({
    method: 'POST',
    url: '/api/v1/code/analyze',
    headers: { 'content-type': 'application/json' },
    payload: JSON.stringify({ files: ['src/'], analysisType: 'complexity', options: {} }),
  });
  console.log('STATUS', resp.statusCode);
  console.log('BODY', resp.payload);
  await api.stop();
  await db.shutdown();
}

main().catch((e) => { console.error(e); process.exit(1); });

