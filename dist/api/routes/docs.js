/**
 * Documentation Operations Routes
 * Handles documentation synchronization, domain analysis, and content management
 */
import { RelationshipType } from '../../models/relationships.js';
import { noiseConfig } from '../../config/noise.js';
export async function registerDocsRoutes(app, kgService, dbService, docParser) {
    // POST /docs/sync - Synchronize documentation with knowledge graph
    const syncRouteOptions = {
        schema: {
            body: {
                type: 'object',
                properties: {
                    docsPath: { type: 'string' }
                },
                required: ['docsPath']
            }
        }
    };
    const syncHandler = async (request, reply) => {
        try {
            const { docsPath } = request.body;
            const result = await docParser.syncDocumentation(docsPath);
            // After documents are synced, link code symbols to spec-like docs with stricter rules
            try {
                const docs = await kgService.findEntitiesByType('documentation');
                const symbols = await kgService.findEntitiesByType('symbol');
                const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                // Pre-bucket symbols by kind and export status for efficiency
                const byKind = new Map();
                for (const s of symbols) {
                    const kind = String(s.kind || '').toLowerCase();
                    const list = byKind.get(kind) || [];
                    list.push(s);
                    byKind.set(kind, list);
                }
                const pickSymbols = (docType) => {
                    const t = String(docType || '').toLowerCase();
                    let kinds = [];
                    switch (t) {
                        case 'api-docs':
                            kinds = ['function'];
                            break;
                        case 'design-doc':
                        case 'architecture':
                            kinds = ['class', 'interface'];
                            break;
                        default:
                            kinds = ['function'];
                            break;
                    }
                    const out = [];
                    for (const k of kinds) {
                        const list = (byKind.get(k) || [])
                            .filter((s) => s && s.name && String(s.name).length >= 4)
                            // Reduce noise: only consider exported symbols for all kinds
                            .filter((s) => s.isExported === true);
                        out.push(...list);
                    }
                    return out;
                };
                let created = 0;
                let pruned = 0;
                for (const doc of docs) {
                    const docType = doc.docType || '';
                    const isSpec = ["design-doc", "api-docs", "architecture"].includes(String(docType));
                    if (!isSpec)
                        continue;
                    const content = String(doc.content || '');
                    const allowed = pickSymbols(docType);
                    // Create bounded matches using word boundaries; require stronger evidence
                    // Pre-scan content for heading lines to boost confidence
                    const lines = content.split(/\r?\n/);
                    const headingText = lines.filter(l => /^\s*#/.test(l)).join('\n');
                    for (const sym of allowed) {
                        const name = String(sym.name || '');
                        if (!name || name.length < 4)
                            continue;
                        const re = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'gi');
                        const matches = content.match(re);
                        const count = matches ? matches.length : 0;
                        const strongName = name.length >= noiseConfig.DOC_LINK_LONG_NAME;
                        if (count >= noiseConfig.DOC_LINK_MIN_OCCURRENCES || strongName) {
                            // Base + step*occurrences, configurable; boost if mentioned in headings
                            const base = noiseConfig.DOC_LINK_BASE_CONF;
                            const step = noiseConfig.DOC_LINK_STEP_CONF;
                            let confidence = strongName ? noiseConfig.DOC_LINK_STRONG_NAME_CONF : Math.min(1, base + step * Math.min(count, 5));
                            if (headingText && new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i').test(headingText)) {
                                confidence = Math.min(1, confidence + 0.1);
                            }
                            await kgService.createRelationship({
                                id: `rel_${sym.id}_${doc.id}_IMPLEMENTS_SPEC`,
                                fromEntityId: sym.id,
                                toEntityId: doc.id,
                                type: RelationshipType.IMPLEMENTS_SPEC,
                                created: new Date(),
                                lastModified: new Date(),
                                version: 1,
                                metadata: { method: 'regex_word_boundary', occurrences: count, docType, inferred: true, confidence }
                            });
                            created++;
                        }
                    }
                    // Prune existing IMPLEMENTS_SPEC that do not meet new constraints
                    try {
                        const rels = await kgService.getRelationships({ toEntityId: doc.id, type: RelationshipType.IMPLEMENTS_SPEC, limit: 10000 });
                        const allowedIds = new Set(allowed.map((s) => s.id));
                        for (const r of rels) {
                            if (!allowedIds.has(r.fromEntityId)) {
                                await kgService.deleteRelationship(r.id);
                                pruned++;
                            }
                        }
                    }
                    catch (_a) { }
                }
                result.createdImplementsSpec = created;
                result.prunedImplementsSpec = pruned;
            }
            catch (_b) { }
            reply.send({
                success: true,
                data: result
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: 'SYNC_FAILED',
                    message: 'Failed to synchronize documentation',
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    };
    app.post('/docs/sync', syncRouteOptions, syncHandler);
    // Also register an alias path used in some tests
    app.post('/docs/docs/sync', syncRouteOptions, syncHandler);
    // GET /docs/:id - Fetch a documentation record by ID
    app.get('/docs/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const doc = await kgService.getEntity(id);
            if (!doc) {
                reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
                return;
            }
            reply.send({ success: true, data: doc });
        }
        catch (error) {
            reply.status(500).send({ success: false, error: { code: 'DOCS_FETCH_FAILED', message: 'Failed to fetch doc' } });
        }
    });
    // GET /api/domains - Get all business domains
    app.get('/docs/domains', async (request, reply) => {
        try {
            const domains = await kgService.search({
                query: '',
                searchType: 'structural',
                entityTypes: ['businessDomain']
            });
            reply.send({
                success: true,
                data: domains
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: 'DOMAINS_FAILED',
                    message: 'Failed to retrieve business domains',
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    });
    // GET /api/domains/{domainName}/entities - Get entities by domain
    app.get('/docs/domains/:domainName/entities', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    domainName: { type: 'string' }
                },
                required: ['domainName']
            }
        }
    }, async (request, reply) => {
        try {
            const { domainName } = request.params;
            // Find documentation nodes that belong to this domain
            const docs = await kgService.search({
                query: '',
                searchType: 'structural',
                entityTypes: ['documentation']
            });
            const domainEntities = docs.filter((doc) => {
                var _a;
                return (_a = doc.businessDomains) === null || _a === void 0 ? void 0 : _a.some((domain) => domain.toLowerCase().includes(domainName.toLowerCase()));
            });
            reply.send({
                success: true,
                data: domainEntities
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: 'DOMAIN_ENTITIES_FAILED',
                    message: 'Failed to retrieve domain entities',
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    });
    // GET /api/clusters - Get semantic clusters
    app.get('/docs/clusters', async (request, reply) => {
        try {
            const clusters = await kgService.search({
                query: '',
                searchType: 'structural',
                entityTypes: ['semanticCluster']
            });
            reply.send({
                success: true,
                data: clusters
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: 'CLUSTERS_FAILED',
                    message: 'Failed to retrieve semantic clusters',
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    });
    // GET /api/business/impact/{domainName} - Get business impact
    app.get('/docs/business/impact/:domainName', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    domainName: { type: 'string' }
                },
                required: ['domainName']
            },
            querystring: {
                type: 'object',
                properties: {
                    since: { type: 'string', format: 'date-time' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { domainName } = request.params;
            const { since } = request.query;
            // Find all documentation entities for this domain
            const docs = await kgService.search({
                query: '',
                searchType: 'structural',
                entityTypes: ['documentation']
            });
            const domainDocs = docs.filter((doc) => {
                var _a;
                return (_a = doc.businessDomains) === null || _a === void 0 ? void 0 : _a.some((domain) => domain.toLowerCase().includes(domainName.toLowerCase()));
            });
            // Calculate basic impact metrics
            const changeVelocity = domainDocs.length;
            const affectedCapabilities = domainDocs.map((doc) => doc.title);
            const riskLevel = changeVelocity > 5 ? 'high' : changeVelocity > 2 ? 'medium' : 'low';
            const impact = {
                domainName,
                timeRange: { since: since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
                changeVelocity,
                riskLevel,
                affectedCapabilities,
                mitigationStrategies: [
                    'Regular documentation reviews',
                    'Automated testing for critical paths',
                    'Stakeholder communication protocols'
                ]
            };
            reply.send({
                success: true,
                data: impact
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: 'BUSINESS_IMPACT_FAILED',
                    message: 'Failed to analyze business impact',
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    });
    // POST /api/docs/parse - Parse documentation file
    app.post('/docs/parse', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    content: { type: 'string' },
                    format: { type: 'string', enum: ['markdown', 'plaintext', 'html'] },
                    extractEntities: { type: 'boolean', default: true },
                    extractDomains: { type: 'boolean', default: true }
                },
                required: ['content']
            }
        }
    }, async (request, reply) => {
        try {
            const { content, format, extractEntities, extractDomains } = request.body;
            // Parse content directly based on format
            const parseMethod = format === 'markdown' ? 'parseMarkdown' :
                format === 'plaintext' ? 'parsePlaintext' :
                    'parseMarkdown'; // default to markdown
            // Use reflection to call the appropriate parse method
            const parsedDoc = await docParser[parseMethod](content);
            // Add metadata for the parsed content
            parsedDoc.metadata = {
                ...parsedDoc.metadata,
                format: format || 'markdown',
                contentLength: content.length,
                parsedAt: new Date()
            };
            const parsed = {
                title: parsedDoc.title,
                content: parsedDoc.content,
                format: format || 'markdown',
                entities: extractEntities ? parsedDoc.businessDomains : undefined,
                domains: extractDomains ? parsedDoc.businessDomains : undefined,
                stakeholders: parsedDoc.stakeholders,
                technologies: parsedDoc.technologies,
                metadata: parsedDoc.metadata
            };
            reply.send({
                success: true,
                data: parsed
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: 'PARSE_FAILED',
                    message: 'Failed to parse documentation',
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    });
    // GET /api/docs/search - Search documentation
    app.get('/docs/search', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    query: { type: 'string' },
                    domain: { type: 'string' },
                    type: { type: 'string', enum: ['readme', 'api-docs', 'design-doc', 'architecture', 'user-guide'] },
                    limit: { type: 'number', default: 20 }
                },
                required: ['query']
            }
        }
    }, async (request, reply) => {
        try {
            const { query, domain, type, limit } = request.query;
            const searchResults = await docParser.searchDocumentation(query, {
                domain,
                docType: type,
                limit
            });
            const results = {
                query,
                results: searchResults,
                total: searchResults.length
            };
            reply.send({
                success: true,
                data: results
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: 'SEARCH_FAILED',
                    message: 'Failed to search documentation',
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    });
    // POST /docs/validate - Validate documentation
    app.post('/docs/validate', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    files: { type: 'array', items: { type: 'string' } },
                    checks: {
                        type: 'array',
                        items: {
                            type: 'string',
                            enum: ['links', 'formatting', 'completeness', 'consistency']
                        }
                    }
                },
                required: ['files']
            }
        }
    }, async (request, reply) => {
        var _a;
        try {
            const { files, checks } = request.body;
            // Basic validation implementation
            const validationResults = [];
            let passed = 0;
            let failed = 0;
            for (const filePath of files) {
                try {
                    const parsedDoc = await docParser.parseFile(filePath);
                    const issues = [];
                    // Check for completeness
                    if (!parsedDoc.title || parsedDoc.title === 'Untitled Document') {
                        issues.push('Missing or generic title');
                    }
                    // Check for links if requested
                    if ((checks === null || checks === void 0 ? void 0 : checks.includes('links')) && ((_a = parsedDoc.metadata) === null || _a === void 0 ? void 0 : _a.links)) {
                        // Basic link validation could be implemented here
                    }
                    // Check formatting
                    if (checks === null || checks === void 0 ? void 0 : checks.includes('formatting')) {
                        if (parsedDoc.content.length < 100) {
                            issues.push('Content appears too short');
                        }
                    }
                    if (issues.length === 0) {
                        passed++;
                    }
                    else {
                        failed++;
                    }
                    validationResults.push({
                        file: filePath,
                        status: issues.length === 0 ? 'passed' : 'failed',
                        issues
                    });
                }
                catch (error) {
                    failed++;
                    validationResults.push({
                        file: filePath,
                        status: 'failed',
                        issues: [`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`]
                    });
                }
            }
            const validation = {
                files: files.length,
                passed,
                failed,
                issues: validationResults,
                summary: {
                    totalFiles: files.length,
                    passRate: files.length > 0 ? (passed / files.length) * 100 : 0,
                    checksPerformed: checks || []
                }
            };
            reply.send({
                success: true,
                data: validation
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                error: {
                    code: 'VALIDATION_FAILED',
                    message: 'Failed to validate documentation',
                    details: error instanceof Error ? error.message : 'Unknown error'
                }
            });
        }
    });
}
//# sourceMappingURL=docs.js.map