import { embeddingService } from './src/utils/embedding.js';

async function testBatchEmbeddings() {
  console.log('Testing batch embedding generation...');
  
  const inputs = [
    { content: 'function calculateSum(a: number, b: number): number', entityId: 'func1' },
    { content: 'class UserService implements IUserService', entityId: 'class1' },
    { content: 'interface IUserService { getUser(id: string): User }', entityId: 'interface1' },
    { content: 'const MAX_RETRIES = 3', entityId: 'const1' },
    { content: 'export type UserRole = "admin" | "user" | "guest"', entityId: 'type1' }
  ];
  
  try {
    const result = await embeddingService.generateEmbeddingsBatch(inputs);
    console.log('Batch embedding generation successful!');
    console.log('Total results:', result.results.length);
    console.log('Total tokens:', result.totalTokens);
    console.log('Total cost: $' + result.totalCost.toFixed(6));
    console.log('Processing time:', result.processingTime + 'ms');
    console.log('\nResults summary:');
    result.results.forEach(r => {
      console.log(`  - ${r.entityId}: vector[${r.embedding.length}]`);
    });
  } catch (error: any) {
    console.error('Failed:', error.message);
  }
}

testBatchEmbeddings();
