import { TestTemporalTracker } from './dist/temporal/TestTemporalTracker.js';

async function testEvolutionTypes() {
  const tracker = new TestTemporalTracker();

  // First execution should be 'test_added'
  const execution1 = {
    executionId: 'exec_1',
    testId: 'test_1',
    entityId: 'entity_1',
    suiteId: 'suite_1',
    timestamp: new Date(),
    status: 'pass',
    duration: 100,
    metadata: {
      testType: 'unit',
      suiteId: 'suite_1',
      confidence: 0.9,
    },
  };

  await tracker.trackExecution(execution1);
  const events1 = await tracker.getEvolutionEvents('test_1', 'entity_1');
  console.log('First execution event type:', events1[0].type);

  // Second execution should be 'test_modified'
  const execution2 = {
    executionId: 'exec_2',
    testId: 'test_1',
    entityId: 'entity_1',
    suiteId: 'suite_1',
    timestamp: new Date(),
    status: 'pass',
    duration: 120,
    metadata: {
      testType: 'unit',
      suiteId: 'suite_1',
      confidence: 0.9,
    },
  };

  await tracker.trackExecution(execution2);
  const events2 = await tracker.getEvolutionEvents('test_1', 'entity_1');
  console.log('Second execution event type:', events2[1].type);
}

testEvolutionTypes().catch(console.error);
