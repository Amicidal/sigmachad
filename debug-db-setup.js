// Debug script to test database setup step by step
import { execSync } from 'child_process';

function runCommand(cmd, description) {
  console.log(`\n🔍 Testing: ${description}`);
  console.log(`Command: ${cmd}`);
  try {
    const start = Date.now();
    const result = execSync(cmd, { encoding: 'utf8', timeout: 30000 });
    const duration = Date.now() - start;
    console.log(`✅ Success (${duration}ms):`, result.trim());
    return true;
  } catch (error) {
    console.log(`❌ Failed:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database infrastructure diagnostic...\n');

  // Test 1: Check if containers are running
  runCommand('docker ps --filter "name=sigmachad-.*-test-1" --format "table {{.Names}}\t{{.Status}}"',
             'Container status');

  // Test 2: PostgreSQL connectivity
  runCommand('docker exec sigmachad-postgres-test-1 psql -U memento_test -d memento_test -c "SELECT version();" | head -3',
             'PostgreSQL connectivity');

  // Test 3: Redis connectivity
  runCommand('docker exec sigmachad-redis-test-1 redis-cli ping',
             'Redis connectivity');

  // Test 4: FalkorDB connectivity
  runCommand('docker exec sigmachad-falkordb-test-1 redis-cli -p 6379 ping',
             'FalkorDB connectivity');

  // Test 5: Qdrant connectivity
  runCommand('curl -s http://localhost:6335/collections | jq . 2>/dev/null || echo "Qdrant collections check failed"',
             'Qdrant connectivity');

  // Test 6: Network connectivity from host
  runCommand('nc -z localhost 5433 && echo "PostgreSQL port open" || echo "PostgreSQL port closed"',
             'PostgreSQL port connectivity');
  runCommand('nc -z localhost 6381 && echo "Redis port open" || echo "Redis port closed"',
             'Redis port connectivity');
  runCommand('nc -z localhost 6380 && echo "FalkorDB port open" || echo "FalkorDB port closed"',
             'FalkorDB port connectivity');
  runCommand('nc -z localhost 6335 && echo "Qdrant port open" || echo "Qdrant port closed"',
             'Qdrant port connectivity');

  console.log('\n🎯 Diagnostic complete. If all tests pass, the issue is likely in the DatabaseService initialization code.');
}

main().catch(console.error);