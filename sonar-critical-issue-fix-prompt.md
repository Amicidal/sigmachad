# Optimized Multi-Agent SonarQube Critical Issue Resolution Prompt

## Overview
Execute a systematic, multi-agent workflow to resolve all critical SonarQube issues through iterative resolution and verification passes. Use subagents for specialized tasks and maintain strict quality control.

## Workflow Architecture

### Phase 1: Issue Discovery & Analysis
**Main Agent Responsibilities:**
- Query SonarQube API for critical issues
- Parse and categorize issues by type and complexity
- Create prioritized resolution queue
- Initialize tracking and progress monitoring

### Phase 2: Iterative Resolution (2 Passes Per Issue)
**Resolution Agent Responsibilities:**
- Analyze individual critical issues
- Implement targeted fixes
- Apply code refactoring techniques
- Maintain code quality standards

**Verification Agent Responsibilities:**
- Validate fix effectiveness
- Ensure no regression issues introduced
- Confirm SonarQube issue resolution
- Verify code maintainability

### Phase 3: Quality Assurance & Reporting
**QA Agent Responsibilities:**
- Run comprehensive validation tests
- Generate detailed resolution reports
- Identify patterns and systemic issues
- Provide optimization recommendations

## Detailed Execution Instructions

### API Integration Setup
```bash
# SonarQube API Configuration
SONAR_HOST="http://localhost:9000"
SONAR_TOKEN="squ_5bccbc30d7bdc8eda20bf09b93b6cad47884280c"
PROJECT_KEY="sigmachad"
```

### Critical Issue Query Function
```bash
curl -s -u "${SONAR_TOKEN}:" \
  "${SONAR_HOST}/api/issues/search?componentKeys=${PROJECT_KEY}&severities=CRITICAL&statuses=OPEN&ps=500"
```

## Agent Orchestration Protocol

### Subagent Creation & Management
Create specialized subagents with distinct roles:

1. **IssueAnalyzer Agent**: Parses SonarQube issues, categorizes by type
2. **CodeResolver Agent**: Implements fixes for specific issue types
3. **CodeVerifier Agent**: Validates fixes and checks for regressions
4. **QualityAssurance Agent**: Runs comprehensive testing and validation

### Communication Protocol
- Use structured JSON messaging between agents
- Maintain issue resolution state across passes
- Implement error handling and rollback capabilities
- Log all agent interactions and decisions

## Issue Resolution Strategies by Type

### Cognitive Complexity Issues
**Resolution Strategy:**
1. Extract complex logic into smaller, focused functions
2. Apply early return patterns
3. Use guard clauses to reduce nesting
4. Implement helper functions for complex calculations

**Verification Checks:**
- Confirm cognitive complexity ≤ 15
- Validate all code paths are testable
- Ensure function responsibilities are clear

### Asynchronous Constructor Issues
**Resolution Strategy:**
1. Move async operations to dedicated initialization methods
2. Implement proper async initialization patterns
3. Use factory patterns or builder classes
4. Ensure proper error handling during initialization

**Verification Checks:**
- No async operations in constructors
- Proper resource cleanup on initialization failure
- Initialization state properly tracked

### Deep Nesting Issues
**Resolution Strategy:**
1. Extract nested logic into separate functions
2. Apply early returns to reduce nesting levels
3. Use guard clauses and validation functions
4. Implement state machines for complex logic

**Verification Checks:**
- Maximum nesting depth ≤ 4 levels
- Clear code flow and readability
- Maintainable function sizes

### Empty Method Issues
**Resolution Strategy:**
1. Implement proper method bodies or remove unused methods
2. Add meaningful functionality or deprecation notices
3. Ensure interface compliance if required
4. Document intentional empty implementations

**Verification Checks:**
- Methods have clear purpose or are properly removed
- No unused method signatures
- Interface contracts maintained

## Two-Pass Resolution Algorithm

### Pass 1: Initial Resolution
```
FOR EACH critical_issue IN issues_queue:
    resolution_agent = CREATE_SUBAGENT("CodeResolver", issue_type)
    fix_attempt = resolution_agent.resolve(issue)

    verification_agent = CREATE_SUBAGENT("CodeVerifier", issue_type)
    validation_result = verification_agent.verify(fix_attempt)

    IF validation_result.passed:
        MARK_ISSUE_RESOLVED(issue, "PASS_1_SUCCESS")
    ELSE:
        MARK_ISSUE_NEEDS_PASS2(issue, validation_result.feedback)
```

### Pass 2: Refinement & Validation
```
FOR EACH issue IN needs_pass2_queue:
    refinement_agent = CREATE_SUBAGENT("CodeResolver", issue_type, previous_feedback)
    refined_fix = refinement_agent.refine(issue, previous_feedback)

    final_verification_agent = CREATE_SUBAGENT("CodeVerifier", issue_type, "STRICT_MODE")
    final_validation = final_verification_agent.verify_strict(refined_fix)

    IF final_validation.passed:
        MARK_ISSUE_RESOLVED(issue, "PASS_2_SUCCESS")
    ELSE:
        FLAG_ISSUE_MANUAL_REVIEW(issue, final_validation.critical_findings)
```

## Quality Control Measures

### Automated Testing Integration
- Run unit tests after each fix
- Execute integration tests for complex changes
- Validate build compilation
- Check linting compliance

### Regression Prevention
- Maintain git history of changes
- Implement rollback capabilities
- Track issue resolution patterns
- Generate impact analysis reports

### Progress Tracking
- Real-time dashboard of resolution progress
- Issue categorization statistics
- Time-to-resolution metrics
- Success rate tracking per issue type

## Error Handling & Recovery

### Resolution Failure Scenarios
1. **Fix Implementation Fails**: Log detailed error, attempt alternative strategy
2. **Verification Fails**: Provide specific feedback, queue for pass 2
3. **Build Breaks**: Automatic rollback, manual intervention required
4. **Complex Issues**: Escalate to human review with detailed analysis

### Recovery Protocols
- Automatic rollback on critical failures
- Alternative resolution strategies for stubborn issues
- Human-in-the-loop escalation for complex cases
- Comprehensive error logging and analysis

## Output & Reporting

### Resolution Report Structure
```json
{
  "summary": {
    "total_critical_issues": 197,
    "resolved_pass1": 0,
    "resolved_pass2": 0,
    "requires_manual_review": 0,
    "resolution_rate": 0.0
  },
  "issues_by_type": {
    "cognitive_complexity": { "count": 150, "resolved": 0, "pending": 150 },
    "async_constructor": { "count": 25, "resolved": 0, "pending": 25 },
    "deep_nesting": { "count": 15, "resolved": 0, "pending": 15 },
    "empty_methods": { "count": 7, "resolved": 0, "pending": 7 }
  },
  "resolution_log": [
    {
      "issue_id": "AXYZ...",
      "type": "cognitive_complexity",
      "file": "packages/api/src/APIGateway.ts",
      "line": 800,
      "pass1_status": "SUCCESS|FAILED|PENDING",
      "pass2_status": "SUCCESS|FAILED|PENDING",
      "resolution_time": "2024-01-01T12:00:00Z",
      "verifier_feedback": "..."
    }
  ]
}
```

## Execution Commands

### Initialize Workflow
```bash
# Query critical issues
curl -s -u "${SONAR_TOKEN}:" "${SONAR_HOST}/api/issues/search?componentKeys=${PROJECT_KEY}&severities=CRITICAL&statuses=OPEN&ps=500" > critical_issues.json

# Start resolution workflow
claude --agent-orchestration --workflow sonar-critical-fix --input critical_issues.json
```

### Monitor Progress
```bash
# Check resolution status
tail -f resolution_progress.log

# View current statistics
cat resolution_report.json | jq '.summary'
```

### Emergency Stop
```bash
# Stop all agents and rollback recent changes
./emergency_stop.sh
```

## Optimization Guidelines

### Performance Considerations
- Process issues in parallel where safe
- Implement intelligent batching for similar issues
- Cache SonarQube API responses
- Optimize agent context windows

### Quality Optimization
- Prioritize high-impact, low-risk fixes first
- Maintain code consistency across the codebase
- Preserve existing functionality
- Follow established coding patterns

### Scalability Features
- Handle large numbers of issues efficiently
- Implement progressive refinement
- Support incremental processing
- Enable resumable workflows

This optimized prompt creates a robust, multi-agent system for systematically resolving SonarQube critical issues with comprehensive quality control, error handling, and progress tracking capabilities.
