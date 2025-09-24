# Code Summaries

This directory contains automatically generated code summaries for each package.

## Purpose
- Provide context-efficient representations of actual implementation
- Strip comments to focus on what code does, not what it claims to do
- Include quality indicators from semgrep analysis
- Identify potential deception, stubs, and brittleness

## Files
- [agents](agents.md)
- [api](api.md)
- [backup](backup.md)
- [core](core.md)
- [database](database.md)
- [graph](graph.md)
- [jobs](jobs.md)
- [knowledge](knowledge.md)
- [parser](parser.md)
- [sync](sync.md)
- [testing](testing.md)

## Generation
Summaries are regenerated on each commit via the pre-commit hook.
To manually regenerate: `pnpm docs:generate`

## Quality Indicators Key
- 🔴 **Critical**: Security issues, SQL injection risks, hardcoded credentials
- 🚨 **Deception Risk**: Functions that don't do what they claim
- 🚧 **Stubs**: Not-implemented functions, TODO markers
- ⚠️ **Warnings**: Error swallowing, missing null checks, quality issues
