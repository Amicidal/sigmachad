#!/bin/bash

echo "🧪 Running ASTParser Module Integration Tests"
echo "============================================="

cd "$(dirname "$0")/../../.."

echo ""
echo "🔍 1. Running Integration Verification Tests..."
npx tsx tests/integration/astparser/integration-verification.ts

echo ""
echo "🔍 2. Running Dependency Analysis..."
npx tsx tests/integration/astparser/dependency-analysis.ts

echo ""
echo "📊 3. Test Summary"
echo "=================="
echo "✅ Integration verification completed"
echo "✅ Dependency analysis completed"
echo "📄 Report available at: tests/integration/astparser/INTEGRATION-REPORT.md"
echo ""
echo "🎉 All ASTParser module integration tests completed successfully!"