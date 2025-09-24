/**
 * @file TestCIIntegration.ts
 * @description CI/CD integration for temporal test tracking
 *
 * Provides GitHub Actions integration, test history badges, trend reporting,
 * and automated alerts for temporal test data.
 */
/**
 * CI/CD integration service for temporal test tracking
 */
export class TestCIIntegration {
    constructor(config = {}, githubConfig, executionData = new Map(), eventData = new Map(), relationshipData = new Map()) {
        this.executionData = executionData;
        this.eventData = eventData;
        this.relationshipData = relationshipData;
        this.badgeCache = new Map();
        this.alertHistory = new Map();
        this.config = {
            maxTrendDataPoints: 1000,
            flakinessThreshold: 0.1,
            coverageChangeThreshold: 0.05,
            performanceRegressionThreshold: 1.5,
            obsolescenceDetectionEnabled: true,
            trendAnalysisPeriod: 'weekly',
            batchSize: 100,
            ...config
        };
        this.githubConfig = githubConfig;
    }
    /**
     * Generate test status badge
     */
    async generateTestBadge(testId, entityId, badgeType = 'status', config = {}) {
        const badgeConfig = {
            style: 'flat',
            colorScheme: 'auto',
            format: 'svg',
            ...config
        };
        const badgeId = `${badgeType}_${testId || 'all'}_${entityId || 'all'}`;
        // Get relevant data
        let executions = [];
        for (const [key, execs] of this.executionData.entries()) {
            if (testId && !key.includes(testId))
                continue;
            if (entityId && !key.includes(entityId))
                continue;
            executions.push(...execs);
        }
        // Calculate badge values based on type
        let label;
        let message;
        let color;
        switch (badgeType) {
            case 'status':
                const recentExecutions = executions.slice(-20);
                const passRate = recentExecutions.length > 0 ?
                    recentExecutions.filter(exec => exec.status === 'pass').length / recentExecutions.length : 0;
                label = 'tests';
                if (passRate >= 0.95) {
                    message = 'passing';
                    color = badgeConfig.customColors?.passing || '#4c1';
                }
                else if (passRate >= 0.8) {
                    message = 'mostly passing';
                    color = badgeConfig.customColors?.warning || '#dfb317';
                }
                else if (passRate >= 0.5) {
                    message = 'failing';
                    color = badgeConfig.customColors?.failing || '#e05d44';
                }
                else {
                    message = 'critical';
                    color = '#e05d44';
                }
                break;
            case 'coverage':
                const coverageExecutions = executions.filter(exec => exec.coverage);
                const avgCoverage = coverageExecutions.length > 0 ?
                    coverageExecutions.reduce((sum, exec) => sum + exec.coverage.overall, 0) / coverageExecutions.length : 0;
                label = 'coverage';
                message = `${(avgCoverage * 100).toFixed(1)}%`;
                if (avgCoverage >= 0.9) {
                    color = '#4c1';
                }
                else if (avgCoverage >= 0.7) {
                    color = '#97ca00';
                }
                else if (avgCoverage >= 0.5) {
                    color = '#dfb317';
                }
                else {
                    color = '#e05d44';
                }
                break;
            case 'flakiness':
                const windowSize = 20;
                const recentExecs = executions.slice(-windowSize);
                const failures = recentExecs.filter(exec => exec.status === 'fail').length;
                const flakinessScore = recentExecs.length > 0 ? failures / recentExecs.length : 0;
                label = 'flakiness';
                message = `${(flakinessScore * 100).toFixed(1)}%`;
                if (flakinessScore <= 0.05) {
                    color = '#4c1';
                }
                else if (flakinessScore <= 0.1) {
                    color = '#97ca00';
                }
                else if (flakinessScore <= 0.2) {
                    color = '#dfb317';
                }
                else {
                    color = '#e05d44';
                }
                break;
            case 'performance':
                const durationData = executions
                    .filter(exec => exec.duration)
                    .map(exec => exec.duration)
                    .slice(-50);
                const avgDuration = durationData.length > 0 ?
                    durationData.reduce((sum, d) => sum + d, 0) / durationData.length : 0;
                label = 'avg duration';
                if (avgDuration < 1000) {
                    message = `${avgDuration.toFixed(0)}ms`;
                }
                else if (avgDuration < 60000) {
                    message = `${(avgDuration / 1000).toFixed(1)}s`;
                }
                else {
                    message = `${(avgDuration / 60000).toFixed(1)}m`;
                }
                // Color based on performance (green for fast, red for slow)
                if (avgDuration < 5000) {
                    color = '#4c1';
                }
                else if (avgDuration < 15000) {
                    color = '#97ca00';
                }
                else if (avgDuration < 30000) {
                    color = '#dfb317';
                }
                else {
                    color = '#e05d44';
                }
                break;
            default:
                label = 'tests';
                message = 'unknown';
                color = '#9f9f9f';
        }
        // Generate SVG badge
        const svg = this.generateBadgeSVG(label, message, color, badgeConfig.style);
        const url = this.generateBadgeURL(label, message, color, badgeConfig);
        const badge = {
            badgeId,
            type: badgeType,
            label,
            message,
            color,
            url,
            lastUpdated: new Date(),
            svg
        };
        // Cache the badge
        this.badgeCache.set(badgeId, badge);
        return badge;
    }
    /**
     * Update GitHub repository badges
     */
    async updateGitHubBadges(badges) {
        if (!this.githubConfig?.enableBadgeUpdates) {
            return;
        }
        // This would interact with GitHub API to update repository badges
        // For now, we'll simulate the process
        for (const badge of badges) {
            console.log(`Updating GitHub badge: ${badge.label} - ${badge.message}`);
            // In a real implementation, this would:
            // 1. Upload the SVG to a GitHub repository or CDN
            // 2. Update the README.md file with the new badge URLs
            // 3. Create a commit with the updated badges
        }
    }
    /**
     * Generate trend report
     */
    async generateTrendReport(period, config = {}) {
        const reportConfig = {
            frequency: 'weekly',
            format: 'markdown',
            includeVisualizations: true,
            recipients: [],
            ...config
        };
        const reportId = `trend_report_${Date.now()}`;
        // Collect data for the period
        const executions = [];
        const events = [];
        for (const execs of this.executionData.values()) {
            executions.push(...execs.filter(exec => exec.timestamp >= period.start && exec.timestamp <= period.end));
        }
        for (const evts of this.eventData.values()) {
            events.push(...evts.filter(event => event.timestamp >= period.start && event.timestamp <= period.end));
        }
        // Calculate summary statistics
        const totalTests = new Set(executions.map(exec => exec.testId)).size;
        const totalExecutions = executions.length;
        const successfulExecutions = executions.filter(exec => exec.status === 'pass').length;
        const successRate = totalExecutions > 0 ? successfulExecutions / totalExecutions : 0;
        const coverageExecutions = executions.filter(exec => exec.coverage);
        const averageCoverage = coverageExecutions.length > 0 ?
            coverageExecutions.reduce((sum, exec) => sum + exec.coverage.overall, 0) / coverageExecutions.length : 0;
        // Calculate flakiness
        const flakinessEvents = events.filter(event => event.type === 'flakiness_detected');
        const flakinessScore = flakinessEvents.length / Math.max(totalTests, 1);
        // Determine performance trend
        const performanceEvents = events.filter(event => event.type === 'performance_regression');
        const performanceImprovements = events.filter(event => event.type === 'performance_improvement');
        let performanceTrend = 'stable';
        if (performanceEvents.length > performanceImprovements.length) {
            performanceTrend = 'degrading';
        }
        else if (performanceImprovements.length > performanceEvents.length) {
            performanceTrend = 'improving';
        }
        // Generate key insights
        const keyInsights = [];
        if (successRate < 0.8) {
            keyInsights.push(`Test success rate (${(successRate * 100).toFixed(1)}%) is below recommended 80%`);
        }
        if (flakinessScore > 0.1) {
            keyInsights.push(`High flakiness detected in ${flakinessEvents.length} tests`);
        }
        if (averageCoverage < 0.7) {
            keyInsights.push(`Code coverage (${(averageCoverage * 100).toFixed(1)}%) is below recommended 70%`);
        }
        if (performanceTrend === 'degrading') {
            keyInsights.push(`Performance regressions detected in ${performanceEvents.length} tests`);
        }
        // Generate report sections
        const sections = [
            {
                title: 'Executive Summary',
                content: this.generateExecutiveSummary({
                    totalTests,
                    totalExecutions,
                    successRate,
                    averageCoverage,
                    flakinessScore,
                    performanceTrend,
                    keyInsights
                })
            },
            {
                title: 'Test Execution Trends',
                content: this.generateExecutionTrendsSection(executions),
                visualizations: reportConfig.includeVisualizations ? [
                    {
                        type: 'chart',
                        data: this.prepareExecutionChartData(executions),
                        config: { type: 'line', title: 'Test Executions Over Time' }
                    }
                ] : undefined
            },
            {
                title: 'Coverage Analysis',
                content: this.generateCoverageSection(executions),
                visualizations: reportConfig.includeVisualizations ? [
                    {
                        type: 'chart',
                        data: this.prepareCoverageChartData(executions),
                        config: { type: 'area', title: 'Coverage Trends' }
                    }
                ] : undefined
            },
            {
                title: 'Flakiness Report',
                content: this.generateFlakinessSection(events, executions)
            },
            {
                title: 'Performance Analysis',
                content: this.generatePerformanceSection(events, executions)
            }
        ];
        // Generate report content based on format
        let content;
        switch (reportConfig.format) {
            case 'markdown':
                content = this.generateMarkdownReport(sections);
                break;
            case 'html':
                content = this.generateHTMLReport(sections);
                break;
            case 'json':
                content = JSON.stringify({ sections }, null, 2);
                break;
            default:
                content = this.generateMarkdownReport(sections);
        }
        return {
            reportId,
            timestamp: new Date(),
            period,
            format: reportConfig.format,
            summary: {
                totalTests,
                totalExecutions,
                successRate,
                averageCoverage,
                flakinessScore,
                performanceTrend,
                keyInsights
            },
            sections,
            content
        };
    }
    /**
     * Send trend report
     */
    async sendTrendReport(report, config) {
        // This would implement actual sending mechanisms
        // For now, we'll simulate the process
        for (const recipient of config.recipients) {
            console.log(`Sending trend report to: ${recipient}`);
            console.log(`Report format: ${config.format}`);
            console.log(`Report summary: ${report.summary.keyInsights.join(', ')}`);
        }
    }
    /**
     * Check for alert conditions
     */
    async checkAlertConditions(config) {
        const alerts = [];
        const now = new Date();
        // Get recent data (last 24 hours)
        const recentWindow = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const recentExecutions = [];
        const recentEvents = [];
        for (const execs of this.executionData.values()) {
            recentExecutions.push(...execs.filter(exec => exec.timestamp >= recentWindow));
        }
        for (const evts of this.eventData.values()) {
            recentEvents.push(...evts.filter(event => event.timestamp >= recentWindow));
        }
        // Check failure rate threshold
        if (recentExecutions.length > 0) {
            const failureRate = recentExecutions.filter(exec => exec.status === 'fail').length / recentExecutions.length;
            if (failureRate > config.thresholds.failureRate) {
                alerts.push({
                    alertId: `failure_spike_${Date.now()}`,
                    timestamp: now,
                    type: 'failure_spike',
                    severity: failureRate > 0.5 ? 'critical' : 'high',
                    message: `Test failure rate (${(failureRate * 100).toFixed(1)}%) exceeds threshold (${(config.thresholds.failureRate * 100).toFixed(1)}%)`,
                    affectedTests: this.getAffectedTests(recentExecutions.filter(exec => exec.status === 'fail')),
                    details: {
                        threshold: config.thresholds.failureRate,
                        actualValue: failureRate,
                        trend: 'increasing',
                        recommendations: [
                            'Investigate recent test failures',
                            'Check for environmental issues',
                            'Review recent code changes'
                        ]
                    },
                    status: 'active'
                });
            }
        }
        // Check flakiness threshold
        const flakinessEvents = recentEvents.filter(event => event.type === 'flakiness_detected');
        const uniqueTestsWithFlakiness = new Set(flakinessEvents.map(event => event.testId));
        if (uniqueTestsWithFlakiness.size > 0) {
            const flakinessScore = uniqueTestsWithFlakiness.size / new Set(recentExecutions.map(exec => exec.testId)).size;
            if (flakinessScore > config.thresholds.flakinessScore) {
                alerts.push({
                    alertId: `flakiness_increase_${Date.now()}`,
                    timestamp: now,
                    type: 'flakiness_increase',
                    severity: flakinessScore > 0.2 ? 'high' : 'medium',
                    message: `Test flakiness score (${(flakinessScore * 100).toFixed(1)}%) exceeds threshold (${(config.thresholds.flakinessScore * 100).toFixed(1)}%)`,
                    affectedTests: Array.from(uniqueTestsWithFlakiness).map(testId => ({
                        testId,
                        entityId: 'unknown',
                        impact: 'flaky behavior detected'
                    })),
                    details: {
                        threshold: config.thresholds.flakinessScore,
                        actualValue: flakinessScore,
                        trend: 'increasing',
                        recommendations: [
                            'Identify and fix flaky tests',
                            'Improve test reliability',
                            'Consider test environment stability'
                        ]
                    },
                    status: 'active'
                });
            }
        }
        // Check performance regression threshold
        const performanceEvents = recentEvents.filter(event => event.type === 'performance_regression');
        if (performanceEvents.length > 0) {
            alerts.push({
                alertId: `performance_regression_${Date.now()}`,
                timestamp: now,
                type: 'performance_regression',
                severity: 'medium',
                message: `${performanceEvents.length} performance regressions detected`,
                affectedTests: performanceEvents.map(event => ({
                    testId: event.testId,
                    entityId: event.entityId,
                    impact: event.description
                })),
                details: {
                    threshold: config.thresholds.performanceRegression,
                    actualValue: performanceEvents.length,
                    trend: 'degrading',
                    recommendations: [
                        'Review performance regressions',
                        'Optimize slow tests',
                        'Check system resources'
                    ]
                },
                status: 'active'
            });
        }
        // Check coverage decrease threshold
        const coverageEvents = recentEvents.filter(event => event.type === 'coverage_decreased');
        if (coverageEvents.length > 0) {
            alerts.push({
                alertId: `coverage_drop_${Date.now()}`,
                timestamp: now,
                type: 'coverage_drop',
                severity: 'medium',
                message: `${coverageEvents.length} tests with coverage decreases detected`,
                affectedTests: coverageEvents.map(event => ({
                    testId: event.testId,
                    entityId: event.entityId,
                    impact: event.description
                })),
                details: {
                    threshold: config.thresholds.coverageDecrease,
                    actualValue: coverageEvents.length,
                    trend: 'decreasing',
                    recommendations: [
                        'Investigate coverage decreases',
                        'Add missing test cases',
                        'Review code changes'
                    ]
                },
                status: 'active'
            });
        }
        // Filter alerts based on rate limits
        const filteredAlerts = this.applyRateLimits(alerts, config.rateLimits);
        return filteredAlerts;
    }
    /**
     * Send alerts
     */
    async sendAlerts(alerts, config) {
        for (const alert of alerts) {
            for (const channel of config.channels) {
                try {
                    await this.sendAlertToChannel(alert, channel);
                }
                catch (error) {
                    console.error(`Failed to send alert to ${channel.type}: ${error}`);
                }
            }
            // Store alert in history
            const key = alert.type;
            if (!this.alertHistory.has(key)) {
                this.alertHistory.set(key, []);
            }
            this.alertHistory.get(key).push(alert);
        }
    }
    /**
     * Create GitHub Actions workflow
     */
    async createGitHubWorkflow(workflow) {
        const workflowYAML = this.generateWorkflowYAML(workflow);
        // In a real implementation, this would:
        // 1. Create the workflow file in .github/workflows/
        // 2. Commit it to the repository
        // 3. Return the workflow ID
        return `workflow_${workflow.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;
    }
    /**
     * Update workflow status
     */
    async updateWorkflowStatus(workflowId, status, details) {
        // This would update the workflow status in GitHub or internal tracking
        console.log(`Workflow ${workflowId} status updated to: ${status}`);
        if (details) {
            console.log('Additional details:', details);
        }
    }
    /**
     * Get CI/CD metrics
     */
    async getCIMetrics(timeRange) {
        const range = timeRange || {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end: new Date()
        };
        // Get executions in the time range
        const executions = [];
        for (const execs of this.executionData.values()) {
            executions.push(...execs.filter(exec => exec.timestamp >= range.start && exec.timestamp <= range.end));
        }
        const workflowRuns = executions.length;
        const successfulRuns = executions.filter(exec => exec.status === 'pass').length;
        const successRate = workflowRuns > 0 ? successfulRuns / workflowRuns : 0;
        const durations = executions.filter(exec => exec.duration).map(exec => exec.duration);
        const averageDuration = durations.length > 0 ?
            durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;
        // Analyze failure reasons
        const failedExecutions = executions.filter(exec => exec.status === 'fail');
        const failureReasons = this.analyzeFailureReasons(failedExecutions);
        // Generate trends
        const trends = this.generateCITrends(executions, range);
        return {
            workflowRuns,
            successRate,
            averageDuration,
            failureReasons,
            trends
        };
    }
    // Private helper methods
    generateBadgeSVG(label, message, color, style) {
        // Simple SVG badge generation - in production would use a proper badge library
        const labelWidth = label.length * 7 + 10;
        const messageWidth = message.length * 7 + 10;
        const totalWidth = labelWidth + messageWidth;
        return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
        <g shape-rendering="crispEdges">
          <rect x="0" y="0" width="${labelWidth}" height="20" fill="#555"/>
          <rect x="${labelWidth}" y="0" width="${messageWidth}" height="20" fill="${color}"/>
        </g>
        <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
          <text x="${labelWidth / 2}" y="14">${label}</text>
          <text x="${labelWidth + messageWidth / 2}" y="14">${message}</text>
        </g>
      </svg>
    `.trim();
    }
    generateBadgeURL(label, message, color, config) {
        const encodedLabel = encodeURIComponent(label);
        const encodedMessage = encodeURIComponent(message);
        const encodedColor = encodeURIComponent(color);
        return `https://img.shields.io/badge/${encodedLabel}-${encodedMessage}-${encodedColor}?style=${config.style}`;
    }
    generateExecutiveSummary(summary) {
        return `
## Executive Summary

**Test Suite Performance Overview**

- **Total Tests Executed**: ${summary.totalTests}
- **Total Executions**: ${summary.totalExecutions}
- **Success Rate**: ${(summary.successRate * 100).toFixed(1)}%
- **Average Coverage**: ${(summary.averageCoverage * 100).toFixed(1)}%
- **Flakiness Score**: ${(summary.flakinessScore * 100).toFixed(1)}%
- **Performance Trend**: ${summary.performanceTrend}

**Key Insights**:
${summary.keyInsights.map((insight) => `- ${insight}`).join('\n')}
    `.trim();
    }
    generateExecutionTrendsSection(executions) {
        const dailyStats = this.groupExecutionsByDay(executions);
        return `
## Test Execution Trends

**Daily Execution Summary**:

${Object.entries(dailyStats).map(([date, stats]) => `- **${date}**: ${stats.total} executions (${(stats.successRate * 100).toFixed(1)}% success rate)`).join('\n')}

**Trends**:
- Peak execution day: ${this.findPeakExecutionDay(dailyStats)}
- Average daily executions: ${this.calculateAverageDailyExecutions(dailyStats)}
- Most stable day: ${this.findMostStableDay(dailyStats)}
    `.trim();
    }
    generateCoverageSection(executions) {
        const coverageExecutions = executions.filter(exec => exec.coverage);
        if (coverageExecutions.length === 0) {
            return '## Coverage Analysis\n\nNo coverage data available for this period.';
        }
        const avgCoverage = coverageExecutions.reduce((sum, exec) => sum + exec.coverage.overall, 0) / coverageExecutions.length;
        const minCoverage = Math.min(...coverageExecutions.map(exec => exec.coverage.overall));
        const maxCoverage = Math.max(...coverageExecutions.map(exec => exec.coverage.overall));
        return `
## Coverage Analysis

**Coverage Statistics**:
- **Average Coverage**: ${(avgCoverage * 100).toFixed(1)}%
- **Minimum Coverage**: ${(minCoverage * 100).toFixed(1)}%
- **Maximum Coverage**: ${(maxCoverage * 100).toFixed(1)}%
- **Coverage Variance**: ${((maxCoverage - minCoverage) * 100).toFixed(1)}%

**Coverage Recommendations**:
${avgCoverage < 0.7 ? '- Increase overall test coverage to reach 70% minimum threshold' : ''}
${(maxCoverage - minCoverage) > 0.3 ? '- Investigate coverage inconsistencies between test runs' : ''}
${avgCoverage >= 0.9 ? '- Excellent coverage maintained!' : ''}
    `.trim();
    }
    generateFlakinessSection(events, executions) {
        const flakinessEvents = events.filter(event => event.type === 'flakiness_detected');
        const uniqueFlakyTests = new Set(flakinessEvents.map(event => event.testId));
        return `
## Flakiness Report

**Flakiness Summary**:
- **Flaky Test Events**: ${flakinessEvents.length}
- **Unique Flaky Tests**: ${uniqueFlakyTests.size}
- **Flakiness Rate**: ${uniqueFlakyTests.size > 0 ? ((uniqueFlakyTests.size / new Set(executions.map(exec => exec.testId)).size) * 100).toFixed(1) : '0'}%

**Top Flaky Tests**:
${Array.from(uniqueFlakyTests).slice(0, 5).map(testId => `- ${testId} (${flakinessEvents.filter(e => e.testId === testId).length} events)`).join('\n')}

**Flakiness Recommendations**:
- Investigate and fix tests with high flakiness scores
- Improve test isolation and cleanup
- Review test environment stability
    `.trim();
    }
    generatePerformanceSection(events, executions) {
        const performanceEvents = events.filter(event => event.type === 'performance_regression');
        const improvementEvents = events.filter(event => event.type === 'performance_improvement');
        const durations = executions.filter(exec => exec.duration).map(exec => exec.duration);
        const avgDuration = durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;
        return `
## Performance Analysis

**Performance Summary**:
- **Performance Regressions**: ${performanceEvents.length}
- **Performance Improvements**: ${improvementEvents.length}
- **Average Execution Time**: ${avgDuration.toFixed(0)}ms
- **Performance Trend**: ${performanceEvents.length > improvementEvents.length ? 'Degrading' : performanceEvents.length < improvementEvents.length ? 'Improving' : 'Stable'}

**Performance Events**:
${performanceEvents.slice(0, 3).map(event => `- **Regression**: ${event.testId} - ${event.description}`).join('\n')}

${improvementEvents.slice(0, 3).map(event => `- **Improvement**: ${event.testId} - ${event.description}`).join('\n')}

**Performance Recommendations**:
${performanceEvents.length > 0 ? '- Address performance regressions to maintain test execution speed' : ''}
${avgDuration > 30000 ? '- Optimize slow-running tests' : ''}
${avgDuration < 5000 ? '- Excellent test performance maintained!' : ''}
    `.trim();
    }
    generateMarkdownReport(sections) {
        return sections.map(section => `${section.content}\n`).join('\n');
    }
    generateHTMLReport(sections) {
        const htmlSections = sections.map(section => {
            const htmlContent = section.content
                .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
                .replace(/^\*\*(.+)\*\*:/gm, '<strong>$1</strong>:')
                .replace(/^-\s+(.+)$/gm, '<li>$1</li>')
                .replace(/\n/g, '<br>');
            return `<section>${htmlContent}</section>`;
        }).join('\n');
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Test Trend Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h2 { color: #333; border-bottom: 2px solid #ccc; }
        section { margin-bottom: 30px; }
        strong { color: #666; }
        li { margin-bottom: 5px; }
    </style>
</head>
<body>
    ${htmlSections}
</body>
</html>
    `.trim();
    }
    prepareExecutionChartData(executions) {
        const dailyStats = this.groupExecutionsByDay(executions);
        return {
            labels: Object.keys(dailyStats),
            datasets: [
                {
                    label: 'Total Executions',
                    data: Object.values(dailyStats).map((stats) => stats.total),
                    borderColor: '#4c1',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)'
                },
                {
                    label: 'Failed Executions',
                    data: Object.values(dailyStats).map((stats) => stats.failed),
                    borderColor: '#e05d44',
                    backgroundColor: 'rgba(224, 93, 68, 0.1)'
                }
            ]
        };
    }
    prepareCoverageChartData(executions) {
        const dailyStats = this.groupExecutionsByDay(executions);
        return {
            labels: Object.keys(dailyStats),
            datasets: [
                {
                    label: 'Average Coverage',
                    data: Object.values(dailyStats).map((stats) => stats.avgCoverage * 100),
                    borderColor: '#97ca00',
                    backgroundColor: 'rgba(151, 202, 0, 0.2)',
                    fill: true
                }
            ]
        };
    }
    groupExecutionsByDay(executions) {
        const dailyStats = {};
        for (const execution of executions) {
            const date = execution.timestamp.toISOString().split('T')[0];
            if (!dailyStats[date]) {
                dailyStats[date] = {
                    total: 0,
                    passed: 0,
                    failed: 0,
                    coverageSum: 0,
                    coverageCount: 0,
                    successRate: 0,
                    avgCoverage: 0
                };
            }
            dailyStats[date].total++;
            if (execution.status === 'pass') {
                dailyStats[date].passed++;
            }
            else if (execution.status === 'fail') {
                dailyStats[date].failed++;
            }
            if (execution.coverage) {
                dailyStats[date].coverageSum += execution.coverage.overall;
                dailyStats[date].coverageCount++;
            }
        }
        // Calculate derived statistics
        for (const stats of Object.values(dailyStats)) {
            stats.successRate = stats.total > 0 ? stats.passed / stats.total : 0;
            stats.avgCoverage = stats.coverageCount > 0 ? stats.coverageSum / stats.coverageCount : 0;
        }
        return dailyStats;
    }
    findPeakExecutionDay(dailyStats) {
        let peakDay = '';
        let peakCount = 0;
        for (const [date, stats] of Object.entries(dailyStats)) {
            if (stats.total > peakCount) {
                peakCount = stats.total;
                peakDay = date;
            }
        }
        return `${peakDay} (${peakCount} executions)`;
    }
    calculateAverageDailyExecutions(dailyStats) {
        const totalExecutions = Object.values(dailyStats).reduce((sum, stats) => sum + stats.total, 0);
        const days = Object.keys(dailyStats).length;
        const average = days > 0 ? totalExecutions / days : 0;
        return average.toFixed(1);
    }
    findMostStableDay(dailyStats) {
        let mostStableDay = '';
        let highestSuccessRate = 0;
        for (const [date, stats] of Object.entries(dailyStats)) {
            if (stats.successRate > highestSuccessRate) {
                highestSuccessRate = stats.successRate;
                mostStableDay = date;
            }
        }
        return `${mostStableDay} (${(highestSuccessRate * 100).toFixed(1)}% success rate)`;
    }
    getAffectedTests(executions) {
        const testCounts = new Map();
        for (const execution of executions) {
            const key = execution.testId;
            if (!testCounts.has(key)) {
                testCounts.set(key, { count: 0, entityId: execution.entityId });
            }
            testCounts.get(key).count++;
        }
        return Array.from(testCounts.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10)
            .map(([testId, data]) => ({
            testId,
            entityId: data.entityId,
            impact: `${data.count} failures`
        }));
    }
    applyRateLimits(alerts, rateLimits) {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        // Count recent alerts
        let recentAlertCount = 0;
        for (const alertList of this.alertHistory.values()) {
            recentAlertCount += alertList.filter(alert => alert.timestamp >= oneHourAgo).length;
        }
        // Apply limits
        const remainingQuota = Math.max(0, rateLimits.maxAlertsPerHour - recentAlertCount);
        return alerts.slice(0, remainingQuota);
    }
    async sendAlertToChannel(alert, channel) {
        const message = this.formatAlertMessage(alert, channel.type);
        switch (channel.type) {
            case 'slack':
                // Would send to Slack webhook
                console.log(`Slack alert: ${message}`);
                break;
            case 'email':
                // Would send email
                console.log(`Email alert to ${channel.endpoint}: ${message}`);
                break;
            case 'webhook':
                // Would POST to webhook
                console.log(`Webhook alert to ${channel.endpoint}: ${message}`);
                break;
            case 'github_issue':
                // Would create GitHub issue
                console.log(`GitHub issue: ${message}`);
                break;
        }
    }
    formatAlertMessage(alert, channelType) {
        switch (channelType) {
            case 'slack':
                return `🚨 *${alert.type.replace('_', ' ').toUpperCase()}*\n${alert.message}\n\nAffected tests: ${alert.affectedTests.length}\nSeverity: ${alert.severity}`;
            case 'email':
                return `Subject: Test Alert - ${alert.type}\n\n${alert.message}\n\nDetails:\n${JSON.stringify(alert.details, null, 2)}`;
            default:
                return alert.message;
        }
    }
    generateWorkflowYAML(workflow) {
        return `
name: ${workflow.name}

on:
${workflow.triggers.map(trigger => `  ${trigger.event}:`).join('\n')}

jobs:
  test-temporal-tracking:
    runs-on: ubuntu-latest

    steps:
${workflow.steps.map(step => `    - name: ${step.name}\n      ${step.action}\n      with:\n${Object.entries(step.parameters).map(([key, value]) => `        ${key}: ${value}`).join('\n')}`).join('\n\n')}
    `.trim();
    }
    analyzeFailureReasons(failedExecutions) {
        // In a real implementation, this would analyze error messages and categorize failures
        const reasons = [
            { reason: 'Assertion Failure', count: Math.floor(failedExecutions.length * 0.4), percentage: 40 },
            { reason: 'Timeout', count: Math.floor(failedExecutions.length * 0.3), percentage: 30 },
            { reason: 'Environment Issue', count: Math.floor(failedExecutions.length * 0.2), percentage: 20 },
            { reason: 'Other', count: Math.floor(failedExecutions.length * 0.1), percentage: 10 }
        ];
        return reasons.filter(reason => reason.count > 0);
    }
    generateCITrends(executions, range) {
        const dailyStats = this.groupExecutionsByDay(executions);
        return {
            successRate: Object.entries(dailyStats).map(([date, stats]) => ({
                timestamp: new Date(date),
                value: stats.successRate
            })),
            averageDuration: Object.entries(dailyStats).map(([date, stats]) => ({
                timestamp: new Date(date),
                value: stats.avgDuration || 0
            })),
            coverage: Object.entries(dailyStats).map(([date, stats]) => ({
                timestamp: new Date(date),
                value: stats.avgCoverage
            }))
        };
    }
    /**
     * Update internal data stores
     */
    updateExecutionData(key, executions) {
        this.executionData.set(key, executions);
    }
    updateEventData(key, events) {
        this.eventData.set(key, events);
    }
    updateRelationshipData(key, relationships) {
        this.relationshipData.set(key, relationships);
    }
}
//# sourceMappingURL=TestCIIntegration.js.map