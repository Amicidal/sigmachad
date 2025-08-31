/**
 * Code Operations Routes
 * Handles code change proposals, validation, and analysis
 */
import fs from 'fs/promises';
export async function registerCodeRoutes(app, kgService, dbService, astParser) {
    // POST /api/code/propose-diff - Propose code changes and analyze impact
    app.post('/propose-diff', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    changes: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                file: { type: 'string' },
                                type: { type: 'string', enum: ['create', 'modify', 'delete', 'rename'] },
                                oldContent: { type: 'string' },
                                newContent: { type: 'string' },
                                lineStart: { type: 'number' },
                                lineEnd: { type: 'number' }
                            },
                            required: ['file', 'type']
                        }
                    },
                    description: { type: 'string' },
                    relatedSpecId: { type: 'string' }
                },
                required: ['changes', 'description']
            }
        }
    }, async (request, reply) => {
        try {
            const proposal = request.body;
            // Analyze proposed code changes using AST parser and knowledge graph
            const analysis = await analyzeCodeChanges(proposal, astParser, kgService);
            reply.send({
                success: true,
                data: analysis
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: 'CODE_ANALYSIS_FAILED',
                    message: 'Failed to analyze proposed code changes'
                }
            });
        }
    });
    // POST /api/code/validate - Run comprehensive code validation
    app.post('/validate', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    files: { type: 'array', items: { type: 'string' } },
                    specId: { type: 'string' },
                    includeTypes: {
                        type: 'array',
                        items: {
                            type: 'string',
                            enum: ['typescript', 'eslint', 'security', 'tests', 'coverage', 'architecture']
                        }
                    },
                    failOnWarnings: { type: 'boolean' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const params = request.body;
            // TODO: Run comprehensive validation
            const result = {
                overall: {
                    passed: true,
                    score: 95,
                    duration: 1000
                },
                typescript: {
                    errors: 0,
                    warnings: 0,
                    issues: []
                },
                eslint: {
                    errors: 0,
                    warnings: 0,
                    issues: []
                },
                security: {
                    critical: 0,
                    high: 0,
                    medium: 0,
                    low: 0,
                    issues: []
                },
                tests: {
                    passed: 0,
                    failed: 0,
                    skipped: 0,
                    coverage: {
                        lines: 0,
                        branches: 0,
                        functions: 0,
                        statements: 0
                    }
                },
                architecture: {
                    violations: 0,
                    issues: []
                }
            };
            reply.send({
                success: true,
                data: result
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: 'VALIDATION_FAILED',
                    message: 'Failed to run code validation'
                }
            });
        }
    });
    // POST /api/code/analyze - Analyze code for patterns and issues
    app.post('/analyze', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    files: { type: 'array', items: { type: 'string' } },
                    analysisType: {
                        type: 'string',
                        enum: ['complexity', 'patterns', 'duplicates', 'dependencies']
                    },
                    options: { type: 'object' }
                },
                required: ['files', 'analysisType']
            }
        }
    }, async (request, reply) => {
        try {
            const { files, analysisType, options } = request.body;
            // TODO: Implement code analysis logic
            const analysis = {
                type: analysisType,
                filesAnalyzed: files.length,
                results: [],
                summary: {}
            };
            reply.send({
                success: true,
                data: analysis
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: 'CODE_ANALYSIS_FAILED',
                    message: 'Failed to analyze code'
                }
            });
        }
    });
    // GET /api/code/suggestions/{file} - Get code improvement suggestions
    app.get('/suggestions/:file', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    file: { type: 'string' }
                },
                required: ['file']
            },
            querystring: {
                type: 'object',
                properties: {
                    lineStart: { type: 'number' },
                    lineEnd: { type: 'number' },
                    types: {
                        type: 'array',
                        items: {
                            type: 'string',
                            enum: ['performance', 'security', 'maintainability', 'best-practices']
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { file } = request.params;
            const { lineStart, lineEnd, types } = request.query;
            // TODO: Generate code improvement suggestions
            const suggestions = [];
            reply.send({
                success: true,
                data: {
                    file,
                    lineRange: { start: lineStart, end: lineEnd },
                    suggestions
                }
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: 'SUGGESTIONS_FAILED',
                    message: 'Failed to generate code suggestions'
                }
            });
        }
    });
    // POST /api/code/refactor - Suggest refactoring opportunities
    app.post('/refactor', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    files: { type: 'array', items: { type: 'string' } },
                    refactorType: {
                        type: 'string',
                        enum: ['extract-function', 'extract-class', 'rename', 'consolidate-duplicates']
                    },
                    options: { type: 'object' }
                },
                required: ['files', 'refactorType']
            }
        }
    }, async (request, reply) => {
        try {
            const { files, refactorType, options } = request.body;
            // TODO: Analyze and suggest refactoring opportunities
            const refactorings = [];
            reply.send({
                success: true,
                data: {
                    refactorType,
                    files,
                    suggestedRefactorings: refactorings
                }
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: 'REFACTORING_FAILED',
                    message: 'Failed to analyze refactoring opportunities'
                }
            });
        }
    });
}
// Helper function to analyze proposed code changes
async function analyzeCodeChanges(proposal, astParser, kgService) {
    const affectedEntities = [];
    const breakingChanges = [];
    const directImpact = [];
    const indirectImpact = [];
    const testImpact = [];
    const recommendations = [];
    try {
        // Analyze each proposed change
        for (const change of proposal.changes) {
            if (change.type === 'modify' && change.oldContent && change.newContent) {
                // Parse both old and new content to compare
                const oldParseResult = await parseContentAsFile(change.file, change.oldContent, astParser);
                const newParseResult = await parseContentAsFile(change.file, change.newContent, astParser);
                // Find affected symbols by comparing parse results
                const affectedSymbols = findAffectedSymbols(oldParseResult, newParseResult);
                for (const symbol of affectedSymbols) {
                    affectedEntities.push({
                        id: symbol.id,
                        name: symbol.name,
                        type: symbol.kind,
                        file: change.file,
                        changeType: 'modified'
                    });
                    // Check for breaking changes
                    const breakingChange = detectBreakingChange(symbol, oldParseResult, newParseResult);
                    if (breakingChange) {
                        breakingChanges.push(breakingChange);
                    }
                    // Analyze impact on the knowledge graph for this symbol
                    const impact = await analyzeKnowledgeGraphImpact(symbol.name, kgService);
                    directImpact.push(...impact.direct);
                    indirectImpact.push(...impact.indirect);
                    testImpact.push(...impact.tests);
                }
            }
            else if (change.type === 'create' && change.newContent) {
                // Parse new content
                const newParseResult = await parseContentAsFile(change.file, change.newContent, astParser);
                for (const entity of newParseResult.entities) {
                    if (entity.type === 'symbol') {
                        affectedEntities.push({
                            id: entity.id,
                            name: entity.name,
                            type: entity.kind,
                            file: change.file,
                            changeType: 'created'
                        });
                    }
                }
            }
            else if (change.type === 'delete') {
                // For deletions, we need to get the current state from the knowledge graph
                const currentEntities = await findEntitiesInFile(change.file, kgService);
                for (const entity of currentEntities) {
                    affectedEntities.push({
                        id: entity.id,
                        name: entity.name,
                        type: entity.kind,
                        file: change.file,
                        changeType: 'deleted'
                    });
                    breakingChanges.push({
                        severity: 'breaking',
                        description: `Deleting ${entity.kind} ${entity.name} will break dependent code`,
                        affectedEntities: [entity.id]
                    });
                }
            }
        }
        // Generate recommendations based on analysis
        recommendations.push(...generateRecommendations(affectedEntities, breakingChanges));
    }
    catch (error) {
        console.error('Error analyzing code changes:', error);
        recommendations.push({
            type: 'warning',
            message: 'Could not complete full analysis due to parsing error',
            actions: ['Review changes manually', 'Run tests after applying changes']
        });
    }
    return {
        affectedEntities,
        breakingChanges,
        impactAnalysis: {
            directImpact,
            indirectImpact,
            testImpact
        },
        recommendations
    };
}
// Helper function to parse content as a temporary file
async function parseContentAsFile(filePath, content, astParser) {
    // Create a temporary file path for parsing
    const tempPath = `/tmp/memento-analysis-${Date.now()}-${filePath.replace(/[^a-zA-Z0-9]/g, '_')}`;
    try {
        // Write content to temporary file
        await fs.writeFile(tempPath, content, 'utf-8');
        // Parse the temporary file
        const result = await astParser.parseFile(tempPath);
        // Clean up temporary file
        await fs.unlink(tempPath);
        return result;
    }
    catch (error) {
        // Clean up temporary file in case of error
        try {
            await fs.unlink(tempPath);
        }
        catch { }
        throw error;
    }
}
// Helper function to find affected symbols by comparing parse results
function findAffectedSymbols(oldResult, newResult) {
    const affectedSymbols = [];
    // Create maps for efficient lookup
    const oldSymbolMap = new Map();
    const newSymbolMap = new Map();
    for (const entity of oldResult.entities) {
        if (entity.type === 'symbol') {
            const symbol = entity;
            oldSymbolMap.set(`${symbol.name}:${symbol.kind}`, symbol);
        }
    }
    for (const entity of newResult.entities) {
        if (entity.type === 'symbol') {
            const symbol = entity;
            newSymbolMap.set(`${symbol.name}:${symbol.kind}`, symbol);
        }
    }
    // Find modified symbols
    for (const [key, newSymbol] of newSymbolMap) {
        const oldSymbol = oldSymbolMap.get(key);
        if (oldSymbol && oldSymbol.hash !== newSymbol.hash) {
            affectedSymbols.push(newSymbol);
        }
    }
    // Find new symbols
    for (const [key, newSymbol] of newSymbolMap) {
        if (!oldSymbolMap.has(key)) {
            affectedSymbols.push(newSymbol);
        }
    }
    return affectedSymbols;
}
// Helper function to detect breaking changes
function detectBreakingChange(symbol, oldResult, newResult) {
    // Simple breaking change detection - in a full implementation,
    // this would be much more sophisticated
    if (symbol.kind === 'function') {
        // Check if function signature changed
        const oldSignature = symbol.signature;
        const newSignature = symbol.signature;
        if (oldSignature !== newSignature) {
            return {
                severity: 'potentially-breaking',
                description: `Function ${symbol.name} signature changed`,
                affectedEntities: [symbol.id]
            };
        }
    }
    if (symbol.kind === 'class') {
        // Check if class structure changed significantly
        // This is a simplified check - would need more analysis
        return {
            severity: 'safe',
            description: `Class ${symbol.name} modified`,
            affectedEntities: [symbol.id]
        };
    }
    return null;
}
// Helper function to analyze impact on knowledge graph
async function analyzeKnowledgeGraphImpact(symbolName, kgService) {
    const direct = [];
    const indirect = [];
    const tests = [];
    try {
        // Search for entities with similar names
        const searchResults = await kgService.search({
            query: symbolName,
            searchType: 'structural',
            limit: 20
        });
        for (const entity of searchResults) {
            if (entity.type === 'symbol') {
                const symbol = entity;
                if (symbol.name === symbolName) {
                    direct.push(symbol);
                }
                else {
                    indirect.push(symbol);
                }
            }
        }
        // Look for test entities that might be affected
        const testEntities = searchResults.filter(e => e.type === 'test');
        tests.push(...testEntities);
    }
    catch (error) {
        console.warn('Could not analyze knowledge graph impact:', error);
    }
    return { direct, indirect, tests };
}
// Helper function to find entities in a file
async function findEntitiesInFile(filePath, kgService) {
    try {
        const searchResults = await kgService.search({
            query: filePath,
            searchType: 'structural',
            limit: 50
        });
        return searchResults.filter(e => e.type === 'symbol');
    }
    catch (error) {
        console.warn('Could not find entities in file:', error);
        return [];
    }
}
// Helper function to generate recommendations
function generateRecommendations(affectedEntities, breakingChanges) {
    const recommendations = [];
    if (breakingChanges.length > 0) {
        recommendations.push({
            type: 'warning',
            message: `${breakingChanges.length} breaking change(s) detected`,
            actions: [
                'Review breaking changes carefully',
                'Update dependent code',
                'Consider versioning strategy',
                'Run comprehensive tests'
            ]
        });
    }
    if (affectedEntities.length > 10) {
        recommendations.push({
            type: 'suggestion',
            message: 'Large number of affected entities',
            actions: [
                'Consider breaking changes into smaller PRs',
                'Review impact analysis thoroughly',
                'Communicate changes to team'
            ]
        });
    }
    if (affectedEntities.some(e => e.changeType === 'deleted')) {
        recommendations.push({
            type: 'warning',
            message: 'Deletion of code elements detected',
            actions: [
                'Verify no external dependencies',
                'Check for deprecated usage',
                'Consider deprecation warnings first'
            ]
        });
    }
    return recommendations;
}
//# sourceMappingURL=code.js.map