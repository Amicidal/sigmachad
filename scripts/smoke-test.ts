#!/usr/bin/env tsx

/**
 * Minimal smoke test for the Memento API stack.
 *
 * Usage:
 *   pnpm smoke            # uses http://localhost:3000
 *   pnpm smoke http://host:port
 */

const baseUrl = process.argv[2] || process.env.SMOKE_BASE_URL || 'http://localhost:3000';

const endpoints = [
  {
    name: 'Health check',
    url: `${baseUrl.replace(/\/$/, '')}/health`,
    validate: (body: any) => body && (body.status === 'ok' || body.success === true),
  },
  {
    name: 'Graph entities',
    url: `${baseUrl.replace(/\/$/, '')}/api/v1/graph/entities?limit=1`,
    validate: (body: any) => body && body.success === true,
  },
  {
    name: 'Graph relationships',
    url: `${baseUrl.replace(/\/$/, '')}/api/v1/graph/relationships?limit=1`,
    validate: (body: any) => body && body.success === true,
  },
];

async function main() {
  console.log(`\n🔍 Running smoke test against ${baseUrl}`);
  let failures = 0;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        headers: {
          'accept': 'application/json',
          'x-test-health-check': '1',
        },
      });

      if (!response.ok) {
        failures += 1;
        console.error(`❌ ${endpoint.name} failed with status ${response.status}`);
        continue;
      }

      const body = await response.json().catch(() => null);
      if (!endpoint.validate(body)) {
        failures += 1;
        console.error(`❌ ${endpoint.name} returned unexpected payload`);
        console.error(JSON.stringify(body, null, 2));
        continue;
      }

      console.log(`✅ ${endpoint.name}`);
    } catch (error) {
      failures += 1;
      console.error(`❌ ${endpoint.name} request error:`, error instanceof Error ? error.message : error);
    }
  }

  if (failures > 0) {
    console.error(`\nSmoke test failed (${failures} failing check${failures === 1 ? '' : 's'}).`);
    process.exit(1);
  }

  console.log('\n🎉 Smoke test passed.');
}

main().catch((error) => {
  console.error('Unexpected smoke test failure:', error);
  process.exit(1);
});
