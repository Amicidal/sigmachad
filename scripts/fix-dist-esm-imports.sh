#!/usr/bin/env bash
set -euo pipefail

# Add .js extension to relative import/export specifiers missing an extension in compiled dist .js files
files=$(rg -l --glob 'dist/**/*.js' 'from "\./|from "\.\./|export \* from "\./|export \* from "\.\./')

count=0
echo "$files" | while IFS= read -r f; do
  # Add .js to from "./..." or from "../..." with no extension
  perl -0777 -pe 's/(from\s+"(\.\.?\/[^"]+?))"/($1 =~ /\.(js|mjs|cjs|json)$/ ? $& : "$1.js\"")/ge' -i "$f"
  # Add .js to export * from "./..." statements
  perl -0777 -pe 's/(export\s+\*\s+from\s+"(\.\.?\/[^"]+?))"/($1 =~ /\.(js|mjs|cjs|json)$/ ? $& : "$1.js\"")/ge' -i "$f"
  # Guard require.main checks for ESM
  perl -0777 -pe 's/if \(require\.main === module\)/if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module)/g' -i "$f"
  count=$((count+1))
done

echo "Patched ${count} files for ESM import/export compatibility."
