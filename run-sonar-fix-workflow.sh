#!/bin/bash

# SonarQube Critical Issue Fix Workflow Launcher
# This script runs the multi-agent workflow to resolve critical SonarQube issues

set -e

echo "🔧 SonarQube Critical Issue Fix Workflow"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "sonar-project.properties" ]; then
    echo "❌ Error: Must be run from the project root directory"
    exit 1
fi

# Check if Node.js and required tools are available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is required but not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is required but not installed"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if tsx is available (for running TypeScript directly)
if ! command -v tsx &> /dev/null && ! npx tsx --version &> /dev/null; then
    echo "📦 Installing tsx for TypeScript execution..."
    npm install -g tsx
fi

# Verify SonarQube connection
echo "🔍 Checking SonarQube connection..."
SONAR_HOST="http://localhost:9000"
SONAR_TOKEN="squ_5bccbc30d7bdc8eda20bf09b93b6cad47884280c"
PROJECT_KEY="sigmachad"

if curl -s -u "${SONAR_TOKEN}:" "${SONAR_HOST}/api/system/status" | grep -q '"status":"UP"'; then
    echo "✅ SonarQube is accessible"
else
    echo "❌ Error: Cannot connect to SonarQube at ${SONAR_HOST}"
    echo "   Make sure SonarQube is running and credentials are correct"
    exit 1
fi

# Query current critical issues
echo "📊 Querying critical issues..."
CRITICAL_COUNT=$(curl -s -u "${SONAR_TOKEN}:" "${SONAR_HOST}/api/issues/search?componentKeys=${PROJECT_KEY}&severities=CRITICAL&statuses=OPEN&ps=1" | jq -r '.total // 0')

if [ "$CRITICAL_COUNT" -eq 0 ]; then
    echo "🎉 No critical issues found! Nothing to fix."
    exit 0
fi

echo "🚨 Found $CRITICAL_COUNT critical issues to resolve"

# Create backup before starting (skip git operations due to depth validation)
echo "💾 Skipping backup creation (git operations disabled due to depth constraints)"
echo "   Manual backup recommended before running fixes"

echo "🚀 Starting multi-agent resolution workflow..."
echo "   This may take several minutes depending on the number of issues"
echo ""

# Run the workflow
npx tsx sonar-critical-fix-workflow.ts

# Check results
if [ -f "sonar-resolution-report.json" ]; then
    echo ""
    echo "📄 Results Summary:"
    cat sonar-resolution-report.json | jq '.summary'

    SUCCESS_RATE=$(cat sonar-resolution-report.json | jq -r '(.summary.successfulResolutions / .summary.totalIssues * 100) | floor')
    echo "📊 Overall Success Rate: ${SUCCESS_RATE}%"

    # Check if we need to re-run SonarQube analysis
    echo ""
    echo "🔄 Re-running SonarQube analysis to verify fixes..."
    if npx sonar-scanner; then
        echo "✅ SonarQube analysis completed"
    else
        echo "⚠️  SonarQube analysis failed - manual verification may be needed"
    fi
else
    echo "❌ No results file generated - workflow may have failed"
    exit 1
fi

echo ""
echo "🎯 Workflow completed!"
echo "   Check sonar-resolution-report.json for detailed results"
echo "   Re-run this script if additional fixes are needed"
