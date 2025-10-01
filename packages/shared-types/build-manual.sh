#!/bin/bash

echo "Building shared-types package manually..."

# Clean previous build
rm -rf ../../dist/packages/shared-types

# Build with TypeScript
npx tsc --project tsconfig.lib.json --outDir ../../dist/packages/shared-types

if [ $? -eq 0 ]; then
    echo "✅ shared-types package built successfully!"
    echo "Output: dist/packages/shared-types/"
else
    echo "❌ Build failed"
    exit 1
fi
