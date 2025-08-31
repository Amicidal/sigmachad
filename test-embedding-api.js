import { config } from 'dotenv';
import { embeddingService } from './src/utils/embedding.js';

config(); // Load .env file

async function testEmbedding() {
  console.log('Testing embedding service...');
  
  // Check if real embeddings are available
  const hasReal = embeddingService.hasRealEmbeddings();
  console.log('Has real OpenAI embeddings:', hasReal);
  
  // Validate config
  const validation = embeddingService.validateConfig();
  console.log('Config validation:', validation);
  
  // Generate a test embedding
  try {
    const result = await embeddingService.generateEmbedding(
      'This is a test function to verify OpenAI embeddings are working'
    );
    console.log('Embedding generated successfully!');
    console.log('Model:', result.model);
    console.log('Vector length:', result.embedding.length);
    console.log('First 5 values:', result.embedding.slice(0, 5));
    
    // Check if it's a mock or real embedding
    const isMock = result.embedding.every((v, i, arr) => {
      if (i === 0) return true;
      // Mock embeddings have a pattern
      return Math.abs(arr[i] - arr[i-1]) < 0.01;
    });
    console.log('Is mock embedding:', isMock);
  } catch (error) {
    console.error('Failed to generate embedding:', error.message);
  }
}

testEmbedding();
