const { TestResultParser } = require('./src/services/TestResultParser.js');

const parser = new TestResultParser();

// Test JUnit XML
const junitXml = `<?xml version="1.0" encoding="UTF-8"?>
  <testsuite name="ExampleTestSuite" tests="2" failures="1" time="0.250">
    <testcase name="should pass" time="0.100" />
    <testcase name="should fail" time="0.150">
      <failure message="Assertion failed">Expected true but got false</failure>
    </testcase>
  </testsuite>`;

console.log('Testing JUnit XML parsing...');
parser.parseContent(junitXml, 'junit').then(result => {
  console.log('Suite name:', result.suiteName);
  console.log('Total tests:', result.totalTests);
  console.log('Passed tests:', result.passedTests);
  console.log('Failed tests:', result.failedTests);
  console.log('Results count:', result.results.length);
  if (result.results.length > 0) {
    console.log('First test:', result.results[0]);
    console.log('Second test:', result.results[1]);
  }
}).catch(err => {
  console.error('Error:', err.message);
});
