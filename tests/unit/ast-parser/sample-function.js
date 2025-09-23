/**
 * Sample JavaScript module for ASTParser testing
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class Calculator {
  constructor() {
    this.operations = new Map();
    this.history = [];
  }

  addOperation(name, func) {
    this.operations.set(name, func);
  }

  calculate(operation, a, b) {
    const func = this.operations.get(operation);
    if (!func) {
      throw new Error(`Unknown operation: ${operation}`);
    }

    const result = func(a, b);
    this.history.push({ operation, a, b, result, timestamp: Date.now() });
    return result;
  }

  getHistory() {
    return this.history.slice();
  }

  clearHistory() {
    this.history = [];
  }
}

function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, b) {
  return a * b;
}

function divide(a, b) {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const calculator = new Calculator();
calculator.addOperation('add', add);
calculator.addOperation('subtract', subtract);
calculator.addOperation('multiply', multiply);
calculator.addOperation('divide', divide);

function processNumbers(numbers, operation) {
  return numbers.map(num => calculator.calculate(operation, num, 10));
}

function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

function saveResults(filename, data) {
  const filePath = path.join(__dirname, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function loadResults(filename) {
  const filePath = path.join(__dirname, filename);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return null;
}

module.exports = {
  Calculator,
  calculator,
  add,
  subtract,
  multiply,
  divide,
  fibonacci,
  processNumbers,
  generateId,
  saveResults,
  loadResults
};
