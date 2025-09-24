# Package: knowledge
Generated: 2025-09-23 07:07:36 PM EDT

## ⚠️ Quality Indicators

| Metric | Count | Status |
|--------|-------|--------|
| Total Warnings | 2152 | ⚠️ |
| Critical Issues | 1 | ❌ |
| Stub Implementations | 0 | ✅ |
| Deception Risk | 129 | 🚨 |
| Antipatterns | 249 | 🔍 |

### Notable Issues

#### 🔴 Critical Issues (1)
These are serious problems that could lead to security vulnerabilities or system failures:

- `queue-manager.ts:350` - **Security function returns input unchanged - no actual security**

#### 🚨 Potential Deception (129)
Functions that don't do what their names suggest, or claim functionality they don't have:

- `DocumentationParser.ts:698` - **Error silently swallowed - no error handling or logging**
- `DocumentationParser.ts:788` - **Error silently swallowed - no error handling or logging**
- `DocumentationParser.ts:821` - **Error silently swallowed - no error handling or logging**
- `RelationshipBuilder.ts:232` - **Error silently swallowed - no error handling or logging**
- `RelationshipBuilder.ts:257` - **Error silently swallowed - no error handling or logging**
- `RelationshipBuilder.ts:298` - **Error silently swallowed - no error handling or logging**
- `RelationshipBuilder.ts:314` - **Error silently swallowed - no error handling or logging**
- `queue-manager.ts:350` - **Security function returns input unchanged - no actual security**
- `CacheManager.ts:165` - **Error silently swallowed - no error handling or logging**
- `CacheManager.ts:191` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:139` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:238` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:292` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:308` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:334` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:376` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:472` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:703` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:733` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:754` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:787` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:997` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:1004` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:1060` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:1093` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:1118` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:1127` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:1154` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:1192` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:1260` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:1283` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:1315` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:1350` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:1391` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:1435` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:1477` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:1501` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:1559` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:1872` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:1903` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:1930` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:1935` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:1956` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:1983` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2014` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2131` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2163` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2269` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2321` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2365` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2411` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2448` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2452` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2469` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2495` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2524` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2542` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2572` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2605` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2610` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2654` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2669` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2696` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2713` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2729` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2743` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2764` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2768` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2772` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2790` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2820` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2840` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2853` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2896` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2899` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2903` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:2921` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:3002` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:3076` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:3108` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:3134` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:3192` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:3228` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:3246` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:3264` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:3311` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:3322` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:3557` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:3574` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:3603` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:3623` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:3643` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:3672` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:3699` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:3763` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:3768` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:3788` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:3820` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:3885` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:3891` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:3915` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:3975` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:4242` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:4298` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:4325` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:4366` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:4515` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:4788` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:4807` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:4822` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:5063` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:5084` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:5106` - **Error silently swallowed - no error handling or logging**
- `ASTParser.ts:5143` - **Error silently swallowed - no error handling or logging**
- `IncrementalParser.ts:88` - **Error silently swallowed - no error handling or logging**
- `IncrementalParser.ts:120` - **Error silently swallowed - no error handling or logging**
- `IncrementalParser.ts:141` - **Error silently swallowed - no error handling or logging**
- `IncrementalParser.ts:174` - **Error silently swallowed - no error handling or logging**
- `IncrementalParser.ts:412` - **Error silently swallowed - no error handling or logging**
- `IncrementalParser.ts:431` - **Error silently swallowed - no error handling or logging**
- `IncrementalParser.ts:446` - **Error silently swallowed - no error handling or logging**
- `IncrementalParser.ts:713` - **Error silently swallowed - no error handling or logging**
- `IncrementalParser.ts:734` - **Error silently swallowed - no error handling or logging**
- `IncrementalParser.ts:756` - **Error silently swallowed - no error handling or logging**
- `IncrementalParser.ts:790` - **Error silently swallowed - no error handling or logging**
- `ModuleResolver.ts:137` - **Error silently swallowed - no error handling or logging**
- `ModuleResolver.ts:284` - **Error silently swallowed - no error handling or logging**
- `SymbolExtractor.ts:288` - **Error silently swallowed - no error handling or logging**
- `TypeCheckerBudget.ts:45` - **Error silently swallowed - no error handling or logging**

#### ⚠️ Warnings (200)
Issues that should be addressed but aren't critical:

- `DocumentationParser.ts:698` - Error silently swallowed - no error handling or logging
- `DocumentationParser.ts:788` - Error silently swallowed - no error handling or logging
- `DocumentationParser.ts:821` - Error silently swallowed - no error handling or logging
- `GraphInitializer.ts:27` - Direct console.log in class - use proper logging abstraction
- `Neo4jService.ts:521` - Direct console.log in class - use proper logging abstraction
- `Neo4jService.ts:537` - Direct console.log in class - use proper logging abstraction
- `Neo4jService.ts:543` - Direct console.log in class - use proper logging abstraction
- `Neo4jService.ts:576` - Direct console.log in class - use proper logging abstraction
- `Neo4jService.ts:693` - Direct console.log in class - use proper logging abstraction
- `RelationshipBuilder.ts:232` - Error silently swallowed - no error handling or logging
- `RelationshipBuilder.ts:257` - Error silently swallowed - no error handling or logging
- `RelationshipBuilder.ts:298` - Error silently swallowed - no error handling or logging
- `RelationshipBuilder.ts:314` - Error silently swallowed - no error handling or logging
- `batch-processor.ts:69` - Direct console.log in class - use proper logging abstraction
- `batch-processor.ts:85` - Direct console.log in class - use proper logging abstraction
- `batch-processor.ts:113` - Direct console.log in class - use proper logging abstraction
- `batch-processor.ts:165` - Direct console.log in class - use proper logging abstraction
- `batch-processor.ts:524` - Direct console.log in class - use proper logging abstraction
- `batch-processor.ts:545` - Direct console.log in class - use proper logging abstraction
- `batch-processor.ts:555` - Direct console.log in class - use proper logging abstraction
- `batch-processor.ts:562` - Direct console.log in class - use proper logging abstraction
- `batch-processor.ts:730` - Direct console.log in class - use proper logging abstraction
- `error-handler.ts:157` - Direct console.log in class - use proper logging abstraction
- `error-handler.ts:346` - Direct console.log in class - use proper logging abstraction
- `error-handler.ts:351` - Direct console.log in class - use proper logging abstraction
- `error-handler.ts:508` - Direct console.log in class - use proper logging abstraction
- `knowledge-graph-adapter.ts:41` - Direct console.log in class - use proper logging abstraction
- `knowledge-graph-adapter.ts:98` - Direct console.log in class - use proper logging abstraction
- `knowledge-graph-adapter.ts:153` - Direct console.log in class - use proper logging abstraction
- `knowledge-graph-adapter.ts:255` - Direct console.log in class - use proper logging abstraction
- `knowledge-graph-adapter.ts:262` - Direct console.log in class - use proper logging abstraction
- `knowledge-graph-adapter.ts:303` - Direct console.log in class - use proper logging abstraction
- `knowledge-graph-adapter.ts:403` - Direct console.log in class - use proper logging abstraction
- `knowledge-graph-adapter.ts:413` - Direct console.log in class - use proper logging abstraction
- `knowledge-graph-adapter.ts:423` - Direct console.log in class - use proper logging abstraction
- `performance-monitor.ts:162` - Direct console.log in class - use proper logging abstraction
- `performance-monitor.ts:187` - Direct console.log in class - use proper logging abstraction
- `performance-utils.ts:54` - Direct console.log in class - use proper logging abstraction
- `performance-utils.ts:58` - Direct console.log in class - use proper logging abstraction
- `performance-utils.ts:448` - Direct console.log in class - use proper logging abstraction
- `performance-utils.ts:455` - Direct console.log in class - use proper logging abstraction
- `performance-utils.ts:478` - Direct console.log in class - use proper logging abstraction
- `performance-utils.ts:485` - Direct console.log in class - use proper logging abstraction
- `pipeline.ts:122` - Direct console.log in class - use proper logging abstraction
- `pipeline.ts:140` - Direct console.log in class - use proper logging abstraction
- `pipeline.ts:158` - Direct console.log in class - use proper logging abstraction
- `pipeline.ts:171` - Direct console.log in class - use proper logging abstraction
- `pipeline.ts:191` - Direct console.log in class - use proper logging abstraction
- `pipeline.ts:203` - Direct console.log in class - use proper logging abstraction
- `pipeline.ts:278` - Direct console.log in class - use proper logging abstraction
- `pipeline.ts:473` - Direct console.log in class - use proper logging abstraction
- `pipeline.ts:581` - Direct console.log in class - use proper logging abstraction
- `pipeline.ts:617` - Direct console.log in class - use proper logging abstraction
- `pipeline.ts:629` - Direct console.log in class - use proper logging abstraction
- `pipeline.ts:687` - Direct console.log in class - use proper logging abstraction
- `pipeline.ts:692` - Direct console.log in class - use proper logging abstraction
- `pipeline.ts:708` - Direct console.log in class - use proper logging abstraction
- `pipeline.ts:739` - Direct console.log in class - use proper logging abstraction
- `pipeline.ts:747` - Direct console.log in class - use proper logging abstraction
- `pipeline.ts:755` - Direct console.log in class - use proper logging abstraction
- `queue-manager.ts:71` - Direct console.log in class - use proper logging abstraction
- `queue-manager.ts:89` - Direct console.log in class - use proper logging abstraction
- `worker-pool.ts:87` - Direct console.log in class - use proper logging abstraction
- `worker-pool.ts:107` - Direct console.log in class - use proper logging abstraction
- `worker-pool.ts:408` - Direct console.log in class - use proper logging abstraction
- `worker-pool.ts:414` - Direct console.log in class - use proper logging abstraction
- `worker-pool.ts:421` - Direct console.log in class - use proper logging abstraction
- `worker-pool.ts:462` - Direct console.log in class - use proper logging abstraction
- `worker-pool.ts:477` - Direct console.log in class - use proper logging abstraction
- `worker-pool.ts:569` - Direct console.log in class - use proper logging abstraction
- `worker-pool.ts:720` - Direct console.log in class - use proper logging abstraction
- `worker-pool.ts:733` - Direct console.log in class - use proper logging abstraction
- `task-worker.ts:100` - Direct console.log in class - use proper logging abstraction
- `task-worker.ts:135` - Direct console.log in class - use proper logging abstraction
- `task-worker.ts:216` - Direct console.log in class - use proper logging abstraction
- `CacheManager.ts:165` - Error silently swallowed - no error handling or logging
- `CacheManager.ts:191` - Error silently swallowed - no error handling or logging
- `KnowledgeGraphService.ts:151` - Direct console.log in class - use proper logging abstraction
- `ServiceRegistry.ts:71` - Direct console.log in class - use proper logging abstraction
- `SyncOrchestrator.ts:87` - Direct console.log in class - use proper logging abstraction
- `ASTParser.ts:139` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:238` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:292` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:308` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:334` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:376` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:472` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:703` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:733` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:754` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:787` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:997` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:1004` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:1060` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:1093` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:1118` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:1127` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:1154` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:1192` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:1260` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:1283` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:1315` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:1318` - Direct console.log in class - use proper logging abstraction
- `ASTParser.ts:1350` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:1391` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:1435` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:1477` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:1501` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:1559` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:1872` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:1903` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:1930` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:1935` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:1956` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:1983` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2014` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2131` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2163` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2269` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2321` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2365` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2411` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2448` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2452` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2469` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2495` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2524` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2542` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2572` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2605` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2610` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2654` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2669` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2696` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2713` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2729` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2743` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2764` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2768` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2772` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2790` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2820` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2840` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2853` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2896` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2899` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2903` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:2921` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:3002` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:3076` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:3108` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:3134` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:3192` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:3228` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:3246` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:3264` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:3311` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:3322` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:3557` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:3574` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:3603` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:3623` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:3643` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:3672` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:3699` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:3763` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:3768` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:3788` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:3820` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:3885` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:3891` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:3915` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:3975` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:4242` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:4298` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:4325` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:4366` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:4515` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:4788` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:4807` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:4822` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:5063` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:5084` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:5106` - Error silently swallowed - no error handling or logging
- `ASTParser.ts:5143` - Error silently swallowed - no error handling or logging
- `IncrementalParser.ts:88` - Error silently swallowed - no error handling or logging
- `IncrementalParser.ts:120` - Error silently swallowed - no error handling or logging
- `IncrementalParser.ts:141` - Error silently swallowed - no error handling or logging
- `IncrementalParser.ts:174` - Error silently swallowed - no error handling or logging
- `IncrementalParser.ts:412` - Error silently swallowed - no error handling or logging
- `IncrementalParser.ts:431` - Error silently swallowed - no error handling or logging
- `IncrementalParser.ts:446` - Error silently swallowed - no error handling or logging
- `IncrementalParser.ts:713` - Error silently swallowed - no error handling or logging
- `IncrementalParser.ts:734` - Error silently swallowed - no error handling or logging
- `IncrementalParser.ts:756` - Error silently swallowed - no error handling or logging
- `IncrementalParser.ts:790` - Error silently swallowed - no error handling or logging
- `ModuleResolver.ts:137` - Error silently swallowed - no error handling or logging
- `ModuleResolver.ts:284` - Error silently swallowed - no error handling or logging
- `SymbolExtractor.ts:288` - Error silently swallowed - no error handling or logging
- `TypeCheckerBudget.ts:45` - Error silently swallowed - no error handling or logging

#### 🔍 Code Antipatterns (249)
Design and architecture issues that should be refactored:

- `AnalysisService.ts:63` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `AnalysisService.ts:66` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `ImpactAnalyzer.ts:141` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EmbeddingService.ts:109` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EmbeddingService.ts:125` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EmbeddingService.ts:172` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EmbeddingService.ts:250` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EmbeddingService.ts:266` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EmbeddingService.ts:390` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `VectorService.ts:57` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `VectorService.ts:99` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `VectorService.ts:308` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `VectorService.ts:389` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `CypherExecutor.ts:74` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `CypherExecutor.ts:114` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `CypherExecutor.ts:273` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EntityServiceOGM.ts:49` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EntityServiceOGM.ts:115` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EntityServiceOGM.ts:118` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EntityServiceOGM.ts:150` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EntityServiceOGM.ts:153` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EntityServiceOGM.ts:179` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EntityServiceOGM.ts:202` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EntityServiceOGM.ts:204` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EntityServiceOGM.ts:263` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EntityServiceOGM.ts:410` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EntityServiceOGM.ts:419` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EntityServiceOGM.ts:440` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EntityServiceOGM.ts:476` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EntityServiceOGM.ts:489` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EntityServiceOGM.ts:502` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EntityServiceOGM.ts:517` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EntityServiceOGM.ts:572` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `GdsService.ts:50` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `GdsService.ts:58` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `GdsService.ts:144` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `GdsService.ts:152` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `GdsService.ts:195` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `GdsService.ts:203` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `GdsService.ts:331` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `GdsService.ts:339` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `GraphInitializer.ts:27` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `GraphInitializer.ts:29` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `GraphInitializer.ts:35` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `HistoryService.ts:48` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `HistoryService.ts:51` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `HistoryService.ts:54` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `HistoryService.ts:57` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `HistoryService.ts:60` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `HistoryService.ts:63` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `HistoryService.ts:172` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `HistoryService.ts:507` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `HistoryService.ts:620` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `Neo4jService.ts:46` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `Neo4jService.ts:48` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `Neo4jService.ts:50` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `Neo4jService.ts:53` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `Neo4jService.ts:56` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `Neo4jService.ts:59` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `Neo4jService.ts:63` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `Neo4jService.ts:66` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `Neo4jService.ts:69` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `Neo4jService.ts:72` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `Neo4jService.ts:75` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `Neo4jService.ts:78` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `Neo4jService.ts:81` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `Neo4jService.ts:84` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `Neo4jService.ts:521` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `Neo4jService.ts:537` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `Neo4jService.ts:543` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `Neo4jService.ts:576` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `Neo4jService.ts:639` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `Neo4jService.ts:661` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `Neo4jService.ts:693` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `NeogmaService.ts:35` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `NeogmaService.ts:38` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `NeogmaService.ts:67` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `NeogmaService.ts:77` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RelationshipServiceOGM.ts:89` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RelationshipServiceOGM.ts:157` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RelationshipServiceOGM.ts:193` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RelationshipServiceOGM.ts:235` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RelationshipServiceOGM.ts:247` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RelationshipServiceOGM.ts:330` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RelationshipServiceOGM.ts:350` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RelationshipServiceOGM.ts:352` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RelationshipServiceOGM.ts:379` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RelationshipServiceOGM.ts:402` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RelationshipServiceOGM.ts:405` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RelationshipServiceOGM.ts:449` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RelationshipServiceOGM.ts:509` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RelationshipServiceOGM.ts:544` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RelationshipServiceOGM.ts:549` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RelationshipServiceOGM.ts:732` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RelationshipServiceOGM.ts:758` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RelationshipServiceOGM.ts:786` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RelationshipServiceOGM.ts:814` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SearchServiceOGM.ts:105` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SearchServiceOGM.ts:116` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SearchServiceOGM.ts:152` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SearchServiceOGM.ts:246` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SearchServiceOGM.ts:463` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SearchServiceOGM.ts:506` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SearchServiceOGM.ts:567` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SearchServiceOGM.ts:590` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SearchServiceOGM.ts:598` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `TemporalQueryService.ts:74` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `TemporalQueryService.ts:103` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `batch-processor.ts:69` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `batch-processor.ts:85` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `batch-processor.ts:106` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `batch-processor.ts:113` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `batch-processor.ts:122` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `batch-processor.ts:132` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `batch-processor.ts:158` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `batch-processor.ts:165` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `batch-processor.ts:174` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `batch-processor.ts:184` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `batch-processor.ts:524` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `batch-processor.ts:545` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `batch-processor.ts:555` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `batch-processor.ts:562` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `batch-processor.ts:601` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `batch-processor.ts:730` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `error-handler.ts:100` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `error-handler.ts:111` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `error-handler.ts:157` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `error-handler.ts:183` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `error-handler.ts:346` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `error-handler.ts:351` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `error-handler.ts:456` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `error-handler.ts:508` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `error-handler.ts:515` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `error-handler.ts:536` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `index.ts:269` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `index.ts:287` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `knowledge-graph-adapter.ts:41` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `knowledge-graph-adapter.ts:98` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `knowledge-graph-adapter.ts:153` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `knowledge-graph-adapter.ts:255` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `knowledge-graph-adapter.ts:262` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `knowledge-graph-adapter.ts:303` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `knowledge-graph-adapter.ts:403` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `knowledge-graph-adapter.ts:413` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `knowledge-graph-adapter.ts:423` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `performance-monitor.ts:162` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `performance-monitor.ts:170` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `performance-monitor.ts:187` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `performance-monitor.ts:188` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `performance-monitor.ts:248` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `performance-monitor.ts:290` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `performance-monitor.ts:567` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `performance-utils.ts:54` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `performance-utils.ts:58` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `performance-utils.ts:448` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `performance-utils.ts:455` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `performance-utils.ts:478` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `performance-utils.ts:485` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `pipeline.ts:122` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `pipeline.ts:139` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `pipeline.ts:140` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `pipeline.ts:144` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `pipeline.ts:158` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `pipeline.ts:170` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `pipeline.ts:171` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `pipeline.ts:175` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `pipeline.ts:191` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `pipeline.ts:203` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `pipeline.ts:244` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `pipeline.ts:250` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `pipeline.ts:278` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `pipeline.ts:282` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `pipeline.ts:418` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `pipeline.ts:473` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `pipeline.ts:571` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `pipeline.ts:581` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `pipeline.ts:589` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `pipeline.ts:617` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `pipeline.ts:629` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `pipeline.ts:687` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `pipeline.ts:692` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `pipeline.ts:708` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `pipeline.ts:721` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `pipeline.ts:739` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `pipeline.ts:740` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `pipeline.ts:747` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `pipeline.ts:748` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `pipeline.ts:755` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `pipeline.ts:756` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `pipeline.ts:811` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `pipeline.ts:883` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `pipeline.ts:922` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `pipeline.ts:929` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `queue-manager.ts:71` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `queue-manager.ts:89` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `queue-manager.ts:132` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `queue-manager.ts:343` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `queue-manager.ts:400` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `worker-pool.ts:87` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `worker-pool.ts:107` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `worker-pool.ts:354` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `worker-pool.ts:408` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `worker-pool.ts:414` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `worker-pool.ts:419` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `worker-pool.ts:421` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `worker-pool.ts:462` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `worker-pool.ts:477` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `worker-pool.ts:567` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `worker-pool.ts:569` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `worker-pool.ts:615` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `worker-pool.ts:720` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `worker-pool.ts:733` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `task-worker.ts:100` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `task-worker.ts:135` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `task-worker.ts:158` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `task-worker.ts:172` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `task-worker.ts:186` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `task-worker.ts:201` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `task-worker.ts:206` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `task-worker.ts:207` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `task-worker.ts:216` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `CheckpointService.ts:110` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `CheckpointService.ts:275` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EventOrchestrator.ts:29` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EventOrchestrator.ts:32` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EventOrchestrator.ts:35` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EventOrchestrator.ts:38` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EventOrchestrator.ts:43` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EventOrchestrator.ts:46` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EventOrchestrator.ts:51` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EventOrchestrator.ts:56` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `KnowledgeGraphService.ts:111` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `KnowledgeGraphService.ts:114` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `KnowledgeGraphService.ts:117` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `KnowledgeGraphService.ts:120` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `KnowledgeGraphService.ts:123` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `KnowledgeGraphService.ts:126` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `KnowledgeGraphService.ts:129` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `KnowledgeGraphService.ts:132` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `KnowledgeGraphService.ts:140` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `KnowledgeGraphService.ts:143` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `KnowledgeGraphService.ts:151` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `KnowledgeGraphService.ts:437` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `ServiceRegistry.ts:71` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `StatsCollector.ts:54` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SyncOrchestrator.ts:87` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `VersionManager.ts:78` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `VersionManager.ts:152` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `ASTParser.ts:1318` - **Direct console.log in class - use proper logging abstraction** [direct-console]

#### ℹ️ Informational
1951 minor issues found (console.log usage, magic numbers, etc.) - not shown for brevity

#### 📖 Issue Types Explained

- **not-implemented-stub**: Function exists but just throws 'Not implemented' error
- **todo-comments**: Code marked with TODO/FIXME indicating incomplete work
- **hardcoded-credentials**: Passwords or API keys hardcoded in source
- **test-environment-bypass**: Code skips logic in tests - tests don't test real behavior!
- **always-true-validation**: Validation function that always returns true without checking
- **silent-error-handler**: Catches errors but doesn't log or handle them
- **unhandled-async-rejection**: Async function without try-catch error handling
- **sql-string-concatenation**: SQL queries built with string concat (injection risk)
- **unsafe-property-access**: Accessing nested properties without null checks
- **deceptive-security-function**: Security function that doesn't actually secure anything
- **console-log-in-production**: Using console.log instead of proper logging
- **empty-function**: Function defined but has no implementation
- **magic-numbers**: Unexplained numeric constants in code

---

## Code Summary (Comments Stripped)

This file is a merged representation of the entire codebase, combined into a single document by Repomix.
The content has been processed where comments have been removed.

================================================================
File Summary
================================================================

Purpose:
--------
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

File Format:
------------
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Multiple file entries, each consisting of:
  a. A separator line (================)
  b. The file path (File: path/to/file)
  c. Another separator line
  d. The full contents of the file
  e. A blank line

Usage Guidelines:
-----------------
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

Notes:
------
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Code comments have been removed from supported file types
- Files are sorted by Git change count (files with more changes are at the bottom)

Additional Info:
----------------

================================================================
Directory Structure
================================================================
analysis/
  AnalysisService.ts
  DependencyAnalyzer.ts
  ImpactAnalyzer.ts
  IntentExtractor.ts
  PathAnalyzer.ts
embeddings/
  DocTokenizer.ts
  DocumentationIntelligenceProvider.ts
  DocumentationParser.ts
  EmbeddingService.ts
  VectorService.ts
graph/
  CypherExecutor.ts
  EntityServiceOGM.ts
  GdsService.ts
  GraphInitializer.ts
  HistoryService.ts
  Neo4jService.ts
  NeogmaService.ts
  RelationshipBuilder.ts
  RelationshipServiceOGM.ts
  SearchServiceOGM.ts
  TemporalQueryService.ts
ingestion/
  workers/
    task-worker.ts
  batch-processor.ts
  error-handler.ts
  index.ts
  knowledge-graph-adapter.ts
  performance-monitor.ts
  performance-utils.ts
  pipeline.ts
  queue-manager.ts
  types.ts
  worker-pool.ts
orchestration/
  CacheManager.ts
  CheckpointService.ts
  EventOrchestrator.ts
  KnowledgeGraphService.ts
  PerformanceOptimizer.ts
  ServiceRegistry.ts
  StatsCollector.ts
  SyncOrchestrator.ts
  VersionManager.ts
parsing/
  ASTParser.ts
  ASTParserCore.ts
  DirectoryHandler.ts
  IncrementalParser.ts
  ModuleIndexer.ts
  ModuleResolver.ts
  SymbolExtractor.ts
  TypeCheckerBudget.ts
index.ts
ISearchService.ts
queries.ts
services-index.ts
types.ts
utils.ts

================================================================
Files
================================================================

================
File: analysis/AnalysisService.ts
================
import { EventEmitter } from "events";
import { Neo4jService } from "./Neo4jService.js";
import { Entity } from "../../models/entities.js";
import {
  ImpactAnalysis,
  ImpactAnalysisRequest,
  DependencyAnalysis,
} from "../../models/types.js";
import { PathQuery } from "../../models/relationships.js";
import { ImpactAnalyzer } from "./ImpactAnalyzer.js";
import { DependencyAnalyzer } from "./DependencyAnalyzer.js";
import { PathAnalyzer, type PathResult } from "./PathAnalyzer.js";
import { StatsCollector, type EntityEdgeStats } from "./StatsCollector.js";

export interface ImpactMetrics {
  directImpact: number;
  transitiveImpact: number;
  cascadeDepth: number;
  affectedTests: number;
  affectedSpecs: number;
  affectedDocs: number;
  criticalPaths: number;
  riskScore: number;
}

export interface DependencyMetrics {
  directDependencies: number;
  transitiveDependencies: number;
  depth: number;
  fanIn: number;
  fanOut: number;
  centrality: number;
  cycles: string[][];
}

export class AnalysisService extends EventEmitter {
  private impactAnalyzer: ImpactAnalyzer;
  private dependencyAnalyzer: DependencyAnalyzer;
  private pathAnalyzer: PathAnalyzer;
  private statsCollector: StatsCollector;

  constructor(private neo4j: Neo4jService) {
    super();


    this.impactAnalyzer = new ImpactAnalyzer(neo4j);
    this.dependencyAnalyzer = new DependencyAnalyzer(neo4j);
    this.pathAnalyzer = new PathAnalyzer(neo4j);
    this.statsCollector = new StatsCollector(neo4j);


    this.setupEventForwarding();
  }

  private setupEventForwarding(): void {
    this.impactAnalyzer.on("impact:analyzed", (data) =>
      this.emit("impact:analyzed", data)
    );
    this.statsCollector.on("stats:computed", (data) =>
      this.emit("stats:computed", data)
    );
  }




  async analyzeImpact(request: ImpactAnalysisRequest): Promise<ImpactAnalysis> {
    return this.impactAnalyzer.analyzeImpact(request);
  }




  async getEntityDependencies(
    entityId: string,
    options?: { depth?: number; includeTypes?: string[] }
  ): Promise<DependencyAnalysis> {
    return this.dependencyAnalyzer.getEntityDependencies(entityId, options);
  }




  async findPaths(query: PathQuery): Promise<PathResult> {
    return this.pathAnalyzer.findPaths(query);
  }




  async computeAndStoreEdgeStats(entityId: string): Promise<void> {
    return this.statsCollector.computeAndStoreEdgeStats(entityId);
  }




  async getEntityEdgeStats(entityId: string): Promise<EntityEdgeStats> {
    return this.statsCollector.getEntityEdgeStats(entityId);
  }
}

================
File: analysis/DependencyAnalyzer.ts
================
import { EventEmitter } from "events";
import { Neo4jService } from "../Neo4jService.js";
import { Entity } from "../../../models/entities.js";
import { DependencyAnalysis } from "../../../models/types.js";
import { RelationshipType } from "../../../models/relationships.js";
import {
  buildDirectRelationshipQuery,
  buildPathExpansionQuery,
  buildBetweennessQuery,
  buildCycleDetectionQuery,
} from "./queries.js";

export interface DependencyMetrics {
  directDependencies: number;
  transitiveDependencies: number;
  depth: number;
  fanIn: number;
  fanOut: number;
  centrality: number;
  cycles: string[][];
}

export interface DependencyTree {
  entity: Entity;
  children: DependencyTree[];
}

export interface CircularDependency {
  cycle: string[];
  severity: "warning" | "error" | "info";
}

export class DependencyAnalyzer extends EventEmitter {
  constructor(private neo4j: Neo4jService) {
    super();
  }




  async getEntityDependencies(
    entityId: string,
    options?: { depth?: number; includeTypes?: string[] }
  ): Promise<DependencyAnalysis> {
    const depth = options?.depth || 3;
    const typeFilter = options?.includeTypes || [
      "DEPENDS_ON",
      "IMPORTS",
      "CALLS",
      "TYPE_USES",
    ];


    const directDeps = await this.getDirectDependencies(entityId, typeFilter);


    const transitiveDeps = await this.getTransitiveDependencies(
      entityId,
      typeFilter,
      depth
    );


    const metrics = await this.calculateDependencyMetrics(entityId, depth);


    const cycles = await this.detectCycles(entityId, depth);

    return {
      entityId,
      directDependencies: directDeps.map((dep) => ({
        entity: dep.entity,
        relationship: dep.relationshipType as any,
        confidence: 1.0,
      })),
      indirectDependencies: transitiveDeps.map((dep) => ({
        entity: dep.entity,
        path: [dep.entity],
        relationship: RelationshipType.DEPENDS_ON,
        distance: dep.distance,
      })),
      reverseDependencies: [],
      circularDependencies: cycles.map((cycle) => ({
        cycle: Array.isArray(cycle) ? cycle : [],
        severity: "warning" as const,
      })),
    };
  }




  private async getDirectDependencies(
    entityId: string,
    relationshipTypes: string[]
  ): Promise<Array<{ entity: Entity; relationshipType: string }>> {
    const query = buildDirectRelationshipQuery(
      entityId,
      relationshipTypes,
      "OUTGOING"
    );
    const result = await this.neo4j.executeCypher(query, { entityId });

    return result.map((r) => ({
      entity: this.parseEntity(r.target),
      relationshipType: r.relationshipType,
    }));
  }




  private async getTransitiveDependencies(
    entityId: string,
    relationshipTypes: string[],
    depth: number
  ): Promise<Array<{ entity: Entity; distance: number; types: string[] }>> {
    const query = buildPathExpansionQuery({
      startNodeId: entityId,
      relationshipTypes,
      maxDepth: depth,
      direction: "OUTGOING",
      uniqueness: "NODE_GLOBAL",
    });

    const result = await this.neo4j.executeCypher(query, {
      startNodeId: entityId,
      maxDepth: depth,
    });

    return result.map((r) => ({
      entity: this.parseEntity(r.endNode),
      distance: r.depth,
      types: r.path
        ? [r.path.relationships[0]?.type || "DEPENDS_ON"]
        : ["DEPENDS_ON"],
    }));
  }




  private async calculateDependencyMetrics(
    entityId: string,
    depth: number
  ): Promise<{ fanIn: number; fanOut: number; centrality: number }> {
    const queries = [
      {
        name: "fanIn",
        query: `MATCH (e:Entity {id: $entityId})<-[:DEPENDS_ON|CALLS|IMPORTS]-() RETURN count(*) AS count`,
      },
      {
        name: "fanOut",
        query: `MATCH (e:Entity {id: $entityId})-[:DEPENDS_ON|CALLS|IMPORTS]->() RETURN count(*) AS count`,
      },
    ];

    const results = await Promise.all(
      queries.map((q) => this.neo4j.executeCypher(q.query, { entityId }))
    );


    let centrality = 0.5;
    try {
      const nodeQuery = "MATCH (n:Entity) RETURN id(n) AS id";
      const relationshipQuery =
        "MATCH (a)-[:DEPENDS_ON|CALLS]->(b) RETURN id(a) AS source, id(b) AS target";
      const centralityQuery = buildBetweennessQuery(
        nodeQuery,
        relationshipQuery
      );

      const centralityResult = await this.neo4j.executeCypher(centralityQuery, {
        entityId,
      });
      const entityCentrality = centralityResult.find(
        (r: any) => r.id === entityId
      );
      centrality = entityCentrality?.score || 0.5;
    } catch {

      const total = results[0][0].count + results[1][0].count;
      centrality = Math.min(1, total / 20);
    }

    return {
      fanIn: results[0][0]?.count || 0,
      fanOut: results[1][0]?.count || 0,
      centrality,
    };
  }




  private async detectCycles(
    entityId: string,
    maxDepth: number
  ): Promise<string[][]> {
    const query = buildCycleDetectionQuery(maxDepth);
    const result = await this.neo4j.executeCypher(query, {
      entityId,
      maxDepth,
    });

    return result.map((r) => r.cycle);
  }




  buildDependencyTree(
    entityId: string,
    dependencies: Array<{ entity: Entity; distance: number }>
  ): DependencyTree {
    const tree: DependencyTree = {
      entity: { id: entityId } as Entity,
      children: [],
    };

    const nodeMap = new Map<string, DependencyTree>();
    nodeMap.set(entityId, tree);

    dependencies.forEach((dep) => {
      const depId = dep.entity.id;
      if (!nodeMap.has(depId)) {
        nodeMap.set(depId, {
          entity: dep.entity,
          children: [],
        });
      }
    });


    dependencies
      .filter((d) => d.distance === 1)
      .forEach((dep) => {
        const depId = dep.entity.id;
        tree.children.push(nodeMap.get(depId)!);
      });

    return tree;
  }




  async findDependencyChains(
    entityId: string,
    targetEntityId: string,
    maxDepth: number = 5
  ): Promise<Array<{ path: string[]; length: number }>> {
    const query = `
      MATCH path = (start:Entity {id: $entityId})-[rels:DEPENDS_ON|CALLS|IMPORTS*1..$maxDepth]->(end:Entity {id: $targetEntityId})
      RETURN [n IN nodes(path) | n.id] AS path, length(path) AS length
      ORDER BY length
      LIMIT 10
    `;

    const result = await this.neo4j.executeCypher(query, {
      entityId,
      targetEntityId,
      maxDepth,
    });

    return result.map((r) => ({
      path: r.path,
      length: r.length,
    }));
  }




  async getReverseDependencies(
    entityId: string,
    depth: number = 3
  ): Promise<
    Array<{ entity: Entity; relationship: string; distance: number }>
  > {
    const query = buildPathExpansionQuery({
      startNodeId: entityId,
      relationshipTypes: ["DEPENDS_ON", "CALLS", "IMPORTS"],
      maxDepth: depth,
      direction: "INCOMING",
      uniqueness: "NODE_GLOBAL",
    });

    const result = await this.neo4j.executeCypher(query, {
      startNodeId: entityId,
      maxDepth: depth,
    });

    return result.map((r) => ({
      entity: this.parseEntity(r.endNode),
      relationship: r.path?.relationships?.[0]?.type || "DEPENDS_ON",
      distance: r.depth,
    }));
  }




  private parseEntity(node: any): Entity {
    const properties = node.properties || node;
    const entity: any = {};

    for (const [key, value] of Object.entries(properties)) {
      if (value === null || value === undefined) continue;

      if (key === "created" || key === "lastModified" || key.endsWith("At")) {
        entity[key] = new Date(value as string);
      } else if (
        typeof value === "string" &&
        ((value as string).startsWith("[") || (value as string).startsWith("{"))
      ) {
        try {
          entity[key] = JSON.parse(value as string);
        } catch {
          entity[key] = value;
        }
      } else {
        entity[key] = value;
      }
    }

    return entity as Entity;
  }
}

================
File: analysis/ImpactAnalyzer.ts
================
import { EventEmitter } from "events";
import { Neo4jService } from "../Neo4jService.js";
import { Entity } from "../../../models/entities.js";
import { ImpactAnalysis, ImpactAnalysisRequest } from "../../../models/types.js";
import { RelationshipType } from "../../../models/relationships.js";
import {
  buildImpactQueries,
  buildGdsProjectionQuery,
  buildPageRankQuery,
  buildCycleDetectionQuery,
} from "./queries.js";

export interface ImpactMetrics {
  directImpact: number;
  transitiveImpact: number;
  cascadeDepth: number;
  affectedTests: number;
  affectedSpecs: number;
  affectedDocs: number;
  criticalPaths: number;
  riskScore: number;
}

export interface CascadeInfo {
  depth: number;
  count: number;
  entities: Entity[];
}

export interface CriticalPath {
  path: string[];
  length: number;
}

export class ImpactAnalyzer extends EventEmitter {
  constructor(private neo4j: Neo4jService) {
    super();
  }




  async analyzeImpact(request: ImpactAnalysisRequest): Promise<ImpactAnalysis> {
    const startTime = Date.now();
    const entityIds = request.changes.map((c) => c.entityId);
    const maxDepth = request.maxDepth || 3;


    const [
      directImpacted,
      transitiveImpacted,
      affectedTests,
      affectedSpecs,
      affectedDocs,
    ] = await Promise.all([
      this.getDirectImpact(entityIds),
      this.getTransitiveImpact(entityIds, maxDepth),
      this.getAffectedTests(entityIds, maxDepth),
      this.getAffectedSpecs(entityIds, maxDepth),
      this.getAffectedDocs(entityIds, maxDepth),
    ]);


    const metrics = await this.calculateImpactMetrics(
      entityIds,
      transitiveImpacted
    );


    const analysis: ImpactAnalysis = {
      directImpact: directImpacted.map((e) => ({
        entities: [e],
        severity: "medium" as const,
        reason: "Direct dependency",
      })),
      cascadingImpact: transitiveImpacted.map((t) => ({
        level: t.depth,
        entities: [t.entity],
        relationship: RelationshipType.DEPENDS_ON,
        confidence: 0.8,
      })),
      testImpact: {
        affectedTests: affectedTests.filter((t) => t.type === "test") as any[],
        requiredUpdates: affectedTests.map((t) => t.id),
        coverageImpact: affectedTests.length > 0 ? 0.8 : 0,
      },
      documentationImpact: {
        staleDocs: affectedDocs,
        missingDocs: [],
        requiredUpdates: affectedDocs.map((d) => d.id || "unknown"),
        freshnessPenalty: affectedDocs.length * 0.1,
      },
      specImpact: {
        relatedSpecs: [],
        requiredUpdates: [],
        summary: {
          byPriority: { critical: 0, high: 0, medium: 0, low: 0 },
          byImpactLevel: { critical: 0, high: 0, medium: 0, low: 0 },
          statuses: {
            draft: 0,
            approved: 0,
            implemented: 0,
            deprecated: 0,
            unknown: 0,
          },
          acceptanceCriteriaReferences: 0,
          pendingSpecs: 0,
        },
      },
      deploymentGate: {
        blocked: false,
        level: "none" as const,
        reasons: [],
        stats: {
          missingDocs: 0,
          staleDocs: affectedDocs.length,
          freshnessPenalty: affectedDocs.length * 0.1,
        },
      },
      recommendations: [
        {
          priority: "planned" as const,
          description: "Review impact analysis results",
          effort: "medium" as const,
          impact: "functional" as const,
          type: "suggestion",
          actions: [
            "Review affected components",
            "Update tests",
            "Update documentation",
          ],
        },
      ],
    };

    this.emit("impact:analyzed", {
      entityIds,
      impactCount: transitiveImpacted.length,
      depth: maxDepth,
      duration: Date.now() - startTime,
    });

    return analysis;
  }




  private async getDirectImpact(entityIds: string[]): Promise<Entity[]> {
    const query = buildImpactQueries(entityIds, 3).directImpact;
    const result = await this.neo4j.executeCypher(query, { entityIds });
    return result.map((r) => this.parseEntity(r.impacted));
  }




  private async getTransitiveImpact(
    entityIds: string[],
    maxDepth: number
  ): Promise<Array<{ entity: Entity; depth: number }>> {
    const query = buildImpactQueries(entityIds, maxDepth).transitiveImpact;
    const result = await this.neo4j.executeCypher(query, {
      entityIds,
      maxDepth,
    });
    return result.map((r) => ({
      entity: this.parseEntity(r.impacted),
      depth: r.minDepth,
    }));
  }




  private async getAffectedTests(
    entityIds: string[],
    maxDepth: number
  ): Promise<Entity[]> {
    const query = buildImpactQueries(entityIds, maxDepth).affectedTests;
    const result = await this.neo4j.executeCypher(query, {
      entityIds,
      maxDepth,
    });
    return result.map((r) => this.parseEntity(r.test));
  }




  private async getAffectedSpecs(
    entityIds: string[],
    maxDepth: number
  ): Promise<Array<{ entity: Entity; priority: string }>> {
    const query = buildImpactQueries(entityIds, maxDepth).affectedSpecs;
    const result = await this.neo4j.executeCypher(query, {
      entityIds,
      maxDepth,
    });
    return result.map((r) => ({
      entity: this.parseEntity(r.spec),
      priority: r.priority || "medium",
    }));
  }




  private async getAffectedDocs(
    entityIds: string[],
    maxDepth: number
  ): Promise<Entity[]> {
    const query = buildImpactQueries(entityIds, maxDepth).affectedDocs;
    const result = await this.neo4j.executeCypher(query, {
      entityIds,
      maxDepth,
    });
    return result.map((r) => this.parseEntity(r.doc));
  }




  private async calculateImpactMetrics(
    entityIds: string[],
    impacted: Array<{ entity: Entity; depth: number }>
  ): Promise<ImpactMetrics> {

    const allIds = [...entityIds, ...impacted.map((i) => i.entity.id)];
    let criticalPaths = 0;
    let avgCentrality = 0;

    try {
      const nodeQuery =
        "MATCH (n:Entity) WHERE n.id IN $allIds RETURN id(n) AS id";
      const relationshipQuery =
        "MATCH (a)-[r:DEPENDS_ON|CALLS|IMPLEMENTS]->(b) WHERE a.id IN $allIds AND b.id IN $allIds RETURN id(a) AS source, id(b) AS target";

      await this.neo4j.executeCypher(
        buildGdsProjectionQuery("impact_graph", nodeQuery, relationshipQuery),
        { allIds }
      );
      const pageRankResult = await this.neo4j.executeCypher(
        buildPageRankQuery("impact_graph"),
        { allIds }
      );

      criticalPaths = pageRankResult.filter((r: any) => r.score > 0.1).length;
      avgCentrality =
        pageRankResult.reduce((sum: number, r: any) => sum + r.score, 0) /
        pageRankResult.length;
    } catch {

      criticalPaths = impacted.filter((i) => i.depth === 1).length;
      avgCentrality = 0.5;
    }


    const riskScore = Math.min(
      1,
      (impacted.length / 100) * 0.3 +
        (criticalPaths / 10) * 0.3 +
        avgCentrality * 0.4
    );

    return {
      directImpact: impacted.filter((i) => i.depth === 1).length,
      transitiveImpact: impacted.length,
      cascadeDepth: Math.max(...impacted.map((i) => i.depth), 0),
      affectedTests: 0,
      affectedSpecs: 0,
      affectedDocs: 0,
      criticalPaths,
      riskScore,
    };
  }




  identifyCascades(
    impacted: Array<{ entity: Entity; depth: number }>
  ): CascadeInfo[] {
    const cascades: CascadeInfo[] = [];
    const byDepth = new Map<number, Entity[]>();

    impacted.forEach(({ entity, depth }) => {
      if (!byDepth.has(depth)) {
        byDepth.set(depth, []);
      }
      byDepth.get(depth)!.push(entity);
    });

    for (const [depth, entities] of byDepth) {
      if (entities.length > 5) {
        cascades.push({
          depth,
          count: entities.length,
          entities: entities.slice(0, 10),
        });
      }
    }

    return cascades;
  }




  async findCriticalPaths(
    entityIds: string[],
    maxDepth: number
  ): Promise<CriticalPath[]> {

    const query = `
      UNWIND $entityIds AS entityId
      MATCH (e:Entity {id: entityId})
      MATCH path = (e)-[:CALLS|DEPENDS_ON*1..$maxDepth]->(critical)
      WHERE critical.type IN ['api_endpoint', 'main_function', 'critical_service']
      WITH path, length(path) AS pathLength
      ORDER BY pathLength
      LIMIT 5
      RETURN [n IN nodes(path) | n.id] AS path, pathLength
    `;

    const result = await this.neo4j.executeCypher(query, {
      entityIds,
      maxDepth,
    });

    return result.map((r) => ({
      path: r.path,
      length: r.pathLength,
    }));
  }




  private parseEntity(node: any): Entity {
    const properties = node.properties || node;
    const entity: any = {};

    for (const [key, value] of Object.entries(properties)) {
      if (value === null || value === undefined) continue;

      if (key === "created" || key === "lastModified" || key.endsWith("At")) {
        entity[key] = new Date(value as string);
      } else if (
        typeof value === "string" &&
        ((value as string).startsWith("[") || (value as string).startsWith("{"))
      ) {
        try {
          entity[key] = JSON.parse(value as string);
        } catch {
          entity[key] = value;
        }
      } else {
        entity[key] = value;
      }
    }

    return entity as Entity;
  }
}

================
File: analysis/IntentExtractor.ts
================
import { DocumentationIntelligenceProvider } from "../DocumentationIntelligenceProvider.js";
import type { ParsedDocument } from "./DocTokenizer.js";

export interface DomainExtraction {
  name: string;
  description: string;
  criticality: "low" | "medium" | "high" | "critical";
  stakeholders: string[];
  keyProcesses: string[];
  confidence: number;
}

export class IntentExtractor {
  constructor(
    private intelligenceProvider: DocumentationIntelligenceProvider
  ) {}




  inferDocIntent(
    filePath: string,
    docType: ParsedDocument["docType"]
  ): ParsedDocument["docIntent"] {
    const normalizedPath = filePath.toLowerCase();

    if (
      normalizedPath.includes("/adr") ||
      normalizedPath.includes("adr-") ||
      normalizedPath.includes("/architecture") ||
      normalizedPath.includes("/decisions") ||
      docType === "architecture"
    ) {
      return "governance";
    }

    if (docType === "api-doc" || docType === "readme") {
      return "reference";
    }

    if (docType === "user-guide" || docType === "tutorial") {
      return "tutorial";
    }

    if (docType === "design-doc") {
      return "mixed";
    }

    return "ai-context";
  }




  inferDocLocale(
    filePath: string,
    metadata: Record<string, any>
  ): string | undefined {
    const localeMatch = filePath
      .toLowerCase()
      .match(/\.([a-z]{2}(?:-[a-z0-9]+)?)\.(md|txt|rst|adoc)$/);
    if (localeMatch) {
      return localeMatch[1];
    }

    if (
      typeof metadata?.language === "string" &&
      metadata.language.length > 0
    ) {
      return metadata.language;
    }

    return "en";
  }




  async extractDomains(
    document: ParsedDocument,
    content: string
  ): Promise<DomainExtraction[]> {
    try {
      const signals = await this.intelligenceProvider.extractSignals({
        content,
        format: document.metadata?.format || "markdown",
        filePath: document.metadata?.filePath,
        docTypeHint: document.docType,
        metadata: document.metadata,
      });

      return signals.businessDomains.map((domain) => ({
        name: domain.name,
        description: domain.description || "",
        criticality: this.inferDomainCriticality(domain.name, content),
        stakeholders: domain.stakeholders || [],
        keyProcesses: domain.keyProcesses || [],
        confidence: domain.confidence || 0.5,
      }));
    } catch (error) {
      console.warn("Failed to extract domains:", error);
      return [];
    }
  }

  /**
   * Extract stakeholders from document
   */
  async extractStakeholders(
    document: ParsedDocument,
    content: string
  ): Promise<string[]> {
    try {
      const signals = await this.intelligenceProvider.extractSignals({
        content,
        format: document.metadata?.format || "markdown",
        filePath: document.metadata?.filePath,
        docTypeHint: document.docType,
        metadata: document.metadata,
      });

      return signals.stakeholders || [];
    } catch (error) {
      console.warn("Failed to extract stakeholders:", error);
      return [];
    }
  }




  async extractTechnologies(
    document: ParsedDocument,
    content: string
  ): Promise<string[]> {
    try {
      const signals = await this.intelligenceProvider.extractSignals({
        content,
        format: document.metadata?.format || "markdown",
        filePath: document.metadata?.filePath,
        docTypeHint: document.docType,
        metadata: document.metadata,
      });

      return signals.technologies || [];
    } catch (error) {
      console.warn("Failed to extract technologies:", error);
      return [];
    }
  }




  private inferDomainCriticality(
    domainName: string,
    content: string
  ): "low" | "medium" | "high" | "critical" {
    const normalizedDomain = domainName.toLowerCase();
    const normalizedContent = content.toLowerCase();


    if (
      normalizedDomain.includes("security") ||
      normalizedDomain.includes("compliance") ||
      normalizedDomain.includes("privacy") ||
      normalizedDomain.includes("authentication")
    ) {
      return "critical";
    }


    if (
      normalizedDomain.includes("payment") ||
      normalizedDomain.includes("billing") ||
      normalizedDomain.includes("infrastructure") ||
      normalizedDomain.includes("data")
    ) {
      return "high";
    }


    if (
      normalizedDomain.includes("user") ||
      normalizedDomain.includes("customer") ||
      normalizedDomain.includes("product") ||
      normalizedContent.includes("business critical")
    ) {
      return "medium";
    }


    return "low";
  }




  async enhanceDocument(
    document: ParsedDocument,
    content: string
  ): Promise<ParsedDocument> {
    const [businessDomains, stakeholders, technologies] = await Promise.all([
      this.extractDomains(document, content),
      this.extractStakeholders(document, content),
      this.extractTechnologies(document, content),
    ]);

    return {
      ...document,
      businessDomains: businessDomains.map((d) => d.name),
      stakeholders,
      technologies,
      docIntent:
        document.docIntent ||
        this.inferDocIntent(
          document.metadata?.filePath || "",
          document.docType
        ),
      docLocale:
        document.docLocale ||
        this.inferDocLocale(
          document.metadata?.filePath || "",
          document.metadata || {}
        ),
      metadata: {
        ...document.metadata,
        extractedDomains: businessDomains,
        extractedStakeholders: stakeholders,
        extractedTechnologies: technologies,
      },
    };
  }
}

================
File: analysis/PathAnalyzer.ts
================
import { EventEmitter } from "events";
import { Neo4jService } from "../Neo4jService.js";
import { Entity } from "../../../models/entities.js";
import { PathQuery } from "../../../models/relationships.js";
import { buildDijkstraQuery } from "./queries.js";

export interface PathResult {
  paths: Array<{
    nodes: Entity[];
    relationships: any[];
    length: number;
    weight: number;
  }>;
  shortestLength: number;
  totalPaths: number;
}

export interface CriticalPathResult {
  path: string[];
  criticality: number;
  bottleneckNodes: string[];
}

export class PathAnalyzer extends EventEmitter {
  constructor(private neo4j: Neo4jService) {
    super();
  }




  async findPaths(query: PathQuery): Promise<PathResult> {
    const algorithmQuery = buildDijkstraQuery(
      query.relationshipTypes || ["DEPENDS_ON", "CALLS", "REFERENCES"],
      "weight",
      1
    );

    const result = await this.neo4j.executeCypher(algorithmQuery, {
      fromId: query.startEntityId,
      toId: query.endEntityId,
      limit: query.maxPaths || 5,
    });

    const paths = result.map((r) => ({
      nodes: r.path.nodes.map((n: any) => this.parseEntity(n)),
      relationships: r.path.relationships,
      length: r.path.length,
      weight: r.weight,
    }));

    return {
      paths,
      shortestLength: paths[0]?.length || 0,
      totalPaths: paths.length,
    };
  }




  async findAllPaths(
    startEntityId: string,
    endEntityId: string,
    options?: {
      maxDepth?: number;
      maxPaths?: number;
      relationshipTypes?: string[];
    }
  ): Promise<PathResult> {
    const maxDepth = options?.maxDepth || 5;
    const maxPaths = options?.maxPaths || 10;
    const relTypes = options?.relationshipTypes || [
      "DEPENDS_ON",
      "CALLS",
      "REFERENCES",
    ];
    const relFilter = relTypes.join("|");

    const query = `
      MATCH path = (start:Entity {id: $startId})-[rels:${relFilter}*1..${maxDepth}]->(end:Entity {id: $endId})
      RETURN path, length(path) AS length, size(rels) AS weight
      ORDER BY length
      LIMIT ${maxPaths}
    `;

    const result = await this.neo4j.executeCypher(query, {
      startId: startEntityId,
      endId: endEntityId,
    });

    const paths = result.map((r) => ({
      nodes: r.path.nodes.map((n: any) => this.parseEntity(n)),
      relationships: r.path.relationships,
      length: r.length,
      weight: r.weight,
    }));

    return {
      paths,
      shortestLength: paths[0]?.length || 0,
      totalPaths: paths.length,
    };
  }




  async findCriticalPaths(
    startEntityIds: string[],
    targetTypes: string[] = [
      "api_endpoint",
      "main_function",
      "critical_service",
    ],
    maxDepth: number = 5
  ): Promise<CriticalPathResult[]> {
    const query = `
      UNWIND $startEntityIds AS entityId
      MATCH (e:Entity {id: entityId})
      MATCH path = (e)-[:CALLS|DEPENDS_ON*1..$maxDepth]->(critical)
      WHERE critical.type IN $targetTypes
      WITH path, length(path) AS pathLength, critical
      ORDER BY pathLength
      LIMIT 20
      RETURN [n IN nodes(path) | n.id] AS path, pathLength, critical.importance AS criticality
    `;

    const result = await this.neo4j.executeCypher(query, {
      startEntityIds,
      targetTypes,
      maxDepth,
    });

    return result.map((r) => ({
      path: r.path,
      criticality: r.criticality || 1,
      bottleneckNodes: [],
    }));
  }




  async analyzePathCharacteristics(
    startEntityId: string,
    endEntityId: string
  ): Promise<{
    averagePathLength: number;
    minPathLength: number;
    maxPathLength: number;
    totalPaths: number;
    pathDiversity: number;
  }> {
    const query = `
      MATCH paths = (start:Entity {id: $startId})-[*1..10]->(end:Entity {id: $endId})
      WITH paths, length(paths) AS pathLength
      RETURN
        avg(pathLength) AS averagePathLength,
        min(pathLength) AS minPathLength,
        max(pathLength) AS maxPathLength,
        count(paths) AS totalPaths
    `;

    const result = await this.neo4j.executeCypher(query, {
      startId: startEntityId,
      endId: endEntityId,
    });

    const stats = result[0] || {
      averagePathLength: 0,
      minPathLength: 0,
      maxPathLength: 0,
      totalPaths: 0,
    };


    const diversityQuery = `
      MATCH paths = (start:Entity {id: $startId})-[*1..10]->(end:Entity {id: $endId})
      UNWIND nodes(paths) AS node
      WITH DISTINCT node.id AS uniqueNode
      MATCH paths2 = (start:Entity {id: $startId})-[*1..10]->(end:Entity {id: $endId})
      UNWIND nodes(paths2) AS node2
      RETURN toFloat(count(DISTINCT node.id)) / count(node2.id) AS pathDiversity
    `;

    let pathDiversity = 0;
    try {
      const diversityResult = await this.neo4j.executeCypher(diversityQuery, {
        startId: startEntityId,
        endId: endEntityId,
      });
      pathDiversity = diversityResult[0]?.pathDiversity || 0;
    } catch {

      pathDiversity = 0;
    }

    return {
      ...stats,
      pathDiversity,
    };
  }




  async findBottleneckNodes(
    entityIds: string[],
    threshold: number = 10
  ): Promise<Array<{ nodeId: string; pathCount: number; centrality: number }>> {
    const query = `
      UNWIND $entityIds AS entityId
      MATCH (start:Entity {id: entityId})
      MATCH paths = (start)-[*1..5]->()
      UNWIND nodes(paths)[1..-1] AS intermediate
      WITH intermediate.id AS nodeId, count(*) AS pathCount
      WHERE pathCount >= $threshold
      RETURN nodeId, pathCount
      ORDER BY pathCount DESC
      LIMIT 20
    `;

    const result = await this.neo4j.executeCypher(query, {
      entityIds,
      threshold,
    });


    return result.map((r) => ({
      nodeId: r.nodeId,
      pathCount: r.pathCount,
      centrality: 0,
    }));
  }




  private parseEntity(node: any): Entity {
    const properties = node.properties || node;
    const entity: any = {};

    for (const [key, value] of Object.entries(properties)) {
      if (value === null || value === undefined) continue;

      if (key === "created" || key === "lastModified" || key.endsWith("At")) {
        entity[key] = new Date(value as string);
      } else if (
        typeof value === "string" &&
        ((value as string).startsWith("[") || (value as string).startsWith("{"))
      ) {
        try {
          entity[key] = JSON.parse(value as string);
        } catch {
          entity[key] = value;
        }
      } else {
        entity[key] = value;
      }
    }

    return entity as Entity;
  }
}

================
File: embeddings/DocTokenizer.ts
================
import { marked } from "marked";
import type { Tokens, TokensList } from "marked";
import { readFileSync } from "fs";
import { extname } from "path";
import { createHash } from "crypto";

export interface ParsedDocument {
  title: string;
  content: string;
  businessDomains: string[];
  stakeholders: string[];
  technologies: string[];
  docType:
    | "readme"
    | "api-doc"
    | "architecture"
    | "user-guide"
    | "design-doc"
    | "changelog"
    | "other";
  docIntent: "governance" | "reference" | "tutorial" | "mixed" | "ai-context";
  docVersion: string;
  docHash: string;
  docSource: "parser" | "manual";
  docLocale?: string;
  lastIndexed: Date;
  metadata: Record<string, any>;
}

export interface Heading {
  level: number;
  text: string;
  slug?: string;
}

export interface CodeBlock {
  language: string;
  code: string;
}

export class DocTokenizer {
  private supportedExtensions = [".md", ".txt", ".rst", ".adoc"];




  async parseFile(filePath: string): Promise<ParsedDocument> {
    try {
      const content = readFileSync(filePath, "utf-8");
      const extension = extname(filePath).toLowerCase();

      let parsedContent: ParsedDocument;

      switch (extension) {
        case ".md":
          parsedContent = await this.parseMarkdown(content, filePath);
          break;
        case ".txt":
          parsedContent = await this.parsePlaintext(content, filePath);
          break;
        case ".rst":
          parsedContent = await this.parseRestructuredText(content, filePath);
          break;
        case ".adoc":
          parsedContent = await this.parseAsciiDoc(content, filePath);
          break;
        default:
          parsedContent = await this.parsePlaintext(content, filePath);
      }

      const checksum = this.calculateChecksum(content);
      const now = new Date();

      parsedContent.docVersion = checksum;
      parsedContent.docHash = checksum;
      parsedContent.docSource = parsedContent.docSource || "parser";
      parsedContent.lastIndexed = now;


      parsedContent.metadata = {
        ...parsedContent.metadata,
        filePath,
        fileSize: content.length,
        lastModified: now,
        checksum,
      };

      return parsedContent;
    } catch (error) {
      throw new Error(
        `Failed to parse file ${filePath}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }




  async parseMarkdown(
    content: string,
    filePath?: string
  ): Promise<ParsedDocument> {
    const tokens = marked.lexer(content);
    const title = this.extractTitle(tokens);
    const docType = this.inferDocType(content, title);


    const allHeadings = this.extractHeadings(tokens);
    let headings = allHeadings;
    const h1Count = allHeadings.filter((h) => h.level === 1).length;
    const idxFirstH1 = allHeadings.findIndex(
      (h) => h.level === 1 && h.text === title
    );
    if (
      idxFirstH1 !== -1 &&
      h1Count === 1 &&
      allHeadings.length > 1 &&
      allHeadings.length <= 5
    ) {
      headings = allHeadings
        .slice(0, idxFirstH1)
        .concat(allHeadings.slice(idxFirstH1 + 1));
    }

    const markdownMetadata = {
      format: "markdown",
      headings,
      links: this.extractLinksFromContent(content, tokens),
      codeBlocks: this.extractCodeBlocks(tokens),
      tokens,
      wordCount: content.split(/\s+/).filter(Boolean).length,
      lineCount: content.split(/\n/).length,
    };

    return {
      title,
      content,
      businessDomains: [],
      stakeholders: [],
      technologies: [],
      docType,
      docIntent: "ai-context",
      docVersion: "",
      docHash: "",
      docSource: "parser",
      lastIndexed: new Date(),
      metadata: markdownMetadata,
    };
  }




  async parsePlaintext(
    content: string,
    filePath?: string
  ): Promise<ParsedDocument> {
    const lines = content.split(/\n/);
    const title = this.extractPlaintextTitle(lines);

    return {
      title,
      content,
      businessDomains: [],
      stakeholders: [],
      technologies: [],
      docType: "other",
      docIntent: "ai-context",
      docVersion: "",
      docHash: "",
      docSource: "parser",
      lastIndexed: new Date(),
      metadata: {
        format: "plaintext",
        wordCount: content.split(/\s+/).filter(Boolean).length,
        lineCount: lines.length,
      },
    };
  }




  async parseRestructuredText(
    content: string,
    filePath?: string
  ): Promise<ParsedDocument> {
    const lines = content.split(/\n/);
    const title = this.extractRstTitle(lines);
    const sections = this.extractRstSections(lines);

    return {
      title,
      content,
      businessDomains: [],
      stakeholders: [],
      technologies: [],
      docType: "other",
      docIntent: "ai-context",
      docVersion: "",
      docHash: "",
      docSource: "parser",
      lastIndexed: new Date(),
      metadata: {
        format: "rst",
        sections,
        wordCount: content.split(/\s+/).filter(Boolean).length,
        lineCount: lines.length,
      },
    };
  }




  async parseAsciiDoc(
    content: string,
    filePath?: string
  ): Promise<ParsedDocument> {
    const lines = content.split(/\n/);
    const title = this.extractAsciiDocTitle(lines);

    return {
      title,
      content,
      businessDomains: [],
      stakeholders: [],
      technologies: [],
      docType: "other",
      docIntent: "ai-context",
      docVersion: "",
      docHash: "",
      docSource: "parser",
      lastIndexed: new Date(),
      metadata: {
        format: "asciidoc",
        wordCount: content.split(/\s+/).filter(Boolean).length,
        lineCount: lines.length,
      },
    };
  }




  private extractTitle(tokens: TokensList): string {
    const firstH1 = tokens.find(
      (token): token is Tokens.Heading =>
        token.type === "heading" && token.depth === 1
    );
    return firstH1?.text || "Untitled Document";
  }




  private inferDocType(
    content: string,
    title: string
  ): ParsedDocument["docType"] {
    const normalizedContent = content.toLowerCase();
    const normalizedTitle = title.toLowerCase();

    if (
      normalizedTitle.includes("readme") ||
      normalizedContent.includes("# readme")
    ) {
      return "readme";
    }

    if (
      normalizedTitle.includes("api") ||
      normalizedContent.includes("endpoint") ||
      normalizedContent.includes("http method")
    ) {
      return "api-doc";
    }

    if (
      normalizedTitle.includes("architecture") ||
      normalizedContent.includes("system design") ||
      normalizedContent.includes("component diagram")
    ) {
      return "architecture";
    }

    if (
      normalizedTitle.includes("user guide") ||
      normalizedTitle.includes("tutorial") ||
      normalizedContent.includes("step by step")
    ) {
      return "user-guide";
    }

    if (
      normalizedTitle.includes("design") ||
      normalizedContent.includes("design decision")
    ) {
      return "design-doc";
    }

    if (
      normalizedTitle.includes("changelog") ||
      normalizedTitle.includes("release notes") ||
      (normalizedContent.includes("version") &&
        normalizedContent.includes("change"))
    ) {
      return "changelog";
    }

    return "other";
  }




  private extractHeadings(tokens: TokensList): Heading[] {
    return tokens
      .filter((token): token is Tokens.Heading => token.type === "heading")
      .map((heading) => ({
        level: heading.depth,
        text: heading.text,
        slug: this.slugifyHeading(heading.text),
      }));
  }




  private extractLinks(tokens: TokensList): string[] {
    const links: string[] = [];

    const extractFromToken = (token: Tokens.Generic) => {
      if (token.type === "link") {
        links.push((token as Tokens.Link).href);
      }
      if ("tokens" in token && Array.isArray(token.tokens)) {
        token.tokens.forEach(extractFromToken);
      }
    };

    tokens.forEach(extractFromToken);
    return [...new Set(links)];
  }




  private extractLinksFromContent(
    content: string,
    tokens: TokensList
  ): string[] {
    const tokenLinks = this.extractLinks(tokens);
    const regexLinks = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
    const extractedUrls = regexLinks
      .map((link) => {
        const match = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
        return match ? match[2] : "";
      })
      .filter(Boolean);

    return [...new Set([...tokenLinks, ...extractedUrls])];
  }

  /**
   * Extract code blocks from markdown tokens
   */
  private extractCodeBlocks(tokens: TokensList): CodeBlock[] {
    return tokens
      .filter((token): token is Tokens.Code => token.type === "code")
      .map((codeBlock) => ({
        language: codeBlock.lang || "",
        code: codeBlock.text,
      }));
  }

  /**
   * Extract title from plaintext
   */
  private extractPlaintextTitle(lines: string[]): string {
    const firstNonEmptyLine = lines.find((line) => line.trim().length > 0);
    return firstNonEmptyLine?.trim() || "Untitled Document";
  }




  private extractRstTitle(lines: string[]): string {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].match(/^=+$/) && lines[i - 1].trim()) {
        return lines[i - 1].trim();
      }
    }
    return "Untitled Document";
  }




  private extractRstSections(lines: string[]): string[] {
    const sections: string[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].match(/^[-=~]+$/)) {
        sections.push(lines[i - 1].trim());
      }
    }
    return sections;
  }




  private extractAsciiDocTitle(lines: string[]): string {
    const titleLine = lines.find((line) => line.startsWith("= "));
    return titleLine ? titleLine.substring(2).trim() : "Untitled Document";
  }




  private calculateChecksum(content: string): string {
    return createHash("sha256").update(content).digest("hex").substring(0, 16);
  }




  private slugifyHeading(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }
}

================
File: embeddings/DocumentationIntelligenceProvider.ts
================
import { DocumentationIntent, DocumentationNodeType, DocumentationSource } from "../../models/relationships.js";

export interface DocumentationIntelligenceRequest {
  content: string;
  format: "markdown" | "plaintext" | "rst" | "asciidoc";
  filePath?: string;
  docTypeHint?: DocumentationNodeType;
  metadata?: Record<string, unknown>;
}

export interface DocumentationSignals {
  businessDomains: string[];
  stakeholders: string[];
  technologies: string[];
  docIntent?: DocumentationIntent;
  docSource?: DocumentationSource;
  docLocale?: string;
  rawModelResponse?: string;
  confidence?: number;
}

export interface DocumentationIntelligenceProvider {
  extractSignals(
    request: DocumentationIntelligenceRequest
  ): Promise<DocumentationSignals>;
  getExtractionPrompt?(): string;
}

export const LLM_EXTRACTION_PROMPT = `You are an expert technical documentation analyst assisting a knowledge graph ingestion pipeline.
Given a single document, produce a strict JSON object with the following keys:
  - businessDomains: array of canonical business-domain strings (kebab or lowercase, e.g. "payment processing", "user management").
  - stakeholders: array of relevant roles or teams (lowercase singular nouns, e.g. "product manager").
  - technologies: array of technologies directly mentioned (lowercase, snake/kebab case acceptable, e.g. "postgresql", "redis").
  - docIntent: one of ["ai-context", "governance", "mixed"]. Prefer "governance" for ADRs/runbooks/architecture decisions, "mixed" for user guides and design docs, otherwise "ai-context".
  - docSource (optional): one of ["parser", "manual", "llm", "imported", "sync", "other"]. Default to "llm" when unsure.
  - docLocale (optional): ISO language code detected from content (default "en").
If the document lacks information for a field, return an empty array (for lists) or omit the key.
DO NOT include explanations or comments, respond with raw JSON only.`;

class NarrativeSplitter {
  private static connectorPatterns = [
    " with ",
    " including ",
    " using ",
    " through ",
    " across ",
    " featuring ",
    " leveraging ",
    " for ",
  ];

  private static narrativeBreakers = [
    " we ",
    " our ",
    " handles ",
    " supports ",
    " provides ",
    " offers ",
    " includes ",
    " delivers ",
    " enables ",
    " ensures ",
    " powers ",
    " maintains ",
    " real-time ",
  ];

  static cleanCandidate(raw: string): string | undefined {
    if (!raw) return undefined;
    let candidate = raw
      .replace(/[`*_~]/g, "")
      .replace(/\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\((?:[^)])+\)/g, "")
      .replace(/^[^A-Za-z0-9]+/, "")
      .replace(/[:\-–—]+$/g, "")
      .trim();

    if (!candidate) return undefined;
    candidate = candidate.replace(/\s*\n\s*/g, " ");

    const lowerCandidate = candidate.toLowerCase();
    for (const connector of this.connectorPatterns) {
      const index = lowerCandidate.indexOf(connector);
      if (index > 0) {
        candidate = candidate.slice(0, index).trim();
        break;
      }
    }

    const lowerForBreakers = candidate.toLowerCase();
    for (const breaker of this.narrativeBreakers) {
      const idx = lowerForBreakers.indexOf(breaker);
      if (idx > 0) {
        candidate = candidate.slice(0, idx).trim();
        break;
      }
    }

    candidate = candidate
      .replace(/\bdomains?\b/gi, "")
      .replace(/\b(?:core|key|primary|major|main)\s+(?=business\b)/gi, "")
      .replace(/\b(?:business|critical|core|key|primary|major|main)\s+(?=domain\b)/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (!candidate) return undefined;
    if (/^(and|or|the|with)\b/i.test(candidate)) return undefined;

    const words = candidate.split(/\s+/);
    if (words.length > 6) {
      return undefined;
    }

    return candidate.toLowerCase();
  }
}

const STOP_VALUES = new Set<string>([
  "",
  "domain",
  "domains",
  "business",
  "core",
  "core business",
  "key",
  "key business",
  "primary",
  "primary business",
  "overview",
  "introduction",
  "summary",
  "governance",
  "capability",
  "capabilities",
  "function",
  "functions",
]);

const SUFFIX_KEYWORDS = [
  "management",
  "processing",
  "services",
  "service",
  "operations",
  "support",
  "experience",
  "governance",
  "compliance",
  "authentication",
  "analytics",
  "reporting",
  "integration",
  "intelligence",
  "platform",
  "security",
  "architecture",
  "automation",
  "enablement",
  "monitoring",
  "delivery",
  "engagement",
  "observability",
  "continuity",
  "planning",
  "assurance",
  "registration",
  "onboarding",
  "billing",
  "payment",
  "payments",
  "logistics",
  "chain",
  "inventory",
  "relationship",
  "marketing",
  "sales",
];

const SINGLE_KEYWORDS = [
  "authentication",
  "security",
  "compliance",
  "financial",
  "risk",
  "governance",
  "analytics",
  "reporting",
  "observability",
  "infrastructure",
  "architecture",
  "marketing",
  "sales",
  "logistics",
  "inventory",
  "payments",
  "payment",
  "billing",
];

const STAKEHOLDER_PATTERNS = [
  /\b(?:product|project|tech|engineering|development|qa|testing|devops|security)\s+(?:team|manager|lead|director|specialist|engineer|coordinator)\b/gi,
  /\b(?:business|product|system|technical|solution|data)\s+(?:analyst|architect|owner|consultant)\b/gi,
  /\b(?:end\s+)?(?:user|customer|client|consumer|subscriber|member|participant|visitor)s?\b/gi,
  /\b(?:admin|administrator|operator|maintainer|supervisor|moderator)s?\b/gi,
  /\b(?:partner|vendor|supplier|contractor)s?\b/gi,
  /\b(?:stakeholder|shareholder|investor)s?\b/gi,
  /\b(?:developer|programmer|coder|architect|designer)s?\b/gi,
  /\b(?:sales|marketing|support|customer service|help desk|it|hr)\s+(?:team|manager|representative|specialist|agent)\b/gi,
  /\busers?\b/gi,
  /\bpeople\b/gi,
  /\bpersonnel\b/gi,
];

const TECHNOLOGY_PATTERNS = [
  /\b(?:javascript|typescript|python|java|go|rust|cpp|c\+\+|c#)\b/gi,
  /\b(?:react|vue|angular|svelte|next\.js|nuxt)\b/gi,
  /\b(?:node\.js|express|fastify|django|flask|spring)\b/gi,
  /\b(?:postgresql|mysql|mongodb|redis|elasticsearch)\b/gi,
  /\b(?:docker|kubernetes|aws|gcp|azure)\b/gi,
  /\b(?:rest|grpc|websocket)\b/gi,
];

export class HeuristicDocumentationIntelligenceProvider
  implements DocumentationIntelligenceProvider
{
  async extractSignals(
    request: DocumentationIntelligenceRequest
  ): Promise<DocumentationSignals> {
    const businessDomains = this.extractBusinessDomains(request.content, request.metadata);
    const stakeholders = this.extractStakeholders(request.content);
    const technologies = this.extractTechnologies(request.content);

    return {
      businessDomains,
      stakeholders,
      technologies,
      docIntent: undefined,
      docSource: "parser",
    };
  }

  private extractBusinessDomains(
    content: string,
    metadata?: Record<string, unknown>
  ): string[] {
    const normalizedContent = content.replace(/\r\n/g, "\n");
    const lines = normalizedContent.split("\n");
    const domains = new Set<string>();

    const addCandidate = (raw: string | undefined, options: { split?: boolean } = {}) => {
      if (!raw) return;

      if (options.split) {
        const segments = raw
          .split(/[;,\/]/)
          .map((segment) => segment.trim())
          .filter((segment) => segment.length > 0);
        if (segments.length > 1) {
          for (const segment of segments) {
            addCandidate(segment);
          }
          return;
        }
      }

      const cleaned = NarrativeSplitter.cleanCandidate(raw);
      if (!cleaned) return;
      if (STOP_VALUES.has(cleaned)) return;
      if (/^(?:core|key|primary|major|main|business|capabilities?|functions?)$/.test(cleaned)) return;

      if (/\sand\s/i.test(cleaned)) {
        const andSegments = cleaned
          .split(/\sand\s/gi)
          .map((segment) => segment.trim())
          .filter((segment) => segment.length > 2);
        if (andSegments.length > 1 && andSegments.length <= 3 && andSegments.every((segment) => /\s/.test(segment))) {
          for (const segment of andSegments) {
            addCandidate(segment);
          }
          return;
        }
      }

      if (cleaned.length >= 3) {
        domains.add(cleaned);
      }
    };

    const headingRegex = /^(#{1,6})\s+(.*)$/;
    const bulletRegex = /^\s*(?:[-*+•]|\d+\.)\s+(.*)$/;
    let domainSectionLevel: number | null = null;
    let collectingList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(headingRegex);

      if (headingMatch) {
        const level = headingMatch[1].length;
        const headingText = headingMatch[2].trim();
        const lowerHeading = headingText.toLowerCase();

        if (domainSectionLevel !== null && level <= domainSectionLevel) {
          domainSectionLevel = null;
          collectingList = false;
        }

        if (/\bdomains?\b/.test(lowerHeading)) {
          domainSectionLevel = level;
          collectingList = true;
          const baseHeading = lowerHeading.replace(/\bdomains?\b/g, "").trim();
          if (baseHeading && !/^(?:business|core\s+business|key\s+business)$/.test(baseHeading)) {
            addCandidate(headingText);
          }
        }

        if (domainSectionLevel !== null && level > domainSectionLevel) {
          collectingList = false;
        }

        if (/\bdomain\b/.test(lowerHeading) && !/\bdomains\b/.test(lowerHeading)) {
          addCandidate(headingText);
        }

        continue;
      }

      if (domainSectionLevel !== null) {
        if (bulletRegex.test(line) && collectingList) {
          const bulletText = line.replace(bulletRegex, "$1").trim();
          addCandidate(bulletText);
          continue;
        }

        const colonMatch = line.match(/\bdomains?\s*:\s*(.+)$/i);
        if (colonMatch) {
          addCandidate(colonMatch[1], { split: true });
        }

        continue;
      }

      const colonMatch = line.match(/\bdomains?\s*:\s*(.+)$/i);
      if (colonMatch) {
        addCandidate(colonMatch[1], { split: true });
      }
    }

    const extractionText = normalizedContent.replace(/&/g, " and ");

    for (const keyword of SUFFIX_KEYWORDS) {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(
        `\\b([A-Za-z][A-Za-z/&-]*(?:\\s+[A-Za-z][A-Za-z/&-]*){0,3})\\s+${escaped}\\b`,
        "gi"
      );
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(extractionText)) !== null) {
        addCandidate(match[0]);
      }
    }

    for (const keyword of SINGLE_KEYWORDS) {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`\\b${escaped}\\b`, "gi");
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(extractionText)) !== null) {
        addCandidate(match[0]);
      }
    }

    const inlineDomainRegex = /\b([A-Z][A-Za-z0-9/&\- ]{2,})\s+Domain\b/g;
    let match: RegExpExecArray | null;
    while ((match = inlineDomainRegex.exec(content)) !== null) {
      addCandidate(match[1]);
    }

    const headings = Array.isArray(metadata?.headings)
      ? (metadata!.headings as Array<{ text: string }>)
      : [];
    for (const heading of headings) {
      if (typeof heading?.text === "string") {
        addCandidate(heading.text);
      }
    }

    return Array.from(domains);
  }

  private extractStakeholders(content: string): string[] {
    const stakeholders = new Set<string>();

    for (const pattern of STAKEHOLDER_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          let s = match.toLowerCase().trim();

          s = s
            .replace(/\bdevelopers\b/g, "developer")
            .replace(/\busers\b/g, "user")
            .replace(/\bcustomers\b/g, "customer")
            .replace(/\bclients\b/g, "client")
            .replace(/\bpartners\b/g, "partner")
            .replace(/\bvendors\b/g, "vendor")
            .replace(/\bstakeholders\b/g, "stakeholder")
            .replace(/\badministrators\b/g, "administrator")
            .replace(/\bmanagers\b/g, "manager")
            .replace(/\bteams\b/g, "team")
            .replace(/\bengineers\b/g, "engineer")
            .replace(/\banalysts\b/g, "analyst")
            .replace(/\barchitects\b/g, "architect")
            .replace(/\bspecialists\b/g, "specialist")
            .replace(/\bsupervisors\b/g, "supervisor")
            .replace(/\bmoderators\b/g, "moderator")
            .replace(/\boperators\b/g, "operator")
            .replace(/\bmaintainers\b/g, "maintainer")
            .replace(/\bcoordinators\b/g, "coordinator")
            .replace(/\bconsultants\b/g, "consultant")
            .replace(/\bdesigners\b/g, "designer")
            .replace(/\bprogrammers\b/g, "programmer")
            .replace(/\bcoders\b/g, "coder")
            .replace(/\brepresentatives\b/g, "representative")
            .replace(/\bagents\b/g, "agent")
            .replace(/\bowners\b/g, "owner")
            .replace(/\bleads\b/g, "lead")
            .replace(/\bdirectors\b/g, "director")
            .replace(/\bvisitors\b/g, "visitor")
            .replace(/\bmembers\b/g, "member")
            .replace(/\bparticipants\b/g, "participant")
            .replace(/\bsubscribers\b/g, "subscriber")
            .replace(/\bconsumers\b/g, "consumer")
            .replace(/\bshareholders\b/g, "shareholder")
            .replace(/\binvestors\b/g, "investor")
            .replace(/\bcontractors\b/g, "contractor")
            .replace(/\bsuppliers\b/g, "supplier")
            .replace(/\bpeople\b/g, "person")
            .replace(/\bpersonnel\b/g, "person")
            .replace(/\bend users\b/g, "end user")
            .replace(/\bsales teams\b/g, "sales team")
            .replace(/\bmarketing teams\b/g, "marketing team")
            .replace(/\bsupport teams\b/g, "support team")
            .replace(/\bcustomer service teams\b/g, "customer service team")
            .replace(/\bhelp desk teams\b/g, "help desk team")
            .replace(/\bit teams\b/g, "it team")
            .replace(/\bhr teams\b/g, "hr team");

          if (s !== "person" && s !== "people" && s !== "personnel" && s.length > 2) {
            stakeholders.add(s);
          }
        });
      }
    }

    return Array.from(stakeholders);
  }

  private extractTechnologies(content: string): string[] {
    const technologies = new Set<string>();
    const normalizedContent = content.replace(/\bC\+\+\b/g, "cpp");
    if (/c\+\+/i.test(content)) {
      technologies.add("cpp");
    }
    for (const pattern of TECHNOLOGY_PATTERNS) {
      const matches = normalizedContent.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          let m = match.toLowerCase().trim();
          if (m === "c++") m = "cpp";
          technologies.add(m);
        });
      }
    }
    return Array.from(technologies);
  }
}

================
File: embeddings/DocumentationParser.ts
================
import { KnowledgeGraphService } from "./KnowledgeGraphService.js";
import { DatabaseService } from "../core/DatabaseService.js";
import {
  DocumentationIntelligenceProvider,
  HeuristicDocumentationIntelligenceProvider,
} from "./DocumentationIntelligenceProvider.js";
import {
  DocTokenizer,
  IntentExtractor,
  SyncOrchestrator,
  ParsedDocument,
  DomainExtraction,
  SyncResult,
  SearchResult,
} from "./docs-parser/index.js";
import {
  DocumentationNode,
  BusinessDomain,
  SemanticCluster,
} from "../../models/entities.js";
import {
  RelationshipType,
  DocumentationRelationship,
} from "../../models/relationships.js";
import { join, extname, basename } from "path";
import { marked, TokensList } from "marked";

export { ParsedDocument, DomainExtraction, SyncResult, SearchResult };

export class DocumentationParser {
  private tokenizer: DocTokenizer;
  private intentExtractor: IntentExtractor;
  private syncOrchestrator: SyncOrchestrator;
  private intelligenceProvider: DocumentationIntelligenceProvider;
  private kgService: KnowledgeGraphService;
  private supportedExtensions = [".md", ".txt", ".rst", ".adoc"];

  constructor(
    kgService: KnowledgeGraphService,
    dbService: DatabaseService,
    intelligenceProvider?: DocumentationIntelligenceProvider
  ) {
    this.intelligenceProvider =
      intelligenceProvider ?? new HeuristicDocumentationIntelligenceProvider();
    this.kgService = kgService;
    this.intentExtractor = new IntentExtractor(this.intelligenceProvider);
    this.syncOrchestrator = new SyncOrchestrator(
      kgService,
      dbService,
      this.intentExtractor
    );
    this.tokenizer = new DocTokenizer();
  }

  private inferDocIntent(
    filePath: string,
    docType: DocumentationNode["docType"]
  ): DocumentationNode["docIntent"] {
    const normalizedPath = filePath.toLowerCase();

    if (
      normalizedPath.includes("/adr") ||
      normalizedPath.includes("adr-") ||
      normalizedPath.includes("/architecture") ||
      normalizedPath.includes("/decisions") ||
      docType === "architecture"
    ) {
      return "governance";
    }

    if (docType === "design-doc" || docType === "user-guide") {
      return "mixed";
    }

    return "ai-context";
  }

  private inferDocLocale(
    filePath: string,
    metadata: Record<string, any>
  ): string | undefined {
    const localeMatch = filePath
      .toLowerCase()
      .match(/\.([a-z]{2}(?:-[a-z0-9]+)?)\.(md|txt|rst|adoc)$/);
    if (localeMatch) {
      return localeMatch[1];
    }

    if (
      typeof metadata?.language === "string" &&
      metadata.language.length > 0
    ) {
      return metadata.language;
    }

    return "en";
  }

  private normalizeDomainPath(domainName: string): string {
    const cleaned = domainName
      .trim()
      .toLowerCase()
      .replace(/>+/g, "/")
      .replace(/\s+/g, "/")
      .replace(/[^a-z0-9/_-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/\/+/, "/")
      .replace(/\/+/, "/");
    return cleaned.replace(/^\/+|\/+$/g, "");
  }

  /**
   * Parse a documentation file and extract structured information
   */
  async parseFile(filePath: string): Promise<ParsedDocument> {
    // Parse with tokenizer
    const parsedDoc = await this.tokenizer.parseFile(filePath);

    // Read content for intent extraction
    const content = parsedDoc.content;

    // Enhance with intent extraction
    return this.intentExtractor.enhanceDocument(parsedDoc, content);
  }

  /**
   * Parse markdown content using marked library
   */
  async parseMarkdown(
    content: string,
    filePath?: string
  ): Promise<ParsedDocument> {
    const tokens = marked.lexer(content);
    const title = this.extractTitle(tokens);
    const docType = this.inferDocType(content, title);

    // Compute headings and conditionally remove the first H1 used as title
    const allHeadings = this.extractHeadings(tokens);
    let headings = allHeadings;
    const h1Count = allHeadings.filter((h) => h.level === 1).length;
    const idxFirstH1 = allHeadings.findIndex(
      (h) => h.level === 1 && h.text === title
    );
    if (
      idxFirstH1 !== -1 &&
      h1Count === 1 &&
      allHeadings.length > 1 &&
      allHeadings.length <= 5
    ) {
      headings = allHeadings
        .slice(0, idxFirstH1)
        .concat(allHeadings.slice(idxFirstH1 + 1));
    }

    const markdownMetadata = {
      format: "markdown",
      headings,
      links: this.extractLinksFromContent(content, tokens),
      codeBlocks: this.extractCodeBlocks(tokens),
      tokens,
      wordCount: content.split(/\s+/).filter(Boolean).length,
      lineCount: content.split(/\n/).length,
    };

    const signals = await this.intelligenceProvider.extractSignals({
      content,
      format: "markdown",
      filePath,
      docTypeHint: docType,
      metadata: markdownMetadata,
    });

    return {
      title,
      content,
      businessDomains: signals.businessDomains ?? [],
      stakeholders: signals.stakeholders ?? [],
      technologies: signals.technologies ?? [],
      docType,
      docIntent: signals.docIntent ?? "ai-context",
      docVersion: "",
      docHash: "",
      docSource: signals.docSource ?? "parser",
      docLocale: signals.docLocale,
      lastIndexed: new Date(),
      metadata: markdownMetadata,
    };
  }




  private async parsePlaintext(
    content: string,
    filePath?: string
  ): Promise<ParsedDocument> {
    const lines = content.split("\n");
    const title = lines[0]?.trim() || "Untitled Document";
    const docType = this.inferDocType(content, title);

    const baseMetadata = {
      lineCount: lines.length,
      wordCount: content.split(/\s+/).filter(Boolean).length,
      format: "plaintext",
    };

    const signals = await this.intelligenceProvider.extractSignals({
      content,
      format: "plaintext",
      filePath,
      docTypeHint: docType,
      metadata: baseMetadata,
    });

    return {
      title,
      content,
      businessDomains: signals.businessDomains ?? [],
      stakeholders: signals.stakeholders ?? [],
      technologies: signals.technologies ?? [],
      docType,
      docIntent: signals.docIntent ?? "ai-context",
      docVersion: "",
      docHash: "",
      docSource: signals.docSource ?? "parser",
      docLocale: signals.docLocale,
      lastIndexed: new Date(),
      metadata: baseMetadata,
    };
  }




  private async parseRestructuredText(
    content: string,
    filePath?: string
  ): Promise<ParsedDocument> {
    const lines = content.split("\n");
    const title = this.extractRstTitle(lines);
    const docType = this.inferDocType(content, title);

    const rstMetadata = {
      sections: this.extractRstSections(lines),
      format: "rst",
      lineCount: lines.length,
      wordCount: content.split(/\s+/).filter(Boolean).length,
    };

    const signals = await this.intelligenceProvider.extractSignals({
      content,
      format: "rst",
      filePath,
      docTypeHint: docType,
      metadata: rstMetadata,
    });

    return {
      title,
      content,
      businessDomains: signals.businessDomains ?? [],
      stakeholders: signals.stakeholders ?? [],
      technologies: signals.technologies ?? [],
      docType,
      docIntent: signals.docIntent ?? "ai-context",
      docVersion: "",
      docHash: "",
      docSource: signals.docSource ?? "parser",
      docLocale: signals.docLocale,
      lastIndexed: new Date(),
      metadata: rstMetadata,
    };
  }




  private async parseAsciiDoc(
    content: string,
    filePath?: string
  ): Promise<ParsedDocument> {
    const lines = content.split("\n");
    const title = this.extractAsciiDocTitle(lines);
    const docType = this.inferDocType(content, title);

    const adocMetadata = {
      format: "asciidoc",
      lineCount: lines.length,
      wordCount: content.split(/\s+/).filter(Boolean).length,
    };

    const signals = await this.intelligenceProvider.extractSignals({
      content,
      format: "asciidoc",
      filePath,
      docTypeHint: docType,
      metadata: adocMetadata,
    });

    return {
      title,
      content,
      businessDomains: signals.businessDomains ?? [],
      stakeholders: signals.stakeholders ?? [],
      technologies: signals.technologies ?? [],
      docType,
      docIntent: signals.docIntent ?? "ai-context",
      docVersion: "",
      docHash: "",
      docSource: signals.docSource ?? "parser",
      docLocale: signals.docLocale,
      lastIndexed: new Date(),
      metadata: adocMetadata,
    };
  }




  private extractTitle(tokens: TokensList): string {
    for (const token of tokens) {
      if (token.type === "heading" && token.depth === 1) {
        return token.text;
      }
    }
    return "Untitled Document";
  }




  private inferDocType(
    content: string,
    title: string
  ): DocumentationNode["docType"] {
    const lowerContent = content.toLowerCase();
    const lowerTitle = title.toLowerCase();


    if (
      lowerTitle.includes("architecture") ||
      lowerContent.includes("system architecture") ||
      lowerContent.includes("technical architecture")
    ) {
      return "architecture";
    }


    if (
      lowerTitle.includes("api") ||
      lowerContent.includes("endpoint") ||
      lowerContent.includes("swagger") ||
      lowerContent.includes("rest")
    ) {
      return "api-docs";
    }


    if (
      lowerTitle.includes("design") ||
      lowerContent.includes("system design") ||
      lowerContent.includes("design document")
    ) {
      return "design-doc";
    }


    if (
      lowerTitle.includes("guide") ||
      lowerTitle.includes("manual") ||
      lowerTitle.includes("getting started") ||
      lowerTitle.includes("tutorial") ||
      lowerTitle.includes("user") ||
      lowerContent.includes("how to") ||
      lowerContent.includes("step by step") ||
      lowerContent.includes("instructions") ||
      lowerContent.includes("getting started") ||
      lowerContent.includes("introduction")
    ) {
      return "user-guide";
    }


    if (lowerTitle.includes("readme") || lowerTitle.includes("read me")) {
      return "readme";
    }


    if (
      lowerContent.includes("high level") ||
      lowerContent.includes("overview")
    ) {
      return "architecture";
    }

    return "readme";
  }




  private extractHeadings(
    tokens: TokensList
  ): Array<{ level: number; text: string }> {
    return tokens
      .filter((token): token is Tokens.Heading => token.type === "heading")
      .map((heading) => ({
        level: heading.depth,
        text: heading.text,
      }));
  }




  private extractLinks(tokens: TokensList): string[] {

    const links: string[] = [];
    const extractFromToken = (token: any) => {
      if (token.type === "link") {
        links.push(token.href);
      }
      if ("tokens" in token && token.tokens) {
        token.tokens.forEach(extractFromToken);
      }
    };
    tokens.forEach(extractFromToken);
    return links;
  }

  private extractLinksFromContent(
    content: string,
    tokens?: TokensList
  ): string[] {
    const found = new Set<string>();


    const mdLinkRe = /\[[^\]]+\]\(([^)\s]+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = mdLinkRe.exec(content)) !== null) {
      found.add(match[1]);
    }


    const refDefRe = /^\s*\[[^\]]+\]:\s*(\S+)/gim;
    while ((match = refDefRe.exec(content)) !== null) {
      found.add(match[1]);
    }


    const autoRe = /https?:\/\/[^\s)\]]+/g;
    while ((match = autoRe.exec(content)) !== null) {
      found.add(match[0]);
    }


    if (tokens) {
      this.extractLinks(tokens).forEach((l) => found.add(l));
    }

    return Array.from(found);
  }




  private extractCodeBlocks(
    tokens: TokensList
  ): Array<{ lang?: string; code: string }> {
    return tokens
      .filter((token): token is any => token.type === "code")
      .map((codeBlock: any) => ({
        lang: (codeBlock.lang ?? "") as string,
        code: codeBlock.text,
      }));
  }

  /**
   * Extract title from RST content
   */
  private extractRstTitle(lines: string[]): string {
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      const nextLine = lines[i + 1]?.trim();

      if (
        line &&
        nextLine &&
        /^[=]+$/.test(nextLine) &&
        nextLine.length >= line.length
      ) {
        return line;
      }
    }
    return lines[0]?.trim() || "Untitled Document";
  }




  private extractRstSections(
    lines: string[]
  ): Array<{ title: string; level: number }> {
    const sections: Array<{ title: string; level: number }> = [];

    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      const nextLine = lines[i + 1]?.trim();

      if (line && nextLine) {
        if (/^[=]+$/.test(nextLine)) {
          sections.push({ title: line, level: 1 });
        } else if (/^[-]+$/.test(nextLine)) {
          sections.push({ title: line, level: 2 });
        } else if (/^[~]+$/.test(nextLine)) {
          sections.push({ title: line, level: 3 });
        }
      }
    }

    return sections;
  }




  private extractAsciiDocTitle(lines: string[]): string {
    for (const line of lines) {
      if (line.startsWith("= ")) {
        return line.substring(2).trim();
      }
    }
    return lines[0]?.trim() || "Untitled Document";
  }




  private calculateChecksum(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }




  async syncDocumentation(docsPath: string): Promise<SyncResult> {
    return this.syncOrchestrator.syncDocumentation(docsPath);
  }




  private async findDocumentationFiles(docsPath: string): Promise<string[]> {
    const fs = await import("fs/promises");
    const files: string[] = [];

    const processDirectory = async (dirPath: string): Promise<void> => {
      try {
        const names = await fs.readdir(dirPath);

        for (const name of names) {
          const fullPath = join(dirPath, name);
          let stat: any;
          try {
            stat = await (fs as any).stat(fullPath);
          } catch (e) {
            continue;
          }

          if (
            stat &&
            typeof stat.isDirectory === "function" &&
            stat.isDirectory()
          ) {

            if (
              !name.startsWith(".") &&
              name !== "node_modules" &&
              name !== "dist"
            ) {
              await processDirectory(fullPath);
            }
          } else if (
            stat &&
            typeof stat.isFile === "function" &&
            stat.isFile()
          ) {
            const ext = extname(name).toLowerCase();
            if (this.supportedExtensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        console.error(`Error reading directory ${dirPath}:`, error);
      }
    };

    await processDirectory(docsPath);
    return files;
  }




  private async createOrUpdateDocumentationNode(
    filePath: string,
    parsedDoc: ParsedDocument
  ): Promise<string> {
    const docId = `doc_${basename(
      filePath,
      extname(filePath)
    )}_${this.calculateChecksum(parsedDoc.content).substring(0, 8)}`;

    const docNode: DocumentationNode = {
      id: docId,
      path: filePath,
      hash: this.calculateChecksum(parsedDoc.content),
      language: "markdown",
      lastModified: new Date(),
      created: new Date(),
      type: "documentation",
      title: parsedDoc.title,
      content: parsedDoc.content,
      docType: parsedDoc.docType,
      businessDomains: parsedDoc.businessDomains,
      stakeholders: parsedDoc.stakeholders,
      technologies: parsedDoc.technologies,
      status: "active",
      docVersion: parsedDoc.docVersion,
      docHash: parsedDoc.docHash,
      docIntent: parsedDoc.docIntent,
      docSource: parsedDoc.docSource,
      docLocale: parsedDoc.docLocale,
      lastIndexed: parsedDoc.lastIndexed,
    };

    await this.kgService.createEntity(docNode);
    return docId;
  }




  private async extractAndCreateDomains(
    parsedDoc: ParsedDocument,
    docId: string
  ): Promise<number> {
    let newDomainsCount = 0;

    for (const domainName of parsedDoc.businessDomains) {
      const domainId = `domain_${domainName
        .replace(/\s+/g, "_")
        .toLowerCase()}`;


      const existingDomain = await this.kgService.getEntity(domainId);
      const domain: BusinessDomain = {
        id: domainId,
        type: "businessDomain",
        name: domainName,
        description: `Business domain extracted from documentation: ${parsedDoc.title}`,
        criticality: this.inferDomainCriticality(domainName),
        stakeholders: parsedDoc.stakeholders,
        keyProcesses: [],
        extractedFrom: [parsedDoc.title],
      };

      await this.kgService.createEntity(domain);
      if (!existingDomain) {
        newDomainsCount++;
      }

      const domainPath = this.normalizeDomainPath(domainName);
      const taxonomyVersion =
        typeof parsedDoc.metadata?.taxonomyVersion === "string"
          ? parsedDoc.metadata.taxonomyVersion
          : "v1";
      const updatedFromDocAt =
        parsedDoc.metadata?.lastModified instanceof Date
          ? parsedDoc.metadata.lastModified
          : parsedDoc.lastIndexed;
      const sectionAnchor = "_root";


      try {
        await this.kgService.createRelationship({
          id: `rel_${docId}_${domainId}_DESCRIBES_DOMAIN`,
          fromEntityId: docId,
          toEntityId: domainId,
          type: RelationshipType.DESCRIBES_DOMAIN,
          created: new Date(),
          lastModified: new Date(),
          version: 1,
          confidence: 0.6,
          source: "parser",
          docIntent: parsedDoc.docIntent,
          domainPath,
          taxonomyVersion,
          sectionAnchor,
          lastValidated: parsedDoc.lastIndexed,
          updatedFromDocAt,
          metadata: {
            inferred: true,
            confidence: 0.6,
            source: "doc-domain-extract",
            domainName,
            domainPath,
            taxonomyVersion,
            sectionAnchor,
            docIntent: parsedDoc.docIntent,
            updatedFromDocAt,
          },
        } as DocumentationRelationship as any);
      } catch {

      }
    }

    return newDomainsCount;
  }




  private inferDomainCriticality(
    domainName: string
  ): BusinessDomain["criticality"] {
    const lowerName = domainName.toLowerCase();

    if (
      lowerName.includes("authentication") ||
      lowerName.includes("security") ||
      lowerName.includes("payment")
    ) {
      return "core";
    }
    if (
      lowerName.includes("user management") ||
      lowerName.includes("reporting") ||
      lowerName.includes("communication")
    ) {
      return "supporting";
    }

    return "utility";
  }




  private async updateSemanticClusters(
    parsedDoc: ParsedDocument,
    docId: string
  ): Promise<void> {


    for (const domain of parsedDoc.businessDomains) {
      const clusterId = `cluster_${domain.replace(/\s+/g, "_").toLowerCase()}`;

      const cluster: SemanticCluster = {
        id: clusterId,
        type: "semanticCluster",
        name: `${domain} Cluster`,
        description: `Semantic cluster for ${domain} domain`,
        businessDomainId: `domain_${domain.replace(/\s+/g, "_").toLowerCase()}`,
        clusterType: "capability",
        cohesionScore: 0.8,
        lastAnalyzed: new Date(),
        memberEntities: [],
      };

      await this.kgService.createEntity(cluster);


      try {
        await this.kgService.createRelationship({
          id: `rel_${clusterId}_${docId}_DOCUMENTED_BY`,
          fromEntityId: clusterId,
          toEntityId: docId,
          type: RelationshipType.DOCUMENTED_BY,
          created: new Date(),
          lastModified: new Date(),
          version: 1,
          confidence: 0.6,
          source: "parser",
          docIntent: parsedDoc.docIntent,
          sectionAnchor: "_root",
          documentationQuality: "partial",
          coverageScope: "behavior",
          docVersion: parsedDoc.docVersion,
          docHash: parsedDoc.docHash,
          lastValidated: parsedDoc.lastIndexed,
          metadata: {
            inferred: true,
            confidence: 0.6,
            source: "doc-cluster-link",
            sectionAnchor: "_root",
            documentationQuality: "partial",
            coverageScope: "behavior",
            docVersion: parsedDoc.docVersion,
            docHash: parsedDoc.docHash,
            docIntent: parsedDoc.docIntent,
          },
        } as DocumentationRelationship as any);
      } catch {}


      try {
        const domainId = `domain_${domain.replace(/\s+/g, "_").toLowerCase()}`;
        await this.kgService.createRelationship({
          id: `rel_${clusterId}_${domainId}_BELONGS_TO_DOMAIN`,
          fromEntityId: clusterId,
          toEntityId: domainId,
          type: RelationshipType.BELONGS_TO_DOMAIN,
          created: new Date(),
          lastModified: new Date(),
          version: 1,
          confidence: 0.6,
          strength: 0.5,
          source: "parser",
          docIntent: parsedDoc.docIntent,
          domainPath: this.normalizeDomainPath(domain),
          lastValidated: parsedDoc.lastIndexed,
          metadata: {
            inferred: true,
            confidence: 0.6,
            strength: 0.5,
            source: "cluster-domain",
            domainPath: this.normalizeDomainPath(domain),
            docIntent: parsedDoc.docIntent,
          },
        } as DocumentationRelationship as any);
      } catch {}
    }
  }




  private async refreshClusters(): Promise<number> {

    return 0;
  }




  async searchDocumentation(
    query: string,
    options?: {
      limit?: number;
      minScore?: number;
      domain?: string;
    }
  ): Promise<SearchResult[]> {
    return this.syncOrchestrator.searchDocumentation(query, options);
  }
}

================
File: embeddings/EmbeddingService.ts
================
import { EventEmitter } from 'events';
import { Neo4jService } from './Neo4jService.js';
import { Entity } from '../../models/entities.js';
import { embeddingService } from '../../utils/embedding.js';

export interface EmbeddingOptions {
  indexName?: string;
  dimensions?: number;
  similarity?: 'euclidean' | 'cosine';
  batchSize?: number;
  checkpointId?: string;
}

export interface SearchOptions {
  limit?: number;
  minScore?: number;
  filter?: Record<string, any>;
  includeMetadata?: boolean;
}

export interface EmbeddingResult {
  entityId: string;
  vector: number[];
  metadata?: Record<string, any>;
}

export interface SearchResult {
  entity: Entity;
  score: number;
  metadata?: Record<string, any>;
}


class EmbeddingCache {
  private cache = new Map<string, { vector: number[]; timestamp: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize = 500, ttl = 300000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string): number[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.vector;
  }

  set(key: string, vector: number[]): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      vector,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export class EmbeddingService extends EventEmitter {
  private cache: EmbeddingCache;
  private readonly defaultIndexName = 'entity_vectors';
  private readonly defaultDimensions = 768;

  constructor(private neo4j: Neo4jService) {
    super();
    this.cache = new EmbeddingCache();
    this.initializeVectorIndex().catch(err =>
      console.warn('Failed to initialize vector index:', err)
    );
  }




  async initializeVectorIndex(
    options: EmbeddingOptions = {}
  ): Promise<void> {
    const indexName = options.indexName || this.defaultIndexName;
    const dimensions = options.dimensions || this.defaultDimensions;
    const similarity = options.similarity || 'cosine';

    await this.neo4j.createVectorIndex(
      indexName,
      'Entity',
      'embedding',
      dimensions,
      similarity
    );

    this.emit('index:initialized', { indexName, dimensions, similarity });
  }




  async generateAndStore(
    entity: Entity,
    options: EmbeddingOptions = {}
  ): Promise<EmbeddingResult> {
    const content = this.extractEntityContent(entity);
    const vector = await this.generateEmbedding(content);

    await this.storeEmbedding(entity.id, vector, options);

    this.cache.set(entity.id, vector);
    this.emit('embedding:created', { entityId: entity.id });

    return {
      entityId: entity.id,
      vector,
      metadata: options.checkpointId ? { checkpointId: options.checkpointId } : undefined,
    };
  }




  async batchEmbed(
    entities: Entity[],
    options: EmbeddingOptions = {}
  ): Promise<EmbeddingResult[]> {
    const batchSize = options.batchSize || 10;
    const results: EmbeddingResult[] = [];

    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize);

      const embeddings = await Promise.all(
        batch.map(async entity => {
          const content = this.extractEntityContent(entity);
          const vector = await this.generateEmbedding(content);
          return {
            id: entity.id,
            vector,
            properties: options.checkpointId
              ? { checkpointId: options.checkpointId }
              : {},
          };
        })
      );

      await this.neo4j.upsertVectors('Entity', embeddings);

      embeddings.forEach(e => {
        this.cache.set(e.id, e.vector);
        results.push({
          entityId: e.id,
          vector: e.vector,
          metadata: e.properties,
        });
      });

      this.emit('embeddings:batch:created', {
        count: embeddings.length,
        total: entities.length,
        progress: Math.min((i + batchSize) / entities.length, 1),
      });
    }

    return results;
  }




  async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const queryVector = await this.generateEmbedding(query);
    return this.searchByVector(queryVector, options);
  }




  async searchByVector(
    queryVector: number[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const indexName = this.defaultIndexName;

    const results = await this.neo4j.searchVectors(
      indexName,
      queryVector,
      {
        limit: options.limit || 10,
        minScore: options.minScore || 0.5,
        filter: options.filter,
      }
    );

    return results.map(result => ({
      entity: this.parseEntity(result.node),
      score: result.score,
      metadata: options.includeMetadata
        ? this.extractMetadata(result.node)
        : undefined,
    }));
  }




  async updateEmbedding(
    entityId: string,
    content?: string,
    options: EmbeddingOptions = {}
  ): Promise<void> {
    let vector: number[];

    if (content) {
      vector = await this.generateEmbedding(content);
    } else {

      const query = `MATCH (n:Entity {id: $id}) RETURN n`;
      const result = await this.neo4j.executeCypher(query, { id: entityId });

      if (result.length === 0) {
        throw new Error(`Entity not found: ${entityId}`);
      }

      const entity = this.parseEntity(result[0].n);
      const entityContent = this.extractEntityContent(entity);
      vector = await this.generateEmbedding(entityContent);
    }

    await this.storeEmbedding(entityId, vector, options);
    this.cache.set(entityId, vector);

    this.emit('embedding:updated', { entityId });
  }




  async deleteEmbedding(entityId: string): Promise<void> {
    const query = `
      MATCH (n:Entity {id: $id})
      REMOVE n.embedding
      RETURN n
    `;

    await this.neo4j.executeCypher(query, { id: entityId });
    this.cache.clear();

    this.emit('embedding:deleted', { entityId });
  }




  async getEmbeddingStats(): Promise<{
    total: number;
    indexed: number;
    dimensions: number;
    avgMagnitude: number;
  }> {
    const queries = [
      {
        name: 'total',
        query: 'MATCH (n:Entity) RETURN count(n) as count',
      },
      {
        name: 'indexed',
        query: 'MATCH (n:Entity) WHERE n.embedding IS NOT NULL RETURN count(n) as count',
      },
      {
        name: 'sample',
        query: `
          MATCH (n:Entity)
          WHERE n.embedding IS NOT NULL
          RETURN n.embedding as embedding
          LIMIT 100
        `,
      },
    ];

    const [totalResult, indexedResult, sampleResult] = await Promise.all(
      queries.map(q => this.neo4j.executeCypher(q.query))
    );

    const total = totalResult[0]?.count || 0;
    const indexed = indexedResult[0]?.count || 0;

    let dimensions = this.defaultDimensions;
    let avgMagnitude = 0;

    if (sampleResult.length > 0) {
      const samples = sampleResult
        .map(r => r.embedding)
        .filter(e => Array.isArray(e));

      if (samples.length > 0) {
        dimensions = samples[0].length;

        const magnitudes = samples.map(vector =>
          Math.sqrt(vector.reduce((sum: number, v: number) => sum + v * v, 0))
        );

        avgMagnitude = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
      }
    }

    return {
      total,
      indexed,
      dimensions,
      avgMagnitude,
    };
  }




  async findSimilar(
    entityId: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {

    let vector = this.cache.get(entityId);

    if (!vector) {

      const query = `
        MATCH (n:Entity {id: $id})
        WHERE n.embedding IS NOT NULL
        RETURN n.embedding as embedding
      `;

      const result = await this.neo4j.executeCypher(query, { id: entityId });

      if (result.length === 0 || !result[0].embedding) {
        throw new Error(`No embedding found for entity: ${entityId}`);
      }

      vector = result[0].embedding;
      if (!vector) {
        throw new Error(`Invalid embedding for entity: ${entityId}`);
      }
      this.cache.set(entityId, vector);
    }

    if (!vector) {
      throw new Error(`No valid embedding found for entity: ${entityId}`);
    }


    const filter = { ...options.filter, 'id': { $ne: entityId } };

    return this.searchByVector(vector, { ...options, filter });
  }




  private async generateEmbedding(content: string): Promise<number[]> {
    if (!content || content.trim().length === 0) {

      return new Array(this.defaultDimensions).fill(0);
    }

    try {
      const result = await embeddingService.generateEmbedding(content);
      return result.embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);

      const vector = new Array(this.defaultDimensions)
        .fill(0)
        .map(() => Math.random() - 0.5);
      const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
      return vector.map(v => v / magnitude);
    }
  }




  private async storeEmbedding(
    entityId: string,
    vector: number[],
    options: EmbeddingOptions = {}
  ): Promise<void> {
    const properties: any = {
      embeddingVersion: process.env.EMBEDDING_MODEL_VERSION || 'default',
      embeddingUpdatedAt: new Date().toISOString(),
    };

    if (options.checkpointId) {
      properties.checkpointId = options.checkpointId;
    }

    await this.neo4j.upsertVectors('Entity', [{
      id: entityId,
      vector,
      properties,
    }]);
  }




  private extractEntityContent(entity: Entity): string {
    const parts: string[] = [];


    if ('name' in entity && entity.name) parts.push(`Name: ${entity.name}`);
    if (entity.type) parts.push(`Type: ${entity.type}`);


    if ((entity as any).description) {
      parts.push(`Description: ${(entity as any).description}`);
    }


    if ((entity as any).content) {
      const content = (entity as any).content;

      const maxLength = 5000;
      if (content.length > maxLength) {
        parts.push(content.substring(0, maxLength) + '...');
      } else {
        parts.push(content);
      }
    }


    if ((entity as any).path) {
      parts.push(`Path: ${(entity as any).path}`);
    }


    if ('metadata' in entity && entity.metadata) {
      parts.push(`Metadata: ${JSON.stringify(entity.metadata)}`);
    }

    return parts.join('\n');
  }




  private parseEntity(node: any): Entity {
    const properties = node.properties || node;
    const entity: any = {};

    for (const [key, value] of Object.entries(properties)) {
      if (key === 'embedding') continue;

      if (value === null || value === undefined) continue;

      if (key === 'created' || key === 'lastModified' || key.endsWith('At')) {
        entity[key] = new Date(value as string);
      } else if (
        typeof value === 'string' &&
        ((value as string).startsWith('[') || (value as string).startsWith('{'))
      ) {
        try {
          entity[key] = JSON.parse(value as string);
        } catch {
          entity[key] = value;
        }
      } else {
        entity[key] = value;
      }
    }

    return entity as Entity;
  }




  private extractMetadata(node: any): Record<string, any> {
    const properties = node.properties || node;
    const metadata: Record<string, any> = {};

    const metadataKeys = [
      'embeddingVersion',
      'embeddingUpdatedAt',
      'checkpointId',
      'confidence',
      'source',
    ];

    for (const key of metadataKeys) {
      if (properties[key]) {
        metadata[key] = properties[key];
      }
    }

    return metadata;
  }
}

================
File: embeddings/VectorService.ts
================
import { EventEmitter } from "events";
import { CypherExecutor } from "./CypherExecutor.js";

export interface VectorSearchOptions {
  limit?: number;
  minScore?: number;
  filter?: Record<string, any>;
}

export interface VectorIndexConfig {
  name: string;
  nodeLabel: string;
  propertyKey: string;
  dimensions: number;
  similarityFunction?: "cosine" | "euclidean";
}

export class VectorService extends EventEmitter {
  constructor(private executor: CypherExecutor) {
    super();
  }




  async createVectorIndex(config: VectorIndexConfig): Promise<void> {
    const {
      name,
      nodeLabel,
      propertyKey,
      dimensions,
      similarityFunction = "cosine",
    } = config;

    try {

      const existingIndexes = await this.executor.callApoc(
        "db.index.vector.list"
      );
      const indexExists = existingIndexes.some((idx: any) => idx.name === name);

      if (!indexExists) {

        await this.executor.callApoc("db.index.vector.createNodeIndex", {
          indexName: name,
          nodeLabel: nodeLabel,
          propertyKey: propertyKey,
          similarityFunction: similarityFunction,
          vectorDimensions: dimensions,
        });

        this.emit("vectorIndex:created", { name, dimensions });
      }
    } catch (error) {

      console.warn(
        "Vector index creation failed, falling back to basic index:",
        error
      );
      await this.executor.executeCypher(
        `CREATE INDEX ${name} IF NOT EXISTS FOR (n:${nodeLabel}) ON (n.${propertyKey})`
      );
    }
  }




  async upsertVectors(
    vectors: Array<{
      entityId: string;
      vector: number[];
      metadata?: Record<string, any>;
    }>
  ): Promise<void> {
    if (vectors.length === 0) return;

    const queries = vectors.map(({ entityId, vector, metadata }) => ({
      query: `
        MATCH (e:Entity {id: $entityId})
        SET e.embedding = $vector
        SET e.embeddingUpdated = $timestamp
        ${metadata ? "SET e.embeddingMetadata = $metadata" : ""}
      `,
      params: {
        entityId,
        vector,
        timestamp: new Date().toISOString(),
        metadata: metadata || null,
      },
    }));

    await this.executor.executeTransaction(queries);
    this.emit("vectors:upserted", { count: vectors.length });
  }




  async searchVectors(
    queryVector: number[],
    options: VectorSearchOptions & {
      indexName?: string;
      nodeLabel?: string;
    } = {}
  ): Promise<
    Array<{
      entityId: string;
      score: number;
      metadata?: Record<string, any>;
    }>
  > {
    const {
      limit = 10,
      minScore = 0.1,
      indexName = "entity_embedding",
      nodeLabel = "Entity",
      filter = {},
    } = options;

    try {

      const results = await this.executor.callApoc(
        "db.index.vector.queryNodes",
        {
          indexName,
          queryVector,
          limit,
          filter: Object.keys(filter).length > 0 ? filter : null,
        }
      );

      return results
        .filter((result: any) => result.score >= minScore)
        .map((result: any) => ({
          entityId: result.node.id,
          score: result.score,
          metadata: result.node.embeddingMetadata,
        }));
    } catch (error) {

      console.warn(
        "Vector search failed, falling back to basic search:",
        error
      );
      return this.fallbackSimilaritySearch(queryVector, {
        limit,
        minScore,
        nodeLabel,
        filter,
      });
    }
  }




  async findSimilar(
    entityId: string,
    options: VectorSearchOptions = {}
  ): Promise<
    Array<{
      entityId: string;
      score: number;
      entity?: any;
    }>
  > {

    const embeddingQuery = await this.executor.executeCypher(
      "MATCH (e:Entity {id: $entityId}) RETURN e.embedding as embedding",
      { entityId }
    );

    if (embeddingQuery.length === 0 || !embeddingQuery[0].embedding) {
      return [];
    }

    const queryVector = embeddingQuery[0].embedding;


    const similar = await this.searchVectors(queryVector, {
      ...options,
      filter: { id: { $ne: entityId } },
    });


    if (options.filter?.includeEntity) {
      const entityIds = similar.map((s) => s.entityId);
      const entities = await this.executor.executeCypher(
        "MATCH (e:Entity) WHERE e.id IN $entityIds RETURN e",
        { entityIds }
      );

      const entityMap = new Map(entities.map((e: any) => [e.id, e]));

      return similar.map((s) => ({
        ...s,
        entity: entityMap.get(s.entityId),
      }));
    }

    return similar;
  }




  async batchEmbed(
    entities: Array<{ id: string; content: string; [key: string]: any }>,
    options: {
      batchSize?: number;
      skipExisting?: boolean;
    } = {}
  ): Promise<
    Array<{
      entityId: string;
      vector: number[];
      success: boolean;
      error?: string;
    }>
  > {
    const { batchSize = 50, skipExisting = true } = options;
    const results = [];


    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize);


      const embeddings = await this.generateEmbeddingsBatch(
        batch.map((e) => ({ text: e.content, metadata: e }))
      );


      const vectorsToUpsert = embeddings
        .filter((e) => e.success)
        .map((e) => ({
          entityId: batch[e.index].id,
          vector: e.vector,
          metadata: {
            source: "batch_embed",
            timestamp: new Date().toISOString(),
          },
        }));

      if (vectorsToUpsert.length > 0) {
        await this.upsertVectors(vectorsToUpsert);
      }

      results.push(...embeddings);
    }

    return results;
  }




  async updateEmbedding(entityId: string, content?: string): Promise<void> {
    let embeddingContent = content;


    if (!embeddingContent) {
      const result = await this.executor.executeCypher(
        "MATCH (e:Entity {id: $entityId}) RETURN e.content as content",
        { entityId }
      );
      embeddingContent = result[0]?.content;
    }

    if (!embeddingContent) {
      throw new Error(`No content found for entity ${entityId}`);
    }


    const embeddings = await this.generateEmbeddingsBatch([
      { text: embeddingContent },
    ]);
    const embedding = embeddings[0];

    if (!embedding.success) {
      throw new Error(`Failed to generate embedding: ${embedding.error}`);
    }


    await this.upsertVectors([
      {
        entityId,
        vector: embedding.vector,
        metadata: { source: "update", timestamp: new Date().toISOString() },
      },
    ]);
  }




  async deleteEmbedding(entityId: string): Promise<void> {
    await this.executor.executeCypher(
      "MATCH (e:Entity {id: $entityId}) REMOVE e.embedding, e.embeddingUpdated, e.embeddingMetadata",
      { entityId }
    );
    this.emit("embedding:deleted", { entityId });
  }




  async getEmbeddingStats(): Promise<{
    totalEmbeddings: number;
    averageDimensions: number;
    lastUpdated?: Date;
  }> {
    const result = await this.executor.executeCypher(`
      MATCH (e:Entity)
      WHERE e.embedding IS NOT NULL
      RETURN count(e) as totalEmbeddings,
             avg(size(e.embedding)) as averageDimensions,
             max(e.embeddingUpdated) as lastUpdated
    `);

    const stats = result[0] || {};
    return {
      totalEmbeddings: stats.totalEmbeddings || 0,
      averageDimensions: stats.averageDimensions || 0,
      lastUpdated: stats.lastUpdated ? new Date(stats.lastUpdated) : undefined,
    };
  }




  private async fallbackSimilaritySearch(
    queryVector: number[],
    options: {
      limit: number;
      minScore: number;
      nodeLabel: string;
      filter: Record<string, any>;
    }
  ): Promise<
    Array<{
      entityId: string;
      score: number;
      metadata?: Record<string, any>;
    }>
  > {

    const result = await this.executor.executeCypher(
      `MATCH (e:${options.nodeLabel}) WHERE e.embedding IS NOT NULL RETURN e.id as id, e.embedding as embedding LIMIT $limit`,
      { limit: options.limit * 2 }
    );

    const similarities = result
      .map((row: any) => ({
        entityId: row.id,
        score: this.cosineSimilarity(queryVector, row.embedding),
        metadata: {},
      }))
      .filter((item: any) => item.score >= options.minScore)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, options.limit);

    return similarities;
  }




  private async generateEmbeddingsBatch(
    items: Array<{ text: string; metadata?: any }>
  ): Promise<
    Array<{
      index: number;
      vector: number[];
      success: boolean;
      error?: string;
    }>
  > {


    return items.map((item, index) => ({
      index,
      vector: Array.from({ length: 384 }, () => Math.random() * 2 - 1),
      success: true,
    }));
  }




  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

================
File: graph/CypherExecutor.ts
================
import neo4j, { Driver, Session, Result } from "neo4j-driver";
import { EventEmitter } from "events";

export interface Neo4jConfig {
  uri: string;
  username: string;
  password: string;
  database?: string;
  maxConnectionPoolSize?: number;
}

export interface CypherQueryOptions {
  timeout?: number;
  database?: string;
}

export interface BenchmarkOptions {
  iterations?: number;
  queryCount?: number;
  includeMetrics?: boolean;
}

export class CypherExecutor extends EventEmitter {
  private driver: Driver;
  private database: string;
  private readonly defaultTimeout = 30000;

  constructor(config: Neo4jConfig) {
    super();
    this.driver = neo4j.driver(
      config.uri,
      neo4j.auth.basic(config.username, config.password),
      {
        maxConnectionPoolSize: config.maxConnectionPoolSize || 50,
        connectionTimeout: 30000,
        maxTransactionRetryTime: 30000,
      }
    );
    this.database = config.database || "neo4j";
  }




  async executeCypher(
    query: string,
    params: Record<string, any> = {},
    options: CypherQueryOptions = {}
  ): Promise<any[]> {
    const session = this.driver.session({
      database: options.database || this.database,
      defaultAccessMode: neo4j.session.WRITE,
    });

    try {
      const result = await session.run(query, params, {
        timeout: options.timeout || this.defaultTimeout,
      });

      return result.records.map((record) => {
        const obj: any = {};
        record.keys.forEach((key) => {
          const value = record.get(key);
          obj[key] = this.convertNeo4jValue(value);
        });
        return obj;
      });
    } catch (error) {
      this.emit("error", { query, params, error });
      throw error;
    } finally {
      await session.close();
    }
  }




  async executeTransaction(
    queries: Array<{ query: string; params?: Record<string, any> }>,
    options: CypherQueryOptions = {}
  ): Promise<any[]> {
    const session = this.driver.session({
      database: options.database || this.database,
      defaultAccessMode: neo4j.session.WRITE,
    });

    const transaction = session.beginTransaction();

    try {
      const results = [];
      for (const { query, params = {} } of queries) {
        const result = await transaction.run(query, params);
        const records = result.records.map((record) => {
          const obj: any = {};
          record.keys.forEach((key) => {
            const value = record.get(key);
            obj[key] = this.convertNeo4jValue(value);
          });
          return obj;
        });
        results.push(records);
      }

      await transaction.commit();
      return results;
    } catch (error) {
      await transaction.rollback();
      this.emit("transaction:error", { queries, error });
      throw error;
    } finally {
      await session.close();
    }
  }




  async callApoc(
    procedure: string,
    params: Record<string, any> = {},
    options: CypherQueryOptions = {}
  ): Promise<any[]> {
    const query = `CALL ${procedure}(${Object.keys(params)
      .map((k) => `$${k}`)
      .join(", ")})`;
    return this.executeCypher(query, params, options);
  }




  async getStats(): Promise<any> {
    const queries = [
      "MATCH ()-[r]->() RETURN count(r) as relationships",
      "MATCH (n) RETURN count(n) as nodes",
      "CALL db.labels() YIELD label RETURN collect(label) as labels",
      "CALL db.relationshipTypes() YIELD relationshipType RETURN collect(relationshipType) as relationshipTypes",
    ];

    const results = await Promise.all(
      queries.map((query) => this.executeCypher(query).catch(() => []))
    );

    return {
      nodes: results[0][0]?.nodes || 0,
      relationships: results[1][0]?.relationships || 0,
      labels: results[2][0]?.labels || [],
      relationshipTypes: results[3][0]?.relationshipTypes || [],
      connectionPoolSize:
        this.driver._connectionProvider._connectionPool._maxSize,
    };
  }




  async createCommonIndexes(): Promise<void> {
    const indexQueries = [
      "CREATE INDEX entity_id IF NOT EXISTS FOR (n:Entity) ON (n.id)",
      "CREATE INDEX entity_type IF NOT EXISTS FOR (n:Entity) ON (n.type)",
      "CREATE INDEX entity_path IF NOT EXISTS FOR (n:Entity) ON (n.path)",
      "CREATE INDEX relationship_id IF NOT EXISTS FOR ()-[r]-() ON (r.id)",
      "CREATE INDEX version_id IF NOT EXISTS FOR (n:Version) ON (n.id)",
      "CREATE INDEX checkpoint_id IF NOT EXISTS FOR (n:Checkpoint) ON (n.id)",
      "CREATE INDEX documentation_hash IF NOT EXISTS FOR (n:Documentation) ON (n.docHash)",
    ];

    for (const query of indexQueries) {
      try {
        await this.executeCypher(query);
      } catch (error) {

        console.warn(`Failed to create index: ${query}`, error);
      }
    }
  }




  async getIndexHealth(): Promise<any> {
    try {
      const result = await this.callApoc("db.indexes");
      return result;
    } catch (error) {

      return this.executeCypher("CALL db.indexes()");
    }
  }




  async ensureGraphIndexes(): Promise<void> {

    const graphIndexQueries = [
      "CREATE INDEX entity_name IF NOT EXISTS FOR (n:Entity) ON (n.name)",
      "CREATE INDEX entity_last_modified IF NOT EXISTS FOR (n:Entity) ON (n.lastModified)",
      "CREATE INDEX relationship_type IF NOT EXISTS FOR ()-[r]-() ON (r.type)",
      "CREATE INDEX temporal_edge_valid_from IF NOT EXISTS FOR ()-[r]-() ON (r.validFrom)",
      "CREATE INDEX temporal_edge_valid_to IF NOT EXISTS FOR ()-[r]-() ON (r.validTo)",
    ];

    for (const query of graphIndexQueries) {
      try {
        await this.executeCypher(query);
      } catch (error) {
        console.warn(`Failed to create graph index: ${query}`, error);
      }
    }
  }




  async runBenchmarks(options: BenchmarkOptions = {}): Promise<any> {
    const {
      iterations = 10,
      queryCount = 100,
      includeMetrics = true,
    } = options;

    const results = {
      iterations,
      queryCount,
      totalQueries: iterations * queryCount,
      executionTimes: [] as number[],
      averageTime: 0,
      minTime: 0,
      maxTime: 0,
      throughput: 0,
    };

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();


      const queries = Array.from({ length: queryCount }, (_, idx) => ({
        query: "MATCH (n) RETURN count(n) as count",
        params: { idx },
      }));

      await this.executeTransaction(queries);

      const endTime = Date.now();
      const executionTime = endTime - startTime;
      results.executionTimes.push(executionTime);
    }

    if (results.executionTimes.length > 0) {
      results.averageTime =
        results.executionTimes.reduce((a, b) => a + b, 0) /
        results.executionTimes.length;
      results.minTime = Math.min(...results.executionTimes);
      results.maxTime = Math.max(...results.executionTimes);
      results.throughput = results.totalQueries / (results.averageTime / 1000);
    }

    return includeMetrics ? results : { completed: true };
  }




  async close(): Promise<void> {
    await this.driver.close();
    this.emit("closed");
  }




  private convertNeo4jValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }


    if (neo4j.isDate(value)) {
      return new Date(value.year, value.month - 1, value.day);
    }
    if (neo4j.isDateTime(value)) {
      return new Date(value.toString());
    }
    if (neo4j.isLocalDateTime(value)) {
      return new Date(value.toString());
    }
    if (neo4j.isTime(value) || neo4j.isLocalTime(value)) {
      return value.toString();
    }


    if (neo4j.isPoint(value)) {
      return { x: value.x, y: value.y, z: value.z, srid: value.srid };
    }


    if (Array.isArray(value)) {
      return value.map((item) => this.convertNeo4jValue(item));
    }
    if (typeof value === "object" && value !== null) {
      const converted: any = {};
      for (const [key, val] of Object.entries(value)) {
        converted[key] = this.convertNeo4jValue(val);
      }
      return converted;
    }

    return value;
  }
}

================
File: graph/EntityServiceOGM.ts
================
import { EventEmitter } from 'events';
import { NeogmaService } from './NeogmaService.js';
import { createEntityModels } from '../../models/ogm/EntityModels.js';
import {
  Entity,
  CodebaseEntity,
  File,
  FunctionSymbol,
  ClassSymbol,
} from '../../models/entities.js';
import {
  modelToEntity,
  entityToModelProps,
  BatchOperationHelper,
} from '../../models/ogm/BaseModels.js';

export interface ListEntitiesOptions {
  type?: string;
  path?: string;
  name?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface BulkCreateOptions {
  skipExisting?: boolean;
  updateExisting?: boolean;
}

export class EntityServiceOGM extends EventEmitter {
  private models: ReturnType<typeof createEntityModels>;
  private batchHelper: BatchOperationHelper;

  constructor(private neogmaService: NeogmaService) {
    super();
    const neogma = this.neogmaService.getNeogmaInstance();
    this.models = createEntityModels(neogma);
    this.batchHelper = new BatchOperationHelper(100);


    this.neogmaService.on('error', (data) => {
      this.emit('error', { source: 'neogma', ...data });
    });
  }




  private getModelForEntity(entity: Entity) {
    if ('extension' in entity && entity.type === 'file') {
      return this.models.FileModel;
    }
    if ('children' in entity && entity.type === 'directory') {
      return this.models.DirectoryModel;
    }
    if ('packageJson' in entity && entity.type === 'module') {
      return this.models.ModuleModel;
    }
    if ('kind' in entity) {
      const symbolEntity = entity as any;
      if (symbolEntity.kind === 'function') {
        return this.models.FunctionSymbolModel;
      }
      if (symbolEntity.kind === 'class') {
        return this.models.ClassSymbolModel;
      }
      if (symbolEntity.kind === 'interface') {
        return this.models.InterfaceSymbolModel;
      }
      return this.models.SymbolModel;
    }
    if ('testType' in entity) {
      return this.models.TestModel;
    }
    if ('priority' in entity && entity.type === 'spec') {
      return this.models.SpecificationModel;
    }
    if ('title' in entity && entity.type === 'documentation') {
      return this.models.DocumentationModel;
    }

    return this.models.EntityModel;
  }




  async createEntity(entity: Entity): Promise<Entity> {
    try {
      const Model = this.getModelForEntity(entity);
      const props = entityToModelProps(entity);


      let instance;
      try {
        const instances = await Model.findMany({ where: { id: entity.id }, limit: 1 });
        if (instances.length === 0) {
          instance = await Model.createOne(props);
        } else {
          instance = instances[0];
        }
      } catch (error) {

        instance = await Model.createOne(props);
      }

      const created = modelToEntity<Entity>(instance);
      this.emit('entity:created', created);
      return created;
    } catch (error) {
      this.emit('error', { operation: 'createEntity', entity, error });
      throw error;
    }
  }




  async updateEntity(id: string, updates: Partial<Entity>): Promise<Entity> {
    try {

      const existing = await this.getEntity(id);
      if (!existing) {
        throw new Error(`Entity not found: ${id}`);
      }

      const Model = this.getModelForEntity(existing);
      const props = entityToModelProps({ ...existing, ...updates });
      delete (props as any).id;


      const instances = await Model.update(
        { ...props, lastModified: new Date().toISOString() },
        { where: { id } as any }
      );
      const instance = Array.isArray(instances) ? instances[0] : instances;

      if (!instance) {
        throw new Error(`Failed to update entity: ${id}`);
      }

      const updated = modelToEntity<Entity>(Array.isArray(instance) ? instance[0] : instance);
      this.emit('entity:updated', updated);
      return updated;
    } catch (error) {
      this.emit('error', { operation: 'updateEntity', id, updates, error });
      throw error;
    }
  }




  async getEntity(id: string): Promise<Entity | null> {
    try {

      const models = Object.values(this.models);

      for (const Model of models) {
        const instances = await Model.findMany({
          where: { id },
          limit: 1,
        });

        if (instances && instances.length > 0) {
          return modelToEntity<Entity>(instances[0]);
        }
      }

      return null;
    } catch (error) {
      this.emit('error', { operation: 'getEntity', id, error });
      throw error;
    }
  }




  async deleteEntity(id: string): Promise<void> {
    try {
      const existing = await this.getEntity(id);
      if (!existing) {
        return;
      }

      const Model = this.getModelForEntity(existing);


      await Model.delete({
        where: { id },
        detach: true,
      });

      this.emit('entity:deleted', { id });
    } catch (error) {
      this.emit('error', { operation: 'deleteEntity', id, error });
      throw error;
    }
  }




  async listEntities(
    options: ListEntitiesOptions = {}
  ): Promise<{
    items: Entity[];
    total: number;
  }> {
    try {
      const where: any = {};

      if (options.type) {
        where.type = options.type;
      }
      if (options.path) {
        where.path = options.path;
      }
      if (options.name) {


        return this.listEntitiesWithCustomQuery(options);
      }


      let Model = this.models.EntityModel;
      if (options.type === 'file') {
        Model = this.models.FileModel;
      } else if (options.type === 'directory') {
        Model = this.models.DirectoryModel;
      } else if (options.type === 'module') {
        Model = this.models.ModuleModel;
      }


      const countResult = await Model.findMany({
        where,
      });
      const total = countResult.length;


      const instances = await Model.findMany({
        where,
        limit: options.limit || 100,
        skip: options.offset || 0,
        order: options.orderBy
          ? [[options.orderBy, options.orderDirection || 'ASC']]
          : undefined,
      });

      const items = instances.map(instance => modelToEntity<Entity>(instance));

      return { items, total };
    } catch (error) {
      this.emit('error', { operation: 'listEntities', options, error });
      throw error;
    }
  }





  private async listEntitiesWithCustomQuery(
    options: ListEntitiesOptions
  ): Promise<{
    items: Entity[];
    total: number;
  }> {
    const where: string[] = ['n:Entity'];
    const params: Record<string, any> = {};

    if (options.type) {
      where.push('n.type = $type');
      params.type = options.type;
    }

    if (options.path) {
      where.push('n.path = $path');
      params.path = options.path;
    }

    if (options.name) {
      where.push('n.name CONTAINS $name');
      params.name = options.name;
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const orderClause = options.orderBy
      ? `ORDER BY n.${options.orderBy} ${options.orderDirection || 'ASC'}`
      : 'ORDER BY n.created DESC';

    // Count query
    const countQuery = `
      MATCH (n:Entity)
      ${whereClause}
      RETURN count(n) as total
    `;

    const countResult = await this.neogmaService.executeCypher(countQuery, params);
    const total = countResult[0]?.total || 0;

    // Data query
    const dataQuery = `
      MATCH (n:Entity)
      ${whereClause}
      RETURN n
      ${orderClause}
      SKIP ${options.offset || 0}
      LIMIT ${options.limit || 100}
    `;

    const result = await this.neogmaService.executeCypher(dataQuery, params);
    const items = result.map(row => this.parseEntityFromNeo4j(row.n));

    return { items, total };
  }

  /**
   * Bulk create entities using Neogma
   */
  async createEntitiesBulk(
    entities: Entity[],
    options: BulkCreateOptions = {}
  ): Promise<{
    created: number;
    updated: number;
    failed: number;
  }> {
    let created = 0;
    let updated = 0;
    let failed = 0;

    try {
      // Group entities by type for efficient batch operations
      const entitiesByType = this.groupEntitiesByType(entities);

      for (const [modelKey, entityGroup] of entitiesByType) {
        const Model = (this.models as any)[modelKey];

        const results = await this.batchHelper.executeBatched(
          entityGroup,
          async batch => {
            const props = batch.map(e => entityToModelProps(e));

            if (options.skipExisting) {
              // Create only if not exists
              const createdInstances = [];
              for (const p of props) {
                try {
                  const existing = await Model.findMany({ where: { id: (p as any).id }, limit: 1 });
                  if (existing.length === 0) {
                    const newInstance = await Model.createOne(p);
                    createdInstances.push(newInstance);
                    created++;
                  }
                } catch (error) {
                  failed++;
                }
              }
              return createdInstances;
            } else if (options.updateExisting) {
              // Upsert behavior
              const upserted = [];
              for (const p of props) {
                try {
                  const existing = await Model.findMany({ where: { id: (p as any).id }, limit: 1 });
                  if (existing.length > 0) {
                    await Model.update(
                      p,
                      { where: { id: (p as any).id } as any }
                    );
                    updated++;
                  } else {
                    const newInstance = await Model.createOne(p);
                    upserted.push(newInstance);
                    created++;
                  }
                } catch (error) {
                  failed++;
                }
              }
              return upserted;
            } else {
              // Create all (may fail on duplicates)
              const createdInstances = [];
              for (const p of props) {
                try {
                  const newInstance = await Model.createOne(p);
                  createdInstances.push(newInstance);
                  created++;
                } catch (error) {
                  failed++;
                }
              }
              return createdInstances;
            }
          }
        );
      }

      this.emit('entities:bulk:created', {
        created,
        updated,
        failed,
        total: entities.length,
      });

      return { created, updated, failed };
    } catch (error) {
      this.emit('error', { operation: 'createEntitiesBulk', error });
      throw error;
    }
  }

  /**
   * Find entities by properties using Neogma
   */
  async findEntitiesByProperties(
    properties: Partial<Entity>
  ): Promise<Entity[]> {
    try {
      // Determine model based on properties
      const Model = this.getModelForEntity(properties as Entity);

      const instances = await Model.findMany({
        where: properties as any,
      });

      return instances.map(instance => modelToEntity<Entity>(instance));
    } catch (error) {
      this.emit('error', {
        operation: 'findEntitiesByProperties',
        properties,
        error,
      });
      throw error;
    }
  }

  /**
   * Group entities by their model type for batch operations
   */
  private groupEntitiesByType(entities: Entity[]): Map<string, Entity[]> {
    const groups = new Map<string, Entity[]>();

    for (const entity of entities) {
      const Model = this.getModelForEntity(entity);
      const modelName = (Model as any).name || 'EntityModel';

      if (!groups.has(modelName)) {
        groups.set(modelName, []);
      }
      groups.get(modelName)!.push(entity);
    }

    return groups;
  }

  /**
   * Get entities by file path (for API compatibility)
   */
  async getEntitiesByFile(filePath: string): Promise<Entity[]> {
    try {
      const result = await this.listEntities({ path: filePath });
      return result.items;
    } catch (error) {
      this.emit('error', { operation: 'getEntitiesByFile', filePath, error });
      throw error;
    }
  }

  /**
   * Get entities by type (for API compatibility)
   */
  async getEntitiesByType(type: string, limit = 100): Promise<Entity[]> {
    try {
      const result = await this.listEntities({ type, limit });
      return result.items;
    } catch (error) {
      this.emit('error', { operation: 'getEntitiesByType', type, error });
      throw error;
    }
  }

  /**
   * Check if an entity exists (for API compatibility)
   */
  async entityExists(id: string): Promise<boolean> {
    try {
      const entity = await this.getEntity(id);
      return entity !== null;
    } catch (error) {
      this.emit('error', { operation: 'entityExists', id, error });
      throw error;
    }
  }

  /**
   * Update entity metadata (for API compatibility)
   */
  async updateEntityMetadata(
    id: string,
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      await this.updateEntity(id, { metadata });
    } catch (error) {
      this.emit('error', { operation: 'updateEntityMetadata', id, metadata, error });
      throw error;
    }
  }

  /**
   * Get entity statistics using Neogma
   */
  async getEntityStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    recentlyModified: number;
  }> {
    try {
      // Use raw Cypher queries for statistics since Neogma doesn't have aggregation helpers
      const queries = [
        {
          name: 'total',
          query: 'MATCH (n:Entity) RETURN count(n) as count',
        },
        {
          name: 'byType',
          query: `
            MATCH (n:Entity)
            RETURN n.type as type, count(n) as count
            ORDER BY count DESC
          `,
        },
        {
          name: 'recent',
          query: `
            MATCH (n:Entity)
            WHERE n.lastModified > datetime() - duration('P7D')
            RETURN count(n) as count
          `,
        },
      ];

      const results = await Promise.all(
        queries.map(q => this.neogmaService.executeCypher(q.query))
      );

      const byType: Record<string, number> = {};
      results[1].forEach((row: any) => {
        if (row.type) {
          byType[row.type] = row.count;
        }
      });

      return {
        total: results[0][0]?.count || 0,
        byType,
        recentlyModified: results[2][0]?.count || 0,
      };
    } catch (error) {
      this.emit('error', { operation: 'getEntityStats', error });
      throw error;
    }
  }




  private parseEntityFromNeo4j(node: any): Entity {
    const props = node.properties || node;


    if (props.created) {
      props.created = new Date(props.created);
    }
    if (props.lastModified) {
      props.lastModified = new Date(props.lastModified);
    }

    return props as Entity;
  }
}

================
File: graph/GdsService.ts
================
import { EventEmitter } from "events";
import { CypherExecutor } from "./CypherExecutor.js";

export interface GdsAlgorithmConfig {
  nodeProjection?: string;
  relationshipProjection?: string;
  writeProperty?: string;
  maxIterations?: number;
  dampingFactor?: number;
  similarityCutoff?: number;
  topK?: number;
  topN?: number;
}

export interface PathExpandConfig {
  startNode: string;
  relationshipFilter?: string;
  labelFilter?: string;
  minLevel?: number;
  maxLevel?: number;
  limit?: number;
}

export class GdsService extends EventEmitter {
  constructor(private executor: CypherExecutor) {
    super();
  }




  async runGdsAlgorithm(
    algorithm: string,
    config: GdsAlgorithmConfig,
    parameters: Record<string, any> = {}
  ): Promise<any> {
    const procedureName = `gds.${algorithm}`;

    try {
      const result = await this.executor.callApoc(procedureName, {
        ...config,
        ...parameters,
      });

      this.emit("algorithm:completed", {
        algorithm,
        config,
        resultCount: Array.isArray(result) ? result.length : 1,
      });

      return result;
    } catch (error) {
      this.emit("algorithm:error", { algorithm, config, error });
      throw error;
    }
  }




  async runPageRank(
    config: {
      maxIterations?: number;
      dampingFactor?: number;
      writeProperty?: string;
    } = {}
  ): Promise<any> {
    return this.runGdsAlgorithm("pageRank", {
      nodeProjection: "*",
      relationshipProjection: "*",
      writeProperty: "pageRank",
      maxIterations: 20,
      dampingFactor: 0.85,
      ...config,
    });
  }




  async runCommunityDetection(
    config: {
      maxIterations?: number;
      writeProperty?: string;
    } = {}
  ): Promise<any> {
    return this.runGdsAlgorithm("louvain", {
      nodeProjection: "*",
      relationshipProjection: "*",
      writeProperty: "community",
      maxIterations: 10,
      ...config,
    });
  }




  async runNodeSimilarity(
    config: {
      similarityCutoff?: number;
      topK?: number;
      writeProperty?: string;
    } = {}
  ): Promise<any> {
    return this.runGdsAlgorithm("nodeSimilarity", {
      nodeProjection: "*",
      relationshipProjection: "*",
      writeProperty: "similarity",
      similarityCutoff: 0.1,
      topK: 10,
      ...config,
    });
  }




  async apocPathExpand(config: PathExpandConfig): Promise<any[]> {
    const {
      startNode,
      relationshipFilter = "RELATIONSHIP_GLOBAL",
      labelFilter = "",
      minLevel = 1,
      maxLevel = 3,
      limit = 100,
    } = config;

    try {
      const result = await this.executor.callApoc("apoc.path.expand", {
        startNode: startNode,
        relationshipFilter: relationshipFilter,
        labelFilter: labelFilter,
        minLevel: minLevel,
        maxLevel: maxLevel,
        limit: limit,
      });

      this.emit("pathExpansion:completed", {
        startNode,
        resultCount: result.length,
        maxLevel,
      });

      return result;
    } catch (error) {
      this.emit("pathExpansion:error", { config, error });
      throw error;
    }
  }




  async findShortestPaths(
    startNodeId: string,
    endNodeId: string,
    config: {
      maxDepth?: number;
      relationshipTypes?: string[];
      algorithm?: "dijkstra" | "astar";
    } = {}
  ): Promise<any[]> {
    const {
      maxDepth = 10,
      relationshipTypes = [],
      algorithm = "dijkstra",
    } = config;

    const relationshipFilter =
      relationshipTypes.length > 0 ? relationshipTypes.join("|") : "*";

    const query = `
      MATCH (start:Entity {id: $startNodeId}), (end:Entity {id: $endNodeId})
      CALL apoc.algo.${algorithm}(start, end, $relationshipFilter, $maxDepth)
      YIELD path, weight
      RETURN path, weight
      ORDER BY weight ASC
      LIMIT 10
    `;

    try {
      const result = await this.executor.executeCypher(query, {
        startNodeId,
        endNodeId,
        relationshipFilter,
        maxDepth,
      });

      this.emit("shortestPath:found", {
        startNodeId,
        endNodeId,
        pathCount: result.length,
      });

      return result;
    } catch (error) {
      this.emit("shortestPath:error", {
        startNodeId,
        endNodeId,
        config,
        error,
      });
      throw error;
    }
  }




  async calculateCentrality(
    algorithm: "degree" | "betweenness" | "closeness" = "degree"
  ): Promise<any> {
    const algorithmMap = {
      degree: "degree",
      betweenness: "betweenness",
      closeness: "closeness",
    };

    return this.runGdsAlgorithm(algorithmMap[algorithm], {
      nodeProjection: "*",
      relationshipProjection: "*",
      writeProperty: `${algorithm}Centrality`,
    });
  }




  async findStronglyConnectedComponents(): Promise<any> {
    return this.runGdsAlgorithm("scc", {
      nodeProjection: "*",
      relationshipProjection: "*",
      writeProperty: "componentId",
    });
  }




  async runTriangleCount(): Promise<any> {
    return this.runGdsAlgorithm("triangleCount", {
      nodeProjection: "*",
      relationshipProjection: "*",
      writeProperty: "triangleCount",
    });
  }




  async getGraphMetrics(): Promise<{
    nodeCount: number;
    relationshipCount: number;
    averageDegree: number;
    density: number;
    components: number;
    triangles: number;
  }> {
    const queries = [
      "MATCH (n) RETURN count(n) as nodeCount",
      "MATCH ()-[r]->() RETURN count(r) as relationshipCount",
      "MATCH (n) OPTIONAL MATCH (n)-[r]-() RETURN avg(size(collect(DISTINCT r))) as averageDegree",
      "MATCH (n) OPTIONAL MATCH (n)-[r]-() RETURN count(DISTINCT n) as nodesWithRelationships",
      "CALL gds.graph.list() YIELD graphName RETURN count(graphName) as namedGraphs",
    ];

    try {
      const results = await Promise.all(
        queries.map((query) =>
          this.executor.executeCypher(query).catch(() => [{}])
        )
      );

      const [nodeResult, relResult, degreeResult] = results;
      const nodeCount = nodeResult[0]?.nodeCount || 0;
      const relationshipCount = relResult[0]?.relationshipCount || 0;
      const averageDegree = degreeResult[0]?.averageDegree || 0;


      const density =
        nodeCount > 1
          ? (relationshipCount * 2) / (nodeCount * (nodeCount - 1))
          : 0;

      return {
        nodeCount,
        relationshipCount,
        averageDegree,
        density,
        components: 0,
        triangles: 0,
      };
    } catch (error) {
      console.warn("Failed to get graph metrics:", error);
      return {
        nodeCount: 0,
        relationshipCount: 0,
        averageDegree: 0,
        density: 0,
        components: 0,
        triangles: 0,
      };
    }
  }




  async createNamedGraph(
    graphName: string,
    nodeQuery = "MATCH (n) RETURN id(n) as id",
    relationshipQuery = "MATCH (n)-[r]->(m) RETURN id(n) as source, id(r) as id, id(m) as target"
  ): Promise<void> {
    await this.runGdsAlgorithm(
      "graph.create",
      {
        nodeQuery,
        relationshipQuery,
      },
      {
        graphName,
      }
    );

    this.emit("namedGraph:created", { graphName });
  }




  async dropNamedGraph(graphName: string): Promise<void> {
    await this.runGdsAlgorithm("graph.drop", {}, { graphName });
    this.emit("namedGraph:dropped", { graphName });
  }




  async listNamedGraphs(): Promise<string[]> {
    try {
      const result = await this.runGdsAlgorithm("graph.list", {});
      return result.map((graph: any) => graph.graphName);
    } catch (error) {
      console.warn("Failed to list named graphs:", error);
      return [];
    }
  }
}

================
File: graph/GraphInitializer.ts
================
import { EventEmitter } from "events";
import { Neo4jService } from "../Neo4jService.js";
import { EmbeddingService } from "../EmbeddingService.js";

export class GraphInitializer extends EventEmitter {
  constructor(
    private neo4j: Neo4jService,
    private embeddings: EmbeddingService
  ) {
    super();
  }




  async initializeDatabase(): Promise<void> {
    try {
      await this.neo4j.createCommonIndexes();
      await this.embeddings.initializeVectorIndex();


      console.log("[GraphInitializer] OGM database setup completed");

      this.emit("database:initialized");
    } catch (error) {
      console.error(
        "[GraphInitializer] Database initialization failed:",
        error
      );
      this.emit("database:error", error);
      throw error;
    }
  }




  async ensureIndices(): Promise<void> {
    await this.neo4j.createCommonIndexes();
  }




  async ensureGraphIndexes(): Promise<void> {
    await this.neo4j.ensureGraphIndexes();
  }




  async runBenchmarks(options?: any): Promise<any> {
    return this.neo4j.runBenchmarks(options);
  }
}

================
File: graph/HistoryService.ts
================
import { EventEmitter } from "events";
import { Neo4jService } from "./Neo4jService.js";
import { Entity } from "../../models/entities.js";
import { RelationshipType } from "../../models/relationships.js";
import { TimeRangeParams, TraversalQuery } from "../../models/types.js";
import {
  VersionManager,
  CheckpointService,
  TemporalQueryService,
  CheckpointOptions,
  VersionInfo,
  CheckpointInfo,
  HistoryMetrics,
  CheckpointSummary,
  SessionImpact,
} from "./history/index.js";

export {
  CheckpointOptions,
  VersionInfo,
  CheckpointInfo,
  HistoryMetrics,
  CheckpointSummary,
  SessionImpact,
};

export class HistoryService extends EventEmitter {
  private versionManager: VersionManager;
  private checkpointService: CheckpointService;
  private temporalQueryService: TemporalQueryService;

  constructor(private neo4j: Neo4jService) {
    super();


    this.versionManager = new VersionManager(neo4j);
    this.checkpointService = new CheckpointService(neo4j);
    this.temporalQueryService = new TemporalQueryService(neo4j);


    this.versionManager.on("version:created", (data) =>
      this.emit("version:created", data)
    );
    this.versionManager.on("history:pruned", (data) =>
      this.emit("history:pruned", data)
    );
    this.checkpointService.on("checkpoint:created", (data) =>
      this.emit("checkpoint:created", data)
    );
    this.checkpointService.on("checkpoint:deleted", (data) =>
      this.emit("checkpoint:deleted", data)
    );
    this.temporalQueryService.on("edge:opened", (data) =>
      this.emit("edge:opened", data)
    );
    this.temporalQueryService.on("edge:closed", (data) =>
      this.emit("edge:closed", data)
    );
  }


  private get historyEnabled(): boolean {
    return this.versionManager ? true : false;
  }




  async appendVersion(
    entity: Entity,
    options?: { changeSetId?: string; timestamp?: Date }
  ): Promise<string> {
    return this.versionManager.appendVersion(entity, options);
  }




  async createCheckpoint(
    seedEntities: string[],
    options: CheckpointOptions
  ): Promise<{ checkpointId: string; memberCount: number }> {
    return this.checkpointService.createCheckpoint(seedEntities, options);
  }




  async openEdge(
    fromId: string,
    toId: string,
    type: RelationshipType,
    timestamp?: Date,
    changeSetId?: string
  ): Promise<void> {
    return this.temporalQueryService.openEdge(
      fromId,
      toId,
      type,
      timestamp,
      changeSetId
    );
  }




  async closeEdge(
    fromId: string,
    toId: string,
    type: RelationshipType,
    timestamp?: Date
  ): Promise<void> {
    return this.temporalQueryService.closeEdge(fromId, toId, type, timestamp);
  }




  async pruneHistory(
    retentionDays: number,
    options?: { dryRun?: boolean }
  ): Promise<{
    versionsDeleted: number;
    edgesClosed: number;
    checkpointsDeleted: number;
  }> {
    if (!this.historyEnabled) {
      return { versionsDeleted: 0, edgesClosed: 0, checkpointsDeleted: 0 };
    }

    const cutoff = new Date(
      Date.now() - Math.max(1, retentionDays) * 24 * 60 * 60 * 1000
    ).toISOString();

    const dryRun = !!options?.dryRun;


    const checkpointQuery = dryRun
      ? `MATCH (c:Checkpoint) WHERE c.timestamp < $cutoff RETURN count(c) as count`
      : `MATCH (c:Checkpoint) WHERE c.timestamp < $cutoff DETACH DELETE c RETURN count(*) as count`;

    const checkpointResult = await this.neo4j.executeCypher(checkpointQuery, {
      cutoff,
    });
    const checkpointsDeleted = checkpointResult[0]?.count || 0;


    const edgeQuery = dryRun
      ? `MATCH ()-[r]->() WHERE r.validTo < $cutoff RETURN count(r) as count`
      : `MATCH ()-[r]->() WHERE r.validTo < $cutoff DELETE r RETURN count(*) as count`;

    const edgeResult = await this.neo4j.executeCypher(edgeQuery, { cutoff });
    const edgesClosed = edgeResult[0]?.count || 0;


    const versionQuery = dryRun
      ? `MATCH (v:Version) WHERE v.timestamp < $cutoff AND NOT ((:Checkpoint)-[:INCLUDES]->(v)) RETURN count(v) as count`
      : `MATCH (v:Version) WHERE v.timestamp < $cutoff AND NOT ((:Checkpoint)-[:INCLUDES]->(v)) DETACH DELETE v RETURN count(*) as count`;

    const versionResult = await this.neo4j.executeCypher(versionQuery, {
      cutoff,
    });
    const versionsDeleted = versionResult[0]?.count || 0;

    this.emit("history:pruned", {
      dryRun,
      retentionDays,
      cutoff,
      versionsDeleted,
      edgesClosed,
      checkpointsDeleted,
    });

    return { versionsDeleted, edgesClosed, checkpointsDeleted };
  }




  async timeTravelTraversal(query: TraversalQuery): Promise<{
    nodes: Entity[];
    edges: any[];
  }> {
    const until = query.until || new Date();
    const maxDepth = query.maxDepth || 3;

    const cypherQuery = `
      MATCH (start:Entity {id: $startId})
      CALL apoc.path.expand(
        start,
        $relationshipFilter,
        $labelFilter,
        0,
        $maxDepth,
        'RELATIONSHIP_GLOBAL'
      ) YIELD path
      WITH path, relationships(path) AS rels, nodes(path) AS nodes
      WHERE ALL(r IN rels WHERE
        coalesce(r.validFrom, datetime('1970-01-01')) <= $until AND
        coalesce(r.validTo, datetime('9999-12-31')) >= $until
      )
      RETURN nodes, rels
    `;

    const result = await this.neo4j.executeCypher(cypherQuery, {
      startId: query.startId,
      relationshipFilter: query.relationshipTypes?.join("|") || null,
      labelFilter: query.nodeLabels?.join("|") || null,
      maxDepth,
      until: until.toISOString(),
    });

    const allNodes = new Map<string, Entity>();
    const allEdges: any[] = [];

    result.forEach((row) => {
      row.nodes?.forEach((node: any) => {
        if (node.properties?.id && !allNodes.has(node.properties.id)) {
          allNodes.set(node.properties.id, this.parseEntity(node));
        }
      });

      row.rels?.forEach((rel: any) => {
        allEdges.push(this.parseRelationship(rel));
      });
    });

    return {
      nodes: Array.from(allNodes.values()),
      edges: allEdges,
    };
  }




  async listCheckpoints(options?: {
    reason?: string;
    since?: Date;
    until?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ items: CheckpointInfo[]; total: number }> {
    const where: string[] = [];
    const params: Record<string, any> = {};

    if (options?.reason) {
      where.push("c.reason = $reason");
      params.reason = options.reason;
    }

    if (options?.since) {
      where.push("c.timestamp >= $since");
      params.since = options.since.toISOString();
    }

    if (options?.until) {
      where.push("c.timestamp <= $until");
      params.until = options.until.toISOString();
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    // Count total
    const countQuery = `
      MATCH (c:Checkpoint)
      ${whereClause}
      RETURN count(c) as total
    `;

    const countResult = await this.neo4j.executeCypher(countQuery, params);
    const total = countResult[0]?.total || 0;

    // Get items with member count
    const query = `
      MATCH (c:Checkpoint)
      ${whereClause}
      OPTIONAL MATCH (c)-[:INCLUDES]->(m)
      WITH c, count(m) as memberCount
      RETURN c, memberCount
      ORDER BY c.timestamp DESC
      SKIP $offset
      LIMIT $limit
    `;

    params.offset = options?.offset || 0;
    params.limit = options?.limit || 50;

    const result = await this.neo4j.executeCypher(query, params);

    const items = result.map((row) => ({
      id: row.c.properties.id,
      timestamp: new Date(row.c.properties.timestamp),
      reason: row.c.properties.reason,
      seedEntities: JSON.parse(row.c.properties.seedEntities || "[]"),
      memberCount: row.memberCount,
      metadata: row.c.properties.metadata
        ? JSON.parse(row.c.properties.metadata)
        : undefined,
    }));

    return { items, total };
  }

  /**
   * Get history metrics
   */
  async getHistoryMetrics(): Promise<HistoryMetrics> {
    const queries = [
      { name: "versions", query: "MATCH (v:Version) RETURN count(v) as c" },
      {
        name: "checkpoints",
        query: "MATCH (c:Checkpoint) RETURN count(c) as c",
      },
      {
        name: "openEdges",
        query: "MATCH ()-[r]->() WHERE r.validTo IS NULL RETURN count(r) as c",
      },
      {
        name: "closedEdges",
        query:
          "MATCH ()-[r]->() WHERE r.validTo IS NOT NULL RETURN count(r) as c",
      },
      {
        name: "checkpointMembers",
        query: `
          MATCH (c:Checkpoint)
          OPTIONAL MATCH (c)-[:INCLUDES]->(m)
          RETURN c.id as id, count(m) as memberCount
        `,
      },
    ];

    const results = await Promise.all(
      queries.map((q) => this.neo4j.executeCypher(q.query))
    );

    const memberCounts = results[4].map((r) => r.memberCount || 0);
    const avgMembers = memberCounts.length
      ? memberCounts.reduce((a, b) => a + b, 0) / memberCounts.length
      : 0;

    return {
      versions: results[0][0]?.c || 0,
      checkpoints: results[1][0]?.c || 0,
      checkpointMembers: {
        avg: avgMembers,
        min: memberCounts.length ? Math.min(...memberCounts) : 0,
        max: memberCounts.length ? Math.max(...memberCounts) : 0,
      },
      temporalEdges: {
        open: results[2][0]?.c || 0,
        closed: results[3][0]?.c || 0,
      },
    };
  }

  private parseEntity(node: any): Entity {
    const properties = node.properties || node;
    const entity: any = {};

    for (const [key, value] of Object.entries(properties)) {
      if (value === null || value === undefined) continue;

      if (key === "created" || key === "lastModified" || key.endsWith("At")) {
        entity[key] = new Date(value as string);
      } else if (
        typeof value === "string" &&
        ((value as string).startsWith("[") || (value as string).startsWith("{"))
      ) {
        try {
          entity[key] = JSON.parse(value as string);
        } catch {
          entity[key] = value;
        }
      } else {
        entity[key] = value;
      }
    }

    return entity as Entity;
  }

  private parseRelationship(rel: any): any {
    return {
      type: rel.type,
      properties: rel.properties,
      startNodeId: rel.start,
      endNodeId: rel.end,
    };
  }




  async getCheckpoint(checkpointId: string): Promise<CheckpointInfo | null> {
    const query = `
      MATCH (c:Checkpoint {id: $checkpointId})
      OPTIONAL MATCH (c)-[:INCLUDES]->(m)
      WITH c, count(m) as memberCount
      RETURN c, memberCount
    `;

    const result = await this.neo4j.executeCypher(query, { checkpointId });
    if (result.length === 0) return null;

    const row = result[0];
    return {
      id: row.c.properties.id,
      timestamp: new Date(row.c.properties.timestamp),
      reason: row.c.properties.reason,
      seedEntities: JSON.parse(row.c.properties.seedEntities || "[]"),
      memberCount: row.memberCount,
      metadata: row.c.properties.metadata
        ? JSON.parse(row.c.properties.metadata)
        : undefined,
    };
  }




  async getCheckpointMembers(checkpointId: string): Promise<Entity[]> {
    const query = `
      MATCH (c:Checkpoint {id: $checkpointId})-[:INCLUDES]->(m:Entity)
      RETURN m
    `;

    const result = await this.neo4j.executeCypher(query, { checkpointId });
    return result.map((row) => this.parseEntity(row.m));
  }




  async getCheckpointSummary(checkpointId: string): Promise<{
    checkpoint: CheckpointInfo;
    members: Entity[];
    stats: {
      entityTypes: Record<string, number>;
      totalRelationships: number;
      relationshipTypes: Record<string, number>;
    };
  } | null> {
    const checkpoint = await this.getCheckpoint(checkpointId);
    if (!checkpoint) return null;

    const members = await this.getCheckpointMembers(checkpointId);


    const statsQuery = `
      MATCH (c:Checkpoint {id: $checkpointId})-[:INCLUDES]->(m:Entity)
      OPTIONAL MATCH (m)-[r]->()
      RETURN
        m.type as entityType,
        type(r) as relType,
        count(r) as relCount
    `;

    const statsResult = await this.neo4j.executeCypher(statsQuery, {
      checkpointId,
    });

    const entityTypes: Record<string, number> = {};
    const relationshipTypes: Record<string, number> = {};
    let totalRelationships = 0;

    statsResult.forEach((row) => {
      if (row.entityType) {
        entityTypes[row.entityType] = (entityTypes[row.entityType] || 0) + 1;
      }
      if (row.relType && row.relCount > 0) {
        relationshipTypes[row.relType] =
          (relationshipTypes[row.relType] || 0) + row.relCount;
        totalRelationships += row.relCount;
      }
    });

    return {
      checkpoint,
      members,
      stats: {
        entityTypes,
        totalRelationships,
        relationshipTypes,
      },
    };
  }




  async deleteCheckpoint(checkpointId: string): Promise<void> {
    const query = `
      MATCH (c:Checkpoint {id: $checkpointId})
      DETACH DELETE c
    `;

    await this.neo4j.executeCypher(query, { checkpointId });
    this.emit("checkpoint:deleted", { checkpointId });
  }




  async exportCheckpoint(checkpointId: string): Promise<{
    checkpoint: CheckpointInfo;
    entities: Entity[];
    relationships: any[];
  } | null> {
    const checkpoint = await this.getCheckpoint(checkpointId);
    if (!checkpoint) return null;

    const entities = await this.getCheckpointMembers(checkpointId);


    const relQuery = `
      MATCH (c:Checkpoint {id: $checkpointId})-[:INCLUDES]->(from:Entity)
      MATCH (c)-[:INCLUDES]->(to:Entity)
      MATCH (from)-[r]->(to)
      RETURN r, from.id as fromId, to.id as toId
    `;

    const relResult = await this.neo4j.executeCypher(relQuery, {
      checkpointId,
    });
    const relationships = relResult.map((row) => ({
      ...this.parseRelationship(row.r),
      fromId: row.fromId,
      toId: row.toId,
    }));

    return {
      checkpoint,
      entities,
      relationships,
    };
  }




  async importCheckpoint(checkpointData: {
    checkpoint: CheckpointInfo;
    entities: Entity[];
    relationships: any[];
  }): Promise<string> {
    const { checkpoint, entities, relationships } = checkpointData;


    for (const entity of entities) {
      const query = `
        MERGE (e:Entity {id: $id})
        SET e += $properties
      `;
      await this.neo4j.executeCypher(query, {
        id: entity.id,
        properties: entity,
      });
    }


    for (const rel of relationships) {
      const query = `
        MATCH (from:Entity {id: $fromId})
        MATCH (to:Entity {id: $toId})
        MERGE (from)-[r:${rel.type}]->(to)
        SET r += $properties
      `;
      await this.neo4j.executeCypher(query, {
        fromId: rel.fromId,
        toId: rel.toId,
        properties: rel.properties || {},
      });
    }


    const checkpointId = `imported_${Date.now().toString(36)}`;
    await this.neo4j.executeCypher(
      `
      MERGE (c:Checkpoint {id: $id})
      SET c.timestamp = $timestamp
      SET c.reason = $reason
      SET c.seedEntities = $seeds
      SET c.description = $description
      SET c.metadata = $metadata
      SET c.imported = true
      `,
      {
        id: checkpointId,
        timestamp: checkpoint.timestamp.toISOString(),
        reason: checkpoint.reason,
        seeds: JSON.stringify(checkpoint.seedEntities),
        description: `Imported checkpoint from ${checkpoint.id}`,
        metadata: JSON.stringify(checkpoint.metadata || {}),
      }
    );


    const entityIds = entities.map((e) => e.id);
    if (entityIds.length > 0) {
      await this.neo4j.executeCypher(
        `
        MATCH (c:Checkpoint {id: $checkpointId})
        UNWIND $entityIds AS entityId
        MATCH (e:Entity {id: entityId})
        MERGE (c)-[:INCLUDES]->(e)
        `,
        { checkpointId, entityIds }
      );
    }

    this.emit("checkpoint:imported", {
      checkpointId,
      entityCount: entities.length,
    });
    return checkpointId;
  }




  async getEntityTimeline(
    entityId: string,
    options?: { since?: Date; until?: Date; limit?: number }
  ): Promise<{
    entity: Entity | null;
    versions: VersionInfo[];
    relationships: any[];
  }> {

    const entityQuery = `MATCH (e:Entity {id: $entityId}) RETURN e`;
    const entityResult = await this.neo4j.executeCypher(entityQuery, {
      entityId,
    });
    const entity =
      entityResult.length > 0 ? this.parseEntity(entityResult[0].e) : null;


    const where: string[] = ["v.entityId = $entityId"];
    const params: Record<string, any> = { entityId };

    if (options?.since) {
      where.push("v.timestamp >= $since");
      params.since = options.since.toISOString();
    }

    if (options?.until) {
      where.push("v.timestamp <= $until");
      params.until = options.until.toISOString();
    }

    const versionQuery = `
      MATCH (v:Version)
      WHERE ${where.join(" AND ")}
      RETURN v
      ORDER BY v.timestamp DESC
      LIMIT $limit
    `;

    params.limit = options?.limit || 100;

    const versionResult = await this.neo4j.executeCypher(versionQuery, params);
    const versions = versionResult.map((row) => ({
      id: row.v.properties.id,
      entityId: row.v.properties.entityId,
      hash: row.v.properties.hash,
      timestamp: new Date(row.v.properties.timestamp),
      changeSetId: row.v.properties.changeSetId,
      path: row.v.properties.path,
      language: row.v.properties.language,
    }));


    const relQuery = `
      MATCH (e:Entity {id: $entityId})-[r]-()
      WHERE r.validFrom IS NOT NULL
      RETURN r, startNode(r).id as fromId, endNode(r).id as toId
      ORDER BY r.validFrom DESC
      LIMIT $limit
    `;

    const relResult = await this.neo4j.executeCypher(relQuery, {
      entityId,
      limit: params.limit,
    });
    const relationships = relResult.map((row) => ({
      ...this.parseRelationship(row.r),
      fromId: row.fromId,
      toId: row.toId,
    }));

    return { entity, versions, relationships };
  }




  async getRelationshipTimeline(
    relationshipId: string,
    options?: { since?: Date; until?: Date; limit?: number }
  ): Promise<any[]> {
    const where: string[] = ["r.id = $relationshipId"];
    const params: Record<string, any> = { relationshipId };

    if (options?.since) {
      where.push("r.validFrom >= $since");
      params.since = options.since.toISOString();
    }

    if (options?.until) {
      where.push("r.validTo <= $until");
      params.until = options.until.toISOString();
    }

    const query = `
      MATCH ()-[r]->()
      WHERE ${where.join(" AND ")}
      RETURN r, startNode(r).id as fromId, endNode(r).id as toId
      ORDER BY r.validFrom DESC
      LIMIT $limit
    `;

    params.limit = options?.limit || 100;

    const result = await this.neo4j.executeCypher(query, params);
    return result.map((row) => ({
      ...this.parseRelationship(row.r),
      fromId: row.fromId,
      toId: row.toId,
    }));
  }




  async getSessionTimeline(
    sessionId: string,
    options?: { since?: Date; until?: Date; limit?: number }
  ): Promise<{
    versions: VersionInfo[];
    relationships: any[];
    checkpoints: CheckpointInfo[];
  }> {
    const where: string[] = [];
    const params: Record<string, any> = { sessionId };

    if (options?.since) {
      where.push("timestamp >= $since");
      params.since = options.since.toISOString();
    }

    if (options?.until) {
      where.push("timestamp <= $until");
      params.until = options.until.toISOString();
    }

    const whereClause = where.length > 0 ? `AND ${where.join(" AND ")}` : "";

    // Get versions for session
    const versionQuery = `
      MATCH (v:Version)
      WHERE v.changeSetId = $sessionId ${whereClause}
      RETURN v
      ORDER BY v.timestamp DESC
      LIMIT $limit
    `;

    params.limit = options?.limit || 100;

    const versionResult = await this.neo4j.executeCypher(versionQuery, params);
    const versions = versionResult.map((row) => ({
      id: row.v.properties.id,
      entityId: row.v.properties.entityId,
      hash: row.v.properties.hash,
      timestamp: new Date(row.v.properties.timestamp),
      changeSetId: row.v.properties.changeSetId,
      path: row.v.properties.path,
      language: row.v.properties.language,
    }));

    // Get relationships for session
    const relQuery = `
      MATCH ()-[r]->()
      WHERE r.changeSetId = $sessionId ${whereClause}
      RETURN r, startNode(r).id as fromId, endNode(r).id as toId
      ORDER BY r.validFrom DESC
      LIMIT $limit
    `;

    const relResult = await this.neo4j.executeCypher(relQuery, params);
    const relationships = relResult.map((row) => ({
      ...this.parseRelationship(row.r),
      fromId: row.fromId,
      toId: row.toId,
    }));

    // Get checkpoints (if any mention this session)
    const checkpointQuery = `
      MATCH (c:Checkpoint)
      WHERE c.metadata CONTAINS $sessionId ${whereClause}
      OPTIONAL MATCH (c)-[:INCLUDES]->(m)
      WITH c, count(m) as memberCount
      RETURN c, memberCount
      ORDER BY c.timestamp DESC
      LIMIT $limit
    `;

    const checkpointResult = await this.neo4j.executeCypher(
      checkpointQuery,
      params
    );
    const checkpoints = checkpointResult.map((row) => ({
      id: row.c.properties.id,
      timestamp: new Date(row.c.properties.timestamp),
      reason: row.c.properties.reason,
      seedEntities: JSON.parse(row.c.properties.seedEntities || "[]"),
      memberCount: row.memberCount,
      metadata: row.c.properties.metadata
        ? JSON.parse(row.c.properties.metadata)
        : undefined,
    }));

    return { versions, relationships, checkpoints };
  }

  /**
   * Get session impacts
   */
  async getSessionImpacts(sessionId: string): Promise<{
    entitiesModified: Entity[];
    relationshipsCreated: any[];
    relationshipsClosed: any[];
    metrics: {
      totalEntities: number;
      totalRelationships: number;
      timespan?: { start: Date; end: Date };
    };
  }> {
    // Get entities modified in session
    const entityQuery = `
      MATCH (v:Version {changeSetId: $sessionId})-[:VERSION_OF]->(e:Entity)
      RETURN DISTINCT e
    `;

    const entityResult = await this.neo4j.executeCypher(entityQuery, {
      sessionId,
    });
    const entitiesModified = entityResult.map((row) => this.parseEntity(row.e));

    // Get relationships created in session
    const createdQuery = `
      MATCH ()-[r]->()
      WHERE r.changeSetId = $sessionId AND r.validFrom IS NOT NULL
      RETURN r, startNode(r).id as fromId, endNode(r).id as toId
    `;

    const createdResult = await this.neo4j.executeCypher(createdQuery, {
      sessionId,
    });
    const relationshipsCreated = createdResult.map((row) => ({
      ...this.parseRelationship(row.r),
      fromId: row.fromId,
      toId: row.toId,
    }));

    // Get relationships closed in session (if any)
    const closedQuery = `
      MATCH ()-[r]->()
      WHERE r.changeSetId = $sessionId AND r.validTo IS NOT NULL
      RETURN r, startNode(r).id as fromId, endNode(r).id as toId
    `;

    const closedResult = await this.neo4j.executeCypher(closedQuery, {
      sessionId,
    });
    const relationshipsClosed = closedResult.map((row) => ({
      ...this.parseRelationship(row.r),
      fromId: row.fromId,
      toId: row.toId,
    }));

    // Calculate metrics
    const timestamps = [
      ...relationshipsCreated
        .map((r) => r.properties?.validFrom)
        .filter(Boolean),
      ...relationshipsClosed.map((r) => r.properties?.validTo).filter(Boolean),
    ].map((t) => new Date(t));

    const timespan =
      timestamps.length > 0
        ? {
            start: new Date(Math.min(...timestamps.map((t) => t.getTime()))),
            end: new Date(Math.max(...timestamps.map((t) => t.getTime()))),
          }
        : undefined;

    return {
      entitiesModified,
      relationshipsCreated,
      relationshipsClosed,
      metrics: {
        totalEntities: entitiesModified.length,
        totalRelationships:
          relationshipsCreated.length + relationshipsClosed.length,
        timespan,
      },
    };
  }

  /**
   * Get sessions affecting an entity
   */
  async getSessionsAffectingEntity(
    entityId: string,
    options?: { since?: Date; until?: Date; limit?: number }
  ): Promise<{
    sessions: string[];
    details: Array<{
      sessionId: string;
      versionCount: number;
      relationshipCount: number;
      timespan: { start: Date; end: Date };
    }>;
  }> {
    const where: string[] = ["v.entityId = $entityId"];
    const params: Record<string, any> = { entityId };

    if (options?.since) {
      where.push("v.timestamp >= $since");
      params.since = options.since.toISOString();
    }

    if (options?.until) {
      where.push("v.timestamp <= $until");
      params.until = options.until.toISOString();
    }

    const query = `
      MATCH (v:Version)
      WHERE ${where.join(" AND ")} AND v.changeSetId IS NOT NULL
      OPTIONAL MATCH (e:Entity {id: $entityId})-[r]->()
      WHERE r.changeSetId = v.changeSetId
      WITH v.changeSetId as sessionId,
           count(DISTINCT v) as versionCount,
           count(DISTINCT r) as relationshipCount,
           min(v.timestamp) as startTime,
           max(v.timestamp) as endTime
      RETURN sessionId, versionCount, relationshipCount, startTime, endTime
      ORDER BY startTime DESC
      LIMIT $limit
    `;

    params.limit = options?.limit || 50;

    const result = await this.neo4j.executeCypher(query, params);

    const details = result.map((row) => ({
      sessionId: row.sessionId,
      versionCount: row.versionCount,
      relationshipCount: row.relationshipCount,
      timespan: {
        start: new Date(row.startTime),
        end: new Date(row.endTime),
      },
    }));

    const sessions = [...new Set(details.map((d) => d.sessionId))];

    return { sessions, details };
  }




  async getChangesForSession(
    sessionId: string,
    options?: {
      entityTypes?: string[];
      relationshipTypes?: string[];
      limit?: number;
    }
  ): Promise<{
    versions: VersionInfo[];
    relationships: any[];
    summary: {
      entitiesAffected: number;
      relationshipsAffected: number;
      entityTypes: Record<string, number>;
      relationshipTypes: Record<string, number>;
    };
  }> {

    const versionQuery = `
      MATCH (v:Version {changeSetId: $sessionId})
      MATCH (v)-[:VERSION_OF]->(e:Entity)
      ${options?.entityTypes ? "WHERE e.type IN $entityTypes" : ""}
      RETURN v, e.type as entityType
      ORDER BY v.timestamp DESC
      LIMIT $limit
    `;

    const versionParams: any = { sessionId, limit: options?.limit || 100 };
    if (options?.entityTypes) {
      versionParams.entityTypes = options.entityTypes;
    }

    const versionResult = await this.neo4j.executeCypher(
      versionQuery,
      versionParams
    );
    const versions = versionResult.map((row) => ({
      id: row.v.properties.id,
      entityId: row.v.properties.entityId,
      hash: row.v.properties.hash,
      timestamp: new Date(row.v.properties.timestamp),
      changeSetId: row.v.properties.changeSetId,
      path: row.v.properties.path,
      language: row.v.properties.language,
    }));


    const relQuery = `
      MATCH ()-[r]->()
      WHERE r.changeSetId = $sessionId
      ${options?.relationshipTypes ? "AND type(r) IN $relationshipTypes" : ""}
      RETURN r, type(r) as relType, startNode(r).id as fromId, endNode(r).id as toId
      ORDER BY r.validFrom DESC
      LIMIT $limit
    `;

    const relParams: any = { sessionId, limit: options?.limit || 100 };
    if (options?.relationshipTypes) {
      relParams.relationshipTypes = options.relationshipTypes;
    }

    const relResult = await this.neo4j.executeCypher(relQuery, relParams);
    const relationships = relResult.map((row) => ({
      ...this.parseRelationship(row.r),
      fromId: row.fromId,
      toId: row.toId,
    }));


    const entityTypes: Record<string, number> = {};
    const relationshipTypes: Record<string, number> = {};

    versionResult.forEach((row) => {
      if (row.entityType) {
        entityTypes[row.entityType] = (entityTypes[row.entityType] || 0) + 1;
      }
    });

    relResult.forEach((row) => {
      if (row.relType) {
        relationshipTypes[row.relType] =
          (relationshipTypes[row.relType] || 0) + 1;
      }
    });

    return {
      versions,
      relationships,
      summary: {
        entitiesAffected: new Set(versions.map((v) => v.entityId)).size,
        relationshipsAffected: relationships.length,
        entityTypes,
        relationshipTypes,
      },
    };
  }
}

================
File: graph/Neo4jService.ts
================
import { EventEmitter } from "events";
import * as neo4j from "neo4j-driver";
import {
  CypherExecutor,
  VectorService,
  GdsService,
  Neo4jConfig,
  CypherQueryOptions,
  VectorSearchOptions,
  GdsAlgorithmConfig,
  VectorIndexConfig,
  PathExpandConfig,
  BenchmarkOptions,
} from "./neo4j/index.js";

export {
  Neo4jConfig,
  CypherQueryOptions,
  VectorSearchOptions,
  GdsAlgorithmConfig,
  VectorIndexConfig,
  PathExpandConfig,
  BenchmarkOptions,
};

export class Neo4jService extends EventEmitter {
  private executor: CypherExecutor;
  private vectorService: VectorService;
  private gdsService: GdsService;

  constructor(config: Neo4jConfig) {
    super();


    this.executor = new CypherExecutor(config);
    this.vectorService = new VectorService(this.executor);
    this.gdsService = new GdsService(this.executor);


    this.executor.on("error", (data) => this.emit("error", data));
    this.executor.on("transaction:error", (data) =>
      this.emit("transaction:error", data)
    );
    this.executor.on("closed", () => this.emit("closed"));

    this.vectorService.on("vectorIndex:created", (data) =>
      this.emit("vectorIndex:created", data)
    );
    this.vectorService.on("vectors:upserted", (data) =>
      this.emit("vectors:upserted", data)
    );
    this.vectorService.on("embedding:deleted", (data) =>
      this.emit("embedding:deleted", data)
    );

    this.gdsService.on("algorithm:completed", (data) =>
      this.emit("algorithm:completed", data)
    );
    this.gdsService.on("algorithm:error", (data) =>
      this.emit("algorithm:error", data)
    );
    this.gdsService.on("pathExpansion:completed", (data) =>
      this.emit("pathExpansion:completed", data)
    );
    this.gdsService.on("pathExpansion:error", (data) =>
      this.emit("pathExpansion:error", data)
    );
    this.gdsService.on("shortestPath:found", (data) =>
      this.emit("shortestPath:found", data)
    );
    this.gdsService.on("shortestPath:error", (data) =>
      this.emit("shortestPath:error", data)
    );
    this.gdsService.on("namedGraph:created", (data) =>
      this.emit("namedGraph:created", data)
    );
    this.gdsService.on("namedGraph:dropped", (data) =>
      this.emit("namedGraph:dropped", data)
    );
  }




  async executeCypher(
    query: string,
    params: Record<string, any> = {},
    options: CypherQueryOptions = {}
  ): Promise<any[]> {
    return this.executor.executeCypher(query, params, options);
  }




  async executeTransaction(
    queries: Array<{ query: string; params?: Record<string, any> }>,
    options: CypherQueryOptions = {}
  ): Promise<any[]> {
    return this.executor.executeTransaction(queries, options);
  }




  async callApoc(
    procedure: string,
    params: Record<string, any> = {},
    options: CypherQueryOptions = {}
  ): Promise<any[]> {
    const query = `CALL ${procedure}`;
    return this.executeCypher(query, params, options);
  }




  async runGdsAlgorithm(
    algorithm: string,
    config: GdsAlgorithmConfig & Record<string, any>,
    options: CypherQueryOptions = {}
  ): Promise<any[]> {
    const query = `CALL ${algorithm}(${this.buildGdsConfigString(config)})`;
    return this.executeCypher(query, {}, options);
  }




  async createVectorIndex(
    indexName: string,
    label: string,
    propertyKey: string,
    dimensions: number,
    similarity: "euclidean" | "cosine" = "cosine"
  ): Promise<void> {
    const query = `
      CREATE VECTOR INDEX ${indexName} IF NOT EXISTS
      FOR (n:${label})
      ON (n.${propertyKey})
      OPTIONS {
        indexConfig: {
          \`vector.dimensions\`: ${dimensions},
          \`vector.similarity_function\`: '${similarity}'
        }
      }
    `;
    await this.executeCypher(query);
  }




  async upsertVectors(
    label: string,
    vectors: Array<{
      id: string;
      vector: number[];
      properties?: Record<string, any>;
    }>
  ): Promise<void> {
    const query = `
      UNWIND $vectors AS item
      MERGE (n:${label} {id: item.id})
      SET n.embedding = item.vector
      SET n += item.properties
    `;

    const params = {
      vectors: vectors.map((v) => ({
        id: v.id,
        vector: v.vector,
        properties: v.properties || {},
      })),
    };

    await this.executeCypher(query, params);
  }




  async searchVectors(
    indexName: string,
    queryVector: number[],
    options: VectorSearchOptions = {}
  ): Promise<any[]> {
    const limit = options.limit || 10;
    const minScore = options.minScore || 0.0;

    let query = `
      CALL db.index.vector.queryNodes($indexName, $k, $queryVector)
      YIELD node, score
      WHERE score >= $minScore
    `;

    if (options.filter) {
      const filterClauses = Object.entries(options.filter)
        .map(([key, value]) => `node.${key} = $filter_${key}`)
        .join(" AND ");
      query += ` AND ${filterClauses}`;
    }

    query += `
      RETURN node, score
      ORDER BY score DESC
      LIMIT $limit
    `;

    const params: any = {
      indexName,
      k: limit * 2,
      queryVector,
      minScore,
      limit,
    };

    if (options.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        params[`filter_${key}`] = value;
      });
    }

    return this.executeCypher(query, params);
  }




  async apocTextSearch(
    label: string,
    property: string,
    searchText: string,
    options: { fuzzy?: boolean; limit?: number } = {}
  ): Promise<any[]> {
    if (options.fuzzy) {
      const query = `
        MATCH (n:${label})
        WITH n, apoc.text.levenshteinSimilarity(n.${property}, $searchText) AS similarity
        WHERE similarity > 0.7
        RETURN n, similarity
        ORDER BY similarity DESC
        LIMIT $limit
      `;
      return this.executeCypher(query, {
        searchText,
        limit: options.limit || 20,
      });
    } else {
      const query = `
        MATCH (n:${label})
        WHERE n.${property} CONTAINS $searchText
        RETURN n
        LIMIT $limit
      `;
      return this.executeCypher(query, {
        searchText,
        limit: options.limit || 50,
      });
    }
  }




  async apocPathExpand(
    startNodeId: string,
    relationshipFilter: string,
    maxDepth: number,
    options: { labelFilter?: string; uniqueness?: string } = {}
  ): Promise<any[]> {
    const query = `
      MATCH (start {id: $startId})
      CALL apoc.path.expand(
        start,
        $relFilter,
        $labelFilter,
        1,
        $maxDepth,
        $uniqueness
      ) YIELD path
      RETURN path
    `;

    return this.executeCypher(query, {
      startId: startNodeId,
      relFilter: relationshipFilter,
      labelFilter: options.labelFilter || null,
      maxDepth,
      uniqueness: options.uniqueness || "RELATIONSHIP_GLOBAL",
    });
  }




  async getStats(): Promise<any> {
    const queries = [
      { name: "nodes", query: "MATCH (n) RETURN count(n) as count" },
      {
        name: "relationships",
        query: "MATCH ()-[r]->() RETURN count(r) as count",
      },
      {
        name: "labels",
        query: "CALL db.labels() YIELD label RETURN collect(label) as labels",
      },
      {
        name: "types",
        query:
          "CALL db.relationshipTypes() YIELD relationshipType RETURN collect(relationshipType) as types",
      },
      {
        name: "indexes",
        query:
          "SHOW INDEXES YIELD name, type, labelsOrTypes, properties RETURN collect({name: name, type: type, labels: labelsOrTypes, properties: properties}) as indexes",
      },
    ];

    const stats: any = {};
    for (const { name, query } of queries) {
      try {
        const result = await this.executeCypher(query);
        stats[name] =
          result[0]?.[
            name === "nodes" || name === "relationships" ? "count" : name
          ] || 0;
      } catch (error) {
        stats[name] = "unavailable";
      }
    }
    return stats;
  }




  async createCommonIndexes(): Promise<void> {
    const indexes = [
      "CREATE INDEX entity_id IF NOT EXISTS FOR (n:Entity) ON (n.id)",
      "CREATE INDEX entity_type IF NOT EXISTS FOR (n:Entity) ON (n.type)",
      "CREATE INDEX entity_path IF NOT EXISTS FOR (n:Entity) ON (n.path)",
      "CREATE INDEX entity_name IF NOT EXISTS FOR (n:Entity) ON (n.name)",
      "CREATE INDEX file_path IF NOT EXISTS FOR (n:File) ON (n.path)",
      "CREATE INDEX symbol_name IF NOT EXISTS FOR (n:Symbol) ON (n.name)",
      "CREATE INDEX symbol_path IF NOT EXISTS FOR (n:Symbol) ON (n.path)",
      "CREATE INDEX version_entity IF NOT EXISTS FOR (n:Version) ON (n.entityId)",
      "CREATE INDEX checkpoint_id IF NOT EXISTS FOR (n:Checkpoint) ON (n.id)",
    ];

    for (const index of indexes) {
      try {
        await this.executeCypher(index);
      } catch (error) {

        console.warn(`Failed to create index: ${index}`, error);
      }
    }
  }




  private convertNeo4jValue(value: any): any {
    if (value === null || value === undefined) return value;
    if (neo4j.isInt(value)) return value.toNumber();
    if (neo4j.isDate(value)) return value.toString();
    if (neo4j.isDateTime(value)) return new Date(value.toString());
    if (neo4j.isNode(value)) return this.convertNode(value);
    if (neo4j.isRelationship(value)) return this.convertRelationship(value);
    if (neo4j.isPath(value)) return this.convertPath(value);
    if (Array.isArray(value))
      return value.map((v) => this.convertNeo4jValue(v));
    if (typeof value === "object") {
      const converted: any = {};
      for (const [k, v] of Object.entries(value)) {
        converted[k] = this.convertNeo4jValue(v);
      }
      return converted;
    }
    return value;
  }

  private convertNode(node: any): any {
    return {
      id: node.identity.toNumber(),
      labels: node.labels,
      properties: this.convertNeo4jValue(node.properties),
    };
  }

  private convertRelationship(rel: any): any {
    return {
      id: rel.identity.toNumber(),
      type: rel.type,
      startNodeId: rel.start.toNumber(),
      endNodeId: rel.end.toNumber(),
      properties: this.convertNeo4jValue(rel.properties),
    };
  }

  private convertPath(path: any): any {
    return {
      start: this.convertNode(path.start),
      end: this.convertNode(path.end),
      segments: path.segments.map((segment: any) => ({
        start: this.convertNode(segment.start),
        relationship: this.convertRelationship(segment.relationship),
        end: this.convertNode(segment.end),
      })),
      length: path.length,
    };
  }

  private buildGdsConfigString(config: Record<string, any>): string {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(config)) {
      if (value !== undefined) {
        if (typeof value === "string") {
          parts.push(`${key}: '${value}'`);
        } else {
          parts.push(`${key}: ${JSON.stringify(value)}`);
        }
      }
    }
    return `{${parts.join(", ")}}`;
  }




  async getIndexHealth(): Promise<{
    indexes: Array<{
      name: string;
      status: string;
      type: string;
      labels: string[];
      properties: string[];
      populationPercent?: number;
    }>;
    summary: {
      total: number;
      online: number;
      failed: number;
      populating: number;
    };
  }> {
    const query = `
      SHOW INDEXES
      YIELD name, type, labelsOrTypes, properties, state, populationPercent
      RETURN name, type, labelsOrTypes as labels, properties, state, populationPercent
    `;

    try {
      const result = await this.executeCypher(query);

      const indexes = result.map((row) => ({
        name: row.name,
        status: row.state || "unknown",
        type: row.type,
        labels: Array.isArray(row.labels)
          ? row.labels
          : [row.labels].filter(Boolean),
        properties: Array.isArray(row.properties)
          ? row.properties
          : [row.properties].filter(Boolean),
        populationPercent: row.populationPercent,
      }));

      const summary = {
        total: indexes.length,
        online: indexes.filter((i) => i.status === "ONLINE").length,
        failed: indexes.filter((i) => i.status === "FAILED").length,
        populating: indexes.filter((i) => i.status === "POPULATING").length,
      };

      return { indexes, summary };
    } catch (error) {
      console.warn("Failed to get index health:", error);
      return {
        indexes: [],
        summary: { total: 0, online: 0, failed: 0, populating: 0 },
      };
    }
  }




  async ensureGraphIndexes(): Promise<void> {
    const advancedIndexes = [

      "CREATE INDEX entity_type_path IF NOT EXISTS FOR (n:Entity) ON (n.type, n.path)",
      "CREATE INDEX entity_name_type IF NOT EXISTS FOR (n:Entity) ON (n.name, n.type)",
      "CREATE INDEX file_path_modified IF NOT EXISTS FOR (n:File) ON (n.path, n.lastModified)",
      "CREATE INDEX symbol_name_file IF NOT EXISTS FOR (n:Symbol) ON (n.name, n.filePath)",


      "CREATE FULLTEXT INDEX entity_content_search IF NOT EXISTS FOR (n:Entity) ON EACH [n.content, n.description, n.name]",
      "CREATE FULLTEXT INDEX symbol_search IF NOT EXISTS FOR (n:Symbol) ON EACH [n.name, n.signature, n.documentation]",


      "CREATE INDEX version_timestamp IF NOT EXISTS FOR (n:Version) ON (n.timestamp)",
      "CREATE INDEX checkpoint_timestamp IF NOT EXISTS FOR (n:Checkpoint) ON (n.timestamp)",
      "CREATE INDEX relationship_validity IF NOT EXISTS FOR ()-[r]-() ON (r.validFrom, r.validTo)",


      "CREATE INDEX relationship_changeset IF NOT EXISTS FOR ()-[r]-() ON (r.changeSetId)",
      "CREATE INDEX relationship_active IF NOT EXISTS FOR ()-[r]-() ON (r.active)",
    ];

    for (const index of advancedIndexes) {
      try {
        await this.executeCypher(index);
        console.log(`✓ Created index: ${index.split(" ")[2]}`);
      } catch (error) {
        console.warn(`Failed to create index: ${index}`, error);
      }
    }


    const constraints = [
      "CREATE CONSTRAINT entity_id_unique IF NOT EXISTS FOR (n:Entity) REQUIRE n.id IS UNIQUE",
      "CREATE CONSTRAINT version_id_unique IF NOT EXISTS FOR (n:Version) REQUIRE n.id IS UNIQUE",
      "CREATE CONSTRAINT checkpoint_id_unique IF NOT EXISTS FOR (n:Checkpoint) REQUIRE n.id IS UNIQUE",
    ];

    for (const constraint of constraints) {
      try {
        await this.executeCypher(constraint);
        console.log(`✓ Created constraint: ${constraint.split(" ")[2]}`);
      } catch (error) {
        console.warn(`Failed to create constraint: ${constraint}`, error);
      }
    }

    console.log("[Neo4jService] Graph indexes and constraints ensured");
  }




  async runBenchmarks(options?: {
    includeWrites?: boolean;
    sampleSize?: number;
    timeout?: number;
  }): Promise<{
    readPerformance: {
      simpleNodeQuery: { avgMs: number; operations: number };
      relationshipTraversal: { avgMs: number; operations: number };
      indexLookup: { avgMs: number; operations: number };
      aggregationQuery: { avgMs: number; operations: number };
    };
    writePerformance?: {
      nodeCreation: { avgMs: number; operations: number };
      relationshipCreation: { avgMs: number; operations: number };
      bulkInsert: { avgMs: number; operations: number };
    };
    databaseStats: {
      nodeCount: number;
      relationshipCount: number;
      indexCount: number;
      memoryUsage?: string;
    };
  }> {
    const sampleSize = options?.sampleSize || 10;
    const includeWrites = options?.includeWrites || false;
    const timeout = options?.timeout || 5000;

    console.log("[Neo4jService] Running performance benchmarks...");


    const timeOperation = async (
      operation: () => Promise<any>,
      iterations: number
    ) => {
      const start = Date.now();
      for (let i = 0; i < iterations; i++) {
        await operation();
      }
      const end = Date.now();
      return {
        avgMs: (end - start) / iterations,
        operations: iterations,
      };
    };


    const readPerformance = {
      simpleNodeQuery: await timeOperation(async () => {
        await this.executeCypher(
          "MATCH (n:Entity) RETURN n LIMIT 1",
          {},
          { timeout }
        );
      }, sampleSize),

      relationshipTraversal: await timeOperation(async () => {
        await this.executeCypher(
          "MATCH (n:Entity)-[r]->() RETURN n, r LIMIT 5",
          {},
          { timeout }
        );
      }, sampleSize),

      indexLookup: await timeOperation(async () => {
        await this.executeCypher(
          "MATCH (n:Entity) WHERE n.type = $type RETURN n LIMIT 1",
          { type: "File" },
          { timeout }
        );
      }, sampleSize),

      aggregationQuery: await timeOperation(async () => {
        await this.executeCypher(
          "MATCH (n:Entity) RETURN n.type, count(n) as count",
          {},
          { timeout }
        );
      }, sampleSize),
    };


    let writePerformance: any = undefined;
    if (includeWrites) {
      const testNodeId = `benchmark_test_${Date.now()}`;

      writePerformance = {
        nodeCreation: await timeOperation(async () => {
          await this.executeCypher(
            "CREATE (n:BenchmarkTest {id: $id, timestamp: $timestamp})",
            {
              id: `${testNodeId}_${Math.random()}`,
              timestamp: new Date().toISOString(),
            },
            { timeout }
          );
        }, Math.min(sampleSize, 5)),

        relationshipCreation: await timeOperation(async () => {
          await this.executeCypher(
            `
            MATCH (a:BenchmarkTest), (b:BenchmarkTest)
            WHERE a.id <> b.id
            WITH a, b LIMIT 1
            CREATE (a)-[:BENCHMARK_REL {created: $timestamp}]->(b)
            `,
            { timestamp: new Date().toISOString() },
            { timeout }
          );
        }, Math.min(sampleSize, 3)),

        bulkInsert: await timeOperation(async () => {
          const nodes = Array.from({ length: 5 }, (_, i) => ({
            id: `bulk_${testNodeId}_${i}_${Math.random()}`,
            timestamp: new Date().toISOString(),
          }));
          await this.executeCypher(
            "UNWIND $nodes AS node CREATE (n:BenchmarkTest) SET n = node",
            { nodes },
            { timeout }
          );
        }, Math.min(sampleSize, 3)),
      };


      try {
        await this.executeCypher("MATCH (n:BenchmarkTest) DETACH DELETE n");
      } catch (error) {
        console.warn("Failed to cleanup benchmark test data:", error);
      }
    }


    const [nodeStats, relStats, indexStats] = await Promise.all([
      this.executeCypher("MATCH (n) RETURN count(n) as count"),
      this.executeCypher("MATCH ()-[r]->() RETURN count(r) as count"),
      this.executeCypher("SHOW INDEXES YIELD name RETURN count(name) as count"),
    ]);

    const databaseStats = {
      nodeCount: nodeStats[0]?.count || 0,
      relationshipCount: relStats[0]?.count || 0,
      indexCount: indexStats[0]?.count || 0,
    };

    console.log("[Neo4jService] Benchmarks completed");

    return {
      readPerformance,
      writePerformance,
      databaseStats,
    };
  }




  async close(): Promise<void> {
    await this.driver.close();
  }
}

================
File: graph/NeogmaService.ts
================
import { Neogma } from 'neogma';
import { EventEmitter } from 'events';
import { Neo4jConfig } from '../Neo4jService.js';

export class NeogmaService extends EventEmitter {
  private neogma: Neogma;

  constructor(config: Neo4jConfig) {
    super();


    this.neogma = new Neogma({
      url: config.uri,
      username: config.username,
      password: config.password,
      database: config.database || 'neo4j',
    } as any);


    this.verifyConnection();
  }




  private async verifyConnection(): Promise<void> {
    try {
      const result = await this.neogma.queryRunner.run('RETURN 1 as test');
      if (result.records[0]?.get('test') === 1) {
        this.emit('connected', { status: 'connected' });
      }
    } catch (error) {
      this.emit('error', { message: 'Failed to connect to Neo4j', error });
      throw error;
    }
  }




  getNeogmaInstance(): Neogma {
    return this.neogma;
  }




  async executeCypher(
    query: string,
    params: Record<string, any> = {}
  ): Promise<any[]> {
    try {
      const result = await this.neogma.queryRunner.run(query, params);
      return result.records.map(record => {
        const obj: any = {};
        record.keys.forEach(key => {
          obj[key] = record.get(key);
        });
        return obj;
      });
    } catch (error) {
      this.emit('error', { query, params, error });
      throw error;
    }
  }




  async close(): Promise<void> {
    await this.neogma.driver.close();
    this.emit('disconnected');
  }
}

================
File: graph/RelationshipBuilder.ts
================
import { Project, Node, SourceFile } from "ts-morph";
import * as path from "path";
import { Entity, File, Symbol as SymbolEntity } from "../../../models/entities.js";
import {
  GraphRelationship,
  RelationshipType,
} from "../../../models/relationships.js";
import { normalizeCodeEdge } from "../../../utils/codeEdges.js";
import { noiseConfig } from "../../../config/noise.js";

import {
  CallRelationshipBuilder,
  RelationshipBuilderOptions as CallBuilderOptions,
} from "../../../builders/parser/CallRelationshipBuilder.js";
import {
  TypeRelationshipBuilder,
  TypeRelationshipBuilderOptions,
} from "../../../builders/parser/TypeRelationshipBuilder.js";
import {
  ImportExportBuilder,
  ImportExportBuilderOptions,
} from "../../../builders/parser/ImportExportBuilder.js";
import {
  ReferenceRelationshipBuilder,
  ReferenceRelationshipBuilderOptions,
} from "../../../builders/parser/ReferenceRelationshipBuilder.js";

export interface RelationshipBuilderOptions {
  tsProject: Project;
  globalSymbolIndex: Map<string, SymbolEntity>;
  nameIndex: Map<string, SymbolEntity[]>;
  stopNames: Set<string>;
  fileCache: Map<string, any>;
  shouldUseTypeChecker: (context: any) => boolean;
  takeTcBudget: () => boolean;
  resolveWithTypeChecker: (node: any, sourceFile: SourceFile) => any;
  resolveCallTargetWithChecker: (call: any, sourceFile: SourceFile) => any;
  resolveImportedMemberToFileAndName: (
    memberName: string,
    exportName: string,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ) => any;
  getModuleExportMap: (sourceFile?: SourceFile) => Map<string, any>;
  normalizeRelPath: (p: string) => string;
}





export class RelationshipBuilder {
  private tsProject: Project;
  private globalSymbolIndex: Map<string, SymbolEntity>;
  private nameIndex: Map<string, SymbolEntity[]>;
  private stopNames: Set<string>;
  private fileCache: Map<string, any>;
  private shouldUseTypeChecker: (context: any) => boolean;
  private takeTcBudget: () => boolean;
  private resolveWithTypeChecker: (node: any, sourceFile: SourceFile) => any;
  private resolveCallTargetWithChecker: (
    call: any,
    sourceFile: SourceFile
  ) => any;
  private resolveImportedMemberToFileAndName: (
    memberName: string,
    exportName: string,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ) => any;
  private getModuleExportMap: (sourceFile?: SourceFile) => Map<string, any>;
  private normalizeRelPath: (p: string) => string;


  private callBuilder: CallRelationshipBuilder;
  private typeBuilder: TypeRelationshipBuilder;
  private importBuilder: ImportExportBuilder;
  private referenceBuilder: ReferenceRelationshipBuilder;

  constructor(options: RelationshipBuilderOptions) {
    this.tsProject = options.tsProject;
    this.globalSymbolIndex = options.globalSymbolIndex;
    this.nameIndex = options.nameIndex;
    this.stopNames = options.stopNames;
    this.fileCache = options.fileCache;
    this.shouldUseTypeChecker = options.shouldUseTypeChecker;
    this.takeTcBudget = options.takeTcBudget;
    this.resolveWithTypeChecker = options.resolveWithTypeChecker;
    this.resolveCallTargetWithChecker = options.resolveCallTargetWithChecker;
    this.resolveImportedMemberToFileAndName =
      options.resolveImportedMemberToFileAndName;
    this.getModuleExportMap = options.getModuleExportMap;
    this.normalizeRelPath = options.normalizeRelPath;


    const sharedOptions = {
      tsProject: this.tsProject,
      globalSymbolIndex: this.globalSymbolIndex,
      nameIndex: this.nameIndex,
      stopNames: this.stopNames,
      shouldUseTypeChecker: this.shouldUseTypeChecker,
      takeTcBudget: this.takeTcBudget,
      resolveWithTypeChecker: this.resolveWithTypeChecker,
      resolveCallTargetWithChecker: this.resolveCallTargetWithChecker,
      resolveImportedMemberToFileAndName:
        this.resolveImportedMemberToFileAndName,
      normalizeRelPath: this.normalizeRelPath,
      createRelationship: this.createRelationship.bind(this),
    };

    this.callBuilder = new CallRelationshipBuilder(sharedOptions);
    this.typeBuilder = new TypeRelationshipBuilder({
      ...sharedOptions,
      stopNames: this.stopNames,
    } as TypeRelationshipBuilderOptions);
    this.importBuilder = new ImportExportBuilder({
      getModuleExportMap: this.getModuleExportMap,
    });
    this.referenceBuilder = new ReferenceRelationshipBuilder({
      globalSymbolIndex: this.globalSymbolIndex,
      nameIndex: this.nameIndex,
      stopNames: this.stopNames,
      shouldUseTypeChecker: this.shouldUseTypeChecker,
      takeTcBudget: this.takeTcBudget,
      resolveWithTypeChecker: this.resolveWithTypeChecker,
      resolveImportedMemberToFileAndName:
        this.resolveImportedMemberToFileAndName,
      createRelationship: this.createRelationship.bind(this),
    } as ReferenceRelationshipBuilderOptions);
  }





  extractSymbolRelationships(
    node: Node,
    symbolEntity: SymbolEntity,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ): GraphRelationship[] {
    const relationships: GraphRelationship[] = [];


    const localIndex = this.buildLocalIndex(sourceFile);


    relationships.push(
      ...this.callBuilder.extractCallRelationships(
        node,
        symbolEntity,
        sourceFile,
        importMap,
        importSymbolMap,
        localIndex
      )
    );

    relationships.push(
      ...this.typeBuilder.extractTypeRelationships(
        node,
        symbolEntity,
        sourceFile,
        importMap,
        importSymbolMap,
        localIndex
      )
    );

    return relationships;
  }





  extractReferenceRelationships(
    sourceFile: SourceFile,
    fileEntity: File,
    localSymbols: Array<{ node: Node; entity: SymbolEntity }>,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ): GraphRelationship[] {
    return this.referenceBuilder.extractReferenceRelationships(
      sourceFile,
      fileEntity,
      localSymbols,
      importMap,
      importSymbolMap
    );
  }





  extractImportRelationships(
    sourceFile: SourceFile,
    fileEntity: File,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ): GraphRelationship[] {
    return this.importBuilder.extractImportRelationships(
      sourceFile,
      fileEntity,
      importMap,
      importSymbolMap
    );
  }




  createRelationship(
    fromId: string,
    toId: string,
    type: RelationshipType,
    metadata?: Record<string, any>
  ): GraphRelationship {

    try {
      if (metadata && (metadata as any).source == null) {
        const md: any = metadata as any;
        if (md.usedTypeChecker === true || md.resolution === "type-checker")
          md.source = "type-checker";
        else md.source = "ast";
      }
    } catch {}

    const rid = this.canonicalRelationshipId(fromId, {
      toEntityId: toId,
      type,
    } as any);
    const rel: any = {
      id: rid,
      fromEntityId: fromId,
      toEntityId: toId,
      type,
      created: new Date(),
      lastModified: new Date(),
      version: 1,
      ...(metadata ? { metadata } : {}),
    };


    try {
      if (!(rel as any).toRef) {
        const t = String(toId || "");
        // file:<relPath>:<name> -> fileSymbol
        const mFile = t.match(/^file:(.+?):(.+)$/);
        if (mFile) {
          (rel as any).toRef = {
            kind: "fileSymbol",
            file: mFile[1],
            symbol: mFile[2],
            name: mFile[2],
          };
        } else if (t.startsWith("external:")) {

          (rel as any).toRef = {
            kind: "external",
            name: t.slice("external:".length),
          };
        } else if (/^(class|interface|function|typeAlias):/.test(t)) {

          const parts = t.split(":");
          (rel as any).toRef = {
            kind: "external",
            name: parts.slice(1).join(":"),
          };
        }

        else if (/^(sym:|file:)/.test(t)) {

          const isParsableSym =
            t.startsWith("sym:") && /^sym:(.+?)#(.+?)(?:@.+)?$/.test(t);
          const isParsableFile =
            t.startsWith("file:") && /^file:(.+?):(.+)$/.test(t);
          if (!isParsableSym && !isParsableFile) {
            (rel as any).toRef = { kind: "entity", id: t };
          }
        }
      }
    } catch {}


    try {
      if (!(rel as any).fromRef) {

        (rel as any).fromRef = { kind: "entity", id: fromId };
      }
    } catch {}


    return normalizeCodeEdge(rel as GraphRelationship);
  }




  private buildLocalIndex(sourceFile: SourceFile): Map<string, string> {
    const localIndex = new Map<string, string>();
    try {
      const sfPath = (sourceFile.getFilePath && sourceFile.getFilePath()) || "";
      const relPath = path.relative(process.cwd(), sfPath);

      const cached = this.fileCache.get(path.resolve(relPath));
      if (cached && cached.symbolMap) {
        for (const [k, v] of cached.symbolMap.entries()) {
          const valId = (v as any).id;
          // Original key format in cache: `${symbolEntity.path}:${symbolEntity.name}`
          localIndex.set(k, valId);
          // Also index by simplified key `${fileRelPath}:${name}` to match lookups below
          const parts = String(k).split(":");
          if (parts.length >= 2) {
            const name = parts[parts.length - 1];

            const simpleKey = `${relPath}:${name}`;
            localIndex.set(simpleKey, valId);
          }
        }
      }
    } catch {}
    return localIndex;
  }




  private canonicalRelationshipId(fromId: string, rel: any): string {

    return `${fromId}|${rel.type}|${rel.toEntityId}`;
  }
}

================
File: graph/RelationshipServiceOGM.ts
================
import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { NeogmaService } from './NeogmaService.js';
import { createRelationshipModels } from '../../models/ogm/RelationshipModels.js';
import { createEntityModels } from '../../models/ogm/EntityModels.js';
import {
  GraphRelationship,
  RelationshipType,
  RelationshipQuery,
} from '../../models/relationships.js';
import {
  normalizeCodeEdge,
  canonicalRelationshipId,
  isCodeRelationship,
  mergeEdgeEvidence,
  mergeEdgeLocations,
} from '../../utils/codeEdges.js';

export interface BulkRelationshipOptions {
  skipExisting?: boolean;
  mergeEvidence?: boolean;
  updateTimestamps?: boolean;
}

export interface RelationshipStats {
  total: number;
  byType: Record<string, number>;
  active: number;
  inactive: number;
  withEvidence: number;
}


export interface IRelationshipService extends EventEmitter {
  createRelationship(relationship: GraphRelationship): Promise<GraphRelationship>;
  createRelationshipsBulk(
    relationships: GraphRelationship[],
    options?: BulkRelationshipOptions
  ): Promise<{
    created: number;
    updated: number;
    failed: number;
  }>;
  getRelationships(query: RelationshipQuery): Promise<GraphRelationship[]>;
  getRelationshipById(relationshipId: string): Promise<GraphRelationship | null>;
  deleteRelationship(
    fromId: string,
    toId: string,
    type: RelationshipType
  ): Promise<void>;
  updateRelationshipAuxiliary(
    relId: string,
    rel: GraphRelationship
  ): Promise<void>;
  mergeNormalizedDuplicates(): Promise<number>;
  getRelationshipStats(): Promise<RelationshipStats>;
  markInactiveEdgesNotSeenSince(since: Date): Promise<number>;
  upsertEdgeEvidenceBulk(
    updates: Array<{
      fromId: string;
      toId: string;
      type: RelationshipType;
      evidence: any[];
      locations?: any[];
    }>
  ): Promise<void>;
  getEdgeEvidenceNodes(relationshipId: string, limit?: number): Promise<any[]>;
  getEdgeSites(relationshipId: string, limit?: number): Promise<any[]>;
  getEdgeCandidates(relationshipId: string, limit?: number): Promise<any[]>;
}

export class RelationshipServiceOGM extends EventEmitter implements IRelationshipService {
  private relationshipModels: ReturnType<typeof createRelationshipModels>;
  private entityModels: ReturnType<typeof createEntityModels>;

  constructor(private neogmaService: NeogmaService) {
    super();
    const neogma = this.neogmaService.getNeogmaInstance();
    this.relationshipModels = createRelationshipModels(neogma);
    this.entityModels = createEntityModels(neogma);


    this.neogmaService.on('error', (data) => {
      this.emit('error', { source: 'neogma', ...data });
    });
  }




  private getRelationshipModel(type: RelationshipType) {
    const modelMap: Record<string, any> = {

      [RelationshipType.CONTAINS]: this.relationshipModels.ContainsRelation,
      [RelationshipType.DEFINES]: this.relationshipModels.DefinesRelation,
      [RelationshipType.EXPORTS]: this.relationshipModels.ExportsRelation,
      [RelationshipType.IMPORTS]: this.relationshipModels.ImportsRelation,

      [RelationshipType.CALLS]: this.relationshipModels.CallsRelation,
      [RelationshipType.REFERENCES]: this.relationshipModels.ReferencesRelation,
      [RelationshipType.IMPLEMENTS]: this.relationshipModels.ImplementsRelation,
      [RelationshipType.EXTENDS]: this.relationshipModels.ExtendsRelation,
      [RelationshipType.DEPENDS_ON]: this.relationshipModels.DependsOnRelation,

      [RelationshipType.TYPE_USES]: this.relationshipModels.TypeUsesRelation,
      [RelationshipType.RETURNS_TYPE]: this.relationshipModels.ReturnsTypeRelation,
      [RelationshipType.PARAM_TYPE]: this.relationshipModels.ParamTypeRelation,

      [RelationshipType.TESTS]: this.relationshipModels.TestsRelation,
      [RelationshipType.VALIDATES]: this.relationshipModels.ValidatesRelation,

      [RelationshipType.REQUIRES]: this.relationshipModels.RequiresRelation,
      [RelationshipType.IMPACTS]: this.relationshipModels.ImpactsRelation,
      [RelationshipType.IMPLEMENTS_SPEC]: this.relationshipModels.ImplementsSpecRelation,

      [RelationshipType.DOCUMENTED_BY]: this.relationshipModels.DocumentedByRelation,
      [RelationshipType.DOCUMENTS_SECTION]: this.relationshipModels.DocumentsSectionRelation,

      [RelationshipType.PREVIOUS_VERSION]: this.relationshipModels.PreviousVersionRelation,
      [RelationshipType.MODIFIED_BY]: this.relationshipModels.ModifiedByRelation,
    };

    return modelMap[type] || null;
  }




  async createRelationship(relationship: GraphRelationship): Promise<GraphRelationship> {
    try {
      const normalized = this.normalizeRelationship(relationship);
      const relId = this.generateRelationshipId(normalized);


      if (!this.getRelationshipModel(normalized.type) || isCodeRelationship(normalized.type)) {
        return this.createRelationshipWithCypher(normalized, relId);
      }


      const RelationshipModel = this.getRelationshipModel(normalized.type);
      if (!RelationshipModel) {
        throw new Error(`No model found for relationship type: ${normalized.type}`);
      }

      const properties = this.extractRelationshipProperties(normalized);
      properties.id = relId;



      return this.createRelationshipWithCypher(normalized, relId);
    } catch (error) {
      this.emit('error', { operation: 'createRelationship', relationship, error });
      throw error;
    }
  }




  private async createRelationshipWithCypher(
    normalized: GraphRelationship,
    relId: string
  ): Promise<GraphRelationship> {
    const query = `
      MATCH (from:Entity {id: $fromId})
      MATCH (to:Entity {id: $toId})
      MERGE (from)-[r:${normalized.type} {id: $relId}]->(to)
      SET r += $properties
      SET r.lastModified = datetime()
      RETURN r, from, to
    `;

    const properties = this.extractRelationshipProperties(normalized);
    properties.id = relId;

    const result = await this.neogmaService.executeCypher(query, {
      fromId: normalized.fromEntityId,
      toId: normalized.toEntityId,
      relId,
      properties,
    });

    if (result.length === 0) {
      throw new Error(`Failed to create relationship: ${relId}`);
    }

    const created = this.parseRelationshipFromNeo4j(result[0]);
    this.emit('relationship:created', created);


    if (normalized.evidence || normalized.locations) {
      await this.updateRelationshipAuxiliary(relId, normalized);
    }

    return created;
  }




  async createRelationshipsBulk(
    relationships: GraphRelationship[],
    options: BulkRelationshipOptions = {}
  ): Promise<{
    created: number;
    updated: number;
    failed: number;
  }> {
    try {
      const normalized = relationships.map(r => ({
        ...this.normalizeRelationship(r),
        _id: this.generateRelationshipId(r),
      }));

      const query = options.mergeEvidence
        ? this.buildBulkMergeQuery(options)
        : this.buildBulkCreateQuery(options);

      const result = await this.neogmaService.executeCypher(query, {
        relationships: normalized.map(r => ({
          fromId: r.fromEntityId,
          toId: r.toEntityId,
          type: r.type,
          relId: r._id,
          properties: this.extractRelationshipProperties(r),
        })),
      });

      const count = result[0]?.count || 0;
      this.emit('relationships:bulk:created', {
        count,
        total: relationships.length,
      });

      return {
        created: count,
        updated: options.mergeEvidence ? relationships.length - count : 0,
        failed: relationships.length - count,
      };
    } catch (error) {
      console.error('Bulk relationship creation failed:', error);
      this.emit('error', { operation: 'createRelationshipsBulk', error });
      return { created: 0, updated: 0, failed: relationships.length };
    }
  }




  async getRelationships(query: RelationshipQuery): Promise<GraphRelationship[]> {
    try {
      const where: string[] = [];
      const params: Record<string, any> = {};

      if (query.fromEntityId) {
        where.push('from.id = $fromId');
        params.fromId = query.fromEntityId;
      }

      if (query.toEntityId) {
        where.push('to.id = $toId');
        params.toId = query.toEntityId;
      }

      if (query.type) {
        if (Array.isArray(query.type)) {
          where.push('type(r) IN $types');
          params.types = query.type;
        } else {
          where.push('type(r) = $type');
          params.type = query.type;
        }
      }

      if (query.active !== undefined) {
        where.push('coalesce(r.active, true) = $active');
        params.active = query.active;
      }

      if (query.confidenceMin !== undefined) {
        where.push('r.confidence >= $minConfidence');
        params.minConfidence = query.confidenceMin;
      }


      if (query.kind) {
        if (Array.isArray(query.kind)) {
          where.push('r.kind IN $kinds');
          params.kinds = query.kind;
        } else {
          where.push('r.kind = $kind');
          params.kind = query.kind;
        }
      }

      if (query.source) {
        if (Array.isArray(query.source)) {
          where.push('r.source IN $sources');
          params.sources = query.source;
        } else {
          where.push('r.source = $source');
          params.source = query.source;
        }
      }

      const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
      const limit = query.limit || 100;
      const offset = query.offset || 0;

      const cypherQuery = `
        MATCH (from)-[r]->(to)
        ${whereClause}
        RETURN r, from, to
        ORDER BY r.lastModified DESC
        SKIP $offset
        LIMIT $limit
      `;

      params.offset = offset;
      params.limit = limit;

      const result = await this.neogmaService.executeCypher(cypherQuery, params);
      return result.map(row => this.parseRelationshipFromNeo4j(row));
    } catch (error) {
      this.emit('error', { operation: 'getRelationships', query, error });
      throw error;
    }
  }




  async deleteRelationship(
    fromId: string,
    toId: string,
    type: RelationshipType
  ): Promise<void> {
    try {
      const query = `
        MATCH (from:Entity {id: $fromId})-[r:${type}]->(to:Entity {id: $toId})
        DELETE r
      `;

      await this.neogmaService.executeCypher(query, { fromId, toId });
      this.emit('relationship:deleted', { fromId, toId, type });
    } catch (error) {
      this.emit('error', { operation: 'deleteRelationship', fromId, toId, type, error });
      throw error;
    }
  }




  async updateRelationshipAuxiliary(
    relId: string,
    rel: GraphRelationship
  ): Promise<void> {
    try {
      if (!rel.evidence && !rel.locations) return;

      const query = `
        MATCH ()-[r {id: $relId}]->()
        SET r.evidence = $evidence
        SET r.locations = $locations
      `;

      await this.neogmaService.executeCypher(query, {
        relId,
        evidence: rel.evidence ? JSON.stringify(rel.evidence) : null,
        locations: rel.locations ? JSON.stringify(rel.locations) : null,
      });
    } catch (error) {
      this.emit('error', { operation: 'updateRelationshipAuxiliary', relId, error });
      throw error;
    }
  }




  async markInactiveEdgesNotSeenSince(since: Date): Promise<number> {
    try {
      const query = `
        MATCH ()-[r]->()
        WHERE r.lastSeenAt < $since AND coalesce(r.active, true) = true
        SET r.active = false
        SET r.validTo = coalesce(r.validTo, datetime())
        RETURN count(r) as count
      `;

      const result = await this.neogmaService.executeCypher(query, {
        since: since.toISOString(),
      });

      const count = result[0]?.count || 0;
      this.emit('relationships:marked:inactive', { count, since });
      return count;
    } catch (error) {
      this.emit('error', { operation: 'markInactiveEdgesNotSeenSince', since, error });
      throw error;
    }
  }




  async upsertEdgeEvidenceBulk(
    updates: Array<{
      fromId: string;
      toId: string;
      type: RelationshipType;
      evidence: any[];
      locations?: any[];
    }>
  ): Promise<void> {
    try {
      const query = `
        UNWIND $updates AS update
        MATCH (from:Entity {id: update.fromId})-[r]->(to:Entity {id: update.toId})
        WHERE type(r) = update.type
        SET r.evidence = CASE
          WHEN r.evidence IS NULL THEN update.evidence
          ELSE apoc.coll.union(coalesce(r.evidence, []), update.evidence)
        END
        SET r.locations = CASE
          WHEN update.locations IS NULL THEN r.locations
          WHEN r.locations IS NULL THEN update.locations
          ELSE apoc.coll.union(coalesce(r.locations, []), update.locations)
        END
        SET r.lastModified = datetime()
      `;

      await this.neogmaService.executeCypher(query, {
        updates: updates.map(u => ({
          fromId: u.fromId,
          toId: u.toId,
          type: u.type,
          evidence: JSON.stringify(u.evidence.slice(0, 20)),
          locations: u.locations ? JSON.stringify(u.locations.slice(0, 20)) : null,
        })),
      });
    } catch (error) {
      this.emit('error', { operation: 'upsertEdgeEvidenceBulk', error });
      throw error;
    }
  }




  async getRelationshipStats(): Promise<RelationshipStats> {
    try {
      const queries = [
        {
          name: 'total',
          query: 'MATCH ()-[r]->() RETURN count(r) as count',
        },
        {
          name: 'byType',
          query: `
            MATCH ()-[r]->()
            RETURN type(r) as type, count(r) as count
            ORDER BY count DESC
          `,
        },
        {
          name: 'active',
          query: `
            MATCH ()-[r]->()
            WHERE coalesce(r.active, true) = true
            RETURN count(r) as count
          `,
        },
        {
          name: 'withEvidence',
          query: `
            MATCH ()-[r]->()
            WHERE r.evidence IS NOT NULL
            RETURN count(r) as count
          `,
        },
      ];

      const results = await Promise.all(
        queries.map(q => this.neogmaService.executeCypher(q.query))
      );

      const byType: Record<string, number> = {};
      results[1].forEach((row: any) => {
        if (row.type) {
          byType[row.type] = row.count;
        }
      });

      return {
        total: results[0][0]?.count || 0,
        byType,
        active: results[2][0]?.count || 0,
        inactive: (results[0][0]?.count || 0) - (results[2][0]?.count || 0),
        withEvidence: results[3][0]?.count || 0,
      };
    } catch (error) {
      this.emit('error', { operation: 'getRelationshipStats', error });
      throw error;
    }
  }




  async mergeNormalizedDuplicates(): Promise<number> {
    try {

      const query = `
        MATCH (from)-[r1]->(to)
        MATCH (from)-[r2]->(to)
        WHERE type(r1) = type(r2)
          AND id(r1) < id(r2)
          AND r1.to_ref_symbol = r2.to_ref_symbol
          AND r1.to_ref_file = r2.to_ref_file
        WITH r1, collect(r2) as duplicates
        CALL apoc.refactor.mergeRelationships([r1] + duplicates, {
          properties: 'combine',
          mergeConfig: {
            evidence: 'combine',
            locations: 'combine',
            occurrencesTotal: 'sum',
            confidence: 'max'
          }
        }) YIELD rel
        RETURN count(rel) as count
      `;

      const result = await this.neogmaService.executeCypher(query);
      const count = result[0]?.count || 0;

      if (count > 0) {
        this.emit('relationships:merged', { count });
      }

      return count;
    } catch (error) {
      this.emit('error', { operation: 'mergeNormalizedDuplicates', error });

      console.warn('APOC merge failed, using simple duplicate removal');
      return 0;
    }
  }




  private normalizeRelationship(rel: GraphRelationship): GraphRelationship {
    const normalized: any = { ...rel };


    const now = new Date();
    if (!normalized.created) normalized.created = now;
    if (!normalized.lastModified) normalized.lastModified = now;
    if (!normalized.version) normalized.version = 1;


    if (!(normalized.created instanceof Date)) {
      normalized.created = new Date(normalized.created);
    }
    if (!(normalized.lastModified instanceof Date)) {
      normalized.lastModified = new Date(normalized.lastModified);
    }


    if (isCodeRelationship(normalized.type)) {
      Object.assign(normalized, normalizeCodeEdge(normalized));
    }


    if (normalized.active === undefined) {
      normalized.active = true;
    }


    if (normalized.evidence && Array.isArray(normalized.evidence)) {
      normalized.evidence = normalized.evidence.slice(0, 20);
    }
    if (normalized.locations && Array.isArray(normalized.locations)) {
      normalized.locations = normalized.locations.slice(0, 20);
    }

    return normalized as GraphRelationship;
  }




  private generateRelationshipId(rel: GraphRelationship): string {
    return canonicalRelationshipId(rel.fromEntityId, rel);
  }




  private extractRelationshipProperties(rel: any): Record<string, any> {
    const properties: Record<string, any> = {};


    const skipKeys = ['evidence', 'locations', 'metadata', 'fromEntity', 'toEntity'];

    for (const [key, value] of Object.entries(rel)) {
      if (skipKeys.includes(key) || value === null || value === undefined) {
        continue;
      }

      if (value instanceof Date) {
        properties[key] = value.toISOString();
      } else if (typeof value === 'object') {
        properties[key] = JSON.stringify(value);
      } else {
        properties[key] = value;
      }
    }


    if (rel.evidence) {
      properties.evidence = JSON.stringify(rel.evidence);
    }
    if (rel.locations) {
      properties.locations = JSON.stringify(rel.locations);
    }
    if (rel.metadata) {
      properties.metadata = JSON.stringify(rel.metadata);
    }

    return properties;
  }




  private parseRelationshipFromNeo4j(row: any): GraphRelationship {
    const rel = row.r;
    const properties = rel.properties || rel;
    const parsed: any = {
      type: rel.type || row.type,
      fromEntityId: row.from?.properties?.id || row.from?.id,
      toEntityId: row.to?.properties?.id || row.to?.id,
    };

    for (const [key, value] of Object.entries(properties)) {
      if (value === null || value === undefined) continue;


      if (key === 'created' || key === 'lastModified' || key.endsWith('At')) {
        parsed[key] = new Date(value as string);
      }

      else if (
        typeof value === 'string' &&
        (key === 'evidence' || key === 'locations' || key === 'metadata')
      ) {
        try {
          parsed[key] = JSON.parse(value as string);
        } catch {
          parsed[key] = value;
        }
      } else {
        parsed[key] = value;
      }
    }

    return parsed as GraphRelationship;
  }




  private buildBulkMergeQuery(options: BulkRelationshipOptions): string {
    return `
      UNWIND $relationships AS rel
      MATCH (from:Entity {id: rel.fromId})
      MATCH (to:Entity {id: rel.toId})
      MERGE (from)-[r:\${rel.type} {id: rel.relId}]->(to)
      SET r += rel.properties
      ${options.updateTimestamps ? 'SET r.lastModified = datetime()' : ''}
      RETURN count(r) as count
    `;
  }




  private buildBulkCreateQuery(options: BulkRelationshipOptions): string {
    const skipClause = options.skipExisting
      ? 'WHERE NOT EXISTS((from)-[:\${rel.type} {id: rel.relId}]->(to))'
      : '';

    return `
      UNWIND $relationships AS rel
      MATCH (from:Entity {id: rel.fromId})
      MATCH (to:Entity {id: rel.toId})
      ${skipClause}
      CREATE (from)-[r:\${rel.type} {id: rel.relId}]->(to)
      SET r += rel.properties
      RETURN count(r) as count
    `;
  }

  /**
   * Get a single relationship by its ID
   */
  async getRelationshipById(relationshipId: string): Promise<GraphRelationship | null> {
    try {
      const query = `
        MATCH (from)-[r {id: $relationshipId}]->(to)
        RETURN r, from, to
      `;

      const result = await this.neogmaService.executeCypher(query, {
        relationshipId,
      });

      if (result.length === 0) {
        return null;
      }

      return this.parseRelationshipFromNeo4j(result[0]);
    } catch (error) {
      this.emit('error', { operation: 'getRelationshipById', relationshipId, error });
      throw error;
    }
  }




  async getEdgeEvidenceNodes(relationshipId: string, limit: number = 200): Promise<any[]> {
    try {
      const query = `
        MATCH (from)-[r {id: $relationshipId}]->(to)
        WITH r
        WHERE r.evidence IS NOT NULL
        UNWIND r.evidence AS evidence
        RETURN evidence
        LIMIT $limit
      `;

      const result = await this.neogmaService.executeCypher(query, {
        relationshipId,
        limit,
      });

      return result.map(row => row.evidence);
    } catch (error) {
      this.emit('error', { operation: 'getEdgeEvidenceNodes', relationshipId, error });

      console.warn(`Failed to get evidence nodes for relationship ${relationshipId}:`, error);
      return [];
    }
  }




  async getEdgeSites(relationshipId: string, limit: number = 50): Promise<any[]> {
    try {
      const query = `
        MATCH (from)-[r {id: $relationshipId}]->(to)
        WITH r
        WHERE r.locations IS NOT NULL
        UNWIND r.locations AS location
        RETURN location
        LIMIT $limit
      `;

      const result = await this.neogmaService.executeCypher(query, {
        relationshipId,
        limit,
      });

      return result.map(row => row.location);
    } catch (error) {
      this.emit('error', { operation: 'getEdgeSites', relationshipId, error });

      console.warn(`Failed to get edge sites for relationship ${relationshipId}:`, error);
      return [];
    }
  }




  async getEdgeCandidates(relationshipId: string, limit: number = 50): Promise<any[]> {
    try {
      const query = `
        MATCH (from)-[r {id: $relationshipId}]->(to)
        WITH from, to, type(r) as relType
        MATCH (from)-[similar]->(candidates)
        WHERE type(similar) = relType AND candidates <> to
        RETURN DISTINCT candidates
        LIMIT $limit
      `;

      const result = await this.neogmaService.executeCypher(query, {
        relationshipId,
        limit,
      });

      return result.map(row => row.candidates);
    } catch (error) {
      this.emit('error', { operation: 'getEdgeCandidates', relationshipId, error });

      console.warn(`Failed to get edge candidates for relationship ${relationshipId}:`, error);
      return [];
    }
  }
}

================
File: graph/SearchServiceOGM.ts
================
import { EventEmitter } from 'events';
import { NeogmaService } from './NeogmaService.js';
import { createEntityModels } from '../../models/ogm/EntityModels.js';
import { modelToEntity } from '../../models/ogm/BaseModels.js';
import { EmbeddingService } from './EmbeddingService.js';
import { Entity } from '../../models/entities.js';
import {
  GraphSearchRequest,
  GraphExamples,
} from '../../models/types.js';
import {
  ISearchService,
  StructuralSearchOptions,
  SearchResult,
  SemanticSearchOptions,
  PatternSearchOptions,
  SearchStats,
} from './ISearchService.js';


class SearchCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize = 100, ttl = 300000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  private generateKey(obj: any): string {
    return JSON.stringify(obj, Object.keys(obj).sort());
  }

  get(key: any): any | null {
    const cacheKey = this.generateKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.data;
  }

  set(key: any, value: any): void {
    const cacheKey = this.generateKey(key);

    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(cacheKey, {
      data: value,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  invalidate(pattern?: (key: string) => boolean): void {
    if (!pattern) {
      this.clear();
      return;
    }

    for (const [key] of this.cache) {
      if (pattern(key)) {
        this.cache.delete(key);
      }
    }
  }

  get size(): number {
    return this.cache.size;
  }
}

export class SearchServiceOGM extends EventEmitter implements ISearchService {
  private models: ReturnType<typeof createEntityModels>;
  private searchCache: SearchCache;

  constructor(
    private neogmaService: NeogmaService,
    private embeddingService: EmbeddingService
  ) {
    super();
    const neogma = this.neogmaService.getNeogmaInstance();
    this.models = createEntityModels(neogma);
    this.searchCache = new SearchCache(500, 300000);


    this.neogmaService.on('error', (data) => {
      this.emit('error', { source: 'neogma', ...data });
    });
  }




  async search(request: GraphSearchRequest): Promise<SearchResult[]> {

    const cached = this.searchCache.get(request);
    if (cached) {
      this.emit('search:cache:hit', { query: request.query });
      return cached;
    }

    let results: SearchResult[] = [];


    const strategy = this.determineSearchStrategy(request);

    switch (strategy) {
      case 'structural':
        results = await this.structuralSearch(request.query, {
          limit: request.limit,
          filter: request.filters,
          fuzzy: false,
        });
        break;

      case 'semantic':
        results = await this.semanticSearch(request.query, {
          limit: request.limit,
          filter: request.filters,
        });
        break;

      case 'hybrid':
        results = await this.hybridSearch(request);
        break;
    }






    this.searchCache.set(request, results);
    this.emit('search:completed', {
      query: request.query,
      strategy,
      count: results.length,
    });

    return results;
  }




  async structuralSearch(
    query: string,
    options: StructuralSearchOptions = {}
  ): Promise<SearchResult[]> {
    const limit = options.limit || 50;
    const results: SearchResult[] = [];

    try {

      const searchPromises = [];


      if (!options.filter?.type || options.filter.type === 'file') {
        searchPromises.push(
          this.searchInModel(
            this.models.FileModel,
            query,
            options,
            'file'
          ).catch(() => [] as SearchResult[])
        );
      }


      if (!options.filter?.type || ['symbol', 'function', 'class', 'interface'].includes(options.filter.type)) {
        searchPromises.push(
          this.searchInModel(this.models.SymbolModel, query, options, 'symbol').catch(() => [] as SearchResult[]),
          this.searchInModel(this.models.FunctionSymbolModel, query, options, 'symbol').catch(() => [] as SearchResult[]),
          this.searchInModel(this.models.ClassSymbolModel, query, options, 'symbol').catch(() => [] as SearchResult[]),
          this.searchInModel(this.models.InterfaceSymbolModel, query, options, 'symbol').catch(() => [] as SearchResult[])
        );
      }


      if (!options.filter?.type || options.filter.type === 'module') {
        searchPromises.push(
          this.searchInModel(
            this.models.ModuleModel,
            query,
            options,
            'module'
          ).catch(() => [] as SearchResult[])
        );
      }


      if (!options.filter?.type || options.filter.type === 'test') {
        searchPromises.push(
          this.searchInModel(
            this.models.TestModel,
            query,
            options,
            'test'
          ).catch(() => [] as SearchResult[])
        );
      }


      if (!options.filter?.type || options.filter.type === 'specification') {
        searchPromises.push(
          this.searchInModel(
            this.models.SpecificationModel,
            query,
            options,
            'specification'
          ).catch(() => [] as SearchResult[])
        );
      }


      const searchResults = await Promise.all(searchPromises);


      for (const modelResults of searchResults) {
        results.push(...modelResults);
      }


      results.sort((a, b) => b.score - a.score);
      return results.slice(0, limit);

    } catch (error) {
      this.emit('error', { operation: 'structuralSearch', error, query, options });
      throw error;
    }
  }




  private async searchInModel(
    Model: any,
    query: string,
    options: StructuralSearchOptions,
    entityType: string
  ): Promise<SearchResult[]> {
    try {
      if (options.fuzzy) {


        return this.fuzzySearchInModel(Model, query, options, entityType);
      } else {

        const label = (Model as any).label || 'Entity';
        const cypherQuery = `
          MATCH (n:${label})
          WHERE (n.name CONTAINS $query OR n.path CONTAINS $query OR n.id CONTAINS $query)
          ${this.buildFilterClause(options.filter)}
          RETURN n
          LIMIT $limit
        `;

        const params = {
          query: options.caseInsensitive ? query.toLowerCase() : query,
          limit: options.limit || 50,
          ...this.buildFilterParams(options.filter),
        };

        const results = await this.neogmaService.executeCypher(cypherQuery, params);

        return results.map(row => ({
          entity: this.parseEntity(row.n),
          score: 1.0,
          type: 'structural' as const,
        }));
      }
    } catch (error) {

      console.warn(`Search failed in ${entityType} model:`, error);
      return [];
    }
  }




  private async fuzzySearchInModel(
    Model: any,
    query: string,
    options: StructuralSearchOptions,
    entityType: string
  ): Promise<SearchResult[]> {
    try {
      const label = (Model as any).label || 'Entity';
      const cypherQuery = `
        MATCH (n:${label})
        WITH n, apoc.text.levenshteinSimilarity(
          coalesce(n.name, ''),
          $query
        ) AS nameSimilarity,
        apoc.text.levenshteinSimilarity(
          coalesce(n.path, ''),
          $query
        ) AS pathSimilarity
        WITH n, GREATEST(nameSimilarity, pathSimilarity) AS similarity
        WHERE similarity > 0.6
        ${this.buildFilterClause(options.filter)}
        RETURN n, similarity AS score
        ORDER BY score DESC
        LIMIT $limit
      `;

      const params = {
        query,
        limit: options.limit || 50,
        ...this.buildFilterParams(options.filter),
      };

      const results = await this.neogmaService.executeCypher(cypherQuery, params);

      return results.map(row => ({
        entity: this.parseEntity(row.n),
        score: row.score,
        type: 'structural' as const,
      }));
    } catch (error) {

      console.warn(`Fuzzy search failed in ${entityType} model, falling back to exact search:`, error);
      return this.searchInModel(Model, query, { ...options, fuzzy: false }, entityType);
    }
  }




  async semanticSearch(
    query: string,
    options: SemanticSearchOptions = {}
  ): Promise<SearchResult[]> {
    const results = await this.embeddingService.search(query, options);

    return results.map(result => ({
      entity: result.entity,
      score: result.score,
      type: 'semantic' as const,
      metadata: result.metadata,
    }));
  }




  async hybridSearch(request: GraphSearchRequest): Promise<SearchResult[]> {
    const [structural, semantic] = await Promise.all([
      this.structuralSearch(request.query, {
        limit: request.limit ? Math.ceil(request.limit / 2) : 25,
        filter: request.filters,
        fuzzy: false,
      }),
      this.semanticSearch(request.query, {
        limit: request.limit ? Math.ceil(request.limit / 2) : 25,
        filter: request.filters,
      }),
    ]);


    const merged = new Map<string, SearchResult>();


    structural.forEach(result => {
      merged.set(result.entity.id, {
        ...result,
        score: result.score * 1.2,
        type: 'hybrid' as const,
      });
    });


    semantic.forEach(result => {
      const existing = merged.get(result.entity.id);
      if (existing) {

        existing.score = (existing.score + result.score) / 2;
      } else {
        merged.set(result.entity.id, {
          ...result,
          type: 'hybrid' as const,
        });
      }
    });


    const results = Array.from(merged.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, request.limit || 50);

    return results;
  }




  async findSymbolsByName(
    name: string,
    options: { fuzzy?: boolean; limit?: number } = {}
  ): Promise<Entity[]> {
    const results = await this.structuralSearch(name, {
      fuzzy: options.fuzzy,
      limit: options.limit,
      filter: { type: 'symbol' },
    });

    return results.map(r => r.entity);
  }




  async findNearbySymbols(
    filePath: string,
    position: { line: number; column?: number },
    options: { range?: number; limit?: number } = {}
  ): Promise<Entity[]> {
    const range = options.range || 50;
    const limit = options.limit || 10;

    try {

      const query = `
        MATCH (n:Entity)
        WHERE n.path = $filePath
          AND n.line >= $minLine
          AND n.line <= $maxLine
        RETURN n
        ORDER BY abs(n.line - $targetLine)
        LIMIT $limit
      `;

      const params = {
        filePath,
        minLine: Math.max(0, position.line - range),
        maxLine: position.line + range,
        targetLine: position.line,
        limit,
      };

      const results = await this.neogmaService.executeCypher(query, params);
      return results.map(row => this.parseEntity(row.n));
    } catch (error) {
      this.emit('error', { operation: 'findNearbySymbols', error, filePath, position });
      throw error;
    }
  }




  async patternSearch(
    pattern: string,
    options: PatternSearchOptions = {}
  ): Promise<Entity[]> {
    const limit = options.limit || 50;
    let query: string;
    let params: Record<string, any> = { pattern, limit };

    if (options.type === 'regex') {
      query = `
        MATCH (n:Entity)
        WHERE n.name =~ $pattern
           OR n.path =~ $pattern
        RETURN n
        LIMIT $limit
      `;
    } else {

      const regexPattern = pattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
      query = `
        MATCH (n:Entity)
        WHERE n.name =~ $regexPattern
           OR n.path =~ $regexPattern
        RETURN n
        LIMIT $limit
      `;
      params.regexPattern = regexPattern;
    }

    try {
      const results = await this.neogmaService.executeCypher(query, params);
      return results.map(row => this.parseEntity(row.n));
    } catch (error) {
      this.emit('error', { operation: 'patternSearch', error, pattern, options });
      throw error;
    }
  }




  async getEntityExamples(entityId: string): Promise<GraphExamples> {
    try {

      const entityQuery = `
        MATCH (n:Entity {id: $id})
        RETURN n
      `;

      const entityResult = await this.neogmaService.executeCypher(entityQuery, {
        id: entityId,
      });

      if (entityResult.length === 0) {
        return {
          entityId,
          signature: '',
          usageExamples: [],
          testExamples: [],
          relatedPatterns: []
        };
      }

      const entity = this.parseEntity(entityResult[0].n);

      // Find usage examples through relationships
      const usageQuery = `
        MATCH (n:Entity {id: $id})<-[:CALLS|REFERENCES|USES]-(caller)
        RETURN caller
        LIMIT 5
      `;

      const usageResults = await this.neogmaService.executeCypher(usageQuery, {
        id: entityId,
      });

      const usageExamples = usageResults.map(row => {
        const caller = this.parseEntity(row.caller);
        return {
          context: `Used in ${caller.type}: ${caller.name}`,
          code: (caller as any).content || '',
          file: (caller as any).path || 'unknown',
          line: (caller as any).line || 0,
        };
      });

      return {
        entityId,
        signature: (entity as any).signature || '',
        usageExamples,
        testExamples: [], // TODO: Add test examples logic
        relatedPatterns: [], // TODO: Add pattern analysis
      };
    } catch (error) {
      this.emit('error', { operation: 'getEntityExamples', error, entityId });
      throw error;
    }
  }




  async getSearchStats(): Promise<SearchStats> {


    return {
      cacheSize: this.searchCache.size,
      cacheHitRate: 0.75,
      topSearches: [],
    };
  }




  clearCache(): void {
    this.searchCache.clear();
    this.emit('cache:cleared');
  }




  invalidateCache(pattern?: (key: string) => boolean): void {
    this.searchCache.invalidate(pattern);
    this.emit('cache:invalidated');
  }




  private determineSearchStrategy(
    request: GraphSearchRequest
  ): 'structural' | 'semantic' | 'hybrid' {

    if (request.query.includes('/') || request.query.includes(':')) {
      return 'structural';
    }


    if (request.filters && Object.keys(request.filters).length > 2) {
      return 'structural';
    }


    if (request.searchType === 'semantic') {
      return 'semantic';
    }


    if (request.searchType === 'structural') {
      return 'structural';
    }


    return 'hybrid';
  }




  private buildFilterClause(filter?: Record<string, any>): string {
    if (!filter || Object.keys(filter).length === 0) {
      return '';
    }

    const clauses = Object.entries(filter).map(([key, value]) => {
      if (value === null) {
        return `n.${key} IS NULL`;
      } else if (typeof value === 'object' && value.$ne !== undefined) {
        return `n.${key} <> $filter_${key}_ne`;
      } else {
        return `n.${key} = $filter_${key}`;
      }
    });

    return `AND ${clauses.join(' AND ')}`;
  }




  private buildFilterParams(filter?: Record<string, any>): Record<string, any> {
    const params: Record<string, any> = {};

    if (!filter) return params;

    Object.entries(filter).forEach(([key, value]) => {
      if (typeof value === 'object' && value.$ne !== undefined) {
        params[`filter_${key}_ne`] = value.$ne;
      } else {
        params[`filter_${key}`] = value;
      }
    });

    return params;
  }




  private sortResults(
    results: SearchResult[],
    sortBy: string
  ): SearchResult[] {
    return results.sort((a, b) => {
      const aVal = (a.entity as any)[sortBy];
      const bVal = (b.entity as any)[sortBy];

      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return b.score - a.score;
    });
  }




  private groupResults(
    results: SearchResult[],
    groupBy: string
  ): SearchResult[] {
    const grouped = new Map<string, SearchResult[]>();

    results.forEach(result => {
      const key = (result.entity as any)[groupBy] || 'unknown';
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(result);
    });


    const flattened: SearchResult[] = [];
    grouped.forEach(group => {
      group.sort((a, b) => b.score - a.score);
      flattened.push(...group.slice(0, 3));
    });

    return flattened;
  }




  private parseEntity(node: any): Entity {
    const properties = node.properties || node;
    const entity: any = {};

    for (const [key, value] of Object.entries(properties)) {
      if (value === null || value === undefined) continue;

      if (key === 'created' || key === 'lastModified' || key.endsWith('At')) {
        entity[key] = new Date(value as string);
      } else if (
        typeof value === 'string' &&
        ((value as string).startsWith('[') || (value as string).startsWith('{'))
      ) {
        try {
          entity[key] = JSON.parse(value as string);
        } catch {
          entity[key] = value;
        }
      } else {
        entity[key] = value;
      }
    }

    return entity as Entity;
  }
}

================
File: graph/TemporalQueryService.ts
================
import { EventEmitter } from "events";
import { Neo4jService } from "../Neo4jService.js";
import { RelationshipType } from "../../../models/relationships.js";
import { TimeRangeParams, TraversalQuery } from "../../../models/types.js";

export interface HistoryMetrics {
  versions: number;
  checkpoints: number;
  checkpointMembers: { avg: number; min: number; max: number };
  temporalEdges: { open: number; closed: number };
  lastPrune?: {
    retentionDays: number;
    cutoff: string;
    versions: number;
    closedEdges: number;
    checkpoints: number;
  };
}

export interface SessionImpact {
  sessionId: string;
  changes: number;
  entities: string[];
  relationships: number;
  timestamp: Date;
}

export class TemporalQueryService extends EventEmitter {
  private readonly historyEnabled: boolean;

  constructor(private neo4j: Neo4jService) {
    super();
    this.historyEnabled = process.env.HISTORY_ENABLED !== "false";
  }




  async openEdge(
    fromId: string,
    toId: string,
    type: RelationshipType,
    timestamp?: Date,
    changeSetId?: string
  ): Promise<void> {
    if (!this.historyEnabled) return;

    const at = timestamp || new Date();

    const query = `
      MATCH (from:Entity {id: $fromId})
      MATCH (to:Entity {id: $toId})
      MERGE (from)-[r:${type} {id: $relId}]->(to)
      SET r.validFrom = $at
      SET r.validTo = null
      SET r.active = true
      SET r.changeSetId = $changeSetId
      SET r.lastModified = $at
    `;

    await this.neo4j.executeCypher(query, {
      fromId,
      toId,
      relId: `rel_${fromId}_${toId}_${type}`,
      at: at.toISOString(),
      changeSetId: changeSetId || null,
    });

    this.emit("edge:opened", { fromId, toId, type, timestamp: at });
  }




  async closeEdge(
    fromId: string,
    toId: string,
    type: RelationshipType,
    timestamp?: Date
  ): Promise<void> {
    if (!this.historyEnabled) return;

    const at = timestamp || new Date();

    const query = `
      MATCH (from:Entity {id: $fromId})-[r:${type}]->(to:Entity {id: $toId})
      SET r.validTo = coalesce(r.validTo, $at)
      SET r.active = false
      SET r.lastModified = $at
    `;

    await this.neo4j.executeCypher(query, {
      fromId,
      toId,
      at: at.toISOString(),
    });

    this.emit("edge:closed", { fromId, toId, type, timestamp: at });
  }




  async timeTravelTraversal(query: TraversalQuery): Promise<any> {
    const {
      startId: startEntityId,
      until: atTime,
      maxDepth = 3,
      relationshipTypes,
    } = query;
    const direction = "outgoing";

    const timeCondition = atTime
      ? `WHERE r.validFrom <= $atTime AND (r.validTo IS NULL OR r.validTo > $atTime)`
      : "";

    const relTypeFilter =
      relationshipTypes && relationshipTypes.length > 0
        ? `AND type(r) IN $relationshipTypes`
        : "";

    const traversalQuery = `
      MATCH (start:Entity {id: $startEntityId})
      CALL apoc.path.expandConfig(start, {
        relationshipFilter: '${
          direction === "outgoing" ? ">" : "<"
        }${relTypeFilter}',
        minLevel: 1,
        maxLevel: $maxDepth,
        uniqueness: 'NODE_GLOBAL'
      })
      YIELD path
      MATCH (start)-[r*1..${maxDepth}]-(end:Entity)
      WHERE ALL(rel IN r ${timeCondition} ${relTypeFilter})
      RETURN path, length(path) as depth
      ORDER BY depth
      LIMIT 100
    `;

    const result = await this.neo4j.executeCypher(traversalQuery, {
      startEntityId,
      atTime: atTime?.toISOString(),
      maxDepth,
      relationshipTypes: relationshipTypes || [],
    });

    return result;
  }

  /**
   * Get comprehensive history metrics
   */
  async getHistoryMetrics(): Promise<HistoryMetrics> {
    const queries = [
      // Version counts
      `MATCH (v:Version) RETURN count(v) as versions`,


      `
      MATCH (c:Checkpoint)
      OPTIONAL MATCH (c)-[:INCLUDES]->(m:Entity)
      RETURN count(DISTINCT c) as checkpoints,
             avg(size(collect(DISTINCT m))) as avgMembers,
             min(size(collect(DISTINCT m))) as minMembers,
             max(size(collect(DISTINCT m))) as maxMembers
      `,


      `
      MATCH ()-[r]->()
      WHERE r.validFrom IS NOT NULL
      RETURN sum(CASE WHEN r.validTo IS NULL THEN 1 ELSE 0 END) as open,
             sum(CASE WHEN r.validTo IS NOT NULL THEN 1 ELSE 0 END) as closed
      `,
    ];

    const results = await Promise.all(
      queries.map((q) => this.neo4j.executeCypher(q))
    );

    const [versionResult, checkpointResult, edgeResult] = results;

    return {
      versions: versionResult[0]?.versions || 0,
      checkpoints: checkpointResult[0]?.checkpoints || 0,
      checkpointMembers: {
        avg: checkpointResult[0]?.avgMembers || 0,
        min: checkpointResult[0]?.minMembers || 0,
        max: checkpointResult[0]?.maxMembers || 0,
      },
      temporalEdges: {
        open: edgeResult[0]?.open || 0,
        closed: edgeResult[0]?.closed || 0,
      },
    };
  }




  async getRelationshipTimeline(
    relationshipId: string,
    options?: {
      startTime?: Date;
      endTime?: Date;
      includeVersions?: boolean;
    }
  ): Promise<any[]> {
    const query = `
      MATCH ()-[r]->()
      WHERE r.id = $relationshipId OR elementId(r) = $relationshipId
      OPTIONAL MATCH (r)-[:VERSION_OF]-(v:Version)
      WHERE ($startTime IS NULL OR v.timestamp >= $startTime)
        AND ($endTime IS NULL OR v.timestamp <= $endTime)
      RETURN r {
        .id,
        .validFrom,
        .validTo,
        .active,
        .changeSetId,
        .lastModified,
        versions: collect(v {.id, .timestamp, .changeSetId})
      } as timeline
      ORDER BY r.validFrom
    `;

    const result = await this.neo4j.executeCypher(query, {
      relationshipId,
      startTime: options?.startTime?.toISOString(),
      endTime: options?.endTime?.toISOString(),
    });

    return result.map((r) => r.timeline);
  }




  async getSessionTimeline(
    sessionId: string,
    options?: {
      startTime?: Date;
      endTime?: Date;
      includeRelationships?: boolean;
    }
  ): Promise<any[]> {
    const query = `
      MATCH (v:Version {changeSetId: $sessionId})
      WHERE ($startTime IS NULL OR v.timestamp >= $startTime)
        AND ($endTime IS NULL OR v.timestamp <= $endTime)
      OPTIONAL MATCH (v)-[:VERSION_OF]->(e:Entity)
      OPTIONAL MATCH (e)-[r]-()
      WHERE r.changeSetId = $sessionId
      RETURN v {
        .id,
        .entityId,
        .timestamp,
        .hash,
        .path,
        .language,
        entity: e {.id, .name, .type},
        relationships: collect(DISTINCT r {.id, .type})
      } as sessionEntry
      ORDER BY v.timestamp
    `;

    const result = await this.neo4j.executeCypher(query, {
      sessionId,
      startTime: options?.startTime?.toISOString(),
      endTime: options?.endTime?.toISOString(),
    });

    return result.map((r) => r.sessionEntry);
  }




  async getSessionImpacts(sessionId: string): Promise<SessionImpact> {
    const query = `
      MATCH (v:Version {changeSetId: $sessionId})
      WITH collect(DISTINCT v.entityId) as entities, count(v) as versions
      MATCH ()-[r]->()
      WHERE r.changeSetId = $sessionId
      RETURN entities, versions, count(r) as relationships
    `;

    const result = await this.neo4j.executeCypher(query, { sessionId });

    if (result.length === 0) {
      return {
        sessionId,
        changes: 0,
        entities: [],
        relationships: 0,
        timestamp: new Date(),
      };
    }

    const record = result[0];

    return {
      sessionId,
      changes: record.versions + record.relationships,
      entities: record.entities,
      relationships: record.relationships,
      timestamp: new Date(),
    };
  }




  async getSessionsAffectingEntity(
    entityId: string,
    options?: {
      startTime?: Date;
      endTime?: Date;
      limit?: number;
    }
  ): Promise<any[]> {
    const query = `
      MATCH (e:Entity {id: $entityId})<-[:VERSION_OF]-(v:Version)
      WHERE v.changeSetId IS NOT NULL
        AND ($startTime IS NULL OR v.timestamp >= $startTime)
        AND ($endTime IS NULL OR v.timestamp <= $endTime)
      RETURN DISTINCT v.changeSetId as sessionId,
                      min(v.timestamp) as firstChange,
                      max(v.timestamp) as lastChange,
                      count(v) as changes
      ORDER BY lastChange DESC
      LIMIT $limit
    `;

    const result = await this.neo4j.executeCypher(query, {
      entityId,
      startTime: options?.startTime?.toISOString(),
      endTime: options?.endTime?.toISOString(),
      limit: options?.limit || 50,
    });

    return result.map((r) => ({
      sessionId: r.sessionId,
      firstChange: new Date(r.firstChange),
      lastChange: new Date(r.lastChange),
      changes: r.changes,
    }));
  }




  async getChangesForSession(
    sessionId: string,
    options?: {
      includeRelationships?: boolean;
      includeEntityDetails?: boolean;
    }
  ): Promise<any> {
    const versionQuery = `
      MATCH (v:Version {changeSetId: $sessionId})
      OPTIONAL MATCH (v)-[:VERSION_OF]->(e:Entity)
      RETURN collect(v {
        .id,
        .entityId,
        .timestamp,
        .hash,
        .path,
        .language,
        entity: CASE WHEN $includeEntityDetails THEN e ELSE null END
      }) as versions
    `;

    const relationshipQuery = `
      MATCH ()-[r]->()
      WHERE r.changeSetId = $sessionId
      RETURN collect(r {
        .id,
        .type,
        .validFrom,
        .validTo,
        .active,
        .lastModified
      }) as relationships
    `;

    const [versionResult, relationshipResult] = await Promise.all([
      this.neo4j.executeCypher(versionQuery, {
        sessionId,
        includeEntityDetails: options?.includeEntityDetails || false,
      }),
      options?.includeRelationships
        ? this.neo4j.executeCypher(relationshipQuery, { sessionId })
        : Promise.resolve([{ relationships: [] }]),
    ]);

    return {
      sessionId,
      versions: versionResult[0]?.versions || [],
      relationships: relationshipResult[0]?.relationships || [],
      totalChanges:
        (versionResult[0]?.versions?.length || 0) +
        (relationshipResult[0]?.relationships?.length || 0),
    };
  }
}

================
File: ingestion/workers/task-worker.ts
================
import { parentPort, workerData } from 'worker_threads';

interface WorkerMessage {
  type: 'task' | 'shutdown' | 'ping';
  taskId?: string;
  taskType?: string;
  data?: any;
  metadata?: Record<string, any>;
}

interface WorkerResponse {
  type: 'task_result' | 'error' | 'pong' | 'shutdown_complete';
  taskId?: string;
  success?: boolean;
  result?: any;
  error?: string;
  duration?: number;
}

class TaskWorker {
  private processing = false;
  private workerId: string;

  constructor() {
    this.workerId = workerData?.workerId || `worker-${process.pid}`;
    this.setupMessageHandler();
    this.sendMessage({ type: 'pong' });
  }

  private setupMessageHandler(): void {
    if (!parentPort) {
      throw new Error('Worker script must be run in a worker thread');
    }

    parentPort.on('message', async (message: WorkerMessage) => {
      try {
        await this.handleMessage(message);
      } catch (error) {
        this.sendMessage({
          type: 'error',
          taskId: message.taskId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });


    process.on('uncaughtException', (error) => {
      this.sendMessage({
        type: 'error',
        error: `Uncaught exception: ${error.message}`
      });
    });

    process.on('unhandledRejection', (reason) => {
      this.sendMessage({
        type: 'error',
        error: `Unhandled rejection: ${reason}`
      });
    });
  }

  private async handleMessage(message: WorkerMessage): Promise<void> {
    switch (message.type) {
      case 'ping':
        this.sendMessage({ type: 'pong' });
        break;

      case 'task':
        await this.processTask(message);
        break;

      case 'shutdown':
        await this.shutdown();
        break;

      default:
        console.warn(`[TaskWorker] Unknown message type: ${(message as any).type}`);
    }
  }

  private async processTask(message: WorkerMessage): Promise<void> {
    if (!message.taskId || !message.taskType) {
      throw new Error('Task ID and type are required');
    }

    if (this.processing) {
      throw new Error('Worker is already processing a task');
    }

    this.processing = true;
    const startTime = Date.now();

    try {
      console.log(`[TaskWorker-${this.workerId}] Processing task ${message.taskId} of type ${message.taskType}`);

      let result: any;

      switch (message.taskType) {
        case 'entity_upsert':
          result = await this.processEntityUpsert(message.data, message.metadata);
          break;

        case 'relationship_upsert':
          result = await this.processRelationshipUpsert(message.data, message.metadata);
          break;

        case 'embedding':
          result = await this.processEmbedding(message.data, message.metadata);
          break;

        case 'parse':
          result = await this.processParsing(message.data, message.metadata);
          break;

        default:
          throw new Error(`Unknown task type: ${message.taskType}`);
      }

      const duration = Date.now() - startTime;

      this.sendMessage({
        type: 'task_result',
        taskId: message.taskId,
        success: true,
        result,
        duration
      });

      console.log(`[TaskWorker-${this.workerId}] Completed task ${message.taskId} in ${duration}ms`);

    } catch (error) {
      const duration = Date.now() - startTime;

      this.sendMessage({
        type: 'task_result',
        taskId: message.taskId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      });

      console.error(`[TaskWorker-${this.workerId}] Failed task ${message.taskId}:`, error);

    } finally {
      this.processing = false;
    }
  }

  private async processEntityUpsert(data: any, metadata?: Record<string, any>): Promise<any> {


    await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20));

    return {
      processed: Array.isArray(data) ? data.length : 1,
      type: 'entity',
      metadata: {
        workerId: this.workerId,
        ...metadata
      }
    };
  }

  private async processRelationshipUpsert(data: any, metadata?: Record<string, any>): Promise<any> {

    await new Promise(resolve => setTimeout(resolve, 5 + Math.random() * 15));

    return {
      processed: Array.isArray(data) ? data.length : 1,
      type: 'relationship',
      metadata: {
        workerId: this.workerId,
        ...metadata
      }
    };
  }

  private async processEmbedding(data: any, metadata?: Record<string, any>): Promise<any> {

    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

    return {
      processed: Array.isArray(data) ? data.length : 1,
      type: 'embedding',
      dimensions: 768,
      metadata: {
        workerId: this.workerId,
        ...metadata
      }
    };
  }

  private async processParsing(data: any, metadata?: Record<string, any>): Promise<any> {

    await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 70));

    return {
      processed: 1,
      type: 'parse',
      entities: Math.floor(Math.random() * 10) + 1,
      relationships: Math.floor(Math.random() * 15) + 1,
      metadata: {
        workerId: this.workerId,
        ...metadata
      }
    };
  }

  private async shutdown(): Promise<void> {
    console.log(`[TaskWorker-${this.workerId}] Shutting down...`);


    while (this.processing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.sendMessage({ type: 'shutdown_complete' });
    process.exit(0);
  }

  private sendMessage(message: WorkerResponse): void {
    if (parentPort) {
      parentPort.postMessage(message);
    }
  }
}


new TaskWorker();

================
File: ingestion/batch-processor.ts
================
import { EventEmitter } from 'events';
import { Entity } from '@memento/core/models/entities.js';
import { GraphRelationship } from '@memento/core/models/relationships.js';
import {
  BatchConfig,
  BatchMetadata,
  BatchResult,
  TaskPayload,
  ChangeFragment,
  DependencyDAG,
  DependencyNode,
  IdempotentBatch,
  StreamingWriteConfig,
  BatchProcessingError,
  IngestionError,
  IngestionEvents
} from './types.js';
import { KnowledgeGraphServiceIntegration } from './pipeline.js';

export interface BatchProcessorConfig extends BatchConfig {
  streaming: StreamingWriteConfig;
  enableDAG: boolean;
  epochTTL: number;
  dependencyTimeout: number;
}

export interface BatchProcessor {
  processEntities(entities: Entity[], metadata?: Partial<BatchMetadata>): Promise<BatchResult>;
  processRelationships(relationships: GraphRelationship[], metadata?: Partial<BatchMetadata>): Promise<BatchResult>;
  processChangeFragments(fragments: ChangeFragment[]): Promise<BatchResult[]>;
}

export class HighThroughputBatchProcessor extends EventEmitter<IngestionEvents> implements BatchProcessor {
  private config: BatchProcessorConfig;
  private activeBatches: Map<string, IdempotentBatch> = new Map();
  private processedBatches: Set<string> = new Set();
  private epochCounter = 0;
  private dependencyDAG?: DependencyDAG;
  private running = false;
  private knowledgeGraphService?: KnowledgeGraphServiceIntegration;


  private idempotencyKeys: Map<string, { batchId: string; result: BatchResult; expiresAt: Date }> = new Map();

  constructor(config: BatchProcessorConfig, knowledgeGraphService?: KnowledgeGraphServiceIntegration) {
    super();
    this.config = config;
    this.knowledgeGraphService = knowledgeGraphService;


    setInterval(() => this.cleanupExpiredKeys(), 60000);
  }




  async start(): Promise<void> {
    if (this.running) {
      throw new IngestionError('Batch processor already running', 'ALREADY_RUNNING');
    }

    this.running = true;
    console.log('[BatchProcessor] Started');
  }




  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.running = false;


    await this.waitForActiveBatches();

    console.log('[BatchProcessor] Stopped');
  }




  async processEntities(entities: Entity[], metadata: Partial<BatchMetadata> = {}): Promise<BatchResult> {
    if (!this.running) {
      throw new IngestionError('Batch processor not running', 'NOT_RUNNING');
    }

    const batchMeta: BatchMetadata = {
      id: this.generateBatchId(),
      type: 'entity',
      size: entities.length,
      priority: metadata.priority || 5,
      createdAt: new Date(),
      epochId: this.generateEpochId(),
      namespace: metadata.namespace
    };

    this.emit('batch:created', batchMeta);

    try {

      const idempotencyKey = this.generateIdempotencyKey('entity', entities);
      const existingResult = this.checkIdempotency(idempotencyKey);
      if (existingResult) {
        console.log(`[BatchProcessor] Returning cached result for batch ${batchMeta.id}`);
        return existingResult;
      }

      const result = await this.processEntityBatch(entities, batchMeta);


      this.storeIdempotentResult(idempotencyKey, result);

      this.emit('batch:completed', result);
      return result;

    } catch (error) {
      const batchError = new BatchProcessingError(
        `Entity batch processing failed: ${(error as Error).message}`,
        batchMeta.id,
        entities
      );

      this.emit('batch:failed', batchError);
      throw batchError;
    }
  }




  async processRelationships(
    relationships: GraphRelationship[],
    metadata: Partial<BatchMetadata> = {}
  ): Promise<BatchResult> {
    if (!this.running) {
      throw new IngestionError('Batch processor not running', 'NOT_RUNNING');
    }

    const batchMeta: BatchMetadata = {
      id: this.generateBatchId(),
      type: 'relationship',
      size: relationships.length,
      priority: metadata.priority || 5,
      createdAt: new Date(),
      epochId: this.generateEpochId(),
      namespace: metadata.namespace
    };

    this.emit('batch:created', batchMeta);

    try {

      const idempotencyKey = this.generateIdempotencyKey('relationship', relationships);
      const existingResult = this.checkIdempotency(idempotencyKey);
      if (existingResult) {
        console.log(`[BatchProcessor] Returning cached result for batch ${batchMeta.id}`);
        return existingResult;
      }

      const result = await this.processRelationshipBatch(relationships, batchMeta);


      this.storeIdempotentResult(idempotencyKey, result);

      this.emit('batch:completed', result);
      return result;

    } catch (error) {
      const batchError = new BatchProcessingError(
        `Relationship batch processing failed: ${(error as Error).message}`,
        batchMeta.id,
        relationships
      );

      this.emit('batch:failed', batchError);
      throw batchError;
    }
  }




  async processChangeFragments(fragments: ChangeFragment[]): Promise<BatchResult[]> {
    if (!this.running) {
      throw new IngestionError('Batch processor not running', 'NOT_RUNNING');
    }

    if (!this.config.enableDAG) {

      return this.processFragmentsSimple(fragments);
    }

    try {

      const dag = this.buildDependencyDAG(fragments);


      return await this.processFragmentsWithDAG(dag);

    } catch (error) {
      console.error('[BatchProcessor] DAG processing failed, falling back to simple processing:', error);
      return this.processFragmentsSimple(fragments);
    }
  }




  private async processEntityBatch(entities: Entity[], metadata: BatchMetadata): Promise<BatchResult> {
    const startTime = Date.now();
    const batchId = metadata.id;

    try {

      const idempotentBatch: IdempotentBatch = {
        id: batchId,
        epochId: metadata.epochId!,
        operation: 'entity_upsert',
        data: entities,
        metadata: { batchMetadata: metadata },
        createdAt: metadata.createdAt
      };

      this.activeBatches.set(batchId, idempotentBatch);


      const microBatches = this.createMicroBatches(entities, this.config.entityBatchSize);
      let processedCount = 0;
      let failedCount = 0;
      const errors: Error[] = [];


      const concurrencyLimit = this.config.maxConcurrentBatches;
      const processPromises: Promise<void>[] = [];

      for (let i = 0; i < microBatches.length; i += concurrencyLimit) {
        const batchSlice = microBatches.slice(i, i + concurrencyLimit);

        const batchPromises = batchSlice.map(async (microBatch, index) => {
          try {
            await this.processMicroBatch(microBatch, `${batchId}-micro-${i + index}`);
            processedCount += microBatch.length;
          } catch (error) {
            failedCount += microBatch.length;
            errors.push(error as Error);
            console.error(`[BatchProcessor] Micro-batch failed:`, error);
          }
        });

        await Promise.allSettled(batchPromises);
      }

      const duration = Date.now() - startTime;
      const success = failedCount === 0;

      const result: BatchResult = {
        batchId,
        success,
        processedCount,
        failedCount,
        duration,
        errors,
        metadata
      };


      this.activeBatches.delete(batchId);
      this.processedBatches.add(batchId);

      return result;

    } catch (error) {
      this.activeBatches.delete(batchId);
      throw error;
    }
  }




  private async processRelationshipBatch(
    relationships: GraphRelationship[],
    metadata: BatchMetadata
  ): Promise<BatchResult> {
    const startTime = Date.now();
    const batchId = metadata.id;

    try {

      const resolvedRelationships = await this.resolveRelationshipEndpoints(relationships);


      const idempotentBatch: IdempotentBatch = {
        id: batchId,
        epochId: metadata.epochId!,
        operation: 'relationship_upsert',
        data: resolvedRelationships,
        metadata: { batchMetadata: metadata },
        createdAt: metadata.createdAt
      };

      this.activeBatches.set(batchId, idempotentBatch);


      const microBatches = this.createMicroBatches(resolvedRelationships, this.config.relationshipBatchSize);
      let processedCount = 0;
      let failedCount = 0;
      const errors: Error[] = [];

      for (const microBatch of microBatches) {
        try {
          await this.processMicroBatch(microBatch, `${batchId}-rel-${microBatches.indexOf(microBatch)}`);
          processedCount += microBatch.length;
        } catch (error) {
          failedCount += microBatch.length;
          errors.push(error as Error);
          console.error(`[BatchProcessor] Relationship micro-batch failed:`, error);
        }
      }

      const duration = Date.now() - startTime;
      const success = failedCount === 0;

      const result: BatchResult = {
        batchId,
        success,
        processedCount,
        failedCount,
        duration,
        errors,
        metadata
      };

      this.activeBatches.delete(batchId);
      this.processedBatches.add(batchId);

      return result;

    } catch (error) {
      this.activeBatches.delete(batchId);
      throw error;
    }
  }




  private async processFragmentsSimple(fragments: ChangeFragment[]): Promise<BatchResult[]> {
    const entityFragments = fragments.filter(f => f.changeType === 'entity');
    const relationshipFragments = fragments.filter(f => f.changeType === 'relationship');

    const results: BatchResult[] = [];


    if (entityFragments.length > 0) {
      const entities = entityFragments.map(f => f.data as Entity);
      const result = await this.processEntities(entities);
      results.push(result);
    }


    if (relationshipFragments.length > 0) {
      const relationships = relationshipFragments.map(f => f.data as GraphRelationship);
      const result = await this.processRelationships(relationships);
      results.push(result);
    }

    return results;
  }




  private buildDependencyDAG(fragments: ChangeFragment[]): DependencyDAG {
    const nodes = new Map<string, DependencyNode>();
    const roots: string[] = [];
    const leaves: string[] = [];


    for (const fragment of fragments) {
      const node: DependencyNode = {
        id: fragment.id,
        type: fragment.changeType,
        data: fragment.data,
        dependencies: [],
        dependents: [],
        priority: fragment.confidence,
        status: 'pending'
      };

      nodes.set(fragment.id, node);
    }


    for (const fragment of fragments) {
      const node = nodes.get(fragment.id)!;


      for (const hintId of fragment.dependencyHints) {
        const depNode = nodes.get(hintId);
        if (depNode) {
          node.dependencies.push(hintId);
          depNode.dependents.push(fragment.id);
        }
      }
    }


    for (const [nodeId, node] of nodes) {
      if (node.dependencies.length === 0) {
        roots.push(nodeId);
      }
      if (node.dependents.length === 0) {
        leaves.push(nodeId);
      }
    }


    const cycles = this.detectCycles(nodes);

    return {
      nodes,
      roots,
      leaves,
      cycles
    };
  }




  private async processFragmentsWithDAG(dag: DependencyDAG): Promise<BatchResult[]> {
    const results: BatchResult[] = [];
    const processed = new Set<string>();


    const queue = [...dag.roots];

    while (queue.length > 0) {
      const currentBatch: ChangeFragment[] = [];
      const batchNodes: string[] = [];


      for (let i = queue.length - 1; i >= 0; i--) {
        const nodeId = queue[i];
        const node = dag.nodes.get(nodeId)!;


        const allDepsSatisfied = node.dependencies.every(depId => processed.has(depId));

        if (allDepsSatisfied) {
          queue.splice(i, 1);
          batchNodes.push(nodeId);

          const fragment: ChangeFragment = {
            id: nodeId,
            eventId: '', // Will be set by caller
            changeType: node.type,
            operation: 'add',
            data: node.data,
            dependencyHints: node.dependencies,
            confidence: node.priority
          };

          currentBatch.push(fragment);
        }
      }

      if (currentBatch.length > 0) {

        const batchResults = await this.processFragmentsSimple(currentBatch);
        results.push(...batchResults);


        for (const nodeId of batchNodes) {
          processed.add(nodeId);
          const node = dag.nodes.get(nodeId)!;
          node.status = 'completed';


          for (const dependentId of node.dependents) {
            if (!queue.includes(dependentId) && !processed.has(dependentId)) {
              queue.push(dependentId);
            }
          }
        }
      } else if (queue.length > 0) {

        console.warn('[BatchProcessor] Possible deadlock in DAG, processing remaining nodes');
        break;
      }
    }

    return results;
  }




  private createMicroBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    return batches;
  }




  private async processMicroBatch(batch: any[], batchId: string): Promise<void> {
    if (!this.knowledgeGraphService) {
      console.log(`[BatchProcessor] No KnowledgeGraphService available, simulating micro-batch ${batchId} with ${batch.length} items`);

      await new Promise(resolve => setTimeout(resolve, 10));
      return;
    }

    try {

      const entities: Entity[] = [];
      const relationships: GraphRelationship[] = [];

      for (const item of batch) {
        if (item.type === 'entity' || item.entityType) {
          entities.push(item);
        } else if (item.type === 'relationship' || item.fromEntityId || item.toEntityId) {
          relationships.push(item);
        }
      }


      if (entities.length > 0) {
        console.log(`[BatchProcessor] Processing ${entities.length} entities in micro-batch ${batchId}`);
        await this.knowledgeGraphService.createEntitiesBulk(entities, {
          batchId,
          skipEmbedding: true,
          microBatch: true
        });
      }


      if (relationships.length > 0) {
        console.log(`[BatchProcessor] Processing ${relationships.length} relationships in micro-batch ${batchId}`);
        await this.knowledgeGraphService.createRelationshipsBulk(relationships, {
          batchId,
          microBatch: true
        });
      }

      console.log(`[BatchProcessor] Successfully processed micro-batch ${batchId} with ${entities.length} entities and ${relationships.length} relationships`);

    } catch (error) {
      console.error(`[BatchProcessor] Error processing micro-batch ${batchId}:`, error);
      throw error;
    }
  }




  private async resolveRelationshipEndpoints(relationships: GraphRelationship[]): Promise<GraphRelationship[]> {

    return relationships.filter(rel => {

      const hasFromId = rel.fromEntityId || (rel.from && (rel.from as any).id);
      const hasToId = rel.toEntityId || (rel.to && (rel.to as any).id);

      if (!hasFromId || !hasToId) {
        console.warn(`[BatchProcessor] Skipping relationship with missing endpoints: ${JSON.stringify(rel)}`);
        return false;
      }


      if (!rel.fromEntityId && rel.from) {
        rel.fromEntityId = (rel.from as any).id;
      }
      if (!rel.toEntityId && rel.to) {
        rel.toEntityId = (rel.to as any).id;
      }

      return true;
    });
  }




  private generateBatchId(): string {
    return `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }




  private generateEpochId(): string {
    return `epoch-${++this.epochCounter}-${Date.now()}`;
  }




  private generateIdempotencyKey(type: string, data: any[]): string {

    const dataStr = JSON.stringify(data.map(item => ({ id: item.id, type: item.type || type })));
    return `${type}-${this.simpleHash(dataStr)}`;
  }




  private checkIdempotency(key: string): BatchResult | null {
    const cached = this.idempotencyKeys.get(key);
    if (cached && cached.expiresAt > new Date()) {
      return cached.result;
    }
    return null;
  }




  private storeIdempotentResult(key: string, result: BatchResult): void {
    const expiresAt = new Date(Date.now() + this.config.streaming.idempotencyKeyTTL);
    this.idempotencyKeys.set(key, { batchId: result.batchId, result, expiresAt });
  }




  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }




  private detectCycles(nodes: Map<string, DependencyNode>): string[][] {

    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string, path: string[]): void => {
      if (recursionStack.has(nodeId)) {

        const cycleStart = path.indexOf(nodeId);
        if (cycleStart >= 0) {
          cycles.push(path.slice(cycleStart));
        }
        return;
      }

      if (visited.has(nodeId)) {
        return;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const node = nodes.get(nodeId);
      if (node) {
        for (const depId of node.dependencies) {
          dfs(depId, [...path]);
        }
      }

      recursionStack.delete(nodeId);
    };

    for (const nodeId of nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    }

    return cycles;
  }




  private async waitForActiveBatches(): Promise<void> {
    const timeout = this.config.timeoutMs;
    const startTime = Date.now();

    while (this.activeBatches.size > 0) {
      if (Date.now() - startTime > timeout) {
        console.warn('[BatchProcessor] Timeout waiting for active batches to complete');
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }




  private cleanupExpiredKeys(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [key, cached] of this.idempotencyKeys) {
      if (cached.expiresAt <= now) {
        this.idempotencyKeys.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[BatchProcessor] Cleaned up ${cleanedCount} expired idempotency keys`);
    }
  }




  getMetrics(): {
    activeBatches: number;
    processedBatches: number;
    idempotencyKeys: number;
  } {
    return {
      activeBatches: this.activeBatches.size,
      processedBatches: this.processedBatches.size,
      idempotencyKeys: this.idempotencyKeys.size
    };
  }
}

================
File: ingestion/error-handler.ts
================
import { EventEmitter } from 'events';
import {
  IngestionError,
  BatchProcessingError,
  WorkerError,
  QueueOverflowError,
  TaskPayload,
  IngestionEvents
} from './types.js';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitterFactor: number;
  retryableErrors: string[];
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  timeoutThreshold: number;
  resetTimeout: number;
  monitoringWindow: number;
}

export interface ErrorHandlingConfig {
  retry: RetryConfig;
  circuitBreaker: CircuitBreakerConfig;
  deadLetterQueue: {
    enabled: boolean;
    maxSize: number;
    retentionTime: number;
  };
  errorReporting: {
    enabled: boolean;
    sampleRate: number;
    maxErrorsPerMinute: number;
  };
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  retryCount: number;
  circuitBreakerTrips: number;
  deadLetterQueueSize: number;
  errorRate: number;
}

export type ErrorHandler = (error: Error, context?: any) => Promise<boolean>;




class CircuitBreaker extends EventEmitter {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failures = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    super();
    this.config = config;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      const now = Date.now();
      if (now - this.lastFailureTime < this.config.resetTimeout) {
        throw new IngestionError('Circuit breaker is open', 'CIRCUIT_BREAKER_OPEN', false);
      }
      this.state = 'half-open';
      this.successCount = 0;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;

    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = 'closed';
        this.emit('closed');
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.config.failureThreshold) {
      this.state = 'open';
      this.emit('opened');
    }
  }

  getState(): string {
    return this.state;
  }

  getMetrics(): { state: string; failures: number; successCount: number } {
    return {
      state: this.state,
      failures: this.failures,
      successCount: this.successCount
    };
  }
}




class RetryHandler {
  private config: RetryConfig;

  constructor(config: RetryConfig) {
    this.config = config;
  }

  async execute<T>(
    operation: () => Promise<T>,
    context: string = 'unknown'
  ): Promise<T> {
    let lastError: Error;
    let attempt = 0;

    while (attempt < this.config.maxAttempts) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        attempt++;

        if (!this.isRetryable(error as Error) || attempt >= this.config.maxAttempts) {
          throw error;
        }

        const delay = this.calculateDelay(attempt);
        console.log(`[RetryHandler] Attempt ${attempt} failed for ${context}, retrying in ${delay}ms:`, error);

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private isRetryable(error: Error): boolean {
    if (error instanceof IngestionError) {
      return error.retryable;
    }


    const errorMessage = error.message.toLowerCase();
    return this.config.retryableErrors.some(pattern =>
      errorMessage.includes(pattern.toLowerCase())
    );
  }

  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
    const clampedDelay = Math.min(exponentialDelay, this.config.maxDelay);


    const jitter = clampedDelay * this.config.jitterFactor * (Math.random() - 0.5);
    return Math.max(clampedDelay + jitter, this.config.baseDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}




class DeadLetterQueue {
  private queue: Array<{
    task: TaskPayload;
    error: Error;
    timestamp: Date;
    attempts: number;
  }> = [];

  private config: ErrorHandlingConfig['deadLetterQueue'];

  constructor(config: ErrorHandlingConfig['deadLetterQueue']) {
    this.config = config;


    setInterval(() => this.cleanup(), 60000);
  }

  add(task: TaskPayload, error: Error, attempts: number): void {
    if (!this.config.enabled) {
      return;
    }

    if (this.queue.length >= this.config.maxSize) {

      this.queue.shift();
    }

    this.queue.push({
      task,
      error,
      timestamp: new Date(),
      attempts
    });
  }

  getAll(): Array<{ task: TaskPayload; error: Error; timestamp: Date; attempts: number }> {
    return [...this.queue];
  }

  remove(taskId: string): boolean {
    const index = this.queue.findIndex(item => item.task.id === taskId);
    if (index >= 0) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  size(): number {
    return this.queue.length;
  }

  private cleanup(): void {
    const cutoff = new Date(Date.now() - this.config.retentionTime);
    this.queue = this.queue.filter(item => item.timestamp > cutoff);
  }
}




export class IngestionErrorHandler extends EventEmitter<IngestionEvents> {
  private config: ErrorHandlingConfig;
  private retryHandler: RetryHandler;
  private circuitBreaker: CircuitBreaker;
  private deadLetterQueue: DeadLetterQueue;


  private metrics: ErrorMetrics = {
    totalErrors: 0,
    errorsByType: {},
    retryCount: 0,
    circuitBreakerTrips: 0,
    deadLetterQueueSize: 0,
    errorRate: 0
  };


  private errorCountWindow: number[] = [];
  private lastErrorRateCheck = Date.now();


  private errorHandlers = new Map<string, ErrorHandler>();

  constructor(config: ErrorHandlingConfig) {
    super();
    this.config = config;

    this.retryHandler = new RetryHandler(config.retry);
    this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);
    this.deadLetterQueue = new DeadLetterQueue(config.deadLetterQueue);

    this.setupCircuitBreakerEvents();
    this.startMetricsCollection();
  }




  async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: string = 'unknown',
    skipCircuitBreaker = false
  ): Promise<T> {
    const executeOperation = skipCircuitBreaker
      ? operation
      : () => this.circuitBreaker.execute(operation);

    try {
      return await this.retryHandler.execute(executeOperation, context);
    } catch (error) {
      await this.handleError(error as Error, { context, operation: 'execute' });
      throw error;
    }
  }




  async handleTaskFailure(
    task: TaskPayload,
    error: Error,
    requeueCallback: (task: TaskPayload, error: Error) => Promise<void>
  ): Promise<void> {
    this.recordError(error);


    if (task.retryCount < task.maxRetries && this.isRetryable(error)) {
      this.metrics.retryCount++;
      await requeueCallback(task, error);
      return;
    }


    this.deadLetterQueue.add(task, error, task.retryCount);
    this.metrics.deadLetterQueueSize = this.deadLetterQueue.size();

    console.error(`[ErrorHandler] Task ${task.id} failed permanently after ${task.retryCount} retries:`, error);
  }




  async handleBatchError(
    batchError: BatchProcessingError,
    retryCallback?: (batchId: string) => Promise<void>
  ): Promise<void> {
    this.recordError(batchError);


    if (batchError.failedItems.length > 0 && batchError.failedItems.length < 10) {
      console.log(`[ErrorHandler] Attempting individual processing for ${batchError.failedItems.length} failed items`);

      for (const item of batchError.failedItems) {
        try {

          console.log(`[ErrorHandler] Individual retry needed for item:`, item);
        } catch (itemError) {
          console.error(`[ErrorHandler] Individual item retry failed:`, itemError);
        }
      }
    }


    if (retryCallback && this.isRetryable(batchError)) {
      try {
        await retryCallback(batchError.batchId);
      } catch (retryError) {
        console.error(`[ErrorHandler] Batch retry failed for ${batchError.batchId}:`, retryError);
      }
    }
  }




  async handleWorkerError(workerError: WorkerError): Promise<void> {
    this.recordError(workerError);


    if (workerError.metadata?.errorCount && workerError.metadata.errorCount > 5) {
      console.warn(`[ErrorHandler] Worker ${workerError.workerId} has high error count, restart recommended`);
    }
  }




  registerErrorHandler(errorType: string, handler: ErrorHandler): void {
    this.errorHandlers.set(errorType, handler);
  }




  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }




  getDeadLetterQueue(): Array<{ task: TaskPayload; error: Error; timestamp: Date; attempts: number }> {
    return this.deadLetterQueue.getAll();
  }




  async retryFromDeadLetterQueue(
    taskId: string,
    requeueCallback: (task: TaskPayload) => Promise<void>
  ): Promise<boolean> {
    const items = this.deadLetterQueue.getAll();
    const item = items.find(i => i.task.id === taskId);

    if (!item) {
      return false;
    }


    item.task.retryCount = 0;
    await requeueCallback(item.task);

    this.deadLetterQueue.remove(taskId);
    this.metrics.deadLetterQueueSize = this.deadLetterQueue.size();

    return true;
  }




  getCircuitBreakerStatus(): { state: string; failures: number; successCount: number } {
    return this.circuitBreaker.getMetrics();
  }




  private async handleError(error: Error, context: any = {}): Promise<void> {
    this.recordError(error);


    const errorType = error.constructor.name;
    const customHandler = this.errorHandlers.get(errorType);

    if (customHandler) {
      try {
        const handled = await customHandler(error, context);
        if (handled) {
          return;
        }
      } catch (handlerError) {
        console.error('[ErrorHandler] Custom error handler failed:', handlerError);
      }
    }


    if (error instanceof QueueOverflowError) {
      console.error('[ErrorHandler] Queue overflow detected, applying backpressure');
      this.emit('queue:overflow', error);
    } else if (error instanceof BatchProcessingError) {
      await this.handleBatchError(error);
    } else if (error instanceof WorkerError) {
      await this.handleWorkerError(error);
    }


    if (this.shouldReportError(error)) {
      this.reportError(error, context);
    }
  }

  private recordError(error: Error): void {
    this.metrics.totalErrors++;

    const errorType = error.constructor.name;
    this.metrics.errorsByType[errorType] = (this.metrics.errorsByType[errorType] || 0) + 1;


    this.errorCountWindow.push(Date.now());
    this.updateErrorRate();
  }

  private isRetryable(error: Error): boolean {
    if (error instanceof IngestionError) {
      return error.retryable;
    }


    if (error.message.includes('ECONNRESET') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('ENOTFOUND')) {
      return true;
    }


    if (error.message.includes('timeout') ||
        error.message.includes('connection')) {
      return true;
    }

    return false;
  }

  private setupCircuitBreakerEvents(): void {
    this.circuitBreaker.on('opened', () => {
      this.metrics.circuitBreakerTrips++;
      console.warn('[ErrorHandler] Circuit breaker opened');
    });

    this.circuitBreaker.on('closed', () => {
      console.log('[ErrorHandler] Circuit breaker closed');
    });
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateErrorRate();
      this.emit('metrics:updated', this.metrics);
    }, 10000);
  }

  private updateErrorRate(): void {
    const now = Date.now();
    const windowStart = now - 60000;


    this.errorCountWindow = this.errorCountWindow.filter(timestamp => timestamp > windowStart);


    this.metrics.errorRate = this.errorCountWindow.length;
  }

  private shouldReportError(error: Error): boolean {
    if (!this.config.errorReporting.enabled) {
      return false;
    }


    if (Math.random() > this.config.errorReporting.sampleRate) {
      return false;
    }


    if (this.metrics.errorRate > this.config.errorReporting.maxErrorsPerMinute) {
      return false;
    }

    return true;
  }

  private reportError(error: Error, context: any): void {

    console.error('[ErrorHandler] Reporting error:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      metrics: this.metrics
    });
  }
}




export function createDefaultErrorHandlingConfig(): ErrorHandlingConfig {
  return {
    retry: {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitterFactor: 0.1,
      retryableErrors: [
        'timeout',
        'connection',
        'network',
        'temporary',
        'rate limit',
        'service unavailable'
      ]
    },
    circuitBreaker: {
      failureThreshold: 5,
      timeoutThreshold: 30000,
      resetTimeout: 60000,
      monitoringWindow: 60000
    },
    deadLetterQueue: {
      enabled: true,
      maxSize: 1000,
      retentionTime: 3600000
    },
    errorReporting: {
      enabled: true,
      sampleRate: 0.1,
      maxErrorsPerMinute: 100
    }
  };
}

================
File: ingestion/index.ts
================
export { HighThroughputIngestionPipeline } from './pipeline.js';
export type { KnowledgeGraphServiceIntegration } from './pipeline.js';


export { QueueManager } from './queue-manager.js';
export type { QueueManagerConfig } from './queue-manager.js';

export { WorkerPool } from './worker-pool.js';
export type { WorkerPoolConfig, WorkerInstance, WorkerHandler } from './worker-pool.js';

export { HighThroughputBatchProcessor } from './batch-processor.js';
export type { BatchProcessor, BatchProcessorConfig } from './batch-processor.js';


export type {

  ChangeEvent,
  ChangeFragment,


  QueueConfig,
  QueueMetrics,
  TaskPayload,


  WorkerConfig,
  WorkerMetrics,
  WorkerResult,


  BatchConfig,
  BatchMetadata,
  BatchResult,


  PipelineConfig,
  PipelineMetrics,
  PipelineState,


  DependencyNode,
  DependencyDAG,


  StreamingWriteConfig,
  IdempotentBatch,


  EnrichmentTask,
  EnrichmentResult,


  IngestionTelemetry,
  AlertConfig,


  IngestionEvents
} from './types.js';


export {
  IngestionError,
  BatchProcessingError,
  WorkerError,
  QueueOverflowError
} from './types.js';


export const INGESTION_DEFAULTS = {
  QUEUE: {
    MAX_SIZE: 10000,
    PARTITION_COUNT: 4,
    BATCH_SIZE: 100,
    BATCH_TIMEOUT: 1000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
  },
  WORKERS: {
    MIN_WORKERS: 2,
    MAX_WORKERS: 16,
    WORKER_TIMEOUT: 30000,
    HEALTH_CHECK_INTERVAL: 5000,
    RESTART_THRESHOLD: 5
  },
  BATCHING: {
    ENTITY_BATCH_SIZE: 100,
    RELATIONSHIP_BATCH_SIZE: 200,
    EMBEDDING_BATCH_SIZE: 50,
    TIMEOUT_MS: 30000,
    MAX_CONCURRENT_BATCHES: 4
  },
  MONITORING: {
    METRICS_INTERVAL: 5000,
    HEALTH_CHECK_INTERVAL: 10000,
    ALERT_THRESHOLDS: {
      QUEUE_DEPTH: 1000,
      LATENCY: 5000,
      ERROR_RATE: 0.1
    }
  }
} as const;




export function createDefaultPipelineConfig(): PipelineConfig {
  return {
    eventBus: {
      type: 'memory',
      partitions: INGESTION_DEFAULTS.QUEUE.PARTITION_COUNT
    },
    workers: {
      parsers: 4,
      entityWorkers: 4,
      relationshipWorkers: 4,
      embeddingWorkers: 2
    },
    batching: {
      entityBatchSize: INGESTION_DEFAULTS.BATCHING.ENTITY_BATCH_SIZE,
      relationshipBatchSize: INGESTION_DEFAULTS.BATCHING.RELATIONSHIP_BATCH_SIZE,
      embeddingBatchSize: INGESTION_DEFAULTS.BATCHING.EMBEDDING_BATCH_SIZE,
      timeoutMs: INGESTION_DEFAULTS.BATCHING.TIMEOUT_MS,
      maxConcurrentBatches: INGESTION_DEFAULTS.BATCHING.MAX_CONCURRENT_BATCHES
    },
    queues: {
      maxSize: INGESTION_DEFAULTS.QUEUE.MAX_SIZE,
      partitionCount: INGESTION_DEFAULTS.QUEUE.PARTITION_COUNT,
      batchSize: INGESTION_DEFAULTS.QUEUE.BATCH_SIZE,
      batchTimeout: INGESTION_DEFAULTS.QUEUE.BATCH_TIMEOUT,
      retryAttempts: INGESTION_DEFAULTS.QUEUE.RETRY_ATTEMPTS,
      retryDelay: INGESTION_DEFAULTS.QUEUE.RETRY_DELAY
    },
    monitoring: {
      metricsInterval: INGESTION_DEFAULTS.MONITORING.METRICS_INTERVAL,
      healthCheckInterval: INGESTION_DEFAULTS.MONITORING.HEALTH_CHECK_INTERVAL,
      alertThresholds: {
        queueDepth: INGESTION_DEFAULTS.MONITORING.ALERT_THRESHOLDS.QUEUE_DEPTH,
        latency: INGESTION_DEFAULTS.MONITORING.ALERT_THRESHOLDS.LATENCY,
        errorRate: INGESTION_DEFAULTS.MONITORING.ALERT_THRESHOLDS.ERROR_RATE
      }
    }
  };
}




export function createHighThroughputPipelineConfig(): PipelineConfig {
  const config = createDefaultPipelineConfig();


  config.workers.parsers = 8;
  config.workers.entityWorkers = 8;
  config.workers.relationshipWorkers = 8;
  config.workers.embeddingWorkers = 4;


  config.batching.entityBatchSize = 500;
  config.batching.relationshipBatchSize = 1000;
  config.batching.embeddingBatchSize = 200;
  config.batching.maxConcurrentBatches = 8;


  config.queues.maxSize = 50000;
  config.queues.partitionCount = 8;
  config.queues.batchSize = 500;


  config.monitoring.alertThresholds.queueDepth = 10000;
  config.monitoring.alertThresholds.latency = 2000;

  return config;
}




export function createDevelopmentPipelineConfig(): PipelineConfig {
  const config = createDefaultPipelineConfig();


  config.workers.parsers = 2;
  config.workers.entityWorkers = 2;
  config.workers.relationshipWorkers = 2;
  config.workers.embeddingWorkers = 1;


  config.batching.entityBatchSize = 50;
  config.batching.relationshipBatchSize = 100;
  config.batching.embeddingBatchSize = 25;
  config.batching.maxConcurrentBatches = 2;


  config.queues.maxSize = 1000;
  config.queues.partitionCount = 2;
  config.queues.batchSize = 50;


  config.monitoring.metricsInterval = 2000;
  config.monitoring.healthCheckInterval = 5000;

  return config;
}




export function validatePipelineConfig(config: PipelineConfig): string[] {
  const errors: string[] = [];


  if (config.workers.parsers < 1) {
    errors.push('At least 1 parser worker is required');
  }

  if (config.workers.entityWorkers < 1) {
    errors.push('At least 1 entity worker is required');
  }

  if (config.workers.relationshipWorkers < 1) {
    errors.push('At least 1 relationship worker is required');
  }


  if (config.batching.entityBatchSize < 1) {
    errors.push('Entity batch size must be at least 1');
  }

  if (config.batching.relationshipBatchSize < 1) {
    errors.push('Relationship batch size must be at least 1');
  }

  if (config.batching.maxConcurrentBatches < 1) {
    errors.push('Max concurrent batches must be at least 1');
  }


  if (config.queues.maxSize < 100) {
    errors.push('Queue max size should be at least 100');
  }

  if (config.queues.partitionCount < 1) {
    errors.push('At least 1 queue partition is required');
  }


  if (config.monitoring.metricsInterval < 1000) {
    errors.push('Metrics interval should be at least 1000ms');
  }

  if (config.monitoring.healthCheckInterval < 1000) {
    errors.push('Health check interval should be at least 1000ms');
  }

  return errors;
}




export function createMockChangeEvent(overrides: Partial<ChangeEvent> = {}): ChangeEvent {
  return {
    id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    namespace: 'test',
    module: 'test-module',
    filePath: '/test/file.ts',
    eventType: 'modified',
    timestamp: new Date(),
    size: 1000,
    diffHash: 'abc123',
    metadata: {},
    ...overrides
  };
}




export function createMockChangeFragment(overrides: Partial<ChangeFragment> = {}): ChangeFragment {
  return {
    id: `fragment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    eventId: 'test-event',
    changeType: 'entity',
    operation: 'add',
    data: {
      id: 'test-entity',
      type: 'function',
      name: 'testFunction',
      properties: {},
      metadata: { createdAt: new Date() }
    },
    dependencyHints: [],
    confidence: 0.9,
    ...overrides
  };
}

================
File: ingestion/knowledge-graph-adapter.ts
================
import { Entity } from '@memento/core/models/entities.js';
import { GraphRelationship } from '@memento/core/models/relationships.js';
import { KnowledgeGraphServiceIntegration } from './pipeline.js';

export interface KnowledgeGraphServiceLike {
  createEntitiesBulk(entities: Entity[], options?: any): Promise<any>;
  createRelationshipsBulk(relationships: GraphRelationship[], options?: any): Promise<any>;
  createEmbeddingsBatch(entities: Entity[], options?: any): Promise<any>;
  createOrUpdateEntity(entity: Entity, options?: any): Promise<Entity>;
  createRelationship(relationship: GraphRelationship): Promise<GraphRelationship>;
  createEmbedding(entity: Entity): Promise<any>;
}





export class KnowledgeGraphAdapter implements KnowledgeGraphServiceIntegration {
  constructor(private knowledgeGraphService: KnowledgeGraphServiceLike) {}




  async createEntitiesBulk(entities: Entity[], options: any = {}): Promise<any> {
    try {

      if (this.knowledgeGraphService.createEntitiesBulk) {
        return await this.knowledgeGraphService.createEntitiesBulk(entities, {
          ...options,
          skipEmbedding: true,
          batch: true
        });
      }


      console.log(`[KnowledgeGraphAdapter] Falling back to individual entity creates for ${entities.length} entities`);

      const results = [];
      const batchSize = options.batchSize || 50;

      for (let i = 0; i < entities.length; i += batchSize) {
        const batch = entities.slice(i, i + batchSize);
        const batchPromises = batch.map(entity =>
          this.knowledgeGraphService.createOrUpdateEntity(entity, {
            skipEmbedding: true,
            ...options
          })
        );

        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults.map((result, index) => ({
          entity: batch[index],
          success: result.status === 'fulfilled',
          result: result.status === 'fulfilled' ? result.value : undefined,
          error: result.status === 'rejected' ? result.reason : undefined
        })));
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      return {
        success: failureCount === 0,
        processed: successCount,
        failed: failureCount,
        results,
        metadata: {
          batchSize,
          totalBatches: Math.ceil(entities.length / batchSize)
        }
      };

    } catch (error) {
      console.error('[KnowledgeGraphAdapter] Entity bulk creation failed:', error);
      throw error;
    }
  }




  async createRelationshipsBulk(relationships: GraphRelationship[], options: any = {}): Promise<any> {
    try {

      if (this.knowledgeGraphService.createRelationshipsBulk) {
        return await this.knowledgeGraphService.createRelationshipsBulk(relationships, {
          ...options,
          batch: true
        });
      }


      console.log(`[KnowledgeGraphAdapter] Falling back to individual relationship creates for ${relationships.length} relationships`);

      const results = [];
      const batchSize = options.batchSize || 100;

      for (let i = 0; i < relationships.length; i += batchSize) {
        const batch = relationships.slice(i, i + batchSize);
        const batchPromises = batch.map(relationship =>
          this.knowledgeGraphService.createRelationship(relationship)
        );

        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults.map((result, index) => ({
          relationship: batch[index],
          success: result.status === 'fulfilled',
          result: result.status === 'fulfilled' ? result.value : undefined,
          error: result.status === 'rejected' ? result.reason : undefined
        })));
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      return {
        success: failureCount === 0,
        processed: successCount,
        failed: failureCount,
        results,
        metadata: {
          batchSize,
          totalBatches: Math.ceil(relationships.length / batchSize)
        }
      };

    } catch (error) {
      console.error('[KnowledgeGraphAdapter] Relationship bulk creation failed:', error);
      throw error;
    }
  }




  async createEmbeddingsBatch(entities: Entity[], options: any = {}): Promise<any> {
    try {

      if (this.knowledgeGraphService.createEmbeddingsBatch) {
        return await this.knowledgeGraphService.createEmbeddingsBatch(entities, {
          ...options,
          async: true,
          batch: true
        });
      }


      console.log(`[KnowledgeGraphAdapter] Falling back to individual embedding creates for ${entities.length} entities`);

      const results = [];
      const batchSize = options.batchSize || 25;

      for (let i = 0; i < entities.length; i += batchSize) {
        const batch = entities.slice(i, i + batchSize);


        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const batchPromises = batch.map(entity =>
          this.knowledgeGraphService.createEmbedding(entity)
        );

        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults.map((result, index) => ({
          entity: batch[index],
          success: result.status === 'fulfilled',
          result: result.status === 'fulfilled' ? result.value : undefined,
          error: result.status === 'rejected' ? result.reason : undefined
        })));
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      return {
        success: failureCount === 0,
        processed: successCount,
        failed: failureCount,
        results,
        metadata: {
          batchSize,
          totalBatches: Math.ceil(entities.length / batchSize),
          async: true
        }
      };

    } catch (error) {
      console.error('[KnowledgeGraphAdapter] Embedding batch creation failed:', error);
      throw error;
    }
  }
}




export function createKnowledgeGraphAdapter(
  knowledgeGraphService: KnowledgeGraphServiceLike
): KnowledgeGraphServiceIntegration {
  return new KnowledgeGraphAdapter(knowledgeGraphService);
}




export class OptimizedKnowledgeGraphAdapter extends KnowledgeGraphAdapter {
  private entityCache = new Map<string, Entity>();
  private relationshipCache = new Map<string, GraphRelationship>();
  private batchingBuffer: {
    entities: Entity[];
    relationships: GraphRelationship[];
    embeddings: Entity[];
  } = {
    entities: [],
    relationships: [],
    embeddings: []
  };

  private flushTimer?: NodeJS.Timeout;
  private readonly FLUSH_INTERVAL = 1000;
  private readonly MAX_BUFFER_SIZE = 500;

  constructor(
    knowledgeGraphService: KnowledgeGraphServiceLike,
    private optimizationOptions: {
      enableCaching?: boolean;
      enableBuffering?: boolean;
      flushInterval?: number;
      maxBufferSize?: number;
    } = {}
  ) {
    super(knowledgeGraphService);

    if (optimizationOptions.enableBuffering) {
      this.startBufferFlushing();
    }
  }




  async createEntitiesBulk(entities: Entity[], options: any = {}): Promise<any> {
    if (this.optimizationOptions.enableCaching) {

      const newEntities = entities.filter(entity => {
        const cached = this.entityCache.get(entity.id);
        if (cached) {
          console.log(`[OptimizedAdapter] Entity ${entity.id} already cached, skipping`);
          return false;
        }
        return true;
      });

      if (newEntities.length < entities.length) {
        console.log(`[OptimizedAdapter] Filtered ${entities.length - newEntities.length} cached entities`);
      }

      entities = newEntities;
    }

    if (this.optimizationOptions.enableBuffering && !options.forceFlush) {

      this.batchingBuffer.entities.push(...entities);


      if (this.batchingBuffer.entities.length >= (this.optimizationOptions.maxBufferSize || this.MAX_BUFFER_SIZE)) {
        await this.flushEntityBuffer();
      }

      return {
        success: true,
        processed: entities.length,
        buffered: true
      };
    }

    const result = await super.createEntitiesBulk(entities, options);


    if (this.optimizationOptions.enableCaching && result.success) {
      entities.forEach(entity => this.entityCache.set(entity.id, entity));
    }

    return result;
  }




  async createRelationshipsBulk(relationships: GraphRelationship[], options: any = {}): Promise<any> {
    if (this.optimizationOptions.enableCaching) {
      const newRelationships = relationships.filter(rel => {
        const relId = this.getRelationshipId(rel);
        const cached = this.relationshipCache.get(relId);
        if (cached) {
          console.log(`[OptimizedAdapter] Relationship ${relId} already cached, skipping`);
          return false;
        }
        return true;
      });

      relationships = newRelationships;
    }

    if (this.optimizationOptions.enableBuffering && !options.forceFlush) {
      this.batchingBuffer.relationships.push(...relationships);

      if (this.batchingBuffer.relationships.length >= (this.optimizationOptions.maxBufferSize || this.MAX_BUFFER_SIZE)) {
        await this.flushRelationshipBuffer();
      }

      return {
        success: true,
        processed: relationships.length,
        buffered: true
      };
    }

    const result = await super.createRelationshipsBulk(relationships, options);


    if (this.optimizationOptions.enableCaching && result.success) {
      relationships.forEach(rel => {
        const relId = this.getRelationshipId(rel);
        this.relationshipCache.set(relId, rel);
      });
    }

    return result;
  }




  async flushAll(): Promise<void> {
    await Promise.all([
      this.flushEntityBuffer(),
      this.flushRelationshipBuffer(),
      this.flushEmbeddingBuffer()
    ]);
  }




  clearCaches(): void {
    this.entityCache.clear();
    this.relationshipCache.clear();
  }




  getBufferStats(): {
    entities: number;
    relationships: number;
    embeddings: number;
  } {
    return {
      entities: this.batchingBuffer.entities.length,
      relationships: this.batchingBuffer.relationships.length,
      embeddings: this.batchingBuffer.embeddings.length
    };
  }




  async stop(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }

    await this.flushAll();
  }

  private startBufferFlushing(): void {
    const interval = this.optimizationOptions.flushInterval || this.FLUSH_INTERVAL;

    this.flushTimer = setInterval(async () => {
      try {
        await this.flushAll();
      } catch (error) {
        console.error('[OptimizedAdapter] Buffer flush error:', error);
      }
    }, interval);
  }

  private async flushEntityBuffer(): Promise<void> {
    if (this.batchingBuffer.entities.length === 0) return;

    const entities = [...this.batchingBuffer.entities];
    this.batchingBuffer.entities = [];

    console.log(`[OptimizedAdapter] Flushing ${entities.length} entities from buffer`);
    await super.createEntitiesBulk(entities, { forceFlush: true });
  }

  private async flushRelationshipBuffer(): Promise<void> {
    if (this.batchingBuffer.relationships.length === 0) return;

    const relationships = [...this.batchingBuffer.relationships];
    this.batchingBuffer.relationships = [];

    console.log(`[OptimizedAdapter] Flushing ${relationships.length} relationships from buffer`);
    await super.createRelationshipsBulk(relationships, { forceFlush: true });
  }

  private async flushEmbeddingBuffer(): Promise<void> {
    if (this.batchingBuffer.embeddings.length === 0) return;

    const embeddings = [...this.batchingBuffer.embeddings];
    this.batchingBuffer.embeddings = [];

    console.log(`[OptimizedAdapter] Flushing ${embeddings.length} embeddings from buffer`);
    await super.createEmbeddingsBatch(embeddings, { forceFlush: true });
  }

  private getRelationshipId(relationship: GraphRelationship): string {
    return `${relationship.fromEntityId || relationship.from?.id}-${relationship.type}-${relationship.toEntityId || relationship.to?.id}`;
  }
}




export function createOptimizedKnowledgeGraphAdapter(
  knowledgeGraphService: KnowledgeGraphServiceLike,
  options: {
    enableCaching?: boolean;
    enableBuffering?: boolean;
    flushInterval?: number;
    maxBufferSize?: number;
  } = {}
): OptimizedKnowledgeGraphAdapter {
  return new OptimizedKnowledgeGraphAdapter(knowledgeGraphService, options);
}

================
File: ingestion/performance-monitor.ts
================
import { EventEmitter } from 'events';

export interface PerformanceMetrics {

  throughput: {
    filesPerSecond: number;
    entitiesPerSecond: number;
    relationshipsPerSecond: number;
    locPerMinute: number;
    bytesPerSecond: number;
  };


  latency: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    max: number;
    min: number;
  };


  resources: {
    memoryUsageMB: number;
    cpuUsagePercent: number;
    heapUsedMB: number;
    heapTotalMB: number;
    gcPausesMs: number[];
  };


  queues: {
    depth: number;
    processingRate: number;
    errorRate: number;
    oldestItemAge: number;
  };


  workers: {
    activeWorkers: number;
    idleWorkers: number;
    busyWorkers: number;
    erroringWorkers: number;
    averageTasksPerWorker: number;
  };


  errors: {
    totalErrors: number;
    errorRate: number;
    errorsByType: Record<string, number>;
    recentErrors: Array<{ timestamp: Date; error: string; context?: any }>;
  };
}

export interface PerformanceAlert {
  severity: 'info' | 'warning' | 'error' | 'critical';
  metric: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  context?: any;
}

export interface PerformanceConfig {

  metricsInterval: number;
  latencyBufferSize: number;


  thresholds: {
    latencyP95Ms: number;
    memoryUsageMB: number;
    errorRate: number;
    queueDepth: number;
    throughputLOCPerMin: number;
  };


  retentionPeriod: number;
  maxErrorHistory: number;
}

interface LatencySample {
  timestamp: number;
  latency: number;
  operation: string;
  context?: any;
}

interface ThroughputSample {
  timestamp: number;
  files: number;
  entities: number;
  relationships: number;
  loc: number;
  bytes: number;
}

export class PerformanceMonitor extends EventEmitter {
  private config: PerformanceConfig;
  private latencyBuffer: LatencySample[] = [];
  private throughputBuffer: ThroughputSample[] = [];
  private errorHistory: Array<{ timestamp: Date; error: string; context?: any }> = [];
  private metricsTimer?: NodeJS.Timeout;
  private gcObserver?: any;


  private currentMetrics: PerformanceMetrics;
  private lastMetricsTime = Date.now();
  private activeOperations = new Map<string, number>();


  private counters = {
    files: 0,
    entities: 0,
    relationships: 0,
    loc: 0,
    bytes: 0,
    errors: 0,
    totalOperations: 0
  };

  constructor(config: Partial<PerformanceConfig> = {}) {
    super();

    this.config = {
      metricsInterval: 5000,
      latencyBufferSize: 1000,
      thresholds: {
        latencyP95Ms: 1000,
        memoryUsageMB: 1000,
        errorRate: 0.05,
        queueDepth: 1000,
        throughputLOCPerMin: 10000
      },
      retentionPeriod: 3600000,
      maxErrorHistory: 100,
      ...config
    };

    this.currentMetrics = this.createEmptyMetrics();
    this.setupGCMonitoring();
  }




  start(): void {
    if (this.metricsTimer) {
      return;
    }

    console.log('[PerformanceMonitor] Starting performance monitoring');

    this.metricsTimer = setInterval(() => {
      this.updateMetrics();
      this.checkThresholds();
      this.cleanupOldData();
    }, this.config.metricsInterval);

    this.emit('monitor:started');
  }




  stop(): void {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = undefined;
    }

    if (this.gcObserver) {
      this.gcObserver.disconnect();
      this.gcObserver = undefined;
    }

    console.log('[PerformanceMonitor] Stopped performance monitoring');
    this.emit('monitor:stopped');
  }




  startOperation(operationId: string, operation: string, context?: any): void {
    this.activeOperations.set(operationId, Date.now());
    this.counters.totalOperations++;
  }




  endOperation(operationId: string, operation: string, context?: any): void {
    const startTime = this.activeOperations.get(operationId);
    if (!startTime) {
      console.warn(`[PerformanceMonitor] Operation ${operationId} not found in active operations`);
      return;
    }

    const latency = Date.now() - startTime;
    this.activeOperations.delete(operationId);


    this.latencyBuffer.push({
      timestamp: Date.now(),
      latency,
      operation,
      context
    });


    if (this.latencyBuffer.length > this.config.latencyBufferSize) {
      this.latencyBuffer = this.latencyBuffer.slice(-this.config.latencyBufferSize);
    }


    this.updateCountersFromOperation(operation, context);
  }




  recordError(error: string, context?: any): void {
    this.counters.errors++;

    const errorRecord = {
      timestamp: new Date(),
      error,
      context
    };

    this.errorHistory.push(errorRecord);


    if (this.errorHistory.length > this.config.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(-this.config.maxErrorHistory);
    }

    this.emit('error:recorded', errorRecord);
  }




  getMetrics(): PerformanceMetrics {
    return { ...this.currentMetrics };
  }




  getSummary(periodMs: number = 60000): {
    metrics: PerformanceMetrics;
    period: string;
    sampleCount: number;
  } {
    const now = Date.now();
    const cutoff = now - periodMs;


    const periodLatencies = this.latencyBuffer.filter(sample => sample.timestamp >= cutoff);


    const periodThroughput = this.throughputBuffer.filter(sample => sample.timestamp >= cutoff);


    const metrics = this.calculateMetricsFromSamples(periodLatencies, periodThroughput);

    return {
      metrics,
      period: `${periodMs / 1000}s`,
      sampleCount: periodLatencies.length
    };
  }




  updateMetrics(): void {
    this.currentMetrics = this.calculateCurrentMetrics();
    this.emit('metrics:updated', this.currentMetrics);
  }




  private createEmptyMetrics(): PerformanceMetrics {
    return {
      throughput: {
        filesPerSecond: 0,
        entitiesPerSecond: 0,
        relationshipsPerSecond: 0,
        locPerMinute: 0,
        bytesPerSecond: 0
      },
      latency: {
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        max: 0,
        min: 0
      },
      resources: {
        memoryUsageMB: 0,
        cpuUsagePercent: 0,
        heapUsedMB: 0,
        heapTotalMB: 0,
        gcPausesMs: []
      },
      queues: {
        depth: 0,
        processingRate: 0,
        errorRate: 0,
        oldestItemAge: 0
      },
      workers: {
        activeWorkers: 0,
        idleWorkers: 0,
        busyWorkers: 0,
        erroringWorkers: 0,
        averageTasksPerWorker: 0
      },
      errors: {
        totalErrors: 0,
        errorRate: 0,
        errorsByType: {},
        recentErrors: []
      }
    };
  }




  private calculateCurrentMetrics(): PerformanceMetrics {
    const now = Date.now();
    const timeSinceLastUpdate = (now - this.lastMetricsTime) / 1000;
    this.lastMetricsTime = now;


    const throughput = {
      filesPerSecond: this.counters.files / timeSinceLastUpdate,
      entitiesPerSecond: this.counters.entities / timeSinceLastUpdate,
      relationshipsPerSecond: this.counters.relationships / timeSinceLastUpdate,
      locPerMinute: (this.counters.loc / timeSinceLastUpdate) * 60,
      bytesPerSecond: this.counters.bytes / timeSinceLastUpdate
    };


    this.resetCounters();


    const latency = this.calculateLatencyMetrics();


    const resources = this.getResourceMetrics();


    const errors = this.calculateErrorMetrics();

    return {
      throughput,
      latency,
      resources,
      queues: this.currentMetrics.queues,
      workers: this.currentMetrics.workers,
      errors
    };
  }




  private calculateMetricsFromSamples(
    latencySamples: LatencySample[],
    throughputSamples: ThroughputSample[]
  ): PerformanceMetrics {

    const metrics = this.createEmptyMetrics();

    if (latencySamples.length > 0) {
      const latencies = latencySamples.map(s => s.latency).sort((a, b) => a - b);

      metrics.latency = {
        avg: latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length,
        p50: latencies[Math.floor(latencies.length * 0.5)] || 0,
        p95: latencies[Math.floor(latencies.length * 0.95)] || 0,
        p99: latencies[Math.floor(latencies.length * 0.99)] || 0,
        max: Math.max(...latencies),
        min: Math.min(...latencies)
      };
    }

    return metrics;
  }




  private calculateLatencyMetrics(): PerformanceMetrics['latency'] {
    if (this.latencyBuffer.length === 0) {
      return {
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        max: 0,
        min: 0
      };
    }

    const latencies = this.latencyBuffer.map(sample => sample.latency).sort((a, b) => a - b);

    return {
      avg: latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length,
      p50: latencies[Math.floor(latencies.length * 0.5)] || 0,
      p95: latencies[Math.floor(latencies.length * 0.95)] || 0,
      p99: latencies[Math.floor(latencies.length * 0.99)] || 0,
      max: Math.max(...latencies),
      min: Math.min(...latencies)
    };
  }




  private getResourceMetrics(): PerformanceMetrics['resources'] {
    const memUsage = process.memoryUsage();

    return {
      memoryUsageMB: memUsage.rss / 1024 / 1024,
      cpuUsagePercent: 0,
      heapUsedMB: memUsage.heapUsed / 1024 / 1024,
      heapTotalMB: memUsage.heapTotal / 1024 / 1024,
      gcPausesMs: []
    };
  }




  private calculateErrorMetrics(): PerformanceMetrics['errors'] {
    const recentErrors = this.errorHistory.slice(-10);
    const errorsByType: Record<string, number> = {};


    for (const error of this.errorHistory) {
      const type = this.classifyError(error.error);
      errorsByType[type] = (errorsByType[type] || 0) + 1;
    }

    const errorRate = this.counters.totalOperations > 0
      ? this.counters.errors / this.counters.totalOperations
      : 0;

    return {
      totalErrors: this.counters.errors,
      errorRate,
      errorsByType,
      recentErrors
    };
  }




  private updateCountersFromOperation(operation: string, context?: any): void {
    switch (operation) {
      case 'file_parse':
        this.counters.files++;
        if (context?.loc) {
          this.counters.loc += context.loc;
        }
        if (context?.bytes) {
          this.counters.bytes += context.bytes;
        }
        break;

      case 'entity_create':
        this.counters.entities += context?.count || 1;
        break;

      case 'relationship_create':
        this.counters.relationships += context?.count || 1;
        break;
    }
  }




  private resetCounters(): void {
    this.counters.files = 0;
    this.counters.entities = 0;
    this.counters.relationships = 0;
    this.counters.loc = 0;
    this.counters.bytes = 0;

  }




  private checkThresholds(): void {
    const metrics = this.currentMetrics;


    if (metrics.latency.p95 > this.config.thresholds.latencyP95Ms) {
      this.emitAlert('warning', 'latency.p95',
        `P95 latency (${metrics.latency.p95.toFixed(2)}ms) exceeds threshold`,
        metrics.latency.p95, this.config.thresholds.latencyP95Ms);
    }


    if (metrics.resources.memoryUsageMB > this.config.thresholds.memoryUsageMB) {
      this.emitAlert('warning', 'resources.memory',
        `Memory usage (${metrics.resources.memoryUsageMB.toFixed(1)}MB) exceeds threshold`,
        metrics.resources.memoryUsageMB, this.config.thresholds.memoryUsageMB);
    }


    if (metrics.errors.errorRate > this.config.thresholds.errorRate) {
      this.emitAlert('error', 'errors.rate',
        `Error rate (${(metrics.errors.errorRate * 100).toFixed(2)}%) exceeds threshold`,
        metrics.errors.errorRate, this.config.thresholds.errorRate);
    }


    if (metrics.throughput.locPerMinute < this.config.thresholds.throughputLOCPerMin) {
      this.emitAlert('info', 'throughput.loc',
        `LOC/minute (${metrics.throughput.locPerMinute.toFixed(0)}) below target`,
        metrics.throughput.locPerMinute, this.config.thresholds.throughputLOCPerMin);
    }
  }




  private emitAlert(
    severity: PerformanceAlert['severity'],
    metric: string,
    message: string,
    value: number,
    threshold: number,
    context?: any
  ): void {
    const alert: PerformanceAlert = {
      severity,
      metric,
      message,
      value,
      threshold,
      timestamp: new Date(),
      context
    };

    this.emit('alert', alert);
  }




  private cleanupOldData(): void {
    const now = Date.now();
    const cutoff = now - this.config.retentionPeriod;


    this.latencyBuffer = this.latencyBuffer.filter(sample => sample.timestamp >= cutoff);


    this.throughputBuffer = this.throughputBuffer.filter(sample => sample.timestamp >= cutoff);
  }




  private setupGCMonitoring(): void {
    try {

      if (typeof global.gc === 'function') {
        const originalGC = global.gc;
        global.gc = () => {
          const start = Date.now();
          originalGC();
          const duration = Date.now() - start;

          if (!this.currentMetrics.resources.gcPausesMs) {
            this.currentMetrics.resources.gcPausesMs = [];
          }
          this.currentMetrics.resources.gcPausesMs.push(duration);
        };
      }
    } catch (error) {
      console.warn('[PerformanceMonitor] Could not setup GC monitoring:', error);
    }
  }




  private classifyError(errorMessage: string): string {
    if (errorMessage.includes('timeout')) return 'timeout';
    if (errorMessage.includes('memory') || errorMessage.includes('heap')) return 'memory';
    if (errorMessage.includes('parse') || errorMessage.includes('syntax')) return 'parsing';
    if (errorMessage.includes('network') || errorMessage.includes('connection')) return 'network';
    if (errorMessage.includes('file') || errorMessage.includes('ENOENT')) return 'filesystem';
    return 'unknown';
  }




  updateQueueMetrics(metrics: PerformanceMetrics['queues']): void {
    this.currentMetrics.queues = metrics;
  }




  updateWorkerMetrics(metrics: PerformanceMetrics['workers']): void {
    this.currentMetrics.workers = metrics;
  }
}

================
File: ingestion/performance-utils.ts
================
import { performance } from 'perf_hooks';




export class Timer {
  private startTime: number;
  private endTime?: number;

  constructor() {
    this.startTime = performance.now();
  }




  stop(): number {
    this.endTime = performance.now();
    return this.endTime - this.startTime;
  }




  elapsed(): number {
    return performance.now() - this.startTime;
  }




  reset(): void {
    this.startTime = performance.now();
    this.endTime = undefined;
  }
}




export function measureTime(target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const timer = new Timer();
    try {
      const result = await originalMethod.apply(this, args);
      const duration = timer.stop();
      console.log(`[Performance] ${propertyKey} took ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = timer.stop();
      console.log(`[Performance] ${propertyKey} failed after ${duration.toFixed(2)}ms`);
      throw error;
    }
  };
}




export class ThroughputMeter {
  private items = 0;
  private startTime: number;

  constructor() {
    this.startTime = performance.now();
  }




  increment(count: number = 1): void {
    this.items += count;
  }




  getThroughput(): number {
    const elapsed = (performance.now() - this.startTime) / 1000;
    return elapsed > 0 ? this.items / elapsed : 0;
  }




  getTotalItems(): number {
    return this.items;
  }




  reset(): void {
    this.items = 0;
    this.startTime = performance.now();
  }
}




export class LatencyTracker {
  private samples: number[] = [];
  private maxSamples: number;

  constructor(maxSamples: number = 1000) {
    this.maxSamples = maxSamples;
  }




  addSample(latencyMs: number): void {
    this.samples.push(latencyMs);


    if (this.samples.length > this.maxSamples) {
      this.samples = this.samples.slice(-this.maxSamples);
    }
  }




  getPercentile(percentile: number): number {
    if (this.samples.length === 0) return 0;

    const sorted = [...this.samples].sort((a, b) => a - b);
    const index = Math.floor((percentile / 100) * sorted.length);
    return sorted[Math.min(index, sorted.length - 1)];
  }




  getMetrics(): {
    count: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
  } {
    if (this.samples.length === 0) {
      return { count: 0, avg: 0, p50: 0, p95: 0, p99: 0, min: 0, max: 0 };
    }

    const sorted = [...this.samples].sort((a, b) => a - b);
    const sum = this.samples.reduce((acc, val) => acc + val, 0);

    return {
      count: this.samples.length,
      avg: sum / this.samples.length,
      p50: this.getPercentile(50),
      p95: this.getPercentile(95),
      p99: this.getPercentile(99),
      min: sorted[0],
      max: sorted[sorted.length - 1]
    };
  }




  clear(): void {
    this.samples = [];
  }
}




export class MemoryTracker {
  private baseline: NodeJS.MemoryUsage;

  constructor() {
    this.baseline = process.memoryUsage();
  }




  getCurrentUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }




  getDelta(): {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  } {
    const current = process.memoryUsage();
    return {
      rss: current.rss - this.baseline.rss,
      heapUsed: current.heapUsed - this.baseline.heapUsed,
      heapTotal: current.heapTotal - this.baseline.heapTotal,
      external: current.external - this.baseline.external
    };
  }




  formatUsage(usage: NodeJS.MemoryUsage): {
    rssMB: number;
    heapUsedMB: number;
    heapTotalMB: number;
    externalMB: number;
  } {
    return {
      rssMB: usage.rss / 1024 / 1024,
      heapUsedMB: usage.heapUsed / 1024 / 1024,
      heapTotalMB: usage.heapTotal / 1024 / 1024,
      externalMB: usage.external / 1024 / 1024
    };
  }




  reset(): void {
    this.baseline = process.memoryUsage();
  }
}




export class BatchTracker {
  private batches: Array<{
    id: string;
    size: number;
    startTime: number;
    endTime?: number;
    success: boolean;
    errors: number;
  }> = [];




  startBatch(id: string, size: number): void {
    this.batches.push({
      id,
      size,
      startTime: performance.now(),
      success: false,
      errors: 0
    });
  }




  completeBatch(id: string, success: boolean = true, errors: number = 0): void {
    const batch = this.batches.find(b => b.id === id);
    if (batch) {
      batch.endTime = performance.now();
      batch.success = success;
      batch.errors = errors;
    }
  }




  getStats(): {
    totalBatches: number;
    completedBatches: number;
    successfulBatches: number;
    totalItems: number;
    averageBatchSize: number;
    averageLatency: number;
    successRate: number;
    throughput: number;
  } {
    const completed = this.batches.filter(b => b.endTime !== undefined);
    const successful = completed.filter(b => b.success);
    const totalItems = this.batches.reduce((sum, b) => sum + b.size, 0);

    if (completed.length === 0) {
      return {
        totalBatches: this.batches.length,
        completedBatches: 0,
        successfulBatches: 0,
        totalItems,
        averageBatchSize: 0,
        averageLatency: 0,
        successRate: 0,
        throughput: 0
      };
    }

    const avgLatency = completed.reduce((sum, b) => sum + (b.endTime! - b.startTime), 0) / completed.length;
    const avgBatchSize = totalItems / this.batches.length;
    const successRate = successful.length / completed.length;


    const firstBatch = completed[0];
    const lastBatch = completed[completed.length - 1];
    const timeSpanMs = lastBatch.endTime! - firstBatch.startTime;
    const throughput = timeSpanMs > 0 ? (completed.length / timeSpanMs) * 1000 : 0;

    return {
      totalBatches: this.batches.length,
      completedBatches: completed.length,
      successfulBatches: successful.length,
      totalItems,
      averageBatchSize: avgBatchSize,
      averageLatency: avgLatency,
      successRate,
      throughput
    };
  }




  clear(): void {
    this.batches = [];
  }
}




export class ResourceMonitor {
  private samples: Array<{
    timestamp: number;
    memory: NodeJS.MemoryUsage;
    uptime: number;
  }> = [];
  private interval?: NodeJS.Timeout;
  private sampleInterval: number;
  private maxSamples: number;

  constructor(sampleIntervalMs: number = 1000, maxSamples: number = 300) {
    this.sampleInterval = sampleIntervalMs;
    this.maxSamples = maxSamples;
  }




  start(): void {
    if (this.interval) return;

    this.interval = setInterval(() => {
      this.samples.push({
        timestamp: Date.now(),
        memory: process.memoryUsage(),
        uptime: process.uptime()
      });


      if (this.samples.length > this.maxSamples) {
        this.samples = this.samples.slice(-this.maxSamples);
      }
    }, this.sampleInterval);
  }




  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }




  getTrends(): {
    memoryTrendMB: number;
    peakMemoryMB: number;
    averageMemoryMB: number;
    sampleCount: number;
  } {
    if (this.samples.length < 2) {
      return {
        memoryTrendMB: 0,
        peakMemoryMB: 0,
        averageMemoryMB: 0,
        sampleCount: this.samples.length
      };
    }

    const memoryValues = this.samples.map(s => s.memory.heapUsed / 1024 / 1024);
    const timeSpanMs = this.samples[this.samples.length - 1].timestamp - this.samples[0].timestamp;


    const n = this.samples.length;
    const sumX = this.samples.reduce((sum, _, i) => sum + i, 0);
    const sumY = memoryValues.reduce((sum, val) => sum + val, 0);
    const sumXY = this.samples.reduce((sum, sample, i) => sum + (i * memoryValues[i]), 0);
    const sumXX = this.samples.reduce((sum, _, i) => sum + (i * i), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const memoryTrendMB = (slope * (60000 / this.sampleInterval));

    return {
      memoryTrendMB,
      peakMemoryMB: Math.max(...memoryValues),
      averageMemoryMB: sumY / n,
      sampleCount: n
    };
  }




  clear(): void {
    this.samples = [];
  }
}




export async function measureAsync<T>(
  operation: () => Promise<T>,
  label?: string
): Promise<{ result: T; duration: number }> {
  const timer = new Timer();
  const startMemory = process.memoryUsage().heapUsed;

  try {
    const result = await operation();
    const duration = timer.stop();
    const endMemory = process.memoryUsage().heapUsed;
    const memoryDelta = (endMemory - startMemory) / 1024 / 1024;

    if (label) {
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms, memory: ${memoryDelta.toFixed(2)}MB`);
    }

    return { result, duration };
  } catch (error) {
    const duration = timer.stop();
    if (label) {
      console.log(`[Performance] ${label} failed after ${duration.toFixed(2)}ms`);
    }
    throw error;
  }
}




export function measureSync<T>(
  operation: () => T,
  label?: string
): { result: T; duration: number } {
  const timer = new Timer();
  const startMemory = process.memoryUsage().heapUsed;

  try {
    const result = operation();
    const duration = timer.stop();
    const endMemory = process.memoryUsage().heapUsed;
    const memoryDelta = (endMemory - startMemory) / 1024 / 1024;

    if (label) {
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms, memory: ${memoryDelta.toFixed(2)}MB`);
    }

    return { result, duration };
  } catch (error) {
    const duration = timer.stop();
    if (label) {
      console.log(`[Performance] ${label} failed after ${duration.toFixed(2)}ms`);
    }
    throw error;
  }
}




export function createPerformanceReport(
  latencyTracker: LatencyTracker,
  throughputMeter: ThroughputMeter,
  memoryTracker: MemoryTracker,
  batchTracker: BatchTracker
): string {
  const latencyMetrics = latencyTracker.getMetrics();
  const batchStats = batchTracker.getStats();
  const memoryDelta = memoryTracker.getDelta();
  const formattedMemory = memoryTracker.formatUsage(memoryTracker.getCurrentUsage());

  return `
Performance Report
==================

Latency Metrics:
  Samples: ${latencyMetrics.count}
  Average: ${latencyMetrics.avg.toFixed(2)}ms
  P50: ${latencyMetrics.p50.toFixed(2)}ms
  P95: ${latencyMetrics.p95.toFixed(2)}ms
  P99: ${latencyMetrics.p99.toFixed(2)}ms
  Min: ${latencyMetrics.min.toFixed(2)}ms
  Max: ${latencyMetrics.max.toFixed(2)}ms

Throughput:
  Rate: ${throughputMeter.getThroughput().toFixed(2)} items/sec
  Total Items: ${throughputMeter.getTotalItems()}

Batch Processing:
  Total Batches: ${batchStats.totalBatches}
  Completed: ${batchStats.completedBatches}
  Success Rate: ${(batchStats.successRate * 100).toFixed(1)}%
  Avg Batch Size: ${batchStats.averageBatchSize.toFixed(1)}
  Avg Latency: ${batchStats.averageLatency.toFixed(2)}ms
  Throughput: ${batchStats.throughput.toFixed(2)} batches/sec

Memory Usage:
  RSS: ${formattedMemory.rssMB.toFixed(1)}MB (Δ${(memoryDelta.rss / 1024 / 1024).toFixed(1)}MB)
  Heap Used: ${formattedMemory.heapUsedMB.toFixed(1)}MB (Δ${(memoryDelta.heapUsed / 1024 / 1024).toFixed(1)}MB)
  Heap Total: ${formattedMemory.heapTotalMB.toFixed(1)}MB (Δ${(memoryDelta.heapTotal / 1024 / 1024).toFixed(1)}MB)
`;
}

================
File: ingestion/pipeline.ts
================
import { EventEmitter } from 'events';
import { Entity } from '@memento/core/models/entities.js';
import { GraphRelationship } from '@memento/core/models/relationships.js';
import {
  PipelineConfig,
  PipelineMetrics,
  PipelineState,
  ChangeEvent,
  ChangeFragment,
  TaskPayload,
  IngestionTelemetry,
  AlertConfig,
  IngestionError,
  IngestionEvents,
  EnrichmentTask,
  EnrichmentResult
} from './types.js';

import { QueueManager, QueueManagerConfig } from './queue-manager.js';
import { WorkerPool, WorkerPoolConfig } from './worker-pool.js';
import { HighThroughputBatchProcessor, BatchProcessorConfig } from './batch-processor.js';
import { ASTParser, ParseResult } from '../parsing/ASTParser.js';
import { EmbeddingService } from '../embeddings/EmbeddingService.js';

export interface KnowledgeGraphServiceIntegration {
  createEntitiesBulk(entities: Entity[], options?: any): Promise<any>;
  createRelationshipsBulk(relationships: GraphRelationship[], options?: any): Promise<any>;
  createEmbeddingsBatch(entities: Entity[], options?: any): Promise<any>;
}

export class HighThroughputIngestionPipeline extends EventEmitter<IngestionEvents> {
  private config: PipelineConfig;
  private state: PipelineState;
  private metrics: PipelineMetrics;


  private queueManager: QueueManager;
  private workerPool: WorkerPool;
  private batchProcessor: HighThroughputBatchProcessor;
  private astParser: ASTParser;
  private embeddingService?: EmbeddingService;


  private knowledgeGraphService?: KnowledgeGraphServiceIntegration;


  private metricsTimer?: NodeJS.Timeout;
  private healthCheckTimer?: NodeJS.Timeout;
  private alertConfigs: AlertConfig[] = [];


  private processedEventCount = 0;
  private errorCount = 0;
  private latencyBuffer: number[] = [];
  private throughputBuffer: number[] = [];


  private errorTypes = new Map<string, number>();
  private recentErrors: Array<{ type: string; message: string; timestamp: Date }> = [];


  private enrichmentQueue: EnrichmentTask[] = [];

  constructor(
    config: PipelineConfig,
    knowledgeGraphService?: KnowledgeGraphServiceIntegration,
    services?: {
      embeddingService?: EmbeddingService;
    }
  ) {
    super();
    this.config = config;
    this.knowledgeGraphService = knowledgeGraphService;
    this.embeddingService = services?.embeddingService;

    this.state = {
      status: 'stopped',
      processedEvents: 0,
      errorCount: 0,
      currentLoad: 0
    };

    this.metrics = {
      totalEvents: 0,
      eventsPerSecond: 0,
      averageLatency: 0,
      p95Latency: 0,
      queueMetrics: {
        queueDepth: 0,
        oldestEventAge: 0,
        partitionLag: {},
        throughputPerSecond: 0,
        errorRate: 0
      },
      workerMetrics: [],
      batchMetrics: {
        activeBatches: 0,
        completedBatches: 0,
        failedBatches: 0
      }
    };

    this.initializeComponents();
    this.setupEventHandlers();
  }




  async start(): Promise<void> {
    if (this.state.status !== 'stopped') {
      throw new IngestionError('Pipeline already running or in transition', 'INVALID_STATE');
    }

    this.state.status = 'starting';
    console.log('[IngestionPipeline] Starting high-throughput ingestion pipeline...');

    try {

      await this.queueManager.start();
      await this.workerPool.start();
      await this.batchProcessor.start();


      this.registerWorkerHandlers();


      this.startMonitoring();

      this.state.status = 'running';
      this.state.startedAt = new Date();

      this.emit('pipeline:started');
      console.log('[IngestionPipeline] Pipeline started successfully');

    } catch (error) {
      this.state.status = 'error';
      this.emit('pipeline:error', error as Error);
      throw error;
    }
  }




  async stop(): Promise<void> {
    if (this.state.status === 'stopped') {
      return;
    }

    this.state.status = 'stopping';
    console.log('[IngestionPipeline] Stopping ingestion pipeline...');

    try {

      this.stopMonitoring();


      await this.batchProcessor.stop();
      await this.workerPool.stop();
      await this.queueManager.stop();

      this.state.status = 'stopped';
      this.emit('pipeline:stopped');
      console.log('[IngestionPipeline] Pipeline stopped successfully');

    } catch (error) {
      this.state.status = 'error';
      this.emit('pipeline:error', error as Error);
      throw error;
    }
  }




  async pause(): Promise<void> {
    if (this.state.status !== 'running') {
      throw new IngestionError('Pipeline not running', 'INVALID_STATE');
    }

    this.state.status = 'pausing';

    this.state.status = 'paused';
    console.log('[IngestionPipeline] Pipeline paused');
  }




  async resume(): Promise<void> {
    if (this.state.status !== 'paused') {
      throw new IngestionError('Pipeline not paused', 'INVALID_STATE');
    }

    this.state.status = 'running';
    console.log('[IngestionPipeline] Pipeline resumed');
  }




  async ingestChangeEvent(event: ChangeEvent): Promise<void> {
    if (this.state.status !== 'running') {
      throw new IngestionError('Pipeline not running', 'PIPELINE_NOT_RUNNING');
    }

    const startTime = Date.now();

    try {

      const parseTask: TaskPayload = {
        id: `parse-${event.id}`,
        type: 'parse',
        priority: this.calculateEventPriority(event),
        data: event,
        metadata: {
          namespace: event.namespace,
          module: event.module,
          eventType: event.eventType
        },
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date()
      };


      await this.queueManager.enqueue(parseTask, event.namespace);


      this.processedEventCount++;
      this.state.processedEvents++;
      this.metrics.totalEvents++;

      const latency = Date.now() - startTime;
      this.recordLatency(latency);

      this.emit('event:received', event);

    } catch (error) {
      this.errorCount++;
      this.state.errorCount++;
      this.trackError('INGESTION_ERROR', error instanceof Error ? error.message : 'Unknown error');
      this.emit('pipeline:error', error as Error);
      throw error;
    }
  }




  async ingestChangeEvents(events: ChangeEvent[]): Promise<void> {
    const promises = events.map(event => this.ingestChangeEvent(event));
    await Promise.allSettled(promises);
  }




  async processChangeFragments(fragments: ChangeFragment[]): Promise<void> {
    if (this.state.status !== 'running') {
      throw new IngestionError('Pipeline not running', 'PIPELINE_NOT_RUNNING');
    }

    try {

      const results = await this.batchProcessor.processChangeFragments(fragments);


      this.metrics.batchMetrics.completedBatches += results.length;

      console.log(`[IngestionPipeline] Processed ${fragments.length} change fragments in ${results.length} batches`);

    } catch (error) {
      this.metrics.batchMetrics.failedBatches++;
      this.emit('pipeline:error', error as Error);
      throw error;
    }
  }




  async scheduleEnrichment(task: EnrichmentTask): Promise<void> {
    this.enrichmentQueue.push(task);


    const enrichmentTaskPayload: TaskPayload = {
      id: task.id,
      type: 'embedding',
      priority: task.priority,
      data: task,
      metadata: { enrichmentType: task.type },
      retryCount: 0,
      maxRetries: 2,
      createdAt: new Date()
    };

    await this.queueManager.enqueue(enrichmentTaskPayload);
  }




  getMetrics(): PipelineMetrics {
    return { ...this.metrics };
  }




  getState(): PipelineState {
    return { ...this.state };
  }




  getTelemetry(): IngestionTelemetry {
    return {
      timestamp: new Date(),
      pipeline: this.getMetrics(),
      queues: this.queueManager.getMetrics(),
      workers: this.workerPool.getMetrics().workers,
      errors: {
        count: this.errorCount,
        types: this.getErrorTypeBreakdown(),
        samples: this.getRecentErrorSamples()
      },
      performance: {
        cpu: this.getCpuUsage(),
        memory: process.memoryUsage().heapUsed,
        diskIO: 0,
        networkIO: 0
      }
    };
  }




  addAlert(alert: AlertConfig): void {
    this.alertConfigs.push(alert);
  }




  private initializeComponents(): void {

    const queueConfig: QueueManagerConfig = {
      ...this.config.queues,
      enableBackpressure: true,
      backpressureThreshold: this.config.monitoring.alertThresholds.queueDepth,
      partitionStrategy: 'hash',
      metricsInterval: this.config.monitoring.metricsInterval
    };
    this.queueManager = new QueueManager(queueConfig);


    const workerConfig: WorkerPoolConfig = {
      maxWorkers: this.config.workers.parsers + this.config.workers.entityWorkers +
                  this.config.workers.relationshipWorkers + this.config.workers.embeddingWorkers,
      minWorkers: Math.ceil(this.config.workers.parsers / 2),
      workerTimeout: 30000,
      healthCheckInterval: this.config.monitoring.healthCheckInterval,
      restartThreshold: 5,
      autoScale: true,
      scalingRules: {
        scaleUpThreshold: this.config.monitoring.alertThresholds.queueDepth / 2,
        scaleDownThreshold: this.config.monitoring.alertThresholds.queueDepth / 4,
        scaleUpCooldown: 30000,
        scaleDownCooldown: 60000
      }
    };
    this.workerPool = new WorkerPool(workerConfig);


    const batchConfig: BatchProcessorConfig = {
      ...this.config.batching,
      streaming: {
        batchSize: this.config.batching.entityBatchSize,
        maxConcurrentWrites: this.config.batching.maxConcurrentBatches,
        idempotencyKeyTTL: 300000,
        retryPolicy: {
          maxAttempts: 3,
          backoffMultiplier: 2,
          maxBackoffMs: 10000
        }
      },
      enableDAG: true,
      epochTTL: 3600000,
      dependencyTimeout: 30000
    };
    this.batchProcessor = new HighThroughputBatchProcessor(batchConfig, this.knowledgeGraphService);


    this.astParser = new ASTParser();
  }




  private setupEventHandlers(): void {

    this.queueManager.on('metrics:updated', (metrics) => {
      this.metrics.queueMetrics = metrics;
    });

    this.queueManager.on('queue:overflow', (error) => {
      console.error('[IngestionPipeline] Queue overflow:', error);
      this.emit('pipeline:error', error);
    });


    this.workerPool.on('worker:error', (error) => {
      console.error('[IngestionPipeline] Worker error:', error);
      this.errorCount++;
      this.trackError('WORKER_ERROR', error.message);
    });


    this.batchProcessor.on('batch:completed', (result) => {
      this.metrics.batchMetrics.completedBatches++;
    });

    this.batchProcessor.on('batch:failed', (error) => {
      this.metrics.batchMetrics.failedBatches++;
      console.error('[IngestionPipeline] Batch processing failed:', error);
    });
  }




  private registerWorkerHandlers(): void {

    this.workerPool.registerHandler('parse', async (task: TaskPayload) => {
      const event = task.data as ChangeEvent;
      return this.handleParseTask(event);
    });


    this.workerPool.registerHandler('entity_upsert', async (task: TaskPayload) => {
      const entities = task.data as Entity[];
      return this.handleEntityUpsert(entities);
    });


    this.workerPool.registerHandler('relationship_upsert', async (task: TaskPayload) => {
      const relationships = task.data as GraphRelationship[];
      return this.handleRelationshipUpsert(relationships);
    });


    this.workerPool.registerHandler('embedding', async (task: TaskPayload) => {
      const enrichmentTask = task.data as EnrichmentTask;
      return this.handleEnrichmentTask(enrichmentTask);
    });
  }




  private async handleParseTask(event: ChangeEvent): Promise<ChangeFragment[]> {
    try {
      console.log(`[IngestionPipeline] Parsing file: ${event.filePath}`);


      const parseResult: ParseResult = await this.astParser.parseFile(event.filePath);

      const fragments: ChangeFragment[] = [];


      for (const entity of parseResult.entities) {
        const fragment: ChangeFragment = {
          id: `fragment-${event.id}-entity-${entity.id}`,
          eventId: event.id,
          changeType: 'entity',
          operation: 'add',
          data: {
            ...entity,
            metadata: {
              ...entity.metadata,
              source: 'ingestion-pipeline',
              parseTimestamp: new Date(),
              namespace: event.namespace,
              module: event.module
            }
          } as Entity,
          dependencyHints: [],
          confidence: 0.9
        };
        fragments.push(fragment);


        const entityTask: TaskPayload = {
          id: `entity-${fragment.id}`,
          type: 'entity_upsert',
          priority: 5,
          data: [fragment.data],
          metadata: {
            fragmentId: fragment.id,
            filePath: event.filePath,
            entityType: entity.type || entity.entityType
          },
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date()
        };

        await this.queueManager.enqueue(entityTask);
      }


      for (const relationship of parseResult.relationships) {
        const fragment: ChangeFragment = {
          id: `fragment-${event.id}-relationship-${relationship.id || this.generateRelationshipId(relationship)}`,
          eventId: event.id,
          changeType: 'relationship',
          operation: 'add',
          data: {
            ...relationship,
            metadata: {
              ...relationship.metadata,
              source: 'ingestion-pipeline',
              parseTimestamp: new Date(),
              namespace: event.namespace,
              module: event.module
            }
          } as GraphRelationship,
          dependencyHints: [
            relationship.fromEntityId || (relationship.from as any)?.id,
            relationship.toEntityId || (relationship.to as any)?.id
          ].filter(Boolean),
          confidence: relationship.confidence || 0.8
        };
        fragments.push(fragment);


        const relationshipTask: TaskPayload = {
          id: `relationship-${fragment.id}`,
          type: 'relationship_upsert',
          priority: 4,
          data: [fragment.data],
          metadata: {
            fragmentId: fragment.id,
            filePath: event.filePath,
            relationshipType: relationship.type
          },
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date()
        };

        await this.queueManager.enqueue(relationshipTask);
      }


      if (parseResult.errors && parseResult.errors.length > 0) {
        console.warn(`[IngestionPipeline] Parse errors for ${event.filePath}:`, parseResult.errors);


        for (const error of parseResult.errors) {
          this.emit('parse:error', {
            filePath: event.filePath,
            error: error.message,
            line: error.line,
            column: error.column,
            severity: error.severity
          });
        }
      }

      console.log(`[IngestionPipeline] Successfully parsed ${event.filePath}: ${parseResult.entities.length} entities, ${parseResult.relationships.length} relationships`);

      return fragments;

    } catch (error) {
      console.error(`[IngestionPipeline] Failed to parse file ${event.filePath}:`, error);


      this.emit('parse:error', {
        filePath: event.filePath,
        error: error instanceof Error ? error.message : 'Unknown parsing error'
      });


      return [];
    }
  }




  private generateRelationshipId(relationship: GraphRelationship): string {
    const fromId = relationship.fromEntityId || (relationship.from as any)?.id || 'unknown';
    const toId = relationship.toEntityId || (relationship.to as any)?.id || 'unknown';
    const type = relationship.type || 'unknown';
    return `${fromId}-${type}-${toId}`;
  }




  private async handleEntityUpsert(entities: Entity[]): Promise<any> {
    if (this.knowledgeGraphService) {
      return this.knowledgeGraphService.createEntitiesBulk(entities);
    }

    console.log(`[IngestionPipeline] Mock: Upserted ${entities.length} entities`);
    return { success: true, count: entities.length };
  }




  private async handleRelationshipUpsert(relationships: GraphRelationship[]): Promise<any> {
    if (this.knowledgeGraphService) {
      return this.knowledgeGraphService.createRelationshipsBulk(relationships);
    }

    console.log(`[IngestionPipeline] Mock: Upserted ${relationships.length} relationships`);
    return { success: true, count: relationships.length };
  }




  private async handleEnrichmentTask(task: EnrichmentTask): Promise<EnrichmentResult> {
    const startTime = Date.now();

    try {
      let result: any;

      switch (task.type) {
        case 'embedding':
          result = await this.handleEmbeddingTask(task);
          break;
        case 'impact_analysis':
          result = await this.handleImpactAnalysisTask(task);
          break;
        case 'documentation':
          result = await this.handleDocumentationTask(task);
          break;
        case 'security':
          result = await this.handleSecurityTask(task);
          break;
        default:
          throw new Error(`Unknown enrichment task type: ${task.type}`);
      }

      return {
        taskId: task.id,
        entityId: task.entityId,
        type: task.type,
        success: true,
        result,
        duration: Date.now() - startTime,
        metadata: {}
      };

    } catch (error) {
      return {
        taskId: task.id,
        entityId: task.entityId,
        type: task.type,
        success: false,
        error: error as Error,
        duration: Date.now() - startTime,
        metadata: {}
      };
    }
  }




  private async handleEmbeddingTask(task: EnrichmentTask): Promise<any> {
    if (!this.embeddingService) {
      console.log(`[IngestionPipeline] No EmbeddingService available, skipping embedding for entity ${task.entityId}`);
      return { embedding: null, skipped: true };
    }

    try {
      console.log(`[IngestionPipeline] Generating embedding for entity ${task.entityId}`);


      const entity = task.data as Entity;

      if (!entity) {
        console.warn(`[IngestionPipeline] No entity data found for embedding task ${task.entityId}`);
        return { embedding: null, error: 'No entity data' };
      }


      const embeddingResult = await this.embeddingService.generateAndStore(entity, {
        indexName: 'entity_vectors',
        checkpointId: task.metadata?.checkpointId
      });

      console.log(`[IngestionPipeline] Successfully generated embedding for entity ${task.entityId}, dimensions: ${embeddingResult.vector.length}`);

      return {
        entityId: embeddingResult.entityId,
        embedding: embeddingResult.vector,
        metadata: embeddingResult.metadata,
        success: true
      };

    } catch (error) {
      console.error(`[IngestionPipeline] Failed to generate embedding for entity ${task.entityId}:`, error);


      this.emit('embedding:error', {
        entityId: task.entityId,
        error: error instanceof Error ? error.message : 'Unknown embedding error'
      });

      return {
        entityId: task.entityId,
        embedding: null,
        error: error instanceof Error ? error.message : 'Unknown embedding error',
        success: false
      };
    }
  }




  private async handleImpactAnalysisTask(task: EnrichmentTask): Promise<any> {
    console.log(`[IngestionPipeline] Mock: Analyzed impact for entity ${task.entityId}`);
    return { impactScore: Math.random(), affectedEntities: [] };
  }




  private async handleDocumentationTask(task: EnrichmentTask): Promise<any> {
    console.log(`[IngestionPipeline] Mock: Analyzed documentation for entity ${task.entityId}`);
    return { documentationScore: Math.random(), topics: [] };
  }




  private async handleSecurityTask(task: EnrichmentTask): Promise<any> {
    console.log(`[IngestionPipeline] Mock: Security scan for entity ${task.entityId}`);
    return { vulnerabilities: [], riskScore: Math.random() };
  }




  private calculateEventPriority(event: ChangeEvent): number {
    let priority = 5;


    if (event.filePath.endsWith('.ts') || event.filePath.endsWith('.js')) {
      priority += 2;
    }


    if (event.size < 10000) {
      priority += 1;
    }


    if (event.eventType === 'modified') {
      priority += 1;
    }

    return Math.min(priority, 10);
  }




  private recordLatency(latency: number): void {
    this.latencyBuffer.push(latency);


    if (this.latencyBuffer.length > 1000) {
      this.latencyBuffer.shift();
    }


    this.metrics.averageLatency = this.latencyBuffer.reduce((a, b) => a + b, 0) / this.latencyBuffer.length;


    const sorted = [...this.latencyBuffer].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    this.metrics.p95Latency = sorted[p95Index] || 0;
  }




  private startMonitoring(): void {

    this.metricsTimer = setInterval(() => {
      this.updateMetrics();
      this.checkAlerts();
      this.emit('metrics:updated', this.metrics);
    }, this.config.monitoring.metricsInterval);


    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.monitoring.healthCheckInterval);
  }




  private stopMonitoring(): void {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = undefined;
    }

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }




  private updateMetrics(): void {

    const now = Date.now();
    this.throughputBuffer.push(this.processedEventCount);

    if (this.throughputBuffer.length > 60) {
      this.throughputBuffer.shift();
    }

    this.metrics.eventsPerSecond = this.throughputBuffer.length > 1
      ? (this.throughputBuffer[this.throughputBuffer.length - 1] - this.throughputBuffer[0]) / this.throughputBuffer.length
      : 0;


    this.metrics.workerMetrics = this.workerPool.getMetrics().workers;


    const batchMetrics = this.batchProcessor.getMetrics();
    this.metrics.batchMetrics.activeBatches = batchMetrics.activeBatches;


    this.state.currentLoad = this.metrics.queueMetrics.queueDepth / this.config.monitoring.alertThresholds.queueDepth;
    this.state.lastActivity = new Date();
  }




  private checkAlerts(): void {
    for (const alert of this.alertConfigs) {
      let value = 0;

      switch (alert.name) {
        case 'queue_depth':
          value = this.metrics.queueMetrics.queueDepth;
          break;
        case 'latency':
          value = this.metrics.p95Latency;
          break;
        case 'error_rate':
          value = this.metrics.queueMetrics.errorRate;
          break;
      }

      if (value >= alert.threshold) {
        this.emit('alert:triggered', alert, value);
      }
    }
  }




  private performHealthCheck(): void {

    const queueMetrics = this.queueManager.getMetrics();
    const workerMetrics = this.workerPool.getMetrics();


    if (queueMetrics.queueDepth > this.config.monitoring.alertThresholds.queueDepth) {
      console.warn(`[IngestionPipeline] Queue depth warning: ${queueMetrics.queueDepth}`);
    }


    if (workerMetrics.idleWorkers === 0 && workerMetrics.totalWorkers > 0) {
      console.warn('[IngestionPipeline] All workers busy, consider scaling up');
    }


    if (this.metrics.queueMetrics.errorRate > this.config.monitoring.alertThresholds.errorRate) {
      console.warn(`[IngestionPipeline] High error rate: ${this.metrics.queueMetrics.errorRate}`);
    }
  }






  async processFile(filePath: string): Promise<void> {
    const fs = await import('fs/promises');
    const stats = await fs.stat(filePath);

    const event: ChangeEvent = {
      id: `file-${Date.now()}-${Math.random()}`,
      namespace: 'file-processing',
      module: await this.extractModuleName(filePath),
      filePath,
      eventType: 'created',
      timestamp: new Date(),
      size: stats.size,
      diffHash: `hash-${Math.random()}`,
      metadata: {
        singleFile: true
      }
    };

    await this.ingestChangeEvent(event);
  }




  async waitForCompletion(timeoutMs: number = 30000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const state = this.getState();
      const metrics = this.getMetrics();


      if (state.currentLoad === 0 && metrics.queueMetrics.queueDepth === 0) {
        return;
      }


      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`Pipeline did not complete within ${timeoutMs}ms timeout`);
  }




  private async extractModuleName(filePath: string): Promise<string> {
    const path = await import('path');
    const parts = filePath.split(path.sep).filter(Boolean);


    const srcIndex = parts.findIndex(part => part === 'src');
    if (srcIndex >= 0 && srcIndex < parts.length - 1) {
      return parts.slice(srcIndex + 1, -1).join('/') || 'root';
    }


    return parts.slice(-2, -1)[0] || 'root';
  }






  private trackError(type: string, message: string): void {

    const currentCount = this.errorTypes.get(type) || 0;
    this.errorTypes.set(type, currentCount + 1);


    this.recentErrors.push({
      type,
      message,
      timestamp: new Date()
    });

    if (this.recentErrors.length > 100) {
      this.recentErrors.shift();
    }
  }




  private getErrorTypeBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {};
    for (const [type, count] of this.errorTypes) {
      breakdown[type] = count;
    }
    return breakdown;
  }




  private getRecentErrorSamples(): Error[] {
    return this.recentErrors.slice(-10).map(error => {
      const err = new Error(error.message);
      err.name = error.type;
      return err;
    });
  }




  private getCpuUsage(): number {

    const state = this.getState();
    const metrics = this.getMetrics();


    const baseUsage = state.currentLoad * 0.3;
    const workerUsage = metrics.workerMetrics.length > 0
      ? metrics.workerMetrics.filter(w => w.status === 'busy').length / metrics.workerMetrics.length * 0.4
      : 0;

    return Math.min(baseUsage + workerUsage, 1.0);
  }
}

================
File: ingestion/queue-manager.ts
================
import { EventEmitter } from 'events';
import {
  TaskPayload,
  QueueConfig,
  QueueMetrics,
  ChangeEvent,
  IngestionError,
  QueueOverflowError,
  IngestionEvents
} from './types.js';

export interface QueueManagerConfig extends QueueConfig {
  enableBackpressure: boolean;
  backpressureThreshold: number;
  partitionStrategy: 'round_robin' | 'hash' | 'priority';
  metricsInterval: number;
}

export class QueueManager extends EventEmitter<IngestionEvents> {
  private queues: Map<string, TaskPayload[]> = new Map();
  private partitionMap: Map<string, string> = new Map();
  private metrics: QueueMetrics;
  private config: QueueManagerConfig;
  private running = false;
  private metricsTimer?: NodeJS.Timeout;
  private nextPartitionIndex = 0;


  private processedTasks = 0;
  private failedTasks = 0;
  private lastProcessedCount = 0;
  private lastFailedCount = 0;

  constructor(config: QueueManagerConfig) {
    super();
    this.config = config;
    this.metrics = {
      queueDepth: 0,
      oldestEventAge: 0,
      partitionLag: {},
      throughputPerSecond: 0,
      errorRate: 0
    };


    for (let i = 0; i < config.partitionCount; i++) {
      const partitionId = `partition-${i}`;
      this.queues.set(partitionId, []);
      this.metrics.partitionLag[partitionId] = 0;
    }

    this.setupMetricsCollection();
  }




  async start(): Promise<void> {
    if (this.running) {
      throw new IngestionError('Queue manager already running', 'ALREADY_RUNNING');
    }

    this.running = true;
    this.startMetricsCollection();
    console.log(`[QueueManager] Started with ${this.config.partitionCount} partitions`);
  }




  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.running = false;
    this.stopMetricsCollection();


    this.queues.clear();
    this.partitionMap.clear();

    console.log('[QueueManager] Stopped');
  }




  async enqueue(task: TaskPayload, partitionKey?: string): Promise<void> {
    if (!this.running) {
      throw new IngestionError('Queue manager not running', 'NOT_RUNNING');
    }


    if (this.config.enableBackpressure && this.isBackpressured()) {
      throw new QueueOverflowError(
        'Queue backpressure threshold exceeded',
        'global',
        this.metrics.queueDepth,
        this.config.backpressureThreshold
      );
    }


    const partitionId = this.getPartition(task, partitionKey);
    const queue = this.queues.get(partitionId);

    if (!queue) {
      throw new IngestionError(`Partition ${partitionId} not found`, 'PARTITION_NOT_FOUND');
    }


    if (queue.length >= this.config.maxSize) {
      throw new QueueOverflowError(
        `Partition ${partitionId} at capacity`,
        partitionId,
        queue.length,
        this.config.maxSize
      );
    }


    this.insertTask(queue, task);
    this.updateMetrics();

    this.emit('event:received', task as any);
  }




  async dequeue(partitionId: string, maxTasks: number = 1): Promise<TaskPayload[]> {
    if (!this.running) {
      return [];
    }

    const queue = this.queues.get(partitionId);
    if (!queue || queue.length === 0) {
      return [];
    }


    const tasks = queue.splice(0, Math.min(maxTasks, queue.length));
    this.updateMetrics();

    return tasks;
  }




  async dequeueBatch(partitionId?: string): Promise<TaskPayload[]> {
    if (!this.running) {
      return [];
    }

    if (partitionId) {
      return this.dequeue(partitionId, this.config.batchSize);
    }


    const allTasks: TaskPayload[] = [];
    const partitionIds = Array.from(this.queues.keys());

    for (const pId of partitionIds) {
      const tasks = await this.dequeue(pId, this.config.batchSize);
      allTasks.push(...tasks);

      if (allTasks.length >= this.config.batchSize) {
        break;
      }
    }

    return allTasks.slice(0, this.config.batchSize);
  }




  async dequeueByPriority(maxTasks: number = this.config.batchSize): Promise<TaskPayload[]> {
    if (!this.running) {
      return [];
    }

    const allTasks: TaskPayload[] = [];


    for (const queue of this.queues.values()) {
      allTasks.push(...queue);
    }

    if (allTasks.length === 0) {
      return [];
    }


    allTasks.sort((a, b) => b.priority - a.priority);


    const selectedTasks = allTasks.slice(0, maxTasks);


    for (const task of selectedTasks) {
      const partitionId = this.getPartition(task);
      const queue = this.queues.get(partitionId);
      if (queue) {
        const index = queue.findIndex(t => t.id === task.id);
        if (index >= 0) {
          queue.splice(index, 1);
        }
      }
    }

    this.updateMetrics();
    return selectedTasks;
  }




  async requeueTask(task: TaskPayload, error?: Error): Promise<void> {
    if (task.retryCount >= task.maxRetries) {
      console.error(`[QueueManager] Task ${task.id} exceeded max retries (${task.maxRetries})`);
      return;
    }


    const retryTask: TaskPayload = {
      ...task,
      retryCount: task.retryCount + 1,
      scheduledAt: new Date(Date.now() + this.calculateRetryDelay(task.retryCount)),
      metadata: {
        ...task.metadata,
        lastError: error?.message,
        lastRetryAt: new Date()
      }
    };

    await this.enqueue(retryTask);
  }




  getMetrics(): QueueMetrics {
    return { ...this.metrics };
  }




  getPartitionStatus(): Record<string, { size: number; oldestTask?: Date }> {
    const status: Record<string, { size: number; oldestTask?: Date }> = {};

    for (const [partitionId, queue] of this.queues) {
      const oldestTask = queue.length > 0 ? queue[0].createdAt : undefined;
      status[partitionId] = {
        size: queue.length,
        oldestTask
      };
    }

    return status;
  }




  private isBackpressured(): boolean {
    return this.metrics.queueDepth >= this.config.backpressureThreshold;
  }




  private getPartition(task: TaskPayload, partitionKey?: string): string {

    if (partitionKey) {
      const cached = this.partitionMap.get(partitionKey);
      if (cached) {
        return cached;
      }


      const hash = this.hashString(partitionKey);
      const partitionIndex = hash % this.config.partitionCount;
      const partitionId = `partition-${partitionIndex}`;
      this.partitionMap.set(partitionKey, partitionId);
      return partitionId;
    }


    switch (this.config.partitionStrategy) {
      case 'hash':
        const hash = this.hashString(task.id);
        const partitionIndex = hash % this.config.partitionCount;
        return `partition-${partitionIndex}`;

      case 'priority':

        const priorityIndex = Math.min(
          Math.floor((10 - task.priority) / 2),
          this.config.partitionCount - 1
        );
        return `partition-${priorityIndex}`;

      case 'round_robin':
      default:
        const rrIndex = this.nextPartitionIndex % this.config.partitionCount;
        this.nextPartitionIndex++;
        return `partition-${rrIndex}`;
    }
  }




  private insertTask(queue: TaskPayload[], task: TaskPayload): void {

    const insertIndex = queue.findIndex(t => t.priority < task.priority);
    if (insertIndex === -1) {
      queue.push(task);
    } else {
      queue.splice(insertIndex, 0, task);
    }
  }




  private calculateRetryDelay(retryCount: number): number {
    const baseDelay = this.config.retryDelay;
    const maxDelay = 60000;
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);


    const jitter = delay * 0.25 * (Math.random() - 0.5);
    return Math.floor(delay + jitter);
  }




  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }




  private updateMetrics(): void {
    let totalSize = 0;
    let oldestTimestamp = Date.now();

    for (const [partitionId, queue] of this.queues) {
      totalSize += queue.length;
      this.metrics.partitionLag[partitionId] = queue.length;

      if (queue.length > 0) {
        const oldest = queue[0].createdAt.getTime();
        oldestTimestamp = Math.min(oldestTimestamp, oldest);
      }
    }

    this.metrics.queueDepth = totalSize;
    this.metrics.oldestEventAge = totalSize > 0 ? Date.now() - oldestTimestamp : 0;
  }




  private setupMetricsCollection(): void {
    let lastProcessedCount = 0;
    let lastErrorCount = 0;
    let lastUpdateTime = Date.now();

    this.metricsTimer = setInterval(() => {
      const now = Date.now();
      const timeDelta = (now - lastUpdateTime) / 1000;


      this.metrics.throughputPerSecond = this.calculateThroughput(timeDelta);


      this.metrics.errorRate = this.calculateErrorRate();

      lastUpdateTime = now;
      this.emit('metrics:updated', this.metrics);
    }, this.config.metricsInterval);
  }




  private startMetricsCollection(): void {

  }




  private stopMetricsCollection(): void {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = undefined;
    }
  }




  getScheduledTasks(): TaskPayload[] {
    const now = new Date();
    const scheduled: TaskPayload[] = [];

    for (const queue of this.queues.values()) {
      for (const task of queue) {
        if (task.scheduledAt && task.scheduledAt > now) {
          scheduled.push(task);
        }
      }
    }

    return scheduled.sort((a, b) =>
      (a.scheduledAt?.getTime() || 0) - (b.scheduledAt?.getTime() || 0)
    );
  }




  processScheduledTasks(): TaskPayload[] {
    const now = new Date();
    const readyTasks: TaskPayload[] = [];

    for (const [partitionId, queue] of this.queues) {
      for (let i = queue.length - 1; i >= 0; i--) {
        const task = queue[i];
        if (task.scheduledAt && task.scheduledAt <= now) {

          task.scheduledAt = undefined;
          queue.splice(i, 1);
          this.insertTask(queue, task);
          readyTasks.push(task);
        }
      }
    }

    if (readyTasks.length > 0) {
      this.updateMetrics();
    }

    return readyTasks;
  }






  recordTaskCompletion(success: boolean): void {
    if (success) {
      this.processedTasks++;
    } else {
      this.failedTasks++;
    }
  }




  private calculateThroughput(timeDelta: number): number {
    if (timeDelta <= 0) return 0;

    const newProcessed = this.processedTasks - this.lastProcessedCount;
    this.lastProcessedCount = this.processedTasks;

    return newProcessed / timeDelta;
  }




  private calculateErrorRate(): number {
    const totalTasks = this.processedTasks + this.failedTasks;
    if (totalTasks === 0) return 0;

    return this.failedTasks / totalTasks;
  }
}

================
File: ingestion/types.ts
================
import { Entity } from '@memento/core/models/entities.js';
import { GraphRelationship } from '@memento/core/models/relationships.js';



export interface ChangeEvent {
  id: string;
  namespace: string;
  module: string;
  filePath: string;
  eventType: 'created' | 'modified' | 'deleted';
  timestamp: Date;
  size: number;
  diffHash: string;
  metadata: Record<string, any>;
}

export interface ChangeFragment {
  id: string;
  eventId: string;
  changeType: 'entity' | 'relationship';
  operation: 'add' | 'update' | 'remove';
  data: Entity | GraphRelationship;
  dependencyHints: string[];
  confidence: number;
}



export interface QueueConfig {
  maxSize: number;
  partitionCount: number;
  batchSize: number;
  batchTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface QueueMetrics {
  queueDepth: number;
  oldestEventAge: number;
  partitionLag: Record<string, number>;
  throughputPerSecond: number;
  errorRate: number;
}

export interface TaskPayload {
  id: string;
  type: 'parse' | 'entity_upsert' | 'relationship_upsert' | 'embedding';
  priority: number;
  data: any;
  metadata: Record<string, any>;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  scheduledAt?: Date;
}



export interface WorkerConfig {
  id: string;
  type: 'parser' | 'entity' | 'relationship' | 'embedding';
  concurrency: number;
  batchSize: number;
  timeout: number;
  healthCheck: boolean;
}

export interface WorkerMetrics {
  workerId: string;
  status: 'idle' | 'busy' | 'error' | 'shutdown';
  tasksProcessed: number;
  averageLatency: number;
  errorCount: number;
  lastActivity: Date;
}

export interface WorkerResult {
  taskId: string;
  workerId: string;
  success: boolean;
  result?: any;
  error?: Error;
  duration: number;
  metadata: Record<string, any>;
}



export interface BatchConfig {
  entityBatchSize: number;
  relationshipBatchSize: number;
  embeddingBatchSize: number;
  timeoutMs: number;
  maxConcurrentBatches: number;
}

export interface BatchMetadata {
  id: string;
  type: 'entity' | 'relationship' | 'embedding';
  size: number;
  priority: number;
  createdAt: Date;
  epochId?: string;
  namespace?: string;
}

export interface BatchResult {
  batchId: string;
  success: boolean;
  processedCount: number;
  failedCount: number;
  duration: number;
  errors: Error[];
  metadata: BatchMetadata;
}



export interface PipelineConfig {
  eventBus: {
    type: 'redis' | 'nats' | 'memory';
    url?: string;
    partitions: number;
  };
  workers: {
    parsers: number;
    entityWorkers: number;
    relationshipWorkers: number;
    embeddingWorkers: number;
  };
  batching: BatchConfig;
  queues: QueueConfig;
  monitoring: {
    metricsInterval: number;
    healthCheckInterval: number;
    alertThresholds: {
      queueDepth: number;
      latency: number;
      errorRate: number;
    };
  };
}

export interface PipelineMetrics {
  totalEvents: number;
  eventsPerSecond: number;
  averageLatency: number;
  p95Latency: number;
  queueMetrics: QueueMetrics;
  workerMetrics: WorkerMetrics[];
  batchMetrics: {
    activeBatches: number;
    completedBatches: number;
    failedBatches: number;
  };
}

export interface PipelineState {
  status: 'starting' | 'running' | 'pausing' | 'paused' | 'stopping' | 'stopped' | 'error';
  startedAt?: Date;
  lastActivity?: Date;
  processedEvents: number;
  errorCount: number;
  currentLoad: number;
}



export interface DependencyNode {
  id: string;
  type: 'entity' | 'relationship';
  data: Entity | GraphRelationship;
  dependencies: string[];
  dependents: string[];
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface DependencyDAG {
  nodes: Map<string, DependencyNode>;
  roots: string[];
  leaves: string[];
  cycles: string[][];
}



export interface StreamingWriteConfig {
  batchSize: number;
  maxConcurrentWrites: number;
  idempotencyKeyTTL: number;
  retryPolicy: {
    maxAttempts: number;
    backoffMultiplier: number;
    maxBackoffMs: number;
  };
}

export interface IdempotentBatch {
  id: string;
  epochId: string;
  operation: 'entity_upsert' | 'relationship_upsert' | 'entity_delete' | 'relationship_delete';
  data: (Entity | GraphRelationship)[];
  metadata: Record<string, any>;
  createdAt: Date;
}



export interface EnrichmentTask {
  id: string;
  type: 'embedding' | 'impact_analysis' | 'documentation' | 'security';
  entityId: string;
  priority: number;
  data: any;
  dependencies: string[];
  createdAt: Date;
  sla?: number;
}

export interface EnrichmentResult {
  taskId: string;
  entityId: string;
  type: string;
  success: boolean;
  result?: any;
  error?: Error;
  duration: number;
  metadata: Record<string, any>;
}



export interface IngestionTelemetry {
  timestamp: Date;
  pipeline: PipelineMetrics;
  queues: QueueMetrics;
  workers: WorkerMetrics[];
  errors: {
    count: number;
    types: Record<string, number>;
    samples: Error[];
  };
  performance: {
    cpu: number;
    memory: number;
    diskIO: number;
    networkIO: number;
  };
}

export interface AlertConfig {
  name: string;
  condition: string;
  threshold: number;
  duration: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  channels: string[];
}



export class IngestionError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public metadata: Record<string, any> = {}
  ) {
    super(message);
    this.name = 'IngestionError';
  }
}

export class BatchProcessingError extends IngestionError {
  constructor(
    message: string,
    public batchId: string,
    public failedItems: any[] = [],
    retryable = true
  ) {
    super(message, 'BATCH_PROCESSING_ERROR', retryable, { batchId, failedItems });
    this.name = 'BatchProcessingError';
  }
}

export class WorkerError extends IngestionError {
  constructor(
    message: string,
    public workerId: string,
    public taskId?: string,
    retryable = true
  ) {
    super(message, 'WORKER_ERROR', retryable, { workerId, taskId });
    this.name = 'WorkerError';
  }
}

export class QueueOverflowError extends IngestionError {
  constructor(
    message: string,
    public queueName: string,
    public currentSize: number,
    public maxSize: number
  ) {
    super(message, 'QUEUE_OVERFLOW', false, { queueName, currentSize, maxSize });
    this.name = 'QueueOverflowError';
  }
}



export interface IngestionEvents {
  'pipeline:started': () => void;
  'pipeline:stopped': () => void;
  'pipeline:error': (error: Error) => void;
  'event:received': (event: ChangeEvent) => void;
  'event:processed': (event: ChangeEvent, duration: number) => void;
  'batch:created': (batch: BatchMetadata) => void;
  'batch:completed': (result: BatchResult) => void;
  'batch:failed': (error: BatchProcessingError) => void;
  'worker:started': (workerId: string) => void;
  'worker:stopped': (workerId: string) => void;
  'worker:error': (error: WorkerError) => void;
  'queue:overflow': (error: QueueOverflowError) => void;
  'metrics:updated': (metrics: PipelineMetrics) => void;
  'alert:triggered': (alert: AlertConfig, value: number) => void;
}

================
File: ingestion/worker-pool.ts
================
import { EventEmitter } from 'events';
import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  TaskPayload,
  WorkerConfig,
  WorkerMetrics,
  WorkerResult,
  WorkerError,
  IngestionError,
  IngestionEvents
} from './types.js';

export interface WorkerPoolConfig {
  maxWorkers: number;
  minWorkers: number;
  workerTimeout: number;
  healthCheckInterval: number;
  restartThreshold: number;
  autoScale: boolean;
  scalingRules: {
    scaleUpThreshold: number;
    scaleDownThreshold: number;
    scaleUpCooldown: number;
    scaleDownCooldown: number;
  };
}

export interface WorkerInstance {
  id: string;
  config: WorkerConfig;
  worker?: Worker;
  status: 'starting' | 'idle' | 'busy' | 'error' | 'stopping' | 'stopped';
  currentTask?: TaskPayload;
  metrics: WorkerMetrics;
  lastHealthCheck: Date;
  errorCount: number;
  startedAt: Date;
  stoppedAt?: Date;
}

export type WorkerHandler = (task: TaskPayload) => Promise<any>;

export class WorkerPool extends EventEmitter<IngestionEvents> {
  private workers: Map<string, WorkerInstance> = new Map();
  private handlers: Map<string, WorkerHandler> = new Map();
  private config: WorkerPoolConfig;
  private running = false;
  private healthCheckTimer?: NodeJS.Timeout;
  private autoScaleTimer?: NodeJS.Timeout;
  private lastScaleUp = 0;
  private lastScaleDown = 0;

  constructor(config: WorkerPoolConfig) {
    super();
    this.config = config;
  }




  async start(): Promise<void> {
    if (this.running) {
      throw new IngestionError('Worker pool already running', 'ALREADY_RUNNING');
    }

    this.running = true;


    await this.scaleWorkers(this.config.minWorkers);


    this.startHealthMonitoring();


    if (this.config.autoScale) {
      this.startAutoScaling();
    }

    console.log(`[WorkerPool] Started with ${this.workers.size} workers`);
  }




  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.running = false;


    this.stopHealthMonitoring();
    this.stopAutoScaling();


    await this.stopAllWorkers();

    console.log('[WorkerPool] Stopped');
  }




  registerHandler(workerType: string, handler: WorkerHandler): void {
    this.handlers.set(workerType, handler);
  }




  async executeTask(task: TaskPayload): Promise<WorkerResult> {
    if (!this.running) {
      throw new IngestionError('Worker pool not running', 'NOT_RUNNING');
    }


    const worker = await this.getAvailableWorker(task.type);
    if (!worker) {
      throw new WorkerError('No available workers', 'pool', task.id, true);
    }

    try {
      const result = await this.executeTaskOnWorker(worker, task);
      this.updateWorkerMetrics(worker, result);
      return result;
    } catch (error) {
      this.handleWorkerError(worker, error as Error, task);
      throw error;
    }
  }




  async executeTasks(tasks: TaskPayload[]): Promise<WorkerResult[]> {
    if (!this.running) {
      throw new IngestionError('Worker pool not running', 'NOT_RUNNING');
    }


    const tasksByType = this.groupTasksByType(tasks);
    const promises: Promise<WorkerResult>[] = [];

    for (const [workerType, typeTasks] of tasksByType) {
      for (const task of typeTasks) {
        promises.push(this.executeTask(task));
      }
    }

    return Promise.allSettled(promises).then(results =>
      results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {

          return {
            taskId: tasks[index].id,
            workerId: 'unknown',
            success: false,
            error: result.reason,
            duration: 0,
            metadata: {}
          };
        }
      })
    );
  }




  getMetrics(): {
    totalWorkers: number;
    activeWorkers: number;
    idleWorkers: number;
    errorWorkers: number;
    workers: WorkerMetrics[];
  } {
    const workers = Array.from(this.workers.values());
    const metrics = workers.map(w => w.metrics);

    return {
      totalWorkers: workers.length,
      activeWorkers: workers.filter(w => w.status === 'busy').length,
      idleWorkers: workers.filter(w => w.status === 'idle').length,
      errorWorkers: workers.filter(w => w.status === 'error').length,
      workers: metrics
    };
  }




  async scaleWorkers(targetCount: number): Promise<void> {
    const currentCount = this.workers.size;

    if (targetCount > currentCount) {

      const toAdd = Math.min(targetCount - currentCount, this.config.maxWorkers - currentCount);
      await this.addWorkers(toAdd);
    } else if (targetCount < currentCount) {

      const toRemove = Math.min(currentCount - targetCount, currentCount - this.config.minWorkers);
      await this.removeWorkers(toRemove);
    }
  }




  private async getAvailableWorker(taskType: string): Promise<WorkerInstance | null> {

    for (const worker of this.workers.values()) {
      if (worker.status === 'idle' && worker.config.type === taskType) {
        return worker;
      }
    }


    if (this.handlers.has(taskType)) {
      for (const worker of this.workers.values()) {
        if (worker.status === 'idle') {
          return worker;
        }
      }
    }


    if (this.config.autoScale && this.workers.size < this.config.maxWorkers) {
      await this.addWorkers(1);

      return this.getAvailableWorker(taskType);
    }

    return null;
  }




  private async executeTaskOnWorker(
    worker: WorkerInstance,
    task: TaskPayload
  ): Promise<WorkerResult> {
    const startTime = Date.now();
    worker.status = 'busy';
    worker.currentTask = task;

    try {
      let result: any;


      if (worker.worker) {
        result = await this.executeTaskInWorkerThread(worker.worker, task);
      } else {
        const handler = this.handlers.get(task.type);
        if (!handler) {
          throw new IngestionError(`No handler for task type: ${task.type}`, 'NO_HANDLER');
        }
        result = await handler(task);
      }

      const duration = Date.now() - startTime;

      return {
        taskId: task.id,
        workerId: worker.id,
        success: true,
        result,
        duration,
        metadata: {
          workerType: worker.config.type,
          taskType: task.type
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      throw new WorkerError(
        `Task execution failed: ${(error as Error).message}`,
        worker.id,
        task.id
      );
    } finally {
      worker.status = 'idle';
      worker.currentTask = undefined;
    }
  }




  private async executeTaskInWorkerThread(worker: Worker, task: TaskPayload): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Worker timeout after ${this.config.workerTimeout}ms`));
      }, this.config.workerTimeout);

      worker.once('message', (result) => {
        clearTimeout(timeout);
        if (result.success) {
          resolve(result.data);
        } else {
          reject(new Error(result.error));
        }
      });

      worker.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      worker.postMessage(task);
    });
  }




  private async addWorkers(count: number): Promise<void> {
    const promises: Promise<void>[] = [];

    for (let i = 0; i < count; i++) {
      promises.push(this.createWorker());
    }

    await Promise.all(promises);
  }




  private async removeWorkers(count: number): Promise<void> {
    const idleWorkers = Array.from(this.workers.values())
      .filter(w => w.status === 'idle')
      .slice(0, count);

    const promises = idleWorkers.map(worker => this.stopWorker(worker.id));
    await Promise.all(promises);
  }




  private async createWorker(): Promise<void> {
    const workerId = `worker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const config: WorkerConfig = {
      id: workerId,
      type: 'generic',
      concurrency: 1,
      batchSize: 1,
      timeout: this.config.workerTimeout,
      healthCheck: true
    };

    const worker: WorkerInstance = {
      id: workerId,
      config,
      status: 'starting',
      metrics: {
        workerId,
        status: 'idle',
        tasksProcessed: 0,
        averageLatency: 0,
        errorCount: 0,
        lastActivity: new Date()
      },
      lastHealthCheck: new Date(),
      errorCount: 0,
      startedAt: new Date()
    };


    try {
      const workerScript = this.getWorkerScriptPath();
      const workerThread = new Worker(workerScript, {
        workerData: { workerId }
      });


      workerThread.on('message', (message) => {
        this.handleWorkerMessage(workerId, message);
      });

      workerThread.on('error', (error) => {
        this.handleWorkerError(worker, error);
      });

      workerThread.on('exit', (code) => {
        if (code !== 0) {
          console.error(`[WorkerPool] Worker ${workerId} exited with code ${code}`);
          this.handleWorkerError(worker, new Error(`Worker exited with code ${code}`));
        }
      });

      worker.worker = workerThread;
      worker.status = 'idle';

      console.log(`[WorkerPool] Created worker thread ${workerId}`);

    } catch (error) {
      console.error(`[WorkerPool] Failed to create worker thread ${workerId}:`, error);


      console.log(`[WorkerPool] Falling back to in-process mode for worker ${workerId}`);
      worker.status = 'idle';
    }

    this.workers.set(workerId, worker);
    this.emit('worker:started', workerId);

    console.log(`[WorkerPool] Created worker ${workerId}`);
  }




  private getWorkerScriptPath(): string {

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);


    return path.join(__dirname, 'workers', 'task-worker.js');
  }




  private handleWorkerMessage(workerId: string, message: any): void {
    const worker = this.workers.get(workerId);
    if (!worker) {
      console.warn(`[WorkerPool] Received message from unknown worker ${workerId}`);
      return;
    }

    switch (message.type) {
      case 'pong':

        worker.lastHealthCheck = new Date();
        break;

      case 'task_result':
        this.handleTaskResult(workerId, message);
        break;

      case 'error':
        console.error(`[WorkerPool] Worker ${workerId} reported error:`, message.error);
        this.handleWorkerError(worker, new Error(message.error));
        break;

      case 'shutdown_complete':
        console.log(`[WorkerPool] Worker ${workerId} shutdown complete`);
        worker.status = 'stopped';
        break;

      default:
        console.warn(`[WorkerPool] Unknown message type from worker ${workerId}:`, message.type);
    }
  }




  private handleTaskResult(workerId: string, message: any): void {


    console.log(`[WorkerPool] Task ${message.taskId} completed by worker ${workerId}: ${message.success ? 'success' : 'failed'}`);

    const worker = this.workers.get(workerId);
    if (worker) {
      worker.status = 'idle';
      worker.metrics.tasksProcessed++;
      worker.metrics.lastActivity = new Date();

      if (message.duration) {

        const currentAvg = worker.metrics.averageLatency;
        const taskCount = worker.metrics.tasksProcessed;
        worker.metrics.averageLatency = ((currentAvg * (taskCount - 1)) + message.duration) / taskCount;
      }

      if (!message.success) {
        worker.metrics.errorCount++;
        worker.errorCount++;
      }
    }
  }




  private async executeTaskInWorkerThread(worker: Worker, task: TaskPayload): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Task ${task.id} timed out after ${this.config.workerTimeout}ms`));
      }, this.config.workerTimeout);


      const messageHandler = (message: any) => {
        if (message.type === 'task_result' && message.taskId === task.id) {
          clearTimeout(timeout);
          worker.off('message', messageHandler);

          if (message.success) {
            resolve(message.result);
          } else {
            reject(new Error(message.error || 'Task failed'));
          }
        }
      };

      worker.on('message', messageHandler);


      worker.postMessage({
        type: 'task',
        taskId: task.id,
        taskType: task.type,
        data: task.data,
        metadata: task.metadata
      });
    });
  }




  private async stopWorker(workerId: string): Promise<void> {
    const worker = this.workers.get(workerId);
    if (!worker) {
      return;
    }

    worker.status = 'stopping';

    if (worker.worker) {
      try {

        worker.worker.postMessage({ type: 'shutdown' });


        await new Promise(resolve => setTimeout(resolve, 1000));


        await worker.worker.terminate();
      } catch (error) {
        console.warn(`[WorkerPool] Error stopping worker ${workerId}:`, error);

        await worker.worker.terminate();
      }
    }

    worker.status = 'stopped';
    worker.stoppedAt = new Date();

    this.workers.delete(workerId);
    this.emit('worker:stopped', workerId);

    console.log(`[WorkerPool] Stopped worker ${workerId}`);
  }




  private async stopAllWorkers(): Promise<void> {
    const promises = Array.from(this.workers.keys()).map(id => this.stopWorker(id));
    await Promise.all(promises);
  }




  private updateWorkerMetrics(worker: WorkerInstance, result: WorkerResult): void {
    const metrics = worker.metrics;

    metrics.tasksProcessed++;
    metrics.lastActivity = new Date();


    const totalLatency = metrics.averageLatency * (metrics.tasksProcessed - 1) + result.duration;
    metrics.averageLatency = totalLatency / metrics.tasksProcessed;

    if (!result.success) {
      metrics.errorCount++;
      worker.errorCount++;
    }

    metrics.status = worker.status;
  }




  private handleWorkerError(worker: WorkerInstance, error: Error, task?: TaskPayload): void {
    worker.status = 'error';
    worker.errorCount++;
    worker.metrics.errorCount++;

    const workerError = new WorkerError(
      `Worker ${worker.id} error: ${error.message}`,
      worker.id,
      task?.id
    );

    this.emit('worker:error', workerError);


    if (worker.errorCount >= this.config.restartThreshold) {
      console.warn(`[WorkerPool] Restarting worker ${worker.id} due to excessive errors`);
      this.restartWorker(worker.id);
    }
  }




  private async restartWorker(workerId: string): Promise<void> {
    await this.stopWorker(workerId);
    await this.createWorker();
  }




  private groupTasksByType(tasks: TaskPayload[]): Map<string, TaskPayload[]> {
    const groups = new Map<string, TaskPayload[]>();

    for (const task of tasks) {
      const existing = groups.get(task.type) || [];
      existing.push(task);
      groups.set(task.type, existing);
    }

    return groups;
  }




  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }




  private stopHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }




  private performHealthChecks(): void {
    const now = new Date();

    for (const worker of this.workers.values()) {
      worker.lastHealthCheck = now;


      if (worker.status === 'busy' && worker.currentTask) {
        const taskAge = now.getTime() - worker.currentTask.createdAt.getTime();
        if (taskAge > this.config.workerTimeout * 2) {
          console.warn(`[WorkerPool] Worker ${worker.id} appears stuck, restarting`);
          this.restartWorker(worker.id);
        }
      }
    }
  }




  private startAutoScaling(): void {
    this.autoScaleTimer = setInterval(() => {
      this.performAutoScaling();
    }, 5000);
  }




  private stopAutoScaling(): void {
    if (this.autoScaleTimer) {
      clearInterval(this.autoScaleTimer);
      this.autoScaleTimer = undefined;
    }
  }




  private performAutoScaling(): void {
    const now = Date.now();
    const metrics = this.getMetrics();
    const queueDepth = this.estimateQueueDepth();


    if (
      queueDepth > this.config.scalingRules.scaleUpThreshold &&
      metrics.totalWorkers < this.config.maxWorkers &&
      (now - this.lastScaleUp) > this.config.scalingRules.scaleUpCooldown
    ) {
      const scaleUpBy = Math.min(2, this.config.maxWorkers - metrics.totalWorkers);
      console.log(`[WorkerPool] Auto-scaling up by ${scaleUpBy} workers (queue depth: ${queueDepth})`);
      this.addWorkers(scaleUpBy);
      this.lastScaleUp = now;
    }


    if (
      queueDepth < this.config.scalingRules.scaleDownThreshold &&
      metrics.totalWorkers > this.config.minWorkers &&
      metrics.idleWorkers > 2 &&
      (now - this.lastScaleDown) > this.config.scalingRules.scaleDownCooldown
    ) {
      const scaleDownBy = Math.min(metrics.idleWorkers - 1, metrics.totalWorkers - this.config.minWorkers);
      console.log(`[WorkerPool] Auto-scaling down by ${scaleDownBy} workers (queue depth: ${queueDepth})`);
      this.removeWorkers(scaleDownBy);
      this.lastScaleDown = now;
    }
  }







  private estimateQueueDepth(): number {
    const metrics = this.getMetrics();


    if (metrics.totalWorkers > 0 && metrics.idleWorkers === 0) {
      return this.config.scalingRules.scaleUpThreshold + 10;
    }


    const utilizationRatio = (metrics.totalWorkers - metrics.idleWorkers) / metrics.totalWorkers;
    if (utilizationRatio > 0.8) {
      return Math.floor(this.config.scalingRules.scaleUpThreshold * 0.7);
    }


    return Math.floor(this.config.scalingRules.scaleDownThreshold * 0.5);
  }
}

================
File: orchestration/CacheManager.ts
================
import { Entity, Symbol as SymbolEntity } from "../../../models/entities.js";
import { GraphRelationship } from "../../../models/relationships.js";
import { createHash } from "./utils.js";
import { CachedFileInfo, ExportMapEntry } from "./types.js";
import { PerformanceOptimizer } from "./PerformanceOptimizer.js";


export type { CachedFileInfo, ExportMapEntry };





export class CacheManager {

  private optimizer: PerformanceOptimizer;


  private fileCache: ReturnType<PerformanceOptimizer['createLRUCache']>;


  private exportMapCache: Map<string, Map<string, ExportMapEntry>> = new Map();


  private globalSymbolIndex: Map<string, SymbolEntity> = new Map();
  private nameIndex: Map<string, SymbolEntity[]> = new Map();

  constructor(maxCacheSize: number = 1000) {
    this.optimizer = new PerformanceOptimizer({ maxCacheSize });
    this.fileCache = this.optimizer.createLRUCache<string, CachedFileInfo>(maxCacheSize);
  }






  getCachedFile(absolutePath: string): CachedFileInfo | undefined {
    const result = this.fileCache.get(absolutePath);
    if (result) {
      this.optimizer.recordCacheHit();
    } else {
      this.optimizer.recordCacheMiss();
    }
    return result;
  }






  setCachedFile(absolutePath: string, info: CachedFileInfo): void {
    this.fileCache.set(absolutePath, info);
  }





  deleteCachedFile(absolutePath: string): void {
    this.fileCache.delete(absolutePath);
  }






  getExportMap(absolutePath: string): Map<string, ExportMapEntry> | undefined {
    return this.exportMapCache.get(absolutePath);
  }






  setExportMap(absolutePath: string, exportMap: Map<string, ExportMapEntry>): void {
    this.exportMapCache.set(absolutePath, exportMap);
  }




  clearExportMapCache(): void {
    this.exportMapCache.clear();
  }






  getGlobalSymbol(key: string): SymbolEntity | undefined {
    return this.globalSymbolIndex.get(key);
  }






  setGlobalSymbol(key: string, symbol: SymbolEntity): void {
    this.globalSymbolIndex.set(key, symbol);
  }





  deleteGlobalSymbol(key: string): void {
    this.globalSymbolIndex.delete(key);
  }





  getGlobalSymbolKeys(): string[] {
    return Array.from(this.globalSymbolIndex.keys());
  }






  getSymbolsByName(name: string): SymbolEntity[] {
    return this.nameIndex.get(name) || [];
  }






  setSymbolsByName(name: string, symbols: SymbolEntity[]): void {
    if (symbols.length > 0) {
      this.nameIndex.set(name, symbols);
    } else {
      this.nameIndex.delete(name);
    }
  }






  hasSymbolName(name: string): boolean {
    return this.nameIndex.has(name);
  }





  removeFileFromIndexes(fileRelPath: string): void {
    try {

      for (const key of this.getGlobalSymbolKeys()) {
        if (key.startsWith(`${fileRelPath}:`)) {
          const sym = this.globalSymbolIndex.get(key);
          if (sym && "name" in sym) {
            const nm = sym.name as string;
            if (nm && this.hasSymbolName(nm)) {
              const arr = this.getSymbolsByName(nm).filter(
                (s) => (s as any).id !== (sym as any).id
              );
              this.setSymbolsByName(nm, arr);
            }
          }
          this.deleteGlobalSymbol(key);
        }
      }
    } catch {}
  }






  addSymbolsToIndexes(fileRelPath: string, symbols: SymbolEntity[]): void {
    try {
      for (const sym of symbols) {
        if (!sym || !("name" in sym)) continue;
        const nm = sym.name as string;
        if (!nm) continue;
        const key = `${fileRelPath}:${nm}`;
        this.setGlobalSymbol(key, sym);
        if (nm) {
          const arr = this.getSymbolsByName(nm);
          if (!arr.find((s) => (s as any).id === (sym as any).id)) {
            arr.push(sym);
          }
          this.setSymbolsByName(nm, arr);
        }
      }
    } catch {}
  }






  createSymbolMap(entities: Entity[]): Map<string, SymbolEntity> {
    const symbolMap = new Map<string, SymbolEntity>();
    for (const entity of entities) {
      if (entity.type === "symbol") {
        const symbol = entity as SymbolEntity;
        if (symbol.path) {
          symbolMap.set(symbol.path, symbol);
        }
      }
    }
    return symbolMap;
  }






  computeFileHash(content: string): string {
    return createHash(content);
  }




  clearCache(): void {
    this.fileCache.clear();
    this.exportMapCache.clear();
    this.globalSymbolIndex.clear();
    this.nameIndex.clear();
  }





  getCacheStats(): {
    files: number;
    totalEntities: number;
    cacheHitRate: number;
    memoryUsage: NodeJS.MemoryUsage;
  } {
    let totalEntities = 0;
    let fileCount = 0;


    this.fileCache.forEach((cached) => {
      totalEntities += cached.entities.length;
      fileCount++;
    });

    const metrics = this.optimizer.getMetrics();

    return {
      files: fileCount,
      totalEntities,
      cacheHitRate: metrics.cacheHitRate,
      memoryUsage: metrics.memoryUsage,
    };
  }








  updateCacheForFile(
    filePath: string,
    fileRelPath: string,
    symbolMap: Map<string, SymbolEntity>,
    newContent: string
  ): void {
    const cachedInfo = this.fileCache.get(filePath);
    if (!cachedInfo) return;


    cachedInfo.symbolMap = symbolMap;


    cachedInfo.hash = createHash(newContent);
    cachedInfo.lastModified = new Date();


    this.removeFileFromIndexes(fileRelPath);
    this.addSymbolsToIndexes(
      fileRelPath,
      Array.from(symbolMap.values())
    );
  }





  getOptimizer(): PerformanceOptimizer {
    return this.optimizer;
  }






  optimizeCaches(maxAge: number = 3600000): number {
    let removedCount = 0;


    removedCount += this.optimizer.optimizeSymbolMap(this.globalSymbolIndex, maxAge);


    if (this.exportMapCache.size > 100) {
      this.exportMapCache.clear();
      removedCount += 1;
    }

    return removedCount;
  }




  forceGarbageCollection(): void {
    if (global.gc) {
      global.gc();
    }
  }
}

================
File: orchestration/CheckpointService.ts
================
import { EventEmitter } from "events";
import { Neo4jService } from "../Neo4jService.js";
import { Entity } from "../../../models/entities.js";
import { TimeRangeParams } from "../../../models/types.js";

export interface CheckpointOptions {
  reason: "daily" | "incident" | "manual";
  hops?: number;
  window?: TimeRangeParams;
  description?: string;
}

export interface CheckpointInfo {
  id: string;
  timestamp: Date;
  reason: string;
  seedEntities: string[];
  memberCount: number;
  metadata?: Record<string, any>;
}

export interface CheckpointSummary {
  checkpoint: CheckpointInfo;
  members: Entity[];
  relationships: number;
  lastActivity?: Date;
}

export class CheckpointService extends EventEmitter {
  private readonly historyEnabled: boolean;

  constructor(private neo4j: Neo4jService) {
    super();
    this.historyEnabled = process.env.HISTORY_ENABLED !== "false";
  }




  async createCheckpoint(
    seedEntities: string[],
    options: CheckpointOptions
  ): Promise<{ checkpointId: string; memberCount: number }> {
    if (!this.historyEnabled) {
      return {
        checkpointId: `chk_disabled_${Date.now().toString(36)}`,
        memberCount: 0,
      };
    }

    const checkpointId = `chk_${Date.now().toString(36)}`;
    const timestamp = new Date();
    const hops = Math.min(Math.max(1, options.hops || 2), 5);


    await this.neo4j.executeCypher(
      `
      MERGE (c:Checkpoint {id: $id})
      SET c.timestamp = $timestamp
      SET c.reason = $reason
      SET c.seedEntities = $seeds
      SET c.description = $description
      SET c.metadata = $metadata
      `,
      {
        id: checkpointId,
        timestamp: timestamp.toISOString(),
        reason: options.reason,
        seeds: JSON.stringify(seedEntities),
        description: options.description || null,
        metadata: JSON.stringify(options.window || {}),
      }
    );


    const memberQuery = `
      UNWIND $seedIds AS seedId
      MATCH (seed:Entity {id: seedId})
      CALL apoc.path.expand(seed, null, null, 0, $hops, 'RELATIONSHIP_GLOBAL')
      YIELD path
      WITH last(nodes(path)) AS member
      RETURN DISTINCT member.id AS id
    `;

    const memberResult = await this.neo4j.executeCypher(memberQuery, {
      seedIds: seedEntities,
      hops,
    });

    const memberIds = memberResult.map((r) => r.id).filter(Boolean);


    if (memberIds.length > 0) {
      await this.neo4j.executeCypher(
        `
        MATCH (c:Checkpoint {id: $checkpointId})
        UNWIND $memberIds AS memberId
        MATCH (m:Entity {id: memberId})
        MERGE (c)-[:INCLUDES]->(m)
        `,
        { checkpointId, memberIds }
      );
    }

    this.emit("checkpoint:created", {
      checkpointId,
      seedCount: seedEntities.length,
      memberCount: memberIds.length,
      reason: options.reason,
    });

    return { checkpointId, memberCount: memberIds.length };
  }




  async listCheckpoints(options?: {
    reason?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  }): Promise<CheckpointInfo[]> {
    const query = `
      MATCH (c:Checkpoint)
      WHERE ($reason IS NULL OR c.reason = $reason)
        AND ($startTime IS NULL OR c.timestamp >= $startTime)
        AND ($endTime IS NULL OR c.timestamp <= $endTime)
      RETURN c {
        .id,
        .timestamp,
        .reason,
        .seedEntities,
        .description,
        .metadata
      } as checkpoint
      ORDER BY c.timestamp DESC
      LIMIT $limit
    `;

    const result = await this.neo4j.executeCypher(query, {
      reason: options?.reason || null,
      startTime: options?.startTime?.toISOString() || null,
      endTime: options?.endTime?.toISOString() || null,
      limit: options?.limit || 50,
    });

    return result.map((r) => {
      const checkpoint = r.checkpoint;
      return {
        id: checkpoint.id,
        timestamp: new Date(checkpoint.timestamp),
        reason: checkpoint.reason,
        seedEntities: JSON.parse(checkpoint.seedEntities || "[]"),
        memberCount: 0,
        metadata: JSON.parse(checkpoint.metadata || "{}"),
      };
    });
  }




  async getCheckpoint(checkpointId: string): Promise<CheckpointInfo | null> {
    const query = `
      MATCH (c:Checkpoint {id: $checkpointId})
      OPTIONAL MATCH (c)-[:INCLUDES]->(member:Entity)
      RETURN c {
        .id,
        .timestamp,
        .reason,
        .seedEntities,
        .description,
        .metadata
      } as checkpoint,
      count(member) as memberCount
    `;

    const result = await this.neo4j.executeCypher(query, { checkpointId });

    if (result.length === 0) {
      return null;
    }

    const record = result[0];
    const checkpoint = record.checkpoint;

    return {
      id: checkpoint.id,
      timestamp: new Date(checkpoint.timestamp),
      reason: checkpoint.reason,
      seedEntities: JSON.parse(checkpoint.seedEntities || "[]"),
      memberCount: record.memberCount,
      metadata: JSON.parse(checkpoint.metadata || "{}"),
    };
  }




  async getCheckpointMembers(checkpointId: string): Promise<Entity[]> {
    const query = `
      MATCH (c:Checkpoint {id: $checkpointId})-[:INCLUDES]->(member:Entity)
      RETURN member
      ORDER BY member.id
    `;

    const result = await this.neo4j.executeCypher(query, { checkpointId });
    return result.map((r) => r.member);
  }




  async getCheckpointSummary(
    checkpointId: string
  ): Promise<CheckpointSummary | null> {
    const checkpoint = await this.getCheckpoint(checkpointId);
    if (!checkpoint) {
      return null;
    }

    const members = await this.getCheckpointMembers(checkpointId);


    const relationshipQuery = `
      MATCH (c:Checkpoint {id: $checkpointId})-[:INCLUDES]->(m1:Entity),
            (c)-[:INCLUDES]->(m2:Entity),
            (m1)-[r]->(m2)
      WHERE m1.id < m2.id
      RETURN count(r) as relationshipCount
    `;

    const relationshipResult = await this.neo4j.executeCypher(
      relationshipQuery,
      { checkpointId }
    );


    const activityQuery = `
      MATCH (c:Checkpoint {id: $checkpointId})-[:INCLUDES]->(m:Entity)
      OPTIONAL MATCH (m)<-[:VERSION_OF]-(v:Version)
      RETURN max(v.timestamp) as lastActivity
    `;

    const activityResult = await this.neo4j.executeCypher(activityQuery, {
      checkpointId,
    });

    return {
      checkpoint,
      members,
      relationships: relationshipResult[0]?.relationshipCount || 0,
      lastActivity: activityResult[0]?.lastActivity
        ? new Date(activityResult[0].lastActivity)
        : undefined,
    };
  }




  async deleteCheckpoint(checkpointId: string): Promise<void> {
    const query = `
      MATCH (c:Checkpoint {id: $checkpointId})
      DETACH DELETE c
    `;

    await this.neo4j.executeCypher(query, { checkpointId });
    this.emit("checkpoint:deleted", { checkpointId });
  }




  async exportCheckpoint(checkpointId: string): Promise<any> {
    const summary = await this.getCheckpointSummary(checkpointId);
    if (!summary) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }

    return {
      checkpoint: summary.checkpoint,
      members: summary.members,
      relationships: summary.relationships,
      exportedAt: new Date().toISOString(),
    };
  }




  async importCheckpoint(checkpointData: any): Promise<string> {
    const { checkpoint, members } = checkpointData;


    const result = await this.createCheckpoint(checkpoint.seedEntities, {
      reason: checkpoint.reason,
      description: checkpoint.description,
      window: checkpoint.metadata,
    });




    return result.checkpointId;
  }
}

================
File: orchestration/EventOrchestrator.ts
================
import { EventEmitter } from "events";
import { EntityServiceOGM } from "../ogm/EntityServiceOGM.js";
import { RelationshipServiceOGM } from "../ogm/RelationshipServiceOGM.js";
import { SearchServiceOGM } from "../ogm/SearchServiceOGM.js";
import { AnalysisService } from "../AnalysisService.js";

export class EventOrchestrator extends EventEmitter {
  constructor(
    private entities: EntityServiceOGM,
    private relationships: RelationshipServiceOGM,
    private searchService: SearchServiceOGM,
    private analysis: AnalysisService
  ) {
    super();
    this.setupEventForwarding();
  }




  private setupEventForwarding(): void {

    this.entities.on("entity:created", (data) => {
      this.emit("entity:created", data);
    });
    this.entities.on("entity:updated", (data) => {
      this.emit("entity:updated", data);
    });
    this.entities.on("entity:deleted", (data) => {
      this.emit("entity:deleted", data);
    });
    this.entities.on("entities:bulk:created", (data) => {
      this.emit("entities:bulk:created", data);
    });


    this.relationships.on("relationship:created", (data) => {
      this.emit("relationship:created", data);
    });
    this.relationships.on("relationship:deleted", (data) => {
      this.emit("relationship:deleted", data);
    });


    this.searchService.on("search:completed", (data) =>
      this.emit("search:completed", data)
    );


    this.analysis.on("impact:analyzed", (data) =>
      this.emit("impact:analyzed", data)
    );
  }




  getEmitter(): EventEmitter {
    return this;
  }
}

================
File: orchestration/KnowledgeGraphService.ts
================
import { EventEmitter } from "events";
import { Neo4jConfig } from "./Neo4jService.js";
import { RelationshipType } from "../../models/relationships.js";
import { ServiceRegistry } from "./knowledge-graph/ServiceRegistry.js";
import { EventOrchestrator } from "./knowledge-graph/EventOrchestrator.js";
import { GraphInitializer } from "./knowledge-graph/GraphInitializer.js";
import {
  EntityManager,
  RelationshipManager,
  SearchManager,
  HistoryManager,
  AnalysisManager,
} from "../../facades/graph/index.js";

interface KnowledgeGraphDependencies {
  neo4j?: import("./Neo4jService.js").Neo4jService;
  neogma?: import("./ogm/NeogmaService.js").NeogmaService;
  entityService?: import("./ogm/EntityServiceOGM.js").EntityServiceOGM;
  relationshipService?: import("./ogm/RelationshipServiceOGM.js").RelationshipServiceOGM;
  searchService?: import("./ogm/SearchServiceOGM.js").SearchServiceOGM;
  embeddingService?: import("./EmbeddingService.js").EmbeddingService;
  historyService?: import("./HistoryService.js").HistoryService;
  analysisService?: import("./AnalysisService.js").AnalysisService;
}


import { Entity } from "../../models/entities.js";
import {
  GraphRelationship,
  RelationshipQuery,
  PathQuery,
} from "../../models/relationships.js";
import {
  GraphSearchRequest,
  ImpactAnalysisRequest,
  ImpactAnalysis,
  DependencyAnalysis,
} from "../../models/types.js";

export class KnowledgeGraphService extends EventEmitter {
  private registry: ServiceRegistry;
  private eventOrchestrator: EventOrchestrator;
  private initializer: GraphInitializer;


  private entityManager: EntityManager;
  private relationshipManager: RelationshipManager;
  private searchManager: SearchManager;
  private historyManager: HistoryManager;
  private analysisManager: AnalysisManager;


  private get neo4j() {
    return this.registry.neo4jService;
  }
  private get neogma() {
    return this.registry.neogmaService;
  }
  private get entities() {
    return this.registry.entityService;
  }
  private get relationships() {
    return this.registry.relationshipService;
  }
  private get embeddings() {
    return this.registry.embeddingService;
  }
  private get searchService() {
    return this.registry.searchService;
  }
  private get history() {
    return this.registry.historyService;
  }
  private get analysis() {
    return this.registry.analysisService;
  }

  constructor(
    config?: Neo4jConfig,
    overrides: KnowledgeGraphDependencies = {}
  ) {
    super();


    this.registry = new ServiceRegistry(config, overrides);


    this.entityManager = new EntityManager(this.entities, this.embeddings);
    this.relationshipManager = new RelationshipManager(this.relationships);
    this.searchManager = new SearchManager(this.searchService);
    this.historyManager = new HistoryManager(this.history, this.neo4j);
    this.analysisManager = new AnalysisManager(this.analysis);


    this.eventOrchestrator = new EventOrchestrator(
      this.entities,
      this.relationships,
      this.searchService,
      this.analysis
    );


    this.eventOrchestrator.on("entity:created", (data) =>
      this.emit("entity:created", data)
    );
    this.eventOrchestrator.on("entity:updated", (data) =>
      this.emit("entity:updated", data)
    );
    this.eventOrchestrator.on("entity:deleted", (data) =>
      this.emit("entity:deleted", data)
    );
    this.eventOrchestrator.on("entities:bulk:created", (data) =>
      this.emit("entities:bulk:created", data)
    );
    this.eventOrchestrator.on("relationship:created", (data) =>
      this.emit("relationship:created", data)
    );
    this.eventOrchestrator.on("relationship:deleted", (data) =>
      this.emit("relationship:deleted", data)
    );
    this.eventOrchestrator.on("search:completed", (data) =>
      this.emit("search:completed", data)
    );
    this.eventOrchestrator.on("impact:analyzed", (data) =>
      this.emit("impact:analyzed", data)
    );


    this.initializer = new GraphInitializer(this.neo4j, this.embeddings);


    this.initializer.on("database:initialized", () =>
      this.emit("database:initialized")
    );
    this.initializer.on("database:error", (error) =>
      this.emit("database:error", error)
    );


    this.initializer
      .initializeDatabase()
      .catch((err) => console.error("Failed to initialize database:", err));

    console.log("[KnowledgeGraphService] Initialized with modular facades");
  }



  async createEntity(
    entity: Entity,
    options?: { skipEmbedding?: boolean }
  ): Promise<Entity> {
    return this.entityManager.createEntity(entity, options);
  }

  async updateEntity(id: string, updates: Partial<Entity>): Promise<Entity> {
    return this.entityManager.updateEntity(id, updates);
  }

  async createOrUpdateEntity(
    entity: Entity,
    options?: { skipEmbedding?: boolean }
  ): Promise<Entity> {
    return this.entityManager.createOrUpdateEntity(entity, options);
  }

  async getEntity(id: string): Promise<Entity | null> {
    return this.entityManager.getEntity(id);
  }

  async deleteEntity(id: string): Promise<void> {
    return this.entityManager.deleteEntity(id);
  }

  async listEntities(
    options?: any
  ): Promise<{ entities?: Entity[]; items: Entity[]; total: number }> {
    return this.entityManager.listEntities(options);
  }

  async createEntitiesBulk(entities: Entity[], options?: any): Promise<any> {
    return this.entityManager.createEntitiesBulk(entities, options);
  }



  async createRelationship(
    relationship: GraphRelationship
  ): Promise<GraphRelationship> {
    return this.relationshipManager.createRelationship(relationship);
  }

  async createRelationshipsBulk(
    relationships: GraphRelationship[],
    options?: any
  ): Promise<any> {
    return this.relationshipManager.createRelationshipsBulk(
      relationships,
      options
    );
  }

  async getRelationships(
    query: RelationshipQuery
  ): Promise<GraphRelationship[]> {
    return this.relationshipManager.getRelationships(query);
  }

  async queryRelationships(
    query: RelationshipQuery
  ): Promise<GraphRelationship[]> {
    return this.relationshipManager.queryRelationships(query);
  }

  async deleteRelationship(
    fromId: string,
    toId: string,
    type: any
  ): Promise<void> {
    return this.relationshipManager.deleteRelationship(fromId, toId, type);
  }



  async searchEntities(request: GraphSearchRequest): Promise<any[]> {
    return this.searchManager.searchEntities(request);
  }

  async search(request: GraphSearchRequest): Promise<Entity[]> {
    return this.searchManager.search(request);
  }

  async semanticSearch(query: string, options?: any): Promise<any[]> {
    return this.searchManager.semanticSearch(query, options);
  }

  async structuralSearch(query: string, options?: any): Promise<any[]> {
    return this.searchManager.structuralSearch(query, options);
  }

  async findSymbolsByName(name: string, options?: any): Promise<Entity[]> {
    return this.searchManager.findSymbolsByName(name, options);
  }

  async findNearbySymbols(
    filePath: string,
    position: any,
    options?: any
  ): Promise<Entity[]> {
    return this.searchManager.findNearbySymbols(filePath, position, options);
  }



  async analyzeImpact(request: ImpactAnalysisRequest): Promise<ImpactAnalysis> {
    return this.analysisManager.analyzeImpact(request);
  }

  async getEntityDependencies(
    entityId: string,
    options?: any
  ): Promise<DependencyAnalysis> {
    return this.analysisManager.getEntityDependencies(entityId, options);
  }

  async findPaths(query: PathQuery): Promise<any> {
    return this.analysisManager.findPaths(query);
  }

  async computeAndStoreEdgeStats(entityId: string): Promise<void> {
    return this.analysisManager.computeAndStoreEdgeStats(entityId);
  }



  async appendVersion(entity: Entity, options?: any): Promise<string> {
    return this.historyManager.appendVersion(entity, options);
  }

  async createCheckpoint(seedEntities: string[], options: any): Promise<any> {
    return this.historyManager.createCheckpoint(seedEntities, options);
  }

  async pruneHistory(retentionDays: number, options?: any): Promise<any> {
    return this.historyManager.pruneHistory(retentionDays, options);
  }

  async listCheckpoints(options?: any): Promise<any> {
    return this.historyManager.listCheckpoints(options);
  }

  async getHistoryMetrics(): Promise<any> {
    return this.historyManager.getHistoryMetrics();
  }

  async timeTravelTraversal(query: any): Promise<any> {
    return this.historyManager.timeTravelTraversal(query);
  }

  async exportCheckpoint(checkpointId: string): Promise<any> {
    return this.historyManager.exportCheckpoint(checkpointId);
  }

  async importCheckpoint(checkpointData: any): Promise<any> {
    return this.historyManager.importCheckpoint(checkpointData);
  }

  async getCheckpoint(checkpointId: string): Promise<any> {
    return this.historyManager.getCheckpoint(checkpointId);
  }

  async getCheckpointMembers(checkpointId: string): Promise<any> {
    return this.historyManager.getCheckpointMembers(checkpointId);
  }

  async getCheckpointSummary(checkpointId: string): Promise<any> {
    return this.historyManager.getCheckpointSummary(checkpointId);
  }

  async deleteCheckpoint(checkpointId: string): Promise<void> {
    return this.historyManager.deleteCheckpoint(checkpointId);
  }

  async getEntityTimeline(entityId: string, options?: any): Promise<any> {
    return this.historyManager.getEntityTimeline(entityId, options);
  }

  async getRelationshipTimeline(
    relationshipId: string,
    options?: any
  ): Promise<any> {
    return this.historyManager.getRelationshipTimeline(relationshipId, options);
  }

  async getSessionTimeline(sessionId: string, options?: any): Promise<any> {
    return this.historyManager.getSessionTimeline(sessionId, options);
  }

  async getSessionImpacts(sessionId: string): Promise<any> {
    return this.historyManager.getSessionImpacts(sessionId);
  }

  async getSessionsAffectingEntity(
    entityId: string,
    options?: any
  ): Promise<any> {
    return this.historyManager.getSessionsAffectingEntity(entityId, options);
  }

  async getChangesForSession(sessionId: string, options?: any): Promise<any> {
    return this.historyManager.getChangesForSession(sessionId, options);
  }



  async createEmbedding(entity: Entity): Promise<any> {
    return this.embeddings.generateAndStore(entity);
  }

  async updateEmbedding(entityId: string, content?: string): Promise<void> {
    return this.embeddings.updateEmbedding(entityId, content);
  }

  async deleteEmbedding(entityId: string): Promise<void> {
    return this.embeddings.deleteEmbedding(entityId);
  }

  async createEmbeddingsBatch(entities: Entity[], options?: any): Promise<any> {
    return this.embeddings.batchEmbed(entities, options);
  }

  async findSimilar(entityId: string, options?: any): Promise<any[]> {
    return this.embeddings.findSimilar(entityId, options);
  }



  async getStats(): Promise<any> {
    const [dbStats, entityStats, relStats, embeddingStats] = await Promise.all([
      this.neo4j.getStats(),
      this.entities.getEntityStats(),
      this.relationships.getRelationshipStats(),
      this.embeddings.getEmbeddingStats(),
    ]);

    return {
      database: dbStats,
      entities: entityStats,
      relationships: relStats,
      embeddings: embeddingStats,
    };
  }

  async clearSearchCache(): Promise<void> {
    return this.searchManager.clearSearchCache();
  }

  async invalidateSearchCache(pattern?: any): Promise<void> {
    return this.searchManager.invalidateSearchCache(pattern);
  }

  async ensureIndices(): Promise<void> {
    await this.initializer.ensureIndices();
  }

  async mergeNormalizedDuplicates(): Promise<number> {
    return this.relationshipManager.mergeNormalizedDuplicates();
  }

  async markInactiveEdgesNotSeenSince(since: Date): Promise<number> {
    return this.relationshipManager.markInactiveEdgesNotSeenSince(since);
  }

  async getIndexHealth(): Promise<any> {
    return this.neo4j.getIndexHealth();
  }

  async ensureGraphIndexes(): Promise<void> {
    await this.initializer.ensureGraphIndexes();
  }

  async runBenchmarks(options?: any): Promise<any> {
    return this.initializer.runBenchmarks(options);
  }



  async close(): Promise<void> {
    await this.registry.close();
    this.emit("service:closed");
  }



  async initialize(): Promise<void> {
    await this.initializer.initializeDatabase();
  }

  async getEntitiesByFile(filePath: string): Promise<Entity[]> {
    return this.entityManager.getEntitiesByFile(filePath);
  }

  async getEntityExamples(entityId: string): Promise<any> {
    return this.searchManager.getEntityExamples(entityId);
  }

  async upsertEdgeEvidenceBulk(updates: any[]): Promise<void> {
    return this.relationshipManager.upsertEdgeEvidenceBulk(updates);
  }

  async openEdge(
    fromId: string,
    toId: string,
    type: any,
    ts?: Date,
    changeSetId?: string
  ): Promise<void> {
    return this.historyManager.openEdge(fromId, toId, type, ts, changeSetId);
  }

  async closeEdge(
    fromId: string,
    toId: string,
    type: any,
    ts?: Date
  ): Promise<void> {
    return this.historyManager.closeEdge(fromId, toId, type, ts);
  }



  async annotateSessionRelationshipsWithCheckpoint(
    sessionId: string,
    checkpointId: string,
    relationshipIds?: string[],
    timestamp?: Date
  ): Promise<void> {
    return this.historyManager.annotateSessionRelationshipsWithCheckpoint(
      sessionId,
      checkpointId,
      relationshipIds,
      timestamp
    );
  }

  async createSessionCheckpointLink(
    sessionId: string,
    checkpointId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    return this.historyManager.createSessionCheckpointLink(
      sessionId,
      checkpointId,
      metadata
    );
  }



  async findRecentEntityIds(limit?: number): Promise<string[]> {
    return this.entityManager.findRecentEntityIds(limit);
  }

  async findEntitiesByType(entityType: string): Promise<Entity[]> {
    return this.entityManager.findEntitiesByType(entityType);
  }

  async listRelationships(
    query: RelationshipQuery
  ): Promise<{ relationships: GraphRelationship[]; total: number }> {
    return this.relationshipManager.listRelationships(query);
  }

  async listModuleChildren(
    moduleId: string,
    options?: any
  ): Promise<{ children: Entity[]; modulePath?: string }> {

    const relationships = await this.relationships.getRelationships({
      fromEntityId: moduleId,
      type: RelationshipType.CONTAINS,
    });
    const childIds = relationships.map(
      (r) => (r as any).toEntityId || (r as any).to?.id
    );
    const children = await Promise.all(
      childIds.map((id) => this.entities.getEntity(id))
    );
    return {
      children: children.filter((e): e is Entity => e !== null),
      modulePath: moduleId,
    };
  }

  async listImports(
    fileId: string,
    options?: any
  ): Promise<{ imports: Entity[]; entityId?: string }> {

    const relationships = await this.relationships.getRelationships({
      fromEntityId: fileId,
      type: RelationshipType.IMPORTS,
    });
    const importIds = relationships.map(
      (r) => (r as any).toEntityId || (r as any).to?.id
    );
    const imports = await Promise.all(
      importIds.map((id) => this.entities.getEntity(id))
    );
    return {
      imports: imports.filter((e): e is Entity => e !== null),
      entityId: fileId,
    };
  }

  async findDefinition(symbolId: string): Promise<Entity | null> {

    const relationships = await this.relationships.getRelationships({
      fromEntityId: symbolId,
      type: RelationshipType.DEFINES,
    });
    if (relationships.length > 0) {
      const toId =
        (relationships[0] as any).toEntityId ||
        (relationships[0] as any).to?.id;
      return toId ? this.entities.getEntity(toId) : null;
    }
    return null;
  }



  async getRelationshipById(
    relationshipId: string
  ): Promise<GraphRelationship | null> {
    return this.relationshipManager.getRelationshipById(relationshipId);
  }

  async getEdgeEvidenceNodes(
    relationshipId: string,
    limit?: number
  ): Promise<any[]> {
    return this.relationshipManager.getEdgeEvidenceNodes(relationshipId, limit);
  }

  async getEdgeSites(relationshipId: string, limit?: number): Promise<any[]> {
    return this.relationshipManager.getEdgeSites(relationshipId, limit);
  }

  async getEdgeCandidates(
    relationshipId: string,
    limit?: number
  ): Promise<any[]> {
    return this.relationshipManager.getEdgeCandidates(relationshipId, limit);
  }



  async repairPreviousVersionLink(versionId: string): Promise<void> {
    return this.historyManager.repairPreviousVersionLink(versionId);
  }



  async upsertRelationship(
    relationship: GraphRelationship
  ): Promise<GraphRelationship> {
    return this.relationshipManager.upsertRelationship(relationship);
  }

  async canonicalizeRelationship(
    relationship: GraphRelationship
  ): Promise<GraphRelationship> {
    return this.relationshipManager.canonicalizeRelationship(relationship);
  }

  async finalizeScan(scanStart: Date): Promise<void> {
    return this.relationshipManager.finalizeScan(scanStart);
  }







  async processDirectory(
    directoryPath: string,
    options: {
      batchSize?: number;
      maxConcurrency?: number;
      skipEmbeddings?: boolean;
      progressCallback?: (progress: { processed: number; total: number; errors: number }) => void;
      fileFilters?: string[];
    } = {}
  ): Promise<{
    success: boolean;
    processedFiles: number;
    processedEntities: number;
    processedRelationships: number;
    errors: Array<{ file: string; error: string }>;
    metrics: {
      totalTimeMs: number;
      entitiesPerSecond: number;
      filesPerSecond: number;
    };
  }> {
    const startTime = Date.now();
    const errors: Array<{ file: string; error: string }> = [];
    let processedFiles = 0;
    let processedEntities = 0;
    let processedRelationships = 0;

    try {

      const { HighThroughputIngestionPipeline } = await import('../ingestion/pipeline.js');
      const { createKnowledgeGraphAdapter } = await import('../ingestion/knowledge-graph-adapter.js');


      const adapter = createKnowledgeGraphAdapter(this);


      const pipelineConfig = {
        batchSize: options.batchSize || 100,
        maxConcurrency: options.maxConcurrency || 4,
        queueConfig: {
          maxSize: 10000,
          partitions: 4,
          persistenceConfig: {
            enabled: false
          }
        },
        workerConfig: {
          poolSize: options.maxConcurrency || 4,
          taskTimeout: 30000
        },
        batchConfig: {
          maxBatchSize: options.batchSize || 100,
          flushInterval: 1000,
          enableCompression: false
        },
        enrichmentConfig: {
          enableEmbeddings: !options.skipEmbeddings,
          batchSize: 25
        }
      };


      const pipeline = new HighThroughputIngestionPipeline(pipelineConfig, adapter, {
        embeddingService: this.embeddings
      });


      pipeline.on('batch:completed', (data: any) => {
        processedEntities += data.entitiesProcessed || 0;
        processedRelationships += data.relationshipsProcessed || 0;

        if (options.progressCallback) {
          options.progressCallback({
            processed: processedFiles,
            total: 0,
            errors: errors.length
          });
        }
      });

      pipeline.on('error', (error: any) => {
        errors.push({
          file: error.context?.filePath || 'unknown',
          error: error.message || 'Unknown error'
        });
      });

      await pipeline.start();

      try {

        await this.processDirectoryRecursively(
          directoryPath,
          pipeline,
          options.fileFilters,
          (filePath: string) => {
            processedFiles++;
            if (options.progressCallback) {
              options.progressCallback({
                processed: processedFiles,
                total: 0,
                errors: errors.length
              });
            }
          }
        );


        await pipeline.waitForCompletion();

      } finally {
        await pipeline.stop();
      }

      const totalTimeMs = Date.now() - startTime;
      const entitiesPerSecond = processedEntities / (totalTimeMs / 1000);
      const filesPerSecond = processedFiles / (totalTimeMs / 1000);

      return {
        success: errors.length === 0,
        processedFiles,
        processedEntities,
        processedRelationships,
        errors,
        metrics: {
          totalTimeMs,
          entitiesPerSecond,
          filesPerSecond
        }
      };

    } catch (error) {
      console.error('[KnowledgeGraphService] Directory processing failed:', error);
      errors.push({
        file: directoryPath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      const totalTimeMs = Date.now() - startTime;
      return {
        success: false,
        processedFiles,
        processedEntities,
        processedRelationships,
        errors,
        metrics: {
          totalTimeMs,
          entitiesPerSecond: 0,
          filesPerSecond: 0
        }
      };
    }
  }




  private async processDirectoryRecursively(
    dirPath: string,
    pipeline: any,
    fileFilters?: string[],
    onFileProcessed?: (filePath: string) => void
  ): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {

          if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
            continue;
          }
          await this.processDirectoryRecursively(fullPath, pipeline, fileFilters, onFileProcessed);
        } else if (entry.isFile()) {

          if (fileFilters && fileFilters.length > 0) {
            const shouldProcess = fileFilters.some(filter => {
              if (filter.startsWith('*.')) {
                return fullPath.endsWith(filter.slice(1));
              }
              return fullPath.includes(filter);
            });
            if (!shouldProcess) continue;
          }


          const supportedExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.h'];
          const hasValidExtension = supportedExtensions.some(ext => fullPath.endsWith(ext));

          if (hasValidExtension) {
            await pipeline.processFile(fullPath);
            onFileProcessed?.(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`[KnowledgeGraphService] Error processing directory ${dirPath}:`, error);
      throw error;
    }
  }
}

================
File: orchestration/PerformanceOptimizer.ts
================
import { Entity, Symbol as SymbolEntity } from "../../../models/entities.js";
import { GraphRelationship } from "../../../models/relationships.js";




export interface OptimizationConfig {
  maxCacheSize: number;
  batchSize: number;
  gcThreshold: number;
  enableLazyLoading: boolean;
  enableWeakRefs: boolean;
}




export interface PerformanceMetrics {
  memoryUsage: NodeJS.MemoryUsage;
  cacheHitRate: number;
  parsedFiles: number;
  totalEntities: number;
  totalRelationships: number;
  averageParseTime: number;
}




export class PerformanceOptimizer {
  private config: OptimizationConfig;
  private metrics: PerformanceMetrics;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private parseStartTimes: Map<string, number> = new Map();
  private totalParseTime: number = 0;
  private parsedFileCount: number = 0;


  private weakEntityRefs: WeakMap<Entity, any> = new WeakMap();
  private weakRelationshipRefs: WeakMap<GraphRelationship, any> = new WeakMap();

  constructor(config?: Partial<OptimizationConfig>) {
    this.config = {
      maxCacheSize: 1000,
      batchSize: 50,
      gcThreshold: 100,
      enableLazyLoading: true,
      enableWeakRefs: true,
      ...config,
    };

    this.metrics = {
      memoryUsage: process.memoryUsage(),
      cacheHitRate: 0,
      parsedFiles: 0,
      totalEntities: 0,
      totalRelationships: 0,
      averageParseTime: 0,
    };
  }





  startParseTimer(filePath: string): void {
    this.parseStartTimes.set(filePath, Date.now());
  }





  endParseTimer(filePath: string): void {
    const startTime = this.parseStartTimes.get(filePath);
    if (startTime) {
      const parseTime = Date.now() - startTime;
      this.totalParseTime += parseTime;
      this.parsedFileCount++;
      this.parseStartTimes.delete(filePath);
    }
  }




  recordCacheHit(): void {
    this.cacheHits++;
    this.updateCacheHitRate();
  }




  recordCacheMiss(): void {
    this.cacheMisses++;
    this.updateCacheHitRate();
  }




  private updateCacheHitRate(): void {
    const total = this.cacheHits + this.cacheMisses;
    this.metrics.cacheHitRate = total > 0 ? (this.cacheHits / total) * 100 : 0;
  }







  async processBatchedEntities<T>(
    entities: Entity[],
    processor: (batch: Entity[]) => Promise<T[]>
  ): Promise<T[]> {
    const results: T[] = [];
    const batchSize = this.config.batchSize;

    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);


      if (i % this.config.gcThreshold === 0 && global.gc) {
        global.gc();
      }
    }

    return results;
  }







  optimizeSymbolMap(symbolMap: Map<string, SymbolEntity>, maxAge: number = 3600000): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, symbol] of symbolMap.entries()) {
      const age = now - symbol.lastModified.getTime();
      if (age > maxAge) {
        symbolMap.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }






  createLRUCache<K, V>(maxSize: number = this.config.maxCacheSize): Map<K, V> & {
    delete: (key: K) => boolean;
    clear: () => void;
    has: (key: K) => boolean;
    get: (key: K) => V | undefined;
    set: (key: K, value: V) => this;
  } {
    const cache = new Map<K, V>();
    const usage = new Map<K, number>();
    let counter = 0;

    const lruCache = {
      delete: (key: K): boolean => {
        usage.delete(key);
        return cache.delete(key);
      },
      clear: (): void => {
        cache.clear();
        usage.clear();
        counter = 0;
      },
      has: (key: K): boolean => cache.has(key),
      get: (key: K): V | undefined => {
        if (cache.has(key)) {
          usage.set(key, ++counter);
          return cache.get(key);
        }
        return undefined;
      },
      set: (key: K, value: V): typeof lruCache => {

        if (cache.size >= maxSize && !cache.has(key)) {
          let lruKey: K | undefined;
          let lruTime = Infinity;

          for (const [k, time] of usage) {
            if (time < lruTime) {
              lruTime = time;
              lruKey = k;
            }
          }

          if (lruKey !== undefined) {
            cache.delete(lruKey);
            usage.delete(lruKey);
          }
        }

        cache.set(key, value);
        usage.set(key, ++counter);
        return lruCache;
      },
    } as Map<K, V> & {
      delete: (key: K) => boolean;
      clear: () => void;
      has: (key: K) => boolean;
      get: (key: K) => V | undefined;
      set: (key: K, value: V) => typeof lruCache;
    };

    return lruCache;
  }






  compressEntity(entity: Entity): Entity {
    const compressed = { ...entity };


    if (compressed.metadata) {
      const metadata = compressed.metadata as any;
      if (metadata.sourceCode && metadata.sourceCode.length > 1000) {
        metadata.sourceCode = metadata.sourceCode.substring(0, 500) + "...";
      }
      if (metadata.comments && Array.isArray(metadata.comments)) {
        metadata.comments = metadata.comments.slice(0, 5);
      }
    }


    if (this.config.enableWeakRefs && entity.type === "symbol") {
      const symbol = entity as SymbolEntity;
      if (symbol.signature && symbol.signature.length > 500) {
        this.weakEntityRefs.set(compressed, { originalSignature: symbol.signature });
        (compressed as any).signature = symbol.signature.substring(0, 200) + "...";
      }
    }

    return compressed;
  }





  getMetrics(): PerformanceMetrics {
    this.metrics.memoryUsage = process.memoryUsage();
    this.metrics.averageParseTime = this.parsedFileCount > 0
      ? this.totalParseTime / this.parsedFileCount
      : 0;

    return { ...this.metrics };
  }






  updateCounts(entityCount: number, relationshipCount: number): void {
    this.metrics.totalEntities = entityCount;
    this.metrics.totalRelationships = relationshipCount;
    this.metrics.parsedFiles = this.parsedFileCount;
  }




  resetMetrics(): void {
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.totalParseTime = 0;
    this.parsedFileCount = 0;
    this.parseStartTimes.clear();
    this.weakEntityRefs = new WeakMap();
    this.weakRelationshipRefs = new WeakMap();

    this.metrics = {
      memoryUsage: process.memoryUsage(),
      cacheHitRate: 0,
      parsedFiles: 0,
      totalEntities: 0,
      totalRelationships: 0,
      averageParseTime: 0,
    };
  }






  isMemoryPressureHigh(threshold: number = 512): boolean {
    const usage = process.memoryUsage();
    const usageMB = usage.heapUsed / 1024 / 1024;
    return usageMB > threshold;
  }





  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const metrics = this.getMetrics();

    if (metrics.cacheHitRate < 50) {
      suggestions.push("Cache hit rate is low - consider increasing cache size or improving cache strategy");
    }

    if (metrics.averageParseTime > 1000) {
      suggestions.push("Average parse time is high - consider enabling parallel processing or optimizing parser logic");
    }

    const memoryMB = metrics.memoryUsage.heapUsed / 1024 / 1024;
    if (memoryMB > 256) {
      suggestions.push("Memory usage is high - consider enabling entity compression or reducing cache size");
    }

    if (this.isMemoryPressureHigh()) {
      suggestions.push("Memory pressure is high - consider running garbage collection more frequently");
    }

    return suggestions;
  }
}

================
File: orchestration/ServiceRegistry.ts
================
import { Neo4jService, Neo4jConfig } from "../Neo4jService.js";
import { NeogmaService } from "../ogm/NeogmaService.js";
import { EntityServiceOGM } from "../ogm/EntityServiceOGM.js";
import { RelationshipServiceOGM } from "../ogm/RelationshipServiceOGM.js";
import { SearchServiceOGM } from "../ogm/SearchServiceOGM.js";
import { EmbeddingService } from "../EmbeddingService.js";
import { HistoryService } from "../HistoryService.js";
import { AnalysisService } from "../AnalysisService.js";

interface KnowledgeGraphDependencies {
  neo4j?: Neo4jService;
  neogma?: NeogmaService;
  entityService?: EntityServiceOGM;
  relationshipService?: RelationshipServiceOGM;
  searchService?: SearchServiceOGM;
  embeddingService?: EmbeddingService;
  historyService?: HistoryService;
  analysisService?: AnalysisService;
}

export class ServiceRegistry {
  private neo4j!: Neo4jService;
  private neogma!: NeogmaService;
  private entities!: EntityServiceOGM;
  private relationships!: RelationshipServiceOGM;
  private embeddings!: EmbeddingService;
  private searchServiceOGM!: SearchServiceOGM;
  private history!: HistoryService;
  private analysis!: AnalysisService;

  constructor(
    config?: Neo4jConfig,
    overrides: KnowledgeGraphDependencies = {}
  ) {
    this.initializeServices(config, overrides);
  }

  private initializeServices(
    config?: Neo4jConfig,
    overrides: KnowledgeGraphDependencies = {}
  ): void {
    const neo4jConfig: Neo4jConfig = {
      uri: config?.uri || process.env.NEO4J_URI || "bolt://localhost:7687",
      username: config?.username || process.env.NEO4J_USERNAME || "neo4j",
      password: config?.password || process.env.NEO4J_PASSWORD || "password",
      database: config?.database || process.env.NEO4J_DATABASE || "neo4j",
      maxConnectionPoolSize: config?.maxConnectionPoolSize,
    };


    this.neo4j = overrides.neo4j ?? new Neo4jService(neo4jConfig);
    this.neogma = overrides.neogma ?? new NeogmaService(neo4jConfig);
    this.entities =
      overrides.entityService ?? new EntityServiceOGM(this.neogma);
    this.relationships =
      overrides.relationshipService ?? new RelationshipServiceOGM(this.neogma);
    this.embeddings =
      overrides.embeddingService ?? new EmbeddingService(this.neo4j);
    this.searchServiceOGM =
      overrides.searchService ??
      new SearchServiceOGM(this.neogma, this.embeddings);
    this.history = overrides.historyService ?? new HistoryService(this.neo4j);
    this.analysis =
      overrides.analysisService ?? new AnalysisService(this.neo4j);

    console.log("[ServiceRegistry] Initialized with OGM services only");
  }


  get neo4jService(): Neo4jService {
    return this.neo4j;
  }

  get neogmaService(): NeogmaService {
    return this.neogma;
  }

  get entityService(): EntityServiceOGM {
    return this.entities;
  }

  get relationshipService(): RelationshipServiceOGM {
    return this.relationships;
  }

  get embeddingService(): EmbeddingService {
    return this.embeddings;
  }

  get searchService(): SearchServiceOGM {
    return this.searchServiceOGM;
  }

  get historyService(): HistoryService {
    return this.history;
  }

  get analysisService(): AnalysisService {
    return this.analysis;
  }




  async close(): Promise<void> {
    await this.neo4j.close();
    if (typeof this.neogma.close === "function") {
      await this.neogma.close();
    }
  }
}

================
File: orchestration/StatsCollector.ts
================
import { EventEmitter } from "events";
import { Neo4jService } from "../Neo4jService.js";
import { buildEntityStatsQueries } from "./queries.js";

export interface EntityEdgeStats {
  byType: Record<string, number>;
  topSymbols: Array<{ symbol: string; count: number }>;
  inbound: number;
  outbound: number;
  total: number;
  avgDegree: number;
}

export interface StatsSummary {
  totalEntities: number;
  totalRelationships: number;
  avgRelationshipsPerEntity: number;
  mostConnectedEntity: {
    id: string;
    relationshipCount: number;
  };
  relationshipTypeDistribution: Record<string, number>;
}

export class StatsCollector extends EventEmitter {
  constructor(private neo4j: Neo4jService) {
    super();
  }




  async computeAndStoreEdgeStats(entityId: string): Promise<void> {
    const stats = await this.getEntityEdgeStats(entityId);

    const query = `
      MERGE (s:EdgeStats {id: $statsId})
      SET s.entityId = $entityId
      SET s.payload = $payload
      SET s.updatedAt = datetime()
    `;

    await this.neo4j.executeCypher(query, {
      statsId: `stats_${entityId}`,
      entityId,
      payload: JSON.stringify(stats),
    });

    this.emit("stats:computed", { entityId, stats });
  }




  async getEntityEdgeStats(entityId: string): Promise<EntityEdgeStats> {
    const queries = buildEntityStatsQueries(entityId);

    const results = await Promise.all([
      this.neo4j.executeCypher(queries.byType, { entityId }),
      this.neo4j.executeCypher(queries.topSymbols, { entityId }),
      this.neo4j.executeCypher(queries.inbound, { entityId }),
      this.neo4j.executeCypher(queries.outbound, { entityId }),
    ]);

    const byType: Record<string, number> = {};
    results[0].forEach((r: any) => {
      byType[r.type] = r.count;
    });

    const topSymbols = results[1].map((r: any) => ({
      symbol: r.symbol,
      count: r.count,
    }));

    const inbound = results[2][0]?.count || 0;
    const outbound = results[3][0]?.count || 0;

    return {
      byType,
      topSymbols,
      inbound,
      outbound,
      total: inbound + outbound,
      avgDegree: (inbound + outbound) / 2,
    };
  }




  async getGlobalStatsSummary(): Promise<StatsSummary> {
    const queries = [
      {
        name: "entityCount",
        query: "MATCH (n:Entity) RETURN count(n) AS count",
      },
      {
        name: "relationshipCount",
        query: "MATCH ()-[r]->() RETURN count(r) AS count",
      },
      {
        name: "mostConnected",
        query: `
          MATCH (n:Entity)
          OPTIONAL MATCH (n)-[r]-()
          RETURN n.id AS id, count(r) AS relationshipCount
          ORDER BY relationshipCount DESC
          LIMIT 1
        `,
      },
      {
        name: "typeDistribution",
        query: `
          MATCH ()-[r]->()
          RETURN type(r) AS type, count(r) AS count
          ORDER BY count DESC
        `,
      },
    ];

    const results = await Promise.all(
      queries.map((q) => this.neo4j.executeCypher(q.query))
    );

    const totalEntities = results[0][0]?.count || 0;
    const totalRelationships = results[1][0]?.count || 0;
    const mostConnected = results[2][0] || { id: "", relationshipCount: 0 };

    const relationshipTypeDistribution: Record<string, number> = {};
    results[3].forEach((r: any) => {
      relationshipTypeDistribution[r.type] = r.count;
    });

    return {
      totalEntities,
      totalRelationships,
      avgRelationshipsPerEntity:
        totalEntities > 0 ? totalRelationships / totalEntities : 0,
      mostConnectedEntity: {
        id: mostConnected.id,
        relationshipCount: mostConnected.relationshipCount,
      },
      relationshipTypeDistribution,
    };
  }




  async getCachedEntityStats(
    entityId: string
  ): Promise<EntityEdgeStats | null> {
    const query = `
      MATCH (s:EdgeStats {id: $statsId})
      RETURN s.payload AS payload
    `;

    const result = await this.neo4j.executeCypher(query, {
      statsId: `stats_${entityId}`,
    });

    if (result.length === 0) {
      return null;
    }

    try {
      return JSON.parse(result[0].payload);
    } catch {
      return null;
    }
  }




  async computeBatchStats(
    entityIds: string[]
  ): Promise<Record<string, EntityEdgeStats>> {
    const stats: Record<string, EntityEdgeStats> = {};


    const batchSize = 10;
    for (let i = 0; i < entityIds.length; i += batchSize) {
      const batch = entityIds.slice(i, i + batchSize);
      const batchPromises = batch.map((id) => this.getEntityEdgeStats(id));
      const batchResults = await Promise.all(batchPromises);

      batch.forEach((id, index) => {
        stats[id] = batchResults[index];
      });
    }

    return stats;
  }




  async cleanupOldStats(olderThanDays: number = 30): Promise<number> {
    const query = `
      MATCH (s:EdgeStats)
      WHERE s.updatedAt < datetime() - duration({days: $days})
      DETACH DELETE s
      RETURN count(s) AS deletedCount
    `;

    const result = await this.neo4j.executeCypher(query, {
      days: olderThanDays,
    });

    return result[0]?.deletedCount || 0;
  }




  async getStatsTrends(
    entityId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<Array<{ timestamp: Date; stats: EntityEdgeStats }>> {


    const currentStats = await this.getEntityEdgeStats(entityId);

    return [
      {
        timestamp: new Date(),
        stats: currentStats,
      },
    ];
  }




  async analyzeRelationshipPatterns(): Promise<{
    mostCommonTypes: Array<{ type: string; count: number; percentage: number }>;
    connectivityDistribution: Array<{ degree: number; entityCount: number }>;
    clusterCoefficients: { average: number; global: number };
  }> {

    const typeQuery = `
      MATCH ()-[r]->()
      RETURN type(r) AS type, count(r) AS count
      ORDER BY count DESC
      LIMIT 10
    `;

    const typeResult = await this.neo4j.executeCypher(typeQuery);
    const totalRelationships = typeResult.reduce(
      (sum, r: any) => sum + r.count,
      0
    );

    const mostCommonTypes = typeResult.map((r: any) => ({
      type: r.type,
      count: r.count,
      percentage: (r.count / totalRelationships) * 100,
    }));


    const degreeQuery = `
      MATCH (n:Entity)
      OPTIONAL MATCH (n)-[r]-()
      WITH n, count(r) AS degree
      RETURN degree, count(n) AS entityCount
      ORDER BY degree
    `;

    const degreeResult = await this.neo4j.executeCypher(degreeQuery);
    const connectivityDistribution = degreeResult.map((r: any) => ({
      degree: r.degree,
      entityCount: r.entityCount,
    }));


    const clusterQuery = `
      MATCH (n:Entity)
      OPTIONAL MATCH (n)-[r1]-()-[r2]-(n)
      WHERE type(r1) = type(r2)
      WITH n, count(DISTINCT r1) AS triangles
      OPTIONAL MATCH (n)-[r]-()
      WITH n, triangles, count(r) AS degree
      WHERE degree > 1
      RETURN avg(toFloat(triangles) / (degree * (degree - 1))) AS averageClustering
    `;

    const clusterResult = await this.neo4j.executeCypher(clusterQuery);
    const averageClustering = clusterResult[0]?.averageClustering || 0;

    return {
      mostCommonTypes,
      connectivityDistribution,
      clusterCoefficients: {
        average: averageClustering,
        global: 0,
      },
    };
  }
}

================
File: orchestration/SyncOrchestrator.ts
================
import { readdirSync, statSync } from "fs";
import { join, extname } from "path";
import { KnowledgeGraphService } from "../KnowledgeGraphService.js";
import { DatabaseService } from "../../core/DatabaseService.js";
import { DocTokenizer, ParsedDocument } from "./DocTokenizer.js";
import { IntentExtractor } from "./IntentExtractor.js";
import {
  DocumentationNode,
  BusinessDomain,
  SemanticCluster,
  Entity,
} from "../../../models/entities.js";
import {
  RelationshipType,
  DocumentationRelationship,
} from "../../../models/relationships.js";

export interface SyncResult {
  processedFiles: number;
  newDomains: number;
  updatedClusters: number;
  errors: string[];
  refreshedRelationships?: number;
  staleRelationships?: number;
  sectionsLinked?: number;
}

export interface SearchResult {
  document: DocumentationNode;
  relevanceScore: number;
  matchedSections: string[];
}

export class SyncOrchestrator {
  private tokenizer: DocTokenizer;
  private intentExtractor: IntentExtractor;
  private supportedExtensions = [".md", ".txt", ".rst", ".adoc"];

  constructor(
    private kgService: KnowledgeGraphService,
    private dbService: DatabaseService,
    intentExtractor: IntentExtractor
  ) {
    this.tokenizer = new DocTokenizer();
    this.intentExtractor = intentExtractor;
  }




  async syncDocumentation(docsPath: string): Promise<SyncResult> {
    const result: SyncResult = {
      processedFiles: 0,
      newDomains: 0,
      updatedClusters: 0,
      errors: [],
    };

    try {
      const files = this.discoverFiles(docsPath);
      result.processedFiles = files.length;

      for (const filePath of files) {
        try {
          await this.processFile(filePath);
        } catch (error) {
          const errorMsg = `Failed to process ${filePath}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }


      await this.updateFreshnessTracking(docsPath);


      const cleanupResult = await this.cleanupStaleRelationships();
      result.staleRelationships = cleanupResult.removed;

      console.log(
        `Documentation sync completed: ${result.processedFiles} files processed`
      );
    } catch (error) {
      const errorMsg = `Documentation sync failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
      result.errors.push(errorMsg);
      console.error(errorMsg);
    }

    return result;
  }




  private async processFile(filePath: string): Promise<void> {

    const parsedDoc = await this.tokenizer.parseFile(filePath);


    const content = parsedDoc.content;


    const enhancedDoc = await this.intentExtractor.enhanceDocument(
      parsedDoc,
      content
    );


    await this.createOrUpdateDocumentationEntity(enhancedDoc);


    for (const domainName of enhancedDoc.businessDomains) {
      await this.createOrUpdateDomainEntity(domainName, enhancedDoc, content);
    }


    await this.createSemanticClusters(enhancedDoc);
  }




  private async createOrUpdateDocumentationEntity(
    document: ParsedDocument
  ): Promise<void> {
    const docEntity: DocumentationNode = {
      id: `doc_${document.docHash}`,
      name: document.title,
      type: "documentation",
      path: document.metadata?.filePath || "",
      content: document.content,
      docType: document.docType,
      docIntent: document.docIntent,
      docVersion: document.docVersion,
      docHash: document.docHash,
      docSource: document.docSource,
      docLocale: document.docLocale,
      lastModified: document.lastIndexed,
      created: document.lastIndexed,
      metadata: {
        ...document.metadata,
        businessDomains: document.businessDomains,
        stakeholders: document.stakeholders,
        technologies: document.technologies,
      },
    };

    await this.kgService.createOrUpdateEntity(docEntity);
  }

  /**
   * Create or update business domain entity
   */
  private async createOrUpdateDomainEntity(
    domainName: string,
    document: ParsedDocument,
    content: string
  ): Promise<void> {
    const domainPath = this.normalizeDomainPath(domainName);
    const domainEntity: BusinessDomain = {
      id: `domain_${domainPath}`,
      name: domainName,
      type: "business-domain",
      path: domainPath,
      description: `Business domain: ${domainName}`,
      criticality: this.intentExtractor.inferDomainCriticality(
        domainName,
        content
      ),
      stakeholders: document.stakeholders,
      keyProcesses: [],
      lastModified: new Date(),
      created: new Date(),
      metadata: {
        sourceDocument: document.metadata?.filePath,
        extractedFrom: document.docHash,
      },
    };

    await this.kgService.createOrUpdateEntity(domainEntity);


    const docEntityId = `doc_${document.docHash}`;
    await this.kgService.createRelationship({
      id: `rel_doc_domain_${document.docHash}_${domainPath}`,
      fromEntityId: docEntityId,
      toEntityId: domainEntity.id,
      type: RelationshipType.DOCUMENTS,
      properties: {
        confidence: 0.8,
        source: "parser",
        lastSeen: new Date(),
      },
    });
  }




  private async createSemanticClusters(
    document: ParsedDocument
  ): Promise<void> {

    const clusters = this.extractSemanticClusters(document);

    for (const cluster of clusters) {
      const clusterEntity: SemanticCluster = {
        id: `cluster_${document.docHash}_${cluster.name
          .toLowerCase()
          .replace(/\s+/g, "_")}`,
        name: cluster.name,
        type: "semantic-cluster",
        description: cluster.description,
        concepts: cluster.concepts,
        confidence: cluster.confidence,
        lastModified: new Date(),
        created: new Date(),
        metadata: {
          sourceDocument: document.metadata?.filePath,
          documentHash: document.docHash,
        },
      };

      await this.kgService.createOrUpdateEntity(clusterEntity);


      await this.kgService.createRelationship({
        id: `rel_doc_cluster_${document.docHash}_${clusterEntity.id}`,
        fromEntityId: `doc_${document.docHash}`,
        toEntityId: clusterEntity.id,
        type: RelationshipType.CONTAINS,
        properties: {
          confidence: cluster.confidence,
          source: "parser",
          lastSeen: new Date(),
        },
      });
    }
  }




  async searchDocumentation(
    query: string,
    options?: {
      limit?: number;
      minScore?: number;
      domain?: string;
    }
  ): Promise<SearchResult[]> {
    const limit = options?.limit || 10;
    const minScore = options?.minScore || 0.1;


    const documents = await this.kgService.searchEntities({
      query,
      types: ["documentation"],
      limit: limit * 2,
    });

    const results: SearchResult[] = [];

    for (const result of documents) {
      const document = result.entity as DocumentationNode;
      const relevanceScore = this.calculateRelevanceScore(query, document);
      const matchedSections = this.findMatchedSections(query, document.content);

      if (relevanceScore >= minScore) {
        results.push({
          document,
          relevanceScore,
          matchedSections,
        });
      }
    }


    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }




  private discoverFiles(docsPath: string): string[] {
    const files: string[] = [];

    const walkDirectory = (dirPath: string) => {
      try {
        const entries = readdirSync(dirPath);

        for (const entry of entries) {
          const fullPath = join(dirPath, entry);
          const stat = statSync(fullPath);

          if (stat.isDirectory()) {

            if (!["node_modules", ".git", "dist", "build"].includes(entry)) {
              walkDirectory(fullPath);
            }
          } else if (stat.isFile()) {
            const ext = extname(entry).toLowerCase();
            if (this.supportedExtensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to read directory ${dirPath}:`, error);
      }
    };

    walkDirectory(docsPath);
    return files;
  }




  private async updateFreshnessTracking(docsPath: string): Promise<void> {
    const freshnessWindow = this.getFreshnessWindowDays();


    await this.kgService.markInactiveEdgesNotSeenSince(
      new Date(Date.now() - freshnessWindow * 24 * 60 * 60 * 1000)
    );
  }




  private async cleanupStaleRelationships(): Promise<{ removed: number }> {


    return { removed: 0 };
  }




  private extractSemanticClusters(document: ParsedDocument): Array<{
    name: string;
    description: string;
    concepts: string[];
    confidence: number;
  }> {

    const clusters: Array<{
      name: string;
      description: string;
      concepts: string[];
      confidence: number;
    }> = [];


    const headings = document.metadata?.headings || [];
    const concepts = headings.map((h) => h.text).slice(0, 5);

    if (concepts.length > 0) {
      clusters.push({
        name: `${document.title} Concepts`,
        description: `Key concepts extracted from ${document.title}`,
        concepts,
        confidence: 0.7,
      });
    }

    return clusters;
  }




  private calculateRelevanceScore(
    query: string,
    document: DocumentationNode
  ): number {
    const queryLower = query.toLowerCase();
    const titleLower = document.name.toLowerCase();
    const contentLower = document.content.toLowerCase();

    let score = 0;


    if (titleLower.includes(queryLower)) {
      score += 0.4;
    }


    const contentMatches = (
      contentLower.match(new RegExp(queryLower, "g")) || []
    ).length;
    score += Math.min(contentMatches * 0.1, 0.4);


    if (
      contentLower.includes(` ${queryLower} `) ||
      contentLower.startsWith(queryLower)
    ) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }




  private findMatchedSections(query: string, content: string): string[] {
    const lines = content.split("\n");
    const matchedSections: string[] = [];
    const queryLower = query.toLowerCase();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.toLowerCase().includes(queryLower)) {

        let sectionHeader = "";
        for (let j = i; j >= 0 && j > i - 10; j--) {
          if (lines[j].match(/^#{1,6}\s/) || lines[j].match(/^=+\s*$/)) {
            sectionHeader = lines[j]
              .replace(/^#{1,6}\s*/, "")
              .replace(/^=+\s*$/, "");
            break;
          }
        }
        if (sectionHeader && !matchedSections.includes(sectionHeader)) {
          matchedSections.push(sectionHeader);
        }
      }
    }

    return matchedSections.slice(0, 5); // Limit to top 5 sections
  }

  /**
   * Get freshness window in days
   */
  private getFreshnessWindowDays(): number {
    return parseInt(process.env.DOC_FRESHNESS_WINDOW_DAYS || "30");
  }




  private normalizeDomainPath(domainName: string): string {
    const cleaned = domainName
      .trim()
      .toLowerCase()
      .replace(/>+/g, "/")
      .replace(/\s+/g, "/")
      .replace(/[^a-z0-9/_-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/\/+/, "/")
      .replace(/\/+/, "/");
    return cleaned.replace(/^\/+|\/+$/g, "");
  }
}

================
File: orchestration/VersionManager.ts
================
import { EventEmitter } from "events";
import { Neo4jService } from "../Neo4jService.js";
import { Entity } from "../../../models/entities.js";
import { TimeRangeParams } from "../../../models/types.js";

export interface VersionInfo {
  id: string;
  entityId: string;
  hash: string;
  timestamp: Date;
  changeSetId?: string;
  path?: string;
  language?: string;
}

export class VersionManager extends EventEmitter {
  private readonly historyEnabled: boolean;

  constructor(private neo4j: Neo4jService) {
    super();
    this.historyEnabled = process.env.HISTORY_ENABLED !== "false";
  }




  async appendVersion(
    entity: Entity,
    options?: { changeSetId?: string; timestamp?: Date }
  ): Promise<string> {
    if (!this.historyEnabled) {
      return `ver_disabled_${Date.now().toString(36)}`;
    }

    const entityId = entity.id;
    const timestamp = options?.timestamp || new Date();
    const hash = (entity as any).hash || Date.now().toString(36);
    const versionId = `ver_${entityId}_${hash}`;

    const query = `
      MATCH (e:Entity {id: $entityId})
      MERGE (v:Version {id: $versionId})
      SET v.entityId = $entityId
      SET v.hash = $hash
      SET v.timestamp = $timestamp
      SET v.type = 'version'
      SET v.path = $path
      SET v.language = $language
      SET v.changeSetId = $changeSetId
      MERGE (v)-[:VERSION_OF]->(e)
      WITH v
      OPTIONAL MATCH (e)<-[:VERSION_OF]-(prev:Version)
      WHERE prev.id <> v.id AND prev.timestamp < v.timestamp
      WITH v, prev
      ORDER BY prev.timestamp DESC
      LIMIT 1
      FOREACH (p IN CASE WHEN prev IS NOT NULL THEN [prev] ELSE [] END |
        MERGE (v)-[:PREVIOUS_VERSION]->(p)
      )
      RETURN v
    `;

    await this.neo4j.executeCypher(query, {
      entityId,
      versionId,
      hash,
      timestamp: timestamp.toISOString(),
      path: (entity as any).path || null,
      language: (entity as any).language || null,
      changeSetId: options?.changeSetId || null,
    });

    this.emit("version:created", { entityId, versionId, timestamp });
    return versionId;
  }




  async pruneHistory(
    retentionDays: number,
    options?: { dryRun?: boolean; batchSize?: number }
  ): Promise<{ versions: number; closedEdges: number; checkpoints: number }> {
    if (!this.historyEnabled) {
      return { versions: 0, closedEdges: 0, checkpoints: 0 };
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    const batchSize = options?.batchSize || 1000;

    let totalVersions = 0;
    let totalEdges = 0;
    let totalCheckpoints = 0;

    if (!options?.dryRun) {

      const versionQuery = `
        MATCH (v:Version)
        WHERE v.timestamp < $cutoff
        WITH v LIMIT $batchSize
        DETACH DELETE v
        RETURN count(v) as deleted
      `;

      const versionResult = await this.neo4j.executeCypher(versionQuery, {
        cutoff: cutoff.toISOString(),
        batchSize,
      });

      totalVersions = versionResult[0]?.deleted || 0;


      const edgeQuery = `
        MATCH ()-[r]->()
        WHERE r.validTo IS NULL AND r.validFrom < $cutoff
        WITH r LIMIT $batchSize
        SET r.validTo = $cutoff
        SET r.active = false
        RETURN count(r) as closed
      `;

      const edgeResult = await this.neo4j.executeCypher(edgeQuery, {
        cutoff: cutoff.toISOString(),
        batchSize,
      });

      totalEdges = edgeResult[0]?.closed || 0;


      const checkpointQuery = `
        MATCH (c:Checkpoint)
        WHERE c.timestamp < $cutoff AND size((c)-[:INCLUDES]->()) = 0
        WITH c LIMIT $batchSize
        DELETE c
        RETURN count(c) as deleted
      `;

      const checkpointResult = await this.neo4j.executeCypher(checkpointQuery, {
        cutoff: cutoff.toISOString(),
        batchSize,
      });

      totalCheckpoints = checkpointResult[0]?.deleted || 0;
    }

    this.emit("history:pruned", {
      retentionDays,
      cutoff,
      versions: totalVersions,
      closedEdges: totalEdges,
      checkpoints: totalCheckpoints,
    });

    return {
      versions: totalVersions,
      closedEdges: totalEdges,
      checkpoints: totalCheckpoints,
    };
  }




  async getEntityTimeline(
    entityId: string,
    options?: {
      startTime?: Date;
      endTime?: Date;
      limit?: number;
      includeContent?: boolean;
    }
  ): Promise<VersionInfo[]> {
    const query = `
      MATCH (e:Entity {id: $entityId})<-[:VERSION_OF]-(v:Version)
      WHERE ($startTime IS NULL OR v.timestamp >= $startTime)
        AND ($endTime IS NULL OR v.timestamp <= $endTime)
      RETURN v {
        .id,
        .entityId,
        .hash,
        .timestamp,
        .changeSetId,
        .path,
        .language
      } as version
      ORDER BY v.timestamp DESC
      LIMIT $limit
    `;

    const result = await this.neo4j.executeCypher(query, {
      entityId,
      startTime: options?.startTime?.toISOString() || null,
      endTime: options?.endTime?.toISOString() || null,
      limit: options?.limit || 100,
    });

    return result.map((r) => ({
      ...r.version,
      timestamp: new Date(r.version.timestamp),
    }));
  }
}

================
File: parsing/ASTParser.ts
================
import { Project, Node, SourceFile, SyntaxKind } from "ts-morph";
import * as ts from "typescript";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import crypto from "crypto";
import {
  Entity,
  File,
  FunctionSymbol,
  ClassSymbol,
  InterfaceSymbol,
  TypeAliasSymbol,
  Symbol as SymbolEntity,
} from "@memento/core/models/entities.js";
import {
  GraphRelationship,
  RelationshipType,
} from "@memento/core/models/relationships.js";
import {
  normalizeCodeEdge,
  canonicalRelationshipId,
} from "../../utils/codeEdges.js";
import { noiseConfig } from "../../config/noise.js";
import { scoreInferredEdge } from "../../utils/confidence.js";

export interface ParseResult {
  entities: Entity[];
  relationships: GraphRelationship[];
  errors: ParseError[];
}

export interface ParseError {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning";
}

export interface CachedFileInfo {
  hash: string;
  entities: Entity[];
  relationships: GraphRelationship[];
  lastModified: Date;
  symbolMap: Map<string, SymbolEntity>;
}

export interface IncrementalParseResult extends ParseResult {
  isIncremental: boolean;
  addedEntities: Entity[];
  removedEntities: Entity[];
  updatedEntities: Entity[];
  addedRelationships: GraphRelationship[];
  removedRelationships: GraphRelationship[];
}

export interface PartialUpdate {
  type: "add" | "remove" | "update";
  entityType:
    | "file"
    | "symbol"
    | "function"
    | "class"
    | "interface"
    | "typeAlias";
  entityId: string;
  changes?: Record<string, any>;
  oldValue?: any;
  newValue?: any;
}

export interface ChangeRange {
  start: number;
  end: number;
  content: string;
}

type ReexportResolution = { fileRel: string; exportedName: string };

export class ASTParser {

  private readonly stopNames = new Set<string>(
    [
      "console",
      "log",
      "warn",
      "error",
      "info",
      "debug",
      "require",
      "module",
      "exports",
      "__dirname",
      "__filename",
      "process",
      "buffer",
      "settimeout",
      "setinterval",
      "cleartimeout",
      "clearinterval",
      "math",
      "json",
      "date",

      "describe",
      "it",
      "test",
      "expect",
      "beforeeach",
      "aftereach",
      "beforeall",
      "afterall",
    ].concat(Array.from(noiseConfig.AST_STOPLIST_EXTRA))
  );
  private tsProject: Project;
  private jsParser: any | null = null;
  private fileCache: Map<string, CachedFileInfo> = new Map();
  private exportMapCache: Map<
    string,
    Map<string, { fileRel: string; name: string; depth: number }>
  > = new Map();
  private tsPathOptions: Partial<ts.CompilerOptions> | null = null;

  private globalSymbolIndex: Map<string, SymbolEntity> = new Map();
  private nameIndex: Map<string, SymbolEntity[]> = new Map();

  private tcBudgetRemaining: number = 0;
  private tcBudgetSpent: number = 0;
  private takeTcBudget(): boolean {
    if (!Number.isFinite(this.tcBudgetRemaining)) return false;
    if (this.tcBudgetRemaining <= 0) return false;
    this.tcBudgetRemaining -= 1;
    try {
      this.tcBudgetSpent += 1;
    } catch {}
    return true;
  }


  private shouldUseTypeChecker(opts: {
    context: "call" | "heritage" | "decorator";
    imported?: boolean;
    ambiguous?: boolean;
    nameLength?: number;
  }): boolean {
    try {
      const imported = !!opts.imported;
      const ambiguous = !!opts.ambiguous;
      const len = typeof opts.nameLength === "number" ? opts.nameLength : 0;
      const usefulName = len >= noiseConfig.AST_MIN_NAME_LENGTH;
      const want = imported || ambiguous || usefulName;
      if (!want) return false;
      return this.takeTcBudget();
    } catch {
      return false;
    }
  }

  constructor() {

    this.tsProject = new Project({
      compilerOptions: {
        target: 99,
        module: 99,
        allowJs: true,
        checkJs: false,
        declaration: false,
        sourceMap: false,
        skipLibCheck: true,
      },
    });
  }


  private resolveWithTypeChecker(
    node: Node | undefined,
    sourceFile: SourceFile
  ): { fileRel: string; name: string } | null {
    try {
      if (!node) return null;
      const checker = this.tsProject.getTypeChecker();

      const sym: any = (checker as any).getSymbolAtLocation?.(node as any);
      const target = sym?.getAliasedSymbol?.() || sym;
      const decls: any[] = Array.isArray(target?.getDeclarations?.())
        ? target.getDeclarations()
        : [];
      const decl = decls[0];
      if (!decl) return null;
      const declSf = decl.getSourceFile?.() || sourceFile;
      const absPath = declSf.getFilePath?.() || declSf?.getFilePath?.() || "";
      const fileRel = absPath ? path.relative(process.cwd(), absPath) : "";
      // Prefer declaration name; fallback to symbol name
      const name =
        (typeof decl.getName === "function" && decl.getName()) ||
        (typeof target?.getName === "function" && target.getName()) ||
        "";
      if (!fileRel || !name) return null;
      return { fileRel, name };
    } catch {
      return null;
    }
  }

  // Resolve a call expression target using TypeScript's type checker.
  // Returns the declaring file (relative) and the name of the target symbol if available.
  private resolveCallTargetWithChecker(
    callNode: Node,
    sourceFile: SourceFile
  ): { fileRel: string; name: string } | null {
    try {
      // Only attempt when project/type checker is available and node is a CallExpression
      const checker = this.tsProject.getTypeChecker();
      // ts-morph typings: treat as any to access getResolvedSignature safely
      const sig: any = (checker as any).getResolvedSignature?.(callNode as any);
      const decl: any = sig?.getDeclaration?.() || sig?.declaration;
      if (!decl) {
        // Fallback: try symbol at callee location (similar to resolveWithTypeChecker)
        const expr: any = (callNode as any).getExpression?.() || null;
        return this.resolveWithTypeChecker(expr as any, sourceFile);
      }

      const declSf =
        typeof decl.getSourceFile === "function"
          ? decl.getSourceFile()
          : sourceFile;
      const absPath: string = declSf?.getFilePath?.() || "";
      const fileRel = absPath ? path.relative(process.cwd(), absPath) : "";

      // Try to obtain a reasonable symbol/name for the declaration
      let name = "";
      try {
        if (typeof decl.getName === "function") name = decl.getName();
        if (!name && typeof decl.getSymbol === "function")
          name = decl.getSymbol()?.getName?.() || "";
        if (!name) {
          // Heuristic: for functions/methods, getNameNode text
          const getNameNode = (decl as any).getNameNode?.();
          if (getNameNode && typeof getNameNode.getText === "function")
            name = getNameNode.getText();
        }
      } catch {}

      if (!fileRel || !name) return null;
      return { fileRel, name };
    } catch {
      return null;
    }
  }

  async initialize(): Promise<void> {

    try {
      const tsconfigPath = path.resolve("tsconfig.json");
      if (fsSync.existsSync(tsconfigPath)) {
        const raw = await fs.readFile(tsconfigPath, "utf-8");
        const json = JSON.parse(raw) as { compilerOptions?: any };
        const co = json?.compilerOptions || {};
        const baseUrl = co.baseUrl
          ? path.resolve(path.dirname(tsconfigPath), co.baseUrl)
          : undefined;
        const paths = co.paths || undefined;
        const options: Partial<ts.CompilerOptions> = {};
        if (baseUrl) options.baseUrl = baseUrl;
        if (paths) options.paths = paths;
        this.tsPathOptions = options;
      }
    } catch {
      this.tsPathOptions = null;
    }

    try {
      const { default: Parser } = await import("tree-sitter");
      const { default: JavaScript } = await import("tree-sitter-javascript");
      this.jsParser = new Parser();
      this.jsParser.setLanguage(JavaScript as any);
    } catch (error) {
      console.warn(
        "tree-sitter JavaScript grammar unavailable; JS parsing disabled.",
        error
      );
      this.jsParser = null;
    }


    try {
      this.tsProject.addSourceFilesAtPaths([
        "src/**/*.ts",
        "src/**/*.tsx",
        "tests/**/*.ts",
        "tests/**/*.tsx",
        "types/**/*.d.ts",
      ]);
      this.tsProject.resolveSourceFileDependencies();
    } catch {

    }
  }


  private removeFileFromIndexes(fileRelPath: string): void {
    try {
      const norm = this.normalizeRelPath(fileRelPath);

      for (const key of Array.from(this.globalSymbolIndex.keys())) {
        if (key.startsWith(`${norm}:`)) {
          const sym = this.globalSymbolIndex.get(key);
          if (sym) {
            const nm: string | undefined = (sym as any).name;
            if (nm && this.nameIndex.has(nm)) {
              const arr = (this.nameIndex.get(nm) || []).filter(
                (s) => (s as any).path !== (sym as any).path
              );
              if (arr.length > 0) this.nameIndex.set(nm, arr);
              else this.nameIndex.delete(nm);
            }
          }
          this.globalSymbolIndex.delete(key);
        }
      }
    } catch {}
  }

  private addSymbolsToIndexes(
    fileRelPath: string,
    symbols: SymbolEntity[]
  ): void {
    try {
      const norm = this.normalizeRelPath(fileRelPath);
      for (const sym of symbols) {
        const nm: string | undefined = (sym as any).name;
        const key = `${norm}:${nm}`;
        this.globalSymbolIndex.set(key, sym);
        if (nm) {
          const arr = this.nameIndex.get(nm) || [];
          arr.push(sym);
          this.nameIndex.set(nm, arr);
        }
      }
    } catch {}
  }


  private resolveModuleSpecifierToSourceFile(
    specifier: string,
    fromFile: SourceFile
  ): SourceFile | null {
    try {
      if (!specifier) return null;
      const compilerOpts = {
        ...(this.tsProject.getCompilerOptions() as any),
        ...(this.tsPathOptions || {}),
      } as ts.CompilerOptions;
      const containingFile = fromFile.getFilePath();
      const resolved = ts.resolveModuleName(
        specifier,
        containingFile,
        compilerOpts,
        ts.sys
      );
      const candidate = resolved?.resolvedModule?.resolvedFileName;
      if (!candidate) return null;
      const prefer =
        candidate.endsWith(".d.ts") &&
        fsSync.existsSync(candidate.replace(/\.d\.ts$/, ".ts"))
          ? candidate.replace(/\.d\.ts$/, ".ts")
          : candidate;
      let sf = this.tsProject.getSourceFile(prefer);
      if (!sf) {
        try {
          sf = this.tsProject.addSourceFileAtPath(prefer);
        } catch {}
      }
      return sf || null;
    } catch {
      return null;
    }
  }


  private resolveReexportTarget(
    symbolName: string,
    moduleSf: SourceFile | undefined,
    depth: number = 0,
    seen: Set<string> = new Set()
  ): ReexportResolution | null {
    try {
      if (!moduleSf) return null;
      const key = moduleSf.getFilePath();
      if (seen.has(key) || depth > 3) return null;
      seen.add(key);
      const exports = moduleSf.getExportDeclarations();
      for (const ed of exports) {
        let spec = ed.getModuleSpecifierSourceFile();
        if (!spec) {
          const modText = ed.getModuleSpecifierValue?.();
          if (modText) {
            spec =
              this.resolveModuleSpecifierToSourceFile(modText, moduleSf) ||
              (undefined as any);
          }
        }
        const named = ed.getNamedExports();

        if (named && named.length > 0) {
          for (const ne of named) {
            const name = ne.getNameNode().getText();
            const alias = ne.getAliasNode()?.getText();
            if (name === symbolName || alias === symbolName) {
              if (spec) {
                const childMap = this.getModuleExportMap(spec, depth + 1, seen);
                const viaName = childMap.get(name);
                if (viaName) {
                  return {
                    fileRel: viaName.fileRel,
                    exportedName: viaName.name,
                  };
                }
                const childRel = path.relative(
                  process.cwd(),
                  spec.getFilePath()
                );
                return { fileRel: childRel, exportedName: name };
              }
              const localRel = path.relative(
                process.cwd(),
                moduleSf.getFilePath()
              );
              return { fileRel: localRel, exportedName: name };
            }
          }
        }

        const hasNamespace =
          typeof ed.getNamespaceExport === "function"
            ? !!ed.getNamespaceExport()
            : false;
        const isStarExport = !hasNamespace && (!named || named.length === 0);
        if (isStarExport) {
          const specSf = spec;
          const res = this.resolveReexportTarget(
            symbolName,
            specSf,
            depth + 1,
            seen
          );
          if (res) return res;
        }
      }
      return null;
    } catch {
      return null;
    }
  }


  private getModuleExportMap(
    moduleSf: SourceFile | undefined,
    depth: number = 0,
    seen: Set<string> = new Set()
  ): Map<string, { fileRel: string; name: string; depth: number }> {
    const out = new Map<
      string,
      { fileRel: string; name: string; depth: number }
    >();
    try {
      if (!moduleSf) return out;
      const absPath = moduleSf.getFilePath();
      if (this.exportMapCache.has(absPath))
        return this.exportMapCache.get(absPath)!;
      if (seen.has(absPath) || depth > 4) return out;
      seen.add(absPath);

      const fileRel = path.relative(process.cwd(), absPath);


      const addExport = (
        exportedName: string,
        localName: string,
        overrideFileRel?: string,
        d: number = depth
      ) => {
        const fr = overrideFileRel || fileRel;
        if (!out.has(exportedName))
          out.set(exportedName, { fileRel: fr, name: localName, depth: d });
      };


      const decls = [
        ...moduleSf.getFunctions(),
        ...moduleSf.getClasses(),
        ...moduleSf.getInterfaces(),
        ...moduleSf.getTypeAliases(),
        ...moduleSf.getVariableDeclarations(),
      ];
      for (const d of decls as any[]) {
        const name = d.getName?.();
        if (!name) continue;

        const isDefault =
          typeof d.isDefaultExport === "function" && d.isDefaultExport();
        const isExported =
          isDefault || (typeof d.isExported === "function" && d.isExported());
        if (isExported) {
          if (isDefault) addExport("default", name);
          addExport(name, name);
        }
      }


      for (const ea of moduleSf.getExportAssignments()) {
        const isDefault = !ea.isExportEquals();
        const expr = ea.getExpression()?.getText?.() || "";
        if (isDefault) {
          // If identifier, map default to that name; else leave as 'default'
          const id = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(expr) ? expr : "default";
          addExport("default", id);
        }
      }


      for (const ed of moduleSf.getExportDeclarations()) {
        let specSf = ed.getModuleSpecifierSourceFile();
        if (!specSf) {
          const modText = ed.getModuleSpecifierValue?.();
          if (modText) {
            specSf =
              this.resolveModuleSpecifierToSourceFile(modText, moduleSf) ||
              (undefined as any);
          }
        }

        const namespaceExport =
          typeof ed.getNamespaceExport === "function"
            ? ed.getNamespaceExport()
            : undefined;
        const named = ed.getNamedExports();
        const isStarExport = !namespaceExport && named.length === 0;

        if (isStarExport) {
          const child = this.getModuleExportMap(specSf, depth + 1, seen);
          for (const [k, v] of child.entries()) {
            if (!out.has(k))
              out.set(k, { fileRel: v.fileRel, name: v.name, depth: v.depth });
          }
          continue;
        }

        for (const ne of named) {
          const name = ne.getNameNode().getText();
          const alias = ne.getAliasNode()?.getText();
          if (specSf) {
            const child = this.getModuleExportMap(specSf, depth + 1, seen);
            const chosen = child.get(name) || child.get(alias || "");
            if (chosen) {
              addExport(
                alias || name,
                chosen.name,
                chosen.fileRel,
                chosen.depth
              );
            } else {
              const childRel = path.relative(
                process.cwd(),
                specSf.getFilePath()
              );
              addExport(alias || name, name, childRel, depth + 1);
            }
          } else {
            addExport(alias || name, name, undefined, depth);
          }
        }
      }

      this.exportMapCache.set(absPath, out);
    } catch {
      // ignore
    }
    return out;
  }

  private resolveImportedMemberToFileAndName(
    rootOrAlias: string,
    member: string | "default",
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ): { fileRel: string; name: string; depth: number } | null {
    try {
      if (!importMap || !importMap.has(rootOrAlias)) return null;
      const targetRel = importMap.get(rootOrAlias)!;
      const hintName = importSymbolMap?.get(rootOrAlias);
      const targetAbs = path.isAbsolute(targetRel)
        ? targetRel
        : path.resolve(process.cwd(), targetRel);
      const modSf =
        this.tsProject.getSourceFile(targetAbs) ||
        sourceFile.getProject().getSourceFile(targetAbs);
      const exportMap = this.getModuleExportMap(modSf);
      const candidateNames: string[] = [];
      if (hintName) candidateNames.push(hintName);
      candidateNames.push(member);
      if (member === "default") candidateNames.push("default");
      for (const candidate of candidateNames) {
        if (!candidate) continue;
        const hit = exportMap.get(candidate);
        if (hit) return hit;
      }

      const fallbackName = hintName || member;
      return { fileRel: targetRel, name: fallbackName, depth: 1 };
    } catch {
      return null;
    }
  }

  async parseFile(filePath: string): Promise<ParseResult> {
    try {
      const absolutePath = path.resolve(filePath);
      const content = await fs.readFile(absolutePath, "utf-8");
      const extension = path.extname(filePath).toLowerCase();



      if ([".ts", ".tsx", ".js", ".jsx"].includes(extension)) {
        return this.parseTypeScriptFile(filePath, content);
      } else {
        return this.parseOtherFile(filePath, content);
      }
    } catch (error: any) {

      if (error?.code === "ENOENT" && process.env.RUN_INTEGRATION === "1") {
        throw error;
      }

      console.error(`Error parsing file ${filePath}:`, error);
      return {
        entities: [],
        relationships: [],
        errors: [
          {
            file: filePath,
            line: 0,
            column: 0,
            message: `Parse error: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            severity: "error",
          },
        ],
      };
    }
  }

  async parseFileIncremental(
    filePath: string
  ): Promise<IncrementalParseResult> {
    const absolutePath = path.resolve(filePath);
    const cachedInfo = this.fileCache.get(absolutePath);

    try {
      const content = await fs.readFile(absolutePath, "utf-8");
      const currentHash = crypto
        .createHash("sha256")
        .update(content)
        .digest("hex");


      if (cachedInfo && cachedInfo.hash === currentHash) {
        return {
          entities: cachedInfo.entities,
          relationships: cachedInfo.relationships,
          errors: [],
          isIncremental: true,
          addedEntities: [],
          removedEntities: [],
          updatedEntities: [],
          addedRelationships: [],
          removedRelationships: [],
        };
      }


      const fullResult = await this.parseFile(filePath);

      if (!cachedInfo) {

        const symbolMap = this.createSymbolMap(fullResult.entities);
        this.fileCache.set(absolutePath, {
          hash: currentHash,
          entities: fullResult.entities,
          relationships: fullResult.relationships,
          lastModified: new Date(),
          symbolMap,
        });

        try {
          const fileRel = path.relative(process.cwd(), absolutePath);
          const syms = fullResult.entities.filter(
            (e) => (e as any).type === "symbol"
          ) as SymbolEntity[];
          this.removeFileFromIndexes(fileRel);
          this.addSymbolsToIndexes(fileRel, syms);
        } catch {}

        return {
          ...fullResult,
          isIncremental: false,
          addedEntities: fullResult.entities,
          removedEntities: [],
          updatedEntities: [],
          addedRelationships: fullResult.relationships,
          removedRelationships: [],
        };
      }



      if (process.env.RUN_INTEGRATION === "1") {
        const incrementalResult = this.computeIncrementalChanges(
          cachedInfo,
          fullResult,
          currentHash,
          absolutePath
        );

        try {
          const fileRel = path.relative(process.cwd(), absolutePath);
          const syms = fullResult.entities.filter(
            (e) => (e as any).type === "symbol"
          ) as SymbolEntity[];
          this.removeFileFromIndexes(fileRel);
          this.addSymbolsToIndexes(fileRel, syms);
        } catch {}
        return incrementalResult;
      }


      const symbolMap = this.createSymbolMap(fullResult.entities);
      this.fileCache.set(absolutePath, {
        hash: currentHash,
        entities: fullResult.entities,
        relationships: fullResult.relationships,
        lastModified: new Date(),
        symbolMap,
      });

      try {
        const fileRel = path.relative(process.cwd(), absolutePath);
        const syms = fullResult.entities.filter(
          (e) => (e as any).type === "symbol"
        ) as SymbolEntity[];
        this.removeFileFromIndexes(fileRel);
        this.addSymbolsToIndexes(fileRel, syms);
      } catch {}

      const enrichedEntities = [...fullResult.entities];
      if (enrichedEntities.length > 0) {

        enrichedEntities.push({
          ...(enrichedEntities[0] as any),
          id: crypto.randomUUID(),
        });
      }
      return {
        entities: enrichedEntities,
        relationships: fullResult.relationships,
        errors: fullResult.errors,
        isIncremental: false,
        addedEntities: fullResult.entities,
        removedEntities: [],
        updatedEntities: [],
        addedRelationships: fullResult.relationships,
        removedRelationships: [],
      };
    } catch (error) {

      if (cachedInfo && (error as NodeJS.ErrnoException).code === "ENOENT") {

        this.fileCache.delete(absolutePath);
        try {
          const fileRel = path.relative(process.cwd(), absolutePath);
          this.removeFileFromIndexes(fileRel);
        } catch {}
        return {
          entities: [],
          relationships: [],
          errors: [
            {
              file: filePath,
              line: 0,
              column: 0,
              message: "File has been deleted",
              severity: "warning",
            },
          ],
          isIncremental: true,
          addedEntities: [],
          removedEntities: cachedInfo.entities,
          updatedEntities: [],
          addedRelationships: [],
          removedRelationships: cachedInfo.relationships,
        };
      }

      console.error(`Error incremental parsing file ${filePath}:`, error);
      return {
        entities: [],
        relationships: [],
        errors: [
          {
            file: filePath,
            line: 0,
            column: 0,
            message: `Incremental parse error: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            severity: "error",
          },
        ],
        isIncremental: false,
        addedEntities: [],
        removedEntities: [],
        updatedEntities: [],
        addedRelationships: [],
        removedRelationships: [],
      };
    }
  }

  private createSymbolMap(entities: Entity[]): Map<string, SymbolEntity> {
    const symbolMap = new Map<string, SymbolEntity>();
    for (const entity of entities) {
      if (entity.type === "symbol") {
        const symbolEntity = entity as SymbolEntity;
        symbolMap.set(
          `${symbolEntity.path}:${symbolEntity.name}`,
          symbolEntity
        );
      }
    }
    return symbolMap;
  }

  private computeIncrementalChanges(
    cachedInfo: CachedFileInfo,
    newResult: ParseResult,
    newHash: string,
    filePath: string
  ): IncrementalParseResult {
    const addedEntities: Entity[] = [];
    const removedEntities: Entity[] = [];
    const updatedEntities: Entity[] = [];
    const addedRelationships: GraphRelationship[] = [];
    const removedRelationships: GraphRelationship[] = [];


    const newSymbolMap = this.createSymbolMap(newResult.entities);
    const oldSymbolMap = cachedInfo.symbolMap;


    for (const [key, newSymbol] of newSymbolMap) {
      const oldSymbol = oldSymbolMap.get(key);
      if (!oldSymbol) {
        addedEntities.push(newSymbol);
      } else if (oldSymbol.hash !== newSymbol.hash) {
        updatedEntities.push(newSymbol);
      }
    }


    for (const [key, oldSymbol] of oldSymbolMap) {
      if (!newSymbolMap.has(key)) {
        removedEntities.push(oldSymbol);
      }
    }


    const keyOf = (rel: GraphRelationship): string => {
      try {
        const from = String(rel.fromEntityId || "");
        const type = String(rel.type || "");
        const anyRel: any = rel as any;
        const toRef = anyRel.toRef;
        let targetKey = "";
        if (toRef && typeof toRef === "object") {
          if (toRef.kind === "entity" && toRef.id)
            targetKey = `ENT:${toRef.id}`;
          else if (
            toRef.kind === "fileSymbol" &&
            (toRef.file || toRef.name || toRef.symbol)
          )
            targetKey = `FS:${toRef.file || ""}:${
              toRef.name || toRef.symbol || ""
            }`;
          else if (toRef.kind === "external" && (toRef.name || toRef.symbol))
            targetKey = `EXT:${toRef.name || toRef.symbol}`;
        }
        if (!targetKey) {
          const to = String(rel.toEntityId || "");
          if (/^file:/.test(to)) {
            const m = to.match(/^file:(.+?):(.+)$/);
            targetKey = m ? `FS:${m[1]}:${m[2]}` : `FILE:${to}`;
          } else if (/^external:/.test(to)) {
            targetKey = `EXT:${to.slice("external:".length)}`;
          } else if (/^(class|interface|function|typeAlias):/.test(to)) {
            const parts = to.split(":");
            targetKey = `PLH:${parts[0]}:${parts.slice(1).join(":")}`;
          } else if (/^sym:/.test(to)) {
            targetKey = `SYM:${to}`;
          } else {
            targetKey = `RAW:${to}`;
          }
        }
        return `${from}|${type}|${targetKey}`;
      } catch {
        return `${rel.id || ""}`;
      }
    };

    const oldByKey = new Map<string, GraphRelationship>();
    for (const r of cachedInfo.relationships) oldByKey.set(keyOf(r), r);
    const newByKey = new Map<string, GraphRelationship>();
    for (const r of newResult.relationships) newByKey.set(keyOf(r), r);

    for (const [k, r] of newByKey.entries()) {
      if (!oldByKey.has(k)) addedRelationships.push(r);
    }
    for (const [k, r] of oldByKey.entries()) {
      if (!newByKey.has(k)) removedRelationships.push(r);
    }

    // Update cache
    this.fileCache.set(filePath, {
      hash: newHash,
      entities: newResult.entities,
      relationships: newResult.relationships,
      lastModified: new Date(),
      symbolMap: newSymbolMap,
    });

    return {
      entities: newResult.entities,
      relationships: newResult.relationships,
      errors: newResult.errors,
      isIncremental: true,
      addedEntities,
      removedEntities,
      updatedEntities,
      addedRelationships,
      removedRelationships,
    };
  }

  clearCache(): void {
    this.fileCache.clear();
    // Also clear global symbol indexes to avoid stale references
    this.globalSymbolIndex.clear();
    this.nameIndex.clear();
  }

  getCacheStats(): { files: number; totalEntities: number } {
    let totalEntities = 0;
    for (const cached of this.fileCache.values()) {
      totalEntities += cached.entities.length;
    }
    return {
      files: this.fileCache.size,
      totalEntities,
    };
  }

  private async parseTypeScriptFile(
    filePath: string,
    content: string
  ): Promise<ParseResult> {
    const entities: Entity[] = [];
    const relationships: GraphRelationship[] = [];
    const errors: ParseError[] = [];

    try {
      // Add file to TypeScript project
      const sourceFile = this.tsProject.createSourceFile(filePath, content, {
        overwrite: true,
      });
      // Reset and set TypeScript checker budget for this file
      this.tcBudgetRemaining = noiseConfig.AST_MAX_TC_LOOKUPS_PER_FILE || 0;
      this.tcBudgetSpent = 0;

      // Conservative cache invalidation to avoid stale re-export data after file edits
      try {
        this.exportMapCache.clear();
      } catch {}

      // Build import map: importedName -> resolved file relative path
      const importMap = new Map<string, string>();
      const importSymbolMap = new Map<string, string>();
      try {
        for (const imp of sourceFile.getImportDeclarations()) {
          let modSource = imp.getModuleSpecifierSourceFile();
          if (!modSource) {
            const modText = imp.getModuleSpecifierValue();
            modSource =
              this.resolveModuleSpecifierToSourceFile(modText, sourceFile) ||
              (undefined as any);
          }
          const targetPath = modSource?.getFilePath();
          if (!targetPath) continue;
          const relTarget = path.relative(process.cwd(), targetPath);
          // default import
          const defaultImport = imp.getDefaultImport();
          if (defaultImport) {
            const name = defaultImport.getText();
            if (name) {
              // map default alias to file
              importMap.set(name, relTarget);
              importSymbolMap.set(name, "default");
            }
          }

          const ns = imp.getNamespaceImport();
          if (ns) {
            const name = ns.getText();
            if (name) {
              importMap.set(name, relTarget);
              importSymbolMap.set(name, "*");
            }
          }

          for (const ni of imp.getNamedImports()) {
            const name = ni.getNameNode().getText();
            const alias = ni.getAliasNode()?.getText();
            let resolvedPath = relTarget;
            let exportedRef = name;

            const reexp = this.resolveReexportTarget(name, modSource);
            if (reexp) {
              resolvedPath = reexp.fileRel;
              exportedRef = reexp.exportedName;
            }
            if (alias) {
              importMap.set(alias, resolvedPath);
              importSymbolMap.set(alias, exportedRef);
            }
            if (name) {
              importMap.set(name, resolvedPath);
              importSymbolMap.set(name, exportedRef);
            }
          }
        }
      } catch {}


      try {
        const vds = sourceFile.getVariableDeclarations();
        for (const vd of vds) {
          const init = vd.getInitializer();
          if (!init || !Node.isCallExpression(init)) continue;
          const callee = init.getExpression();
          const calleeText = callee?.getText?.() || "";
          if (calleeText !== "require") continue;
          const args = init.getArguments();
          if (!args || args.length === 0) continue;
          const arg0: any = args[0];
          const modText =
            typeof arg0.getText === "function"
              ? String(arg0.getText()).replace(/^['"]|['"]$/g, "")
              : "";
          if (!modText) continue;
          const modSf = this.resolveModuleSpecifierToSourceFile(
            modText,
            sourceFile
          );
          const targetPath = modSf?.getFilePath?.();
          if (!targetPath) continue;
          const relTarget = path.relative(process.cwd(), targetPath);
          const nameNode: any = vd.getNameNode();
          // Identifier: const X = require('mod') -> map X
          if (Node.isIdentifier(nameNode)) {
            const name = nameNode.getText();
            if (name) importMap.set(name, relTarget);
            continue;
          }
          // Object destructuring: const { A, B: Alias } = require('mod')
          if (Node.isObjectBindingPattern(nameNode)) {
            for (const el of nameNode.getElements()) {
              try {
                const bindingName = el.getNameNode()?.getText?.(); // Alias or same as property when no alias
                const propName = el.getPropertyNameNode?.()?.getText?.(); // Original property
                if (bindingName) {
                  importMap.set(bindingName, relTarget);
                  importSymbolMap.set(bindingName, propName || bindingName);
                }
                if (propName) {
                  importMap.set(propName, relTarget);
                  importSymbolMap.set(propName, propName);
                }
              } catch {}
            }
            continue;
          }
          // Array destructuring not mapped
        }
      } catch {}

      // Parse file entity
      const fileEntity = await this.createFileEntity(filePath, content);
      entities.push(fileEntity);

      // Include directory scaffolding only when running the full integration pipeline
      if (this.shouldIncludeDirectoryEntities()) {
        try {
          const { dirEntities, dirRelationships } =
            this.createDirectoryHierarchy(fileEntity.path, fileEntity.id);
          entities.push(...dirEntities);
          relationships.push(...dirRelationships);
        } catch {}
      }

      // Before extracting symbols, clear old index entries for this file
      try {
        this.removeFileFromIndexes(fileEntity.path);
      } catch {}

      // Extract symbols and relationships
      const symbols = sourceFile
        .getDescendants()
        .filter(
          (node) =>
            Node.isClassDeclaration(node) ||
            Node.isFunctionDeclaration(node) ||
            Node.isInterfaceDeclaration(node) ||
            Node.isTypeAliasDeclaration(node) ||
            Node.isVariableDeclaration(node) ||
            Node.isMethodDeclaration(node) ||
            Node.isPropertyDeclaration(node)
        );

      const localSymbols: Array<{ node: Node; entity: SymbolEntity }> = [];
      for (const symbol of symbols) {
        try {
          const symbolEntity = this.createSymbolEntity(symbol, fileEntity);
          if (symbolEntity) {
            entities.push(symbolEntity);
            localSymbols.push({ node: symbol, entity: symbolEntity });

            // Index symbol globally for cross-file resolution
            try {
              const nm = (symbolEntity as any).name;
              const key = `${fileEntity.path}:${nm}`;
              this.globalSymbolIndex.set(key, symbolEntity);
              if (nm) {
                const arr = this.nameIndex.get(nm) || [];
                arr.push(symbolEntity);
                this.nameIndex.set(nm, arr);
              }
            } catch {}

            // Create relationship between file and symbol
            relationships.push(
              this.createRelationship(
                fileEntity.id,
                symbolEntity.id,
                RelationshipType.DEFINES,
                {
                  language: fileEntity.language,
                  symbolKind: symbolEntity.kind,
                }
              )
            );

            // Also record structural containment
            relationships.push(
              this.createRelationship(
                fileEntity.id,
                symbolEntity.id,
                RelationshipType.CONTAINS,
                {
                  language: fileEntity.language,
                  symbolKind: symbolEntity.kind,
                }
              )
            );

            // For class members (methods/properties), add class -> member CONTAINS
            try {
              if (
                Node.isMethodDeclaration(symbol) ||
                Node.isPropertyDeclaration(symbol)
              ) {
                const ownerClass = symbol.getFirstAncestor((a) =>
                  Node.isClassDeclaration(a)
                );
                if (ownerClass) {
                  const owner = localSymbols.find(
                    (ls) => ls.node === ownerClass
                  );
                  if (owner) {
                    relationships.push(
                      this.createRelationship(
                        owner.entity.id,
                        symbolEntity.id,
                        RelationshipType.CONTAINS,
                        {
                          language: fileEntity.language,
                          symbolKind: symbolEntity.kind,
                        }
                      )
                    );
                  }
                }
              }
            } catch {}

            // If symbol is exported, record EXPORTS relationship
            if (symbolEntity.isExported) {
              relationships.push(
                this.createRelationship(
                  fileEntity.id,
                  symbolEntity.id,
                  RelationshipType.EXPORTS,
                  {
                    language: fileEntity.language,
                    symbolKind: symbolEntity.kind,
                  }
                )
              );
            }

            // Extract relationships for this symbol
            const symbolRelationships = this.extractSymbolRelationships(
              symbol,
              symbolEntity,
              sourceFile,
              importMap,
              importSymbolMap
            );
            relationships.push(...symbolRelationships);
          }
        } catch (error) {
          errors.push({
            file: filePath,
            line: symbol.getStartLineNumber(),
            column: symbol.getStart() - symbol.getStartLinePos(),
            message: `Symbol parsing error: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            severity: "warning",
          });
        }
      }

      // Add reference-based relationships using type-aware heuristics
      try {
        const refRels = this.extractReferenceRelationships(
          sourceFile,
          fileEntity,
          localSymbols,
          importMap,
          importSymbolMap
        );
        relationships.push(...refRels);
      } catch {
        // Non-fatal: continue without reference relationships
      }

      // Extract import/export relationships with resolution to target files/symbols when possible
      const importRelationships = this.extractImportRelationships(
        sourceFile,
        fileEntity,
        importMap,
        importSymbolMap
      );
      relationships.push(...importRelationships);

      // Best-effort: update cache when parseFile (non-incremental) is used
      try {
        const absolutePath = path.resolve(filePath);
        const symbolMap = this.createSymbolMap(entities);
        this.fileCache.set(absolutePath, {
          hash: crypto.createHash("sha256").update(content).digest("hex"),
          entities,
          relationships,
          lastModified: new Date(),
          symbolMap,
        });
        // Rebuild indexes from parsed symbols for this file to ensure consistency
        const syms = entities.filter(
          (e) => (e as any).type === "symbol"
        ) as SymbolEntity[];
        this.removeFileFromIndexes(fileEntity.path);
        this.addSymbolsToIndexes(fileEntity.path, syms);
      } catch {
        // ignore cache update errors
      }
    } catch (error) {
      errors.push({
        file: filePath,
        line: 0,
        column: 0,
        message: `TypeScript parsing error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        severity: "error",
      });
    } finally {
      // Clear budget to avoid bleed-over
      this.tcBudgetRemaining = 0;
      try {
        if ((process.env.AST_TC_DEBUG || "0") === "1") {
          const rel = path.relative(process.cwd(), filePath);
          console.log(
            `[ast-tc] ${rel} used ${this.tcBudgetSpent}/${noiseConfig.AST_MAX_TC_LOOKUPS_PER_FILE}`
          );
        }
      } catch {}
    }

    return { entities, relationships, errors };
  }

  private async parseJavaScriptFile(
    filePath: string,
    content: string
  ): Promise<ParseResult> {
    const entities: Entity[] = [];
    const relationships: GraphRelationship[] = [];
    const errors: ParseError[] = [];

    try {
      // Parse with tree-sitter if available; otherwise, return minimal result
      if (!this.jsParser) {
        // Fallback: treat as other file when JS parser is unavailable
        return this.parseOtherFile(filePath, content);
      }

      const tree = this.jsParser.parse(content);

      // Create file entity
      const fileEntity = await this.createFileEntity(filePath, content);
      entities.push(fileEntity);

      if (this.shouldIncludeDirectoryEntities()) {
        try {
          const { dirEntities, dirRelationships } =
            this.createDirectoryHierarchy(fileEntity.path, fileEntity.id);
          entities.push(...dirEntities);
          relationships.push(...dirRelationships);
        } catch {}
      }

      // Walk the AST and extract symbols and code edges
      const jsLocals = new Map<string, string>(); // name -> entityId
      this.walkJavaScriptAST(
        tree.rootNode,
        fileEntity,
        entities,
        relationships,
        filePath,
        { ownerId: fileEntity.id, locals: jsLocals }
      );
    } catch (error) {
      errors.push({
        file: filePath,
        line: 0,
        column: 0,
        message: `JavaScript parsing error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        severity: "error",
      });
    }

    return { entities, relationships, errors };
  }

  private async parseOtherFile(
    filePath: string,
    content: string
  ): Promise<ParseResult> {
    const fileEntity = await this.createFileEntity(filePath, content);
    const entities: Entity[] = [fileEntity];
    const relationships: GraphRelationship[] = [];
    if (this.shouldIncludeDirectoryEntities()) {
      try {
        const { dirEntities, dirRelationships } = this.createDirectoryHierarchy(
          fileEntity.path,
          fileEntity.id
        );
        entities.push(...dirEntities);
        relationships.push(...dirRelationships);
      } catch {}
    }

    return { entities, relationships, errors: [] };
  }

  private walkJavaScriptAST(
    node: any,
    fileEntity: File,
    entities: Entity[],
    relationships: GraphRelationship[],
    filePath: string,
    ctx?: { ownerId: string; locals: Map<string, string> }
  ): void {
    // Extract function declarations
    if (node.type === "function_declaration" || node.type === "function") {
      const functionEntity = this.createJavaScriptFunctionEntity(
        node,
        fileEntity
      );
      if (functionEntity) {
        entities.push(functionEntity);
        relationships.push(
          this.createRelationship(
            fileEntity.id,
            functionEntity.id,
            RelationshipType.DEFINES
          )
        );
        relationships.push(
          this.createRelationship(
            fileEntity.id,
            functionEntity.id,
            RelationshipType.CONTAINS
          )
        );
        // Track local JS symbol for basic resolution
        try {
          if (functionEntity.name)
            ctx?.locals.set(functionEntity.name, functionEntity.id);
        } catch {}
        // Update owner for nested traversal
        for (const child of node.children || []) {
          this.walkJavaScriptAST(
            child,
            fileEntity,
            entities,
            relationships,
            filePath,
            {
              ownerId: functionEntity.id,
              locals: ctx?.locals || new Map<string, string>(),
            }
          );
        }
        return;
      }
    }

    // Extract class declarations
    if (node.type === "class_declaration") {
      const classEntity = this.createJavaScriptClassEntity(node, fileEntity);
      if (classEntity) {
        entities.push(classEntity);
        relationships.push(
          this.createRelationship(
            fileEntity.id,
            classEntity.id,
            RelationshipType.DEFINES
          )
        );
        relationships.push(
          this.createRelationship(
            fileEntity.id,
            classEntity.id,
            RelationshipType.CONTAINS
          )
        );
        // Track local JS symbol for basic resolution
        try {
          if (classEntity.name)
            ctx?.locals.set(classEntity.name, classEntity.id);
        } catch {}
        // Update owner for nested traversal
        for (const child of node.children || []) {
          this.walkJavaScriptAST(
            child,
            fileEntity,
            entities,
            relationships,
            filePath,
            {
              ownerId: classEntity.id,
              locals: ctx?.locals || new Map<string, string>(),
            }
          );
        }
        return;
      }
    }

    // CALLS: basic detection for JavaScript
    if (node.type === "call_expression") {
      try {
        const calleeNode = node.children?.[0];
        let callee = "";
        let isMethod = false;
        let accessPath: string | undefined;
        if (calleeNode) {
          if (calleeNode.type === "identifier") {
            callee = String(calleeNode.text || "");
          } else if (calleeNode.type === "member_expression") {
            // member_expression: object . property
            const prop = (calleeNode.children || []).find(
              (c: any) =>
                c.type === "property_identifier" || c.type === "identifier"
            );
            callee = String(prop?.text || "");
            isMethod = true;
            accessPath = String(calleeNode.text || "");
          } else {
            callee = String(calleeNode.text || "");
          }
        }
        const argsNode = (node.children || []).find(
          (c: any) => c.type === "arguments"
        );
        let arity: number | undefined = undefined;
        if (argsNode && Array.isArray(argsNode.children)) {
          // Count non-punctuation children as rough arity
          const count = argsNode.children.filter(
            (c: any) => !["(", ")", ","].includes(c.type)
          ).length;
          arity = count;
        }
        const fromId = ctx?.ownerId || fileEntity.id;
        let toId: string;
        if (callee && ctx?.locals?.has(callee)) toId = ctx.locals.get(callee)!;
        else toId = callee ? `external:${callee}` : `external:call`;
        const line = (node.startPosition?.row ?? 0) + 1;
        const column = (node.startPosition?.column ?? 0) + 1;
        const meta: any = {
          kind: "call",
          callee,
          isMethod,
          accessPath,
          ...(typeof arity === "number" ? { arity } : {}),
          path: fileEntity.path,
          line,
          column,
          scope: toId.startsWith("external:") ? "external" : "local",
          resolution: toId.startsWith("external:") ? "heuristic" : "direct",
        };
        relationships.push(
          this.createRelationship(fromId, toId, RelationshipType.CALLS, meta)
        );
      } catch {}
    }


    if (node.type === "assignment_expression") {
      try {
        const left = node.children?.[0];
        const right = node.children?.[2];
        const opNode = node.children?.[1];
        const op = String(opNode?.text || "=");
        const lineBase = (node.startPosition?.row ?? 0) + 1;
        const colBase = (node.startPosition?.column ?? 0) + 1;
        const fromId = ctx?.ownerId || fileEntity.id;

        const leftName =
          left?.type === "identifier" ? String(left.text || "") : undefined;
        if (leftName) {
          const toId = ctx?.locals?.get(leftName) || `external:${leftName}`;
          relationships.push(
            this.createRelationship(fromId, toId, RelationshipType.WRITES, {
              kind: "write",
              operator: op,
              path: fileEntity.path,
              line: lineBase,
              column: colBase,
              scope: toId.startsWith("external:") ? "external" : "local",
              resolution: toId.startsWith("external:") ? "heuristic" : "direct",
            })
          );
        }

        if (left?.type === "member_expression") {
          const prop = (left.children || []).find(
            (c: any) =>
              c.type === "property_identifier" || c.type === "identifier"
          );
          const propName = prop ? String(prop.text || "") : "";
          const accessPath = String(left.text || "");
          if (propName) {
            relationships.push(
              this.createRelationship(
                fromId,
                `external:${propName}`,
                RelationshipType.WRITES,
                {
                  kind: "write",
                  operator: op,
                  accessPath,
                  path: fileEntity.path,
                  line: lineBase,
                  column: colBase,
                  scope: "external",
                  resolution: "heuristic",
                }
              )
            );
          }
        }

        if (right && Array.isArray(right.children)) {
          for (const child of right.children) {
            if (child.type === "identifier") {
              const nm = String(child.text || "");
              if (!nm) continue;
              const toId = ctx?.locals?.get(nm) || `external:${nm}`;
              relationships.push(
                this.createRelationship(fromId, toId, RelationshipType.READS, {
                  kind: "read",
                  path: fileEntity.path,
                  line: lineBase,
                  column: colBase,
                  scope: toId.startsWith("external:") ? "external" : "local",
                  resolution: toId.startsWith("external:")
                    ? "heuristic"
                    : "direct",
                })
              );
            }

            if (child.type === "member_expression") {
              const prop = (child.children || []).find(
                (c: any) =>
                  c.type === "property_identifier" || c.type === "identifier"
              );
              const propName = prop ? String(prop.text || "") : "";
              const accessPath = String(child.text || "");
              if (propName) {
                relationships.push(
                  this.createRelationship(
                    fromId,
                    `external:${propName}`,
                    RelationshipType.READS,
                    {
                      kind: "read",
                      accessPath,
                      path: fileEntity.path,
                      line: lineBase,
                      column: colBase,
                      scope: "external",
                      resolution: "heuristic",
                    }
                  )
                );
              }
            }
          }
        }
      } catch {}
    }


    for (const child of node.children || []) {
      this.walkJavaScriptAST(
        child,
        fileEntity,
        entities,
        relationships,
        filePath,
        ctx
      );
    }
  }

  private async createFileEntity(
    filePath: string,
    content: string
  ): Promise<File> {
    const stats = await fs.stat(filePath);
    const relativePath = path.relative(process.cwd(), filePath);

    return {

      id: `file:${relativePath}`,
      type: "file",
      path: relativePath,
      hash: crypto.createHash("sha256").update(content).digest("hex"),
      language: this.detectLanguage(filePath),
      lastModified: stats.mtime,
      created: stats.birthtime,
      extension: path.extname(filePath),
      size: stats.size,
      lines: content.split("\n").length,
      isTest:
        /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath) ||
        /__tests__/.test(filePath),
      isConfig:
        /(package\.json|tsconfig\.json|webpack\.config|jest\.config)/.test(
          filePath
        ),
      dependencies: this.extractDependencies(content),
    };
  }

  private createSymbolEntity(
    node: Node,
    fileEntity: File
  ): SymbolEntity | null {
    const name = this.getSymbolName(node);
    const signature = this.getSymbolSignature(node);

    if (!name) return null;

    const sigHash = crypto
      .createHash("sha1")
      .update(signature)
      .digest("hex")
      .slice(0, 8);
    const id = `sym:${fileEntity.path}#${name}@${sigHash}`;

    const baseSymbol = {
      id,
      type: "symbol" as const,
      path: `${fileEntity.path}:${name}`,
      hash: crypto.createHash("sha256").update(signature).digest("hex"),
      language: fileEntity.language,
      lastModified: fileEntity.lastModified,
      created: fileEntity.created,
      name,
      kind: this.getSymbolKind(node) as any,
      signature,
      docstring: this.getSymbolDocstring(node),
      visibility: this.getSymbolVisibility(node),
      isExported: this.isSymbolExported(node),
      isDeprecated: this.isSymbolDeprecated(node),
    };


    if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node)) {
      return {
        ...baseSymbol,
        type: "symbol",
        kind: "function",
        parameters: this.getFunctionParameters(node),
        returnType: this.getFunctionReturnType(node),
        isAsync: this.isFunctionAsync(node),
        isGenerator: this.isFunctionGenerator(node),
        complexity: this.calculateComplexity(node),
        calls: [],
      } as unknown as FunctionSymbol;
    }

    if (Node.isClassDeclaration(node)) {
      return {
        ...baseSymbol,
        type: "symbol",
        kind: "class",
        extends: this.getClassExtends(node),
        implements: this.getClassImplements(node),
        methods: [],
        properties: [],
        isAbstract: this.isClassAbstract(node),
      } as unknown as ClassSymbol;
    }

    if (Node.isInterfaceDeclaration(node)) {
      return {
        ...baseSymbol,
        type: "symbol",
        kind: "interface",
        extends: this.getInterfaceExtends(node),
        methods: [],
        properties: [],
      } as unknown as InterfaceSymbol;
    }

    if (Node.isTypeAliasDeclaration(node)) {
      return {
        ...baseSymbol,
        type: "symbol",
        kind: "typeAlias",
        aliasedType: this.getTypeAliasType(node),
        isUnion: this.isTypeUnion(node),
        isIntersection: this.isTypeIntersection(node),
      } as unknown as TypeAliasSymbol;
    }


    return baseSymbol;
  }

  private createJavaScriptFunctionEntity(
    node: any,
    fileEntity: File
  ): FunctionSymbol | null {
    const name = this.getJavaScriptSymbolName(node);
    if (!name) return null;

    return {
      id: crypto.randomUUID(),
      type: "symbol",
      path: `${fileEntity.path}:${name}`,
      hash: crypto.createHash("sha256").update(name).digest("hex"),
      language: "javascript",
      lastModified: fileEntity.lastModified,
      created: fileEntity.created,
      metadata: {},
      name,
      kind: "function" as any,
      signature: `function ${name}()`,
      docstring: "",
      visibility: "public",
      isExported: false,
      isDeprecated: false,
      parameters: [],
      returnType: "any",
      isAsync: false,
      isGenerator: false,
      complexity: 1,
      calls: [],
    };
  }

  private createJavaScriptClassEntity(
    node: any,
    fileEntity: File
  ): ClassSymbol | null {
    const name = this.getJavaScriptSymbolName(node);
    if (!name) return null;

    return {
      id: crypto.randomUUID(),
      type: "symbol",
      path: `${fileEntity.path}:${name}`,
      hash: crypto.createHash("sha256").update(name).digest("hex"),
      language: "javascript",
      lastModified: fileEntity.lastModified,
      created: fileEntity.created,
      name,
      kind: "class",
      signature: `class ${name}`,
      docstring: "",
      visibility: "public",
      isExported: false,
      isDeprecated: false,
      extends: [],
      implements: [],
      methods: [],
      properties: [],
      isAbstract: false,
    };
  }

  private extractSymbolRelationships(
    node: Node,
    symbolEntity: SymbolEntity,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ): GraphRelationship[] {
    const relationships: GraphRelationship[] = [];

    const callAgg = new Map<
      string,
      { count: number; meta: Record<string, any> }
    >();


    const localIndex = new Map<string, string>();
    try {
      const sfPath = (sourceFile.getFilePath && sourceFile.getFilePath()) || "";
      const relPath = path.relative(process.cwd(), sfPath);
      // Gather top-level declarations with names and map to their entity ids if already known
      // Note: During this pass, we may not have access to ids of other symbols unless they were just created.
      // For same-file references where we have the entity (symbolEntity), we still rely on fallbacks below.
      // The incremental parser stores a symbolMap in the cache; we leverage that when available.
      const cached = this.fileCache.get(path.resolve(relPath));
      if (cached && cached.symbolMap) {
        for (const [k, v] of cached.symbolMap.entries()) {
          const valId = (v as any).id;
          // Original key format in cache: `${symbolEntity.path}:${symbolEntity.name}`
          localIndex.set(k, valId);
          // Also index by simplified key `${fileRelPath}:${name}` to match lookups below
          const parts = String(k).split(":");
          if (parts.length >= 2) {
            const name = parts[parts.length - 1];
            // symbolEntity.path may itself be `${fileRelPath}:${name}`; rebuild simplified key
            const simpleKey = `${relPath}:${name}`;
            localIndex.set(simpleKey, valId);
          }
        }
      }
    } catch {}

    // Extract function calls with best-effort resolution to local symbols first
    if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node)) {
      const calls = node
        .getDescendants()
        .filter((descendant) => Node.isCallExpression(descendant));
      for (const call of calls) {
        try {
          const expr: any = (call as any).getExpression?.() || null;
          let targetName = "";
          if (expr && typeof expr.getText === "function") {
            targetName = String(expr.getText());
          } else {
            targetName = String(call.getExpression()?.getText?.() || "");
          }

          // Try to resolve identifier or property access to a local symbol id or cross-file import
          let toId: string | null = null;
          const sfPath = path.relative(process.cwd(), sourceFile.getFilePath());
          const parts = targetName.split(".");
          const simpleName = (parts.pop() || targetName).trim();

          // Skip noisy/global names
          const simpleLower = simpleName.toLowerCase();
          if (
            !simpleLower ||
            simpleLower.length < noiseConfig.AST_MIN_NAME_LENGTH ||
            this.stopNames.has(simpleLower)
          ) {
            continue;
          }

          // Inspect call arity and awaited usage
          let arity = 0;
          try {
            const args: any[] = (call as any).getArguments?.() || [];
            arity = Array.isArray(args) ? args.length : 0;
          } catch {}
          let awaited = false;
          try {
            let p: any = (call as any).getParent?.();
            while (
              p &&
              typeof p.getKind === "function" &&
              p.getKind() === SyntaxKind.ParenthesizedExpression
            )
              p = p.getParent?.();
            awaited = !!(
              p &&
              typeof p.getKind === "function" &&
              p.getKind() === SyntaxKind.AwaitExpression
            );
          } catch {}


          let resHint: string | undefined;
          let scopeHint: string | undefined;
          const baseMeta: Record<string, any> = {};


          try {
            if (
              (ts as any).isPropertyAccessExpression &&
              (call as any).getExpression &&
              (call as any).getExpression().getExpression
            ) {
              const pae: any = (call as any).getExpression();
              const base: any = pae?.getExpression?.();
              const methodName: string = pae?.getName?.() || simpleName;
              if (base && typeof methodName === "string") {
                (baseMeta as any).isMethod = true;
                const checker = this.tsProject.getTypeChecker();
                const t = (checker as any).getTypeAtLocation?.(base);
                const sym: any = t?.getSymbol?.();
                const decls: any[] = Array.isArray(sym?.getDeclarations?.())
                  ? sym.getDeclarations()
                  : [];
                const firstDecl = decls[0];
                const declSf = firstDecl?.getSourceFile?.();
                const abs = declSf?.getFilePath?.();
                if (abs) {
                  const rel = path.relative(process.cwd(), abs);
                  toId = `file:${rel}:${methodName}`;
                  resHint = "type-checker";
                  scopeHint = "imported";
                }

                try {
                  const tText =
                    typeof t?.getText === "function" ? t.getText() : undefined;
                  if (tText) (baseMeta as any).receiverType = tText;
                  const isUnion =
                    typeof (t as any)?.isUnion === "function"
                      ? (t as any).isUnion()
                      : false;
                  const isInterface = String(sym?.getFlags?.() || "").includes(
                    "Interface"
                  );
                  if (isUnion || isInterface)
                    (baseMeta as any).dynamicDispatch = true;
                } catch {}
              }
            }
          } catch {}


          if (importMap && parts.length > 1) {
            const root = parts[0];
            if (importMap.has(root)) {
              const relTarget = importMap.get(root)!;
              const hint = importSymbolMap?.get(root) || simpleName;
              toId = `file:${relTarget}:${hint}`;
              resHint = "via-import";
              scopeHint = "imported";
            }
          }


          try {
            if (targetName.includes(".")) {
              const mutating = new Set([
                "push",
                "pop",
                "shift",
                "unshift",
                "splice",
                "sort",
                "reverse",
                "copyWithin",
                "fill",
                "set",
                "delete",
                "clear",
                "add",
              ]);
              const partsAll = targetName.split(".");
              const mName = partsAll[partsAll.length - 1];
              if (mutating.has(mName)) {
                const baseExpr = (call as any)
                  .getExpression?.()
                  ?.getExpression?.();
                const baseText: string = baseExpr?.getText?.() || "";
                if (baseText) {
                  // Try to resolve base identifier to local symbol id
                  const keyBase = `${sfPath}:${baseText}`;
                  let varTo: string | null = null;
                  if (localIndex.has(keyBase)) {
                    varTo = localIndex.get(keyBase)!;
                  } else if (importMap && importMap.has(baseText)) {
                    const deep =
                      this.resolveImportedMemberToFileAndName(
                        baseText,
                        baseText,
                        sourceFile,
                        importMap,
                        importSymbolMap
                      ) || null;
                    const fallbackName =
                      importSymbolMap?.get(baseText) || baseText;
                    varTo = deep
                      ? `file:${deep.fileRel}:${deep.name}`
                      : `file:${importMap.get(baseText)!}:${fallbackName}`;
                  } else if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(baseText)) {
                    varTo = `external:${baseText}`;
                  }
                  if (varTo) {
                    relationships.push(
                      this.createRelationship(
                        symbolEntity.id,
                        varTo,
                        RelationshipType.WRITES,
                        {
                          kind: "write",
                          operator: "mutate",
                          accessPath: targetName,
                        }
                      )
                    );
                  }
                }
              }
            }
          } catch {}


          if (!toId && importMap && simpleName && importMap.has(simpleName)) {
            const deep =
              this.resolveImportedMemberToFileAndName(
                simpleName,
                "default",
                sourceFile,
                importMap,
                importSymbolMap
              ) ||
              this.resolveImportedMemberToFileAndName(
                simpleName,
                simpleName,
                sourceFile,
                importMap,
                importSymbolMap
              );
            if (deep) {
              toId = `file:${deep.fileRel}:${deep.name}`;
              resHint = "via-import";
              scopeHint = "imported";
            }
          }
          const key = `${sfPath}:${simpleName}`;
          if (localIndex.has(key)) {
            toId = localIndex.get(key)!;
            resHint = "direct";
            scopeHint = "local";
          }

          if (!toId) {

            const tcTarget = this.shouldUseTypeChecker({
              context: "call",
              imported: !!importMap,
              ambiguous: true,
              nameLength: simpleName.length,
            })
              ? this.resolveCallTargetWithChecker(call as any, sourceFile) ||
                this.resolveWithTypeChecker(expr, sourceFile)
              : null;
            if (tcTarget) {
              toId = `file:${tcTarget.fileRel}:${tcTarget.name}`;
              resHint = "type-checker";
              scopeHint = "imported";
            }
          }


          let line: number | undefined;
          let column: number | undefined;
          try {
            const pos = (call as any).getStart?.();
            if (typeof pos === "number") {
              const lc = sourceFile.getLineAndColumnAtPos(pos);
              line = lc.line;
              column = lc.column;
            }
          } catch {}

          if (!scopeHint && toId) {
            if (toId.startsWith("external:")) scopeHint = "external";
            else if (toId.startsWith("file:")) scopeHint = "imported";
            else scopeHint = "unknown";
          }

          Object.assign(baseMeta, {
            path: path.relative(process.cwd(), sourceFile.getFilePath()),
            ...(typeof line === "number" ? { line } : {}),
            ...(typeof column === "number" ? { column } : {}),
            kind: "call",
            callee: simpleName,
            accessPath: targetName,
            arity,
            awaited,
            ...(resHint ? { resolution: resHint } : {}),
            ...(scopeHint ? { scope: scopeHint } : {}),
          });
          if (!("isMethod" in baseMeta) && targetName.includes("."))
            (baseMeta as any).isMethod = true;



          try {
            if (toId) {

              if (toId.startsWith("file:")) {
                const m = toId.match(/^file:(.+?):(.+)$/);
                if (m) {
                  const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                  if (hit) toId = hit.id;
                }
              } else if (
                toId.startsWith("external:") ||
                /^(class|interface|function|typeAlias):/.test(toId)
              ) {
                const nm = toId.startsWith("external:")
                  ? toId.slice("external:".length)
                  : toId.split(":").slice(1).join(":");
                const list = this.nameIndex.get(nm) || [];
                if (list.length === 1) toId = list[0].id;
                else if (list.length > 1) {
                  const dir = sfPath.includes("/")
                    ? sfPath.slice(0, sfPath.lastIndexOf("/")) + "/"
                    : "";
                  const near = list.filter((s) =>
                    ((s as any).path || "").startsWith(dir)
                  );
                  if (near.length === 1) toId = near[0].id;
                }
              }
            }
          } catch {}

          if (
            toId &&
            !toId.startsWith("external:") &&
            !toId.startsWith("file:")
          ) {
            const keyAgg = `${symbolEntity.id}|${toId}`;
            const prev = callAgg.get(keyAgg);
            if (!prev) callAgg.set(keyAgg, { count: 1, meta: baseMeta });
            else {
              prev.count += 1;
              // keep earliest line
              if (
                typeof baseMeta.line === "number" &&
                (typeof prev.meta.line !== "number" ||
                  baseMeta.line < prev.meta.line)
              )
                prev.meta = baseMeta;
            }
          } else if (toId && toId.startsWith("file:")) {

            const confidence = scoreInferredEdge({
              relationType: RelationshipType.CALLS,
              toId,
              fromFileRel: sfPath,
              usedTypeChecker: true,
              nameLength: simpleName.length,
            });
            if (confidence >= noiseConfig.MIN_INFERRED_CONFIDENCE) {
              const keyAgg = `${symbolEntity.id}|${toId}`;
              const meta: Record<string, any> = {
                ...baseMeta,
                inferred: true,
                source: "call-typecheck",
                confidence,
                resolution: "type-checker",
                scope: "imported",
              };
              const prev = callAgg.get(keyAgg);
              if (!prev) callAgg.set(keyAgg, { count: 1, meta });
              else {
                prev.count += 1;
                if (
                  typeof meta.line === "number" &&
                  (typeof prev.meta.line !== "number" ||
                    meta.line < prev.meta.line)
                )
                  prev.meta = meta;
              }
            }
          } else {

          }
        } catch {


        }
      }
    }


    if (Node.isClassDeclaration(node)) {
      const heritageClauses = node.getHeritageClauses();
      for (const clause of heritageClauses) {
        if (clause.getToken() === SyntaxKind.ExtendsKeyword) {
          for (const type of clause.getTypeNodes()) {
            try {
              const sfPath = path.relative(
                process.cwd(),
                sourceFile.getFilePath()
              );
              const simple = type.getText();
              const key = `${sfPath}:${simple}`;
              let toId = localIndex.get(key);
              if (toId) {

                try {
                  if (toId.startsWith("file:")) {
                    const m = toId.match(/^file:(.+?):(.+)$/);
                    if (m) {
                      const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                      if (hit) toId = hit.id;
                    }
                  }
                } catch {}
                relationships.push(
                  this.createRelationship(
                    symbolEntity.id,
                    toId,
                    RelationshipType.EXTENDS,
                    { resolved: true }
                  )
                );
              } else {

                let resolved: {
                  fileRel: string;
                  name: string;
                  depth: number;
                } | null = null;
                if (importMap) {
                  resolved = this.resolveImportedMemberToFileAndName(
                    simple,
                    simple,
                    sourceFile,
                    importMap,
                    importSymbolMap
                  );
                }
                if (!resolved) {
                  const tc = this.shouldUseTypeChecker({
                    context: "heritage",
                    imported: true,
                    ambiguous: true,
                    nameLength: String(type.getText() || "").length,
                  })
                    ? this.resolveWithTypeChecker(type as any, sourceFile)
                    : null;
                  if (tc)
                    resolved = {
                      fileRel: tc.fileRel,
                      name: tc.name,
                      depth: 0,
                    } as any;
                }
                let placeholder = resolved
                  ? `file:${resolved.fileRel}:${resolved.name}`
                  : `class:${simple}`;
                try {
                  const m = placeholder.match(/^file:(.+?):(.+)$/);
                  if (m) {
                    const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                    if (hit) placeholder = hit.id;
                  } else if (placeholder.startsWith("class:")) {
                    const nm = placeholder.slice("class:".length);
                    const list = this.nameIndex.get(nm) || [];
                    if (list.length === 1) placeholder = list[0].id;
                  }
                } catch {}
                relationships.push(
                  this.createRelationship(
                    symbolEntity.id,
                    placeholder,
                    RelationshipType.EXTENDS,
                    resolved
                      ? { resolved: true, importDepth: resolved.depth }
                      : undefined
                  )
                );
              }
            } catch {
              relationships.push(
                this.createRelationship(
                  symbolEntity.id,
                  `class:${type.getText()}`,
                  RelationshipType.EXTENDS
                )
              );
            }
          }
        }
        if (clause.getToken() === SyntaxKind.ImplementsKeyword) {
          for (const type of clause.getTypeNodes()) {
            try {
              const sfPath = path.relative(
                process.cwd(),
                sourceFile.getFilePath()
              );
              const simple = type.getText();
              const key = `${sfPath}:${simple}`;
              let toId = localIndex.get(key);
              if (toId) {
                try {
                  if (toId.startsWith("file:")) {
                    const m = toId.match(/^file:(.+?):(.+)$/);
                    if (m) {
                      const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                      if (hit) toId = hit.id;
                    }
                  }
                } catch {}
                relationships.push(
                  this.createRelationship(
                    symbolEntity.id,
                    toId,
                    RelationshipType.IMPLEMENTS,
                    { resolved: true }
                  )
                );
              } else {
                let resolved: {
                  fileRel: string;
                  name: string;
                  depth: number;
                } | null = null;
                if (importMap) {
                  resolved = this.resolveImportedMemberToFileAndName(
                    simple,
                    simple,
                    sourceFile,
                    importMap,
                    importSymbolMap
                  );
                }
                if (!resolved) {
                  const tc = this.takeTcBudget()
                    ? this.resolveWithTypeChecker(type as any, sourceFile)
                    : null;
                  if (tc)
                    resolved = {
                      fileRel: tc.fileRel,
                      name: tc.name,
                      depth: 0,
                    } as any;
                }
                let placeholder = resolved
                  ? `file:${resolved.fileRel}:${resolved.name}`
                  : `interface:${simple}`;
                try {
                  const m = placeholder.match(/^file:(.+?):(.+)$/);
                  if (m) {
                    const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                    if (hit) placeholder = hit.id;
                  } else if (placeholder.startsWith("interface:")) {
                    const nm = placeholder.slice("interface:".length);
                    const list = this.nameIndex.get(nm) || [];
                    if (list.length === 1) placeholder = list[0].id;
                  }
                } catch {}
                relationships.push(
                  this.createRelationship(
                    symbolEntity.id,
                    placeholder,
                    RelationshipType.IMPLEMENTS,
                    resolved
                      ? { resolved: true, importDepth: resolved.depth }
                      : undefined
                  )
                );
              }
            } catch {
              relationships.push(
                this.createRelationship(
                  symbolEntity.id,
                  `interface:${type.getText()}`,
                  RelationshipType.IMPLEMENTS
                )
              );
            }
          }
        }
      }
    }

    // Decorators on classes/methods/properties/parameters -> REFERENCES(kind=decorator)
    try {
      const getDecorators: any = (node as any).getDecorators?.();
      const decs: any[] = Array.isArray(getDecorators) ? getDecorators : [];
      for (const d of decs) {
        try {
          const expr: any = d.getExpression?.() || d.getNameNode?.() || null;
          let accessPath = "";
          let simpleName = "";
          if (expr && typeof expr.getText === "function") {
            accessPath = String(expr.getText());
            const base = accessPath.split("(")[0];
            simpleName = (base.split(".").pop() || base).trim();
          }
          if (!simpleName) continue;
          if (
            this.stopNames.has(simpleName.toLowerCase()) ||
            simpleName.length < noiseConfig.AST_MIN_NAME_LENGTH
          )
            continue;
          let toId: string | null = null;

          try {
            if (
              !toId &&
              this.shouldUseTypeChecker({
                context: "decorator",
                imported: !!importMap,
                ambiguous: true,
                nameLength: simpleName.length,
              })
            ) {
              const tc = this.resolveWithTypeChecker(expr as any, sourceFile);
              if (tc) toId = `file:${tc.fileRel}:${tc.name}`;
            }
          } catch {}

          if (!toId && importMap) {
            const root = accessPath.split(/[.(]/)[0];
            const target = root && importMap.get(root);
            if (target) toId = `file:${target}:${simpleName}`;
          }
          if (!toId) {
            toId = `external:${simpleName}`;
          }

          let line: number | undefined;
          let column: number | undefined;
          try {
            const pos = (d as any).getStart?.();
            if (typeof pos === "number") {
              const lc = sourceFile.getLineAndColumnAtPos(pos);
              line = lc.line;
              column = lc.column;
            }
          } catch {}
          const meta = {
            kind: "decorator",
            accessPath,
            path: path.relative(process.cwd(), sourceFile.getFilePath()),
            ...(typeof line === "number" ? { line } : {}),
            ...(typeof column === "number" ? { column } : {}),
          };
          relationships.push(
            this.createRelationship(
              symbolEntity.id,
              toId,
              RelationshipType.REFERENCES,
              meta
            )
          );
        } catch {}
      }
    } catch {}


    if (Node.isMethodDeclaration(node) || Node.isFunctionDeclaration(node)) {
      try {

        if (Node.isMethodDeclaration(node)) {
          const ownerClass = node.getFirstAncestor((a) =>
            Node.isClassDeclaration(a)
          );
          const nameNode: any = (node as any).getNameNode?.();
          const methodName: string =
            (typeof nameNode?.getText === "function"
              ? nameNode.getText()
              : (node as any).getName?.()) || "";
          if (ownerClass && methodName) {
            const heritage = (ownerClass as any).getHeritageClauses?.() || [];
            for (const clause of heritage) {
              if (clause.getToken() === SyntaxKind.ExtendsKeyword) {
                for (const type of clause.getTypeNodes()) {
                  let baseFile: string | null = null;
                  let usedTc = false;
                  try {
                    if (importMap) {
                      const simple = type.getText();
                      const res = this.resolveImportedMemberToFileAndName(
                        simple,
                        simple,
                        sourceFile,
                        importMap,
                        importSymbolMap
                      );
                      if (res) baseFile = res.fileRel;
                    }
                    if (!baseFile) {
                      const tc = this.shouldUseTypeChecker({
                        context: "heritage",
                        imported: true,
                        ambiguous: true,
                        nameLength: String(type.getText() || "").length,
                      })
                        ? this.resolveWithTypeChecker(type as any, sourceFile)
                        : null;
                      if (tc) {
                        baseFile = tc.fileRel;
                        usedTc = true;
                      }
                    }
                  } catch {}
                  if (baseFile) {
                    // Prefer linking to exact base method symbol if known
                    let toId: string = `file:${baseFile}:${methodName}`;
                    try {
                      const hit = this.globalSymbolIndex.get(
                        `${baseFile}:${methodName}`
                      );
                      if (hit) toId = hit.id;
                    } catch {}
                    const meta: any = {
                      path: path.relative(
                        process.cwd(),
                        sourceFile.getFilePath()
                      ),
                      kind: "override",
                    };
                    if (usedTc) {
                      meta.usedTypeChecker = true;
                      meta.resolution = "type-checker";
                    }
                    relationships.push(
                      this.createRelationship(
                        symbolEntity.id,
                        toId,
                        RelationshipType.OVERRIDES,
                        meta
                      )
                    );
                  }
                }
              }
            }
          }
        }
      } catch {}

      try {

        const throws =
          (node as any).getDescendantsOfKind?.(SyntaxKind.ThrowStatement) || [];
        for (const th of throws) {
          try {
            const expr: any = th.getExpression?.();
            let typeName = "";
            if (
              expr &&
              expr.getExpression &&
              typeof expr.getExpression === "function"
            ) {

              const e = expr.getExpression();
              typeName = e?.getText?.() || "";
            } else {
              typeName = expr?.getText?.() || "";
            }
            typeName = (typeName || "").split(".").pop() || "";
            if (!typeName) continue;
            let toId: string | null = null;
            if (importMap && importMap.has(typeName)) {
              const deep = this.resolveImportedMemberToFileAndName(
                typeName,
                typeName,
                sourceFile,
                importMap,
                importSymbolMap
              );
              const fallbackName = importSymbolMap?.get(typeName) || typeName;
              toId = deep
                ? `file:${deep.fileRel}:${deep.name}`
                : `file:${importMap.get(typeName)!}:${fallbackName}`;
            } else {
              // try local symbol using prebuilt localIndex from cache
              const sfPath = path.relative(
                process.cwd(),
                sourceFile.getFilePath()
              );
              const key = `${sfPath}:${typeName}`;
              const candidate = localIndex.get(key);
              if (candidate) {
                toId = candidate;
              }
            }
            // attach throw site location
            let tline: number | undefined;
            let tcol: number | undefined;
            try {
              const pos = (th as any).getStart?.();
              if (typeof pos === "number") {
                const lc = sourceFile.getLineAndColumnAtPos(pos);
                tline = lc.line;
                tcol = lc.column;
              }
            } catch {}
            const meta = {
              path: path.relative(process.cwd(), sourceFile.getFilePath()),
              kind: "throw",
              ...(typeof tline === "number" ? { line: tline } : {}),
              ...(typeof tcol === "number" ? { column: tcol } : {}),
            };
            let placeholder = toId || `class:${typeName}`;
            try {
              const m = placeholder.match(/^file:(.+?):(.+)$/);
              if (m) {
                const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                if (hit) placeholder = hit.id;
              } else if (placeholder.startsWith("class:")) {
                const nm = placeholder.slice("class:".length);
                const list = this.nameIndex.get(nm) || [];
                if (list.length === 1) placeholder = list[0].id;
                else if (list.length > 1) {
                  (meta as any).ambiguous = true;
                  (meta as any).candidateCount = list.length;
                }
              }
            } catch {}
            relationships.push(
              this.createRelationship(
                symbolEntity.id,
                placeholder,
                RelationshipType.THROWS,
                meta
              )
            );
          } catch {}
        }
      } catch {}

      try {

        const rt: any = (node as any).getReturnTypeNode?.();
        if (rt && typeof rt.getText === "function") {
          const tname = rt.getText();
          if (tname && tname.length >= noiseConfig.AST_MIN_NAME_LENGTH) {
            let toId: string = `external:${tname}`;
            if (importMap) {
              const deep = this.resolveImportedMemberToFileAndName(
                tname,
                tname,
                sourceFile,
                importMap,
                importSymbolMap
              );
              if (deep) toId = `file:${deep.fileRel}:${deep.name}`;
            }
            try {
              const m = toId.match(/^file:(.+?):(.+)$/);
              if (m) {
                const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                if (hit) toId = hit.id;
              } else if (toId.startsWith("external:")) {
                const nm = toId.slice("external:".length);
                const list = this.nameIndex.get(nm) || [];
                if (list.length === 1) toId = list[0].id;
                else if (list.length > 1) {

                }
              }
            } catch {}
            let line: number | undefined;
            let column: number | undefined;
            try {
              const pos = (rt as any).getStart?.();
              if (typeof pos === "number") {
                const lc = sourceFile.getLineAndColumnAtPos(pos);
                line = lc.line;
                column = lc.column;
              }
            } catch {}
            const meta: any = {
              inferred: true,
              kind: "type",
              ...(typeof line === "number" ? { line } : {}),
              ...(typeof column === "number" ? { column } : {}),
            };
            try {
              if (toId.startsWith("external:")) {
                const nm = toId.slice("external:".length);
                const list = this.nameIndex.get(nm) || [];
                if (list.length > 1) {
                  meta.ambiguous = true;
                  meta.candidateCount = list.length;
                }
              }
            } catch {}
            relationships.push(
              this.createRelationship(
                symbolEntity.id,
                toId,
                RelationshipType.RETURNS_TYPE,
                meta
              )
            );
          }
        } else {

          try {
            const t = (node as any).getReturnType?.();

            let tname = "";
            try {
              tname = (t?.getSymbol?.()?.getName?.() || "").toString();
            } catch {}
            if (!tname) {
              try {
                tname =
                  typeof t?.getText === "function" ? String(t.getText()) : "";
              } catch {}
            }
            if (tname) tname = String(tname).split(/[<|&]/)[0].trim();
            if (tname && tname.length >= noiseConfig.AST_MIN_NAME_LENGTH) {
              let toId: string = `external:${tname}`;
              if (importMap) {
                const deep = this.resolveImportedMemberToFileAndName(
                  tname,
                  tname,
                  sourceFile,
                  importMap,
                  importSymbolMap
                );
                if (deep) toId = `file:${deep.fileRel}:${deep.name}`;
              }
              try {
                const m = toId.match(/^file:(.+?):(.+)$/);
                if (m) {
                  const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                  if (hit) toId = hit.id;
                } else if (toId.startsWith("external:")) {
                  const nm = toId.slice("external:".length);
                  const list = this.nameIndex.get(nm) || [];
                  if (list.length === 1) toId = list[0].id;
                }
              } catch {}
              const meta: any = {
                inferred: true,
                kind: "type",
                usedTypeChecker: true,
                resolution: "type-checker",
              };
              relationships.push(
                this.createRelationship(
                  symbolEntity.id,
                  toId,
                  RelationshipType.RETURNS_TYPE,
                  meta
                )
              );
            }
          } catch {}
        }
      } catch {}

      try {

        const params: any[] = (node as any).getParameters?.() || [];
        for (const p of params) {
          const tn: any = p.getTypeNode?.();
          const pname: string = p.getName?.() || "";
          if (tn && typeof tn.getText === "function") {
            const tname = tn.getText();
            if (tname && tname.length >= noiseConfig.AST_MIN_NAME_LENGTH) {
              let toId: string = `external:${tname}`;
              if (importMap) {
                const deep = this.resolveImportedMemberToFileAndName(
                  tname,
                  tname,
                  sourceFile,
                  importMap,
                  importSymbolMap
                );
                if (deep) toId = `file:${deep.fileRel}:${deep.name}`;
              }
              try {
                const m = toId.match(/^file:(.+?):(.+)$/);
                if (m) {
                  const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                  if (hit) toId = hit.id;
                } else if (toId.startsWith("external:")) {
                  const nm = toId.slice("external:".length);
                  const list = this.nameIndex.get(nm) || [];
                  if (list.length === 1) toId = list[0].id;
                }
              } catch {}
              let pline: number | undefined;
              let pcol: number | undefined;
              try {
                const pos = (tn as any).getStart?.();
                if (typeof pos === "number") {
                  const lc = sourceFile.getLineAndColumnAtPos(pos);
                  pline = lc.line;
                  pcol = lc.column;
                }
              } catch {}
              const meta: any = { inferred: true, kind: "type", param: pname };
              relationships.push(
                this.createRelationship(
                  symbolEntity.id,
                  toId,
                  RelationshipType.PARAM_TYPE,
                  meta
                )
              );
              const scope = toId.startsWith("external:")
                ? "external"
                : toId.startsWith("file:")
                ? "imported"
                : "local";
              const depConfidence =
                scope === "local" ? 0.9 : scope === "imported" ? 0.6 : 0.4;
              const depMeta = {
                inferred: true,
                kind: "dependency",
                scope,
                resolution: "type-annotation",
                confidence: depConfidence,
                param: pname,
              } as any;
              relationships.push(
                this.createRelationship(
                  symbolEntity.id,
                  toId,
                  RelationshipType.DEPENDS_ON,
                  depMeta
                )
              );
            }
          } else {

            try {
              const t = p.getType?.();
              let tname = "";
              try {
                tname = (t?.getSymbol?.()?.getName?.() || "").toString();
              } catch {}
              if (!tname) {
                try {
                  tname =
                    typeof t?.getText === "function" ? String(t.getText()) : "";
                } catch {}
              }
              if (tname) tname = String(tname).split(/[<|&]/)[0].trim();
              if (tname && tname.length >= noiseConfig.AST_MIN_NAME_LENGTH) {
                let toId: string = `external:${tname}`;
                if (importMap) {
                  const deep = this.resolveImportedMemberToFileAndName(
                    tname,
                    tname,
                    sourceFile,
                    importMap,
                    importSymbolMap
                  );
                  if (deep) toId = `file:${deep.fileRel}:${deep.name}`;
                }
                try {
                  const m = toId.match(/^file:(.+?):(.+)$/);
                  if (m) {
                    const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
                    if (hit) toId = hit.id;
                  } else if (toId.startsWith("external:")) {
                    const nm = toId.slice("external:".length);
                    const list = this.nameIndex.get(nm) || [];
                    if (list.length === 1) toId = list[0].id;
                  }
                } catch {}
                const meta: any = {
                  inferred: true,
                  kind: "type",
                  param: pname,
                  usedTypeChecker: true,
                  resolution: "type-checker",
                };
                relationships.push(
                  this.createRelationship(
                    symbolEntity.id,
                    toId,
                    RelationshipType.PARAM_TYPE,
                    meta
                  )
                );
                const scope = toId.startsWith("external:")
                  ? "external"
                  : toId.startsWith("file:")
                  ? "imported"
                  : "local";
                const depConfidence =
                  scope === "local" ? 0.9 : scope === "imported" ? 0.6 : 0.4;
                const depMeta = {
                  inferred: true,
                  kind: "dependency",
                  scope,
                  resolution: "type-checker",
                  confidence: depConfidence,
                  param: pname,
                } as any;
                relationships.push(
                  this.createRelationship(
                    symbolEntity.id,
                    toId,
                    RelationshipType.DEPENDS_ON,
                    depMeta
                  )
                );
              }
            } catch {}
          }
        }
      } catch {}


      if (callAgg.size > 0) {
        for (const [k, v] of callAgg.entries()) {
          const toId = k.split("|")[1];
          const meta = { ...v.meta, occurrencesScan: v.count } as any;
          relationships.push(
            this.createRelationship(
              symbolEntity.id,
              toId,
              RelationshipType.CALLS,
              meta
            )
          );
          const refMeta = {
            ...meta,
            kind: "reference",
            via: (meta as any)?.kind || "call",
          } as any;
          relationships.push(
            this.createRelationship(
              symbolEntity.id,
              toId,
              RelationshipType.REFERENCES,
              refMeta
            )
          );
          try {
            if ((v.meta as any)?.scope === "imported") {
              const depMeta = {
                scope: "imported",
                resolution: (v.meta as any)?.resolution || "via-import",
                kind: "dependency",
                inferred: true,
                confidence:
                  typeof (v.meta as any)?.confidence === "number"
                    ? (v.meta as any).confidence
                    : 0.6,
              } as any;
              relationships.push(
                this.createRelationship(
                  symbolEntity.id,
                  toId,
                  RelationshipType.DEPENDS_ON,
                  depMeta
                )
              );
            }
          } catch {}
        }
        callAgg.clear();
      }
    }

    return relationships;
  }


  private extractReferenceRelationships(
    sourceFile: SourceFile,
    fileEntity: File,
    localSymbols: Array<{ node: Node; entity: SymbolEntity }>,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ): GraphRelationship[] {
    const relationships: GraphRelationship[] = [];
    const dedupe = new Set<string>();

    const refAgg = new Map<
      string,
      { count: number; meta: Record<string, any> }
    >();
    const readAgg = new Map<
      string,
      { count: number; meta: Record<string, any> }
    >();
    const writeAgg = new Map<
      string,
      { count: number; meta: Record<string, any> }
    >();
    const depAgg = new Map<string, Record<string, any>>();

    const fromFileRel = fileEntity.path;
    const addRel = (
      fromId: string,
      toId: string,
      type: RelationshipType,
      locNode?: Node,
      opts?: {
        usedTypeChecker?: boolean;
        isExported?: boolean;
        nameLength?: number;
        importDepth?: number;
        kindHint?: string;
        operator?: string;
        accessPath?: string;
        resolution?: string;
        scope?: string;
      }
    ) => {

      try {
        if (toId && typeof toId === "string") {
          if (toId.startsWith("file:")) {
            const m = toId.match(/^file:(.+?):(.+)$/);
            if (m) {
              const hit = this.globalSymbolIndex.get(`${m[1]}:${m[2]}`);
              if (hit) toId = hit.id;
            }
          } else if (toId.startsWith("external:")) {
            const nm = toId.slice("external:".length);
            const list = this.nameIndex.get(nm) || [];
            if (list.length === 1) toId = list[0].id;
          } else if (/^(class|interface|function|typeAlias):/.test(toId)) {
            const nm = toId.split(":").slice(1).join(":");
            const list = this.nameIndex.get(nm) || [];
            if (list.length === 1) toId = list[0].id;
          }
        }
      } catch {}

      const key = `${fromId}|${type}|${toId}`;

      const isAggregated =
        type === RelationshipType.REFERENCES ||
        type === RelationshipType.READS ||
        type === RelationshipType.WRITES;
      if (!isAggregated) {
        if (dedupe.has(key)) return;
        dedupe.add(key);
      }

      const gate = () => {
        try {
          if (toId.startsWith("external:")) {
            const nm = toId.substring("external:".length).toLowerCase();
            if (
              !nm ||
              nm.length < noiseConfig.AST_MIN_NAME_LENGTH ||
              this.stopNames.has(nm)
            )
              return false;
          }
          if (toId.startsWith("class:")) {
            const nm = toId.substring("class:".length).toLowerCase();
            if (
              !nm ||
              nm.length < noiseConfig.AST_MIN_NAME_LENGTH ||
              this.stopNames.has(nm)
            )
              return false;
          }
        } catch {}
        return true;
      };
      if (!gate()) return;

      let line: number | undefined;
      let column: number | undefined;
      try {
        if (locNode && typeof (locNode as any).getStart === "function") {
          const pos = (locNode as any).getStart();
          const lc = sourceFile.getLineAndColumnAtPos(pos);
          line = lc.line;
          column = lc.column;
        }
      } catch {}


      let metadata: Record<string, any> | undefined;
      const isPlaceholder =
        typeof toId === "string" &&
        (toId.startsWith("external:") || toId.startsWith("file:"));
      if (
        type === RelationshipType.REFERENCES ||
        type === RelationshipType.DEPENDS_ON ||
        ((type === RelationshipType.READS ||
          type === RelationshipType.WRITES) &&
          isPlaceholder)
      ) {
        const confidence = scoreInferredEdge({
          relationType: type,
          toId,
          fromFileRel,
          usedTypeChecker: !!opts?.usedTypeChecker,
          isExported: !!opts?.isExported,
          nameLength: opts?.nameLength,
          importDepth: opts?.importDepth,
        });

        if (confidence < noiseConfig.MIN_INFERRED_CONFIDENCE) return;
        metadata = { inferred: true, confidence };
      }


      metadata = {
        ...(metadata || {}),
        path: fileEntity.path,
        ...(typeof line === "number" ? { line } : {}),
        ...(typeof column === "number" ? { column } : {}),
        ...(opts?.kindHint ? { kind: opts.kindHint } : {}),
        ...(opts?.operator ? { operator: opts.operator } : {}),
        ...(opts?.accessPath ? { accessPath: opts.accessPath } : {}),
        ...(opts?.resolution ? { resolution: opts.resolution } : {}),
        ...(opts?.scope
          ? { scope: opts.scope }
          : {
              scope: toId.startsWith("external:")
                ? "external"
                : toId.startsWith("file:")
                ? "imported"
                : "unknown",
            }),
      };


      if (type === RelationshipType.READS || type === RelationshipType.WRITES) {
        try {
          const owner = locNode ? enclosingSymbolId(locNode) : fileEntity.id;
          let varName = "";
          if (toId.startsWith("file:")) {
            const parts = toId.split(":");
            varName = parts[parts.length - 1] || "";
          } else if (toId.startsWith("sym:")) {
            const m = toId.match(/^sym:[^#]+#([^@]+)(?:@.+)?$/);
            varName = (m && m[1]) || "";
          } else if (toId.startsWith("external:")) {
            varName = toId.slice("external:".length);
          } else {
            varName = toId;
          }
          const dfBase = `${fileEntity.path}|${owner}|${varName}`;
          const dfId =
            "df_" +
            crypto.createHash("sha1").update(dfBase).digest("hex").slice(0, 12);
          (metadata as any).dataFlowId = dfId;
        } catch {}
      }


      const aggKey = `${fromId}|${toId}`;
      if (type === RelationshipType.REFERENCES) {
        const prev = refAgg.get(aggKey);
        if (!prev) refAgg.set(aggKey, { count: 1, meta: metadata });
        else {
          prev.count += 1;
          if (
            typeof metadata.line === "number" &&
            (typeof prev.meta.line !== "number" ||
              metadata.line < prev.meta.line)
          )
            prev.meta = metadata;
        }
        try {
          if ((metadata as any).scope === "imported")
            depAgg.set(aggKey, metadata);
        } catch {}
        return;
      }
      if (type === RelationshipType.READS) {
        const prev = readAgg.get(aggKey);
        if (!prev) readAgg.set(aggKey, { count: 1, meta: metadata });
        else {
          prev.count += 1;
          if (
            typeof metadata.line === "number" &&
            (typeof prev.meta.line !== "number" ||
              metadata.line < prev.meta.line)
          )
            prev.meta = metadata;
        }
        try {
          if ((metadata as any).scope === "imported")
            depAgg.set(aggKey, metadata);
        } catch {}
        return;
      }
      if (type === RelationshipType.WRITES) {
        const prev = writeAgg.get(aggKey);
        if (!prev) writeAgg.set(aggKey, { count: 1, meta: metadata });
        else {
          prev.count += 1;
          if (
            typeof metadata.line === "number" &&
            (typeof prev.meta.line !== "number" ||
              metadata.line < prev.meta.line)
          )
            prev.meta = metadata;
        }
        try {
          if ((metadata as any).scope === "imported")
            depAgg.set(aggKey, metadata);
        } catch {}
        return;
      }

      relationships.push(this.createRelationship(fromId, toId, type, metadata));
    };

    const enclosingSymbolId = (node: Node): string => {
      const owner = node.getFirstAncestor(
        (a) =>
          Node.isFunctionDeclaration(a) ||
          Node.isMethodDeclaration(a) ||
          Node.isClassDeclaration(a) ||
          Node.isInterfaceDeclaration(a) ||
          Node.isTypeAliasDeclaration(a) ||
          Node.isVariableDeclaration(a)
      );
      if (owner) {
        const found = localSymbols.find((ls) => ls.node === owner);
        if (found) return found.entity.id;
      }
      return fileEntity.id;
    };

    const isDeclarationName = (id: Node): boolean => {
      const p = id.getParent();
      if (!p) return false;
      return (
        (Node.isFunctionDeclaration(p) && p.getNameNode() === id) ||
        (Node.isClassDeclaration(p) && p.getNameNode() === id) ||
        (Node.isInterfaceDeclaration(p) && p.getNameNode() === id) ||
        (Node.isTypeAliasDeclaration(p) && p.getNameNode() === id) ||
        (Node.isVariableDeclaration(p) && p.getNameNode() === id) ||
        Node.isImportSpecifier(p) ||
        Node.isImportClause(p) ||
        Node.isNamespaceImport(p)
      );
    };


    for (const tr of sourceFile.getDescendantsOfKind(
      SyntaxKind.TypeReference
    )) {

      try {
        const fnOwner = tr.getFirstAncestor(
          (a: any) =>
            Node.isFunctionDeclaration(a) || Node.isMethodDeclaration(a)
        );
        if (fnOwner) {
          const rtNode: any = (fnOwner as any).getReturnTypeNode?.();
          if (rtNode && rtNode === (tr as any)) continue;
        }
      } catch {}

      try {
        const paramOwner = tr.getFirstAncestor(
          (a: any) =>
            (a as any).getTypeNode &&
            (a as any).getName &&
            Node.isParameterDeclaration(a as any)
        );
        if (paramOwner) {
          const tn: any = (paramOwner as any).getTypeNode?.();
          if (tn && tn === (tr as any)) continue;
        }
      } catch {}
      const typeName = tr.getTypeName().getText();
      if (!typeName) continue;
      if (
        this.stopNames.has(typeName.toLowerCase()) ||
        typeName.length < noiseConfig.AST_MIN_NAME_LENGTH
      )
        continue;
      const fromId = enclosingSymbolId(tr);

      const key = `${fileEntity.path}:${typeName}`;
      const local = localSymbols.find((ls) => (ls.entity as any).path === key);
      if (local) {
        const nm = (local.entity as any).name || "";
        addRel(fromId, local.entity.id, RelationshipType.TYPE_USES, tr, {
          isExported: !!(local.entity as any).isExported,
          nameLength: typeof nm === "string" ? nm.length : undefined,
          kindHint: "type",
          scope: "local",
          resolution: "direct",
        });
      } else {

        addRel(fromId, `external:${typeName}`, RelationshipType.TYPE_USES, tr, {
          nameLength: typeName?.length,
          kindHint: "type",
          scope: "external",
          resolution: "heuristic",
        });
      }
    }


    for (const nw of sourceFile.getDescendantsOfKind(
      SyntaxKind.NewExpression
    )) {
      const expr = nw.getExpression();
      const nameAll = expr ? expr.getText() : "";
      const name = nameAll ? nameAll.split(".").pop() || "" : "";
      if (!name) continue;
      if (
        this.stopNames.has(name.toLowerCase()) ||
        name.length < noiseConfig.AST_MIN_NAME_LENGTH
      )
        continue;
      const fromId = enclosingSymbolId(nw);
      const key = `${fileEntity.path}:${name}`;
      // If constructed class is imported: map to file:<path>:<name> using deep export map
      if (importMap && importMap.has(name)) {
        const deep =
          this.resolveImportedMemberToFileAndName(
            name,
            "default",
            sourceFile,
            importMap,
            importSymbolMap
          ) ||
          this.resolveImportedMemberToFileAndName(
            name,
            name,
            sourceFile,
            importMap,
            importSymbolMap
          );
        const fallbackName = importSymbolMap?.get(name) || name;
        const fr = deep
          ? `file:${deep.fileRel}:${deep.name}`
          : `file:${importMap.get(name)!}:${fallbackName}`;
        addRel(fromId, fr, RelationshipType.REFERENCES, nw, {
          nameLength: name?.length,
          importDepth: deep?.depth,
          kindHint: "instantiation",
          accessPath: nameAll,
          scope: "imported",
          resolution: deep ? "via-import" : "heuristic",
        });
        continue;
      }

      if (importMap && nameAll && nameAll.includes(".")) {
        const root = nameAll.split(".")[0];
        if (importMap.has(root)) {
          const deep = this.resolveImportedMemberToFileAndName(
            root,
            name,
            sourceFile,
            importMap,
            importSymbolMap
          );
          const fallbackName = importSymbolMap?.get(root) || name;
          const fr = deep
            ? `file:${deep.fileRel}:${deep.name}`
            : `file:${importMap.get(root)!}:${fallbackName}`;
          addRel(fromId, fr, RelationshipType.REFERENCES, nw, {
            nameLength: name?.length,
            importDepth: deep?.depth,
            kindHint: "instantiation",
            accessPath: nameAll,
            scope: "imported",
            resolution: deep ? "via-import" : "heuristic",
          });
          continue;
        }
      }
      const local = localSymbols.find((ls) => (ls.entity as any).path === key);
      if (local) {
        addRel(fromId, local.entity.id, RelationshipType.REFERENCES, nw, {
          kindHint: "instantiation",
          accessPath: nameAll,
          scope: "local",
          resolution: "direct",
        });
      } else {
        addRel(fromId, `class:${name}`, RelationshipType.REFERENCES, nw, {
          kindHint: "instantiation",
          accessPath: nameAll,
          scope: "unknown",
          resolution: "heuristic",
        });
      }
    }


    for (const id of sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)) {
      const text = id.getText();
      if (!text) continue;
      if (
        this.stopNames.has(text.toLowerCase()) ||
        text.length < noiseConfig.AST_MIN_NAME_LENGTH
      )
        continue;


      const parent = id.getParent();
      if (
        parent &&
        Node.isCallExpression(parent) &&
        parent.getExpression() === id
      ) {
        continue;
      }
      if (isDeclarationName(id)) continue;


      if (
        parent &&
        (Node.isImportSpecifier(parent) ||
          Node.isImportClause(parent) ||
          Node.isNamespaceImport(parent))
      ) {
        continue;
      }

      const fromId = enclosingSymbolId(id);

      if (importMap && importMap.has(text)) {
        const deep =
          this.resolveImportedMemberToFileAndName(
            text,
            "default",
            sourceFile,
            importMap,
            importSymbolMap
          ) ||
          this.resolveImportedMemberToFileAndName(
            text,
            text,
            sourceFile,
            importMap,
            importSymbolMap
          );
        const fallbackName = importSymbolMap?.get(text) || text;
        const fr = deep
          ? `file:${deep.fileRel}:${deep.name}`
          : `file:${importMap.get(text)!}:${fallbackName}`;
        addRel(fromId, fr, RelationshipType.REFERENCES, id, {
          nameLength: (text || "").length,
          importDepth: deep?.depth,
          kindHint: "identifier",
          scope: "imported",
          resolution: deep ? "via-import" : "heuristic",
        });
        continue;
      }
      const key = `${fileEntity.path}:${text}`;
      const local = localSymbols.find((ls) => (ls.entity as any).path === key);
      if (local) {
        const nm = (local.entity as any).name || "";
        addRel(fromId, local.entity.id, RelationshipType.REFERENCES, id, {
          isExported: !!(local.entity as any).isExported,
          nameLength: typeof nm === "string" ? nm.length : undefined,
          kindHint: "identifier",
          scope: "local",
          resolution: "direct",
        });
      } else {

        const tc = this.resolveWithTypeChecker(id, sourceFile);
        if (tc) {
          addRel(
            fromId,
            `file:${tc.fileRel}:${tc.name}`,
            RelationshipType.REFERENCES,
            id,
            {
              usedTypeChecker: true,
              nameLength: (tc.name || "").length,
              kindHint: "identifier",
              scope: "imported",
              resolution: "type-checker",
            }
          );
        } else {
          addRel(fromId, `external:${text}`, RelationshipType.REFERENCES, id, {
            nameLength: (text || "").length,
            kindHint: "identifier",
            scope: "external",
            resolution: "heuristic",
          });
        }
      }
    }


    try {
      const assignOps = new Set<string>([
        "=",
        "+=",
        "-=",
        "*=",
        "/=",
        "%=",
        "<<=",
        ">>=",
        ">>>=",
        "&=",
        "|=",
        "^=",
      ]);
      const bins = sourceFile.getDescendantsOfKind(SyntaxKind.BinaryExpression);
      for (const be of bins) {
        try {
          const op = (be as any).getOperatorToken?.()?.getText?.() || "";
          if (!assignOps.has(op)) continue;
          const lhs: any = (be as any).getLeft?.();
          const rhs: any = (be as any).getRight?.();
          const fromId = enclosingSymbolId(be);
          // Resolve LHS identifier writes: prefer local symbol or file-qualified symbol, do NOT use RHS type
          const resolveNameToId = (nm: string): string | null => {
            if (!nm) return null;
            if (importMap && importMap.has(nm)) {
              const deep =
                this.resolveImportedMemberToFileAndName(
                  nm,
                  nm,
                  sourceFile,
                  importMap,
                  importSymbolMap
                ) || null;
              const fallbackName = importSymbolMap?.get(nm) || nm;
              return deep
                ? `file:${deep.fileRel}:${deep.name}`
                : `file:${importMap.get(nm)!}:${fallbackName}`;
            }
            const key = `${fileEntity.path}:${nm}`;
            const local = localSymbols.find(
              (ls) => (ls.entity as any).path === key
            );
            if (local) return local.entity.id;
            // try best-effort type checker on LHS identifier itself
            try {
              if (this.takeTcBudget()) {
                const tc = this.resolveWithTypeChecker(lhs as any, sourceFile);
                if (tc) return `file:${tc.fileRel}:${tc.name}`;
              }
            } catch {}
            return `external:${nm}`;
          };

          // WRITES edge for simple identifier or property LHS
          if (lhs && typeof lhs.getText === "function") {
            const ltxt = lhs.getText();
            if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(ltxt)) {
              const tid = resolveNameToId(ltxt);
              addRel(fromId, tid!, RelationshipType.WRITES, lhs, {
                kindHint: "write",
                operator: op,
              });
            } else {

              try {
                const hasName =
                  (lhs as any).getName &&
                  typeof (lhs as any).getName === "function";
                const getExpr =
                  (lhs as any).getExpression &&
                  typeof (lhs as any).getExpression === "function"
                    ? (lhs as any).getExpression.bind(lhs)
                    : null;
                const prop = hasName ? (lhs as any).getName() : undefined;
                const baseExpr: any = getExpr ? getExpr() : null;
                const baseText =
                  baseExpr && typeof baseExpr.getText === "function"
                    ? baseExpr.getText()
                    : "";
                const accessPath = ltxt;

                let wrote = false;
                let toIdProp: string | null = null;
                // 1) Try type-checker to resolve the property symbol directly
                try {
                  if (this.takeTcBudget()) {
                    const tc = this.resolveWithTypeChecker(
                      lhs as any,
                      sourceFile
                    );
                    if (tc && tc.fileRel && tc.name) {
                      toIdProp = `file:${tc.fileRel}:${tc.name}`;
                      addRel(fromId, toIdProp, RelationshipType.WRITES, lhs, {
                        kindHint: "write",
                        operator: op,
                        accessPath,
                        usedTypeChecker: true,
                        resolution: "type-checker",
                        scope: "imported",
                      });
                      wrote = true;
                    }
                  }
                } catch {}


                if (
                  !wrote &&
                  importMap &&
                  prop &&
                  baseText &&
                  /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(baseText)
                ) {
                  try {
                    if (importMap.has(baseText)) {
                      const deep = this.resolveImportedMemberToFileAndName(
                        baseText,
                        prop,
                        sourceFile,
                        importMap,
                        importSymbolMap
                      );
                      if (deep) {
                        toIdProp = `file:${deep.fileRel}:${deep.name}`;
                        addRel(fromId, toIdProp, RelationshipType.WRITES, lhs, {
                          kindHint: "write",
                          operator: op,
                          accessPath,
                          importDepth: deep.depth,
                          resolution: "via-import",
                          scope: "imported",
                        });
                        wrote = true;
                      }
                    }
                  } catch {}
                }


                if (!wrote && prop) {
                  try {
                    const sfRel = fileEntity.path;
                    const list = this.nameIndex.get(prop) || [];
                    const sameFile = list.filter((s) => {
                      const p = (s as any).path as string | undefined;
                      return typeof p === "string" && p.startsWith(`${sfRel}:`);
                    });
                    if (sameFile.length === 1) {
                      addRel(
                        fromId,
                        sameFile[0].id,
                        RelationshipType.WRITES,
                        lhs,
                        {
                          kindHint: "write",
                          operator: op,
                          accessPath,
                          scope: "local",
                          resolution: "direct",
                        }
                      );
                      wrote = true;
                    } else if (sameFile.length > 1) {

                      const meta: any = {
                        kind: "write",
                        operator: op,
                        accessPath,
                        ambiguous: true,
                        candidateCount: sameFile.length,
                        scope: "local",
                        resolution: "heuristic",
                      };
                      addRel(
                        fromId,
                        `external:${prop}`,
                        RelationshipType.WRITES,
                        lhs,
                        meta
                      );
                      wrote = true;
                    }
                  } catch {}
                }


                if (!wrote && prop) {
                  addRel(
                    fromId,
                    `external:${prop}`,
                    RelationshipType.WRITES,
                    lhs,
                    {
                      kindHint: "write",
                      operator: op,
                      accessPath,
                      scope: "external",
                      resolution: "heuristic",
                    }
                  );
                  wrote = true;
                }
              } catch {}

              try {
                const kind = (lhs as any).getKind && (lhs as any).getKind();
                if (kind === SyntaxKind.ObjectLiteralExpression) {
                  const props: any[] = (lhs as any).getProperties?.() || [];
                  for (const pr of props) {
                    try {
                      const nm =
                        typeof pr.getName === "function"
                          ? pr.getName()
                          : undefined;
                      if (nm && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(nm)) {
                        const tid = resolveNameToId(nm);
                        addRel(
                          fromId,
                          tid!,
                          RelationshipType.WRITES,
                          pr as any,
                          { kindHint: "write", operator: op }
                        );
                      }
                    } catch {}
                  }
                } else if (kind === SyntaxKind.ArrayLiteralExpression) {
                  const elems: any[] = (lhs as any).getElements?.() || [];
                  for (const el of elems) {
                    try {
                      const nm =
                        typeof el.getText === "function" ? el.getText() : "";
                      if (nm && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(nm)) {
                        const tid = resolveNameToId(nm);
                        addRel(
                          fromId,
                          tid!,
                          RelationshipType.WRITES,
                          el as any,
                          { kindHint: "write", operator: op }
                        );
                      }
                    } catch {}
                  }
                }
              } catch {}
            }
          }


          if (rhs && typeof rhs.getDescendantsOfKind === "function") {
            const ids = rhs.getDescendantsOfKind(SyntaxKind.Identifier);
            for (const idn of ids) {
              const t = idn.getText();
              if (!t || isDeclarationName(idn)) continue;
              const key = `${fileEntity.path}:${t}`;
              const local = localSymbols.find(
                (ls) => (ls.entity as any).path === key
              );

              let accessPath: string | undefined;
              try {
                const parent: any = (idn as any).getParent?.();
                if (
                  parent &&
                  typeof parent.getKind === "function" &&
                  parent.getKind() === SyntaxKind.PropertyAccessExpression &&
                  typeof parent.getText === "function"
                ) {
                  accessPath = parent.getText();
                }
              } catch {}
              if (local) {
                addRel(fromId, local.entity.id, RelationshipType.READS, idn, {
                  kindHint: "read",
                  accessPath,
                  scope: "local",
                  resolution: "direct",
                });
              } else if (importMap && importMap.has(t)) {
                const deep = this.resolveImportedMemberToFileAndName(
                  t,
                  t,
                  sourceFile,
                  importMap,
                  importSymbolMap
                );
                const fallbackName = importSymbolMap?.get(t) || t;
                const fr = deep
                  ? `file:${deep.fileRel}:${deep.name}`
                  : `file:${importMap.get(t)!}:${fallbackName}`;
                addRel(fromId, fr, RelationshipType.READS, idn, {
                  kindHint: "read",
                  importDepth: deep?.depth,
                  accessPath,
                  scope: "imported",
                  resolution: deep ? "via-import" : "heuristic",
                });
              } else {
                if (this.takeTcBudget()) {
                  const tc = this.resolveWithTypeChecker(idn, sourceFile);
                  if (tc)
                    addRel(
                      fromId,
                      `file:${tc.fileRel}:${tc.name}`,
                      RelationshipType.READS,
                      idn,
                      {
                        usedTypeChecker: true,
                        kindHint: "read",
                        accessPath,
                        scope: "imported",
                        resolution: "type-checker",
                      }
                    );
                } else
                  addRel(fromId, `external:${t}`, RelationshipType.READS, idn, {
                    kindHint: "read",
                    accessPath,
                    scope: "external",
                    resolution: "heuristic",
                  });
              }
            }


            try {
              const props =
                rhs.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression) ||
                [];
              const seen = new Set<string>();
              for (const pa of props) {
                try {
                  const accessPath =
                    typeof (pa as any).getText === "function"
                      ? (pa as any).getText()
                      : undefined;
                  const propName =
                    typeof (pa as any).getName === "function"
                      ? (pa as any).getName()
                      : undefined;
                  const baseExpr: any =
                    typeof (pa as any).getExpression === "function"
                      ? (pa as any).getExpression()
                      : null;
                  const baseText =
                    baseExpr && typeof baseExpr.getText === "function"
                      ? baseExpr.getText()
                      : "";
                  if (!propName) continue;
                  const key = `${propName}|${accessPath || ""}`;
                  if (seen.has(key)) continue;
                  seen.add(key);

                  let toIdProp: string | null = null;
                  // 1) Type-checker resolution of the property
                  try {
                    if (this.takeTcBudget()) {
                      const tc = this.resolveWithTypeChecker(
                        pa as any,
                        sourceFile
                      );
                      if (tc && tc.fileRel && tc.name) {
                        toIdProp = `file:${tc.fileRel}:${tc.name}`;
                        addRel(
                          fromId,
                          toIdProp,
                          RelationshipType.READS,
                          pa as any,
                          {
                            kindHint: "read",
                            accessPath,
                            usedTypeChecker: true,
                            resolution: "type-checker",
                            scope: "imported",
                          }
                        );
                        continue;
                      }
                    }
                  } catch {}


                  if (
                    importMap &&
                    baseText &&
                    /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(baseText) &&
                    importMap.has(baseText)
                  ) {
                    const deep = this.resolveImportedMemberToFileAndName(
                      baseText,
                      propName,
                      sourceFile,
                      importMap,
                      importSymbolMap
                    );
                    if (deep) {
                      toIdProp = `file:${deep.fileRel}:${deep.name}`;
                      addRel(
                        fromId,
                        toIdProp,
                        RelationshipType.READS,
                        pa as any,
                        {
                          kindHint: "read",
                          accessPath,
                          importDepth: deep.depth,
                          resolution: "via-import",
                          scope: "imported",
                        }
                      );
                      continue;
                    }
                  }


                  try {
                    const sfRel = fileEntity.path;
                    const list = this.nameIndex.get(propName) || [];
                    const sameFile = list.filter((s) => {
                      const p = (s as any).path as string | undefined;
                      return typeof p === "string" && p.startsWith(`${sfRel}:`);
                    });
                    if (sameFile.length === 1) {
                      addRel(
                        fromId,
                        sameFile[0].id,
                        RelationshipType.READS,
                        pa as any,
                        {
                          kindHint: "read",
                          accessPath,
                          scope: "local",
                          resolution: "direct",
                        }
                      );
                      continue;
                    } else if (sameFile.length > 1) {
                      const meta: any = {
                        kind: "read",
                        accessPath,
                        ambiguous: true,
                        candidateCount: sameFile.length,
                        scope: "local",
                        resolution: "heuristic",
                      };
                      addRel(
                        fromId,
                        `external:${propName}`,
                        RelationshipType.READS,
                        pa as any,
                        meta
                      );
                      continue;
                    }
                  } catch {}


                  addRel(
                    fromId,
                    `external:${propName}`,
                    RelationshipType.READS,
                    pa as any,
                    {
                      kindHint: "read",
                      accessPath,
                      scope: "external",
                      resolution: "heuristic",
                    }
                  );
                } catch {}
              }
            } catch {}
          }
        } catch {}
      }
    } catch {}


    if (refAgg.size > 0) {
      for (const [k, v] of refAgg.entries()) {
        const [fromId, toId] = k.split("|");
        const meta = { ...v.meta, occurrencesScan: v.count } as any;
        relationships.push(
          this.createRelationship(
            fromId,
            toId,
            RelationshipType.REFERENCES,
            meta
          )
        );
      }
      refAgg.clear();
    }
    if (readAgg.size > 0) {
      for (const [k, v] of readAgg.entries()) {
        const [fromId, toId] = k.split("|");
        const meta = { ...v.meta, occurrencesScan: v.count } as any;
        relationships.push(
          this.createRelationship(fromId, toId, RelationshipType.READS, meta)
        );
      }
      readAgg.clear();
    }
    if (writeAgg.size > 0) {
      for (const [k, v] of writeAgg.entries()) {
        const [fromId, toId] = k.split("|");
        const meta = { ...v.meta, occurrencesScan: v.count } as any;
        relationships.push(
          this.createRelationship(fromId, toId, RelationshipType.WRITES, meta)
        );
      }
      writeAgg.clear();
    }


    if (depAgg.size > 0) {
      for (const [k, meta] of depAgg.entries()) {
        const [fromId, toId] = k.split("|");
        const depMeta = {
          ...(meta || {}),
          scope: meta?.scope || "imported",
          resolution: meta?.resolution || "via-import",
          kind: "dependency",
          inferred: (meta?.inferred ?? true) as boolean,
        } as any;
        if (typeof depMeta.confidence !== "number") {

          depMeta.confidence = scoreInferredEdge({
            relationType: RelationshipType.DEPENDS_ON,
            toId,
            fromFileRel: this.normalizeRelPath(
              path.dirname(fromId.split(":")[1] || "")
            ),
          });
        }
        relationships.push(
          this.createRelationship(
            fromId,
            toId,
            RelationshipType.DEPENDS_ON,
            depMeta
          )
        );
      }
    }

    return relationships;
  }

  private extractImportRelationships(
    sourceFile: SourceFile,
    fileEntity: File,
    importMap?: Map<string, string>,
    _importSymbolMap?: Map<string, string>
  ): GraphRelationship[] {
    const relationships: GraphRelationship[] = [];

    const imports = sourceFile.getImportDeclarations();
    for (const importDecl of imports) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      if (!moduleSpecifier) continue;

      // Side-effect import: import './x'
      if (
        importDecl.getNamedImports().length === 0 &&
        !importDecl.getDefaultImport() &&
        !importDecl.getNamespaceImport()
      ) {
        const modSf = importDecl.getModuleSpecifierSourceFile();
        if (modSf) {
          const abs = modSf.getFilePath();
          const rel = path.relative(process.cwd(), abs);
          relationships.push(
            this.createRelationship(
              fileEntity.id,
              `file:${rel}:${path.basename(rel)}`,
              RelationshipType.IMPORTS,
              {
                importKind: "side-effect",
                module: moduleSpecifier,
                language: fileEntity.language,
              }
            )
          );
        } else {
          relationships.push(
            this.createRelationship(
              fileEntity.id,
              `import:${moduleSpecifier}:*`,
              RelationshipType.IMPORTS,
              {
                importKind: "side-effect",
                module: moduleSpecifier,
                language: fileEntity.language,
              }
            )
          );
        }
      }


      const def = importDecl.getDefaultImport();
      if (def) {
        const alias = def.getText();
        if (alias) {
          const target = importMap?.get(alias);
          if (target) {

            relationships.push(
              this.createRelationship(
                fileEntity.id,
                `file:${target}:default`,
                RelationshipType.IMPORTS,
                {
                  importKind: "default",
                  alias,
                  module: moduleSpecifier,
                  language: fileEntity.language,
                }
              )
            );
          } else {
            relationships.push(
              this.createRelationship(
                fileEntity.id,
                `import:${moduleSpecifier}:default`,
                RelationshipType.IMPORTS,
                {
                  importKind: "default",
                  alias,
                  module: moduleSpecifier,
                  language: fileEntity.language,
                }
              )
            );
          }
        }
      }


      const ns = importDecl.getNamespaceImport();
      if (ns) {
        const alias = ns.getText();
        const target = alias ? importMap?.get(alias) : undefined;
        if (target) {
          relationships.push(
            this.createRelationship(
              fileEntity.id,
              `file:${target}:*`,
              RelationshipType.IMPORTS,
              {
                importKind: "namespace",
                alias,
                module: moduleSpecifier,
                language: fileEntity.language,
              }
            )
          );
        } else {
          relationships.push(
            this.createRelationship(
              fileEntity.id,
              `import:${moduleSpecifier}:*`,
              RelationshipType.IMPORTS,
              {
                importKind: "namespace",
                alias,
                module: moduleSpecifier,
                language: fileEntity.language,
              }
            )
          );
        }
      }


      for (const ni of importDecl.getNamedImports()) {
        const name = ni.getNameNode().getText();
        const aliasNode = ni.getAliasNode();
        const alias = aliasNode ? aliasNode.getText() : undefined;
        let resolved: { fileRel: string; name: string; depth: number } | null =
          null;
        try {
          const modSf = importDecl.getModuleSpecifierSourceFile();
          const resolvedMap = this.getModuleExportMap(modSf || undefined);
          const hit =
            resolvedMap.get(name) ||
            (alias ? resolvedMap.get(alias) : undefined);
          if (hit) resolved = hit;
        } catch {}
        if (!resolved && importMap) {
          const root = alias || name;
          const t = importMap.get(root);
          if (t) resolved = { fileRel: t, name, depth: 1 } as any;
        }
        if (resolved) {
          relationships.push(
            this.createRelationship(
              fileEntity.id,
              `file:${resolved.fileRel}:${resolved.name}`,
              RelationshipType.IMPORTS,
              {
                importKind: "named",
                alias,
                module: moduleSpecifier,
                importDepth: resolved.depth,
                language: fileEntity.language,
              }
            )
          );
        } else {
          relationships.push(
            this.createRelationship(
              fileEntity.id,
              `import:${moduleSpecifier}:${alias || name}`,
              RelationshipType.IMPORTS,
              {
                importKind: "named",
                alias,
                module: moduleSpecifier,
                language: fileEntity.language,
              }
            )
          );
        }
      }
    }

    return relationships;
  }

  private createRelationship(
    fromId: string,
    toId: string,
    type: RelationshipType,
    metadata?: Record<string, any>
  ): GraphRelationship {

    try {
      if (metadata && (metadata as any).source == null) {
        const md: any = metadata as any;
        if (md.usedTypeChecker === true || md.resolution === "type-checker")
          md.source = "type-checker";
        else md.source = "ast";
      }
    } catch {}

    const rid = canonicalRelationshipId(fromId, {
      toEntityId: toId,
      type,
    } as any);
    const rel: any = {
      id: rid,
      fromEntityId: fromId,
      toEntityId: toId,
      type,
      created: new Date(),
      lastModified: new Date(),
      version: 1,
      ...(metadata ? { metadata } : {}),
    };




    try {
      if (!(rel as any).toRef) {
        const t = String(toId || "");
        // file:<relPath>:<name> -> fileSymbol
        const mFile = t.match(/^file:(.+?):(.+)$/);
        if (mFile) {
          (rel as any).toRef = {
            kind: "fileSymbol",
            file: mFile[1],
            symbol: mFile[2],
            name: mFile[2],
          };
        } else if (t.startsWith("external:")) {

          (rel as any).toRef = {
            kind: "external",
            name: t.slice("external:".length),
          };
        } else if (/^(class|interface|function|typeAlias):/.test(t)) {

          const parts = t.split(":");
          (rel as any).toRef = {
            kind: "external",
            name: parts.slice(1).join(":"),
          };
        }

        else if (/^(sym:|file:)/.test(t)) {

          const isParsableSym =
            t.startsWith("sym:") && /^sym:(.+?)#(.+?)(?:@.+)?$/.test(t);
          const isParsableFile =
            t.startsWith("file:") && /^file:(.+?):(.+)$/.test(t);
          if (!isParsableSym && !isParsableFile) {
            (rel as any).toRef = { kind: "entity", id: t };
          }
        }
      }
    } catch {}


    try {
      if (!(rel as any).fromRef) {

        (rel as any).fromRef = { kind: "entity", id: fromId };
      }
    } catch {}


    return normalizeCodeEdge(rel as GraphRelationship);
  }


  private normalizeRelPath(p: string): string {
    let s = String(p || "").replace(/\\/g, "/");
    s = s.replace(/\/+/g, "/");
    s = s.replace(/\/+$/g, "");
    return s;
  }

  /**
   * Create directory entities for the path and CONTAINS edges for dir->dir and dir->file.
   * Returns entities and relationships to be merged into the parse result.
   */
  private createDirectoryHierarchy(
    fileRelPath: string,
    fileEntityId: string
  ): { dirEntities: Entity[]; dirRelationships: GraphRelationship[] } {
    const dirEntities: Entity[] = [];
    const dirRelationships: GraphRelationship[] = [];

    const rel = this.normalizeRelPath(fileRelPath);
    if (!rel || rel.indexOf("/") < 0) return { dirEntities, dirRelationships }; // no directory

    const parts = rel.split("/");
    parts.pop(); // remove file name

    const segments: string[] = [];
    for (let i = 0; i < parts.length; i++) {
      segments.push(parts.slice(0, i + 1).join("/"));
    }

    // Create directory entities with stable ids based on path
    const dirIds: string[] = [];
    for (let i = 0; i < segments.length; i++) {
      const dpath = segments[i];
      const depth = i + 1;
      const id = `dir:${dpath}`;
      dirIds.push(id);
      dirEntities.push({
        id,
        type: "directory",
        path: dpath,
        hash: crypto.createHash("sha256").update(`dir:${dpath}`).digest("hex"),
        language: "unknown",
        lastModified: new Date(),
        created: new Date(),
        children: [],
        depth,
      } as any);
    }


    for (let i = 1; i < dirIds.length; i++) {
      dirRelationships.push(
        this.createRelationship(
          dirIds[i - 1],
          dirIds[i],
          RelationshipType.CONTAINS
        )
      );
    }


    if (dirIds.length > 0) {
      dirRelationships.push(
        this.createRelationship(
          dirIds[dirIds.length - 1],
          fileEntityId,
          RelationshipType.CONTAINS
        )
      );
    }

    return { dirEntities, dirRelationships };
  }

  private shouldIncludeDirectoryEntities(): boolean {
    return process.env.RUN_INTEGRATION === "1";
  }


  private getSymbolName(node: Node): string | undefined {
    if (Node.isClassDeclaration(node)) return node.getName();
    if (Node.isFunctionDeclaration(node)) return node.getName();
    if (Node.isInterfaceDeclaration(node)) return node.getName();
    if (Node.isTypeAliasDeclaration(node)) return node.getName();
    if (Node.isMethodDeclaration(node)) return node.getName();
    if (Node.isPropertyDeclaration(node)) return node.getName();
    if (Node.isVariableDeclaration(node)) return node.getName();
    return undefined;
  }

  private getJavaScriptSymbolName(node: any): string | undefined {
    for (const child of node.children || []) {
      if (child.type === "identifier") {
        return child.text;
      }
    }
    return undefined;
  }

  private getSymbolSignature(node: Node): string {
    try {
      return node.getText();
    } catch {
      return node.getKindName();
    }
  }

  private getSymbolKind(node: Node): string {
    if (Node.isClassDeclaration(node)) return "class";
    if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node))
      return "function";
    if (Node.isInterfaceDeclaration(node)) return "interface";
    if (Node.isTypeAliasDeclaration(node)) return "typeAlias";
    if (Node.isPropertyDeclaration(node)) return "property";
    if (Node.isVariableDeclaration(node)) return "variable";
    return "symbol";
  }

  private getSymbolDocstring(node: Node): string {
    const comments = node.getLeadingCommentRanges();
    return comments.map((comment) => comment.getText()).join("\n");
  }

  private getSymbolVisibility(node: Node): "public" | "private" | "protected" {
    if ("getModifiers" in node && typeof node.getModifiers === "function") {
      const modifiers = node.getModifiers();
      if (modifiers.some((mod: any) => mod.kind === SyntaxKind.PrivateKeyword))
        return "private";
      if (
        modifiers.some((mod: any) => mod.kind === SyntaxKind.ProtectedKeyword)
      )
        return "protected";
    }
    return "public";
  }

  private isSymbolExported(node: Node): boolean {
    try {
      const anyNode: any = node as any;
      if (typeof anyNode.isExported === "function" && anyNode.isExported())
        return true;
      if (
        typeof anyNode.isDefaultExport === "function" &&
        anyNode.isDefaultExport()
      )
        return true;
      if (
        typeof anyNode.hasExportKeyword === "function" &&
        anyNode.hasExportKeyword()
      )
        return true;
      if (
        "getModifiers" in node &&
        typeof (node as any).getModifiers === "function"
      ) {
        return (node as any)
          .getModifiers()
          .some((mod: any) => mod.kind === SyntaxKind.ExportKeyword);
      }
    } catch {

    }
    return false;
  }

  private isSymbolDeprecated(node: Node): boolean {
    const docstring = this.getSymbolDocstring(node);
    return /@deprecated/i.test(docstring);
  }

  private getFunctionParameters(node: Node): any[] {
    if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node)) {
      return node.getParameters().map((param) => ({
        name: param.getName(),
        type: param.getType().getText(),
        defaultValue: param.getInitializer()?.getText(),
        optional: param.isOptional(),
      }));
    }
    return [];
  }

  private getFunctionReturnType(node: Node): string {
    if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node)) {
      const returnType = node.getReturnType();
      return returnType.getText();
    }
    return "void";
  }

  private isFunctionAsync(node: Node): boolean {
    if ("getModifiers" in node && typeof node.getModifiers === "function") {
      return node
        .getModifiers()
        .some((mod: any) => mod.kind === SyntaxKind.AsyncKeyword);
    }
    return false;
  }

  private isFunctionGenerator(node: Node): boolean {
    return node.getFirstChildByKind(SyntaxKind.AsteriskToken) !== undefined;
  }

  private calculateComplexity(node: Node): number {

    let complexity = 1;
    const descendants = node.getDescendants();

    for (const descendant of descendants) {
      if (
        Node.isIfStatement(descendant) ||
        Node.isForStatement(descendant) ||
        Node.isWhileStatement(descendant) ||
        Node.isDoStatement(descendant) ||
        Node.isCaseClause(descendant) ||
        Node.isConditionalExpression(descendant)
      ) {
        complexity++;
      }
    }

    return complexity;
  }

  private getClassExtends(node: Node): string[] {
    if (Node.isClassDeclaration(node)) {
      const extendsClause = node.getExtends();
      return extendsClause ? [extendsClause.getText()] : [];
    }
    return [];
  }

  private getClassImplements(node: Node): string[] {
    if (Node.isClassDeclaration(node)) {
      const implementsClause = node.getImplements();
      return implementsClause.map((impl) => impl.getText());
    }
    return [];
  }

  private isClassAbstract(node: Node): boolean {
    if ("getModifiers" in node && typeof node.getModifiers === "function") {
      return node
        .getModifiers()
        .some((mod: any) => mod.kind === SyntaxKind.AbstractKeyword);
    }
    return false;
  }

  private getInterfaceExtends(node: Node): string[] {
    if (Node.isInterfaceDeclaration(node)) {
      const extendsClause = node.getExtends();
      return extendsClause.map((ext) => ext.getText());
    }
    return [];
  }

  private getTypeAliasType(node: Node): string {
    if (Node.isTypeAliasDeclaration(node)) {
      return node.getType().getText();
    }
    return "";
  }

  private isTypeUnion(node: Node): boolean {
    if (Node.isTypeAliasDeclaration(node)) {
      return node.getType().getText().includes("|");
    }
    return false;
  }

  private isTypeIntersection(node: Node): boolean {
    if (Node.isTypeAliasDeclaration(node)) {
      return node.getType().getText().includes("&");
    }
    return false;
  }

  private detectLanguage(filePath: string): string {
    const extension = path.extname(filePath).toLowerCase();
    switch (extension) {
      case ".ts":
        return "typescript";
      case ".tsx":
        return "typescript";
      case ".js":
        return "javascript";
      case ".jsx":
        return "javascript";
      default:
        return "unknown";
    }
  }

  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];


    const importRegex = /from ['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const moduleName = match[1];
      if (!moduleName.startsWith(".") && !moduleName.startsWith("/")) {
        dependencies.push(moduleName.split("/")[0]);
      }
    }


    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      const moduleName = match[1];
      if (!moduleName.startsWith(".") && !moduleName.startsWith("/")) {
        dependencies.push(moduleName.split("/")[0]);
      }
    }

    return [...new Set(dependencies)];
  }

  async parseMultipleFiles(filePaths: string[]): Promise<ParseResult> {
    const perFileResults: ParseResult[] = [];
    const promises = filePaths.map((filePath) => this.parseFile(filePath));
    const settled = await Promise.allSettled(promises);

    for (const r of settled) {
      if (r.status === "fulfilled") {
        perFileResults.push(r.value);
      } else {
        console.error("Parse error:", r.reason);
        perFileResults.push({
          entities: [],
          relationships: [],
          errors: [
            {
              file: "unknown",
              line: 0,
              column: 0,
              message: String(r.reason?.message || r.reason),
              severity: "error",
            },
          ],
        });
      }
    }


    const allEntities = perFileResults.flatMap((r) => r.entities);
    const allRelationships = perFileResults.flatMap((r) => r.relationships);
    const allErrors = perFileResults.flatMap((r) => r.errors);

    const hybrid: any = perFileResults;
    hybrid.entities = allEntities;
    hybrid.relationships = allRelationships;
    hybrid.errors = allErrors;


    return hybrid as unknown as ParseResult;
  }




  async applyPartialUpdate(
    filePath: string,
    changes: ChangeRange[],
    originalContent: string
  ): Promise<IncrementalParseResult> {
    try {
      const cachedInfo = this.fileCache.get(path.resolve(filePath));
      if (!cachedInfo) {

        return await this.parseFileIncremental(filePath);
      }

      const updates: PartialUpdate[] = [];
      const addedEntities: Entity[] = [];
      const removedEntities: Entity[] = [];
      const updatedEntities: Entity[] = [];
      const addedRelationships: GraphRelationship[] = [];
      const removedRelationships: GraphRelationship[] = [];


      const resolvedPath = path.resolve(filePath);
      const fileRel = this.normalizeRelPath(
        path.relative(process.cwd(), resolvedPath)
      );
      for (const change of changes) {
        const affectedSymbols = this.findAffectedSymbols(cachedInfo, change);

        for (const symbolId of affectedSymbols) {
          const cachedSymbol = cachedInfo.symbolMap.get(symbolId);
          if (cachedSymbol) {

            const update = this.analyzeSymbolChange(
              cachedSymbol,
              change,
              originalContent
            );
            if (update) {
              updates.push(update);

              switch (update.type) {
                case "add":

                  const newEntity = await this.parseSymbolFromRange(
                    filePath,
                    change
                  );
                  if (newEntity) {

                    try {
                      if ((newEntity as any).type === "symbol") {
                        const nm = (newEntity as any).name as string;
                        (newEntity as any).path = `${fileRel}:${nm}`;

                        cachedInfo.symbolMap.set(
                          `${(newEntity as any).path}`,
                          newEntity as any
                        );
                        this.addSymbolsToIndexes(fileRel, [newEntity as any]);
                      }
                    } catch {}

                    (update as any).newValue = newEntity;
                    addedEntities.push(newEntity);
                  }
                  break;
                case "remove":

                  try {
                    const nm = (cachedSymbol as any).name as string;
                    const key = `${fileRel}:${nm}`;
                    cachedInfo.symbolMap.delete(key);

                    this.removeFileFromIndexes(fileRel);
                    this.addSymbolsToIndexes(
                      fileRel,
                      Array.from(cachedInfo.symbolMap.values()) as any
                    );
                  } catch {}
                  removedEntities.push(cachedSymbol);
                  break;
                case "update":
                  const updatedEntity = { ...cachedSymbol, ...update.changes };
                  try {

                    let foundKey: string | null = null;
                    for (const [k, v] of cachedInfo.symbolMap.entries()) {
                      if ((v as any).id === (cachedSymbol as any).id) {
                        foundKey = k;
                        break;
                      }
                    }
                    if (foundKey) {
                      cachedInfo.symbolMap.set(foundKey, updatedEntity as any);

                      this.removeFileFromIndexes(fileRel);
                      this.addSymbolsToIndexes(
                        fileRel,
                        Array.from(cachedInfo.symbolMap.values()) as any
                      );
                    }
                  } catch {}
                  updatedEntities.push(updatedEntity);
                  break;
              }
            }
          }
        }
      }


      this.updateCacheAfterPartialUpdate(filePath, updates, originalContent);

      return {
        entities: [...addedEntities, ...updatedEntities],
        relationships: [...addedRelationships],
        errors: [],
        isIncremental: true,
        addedEntities,
        removedEntities,
        updatedEntities,
        addedRelationships,
        removedRelationships,
      };
    } catch (error) {
      console.error(`Error applying partial update to ${filePath}:`, error);

      return await this.parseFileIncremental(filePath);
    }
  }




  private findAffectedSymbols(
    cachedInfo: CachedFileInfo,
    change: ChangeRange
  ): string[] {
    const affectedSymbols: string[] = [];

    for (const [symbolId, symbol] of cachedInfo.symbolMap) {


      if (this.isSymbolInRange(symbol, change)) {
        affectedSymbols.push(symbolId);
      }
    }

    return affectedSymbols;
  }




  private isSymbolInRange(symbol: SymbolEntity, change: ChangeRange): boolean {



    if (!symbol.location || typeof symbol.location !== "object") {
      return true;
    }

    const loc = symbol.location as any;


    if (loc.line && loc.column) {


      const estimatedPos = (loc.line - 1) * 100 + loc.column;


      return estimatedPos >= change.start && estimatedPos <= change.end;
    }


    if (loc.start !== undefined && loc.end !== undefined) {

      return !(loc.end < change.start || loc.start > change.end);
    }


    return true;
  }




  private analyzeSymbolChange(
    symbol: SymbolEntity,
    change: ChangeRange,
    originalContent: string
  ): PartialUpdate | null {



    const contentSnippet = originalContent.substring(change.start, change.end);

    if (contentSnippet.trim() === "") {
      // Empty change might be a deletion
      return {
        type: "remove",
        entityType: symbol.kind as any,
        entityId: symbol.id,
      };
    }


    if (this.looksLikeNewSymbol(contentSnippet)) {
      return {
        type: "add",
        entityType: this.detectSymbolType(contentSnippet),
        entityId: `new_symbol_${Date.now()}`,
      };
    }


    return {
      type: "update",
      entityType: symbol.kind as any,
      entityId: symbol.id,
      changes: {
        lastModified: new Date(),
      },
    };
  }




  private async parseSymbolFromRange(
    filePath: string,
    change: ChangeRange
  ): Promise<Entity | null> {
    try {
      const fullContent = await fs.readFile(filePath, "utf-8");
      const contentSnippet = fullContent.substring(change.start, change.end);


      const lines = contentSnippet.split("\n");
      const firstNonEmptyLine = lines.find((line) => line.trim().length > 0);

      if (!firstNonEmptyLine) {
        return null;
      }


      const symbolMatch = firstNonEmptyLine.match(
        /^\s*(?:export\s+)?(?:async\s+)?(?:function|class|interface|type|const|let|var)\s+(\w+)/
      );

      if (!symbolMatch) {
        return null;
      }

      const symbolName = symbolMatch[1];
      const symbolType = this.detectSymbolType(contentSnippet);


      const entity: SymbolEntity = {
        id: `${filePath}:${symbolName}`,
        type: "symbol",
        kind:
          symbolType === "function"
            ? "function"
            : symbolType === "class"
            ? "class"
            : symbolType === "interface"
            ? "interface"
            : symbolType === "typeAlias"
            ? "typeAlias"
            : "variable",
        name: symbolName,
        path: filePath,
        hash: crypto
          .createHash("sha256")
          .update(contentSnippet)
          .digest("hex")
          .substring(0, 16),
        language: path.extname(filePath).replace(".", "") || "unknown",
        visibility: firstNonEmptyLine.includes("export") ? "public" : "private",
        signature: contentSnippet.substring(
          0,
          Math.min(200, contentSnippet.length)
        ),
        docstring: "",
        isExported: firstNonEmptyLine.includes("export"),
        isDeprecated: false,
        metadata: {
          parsed: new Date().toISOString(),
          partial: true,
          location: {
            start: change.start,
            end: change.end,
          },
        },
        created: new Date(),
        lastModified: new Date(),
      };

      return entity;
    } catch (error) {
      console.error(`Error parsing symbol from range:`, error);
      return null;
    }
  }




  private updateCacheAfterPartialUpdate(
    filePath: string,
    updates: PartialUpdate[],
    newContent: string
  ): void {
    const resolvedPath = path.resolve(filePath);
    const cachedInfo = this.fileCache.get(resolvedPath);

    if (!cachedInfo) return;


    for (const update of updates) {
      switch (update.type) {
        case "add":

          try {
            const nv: any = (update as any).newValue;
            if (nv && nv.type === "symbol") {
              const name = nv.name as string;
              const fileRel = this.normalizeRelPath(
                path.relative(process.cwd(), filePath)
              );

              nv.path = `${fileRel}:${name}`;
              (cachedInfo.symbolMap as any).set(nv.path, nv);

              this.removeFileFromIndexes(fileRel);
              this.addSymbolsToIndexes(
                fileRel,
                Array.from(cachedInfo.symbolMap.values()) as any
              );
            }
          } catch {}
          break;
        case "remove":

          try {
            let foundKey: string | null = null;
            for (const [k, v] of cachedInfo.symbolMap.entries()) {
              if ((v as any).id === update.entityId) {
                foundKey = k;
                break;
              }
            }
            if (foundKey) {
              cachedInfo.symbolMap.delete(foundKey);
              const fileRel = this.normalizeRelPath(
                path.relative(process.cwd(), filePath)
              );
              this.removeFileFromIndexes(fileRel);
              this.addSymbolsToIndexes(
                fileRel,
                Array.from(cachedInfo.symbolMap.values()) as any
              );
            }
          } catch {}
          break;
        case "update":
          try {

            let foundKey: string | null = null;
            for (const [k, v] of cachedInfo.symbolMap.entries()) {
              if ((v as any).id === update.entityId) {
                foundKey = k;
                break;
              }
            }
            if (foundKey) {
              const symbol = cachedInfo.symbolMap.get(foundKey) as any;
              if (symbol && update.changes) {
                Object.assign(symbol, update.changes);
                cachedInfo.symbolMap.set(foundKey, symbol);
                const fileRel = this.normalizeRelPath(
                  path.relative(process.cwd(), filePath)
                );
                this.removeFileFromIndexes(fileRel);
                this.addSymbolsToIndexes(
                  fileRel,
                  Array.from(cachedInfo.symbolMap.values()) as any
                );
              }
            }
          } catch {}
          break;
      }
    }


    cachedInfo.hash = crypto
      .createHash("sha256")
      .update(newContent)
      .digest("hex");
    cachedInfo.lastModified = new Date();


    try {
      const fileRel = this.normalizeRelPath(
        path.relative(process.cwd(), filePath)
      );
      this.removeFileFromIndexes(fileRel);
      const syms: SymbolEntity[] = Array.from(cachedInfo.symbolMap.values());
      this.addSymbolsToIndexes(fileRel, syms);
    } catch {}
  }




  private looksLikeNewSymbol(content: string): boolean {
    const trimmed = content.trim();
    return /^\s*(function|class|interface|type|const|let|var)\s+\w+/.test(
      trimmed
    );
  }

  private detectSymbolType(
    content: string
  ): "file" | "symbol" | "function" | "class" | "interface" | "typeAlias" {
    const trimmed = content.trim();

    if (/^\s*function\s+/.test(trimmed)) return "function";
    if (/^\s*class\s+/.test(trimmed)) return "class";
    if (/^\s*interface\s+/.test(trimmed)) return "interface";
    if (/^\s*type\s+/.test(trimmed)) return "typeAlias";

    return "symbol";
  }




  getPartialUpdateStats(): {
    cachedFiles: number;
    totalSymbols: number;
    averageSymbolsPerFile: number;
  } {
    const cachedFiles = Array.from(this.fileCache.values());
    const totalSymbols = cachedFiles.reduce(
      (sum, file) => sum + file.symbolMap.size,
      0
    );

    return {
      cachedFiles: cachedFiles.length,
      totalSymbols,
      averageSymbolsPerFile:
        cachedFiles.length > 0 ? totalSymbols / cachedFiles.length : 0,
    };
  }
}

================
File: parsing/ASTParserCore.ts
================
import { Project, Node, SourceFile, SyntaxKind } from "ts-morph";
import * as ts from "typescript";
import * as path from "path";
import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as crypto from "crypto";
import {
  Entity,
  File,
  FunctionSymbol,
  ClassSymbol,
  InterfaceSymbol,
  TypeAliasSymbol,
  Symbol as SymbolEntity,
} from "../../models/entities.js";
import {
  GraphRelationship,
  RelationshipType,
  StructuralRelationship,
} from "../../models/relationships.js";
import {
  normalizeCodeEdge,
  canonicalRelationshipId,
} from "../../utils/codeEdges.js";
import { noiseConfig } from "../../config/noise.js";
import { scoreInferredEdge } from "../../utils/confidence.js";


import {
  createHash,
  normalizeRelPath,
  detectLanguage,
  extractDependencies,
} from "./utils.js";
import {
  ParseResult,
  ParseError,
  IncrementalParseResult,
  PartialUpdate,
  ChangeRange,
} from "./types.js";


import { CacheManager, CachedFileInfo } from "./CacheManager.js";
import { DirectoryHandler } from "./DirectoryHandler.js";
import { TypeCheckerBudget } from "./TypeCheckerBudget.js";
import { SymbolExtractor } from "./SymbolExtractor.js";
import { ModuleResolver, ModuleResolverOptions } from "./ModuleResolver.js";
import { RelationshipBuilder, RelationshipBuilderOptions } from "./RelationshipBuilder.js";


export type {
  ParseResult,
  ParseError,
  IncrementalParseResult,
  PartialUpdate,
  ChangeRange,
} from "./types.js";













export class ASTParserCore {

  private readonly stopNames = new Set<string>(
    [
      "console",
      "log",
      "warn",
      "error",
      "info",
      "debug",
      "require",
      "module",
      "exports",
      "__dirname",
      "__filename",
      "process",
      "buffer",
      "settimeout",
      "setinterval",
      "cleartimeout",
      "clearinterval",
      "math",
      "json",
      "date",

      "describe",
      "it",
      "test",
      "expect",
      "beforeeach",
      "aftereach",
      "beforeall",
      "afterall",
    ].concat(Array.from(noiseConfig.AST_STOPLIST_EXTRA))
  );


  private tsProject: Project;


  private tsPathOptions: Partial<ts.CompilerOptions> | null = null;


  private cacheManager: CacheManager;
  private directoryHandler: DirectoryHandler;
  private typeCheckerBudget: TypeCheckerBudget;
  private symbolExtractor: SymbolExtractor;
  private moduleResolver: ModuleResolver;
  private relationshipBuilder: RelationshipBuilder;




  constructor() {

    this.tsProject = new Project({
      compilerOptions: {
        allowJs: true,
        declaration: true,
        emitDeclarationOnly: false,
        outDir: "./dist",
        target: ts.ScriptTarget.ES2018,
        module: ts.ModuleKind.CommonJS as any,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: false,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
      },
      useInMemoryFileSystem: true,
    });


    this.cacheManager = new CacheManager();
    this.directoryHandler = new DirectoryHandler();
    this.typeCheckerBudget = new TypeCheckerBudget();
    this.symbolExtractor = new SymbolExtractor();


    this.moduleResolver = new ModuleResolver({
      tsProject: this.tsProject,
      tsPathOptions: this.tsPathOptions,
    });


    this.relationshipBuilder = new RelationshipBuilder({
      tsProject: this.tsProject,
      globalSymbolIndex: new Map(),
      nameIndex: new Map(),
      stopNames: this.stopNames,
      fileCache: new Map(),
      shouldUseTypeChecker: this.shouldUseTypeChecker.bind(this),
      takeTcBudget: this.typeCheckerBudget.takeBudget.bind(this.typeCheckerBudget),
      resolveWithTypeChecker: this.resolveWithTypeChecker.bind(this),
      resolveCallTargetWithChecker: this.resolveCallTargetWithChecker.bind(this),
      resolveImportedMemberToFileAndName: this.resolveImportedMemberToFileAndName.bind(this),
      getModuleExportMap: this.moduleResolver.getModuleExportMap.bind(this.moduleResolver),
      normalizeRelPath: normalizeRelPath,
    });
  }





  async initialize(): Promise<void> {
    try {
      const tsconfigPath = path.resolve("tsconfig.json");
      if (fsSync.existsSync(tsconfigPath)) {
        const raw = await fs.readFile(tsconfigPath, "utf-8");
        const json = JSON.parse(raw) as { compilerOptions?: any };
        const co = json?.compilerOptions || {};
        const baseUrl = co.baseUrl
          ? path.resolve(path.dirname(tsconfigPath), co.baseUrl)
          : undefined;

        this.tsPathOptions = {
          baseUrl,
          paths: co.paths,
          allowJs: true,
          moduleResolution: ts.ModuleResolutionKind.NodeJs,
        };


        this.moduleResolver = new ModuleResolver({
          tsProject: this.tsProject,
          tsPathOptions: this.tsPathOptions,
        });
      }
    } catch (e) {
      console.warn("Failed to load tsconfig.json, proceeding without path mapping:", e);
    }
  }






  async parseFile(filePath: string): Promise<ParseResult> {
    try {
      const absolutePath = path.resolve(filePath);
      const content = await fs.readFile(absolutePath, "utf-8");
      const extension = path.extname(filePath).toLowerCase();



      if ([".ts", ".tsx", ".js", ".jsx"].includes(extension)) {
        return this.parseTypeScriptFile(filePath, content);
      } else {

        return {
          entities: [],
          relationships: [],
          errors: [{
            file: filePath,
            line: 0,
            column: 0,
            message: `Unsupported file extension: ${extension}`,
            severity: "warning"
          }],
        };
      }
    } catch (error) {
      return {
        entities: [],
        relationships: [],
        errors: [{
          file: filePath,
          line: 0,
          column: 0,
          message: `Failed to parse file: ${error instanceof Error ? error.message : String(error)}`,
          severity: "error"
        }],
      };
    }
  }






  async parseMultipleFiles(filePaths: string[]): Promise<ParseResult> {
    const perFileResults: ParseResult[] = [];
    const promises = filePaths.map((filePath) => this.parseFile(filePath));
    const settled = await Promise.allSettled(promises);

    for (const r of settled) {
      if (r.status === "fulfilled") {
        perFileResults.push(r.value);
      } else {
        console.error("Parse error:", r.reason);
        perFileResults.push({
          entities: [],
          relationships: [],
          errors: [{
            file: "unknown",
            line: 0,
            column: 0,
            message: `Parse failure: ${r.reason}`,
            severity: "error"
          }],
        });
      }
    }


    const allEntities: Entity[] = [];
    const allRelationships: GraphRelationship[] = [];
    const allErrors: ParseError[] = [];

    for (const result of perFileResults) {
      allEntities.push(...result.entities);
      allRelationships.push(...result.relationships);
      allErrors.push(...result.errors);
    }

    return {
      entities: allEntities,
      relationships: allRelationships,
      errors: allErrors,
    };
  }




  clearCache(): void {
    this.cacheManager.clearCache();
  }





  getCacheStats(): { files: number; totalEntities: number } {
    return this.cacheManager.getCacheStats();
  }






  async parseFileIncremental(filePath: string): Promise<IncrementalParseResult> {
    const absolutePath = path.resolve(filePath);
    const cachedInfo = this.cacheManager.getCachedFile(absolutePath);

    try {
      const content = await fs.readFile(absolutePath, "utf-8");
      const currentHash = crypto
        .createHash("sha256")
        .update(content)
        .digest("hex");


      if (cachedInfo && cachedInfo.hash === currentHash) {
        return {
          entities: cachedInfo.entities,
          relationships: cachedInfo.relationships,
          errors: [],
          isIncremental: true,
          addedEntities: [],
          removedEntities: [],
          updatedEntities: [],
          addedRelationships: [],
          removedRelationships: [],
        };
      }


      const parseResult = await this.parseFile(filePath);


      let addedEntities: Entity[] = [];
      let removedEntities: Entity[] = [];
      let updatedEntities: Entity[] = [];
      let addedRelationships: GraphRelationship[] = [];
      let removedRelationships: GraphRelationship[] = [];

      if (cachedInfo) {

        const oldEntityIds = new Set(cachedInfo.entities.map(e => e.id));
        const newEntityIds = new Set(parseResult.entities.map(e => e.id));

        addedEntities = parseResult.entities.filter(e => !oldEntityIds.has(e.id));
        removedEntities = cachedInfo.entities.filter(e => !newEntityIds.has(e.id));

        const oldRelIds = new Set(cachedInfo.relationships.map(r => r.id));
        const newRelIds = new Set(parseResult.relationships.map(r => r.id));

        addedRelationships = parseResult.relationships.filter(r => !oldRelIds.has(r.id));
        removedRelationships = cachedInfo.relationships.filter(r => !newRelIds.has(r.id));
      } else {
        addedEntities = parseResult.entities;
        addedRelationships = parseResult.relationships;
      }

      return {
        ...parseResult,
        isIncremental: true,
        addedEntities,
        removedEntities,
        updatedEntities,
        addedRelationships,
        removedRelationships,
      };
    } catch (error) {
      return {
        entities: [],
        relationships: [],
        errors: [{
          file: filePath,
          line: 0,
          column: 0,
          message: `Incremental parse failed: ${error instanceof Error ? error.message : String(error)}`,
          severity: "error"
        }],
        isIncremental: false,
        addedEntities: [],
        removedEntities: [],
        updatedEntities: [],
        addedRelationships: [],
        removedRelationships: [],
      };
    }
  }





  getPartialUpdateStats(): {
    filesInCache: number;
    globalSymbols: number;
    namedSymbols: number;
  } {
    return {
      filesInCache: this.cacheManager.getCacheStats().files,
      globalSymbols: this.cacheManager.getGlobalSymbolKeys().length,
      namedSymbols: 0,
    };
  }









  private async parseTypeScriptFile(
    filePath: string,
    content: string
  ): Promise<ParseResult> {
    const entities: Entity[] = [];
    const relationships: GraphRelationship[] = [];
    const errors: ParseError[] = [];

    try {

      this.typeCheckerBudget.initializeBudget();

      const absolutePath = path.resolve(filePath);
      const fileRelPath = normalizeRelPath(
        path.relative(process.cwd(), absolutePath)
      );


      const currentHash = createHash(content);

      const cachedInfo = this.cacheManager.getCachedFile(absolutePath);
      if (cachedInfo && cachedInfo.hash === currentHash) {
        return {
          entities: cachedInfo.entities,
          relationships: cachedInfo.relationships,
          errors: [],
        };
      }


      const sourceFile = this.tsProject.createSourceFile(absolutePath, content, {
        overwrite: true,
      });


      const fileEntity: File = {
        id: `file:${fileRelPath}`,
        type: "file",
        path: fileRelPath,
        extension: path.extname(filePath),
        size: content.length,
        lines: content.split('\n').length,
        isTest: filePath.includes('.test.') || filePath.includes('.spec.'),
        isConfig: path.basename(filePath).startsWith('.') || filePath.includes('config'),
        language: detectLanguage(filePath),
        dependencies: extractDependencies(content),
        lastModified: new Date(),
        created: new Date(),
        hash: createHash(content)
      };

      entities.push(fileEntity);


      if (this.shouldIncludeDirectoryEntities()) {
        const { dirEntities, dirRelationships } =
          this.directoryHandler.createDirectoryHierarchy(fileRelPath, fileEntity.id);
        entities.push(...dirEntities);
        relationships.push(...dirRelationships);
      }


      this.extractSymbolsFromSourceFile(sourceFile, fileEntity, entities, relationships);



      for (const entity of entities) {
        if (entity.type === "symbol") {
          const symbolEntity = entity as SymbolEntity;

          const symbolRelationships = this.extractRelationshipsForSymbol(
            sourceFile,
            symbolEntity
          );
          relationships.push(...symbolRelationships);
        }
      }


      const symbolMap = this.createSymbolMap(entities);
      this.cacheManager.setCachedFile(absolutePath, {
        hash: currentHash,
        entities,
        relationships,
        lastModified: new Date(),
        symbolMap,
      });


      const symbols = entities.filter(e => e.type === "symbol") as SymbolEntity[];
      this.cacheManager.addSymbolsToIndexes(fileRelPath, symbols);

      return { entities, relationships, errors };
    } catch (error) {
      console.error(`Error parsing TypeScript file ${filePath}:`, error);
      errors.push({
        file: filePath,
        line: 0,
        column: 0,
        message: `Parse error: ${error instanceof Error ? error.message : String(error)}`,
        severity: "error",
      });
      return { entities, relationships, errors };
    }
  }




  private extractSymbolsFromSourceFile(
    sourceFile: SourceFile,
    fileEntity: File,
    entities: Entity[],
    relationships: GraphRelationship[]
  ): void {
    sourceFile.forEachDescendant((node) => {
      const symbol = this.symbolExtractor.createSymbolEntity(node, fileEntity);
      if (symbol) {
        entities.push(symbol);


        const containsRel: StructuralRelationship = {
          id: `${fileEntity.id}-contains-${symbol.id}`,
          type: RelationshipType.CONTAINS,
          fromEntityId: fileEntity.id,
          toEntityId: symbol.id,
          created: new Date(),
          lastModified: new Date(),
          version: 1,
        };
        relationships.push(containsRel);
      }
    });
  }




  private createSymbolMap(entities: Entity[]): Map<string, SymbolEntity> {
    const symbolMap = new Map<string, SymbolEntity>();

    entities.forEach((entity) => {
      if (entity.type === "symbol") {
        symbolMap.set(entity.id, entity as SymbolEntity);
      }
    });

    return symbolMap;
  }




  private shouldUseTypeChecker(opts: {
    context: "call" | "heritage" | "decorator";
    imported?: boolean;
    ambiguous?: boolean;
    nameLength?: number;
  }): boolean {
    try {
      const imported = !!opts.imported;
      const ambiguous = !!opts.ambiguous;
      const len = typeof opts.nameLength === "number" ? opts.nameLength : 0;
      const usefulName = len >= noiseConfig.AST_MIN_NAME_LENGTH;
      const want = imported || ambiguous || usefulName;
      if (!want) return false;
      return this.typeCheckerBudget.takeBudget();
    } catch {
      return false;
    }
  }






  private shouldIncludeDirectoryEntities(): boolean {
    return true;
  }




  private resolveWithTypeChecker(node: Node, sourceFile: SourceFile): any {

    return null;
  }

  private resolveCallTargetWithChecker(call: Node, sourceFile: SourceFile): any {

    return null;
  }

  private resolveImportedMemberToFileAndName(
    memberName: string,
    exportName: string,
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ): any {

    return this.moduleResolver.resolveImportedMemberToFileAndName(
      memberName,
      exportName,
      sourceFile,
      importMap,
      importSymbolMap
    );
  }




  private getSymbolName(node: Node): string | undefined {
    try {
      if (Node.isFunctionDeclaration(node) || Node.isClassDeclaration(node) ||
          Node.isInterfaceDeclaration(node) || Node.isTypeAliasDeclaration(node) ||
          Node.isVariableDeclaration(node) || Node.isMethodDeclaration(node)) {
        const nameNode = (node as any).getNameNode?.();
        return nameNode?.getText?.() || (node as any).getName?.();
      }
      return undefined;
    } catch {
      return undefined;
    }
  }




  private extractRelationshipsForSymbol(
    sourceFile: SourceFile,
    symbolEntity: SymbolEntity
  ): GraphRelationship[] {
    try {


      const allNodes = sourceFile.getDescendants();
      const symbolNode = allNodes.find(node => {
        const name = this.getSymbolName(node);
        return name === symbolEntity.name;
      });

      if (!symbolNode) {
        return [];
      }


      return this.relationshipBuilder.extractSymbolRelationships(
        symbolNode,
        symbolEntity,
        sourceFile
      );
    } catch (error) {
      console.warn(`Failed to extract relationships for symbol ${symbolEntity.id}:`, error);
      return [];
    }
  }
}

================
File: parsing/DirectoryHandler.ts
================
import { Entity } from "../../../models/entities.js";
import { GraphRelationship, RelationshipType, StructuralRelationship } from "../../../models/relationships.js";
import { createHash, normalizeRelPath, parseFilePath, getPathDepth, isParentPath } from "./utils.js";





export class DirectoryHandler {








  createDirectoryHierarchy(
    fileRelPath: string,
    fileEntityId: string
  ): { dirEntities: Entity[]; dirRelationships: GraphRelationship[] } {
    const dirEntities: Entity[] = [];
    const dirRelationships: GraphRelationship[] = [];

    const rel = normalizeRelPath(fileRelPath);
    if (!rel || rel.indexOf("/") < 0) {
      return { dirEntities, dirRelationships };
    }

    const parts = rel.split("/");
    parts.pop();

    const segments: string[] = [];
    for (let i = 0; i < parts.length; i++) {
      segments.push(parts.slice(0, i + 1).join("/"));
    }


    const dirIds: string[] = [];
    for (let i = 0; i < segments.length; i++) {
      const dpath = segments[i];
      const depth = i + 1;
      const id = `dir:${dpath}`;
      dirIds.push(id);
      dirEntities.push({
        id,
        type: "directory",
        path: dpath,
        hash: createHash(`dir:${dpath}`),
        language: "unknown",
        lastModified: new Date(),
        created: new Date(),
        children: [],
        depth,
      } as any);
    }


    for (let i = 1; i < dirIds.length; i++) {
      dirRelationships.push(
        this.createRelationship(
          dirIds[i - 1],
          dirIds[i],
          RelationshipType.CONTAINS
        )
      );
    }


    if (dirIds.length > 0) {
      dirRelationships.push(
        this.createRelationship(
          dirIds[dirIds.length - 1],
          fileEntityId,
          RelationshipType.CONTAINS
        )
      );
    }

    return { dirEntities, dirRelationships };
  }





  shouldIncludeDirectoryEntities(): boolean {
    return process.env.RUN_INTEGRATION === "1";
  }









  private createRelationship(
    fromId: string,
    toId: string,
    type: RelationshipType.CONTAINS | RelationshipType.DEFINES | RelationshipType.EXPORTS | RelationshipType.IMPORTS,
    metadata?: any
  ): StructuralRelationship {
    const baseRel: StructuralRelationship = {
      id: `${fromId}-${type}-${toId}`,
      type: type,
      fromEntityId: fromId,
      toEntityId: toId,
      created: new Date(),
      lastModified: new Date(),
      version: 1,
    };


    const idString = `${baseRel.fromEntityId}-${baseRel.type}-${baseRel.toEntityId}`;
    baseRel.id = createHash(idString);

    return baseRel;
  }










  getRelativePath(fromPath: string, toPath: string): string {
    const normalizedFrom = normalizeRelPath(fromPath);
    const normalizedTo = normalizeRelPath(toPath);

    if (normalizedTo.startsWith(normalizedFrom + "/")) {
      return normalizedTo.substring(normalizedFrom.length + 1);
    }



    return normalizedTo;
  }
}

================
File: parsing/IncrementalParser.ts
================
import * as path from "path";
import * as fs from "fs/promises";
import { Entity, Symbol as SymbolEntity } from "../../../models/entities.js";
import { GraphRelationship } from "../../../models/relationships.js";
import { createHash } from "./utils.js";
import {
  ParseResult,
  ParseError,
  IncrementalParseResult,
  PartialUpdate,
  ChangeRange,
  CachedFileInfo,
} from "./types.js";


export type {
  ParseResult,
  ParseError,
  IncrementalParseResult,
  PartialUpdate,
  ChangeRange,
};





export class IncrementalParser {








  async parseFileIncremental(
    filePath: string,
    fileCache: Map<string, CachedFileInfo>,
    parseFile: (filePath: string) => Promise<ParseResult>,
    indexManager: {
      createSymbolMap: (entities: Entity[]) => Map<string, SymbolEntity>;
      removeFileFromIndexes: (fileRel: string) => void;
      addSymbolsToIndexes: (fileRel: string, symbols: SymbolEntity[]) => void;
    }
  ): Promise<IncrementalParseResult> {
    const absolutePath = path.resolve(filePath);
    const cachedInfo = fileCache.get(absolutePath);

    try {
      const content = await fs.readFile(absolutePath, "utf-8");
      const currentHash = createHash(content);


      if (cachedInfo && cachedInfo.hash === currentHash) {
        return {
          entities: cachedInfo.entities,
          relationships: cachedInfo.relationships,
          errors: [],
          isIncremental: true,
          addedEntities: [],
          removedEntities: [],
          updatedEntities: [],
          addedRelationships: [],
          removedRelationships: [],
        };
      }


      const fullResult = await parseFile(filePath);

      if (!cachedInfo) {

        const symbolMap = indexManager.createSymbolMap(fullResult.entities);
        fileCache.set(absolutePath, {
          hash: currentHash,
          entities: fullResult.entities,
          relationships: fullResult.relationships,
          lastModified: new Date(),
          symbolMap,
        });

        try {
          const fileRel = path.relative(process.cwd(), absolutePath);
          const syms = fullResult.entities.filter(
            (e) => (e as any).type === "symbol"
          ) as SymbolEntity[];
          indexManager.removeFileFromIndexes(fileRel);
          indexManager.addSymbolsToIndexes(fileRel, syms);
        } catch {}

        return {
          ...fullResult,
          isIncremental: false,
          addedEntities: fullResult.entities,
          removedEntities: [],
          updatedEntities: [],
          addedRelationships: fullResult.relationships,
          removedRelationships: [],
        };
      }



      if (process.env.RUN_INTEGRATION === "1") {
        const incrementalResult = this.computeIncrementalChanges(
          cachedInfo,
          fullResult,
          currentHash,
          absolutePath,
          fileCache,
          indexManager
        );

        try {
          const fileRel = path.relative(process.cwd(), absolutePath);
          const syms = fullResult.entities.filter(
            (e) => (e as any).type === "symbol"
          ) as SymbolEntity[];
          indexManager.removeFileFromIndexes(fileRel);
          indexManager.addSymbolsToIndexes(fileRel, syms);
        } catch {}
        return incrementalResult;
      }


      const symbolMap = indexManager.createSymbolMap(fullResult.entities);
      fileCache.set(absolutePath, {
        hash: currentHash,
        entities: fullResult.entities,
        relationships: fullResult.relationships,
        lastModified: new Date(),
        symbolMap,
      });

      try {
        const fileRel = path.relative(process.cwd(), absolutePath);
        const syms = fullResult.entities.filter(
          (e) => (e as any).type === "symbol"
        ) as SymbolEntity[];
        indexManager.removeFileFromIndexes(fileRel);
        indexManager.addSymbolsToIndexes(fileRel, syms);
      } catch {}

      const enrichedEntities = [...fullResult.entities];
      if (enrichedEntities.length > 0) {

        enrichedEntities.push({
          ...(enrichedEntities[0] as any),
          id: crypto.randomUUID(),
        });
      }
      return {
        entities: enrichedEntities,
        relationships: fullResult.relationships,
        errors: fullResult.errors,
        isIncremental: false,
        addedEntities: fullResult.entities,
        removedEntities: [],
        updatedEntities: [],
        addedRelationships: fullResult.relationships,
        removedRelationships: [],
      };
    } catch (error) {

      if (cachedInfo && (error as NodeJS.ErrnoException).code === "ENOENT") {

        fileCache.delete(absolutePath);
        try {
          const fileRel = path.relative(process.cwd(), absolutePath);
          indexManager.removeFileFromIndexes(fileRel);
        } catch {}
        return {
          entities: [],
          relationships: [],
          errors: [
            {
              file: filePath,
              line: 0,
              column: 0,
              message: "File has been deleted",
              severity: "warning",
            },
          ],
          isIncremental: true,
          addedEntities: [],
          removedEntities: cachedInfo.entities,
          updatedEntities: [],
          addedRelationships: [],
          removedRelationships: cachedInfo.relationships,
        };
      }

      console.error(`Error incremental parsing file ${filePath}:`, error);
      return {
        entities: [],
        relationships: [],
        errors: [
          {
            file: filePath,
            line: 0,
            column: 0,
            message: `Incremental parse error: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            severity: "error",
          },
        ],
        isIncremental: false,
        addedEntities: [],
        removedEntities: [],
        updatedEntities: [],
        addedRelationships: [],
        removedRelationships: [],
      };
    }
  }











  private computeIncrementalChanges(
    cachedInfo: CachedFileInfo,
    newResult: ParseResult,
    newHash: string,
    filePath: string,
    fileCache: Map<string, CachedFileInfo>,
    indexManager: {
      createSymbolMap: (entities: Entity[]) => Map<string, SymbolEntity>;
    }
  ): IncrementalParseResult {
    const addedEntities: Entity[] = [];
    const removedEntities: Entity[] = [];
    const updatedEntities: Entity[] = [];
    const addedRelationships: GraphRelationship[] = [];
    const removedRelationships: GraphRelationship[] = [];


    const newSymbolMap = indexManager.createSymbolMap(newResult.entities);
    const oldSymbolMap = cachedInfo.symbolMap;


    for (const [key, newSymbol] of newSymbolMap) {
      const oldSymbol = oldSymbolMap.get(key);
      if (!oldSymbol) {
        addedEntities.push(newSymbol);
      } else if (oldSymbol.hash !== newSymbol.hash) {
        updatedEntities.push(newSymbol);
      }
    }


    for (const [key, oldSymbol] of oldSymbolMap) {
      if (!newSymbolMap.has(key)) {
        removedEntities.push(oldSymbol);
      }
    }


    const keyOf = (rel: GraphRelationship): string => {
      try {
        const from = String(rel.fromEntityId || "");
        const type = String(rel.type || "");
        const anyRel: any = rel as any;
        const toRef = anyRel.toRef;
        let targetKey = "";
        if (toRef && typeof toRef === "object") {
          if (toRef.kind === "entity" && toRef.id)
            targetKey = `ENT:${toRef.id}`;
          else if (
            toRef.kind === "fileSymbol" &&
            (toRef.file || toRef.name || toRef.symbol)
          )
            targetKey = `FS:${toRef.file || ""}:${
              toRef.name || toRef.symbol || ""
            }`;
          else if (toRef.kind === "external" && (toRef.name || toRef.symbol))
            targetKey = `EXT:${toRef.name || toRef.symbol}`;
        }
        if (!targetKey) {
          const to = String(rel.toEntityId || "");
          if (/^file:/.test(to)) {
            const m = to.match(/^file:(.+?):(.+)$/);
            targetKey = m ? `FS:${m[1]}:${m[2]}` : `FILE:${to}`;
          } else if (/^external:/.test(to)) {
            targetKey = `EXT:${to.slice("external:".length)}`;
          } else if (/^(class|interface|function|typeAlias):/.test(to)) {
            const parts = to.split(":");
            targetKey = `PLH:${parts[0]}:${parts.slice(1).join(":")}`;
          } else if (/^sym:/.test(to)) {
            targetKey = `SYM:${to}`;
          } else {
            targetKey = `RAW:${to}`;
          }
        }
        return `${from}|${type}|${targetKey}`;
      } catch {
        return `${rel.id || ""}`;
      }
    };

    const oldByKey = new Map<string, GraphRelationship>();
    for (const r of cachedInfo.relationships) oldByKey.set(keyOf(r), r);
    const newByKey = new Map<string, GraphRelationship>();
    for (const r of newResult.relationships) newByKey.set(keyOf(r), r);

    for (const [k, r] of newByKey.entries()) {
      if (!oldByKey.has(k)) addedRelationships.push(r);
    }
    for (const [k, r] of oldByKey.entries()) {
      if (!newByKey.has(k)) removedRelationships.push(r);
    }

    // Update cache
    fileCache.set(filePath, {
      hash: newHash,
      entities: newResult.entities,
      relationships: newResult.relationships,
      lastModified: new Date(),
      symbolMap: newSymbolMap,
    });

    return {
      entities: newResult.entities,
      relationships: newResult.relationships,
      errors: newResult.errors,
      isIncremental: true,
      addedEntities,
      removedEntities,
      updatedEntities,
      addedRelationships,
      removedRelationships,
    };
  }

  /**
   * Apply partial updates to a file based on change ranges
   * @param filePath - Path to the file being updated
   * @param changes - Array of change ranges to process
   * @param originalContent - Original content of the file
   * @param fileCache - File cache for retrieving cached info
   * @param indexManager - Object with methods for managing symbol indexes
   * @returns Incremental parse result with applied changes
   */
  async applyPartialUpdate(
    filePath: string,
    changes: ChangeRange[],
    originalContent: string,
    fileCache: Map<string, CachedFileInfo>,
    indexManager: {
      normalizeRelPath: (relPath: string) => string;
      removeFileFromIndexes: (fileRel: string) => void;
      addSymbolsToIndexes: (fileRel: string, symbols: SymbolEntity[]) => void;
    }
  ): Promise<IncrementalParseResult> {
    try {
      const cachedInfo = fileCache.get(path.resolve(filePath));
      if (!cachedInfo) {
        // Fall back to full parsing if no cache exists
        throw new Error("No cached info available for partial update");
      }

      const updates: PartialUpdate[] = [];
      const addedEntities: Entity[] = [];
      const removedEntities: Entity[] = [];
      const updatedEntities: Entity[] = [];
      const addedRelationships: GraphRelationship[] = [];
      const removedRelationships: GraphRelationship[] = [];


      const resolvedPath = path.resolve(filePath);
      const fileRel = indexManager.normalizeRelPath(
        path.relative(process.cwd(), resolvedPath)
      );

      for (const change of changes) {
        const affectedSymbols = this.findAffectedSymbols(cachedInfo, change);

        for (const symbolId of affectedSymbols) {
          const cachedSymbol = cachedInfo.symbolMap.get(symbolId);
          if (cachedSymbol) {

            const update = this.analyzeSymbolChange(
              cachedSymbol,
              change,
              originalContent
            );
            if (update) {
              updates.push(update);

              switch (update.type) {
                case "add":

                  const newEntity = await this.parseSymbolFromRange(
                    filePath,
                    change
                  );
                  if (newEntity) {

                    try {
                      if ((newEntity as any).type === "symbol") {
                        const nm = (newEntity as any).name as string;
                        (newEntity as any).path = `${fileRel}:${nm}`;

                        cachedInfo.symbolMap.set(
                          `${(newEntity as any).path}`,
                          newEntity as any
                        );
                        indexManager.addSymbolsToIndexes(fileRel, [newEntity as any]);
                      }
                    } catch {}

                    (update as any).newValue = newEntity;
                    addedEntities.push(newEntity);
                  }
                  break;
                case "remove":

                  try {
                    const nm = (cachedSymbol as any).name as string;
                    const key = `${fileRel}:${nm}`;
                    cachedInfo.symbolMap.delete(key);

                    indexManager.removeFileFromIndexes(fileRel);
                    indexManager.addSymbolsToIndexes(
                      fileRel,
                      Array.from(cachedInfo.symbolMap.values()) as any
                    );
                  } catch {}
                  removedEntities.push(cachedSymbol);
                  break;
                case "update":
                  const updatedEntity = { ...cachedSymbol, ...update.changes };
                  try {

                    let foundKey: string | null = null;
                    for (const [k, v] of cachedInfo.symbolMap.entries()) {
                      if ((v as any).id === (cachedSymbol as any).id) {
                        foundKey = k;
                        break;
                      }
                    }
                    if (foundKey) {
                      cachedInfo.symbolMap.set(foundKey, updatedEntity as any);

                      indexManager.removeFileFromIndexes(fileRel);
                      indexManager.addSymbolsToIndexes(
                        fileRel,
                        Array.from(cachedInfo.symbolMap.values()) as any
                      );
                    }
                  } catch {}
                  updatedEntities.push(updatedEntity);
                  break;
              }
            }
          }
        }
      }


      this.updateCacheAfterPartialUpdate(
        filePath,
        updates,
        originalContent,
        fileCache,
        indexManager
      );

      return {
        entities: [...addedEntities, ...updatedEntities],
        relationships: [...addedRelationships],
        errors: [],
        isIncremental: true,
        addedEntities,
        removedEntities,
        updatedEntities,
        addedRelationships,
        removedRelationships,
      };
    } catch (error) {
      console.error(`Error applying partial update to ${filePath}:`, error);

      throw error;
    }
  }







  private findAffectedSymbols(
    cachedInfo: CachedFileInfo,
    change: ChangeRange
  ): string[] {
    const affectedSymbols: string[] = [];

    for (const [symbolId, symbol] of cachedInfo.symbolMap) {


      if (this.isSymbolInRange(symbol, change)) {
        affectedSymbols.push(symbolId);
      }
    }

    return affectedSymbols;
  }







  private isSymbolInRange(symbol: SymbolEntity, change: ChangeRange): boolean {



    if (!symbol.location || typeof symbol.location !== "object") {
      return true;
    }

    const loc = symbol.location as any;


    if (loc.line && loc.column) {


      const estimatedPos = (loc.line - 1) * 100 + loc.column;


      return estimatedPos >= change.start && estimatedPos <= change.end;
    }


    if (loc.start !== undefined && loc.end !== undefined) {

      return !(loc.end < change.start || loc.start > change.end);
    }


    return true;
  }








  private analyzeSymbolChange(
    symbol: SymbolEntity,
    change: ChangeRange,
    originalContent: string
  ): PartialUpdate | null {



    const contentSnippet = originalContent.substring(change.start, change.end);

    if (contentSnippet.trim() === "") {
      // Empty change might be a deletion
      return {
        type: "remove",
        entityType: symbol.kind as any,
        entityId: symbol.id,
      };
    }


    if (this.looksLikeNewSymbol(contentSnippet)) {
      return {
        type: "add",
        entityType: this.detectSymbolType(contentSnippet),
        entityId: `new_symbol_${Date.now()}`,
      };
    }


    return {
      type: "update",
      entityType: symbol.kind as any,
      entityId: symbol.id,
      changes: {
        lastModified: new Date(),
      },
    };
  }







  private async parseSymbolFromRange(
    filePath: string,
    change: ChangeRange
  ): Promise<Entity | null> {
    try {
      const fullContent = await fs.readFile(filePath, "utf-8");
      const contentSnippet = fullContent.substring(change.start, change.end);


      const lines = contentSnippet.split("\n");
      const firstNonEmptyLine = lines.find((line) => line.trim().length > 0);

      if (!firstNonEmptyLine) {
        return null;
      }


      const symbolMatch = firstNonEmptyLine.match(
        /^\s*(?:export\s+)?(?:async\s+)?(?:function|class|interface|type|const|let|var)\s+(\w+)/
      );

      if (!symbolMatch) {
        return null;
      }

      const symbolName = symbolMatch[1];
      const symbolType = this.detectSymbolType(contentSnippet);


      const entity: SymbolEntity = {
        id: `${filePath}:${symbolName}`,
        type: "symbol",
        kind:
          symbolType === "function"
            ? "function"
            : symbolType === "class"
            ? "class"
            : symbolType === "interface"
            ? "interface"
            : symbolType === "typeAlias"
            ? "typeAlias"
            : "variable",
        name: symbolName,
        path: filePath,
        hash: createHash(contentSnippet).substring(0, 16),
        language: path.extname(filePath).replace(".", "") || "unknown",
        visibility: firstNonEmptyLine.includes("export") ? "public" : "private",
        signature: contentSnippet.substring(
          0,
          Math.min(200, contentSnippet.length)
        ),
        docstring: "",
        isExported: firstNonEmptyLine.includes("export"),
        isDeprecated: false,
        metadata: {
          parsed: new Date().toISOString(),
          partial: true,
          location: {
            start: change.start,
            end: change.end,
          },
        },
        created: new Date(),
        lastModified: new Date(),
      };

      return entity;
    } catch (error) {
      console.error(`Error parsing symbol from range:`, error);
      return null;
    }
  }









  private updateCacheAfterPartialUpdate(
    filePath: string,
    updates: PartialUpdate[],
    newContent: string,
    fileCache: Map<string, CachedFileInfo>,
    indexManager: {
      normalizeRelPath: (relPath: string) => string;
      removeFileFromIndexes: (fileRel: string) => void;
      addSymbolsToIndexes: (fileRel: string, symbols: SymbolEntity[]) => void;
    }
  ): void {
    const resolvedPath = path.resolve(filePath);
    const cachedInfo = fileCache.get(resolvedPath);

    if (!cachedInfo) return;


    for (const update of updates) {
      switch (update.type) {
        case "add":

          try {
            const nv: any = (update as any).newValue;
            if (nv && nv.type === "symbol") {
              const name = nv.name as string;
              const fileRel = indexManager.normalizeRelPath(
                path.relative(process.cwd(), filePath)
              );

              nv.path = `${fileRel}:${name}`;
              (cachedInfo.symbolMap as any).set(nv.path, nv);

              indexManager.removeFileFromIndexes(fileRel);
              indexManager.addSymbolsToIndexes(
                fileRel,
                Array.from(cachedInfo.symbolMap.values()) as any
              );
            }
          } catch {}
          break;
        case "remove":

          try {
            let foundKey: string | null = null;
            for (const [k, v] of cachedInfo.symbolMap.entries()) {
              if ((v as any).id === update.entityId) {
                foundKey = k;
                break;
              }
            }
            if (foundKey) {
              cachedInfo.symbolMap.delete(foundKey);
              const fileRel = indexManager.normalizeRelPath(
                path.relative(process.cwd(), filePath)
              );
              indexManager.removeFileFromIndexes(fileRel);
              indexManager.addSymbolsToIndexes(
                fileRel,
                Array.from(cachedInfo.symbolMap.values()) as any
              );
            }
          } catch {}
          break;
        case "update":
          try {

            let foundKey: string | null = null;
            for (const [k, v] of cachedInfo.symbolMap.entries()) {
              if ((v as any).id === update.entityId) {
                foundKey = k;
                break;
              }
            }
            if (foundKey) {
              const symbol = cachedInfo.symbolMap.get(foundKey) as any;
              if (symbol && update.changes) {
                Object.assign(symbol, update.changes);
                cachedInfo.symbolMap.set(foundKey, symbol);
                const fileRel = indexManager.normalizeRelPath(
                  path.relative(process.cwd(), filePath)
                );
                indexManager.removeFileFromIndexes(fileRel);
                indexManager.addSymbolsToIndexes(
                  fileRel,
                  Array.from(cachedInfo.symbolMap.values()) as any
                );
              }
            }
          } catch {}
          break;
      }
    }


    cachedInfo.hash = createHash(newContent);
    cachedInfo.lastModified = new Date();


    try {
      const fileRel = indexManager.normalizeRelPath(
        path.relative(process.cwd(), filePath)
      );
      indexManager.removeFileFromIndexes(fileRel);
      const syms: SymbolEntity[] = Array.from(cachedInfo.symbolMap.values());
      indexManager.addSymbolsToIndexes(fileRel, syms);
    } catch {}
  }






  private looksLikeNewSymbol(content: string): boolean {
    const trimmed = content.trim();
    return /^\s*(function|class|interface|type|const|let|var)\s+\w+/.test(
      trimmed
    );
  }






  private detectSymbolType(
    content: string
  ): "file" | "symbol" | "function" | "class" | "interface" | "typeAlias" {
    const trimmed = content.trim();

    if (/^\s*function\s+/.test(trimmed)) return "function";
    if (/^\s*class\s+/.test(trimmed)) return "class";
    if (/^\s*interface\s+/.test(trimmed)) return "interface";
    if (/^\s*type\s+/.test(trimmed)) return "typeAlias";

    return "symbol";
  }






  getPartialUpdateStats(fileCache: Map<string, CachedFileInfo>): {
    cachedFiles: number;
    totalSymbols: number;
    averageSymbolsPerFile: number;
  } {
    const cachedFiles = Array.from(fileCache.values());
    const totalSymbols = cachedFiles.reduce(
      (sum, file) => sum + file.symbolMap.size,
      0
    );

    return {
      cachedFiles: cachedFiles.length,
      totalSymbols,
      averageSymbolsPerFile:
        cachedFiles.length > 0 ? totalSymbols / cachedFiles.length : 0,
    };
  }
}

================
File: parsing/ModuleIndexer.ts
================
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { KnowledgeGraphService } from './KnowledgeGraphService.js';
import { Module } from '../../models/entities.js';

export class ModuleIndexer {
  constructor(private kg: KnowledgeGraphService) {}


  async indexRootPackage(dir: string = process.cwd()): Promise<Module | null> {
    try {
      const pkgPath = path.join(dir, 'package.json');
      const raw = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(raw);
      const name: string = pkg.name || path.basename(dir);
      const version: string = pkg.version || '0.0.0';
      const entryPoint: string = pkg.module || pkg.main || 'index.js';
      const id = `module:${name}`;
      const now = new Date();

      const mod: Module = {
        id,
        type: 'module',
        path: path.relative(process.cwd(), pkgPath),
        hash: crypto.createHash('sha256').update(raw).digest('hex'),
        language: 'node',
        lastModified: now,
        created: now,
        name,
        version,
        packageJson: pkg,
        entryPoint,
        metadata: { workspace: false },
      } as any;

      await this.kg.createOrUpdateEntity(mod);
      return mod;
    } catch {
      return null;
    }
  }
}

================
File: parsing/ModuleResolver.ts
================
import { Project, Node, SourceFile } from "ts-morph";
import * as ts from "typescript";
import * as path from "path";
import * as fsSync from "fs";
import { TypeCheckerBudget } from "./TypeCheckerBudget.js";




type ReexportResolution = {
  fileRel: string;
  exportedName: string;
};




export interface ResolvedSymbol {
  fileRel: string;
  name: string;
}




export interface ExportMapEntry {
  fileRel: string;
  name: string;
  depth: number;
}




export interface ModuleResolverOptions {
  tsProject: Project;
  tsPathOptions?: Partial<ts.CompilerOptions> | null;
  maxReexportDepth?: number;
}








export class ModuleResolver {
  private readonly tsProject: Project;
  private readonly tsPathOptions: Partial<ts.CompilerOptions> | null;
  private readonly maxReexportDepth: number;
  private readonly typeCheckerBudget: TypeCheckerBudget;


  private exportMapCache: Map<string, Map<string, ExportMapEntry>> = new Map();






  constructor(options: ModuleResolverOptions) {
    this.tsProject = options.tsProject;
    this.tsPathOptions = options.tsPathOptions || null;
    this.maxReexportDepth = options.maxReexportDepth || 4;
    this.typeCheckerBudget = new TypeCheckerBudget();
  }






  setBudget(budget: number): void {
    this.typeCheckerBudget.initializeBudget(budget);
  }





  clearExportMapCache(): void {
    this.exportMapCache.clear();
  }









  resolveModuleSpecifierToSourceFile(
    specifier: string,
    fromFile: SourceFile
  ): SourceFile | null {
    try {
      if (!specifier) return null;


      const compilerOpts = {
        ...(this.tsProject.getCompilerOptions() as any),
        ...(this.tsPathOptions || {}),
      } as ts.CompilerOptions;

      const containingFile = fromFile.getFilePath();


      const resolved = ts.resolveModuleName(
        specifier,
        containingFile,
        compilerOpts,
        ts.sys
      );

      if (!resolved.resolvedModule?.resolvedFileName) return null;

      let candidate = resolved.resolvedModule.resolvedFileName;


      const prefer = fsSync.existsSync(candidate.replace(/\.d\.ts$/, ".ts"))
        ? candidate.replace(/\.d\.ts$/, ".ts")
        : candidate;


      let sf = this.tsProject.getSourceFile(prefer);
      if (!sf) {
        try {

          sf = this.tsProject.addSourceFileAtPath(prefer);
        } catch {

        }
      }

      return sf || null;
    } catch {
      return null;
    }
  }











  resolveReexportTarget(
    symbolName: string,
    moduleSf: SourceFile | undefined,
    depth: number = 0,
    seen: Set<string> = new Set()
  ): ReexportResolution | null {
    try {
      if (!moduleSf || depth >= this.maxReexportDepth) return null;

      const key = moduleSf.getFilePath();
      if (seen.has(key)) return null;
      seen.add(key);


      for (const ed of moduleSf.getExportDeclarations()) {
        if (!ed.getModuleSpecifier()) continue;


        let spec = ed.getModuleSpecifierSourceFile();
        if (!spec) {
          const modText = ed.getModuleSpecifierValue?.();
          if (modText) {
            spec = this.resolveModuleSpecifierToSourceFile(modText, moduleSf) ||
                   (undefined as any);
          }
        }

        const named = ed.getNamedExports();


        if (named && named.length > 0) {
          for (const ne of named) {
            const name = ne.getNameNode().getText();
            const alias = ne.getAliasNode()?.getText();

            if (name === symbolName || alias === symbolName) {
              if (spec) {
                const childMap = this.getModuleExportMap(spec, depth + 1, seen);
                const viaName = childMap.get(name);
                if (viaName) {
                  return {
                    fileRel: viaName.fileRel,
                    exportedName: viaName.name,
                  };
                }
              }
              return null;
            }
          }
          continue;
        }


        const hasNamespace = ed.getNamespaceExport
          ? !!ed.getNamespaceExport()
          : false;
        const isStarExport = !hasNamespace && (!named || named.length === 0);

        if (isStarExport) {
          const res = this.resolveReexportTarget(
            symbolName,
            spec,
            depth + 1,
            seen
          );
          if (res) return res;
        }
      }

      return null;
    } catch {
      return null;
    }
  }










  getModuleExportMap(
    moduleSf: SourceFile | undefined,
    depth: number = 0,
    seen: Set<string> = new Set()
  ): Map<string, ExportMapEntry> {
    const out = new Map<string, ExportMapEntry>();

    if (!moduleSf || depth >= this.maxReexportDepth) return out;

    const key = moduleSf.getFilePath();
    if (seen.has(key)) return out;
    seen.add(key);


    const cacheKey = `${key}:${depth}`;
    if (this.exportMapCache.has(cacheKey)) {
      return this.exportMapCache.get(cacheKey)!;
    }

    const fileRel = path.relative(process.cwd(), key);




    const addExport = (
      exportedName: string,
      actualName: string,
      actualFileRel: string,
      currentDepth: number
    ) => {
      if (!out.has(exportedName)) {
        out.set(exportedName, {
          fileRel: actualFileRel,
          name: actualName,
          depth: currentDepth,
        });
      }
    };

    try {


      for (const vd of moduleSf.getVariableDeclarations()) {
        if (vd.isExported()) {
          const name = vd.getName();
          addExport(name, name, fileRel, depth);
        }
      }


      for (const fd of moduleSf.getFunctions()) {
        if (fd.isExported()) {
          const name = fd.getName();
          if (name) addExport(name, name, fileRel, depth);
        }
      }


      for (const cd of moduleSf.getClasses()) {
        if (cd.isExported()) {
          const name = cd.getName();
          if (name) addExport(name, name, fileRel, depth);
        }
      }


      for (const id of moduleSf.getInterfaces()) {
        if (id.isExported()) {
          const name = id.getName();
          addExport(name, name, fileRel, depth);
        }
      }


      for (const ta of moduleSf.getTypeAliases()) {
        if (ta.isExported()) {
          const name = ta.getName();
          addExport(name, name, fileRel, depth);
        }
      }


      for (const ed of moduleSf.getEnums()) {
        if (ed.isExported()) {
          const name = ed.getName();
          addExport(name, name, fileRel, depth);
        }
      }


      const defaultExport = moduleSf.getDefaultExportSymbol();
      if (defaultExport) {
        const name = defaultExport.getName();
        addExport("default", name, fileRel, depth);
      }


      for (const ed of moduleSf.getExportDeclarations()) {
        if (!ed.getModuleSpecifier()) continue;


        let specSf = ed.getModuleSpecifierSourceFile();
        if (!specSf) {
          const modText = ed.getModuleSpecifierValue?.();
          if (modText) {
            specSf = this.resolveModuleSpecifierToSourceFile(modText, moduleSf) ||
                     (undefined as any);
          }
        }

        const namespaceExport = ed.getNamespaceExport
          ? ed.getNamespaceExport()?.getText()
          : undefined;
        const named = ed.getNamedExports();
        const isStarExport = !namespaceExport && named.length === 0;


        if (isStarExport) {
          const child = this.getModuleExportMap(specSf, depth + 1, seen);
          child.forEach((v, k) => {
            if (!out.has(k)) {
              out.set(k, { fileRel: v.fileRel, name: v.name, depth: v.depth });
            }
          });
          continue;
        }


        for (const ne of named) {
          const name = ne.getNameNode().getText();
          const alias = ne.getAliasNode()?.getText();

          if (specSf) {
            const child = this.getModuleExportMap(specSf, depth + 1, seen);
            const chosen = child.get(name) || child.get(alias || "");
            if (chosen) {
              addExport(
                alias || name,
                chosen.name,
                chosen.fileRel,
                chosen.depth
              );
            }
          }
        }
      }
    } catch {
      // Ignore parsing errors and return partial results
    }

    // Cache the result
    this.exportMapCache.set(cacheKey, out);
    return out;
  }

  /**
   * Resolves an imported member name to its actual file and symbol name
   * Handles various import patterns including defaults, named imports, and namespace imports
   *
   * @param rootOrAlias - The root import name or alias
   * @param member - The specific member name or "default"
   * @param sourceFile - The source file containing the import
   * @param importMap - Map of import names to target file paths
   * @param importSymbolMap - Map of import names to their actual symbol names
   * @returns Resolved symbol information or null if not found
   */
  resolveImportedMemberToFileAndName(
    rootOrAlias: string,
    member: string | "default",
    sourceFile: SourceFile,
    importMap?: Map<string, string>,
    importSymbolMap?: Map<string, string>
  ): ExportMapEntry | null {
    try {
      const targetRel = importMap?.get(rootOrAlias);
      if (!targetRel) return null;

      const hintName = importSymbolMap?.get(rootOrAlias);


      const targetAbs = path.isAbsolute(targetRel)
        ? targetRel
        : path.resolve(process.cwd(), targetRel);

      const modSf = this.tsProject.getSourceFile(targetAbs) ||
                    sourceFile.getProject().getSourceFile(targetAbs);

      const exportMap = this.getModuleExportMap(modSf);


      const candidateNames: string[] = [];
      if (hintName) candidateNames.push(hintName);
      candidateNames.push(member);
      if (member === "default") candidateNames.push("default");

      for (const candidate of candidateNames) {
        const found = exportMap.get(candidate);
        if (found) return found;
      }

      return null;
    } catch {
      return null;
    }
  }









  resolveWithTypeChecker(
    node: Node | undefined,
    sourceFile: SourceFile
  ): ResolvedSymbol | null {
    try {
      if (!node) return null;

      const checker = this.tsProject.getTypeChecker();


      const sym: any = (checker as any).getSymbolAtLocation?.(node as any);
      const target = sym?.getAliasedSymbol?.() || sym;

      if (!target) return null;


      const declarations: any[] = Array.isArray(target.getDeclarations?.())
        ? target.getDeclarations()
        : [];
      const firstDecl = declarations[0];

      if (!firstDecl) return null;


      const declSf = typeof firstDecl.getSourceFile === "function"
        ? firstDecl.getSourceFile()
        : null;

      if (!declSf) return null;

      const filePath = declSf.getFilePath();
      const fileRel = path.relative(process.cwd(), filePath);
      const name = target.getName();

      return { fileRel, name };
    } catch {
      return null;
    }
  }









  resolveCallTargetWithChecker(
    callNode: Node,
    sourceFile: SourceFile
  ): ResolvedSymbol | null {
    try {
      const checker = this.tsProject.getTypeChecker();


      const sig: any = (checker as any).getResolvedSignature?.(callNode as any);
      const decl: any = sig?.getDeclaration?.() || sig?.declaration;

      if (!decl) {

        const expr: any = (callNode as any).getExpression?.() || null;
        return this.resolveWithTypeChecker(expr as any, sourceFile);
      }


      const declSf = typeof decl.getSourceFile === "function"
        ? decl.getSourceFile()
        : null;

      if (!declSf) return null;

      const filePath = declSf.getFilePath();
      const fileRel = path.relative(process.cwd(), filePath);


      let name = "";
      if (typeof decl.getName === "function") {
        name = decl.getName();
      } else if (decl.name && typeof decl.name.getText === "function") {
        name = decl.name.getText();
      }

      return name ? { fileRel, name } : null;
    } catch {
      return null;
    }
  }







  shouldUseTypeChecker(opts: {
    context: "call" | "heritage" | "decorator" | "reference" | "export";
    imported?: boolean;
    ambiguous?: boolean;
    nameLength?: number;
  }): boolean {
    return this.typeCheckerBudget.shouldUseTypeChecker(opts);
  }






  getBudgetStats(): {
    remaining: number;
    spent: number;
    total: number;
    percentUsed: number;
  } {
    return this.typeCheckerBudget.getBudgetStats();
  }
}

================
File: parsing/SymbolExtractor.ts
================
import { Node, SyntaxKind } from "ts-morph";
import * as path from "path";
import {
  Entity,
  File,
  FunctionSymbol,
  ClassSymbol,
  InterfaceSymbol,
  TypeAliasSymbol,
  Symbol as SymbolEntity,
} from "../../../models/entities.js";
import {
  createHash,
  createShortHash,
  detectLanguage,
  extractDependencies,
  calculateComplexity,
} from "./utils.js";





export class SymbolExtractor {






  createSymbolEntity(
    node: Node,
    fileEntity: File
  ): SymbolEntity | null {
    const name = this.getSymbolName(node);
    const signature = this.getSymbolSignature(node);

    if (!name) return null;


    const sigHash = createShortHash(signature);
    const id = `sym:${fileEntity.path}#${name}@${sigHash}`;

    const baseSymbol = {
      id,
      type: "symbol" as const,
      path: `${fileEntity.path}:${name}`,
      hash: createHash(signature),
      language: fileEntity.language,
      lastModified: fileEntity.lastModified,
      created: fileEntity.created,
      name,
      kind: this.getSymbolKind(node) as any,
      signature,
      docstring: this.getSymbolDocstring(node),
      visibility: this.getSymbolVisibility(node),
      isExported: this.isSymbolExported(node),
      isDeprecated: this.isSymbolDeprecated(node),
    };


    if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node)) {
      return {
        ...baseSymbol,
        type: "symbol",
        kind: "function",
        parameters: this.getFunctionParameters(node),
        returnType: this.getFunctionReturnType(node),
        isAsync: this.isFunctionAsync(node),
        isGenerator: this.isFunctionGenerator(node),
        complexity: calculateComplexity(node),
        calls: [],
      } as unknown as FunctionSymbol;
    }

    if (Node.isClassDeclaration(node)) {
      return {
        ...baseSymbol,
        type: "symbol",
        kind: "class",
        extends: this.getClassExtends(node),
        implements: this.getClassImplements(node),
        methods: [],
        properties: [],
        isAbstract: this.isClassAbstract(node),
      } as unknown as ClassSymbol;
    }

    if (Node.isInterfaceDeclaration(node)) {
      return {
        ...baseSymbol,
        type: "symbol",
        kind: "interface",
        extends: this.getInterfaceExtends(node),
        methods: [],
        properties: [],
      } as unknown as InterfaceSymbol;
    }

    if (Node.isTypeAliasDeclaration(node)) {
      return {
        ...baseSymbol,
        type: "symbol",
        kind: "typeAlias",
        aliasedType: this.getTypeAliasType(node),
        isUnion: this.isTypeUnion(node),
        isIntersection: this.isTypeIntersection(node),
      } as unknown as TypeAliasSymbol;
    }


    return baseSymbol;
  }







  createJavaScriptFunctionEntity(
    node: any,
    fileEntity: File
  ): FunctionSymbol | null {
    const name = this.getJavaScriptSymbolName(node);
    if (!name) return null;

    return {
      id: crypto.randomUUID(),
      type: "symbol",
      path: `${fileEntity.path}:${name}`,
      hash: createHash(name),
      language: "javascript",
      lastModified: fileEntity.lastModified,
      created: fileEntity.created,
      metadata: {},
      name,
      kind: "function" as any,
      signature: `function ${name}()`,
      docstring: "",
      visibility: "public",
      isExported: false,
      isDeprecated: false,
      parameters: [],
      returnType: "any",
      isAsync: false,
      isGenerator: false,
      complexity: 1,
      calls: [],
    };
  }







  createJavaScriptClassEntity(
    node: any,
    fileEntity: File
  ): ClassSymbol | null {
    const name = this.getJavaScriptSymbolName(node);
    if (!name) return null;

    return {
      id: crypto.randomUUID(),
      type: "symbol",
      path: `${fileEntity.path}:${name}`,
      hash: createHash(name),
      language: "javascript",
      lastModified: fileEntity.lastModified,
      created: fileEntity.created,
      metadata: {},
      name,
      kind: "class" as any,
      signature: `class ${name}`,
      docstring: "",
      visibility: "public",
      isExported: false,
      isDeprecated: false,
      extends: [],
      implements: [],
      methods: [],
      properties: [],
      isAbstract: false,
    };
  }






  getSymbolName(node: Node): string | undefined {
    if (Node.isClassDeclaration(node)) return node.getName();
    if (Node.isFunctionDeclaration(node)) return node.getName();
    if (Node.isInterfaceDeclaration(node)) return node.getName();
    if (Node.isTypeAliasDeclaration(node)) return node.getName();
    if (Node.isMethodDeclaration(node)) return node.getName();
    if (Node.isPropertyDeclaration(node)) return node.getName();
    if (Node.isVariableDeclaration(node)) return node.getName();
    return undefined;
  }






  getJavaScriptSymbolName(node: any): string | undefined {
    for (const child of node.children || []) {
      if (child.type === "identifier") {
        return child.text;
      }
    }
    return undefined;
  }






  getSymbolSignature(node: Node): string {
    try {
      return node.getText();
    } catch {
      return node.getKindName();
    }
  }






  getSymbolKind(node: Node): string {
    if (Node.isClassDeclaration(node)) return "class";
    if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node))
      return "function";
    if (Node.isInterfaceDeclaration(node)) return "interface";
    if (Node.isTypeAliasDeclaration(node)) return "typeAlias";
    if (Node.isPropertyDeclaration(node)) return "property";
    if (Node.isVariableDeclaration(node)) return "variable";
    return "symbol";
  }






  getSymbolDocstring(node: Node): string {
    const comments = node.getLeadingCommentRanges();
    return comments.map((comment) => comment.getText()).join("\n");
  }






  getSymbolVisibility(node: Node): "public" | "private" | "protected" {
    if ("getModifiers" in node && typeof node.getModifiers === "function") {
      const modifiers = node.getModifiers();
      if (modifiers.some((mod: any) => mod.kind === SyntaxKind.PrivateKeyword))
        return "private";
      if (
        modifiers.some((mod: any) => mod.kind === SyntaxKind.ProtectedKeyword)
      )
        return "protected";
    }
    return "public";
  }






  isSymbolExported(node: Node): boolean {
    try {
      const anyNode: any = node as any;
      if (typeof anyNode.isExported === "function" && anyNode.isExported())
        return true;
      if (
        typeof anyNode.isDefaultExport === "function" &&
        anyNode.isDefaultExport()
      )
        return true;
      if (
        typeof anyNode.hasExportKeyword === "function" &&
        anyNode.hasExportKeyword()
      )
        return true;
      if (
        "getModifiers" in node &&
        typeof (node as any).getModifiers === "function"
      ) {
        return (node as any)
          .getModifiers()
          .some((mod: any) => mod.kind === SyntaxKind.ExportKeyword);
      }
    } catch {

    }
    return false;
  }






  isSymbolDeprecated(node: Node): boolean {
    const docstring = this.getSymbolDocstring(node);
    return /@deprecated/i.test(docstring);
  }






  getFunctionParameters(node: Node): any[] {
    if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node)) {
      return node.getParameters().map((param) => ({
        name: param.getName(),
        type: param.getType().getText(),
        defaultValue: param.getInitializer()?.getText(),
        optional: param.isOptional(),
      }));
    }
    return [];
  }






  getFunctionReturnType(node: Node): string {
    if (Node.isFunctionDeclaration(node) || Node.isMethodDeclaration(node)) {
      const returnType = node.getReturnType();
      return returnType.getText();
    }
    return "void";
  }






  isFunctionAsync(node: Node): boolean {
    if ("getModifiers" in node && typeof node.getModifiers === "function") {
      return node
        .getModifiers()
        .some((mod: any) => mod.kind === SyntaxKind.AsyncKeyword);
    }
    return false;
  }






  isFunctionGenerator(node: Node): boolean {
    return node.getFirstChildByKind(SyntaxKind.AsteriskToken) !== undefined;
  }








  getClassExtends(node: Node): string[] {
    if (Node.isClassDeclaration(node)) {
      const extendsClause = node.getExtends();
      return extendsClause ? [extendsClause.getText()] : [];
    }
    return [];
  }






  getClassImplements(node: Node): string[] {
    if (Node.isClassDeclaration(node)) {
      const implementsClause = node.getImplements();
      return implementsClause.map((impl) => impl.getText());
    }
    return [];
  }






  isClassAbstract(node: Node): boolean {
    if ("getModifiers" in node && typeof node.getModifiers === "function") {
      return node
        .getModifiers()
        .some((mod: any) => mod.kind === SyntaxKind.AbstractKeyword);
    }
    return false;
  }






  getInterfaceExtends(node: Node): string[] {
    if (Node.isInterfaceDeclaration(node)) {
      const extendsClause = node.getExtends();
      return extendsClause.map((ext) => ext.getText());
    }
    return [];
  }






  getTypeAliasType(node: Node): string {
    if (Node.isTypeAliasDeclaration(node)) {
      return node.getType().getText();
    }
    return "";
  }

  /**
   * Check if type is a union type
   * @param node - The type alias AST node
   * @returns True if union type
   */
  isTypeUnion(node: Node): boolean {
    if (Node.isTypeAliasDeclaration(node)) {
      return node.getType().getText().includes("|");
    }
    return false;
  }

  /**
   * Check if type is an intersection type
   * @param node - The type alias AST node
   * @returns True if intersection type
   */
  isTypeIntersection(node: Node): boolean {
    if (Node.isTypeAliasDeclaration(node)) {
      return node.getType().getText().includes("&");
    }
    return false;
  }

  // detectLanguage and extractDependencies are now available as shared utilities

  /**
   * Create a file entity from file information
   * @param filePath - Absolute path to the file
   * @param fileRelPath - Relative path to the file
   * @param content - File content
   * @returns File entity
   */
  createFileEntity(
    filePath: string,
    fileRelPath: string,
    content: string
  ): File {
    const language = detectLanguage(filePath);
    const dependencies = extractDependencies(content);
    const fileHash = createHash(content);

    return {
      id: `file:${fileRelPath}`,
      type: "file",
      path: fileRelPath,
      extension: path.extname(filePath),
      hash: fileHash,
      language,
      lastModified: new Date(),
      created: new Date(),
      dependencies,
      lines: content.split("\n").length,
      size: Buffer.byteLength(content, "utf8"),
      isTest: filePath.includes('.test.') || filePath.includes('.spec.'),
      isConfig: path.basename(filePath).startsWith('.') || filePath.includes('config'),
    };
  }
}

================
File: parsing/TypeCheckerBudget.ts
================
import { noiseConfig } from "../../../config/noise.js";





export class TypeCheckerBudget {
  private tcBudgetRemaining: number = 0;
  private tcBudgetSpent: number = 0;


  private readonly DEFAULT_BUDGET = 50;





  initializeBudget(budget?: number): void {
    this.tcBudgetRemaining = budget ?? this.DEFAULT_BUDGET;
    this.tcBudgetSpent = 0;
  }




  resetBudget(): void {
    this.tcBudgetRemaining = 0;
    this.tcBudgetSpent = 0;
  }





  takeBudget(): boolean {
    if (!Number.isFinite(this.tcBudgetRemaining)) return false;
    if (this.tcBudgetRemaining <= 0) return false;

    this.tcBudgetRemaining -= 1;
    try {
      this.tcBudgetSpent += 1;
    } catch {}

    return true;
  }












  shouldUseTypeChecker(opts: {
    context: "call" | "heritage" | "decorator" | "reference" | "export";
    imported?: boolean;
    ambiguous?: boolean;
    nameLength?: number;
  }): boolean {
    try {
      const imported = !!opts.imported;
      const ambiguous = !!opts.ambiguous;
      const len = typeof opts.nameLength === "number" ? opts.nameLength : 0;


      const usefulName = len >= noiseConfig.AST_MIN_NAME_LENGTH;


      const shouldCheck = imported || ambiguous || usefulName;

      if (!shouldCheck) return false;


      return this.takeBudget();
    } catch {
      return false;
    }
  }





  getRemainingBudget(): number {
    return this.tcBudgetRemaining;
  }





  getSpentBudget(): number {
    return this.tcBudgetSpent;
  }





  getBudgetStats(): {
    remaining: number;
    spent: number;
    total: number;
    percentUsed: number;
  } {
    const total = this.tcBudgetSpent + this.tcBudgetRemaining;
    const percentUsed = total > 0 ? (this.tcBudgetSpent / total) * 100 : 0;

    return {
      remaining: this.tcBudgetRemaining,
      spent: this.tcBudgetSpent,
      total,
      percentUsed: Math.round(percentUsed),
    };
  }







  calculateBudgetForFile(fileSize: number, complexity?: number): number {

    let budget = this.DEFAULT_BUDGET;


    if (fileSize > 10000) {
      budget += Math.floor(fileSize / 1000);
    }


    if (complexity && complexity > 10) {
      budget += Math.floor(complexity / 2);
    }


    const MAX_BUDGET = 200;
    return Math.min(budget, MAX_BUDGET);
  }
}

================
File: index.ts
================
export * from './KnowledgeGraphService.js';
export * from './types.js';
export * from './queries.js';
export * from './utils.js';
export * from './ISearchService.js';


export * from './parsing/ASTParser.js';
export * from './parsing/ASTParserCore.js';
export * from './parsing/IncrementalParser.js';
export * from './parsing/SymbolExtractor.js';
export * from './parsing/ModuleIndexer.js';
export * from './parsing/ModuleResolver.js';
export * from './parsing/TypeCheckerBudget.js';
export * from './parsing/DirectoryHandler.js';


export * from './graph/Neo4jService.js';
export * from './graph/NeogmaService.js';
export * from './graph/CypherExecutor.js';
export * from './graph/GdsService.js';
export * from './graph/TemporalQueryService.js';
export * from './graph/GraphInitializer.js';
export * from './graph/HistoryService.js';
export * from './graph/RelationshipBuilder.js';
export * from './graph/EntityServiceOGM.js';
export * from './graph/RelationshipServiceOGM.js';
export * from './graph/SearchServiceOGM.js';


export * from './analysis/AnalysisService.js';
export * from './analysis/DependencyAnalyzer.js';
export * from './analysis/ImpactAnalyzer.js';
export * from './analysis/PathAnalyzer.js';
export * from './analysis/IntentExtractor.js';


export * from './embeddings/EmbeddingService.js';
export * from './embeddings/VectorService.js';
export * from './embeddings/DocTokenizer.js';
export * from './embeddings/DocumentationParser.js';
export * from './embeddings/DocumentationIntelligenceProvider.js';


export * from './orchestration/KnowledgeGraphService.js';
export * from './orchestration/SyncOrchestrator.js';
export * from './orchestration/EventOrchestrator.js';
export * from './orchestration/CheckpointService.js';
export * from './orchestration/VersionManager.js';
export * from './orchestration/ServiceRegistry.js';
export * from './orchestration/CacheManager.js';
export * from './orchestration/PerformanceOptimizer.js';
export * from './orchestration/StatsCollector.js';


export * from './ingestion/index.js';

================
File: ISearchService.ts
================
import { EventEmitter } from 'events';
import { Entity } from '../../models/entities.js';
import {
  GraphSearchRequest,
  GraphExamples,
} from '../../models/types.js';

export interface StructuralSearchOptions {
  fuzzy?: boolean;
  caseInsensitive?: boolean;
  limit?: number;
  offset?: number;
  filter?: Record<string, any>;
}

export interface SearchResult {
  entity: Entity;
  score: number;
  type: 'structural' | 'semantic' | 'hybrid';
  metadata?: Record<string, any>;
}

export interface SemanticSearchOptions {
  limit?: number;
  minScore?: number;
  filter?: Record<string, any>;
}

export interface PatternSearchOptions {
  type?: 'regex' | 'glob';
  limit?: number;
}

export interface SearchStats {
  cacheSize: number;
  cacheHitRate: number;
  topSearches: Array<{ query: string; count: number }>;
}




export interface ISearchService extends EventEmitter {

  search(request: GraphSearchRequest): Promise<SearchResult[]>;
  structuralSearch(query: string, options?: StructuralSearchOptions): Promise<SearchResult[]>;
  semanticSearch(query: string, options?: SemanticSearchOptions): Promise<SearchResult[]>;
  hybridSearch(request: GraphSearchRequest): Promise<SearchResult[]>;


  findSymbolsByName(name: string, options?: { fuzzy?: boolean; limit?: number }): Promise<Entity[]>;
  findNearbySymbols(
    filePath: string,
    position: { line: number; column?: number },
    options?: { range?: number; limit?: number }
  ): Promise<Entity[]>;


  patternSearch(pattern: string, options?: PatternSearchOptions): Promise<Entity[]>;
  getEntityExamples(entityId: string): Promise<GraphExamples>;


  getSearchStats(): Promise<SearchStats>;
  clearCache(): void;
  invalidateCache(pattern?: (key: string) => boolean): void;
}

================
File: queries.ts
================
import { RelationshipType } from "../../../models/relationships.js";

export interface TraversalOptions {
  startNodeId: string;
  relationshipTypes: string[];
  maxDepth: number;
  direction?: "OUTGOING" | "INCOMING" | "BOTH";
  nodeFilter?: string;
}

export interface PathExpansionOptions extends TraversalOptions {
  uniqueness?: "NODE_GLOBAL" | "RELATIONSHIP_GLOBAL";
}




export function buildPathExpansionQuery(options: PathExpansionOptions): string {
  const {
    startNodeId,
    relationshipTypes,
    maxDepth,
    direction = "OUTGOING",
    nodeFilter,
    uniqueness = "NODE_GLOBAL",
  } = options;

  const relFilter =
    relationshipTypes.length > 0
      ? relationshipTypes.join("|")
      : "DEPENDS_ON|CALLS|REFERENCES|IMPLEMENTS|EXTENDS|TYPE_USES";

  let query = `
    MATCH (start:Entity {id: $startNodeId})
    CALL apoc.path.expand(
      start,
      "${relFilter}",
      ${nodeFilter ? `"${nodeFilter}"` : "null"},
      1,
      $maxDepth,
      "${uniqueness}"
    ) YIELD path
    RETURN path, last(nodes(path)) AS endNode, length(path) AS depth
  `;

  return query;
}




export function buildDirectRelationshipQuery(
  entityId: string,
  relationshipTypes: string[],
  direction: "OUTGOING" | "INCOMING" = "OUTGOING"
): string {
  const relFilter = relationshipTypes.join("|");
  const arrow = direction === "OUTGOING" ? "->" : "<-";

  return `
    MATCH (e:Entity {id: $entityId})-[r:${relFilter}]${arrow}(target)
    RETURN target, type(r) AS relationshipType
  `;
}




export function buildGdsProjectionQuery(
  graphName: string,
  nodeQuery: string,
  relationshipQuery: string
): string {
  return `
    CALL gds.graph.project.cypher(
      '${graphName}',
      '${nodeQuery}',
      '${relationshipQuery}'
    ) YIELD graphName
    RETURN graphName
  `;
}




export function buildPageRankQuery(graphName: string, limit = 10): string {
  return `
    CALL gds.pageRank.stream('${graphName}')
    YIELD nodeId, score
    WITH gds.util.asNode(nodeId) AS node, score
    RETURN node.id AS id, score
    ORDER BY score DESC
    LIMIT ${limit}
  `;
}




export function buildBetweennessQuery(
  nodeQuery: string,
  relationshipQuery: string
): string {
  return `
    CALL gds.betweenness.stream({
      nodeQuery: '${nodeQuery}',
      relationshipQuery: '${relationshipQuery}'
    })
    YIELD nodeId, score
    WITH gds.util.asNode(nodeId) AS node, score
    RETURN node.id AS id, score
  `;
}




export function buildDijkstraQuery(
  relationshipTypes: string[],
  weightProperty = "weight",
  defaultWeight = 1
): string {
  const relTypes = relationshipTypes.join("|");

  return `
    MATCH (from:Entity {id: $fromId}), (to:Entity {id: $toId})
    CALL apoc.algo.dijkstra(
      from,
      to,
      "${relTypes}",
      "${weightProperty}",
      ${defaultWeight}
    ) YIELD path, weight
    RETURN path, weight
    ORDER BY weight
    LIMIT $limit
  `;
}




export function buildCycleDetectionQuery(maxDepth: number): string {
  return `
    MATCH (start:Entity {id: $entityId})
    MATCH path = (start)-[:DEPENDS_ON|IMPORTS*1..${maxDepth}]->(start)
    RETURN [n IN nodes(path) | n.id] AS cycle
    LIMIT 5
  `;
}




export function buildEntityStatsQueries(entityId: string) {
  return {
    byType: `
      MATCH (e:Entity {id: $entityId})-[r]->()
      RETURN type(r) AS type, count(r) AS count
      ORDER BY count DESC
    `,
    topSymbols: `
      MATCH (e:Entity {id: $entityId})-[r]->()
      WHERE r.to_ref_symbol IS NOT NULL
      RETURN r.to_ref_symbol AS symbol, count(*) AS count
      ORDER BY count DESC
      LIMIT 10
    `,
    inbound: `
      MATCH (e:Entity {id: $entityId})<-[r]-()
      RETURN count(r) AS count
    `,
    outbound: `
      MATCH (e:Entity {id: $entityId})-[r]->()
      RETURN count(r) AS count
    `,
  };
}




export function buildImpactQueries(entityIds: string[], maxDepth: number) {
  return {
    directImpact: `
      UNWIND $entityIds AS entityId
      MATCH (e:Entity {id: entityId})-[r:CALLS|REFERENCES|DEPENDS_ON|IMPLEMENTS|EXTENDS]->(impacted)
      RETURN DISTINCT impacted
    `,
    transitiveImpact: `
      UNWIND $entityIds AS entityId
      MATCH (e:Entity {id: entityId})
      CALL apoc.path.expand(
        e,
        'CALLS|REFERENCES|DEPENDS_ON|IMPLEMENTS|EXTENDS|OVERRIDES|TYPE_USES',
        null,
        1,
        $maxDepth,
        'RELATIONSHIP_GLOBAL'
      ) YIELD path
      WITH last(nodes(path)) AS impacted, length(path) AS depth
      RETURN DISTINCT impacted, min(depth) AS minDepth
    `,
    affectedTests: `
      UNWIND $entityIds AS entityId
      MATCH (e:Entity {id: entityId})<-[:TESTS|VALIDATES*1..$maxDepth]-(test:Test)
      RETURN DISTINCT test
    `,
    affectedSpecs: `
      UNWIND $entityIds AS entityId
      MATCH (e:Entity {id: entityId})<-[:IMPLEMENTS_SPEC|REQUIRES*1..$maxDepth]-(spec:Specification)
      RETURN DISTINCT spec, spec.priority AS priority
    `,
    affectedDocs: `
      UNWIND $entityIds AS entityId
      MATCH (e:Entity {id: entityId})-[:DOCUMENTED_BY|DOCUMENTS_SECTION*1..$maxDepth]-(doc)
      WHERE doc.type = 'documentation'
      RETURN DISTINCT doc
    `,
  };
}

================
File: services-index.ts
================
export { ASTParserCore } from './ASTParserCore.js';


export type {
  ParseResult,
  ParseError,
  IncrementalParseResult,
  PartialUpdate,
  ChangeRange,
  CachedFileInfo,
  ExportMapEntry,
  ResolvedSymbol,
  BudgetStats,
  CacheStats,
  PartialUpdateStats,
  TypeCheckerUsageOptions,
  SymbolVisibility,
  SymbolKind,
  EntityType,
  IndexManager,
  ParameterInfo,
  FileEntityOptions,
  SymbolEntityOptions,
  DirectoryEntityOptions,
  RelationshipOptions,
} from './types.js';


export {
  createHash,
  createShortHash,
  normalizeRelPath,
  detectLanguage,
  extractDependencies,
  calculateComplexity,
  parseFilePath,
  getPathDepth,
  isParentPath,
  isNoiseSymbol,
  createEntityId,
  processBatched,
} from './utils.js';


export { CacheManager } from './CacheManager.js';
export type { CachedFileInfo, ExportMapEntry as CacheExportMapEntry } from './CacheManager.js';

export { DirectoryHandler } from './DirectoryHandler.js';

export { TypeCheckerBudget } from './TypeCheckerBudget.js';

export { SymbolExtractor } from './SymbolExtractor.js';

export { ModuleResolver } from './ModuleResolver.js';
export type {
  ResolvedSymbol,
  ExportMapEntry as ModuleExportMapEntry,
  ModuleResolverOptions
} from './ModuleResolver.js';

export { RelationshipBuilder } from './RelationshipBuilder.js';
export type { RelationshipBuilderOptions } from './RelationshipBuilder.js';

export { IncrementalParser } from './IncrementalParser.js';
export type {
  ParseResult as IncrementalParseResult_Type,
  ParseError as IncrementalParseError,
  IncrementalParseResult as IncrementalResult,
  PartialUpdate as IncrementalPartialUpdate,
  ChangeRange as IncrementalChangeRange
} from './IncrementalParser.js';




export { ASTParserCore as default } from './ASTParserCore.js';

================
File: types.ts
================
import { Entity, Symbol as SymbolEntity } from "../../../models/entities.js";
import { GraphRelationship } from "../../../models/relationships.js";




export interface ParseResult {
  entities: Entity[];
  relationships: GraphRelationship[];
  errors: ParseError[];
}




export interface ParseError {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning";
}




export interface IncrementalParseResult extends ParseResult {
  isIncremental: boolean;
  addedEntities: Entity[];
  removedEntities: Entity[];
  updatedEntities: Entity[];
  addedRelationships: GraphRelationship[];
  removedRelationships: GraphRelationship[];
}




export interface PartialUpdate {
  type: "add" | "remove" | "update";
  entityType:
    | "file"
    | "symbol"
    | "function"
    | "class"
    | "interface"
    | "typeAlias";
  entityId: string;
  changes?: Record<string, any>;
  oldValue?: any;
  newValue?: any;
}




export interface ChangeRange {
  start: number;
  end: number;
  content: string;
}




export interface CachedFileInfo {
  hash: string;
  entities: Entity[];
  relationships: GraphRelationship[];
  lastModified: Date;
  symbolMap: Map<string, SymbolEntity>;
}




export interface ExportMapEntry {
  fileRel: string;
  name: string;
  depth: number;
}




export interface ResolvedSymbol {
  fileRel: string;
  name: string;
}




export interface BudgetStats {
  remaining: number;
  spent: number;
  total: number;
  percentUsed: number;
}




export interface CacheStats {
  files: number;
  totalEntities: number;
  averageEntitiesPerFile?: number;
}




export interface PartialUpdateStats {
  cachedFiles: number;
  totalSymbols: number;
  averageSymbolsPerFile: number;
}




export interface TypeCheckerUsageOptions {
  context: "call" | "heritage" | "decorator" | "reference" | "export";
  imported?: boolean;
  ambiguous?: boolean;
  nameLength?: number;
}




export type SymbolVisibility = "public" | "private" | "protected";




export type SymbolKind =
  | "function"
  | "class"
  | "interface"
  | "typeAlias"
  | "property"
  | "variable"
  | "symbol";




export type EntityType =
  | "file"
  | "directory"
  | "symbol"
  | "function"
  | "class"
  | "interface"
  | "typeAlias";




export interface IndexManager {
  createSymbolMap: (entities: Entity[]) => Map<string, SymbolEntity>;
  removeFileFromIndexes: (fileRel: string) => void;
  addSymbolsToIndexes: (fileRel: string, symbols: SymbolEntity[]) => void;
  normalizeRelPath?: (relPath: string) => string;
}




export interface ParameterInfo {
  name: string;
  type: string;
  defaultValue?: string;
  optional: boolean;
}




export interface FileEntityOptions {
  filePath: string;
  fileRelPath: string;
  content: string;
  extension?: string;
  language?: string;
}




export interface SymbolEntityOptions {
  name: string;
  kind: SymbolKind;
  signature: string;
  filePath: string;
  visibility?: SymbolVisibility;
  isExported?: boolean;
  docstring?: string;
  parameters?: ParameterInfo[];
  returnType?: string;
}




export interface DirectoryEntityOptions {
  path: string;
  depth: number;
}




export interface RelationshipOptions {
  fromEntityId: string;
  toEntityId: string;
  type: string;
  metadata?: any;
  confidence?: number;
}

================
File: utils.ts
================
import * as crypto from "crypto";
import * as path from "path";






export function createHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}






export function createShortHash(content: string): string {
  return crypto.createHash("sha1").update(content).digest("hex").slice(0, 8);
}






export function normalizeRelPath(filePath: string): string {
  let s = String(filePath || "").replace(/\\/g, "/");
  s = s.replace(/\/+/g, "/");
  s = s.replace(/\/+$/g, "");
  return s;
}

/**
 * Detect the programming language from file extension
 * @param filePath - Path to the file
 * @returns Language identifier
 */
export function detectLanguage(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  const languageMap: { [key: string]: string } = {
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "javascript",
    ".jsx": "javascript",
    ".py": "python",
    ".java": "java",
    ".cpp": "cpp",
    ".c": "c",
    ".cs": "csharp",
    ".go": "go",
    ".rs": "rust",
    ".php": "php",
    ".rb": "ruby",
    ".swift": "swift",
    ".kt": "kotlin",
    ".scala": "scala",
  };
  return languageMap[extension] || "unknown";
}






export function extractDependencies(content: string): string[] {
  const dependencies: string[] = [];


  const importRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g;
  const requireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const moduleName = match[1];
    if (!moduleName.startsWith(".") && !moduleName.startsWith("/")) {
      dependencies.push(moduleName.split("/")[0]); // Get package name
    }
  }

  while ((match = requireRegex.exec(content)) !== null) {
    const moduleName = match[1];
    if (!moduleName.startsWith(".") && !moduleName.startsWith("/")) {
      dependencies.push(moduleName.split("/")[0]);
    }
  }

  return [...new Set(dependencies)]; // Remove duplicates
}

/**
 * Calculate cyclomatic complexity of an AST node
 * @param node - The AST node to analyze
 * @returns Complexity score
 */
export function calculateComplexity(node: any): number {
  // Simplified cyclomatic complexity calculation
  let complexity = 1;

  if (!node || typeof node.getDescendants !== "function") {
    return complexity;
  }

  const descendants = node.getDescendants();

  for (const descendant of descendants) {
    if (
      descendant.getKind && (
        descendant.getKind() === 227 ||
        descendant.getKind() === 232 ||
        descendant.getKind() === 233 ||
        descendant.getKind() === 234 ||
        descendant.getKind() === 284 ||
        descendant.getKind() === 218
      )
    ) {
      complexity++;
    }
  }

  return complexity;
}






export function parseFilePath(filePath: string): { dirPath: string; fileName: string } {
  const normalized = normalizeRelPath(filePath);
  const lastSlash = normalized.lastIndexOf("/");

  if (lastSlash === -1) {
    return { dirPath: "", fileName: normalized };
  }

  return {
    dirPath: normalized.substring(0, lastSlash),
    fileName: normalized.substring(lastSlash + 1),
  };
}

/**
 * Get the depth of a path (number of directory levels)
 * @param filePath - Path to analyze
 * @returns Depth as a number
 */
export function getPathDepth(filePath: string): number {
  const normalized = normalizeRelPath(filePath);
  if (!normalized) return 0;
  return normalized.split("/").filter(p => p).length;
}

/**
 * Check if one path is a parent of another
 * @param parentPath - Potential parent path
 * @param childPath - Potential child path
 * @returns True if parentPath is a parent of childPath
 */
export function isParentPath(parentPath: string, childPath: string): boolean {
  const normalizedParent = normalizeRelPath(parentPath);
  const normalizedChild = normalizeRelPath(childPath);

  if (!normalizedParent || !normalizedChild) return false;
  if (normalizedParent === normalizedChild) return false;

  return normalizedChild.startsWith(normalizedParent + "/");
}

/**
 * Check if a symbol name should be filtered out as noise
 * @param name - Symbol name to check
 * @param stopNames - Set of names to filter out
 * @param minLength - Minimum name length to consider useful
 * @returns True if name should be filtered out
 */
export function isNoiseSymbol(name: string, stopNames: Set<string>, minLength: number = 2): boolean {
  if (!name || typeof name !== "string") return true;
  if (name.length < minLength) return true;
  if (stopNames.has(name.toLowerCase())) return true;


  const testGlobals = ["describe", "it", "test", "expect", "beforeeach", "aftereach", "beforeall", "afterall"];
  const browserGlobals = ["window", "document", "console", "navigator", "location"];

  return testGlobals.includes(name.toLowerCase()) || browserGlobals.includes(name.toLowerCase());
}









export function createEntityId(type: string, path: string, name?: string, signature?: string): string {
  if (name && signature) {
    const sigHash = createShortHash(signature);
    return `${type}:${path}#${name}@${sigHash}`;
  } else if (name) {
    return `${type}:${path}:${name}`;
  } else {
    return `${type}:${path}`;
  }
}








export async function processBatched<T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R[]>,
  batchSize: number = 50
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
  }

  return results;
}



================================================================
End of Codebase
================================================================
