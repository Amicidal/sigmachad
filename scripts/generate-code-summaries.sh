#!/bin/bash

# Generate Code Summaries with Quality Indicators
# Uses repomix for compression and semgrep for quality analysis

set -e

echo "📚 Starting code summary generation..."

# Create summaries directory if it doesn't exist
mkdir -p docs/summaries

# Check if required tools are available
if ! command -v semgrep &> /dev/null; then
    echo "⚠️  Warning: semgrep not found. Installing with pip..."
    pip install semgrep
fi

# Track if any package was processed
PROCESSED=0

# Process main src directory and any subdirectory modules
DIRS_TO_PROCESS=""

# Check if we have a packages directory structure
if [ -d "packages" ]; then
    # Monorepo structure with packages
    for package_dir in packages/*/; do
        if [ -d "$package_dir/src" ]; then
            DIRS_TO_PROCESS="$DIRS_TO_PROCESS $package_dir"
        fi
    done
else
    # Single project structure - process src subdirectories as modules
    if [ -d "src" ]; then
        # Process main src as "main"
        DIRS_TO_PROCESS="src"

        # Also process major subdirectories as separate summaries
        for subdir in src/*/; do
            if [ -d "$subdir" ] && [ "$(basename "$subdir")" != "types" ] && [ "$(basename "$subdir")" != "utils" ]; then
                # Only add directories with actual code files
                if ls "$subdir"/*.ts "$subdir"/*.js "$subdir"/*.tsx "$subdir"/*.jsx 2>/dev/null | head -1 > /dev/null; then
                    DIRS_TO_PROCESS="$DIRS_TO_PROCESS $subdir"
                fi
            fi
        done
    fi
fi

# Process each directory
for dir_path in $DIRS_TO_PROCESS; do
    # Skip if not a directory
    [ ! -d "$dir_path" ] && continue

    # Determine package name
    if [ "$dir_path" = "src" ]; then
        package_name="main"
        src_path="src"
    elif [[ "$dir_path" == packages/* ]]; then
        package_name=$(basename "$dir_path")
        src_path="$dir_path/src"
    else
        package_name=$(basename "$dir_path")
        src_path="$dir_path"
    fi

    echo "📦 Processing $package_name..."
    PROCESSED=1

    # Run semgrep for quality indicators
    echo "  🔍 Running semgrep analysis..."
    semgrep_output="/tmp/semgrep-$package_name.json"

    # Run semgrep with both quality indicators and antipattern rules
    semgrep --config=.semgrep/rules/quality-indicators.yml --config=.semgrep/rules/antipatterns.yml \
        --json \
        --no-git-ignore \
        "$src_path" > "$semgrep_output" 2>/dev/null || true

    # Parse semgrep results
    if [ -f "$semgrep_output" ]; then
        warnings=$(jq '.results | length' "$semgrep_output" 2>/dev/null || echo "0")
        critical=$(jq '[.results[] | select(.extra.severity == "ERROR")] | length' "$semgrep_output" 2>/dev/null || echo "0")
        stubs=$(jq '[.results[] | select(.extra.metadata.category == "stub")] | length' "$semgrep_output" 2>/dev/null || echo "0")
        deception=$(jq '[.results[] | select(.extra.metadata."deception-risk" == "critical" or .extra.metadata."deception-risk" == "high")] | length' "$semgrep_output" 2>/dev/null || echo "0")
        antipatterns=$(jq '[.results[] | select(.extra.metadata.antipattern != null)] | length' "$semgrep_output" 2>/dev/null || echo "0")
    else
        warnings=0
        critical=0
        stubs=0
        deception=0
        antipatterns=0
    fi

    # Start writing the summary file
    summary_file="docs/summaries/$package_name.md"

    # Get current timestamp in EST/EDT with 12-hour format
    if command -v gdate &> /dev/null; then
        # GNU date (from coreutils on macOS)
        TIMESTAMP=$(TZ="America/New_York" gdate "+%Y-%m-%d %I:%M:%S %p %Z")
    elif date --version 2>&1 | grep -q GNU; then
        # GNU date on Linux
        TIMESTAMP=$(TZ="America/New_York" date "+%Y-%m-%d %I:%M:%S %p %Z")
    else
        # BSD date (macOS default) - different syntax
        TIMESTAMP=$(TZ="America/New_York" date "+%Y-%m-%d %I:%M:%S %p %Z")
    fi

    cat > "$summary_file" << EOF
# Package: $package_name
Generated: $TIMESTAMP

## ⚠️ Quality Indicators

| Metric | Count | Status |
|--------|-------|--------|
| Total Warnings | $warnings | $([ "$warnings" -eq 0 ] && echo "✅" || echo "⚠️") |
| Critical Issues | $critical | $([ "$critical" -eq 0 ] && echo "✅" || echo "❌") |
| Stub Implementations | $stubs | $([ "$stubs" -eq 0 ] && echo "✅" || echo "🚧") |
| Deception Risk | $deception | $([ "$deception" -eq 0 ] && echo "✅" || echo "🚨") |
| Antipatterns | $antipatterns | $([ "$antipatterns" -eq 0 ] && echo "✅" || echo "🔍") |

EOF

    # Add detailed issues if any exist (excluding INFO level)
    if [ "$warnings" -gt 0 ] && [ -f "$semgrep_output" ]; then
        echo "### Notable Issues" >> "$summary_file"
        echo "" >> "$summary_file"

        # Count non-INFO issues
        non_info_count=$(jq '[.results[] | select(.extra.severity != "INFO")] | length' "$semgrep_output" 2>/dev/null || echo "0")

        # Group by severity - show ALL ERROR level issues
        if [ "$critical" -gt 0 ]; then
            echo "#### 🔴 Critical Issues ($critical)" >> "$summary_file"
            echo "These are serious problems that could lead to security vulnerabilities or system failures:" >> "$summary_file"
            echo "" >> "$summary_file"
            jq -r '.results[] | select(.extra.severity == "ERROR") | "- `\(.path | split("/") | last):\(.start.line)` - **\(.extra.message)**"' \
                "$semgrep_output" 2>/dev/null >> "$summary_file" || true
            echo "" >> "$summary_file"
        fi

        # Show ALL high deception risk items
        if [ "$deception" -gt 0 ]; then
            echo "#### 🚨 Potential Deception ($deception)" >> "$summary_file"
            echo "Functions that don't do what their names suggest, or claim functionality they don't have:" >> "$summary_file"
            echo "" >> "$summary_file"
            jq -r '.results[] | select(.extra.metadata."deception-risk" == "critical" or .extra.metadata."deception-risk" == "high") | "- `\(.path | split("/") | last):\(.start.line)` - **\(.extra.message)**"' \
                "$semgrep_output" 2>/dev/null >> "$summary_file" || true
            echo "" >> "$summary_file"
        fi

        # Show ALL stubs
        if [ "$stubs" -gt 0 ]; then
            echo "#### 🚧 Incomplete Implementations ($stubs)" >> "$summary_file"
            echo "Functions or features that are defined but not actually implemented:" >> "$summary_file"
            echo "" >> "$summary_file"
            jq -r '.results[] | select(.extra.metadata.category == "stub") | "- `\(.path | split("/") | last):\(.start.line)` - \(.extra.message)"' \
                "$semgrep_output" 2>/dev/null >> "$summary_file" || true
            echo "" >> "$summary_file"
        fi

        # Show all WARNING level issues
        warning_level=$(jq '[.results[] | select(.extra.severity == "WARNING")] | length' "$semgrep_output" 2>/dev/null || echo "0")
        if [ "$warning_level" -gt 0 ]; then
            echo "#### ⚠️ Warnings ($warning_level)" >> "$summary_file"
            echo "Issues that should be addressed but aren't critical:" >> "$summary_file"
            echo "" >> "$summary_file"
            jq -r '.results[] | select(.extra.severity == "WARNING") | "- `\(.path | split("/") | last):\(.start.line)` - \(.extra.message)"' \
                "$semgrep_output" 2>/dev/null >> "$summary_file" || true
            echo "" >> "$summary_file"
        fi

        # Show antipatterns section
        if [ "$antipatterns" -gt 0 ]; then
            echo "#### 🔍 Code Antipatterns ($antipatterns)" >> "$summary_file"
            echo "Design and architecture issues that should be refactored:" >> "$summary_file"
            echo "" >> "$summary_file"
            jq -r '.results[] | select(.extra.metadata.antipattern != null) | "- `\(.path | split("/") | last):\(.start.line)` - **\(.extra.message)** [\(.extra.metadata.antipattern)]"' \
                "$semgrep_output" 2>/dev/null >> "$summary_file" || true
            echo "" >> "$summary_file"
        fi

        # Only show INFO level count, not the actual items
        info_count=$(jq '[.results[] | select(.extra.severity == "INFO")] | length' "$semgrep_output" 2>/dev/null || echo "0")
        if [ "$info_count" -gt 0 ]; then
            echo "#### ℹ️ Informational" >> "$summary_file"
            echo "$info_count minor issues found (console.log usage, magic numbers, etc.) - not shown for brevity" >> "$summary_file"
            echo "" >> "$summary_file"
        fi

        # Add a legend at the end
        echo "#### 📖 Issue Types Explained" >> "$summary_file"
        echo "" >> "$summary_file"
        echo "- **not-implemented-stub**: Function exists but just throws 'Not implemented' error" >> "$summary_file"
        echo "- **todo-comments**: Code marked with TODO/FIXME indicating incomplete work" >> "$summary_file"
        echo "- **hardcoded-credentials**: Passwords or API keys hardcoded in source" >> "$summary_file"
        echo "- **test-environment-bypass**: Code skips logic in tests - tests don't test real behavior!" >> "$summary_file"
        echo "- **always-true-validation**: Validation function that always returns true without checking" >> "$summary_file"
        echo "- **silent-error-handler**: Catches errors but doesn't log or handle them" >> "$summary_file"
        echo "- **unhandled-async-rejection**: Async function without try-catch error handling" >> "$summary_file"
        echo "- **sql-string-concatenation**: SQL queries built with string concat (injection risk)" >> "$summary_file"
        echo "- **unsafe-property-access**: Accessing nested properties without null checks" >> "$summary_file"
        echo "- **deceptive-security-function**: Security function that doesn't actually secure anything" >> "$summary_file"
        echo "- **console-log-in-production**: Using console.log instead of proper logging" >> "$summary_file"
        echo "- **empty-function**: Function defined but has no implementation" >> "$summary_file"
        echo "- **magic-numbers**: Unexplained numeric constants in code" >> "$summary_file"
        echo "" >> "$summary_file"
    fi

    # Add separator before code
    echo "---" >> "$summary_file"
    echo "" >> "$summary_file"
    echo "## Code Summary (Comments Stripped)" >> "$summary_file"
    echo "" >> "$summary_file"

    # Run repomix to append compressed code
    echo "  📝 Running repomix compression..."

    # Run repomix on the source path
    npx -y repomix \
        --remove-comments \
        --output /tmp/repomix-output.txt \
        "$src_path" 2>/dev/null || {
            echo "  ⚠️  Repomix failed for $package_name, using fallback"
            echo "" >> "$summary_file"
            echo "```" >> "$summary_file"
            echo "Error: Could not generate code summary with repomix" >> "$summary_file"
            echo "Check that the package has a src directory and valid TypeScript/JavaScript files" >> "$summary_file"
            echo "```" >> "$summary_file"
            continue
        }

    # Append repomix output if it exists
    if [ -f /tmp/repomix-output.txt ]; then
        cat /tmp/repomix-output.txt >> "$summary_file"
        rm /tmp/repomix-output.txt
    fi

    echo "  ✅ Summary generated for $package_name"

    # Cleanup temp files
    rm -f "$semgrep_output"
done

# Create an index file
index_file="docs/summaries/README.md"
cat > "$index_file" << EOF
# Code Summaries

This directory contains automatically generated code summaries for each package.

## Purpose
- Provide context-efficient representations of actual implementation
- Strip comments to focus on what code does, not what it claims to do
- Include quality indicators from semgrep analysis
- Identify potential deception, stubs, and brittleness

## Files
EOF

# List all summary files
for summary in docs/summaries/*.md; do
    if [ -f "$summary" ] && [ "$summary" != "$index_file" ]; then
        filename=$(basename "$summary")
        package_name="${filename%.md}"
        echo "- [$package_name]($filename)" >> "$index_file"
    fi
done

cat >> "$index_file" << EOF

## Generation
Summaries are regenerated on each commit via the pre-commit hook.
To manually regenerate: \`pnpm docs:generate\`

## Quality Indicators Key
- 🔴 **Critical**: Security issues, SQL injection risks, hardcoded credentials
- 🚨 **Deception Risk**: Functions that don't do what they claim
- 🚧 **Stubs**: Not-implemented functions, TODO markers
- ⚠️ **Warnings**: Error swallowing, missing null checks, quality issues
EOF

if [ "$PROCESSED" -eq 0 ]; then
    echo "⚠️  No packages found to process"
    exit 1
else
    echo "✅ Code summaries generation complete!"
    echo "📁 Summaries saved to docs/summaries/"
fi