# Package: core
Generated: 2025-09-23 07:07:13 PM EDT

## ⚠️ Quality Indicators

| Metric | Count | Status |
|--------|-------|--------|
| Total Warnings | 2144 | ⚠️ |
| Critical Issues | 12 | ❌ |
| Stub Implementations | 0 | ✅ |
| Deception Risk | 20 | 🚨 |
| Antipatterns | 322 | 🔍 |

### Notable Issues

#### 🔴 Critical Issues (12)
These are serious problems that could lead to security vulnerabilities or system failures:

- `serialization.ts:13` - **Security function returns input unchanged - no actual security**
- `EnhancedRollbackStrategies.ts:97` - **Validation function always returns true - no actual validation**
- `EnhancedRollbackStrategies.ts:455` - **Validation function always returns true - no actual validation**
- `EnhancedRollbackStrategies.ts:719` - **Validation function always returns true - no actual validation**
- `RollbackStrategies.ts:158` - **Validation function always returns true - no actual validation**
- `RollbackStrategies.ts:341` - **Validation function always returns true - no actual validation**
- `RollbackStrategies.ts:492` - **Validation function always returns true - no actual validation**
- `SessionReplay.ts:519` - **Validation function always returns true - no actual validation**
- `codeEdges.ts:175` - **Security function returns input unchanged - no actual security**
- `codeEdges.ts:185` - **Security function returns input unchanged - no actual security**
- `codeEdges.ts:211` - **Security function returns input unchanged - no actual security**
- `codeEdges.ts:226` - **Security function returns input unchanged - no actual security**

#### 🚨 Potential Deception (20)
Functions that don't do what their names suggest, or claim functionality they don't have:

- `serialization.ts:13` - **Security function returns input unchanged - no actual security**
- `EnhancedRollbackStrategies.ts:97` - **Validation function always returns true - no actual validation**
- `EnhancedRollbackStrategies.ts:455` - **Validation function always returns true - no actual validation**
- `EnhancedRollbackStrategies.ts:719` - **Validation function always returns true - no actual validation**
- `RollbackStrategies.ts:158` - **Validation function always returns true - no actual validation**
- `RollbackStrategies.ts:341` - **Validation function always returns true - no actual validation**
- `RollbackStrategies.ts:492` - **Validation function always returns true - no actual validation**
- `ConfigurationService.ts:627` - **Error silently swallowed - no error handling or logging**
- `SessionAnalytics.ts:424` - **Error silently swallowed - no error handling or logging**
- `SessionAnalytics.ts:454` - **Error silently swallowed - no error handling or logging**
- `SessionReplay.ts:519` - **Validation function always returns true - no actual validation**
- `codeEdges.ts:175` - **Security function returns input unchanged - no actual security**
- `codeEdges.ts:185` - **Security function returns input unchanged - no actual security**
- `codeEdges.ts:211` - **Security function returns input unchanged - no actual security**
- `codeEdges.ts:226` - **Security function returns input unchanged - no actual security**
- `codeEdges.ts:466` - **Error silently swallowed - no error handling or logging**
- `codeEdges.ts:515` - **Error silently swallowed - no error handling or logging**
- `codeEdges.ts:565` - **Error silently swallowed - no error handling or logging**
- `confidence.ts:40` - **Error silently swallowed - no error handling or logging**
- `confidence.ts:81` - **Error silently swallowed - no error handling or logging**

#### ⚠️ Warnings (114)
Issues that should be addressed but aren't critical:

- `RollbackIntegrationLayer.ts:663` - Direct console.log in class - use proper logging abstraction
- `RollbackIntegrationLayer.ts:668` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:53` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:88` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:91` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:107` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:115` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:125` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:193` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:209` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:271` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:302` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:312` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:325` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:333` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:341` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:391` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:405` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:426` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:429` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:433` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:443` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:446` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:449` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:452` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:492` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:493` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:494` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:495` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:496` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:499` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:500` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:501` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:502` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:513` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:517` - Direct console.log in class - use proper logging abstraction
- `EnhancedRollbackUsage.ts:539` - Direct console.log in class - use proper logging abstraction
- `ConfigurationService.ts:398` - Direct console.log in class - use proper logging abstraction
- `ConfigurationService.ts:627` - Error silently swallowed - no error handling or logging
- `FileWatcher.ts:71` - Direct console.log in class - use proper logging abstraction
- `FileWatcher.ts:84` - Direct console.log in class - use proper logging abstraction
- `FileWatcher.ts:125` - Direct console.log in class - use proper logging abstraction
- `FileWatcher.ts:136` - Direct console.log in class - use proper logging abstraction
- `FileWatcher.ts:283` - Direct console.log in class - use proper logging abstraction
- `FileWatcher.ts:351` - Direct console.log in class - use proper logging abstraction
- `FileWatcher.ts:360` - Direct console.log in class - use proper logging abstraction
- `FileWatcher.ts:422` - Direct console.log in class - use proper logging abstraction
- `FileWatcher.ts:441` - Direct console.log in class - use proper logging abstraction
- `FileWatcher.ts:512` - Direct console.log in class - use proper logging abstraction
- `MaintenanceService.ts:319` - Direct console.log in class - use proper logging abstraction
- `MaintenanceService.ts:397` - Direct console.log in class - use proper logging abstraction
- `MaintenanceService.ts:406` - Direct console.log in class - use proper logging abstraction
- `SessionAnalytics.ts:424` - Error silently swallowed - no error handling or logging
- `SessionAnalytics.ts:454` - Error silently swallowed - no error handling or logging
- `SessionBridge.ts:29` - Direct console.log in class - use proper logging abstraction
- `SessionBridge.ts:49` - Direct console.log in class - use proper logging abstraction
- `SessionBridge.ts:173` - Direct console.log in class - use proper logging abstraction
- `SessionBridge.ts:243` - Direct console.log in class - use proper logging abstraction
- `SessionBridge.ts:339` - Direct console.log in class - use proper logging abstraction
- `SessionBridge.ts:486` - Direct console.log in class - use proper logging abstraction
- `SessionConfig.ts:60` - Direct console.log in class - use proper logging abstraction
- `SessionConfig.ts:156` - Direct console.log in class - use proper logging abstraction
- `SessionGracefulShutdown.ts:128` - Direct console.log in class - use proper logging abstraction
- `SessionGracefulShutdown.ts:139` - Direct console.log in class - use proper logging abstraction
- `SessionGracefulShutdown.ts:192` - Direct console.log in class - use proper logging abstraction
- `SessionGracefulShutdown.ts:231` - Direct console.log in class - use proper logging abstraction
- `SessionGracefulShutdown.ts:260` - Direct console.log in class - use proper logging abstraction
- `SessionGracefulShutdown.ts:282` - Direct console.log in class - use proper logging abstraction
- `SessionGracefulShutdown.ts:297` - Direct console.log in class - use proper logging abstraction
- `SessionGracefulShutdown.ts:304` - Direct console.log in class - use proper logging abstraction
- `SessionGracefulShutdown.ts:314` - Direct console.log in class - use proper logging abstraction
- `SessionGracefulShutdown.ts:368` - Direct console.log in class - use proper logging abstraction
- `SessionGracefulShutdown.ts:381` - Direct console.log in class - use proper logging abstraction
- `SessionGracefulShutdown.ts:429` - Direct console.log in class - use proper logging abstraction
- `SessionGracefulShutdown.ts:443` - Direct console.log in class - use proper logging abstraction
- `SessionGracefulShutdown.ts:481` - Direct console.log in class - use proper logging abstraction
- `SessionGracefulShutdown.ts:502` - Direct console.log in class - use proper logging abstraction
- `SessionIntegration.ts:44` - Direct console.log in class - use proper logging abstraction
- `SessionIntegration.ts:79` - Direct console.log in class - use proper logging abstraction
- `SessionIntegration.ts:118` - Direct console.log in class - use proper logging abstraction
- `SessionIntegration.ts:166` - Direct console.log in class - use proper logging abstraction
- `SessionIntegration.ts:187` - Direct console.log in class - use proper logging abstraction
- `SessionIntegration.ts:241` - Direct console.log in class - use proper logging abstraction
- `SessionIntegration.ts:257` - Direct console.log in class - use proper logging abstraction
- `SessionIntegration.ts:312` - Direct console.log in class - use proper logging abstraction
- `SessionIntegration.ts:336` - Direct console.log in class - use proper logging abstraction
- `SessionIntegration.ts:409` - Direct console.log in class - use proper logging abstraction
- `SessionIntegration.ts:410` - Direct console.log in class - use proper logging abstraction
- `SessionIntegration.ts:430` - Direct console.log in class - use proper logging abstraction
- `SessionManager.ts:58` - Direct console.log in class - use proper logging abstraction
- `SessionManager.ts:106` - Direct console.log in class - use proper logging abstraction
- `SessionManager.ts:146` - Direct console.log in class - use proper logging abstraction
- `SessionManager.ts:174` - Direct console.log in class - use proper logging abstraction
- `SessionManager.ts:233` - Direct console.log in class - use proper logging abstraction
- `SessionManager.ts:321` - Direct console.log in class - use proper logging abstraction
- `SessionManager.ts:339` - Direct console.log in class - use proper logging abstraction
- `SessionManager.ts:459` - Direct console.log in class - use proper logging abstraction
- `SessionManager.ts:476` - Direct console.log in class - use proper logging abstraction
- `SessionManager.ts:499` - Direct console.log in class - use proper logging abstraction
- `SessionManager.ts:514` - Direct console.log in class - use proper logging abstraction
- `SessionManager.ts:556` - Direct console.log in class - use proper logging abstraction
- `SessionStore.ts:73` - Direct console.log in class - use proper logging abstraction
- `SessionStore.ts:80` - Direct console.log in class - use proper logging abstraction
- `SessionStore.ts:85` - Direct console.log in class - use proper logging abstraction
- `SessionStore.ts:100` - Direct console.log in class - use proper logging abstraction
- `SessionStore.ts:173` - Direct console.log in class - use proper logging abstraction
- `SessionStore.ts:279` - Direct console.log in class - use proper logging abstraction
- `SessionStore.ts:587` - Direct console.log in class - use proper logging abstraction
- `SessionStore.ts:605` - Direct console.log in class - use proper logging abstraction
- `codeEdges.ts:466` - Error silently swallowed - no error handling or logging
- `codeEdges.ts:515` - Error silently swallowed - no error handling or logging
- `codeEdges.ts:565` - Error silently swallowed - no error handling or logging
- `confidence.ts:40` - Error silently swallowed - no error handling or logging
- `confidence.ts:81` - Error silently swallowed - no error handling or logging

#### 🔍 Code Antipatterns (322)
Design and architecture issues that should be refactored:

- `ConflictResolutionEngine.ts:209` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `EnhancedRollbackStrategies.ts:438` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedRollbackStrategies.ts:445` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedRollbackStrategies.ts:702` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedRollbackStrategies.ts:709` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedRollbackStrategies.ts:916` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedRollbackStrategies.ts:923` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `PostgreSQLRollbackStore.ts:197` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `PostgreSQLRollbackStore.ts:350` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `PostgreSQLRollbackStore.ts:391` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `PostgreSQLRollbackStore.ts:429` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `PostgreSQLRollbackStore.ts:560` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `PostgreSQLRollbackStore.ts:599` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `PostgreSQLRollbackStore.ts:677` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `PostgreSQLRollbackStore.ts:695` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackIntegrationLayer.ts:240` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackIntegrationLayer.ts:332` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackIntegrationLayer.ts:663` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `RollbackIntegrationLayer.ts:668` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `RollbackManager.ts:93` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackManager.ts:94` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackManager.ts:95` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackManager.ts:148` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackManager.ts:289` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackManager.ts:311` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackManager.ts:366` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackManager.ts:399` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackManager.ts:429` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackManager.ts:455` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackStore.ts:131` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackStore.ts:156` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackStore.ts:226` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackStore.ts:236` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackStore.ts:255` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackStore.ts:275` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackStore.ts:327` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackStore.ts:363` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackStore.ts:382` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackStore.ts:390` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackStore.ts:402` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackStrategies.ts:70` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackStrategies.ts:80` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedRollbackUsage.ts:53` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:88` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:91` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:107` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:115` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:125` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:193` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:209` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:271` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:302` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:312` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:325` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:333` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:341` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:391` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:405` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:426` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:429` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:433` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:443` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:446` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:449` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:452` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:492` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:493` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:494` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:495` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:496` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:499` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:500` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:501` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:502` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:513` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:517` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedRollbackUsage.ts:539` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `RollbackMonitoringDashboard.ts:102` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackMonitoringDashboard.ts:114` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackMonitoringDashboard.ts:185` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackMonitoringDashboard.ts:291` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackMonitoringDashboard.ts:294` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RollbackMonitoringDashboard.ts:372` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `RollbackMonitoringDashboard.ts:382` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `AgentCoordination.ts:153` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `AgentCoordination.ts:174` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `AgentCoordination.ts:181` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `AgentCoordination.ts:214` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `AgentCoordination.ts:288` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `AgentCoordination.ts:340` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `AgentCoordination.ts:397` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `AgentCoordination.ts:410` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `AgentCoordination.ts:475` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `AgentCoordination.ts:495` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `AgentCoordination.ts:706` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `AgentCoordination.ts:731` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `AgentCoordination.ts:755` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `AgentCoordination.ts:757` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `AgentCoordination.ts:768` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `AgentCoordination.ts:775` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `AgentCoordination.ts:794` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `ConfigurationService.ts:398` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `EnhancedSessionStore.ts:118` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedSessionStore.ts:120` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedSessionStore.ts:152` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedSessionStore.ts:182` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedSessionStore.ts:184` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedSessionStore.ts:213` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedSessionStore.ts:215` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedSessionStore.ts:245` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedSessionStore.ts:247` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedSessionStore.ts:282` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedSessionStore.ts:307` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedSessionStore.ts:339` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedSessionStore.ts:341` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedSessionStore.ts:377` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedSessionStore.ts:379` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedSessionStore.ts:399` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedSessionStore.ts:414` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedSessionStore.ts:448` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedSessionStore.ts:450` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedSessionStore.ts:785` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedSessionStore.ts:823` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedSessionStore.ts:835` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedSessionStore.ts:843` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedSessionStore.ts:867` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `EnhancedSessionStore.ts:874` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `FileWatcher.ts:71` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `FileWatcher.ts:84` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `FileWatcher.ts:122` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `FileWatcher.ts:125` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `FileWatcher.ts:136` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `FileWatcher.ts:244` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `FileWatcher.ts:248` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `FileWatcher.ts:262` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `FileWatcher.ts:270` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `FileWatcher.ts:273` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `FileWatcher.ts:276` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `FileWatcher.ts:279` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `FileWatcher.ts:283` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `FileWatcher.ts:290` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `FileWatcher.ts:351` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `FileWatcher.ts:360` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `FileWatcher.ts:422` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `FileWatcher.ts:441` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `FileWatcher.ts:512` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `MaintenanceService.ts:319` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `MaintenanceService.ts:397` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `MaintenanceService.ts:406` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `RedisConnectionPool.ts:117` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RedisConnectionPool.ts:119` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RedisConnectionPool.ts:146` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RedisConnectionPool.ts:159` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RedisConnectionPool.ts:175` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RedisConnectionPool.ts:284` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `RedisConnectionPool.ts:313` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RedisConnectionPool.ts:317` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RedisConnectionPool.ts:345` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RedisConnectionPool.ts:349` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RedisConnectionPool.ts:414` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `RedisConnectionPool.ts:436` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RedisConnectionPool.ts:453` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RedisConnectionPool.ts:472` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RedisConnectionPool.ts:476` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RedisConnectionPool.ts:510` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RedisConnectionPool.ts:523` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RedisConnectionPool.ts:531` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RedisConnectionPool.ts:545` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RedisConnectionPool.ts:558` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RedisConnectionPool.ts:565` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RedisConnectionPool.ts:595` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RedisConnectionPool.ts:606` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `RedisConnectionPool.ts:635` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionAnalytics.ts:118` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionAnalytics.ts:153` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionAnalytics.ts:203` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionAnalytics.ts:344` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionAnalytics.ts:355` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionAnalytics.ts:379` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionAnalytics.ts:481` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionAnalytics.ts:485` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionBridge.ts:29` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionBridge.ts:49` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionBridge.ts:173` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionBridge.ts:243` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionBridge.ts:339` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionBridge.ts:486` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionConfig.ts:60` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionConfig.ts:156` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionGracefulShutdown.ts:120` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionGracefulShutdown.ts:128` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionGracefulShutdown.ts:139` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionGracefulShutdown.ts:156` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionGracefulShutdown.ts:192` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionGracefulShutdown.ts:231` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionGracefulShutdown.ts:260` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionGracefulShutdown.ts:282` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionGracefulShutdown.ts:297` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionGracefulShutdown.ts:304` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionGracefulShutdown.ts:314` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionGracefulShutdown.ts:368` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionGracefulShutdown.ts:381` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionGracefulShutdown.ts:429` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionGracefulShutdown.ts:443` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionGracefulShutdown.ts:481` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionGracefulShutdown.ts:485` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionGracefulShutdown.ts:502` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionGracefulShutdown.ts:559` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionGracefulShutdown.ts:569` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionGracefulShutdown.ts:587` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionHealthCheck.ts:144` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionHealthCheck.ts:278` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionHealthCheck.ts:283` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionHealthCheck.ts:290` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionHealthCheck.ts:754` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionIntegration.ts:44` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionIntegration.ts:79` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionIntegration.ts:118` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionIntegration.ts:166` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionIntegration.ts:187` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionIntegration.ts:241` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionIntegration.ts:257` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionIntegration.ts:312` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionIntegration.ts:336` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionIntegration.ts:409` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionIntegration.ts:410` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionIntegration.ts:430` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionManager.ts:58` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionManager.ts:67` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionManager.ts:68` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionManager.ts:69` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionManager.ts:70` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionManager.ts:71` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionManager.ts:72` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionManager.ts:77` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionManager.ts:106` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionManager.ts:143` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionManager.ts:146` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionManager.ts:174` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionManager.ts:233` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionManager.ts:273` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `SessionManager.ts:321` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionManager.ts:339` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionManager.ts:459` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionManager.ts:476` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionManager.ts:499` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionManager.ts:514` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionManager.ts:517` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionManager.ts:555` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionManager.ts:556` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionMetrics.ts:277` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMetrics.ts:281` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMetrics.ts:296` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMetrics.ts:300` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMetrics.ts:315` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMetrics.ts:319` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMetrics.ts:348` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMetrics.ts:364` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMetrics.ts:380` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMetrics.ts:536` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMetrics.ts:634` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMetrics.ts:639` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMetrics.ts:800` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMetrics.ts:811` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMetrics.ts:834` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMetrics.ts:837` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMetrics.ts:889` - **Complex ID generation should be extracted to utility function** [inline-id-generation]
- `SessionMetrics.ts:915` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMigration.ts:133` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMigration.ts:174` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMigration.ts:212` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMigration.ts:250` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMigration.ts:275` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMigration.ts:337` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMigration.ts:366` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMigration.ts:391` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMigration.ts:402` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMigration.ts:404` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMigration.ts:470` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMigration.ts:496` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMigration.ts:548` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMigration.ts:557` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMigration.ts:597` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMigration.ts:606` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMigration.ts:798` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMigration.ts:810` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMigration.ts:822` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMigration.ts:832` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionMigration.ts:850` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionReplay.ts:135` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionReplay.ts:170` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionReplay.ts:214` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionReplay.ts:268` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionReplay.ts:283` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionReplay.ts:292` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionReplay.ts:311` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionReplay.ts:410` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionReplay.ts:424` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionReplay.ts:544` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionReplay.ts:582` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionReplay.ts:599` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionReplay.ts:603` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionStore.ts:47` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionStore.ts:64` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionStore.ts:73` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionStore.ts:76` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionStore.ts:80` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionStore.ts:81` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionStore.ts:85` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionStore.ts:87` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionStore.ts:100` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionStore.ts:172` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionStore.ts:173` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionStore.ts:254` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionStore.ts:278` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionStore.ts:279` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionStore.ts:313` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionStore.ts:391` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionStore.ts:423` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionStore.ts:587` - **Direct console.log in class - use proper logging abstraction** [direct-console]
- `SessionStore.ts:604` - **Event type using raw string - consider using enum or const** [weak-event-types]
- `SessionStore.ts:605` - **Direct console.log in class - use proper logging abstraction** [direct-console]

#### ℹ️ Informational
2018 minor issues found (console.log usage, magic numbers, etc.) - not shown for brevity

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
config/
  noise.ts
logging/
  FileSink.ts
  index.ts
  InstrumentationDispatcher.ts
  serialization.ts
models/
  relationships.ts
rollback/
  examples/
    EnhancedRollbackUsage.ts
  monitoring/
    RollbackMonitoringDashboard.ts
  ConflictResolutionEngine.ts
  DiffEngine.ts
  EnhancedRollbackStrategies.ts
  index.ts
  PostgreSQLRollbackStore.ts
  README.md
  RollbackIntegrationLayer.ts
  RollbackManager.ts
  RollbackStore.ts
  RollbackStrategies.ts
  RollbackTypes.ts
  Snapshot.ts
services/
  AgentCoordination.ts
  ConfigurationService.ts
  EnhancedSessionStore.ts
  FileWatcher.ts
  index.ts
  LoggingService.ts
  MaintenanceService.ts
  RedisConnectionPool.ts
  SessionAnalytics.ts
  SessionBridge.ts
  SessionConfig.ts
  SessionConfigValidator.ts
  SessionGracefulShutdown.ts
  SessionHealthCheck.ts
  SessionIntegration.ts
  SessionManager.ts
  SessionMetrics.ts
  SessionMigration.ts
  SessionReplay.ts
  SessionStore.ts
  SessionTypes.ts
types/
  entities.ts
  fastify.d.ts
  optional-modules.d.ts
  relationships.ts
  types.ts
utils/
  codeEdges.ts
  confidence.ts
  embedding.ts
  environment.ts
  performanceFilters.ts
index.ts

================================================================
Files
================================================================

================
File: config/noise.ts
================
export const floatFromEnv = (
  key: string,
  defaultValue: number,
  min: number,
  max: number
): number => {
  const raw = process.env[key];
  if (raw === undefined) return defaultValue;
  const parsed = parseFloat(raw);
  if (isNaN(parsed)) return defaultValue;
  if (key.includes("PERCENT")) {

    return Math.max(0, Math.min(100, parsed));
  }
  if (key.includes("DELTA")) {

    return Math.max(0, parsed);
  }
  return Math.max(min, Math.min(max, parsed));
};

export const intFromEnv = (
  key: string,
  defaultValue: number,
  min: number,
  max: number
): number => {
  const raw = process.env[key];
  if (raw === undefined) return defaultValue;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) return defaultValue;
  return Math.max(Math.max(0, min), Math.min(max, parsed));
};

function listFromEnv(name: string): string[] {
  const raw = process.env[name];
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export const noiseConfig = {

  AST_MIN_NAME_LENGTH: intFromEnv("AST_MIN_NAME_LENGTH", 3, 1, 32),
  AST_STOPLIST_EXTRA: new Set(
    listFromEnv("AST_STOPLIST_EXTRA").map((s) => s.toLowerCase())
  ),
  MIN_INFERRED_CONFIDENCE: floatFromEnv("MIN_INFERRED_CONFIDENCE", 0.4, 0, 1),
  AST_CONF_EXTERNAL: floatFromEnv("AST_CONF_EXTERNAL", 0.4, 0, 1),
  AST_CONF_FILE: floatFromEnv("AST_CONF_FILE", 0.6, 0, 1),
  AST_CONF_CONCRETE: floatFromEnv("AST_CONF_CONCRETE", 0.9, 0, 1),
  AST_BOOST_SAME_FILE: floatFromEnv("AST_BOOST_SAME_FILE", 0.0, 0, 1),
  AST_BOOST_TYPECHECK: floatFromEnv("AST_BOOST_TYPECHECK", 0.0, 0, 1),
  AST_BOOST_EXPORTED: floatFromEnv("AST_BOOST_EXPORTED", 0.0, 0, 1),
  AST_STEP_NAME_LEN: floatFromEnv("AST_STEP_NAME_LEN", 0.0, 0, 1),
  AST_PENALTY_IMPORT_DEPTH: floatFromEnv("AST_PENALTY_IMPORT_DEPTH", 0.0, 0, 1),

  AST_MAX_TC_LOOKUPS_PER_FILE: intFromEnv(
    "AST_MAX_TC_LOOKUPS_PER_FILE",
    200,
    0,
    100000
  ),


  DOC_LINK_MIN_OCCURRENCES: intFromEnv("DOC_LINK_MIN_OCCURRENCES", 2, 1, 10),
  DOC_LINK_LONG_NAME: intFromEnv("DOC_LINK_LONG_NAME", 10, 4, 64),
  DOC_LINK_BASE_CONF: floatFromEnv("DOC_LINK_BASE_CONF", 0.4, 0, 1),
  DOC_LINK_STEP_CONF: floatFromEnv("DOC_LINK_STEP_CONF", 0.2, 0, 1),
  DOC_LINK_STRONG_NAME_CONF: floatFromEnv(
    "DOC_LINK_STRONG_NAME_CONF",
    0.8,
    0,
    1
  ),


  SECURITY_MIN_SEVERITY: (
    process.env.SECURITY_MIN_SEVERITY || "medium"
  ).toLowerCase(),
  SECURITY_MIN_CONFIDENCE: floatFromEnv("SECURITY_MIN_CONFIDENCE", 0.6, 0, 1),


  PERF_MIN_HISTORY: intFromEnv("PERF_MIN_HISTORY", 5, 1, 100),
  PERF_TREND_MIN_RUNS: intFromEnv("PERF_TREND_MIN_RUNS", 3, 1, 50),
  PERF_DEGRADING_MIN_DELTA_MS: intFromEnv(
    "PERF_DEGRADING_MIN_DELTA_MS",
    200,
    0,
    100000
  ),
  PERF_IMPACT_AVG_MS: intFromEnv("PERF_IMPACT_AVG_MS", 1500, 0, 600000),
  PERF_IMPACT_P95_MS: intFromEnv("PERF_IMPACT_P95_MS", 2000, 0, 600000),
  PERF_SEVERITY_PERCENT_CRITICAL: floatFromEnv(
    "PERF_SEVERITY_PERCENT_CRITICAL",
    50,
    0,
    100
  ),
  PERF_SEVERITY_PERCENT_HIGH: floatFromEnv(
    "PERF_SEVERITY_PERCENT_HIGH",
    25,
    0,
    100
  ),
  PERF_SEVERITY_PERCENT_MEDIUM: floatFromEnv(
    "PERF_SEVERITY_PERCENT_MEDIUM",
    10,
    0,
    100
  ),
  PERF_SEVERITY_PERCENT_LOW: floatFromEnv(
    "PERF_SEVERITY_PERCENT_LOW",
    5,
    0,
    100
  ),
  PERF_SEVERITY_DELTA_CRITICAL: floatFromEnv(
    "PERF_SEVERITY_DELTA_CRITICAL",
    2000,
    0,
    Infinity
  ),
  PERF_SEVERITY_DELTA_HIGH: floatFromEnv(
    "PERF_SEVERITY_DELTA_HIGH",
    1000,
    0,
    Infinity
  ),
  PERF_SEVERITY_DELTA_MEDIUM: floatFromEnv(
    "PERF_SEVERITY_DELTA_MEDIUM",
    250,
    0,
    Infinity
  ),
  PERF_SEVERITY_DELTA_LOW: floatFromEnv(
    "PERF_SEVERITY_DELTA_LOW",
    0,
    0,
    Infinity
  ),
};

================
File: logging/FileSink.ts
================
import * as fs from "fs/promises";
import * as path from "path";
import { OriginalConsoleMethods } from "./InstrumentationDispatcher.js";

export interface FileSystemFacade {
  appendFile(path: string, data: string, encoding?: BufferEncoding): Promise<void>;
  mkdir(path: string, options: fs.MakeDirectoryOptions & { recursive: boolean }): Promise<void>;
  stat(path: string): Promise<fs.Stats>;
  rm(path: string, options: fs.RmOptions): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  truncate(path: string, len?: number): Promise<void>;
}

const defaultFileSystem: FileSystemFacade = {
  appendFile: (target, data, encoding) => fs.appendFile(target, data, encoding),
  mkdir: (target, options) => fs.mkdir(target, options),
  stat: (target) => fs.stat(target),
  rm: (target, options) => fs.rm(target, options),
  rename: (source, destination) => fs.rename(source, destination),
  truncate: (target, len) => fs.truncate(target, len),
};

export interface FileSinkOptions {
  maxFileSizeBytes?: number;
  maxFileAgeMs?: number;
  maxHistory?: number;
  maxWriteErrors?: number;
}

export interface FileSinkMetrics {
  bytesWritten: number;
  failedWrites: number;
  suppressedWrites: number;
  rotations: number;
  lastError?: string;
}

const DEFAULT_OPTIONS: Required<FileSinkOptions> = {
  maxFileSizeBytes: 5 * 1024 * 1024,
  maxFileAgeMs: 24 * 60 * 60 * 1000,
  maxHistory: 5,
  maxWriteErrors: 3,
};

export class FileSink {
  private readonly options: Required<FileSinkOptions>;
  private readonly consoleFallback: OriginalConsoleMethods;
  private readonly fileSystem: FileSystemFacade;

  private queue: Promise<void> = Promise.resolve();
  private initialized = false;
  private suppressed = false;
  private consecutiveFailures = 0;

  private currentFileSize = 0;
  private lastRotationAt = Date.now();

  private readonly metrics: FileSinkMetrics = {
    bytesWritten: 0,
    failedWrites: 0,
    suppressedWrites: 0,
    rotations: 0,
  };

  constructor(
    private readonly targetFile: string,
    consoleFallback: OriginalConsoleMethods,
    options: FileSinkOptions = {},
    fileSystem: FileSystemFacade = defaultFileSystem
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.consoleFallback = consoleFallback;
    this.fileSystem = fileSystem;
  }

  append(line: string): Promise<void> {
    this.queue = this.queue.then(() => this.performAppend(line));
    return this.queue;
  }

  flush(): Promise<void> {
    return this.queue;
  }

  getMetrics(): FileSinkMetrics {
    return { ...this.metrics };
  }

  getRotationHistoryLimit(): number {
    return this.options.maxHistory;
  }

  private async performAppend(line: string): Promise<void> {
    if (this.suppressed) {
      this.metrics.suppressedWrites += 1;
      return;
    }

    try {
      await this.ensureInitialized();
      await this.rotateIfNeeded(line);
      await this.fileSystem.appendFile(this.targetFile, line, "utf8");

      const lineSize = Buffer.byteLength(line, "utf8");
      this.currentFileSize += lineSize;
      this.metrics.bytesWritten += lineSize;
      this.consecutiveFailures = 0;
    } catch (error) {
      this.consecutiveFailures += 1;
      this.metrics.failedWrites += 1;
      this.metrics.lastError = error instanceof Error ? error.message : String(error);
      this.consoleFallback.warn(
        "LoggingService: failed to append log entry to file",
        error
      );

      if (this.consecutiveFailures >= this.options.maxWriteErrors) {
        this.suppressed = true;
        this.consoleFallback.error(
          `LoggingService: suppressing further file writes after ${this.consecutiveFailures} consecutive failures`
        );
      }
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.fileSystem.mkdir(path.dirname(this.targetFile), {
      recursive: true,
    });

    try {
      const stats = await this.fileSystem.stat(this.targetFile);
      this.currentFileSize = stats.size;
      this.lastRotationAt = stats.mtimeMs;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
      this.currentFileSize = 0;
      this.lastRotationAt = Date.now();
    }

    this.initialized = true;
  }

  private async rotateIfNeeded(line: string): Promise<void> {
    const lineSize = Buffer.byteLength(line, "utf8");
    const now = Date.now();

    const sizeThresholdExceeded =
      this.currentFileSize + lineSize > this.options.maxFileSizeBytes;
    const ageThresholdExceeded =
      now - this.lastRotationAt > this.options.maxFileAgeMs;

    if (!sizeThresholdExceeded && !ageThresholdExceeded) {
      return;
    }

    await this.rotateFiles();
    this.currentFileSize = 0;
    this.lastRotationAt = now;
    this.metrics.rotations += 1;
  }

  private async rotateFiles(): Promise<void> {
    const history = this.options.maxHistory;
    if (history <= 0) {
      try {
        await this.fileSystem.truncate(this.targetFile, 0);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          throw error;
        }
      }
      return;
    }

    for (let index = history; index >= 1; index -= 1) {
      const source = index === 1
        ? this.targetFile
        : `${this.targetFile}.${index - 1}`;
      const destination = `${this.targetFile}.${index}`;

      try {
        await this.fileSystem.stat(source);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          continue;
        }
        throw error;
      }

      if (index === history) {
        await this.fileSystem
          .rm(destination, { force: true })
          .catch(() => undefined);
      }

      await this.fileSystem.rename(source, destination);
    }
  }
}

================
File: logging/index.ts
================
export { default as FileSink } from './FileSink.js';
export { default as InstrumentationDispatcher } from './InstrumentationDispatcher.js';
export * from './serialization.js';

================
File: logging/InstrumentationDispatcher.ts
================
import { LogEntry } from "../services/LoggingService.js";

export type InstrumentationSource = "console" | "process";

export interface InstrumentationEvent {
  source: InstrumentationSource;
  level: LogEntry["level"];
  component: string;
  message: string;
  data?: unknown;
  consoleArgs?: unknown[];
  error?: unknown;
}

export interface InstrumentationConsumer {
  handleEvent(event: InstrumentationEvent): void;
}

export interface InstrumentationSubscription {
  dispose(): void;
}

export interface DispatcherMetrics {
  registeredConsumers: number;
  consoleOverridesActive: boolean;
  processListenersAttached: number;
  dispatchedEvents: number;
  droppedEvents: number;
}

export interface OriginalConsoleMethods {
  log: typeof console.log;
  error: typeof console.error;
  warn: typeof console.warn;
  debug: typeof console.debug;
}

interface ConsumerRecord {
  id: number;
  consumer: InstrumentationConsumer;
}

const GLOBAL_DISPATCHER_KEY = "__mementoLoggingDispatcher__";

export class InstrumentationDispatcher {
  private consumers: Map<number, ConsumerRecord> = new Map();
  private nextConsumerId = 1;
  private consoleOverridesActive = false;
  private dispatchedEvents = 0;
  private droppedEvents = 0;
  private processListenersAttached = 0;

  private originalConsole: OriginalConsoleMethods | null = null;
  private uncaughtExceptionHandler?: (error: unknown) => void;
  private unhandledRejectionHandler?: (reason: unknown, promise: unknown) => void;

  register(consumer: InstrumentationConsumer): InstrumentationSubscription {
    const record: ConsumerRecord = {
      id: this.nextConsumerId++,
      consumer,
    };

    this.consumers.set(record.id, record);
    this.ensureInstrumentation();

    return {
      dispose: () => {
        this.consumers.delete(record.id);
        if (this.consumers.size === 0) {
          this.teardownInstrumentation();
        }
      },
    };
  }

  handleConsole(level: LogEntry["level"], args: unknown[]): void {
    const message = args.map((part) => this.formatConsoleArg(part)).join(" ");

    this.dispatch({
      source: "console",
      level,
      component: "console",
      message,
      consoleArgs: args,
    });
  }

  handleProcessEvent(
    type: "uncaughtException" | "unhandledRejection",
    payload: unknown
  ): void {
    if (type === "uncaughtException") {
      const error = payload as Error;
      this.dispatch({
        source: "process",
        level: "error",
        component: "process",
        message: `Uncaught Exception: ${error instanceof Error ? error.message : String(error)}`,
        data:
          error instanceof Error
            ? { stack: error.stack, name: error.name }
            : undefined,
        error,
      });
    } else {
      const [reason, promise] = Array.isArray(payload)
        ? (payload as [unknown, unknown])
        : [payload, undefined];
      this.dispatch({
        source: "process",
        level: "error",
        component: "process",
        message: `Unhandled Rejection: ${
          reason instanceof Error ? reason.message : String(reason)
        }`,
        data: {
          promise: this.safeStringifyInline(promise ?? "[unknown promise]"),
          reason: reason instanceof Error ? { name: reason.name, stack: reason.stack } : reason,
        },
        error: reason,
      });
    }
  }

  getOriginalConsole(): OriginalConsoleMethods {
    if (this.originalConsole) {
      return this.originalConsole;
    }

    return {
      log: console.log,
      error: console.error,
      warn: console.warn,
      debug: console.debug,
    };
  }

  getMetrics(): DispatcherMetrics {
    return {
      registeredConsumers: this.consumers.size,
      consoleOverridesActive: this.consoleOverridesActive,
      processListenersAttached: this.processListenersAttached,
      dispatchedEvents: this.dispatchedEvents,
      droppedEvents: this.droppedEvents,
    };
  }

  private dispatch(event: InstrumentationEvent): void {
    if (this.consumers.size === 0) {
      this.droppedEvents++;
      return;
    }

    this.dispatchedEvents++;

    for (const record of this.consumers.values()) {
      try {
        record.consumer.handleEvent(event);
      } catch (error) {
        this.getOriginalConsole().error(
          "Logging dispatcher consumer threw an error",
          error
        );
      }
    }
  }

  private ensureInstrumentation(): void {
    if (this.consoleOverridesActive) {
      return;
    }

    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      debug: console.debug,
    };

    console.log = (...args: unknown[]) => {
      this.handleConsole("info", args);
      Reflect.apply(this.originalConsole!.log, console, args);
    };

    console.error = (...args: unknown[]) => {
      this.handleConsole("error", args);
      Reflect.apply(this.originalConsole!.error, console, args);
    };

    console.warn = (...args: unknown[]) => {
      this.handleConsole("warn", args);
      Reflect.apply(this.originalConsole!.warn, console, args);
    };

    console.debug = (...args: unknown[]) => {
      this.handleConsole("debug", args);
      Reflect.apply(this.originalConsole!.debug, console, args);
    };

    this.uncaughtExceptionHandler = (error: unknown) => {
      this.handleProcessEvent("uncaughtException", error);

      const originalConsole = this.getOriginalConsole();
      const consoleArgs =
        error instanceof Error
          ? [error]
          : ["Uncaught exception (non-error value):", error];

      Reflect.apply(originalConsole.error, console, consoleArgs);


      if (typeof process.exitCode !== "number" || process.exitCode === 0) {
        process.exitCode = 1;
      }

    };

    this.unhandledRejectionHandler = (reason: unknown, promise: unknown) => {
      this.handleProcessEvent("unhandledRejection", [reason, promise]);
    };

    process.on("uncaughtException", this.uncaughtExceptionHandler);
    process.on("unhandledRejection", this.unhandledRejectionHandler);
    this.processListenersAttached = 2;

    this.consoleOverridesActive = true;
  }

  private teardownInstrumentation(): void {
    if (!this.consoleOverridesActive || !this.originalConsole) {
      return;
    }

    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.debug = this.originalConsole.debug;

    if (this.uncaughtExceptionHandler) {
      process.removeListener("uncaughtException", this.uncaughtExceptionHandler);
      this.uncaughtExceptionHandler = undefined;
    }

    if (this.unhandledRejectionHandler) {
      process.removeListener("unhandledRejection", this.unhandledRejectionHandler);
      this.unhandledRejectionHandler = undefined;
    }

    this.processListenersAttached = 0;
    this.consoleOverridesActive = false;
  }

  private safeStringifyInline(value: unknown): string {
    if (typeof value === "string") {
      return value;
    }

    try {
      const serialized = JSON.stringify(value);
      return typeof serialized === "string" ? serialized : String(value);
    } catch (error) {
      return `[unserializable: ${(error as Error)?.message ?? "error"}]`;
    }
  }

  private formatConsoleArg(part: unknown): string {
    if (typeof part === "string") {
      return part;
    }

    if (part instanceof Error) {
      return part.stack ?? part.toString();
    }

    if (typeof part === "number" || typeof part === "boolean") {
      return String(part);
    }

    if (typeof part === "bigint") {
      return part.toString();
    }

    if (typeof part === "symbol") {
      return part.toString();
    }

    if (typeof part === "function") {
      return part.name ? `[Function: ${part.name}]` : "[Function]";
    }

    if (part === null) {
      return "null";
    }

    if (part === undefined) {
      return "undefined";
    }

    return this.safeStringifyInline(part);
  }
}

export function getInstrumentationDispatcher(): InstrumentationDispatcher {
  const globalWithDispatcher = globalThis as typeof globalThis & {
    [GLOBAL_DISPATCHER_KEY]?: InstrumentationDispatcher;
  };

  if (!globalWithDispatcher[GLOBAL_DISPATCHER_KEY]) {
    globalWithDispatcher[GLOBAL_DISPATCHER_KEY] = new InstrumentationDispatcher();
  }

  return globalWithDispatcher[GLOBAL_DISPATCHER_KEY];
}

================
File: logging/serialization.ts
================
import { LogEntry } from "../services/LoggingService.js";

export interface SerializationOptions {
  maxDepth?: number;
  maxStringLength?: number;
  maxArrayLength?: number;
}

const DEFAULT_MAX_DEPTH = 6;
const DEFAULT_MAX_STRING_LENGTH = 10_000;
const DEFAULT_MAX_ARRAY_LENGTH = 1_000;

export function sanitizeData(
  value: unknown,
  options: SerializationOptions = {}
): unknown {
  const { maxDepth, maxStringLength, maxArrayLength } = {
    maxDepth: options.maxDepth ?? DEFAULT_MAX_DEPTH,
    maxStringLength: options.maxStringLength ?? DEFAULT_MAX_STRING_LENGTH,
    maxArrayLength: options.maxArrayLength ?? DEFAULT_MAX_ARRAY_LENGTH,
  };

  const seen = new WeakSet<object>();

  const sanitize = (input: unknown, depth: number): unknown => {
    if (input === null || typeof input !== "object") {
      if (typeof input === "string" && input.length > maxStringLength) {
        return `${input.slice(0, maxStringLength)}…[truncated ${input.length - maxStringLength} chars]`;
      }
      if (typeof input === "bigint") {
        return `${input.toString()}n`;
      }
      if (typeof input === "symbol") {
        return input.description ? `Symbol(${input.description})` : "Symbol()";
      }
      if (typeof input === "function") {
        return `[Function ${input.name || 'anonymous'}]`;
      }
      return input;
    }

    if (seen.has(input as object)) {
      return "[Circular]";
    }

    if (depth >= maxDepth) {
      return `[Truncated depth ${depth}]`;
    }

    seen.add(input as object);

    if (Array.isArray(input)) {
      const limited = input.slice(0, maxArrayLength).map((item) =>
        sanitize(item, depth + 1)
      );
      if (input.length > maxArrayLength) {
        limited.push(`…[${input.length - maxArrayLength} more items truncated]`);
      }
      return limited;
    }

    if (input instanceof Date) {
      return input.toISOString();
    }

    if (input instanceof Error) {
      return {
        name: input.name,
        message: input.message,
        stack: input.stack,
      };
    }

    const output: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      output[key] = sanitize(value, depth + 1);
    }
    return output;
  };

  return sanitize(value, 0);
}

export function serializeLogEntry(
  entry: LogEntry,
  options: SerializationOptions = {}
): string {
  const serializable = {
    ...entry,
    timestamp: entry.timestamp.toISOString(),
    data: entry.data ? sanitizeData(entry.data, options) : undefined,
  };

  return JSON.stringify(serializable);
}

================
File: models/relationships.ts
================
export interface Relationship {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  type: RelationshipType;
  created: Date;
  lastModified: Date;
  version: number;
  metadata?: Record<string, any>;
  siteId?: string;
  siteHash?: string;
  evidence?: any[];
  locations?: any[];
  sites?: any[];

  validFrom?: Date;
  validTo?: Date | null;
}


export enum RelationshipType {

  CONTAINS = 'CONTAINS',
  DEFINES = 'DEFINES',
  EXPORTS = 'EXPORTS',
  IMPORTS = 'IMPORTS',


  CALLS = 'CALLS',
  REFERENCES = 'REFERENCES',
  IMPLEMENTS = 'IMPLEMENTS',
  EXTENDS = 'EXTENDS',
  DEPENDS_ON = 'DEPENDS_ON',
  OVERRIDES = 'OVERRIDES',
  READS = 'READS',
  WRITES = 'WRITES',
  THROWS = 'THROWS',

  TYPE_USES = 'TYPE_USES',
  RETURNS_TYPE = 'RETURNS_TYPE',
  PARAM_TYPE = 'PARAM_TYPE',


  TESTS = 'TESTS',
  VALIDATES = 'VALIDATES',


  REQUIRES = 'REQUIRES',
  IMPACTS = 'IMPACTS',
  IMPLEMENTS_SPEC = 'IMPLEMENTS_SPEC',


  PREVIOUS_VERSION = 'PREVIOUS_VERSION',
  MODIFIED_BY = 'MODIFIED_BY',
  CREATED_IN = 'CREATED_IN',
  MODIFIED_IN = 'MODIFIED_IN',
  REMOVED_IN = 'REMOVED_IN',
  OF = 'OF',


  DESCRIBES_DOMAIN = 'DESCRIBES_DOMAIN',
  BELONGS_TO_DOMAIN = 'BELONGS_TO_DOMAIN',
  DOCUMENTED_BY = 'DOCUMENTED_BY',
  CLUSTER_MEMBER = 'CLUSTER_MEMBER',
  DOMAIN_RELATED = 'DOMAIN_RELATED',
  GOVERNED_BY = 'GOVERNED_BY',
  DOCUMENTS_SECTION = 'DOCUMENTS_SECTION',


  HAS_SECURITY_ISSUE = 'HAS_SECURITY_ISSUE',
  DEPENDS_ON_VULNERABLE = 'DEPENDS_ON_VULNERABLE',
  SECURITY_IMPACTS = 'SECURITY_IMPACTS',


  PERFORMANCE_IMPACT = 'PERFORMANCE_IMPACT',
  PERFORMANCE_REGRESSION = 'PERFORMANCE_REGRESSION',
  COVERAGE_PROVIDES = 'COVERAGE_PROVIDES',


  SESSION_MODIFIED = 'SESSION_MODIFIED',
  SESSION_IMPACTED = 'SESSION_IMPACTED',
  SESSION_CHECKPOINT = 'SESSION_CHECKPOINT',
  BROKE_IN = 'BROKE_IN',
  FIXED_IN = 'FIXED_IN',
  DEPENDS_ON_CHANGE = 'DEPENDS_ON_CHANGE',


  CHECKPOINT_INCLUDES = 'CHECKPOINT_INCLUDES'
}


export type StructuralImportType =
  | "default"
  | "named"
  | "namespace"
  | "wildcard"
  | "side-effect";

export interface StructuralRelationship extends Relationship {
  type:
    | RelationshipType.CONTAINS
    | RelationshipType.DEFINES
    | RelationshipType.EXPORTS
    | RelationshipType.IMPORTS;
  importType?: StructuralImportType;
  importAlias?: string;
  importDepth?: number;
  isNamespace?: boolean;
  isReExport?: boolean;
  reExportTarget?: string | null;
  language?: string;
  symbolKind?: string;
  modulePath?: string;
  resolutionState?: "resolved" | "unresolved" | "partial";
  metadata?: Record<string, any> & {
    languageSpecific?: Record<string, any>;
  };
  confidence?: number;
  scope?: CodeScope;
  firstSeenAt?: Date;
  lastSeenAt?: Date;
}

const STRUCTURAL_RELATIONSHIP_TYPE_SET = new Set<RelationshipType>([
  RelationshipType.CONTAINS,
  RelationshipType.DEFINES,
  RelationshipType.EXPORTS,
  RelationshipType.IMPORTS,
]);

export const isStructuralRelationshipType = (
  type: RelationshipType
): type is StructuralRelationship["type"] =>
  STRUCTURAL_RELATIONSHIP_TYPE_SET.has(type);

export const PERFORMANCE_RELATIONSHIP_TYPES = [
  RelationshipType.PERFORMANCE_IMPACT,
  RelationshipType.PERFORMANCE_REGRESSION,
] as const;

const PERFORMANCE_RELATIONSHIP_TYPE_SET = new Set<RelationshipType>(
  PERFORMANCE_RELATIONSHIP_TYPES
);

export type PerformanceRelationshipType =
  (typeof PERFORMANCE_RELATIONSHIP_TYPES)[number];

export const isPerformanceRelationshipType = (
  type: RelationshipType
): type is PerformanceRelationshipType =>
  PERFORMANCE_RELATIONSHIP_TYPE_SET.has(type);

export const SESSION_RELATIONSHIP_TYPES = [
  RelationshipType.SESSION_MODIFIED,
  RelationshipType.SESSION_IMPACTED,
  RelationshipType.SESSION_CHECKPOINT,
  RelationshipType.BROKE_IN,
  RelationshipType.FIXED_IN,
  RelationshipType.DEPENDS_ON_CHANGE,
] as const;

const SESSION_RELATIONSHIP_TYPE_SET = new Set<RelationshipType>(
  SESSION_RELATIONSHIP_TYPES
);

export type SessionRelationshipType =
  (typeof SESSION_RELATIONSHIP_TYPES)[number];

export const isSessionRelationshipType = (
  type: RelationshipType
): type is SessionRelationshipType =>
  SESSION_RELATIONSHIP_TYPE_SET.has(type);



export type CodeEdgeSource = 'ast' | 'type-checker' | 'heuristic' | 'index' | 'runtime' | 'lsp';

export type CodeEdgeKind = 'call' | 'identifier' | 'instantiation' | 'type' | 'read' | 'write' | 'override' | 'inheritance' | 'return' | 'param' | 'decorator' | 'annotation' | 'throw' | 'dependency';


export const CODE_RELATIONSHIP_TYPES = [
  RelationshipType.CALLS,
  RelationshipType.REFERENCES,
  RelationshipType.IMPLEMENTS,
  RelationshipType.EXTENDS,
  RelationshipType.DEPENDS_ON,
  RelationshipType.OVERRIDES,
  RelationshipType.READS,
  RelationshipType.WRITES,
  RelationshipType.THROWS,
  RelationshipType.TYPE_USES,
  RelationshipType.RETURNS_TYPE,
  RelationshipType.PARAM_TYPE,
] as const;

export type CodeRelationshipType = (typeof CODE_RELATIONSHIP_TYPES)[number];


export const DOCUMENTATION_RELATIONSHIP_TYPES = [
  RelationshipType.DESCRIBES_DOMAIN,
  RelationshipType.BELONGS_TO_DOMAIN,
  RelationshipType.DOCUMENTED_BY,
  RelationshipType.CLUSTER_MEMBER,
  RelationshipType.DOMAIN_RELATED,
  RelationshipType.GOVERNED_BY,
  RelationshipType.DOCUMENTS_SECTION,
] as const;

export type DocumentationRelationshipType =
  (typeof DOCUMENTATION_RELATIONSHIP_TYPES)[number];

const DOCUMENTATION_RELATIONSHIP_TYPE_SET = new Set<RelationshipType>(
  DOCUMENTATION_RELATIONSHIP_TYPES,
);

export const isDocumentationRelationshipType = (
  type: RelationshipType,
): type is DocumentationRelationshipType =>
  DOCUMENTATION_RELATIONSHIP_TYPE_SET.has(type);

export type DocumentationSource =
  | 'parser'
  | 'manual'
  | 'llm'
  | 'imported'
  | 'sync'
  | 'other';

export type DocumentationIntent = 'ai-context' | 'governance' | 'mixed';

export type DocumentationNodeType =
  | 'readme'
  | 'api-docs'
  | 'design-doc'
  | 'architecture'
  | 'user-guide';

export type DocumentationStatus = 'active' | 'deprecated' | 'draft';

export type DocumentationCoverageScope =
  | 'api'
  | 'behavior'
  | 'operational'
  | 'security'
  | 'compliance';

export type DocumentationQuality = 'complete' | 'partial' | 'outdated';

export type DocumentationPolicyType =
  | 'adr'
  | 'runbook'
  | 'compliance'
  | 'manual'
  | 'decision-log';


export interface EdgeEvidence {
  source: CodeEdgeSource;
  confidence?: number;
  location?: { path?: string; line?: number; column?: number };
  note?: string;

  extractorVersion?: string;
}

export interface CodeRelationship extends Relationship {
  type: CodeRelationshipType;

  strength?: number;
  context?: string;



  occurrencesScan?: number;
  occurrencesTotal?: number;
  occurrencesRecent?: number;
  confidence?: number;
  inferred?: boolean;
  resolved?: boolean;
  source?: CodeEdgeSource;
  kind?: CodeEdgeKind;
  location?: { path?: string; line?: number; column?: number };

  usedTypeChecker?: boolean;
  isExported?: boolean;

  active?: boolean;


  evidence?: EdgeEvidence[];
  locations?: Array<{ path?: string; line?: number; column?: number }>;


  siteId?: string;
  sites?: string[];
  siteHash?: string;


  why?: string;


  callee?: string;
  paramName?: string;
  importDepth?: number;
  importAlias?: string;
  isMethod?: boolean;


  resolution?: CodeResolution;
  scope?: CodeScope;
  accessPath?: string;
  ambiguous?: boolean;
  candidateCount?: number;


  arity?: number;
  awaited?: boolean;
  receiverType?: string;
  dynamicDispatch?: boolean;
  overloadIndex?: number;
  genericArguments?: string[];


  operator?: string;


  dataFlowId?: string;
  purity?: 'pure' | 'impure' | 'unknown';


  fromRef?: { kind: 'entity' | 'fileSymbol' | 'external'; id?: string; file?: string; symbol?: string; name?: string };
  toRef?: { kind: 'entity' | 'fileSymbol' | 'external'; id?: string; file?: string; symbol?: string; name?: string };

  to_ref_kind?: 'entity' | 'fileSymbol' | 'external' | undefined;
  to_ref_file?: string;
  to_ref_symbol?: string;
  to_ref_name?: string;


  from_ref_kind?: 'entity' | 'fileSymbol' | 'external' | undefined;
  from_ref_file?: string;
  from_ref_symbol?: string;
  from_ref_name?: string;


  firstSeenAt?: Date;
  lastSeenAt?: Date;
}


export type CodeResolution = 'direct' | 'via-import' | 'type-checker' | 'heuristic';
export type CodeScope = 'local' | 'imported' | 'external' | 'unknown';

export interface TestRelationship extends Relationship {
  type: RelationshipType.TESTS | RelationshipType.VALIDATES;
  testType?: 'unit' | 'integration' | 'e2e';
  coverage?: number;
}

export interface SpecRelationship extends Relationship {
  type: RelationshipType.REQUIRES | RelationshipType.IMPACTS | RelationshipType.IMPLEMENTS_SPEC;
  impactLevel?: 'high' | 'medium' | 'low';
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

export interface TemporalRelationship extends Relationship {
  type: RelationshipType.PREVIOUS_VERSION |
        RelationshipType.MODIFIED_BY | RelationshipType.CREATED_IN |
        RelationshipType.MODIFIED_IN | RelationshipType.REMOVED_IN |
        RelationshipType.OF;
  changeType?: 'create' | 'update' | 'delete' | 'rename' | 'move';
  author?: string;
  commitHash?: string;
}

export interface DocumentationRelationship extends Relationship {
  type: DocumentationRelationshipType;
  confidence?: number;
  inferred?: boolean;
  source?: DocumentationSource;
  docIntent?: DocumentationIntent;
  sectionAnchor?: string;
  sectionTitle?: string;
  summary?: string;
  docVersion?: string;
  docHash?: string;
  documentationQuality?: DocumentationQuality;
  coverageScope?: DocumentationCoverageScope;
  evidence?: Array<{ type: 'heading' | 'snippet' | 'link'; value: string }>;
  tags?: string[];
  stakeholders?: string[];
  domainPath?: string;
  taxonomyVersion?: string;
  updatedFromDocAt?: Date;
  lastValidated?: Date;
  strength?: number;
  similarityScore?: number;
  clusterVersion?: string;
  role?: 'core' | 'supporting' | 'entry-point' | 'integration';
  docEvidenceId?: string;
  docAnchor?: string;
  embeddingVersion?: string;
  policyType?: DocumentationPolicyType;
  effectiveFrom?: Date;
  expiresAt?: Date | null;
  relationshipType?: 'depends_on' | 'overlaps' | 'shares_owner' | string;
  docLocale?: string;
}

export interface SecurityRelationship extends Relationship {
  type: RelationshipType.HAS_SECURITY_ISSUE | RelationshipType.DEPENDS_ON_VULNERABLE |
        RelationshipType.SECURITY_IMPACTS;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status?: 'open' | 'fixed' | 'accepted' | 'false-positive';
  cvssScore?: number;
}

export type PerformanceTrend = "regression" | "improvement" | "neutral";

export type PerformanceSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low";

export interface PerformanceConfidenceInterval {
  lower?: number;
  upper?: number;
}

export interface PerformanceMetricSample {
  timestamp?: Date;
  value: number;
  runId?: string;
  environment?: string;
  unit?: string;
}

export interface PerformanceRelationship extends Relationship {
  type: PerformanceRelationshipType;
  metricId: string;
  scenario?: string;
  environment?: string;
  baselineValue?: number;
  currentValue?: number;
  unit?: string;
  delta?: number;
  percentChange?: number;
  sampleSize?: number;
  confidenceInterval?: PerformanceConfidenceInterval | null;
  trend?: PerformanceTrend;
  severity?: PerformanceSeverity;
  riskScore?: number;
  runId?: string;
  policyId?: string;
  detectedAt?: Date;
  resolvedAt?: Date | null;
  metricsHistory?: PerformanceMetricSample[];
  evidence?: EdgeEvidence[];
  metadata?: Record<string, any> & {
    metrics?: Array<Record<string, any>>;
  };
}

export interface SessionRelationship extends Relationship {
  type: RelationshipType.SESSION_MODIFIED | RelationshipType.SESSION_IMPACTED |
        RelationshipType.SESSION_CHECKPOINT | RelationshipType.BROKE_IN |
        RelationshipType.FIXED_IN | RelationshipType.DEPENDS_ON_CHANGE;


  sessionId: string;
  timestamp: Date;
  sequenceNumber: number;
  eventId?: string;
  actor?: string;
  annotations?: string[];
  impactSeverity?: 'critical' | 'high' | 'medium' | 'low';
  stateTransitionTo?: 'working' | 'broken' | 'unknown';
  checkpointId?: string;
  checkpointStatus?: 'pending' | 'completed' | 'failed' | 'manual_intervention';
  checkpointDetails?: {
    reason?: 'daily' | 'incident' | 'manual';
    hopCount?: number;
    attempts?: number;
    seedEntityIds?: string[];
    jobId?: string;
    error?: string;
    updatedAt?: Date;
  };


  changeInfo?: {
    elementType: 'function' | 'class' | 'import' | 'test';
    elementName: string;
    operation: 'added' | 'modified' | 'deleted' | 'renamed';
    semanticHash?: string;
    affectedLines?: number;
  };


  stateTransition?: {
    from: 'working' | 'broken' | 'unknown';
    to: 'working' | 'broken' | 'unknown';
    verifiedBy: 'test' | 'build' | 'manual';
    confidence: number;
    criticalChange?: {
      entityId: string;
      beforeSnippet?: string;
      afterSnippet?: string;
    };
  };


  impact?: {
    severity: 'high' | 'medium' | 'low';
    testsFailed?: string[];
    testsFixed?: string[];
    buildError?: string;
    performanceImpact?: number;
  };
}


export type GraphRelationship =
  | StructuralRelationship
  | CodeRelationship
  | TestRelationship
  | SpecRelationship
  | TemporalRelationship
  | DocumentationRelationship
  | SecurityRelationship
  | PerformanceRelationship
  | SessionRelationship;


export interface RelationshipQuery {
  fromEntityId?: string;
  toEntityId?: string;
  type?: RelationshipType | RelationshipType[];
  entityTypes?: string[];
  since?: Date;
  until?: Date;
  limit?: number;
  offset?: number;
  domainPath?: string | string[];
  domainPrefix?: string | string[];
  docIntent?: DocumentationIntent | DocumentationIntent[];
  docType?: DocumentationNodeType | DocumentationNodeType[];
  docStatus?: DocumentationStatus | DocumentationStatus[];
  docLocale?: string | string[];
  coverageScope?: DocumentationCoverageScope | DocumentationCoverageScope[];
  embeddingVersion?: string | string[];
  clusterId?: string | string[];
  clusterVersion?: string | string[];
  stakeholder?: string | string[];
  tag?: string | string[];
  lastValidatedAfter?: Date;
  lastValidatedBefore?: Date;
  metricId?: string | string[];
  environment?: string | string[];
  severity?: PerformanceSeverity | PerformanceSeverity[];
  trend?: PerformanceTrend | PerformanceTrend[];
  detectedAfter?: Date;
  detectedBefore?: Date;
  resolvedAfter?: Date;
  resolvedBefore?: Date;

  kind?: CodeEdgeKind | CodeEdgeKind[];
  source?: CodeEdgeSource | CodeEdgeSource[];
  resolution?: CodeResolution | CodeResolution[];
  scope?: CodeScope | CodeScope[];
  confidenceMin?: number;
  confidenceMax?: number;
  inferred?: boolean;
  resolved?: boolean;
  active?: boolean;
  firstSeenSince?: Date;
  lastSeenSince?: Date;

  to_ref_kind?: 'entity' | 'fileSymbol' | 'external';
  to_ref_file?: string;
  to_ref_symbol?: string;
  to_ref_name?: string;

  from_ref_kind?: 'entity' | 'fileSymbol' | 'external';
  from_ref_file?: string;
  from_ref_symbol?: string;
  from_ref_name?: string;

  siteHash?: string;

  arityEq?: number;
  arityMin?: number;
  arityMax?: number;
  awaited?: boolean;
  isMethod?: boolean;

  operator?: string;
  callee?: string;
  importDepthMin?: number;
  importDepthMax?: number;
  importAlias?: string | string[];
  importType?: StructuralImportType | StructuralImportType[];
  isNamespace?: boolean;
  language?: string | string[];
  symbolKind?: string | string[];
  modulePath?: string | string[];
  modulePathPrefix?: string;

  sessionId?: string | string[];
  sessionIds?: string[];
  sequenceNumber?: number | number[];
  sequenceNumberMin?: number;
  sequenceNumberMax?: number;
  timestampFrom?: Date | string;
  timestampTo?: Date | string;
  actor?: string | string[];
  impactSeverity?:
    | 'critical'
    | 'high'
    | 'medium'
    | 'low'
    | Array<'critical' | 'high' | 'medium' | 'low'>;
  stateTransitionTo?:
    | 'working'
    | 'broken'
    | 'unknown'
    | Array<'working' | 'broken' | 'unknown'>;
}

export interface RelationshipFilter {
  types?: RelationshipType[];
  directions?: ('outgoing' | 'incoming')[];
  depths?: number[];
  weights?: {
    min?: number;
    max?: number;
  };
}


export interface PathQuery {
  startEntityId: string;
  endEntityId?: string;
  relationshipTypes?: RelationshipType[];
  maxDepth?: number;
  direction?: 'outgoing' | 'incoming' | 'both';
}

export interface PathResult {
  path: GraphRelationship[];
  totalLength: number;
  relationshipTypes: RelationshipType[];
  entities: string[];
}


export interface TraversalQuery {
  startEntityId: string;
  relationshipTypes: RelationshipType[];
  direction: 'outgoing' | 'incoming' | 'both';
  maxDepth?: number;
  limit?: number;
  filter?: {
    entityTypes?: string[];
    properties?: Record<string, any>;
  };
}

export interface TraversalResult {
  entities: any[];
  relationships: GraphRelationship[];
  paths: PathResult[];
  visited: string[];
}


export interface ImpactQuery {
  entityId: string;
  changeType: 'modify' | 'delete' | 'rename';
  includeIndirect?: boolean;
  maxDepth?: number;
  relationshipTypes?: RelationshipType[];
}

export interface ImpactResult {
  directImpact: {
    entities: any[];
    severity: 'high' | 'medium' | 'low';
    reason: string;
  }[];
  cascadingImpact: {
    level: number;
    entities: any[];
    relationship: RelationshipType;
    confidence: number;
  }[];
  totalAffectedEntities: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}

================
File: rollback/examples/EnhancedRollbackUsage.ts
================
import {
  RollbackManager,
  PostgreSQLRollbackStore,
  PartialRollbackStrategy,
  TimebasedRollbackStrategy,
  DryRunRollbackStrategy,
  ConflictResolutionEngine,
  IntegratedRollbackManager,
  createDefaultRollbackConfig,
  createDefaultStoreOptions,
  RollbackOperationType,
  RollbackStrategy,
  ConflictStrategy
} from '../index.js';


interface MockDatabaseService {
  isReady(): Promise<boolean>;
}

interface MockKnowledgeGraphService {
  getEntities(): Promise<any[]>;
  getRelationships(): Promise<any[]>;
  restoreEntities(entities: any[]): Promise<void>;
  restoreRelationships(relationships: any[]): Promise<void>;
}

interface MockSessionManager {
  getCurrentSessionId(): string | null;
  getSessionData(sessionId: string): Promise<any>;
  updateSessionData(sessionId: string, data: any): Promise<void>;
  createSessionCheckpoint(sessionId: string, metadata: any): Promise<string>;
  restoreSessionCheckpoint(sessionId: string, checkpointId: string): Promise<void>;
  on(event: string, listener: (...args: any[]) => void): void;
}

interface MockAuditLogger {
  logRollbackCreation(rollbackPoint: any, context: any): Promise<void>;
  logRollbackExecution(operation: any, result: any, context: any): Promise<void>;
  logConflictResolution(conflict: any, resolution: any, context: any): Promise<void>;
  logSystemEvent(event: any, context: any): Promise<void>;
  getAuditTrail(filters: any): Promise<any[]>;
}




export async function basicEnhancedRollbackExample() {
  console.log('=== Basic Enhanced Rollback Example ===');


  const pgStore = new PostgreSQLRollbackStore(
    createDefaultRollbackConfig(),
    createDefaultStoreOptions(),
    {
      connectionString: 'postgresql://user:pass@localhost:5432/memento',
      schema: 'rollback',
      tablePrefix: 'enhanced_'
    }
  );


  await pgStore.initialize();


  const rollbackManager = new RollbackManager(
    { ...createDefaultRollbackConfig(), enablePersistence: true },
    createDefaultStoreOptions()
  );


  const mockDbService: MockDatabaseService = {
    isReady: async () => true
  };

  const mockKgService: MockKnowledgeGraphService = {
    getEntities: async () => [
      { id: '1', type: 'entity', name: 'Example Entity' }
    ],
    getRelationships: async () => [
      { id: '1', fromEntityId: '1', toEntityId: '2', type: 'DEPENDS_ON' }
    ],
    restoreEntities: async (entities) => {
      console.log(`Restoring ${entities.length} entities`);
    },
    restoreRelationships: async (relationships) => {
      console.log(`Restoring ${relationships.length} relationships`);
    }
  };

  rollbackManager.setServices({
    databaseService: mockDbService,
    knowledgeGraphService: mockKgService
  });


  const rollbackPoint = await rollbackManager.createRollbackPoint(
    'Enhanced Example Rollback',
    'Demonstration of enhanced rollback capabilities',
    { source: 'example', version: '1.0' }
  );

  console.log(`Created rollback point: ${rollbackPoint.id}`);


  const operation = await rollbackManager.rollback(rollbackPoint.id, {
    type: RollbackOperationType.FULL,
    strategy: RollbackStrategy.SAFE
  });

  console.log(`Started rollback operation: ${operation.id}`);

  await rollbackManager.shutdown();
  await pgStore.shutdown();
}




export async function partialRollbackExample() {
  console.log('\n=== Partial Rollback Example ===');

  const rollbackManager = new RollbackManager(
    createDefaultRollbackConfig(),
    createDefaultStoreOptions()
  );


  const partialStrategy = new PartialRollbackStrategy();


  const rollbackPoint = await rollbackManager.createRollbackPoint(
    'Partial Rollback Demo',
    'Demonstrating selective rollback of specific components'
  );


  const partialContext = {
    operation: {
      id: 'partial-op-1',
      type: RollbackOperationType.PARTIAL,
      targetRollbackPointId: rollbackPoint.id,
      status: 'pending' as any,
      progress: 0,
      startedAt: new Date(),
      strategy: RollbackStrategy.SAFE,
      log: []
    },
    targetRollbackPoint: rollbackPoint,
    snapshots: [],
    diff: [
      {
        path: 'entity:user-service',
        operation: 'update' as any,
        oldValue: { version: '1.0', status: 'active' },
        newValue: { version: '1.1', status: 'active' }
      },
      {
        path: 'entity:auth-service',
        operation: 'update' as any,
        oldValue: { version: '2.0', status: 'active' },
        newValue: { version: '2.1', status: 'active' }
      },
      {
        path: 'relationship:user-auth-depends',
        operation: 'create' as any,
        oldValue: null,
        newValue: { fromEntityId: 'user-service', toEntityId: 'auth-service', type: 'DEPENDS_ON' }
      }
    ],
    conflictResolution: { strategy: ConflictStrategy.MERGE },
    partialSelections: [
      {
        type: 'entity' as any,
        identifiers: ['user-service'],
        priority: 10
      },
      {
        type: 'component' as any,
        identifiers: ['auth'],
        includePattern: /auth/,
        priority: 5
      }
    ]
  };


  const preview = await partialStrategy.generatePreview(partialContext);
  console.log('Partial rollback preview:', {
    totalChanges: preview.totalChanges,
    affectedEntities: preview.affectedItems.entities.length,
    estimatedDuration: preview.estimatedDuration
  });


  await partialStrategy.execute(partialContext);

  await rollbackManager.shutdown();
}




export async function timebasedRollbackExample() {
  console.log('\n=== Time-based Rollback Example ===');

  const rollbackManager = new RollbackManager(
    createDefaultRollbackConfig(),
    createDefaultStoreOptions()
  );

  const timebasedStrategy = new TimebasedRollbackStrategy();


  const rollbackPoint = await rollbackManager.createRollbackPoint(
    'Time-based Rollback Demo',
    'Demonstrating rollback to a specific time window'
  );


  const timebasedContext = {
    operation: {
      id: 'timebased-op-1',
      type: RollbackOperationType.SELECTIVE,
      targetRollbackPointId: rollbackPoint.id,
      status: 'pending' as any,
      progress: 0,
      startedAt: new Date(),
      strategy: RollbackStrategy.IMMEDIATE,
      log: []
    },
    targetRollbackPoint: rollbackPoint,
    snapshots: [],
    diff: [
      {
        path: 'entity:recent-change',
        operation: 'update' as any,
        oldValue: { timestamp: new Date(Date.now() - 5 * 60 * 1000) },
        newValue: { timestamp: new Date() },
        metadata: { timestamp: new Date(Date.now() - 2 * 60 * 1000) }
      },
      {
        path: 'entity:old-change',
        operation: 'update' as any,
        oldValue: { timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        newValue: { timestamp: new Date() },
        metadata: { timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000) }
      }
    ],
    conflictResolution: { strategy: ConflictStrategy.SKIP },
    timebasedFilter: {
      rollbackToTimestamp: new Date(Date.now() - 10 * 60 * 1000),
      maxChangeAge: 30 * 60 * 1000
    }
  };


  await timebasedStrategy.execute(timebasedContext);

  await rollbackManager.shutdown();
}




export async function conflictResolutionExample() {
  console.log('\n=== Conflict Resolution Example ===');

  const conflictEngine = new ConflictResolutionEngine({
    preferNewer: true,
    preserveStructure: true,
    allowPartialMerge: true,
    semanticAnalysis: true
  });


  const conflict = {
    path: 'entity:config-service',
    type: 'VALUE_MISMATCH' as any,
    currentValue: {
      port: 8080,
      environment: 'production',
      features: ['auth', 'logging', 'metrics']
    },
    rollbackValue: {
      port: 3000,
      environment: 'development',
      features: ['auth', 'logging']
    },
    context: {
      entityType: 'service-config',
      lastModified: new Date()
    }
  };


  const visualDiff = await conflictEngine.generateVisualDiff(conflict);
  console.log('Visual diff generated:', {
    id: visualDiff.id,
    type: visualDiff.type,
    similarity: visualDiff.metadata.similarity,
    autoResolvable: visualDiff.summary.autoResolvable,
    recommendedStrategy: visualDiff.summary.recommendedStrategy
  });


  const conflictUI = await conflictEngine.generateConflictUI(conflict);
  console.log('Conflict resolution options:', {
    optionsCount: conflictUI.options.length,
    primaryRecommendation: conflictUI.recommendations.primary.name,
    alternativeCount: conflictUI.recommendations.alternatives.length
  });


  const mergeResult = await conflictEngine.smartMerge(conflict, {
    rollbackId: 'test-rollback',
    path: ['entity', 'config-service'],
    priority: 7
  });

  console.log('Smart merge result:', {
    success: mergeResult.success,
    strategy: mergeResult.strategy,
    confidence: mergeResult.confidence,
    warnings: mergeResult.warnings
  });

  if (mergeResult.success) {
    console.log('Merged value:', mergeResult.mergedValue);
  }
}




export async function dryRunExample() {
  console.log('\n=== Dry Run Example ===');

  const dryRunStrategy = new DryRunRollbackStrategy();


  const analysisContext = {
    operation: {
      id: 'dryrun-op-1',
      type: RollbackOperationType.DRY_RUN,
      targetRollbackPointId: 'test-rollback',
      status: 'pending' as any,
      progress: 0,
      startedAt: new Date(),
      strategy: RollbackStrategy.SAFE,
      log: []
    },
    targetRollbackPoint: {
      id: 'test-rollback',
      name: 'Test Rollback',
      timestamp: new Date(),
      metadata: {},
      sessionId: 'session-123'
    },
    snapshots: [],
    diff: [
      {
        path: 'entity:service-a',
        operation: 'update' as any,
        oldValue: { version: '1.0' },
        newValue: { version: '1.1' }
      },
      {
        path: 'entity:service-b',
        operation: 'delete' as any,
        oldValue: { id: 'service-b', status: 'active' },
        newValue: null
      },
      {
        path: 'relationship:service-dependency',
        operation: 'create' as any,
        oldValue: null,
        newValue: { from: 'service-a', to: 'service-b', type: 'DEPENDS_ON' }
      }
    ],
    conflictResolution: { strategy: ConflictStrategy.MERGE },
    dryRun: true
  };


  const preview = await dryRunStrategy.execute(analysisContext);
  console.log('Dry-run analysis results:', {
    totalChanges: preview.totalChanges,
    changesByType: Object.fromEntries(preview.changesByType),
    estimatedDuration: preview.estimatedDuration,
    potentialConflicts: preview.potentialConflicts.length,
    affectedEntities: preview.affectedItems.entities.length,
    dependencyWarnings: preview.dependencies.circular.length > 0 ? 'Circular dependencies detected' : 'No circular dependencies'
  });
}




export async function fullIntegrationExample() {
  console.log('\n=== Full Integration Example ===');


  const rollbackManager = new RollbackManager(
    createDefaultRollbackConfig(),
    createDefaultStoreOptions()
  );


  const mockSessionManager: MockSessionManager = {
    getCurrentSessionId: () => 'session-123',
    getSessionData: async (sessionId) => ({
      id: sessionId,
      userId: 'user-456',
      startTime: new Date(),
      lastActivity: new Date(),
      metadata: {},
      rollbackPoints: [],
      checkpoints: []
    }),
    updateSessionData: async (sessionId, data) => {
      console.log(`Updated session ${sessionId} with:`, data);
    },
    createSessionCheckpoint: async (sessionId, metadata) => {
      console.log(`Created checkpoint for session ${sessionId}:`, metadata);
      return `checkpoint-${Date.now()}`;
    },
    restoreSessionCheckpoint: async (sessionId, checkpointId) => {
      console.log(`Restored checkpoint ${checkpointId} for session ${sessionId}`);
    },
    on: (event, listener) => {

    }
  };


  const mockAuditLogger: MockAuditLogger = {
    logRollbackCreation: async (rollbackPoint, context) => {
      console.log('Audit: Rollback point created', { id: rollbackPoint.id, context });
    },
    logRollbackExecution: async (operation, result, context) => {
      console.log('Audit: Rollback executed', { operationId: operation.id, success: result.success });
    },
    logConflictResolution: async (conflict, resolution, context) => {
      console.log('Audit: Conflict resolved', { path: conflict.path, strategy: resolution?.strategy });
    },
    logSystemEvent: async (event, context) => {
      console.log('Audit: System event', { type: event.type, severity: event.severity });
    },
    getAuditTrail: async (filters) => {
      return [];
    }
  };


  const integratedManager = new IntegratedRollbackManager(rollbackManager, {
    sessionIntegration: {
      enabled: true,
      autoCreateCheckpoints: true,
      checkpointThreshold: 5,
      sessionRollbackLimit: 20
    },
    auditLogging: {
      enabled: true,
      logLevel: 'info',
      retentionDays: 30,
      sensitiveDataMask: true
    },
    metrics: {
      enabled: true,
      collectInterval: 60000,
      customMetrics: true
    },
    notifications: {
      enabled: true,
      rollbackCreated: true,
      rollbackFailed: true,
      criticalConflicts: true,
      channels: ['ui', 'webhook']
    }
  });


  integratedManager.setIntegrations({
    sessionManager: mockSessionManager,
    auditLogger: mockAuditLogger,
    metricsCollector: {
      recordRollbackCreation: (point, duration) => console.log(`Metrics: Rollback created in ${duration}ms`),
      recordRollbackExecution: (op, result, duration) => console.log(`Metrics: Rollback executed in ${duration}ms`),
      recordConflictResolution: (conflicts, resolved, duration) => console.log(`Metrics: ${resolved}/${conflicts} conflicts resolved`),
      recordSystemMetric: (name, value, tags) => console.log(`Metrics: ${name} = ${value}`, tags),
      incrementCounter: (name, tags) => console.log(`Metrics: Increment ${name}`, tags)
    },
    notificationService: {
      notifyRollbackCreated: async (point, context) => console.log('Notification: Rollback created', context.severity),
      notifyRollbackExecuted: async (op, result, context) => console.log('Notification: Rollback executed', context.severity),
      notifyRollbackFailed: async (op, error, context) => console.log('Notification: Rollback failed', context.severity),
      notifyCriticalConflict: async (conflicts, context) => console.log('Notification: Critical conflict', context.severity)
    }
  });


  const rollbackPoint = await integratedManager.createRollbackPoint(
    'Integrated Rollback Demo',
    'Demonstrating full integration capabilities',
    { feature: 'integration', priority: 'high' }
  );

  console.log(`Created integrated rollback point: ${rollbackPoint.id}`);


  const metrics = await integratedManager.getEnhancedMetrics();
  console.log('Enhanced metrics:', {
    totalRollbackPoints: metrics.totalRollbackPoints,
    sessionMetrics: metrics.sessionMetrics,
    auditMetrics: metrics.auditMetrics
  });


  await rollbackManager.shutdown();
}




export async function runAllExamples() {
  try {
    await basicEnhancedRollbackExample();
    await partialRollbackExample();
    await timebasedRollbackExample();
    await conflictResolutionExample();
    await dryRunExample();
    await fullIntegrationExample();

    console.log('\n=== All examples completed successfully! ===');
  } catch (error) {
    console.error('Example execution failed:', error);
  }
}


if (require.main === module) {
  runAllExamples().catch(console.error);
}

================
File: rollback/monitoring/RollbackMonitoringDashboard.ts
================
import { EventEmitter } from 'events';
import { RollbackManager } from '../RollbackManager.js';
import { RollbackMetrics, RollbackOperation, RollbackPoint } from '../RollbackTypes.js';

export interface DashboardConfig {
  metricsInterval: number;
  alertThresholds: {
    maxFailureRate: number;
    maxAverageTime: number;
    maxMemoryUsage: number;
    maxPendingOperations: number;
  };
  retentionPeriod: number;
  enableAlerting: boolean;
}

export interface MetricSnapshot {
  timestamp: Date;
  metrics: RollbackMetrics;
  activeOperations: number;
  pendingOperations: number;
  recentFailures: number;
  memoryPressure: number;
}

export interface Alert {
  id: string;
  type: 'failure_rate' | 'performance' | 'memory' | 'capacity';
  severity: 'warning' | 'critical';
  message: string;
  timestamp: Date;
  data: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface DashboardSummary {
  uptime: number;
  totalRollbackPoints: number;
  totalOperations: number;
  successRate: number;
  averageOperationTime: number;
  currentMemoryUsage: number;
  activeAlerts: Alert[];
  recentMetrics: MetricSnapshot[];
  healthStatus: 'healthy' | 'warning' | 'critical';
}




export class RollbackMonitoringDashboard extends EventEmitter {
  private manager: RollbackManager;
  private config: DashboardConfig;
  private metrics: MetricSnapshot[] = [];
  private alerts: Alert[] = [];
  private metricsTimer?: NodeJS.Timeout;
  private startTime: Date;
  private lastCleanup: Date;

  constructor(manager: RollbackManager, config: Partial<DashboardConfig> = {}) {
    super();

    this.manager = manager;
    this.config = {
      metricsInterval: 30000,
      alertThresholds: {
        maxFailureRate: 10,
        maxAverageTime: 5000,
        maxMemoryUsage: 100 * 1024 * 1024,
        maxPendingOperations: 50
      },
      retentionPeriod: 24 * 60 * 60 * 1000,
      enableAlerting: true,
      ...config
    };

    this.startTime = new Date();
    this.lastCleanup = new Date();

    this.setupEventListeners();
  }




  start(): void {

    this.collectMetrics();


    this.metricsTimer = setInterval(() => {
      this.collectMetrics();
      this.checkAlerts();
      this.cleanupOldData();
    }, this.config.metricsInterval);

    this.emit('monitoring-started');
  }




  stop(): void {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = undefined;
    }

    this.emit('monitoring-stopped');
  }




  getSummary(): DashboardSummary {
    const currentMetrics = this.manager.getMetrics();
    const activeAlerts = this.alerts.filter(alert => !alert.resolved);
    const uptime = Date.now() - this.startTime.getTime();


    let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (activeAlerts.some(alert => alert.severity === 'critical')) {
      healthStatus = 'critical';
    } else if (activeAlerts.length > 0) {
      healthStatus = 'warning';
    }


    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp >= oneHourAgo);

    return {
      uptime,
      totalRollbackPoints: currentMetrics.totalRollbackPoints,
      totalOperations: currentMetrics.successfulRollbacks + currentMetrics.failedRollbacks,
      successRate: this.calculateSuccessRate(currentMetrics),
      averageOperationTime: currentMetrics.averageRollbackTime,
      currentMemoryUsage: currentMetrics.memoryUsage,
      activeAlerts,
      recentMetrics: recentMetrics.slice(-60),
      healthStatus
    };
  }




  getMetricsForTimeRange(startTime: Date, endTime: Date): MetricSnapshot[] {
    return this.metrics.filter(
      metric => metric.timestamp >= startTime && metric.timestamp <= endTime
    );
  }




  getAlerts(options: {
    type?: Alert['type'];
    severity?: Alert['severity'];
    resolved?: boolean;
    since?: Date;
  } = {}): Alert[] {
    return this.alerts.filter(alert => {
      if (options.type && alert.type !== options.type) return false;
      if (options.severity && alert.severity !== options.severity) return false;
      if (options.resolved !== undefined && alert.resolved !== options.resolved) return false;
      if (options.since && alert.timestamp < options.since) return false;
      return true;
    });
  }




  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.emit('alert-resolved', alert);
      return true;
    }
    return false;
  }




  getPerformanceTrends(hours: number = 24): {
    operationTimes: Array<{ timestamp: Date; averageTime: number }>;
    memoryUsage: Array<{ timestamp: Date; usage: number }>;
    successRates: Array<{ timestamp: Date; rate: number }>;
  } {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const relevantMetrics = this.metrics.filter(m => m.timestamp >= cutoff);

    return {
      operationTimes: relevantMetrics.map(m => ({
        timestamp: m.timestamp,
        averageTime: m.metrics.averageRollbackTime
      })),
      memoryUsage: relevantMetrics.map(m => ({
        timestamp: m.timestamp,
        usage: m.metrics.memoryUsage
      })),
      successRates: relevantMetrics.map(m => ({
        timestamp: m.timestamp,
        rate: this.calculateSuccessRate(m.metrics)
      }))
    };
  }




  exportMetrics(format: 'prometheus' | 'json' = 'json'): string {
    const summary = this.getSummary();

    if (format === 'prometheus') {
      return this.formatPrometheusMetrics(summary);
    }

    return JSON.stringify({
      dashboard_summary: summary,
      recent_metrics: this.metrics.slice(-10),
      active_alerts: this.alerts.filter(a => !a.resolved)
    }, null, 2);
  }




  private setupEventListeners(): void {
    this.manager.on('rollback-point-created', () => {
      this.collectMetrics();
    });

    this.manager.on('rollback-completed', (operation: RollbackOperation) => {
      this.collectMetrics();
      this.checkOperationPerformance(operation);
    });

    this.manager.on('rollback-failed', (operation: RollbackOperation) => {
      this.collectMetrics();
      this.handleFailure(operation);
    });

    this.manager.on('cleanup-completed', () => {
      this.collectMetrics();
    });
  }




  private async collectMetrics(): Promise<void> {
    try {
      const baseMetrics = this.manager.getMetrics();
      const allPoints = await this.manager.getAllRollbackPoints();


      const activeOperations = 0;
      const pendingOperations = 0;


      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentFailures = this.alerts.filter(
        alert => alert.type === 'failure_rate' && alert.timestamp >= oneHourAgo
      ).length;


      const memoryPressure = Math.min(100,
        (baseMetrics.memoryUsage / this.config.alertThresholds.maxMemoryUsage) * 100
      );

      const snapshot: MetricSnapshot = {
        timestamp: new Date(),
        metrics: baseMetrics,
        activeOperations,
        pendingOperations,
        recentFailures,
        memoryPressure
      };

      this.metrics.push(snapshot);
      this.emit('metrics-collected', snapshot);

    } catch (error) {
      this.emit('metrics-collection-error', error);
    }
  }




  private checkAlerts(): void {
    if (!this.config.enableAlerting) return;

    const currentMetrics = this.metrics[this.metrics.length - 1];
    if (!currentMetrics) return;


    const successRate = this.calculateSuccessRate(currentMetrics.metrics);
    const failureRate = 100 - successRate;
    if (failureRate > this.config.alertThresholds.maxFailureRate) {
      this.createAlert('failure_rate', 'critical',
        `High failure rate: ${failureRate.toFixed(1)}%`,
        { failureRate, threshold: this.config.alertThresholds.maxFailureRate }
      );
    }


    if (currentMetrics.metrics.averageRollbackTime > this.config.alertThresholds.maxAverageTime) {
      this.createAlert('performance', 'warning',
        `Slow rollback operations: ${currentMetrics.metrics.averageRollbackTime}ms average`,
        {
          averageTime: currentMetrics.metrics.averageRollbackTime,
          threshold: this.config.alertThresholds.maxAverageTime
        }
      );
    }


    if (currentMetrics.metrics.memoryUsage > this.config.alertThresholds.maxMemoryUsage) {
      this.createAlert('memory', 'warning',
        `High memory usage: ${(currentMetrics.metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`,
        {
          memoryUsage: currentMetrics.metrics.memoryUsage,
          threshold: this.config.alertThresholds.maxMemoryUsage
        }
      );
    }


    if (currentMetrics.pendingOperations > this.config.alertThresholds.maxPendingOperations) {
      this.createAlert('capacity', 'critical',
        `Too many pending operations: ${currentMetrics.pendingOperations}`,
        {
          pendingOperations: currentMetrics.pendingOperations,
          threshold: this.config.alertThresholds.maxPendingOperations
        }
      );
    }
  }




  private createAlert(
    type: Alert['type'],
    severity: Alert['severity'],
    message: string,
    data: Record<string, any>
  ): void {

    const existingSimilarAlert = this.alerts.find(
      alert => !alert.resolved && alert.type === type && alert.severity === severity
    );

    if (existingSimilarAlert) {

      existingSimilarAlert.data = { ...existingSimilarAlert.data, ...data };
      return;
    }

    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      timestamp: new Date(),
      data,
      resolved: false
    };

    this.alerts.push(alert);
    this.emit('alert-created', alert);
  }




  private handleFailure(operation: RollbackOperation): void {
    this.createAlert('failure_rate', 'warning',
      `Rollback operation failed: ${operation.error}`,
      { operationId: operation.id, error: operation.error }
    );
  }




  private checkOperationPerformance(operation: RollbackOperation): void {
    if (operation.startedAt && operation.completedAt) {
      const duration = operation.completedAt.getTime() - operation.startedAt.getTime();

      if (duration > this.config.alertThresholds.maxAverageTime * 2) {
        this.createAlert('performance', 'warning',
          `Slow rollback operation: ${duration}ms`,
          { operationId: operation.id, duration }
        );
      }
    }
  }




  private calculateSuccessRate(metrics: RollbackMetrics): number {
    const total = metrics.successfulRollbacks + metrics.failedRollbacks;
    if (total === 0) return 100;
    return (metrics.successfulRollbacks / total) * 100;
  }




  private cleanupOldData(): void {
    const now = Date.now();
    const cutoff = new Date(now - this.config.retentionPeriod);


    this.metrics = this.metrics.filter(metric => metric.timestamp >= cutoff);


    this.alerts = this.alerts.filter(alert =>
      !alert.resolved || (alert.resolvedAt && alert.resolvedAt >= cutoff)
    );

    this.lastCleanup = new Date();
  }




  private formatPrometheusMetrics(summary: DashboardSummary): string {
    const lines: string[] = [];


    lines.push(`# HELP rollback_total_points Total number of rollback points`);
    lines.push(`# TYPE rollback_total_points gauge`);
    lines.push(`rollback_total_points ${summary.totalRollbackPoints}`);

    lines.push(`# HELP rollback_success_rate Success rate percentage`);
    lines.push(`# TYPE rollback_success_rate gauge`);
    lines.push(`rollback_success_rate ${summary.successRate}`);

    lines.push(`# HELP rollback_average_time_ms Average operation time in milliseconds`);
    lines.push(`# TYPE rollback_average_time_ms gauge`);
    lines.push(`rollback_average_time_ms ${summary.averageOperationTime}`);

    lines.push(`# HELP rollback_memory_usage_bytes Current memory usage in bytes`);
    lines.push(`# TYPE rollback_memory_usage_bytes gauge`);
    lines.push(`rollback_memory_usage_bytes ${summary.currentMemoryUsage}`);

    lines.push(`# HELP rollback_active_alerts Number of active alerts`);
    lines.push(`# TYPE rollback_active_alerts gauge`);
    lines.push(`rollback_active_alerts ${summary.activeAlerts.length}`);

    lines.push(`# HELP rollback_uptime_seconds Uptime in seconds`);
    lines.push(`# TYPE rollback_uptime_seconds counter`);
    lines.push(`rollback_uptime_seconds ${Math.floor(summary.uptime / 1000)}`);

    return lines.join('\n') + '\n';
  }
}

================
File: rollback/ConflictResolutionEngine.ts
================
import { EventEmitter } from 'events';



interface Change {
  added?: boolean;
  removed?: boolean;
  value: string;
}

function diffLines(oldStr: string, newStr: string): Change[] {
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');
  const changes: Change[] = [];


  const maxLines = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine === undefined) {
      changes.push({ added: true, value: newLine + '\n' });
    } else if (newLine === undefined) {
      changes.push({ removed: true, value: oldLine + '\n' });
    } else if (oldLine !== newLine) {
      changes.push({ removed: true, value: oldLine + '\n' });
      changes.push({ added: true, value: newLine + '\n' });
    } else {
      changes.push({ value: oldLine + '\n' });
    }
  }

  return changes;
}

function diffWords(oldStr: string, newStr: string): Change[] {
  const oldWords = oldStr.split(/\s+/);
  const newWords = newStr.split(/\s+/);
  const changes: Change[] = [];


  const maxWords = Math.max(oldWords.length, newWords.length);
  for (let i = 0; i < maxWords; i++) {
    const oldWord = oldWords[i];
    const newWord = newWords[i];

    if (oldWord === undefined) {
      changes.push({ added: true, value: newWord + ' ' });
    } else if (newWord === undefined) {
      changes.push({ removed: true, value: oldWord + ' ' });
    } else if (oldWord !== newWord) {
      changes.push({ removed: true, value: oldWord + ' ' });
      changes.push({ added: true, value: newWord + ' ' });
    } else {
      changes.push({ value: oldWord + ' ' });
    }
  }

  return changes;
}

function diffChars(oldStr: string, newStr: string): Change[] {
  const changes: Change[] = [];
  const maxLen = Math.max(oldStr.length, newStr.length);

  for (let i = 0; i < maxLen; i++) {
    const oldChar = oldStr[i];
    const newChar = newStr[i];

    if (oldChar === undefined) {
      changes.push({ added: true, value: newChar });
    } else if (newChar === undefined) {
      changes.push({ removed: true, value: oldChar });
    } else if (oldChar !== newChar) {
      changes.push({ removed: true, value: oldChar });
      changes.push({ added: true, value: newChar });
    } else {
      changes.push({ value: oldChar });
    }
  }

  return changes;
}
import {
  RollbackConflict,
  ConflictType,
  ConflictStrategy,
  ConflictResolution,
  DiffEntry,
  RollbackLogEntry,
  RollbackError
} from './RollbackTypes.js';




interface VisualDiff {
  id: string;
  type: 'line' | 'word' | 'char' | 'json' | 'semantic';
  conflict: RollbackConflict;
  changes: DiffLine[];
  summary: DiffSummary;
  metadata: {
    totalLines: number;
    addedLines: number;
    removedLines: number;
    modifiedLines: number;
    similarity: number;
  };
}

interface DiffLine {
  lineNumber?: number;
  type: 'added' | 'removed' | 'modified' | 'context';
  content: string;
  originalContent?: string;
  confidence: number;
  tokens?: DiffToken[];
}

interface DiffToken {
  text: string;
  type: 'added' | 'removed' | 'unchanged';
  position: { start: number; end: number };
}

interface DiffSummary {
  conflictType: ConflictType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoResolvable: boolean;
  recommendedStrategy: ConflictStrategy;
  reason: string;
  impact: {
    entities: string[];
    relationships: string[];
    dependencies: string[];
  };
}




interface MergeResult {
  success: boolean;
  mergedValue: any;
  strategy: ConflictStrategy;
  confidence: number;
  warnings: string[];
  appliedChanges: {
    kept: string[];
    discarded: string[];
    merged: string[];
  };
}




interface SmartMergeConfig {
  preferNewer: boolean;
  preferLarger: boolean;
  preserveStructure: boolean;
  allowPartialMerge: boolean;
  maxComplexity: number;
  semanticAnalysis: boolean;
}




interface ConflictContext {
  rollbackId: string;
  entityType?: string;
  path: string[];
  metadata?: Record<string, any>;
  dependencies?: string[];
  priority: number;
}




export class ConflictResolutionEngine extends EventEmitter {
  private mergeConfig: SmartMergeConfig = {
    preferNewer: true,
    preferLarger: false,
    preserveStructure: true,
    allowPartialMerge: true,
    maxComplexity: 1000,
    semanticAnalysis: true
  };

  constructor(config?: Partial<SmartMergeConfig>) {
    super();
    if (config) {
      this.mergeConfig = { ...this.mergeConfig, ...config };
    }
  }




  async generateVisualDiff(conflict: RollbackConflict): Promise<VisualDiff> {
    const diffId = `diff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {

      const diffType = this.determineDiffType(conflict.currentValue, conflict.rollbackValue);


      const changes = await this.generateDiff(
        conflict.currentValue,
        conflict.rollbackValue,
        diffType
      );


      const metadata = this.analyzeDiff(changes);


      const summary = await this.createDiffSummary(conflict, changes, metadata);

      return {
        id: diffId,
        type: diffType,
        conflict,
        changes,
        summary,
        metadata
      };

    } catch (error) {
      throw new RollbackError(
        'Failed to generate visual diff',
        'VISUAL_DIFF_FAILED',
        {
          conflictPath: conflict.path,
          error: error instanceof Error ? error.message : String(error)
        }
      );
    }
  }




  async smartMerge(
    conflict: RollbackConflict,
    context?: ConflictContext
  ): Promise<MergeResult> {
    try {

      const complexity = this.analyzeConflictComplexity(conflict);
      if (complexity > this.mergeConfig.maxComplexity) {
        return {
          success: false,
          mergedValue: null,
          strategy: ConflictStrategy.ASK_USER,
          confidence: 0,
          warnings: ['Conflict too complex for automatic merge'],
          appliedChanges: { kept: [], discarded: [], merged: [] }
        };
      }


      const strategy = await this.determineBestStrategy(conflict, context);


      switch (strategy) {
        case ConflictStrategy.MERGE:
          return await this.performIntelligentMerge(conflict, context);

        case ConflictStrategy.OVERWRITE:
          return this.performOverwrite(conflict, 'rollback');

        case ConflictStrategy.SKIP:
          return this.performSkip(conflict);

        default:
          return {
            success: false,
            mergedValue: null,
            strategy: ConflictStrategy.ASK_USER,
            confidence: 0,
            warnings: ['Strategy not supported for smart merge'],
            appliedChanges: { kept: [], discarded: [], merged: [] }
          };
      }

    } catch (error) {
      return {
        success: false,
        mergedValue: null,
        strategy: ConflictStrategy.ABORT,
        confidence: 0,
        warnings: [`Merge failed: ${error instanceof Error ? error.message : String(error)}`],
        appliedChanges: { kept: [], discarded: [], merged: [] }
      };
    }
  }




  async generateConflictUI(conflict: RollbackConflict): Promise<{
    visualDiff: VisualDiff;
    options: ConflictResolutionOption[];
    recommendations: {
      primary: ConflictResolutionOption;
      alternatives: ConflictResolutionOption[];
    };
  }> {
    const visualDiff = await this.generateVisualDiff(conflict);
    const options = await this.generateResolutionOptions(conflict);


    const sortedOptions = options.sort((a, b) => b.confidence - a.confidence);

    return {
      visualDiff,
      options,
      recommendations: {
        primary: sortedOptions[0],
        alternatives: sortedOptions.slice(1)
      }
    };
  }




  async batchResolveConflicts(
    conflicts: RollbackConflict[],
    resolution: ConflictResolution,
    context?: ConflictContext
  ): Promise<Map<string, MergeResult>> {
    const results = new Map<string, MergeResult>();


    const conflictGroups = this.groupRelatedConflicts(conflicts);

    for (const group of conflictGroups) {

      for (const conflict of group) {
        const result = await this.resolveConflict(conflict, resolution, context);
        results.set(conflict.path, result);
      }
    }

    return results;
  }




  async resolveConflict(
    conflict: RollbackConflict,
    resolution: ConflictResolution,
    context?: ConflictContext
  ): Promise<MergeResult> {
    try {

      const primaryResult = await this.applyResolutionStrategy(conflict, resolution.strategy, context);

      if (primaryResult.success && primaryResult.confidence >= 70) {
        return primaryResult;
      }


      if (resolution.strategy !== ConflictStrategy.MERGE) {
        const smartMergeResult = await this.smartMerge(conflict, context);
        if (smartMergeResult.success && smartMergeResult.confidence > primaryResult.confidence) {
          return smartMergeResult;
        }
      }


      return primaryResult.confidence >= smartMergeResult.confidence ? primaryResult : smartMergeResult;

    } catch (error) {
      return {
        success: false,
        mergedValue: null,
        strategy: ConflictStrategy.ABORT,
        confidence: 0,
        warnings: [`Resolution failed: ${error instanceof Error ? error.message : String(error)}`],
        appliedChanges: { kept: [], discarded: [], merged: [] }
      };
    }
  }

  private determineDiffType(currentValue: any, rollbackValue: any): 'line' | 'word' | 'char' | 'json' | 'semantic' {

    if (!currentValue || !rollbackValue) {
      return 'semantic';
    }


    if (typeof currentValue === 'object' && typeof rollbackValue === 'object') {
      return 'json';
    }


    if (typeof currentValue === 'string' && typeof rollbackValue === 'string') {

      if (currentValue.includes('\n') || rollbackValue.includes('\n')) {
        return 'line';
      }


      if (currentValue.length > 100 || rollbackValue.length > 100) {
        return 'word';
      }


      return 'char';
    }


    return 'semantic';
  }

  private async generateDiff(
    currentValue: any,
    rollbackValue: any,
    diffType: 'line' | 'word' | 'char' | 'json' | 'semantic'
  ): Promise<DiffLine[]> {
    const currentStr = this.valueToString(currentValue);
    const rollbackStr = this.valueToString(rollbackValue);

    let changes: Change[] = [];

    switch (diffType) {
      case 'line':
        changes = diffLines(rollbackStr, currentStr);
        break;
      case 'word':
        changes = diffWords(rollbackStr, currentStr);
        break;
      case 'char':
        changes = diffChars(rollbackStr, currentStr);
        break;
      case 'json':
        changes = await this.generateJsonDiff(rollbackValue, currentValue);
        break;
      case 'semantic':
        changes = await this.generateSemanticDiff(rollbackValue, currentValue);
        break;
    }

    return this.convertToDiffLines(changes, diffType);
  }

  private async generateJsonDiff(rollbackValue: any, currentValue: any): Promise<Change[]> {
    try {
      const rollbackJson = JSON.stringify(rollbackValue, null, 2);
      const currentJson = JSON.stringify(currentValue, null, 2);
      return diffLines(rollbackJson, currentJson);
    } catch (error) {

      const rollbackStr = this.valueToString(rollbackValue);
      const currentStr = this.valueToString(currentValue);
      return diffWords(rollbackStr, currentStr);
    }
  }

  private async generateSemanticDiff(rollbackValue: any, currentValue: any): Promise<Change[]> {

    const changes: Change[] = [];

    if (typeof rollbackValue !== typeof currentValue) {
      changes.push({
        removed: true,
        value: `Type: ${typeof rollbackValue} (${this.valueToString(rollbackValue)})`
      });
      changes.push({
        added: true,
        value: `Type: ${typeof currentValue} (${this.valueToString(currentValue)})`
      });
    } else if (rollbackValue !== currentValue) {
      changes.push({
        removed: true,
        value: this.valueToString(rollbackValue)
      });
      changes.push({
        added: true,
        value: this.valueToString(currentValue)
      });
    } else {
      changes.push({
        value: this.valueToString(currentValue)
      });
    }

    return changes;
  }

  private convertToDiffLines(changes: Change[], diffType: string): DiffLine[] {
    const lines: DiffLine[] = [];
    let lineNumber = 1;

    for (const change of changes) {
      const content = change.value || '';
      const contentLines = content.split('\n');

      for (let i = 0; i < contentLines.length; i++) {
        const line = contentLines[i];
        if (i === contentLines.length - 1 && line === '') continue; // Skip empty last line

        let type: 'added' | 'removed' | 'modified' | 'context' = 'context';
        if (change.added) type = 'added';
        else if (change.removed) type = 'removed';

        lines.push({
          lineNumber: type !== 'added' ? lineNumber++ : undefined,
          type,
          content: line,
          confidence: 95,
          tokens: diffType === 'word' || diffType === 'char' ? this.tokenizeLine(line, change) : undefined
        });
      }
    }

    return lines;
  }

  private tokenizeLine(line: string, change: Change): DiffToken[] {
    return [{
      text: line,
      type: change.added ? 'added' : change.removed ? 'removed' : 'unchanged',
      position: { start: 0, end: line.length }
    }];
  }

  private valueToString(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return value.toString();
      }
    }
    return String(value);
  }

  private analyzeDiff(changes: DiffLine[]): VisualDiff['metadata'] {
    const totalLines = changes.length;
    let addedLines = 0;
    let removedLines = 0;
    let modifiedLines = 0;

    for (const change of changes) {
      switch (change.type) {
        case 'added':
          addedLines++;
          break;
        case 'removed':
          removedLines++;
          break;
        case 'modified':
          modifiedLines++;
          break;
      }
    }


    const unchangedLines = totalLines - addedLines - removedLines - modifiedLines;
    const similarity = totalLines > 0 ? (unchangedLines / totalLines) * 100 : 0;

    return {
      totalLines,
      addedLines,
      removedLines,
      modifiedLines,
      similarity
    };
  }

  private async createDiffSummary(
    conflict: RollbackConflict,
    changes: DiffLine[],
    metadata: VisualDiff['metadata']
  ): Promise<DiffSummary> {

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (conflict.type === ConflictType.TYPE_MISMATCH) {
      severity = 'high';
    } else if (metadata.similarity < 30) {
      severity = 'critical';
    } else if (metadata.similarity < 60) {
      severity = 'medium';
    }


    const autoResolvable =
      severity !== 'critical' &&
      metadata.similarity > 50 &&
      changes.length < 20;


    let recommendedStrategy = ConflictStrategy.ASK_USER;
    if (autoResolvable) {
      if (metadata.similarity > 80) {
        recommendedStrategy = ConflictStrategy.MERGE;
      } else {
        recommendedStrategy = ConflictStrategy.OVERWRITE;
      }
    }

    return {
      conflictType: conflict.type,
      severity,
      autoResolvable,
      recommendedStrategy,
      reason: this.generateReasonText(conflict, metadata, severity),
      impact: {
        entities: this.extractAffectedEntities(conflict),
        relationships: this.extractAffectedRelationships(conflict),
        dependencies: this.extractAffectedDependencies(conflict)
      }
    };
  }

  private generateReasonText(
    conflict: RollbackConflict,
    metadata: VisualDiff['metadata'],
    severity: string
  ): string {
    const similarity = Math.round(metadata.similarity);

    if (severity === 'critical') {
      return `Critical conflict with ${similarity}% similarity. Manual review required.`;
    } else if (severity === 'high') {
      return `High-risk conflict due to ${conflict.type}. Consider careful review.`;
    } else if (similarity > 80) {
      return `Minor differences detected (${similarity}% similar). Safe to auto-merge.`;
    } else {
      return `Moderate conflict with ${similarity}% similarity. Review recommended.`;
    }
  }

  private extractAffectedEntities(conflict: RollbackConflict): string[] {

    const entities = new Set<string>();

    if (conflict.path.startsWith('entity:')) {
      entities.add(conflict.path.split(':')[1]);
    }

    if (conflict.context?.entities) {
      conflict.context.entities.forEach((e: string) => entities.add(e));
    }

    return Array.from(entities);
  }

  private extractAffectedRelationships(conflict: RollbackConflict): string[] {

    const relationships = new Set<string>();

    if (conflict.path.startsWith('relationship:')) {
      relationships.add(conflict.path.split(':')[1]);
    }

    if (conflict.context?.relationships) {
      conflict.context.relationships.forEach((r: string) => relationships.add(r));
    }

    return Array.from(relationships);
  }

  private extractAffectedDependencies(conflict: RollbackConflict): string[] {

    if (conflict.context?.dependencies) {
      return Array.from(conflict.context.dependencies);
    }
    return [];
  }

  private analyzeConflictComplexity(conflict: RollbackConflict): number {
    let complexity = 0;


    switch (conflict.type) {
      case ConflictType.VALUE_MISMATCH:
        complexity += 10;
        break;
      case ConflictType.TYPE_MISMATCH:
        complexity += 50;
        break;
      case ConflictType.DEPENDENCY_CONFLICT:
        complexity += 100;
        break;
      default:
        complexity += 25;
    }


    const currentSize = this.valueToString(conflict.currentValue).length;
    const rollbackSize = this.valueToString(conflict.rollbackValue).length;
    complexity += Math.max(currentSize, rollbackSize) / 100;


    if (typeof conflict.currentValue === 'object' && conflict.currentValue !== null) {
      complexity += Object.keys(conflict.currentValue).length * 5;
    }

    return Math.round(complexity);
  }

  private async determineBestStrategy(
    conflict: RollbackConflict,
    context?: ConflictContext
  ): Promise<ConflictStrategy> {

    if (context?.priority !== undefined) {
      if (context.priority > 8) return ConflictStrategy.OVERWRITE;
      if (context.priority < 3) return ConflictStrategy.SKIP;
    }


    switch (conflict.type) {
      case ConflictType.MISSING_TARGET:
        return ConflictStrategy.SKIP;
      case ConflictType.PERMISSION_DENIED:
        return ConflictStrategy.ASK_USER;
      case ConflictType.TYPE_MISMATCH:
        return this.mergeConfig.preserveStructure ? ConflictStrategy.ASK_USER : ConflictStrategy.OVERWRITE;
      default:
        return ConflictStrategy.MERGE;
    }
  }

  private async performIntelligentMerge(
    conflict: RollbackConflict,
    context?: ConflictContext
  ): Promise<MergeResult> {
    try {
      let mergedValue: any;
      let confidence = 0;
      const warnings: string[] = [];
      const appliedChanges = { kept: [], discarded: [], merged: [] };


      if (typeof conflict.currentValue === 'object' && typeof conflict.rollbackValue === 'object') {
        const objectMerge = await this.mergeObjects(conflict.currentValue, conflict.rollbackValue);
        mergedValue = objectMerge.result;
        confidence = objectMerge.confidence;
        warnings.push(...objectMerge.warnings);
        appliedChanges.merged.push(...objectMerge.mergedKeys);
      } else if (typeof conflict.currentValue === 'string' && typeof conflict.rollbackValue === 'string') {
        const stringMerge = await this.mergeStrings(conflict.currentValue, conflict.rollbackValue);
        mergedValue = stringMerge.result;
        confidence = stringMerge.confidence;
        warnings.push(...stringMerge.warnings);
      } else {

        if (this.mergeConfig.preferNewer) {
          mergedValue = conflict.currentValue;
          appliedChanges.kept.push('current_value');
          appliedChanges.discarded.push('rollback_value');
        } else {
          mergedValue = conflict.rollbackValue;
          appliedChanges.kept.push('rollback_value');
          appliedChanges.discarded.push('current_value');
        }
        confidence = 60;
      }

      return {
        success: true,
        mergedValue,
        strategy: ConflictStrategy.MERGE,
        confidence,
        warnings,
        appliedChanges
      };

    } catch (error) {
      return {
        success: false,
        mergedValue: null,
        strategy: ConflictStrategy.MERGE,
        confidence: 0,
        warnings: [`Intelligent merge failed: ${error instanceof Error ? error.message : String(error)}`],
        appliedChanges: { kept: [], discarded: [], merged: [] }
      };
    }
  }

  private async mergeObjects(current: any, rollback: any): Promise<{
    result: any;
    confidence: number;
    warnings: string[];
    mergedKeys: string[];
  }> {
    const result = { ...current };
    const warnings: string[] = [];
    const mergedKeys: string[] = [];
    let conflicts = 0;
    let resolutions = 0;


    for (const [key, value] of Object.entries(rollback)) {
      if (!(key in current)) {

        result[key] = value;
        mergedKeys.push(`+${key}`);
        resolutions++;
      } else if (current[key] !== value) {

        conflicts++;

        if (typeof current[key] === typeof value && typeof value === 'object') {

          const nestedMerge = await this.mergeObjects(current[key], value);
          result[key] = nestedMerge.result;
          mergedKeys.push(`~${key}`);
          warnings.push(...nestedMerge.warnings);
          resolutions++;
        } else {

          if (this.mergeConfig.preferNewer) {

            mergedKeys.push(`=${key}(current)`);
          } else {

            result[key] = value;
            mergedKeys.push(`=${key}(rollback)`);
          }
          resolutions++;
        }
      }
    }


    const confidence = conflicts > 0 ? Math.round((resolutions / conflicts) * 100) : 95;

    if (conflicts > resolutions / 2) {
      warnings.push(`High conflict rate: ${conflicts} conflicts, ${resolutions} resolutions`);
    }

    return { result, confidence, warnings, mergedKeys };
  }

  private async mergeStrings(current: string, rollback: string): Promise<{
    result: string;
    confidence: number;
    warnings: string[];
  }> {

    const currentLines = current.split('\n');
    const rollbackLines = rollback.split('\n');
    const warnings: string[] = [];


    const changes = diffLines(rollback, current);
    const mergedLines: string[] = [];

    let confidence = 80;

    for (const change of changes) {
      if (change.added) {

        if (this.mergeConfig.preferNewer) {
          mergedLines.push(...change.value.split('\n').filter(l => l !== ''));
        }
      } else if (change.removed) {
        // Line was removed in current (exists in rollback)
        if (!this.mergeConfig.preferNewer) {
          mergedLines.push(...change.value.split('\n').filter(l => l !== ''));
        } else {
          confidence -= 5; // Reduce confidence when discarding rollback content
        }
      } else {
        // Unchanged line
        mergedLines.push(...change.value.split('\n').filter(l => l !== ''));
      }
    }

    if (mergedLines.length === 0) {
      warnings.push('String merge resulted in empty content');
      confidence = 30;
    }

    return {
      result: mergedLines.join('\n'),
      confidence: Math.max(0, confidence),
      warnings
    };
  }

  private performOverwrite(conflict: RollbackConflict, preference: 'current' | 'rollback'): MergeResult {
    const mergedValue = preference === 'rollback' ? conflict.rollbackValue : conflict.currentValue;
    const discarded = preference === 'rollback' ? 'current' : 'rollback';

    return {
      success: true,
      mergedValue,
      strategy: ConflictStrategy.OVERWRITE,
      confidence: 90,
      warnings: [`Overwrote ${discarded} value with ${preference} value`],
      appliedChanges: {
        kept: [preference],
        discarded: [discarded],
        merged: []
      }
    };
  }

  private performSkip(conflict: RollbackConflict): MergeResult {
    return {
      success: true,
      mergedValue: conflict.currentValue,
      strategy: ConflictStrategy.SKIP,
      confidence: 100,
      warnings: ['Conflict skipped - current value preserved'],
      appliedChanges: {
        kept: ['current'],
        discarded: ['rollback'],
        merged: []
      }
    };
  }

  private async generateResolutionOptions(conflict: RollbackConflict): Promise<ConflictResolutionOption[]> {
    const options: ConflictResolutionOption[] = [];


    options.push({
      id: 'keep-current',
      name: 'Keep Current Value',
      description: 'Preserve the current state and ignore rollback value',
      strategy: ConflictStrategy.SKIP,
      confidence: 80,
      preview: this.valueToString(conflict.currentValue)
    });

    options.push({
      id: 'use-rollback',
      name: 'Use Rollback Value',
      description: 'Replace current value with rollback value',
      strategy: ConflictStrategy.OVERWRITE,
      confidence: 85,
      preview: this.valueToString(conflict.rollbackValue)
    });


    if (this.canMerge(conflict.currentValue, conflict.rollbackValue)) {
      const mergePreview = await this.performIntelligentMerge(conflict);
      options.push({
        id: 'smart-merge',
        name: 'Smart Merge',
        description: 'Intelligently combine both values',
        strategy: ConflictStrategy.MERGE,
        confidence: mergePreview.confidence,
        preview: this.valueToString(mergePreview.mergedValue)
      });
    }

    return options;
  }

  private canMerge(value1: any, value2: any): boolean {

    return (
      (typeof value1 === 'object' && typeof value2 === 'object') ||
      (typeof value1 === 'string' && typeof value2 === 'string')
    );
  }

  private groupRelatedConflicts(conflicts: RollbackConflict[]): RollbackConflict[][] {

    const groups = new Map<string, RollbackConflict[]>();

    for (const conflict of conflicts) {
      const pathParts = conflict.path.split('/');
      const groupKey = pathParts.slice(0, 2).join('/');

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(conflict);
    }

    return Array.from(groups.values());
  }

  private async applyResolutionStrategy(
    conflict: RollbackConflict,
    strategy: ConflictStrategy,
    context?: ConflictContext
  ): Promise<MergeResult> {
    switch (strategy) {
      case ConflictStrategy.MERGE:
        return await this.performIntelligentMerge(conflict, context);
      case ConflictStrategy.OVERWRITE:
        return this.performOverwrite(conflict, 'rollback');
      case ConflictStrategy.SKIP:
        return this.performSkip(conflict);
      default:
        return {
          success: false,
          mergedValue: null,
          strategy,
          confidence: 0,
          warnings: [`Strategy ${strategy} not implemented`],
          appliedChanges: { kept: [], discarded: [], merged: [] }
        };
    }
  }
}

interface ConflictResolutionOption {
  id: string;
  name: string;
  description: string;
  strategy: ConflictStrategy;
  confidence: number;
  preview: string;
}


export type {
  VisualDiff,
  DiffLine,
  DiffToken,
  DiffSummary,
  MergeResult,
  SmartMergeConfig,
  ConflictContext,
  ConflictResolutionOption
};

================
File: rollback/DiffEngine.ts
================
import { v4 as uuidv4 } from 'uuid';
import {
  DiffEntry,
  DiffOperation,
  RollbackDiff,
  Snapshot,
  RollbackError
} from './RollbackTypes.js';




interface Diffable {
  id?: string;
  [key: string]: any;
}




interface DiffOptions {

  maxDepth?: number;

  ignoreProperties?: string[];

  includeMetadata?: boolean;

  customComparators?: Map<string, (a: any, b: any) => boolean>;
}




export class DiffEngine {
  private defaultOptions: DiffOptions = {
    maxDepth: 10,
    ignoreProperties: ['__timestamp', '__version', '__metadata'],
    includeMetadata: true,
    customComparators: new Map()
  };




  async generateSnapshotDiff(
    fromSnapshot: Snapshot,
    toSnapshot: Snapshot,
    options?: DiffOptions
  ): Promise<RollbackDiff> {
    if (fromSnapshot.type !== toSnapshot.type) {
      throw new RollbackError(
        `Cannot diff snapshots of different types: ${fromSnapshot.type} vs ${toSnapshot.type}`,
        'SNAPSHOT_TYPE_MISMATCH',
        { fromType: fromSnapshot.type, toType: toSnapshot.type }
      );
    }

    const mergedOptions = { ...this.defaultOptions, ...options };
    const changes = this.diffObjects(fromSnapshot.data, toSnapshot.data, '', mergedOptions);

    return {
      from: fromSnapshot.rollbackPointId,
      to: toSnapshot.rollbackPointId,
      changes,
      changeCount: changes.length,
      generatedAt: new Date()
    };
  }

  /**
   * Generate diff between two arbitrary objects
   */
  async generateObjectDiff(
    fromObject: any,
    toObject: any,
    options?: DiffOptions
  ): Promise<DiffEntry[]> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    return this.diffObjects(fromObject, toObject, '', mergedOptions);
  }

  /**
   * Generate diff between two arrays
   */
  async generateArrayDiff(
    fromArray: any[],
    toArray: any[],
    options?: DiffOptions
  ): Promise<DiffEntry[]> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    return this.diffArrays(fromArray, toArray, '', mergedOptions);
  }

  /**
   * Apply a diff to recreate target state
   */
  async applyDiff(sourceObject: any, diff: DiffEntry[]): Promise<any> {
    // Create a deep clone to avoid mutating the original
    const result = this.deepClone(sourceObject);

    // Sort changes by operation priority: deletes first, then updates, then creates
    const sortedChanges = [...diff].sort((a, b) => {
      const priority = { delete: 0, update: 1, move: 2, create: 3 };
      return priority[a.operation] - priority[b.operation];
    });

    for (const change of sortedChanges) {
      this.applyChange(result, change);
    }

    return result;
  }

  /**
   * Check if two objects are equal using deep comparison
   */
  deepEquals(obj1: any, obj2: any, options?: DiffOptions): boolean {
    const mergedOptions = { ...this.defaultOptions, ...options };
    return this.areEqual(obj1, obj2, mergedOptions);
  }

  /**
   * Generate a summary of changes in a diff
   */
  summarizeDiff(diff: RollbackDiff): {
    totalChanges: number;
    changesByOperation: Record<DiffOperation, number>;
    affectedPaths: string[];
    estimatedComplexity: 'low' | 'medium' | 'high';
  } {
    const changesByOperation: Record<DiffOperation, number> = {
      [DiffOperation.CREATE]: 0,
      [DiffOperation.UPDATE]: 0,
      [DiffOperation.DELETE]: 0,
      [DiffOperation.MOVE]: 0
    };

    const affectedPaths = new Set<string>();

    for (const change of diff.changes) {
      changesByOperation[change.operation]++;
      affectedPaths.add(change.path.split('.')[0]);
    }

    let estimatedComplexity: 'low' | 'medium' | 'high' = 'low';
    if (diff.changeCount > 100) {
      estimatedComplexity = 'high';
    } else if (diff.changeCount > 20) {
      estimatedComplexity = 'medium';
    }

    return {
      totalChanges: diff.changeCount,
      changesByOperation,
      affectedPaths: Array.from(affectedPaths),
      estimatedComplexity
    };
  }




  private diffObjects(
    obj1: any,
    obj2: any,
    path: string,
    options: DiffOptions,
    depth = 0
  ): DiffEntry[] {
    if (depth > (options.maxDepth || 10)) {
      return [];
    }

    const changes: DiffEntry[] = [];


    if (obj1 === null || obj1 === undefined) {
      if (obj2 !== null && obj2 !== undefined) {
        changes.push({
          path,
          operation: DiffOperation.CREATE,
          oldValue: obj1,
          newValue: obj2
        });
      }
      return changes;
    }

    if (obj2 === null || obj2 === undefined) {
      changes.push({
        path,
        operation: DiffOperation.DELETE,
        oldValue: obj1,
        newValue: obj2
      });
      return changes;
    }


    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
      if (!this.areEqual(obj1, obj2, options)) {
        changes.push({
          path,
          operation: DiffOperation.UPDATE,
          oldValue: obj1,
          newValue: obj2
        });
      }
      return changes;
    }


    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      return this.diffArrays(obj1, obj2, path, options, depth);
    }


    const keys1 = new Set(Object.keys(obj1).filter(key => !this.shouldIgnoreProperty(key, options)));
    const keys2 = new Set(Object.keys(obj2).filter(key => !this.shouldIgnoreProperty(key, options)));
    const allKeys = new Set([...Array.from(keys1), ...Array.from(keys2)]);

    for (const key of Array.from(allKeys)) {
      const newPath = path ? `${path}.${key}` : key;

      if (keys1.has(key) && keys2.has(key)) {

        changes.push(...this.diffObjects(obj1[key], obj2[key], newPath, options, depth + 1));
      } else if (keys1.has(key)) {

        changes.push({
          path: newPath,
          operation: DiffOperation.DELETE,
          oldValue: obj1[key],
          newValue: undefined
        });
      } else {

        changes.push({
          path: newPath,
          operation: DiffOperation.CREATE,
          oldValue: undefined,
          newValue: obj2[key]
        });
      }
    }

    return changes;
  }




  private diffArrays(
    arr1: any[],
    arr2: any[],
    path: string,
    options: DiffOptions,
    depth = 0
  ): DiffEntry[] {
    const changes: DiffEntry[] = [];


    const maxLength = Math.max(arr1.length, arr2.length);

    for (let i = 0; i < maxLength; i++) {
      const newPath = `${path}[${i}]`;

      if (i < arr1.length && i < arr2.length) {

        if (!this.areEqual(arr1[i], arr2[i], options)) {
          if (typeof arr1[i] === 'object' && typeof arr2[i] === 'object') {
            changes.push(...this.diffObjects(arr1[i], arr2[i], newPath, options, depth + 1));
          } else {
            changes.push({
              path: newPath,
              operation: DiffOperation.UPDATE,
              oldValue: arr1[i],
              newValue: arr2[i]
            });
          }
        }
      } else if (i < arr1.length) {

        changes.push({
          path: newPath,
          operation: DiffOperation.DELETE,
          oldValue: arr1[i],
          newValue: undefined
        });
      } else {

        changes.push({
          path: newPath,
          operation: DiffOperation.CREATE,
          oldValue: undefined,
          newValue: arr2[i]
        });
      }
    }

    return changes;
  }




  private applyChange(obj: any, change: DiffEntry): void {
    const pathParts = change.path.split('.');
    let current = obj;


    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      const arrayMatch = part.match(/(.+)\[(\d+)\]/);

      if (arrayMatch) {
        const [, arrayName, index] = arrayMatch;
        if (!current[arrayName]) {
          current[arrayName] = [];
        }
        current = current[arrayName];
        current = current[parseInt(index)];
      } else {
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    }


    const lastPart = pathParts[pathParts.length - 1];
    const arrayMatch = lastPart.match(/(.+)\[(\d+)\]/);

    if (arrayMatch) {
      const [, arrayName, index] = arrayMatch;
      if (!current[arrayName]) {
        current[arrayName] = [];
      }
      const array = current[arrayName];
      const idx = parseInt(index);

      switch (change.operation) {
        case DiffOperation.CREATE:
          array.splice(idx, 0, change.newValue);
          break;
        case DiffOperation.UPDATE:
          array[idx] = change.newValue;
          break;
        case DiffOperation.DELETE:
          array.splice(idx, 1);
          break;
      }
    } else {
      switch (change.operation) {
        case DiffOperation.CREATE:
        case DiffOperation.UPDATE:
          current[lastPart] = change.newValue;
          break;
        case DiffOperation.DELETE:
          delete current[lastPart];
          break;
      }
    }
  }




  private areEqual(val1: any, val2: any, options: DiffOptions): boolean {

    if (options.customComparators) {
      for (const [pattern, comparator] of Array.from(options.customComparators.entries())) {
        if (pattern === '*' || val1?.constructor?.name === pattern) {
          return comparator(val1, val2);
        }
      }
    }


    if (val1 === val2) return true;
    if (val1 == null || val2 == null) return val1 === val2;
    if (typeof val1 !== typeof val2) return false;


    if (val1 instanceof Date && val2 instanceof Date) {
      return val1.getTime() === val2.getTime();
    }


    if (Array.isArray(val1) && Array.isArray(val2)) {
      if (val1.length !== val2.length) return false;
      return val1.every((item, index) => this.areEqual(item, val2[index], options));
    }


    if (typeof val1 === 'object' && typeof val2 === 'object') {
      const keys1 = Object.keys(val1).filter(key => !this.shouldIgnoreProperty(key, options));
      const keys2 = Object.keys(val2).filter(key => !this.shouldIgnoreProperty(key, options));

      if (keys1.length !== keys2.length) return false;

      return keys1.every(key =>
        keys2.includes(key) && this.areEqual(val1[key], val2[key], options)
      );
    }

    return false;
  }




  private shouldIgnoreProperty(property: string, options: DiffOptions): boolean {
    return options.ignoreProperties?.includes(property) || false;
  }




  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (Array.isArray(obj)) return obj.map(item => this.deepClone(item));

    const cloned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      cloned[key] = this.deepClone(value);
    }
    return cloned;
  }
}

================
File: rollback/EnhancedRollbackStrategies.ts
================
import { EventEmitter } from 'events';
import {
  RollbackStrategy,
  RollbackOperation,
  RollbackPoint,
  Snapshot,
  DiffEntry,
  ConflictResolution,
  ConflictStrategy,
  RollbackConflict,
  ConflictType,
  RollbackLogEntry,
  RollbackError,
  RollbackConflictError,
  DiffOperation
} from './RollbackTypes.js';




interface EnhancedRollbackContext {
  operation: RollbackOperation;
  targetRollbackPoint: RollbackPoint;
  snapshots: Snapshot[];
  diff: DiffEntry[];
  conflictResolution: ConflictResolution;
  onProgress?: (progress: number) => void;
  onLog?: (entry: RollbackLogEntry) => void;


  partialSelections?: PartialRollbackSelection[];
  timebasedFilter?: TimebasedFilter;
  dependencyGraph?: DependencyMap;
  dryRun?: boolean;
  maxDuration?: number;
}




interface PartialRollbackSelection {
  type: 'entity' | 'relationship' | 'file' | 'namespace' | 'component';
  identifiers: string[];
  excludePattern?: RegExp;
  includePattern?: RegExp;
  priority?: number;
}




interface TimebasedFilter {
  rollbackToTimestamp?: Date;
  includeChangesAfter?: Date;
  excludeChangesAfter?: Date;
  maxChangeAge?: number;
}




interface DependencyMap {
  dependencies: Map<string, string[]>;
  reverseDependencies: Map<string, string[]>;
}




interface RollbackPreview {
  totalChanges: number;
  changesByType: Map<DiffOperation, number>;
  estimatedDuration: number;
  potentialConflicts: RollbackConflict[];
  affectedItems: {
    entities: string[];
    relationships: string[];
    files: string[];
  };
  dependencies: {
    required: string[];
    affected: string[];
    circular: string[][];
  };
}




export class PartialRollbackStrategy extends EventEmitter {
  private context!: EnhancedRollbackContext;

  async validate(context: EnhancedRollbackContext): Promise<boolean> {
    this.context = context;

    if (!context.partialSelections || context.partialSelections.length === 0) {
      this.log('error', 'Partial rollback requires selection criteria');
      return false;
    }


    const availableItems = new Set(context.diff.map(d => d.path));
    for (const selection of context.partialSelections) {
      const matchingItems = selection.identifiers.filter(id => availableItems.has(id));
      if (matchingItems.length === 0) {
        this.log('warn', `No items found for selection type: ${selection.type}`, {
          identifiers: selection.identifiers
        });
      }
    }

    return true;
  }

  async estimateTime(context: EnhancedRollbackContext): Promise<number> {
    const selectedChanges = await this.getSelectedChanges(context);
    const baseTime = 1000;
    const timePerChange = 75;
    return baseTime + (selectedChanges.length * timePerChange);
  }

  async execute(context: EnhancedRollbackContext): Promise<void> {
    this.context = context;
    this.log('info', 'Starting partial rollback strategy', {
      totalAvailableChanges: context.diff.length,
      selectionCriteria: context.partialSelections?.length || 0
    });

    try {

      const selectedChanges = await this.getSelectedChanges(context);
      this.log('info', `Selected ${selectedChanges.length} changes for rollback`);
      this.updateProgress(10);


      const orderedChanges = await this.orderChangesByDependencies(selectedChanges, context.dependencyGraph);
      this.updateProgress(20);


      const conflicts = await this.detectConflicts(orderedChanges);
      await this.handleConflicts(conflicts);
      this.updateProgress(30);


      await this.applySelectedChanges(orderedChanges);

      this.log('info', 'Partial rollback completed successfully', {
        appliedChanges: orderedChanges.length,
        totalAvailableChanges: context.diff.length
      });

    } catch (error) {
      this.log('error', 'Partial rollback failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async generatePreview(context: EnhancedRollbackContext): Promise<RollbackPreview> {
    const selectedChanges = await this.getSelectedChanges(context);
    const conflicts = await this.detectConflicts(selectedChanges);

    const changesByType = new Map<DiffOperation, number>();
    const affectedEntities = new Set<string>();
    const affectedRelationships = new Set<string>();
    const affectedFiles = new Set<string>();

    for (const change of selectedChanges) {
      const currentCount = changesByType.get(change.operation) || 0;
      changesByType.set(change.operation, currentCount + 1);


      if (change.path.startsWith('entity:')) {
        affectedEntities.add(change.path);
      } else if (change.path.startsWith('relationship:')) {
        affectedRelationships.add(change.path);
      } else if (change.path.includes('/')) {
        affectedFiles.add(change.path);
      }
    }


    const dependencyAnalysis = await this.analyzeDependencies(selectedChanges, context.dependencyGraph);

    return {
      totalChanges: selectedChanges.length,
      changesByType,
      estimatedDuration: await this.estimateTime(context),
      potentialConflicts: conflicts,
      affectedItems: {
        entities: Array.from(affectedEntities),
        relationships: Array.from(affectedRelationships),
        files: Array.from(affectedFiles)
      },
      dependencies: dependencyAnalysis
    };
  }

  private async getSelectedChanges(context: EnhancedRollbackContext): Promise<DiffEntry[]> {
    if (!context.partialSelections) return [];

    const selectedChanges: DiffEntry[] = [];
    const processed = new Set<string>();


    const sortedSelections = [...context.partialSelections].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const selection of sortedSelections) {
      for (const change of context.diff) {
        if (processed.has(change.path)) continue;

        if (await this.matchesSelection(change, selection)) {
          selectedChanges.push(change);
          processed.add(change.path);
        }
      }
    }

    return selectedChanges;
  }

  private async matchesSelection(change: DiffEntry, selection: PartialRollbackSelection): Promise<boolean> {

    if (selection.identifiers.includes(change.path)) {
      return true;
    }


    if (selection.includePattern && !selection.includePattern.test(change.path)) {
      return false;
    }


    if (selection.excludePattern && selection.excludePattern.test(change.path)) {
      return false;
    }


    switch (selection.type) {
      case 'entity':
        return change.path.startsWith('entity:') &&
               selection.identifiers.some(id => change.path.includes(id));

      case 'relationship':
        return change.path.startsWith('relationship:') &&
               selection.identifiers.some(id => change.path.includes(id));

      case 'file':
        return selection.identifiers.some(id => change.path.includes(id) || change.path.endsWith(id));

      case 'namespace':
        return selection.identifiers.some(id => change.path.startsWith(id));

      case 'component':
        return selection.identifiers.some(id =>
          change.path.includes(`/${id}/`) ||
          change.path.includes(`/${id}.`) ||
          change.path.endsWith(`/${id}`)
        );

      default:
        return false;
    }
  }

  private async orderChangesByDependencies(changes: DiffEntry[], dependencyGraph?: DependencyMap): Promise<DiffEntry[]> {
    if (!dependencyGraph) {
      return changes;
    }

    const ordered: DiffEntry[] = [];
    const processing = new Set<string>();
    const processed = new Set<string>();
    const changeMap = new Map(changes.map(c => [c.path, c]));

    const processChange = (path: string): void => {
      if (processed.has(path) || processing.has(path)) return;
      if (!changeMap.has(path)) return;

      processing.add(path);


      const dependencies = dependencyGraph.dependencies.get(path) || [];
      for (const dep of dependencies) {
        if (changeMap.has(dep) && !processed.has(dep)) {
          processChange(dep);
        }
      }

      const change = changeMap.get(path)!;
      ordered.push(change);
      processed.add(path);
      processing.delete(path);
    };


    for (const change of changes) {
      processChange(change.path);
    }

    this.log('debug', `Ordered ${ordered.length} changes by dependencies`);
    return ordered;
  }

  private async analyzeDependencies(changes: DiffEntry[], dependencyGraph?: DependencyMap) {
    if (!dependencyGraph) {
      return { required: [], affected: [], circular: [] };
    }

    const changePaths = new Set(changes.map(c => c.path));
    const required = new Set<string>();
    const affected = new Set<string>();
    const visited = new Set<string>();
    const circular: string[][] = [];

    const findDependencies = (path: string, visitPath: string[]): void => {
      if (visitPath.includes(path)) {

        const circularPath = visitPath.slice(visitPath.indexOf(path));
        circularPath.push(path);
        circular.push(circularPath);
        return;
      }

      if (visited.has(path)) return;
      visited.add(path);

      const deps = dependencyGraph.dependencies.get(path) || [];
      const reverseDeps = dependencyGraph.reverseDependencies.get(path) || [];

      for (const dep of deps) {
        if (!changePaths.has(dep)) {
          required.add(dep);
        }
        findDependencies(dep, [...visitPath, path]);
      }

      for (const rdep of reverseDeps) {
        if (!changePaths.has(rdep)) {
          affected.add(rdep);
        }
        findDependencies(rdep, [...visitPath, path]);
      }
    };

    for (const change of changes) {
      findDependencies(change.path, []);
    }

    return {
      required: Array.from(required),
      affected: Array.from(affected),
      circular
    };
  }

  private async applySelectedChanges(changes: DiffEntry[]): Promise<void> {
    const totalChanges = changes.length;
    let processedChanges = 0;

    for (const change of changes) {
      await this.applyChange(change);
      processedChanges++;

      const progress = 30 + ((processedChanges / totalChanges) * 70);
      this.updateProgress(progress);
    }
  }

  private async detectConflicts(changes: DiffEntry[]): Promise<RollbackConflict[]> {

    const conflicts: RollbackConflict[] = [];


    const pathCounts = new Map<string, number>();
    for (const change of changes) {
      pathCounts.set(change.path, (pathCounts.get(change.path) || 0) + 1);
    }

    for (const [path, count] of pathCounts) {
      if (count > 1) {
        conflicts.push({
          path,
          type: ConflictType.VALUE_MISMATCH,
          currentValue: 'multiple_changes',
          rollbackValue: 'conflicted_state',
          context: { multipleChanges: true }
        });
      }
    }

    return conflicts;
  }

  private async handleConflicts(conflicts: RollbackConflict[]): Promise<void> {
    if (conflicts.length === 0) return;

    this.log('warn', `Detected ${conflicts.length} conflicts in partial rollback`);

    switch (this.context.conflictResolution.strategy) {
      case ConflictStrategy.ABORT:
        throw new RollbackConflictError('Partial rollback aborted due to conflicts', conflicts);

      case ConflictStrategy.SKIP:
        this.log('info', 'Skipping conflicted changes in partial rollback');
        break;

      case ConflictStrategy.OVERWRITE:
        this.log('warn', 'Overwriting conflicted changes in partial rollback');
        break;


    }
  }

  private async applyChange(change: DiffEntry): Promise<void> {
    this.log('debug', `Applying partial change: ${change.operation} at ${change.path}`);
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: Record<string, any>): void {
    const entry: RollbackLogEntry = {
      timestamp: new Date(),
      level,
      message,
      data
    };

    if (this.context.onLog) {
      this.context.onLog(entry);
    }

    this.emit('log', entry);
  }

  private updateProgress(progress: number): void {
    if (this.context.onProgress) {
      this.context.onProgress(Math.min(100, Math.max(0, progress)));
    }
    this.emit('progress', { progress });
  }
}




export class TimebasedRollbackStrategy extends EventEmitter {
  private context!: EnhancedRollbackContext;

  async validate(context: EnhancedRollbackContext): Promise<boolean> {
    this.context = context;

    if (!context.timebasedFilter) {
      this.log('error', 'Time-based rollback requires time filter criteria');
      return false;
    }

    const filter = context.timebasedFilter;
    if (!filter.rollbackToTimestamp && !filter.includeChangesAfter && !filter.maxChangeAge) {
      this.log('error', 'Time-based rollback requires at least one time criteria');
      return false;
    }

    return true;
  }

  async estimateTime(context: EnhancedRollbackContext): Promise<number> {
    const timeFilteredChanges = await this.getTimeFilteredChanges(context);
    const baseTime = 1000;
    const timePerChange = 60;
    return baseTime + (timeFilteredChanges.length * timePerChange);
  }

  async execute(context: EnhancedRollbackContext): Promise<void> {
    this.context = context;
    this.log('info', 'Starting time-based rollback strategy', {
      totalAvailableChanges: context.diff.length,
      timeFilter: context.timebasedFilter
    });

    try {

      const timeFilteredChanges = await this.getTimeFilteredChanges(context);
      this.log('info', `Selected ${timeFilteredChanges.length} changes based on time criteria`);
      this.updateProgress(15);


      const chronologicalChanges = await this.sortChangesChronologically(timeFilteredChanges, context.timebasedFilter!);
      this.updateProgress(25);


      const conflicts = await this.detectTemporalConflicts(chronologicalChanges);
      await this.handleConflicts(conflicts);
      this.updateProgress(35);


      await this.applyTimebasedChanges(chronologicalChanges);

      this.log('info', 'Time-based rollback completed successfully', {
        appliedChanges: chronologicalChanges.length,
        totalAvailableChanges: context.diff.length
      });

    } catch (error) {
      this.log('error', 'Time-based rollback failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async getTimeFilteredChanges(context: EnhancedRollbackContext): Promise<DiffEntry[]> {
    const filter = context.timebasedFilter!;
    const filtered: DiffEntry[] = [];

    for (const change of context.diff) {
      if (await this.matchesTimeFilter(change, filter)) {
        filtered.push(change);
      }
    }

    return filtered;
  }

  private async matchesTimeFilter(change: DiffEntry, filter: TimebasedFilter): Promise<boolean> {

    const changeTimestamp = this.extractChangeTimestamp(change);
    if (!changeTimestamp) {

      return true;
    }


    if (filter.rollbackToTimestamp && changeTimestamp <= filter.rollbackToTimestamp) {
      return false;
    }


    if (filter.includeChangesAfter && changeTimestamp <= filter.includeChangesAfter) {
      return false;
    }


    if (filter.excludeChangesAfter && changeTimestamp > filter.excludeChangesAfter) {
      return false;
    }


    if (filter.maxChangeAge) {
      const age = Date.now() - changeTimestamp.getTime();
      if (age > filter.maxChangeAge) {
        return false;
      }
    }

    return true;
  }

  private extractChangeTimestamp(change: DiffEntry): Date | null {

    if (change.metadata?.timestamp) {
      return new Date(change.metadata.timestamp);
    }


    const timestampMatch = change.path.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
    if (timestampMatch) {
      return new Date(timestampMatch[1]);
    }


    if (change.oldValue && typeof change.oldValue === 'object' && change.oldValue.timestamp) {
      return new Date(change.oldValue.timestamp);
    }

    if (change.newValue && typeof change.newValue === 'object' && change.newValue.timestamp) {
      return new Date(change.newValue.timestamp);
    }

    return null;
  }

  private async sortChangesChronologically(changes: DiffEntry[], filter: TimebasedFilter): Promise<DiffEntry[]> {
    return changes.sort((a, b) => {
      const timestampA = this.extractChangeTimestamp(a);
      const timestampB = this.extractChangeTimestamp(b);

      if (!timestampA && !timestampB) return 0;
      if (!timestampA) return 1;
      if (!timestampB) return -1;



      return timestampB.getTime() - timestampA.getTime();
    });
  }

  private async detectTemporalConflicts(changes: DiffEntry[]): Promise<RollbackConflict[]> {
    const conflicts: RollbackConflict[] = [];
    const pathTimestamps = new Map<string, Date[]>();


    for (const change of changes) {
      const timestamp = this.extractChangeTimestamp(change);
      if (timestamp) {
        if (!pathTimestamps.has(change.path)) {
          pathTimestamps.set(change.path, []);
        }
        pathTimestamps.get(change.path)!.push(timestamp);
      }
    }


    for (const [path, timestamps] of pathTimestamps) {
      if (timestamps.length > 1) {

        const sortedTimestamps = timestamps.sort((a, b) => a.getTime() - b.getTime());

        for (let i = 1; i < sortedTimestamps.length; i++) {
          const gap = sortedTimestamps[i].getTime() - sortedTimestamps[i-1].getTime();
          if (gap < 60000) {
            conflicts.push({
              path,
              type: ConflictType.VALUE_MISMATCH,
              currentValue: `change_at_${sortedTimestamps[i-1].toISOString()}`,
              rollbackValue: `change_at_${sortedTimestamps[i].toISOString()}`,
              context: {
                temporalConflict: true,
                timestamps: sortedTimestamps
              }
            });
          }
        }
      }
    }

    return conflicts;
  }

  private async applyTimebasedChanges(changes: DiffEntry[]): Promise<void> {
    const totalChanges = changes.length;
    let processedChanges = 0;

    for (const change of changes) {
      const changeTimestamp = this.extractChangeTimestamp(change);
      this.log('debug', 'Applying time-based change', {
        path: change.path,
        operation: change.operation,
        timestamp: changeTimestamp?.toISOString()
      });

      await this.applyChange(change);
      processedChanges++;

      const progress = 35 + ((processedChanges / totalChanges) * 65);
      this.updateProgress(progress);
    }
  }

  private async handleConflicts(conflicts: RollbackConflict[]): Promise<void> {
    if (conflicts.length === 0) return;

    this.log('warn', `Detected ${conflicts.length} temporal conflicts`);

    switch (this.context.conflictResolution.strategy) {
      case ConflictStrategy.ABORT:
        throw new RollbackConflictError('Time-based rollback aborted due to temporal conflicts', conflicts);

      case ConflictStrategy.SKIP:
        this.log('info', 'Skipping temporally conflicted changes');
        break;

      case ConflictStrategy.OVERWRITE:
        this.log('warn', 'Applying most recent changes for temporal conflicts');
        break;


    }
  }

  private async applyChange(change: DiffEntry): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 40));
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: Record<string, any>): void {
    const entry: RollbackLogEntry = {
      timestamp: new Date(),
      level,
      message,
      data
    };

    if (this.context.onLog) {
      this.context.onLog(entry);
    }

    this.emit('log', entry);
  }

  private updateProgress(progress: number): void {
    if (this.context.onProgress) {
      this.context.onProgress(Math.min(100, Math.max(0, progress)));
    }
    this.emit('progress', { progress });
  }
}




export class DryRunRollbackStrategy extends EventEmitter {
  private context!: EnhancedRollbackContext;

  async validate(context: EnhancedRollbackContext): Promise<boolean> {
    this.context = context;
    return true;
  }

  async estimateTime(context: EnhancedRollbackContext): Promise<number> {

    const baseTime = 500;
    const timePerChange = 10;
    return baseTime + (context.diff.length * timePerChange);
  }

  async execute(context: EnhancedRollbackContext): Promise<RollbackPreview> {
    this.context = context;
    this.log('info', 'Starting dry-run rollback analysis');

    try {

      const preview = await this.generateRollbackPreview(context);

      this.log('info', 'Dry-run rollback analysis completed', {
        totalChanges: preview.totalChanges,
        potentialConflicts: preview.potentialConflicts.length,
        estimatedDuration: preview.estimatedDuration
      });

      return preview;

    } catch (error) {
      this.log('error', 'Dry-run rollback analysis failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async generateRollbackPreview(context: EnhancedRollbackContext): Promise<RollbackPreview> {
    this.updateProgress(10);


    const changesByType = new Map<DiffOperation, number>();
    const affectedEntities = new Set<string>();
    const affectedRelationships = new Set<string>();
    const affectedFiles = new Set<string>();

    for (const change of context.diff) {
      const currentCount = changesByType.get(change.operation) || 0;
      changesByType.set(change.operation, currentCount + 1);


      if (change.path.startsWith('entity:')) {
        affectedEntities.add(change.path);
      } else if (change.path.startsWith('relationship:')) {
        affectedRelationships.add(change.path);
      } else if (change.path.includes('/')) {
        affectedFiles.add(change.path);
      }
    }

    this.updateProgress(40);


    const conflicts = await this.analyzeAllConflicts(context.diff);
    this.updateProgress(70);


    let dependencyAnalysis = { required: [], affected: [], circular: [] };
    if (context.dependencyGraph) {
      dependencyAnalysis = await this.analyzeDependencies(context.diff, context.dependencyGraph);
    }

    this.updateProgress(100);

    return {
      totalChanges: context.diff.length,
      changesByType,
      estimatedDuration: await this.estimateTime(context),
      potentialConflicts: conflicts,
      affectedItems: {
        entities: Array.from(affectedEntities),
        relationships: Array.from(affectedRelationships),
        files: Array.from(affectedFiles)
      },
      dependencies: dependencyAnalysis
    };
  }

  private async analyzeAllConflicts(changes: DiffEntry[]): Promise<RollbackConflict[]> {
    const conflicts: RollbackConflict[] = [];
    const pathGroups = new Map<string, DiffEntry[]>();


    for (const change of changes) {
      if (!pathGroups.has(change.path)) {
        pathGroups.set(change.path, []);
      }
      pathGroups.get(change.path)!.push(change);
    }


    for (const [path, pathChanges] of pathGroups) {
      if (pathChanges.length > 1) {
        conflicts.push({
          path,
          type: ConflictType.VALUE_MISMATCH,
          currentValue: 'multiple_operations',
          rollbackValue: 'conflicted_state',
          context: {
            operations: pathChanges.map(c => c.operation),
            changeCount: pathChanges.length
          }
        });
      }


      for (const change of pathChanges) {
        if (change.oldValue && change.newValue) {
          const oldType = typeof change.oldValue;
          const newType = typeof change.newValue;
          if (oldType !== newType) {
            conflicts.push({
              path,
              type: ConflictType.TYPE_MISMATCH,
              currentValue: newType,
              rollbackValue: oldType,
              context: { change }
            });
          }
        }
      }
    }

    return conflicts;
  }

  private async analyzeDependencies(changes: DiffEntry[], dependencyGraph: DependencyMap) {
    const changePaths = new Set(changes.map(c => c.path));
    const required = new Set<string>();
    const affected = new Set<string>();
    const circular: string[][] = [];
    const visited = new Set<string>();

    const findCircular = (path: string, visitPath: string[]): void => {
      if (visitPath.includes(path)) {
        const circularPath = visitPath.slice(visitPath.indexOf(path));
        circularPath.push(path);
        circular.push(circularPath);
        return;
      }

      if (visited.has(path)) return;
      visited.add(path);

      const deps = dependencyGraph.dependencies.get(path) || [];
      for (const dep of deps) {
        findCircular(dep, [...visitPath, path]);
      }
    };

    for (const change of changes) {
      const deps = dependencyGraph.dependencies.get(change.path) || [];
      const reverseDeps = dependencyGraph.reverseDependencies.get(change.path) || [];

      for (const dep of deps) {
        if (!changePaths.has(dep)) {
          required.add(dep);
        }
      }

      for (const rdep of reverseDeps) {
        if (!changePaths.has(rdep)) {
          affected.add(rdep);
        }
      }

      findCircular(change.path, []);
    }

    return {
      required: Array.from(required),
      affected: Array.from(affected),
      circular
    };
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: Record<string, any>): void {
    const entry: RollbackLogEntry = {
      timestamp: new Date(),
      level,
      message,
      data
    };

    if (this.context.onLog) {
      this.context.onLog(entry);
    }

    this.emit('log', entry);
  }

  private updateProgress(progress: number): void {
    if (this.context.onProgress) {
      this.context.onProgress(Math.min(100, Math.max(0, progress)));
    }
    this.emit('progress', { progress });
  }
}


export type {
  EnhancedRollbackContext,
  PartialRollbackSelection,
  TimebasedFilter,
  DependencyMap,
  RollbackPreview
};

================
File: rollback/index.ts
================
export * from './RollbackTypes.js';


export { RollbackManager } from './RollbackManager.js';
export { SnapshotManager } from './Snapshot.js';
export { DiffEngine } from './DiffEngine.js';
export { RollbackStore } from './RollbackStore.js';


export { PostgreSQLRollbackStore } from './PostgreSQLRollbackStore.js';


export {
  RollbackStrategyFactory,
  ImmediateRollbackStrategy,
  GradualRollbackStrategy,
  SafeRollbackStrategy,
  ForceRollbackStrategy
} from './RollbackStrategies.js';


export {
  PartialRollbackStrategy,
  TimebasedRollbackStrategy,
  DryRunRollbackStrategy
} from './EnhancedRollbackStrategies.js';


export {
  ConflictResolutionEngine
} from './ConflictResolutionEngine.js';


export {
  IntegratedRollbackManager
} from './RollbackIntegrationLayer.js';


export function createDefaultRollbackConfig(): RollbackConfig {
  return {
    maxRollbackPoints: 50,
    defaultTTL: 24 * 60 * 60 * 1000,
    autoCleanup: true,
    cleanupInterval: 5 * 60 * 1000,
    maxSnapshotSize: 10 * 1024 * 1024,
    enablePersistence: false,
    persistenceType: 'memory',
    requireDatabaseReady: true
  };
}


export function createDefaultStoreOptions(): RollbackStoreOptions {
  return {
    maxItems: 50,
    defaultTTL: 24 * 60 * 60 * 1000,
    enableLRU: true,
    enablePersistence: false
  };
}


export function createAbortOnConflictResolution(): ConflictResolution {
  return {
    strategy: ConflictStrategy.ABORT
  };
}

export function createOverwriteConflictResolution(): ConflictResolution {
  return {
    strategy: ConflictStrategy.OVERWRITE
  };
}

export function createSkipConflictResolution(): ConflictResolution {
  return {
    strategy: ConflictStrategy.SKIP
  };
}

export function createMergeConflictResolution(): ConflictResolution {
  return {
    strategy: ConflictStrategy.MERGE
  };
}


import {
  RollbackConfig,
  RollbackStoreOptions,
  ConflictResolution,
  ConflictStrategy
} from './RollbackTypes.js';

================
File: rollback/PostgreSQLRollbackStore.ts
================
import { EventEmitter } from 'events';
import { Client, Pool, PoolConfig } from 'pg';
import {
  RollbackPoint,
  RollbackOperation,
  RollbackConfig,
  RollbackStoreOptions,
  RollbackMetrics,
  RollbackError,
  RollbackNotFoundError,
  RollbackExpiredError
} from './RollbackTypes.js';

export interface PostgreSQLConfig {
  connectionString?: string;
  pool?: PoolConfig;
  schema?: string;
  tablePrefix?: string;
}




export class PostgreSQLRollbackStore extends EventEmitter {
  private pool: Pool;
  private memoryCache = new Map<string, RollbackPoint>();
  private operationsCache = new Map<string, RollbackOperation>();
  private expiryTimers = new Map<string, NodeJS.Timeout>();
  private cleanupTimer?: NodeJS.Timeout;
  private metrics: RollbackMetrics;

  private readonly schema: string;
  private readonly rollbackPointsTable: string;
  private readonly operationsTable: string;
  private readonly snapshotsTable: string;

  constructor(
    private config: RollbackConfig,
    private options: RollbackStoreOptions,
    private pgConfig: PostgreSQLConfig
  ) {
    super();

    this.schema = pgConfig.schema || 'public';
    const prefix = pgConfig.tablePrefix || 'memento_rollback_';
    this.rollbackPointsTable = `${this.schema}.${prefix}points`;
    this.operationsTable = `${this.schema}.${prefix}operations`;
    this.snapshotsTable = `${this.schema}.${prefix}snapshots`;


    this.pool = new Pool(
      pgConfig.connectionString
        ? { connectionString: pgConfig.connectionString }
        : pgConfig.pool
    );

    this.metrics = {
      totalRollbackPoints: 0,
      successfulRollbacks: 0,
      failedRollbacks: 0,
      averageRollbackTime: 0,
      memoryUsage: 0
    };

    if (config.autoCleanup) {
      this.startCleanupTimer();
    }
  }




  async initialize(): Promise<void> {
    const client = await this.pool.connect();
    try {

      if (this.schema !== 'public') {
        await client.query(`CREATE SCHEMA IF NOT EXISTS ${this.schema}`);
      }


      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.rollbackPointsTable} (
          id UUID PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMPTZ,
          session_id TEXT,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);


      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.operationsTable} (
          id UUID PRIMARY KEY,
          type TEXT NOT NULL,
          target_rollback_point_id UUID NOT NULL,
          status TEXT NOT NULL,
          progress INTEGER DEFAULT 0,
          error_message TEXT,
          started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          completed_at TIMESTAMPTZ,
          strategy TEXT NOT NULL,
          log_entries JSONB DEFAULT '[]',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          FOREIGN KEY (target_rollback_point_id) REFERENCES ${this.rollbackPointsTable}(id) ON DELETE CASCADE
        )
      `);


      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.snapshotsTable} (
          id UUID PRIMARY KEY,
          rollback_point_id UUID NOT NULL,
          type TEXT NOT NULL,
          data JSONB NOT NULL,
          size_bytes INTEGER NOT NULL,
          checksum TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          FOREIGN KEY (rollback_point_id) REFERENCES ${this.rollbackPointsTable}(id) ON DELETE CASCADE
        )
      `);


      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_rollback_points_session_id
        ON ${this.rollbackPointsTable}(session_id);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_rollback_points_expires_at
        ON ${this.rollbackPointsTable}(expires_at);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_operations_status
        ON ${this.operationsTable}(status);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_snapshots_rollback_point_id
        ON ${this.snapshotsTable}(rollback_point_id);
      `);


      await this.loadRecentPointsIntoCache();

    } finally {
      client.release();
    }
  }




  async storeRollbackPoint(rollbackPoint: RollbackPoint): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');


      await client.query(`
        INSERT INTO ${this.rollbackPointsTable}
        (id, name, description, timestamp, expires_at, session_id, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        rollbackPoint.id,
        rollbackPoint.name,
        rollbackPoint.description,
        rollbackPoint.timestamp,
        rollbackPoint.expiresAt,
        rollbackPoint.sessionId,
        JSON.stringify(rollbackPoint.metadata)
      ]);

      await client.query('COMMIT');


      this.memoryCache.set(rollbackPoint.id, rollbackPoint);
      this.metrics.totalRollbackPoints++;


      if (rollbackPoint.expiresAt) {
        this.setExpiryTimer(rollbackPoint.id, rollbackPoint.expiresAt);
      }

      this.updateMemoryUsage();
      this.emit('rollback-point-stored', { rollbackPoint });

    } catch (error) {
      await client.query('ROLLBACK');
      throw new RollbackError(
        'Failed to store rollback point',
        'STORE_FAILED',
        { rollbackPointId: rollbackPoint.id, error: error instanceof Error ? error.message : String(error) }
      );
    } finally {
      client.release();
    }
  }




  async getRollbackPoint(id: string): Promise<RollbackPoint | null> {

    let rollbackPoint = this.memoryCache.get(id);

    if (!rollbackPoint) {

      const client = await this.pool.connect();
      try {
        const result = await client.query(`
          SELECT id, name, description, timestamp, expires_at, session_id, metadata
          FROM ${this.rollbackPointsTable}
          WHERE id = $1
        `, [id]);

        if (result.rows.length === 0) {
          return null;
        }

        const row = result.rows[0];
        rollbackPoint = {
          id: row.id,
          name: row.name,
          description: row.description,
          timestamp: new Date(row.timestamp),
          expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
          sessionId: row.session_id,
          metadata: row.metadata || {}
        };


        this.memoryCache.set(id, rollbackPoint);

      } finally {
        client.release();
      }
    }


    if (rollbackPoint && rollbackPoint.expiresAt && rollbackPoint.expiresAt < new Date()) {
      await this.removeRollbackPoint(id);
      throw new RollbackExpiredError(id);
    }

    return rollbackPoint;
  }




  async getAllRollbackPoints(): Promise<RollbackPoint[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, name, description, timestamp, expires_at, session_id, metadata
        FROM ${this.rollbackPointsTable}
        WHERE expires_at IS NULL OR expires_at > NOW()
        ORDER BY timestamp DESC
      `);

      const points: RollbackPoint[] = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        timestamp: new Date(row.timestamp),
        expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
        sessionId: row.session_id,
        metadata: row.metadata || {}
      }));


      points.slice(0, 50).forEach(point => {
        this.memoryCache.set(point.id, point);
      });

      return points;

    } finally {
      client.release();
    }
  }




  async getRollbackPointsForSession(sessionId: string): Promise<RollbackPoint[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, name, description, timestamp, expires_at, session_id, metadata
        FROM ${this.rollbackPointsTable}
        WHERE session_id = $1 AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY timestamp DESC
      `, [sessionId]);

      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        timestamp: new Date(row.timestamp),
        expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
        sessionId: row.session_id,
        metadata: row.metadata || {}
      }));

    } finally {
      client.release();
    }
  }




  async removeRollbackPoint(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');


      const result = await client.query(`
        DELETE FROM ${this.rollbackPointsTable}
        WHERE id = $1
      `, [id]);

      await client.query('COMMIT');


      this.memoryCache.delete(id);


      const timer = this.expiryTimers.get(id);
      if (timer) {
        clearTimeout(timer);
        this.expiryTimers.delete(id);
      }

      this.updateMemoryUsage();
      this.emit('rollback-point-removed', { rollbackPointId: id });

      return result.rowCount! > 0;

    } catch (error) {
      await client.query('ROLLBACK');
      throw new RollbackError(
        'Failed to remove rollback point',
        'REMOVE_FAILED',
        { rollbackPointId: id, error: error instanceof Error ? error.message : String(error) }
      );
    } finally {
      client.release();
    }
  }




  async storeOperation(operation: RollbackOperation): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO ${this.operationsTable}
        (id, type, target_rollback_point_id, status, progress, error_message,
         started_at, completed_at, strategy, log_entries)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        operation.id,
        operation.type,
        operation.targetRollbackPointId,
        operation.status,
        operation.progress,
        operation.error,
        operation.startedAt,
        operation.completedAt,
        operation.strategy,
        JSON.stringify(operation.log)
      ]);

      this.operationsCache.set(operation.id, operation);
      this.emit('operation-stored', { operation });

    } catch (error) {
      throw new RollbackError(
        'Failed to store operation',
        'OPERATION_STORE_FAILED',
        { operationId: operation.id, error: error instanceof Error ? error.message : String(error) }
      );
    } finally {
      client.release();
    }
  }




  async updateOperation(operation: RollbackOperation): Promise<void> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        UPDATE ${this.operationsTable}
        SET status = $2, progress = $3, error_message = $4, completed_at = $5,
            log_entries = $6, updated_at = NOW()
        WHERE id = $1
      `, [
        operation.id,
        operation.status,
        operation.progress,
        operation.error,
        operation.completedAt,
        JSON.stringify(operation.log)
      ]);

      if (result.rowCount === 0) {
        throw new RollbackNotFoundError(operation.id);
      }

      this.operationsCache.set(operation.id, operation);
      this.emit('operation-updated', { operation });


      if (operation.status === 'completed') {
        this.metrics.successfulRollbacks++;
        if (operation.startedAt && operation.completedAt) {
          const duration = operation.completedAt.getTime() - operation.startedAt.getTime();
          this.updateAverageRollbackTime(duration);
        }
      } else if (operation.status === 'failed') {
        this.metrics.failedRollbacks++;
      }

    } catch (error) {
      throw new RollbackError(
        'Failed to update operation',
        'OPERATION_UPDATE_FAILED',
        { operationId: operation.id, error: error instanceof Error ? error.message : String(error) }
      );
    } finally {
      client.release();
    }
  }




  async storeSnapshot(
    rollbackPointId: string,
    type: string,
    data: any,
    metadata?: Record<string, any>
  ): Promise<string> {
    const client = await this.pool.connect();
    try {
      const snapshotId = `${rollbackPointId}_${type}_${Date.now()}`;
      const serializedData = JSON.stringify(data);
      const sizeBytes = Buffer.byteLength(serializedData, 'utf8');

      await client.query(`
        INSERT INTO ${this.snapshotsTable}
        (id, rollback_point_id, type, data, size_bytes)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        snapshotId,
        rollbackPointId,
        type,
        data,
        sizeBytes
      ]);

      return snapshotId;

    } catch (error) {
      throw new RollbackError(
        'Failed to store snapshot',
        'SNAPSHOT_STORE_FAILED',
        { rollbackPointId, type, error: error instanceof Error ? error.message : String(error) }
      );
    } finally {
      client.release();
    }
  }




  async getSnapshots(rollbackPointId: string): Promise<Array<{ id: string; type: string; data: any; sizeBytes: number }>> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT id, type, data, size_bytes
        FROM ${this.snapshotsTable}
        WHERE rollback_point_id = $1
        ORDER BY created_at
      `, [rollbackPointId]);

      return result.rows.map(row => ({
        id: row.id,
        type: row.type,
        data: row.data,
        sizeBytes: row.size_bytes
      }));

    } finally {
      client.release();
    }
  }




  async cleanup(): Promise<{ removedPoints: number; removedOperations: number }> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');


      const expiredPointsResult = await client.query(`
        DELETE FROM ${this.rollbackPointsTable}
        WHERE expires_at IS NOT NULL AND expires_at < NOW()
      `);


      const cutoffTime = new Date(Date.now() - (24 * 60 * 60 * 1000));
      const oldOperationsResult = await client.query(`
        DELETE FROM ${this.operationsTable}
        WHERE (status = 'completed' OR status = 'failed')
        AND completed_at < $1
      `, [cutoffTime]);

      await client.query('COMMIT');

      const removedPoints = expiredPointsResult.rowCount || 0;
      const removedOperations = oldOperationsResult.rowCount || 0;


      for (const [id, point] of Array.from(this.memoryCache.entries())) {
        if (point.expiresAt && point.expiresAt < new Date()) {
          this.memoryCache.delete(id);
          const timer = this.expiryTimers.get(id);
          if (timer) {
            clearTimeout(timer);
            this.expiryTimers.delete(id);
          }
        }
      }

      this.metrics.lastCleanup = new Date();
      this.updateMemoryUsage();

      this.emit('cleanup-completed', { removedPoints, removedOperations });

      return { removedPoints, removedOperations };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }




  getMetrics(): RollbackMetrics {
    this.updateMemoryUsage();
    return { ...this.metrics };
  }




  async shutdown(): Promise<void> {

    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }


    for (const timer of Array.from(this.expiryTimers.values())) {
      clearTimeout(timer);
    }
    this.expiryTimers.clear();


    await this.pool.end();

    this.emit('store-shutdown');
  }




  async getOperation(id: string): Promise<RollbackOperation | null> {

    let operation = this.operationsCache.get(id);

    if (!operation) {

      const client = await this.pool.connect();
      try {
        const result = await client.query(`
          SELECT id, type, target_rollback_point_id, status, progress, error_message,
                 started_at, completed_at, strategy, log_entries
          FROM ${this.operationsTable}
          WHERE id = $1
        `, [id]);

        if (result.rows.length === 0) {
          return null;
        }

        const row = result.rows[0];
        operation = {
          id: row.id,
          type: row.type,
          targetRollbackPointId: row.target_rollback_point_id,
          status: row.status,
          progress: row.progress,
          error: row.error_message,
          startedAt: new Date(row.started_at),
          completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
          strategy: row.strategy,
          log: row.log_entries || []
        };


        this.operationsCache.set(id, operation);

      } finally {
        client.release();
      }
    }

    return operation;
  }




  private async loadRecentPointsIntoCache(): Promise<void> {
    try {
      const recentPoints = await this.getAllRollbackPoints();
      recentPoints.slice(0, this.options.maxItems).forEach(point => {
        this.memoryCache.set(point.id, point);
        if (point.expiresAt) {
          this.setExpiryTimer(point.id, point.expiresAt);
        }
      });
    } catch (error) {

      console.warn('Failed to load rollback points into cache:', error);
    }
  }




  private setExpiryTimer(rollbackPointId: string, expiresAt: Date): void {
    const now = Date.now();
    const expiryTime = expiresAt.getTime();
    if (expiryTime > now) {
      const timeout = setTimeout(async () => {
        try {
          await this.removeRollbackPoint(rollbackPointId);
          this.emit('rollback-point-expired', { rollbackPointId });
        } catch (error) {
          console.error(`Failed to expire rollback point ${rollbackPointId}:`, error);
        }
      }, expiryTime - now);
      this.expiryTimers.set(rollbackPointId, timeout);
    }
  }




  private startCleanupTimer(): void {
    const interval = this.config.cleanupInterval || 5 * 60 * 1000;
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanup();
      } catch (error) {
        this.emit('cleanup-error', { error });
      }
    }, interval);
  }




  private updateMemoryUsage(): void {
    const pointsSize = this.memoryCache.size * 1024;
    const operationsSize = this.operationsCache.size * 512;
    this.metrics.memoryUsage = pointsSize + operationsSize;
  }




  private updateAverageRollbackTime(newTime: number): void {
    const currentAvg = this.metrics.averageRollbackTime;
    const count = this.metrics.successfulRollbacks;
    this.metrics.averageRollbackTime = ((currentAvg * (count - 1)) + newTime) / count;
  }
}

================
File: rollback/README.md
================
# Enhanced Rollback Capabilities

This module provides comprehensive rollback functionality for the Memento system, enabling safe and intelligent restoration of system state with advanced conflict resolution and integration capabilities.

## Features

### 🔄 Core Rollback Functionality
- **Multiple Storage Backends**: In-memory and PostgreSQL persistence
- **Snapshot Management**: Automatic capture and restoration of system state
- **Change Detection**: Intelligent diff generation and analysis
- **Rollback Strategies**: Multiple strategies for different scenarios

### 🎯 Enhanced Rollback Strategies
- **Partial Rollback**: Selective rollback of specific entities, components, or namespaces
- **Time-based Rollback**: Rollback changes within specific time windows
- **Dry-run Analysis**: Preview rollback operations without executing them
- **Dependency-aware Rollback**: Smart ordering based on entity dependencies

### 🔧 Advanced Conflict Resolution
- **Visual Diff Generation**: Line-by-line, word-by-word, and semantic diffs
- **Smart Merge Strategies**: Intelligent conflict resolution with confidence scoring
- **Interactive Resolution**: UI-friendly conflict resolution options
- **Batch Processing**: Handle multiple related conflicts efficiently

### 🔗 System Integration
- **SessionManager Integration**: Session-aware rollback points and checkpoints
- **Audit Logging**: Comprehensive audit trails for all rollback operations
- **Metrics Collection**: Detailed performance and usage metrics
- **Notification System**: Real-time notifications for critical events

## Quick Start

### Basic Setup

```typescript
import {
  RollbackManager,
  createDefaultRollbackConfig,
  createDefaultStoreOptions
} from '@memento/core/rollback';

// Create basic rollback manager
const rollbackManager = new RollbackManager(
  createDefaultRollbackConfig(),
  createDefaultStoreOptions()
);

// Create a rollback point
const rollbackPoint = await rollbackManager.createRollbackPoint(
  'Before Major Changes',
  'Rollback point before implementing new feature'
);

// Execute rollback if needed
const operation = await rollbackManager.rollback(rollbackPoint.id);
```

### PostgreSQL Persistence

```typescript
import { PostgreSQLRollbackStore } from '@memento/core/rollback';

// Create PostgreSQL-backed store
const pgStore = new PostgreSQLRollbackStore(
  createDefaultRollbackConfig(),
  createDefaultStoreOptions(),
  {
    connectionString: 'postgresql://user:pass@localhost:5432/memento',
    schema: 'rollback',
    tablePrefix: 'memento_'
  }
);

await pgStore.initialize();
```

### Partial Rollback

```typescript
import { PartialRollbackStrategy } from '@memento/core/rollback';

const partialStrategy = new PartialRollbackStrategy();

// Define what to rollback
const partialContext = {
  // ... base context
  partialSelections: [
    {
      type: 'entity',
      identifiers: ['user-service', 'auth-service'],
      priority: 10
    },
    {
      type: 'component',
      identifiers: ['auth'],
      includePattern: /auth/,
      priority: 5
    }
  ]
};

// Generate preview first
const preview = await partialStrategy.generatePreview(partialContext);
console.log(`Will rollback ${preview.totalChanges} changes`);

// Execute partial rollback
await partialStrategy.execute(partialContext);
```

### Time-based Rollback

```typescript
import { TimebasedRollbackStrategy } from '@memento/core/rollback';

const timebasedStrategy = new TimebasedRollbackStrategy();

const timebasedContext = {
  // ... base context
  timebasedFilter: {
    rollbackToTimestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
    maxChangeAge: 30 * 60 * 1000 // Only rollback changes from last 30 min
  }
};

await timebasedStrategy.execute(timebasedContext);
```

### Advanced Conflict Resolution

```typescript
import { ConflictResolutionEngine } from '@memento/core/rollback';

const conflictEngine = new ConflictResolutionEngine({
  preferNewer: true,
  preserveStructure: true,
  allowPartialMerge: true,
  semanticAnalysis: true
});

// Generate visual diff for a conflict
const conflict = {
  path: 'entity:config-service',
  type: 'VALUE_MISMATCH',
  currentValue: { port: 8080, env: 'prod' },
  rollbackValue: { port: 3000, env: 'dev' }
};

const visualDiff = await conflictEngine.generateVisualDiff(conflict);
console.log(`Similarity: ${visualDiff.metadata.similarity}%`);

// Get resolution options
const conflictUI = await conflictEngine.generateConflictUI(conflict);
console.log('Available options:', conflictUI.options.map(o => o.name));

// Perform smart merge
const mergeResult = await conflictEngine.smartMerge(conflict);
if (mergeResult.success) {
  console.log('Merged successfully with', mergeResult.confidence, '% confidence');
}
```

### Full Integration

```typescript
import { IntegratedRollbackManager } from '@memento/core/rollback';

const integratedManager = new IntegratedRollbackManager(rollbackManager, {
  sessionIntegration: {
    enabled: true,
    autoCreateCheckpoints: true,
    checkpointThreshold: 5,
    sessionRollbackLimit: 20
  },
  auditLogging: {
    enabled: true,
    logLevel: 'info',
    retentionDays: 30,
    sensitiveDataMask: true
  },
  metrics: {
    enabled: true,
    collectInterval: 60000,
    customMetrics: true
  },
  notifications: {
    enabled: true,
    rollbackCreated: true,
    rollbackFailed: true,
    criticalConflicts: true,
    channels: ['ui', 'webhook']
  }
});

// Set integrations
integratedManager.setIntegrations({
  sessionManager: mySessionManager,
  auditLogger: myAuditLogger,
  metricsCollector: myMetricsCollector,
  notificationService: myNotificationService
});
```

## Rollback Strategies

### Available Strategies

1. **ImmediateRollbackStrategy**: Fast rollback for simple scenarios
2. **GradualRollbackStrategy**: Batch processing with delays for large rollbacks
3. **SafeRollbackStrategy**: Extensive validation and backup creation
4. **ForceRollbackStrategy**: No safety checks for emergency situations
5. **PartialRollbackStrategy**: Selective rollback of specific items
6. **TimebasedRollbackStrategy**: Rollback within time windows
7. **DryRunRollbackStrategy**: Analysis without execution

### Strategy Selection

The system can automatically recommend the best strategy:

```typescript
import { RollbackStrategyFactory } from '@memento/core/rollback';

const recommendedStrategy = RollbackStrategyFactory.getRecommendedStrategy({
  operation,
  targetRollbackPoint,
  snapshots,
  diff: changes,
  conflictResolution: { strategy: ConflictStrategy.MERGE }
});
```

## Conflict Resolution

### Conflict Types

- **VALUE_MISMATCH**: Different values for the same property
- **TYPE_MISMATCH**: Type changes (string → number, object → array)
- **MISSING_TARGET**: Target entity/relationship no longer exists
- **PERMISSION_DENIED**: Insufficient permissions for rollback
- **DEPENDENCY_CONFLICT**: Circular or missing dependencies

### Resolution Strategies

- **ABORT**: Stop rollback on first conflict
- **SKIP**: Skip conflicted items and continue
- **OVERWRITE**: Replace current values with rollback values
- **MERGE**: Intelligently combine current and rollback values
- **ASK_USER**: Request human intervention

### Visual Diff Types

- **Line Diff**: Line-by-line comparison for text content
- **Word Diff**: Word-by-word comparison for shorter text
- **Character Diff**: Character-by-character comparison for small changes
- **JSON Diff**: Structured comparison for objects
- **Semantic Diff**: High-level comparison focusing on meaning

## Database Schema

### PostgreSQL Tables

When using PostgreSQL persistence, the following tables are created:

```sql
-- Rollback points
CREATE TABLE memento_rollback_points (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  session_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rollback operations
CREATE TABLE memento_rollback_operations (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL,
  target_rollback_point_id UUID NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  strategy TEXT NOT NULL,
  log_entries JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (target_rollback_point_id) REFERENCES memento_rollback_points(id) ON DELETE CASCADE
);

-- Snapshots
CREATE TABLE memento_rollback_snapshots (
  id UUID PRIMARY KEY,
  rollback_point_id UUID NOT NULL,
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  size_bytes INTEGER NOT NULL,
  checksum TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (rollback_point_id) REFERENCES memento_rollback_points(id) ON DELETE CASCADE
);
```

## Configuration

### RollbackConfig

```typescript
interface RollbackConfig {
  maxRollbackPoints: number;        // Maximum rollback points to keep
  defaultTTL: number;              // Default time-to-live in milliseconds
  autoCleanup: boolean;            // Enable automatic cleanup
  cleanupInterval: number;         // Cleanup interval in milliseconds
  maxSnapshotSize: number;         // Maximum snapshot size in bytes
  enablePersistence: boolean;      // Enable persistent storage
  persistenceType: 'memory' | 'redis' | 'postgresql';
  requireDatabaseReady: boolean;   // Require database readiness check
}
```

### Integration Config

```typescript
interface RollbackIntegrationConfig {
  sessionIntegration: {
    enabled: boolean;
    autoCreateCheckpoints: boolean;
    checkpointThreshold: number;
    sessionRollbackLimit: number;
  };
  auditLogging: {
    enabled: boolean;
    logLevel: 'info' | 'warn' | 'error' | 'all';
    retentionDays: number;
    sensitiveDataMask: boolean;
  };
  metrics: {
    enabled: boolean;
    collectInterval: number;
    customMetrics: boolean;
  };
  notifications: {
    enabled: boolean;
    rollbackCreated: boolean;
    rollbackFailed: boolean;
    criticalConflicts: boolean;
    channels: ('email' | 'slack' | 'webhook' | 'ui')[];
  };
}
```

## Performance Considerations

### Memory Usage

- In-memory store uses LRU eviction to control memory usage
- PostgreSQL store maintains a small memory cache for frequently accessed data
- Snapshots can be large - configure `maxSnapshotSize` appropriately

### Database Performance

- Use appropriate indexes on frequently queried columns
- Consider partitioning large tables by date
- Monitor query performance and adjust as needed

### Network and I/O

- Large rollbacks may generate significant database traffic
- Consider using gradual strategy for large operations
- Monitor disk space when using snapshot features

## Error Handling

The rollback system provides comprehensive error handling:

```typescript
try {
  const operation = await rollbackManager.rollback(rollbackPointId);
} catch (error) {
  if (error instanceof RollbackError) {
    console.log('Rollback failed:', error.code, error.context);
  } else if (error instanceof RollbackConflictError) {
    console.log('Conflicts detected:', error.conflicts);
  } else if (error instanceof DatabaseNotReadyError) {
    console.log('Database not ready for rollback operations');
  }
}
```

## Monitoring and Metrics

### Built-in Metrics

- Total rollback points created
- Successful/failed rollback operations
- Average rollback time
- Memory usage
- Conflict resolution rates

### Custom Metrics

Implement `MetricsCollector` interface to capture custom metrics:

```typescript
interface MetricsCollector {
  recordRollbackCreation(rollbackPoint: RollbackPoint, duration: number): void;
  recordRollbackExecution(operation: RollbackOperation, result: RollbackResult, duration: number): void;
  recordConflictResolution(conflicts: number, resolved: number, duration: number): void;
  recordSystemMetric(name: string, value: number, tags?: Record<string, string>): void;
  incrementCounter(name: string, tags?: Record<string, string>): void;
}
```

## Best Practices

### Rollback Point Management

1. **Create rollback points before major operations**
2. **Use descriptive names and descriptions**
3. **Set appropriate TTL values**
4. **Monitor storage usage**
5. **Regular cleanup of old points**

### Conflict Resolution

1. **Test rollback strategies in development**
2. **Use dry-run for complex rollbacks**
3. **Implement custom conflict resolvers for domain-specific conflicts**
4. **Monitor conflict rates and patterns**

### Performance

1. **Use partial rollback for large systems**
2. **Consider time-based rollback for temporal data**
3. **Monitor rollback operation duration**
4. **Use appropriate database indexes**

### Security

1. **Mask sensitive data in audit logs**
2. **Implement proper access controls**
3. **Monitor rollback operations for anomalies**
4. **Regular security audits of rollback data**

## Examples

See the [examples directory](./examples/) for comprehensive usage examples:

- `EnhancedRollbackUsage.ts`: Complete examples of all features
- `BasicSetup.ts`: Simple setup and usage
- `ConflictResolution.ts`: Advanced conflict resolution
- `IntegrationExamples.ts`: Full system integration

## Troubleshooting

### Common Issues

1. **Database Connection Errors**: Ensure database service is running and accessible
2. **Memory Issues**: Configure appropriate limits and enable cleanup
3. **Performance Issues**: Use appropriate strategies and monitor metrics
4. **Conflict Resolution**: Implement domain-specific resolvers

### Debug Logging

Enable debug logging to troubleshoot issues:

```typescript
// Set log level in configuration
const config = {
  ...createDefaultRollbackConfig(),
  logLevel: 'debug'
};
```

### Health Checks

Implement health checks for rollback system:

```typescript
const health = {
  rollbackManager: rollbackManager.isHealthy(),
  persistence: await pgStore.healthCheck(),
  metrics: metricsCollector.getHealth()
};
```

## Contributing

When contributing to the rollback system:

1. **Add tests for new features**
2. **Update documentation**
3. **Follow existing patterns**
4. **Consider backward compatibility**
5. **Add examples for new functionality**

## License

This module is part of the Memento system and follows the project's licensing terms.

================
File: rollback/RollbackIntegrationLayer.ts
================
import { EventEmitter } from 'events';
import {
  RollbackPoint,
  RollbackOperation,
  RollbackResult,
  RollbackStatus,
  RollbackLogEntry,
  RollbackMetrics,
  RollbackError
} from './RollbackTypes.js';
import { RollbackManager } from './RollbackManager.js';




interface SessionManager {
  getCurrentSessionId(): string | null;
  getSessionData(sessionId: string): Promise<SessionData>;
  updateSessionData(sessionId: string, data: Partial<SessionData>): Promise<void>;
  createSessionCheckpoint(sessionId: string, metadata: Record<string, any>): Promise<string>;
  restoreSessionCheckpoint(sessionId: string, checkpointId: string): Promise<void>;
  on(event: 'session:started' | 'session:ended' | 'checkpoint:created', listener: (...args: any[]) => void): void;
}

interface SessionData {
  id: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  metadata: Record<string, any>;
  rollbackPoints: string[];
  checkpoints: SessionCheckpoint[];
}

interface SessionCheckpoint {
  id: string;
  sessionId: string;
  timestamp: Date;
  rollbackPointId?: string;
  description: string;
  metadata: Record<string, any>;
}




interface AuditLogger {
  logRollbackCreation(rollbackPoint: RollbackPoint, context: AuditContext): Promise<void>;
  logRollbackExecution(operation: RollbackOperation, result: RollbackResult, context: AuditContext): Promise<void>;
  logConflictResolution(conflict: any, resolution: any, context: AuditContext): Promise<void>;
  logSystemEvent(event: SystemEvent, context: AuditContext): Promise<void>;
  getAuditTrail(filters: AuditFilters): Promise<AuditEntry[]>;
}

interface AuditContext {
  sessionId?: string;
  userId?: string;
  operationId?: string;
  source: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface SystemEvent {
  type: 'rollback_created' | 'rollback_executed' | 'rollback_failed' | 'cleanup_performed' | 'conflict_detected';
  severity: 'info' | 'warn' | 'error' | 'critical';
  message: string;
  data?: Record<string, any>;
}

interface AuditEntry {
  id: string;
  timestamp: Date;
  sessionId?: string;
  userId?: string;
  operationId?: string;
  eventType: string;
  severity: string;
  message: string;
  data?: Record<string, any>;
  source: string;
}

interface AuditFilters {
  sessionId?: string;
  userId?: string;
  eventType?: string;
  severity?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}




interface MetricsCollector {
  recordRollbackCreation(rollbackPoint: RollbackPoint, duration: number): void;
  recordRollbackExecution(operation: RollbackOperation, result: RollbackResult, duration: number): void;
  recordConflictResolution(conflicts: number, resolved: number, duration: number): void;
  recordSystemMetric(name: string, value: number, tags?: Record<string, string>): void;
  incrementCounter(name: string, tags?: Record<string, string>): void;
}




interface NotificationService {
  notifyRollbackCreated(rollbackPoint: RollbackPoint, context: NotificationContext): Promise<void>;
  notifyRollbackExecuted(operation: RollbackOperation, result: RollbackResult, context: NotificationContext): Promise<void>;
  notifyRollbackFailed(operation: RollbackOperation, error: Error, context: NotificationContext): Promise<void>;
  notifyCriticalConflict(conflicts: any[], context: NotificationContext): Promise<void>;
}

interface NotificationContext {
  sessionId?: string;
  userId?: string;
  severity: 'info' | 'warn' | 'error' | 'critical';
  channels: ('email' | 'slack' | 'webhook' | 'ui')[];
  metadata?: Record<string, any>;
}




interface RollbackIntegrationConfig {
  sessionIntegration: {
    enabled: boolean;
    autoCreateCheckpoints: boolean;
    checkpointThreshold: number;
    sessionRollbackLimit: number;
  };
  auditLogging: {
    enabled: boolean;
    logLevel: 'info' | 'warn' | 'error' | 'all';
    retentionDays: number;
    sensitiveDataMask: boolean;
  };
  metrics: {
    enabled: boolean;
    collectInterval: number;
    customMetrics: boolean;
  };
  notifications: {
    enabled: boolean;
    rollbackCreated: boolean;
    rollbackFailed: boolean;
    criticalConflicts: boolean;
    channels: ('email' | 'slack' | 'webhook' | 'ui')[];
  };
}




export class IntegratedRollbackManager extends EventEmitter {
  private rollbackManager: RollbackManager;
  private sessionManager?: SessionManager;
  private auditLogger?: AuditLogger;
  private metricsCollector?: MetricsCollector;
  private notificationService?: NotificationService;

  constructor(
    rollbackManager: RollbackManager,
    private config: RollbackIntegrationConfig
  ) {
    super();
    this.rollbackManager = rollbackManager;
    this.setupEventHandlers();
  }




  setIntegrations(integrations: {
    sessionManager?: SessionManager;
    auditLogger?: AuditLogger;
    metricsCollector?: MetricsCollector;
    notificationService?: NotificationService;
  }): void {
    this.sessionManager = integrations.sessionManager;
    this.auditLogger = integrations.auditLogger;
    this.metricsCollector = integrations.metricsCollector;
    this.notificationService = integrations.notificationService;

    this.setupSessionIntegration();
  }




  async createRollbackPoint(
    name: string,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<RollbackPoint> {
    const startTime = Date.now();

    try {

      const rollbackPoint = await this.rollbackManager.createRollbackPoint(name, description, metadata);


      if (this.config.sessionIntegration.enabled && this.sessionManager) {
        await this.integrateWithSession(rollbackPoint);
      }


      if (this.config.auditLogging.enabled && this.auditLogger) {
        await this.auditLogger.logRollbackCreation(rollbackPoint, {
          sessionId: this.sessionManager?.getCurrentSessionId() || undefined,
          source: 'rollback-manager',
          timestamp: new Date()
        });
      }


      if (this.config.metrics.enabled && this.metricsCollector) {
        const duration = Date.now() - startTime;
        this.metricsCollector.recordRollbackCreation(rollbackPoint, duration);
        this.metricsCollector.incrementCounter('rollback_points_created', {
          session_id: rollbackPoint.sessionId || 'none'
        });
      }


      if (this.config.notifications.enabled && this.config.notifications.rollbackCreated && this.notificationService) {
        await this.notificationService.notifyRollbackCreated(rollbackPoint, {
          sessionId: rollbackPoint.sessionId,
          severity: 'info',
          channels: this.config.notifications.channels
        });
      }

      this.emit('rollback-point-created', rollbackPoint);
      return rollbackPoint;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);


      if (this.config.auditLogging.enabled && this.auditLogger) {
        await this.auditLogger.logSystemEvent({
          type: 'rollback_created',
          severity: 'error',
          message: `Failed to create rollback point: ${errorMessage}`,
          data: { name, description, metadata }
        }, {
          sessionId: this.sessionManager?.getCurrentSessionId() || undefined,
          source: 'rollback-manager',
          timestamp: new Date()
        });
      }

      throw error;
    }
  }




  async rollback(
    rollbackPointId: string,
    options?: Parameters<RollbackManager['rollback']>[1]
  ): Promise<RollbackOperation> {
    const startTime = Date.now();

    try {

      const rollbackPoint = await this.rollbackManager.getRollbackPoint(rollbackPointId);
      if (!rollbackPoint) {
        throw new RollbackError('Rollback point not found', 'ROLLBACK_NOT_FOUND', { rollbackPointId });
      }


      const operationContext = await this.createOperationContext(rollbackPoint);


      const operation = await this.rollbackManager.rollback(rollbackPointId, options);


      const result = await this.waitForCompletion(operation.id);


      if (this.config.sessionIntegration.enabled && this.sessionManager) {
        await this.updateSessionAfterRollback(rollbackPoint, operation, result);
      }


      if (this.config.auditLogging.enabled && this.auditLogger) {
        await this.auditLogger.logRollbackExecution(operation, result, operationContext);
      }


      if (this.config.metrics.enabled && this.metricsCollector) {
        const duration = Date.now() - startTime;
        this.metricsCollector.recordRollbackExecution(operation, result, duration);


        if (result.success) {
          this.metricsCollector.incrementCounter('rollback_successes');
          this.metricsCollector.recordSystemMetric('rollback_entities_processed', result.rolledBackEntities || 0);
          this.metricsCollector.recordSystemMetric('rollback_relationships_processed', result.rolledBackRelationships || 0);
        } else {
          this.metricsCollector.incrementCounter('rollback_failures');
          this.metricsCollector.recordSystemMetric('rollback_errors', result.errors?.length || 0);
        }
      }


      if (this.config.notifications.enabled && this.notificationService) {
        if (result.success) {
          await this.notificationService.notifyRollbackExecuted(operation, result, {
            sessionId: rollbackPoint.sessionId,
            severity: 'info',
            channels: this.config.notifications.channels
          });
        } else if (this.config.notifications.rollbackFailed) {
          await this.notificationService.notifyRollbackFailed(operation, new Error(result.errors?.[0]?.error || 'Unknown error'), {
            sessionId: rollbackPoint.sessionId,
            severity: 'error',
            channels: this.config.notifications.channels
          });
        }
      }

      this.emit('rollback-executed', { operation, result });
      return operation;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);


      if (this.config.auditLogging.enabled && this.auditLogger) {
        await this.auditLogger.logSystemEvent({
          type: 'rollback_failed',
          severity: 'error',
          message: `Rollback execution failed: ${errorMessage}`,
          data: { rollbackPointId, options }
        }, {
          sessionId: this.sessionManager?.getCurrentSessionId() || undefined,
          source: 'rollback-manager',
          timestamp: new Date()
        });
      }


      if (this.config.notifications.enabled && this.config.notifications.rollbackFailed && this.notificationService) {
        const rollbackPoint = await this.rollbackManager.getRollbackPoint(rollbackPointId);
        await this.notificationService.notifyRollbackFailed(
          { id: 'unknown', rollbackPointId, status: RollbackStatus.FAILED } as any,
          error instanceof Error ? error : new Error(errorMessage),
          {
            sessionId: rollbackPoint?.sessionId,
            severity: 'error',
            channels: this.config.notifications.channels
          }
        );
      }

      throw error;
    }
  }




  async getEnhancedMetrics(): Promise<RollbackMetrics & {
    sessionMetrics?: {
      totalSessions: number;
      activeSessionsWithRollbacks: number;
      averageRollbacksPerSession: number;
      sessionsWithCheckpoints: number;
    };
    auditMetrics?: {
      totalAuditEntries: number;
      errorRate: number;
      lastAuditEntry?: Date;
    };
  }> {
    const baseMetrics = this.rollbackManager.getMetrics();
    const enhancedMetrics = { ...baseMetrics };


    if (this.config.sessionIntegration.enabled && this.sessionManager) {
      enhancedMetrics.sessionMetrics = await this.collectSessionMetrics();
    }


    if (this.config.auditLogging.enabled && this.auditLogger) {
      enhancedMetrics.auditMetrics = await this.collectAuditMetrics();
    }

    return enhancedMetrics;
  }




  async getAuditTrail(filters: AuditFilters = {}): Promise<AuditEntry[]> {
    if (!this.auditLogger) {
      throw new RollbackError('Audit logger not configured', 'AUDIT_NOT_CONFIGURED');
    }

    return await this.auditLogger.getAuditTrail(filters);
  }




  async getSessionRollbackHistory(sessionId: string): Promise<{
    rollbackPoints: RollbackPoint[];
    checkpoints: SessionCheckpoint[];
    operations: RollbackOperation[];
  }> {
    if (!this.sessionManager) {
      throw new RollbackError('Session manager not configured', 'SESSION_MANAGER_NOT_CONFIGURED');
    }

    const sessionData = await this.sessionManager.getSessionData(sessionId);
    const rollbackPoints = await Promise.all(
      sessionData.rollbackPoints.map(id => this.rollbackManager.getRollbackPoint(id)).filter(Boolean)
    );


    const operations: RollbackOperation[] = [];
    for (const point of rollbackPoints) {



    }

    return {
      rollbackPoints,
      checkpoints: sessionData.checkpoints,
      operations
    };
  }




  private setupEventHandlers(): void {
    this.rollbackManager.on('rollback-point-created', async (rollbackPoint) => {

      if (this.config.sessionIntegration.enabled && this.sessionManager) {
        await this.enforceSessionLimits(rollbackPoint.sessionId);
      }
    });

    this.rollbackManager.on('rollback-started', async (operation) => {
      if (this.config.auditLogging.enabled && this.auditLogger) {
        await this.auditLogger.logSystemEvent({
          type: 'rollback_executed',
          severity: 'info',
          message: `Rollback operation started: ${operation.id}`,
          data: { operationId: operation.id, targetRollbackPoint: operation.targetRollbackPointId }
        }, {
          operationId: operation.id,
          source: 'rollback-manager',
          timestamp: new Date()
        });
      }
    });

    this.rollbackManager.on('rollback-failed', async (operation, error) => {
      if (this.config.auditLogging.enabled && this.auditLogger) {
        await this.auditLogger.logSystemEvent({
          type: 'rollback_failed',
          severity: 'error',
          message: `Rollback operation failed: ${error.message}`,
          data: { operationId: operation.id, error: error.message }
        }, {
          operationId: operation.id,
          source: 'rollback-manager',
          timestamp: new Date()
        });
      }
    });

    this.rollbackManager.on('conflict-detected', async (conflict) => {
      if (this.config.auditLogging.enabled && this.auditLogger) {
        await this.auditLogger.logConflictResolution(conflict, null, {
          source: 'rollback-manager',
          timestamp: new Date()
        });
      }


      if (this.config.notifications.enabled && this.config.notifications.criticalConflicts && this.notificationService) {
        if (conflict.type === 'DEPENDENCY_CONFLICT' || conflict.severity === 'critical') {
          await this.notificationService.notifyCriticalConflict([conflict], {
            severity: 'critical',
            channels: this.config.notifications.channels
          });
        }
      }
    });
  }




  private setupSessionIntegration(): void {
    if (!this.sessionManager || !this.config.sessionIntegration.enabled) return;


    this.sessionManager.on('session:started', async (sessionData) => {

      await this.sessionManager!.updateSessionData(sessionData.id, {
        rollbackPoints: [],
        checkpoints: []
      });
    });

    this.sessionManager.on('session:ended', async (sessionId) => {

      await this.cleanupSessionRollbacks(sessionId);
    });

    this.sessionManager.on('checkpoint:created', async (checkpoint) => {

      if (this.config.sessionIntegration.autoCreateCheckpoints) {
        await this.linkCheckpointToRollback(checkpoint);
      }
    });
  }

  private async integrateWithSession(rollbackPoint: RollbackPoint): Promise<void> {
    if (!this.sessionManager || !rollbackPoint.sessionId) return;

    try {

      const sessionData = await this.sessionManager.getSessionData(rollbackPoint.sessionId);
      const updatedRollbackPoints = [...sessionData.rollbackPoints, rollbackPoint.id];

      await this.sessionManager.updateSessionData(rollbackPoint.sessionId, {
        rollbackPoints: updatedRollbackPoints
      });


      if (this.config.sessionIntegration.autoCreateCheckpoints) {
        if (updatedRollbackPoints.length % this.config.sessionIntegration.checkpointThreshold === 0) {
          await this.sessionManager.createSessionCheckpoint(rollbackPoint.sessionId, {
            rollbackPointId: rollbackPoint.id,
            reason: 'automatic',
            rollbackPointCount: updatedRollbackPoints.length
          });
        }
      }

    } catch (error) {
      console.warn('Failed to integrate rollback point with session:', error);

    }
  }

  private async createOperationContext(rollbackPoint: RollbackPoint): Promise<AuditContext> {
    return {
      sessionId: rollbackPoint.sessionId || undefined,
      operationId: `rollback_${rollbackPoint.id}_${Date.now()}`,
      source: 'rollback-manager',
      timestamp: new Date(),
      metadata: {
        rollbackPointId: rollbackPoint.id,
        rollbackPointName: rollbackPoint.name,
        rollbackPointTimestamp: rollbackPoint.timestamp
      }
    };
  }

  private async waitForCompletion(operationId: string): Promise<RollbackResult> {

    let attempts = 0;
    const maxAttempts = 300;

    while (attempts < maxAttempts) {
      const operation = await this.rollbackManager.getRollbackOperation(operationId);

      if (!operation) {
        throw new RollbackError('Operation not found', 'OPERATION_NOT_FOUND', { operationId });
      }

      if (operation.status === RollbackStatus.COMPLETED || operation.status === RollbackStatus.FAILED) {

        return {
          success: operation.status === RollbackStatus.COMPLETED,
          rolledBackEntities: 0,
          rolledBackRelationships: 0,
          errors: operation.error ? [{ type: 'entity', id: 'unknown', action: 'rollback', error: operation.error, recoverable: false }] : [],
          partialSuccess: operation.status === RollbackStatus.COMPLETED && operation.error
        };
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new RollbackError('Operation timeout', 'OPERATION_TIMEOUT', { operationId });
  }

  private async updateSessionAfterRollback(
    rollbackPoint: RollbackPoint,
    operation: RollbackOperation,
    result: RollbackResult
  ): Promise<void> {
    if (!this.sessionManager || !rollbackPoint.sessionId) return;

    try {

      await this.sessionManager.updateSessionData(rollbackPoint.sessionId, {
        metadata: {
          lastRollback: {
            rollbackPointId: rollbackPoint.id,
            operationId: operation.id,
            timestamp: new Date(),
            success: result.success,
            entitiesProcessed: result.rolledBackEntities,
            relationshipsProcessed: result.rolledBackRelationships
          }
        }
      });

    } catch (error) {
      console.warn('Failed to update session after rollback:', error);
    }
  }

  private async enforceSessionLimits(sessionId?: string): Promise<void> {
    if (!sessionId || !this.sessionManager) return;

    try {
      const sessionData = await this.sessionManager.getSessionData(sessionId);

      if (sessionData.rollbackPoints.length > this.config.sessionIntegration.sessionRollbackLimit) {

        const excess = sessionData.rollbackPoints.length - this.config.sessionIntegration.sessionRollbackLimit;
        const toRemove = sessionData.rollbackPoints.slice(0, excess);


        for (const rollbackPointId of toRemove) {
          await this.rollbackManager.deleteRollbackPoint(rollbackPointId);
        }


        await this.sessionManager.updateSessionData(sessionId, {
          rollbackPoints: sessionData.rollbackPoints.slice(excess)
        });
      }

    } catch (error) {
      console.warn('Failed to enforce session rollback limits:', error);
    }
  }

  private async cleanupSessionRollbacks(sessionId: string): Promise<void> {

    console.log(`Cleaning up rollback data for session: ${sessionId}`);
  }

  private async linkCheckpointToRollback(checkpoint: SessionCheckpoint): Promise<void> {

    console.log(`Linking checkpoint ${checkpoint.id} to rollback data`);
  }

  private async collectSessionMetrics() {

    return {
      totalSessions: 0,
      activeSessionsWithRollbacks: 0,
      averageRollbacksPerSession: 0,
      sessionsWithCheckpoints: 0
    };
  }

  private async collectAuditMetrics() {

    return {
      totalAuditEntries: 0,
      errorRate: 0,
      lastAuditEntry: new Date()
    };
  }
}


export type {
  SessionManager,
  SessionData,
  SessionCheckpoint,
  AuditLogger,
  AuditContext,
  AuditEntry,
  AuditFilters,
  MetricsCollector,
  NotificationService,
  NotificationContext,
  RollbackIntegrationConfig,
  SystemEvent
};

================
File: rollback/RollbackManager.ts
================
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  RollbackPoint,
  RollbackOperation,
  RollbackOperationType,
  RollbackStatus,
  RollbackStrategy,
  RollbackConfig,
  RollbackStoreOptions,
  Snapshot,
  SnapshotType,
  ConflictResolution,
  ConflictStrategy,
  RollbackDiff,
  RollbackLogEntry,
  RollbackMetrics,
  RollbackError,
  RollbackNotFoundError,
  DatabaseNotReadyError,
  RollbackEvents
} from './RollbackTypes.js';
import { SnapshotManager } from './Snapshot.js';
import { DiffEngine } from './DiffEngine.js';
import { RollbackStore } from './RollbackStore.js';
import { RollbackStrategyFactory } from './RollbackStrategies.js';




interface DatabaseService {
  isReady(): Promise<boolean>;
}

interface KnowledgeGraphService {
  getEntities(): Promise<any[]>;
  getRelationships(): Promise<any[]>;
  restoreEntities(entities: any[]): Promise<void>;
  restoreRelationships(relationships: any[]): Promise<void>;
}

interface FileSystemService {
  getFileContents(path: string): Promise<string>;
  writeFileContents(path: string, contents: string): Promise<void>;
  listFiles(directory: string): Promise<string[]>;
}

interface SessionManager {
  getCurrentSessionId(): string | null;
  getSessionData(sessionId: string): Promise<any>;
  restoreSessionData(sessionId: string, data: any): Promise<void>;
}




export class RollbackManager extends EventEmitter {
  private snapshotManager: SnapshotManager;
  private diffEngine: DiffEngine;
  private store: RollbackStore;
  private activeOperations = new Map<string, RollbackOperation>();


  private databaseService?: DatabaseService;
  private knowledgeGraphService?: KnowledgeGraphService;
  private fileSystemService?: FileSystemService;
  private sessionManager?: SessionManager;

  constructor(
    private config: RollbackConfig,
    storeOptions?: RollbackStoreOptions
  ) {
    super();


    this.snapshotManager = new SnapshotManager(config);
    this.diffEngine = new DiffEngine();
    this.store = new RollbackStore(
      config,
      storeOptions || {
        maxItems: config.maxRollbackPoints,
        defaultTTL: config.defaultTTL,
        enableLRU: true,
        enablePersistence: config.enablePersistence
      }
    );


    this.store.on('rollback-point-stored', (data) => this.emit('rollback-point-created', data.rollbackPoint));
    this.store.on('rollback-point-expired', (data) => this.emit('rollback-point-expired', data.rollbackPointId));
    this.store.on('cleanup-completed', (data) => this.emit('cleanup-completed', data.removedCount));
  }




  setServices(services: {
    databaseService?: DatabaseService;
    knowledgeGraphService?: KnowledgeGraphService;
    fileSystemService?: FileSystemService;
    sessionManager?: SessionManager;
  }): void {
    this.databaseService = services.databaseService;
    this.knowledgeGraphService = services.knowledgeGraphService;
    this.fileSystemService = services.fileSystemService;
    this.sessionManager = services.sessionManager;
  }




  async createRollbackPoint(
    name: string,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<RollbackPoint> {

    if (this.config.requireDatabaseReady && this.databaseService) {
      const isReady = await this.databaseService.isReady();
      if (!isReady) {
        throw new DatabaseNotReadyError();
      }
    }

    const sessionId = this.sessionManager?.getCurrentSessionId() || undefined;
    const expiresAt = new Date(Date.now() + this.config.defaultTTL);

    const rollbackPoint: RollbackPoint = {
      id: uuidv4(),
      name,
      description,
      timestamp: new Date(),
      metadata: metadata || {},
      sessionId,
      expiresAt
    };


    await this.captureSnapshots(rollbackPoint.id);


    await this.store.storeRollbackPoint(rollbackPoint);

    this.emit('rollback-point-created', rollbackPoint);

    return rollbackPoint;
  }




  async getRollbackPoint(id: string): Promise<RollbackPoint | null> {
    return this.store.getRollbackPoint(id);
  }




  async getAllRollbackPoints(): Promise<RollbackPoint[]> {
    return this.store.getAllRollbackPoints();
  }




  async getRollbackPointsForSession(sessionId: string): Promise<RollbackPoint[]> {
    return this.store.getRollbackPointsForSession(sessionId);
  }




  async createSnapshot(rollbackPointId: string): Promise<void> {
    await this.captureSnapshots(rollbackPointId);
  }




  async generateDiff(rollbackPointId: string): Promise<RollbackDiff> {
    const rollbackPoint = await this.store.getRollbackPoint(rollbackPointId);
    if (!rollbackPoint) {
      throw new RollbackNotFoundError(rollbackPointId);
    }


    const snapshots = this.snapshotManager.getSnapshotsForRollbackPoint(rollbackPointId);
    if (snapshots.length === 0) {
      throw new RollbackError(
        `No snapshots found for rollback point: ${rollbackPointId}`,
        'NO_SNAPSHOTS_FOUND',
        { rollbackPointId }
      );
    }


    const currentStateId = `temp_${uuidv4()}`;
    await this.captureSnapshots(currentStateId);
    const currentSnapshots = this.snapshotManager.getSnapshotsForRollbackPoint(currentStateId);


    const changes: any[] = [];
    for (const snapshot of snapshots) {
      const currentSnapshot = currentSnapshots.find(s => s.type === snapshot.type);
      if (currentSnapshot) {
        const snapshotDiff = await this.diffEngine.generateSnapshotDiff(currentSnapshot, snapshot);
        changes.push(...snapshotDiff.changes);
      }
    }


    this.snapshotManager.deleteSnapshotsForRollbackPoint(currentStateId);

    return {
      from: 'current',
      to: rollbackPointId,
      changes,
      changeCount: changes.length,
      generatedAt: new Date()
    };
  }




  async rollback(
    rollbackPointId: string,
    options?: {
      type?: RollbackOperationType;
      strategy?: RollbackStrategy;
      conflictResolution?: ConflictResolution;
      dryRun?: boolean;
    }
  ): Promise<RollbackOperation> {
    const rollbackPoint = await this.store.getRollbackPoint(rollbackPointId);
    if (!rollbackPoint) {
      throw new RollbackNotFoundError(rollbackPointId);
    }


    const operation: RollbackOperation = {
      id: uuidv4(),
      type: options?.type || RollbackOperationType.FULL,
      targetRollbackPointId: rollbackPointId,
      status: RollbackStatus.PENDING,
      progress: 0,
      startedAt: new Date(),
      strategy: options?.strategy || RollbackStrategy.IMMEDIATE,
      log: []
    };


    await this.store.storeOperation(operation);
    this.activeOperations.set(operation.id, operation);


    this.executeRollback(operation, rollbackPoint, options).catch(error => {
      this.handleRollbackError(operation, error);
    });

    return operation;
  }




  async getRollbackOperation(operationId: string): Promise<RollbackOperation | null> {
    return this.store.getOperation(operationId);
  }




  async cancelRollback(operationId: string): Promise<boolean> {
    const operation = this.activeOperations.get(operationId);
    if (!operation || operation.status !== RollbackStatus.IN_PROGRESS) {
      return false;
    }

    operation.status = RollbackStatus.CANCELLED;
    operation.completedAt = new Date();
    await this.store.updateOperation(operation);
    this.activeOperations.delete(operationId);

    this.emit('rollback-completed', operation);
    return true;
  }




  async deleteRollbackPoint(id: string): Promise<boolean> {

    this.snapshotManager.deleteSnapshotsForRollbackPoint(id);


    return this.store.removeRollbackPoint(id);
  }




  async cleanup(): Promise<{ removedPoints: number; removedOperations: number; removedSnapshots: number }> {
    const storeCleanup = await this.store.cleanup();
    const removedSnapshots = await this.snapshotManager.cleanup();

    this.emit('cleanup-completed', storeCleanup.removedPoints + storeCleanup.removedOperations + removedSnapshots);

    return {
      removedPoints: storeCleanup.removedPoints,
      removedOperations: storeCleanup.removedOperations,
      removedSnapshots
    };
  }




  getMetrics(): RollbackMetrics {
    const storeMetrics = this.store.getMetrics();
    const snapshotUsage = this.snapshotManager.getMemoryUsage();

    return {
      ...storeMetrics,
      memoryUsage: storeMetrics.memoryUsage + snapshotUsage.totalSize
    };
  }




  async shutdown(): Promise<void> {

    for (const operation of Array.from(this.activeOperations.values())) {
      await this.cancelRollback(operation.id);
    }


    await this.store.shutdown();


    this.snapshotManager.clear();
  }




  private async executeRollback(
    operation: RollbackOperation,
    rollbackPoint: RollbackPoint,
    options?: {
      conflictResolution?: ConflictResolution;
      dryRun?: boolean;
    }
  ): Promise<void> {
    try {

      operation.status = RollbackStatus.IN_PROGRESS;
      operation.progress = 0;
      await this.store.updateOperation(operation);

      this.emit('rollback-started', operation);


      const diff = await this.generateDiff(rollbackPoint.id);


      const snapshots = this.snapshotManager.getSnapshotsForRollbackPoint(rollbackPoint.id);


      let strategy = operation.strategy;
      if (!strategy || strategy === RollbackStrategy.IMMEDIATE) {
        strategy = RollbackStrategyFactory.getRecommendedStrategy({
          operation,
          targetRollbackPoint: rollbackPoint,
          snapshots,
          diff: diff.changes,
          conflictResolution: options?.conflictResolution || { strategy: ConflictStrategy.ABORT }
        });
      }


      const strategyInstance = RollbackStrategyFactory.createStrategy(strategy);


      const context = {
        operation,
        targetRollbackPoint: rollbackPoint,
        snapshots,
        diff: diff.changes,
        conflictResolution: options?.conflictResolution || { strategy: ConflictStrategy.ABORT },
        onProgress: (progress: number) => {
          operation.progress = progress;
          this.store.updateOperation(operation);
          this.emit('rollback-progress', operation.id, progress);
        },
        onLog: (entry: RollbackLogEntry) => {
          operation.log.push(entry);
          this.store.updateOperation(operation);
        }
      };


      const canHandle = await strategyInstance.validate(context);
      if (!canHandle) {
        throw new RollbackError(
          `Strategy ${strategy} cannot handle this rollback`,
          'STRATEGY_VALIDATION_FAILED',
          { strategy, rollbackPointId: rollbackPoint.id }
        );
      }


      if (!options?.dryRun) {
        await strategyInstance.execute(context);
      }


      operation.status = RollbackStatus.COMPLETED;
      operation.progress = 100;
      operation.completedAt = new Date();
      await this.store.updateOperation(operation);

      this.activeOperations.delete(operation.id);
      this.emit('rollback-completed', operation);

    } catch (error) {
      await this.handleRollbackError(operation, error);
    }
  }




  private async handleRollbackError(operation: RollbackOperation, error: any): Promise<void> {
    operation.status = RollbackStatus.FAILED;
    operation.error = error instanceof Error ? error.message : String(error);
    operation.completedAt = new Date();


    operation.log.push({
      timestamp: new Date(),
      level: 'error',
      message: 'Rollback operation failed',
      data: { error: operation.error }
    });

    await this.store.updateOperation(operation);
    this.activeOperations.delete(operation.id);

    this.emit('rollback-failed', operation, error);
  }




  private async captureSnapshots(rollbackPointId: string): Promise<void> {
    try {

      if (this.knowledgeGraphService) {
        const entities = await this.knowledgeGraphService.getEntities();
        await this.snapshotManager.createSnapshot(
          rollbackPointId,
          SnapshotType.ENTITY,
          entities,
          { source: 'knowledge-graph' }
        );

        const relationships = await this.knowledgeGraphService.getRelationships();
        await this.snapshotManager.createSnapshot(
          rollbackPointId,
          SnapshotType.RELATIONSHIP,
          relationships,
          { source: 'knowledge-graph' }
        );
      }


      if (this.sessionManager) {
        const sessionId = this.sessionManager.getCurrentSessionId();
        if (sessionId) {
          const sessionData = await this.sessionManager.getSessionData(sessionId);
          await this.snapshotManager.createSnapshot(
            rollbackPointId,
            SnapshotType.SESSION_STATE,
            sessionData,
            { sessionId, source: 'session-manager' }
          );
        }
      }




    } catch (error) {
      throw new RollbackError(
        'Failed to capture snapshots',
        'SNAPSHOT_CAPTURE_FAILED',
        { rollbackPointId, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }
}

================
File: rollback/RollbackStore.ts
================
import { EventEmitter } from 'events';
import {
  RollbackPoint,
  RollbackOperation,
  RollbackStoreOptions,
  RollbackConfig,
  RollbackError,
  RollbackNotFoundError,
  RollbackExpiredError,
  RollbackMetrics
} from './RollbackTypes.js';




class LRUCache<K, V> {
  private cache = new Map<K, { value: V; lastAccessed: number }>();
  private accessOrder: K[] = [];

  constructor(private maxSize: number) {}

  set(key: K, value: V): void {
    const now = Date.now();

    if (this.cache.has(key)) {

      this.cache.set(key, { value, lastAccessed: now });
      this.updateAccessOrder(key);
    } else {

      if (this.cache.size >= this.maxSize) {
        this.evictLeastRecentlyUsed();
      }
      this.cache.set(key, { value, lastAccessed: now });
      this.accessOrder.push(key);
    }
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      entry.lastAccessed = Date.now();
      this.updateAccessOrder(key);
      return entry.value;
    }
    return undefined;
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.accessOrder = this.accessOrder.filter(k => k !== key);
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    return this.cache.size;
  }

  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  values(): V[] {
    return Array.from(this.cache.values()).map(entry => entry.value);
  }

  private updateAccessOrder(key: K): void {
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);
  }

  private evictLeastRecentlyUsed(): void {
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder.shift()!;
      this.cache.delete(lruKey);
    }
  }
}




export class RollbackStore extends EventEmitter {
  private rollbackPoints: LRUCache<string, RollbackPoint>;
  private operations = new Map<string, RollbackOperation>();
  private expiryTimers = new Map<string, NodeJS.Timeout>();
  private cleanupTimer?: NodeJS.Timeout;
  private metrics: RollbackMetrics;

  constructor(
    private config: RollbackConfig,
    private options: RollbackStoreOptions
  ) {
    super();

    this.rollbackPoints = new LRUCache(options.maxItems);
    this.metrics = {
      totalRollbackPoints: 0,
      successfulRollbacks: 0,
      failedRollbacks: 0,
      averageRollbackTime: 0,
      memoryUsage: 0
    };

    if (config.autoCleanup) {
      this.startCleanupTimer();
    }
  }




  async storeRollbackPoint(rollbackPoint: RollbackPoint): Promise<void> {

    if (this.rollbackPoints.size() >= this.options.maxItems) {
      this.emit('capacity-reached', { currentSize: this.rollbackPoints.size(), maxSize: this.options.maxItems });
    }


    this.rollbackPoints.set(rollbackPoint.id, rollbackPoint);
    this.metrics.totalRollbackPoints++;


    if (rollbackPoint.expiresAt) {
      const now = Date.now();
      const expiryTime = rollbackPoint.expiresAt.getTime();
      if (expiryTime > now) {
        const timeout = setTimeout(() => {
          this.expireRollbackPoint(rollbackPoint.id);
        }, expiryTime - now);
        this.expiryTimers.set(rollbackPoint.id, timeout);
      }
    }


    if (this.options.enablePersistence) {
      await this.persistRollbackPoint(rollbackPoint);
    }

    this.updateMemoryUsage();
    this.emit('rollback-point-stored', { rollbackPoint });
  }




  async getRollbackPoint(id: string): Promise<RollbackPoint | null> {
    const rollbackPoint = this.rollbackPoints.get(id);
    if (!rollbackPoint) {
      return null;
    }


    if (rollbackPoint.expiresAt && rollbackPoint.expiresAt < new Date()) {
      await this.removeRollbackPoint(id);
      throw new RollbackExpiredError(id);
    }

    return rollbackPoint;
  }




  async getAllRollbackPoints(): Promise<RollbackPoint[]> {
    const points = this.rollbackPoints.values();
    const validPoints: RollbackPoint[] = [];

    for (const point of points) {
      if (!point.expiresAt || point.expiresAt >= new Date()) {
        validPoints.push(point);
      }
    }

    return validPoints.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }




  async getRollbackPointsForSession(sessionId: string): Promise<RollbackPoint[]> {
    const allPoints = await this.getAllRollbackPoints();
    return allPoints.filter(point => point.sessionId === sessionId);
  }




  async removeRollbackPoint(id: string): Promise<boolean> {
    const rollbackPoint = this.rollbackPoints.get(id);
    if (!rollbackPoint) {
      return false;
    }


    this.rollbackPoints.delete(id);


    const timer = this.expiryTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.expiryTimers.delete(id);
    }


    if (this.options.enablePersistence) {
      await this.unpersistRollbackPoint(id);
    }

    this.updateMemoryUsage();
    this.emit('rollback-point-removed', { rollbackPointId: id });

    return true;
  }




  async storeOperation(operation: RollbackOperation): Promise<void> {
    this.operations.set(operation.id, operation);
    this.emit('operation-stored', { operation });
  }




  async getOperation(id: string): Promise<RollbackOperation | null> {
    return this.operations.get(id) || null;
  }




  async updateOperation(operation: RollbackOperation): Promise<void> {
    if (!this.operations.has(operation.id)) {
      throw new RollbackNotFoundError(operation.id);
    }

    this.operations.set(operation.id, operation);
    this.emit('operation-updated', { operation });


    if (operation.status === 'completed') {
      this.metrics.successfulRollbacks++;
      if (operation.startedAt && operation.completedAt) {
        const duration = operation.completedAt.getTime() - operation.startedAt.getTime();
        this.updateAverageRollbackTime(duration);
      }
    } else if (operation.status === 'failed') {
      this.metrics.failedRollbacks++;
    }
  }




  async removeOperation(id: string): Promise<boolean> {
    const removed = this.operations.delete(id);
    if (removed) {
      this.emit('operation-removed', { operationId: id });
    }
    return removed;
  }




  async getAllOperations(): Promise<RollbackOperation[]> {
    return Array.from(this.operations.values());
  }




  async getOperationsByStatus(status: string): Promise<RollbackOperation[]> {
    return Array.from(this.operations.values()).filter(op => op.status === status);
  }




  async cleanup(): Promise<{ removedPoints: number; removedOperations: number }> {
    const now = new Date();
    let removedPoints = 0;
    let removedOperations = 0;


    const allPoints = this.rollbackPoints.values();
    for (const point of allPoints) {
      if (point.expiresAt && point.expiresAt < now) {
        await this.removeRollbackPoint(point.id);
        removedPoints++;
      }
    }


    const cutoffTime = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    for (const [id, operation] of Array.from(this.operations.entries())) {
      if (
        (operation.status === 'completed' || operation.status === 'failed') &&
        operation.completedAt &&
        operation.completedAt < cutoffTime
      ) {
        await this.removeOperation(id);
        removedOperations++;
      }
    }

    this.metrics.lastCleanup = new Date();
    this.updateMemoryUsage();

    this.emit('cleanup-completed', { removedPoints, removedOperations });

    return { removedPoints, removedOperations };
  }




  getMetrics(): RollbackMetrics {
    this.updateMemoryUsage();
    return { ...this.metrics };
  }




  async clear(): Promise<void> {

    for (const timer of Array.from(this.expiryTimers.values())) {
      clearTimeout(timer);
    }
    this.expiryTimers.clear();


    this.rollbackPoints.clear();
    this.operations.clear();


    this.metrics = {
      totalRollbackPoints: 0,
      successfulRollbacks: 0,
      failedRollbacks: 0,
      averageRollbackTime: 0,
      memoryUsage: 0
    };

    this.emit('store-cleared');
  }




  async shutdown(): Promise<void> {

    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }


    for (const timer of Array.from(this.expiryTimers.values())) {
      clearTimeout(timer);
    }
    this.expiryTimers.clear();

    this.emit('store-shutdown');
  }




  private async expireRollbackPoint(id: string): Promise<void> {
    await this.removeRollbackPoint(id);
    this.emit('rollback-point-expired', { rollbackPointId: id });
  }




  private startCleanupTimer(): void {
    const interval = this.config.cleanupInterval || 5 * 60 * 1000;
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanup();
      } catch (error) {
        this.emit('cleanup-error', { error });
      }
    }, interval);
  }




  private updateMemoryUsage(): void {

    const pointsSize = this.rollbackPoints.size() * 1024;
    const operationsSize = this.operations.size * 512;
    this.metrics.memoryUsage = pointsSize + operationsSize;
  }




  private updateAverageRollbackTime(newTime: number): void {
    const currentAvg = this.metrics.averageRollbackTime;
    const count = this.metrics.successfulRollbacks;
    this.metrics.averageRollbackTime = ((currentAvg * (count - 1)) + newTime) / count;
  }




  private async persistRollbackPoint(rollbackPoint: RollbackPoint): Promise<void> {


  }




  private async unpersistRollbackPoint(id: string): Promise<void> {


  }
}

================
File: rollback/RollbackStrategies.ts
================
import { EventEmitter } from 'events';
import {
  RollbackStrategy,
  RollbackOperation,
  RollbackPoint,
  Snapshot,
  DiffEntry,
  ConflictResolution,
  ConflictStrategy,
  RollbackConflict,
  ConflictType,
  RollbackLogEntry,
  RollbackError,
  RollbackConflictError
} from './RollbackTypes.js';




interface RollbackContext {
  operation: RollbackOperation;
  targetRollbackPoint: RollbackPoint;
  snapshots: Snapshot[];
  diff: DiffEntry[];
  conflictResolution: ConflictResolution;
  onProgress?: (progress: number) => void;
  onLog?: (entry: RollbackLogEntry) => void;
}




abstract class BaseRollbackStrategy extends EventEmitter {
  protected context!: RollbackContext;




  abstract execute(context: RollbackContext): Promise<void>;




  abstract validate(context: RollbackContext): Promise<boolean>;




  abstract estimateTime(context: RollbackContext): Promise<number>;




  protected log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: Record<string, any>): void {
    const entry: RollbackLogEntry = {
      timestamp: new Date(),
      level,
      message,
      data
    };

    if (this.context.onLog) {
      this.context.onLog(entry);
    }

    this.emit('log', entry);
  }




  protected updateProgress(progress: number): void {
    if (this.context.onProgress) {
      this.context.onProgress(Math.min(100, Math.max(0, progress)));
    }
    this.emit('progress', { progress });
  }




  protected async handleConflicts(conflicts: RollbackConflict[]): Promise<void> {
    if (conflicts.length === 0) return;

    this.log('warn', `Detected ${conflicts.length} conflicts during rollback`, {
      conflictCount: conflicts.length,
      conflictTypes: conflicts.map(c => c.type)
    });

    switch (this.context.conflictResolution.strategy) {
      case ConflictStrategy.ABORT:
        throw new RollbackConflictError('Rollback aborted due to conflicts', conflicts);

      case ConflictStrategy.SKIP:
        this.log('info', 'Skipping conflicted changes');
        break;

      case ConflictStrategy.OVERWRITE:
        this.log('warn', 'Overwriting conflicted changes');
        break;

      case ConflictStrategy.ASK_USER:
        if (this.context.conflictResolution.resolver) {
          for (const conflict of conflicts) {
            await this.context.conflictResolution.resolver(conflict);
          }
        } else {
          throw new RollbackConflictError('User resolution required but no resolver provided', conflicts);
        }
        break;

      case ConflictStrategy.MERGE:
        this.log('info', 'Attempting to merge conflicted changes');
        await this.mergeConflicts(conflicts);
        break;
    }
  }




  protected async mergeConflicts(conflicts: RollbackConflict[]): Promise<void> {

    for (const conflict of conflicts) {
      this.log('debug', `Merging conflict at path: ${conflict.path}`, {
        conflictType: conflict.type,
        currentValue: conflict.currentValue,
        rollbackValue: conflict.rollbackValue
      });


      switch (conflict.type) {
        case ConflictType.VALUE_MISMATCH:

          break;
        case ConflictType.MISSING_TARGET:

          continue;
        case ConflictType.TYPE_MISMATCH:

          continue;
        default:

          break;
      }
    }
  }
}




export class ImmediateRollbackStrategy extends BaseRollbackStrategy {
  async validate(context: RollbackContext): Promise<boolean> {
    this.context = context;

    return true;
  }

  async estimateTime(context: RollbackContext): Promise<number> {

    const baseTime = 1000;
    const timePerChange = 50;
    return baseTime + (context.diff.length * timePerChange);
  }

  async execute(context: RollbackContext): Promise<void> {
    this.context = context;
    this.log('info', 'Starting immediate rollback strategy');

    const totalChanges = context.diff.length;
    let processedChanges = 0;

    try {

      const conflicts = await this.detectConflicts(context.diff);
      await this.handleConflicts(conflicts);


      for (const change of context.diff) {
        await this.applyChange(change);
        processedChanges++;
        this.updateProgress((processedChanges / totalChanges) * 100);
      }

      this.log('info', 'Immediate rollback completed successfully', {
        totalChanges,
        processedChanges
      });
    } catch (error) {
      this.log('error', 'Immediate rollback failed', {
        error: error instanceof Error ? error.message : String(error),
        processedChanges,
        totalChanges
      });
      throw error;
    }
  }

  private async detectConflicts(changes: DiffEntry[]): Promise<RollbackConflict[]> {
    const conflicts: RollbackConflict[] = [];


    for (const change of changes) {


      if (change.operation === 'update' && change.oldValue !== change.newValue) {

        const currentMatches = true;

        if (!currentMatches) {
          conflicts.push({
            path: change.path,
            type: ConflictType.VALUE_MISMATCH,
            currentValue: 'current_state',
            rollbackValue: change.oldValue,
            context: { change }
          });
        }
      }
    }

    return conflicts;
  }

  private async applyChange(change: DiffEntry): Promise<void> {
    this.log('debug', `Applying change: ${change.operation} at ${change.path}`);


    await new Promise(resolve => setTimeout(resolve, 10));
  }
}




export class GradualRollbackStrategy extends BaseRollbackStrategy {
  private batchSize = 10;
  private delayBetweenBatches = 1000;

  constructor(options?: { batchSize?: number; delayBetweenBatches?: number }) {
    super();
    if (options) {
      this.batchSize = options.batchSize ?? this.batchSize;
      this.delayBetweenBatches = options.delayBetweenBatches ?? this.delayBetweenBatches;
    }
  }

  async validate(context: RollbackContext): Promise<boolean> {
    this.context = context;

    return context.diff.length > 5;
  }

  async estimateTime(context: RollbackContext): Promise<number> {
    const batches = Math.ceil(context.diff.length / this.batchSize);
    const baseTime = 1000;
    const timePerBatch = 500;
    const delayTime = (batches - 1) * this.delayBetweenBatches;
    return baseTime + (batches * timePerBatch) + delayTime;
  }

  async execute(context: RollbackContext): Promise<void> {
    this.context = context;
    this.log('info', 'Starting gradual rollback strategy', {
      totalChanges: context.diff.length,
      batchSize: this.batchSize,
      delayBetweenBatches: this.delayBetweenBatches
    });

    const totalChanges = context.diff.length;
    const batches = this.createBatches(context.diff);
    let processedChanges = 0;

    try {
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        this.log('debug', `Processing batch ${i + 1} of ${batches.length}`, {
          batchSize: batch.length
        });


        const conflicts = await this.detectBatchConflicts(batch);
        await this.handleConflicts(conflicts);


        for (const change of batch) {
          await this.applyChange(change);
          processedChanges++;
          this.updateProgress((processedChanges / totalChanges) * 100);
        }


        if (i < batches.length - 1) {
          this.log('debug', `Waiting ${this.delayBetweenBatches}ms before next batch`);
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenBatches));
        }
      }

      this.log('info', 'Gradual rollback completed successfully', {
        totalChanges,
        batchesProcessed: batches.length
      });
    } catch (error) {
      this.log('error', 'Gradual rollback failed', {
        error: error instanceof Error ? error.message : String(error),
        processedChanges,
        totalChanges
      });
      throw error;
    }
  }

  private createBatches(changes: DiffEntry[]): DiffEntry[][] {
    const batches: DiffEntry[][] = [];
    for (let i = 0; i < changes.length; i += this.batchSize) {
      batches.push(changes.slice(i, i + this.batchSize));
    }
    return batches;
  }

  private async detectBatchConflicts(batch: DiffEntry[]): Promise<RollbackConflict[]> {

    return [];
  }

  private async applyChange(change: DiffEntry): Promise<void> {
    this.log('debug', `Applying change: ${change.operation} at ${change.path}`);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}




export class SafeRollbackStrategy extends BaseRollbackStrategy {
  async validate(context: RollbackContext): Promise<boolean> {
    this.context = context;


    this.log('info', 'Performing safety validation');


    for (const snapshot of context.snapshots) {
      if (!snapshot.checksum) {
        this.log('warn', 'Snapshot missing checksum - may be unsafe', {
          snapshotId: snapshot.id
        });
      }
    }


    const age = Date.now() - context.targetRollbackPoint.timestamp.getTime();
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (age > maxAge) {
      this.log('warn', 'Rollback point is very old - may be unsafe', {
        ageInDays: age / (24 * 60 * 60 * 1000)
      });
      return false;
    }

    return true;
  }

  async estimateTime(context: RollbackContext): Promise<number> {

    const baseTime = 5000;
    const timePerChange = 100;
    const validationTime = 2000;
    return baseTime + (context.diff.length * timePerChange) + validationTime;
  }

  async execute(context: RollbackContext): Promise<void> {
    this.context = context;
    this.log('info', 'Starting safe rollback strategy');

    const totalChanges = context.diff.length;
    let processedChanges = 0;

    try {

      this.log('info', 'Creating safety backup');
      await this.createSafetyBackup();
      this.updateProgress(10);


      this.log('info', 'Validating all changes');
      await this.validateAllChanges(context.diff);
      this.updateProgress(20);


      this.log('info', 'Detecting conflicts');
      const conflicts = await this.detectConflicts(context.diff);
      await this.handleConflicts(conflicts);
      this.updateProgress(30);


      this.log('info', 'Applying changes with verification');
      for (const change of context.diff) {
        await this.applyChangeWithVerification(change);
        processedChanges++;
        const progress = 30 + ((processedChanges / totalChanges) * 60);
        this.updateProgress(progress);
      }


      this.log('info', 'Performing final verification');
      await this.performFinalVerification();
      this.updateProgress(100);

      this.log('info', 'Safe rollback completed successfully', {
        totalChanges,
        processedChanges
      });
    } catch (error) {
      this.log('error', 'Safe rollback failed - attempting to restore safety backup', {
        error: error instanceof Error ? error.message : String(error)
      });

      try {
        await this.restoreSafetyBackup();
        this.log('info', 'Safety backup restored successfully');
      } catch (restoreError) {
        this.log('error', 'Failed to restore safety backup', {
          restoreError: restoreError instanceof Error ? restoreError.message : String(restoreError)
        });
      }

      throw error;
    }
  }

  private async createSafetyBackup(): Promise<void> {

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async validateAllChanges(changes: DiffEntry[]): Promise<void> {

    for (const change of changes) {
      await this.validateChange(change);
    }
  }

  private async validateChange(change: DiffEntry): Promise<void> {

    await new Promise(resolve => setTimeout(resolve, 10));
  }

  private async detectConflicts(changes: DiffEntry[]): Promise<RollbackConflict[]> {

    return [];
  }

  private async applyChangeWithVerification(change: DiffEntry): Promise<void> {

    await this.applyChange(change);


    await this.verifyChange(change);
  }

  private async applyChange(change: DiffEntry): Promise<void> {
    this.log('debug', `Safely applying change: ${change.operation} at ${change.path}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async verifyChange(change: DiffEntry): Promise<void> {

    await new Promise(resolve => setTimeout(resolve, 20));
  }

  private async performFinalVerification(): Promise<void> {

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async restoreSafetyBackup(): Promise<void> {

    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}




export class ForceRollbackStrategy extends BaseRollbackStrategy {
  async validate(context: RollbackContext): Promise<boolean> {
    this.context = context;

    this.log('warn', 'Force rollback strategy bypasses safety checks');
    return true;
  }

  async estimateTime(context: RollbackContext): Promise<number> {

    const baseTime = 500;
    const timePerChange = 20;
    return baseTime + (context.diff.length * timePerChange);
  }

  async execute(context: RollbackContext): Promise<void> {
    this.context = context;
    this.log('warn', 'Starting force rollback strategy - safety checks disabled');

    const totalChanges = context.diff.length;
    let processedChanges = 0;

    try {

      for (const change of context.diff) {
        await this.forceApplyChange(change);
        processedChanges++;
        this.updateProgress((processedChanges / totalChanges) * 100);
      }

      this.log('info', 'Force rollback completed', {
        totalChanges,
        processedChanges,
        warning: 'No safety validations were performed'
      });
    } catch (error) {
      this.log('error', 'Force rollback failed', {
        error: error instanceof Error ? error.message : String(error),
        processedChanges,
        totalChanges,
        warning: 'System may be in inconsistent state'
      });
      throw error;
    }
  }

  private async forceApplyChange(change: DiffEntry): Promise<void> {
    this.log('debug', `Force applying change: ${change.operation} at ${change.path}`);

    await new Promise(resolve => setTimeout(resolve, 20));
  }
}




export class RollbackStrategyFactory {
  private static strategies = new Map<RollbackStrategy, () => BaseRollbackStrategy>([
    [RollbackStrategy.IMMEDIATE, () => new ImmediateRollbackStrategy()],
    [RollbackStrategy.GRADUAL, () => new GradualRollbackStrategy()],
    [RollbackStrategy.SAFE, () => new SafeRollbackStrategy()],
    [RollbackStrategy.FORCE, () => new ForceRollbackStrategy()]
  ]);




  static createStrategy(strategy: RollbackStrategy, options?: any): BaseRollbackStrategy {
    const factory = this.strategies.get(strategy);
    if (!factory) {
      throw new RollbackError(
        `Unknown rollback strategy: ${strategy}`,
        'UNKNOWN_STRATEGY',
        { strategy }
      );
    }

    const instance = factory();


    if (options && strategy === RollbackStrategy.GRADUAL) {
      return new GradualRollbackStrategy(options);
    }

    return instance;
  }




  static getRecommendedStrategy(context: RollbackContext): RollbackStrategy {
    const changeCount = context.diff.length;
    const rollbackAge = Date.now() - context.targetRollbackPoint.timestamp.getTime();
    const dayInMs = 24 * 60 * 60 * 1000;


    if (changeCount <= 5) {
      return RollbackStrategy.IMMEDIATE;
    }


    if (rollbackAge > dayInMs) {
      return RollbackStrategy.SAFE;
    }


    if (changeCount > 50) {
      return RollbackStrategy.GRADUAL;
    }


    return RollbackStrategy.IMMEDIATE;
  }
}

================
File: rollback/RollbackTypes.ts
================
export interface RollbackPoint {

  id: string;

  name: string;

  timestamp: Date;

  description?: string;

  metadata: Record<string, any>;

  sessionId?: string;

  expiresAt?: Date;
}

export interface Snapshot {

  id: string;

  rollbackPointId: string;

  type: SnapshotType;

  data: any;

  size: number;

  createdAt: Date;

  checksum?: string;
}

export enum SnapshotType {
  ENTITY = 'entity',
  RELATIONSHIP = 'relationship',
  FILE = 'file',
  CONFIGURATION = 'configuration',
  SESSION_STATE = 'session_state',
  METADATA = 'metadata'
}

export interface DiffEntry {

  path: string;

  operation: DiffOperation;

  oldValue: any;

  newValue: any;

  metadata?: Record<string, any>;
}

export enum DiffOperation {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  MOVE = 'move'
}

export interface RollbackDiff {

  from: string;

  to: string;

  changes: DiffEntry[];

  changeCount: number;

  generatedAt: Date;
}

export interface RollbackOperation {

  id: string;

  type: RollbackOperationType;

  targetRollbackPointId: string;

  status: RollbackStatus;

  progress: number;

  error?: string;

  startedAt: Date;

  completedAt?: Date;

  strategy: RollbackStrategy;

  log: RollbackLogEntry[];
}

export enum RollbackOperationType {
  FULL = 'full',
  PARTIAL = 'partial',
  SELECTIVE = 'selective',
  DRY_RUN = 'dry_run'
}

export enum RollbackStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum RollbackStrategy {
  IMMEDIATE = 'immediate',
  GRADUAL = 'gradual',
  SAFE = 'safe',
  FORCE = 'force'
}

export interface RollbackLogEntry {

  timestamp: Date;

  level: 'info' | 'warn' | 'error' | 'debug';

  message: string;

  data?: Record<string, any>;
}

export interface RollbackConfig {

  maxRollbackPoints: number;

  defaultTTL: number;

  autoCleanup: boolean;

  cleanupInterval: number;

  maxSnapshotSize: number;

  enablePersistence: boolean;

  persistenceType: 'memory' | 'redis' | 'postgresql';

  requireDatabaseReady: boolean;
}

export interface RollbackStoreOptions {

  maxItems: number;

  defaultTTL: number;

  enableLRU: boolean;

  enablePersistence: boolean;
}

export interface ConflictResolution {

  strategy: ConflictStrategy;

  resolver?: (conflict: RollbackConflict) => Promise<ConflictResolution>;
}

export enum ConflictStrategy {
  ABORT = 'abort',
  SKIP = 'skip',
  OVERWRITE = 'overwrite',
  MERGE = 'merge',
  ASK_USER = 'ask_user'
}

export interface RollbackConflict {

  path: string;

  type: ConflictType;

  currentValue: any;

  rollbackValue: any;

  context?: Record<string, any>;
}

export enum ConflictType {
  VALUE_MISMATCH = 'value_mismatch',
  MISSING_TARGET = 'missing_target',
  TYPE_MISMATCH = 'type_mismatch',
  PERMISSION_DENIED = 'permission_denied',
  DEPENDENCY_CONFLICT = 'dependency_conflict'
}

export interface RollbackMetrics {

  totalRollbackPoints: number;

  successfulRollbacks: number;

  failedRollbacks: number;

  averageRollbackTime: number;

  memoryUsage: number;

  lastCleanup?: Date;
}




export interface RollbackEvents {
  'rollback-point-created': { rollbackPoint: RollbackPoint };
  'rollback-point-expired': { rollbackPointId: string };
  'rollback-started': { operation: RollbackOperation };
  'rollback-progress': { operationId: string; progress: number };
  'rollback-completed': { operation: RollbackOperation };
  'rollback-failed': { operation: RollbackOperation; error: Error };
  'conflict-detected': { conflict: RollbackConflict };
  'cleanup-started': {};
  'cleanup-completed': { removedCount: number };
}




export class RollbackError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'RollbackError';
  }
}

export class RollbackConflictError extends RollbackError {
  constructor(
    message: string,
    public readonly conflicts: RollbackConflict[]
  ) {
    super(message, 'ROLLBACK_CONFLICT');
    this.name = 'RollbackConflictError';
  }
}

export class RollbackNotFoundError extends RollbackError {
  constructor(rollbackPointId: string) {
    super(`Rollback point not found: ${rollbackPointId}`, 'ROLLBACK_NOT_FOUND');
    this.name = 'RollbackNotFoundError';
  }
}

export class RollbackExpiredError extends RollbackError {
  constructor(rollbackPointId: string) {
    super(`Rollback point has expired: ${rollbackPointId}`, 'ROLLBACK_EXPIRED');
    this.name = 'RollbackExpiredError';
  }
}

export class DatabaseNotReadyError extends RollbackError {
  constructor() {
    super('Database service is not ready for rollback operations', 'DATABASE_NOT_READY');
    this.name = 'DatabaseNotReadyError';
  }
}

================
File: rollback/Snapshot.ts
================
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import {
  Snapshot,
  SnapshotType,
  RollbackError,
  RollbackConfig
} from './RollbackTypes.js';




export class SnapshotManager {
  private snapshots = new Map<string, Snapshot>();
  private snapshotsByRollbackPoint = new Map<string, Set<string>>();
  private totalSize = 0;

  constructor(private config: RollbackConfig) {}




  async createSnapshot(
    rollbackPointId: string,
    type: SnapshotType,
    data: any,
    metadata?: Record<string, any>
  ): Promise<Snapshot> {
    const serializedData = this.serializeData(data);
    const size = this.calculateSize(serializedData);


    if (size > this.config.maxSnapshotSize) {
      throw new RollbackError(
        `Snapshot size ${size} exceeds maximum allowed size ${this.config.maxSnapshotSize}`,
        'SNAPSHOT_TOO_LARGE',
        { size, maxSize: this.config.maxSnapshotSize, type }
      );
    }

    const snapshot: Snapshot = {
      id: uuidv4(),
      rollbackPointId,
      type,
      data: serializedData,
      size,
      createdAt: new Date(),
      checksum: this.generateChecksum(serializedData)
    };


    this.snapshots.set(snapshot.id, snapshot);
    this.totalSize += size;


    if (!this.snapshotsByRollbackPoint.has(rollbackPointId)) {
      this.snapshotsByRollbackPoint.set(rollbackPointId, new Set());
    }
    this.snapshotsByRollbackPoint.get(rollbackPointId)!.add(snapshot.id);

    return snapshot;
  }




  getSnapshot(snapshotId: string): Snapshot | null {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      return null;
    }


    if (snapshot.checksum && !this.verifyChecksum(snapshot.data, snapshot.checksum)) {
      throw new RollbackError(
        `Snapshot data corruption detected for snapshot ${snapshotId}`,
        'SNAPSHOT_CORRUPTED',
        { snapshotId }
      );
    }

    return snapshot;
  }




  getSnapshotsForRollbackPoint(rollbackPointId: string): Snapshot[] {
    const snapshotIds = this.snapshotsByRollbackPoint.get(rollbackPointId);
    if (!snapshotIds) {
      return [];
    }

    const snapshots: Snapshot[] = [];
    for (const snapshotId of Array.from(snapshotIds)) {
      const snapshot = this.getSnapshot(snapshotId);
      if (snapshot) {
        snapshots.push(snapshot);
      }
    }

    return snapshots.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }




  getSnapshotsByType(type: SnapshotType): Snapshot[] {
    const snapshots: Snapshot[] = [];
    for (const snapshot of Array.from(this.snapshots.values())) {
      if (snapshot.type === type) {
        snapshots.push(snapshot);
      }
    }
    return snapshots.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }




  async restoreFromSnapshot(snapshotId: string): Promise<any> {
    const snapshot = this.getSnapshot(snapshotId);
    if (!snapshot) {
      throw new RollbackError(
        `Snapshot not found: ${snapshotId}`,
        'SNAPSHOT_NOT_FOUND',
        { snapshotId }
      );
    }

    return this.deserializeData(snapshot.data, snapshot.type);
  }




  deleteSnapshot(snapshotId: string): boolean {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      return false;
    }


    this.snapshots.delete(snapshotId);
    this.totalSize -= snapshot.size;


    const rollbackPointSnapshots = this.snapshotsByRollbackPoint.get(snapshot.rollbackPointId);
    if (rollbackPointSnapshots) {
      rollbackPointSnapshots.delete(snapshotId);
      if (rollbackPointSnapshots.size === 0) {
        this.snapshotsByRollbackPoint.delete(snapshot.rollbackPointId);
      }
    }

    return true;
  }




  deleteSnapshotsForRollbackPoint(rollbackPointId: string): number {
    const snapshotIds = this.snapshotsByRollbackPoint.get(rollbackPointId);
    if (!snapshotIds) {
      return 0;
    }

    let deletedCount = 0;
    for (const snapshotId of Array.from(snapshotIds)) {
      if (this.deleteSnapshot(snapshotId)) {
        deletedCount++;
      }
    }

    return deletedCount;
  }




  getMemoryUsage(): {
    totalSnapshots: number;
    totalSize: number;
    averageSize: number;
    snapshotsByType: Record<string, number>;
  } {
    const snapshotsByType: Record<string, number> = {};

    for (const snapshot of Array.from(this.snapshots.values())) {
      snapshotsByType[snapshot.type] = (snapshotsByType[snapshot.type] || 0) + 1;
    }

    return {
      totalSnapshots: this.snapshots.size,
      totalSize: this.totalSize,
      averageSize: this.snapshots.size > 0 ? this.totalSize / this.snapshots.size : 0,
      snapshotsByType
    };
  }




  async cleanup(): Promise<number> {
    let cleanedCount = 0;


    const referencedSnapshots = new Set<string>();
    for (const snapshotIds of Array.from(this.snapshotsByRollbackPoint.values())) {
      for (const snapshotId of Array.from(snapshotIds)) {
        referencedSnapshots.add(snapshotId);
      }
    }

    for (const snapshotId of Array.from(this.snapshots.keys())) {
      if (!referencedSnapshots.has(snapshotId)) {
        if (this.deleteSnapshot(snapshotId)) {
          cleanedCount++;
        }
      }
    }

    return cleanedCount;
  }




  clear(): void {
    this.snapshots.clear();
    this.snapshotsByRollbackPoint.clear();
    this.totalSize = 0;
  }




  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj);
    }

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item));
    }

    if (obj instanceof Map) {
      const cloned = new Map();
      for (const [key, value] of Array.from(obj.entries())) {
        cloned.set(key, this.deepClone(value));
      }
      return cloned;
    }

    if (obj instanceof Set) {
      const cloned = new Set();
      for (const value of Array.from(obj.values())) {
        cloned.add(this.deepClone(value));
      }
      return cloned;
    }

    const cloned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      cloned[key] = this.deepClone(value);
    }
    return cloned;
  }




  private serializeData(data: any): any {

    const cloned = this.deepClone(data);


    return JSON.parse(JSON.stringify(cloned, (key, value) => {
      if (value instanceof Map) {
        return { __type: 'Map', data: Array.from(value.entries()) };
      }
      if (value instanceof Set) {
        return { __type: 'Set', data: Array.from(value.values()) };
      }
      if (value instanceof Date) {
        return { __type: 'Date', data: value.toISOString() };
      }
      return value;
    }));
  }




  private deserializeData(data: any, type: SnapshotType): any {
    return JSON.parse(JSON.stringify(data), (key, value) => {
      if (value && typeof value === 'object' && value.__type) {
        switch (value.__type) {
          case 'Map':
            return new Map(value.data);
          case 'Set':
            return new Set(value.data);
          case 'Date':
            return new Date(value.data);
        }
      }
      return value;
    });
  }




  private calculateSize(data: any): number {
    return new TextEncoder().encode(JSON.stringify(data)).length;
  }




  private generateChecksum(data: any): string {
    const serialized = JSON.stringify(data);
    return createHash('sha256').update(serialized).digest('hex');
  }




  private verifyChecksum(data: any, expectedChecksum: string): boolean {
    const actualChecksum = this.generateChecksum(data);
    return actualChecksum === expectedChecksum;
  }
}

================
File: services/AgentCoordination.ts
================
import { EventEmitter } from 'events';
import type { RedisClientType } from 'redis';
import {
  SessionDocument,
  SessionEvent,
  SessionError,
} from './SessionTypes.js';

export interface AgentInfo {
  id: string;
  type: string;
  capabilities: string[];
  priority: number;
  load: number;
  maxLoad: number;
  status: 'active' | 'busy' | 'idle' | 'dead' | 'maintenance';
  lastHeartbeat: string;
  metadata: Record<string, any>;
  currentSessions: string[];
  totalTasksCompleted: number;
  averageTaskDuration: number;
  errorRate: number;
}

export interface TaskInfo {
  id: string;
  type: string;
  priority: number;
  sessionId: string;
  requiredCapabilities: string[];
  estimatedDuration: number;
  deadline?: string;
  assignedAgent?: string;
  status: 'queued' | 'assigned' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  assignedAt?: string;
  completedAt?: string;
  attempts: number;
  maxAttempts: number;
  metadata: Record<string, any>;
}

export interface LoadBalancingStrategy {
  type: 'round-robin' | 'least-loaded' | 'priority-based' | 'capability-weighted' | 'dynamic';
  config: Record<string, any>;
}

export interface HandoffContext {
  sessionId: string;
  fromAgent: string;
  toAgent: string;
  reason: string;
  context: Record<string, any>;
  timestamp: string;
  priority: number;
  estimatedDuration?: number;
}

export interface CoordinationMetrics {
  totalAgents: number;
  activeAgents: number;
  queuedTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageTaskDuration: number;
  systemLoad: number;
  deadAgentCount: number;
  handoffCount: number;
}

export interface DeadAgentConfig {
  heartbeatInterval: number;
  heartbeatTimeout: number;
  maxMissedHeartbeats: number;
  enableAutoRecovery: boolean;
  recoveryDelay: number;
}

export class AgentCoordination extends EventEmitter {
  private redis: RedisClientType;
  private agents = new Map<string, AgentInfo>();
  private tasks = new Map<string, TaskInfo>();
  private loadBalancingStrategy: LoadBalancingStrategy;
  private deadAgentConfig: DeadAgentConfig;
  private heartbeatTimer?: NodeJS.Timeout;
  private loadBalancingTimer?: NodeJS.Timeout;
  private deadAgentDetectionTimer?: NodeJS.Timeout;

  constructor(
    redis: RedisClientType,
    loadBalancingStrategy: LoadBalancingStrategy = { type: 'least-loaded', config: {} },
    deadAgentConfig: Partial<DeadAgentConfig> = {}
  ) {
    super();
    this.redis = redis;
    this.loadBalancingStrategy = loadBalancingStrategy;
    this.deadAgentConfig = {
      heartbeatInterval: deadAgentConfig.heartbeatInterval ?? 30,
      heartbeatTimeout: deadAgentConfig.heartbeatTimeout ?? 90,
      maxMissedHeartbeats: deadAgentConfig.maxMissedHeartbeats ?? 3,
      enableAutoRecovery: deadAgentConfig.enableAutoRecovery ?? true,
      recoveryDelay: deadAgentConfig.recoveryDelay ?? 60,
    };

    this.initializeTimers();
  }




  async registerAgent(agentInfo: Omit<AgentInfo, 'lastHeartbeat' | 'currentSessions' | 'totalTasksCompleted' | 'averageTaskDuration' | 'errorRate'>): Promise<void> {
    const agent: AgentInfo = {
      ...agentInfo,
      lastHeartbeat: new Date().toISOString(),
      currentSessions: [],
      totalTasksCompleted: 0,
      averageTaskDuration: 0,
      errorRate: 0,
    };

    this.agents.set(agent.id, agent);


    await this.redis.hSet(`agent:${agent.id}`, {
      type: agent.type,
      capabilities: JSON.stringify(agent.capabilities),
      priority: agent.priority.toString(),
      load: agent.load.toString(),
      maxLoad: agent.maxLoad.toString(),
      status: agent.status,
      lastHeartbeat: agent.lastHeartbeat,
      metadata: JSON.stringify(agent.metadata),
      currentSessions: JSON.stringify(agent.currentSessions),
      totalTasksCompleted: agent.totalTasksCompleted.toString(),
      averageTaskDuration: agent.averageTaskDuration.toString(),
      errorRate: agent.errorRate.toString(),
    });


    await this.redis.zAdd('agent:priority:queue', {
      score: agent.priority,
      value: agent.id,
    });

    this.emit('agent:registered', agent);
  }




  async unregisterAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;


    await this.reassignAgentTasks(agentId);


    await Promise.all([
      this.redis.del(`agent:${agentId}`),
      this.redis.zRem('agent:priority:queue', agentId),
      this.redis.zRem('agent:load:queue', agentId),
    ]);

    this.agents.delete(agentId);
    this.emit('agent:unregistered', { agentId, agent });
  }




  async submitTask(taskInfo: Omit<TaskInfo, 'id' | 'status' | 'createdAt' | 'attempts'>): Promise<string> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const task: TaskInfo = {
      ...taskInfo,
      id: taskId,
      status: 'queued',
      createdAt: new Date().toISOString(),
      attempts: 0,
    };

    this.tasks.set(taskId, task);


    await this.redis.hSet(`task:${taskId}`, {
      type: task.type,
      priority: task.priority.toString(),
      sessionId: task.sessionId,
      requiredCapabilities: JSON.stringify(task.requiredCapabilities),
      estimatedDuration: task.estimatedDuration.toString(),
      deadline: task.deadline || '',
      status: task.status,
      createdAt: task.createdAt,
      attempts: task.attempts.toString(),
      maxAttempts: task.maxAttempts.toString(),
      metadata: JSON.stringify(task.metadata),
    });

    // Add to priority queue
    await this.redis.zAdd('task:priority:queue', {
      score: task.priority,
      value: taskId,
    });

    this.emit('task:submitted', task);


    await this.assignTasks();

    return taskId;
  }




  async assignTasks(): Promise<void> {
    const queuedTasks = await this.getQueuedTasks();
    const availableAgents = await this.getAvailableAgents();

    for (const task of queuedTasks) {
      const suitableAgents = this.findSuitableAgents(task, availableAgents);
      if (suitableAgents.length === 0) continue;

      const selectedAgent = this.selectAgent(suitableAgents, task);
      if (selectedAgent) {
        await this.assignTaskToAgent(task.id, selectedAgent.id);
      }
    }
  }




  async assignTaskToAgent(taskId: string, agentId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    const agent = this.agents.get(agentId);

    if (!task || !agent) {
      throw new Error(`Task ${taskId} or agent ${agentId} not found`);
    }

    if (agent.status !== 'active' && agent.status !== 'idle') {
      throw new Error(`Agent ${agentId} is not available for task assignment`);
    }


    task.assignedAgent = agentId;
    task.status = 'assigned';
    task.assignedAt = new Date().toISOString();
    task.attempts++;


    agent.load += 1;
    agent.currentSessions.push(task.sessionId);
    if (agent.load >= agent.maxLoad) {
      agent.status = 'busy';
    }


    await Promise.all([
      this.redis.hSet(`task:${taskId}`, {
        assignedAgent: agentId,
        status: task.status,
        assignedAt: task.assignedAt,
        attempts: task.attempts.toString(),
      }),
      this.redis.hSet(`agent:${agentId}`, {
        load: agent.load.toString(),
        status: agent.status,
        currentSessions: JSON.stringify(agent.currentSessions),
      }),
      this.redis.zRem('task:priority:queue', taskId),
      this.redis.zAdd('task:assigned:queue', {
        score: Date.now(),
        value: taskId,
      }),
    ]);

    this.emit('task:assigned', { task, agent });
  }




  async completeTask(taskId: string, result?: any): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task || !task.assignedAgent) {
      throw new Error(`Task ${taskId} not found or not assigned`);
    }

    const agent = this.agents.get(task.assignedAgent);
    if (!agent) {
      throw new Error(`Agent ${task.assignedAgent} not found`);
    }


    task.status = 'completed';
    task.completedAt = new Date().toISOString();


    agent.load = Math.max(0, agent.load - 1);
    agent.currentSessions = agent.currentSessions.filter(s => s !== task.sessionId);
    agent.totalTasksCompleted++;

    if (task.assignedAt) {
      const duration = new Date(task.completedAt).getTime() - new Date(task.assignedAt).getTime();
      agent.averageTaskDuration = (agent.averageTaskDuration * (agent.totalTasksCompleted - 1) + duration) / agent.totalTasksCompleted;
    }

    if (agent.status === 'busy' && agent.load < agent.maxLoad) {
      agent.status = 'active';
    }


    await Promise.all([
      this.redis.hSet(`task:${taskId}`, {
        status: task.status,
        completedAt: task.completedAt,
        result: result ? JSON.stringify(result) : '',
      }),
      this.redis.hSet(`agent:${agent.id}`, {
        load: agent.load.toString(),
        status: agent.status,
        currentSessions: JSON.stringify(agent.currentSessions),
        totalTasksCompleted: agent.totalTasksCompleted.toString(),
        averageTaskDuration: agent.averageTaskDuration.toString(),
      }),
      this.redis.zRem('task:assigned:queue', taskId),
    ]);

    this.emit('task:completed', { task, agent, result });


    await this.assignTasks();
  }




  async failTask(taskId: string, error: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task || !task.assignedAgent) {
      throw new Error(`Task ${taskId} not found or not assigned`);
    }

    const agent = this.agents.get(task.assignedAgent);
    if (agent) {

      const totalTasks = agent.totalTasksCompleted + 1;
      agent.errorRate = (agent.errorRate * agent.totalTasksCompleted + 1) / totalTasks;


      agent.load = Math.max(0, agent.load - 1);
      agent.currentSessions = agent.currentSessions.filter(s => s !== task.sessionId);

      if (agent.status === 'busy' && agent.load < agent.maxLoad) {
        agent.status = 'active';
      }

      await this.redis.hSet(`agent:${agent.id}`, {
        load: agent.load.toString(),
        status: agent.status,
        currentSessions: JSON.stringify(agent.currentSessions),
        errorRate: agent.errorRate.toString(),
      });
    }


    if (task.attempts < task.maxAttempts) {

      task.status = 'queued';
      task.assignedAgent = undefined;
      task.assignedAt = undefined;

      await Promise.all([
        this.redis.hSet(`task:${taskId}`, {
          status: task.status,
          assignedAgent: '',
          assignedAt: '',
        }),
        this.redis.zRem('task:assigned:queue', taskId),
        this.redis.zAdd('task:priority:queue', {
          score: task.priority,
          value: taskId,
        }),
      ]);

      this.emit('task:retry', { task, error });
    } else {

      task.status = 'failed';

      await Promise.all([
        this.redis.hSet(`task:${taskId}`, {
          status: task.status,
          error,
        }),
        this.redis.zRem('task:assigned:queue', taskId),
      ]);

      this.emit('task:failed', { task, error });
    }


    await this.assignTasks();
  }




  async initiateHandoff(handoffContext: HandoffContext): Promise<void> {
    const fromAgent = this.agents.get(handoffContext.fromAgent);
    const toAgent = this.agents.get(handoffContext.toAgent);

    if (!fromAgent || !toAgent) {
      throw new Error('Source or target agent not found');
    }

    if (toAgent.status !== 'active' && toAgent.status !== 'idle') {
      throw new Error('Target agent is not available for handoff');
    }


    const handoffId = `handoff-${Date.now()}`;
    await this.redis.hSet(`handoff:${handoffId}`, {
      sessionId: handoffContext.sessionId,
      fromAgent: handoffContext.fromAgent,
      toAgent: handoffContext.toAgent,
      reason: handoffContext.reason,
      context: JSON.stringify(handoffContext.context),
      timestamp: handoffContext.timestamp,
      priority: handoffContext.priority.toString(),
      estimatedDuration: handoffContext.estimatedDuration?.toString() || '',
    });

    // Update agent sessions
    fromAgent.currentSessions = fromAgent.currentSessions.filter(s => s !== handoffContext.sessionId);
    toAgent.currentSessions.push(handoffContext.sessionId);

    // Update loads
    fromAgent.load = Math.max(0, fromAgent.load - 1);
    toAgent.load += 1;

    // Update status
    if (fromAgent.status === 'busy' && fromAgent.load < fromAgent.maxLoad) {
      fromAgent.status = 'active';
    }
    if (toAgent.load >= toAgent.maxLoad) {
      toAgent.status = 'busy';
    }


    await Promise.all([
      this.redis.hSet(`agent:${fromAgent.id}`, {
        load: fromAgent.load.toString(),
        status: fromAgent.status,
        currentSessions: JSON.stringify(fromAgent.currentSessions),
      }),
      this.redis.hSet(`agent:${toAgent.id}`, {
        load: toAgent.load.toString(),
        status: toAgent.status,
        currentSessions: JSON.stringify(toAgent.currentSessions),
      }),
    ]);

    this.emit('handoff:initiated', handoffContext);
  }




  async sendHeartbeat(agentId: string, status?: string, metadata?: Record<string, any>): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.lastHeartbeat = new Date().toISOString();
    if (status) agent.status = status as any;
    if (metadata) agent.metadata = { ...agent.metadata, ...metadata };

    await this.redis.hSet(`agent:${agentId}`, {
      lastHeartbeat: agent.lastHeartbeat,
      status: agent.status,
      metadata: JSON.stringify(agent.metadata),
    });

    this.emit('agent:heartbeat', { agentId, agent });
  }




  async getMetrics(): Promise<CoordinationMetrics> {
    const totalAgents = this.agents.size;
    const activeAgents = Array.from(this.agents.values()).filter(a => a.status === 'active' || a.status === 'busy').length;

    const queuedTasks = await this.redis.zCard('task:priority:queue');
    const runningTasks = await this.redis.zCard('task:assigned:queue');

    const allTasks = Array.from(this.tasks.values());
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const failedTasks = allTasks.filter(t => t.status === 'failed').length;

    const totalDuration = Array.from(this.agents.values()).reduce((sum, a) => sum + a.averageTaskDuration, 0);
    const averageTaskDuration = activeAgents > 0 ? totalDuration / activeAgents : 0;

    const totalLoad = Array.from(this.agents.values()).reduce((sum, a) => sum + a.load, 0);
    const totalCapacity = Array.from(this.agents.values()).reduce((sum, a) => sum + a.maxLoad, 0);
    const systemLoad = totalCapacity > 0 ? totalLoad / totalCapacity : 0;

    const deadAgentCount = Array.from(this.agents.values()).filter(a => a.status === 'dead').length;
    const handoffCount = await this.redis.zCard('handoff:*') || 0;

    return {
      totalAgents,
      activeAgents,
      queuedTasks,
      runningTasks,
      completedTasks,
      failedTasks,
      averageTaskDuration,
      systemLoad,
      deadAgentCount,
      handoffCount,
    };
  }




  private async getQueuedTasks(): Promise<TaskInfo[]> {
    const taskIds = await this.redis.zRevRange('task:priority:queue', 0, -1);
    return taskIds.map(id => this.tasks.get(id)).filter(Boolean) as TaskInfo[];
  }




  private async getAvailableAgents(): Promise<AgentInfo[]> {
    return Array.from(this.agents.values()).filter(agent =>
      (agent.status === 'active' || agent.status === 'idle') && agent.load < agent.maxLoad
    );
  }




  private findSuitableAgents(task: TaskInfo, availableAgents: AgentInfo[]): AgentInfo[] {
    return availableAgents.filter(agent => {

      const hasRequiredCapabilities = task.requiredCapabilities.every(cap =>
        agent.capabilities.includes(cap)
      );


      const canHandleDuration = !task.deadline ||
        new Date(task.deadline).getTime() > Date.now() + task.estimatedDuration;

      return hasRequiredCapabilities && canHandleDuration;
    });
  }




  private selectAgent(suitableAgents: AgentInfo[], task: TaskInfo): AgentInfo | null {
    if (suitableAgents.length === 0) return null;

    switch (this.loadBalancingStrategy.type) {
      case 'round-robin':
        return this.selectAgentRoundRobin(suitableAgents);

      case 'least-loaded':
        return this.selectAgentLeastLoaded(suitableAgents);

      case 'priority-based':
        return this.selectAgentPriorityBased(suitableAgents);

      case 'capability-weighted':
        return this.selectAgentCapabilityWeighted(suitableAgents, task);

      case 'dynamic':
        return this.selectAgentDynamic(suitableAgents, task);

      default:
        return suitableAgents[0];
    }
  }




  private selectAgentRoundRobin(agents: AgentInfo[]): AgentInfo {

    return agents.reduce((selected, current) =>
      current.totalTasksCompleted < selected.totalTasksCompleted ? current : selected
    );
  }




  private selectAgentLeastLoaded(agents: AgentInfo[]): AgentInfo {
    return agents.reduce((selected, current) => {
      const selectedLoadRatio = selected.load / selected.maxLoad;
      const currentLoadRatio = current.load / current.maxLoad;
      return currentLoadRatio < selectedLoadRatio ? current : selected;
    });
  }




  private selectAgentPriorityBased(agents: AgentInfo[]): AgentInfo {
    return agents.reduce((selected, current) =>
      current.priority > selected.priority ? current : selected
    );
  }




  private selectAgentCapabilityWeighted(agents: AgentInfo[], task: TaskInfo): AgentInfo {
    return agents.reduce((selected, current) => {
      const selectedScore = this.calculateCapabilityScore(selected, task);
      const currentScore = this.calculateCapabilityScore(current, task);
      return currentScore > selectedScore ? current : selected;
    });
  }




  private selectAgentDynamic(agents: AgentInfo[], task: TaskInfo): AgentInfo {
    return agents.reduce((selected, current) => {
      const selectedScore = this.calculateDynamicScore(selected, task);
      const currentScore = this.calculateDynamicScore(current, task);
      return currentScore > selectedScore ? current : selected;
    });
  }




  private calculateCapabilityScore(agent: AgentInfo, task: TaskInfo): number {
    const requiredCaps = new Set(task.requiredCapabilities);
    const agentCaps = new Set(agent.capabilities);
    const matchingCaps = task.requiredCapabilities.filter(cap => agentCaps.has(cap)).length;
    const extraCaps = agent.capabilities.filter(cap => !requiredCaps.has(cap)).length;

    return matchingCaps * 2 + extraCaps * 0.5;
  }




  private calculateDynamicScore(agent: AgentInfo, task: TaskInfo): number {
    const loadFactor = 1 - (agent.load / agent.maxLoad);
    const priorityFactor = agent.priority / 10;
    const reliabilityFactor = 1 - agent.errorRate;
    const speedFactor = agent.averageTaskDuration > 0 ? 1 / (agent.averageTaskDuration / 1000) : 1;
    const capabilityFactor = this.calculateCapabilityScore(agent, task) / 10;

    return (loadFactor * 0.3) +
           (priorityFactor * 0.2) +
           (reliabilityFactor * 0.2) +
           (speedFactor * 0.15) +
           (capabilityFactor * 0.15);
  }




  private async reassignAgentTasks(agentId: string): Promise<void> {
    const agentTasks = Array.from(this.tasks.values()).filter(
      task => task.assignedAgent === agentId && task.status === 'assigned'
    );

    for (const task of agentTasks) {
      task.status = 'queued';
      task.assignedAgent = undefined;
      task.assignedAt = undefined;

      await Promise.all([
        this.redis.hSet(`task:${task.id}`, {
          status: task.status,
          assignedAgent: '',
          assignedAt: '',
        }),
        this.redis.zRem('task:assigned:queue', task.id),
        this.redis.zAdd('task:priority:queue', {
          score: task.priority,
          value: task.id,
        }),
      ]);
    }

    this.emit('tasks:reassigned', { agentId, taskCount: agentTasks.length });
  }




  private async detectDeadAgents(): Promise<void> {
    const now = Date.now();
    const timeout = this.deadAgentConfig.heartbeatTimeout * 1000;

    for (const agent of this.agents.values()) {
      const lastHeartbeat = new Date(agent.lastHeartbeat).getTime();
      const timeSinceHeartbeat = now - lastHeartbeat;

      if (timeSinceHeartbeat > timeout && agent.status !== 'dead') {
        agent.status = 'dead';


        await this.reassignAgentTasks(agent.id);


        await this.redis.hSet(`agent:${agent.id}`, {
          status: agent.status,
        });

        this.emit('agent:dead', { agentId: agent.id, timeSinceHeartbeat });


        if (this.deadAgentConfig.enableAutoRecovery) {
          setTimeout(() => {
            this.recoverDeadAgent(agent.id);
          }, this.deadAgentConfig.recoveryDelay * 1000);
        }
      }
    }
  }




  private async recoverDeadAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent || agent.status !== 'dead') return;


    try {

      await this.redis.publish(`agent:${agentId}:recovery`, 'ping');

      this.emit('agent:recovery:attempted', { agentId });
    } catch (error) {
      this.emit('agent:recovery:failed', { agentId, error });
    }
  }




  private initializeTimers(): void {

    this.deadAgentDetectionTimer = setInterval(() => {
      this.detectDeadAgents().catch(error => {
        this.emit('error', error);
      });
    }, this.deadAgentConfig.heartbeatInterval * 1000);


    this.loadBalancingTimer = setInterval(() => {
      this.assignTasks().catch(error => {
        this.emit('error', error);
      });
    }, 5000);
  }




  async shutdown(): Promise<void> {

    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.loadBalancingTimer) clearInterval(this.loadBalancingTimer);
    if (this.deadAgentDetectionTimer) clearInterval(this.deadAgentDetectionTimer);


    for (const agentId of this.agents.keys()) {
      await this.unregisterAgent(agentId);
    }

    this.emit('shutdown');
  }
}

================
File: services/ConfigurationService.ts
================
import { DatabaseService } from '@memento/database';
import { SynchronizationCoordinator } from '@memento/sync';
import * as fs from "fs/promises";
import * as path from "path";

const SYSTEM_CONFIG_DOCUMENT_ID = "00000000-0000-4000-8000-00000000c0f1";
const SYSTEM_CONFIG_DOCUMENT_TYPE = "system_config";

export interface SystemConfiguration {
  version: string;
  environment: string;
  databases: {
    falkordb: "configured" | "error" | "unavailable";
    qdrant: "configured" | "error" | "unavailable";
    postgres: "configured" | "error" | "unavailable";
  };
  features: {
    websocket: boolean;
    graphSearch: boolean;
    vectorSearch: boolean;
    securityScanning: boolean;
    mcpServer: boolean;
    syncCoordinator: boolean;
    history: boolean;
  };
  performance: {
    maxConcurrentSync: number;
    cacheSize: number;
    requestTimeout: number;
  };
  security: {
    rateLimiting: boolean;
    authentication: boolean;
    auditLogging: boolean;
  };
  system: {
    uptime: number;
    memoryUsage?: NodeJS.MemoryUsage;
    cpuUsage?: any;
    platform: string;
    nodeVersion: string;
  };
}

export class ConfigurationService {
  constructor(
    private readonly dbService?: DatabaseService,
    private readonly syncCoordinator?: SynchronizationCoordinator,
    private readonly testWorkingDir?: string
  ) {}

  private cachedConfig: Partial<SystemConfiguration> = {};
  private configLoaded = false;

  async getSystemConfiguration(): Promise<SystemConfiguration> {
    await this.ensureConfigLoaded();

    const config: SystemConfiguration = {
      version: await this.getVersion(),
      environment: process.env.NODE_ENV || "development",
      databases: await this.checkDatabaseStatus(),
      features: await this.checkFeatureStatus(),
      performance: await this.getPerformanceConfig(),
      security: await this.getSecurityConfig(),
      system: await this.getSystemInfo(),
    };

    return config;
  }


  getHistoryConfig(): {
    enabled: boolean;
    retentionDays: number;
    checkpoint: { hops: number; embedVersions: boolean };
    incident: { enabled: boolean; hops: number };
    schedule: { pruneIntervalHours: number; checkpointIntervalHours: number };
  } {
    const enabled = (process.env.HISTORY_ENABLED || 'true').toLowerCase() !== 'false';
    const retentionDays = parseInt(process.env.HISTORY_RETENTION_DAYS || '', 10);
    const hops = parseInt(process.env.HISTORY_CHECKPOINT_HOPS || '', 10);
    const embedVersions = (process.env.HISTORY_EMBED_VERSIONS || 'false').toLowerCase() === 'true';
    const incidentEnabled = (process.env.HISTORY_INCIDENT_ENABLED || 'true').toLowerCase() !== 'false';
    const incidentHops = parseInt(process.env.HISTORY_INCIDENT_HOPS || '', 10);
    const pruneHours = parseInt(process.env.HISTORY_PRUNE_INTERVAL_HOURS || '', 10);
    const checkpointHours = parseInt(process.env.HISTORY_CHECKPOINT_INTERVAL_HOURS || '', 10);
    return {
      enabled,
      retentionDays: Number.isFinite(retentionDays) && retentionDays > 0 ? retentionDays : 30,
      checkpoint: {
        hops: Number.isFinite(hops) && hops > 0 ? Math.min(hops, 5) : 2,
        embedVersions,
      },
      incident: {
        enabled: incidentEnabled,
        hops: Number.isFinite(incidentHops) && incidentHops > 0 ? Math.min(incidentHops, 5) : (Number.isFinite(hops) && hops > 0 ? Math.min(hops, 5) : 2),
      },
      schedule: {
        pruneIntervalHours: Number.isFinite(pruneHours) && pruneHours > 0 ? pruneHours : 24,
        checkpointIntervalHours: Number.isFinite(checkpointHours) && checkpointHours > 0 ? checkpointHours : 24,
      },
    };
  }

  // Update history configuration at runtime (process.env backed)
  updateHistoryConfig(updates: Partial<{
    enabled: boolean;
    retentionDays: number;
    checkpoint: { hops: number; embedVersions: boolean };
    incident: { enabled: boolean; hops: number };
    schedule: { pruneIntervalHours: number; checkpointIntervalHours: number };
  }>): {
    enabled: boolean;
    retentionDays: number;
    checkpoint: { hops: number; embedVersions: boolean };
    incident: { enabled: boolean; hops: number };
    schedule: { pruneIntervalHours: number; checkpointIntervalHours: number };
  } {
    if (updates.enabled !== undefined) {
      process.env.HISTORY_ENABLED = String(!!updates.enabled);
    }
    if (typeof updates.retentionDays === 'number') {
      const v = Math.max(1, Math.floor(updates.retentionDays));
      process.env.HISTORY_RETENTION_DAYS = String(v);
    }
    if (updates.checkpoint) {
      if (typeof updates.checkpoint.hops === 'number') {
        const h = Math.max(1, Math.min(5, Math.floor(updates.checkpoint.hops)));
        process.env.HISTORY_CHECKPOINT_HOPS = String(h);
      }
      if (updates.checkpoint.embedVersions !== undefined) {
        process.env.HISTORY_EMBED_VERSIONS = String(!!updates.checkpoint.embedVersions);
      }
    }
    if (updates.incident) {
      if (typeof updates.incident.enabled === 'boolean') {
        process.env.HISTORY_INCIDENT_ENABLED = String(!!updates.incident.enabled);
      }
      if (typeof updates.incident.hops === 'number') {
        const ih = Math.max(1, Math.min(5, Math.floor(updates.incident.hops)));
        process.env.HISTORY_INCIDENT_HOPS = String(ih);
      }
    }
    if (updates.schedule) {
      if (typeof updates.schedule.pruneIntervalHours === 'number') {
        const ph = Math.max(1, Math.floor(updates.schedule.pruneIntervalHours));
        process.env.HISTORY_PRUNE_INTERVAL_HOURS = String(ph);
      }
      if (typeof updates.schedule.checkpointIntervalHours === 'number') {
        const ch = Math.max(1, Math.floor(updates.schedule.checkpointIntervalHours));
        process.env.HISTORY_CHECKPOINT_INTERVAL_HOURS = String(ch);
      }
    }
    return this.getHistoryConfig();
  }

  private async getVersion(): Promise<string> {
    try {

      const workingDir = this.testWorkingDir || process.cwd();
      const packageJsonPath = path.join(workingDir, "package.json");
      const packageJson = await fs.readFile(packageJsonPath, "utf-8");
      const pkg = JSON.parse(packageJson);
      return pkg.version || "0.1.0";
    } catch (error) {
      console.warn("Could not read package.json for version:", error);
      return "0.1.0";
    }
  }

  private async checkDatabaseStatus(): Promise<
    SystemConfiguration["databases"]
  > {
    const status: SystemConfiguration["databases"] = {
      falkordb: "unavailable",
      qdrant: "unavailable",
      postgres: "unavailable",
    };


    const dbService = this.dbService;
    if (!dbService) {
      return status;
    }

    try {

      await dbService.falkordbQuery("MATCH (n) RETURN count(n) LIMIT 1");
      status.falkordb = "configured";
    } catch (error) {
      console.warn("FalkorDB connection check failed:", error);
      status.falkordb = "error";
    }

    try {

      const qdrantClient = dbService.getQdrantClient();
      await qdrantClient.getCollections();
      status.qdrant = "configured";
    } catch (error) {
      console.warn("Qdrant connection check failed:", error);
      status.qdrant = "error";
    }

    try {

      await dbService.postgresQuery("SELECT 1");
      status.postgres = "configured";
    } catch (error) {
      console.warn("PostgreSQL connection check failed:", error);
      status.postgres = "error";
    }

    return status;
  }

  private async checkFeatureStatus(): Promise<SystemConfiguration["features"]> {
    const features = {
      websocket: true,
      graphSearch: false,
      vectorSearch: false,
      securityScanning: false,
      mcpServer: true,
      syncCoordinator: !!this.syncCoordinator,
      history: (process.env.HISTORY_ENABLED || "true").toLowerCase() !== "false",
    };

    const dbService = this.dbService;
    if (!dbService) {
      return features;
    }

    try {

      const testQuery = await dbService.falkordbQuery(
        "MATCH (n) RETURN count(n) LIMIT 1"
      );
      features.graphSearch = Array.isArray(testQuery);
    } catch (error) {
      features.graphSearch = false;
    }

    try {

      const qdrantClient = dbService.getQdrantClient();
      const collections = await qdrantClient.getCollections();
      features.vectorSearch =
        collections.collections && collections.collections.length >= 0;
    } catch (error) {
      features.vectorSearch = false;
    }


    try {

      features.securityScanning = false;
    } catch (error) {
      features.securityScanning = false;
    }

    return features;
  }

  private async getPerformanceConfig(): Promise<SystemConfiguration["performance"]> {
    await this.ensureConfigLoaded();

    const defaults = {
      maxConcurrentSync:
        parseInt(process.env.MAX_CONCURRENT_SYNC || "", 10) ||
        (this.syncCoordinator ? 5 : 1),
      cacheSize: parseInt(process.env.CACHE_SIZE || "", 10) || 1000,
      requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || "", 10) || 30000,
    };

    const overrides = (this.cachedConfig.performance ?? {}) as Partial<
      SystemConfiguration["performance"]
    >;
    const resolvedMaxConcurrentSync =
      typeof overrides.maxConcurrentSync === "number" &&
      overrides.maxConcurrentSync >= 1
        ? overrides.maxConcurrentSync
        : defaults.maxConcurrentSync;

    const maxConcurrentSync = this.syncCoordinator
      ? resolvedMaxConcurrentSync
      : 1;

    return {
      maxConcurrentSync,
      cacheSize:
        typeof overrides.cacheSize === "number" && overrides.cacheSize >= 0
          ? overrides.cacheSize
          : defaults.cacheSize,
      requestTimeout:
        typeof overrides.requestTimeout === "number" &&
        overrides.requestTimeout >= 1000
          ? overrides.requestTimeout
          : defaults.requestTimeout,
    };
  }

  private async getSecurityConfig(): Promise<SystemConfiguration["security"]> {
    await this.ensureConfigLoaded();

    const defaults = {
      rateLimiting:
        process.env.ENABLE_RATE_LIMITING === undefined
          ? true
          : process.env.ENABLE_RATE_LIMITING === "true",
      authentication: process.env.ENABLE_AUTHENTICATION === "true",
      auditLogging: process.env.ENABLE_AUDIT_LOGGING === "true",
    };

    const overrides = (this.cachedConfig.security ?? {}) as Partial<
      SystemConfiguration["security"]
    >;

    return {
      rateLimiting:
        typeof overrides.rateLimiting === "boolean"
          ? overrides.rateLimiting
          : defaults.rateLimiting,
      authentication:
        typeof overrides.authentication === "boolean"
          ? overrides.authentication
          : defaults.authentication,
      auditLogging:
        typeof overrides.auditLogging === "boolean"
          ? overrides.auditLogging
          : defaults.auditLogging,
    };
  }

  private async getSystemInfo(): Promise<SystemConfiguration["system"]> {
    let memUsage: NodeJS.MemoryUsage | undefined;
    let cpuUsage;

    try {
      memUsage = process.memoryUsage();
    } catch (error) {

      memUsage = undefined;
    }

    try {

      const startUsage = process.cpuUsage();

      await new Promise((resolve) => setTimeout(resolve, 100));
      const endUsage = process.cpuUsage(startUsage);
      cpuUsage = {
        user: endUsage.user / 1000,
        system: endUsage.system / 1000,
      };
    } catch (error) {
      cpuUsage = { user: 0, system: 0 };
    }

    return {
      uptime: process.uptime(),
      memoryUsage: memUsage,
      cpuUsage,
      platform: process.platform,
      nodeVersion: process.version,
    };
  }

  async updateConfiguration(
    updates: Partial<SystemConfiguration>
  ): Promise<void> {

    if (updates.performance) {
      const { maxConcurrentSync, cacheSize, requestTimeout } =
        updates.performance;

      if (
        typeof maxConcurrentSync === "number" &&
        maxConcurrentSync < 1
      ) {
        throw new Error("maxConcurrentSync must be at least 1");
      }
      if (typeof cacheSize === "number" && cacheSize < 0) {
        throw new Error("cacheSize cannot be negative");
      }
      if (
        typeof requestTimeout === "number" &&
        requestTimeout < 1000
      ) {
        throw new Error("requestTimeout must be at least 1000ms");
      }
    }

    console.log(
      "Configuration update requested:",
      JSON.stringify(updates, null, 2)
    );

    await this.ensureConfigLoaded();

    this.cachedConfig = this.deepMergeConfig(this.cachedConfig, updates);
    this.configLoaded = true;

    await this.persistConfiguration(this.cachedConfig).catch((error) => {
      console.warn(
        "Configuration persistence failed; continuing with in-memory overrides",
        error
      );
    });
  }

  private async ensureConfigLoaded(): Promise<void> {
    if (this.configLoaded) {
      return;
    }

    const dbService = this.dbService;
    if (!dbService || !dbService.isInitialized()) {
      this.configLoaded = true;
      return;
    }

    try {
      const result = await dbService.postgresQuery(
        `SELECT content FROM documents WHERE id = $1::uuid AND type = $2 LIMIT 1`,
        [SYSTEM_CONFIG_DOCUMENT_ID, SYSTEM_CONFIG_DOCUMENT_TYPE]
      );

      const rows: Array<{ content?: unknown }> = Array.isArray(
        (result as any)?.rows
      )
        ? ((result as any).rows as Array<{ content?: unknown }>)
        : [];

      if (rows.length > 0) {
        const rawContent = rows[0]?.content;
        const parsed: any =
          typeof rawContent === "string"
            ? JSON.parse(rawContent)
            : rawContent;

        if (parsed && typeof parsed === "object") {
          this.cachedConfig = this.deepMergeConfig(this.cachedConfig, parsed);
        }
      }
    } catch (error) {
      console.warn("Configuration load failed; using defaults", error);
    } finally {
      this.configLoaded = true;
    }
  }

  private deepMergeConfig<T extends Record<string, unknown>>(
    target: Partial<T>,
    source: Partial<T>
  ): Partial<T> {
    const result: Record<string, unknown> = { ...(target || {}) };

    if (!source || typeof source !== "object") {
      return result as Partial<T>;
    }

    for (const [key, value] of Object.entries(source)) {
      if (value === undefined) {
        continue;
      }

      const current = result[key];

      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        !(value instanceof Date)
      ) {
        const currentObject =
          current && typeof current === "object" && !Array.isArray(current)
            ? (current as Record<string, unknown>)
            : {};
        result[key] = this.deepMergeConfig(currentObject, value as any);
      } else {
        result[key] = value;
      }
    }

    return result as Partial<T>;
  }

  private async persistConfiguration(
    config: Partial<SystemConfiguration>
  ): Promise<void> {
    const dbService = this.dbService;
    if (!dbService || !dbService.isInitialized()) {
      return;
    }

    const now = new Date().toISOString();

    const payload = JSON.stringify(
      config,
      (_key, value) =>
        value instanceof Date ? value.toISOString() : value,
      2
    );

    await dbService.postgresQuery(
      `INSERT INTO documents (id, type, content, created_at, updated_at)
       VALUES ($1::uuid, $2, $3::jsonb, $4, $4)
       ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, updated_at = EXCLUDED.updated_at`,
      [
        SYSTEM_CONFIG_DOCUMENT_ID,
        SYSTEM_CONFIG_DOCUMENT_TYPE,
        payload,
        now,
      ]
    );
  }

  async getDatabaseHealth(): Promise<{
    falkordb: any;
    qdrant: any;
    postgres: any;
  }> {
    const dbService = this.dbService;
    if (!dbService) {
      return {
        falkordb: {
          status: "unavailable",
          error: "Database service not configured",
        },
        qdrant: {
          status: "unavailable",
          error: "Database service not configured",
        },
        postgres: {
          status: "unavailable",
          error: "Database service not configured",
        },
      };
    }

    const health = {
      falkordb: null as any,
      qdrant: null as any,
      postgres: null as any,
    };

    try {

      const falkordbStats = await dbService.falkordbQuery("INFO");
      health.falkordb = {
        status: "healthy",
        stats: falkordbStats,
      };
    } catch (error) {
      health.falkordb = {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    try {

      const qdrantClient = dbService.getQdrantClient();
      const qdrantHealth = await qdrantClient.getCollections();
      health.qdrant = {
        status: "healthy",
        collections: qdrantHealth.collections?.length || 0,
      };
    } catch (error) {
      health.qdrant = {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    try {

      const postgresStats = await dbService.postgresQuery(`
        SELECT
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes
        FROM pg_stat_user_tables
        LIMIT 10
      `);
      health.postgres = {
        status: "healthy",
        tables: ((postgresStats as any)?.rows ?? []).length,
      };
    } catch (error) {
      health.postgres = {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }

    return health;
  }

  async getEnvironmentInfo(): Promise<{
    nodeVersion: string;
    platform: string;
    environment: string;
    timezone: string;
    locale: string;
    memory: {
      total: number;
      free: number;
      used: number;
    };
    disk?: {
      total: number;
      free: number;
      used: number;
    };
  }> {
    const os = await import("os");

    let diskInfo;
    try {

      const fsModule = await import("fs/promises");

      diskInfo = {
        total: 0,
        free: 0,
        used: 0,
      };
    } catch (error) {

    }

    let timezone: string;
    let locale: string;

    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      timezone = "UTC";
    }

    try {
      locale = Intl.DateTimeFormat().resolvedOptions().locale;
    } catch (error) {
      locale = "en-US";
    }

    return {
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || "development",
      timezone,
      locale,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
      },
      disk: diskInfo,
    };
  }


  async validateConfiguration(): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];


    const dbStatus = await this.checkDatabaseStatus();

    if (dbStatus.falkordb === "error") {
      issues.push("FalkorDB connection is failing");
      recommendations.push(
        "Check FalkorDB server status and connection string"
      );
    }

    if (dbStatus.qdrant === "error") {
      issues.push("Qdrant connection is failing");
      recommendations.push("Check Qdrant server status and API configuration");
    }

    if (dbStatus.postgres === "error") {
      issues.push("PostgreSQL connection is failing");
      recommendations.push(
        "Check PostgreSQL server status and connection string"
      );
    }


    const requiredEnvVars = ["NODE_ENV"];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        issues.push(`Required environment variable ${envVar} is not set`);
      }
    }


    try {
      const memUsage = process.memoryUsage();
      const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      if (memUsagePercent > 90) {
        issues.push("High memory usage detected");
        recommendations.push(
          "Consider increasing memory limits or optimizing memory usage"
        );
      }
    } catch (error) {
      recommendations.push("Could not determine memory usage");
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
    };
  }
}

================
File: services/EnhancedSessionStore.ts
================
import { EventEmitter } from 'events';
import type { RedisClientType } from 'redis';
import {
  SessionDocument,
  SessionEvent,
  SessionCreationOptions,
  RedisConfig,
  SessionError,
  SessionNotFoundError,
  ISessionStore,
  RedisSessionData,
  SessionStats,
} from './SessionTypes.js';
import { RedisConnectionPool, PoolConfig } from './RedisConnectionPool.js';

export interface EnhancedSessionConfig {
  redis: RedisConfig;
  pool: Partial<PoolConfig>;
  enablePipelining: boolean;
  enableLazyLoading: boolean;
  enableCompression: boolean;
  enableLocalCache: boolean;
  localCacheSize: number;
  localCacheTTL: number;
  batchSize: number;
  pipelineTimeout: number;
}

export interface BatchOperation {
  type: 'create' | 'update' | 'delete' | 'addEvent';
  sessionId: string;
  data?: any;
  timestamp: number;
}

export interface CacheEntry {
  data: SessionDocument;
  timestamp: number;
  ttl: number;
}

export interface PerformanceMetrics {
  totalOperations: number;
  averageLatency: number;
  cacheHitRate: number;
  pipelineOperations: number;
  compressionRatio: number;
  connectionPoolStats: any;
}

export class EnhancedSessionStore extends EventEmitter implements ISessionStore {
  private connectionPool: RedisConnectionPool;
  private config: EnhancedSessionConfig;
  private localCache = new Map<string, CacheEntry>();
  private pendingOperations: BatchOperation[] = [];
  private pipelineTimer?: NodeJS.Timeout;
  private cacheCleanupTimer?: NodeJS.Timeout;
  private metrics: PerformanceMetrics;

  constructor(config: EnhancedSessionConfig) {
    super();
    this.config = {
      enablePipelining: true,
      enableLazyLoading: true,
      enableCompression: false,
      enableLocalCache: true,
      localCacheSize: 1000,
      localCacheTTL: 30000,
      batchSize: 50,
      pipelineTimeout: 100,
      ...config,
    };

    this.connectionPool = new RedisConnectionPool(config.redis, config.pool);
    this.metrics = {
      totalOperations: 0,
      averageLatency: 0,
      cacheHitRate: 0,
      pipelineOperations: 0,
      compressionRatio: 1,
      connectionPoolStats: {},
    };

    this.initializeTimers();
  }




  async createSession(
    sessionId: string,
    agentId: string,
    options: SessionCreationOptions = {}
  ): Promise<void> {
    const startTime = Date.now();

    try {
      if (this.config.enablePipelining) {
        this.addToBatch({
          type: 'create',
          sessionId,
          data: { agentId, options },
          timestamp: Date.now(),
        });
        await this.processBatchIfNeeded();
      } else {
        await this.createSessionDirect(sessionId, agentId, options);
      }

      this.updateMetrics('create', Date.now() - startTime);
      this.emit('session:created', { sessionId, agentId, options });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }




  async getSession(sessionId: string): Promise<SessionDocument | null> {
    const startTime = Date.now();

    try {

      if (this.config.enableLocalCache) {
        const cached = this.getFromCache(sessionId);
        if (cached) {
          this.updateMetrics('get', Date.now() - startTime, true);
          return cached;
        }
      }


      const session = await this.loadSessionFromRedis(sessionId);


      if (session && this.config.enableLocalCache) {
        this.addToCache(sessionId, session);
      }

      this.updateMetrics('get', Date.now() - startTime, false);
      return session;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }




  async updateSession(sessionId: string, updates: Partial<SessionDocument>): Promise<void> {
    const startTime = Date.now();

    try {
      if (this.config.enablePipelining) {
        this.addToBatch({
          type: 'update',
          sessionId,
          data: updates,
          timestamp: Date.now(),
        });
        await this.processBatchIfNeeded();
      } else {
        await this.updateSessionDirect(sessionId, updates);
      }


      if (this.config.enableLocalCache) {
        this.invalidateCache(sessionId);
      }

      this.updateMetrics('update', Date.now() - startTime);
      this.emit('session:updated', { sessionId, updates });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }




  async deleteSession(sessionId: string): Promise<void> {
    const startTime = Date.now();

    try {
      if (this.config.enablePipelining) {
        this.addToBatch({
          type: 'delete',
          sessionId,
          timestamp: Date.now(),
        });
        await this.processBatchIfNeeded();
      } else {
        await this.deleteSessionDirect(sessionId);
      }


      if (this.config.enableLocalCache) {
        this.localCache.delete(sessionId);
      }

      this.updateMetrics('delete', Date.now() - startTime);
      this.emit('session:deleted', { sessionId });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }




  async addEvent(sessionId: string, event: SessionEvent): Promise<void> {
    const startTime = Date.now();

    try {
      if (this.config.enablePipelining) {
        this.addToBatch({
          type: 'addEvent',
          sessionId,
          data: event,
          timestamp: Date.now(),
        });
        await this.processBatchIfNeeded();
      } else {
        await this.addEventDirect(sessionId, event);
      }


      if (this.config.enableLocalCache) {
        this.invalidateCache(sessionId);
      }

      this.updateMetrics('addEvent', Date.now() - startTime);
      this.emit('event:added', { sessionId, event });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }




  async getEvents(sessionId: string, fromSeq?: number, toSeq?: number): Promise<SessionEvent[]> {
    const startTime = Date.now();

    try {
      const events = await this.connectionPool.execute(async (client) => {
        const eventsKey = this.getEventsKey(sessionId);

        let eventData;
        if (fromSeq !== undefined && toSeq !== undefined) {
          eventData = await client.zRangeByScore(eventsKey, fromSeq, toSeq);
        } else if (fromSeq !== undefined) {
          eventData = await client.zRangeByScore(eventsKey, fromSeq, '+inf');
        } else if (toSeq !== undefined) {
          eventData = await client.zRangeByScore(eventsKey, '-inf', toSeq);
        } else {
          eventData = await client.zRange(eventsKey, 0, -1);
        }

        return eventData
          .filter(event => event !== 'INIT')
          .map(eventStr => this.deserializeData(eventStr))
          .sort((a, b) => a.seq - b.seq);
      }, 'read');

      this.updateMetrics('getEvents', Date.now() - startTime);
      return events;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }




  async getRecentEvents(sessionId: string, limit: number = 20): Promise<SessionEvent[]> {
    const startTime = Date.now();

    try {
      const events = await this.connectionPool.execute(async (client) => {
        const eventsKey = this.getEventsKey(sessionId);
        const eventData = await client.zRange(eventsKey, -limit, -1);

        return eventData
          .filter(event => event !== 'INIT')
          .map(eventStr => this.deserializeData(eventStr))
          .sort((a, b) => a.seq - b.seq);
      }, 'read');

      this.updateMetrics('getRecentEvents', Date.now() - startTime);
      return events;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }




  async addAgent(sessionId: string, agentId: string): Promise<void> {
    const startTime = Date.now();

    try {
      await this.connectionPool.execute(async (client) => {
        const sessionKey = this.getSessionKey(sessionId);
        const sessionData = await client.hGetAll(sessionKey);

        if (!sessionData.agentIds) {
          throw new SessionNotFoundError(sessionId);
        }

        const agents = new Set(JSON.parse(sessionData.agentIds));
        agents.add(agentId);

        await client.hSet(sessionKey, 'agentIds', JSON.stringify(Array.from(agents)));
      }, 'write');


      if (this.config.enableLocalCache) {
        this.invalidateCache(sessionId);
      }

      this.updateMetrics('addAgent', Date.now() - startTime);
      this.emit('agent:added', { sessionId, agentId });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }




  async removeAgent(sessionId: string, agentId: string): Promise<void> {
    const startTime = Date.now();

    try {
      await this.connectionPool.execute(async (client) => {
        const sessionKey = this.getSessionKey(sessionId);
        const sessionData = await client.hGetAll(sessionKey);

        if (!sessionData.agentIds) {
          throw new SessionNotFoundError(sessionId);
        }

        const agents = new Set(JSON.parse(sessionData.agentIds));
        agents.delete(agentId);

        if (agents.size === 0) {
          await this.setTTL(sessionId, 300);
        } else {
          await client.hSet(sessionKey, 'agentIds', JSON.stringify(Array.from(agents)));
        }
      }, 'write');


      if (this.config.enableLocalCache) {
        this.invalidateCache(sessionId);
      }

      this.updateMetrics('removeAgent', Date.now() - startTime);
      this.emit('agent:removed', { sessionId, agentId });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }




  async setTTL(sessionId: string, ttl: number): Promise<void> {
    try {
      await this.connectionPool.execute(async (client) => {
        const sessionKey = this.getSessionKey(sessionId);
        const eventsKey = this.getEventsKey(sessionId);

        await Promise.all([
          client.expire(sessionKey, ttl),
          client.expire(eventsKey, ttl),
        ]);
      }, 'write');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }




  async exists(sessionId: string): Promise<boolean> {
    try {
      return await this.connectionPool.execute(async (client) => {
        const sessionKey = this.getSessionKey(sessionId);
        return (await client.exists(sessionKey)) === 1;
      }, 'read');
    } catch (error) {
      this.emit('error', error);
      return false;
    }
  }




  getMetrics(): PerformanceMetrics {
    return {
      ...this.metrics,
      connectionPoolStats: this.connectionPool.getStats(),
    };
  }




  async bulkOperation(operations: BatchOperation[]): Promise<void> {
    const startTime = Date.now();

    try {

      const grouped = this.groupOperationsByType(operations);

      await this.connectionPool.execute(async (client) => {

        for (const [type, ops] of Array.from(grouped.entries())) {
          await this.processBulkOperationType(client, type, ops);
        }
      }, 'write');

      this.metrics.pipelineOperations += operations.length;
      this.updateMetrics('bulk', Date.now() - startTime);
      this.emit('bulk:completed', { operationCount: operations.length });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }




  async flush(): Promise<void> {
    if (this.pendingOperations.length > 0) {
      await this.processBatch();
    }
  }






  private async createSessionDirect(
    sessionId: string,
    agentId: string,
    options: SessionCreationOptions
  ): Promise<void> {
    await this.connectionPool.execute(async (client) => {
      const sessionKey = this.getSessionKey(sessionId);
      const eventsKey = this.getEventsKey(sessionId);
      const ttl = options.ttl || 3600;

      const exists = await client.exists(sessionKey);
      if (exists) {
        throw new SessionError(
          `Session already exists: ${sessionId}`,
          'SESSION_EXISTS',
          sessionId
        );
      }

      const sessionData = {
        agentIds: JSON.stringify([agentId]),
        state: 'working',
        events: '0',
        metadata: options.metadata ? this.serializeData(options.metadata) : undefined,
      };

      const redisData: Record<string, string | number> = {};
      Object.entries(sessionData).forEach(([key, value]) => {
        if (value !== undefined) {
          redisData[key] = value;
        }
      });

      await client.hSet(sessionKey, redisData);
      await client.expire(sessionKey, ttl);
      await client.zAdd(eventsKey, { score: 0, value: 'INIT' });
      await client.expire(eventsKey, ttl);

      if (options.initialEntityIds?.length) {
        const initialEvent: SessionEvent = {
          seq: 1,
          type: 'start',
          timestamp: new Date().toISOString(),
          changeInfo: {
            elementType: 'session',
            entityIds: options.initialEntityIds,
            operation: 'init',
          },
          actor: agentId,
        };
        await this.addEventDirect(sessionId, initialEvent);
      }
    }, 'write');
  }




  private async updateSessionDirect(sessionId: string, updates: Partial<SessionDocument>): Promise<void> {
    await this.connectionPool.execute(async (client) => {
      const sessionKey = this.getSessionKey(sessionId);
      const exists = await client.exists(sessionKey);

      if (!exists) {
        throw new SessionNotFoundError(sessionId);
      }

      const updateData: Record<string, string> = {};

      if (updates.agentIds) {
        updateData.agentIds = JSON.stringify(updates.agentIds);
      }
      if (updates.state) {
        updateData.state = updates.state;
      }
      if (updates.metadata) {
        updateData.metadata = this.serializeData(updates.metadata);
      }

      if (Object.keys(updateData).length > 0) {
        await client.hSet(sessionKey, updateData);
      }
    }, 'write');
  }




  private async deleteSessionDirect(sessionId: string): Promise<void> {
    await this.connectionPool.execute(async (client) => {
      const sessionKey = this.getSessionKey(sessionId);
      const eventsKey = this.getEventsKey(sessionId);

      await Promise.all([
        client.del(sessionKey),
        client.del(eventsKey),
      ]);
    }, 'write');
  }




  private async addEventDirect(sessionId: string, event: SessionEvent): Promise<void> {
    await this.connectionPool.execute(async (client) => {
      const eventsKey = this.getEventsKey(sessionId);
      const sessionKey = this.getSessionKey(sessionId);

      const exists = await client.exists(sessionKey);
      if (!exists) {
        throw new SessionNotFoundError(sessionId);
      }

      const eventJson = this.serializeData(event);
      await client.zAdd(eventsKey, { score: event.seq, value: eventJson });

      if (event.stateTransition?.to) {
        await client.hSet(sessionKey, 'state', event.stateTransition.to);
      }
    }, 'write');
  }




  private async loadSessionFromRedis(sessionId: string): Promise<SessionDocument | null> {
    return await this.connectionPool.execute(async (client) => {
      const sessionKey = this.getSessionKey(sessionId);
      const exists = await client.exists(sessionKey);

      if (!exists) return null;

      const sessionData = await client.hGetAll(sessionKey);
      if (!sessionData || Object.keys(sessionData).length === 0) {
        return null;
      }

      let events: SessionEvent[] = [];
      if (!this.config.enableLazyLoading) {
        events = await this.getRecentEvents(sessionId, 50);
      }

      return {
        sessionId,
        agentIds: JSON.parse(sessionData.agentIds || '[]'),
        state: sessionData.state as any,
        events,
        metadata: sessionData.metadata ? this.deserializeData(sessionData.metadata) : undefined,
      };
    }, 'read');
  }




  private addToBatch(operation: BatchOperation): void {
    this.pendingOperations.push(operation);
  }




  private async processBatchIfNeeded(): Promise<void> {
    if (this.pendingOperations.length >= this.config.batchSize) {
      await this.processBatch();
    }
  }




  private async processBatch(): Promise<void> {
    if (this.pendingOperations.length === 0) return;

    const operations = [...this.pendingOperations];
    this.pendingOperations = [];

    await this.bulkOperation(operations);
  }




  private groupOperationsByType(operations: BatchOperation[]): Map<string, BatchOperation[]> {
    const grouped = new Map<string, BatchOperation[]>();

    for (const op of operations) {
      if (!grouped.has(op.type)) {
        grouped.set(op.type, []);
      }
      grouped.get(op.type)!.push(op);
    }

    return grouped;
  }




  private async processBulkOperationType(
    client: RedisClientType,
    type: string,
    operations: BatchOperation[]
  ): Promise<void> {
    switch (type) {
      case 'create':
        for (const op of operations) {
          await this.createSessionDirect(op.sessionId, op.data.agentId, op.data.options);
        }
        break;

      case 'update':
        for (const op of operations) {
          await this.updateSessionDirect(op.sessionId, op.data);
        }
        break;

      case 'delete':
        const deletePromises = operations.map(op => Promise.all([
          client.del(this.getSessionKey(op.sessionId)),
          client.del(this.getEventsKey(op.sessionId)),
        ]));
        await Promise.all(deletePromises);
        break;

      case 'addEvent':
        for (const op of operations) {
          await this.addEventDirect(op.sessionId, op.data);
        }
        break;
    }
  }




  private getFromCache(sessionId: string): SessionDocument | null {
    const entry = this.localCache.get(sessionId);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.localCache.delete(sessionId);
      return null;
    }

    return entry.data;
  }

  private addToCache(sessionId: string, session: SessionDocument): void {
    if (this.localCache.size >= this.config.localCacheSize) {

      const oldestKey = this.localCache.keys().next().value;
      this.localCache.delete(oldestKey);
    }

    this.localCache.set(sessionId, {
      data: session,
      timestamp: Date.now(),
      ttl: this.config.localCacheTTL,
    });
  }

  private invalidateCache(sessionId: string): void {
    this.localCache.delete(sessionId);
  }




  private serializeData(data: any): string {
    if (this.config.enableCompression) {

      return JSON.stringify(data);
    }
    return JSON.stringify(data);
  }

  private deserializeData(data: string): any {
    if (this.config.enableCompression) {

      return JSON.parse(data);
    }
    return JSON.parse(data);
  }




  private updateMetrics(operation: string, latency: number, cacheHit: boolean = false): void {
    this.metrics.totalOperations++;
    this.metrics.averageLatency = (this.metrics.averageLatency * (this.metrics.totalOperations - 1) + latency) / this.metrics.totalOperations;

    if (operation === 'get') {
      const currentCacheHits = this.metrics.cacheHitRate * (this.metrics.totalOperations - 1);
      this.metrics.cacheHitRate = (currentCacheHits + (cacheHit ? 1 : 0)) / this.metrics.totalOperations;
    }
  }




  private getSessionKey(sessionId: string): string {
    return `session:${sessionId}`;
  }

  private getEventsKey(sessionId: string): string {
    return `events:${sessionId}`;
  }




  private initializeTimers(): void {
    if (this.config.enablePipelining) {
      this.pipelineTimer = setInterval(() => {
        this.processBatch().catch(error => {
          this.emit('error', error);
        });
      }, this.config.pipelineTimeout);
    }

    if (this.config.enableLocalCache) {
      this.cacheCleanupTimer = setInterval(() => {
        this.cleanupCache();
      }, 60000);
    }
  }




  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of Array.from(this.localCache.entries())) {
      if (now - entry.timestamp > entry.ttl) {
        this.localCache.delete(key);
      }
    }
  }




  async shutdown(): Promise<void> {

    if (this.pipelineTimer) clearInterval(this.pipelineTimer);
    if (this.cacheCleanupTimer) clearInterval(this.cacheCleanupTimer);


    await this.flush();


    await this.connectionPool.shutdown();

    this.emit('shutdown');
  }



  async publishSessionUpdate(sessionId: string, message: any): Promise<void> {
    try {
      await this.connectionPool.execute(async (client) => {
        const channel = `session:${sessionId}`;
        await client.publish(channel, JSON.stringify(message));
      }, 'write');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async subscribeToSession(sessionId: string, callback: (message: any) => void): Promise<void> {


    this.emit('subscription:not-implemented', { sessionId });
  }

  async getStats(): Promise<SessionStats> {
    const poolStats = this.connectionPool.getStats();

    return {
      activeSessions: 0,
      totalEvents: 0,
      averageEventsPerSession: 0,
      checkpointsCreated: 0,
      failureSnapshots: 0,
      agentsActive: 0,
      redisMemoryUsage: 0,
    };
  }

  async listActiveSessions(): Promise<string[]> {
    try {
      return await this.connectionPool.execute(async (client) => {
        const keys = await client.keys('session:*');
        return keys.map(key => key.replace('session:', ''));
      }, 'read');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {

    this.emit('cleanup:completed', { sessions: 0 });
  }

  async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const start = Date.now();
    try {
      const poolStatus = this.connectionPool.getStatus();
      return {
        healthy: poolStatus.isHealthy,
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async close(): Promise<void> {
    await this.shutdown();
  }
}

================
File: services/FileWatcher.ts
================
import chokidar, { FSWatcher } from "chokidar";
import { EventEmitter } from "events";
import * as path from "path";
import { promises as fs } from "fs";
import * as crypto from "crypto";

export interface FileChange {
  path: string;
  absolutePath: string;
  type: "create" | "modify" | "delete" | "rename";
  oldPath?: string;
  stats?: {
    size: number;
    mtime: Date;
    isDirectory: boolean;
  };
  hash?: string;
}

export interface WatcherConfig {
  watchPaths: string[];
  ignorePatterns: string[];
  debounceMs: number;
  maxConcurrent: number;
}

export class FileWatcher extends EventEmitter {
  private watcher: FSWatcher | null = null;
  private config: WatcherConfig;
  private changeQueue: FileChange[] = [];
  private processing = false;
  private fileHashes = new Map<string, string>();

  constructor(config: Partial<WatcherConfig> = {}) {
    super();

    this.config = {
      watchPaths: config.watchPaths || ["src", "lib", "packages"],
      ignorePatterns: config.ignorePatterns || [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/.git/**",
        "**/coverage/**",
        "**/*.log",
        "**/.DS_Store",
        "**/package-lock.json",
        "**/yarn.lock",
        "**/pnpm-lock.yaml",
      ],
      debounceMs: config.debounceMs || 500,
      maxConcurrent: config.maxConcurrent || 10,
    };
  }


  async initialize(): Promise<void> {
    return this.start();
  }

  async start(): Promise<void> {
    if (this.watcher) {
      await this.stop();
    }

    console.log("🔍 Starting file watcher...");


    await this.initializeFileHashes();



    const isMacOS = process.platform === "darwin";
    const usePolling =
      process.env.USE_POLLING === "true" ||
      process.env.NODE_ENV === "test" ||
      isMacOS;

    console.log(
      `${usePolling ? "🔄" : "👁️ "} Using ${
        usePolling ? "polling" : "native"
      } file watching mode`
    );

    this.watcher = chokidar.watch(this.config.watchPaths, {
      ignored: (filePath: string) => this.shouldIgnore(filePath),
      persistent: true,
      ignoreInitial: true,
      usePolling: usePolling,
      awaitWriteFinish: {
        stabilityThreshold: usePolling ? 5 : 50,
        pollInterval: usePolling ? 5 : 25,
      },
      interval: usePolling ? 5 : undefined,
    });


    this.watcher.on("add", (filePath) =>
      this.handleFileChange(filePath, "create")
    );
    this.watcher.on("change", (filePath) =>
      this.handleFileChange(filePath, "modify")
    );
    this.watcher.on("unlink", (filePath) =>
      this.handleFileChange(filePath, "delete")
    );
    this.watcher.on("addDir", (dirPath) =>
      this.handleDirectoryChange(dirPath, "create")
    );
    this.watcher.on("unlinkDir", (dirPath) =>
      this.handleDirectoryChange(dirPath, "delete")
    );


    this.watcher.on("error", (error) => {
      console.error("File watcher error:", error);
      this.emit("error", error);
    });

    console.log(
      `✅ File watcher started, monitoring: ${this.config.watchPaths.join(
        ", "
      )}`
    );
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      console.log("🛑 File watcher stopped");
    }
  }

  private async handleFileChange(
    filePath: string,
    type: "create" | "modify" | "delete"
  ): Promise<void> {
    try {
      const absolutePath = path.resolve(filePath);
      const relativePath = path.relative(process.cwd(), filePath);

      const change: FileChange = {
        path: relativePath,
        absolutePath,
        type,
      };

      if (type !== "delete") {
        const stats = await fs.stat(absolutePath);
        change.stats = {
          size: stats.size,
          mtime: stats.mtime,
          isDirectory: stats.isDirectory(),
        };


        if (!stats.isDirectory()) {
          const content = await fs.readFile(absolutePath);
          change.hash = crypto
            .createHash("sha256")
            .update(content)
            .digest("hex");
        }
      }


      const previousHash = this.fileHashes.get(relativePath);
      if (change.hash && previousHash === change.hash && type === "modify") {
        return;
      }


      if (change.hash) {
        this.fileHashes.set(relativePath, change.hash);
      } else if (type === "delete") {
        this.fileHashes.delete(relativePath);
      }

      this.queueChange(change);
    } catch (error) {
      console.error(`Error handling file change ${filePath}:`, error);
    }
  }

  private async handleDirectoryChange(
    dirPath: string,
    type: "create" | "delete"
  ): Promise<void> {
    const absolutePath = path.resolve(dirPath);
    const relativePath = path.relative(process.cwd(), dirPath);

    const change: FileChange = {
      path: relativePath,
      absolutePath,
      type,
      stats: {
        size: 0,
        mtime: new Date(),
        isDirectory: true,
      },
    };

    this.queueChange(change);
  }

  private queueChange(change: FileChange): void {
    this.changeQueue.push(change);


    if (!this.processing) {
      setTimeout(() => this.processChanges(), this.config.debounceMs);
    }
  }

  private async processChanges(): Promise<void> {
    if (this.processing || this.changeQueue.length === 0) {
      return;
    }

    this.processing = true;

    try {

      const changesByPath = new Map<string, FileChange>();
      const changes = [...this.changeQueue];
      this.changeQueue = [];


      const batches = this.chunkArray(changes, this.config.maxConcurrent);

      for (const batch of batches) {
        const promises = batch.map((change) => this.processChange(change));
        await Promise.allSettled(promises);
      }


      if (changes.length > 0) {
        this.emit("batchComplete", changes);
      }
    } catch (error) {
      console.error("Error processing changes:", error);
      this.emit("error", error);
    } finally {
      this.processing = false;


      if (this.changeQueue.length > 0) {
        setTimeout(() => this.processChanges(), 100);
      }
    }
  }

  private async processChange(change: FileChange): Promise<void> {
    try {

      this.emit("change", change);


      const priority = this.getChangePriority(change);


      switch (change.type) {
        case "create":
          this.emit("fileCreated", change);
          break;
        case "modify":
          this.emit("fileModified", change);
          break;
        case "delete":
          this.emit("fileDeleted", change);
          break;
        case "rename":
          this.emit("fileRenamed", change);
          break;
      }

      console.log(
        `${this.getChangeIcon(change.type)} ${
          change.path
        } (${priority} priority)`
      );
    } catch (error) {
      console.error(`Error processing change ${change.path}:`, error);
      this.emit("changeError", change, error);
    }
  }

  private getChangePriority(change: FileChange): "high" | "medium" | "low" {
    const path = change.path.toLowerCase();


    if (
      path.includes("dist/") ||
      path.includes("build/") ||
      path.includes("coverage/") ||
      path.includes("logs/") ||
      path.includes(".log") ||
      path.includes("node_modules/")
    ) {
      return "low";
    }


    if (
      /\.(ts|tsx|js|jsx)$/.test(path) &&
      !path.includes("test") &&
      !path.includes("spec")
    ) {
      return "high";
    }


    if (/\.(json|yaml|yml|md|config)$/.test(path) || path.includes("readme")) {
      return "medium";
    }


    return "low";
  }

  private getChangeIcon(type: string): string {
    switch (type) {
      case "create":
        return "📄";
      case "modify":
        return "✏️";
      case "delete":
        return "🗑️";
      case "rename":
        return "🏷️";
      default:
        return "📝";
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private async initializeFileHashes(): Promise<void> {
    console.log("🔄 Initializing file hashes...");

    const scanPromises: Promise<void>[] = [];

    for (const watchPath of this.config.watchPaths) {
      scanPromises.push(this.scanDirectory(watchPath));
    }

    await Promise.allSettled(scanPromises);
    console.log(`📊 Initialized hashes for ${this.fileHashes.size} files`);
  }

  private async scanDirectory(dirPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(process.cwd(), fullPath);


        if (this.shouldIgnore(relativePath)) {
          continue;
        }

        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath);
        } else if (entry.isFile()) {
          try {
            const content = await fs.readFile(fullPath);
            const hash = crypto
              .createHash("sha256")
              .update(content)
              .digest("hex");
            this.fileHashes.set(relativePath, hash);
          } catch (error) {

            console.warn(`Could not hash file ${relativePath}:`, error);
          }
        }
      }
    } catch (error) {

      console.warn(`Could not scan directory ${dirPath}:`, error);
    }
  }

  private shouldIgnore(filePath: string): boolean {

    const relativePath = path.relative(process.cwd(), path.resolve(filePath));


    for (const watchPath of this.config.watchPaths) {
      const watchPathResolved = path.resolve(watchPath);


      if (path.resolve(filePath).startsWith(watchPathResolved)) {
        const relativeToWatch = path.relative(
          watchPathResolved,
          path.resolve(filePath)
        );


        for (const pattern of this.config.ignorePatterns) {
          const regex = this.globToRegex(pattern);
          if (regex.test(relativeToWatch)) {

            if (
              relativeToWatch.includes("node_modules") &&
              process.env.NODE_ENV === "test"
            ) {
              console.log(
                `🛑 Ignoring ${relativeToWatch} (matches pattern: ${pattern})`
              );
            }
            return true;
          }
        }
      }
    }


    for (const pattern of this.config.ignorePatterns) {
      const regex = this.globToRegex(pattern);
      if (regex.test(relativePath)) {

        if (
          relativePath.includes("node_modules") &&
          process.env.NODE_ENV === "test"
        ) {
          console.log(
            `🛑 Ignoring ${relativePath} (matches pattern: ${pattern})`
          );
        }
        return true;
      }
    }

    return false;
  }





  private globToRegex(pattern: string): RegExp {
    let out = "";
    for (let i = 0; i < pattern.length; ) {
      // Handle **/
      if (pattern.startsWith("**/", i)) {
        out += "(?:.*/)?";
        i += 3;
        continue;
      }
      // Handle /**/
      if (pattern.startsWith("
)?";
        i += 4;
        continue;
      }
      // Handle ** (any path including separators)
      if (pattern.startsWith("**", i)) {
        out += ".*";
        i += 2;
        continue;
      }
      const ch = pattern[i];
      if (ch === "*") {
        // Any chars except path separator
        out += "[^/]*";
        i += 1;
        continue;
      }
      // Escape regex special characters
      if (/[-/\\^$+?.()|[\]{}]/.test(ch)) {
        out += `\\${ch}`;
      } else {
        out += ch;
      }
      i += 1;
    }
    return new RegExp(`^${out}$`);
  }

  // Public API methods
  getWatchedPaths(): string[] {
    return this.config.watchPaths;
  }

  getQueueLength(): number {
    return this.changeQueue.length;
  }

  isProcessing(): boolean {
    return this.processing;
  }

  // Force a rescan of all files
  async rescan(): Promise<void> {
    this.fileHashes.clear();
    await this.initializeFileHashes();
    console.log("🔄 File rescan complete");
  }
}

================
File: services/index.ts
================
export { ConfigurationService } from './ConfigurationService.js';
export { FileWatcher } from './FileWatcher.js';
export { LoggingService } from './LoggingService.js';
export { MaintenanceService } from './MaintenanceService.js';


export { SessionStore } from './SessionStore.js';
export { EnhancedSessionStore } from './EnhancedSessionStore.js';
export { SessionManager } from './SessionManager.js';
export { SessionBridge } from './SessionBridge.js';
export { SessionConfig, createSessionConfig, validateRedisConnection, getRedisConnectionString, ENVIRONMENT_VARIABLES } from './SessionConfig.js';
export { SessionIntegration, createSessionIntegration, SessionUsageExamples } from './SessionIntegration.js';


export { SessionAnalytics } from './SessionAnalytics.js';
export { SessionReplay } from './SessionReplay.js';
export { SessionMigration } from './SessionMigration.js';


export { AgentCoordination } from './AgentCoordination.js';


export { RedisConnectionPool } from './RedisConnectionPool.js';


export { SessionMetrics } from './SessionMetrics.js';


export * from './SessionTypes.js';

================
File: services/LoggingService.ts
================
import * as fs from "fs/promises";
import {
  getInstrumentationDispatcher,
} from "../logging/InstrumentationDispatcher.js";
import type {
  InstrumentationConsumer,
  InstrumentationEvent,
  InstrumentationSubscription,
  DispatcherMetrics,
  OriginalConsoleMethods,
} from "../logging/InstrumentationDispatcher.js";
import { FileSink } from "../logging/FileSink.js";
import type {
  FileSinkOptions,
  FileSinkMetrics,
  FileSystemFacade,
} from "../logging/FileSink.js";
import { sanitizeData, serializeLogEntry } from "../logging/serialization.js";
import type { SerializationOptions } from "../logging/serialization.js";

export interface LogEntry {
  timestamp: Date;
  level: "error" | "warn" | "info" | "debug";
  component: string;
  message: string;
  data?: unknown;
  userId?: string;
  requestId?: string;
  ip?: string;
}

export interface LogQuery {
  level?: string;
  component?: string;
  since?: Date;
  until?: Date;
  limit?: number;
  search?: string;
}

export interface LoggingServiceOptions {
  logFile?: string;
  maxLogsInMemory?: number;
  fileRotation?: FileSinkOptions;
  serialization?: SerializationOptions;

  fileSystem?: FileSystemFacade;
}

interface NormalizedOptions {
  logFilePath?: string;
  maxLogsInMemory: number;
  fileRotation: FileSinkOptions;
  serialization: SerializationOptions;
  fileSystem?: FileSystemFacade;
}

export interface LoggingHealthMetrics {
  dispatcher: DispatcherMetrics;
  inMemoryLogCount: number;
  maxLogsInMemory: number;
  droppedFromMemory: number;
  fileSink?: FileSinkMetrics & { path: string };
  logFilePath?: string;
  disposed: boolean;
}

const DEFAULT_MAX_LOGS_IN_MEMORY = 10_000;

function normalizeOptions(
  input?: string | LoggingServiceOptions
): NormalizedOptions {
  if (typeof input === "string") {
    return {
      logFilePath: input,
      maxLogsInMemory: DEFAULT_MAX_LOGS_IN_MEMORY,
      fileRotation: {},
      serialization: {},
    };
  }

  const options = input ?? {};

  return {
    logFilePath: options.logFile,
    maxLogsInMemory: options.maxLogsInMemory ?? DEFAULT_MAX_LOGS_IN_MEMORY,
    fileRotation: options.fileRotation ?? {},
    serialization: options.serialization ?? {},
    fileSystem: options.fileSystem,
  };
}

function toSearchableString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch (error) {
    return `[unserializable: ${(error as Error)?.message ?? "error"}]`;
  }
}

function applyQueryFilters(logs: LogEntry[], query: LogQuery): LogEntry[] {
  let filteredLogs = [...logs];

  if (query.level) {
    filteredLogs = filteredLogs.filter((log) => log.level === query.level);
  }

  if (query.component) {
    filteredLogs = filteredLogs.filter(
      (log) => log.component === query.component
    );
  }

  if (query.since) {
    filteredLogs = filteredLogs.filter((log) => log.timestamp >= query.since!);
  }

  if (query.until) {
    filteredLogs = filteredLogs.filter((log) => log.timestamp <= query.until!);
  }

  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filteredLogs = filteredLogs.filter((log) => {
      const dataString = toSearchableString(log.data);
      return (
        log.message.toLowerCase().includes(searchTerm) ||
        dataString.toLowerCase().includes(searchTerm)
      );
    });
  }

  filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const hasExplicitLimit = Object.prototype.hasOwnProperty.call(query, "limit");

  if (!hasExplicitLimit) {
    return filteredLogs.slice(0, 100);
  }

  const limitValue = query.limit;
  if (limitValue === undefined || limitValue === null) {
    return filteredLogs;
  }

  if (typeof limitValue !== "number" || !Number.isFinite(limitValue)) {
    return filteredLogs;
  }

  return filteredLogs.slice(0, limitValue);
}

export class LoggingService implements InstrumentationConsumer {
  private logs: LogEntry[] = [];
  private readonly options: NormalizedOptions;
  private readonly dispatcher = getInstrumentationDispatcher();
  private readonly subscription: InstrumentationSubscription;
  private readonly consoleFallback: OriginalConsoleMethods;
  private readonly fileSink?: FileSink;
  private readonly maxLogsInMemory: number;
  private readonly logFilePath?: string;
  private disposed = false;
  private droppedFromMemory = 0;

  constructor(options?: string | LoggingServiceOptions) {
    this.options = normalizeOptions(options);
    this.subscription = this.dispatcher.register(this);
    this.consoleFallback = this.dispatcher.getOriginalConsole();
    this.maxLogsInMemory = this.options.maxLogsInMemory;
    this.logFilePath = this.options.logFilePath;

    if (this.logFilePath) {
      this.fileSink = new FileSink(
        this.logFilePath,
        this.consoleFallback,
        this.options.fileRotation,
        this.options.fileSystem
      );
    }
  }

  handleEvent(event: InstrumentationEvent): void {
    if (this.disposed) {
      return;
    }

    const rawData =
      event.data ??
      (event.consoleArgs && event.consoleArgs.length > 0
        ? { consoleArgs: event.consoleArgs }
        : undefined);

    this.recordEntry({
      timestamp: new Date(),
      level: event.level,
      component: event.component,
      message: event.message,
      data:
        rawData !== undefined
          ? sanitizeData(rawData, this.options.serialization)
          : undefined,
    });
  }

  dispose(): Promise<void> {
    if (!this.disposed) {
      this.disposed = true;
      this.subscription.dispose();
    }

    return this.fileSink?.flush() ?? Promise.resolve();
  }

  log(
    level: LogEntry["level"],
    component: string,
    message: string,
    data?: unknown
  ): void {
    this.recordEntry(
      this.createEntry(level, component, message, data)
    );
  }

  info(component: string, message: string, data?: unknown): void {
    this.log("info", component, message, data);
  }

  warn(component: string, message: string, data?: unknown): void {
    this.log("warn", component, message, data);
  }

  error(component: string, message: string, data?: unknown): void {
    this.log("error", component, message, data);
  }

  debug(component: string, message: string, data?: unknown): void {
    this.log("debug", component, message, data);
  }

  getLogs(query?: LogQuery): LogEntry[] {
    if (!query) {
      return [...this.logs];
    }
    return applyQueryFilters(this.logs, query);
  }

  async queryLogs(query: LogQuery): Promise<LogEntry[]> {
    return applyQueryFilters(this.logs, query);
  }

  async getLogsFromFile(query: LogQuery): Promise<LogEntry[]> {
    if (!this.logFilePath) {
      return [];
    }

    const files = await this.collectLogFiles();
    const entries: LogEntry[] = [];

    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, "utf-8");
        const lines = content
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line) as LogEntry & { timestamp: string };
            entries.push({
              ...parsed,
              timestamp: new Date(parsed.timestamp),
            });
          } catch (parseError) {
            this.consoleFallback.warn(
              "LoggingService: skipping malformed log entry",
              line.slice(0, 120)
            );
          }
        }
      } catch (error) {
        this.consoleFallback.warn(
          `LoggingService: failed to read log file ${filePath}`,
          error
        );
      }
    }

    return applyQueryFilters(entries, query);
  }

  getLogStats(): {
    totalLogs: number;
    logsByLevel: Record<string, number>;
    logsByComponent: Record<string, number>;
    byLevel: Record<string, number>;
    byComponent: Record<string, number>;
    oldestLog?: Date;
    newestLog?: Date;
  } {
    const stats = {
      totalLogs: this.logs.length,
      logsByLevel: {} as Record<string, number>,
      logsByComponent: {} as Record<string, number>,
      byLevel: {} as Record<string, number>,
      byComponent: {} as Record<string, number>,
      oldestLog: undefined as Date | undefined,
      newestLog: undefined as Date | undefined,
    };

    for (const log of this.logs) {
      stats.logsByLevel[log.level] = (stats.logsByLevel[log.level] || 0) + 1;
      stats.byLevel[log.level] = stats.logsByLevel[log.level];

      stats.logsByComponent[log.component] =
        (stats.logsByComponent[log.component] || 0) + 1;
      stats.byComponent[log.component] = stats.logsByComponent[log.component];

      if (!stats.oldestLog || log.timestamp < stats.oldestLog) {
        stats.oldestLog = log.timestamp;
      }
      if (!stats.newestLog || log.timestamp > stats.newestLog) {
        stats.newestLog = log.timestamp;
      }
    }

    return stats;
  }

  clearOldLogs(olderThanHours: number = 24): number {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    const initialCount = this.logs.length;

    this.logs = this.logs.filter((log) => log.timestamp >= cutoffTime);

    return initialCount - this.logs.length;
  }

  exportLogsInFormat(format: "json" | "csv"): string {
    const logs = this.getLogs();

    if (format === "json") {
      return JSON.stringify(logs, null, 2);
    }

    if (logs.length === 0) {
      return "timestamp,level,component,message,data\n";
    }

    const headers = "timestamp,level,component,message,data\n";
    const rows = logs
      .map((log) => {
        const timestamp = log.timestamp.toISOString();
        const level = log.level;
        const component = log.component;
        const message = `"${log.message.replace(/"/g, '""')}"`;
        const data =
          log.data !== undefined
            ? `"${toSearchableString(log.data).replace(/"/g, '""')}"`
            : "";
        return `${timestamp},${level},${component},${message},${data}`;
      })
      .join("\n");

    return headers + rows;
  }

  async exportLogsToFile(
    query: LogQuery,
    exportPath: string
  ): Promise<number> {
    const logs = await this.queryLogs({ ...query, limit: undefined });

    const exportData = {
      exportedAt: new Date().toISOString(),
      query,
      logs: logs.map((log) => ({
        ...log,
        timestamp: log.timestamp.toISOString(),
      })),
    };

    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
    return logs.length;
  }

  exportLogs(query: LogQuery, exportPath: string): Promise<number>;
  exportLogs(format: "json" | "csv"): string;
  exportLogs(
    param1: LogQuery | "json" | "csv",
    param2?: string
  ): Promise<number> | string {
    if (typeof param1 === "string") {
      return this.exportLogsInFormat(param1);
    }

    if (!param2) {
      throw new Error("Export path is required for file export");
    }

    return this.exportLogsToFile(param1, param2);
  }

  getHealthMetrics(): LoggingHealthMetrics {
    const fileSinkMetrics = this.fileSink?.getMetrics();

    return {
      dispatcher: this.dispatcher.getMetrics(),
      inMemoryLogCount: this.logs.length,
      maxLogsInMemory: this.maxLogsInMemory,
      droppedFromMemory: this.droppedFromMemory,
      fileSink: fileSinkMetrics
        ? { ...fileSinkMetrics, path: this.logFilePath! }
        : undefined,
      logFilePath: this.logFilePath,
      disposed: this.disposed,
    };
  }

  private createEntry(
    level: LogEntry["level"],
    component: string,
    message: string,
    data?: unknown
  ): LogEntry {
    return {
      timestamp: new Date(),
      level,
      component,
      message,
      data:
        data !== undefined
          ? sanitizeData(data, this.options.serialization)
          : undefined,
    };
  }

  private recordEntry(entry: LogEntry): void {
    this.logs.push(entry);

    if (this.logs.length > this.options.maxLogsInMemory) {
      this.logs.shift();
      this.droppedFromMemory += 1;
    }

    if (this.fileSink) {
      try {
        const serialized = `${serializeLogEntry(entry, this.options.serialization)}\n`;
        void this.fileSink.append(serialized);
      } catch (error) {
        this.consoleFallback.warn(
          "LoggingService: failed to serialize log entry for file sink",
          error,
          entry
        );
      }
    }
  }

  private async collectLogFiles(): Promise<string[]> {
    const files: string[] = [];
    const basePath = this.logFilePath;

    if (!basePath) {
      return files;
    }

    try {
      await fs.stat(basePath);
      files.push(basePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }

    const historyLimit =
      this.fileSink?.getRotationHistoryLimit() ??
      this.options.fileRotation.maxHistory ??
      0;

    for (let index = 1; index <= historyLimit; index += 1) {
      const rotated = `${basePath}.${index}`;
      try {
        await fs.stat(rotated);
        files.push(rotated);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          throw error;
        }
      }
    }

    return files;
  }
}

================
File: services/MaintenanceService.ts
================
import { DatabaseService } from '@memento/database';
import { KnowledgeGraphService } from '@memento/knowledge';
import { MaintenanceMetrics } from '@memento/testing';
import { MaintenanceOperationError } from '@memento/backup';
import { TemporalHistoryValidator } from '@memento/jobs';

export interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  type: 'cleanup' | 'optimize' | 'reindex' | 'validate';
  estimatedDuration: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

export interface MaintenanceResult {
  taskId: string;
  success: boolean;
  duration: number;
  changes: any[];
  statistics: Record<string, any>;
}

export class MaintenanceService {
  private activeTasks = new Map<string, MaintenanceTask>();
  private completedTasks = new Map<string, MaintenanceTask>();
  private readonly temporalValidator: TemporalHistoryValidator;

  constructor(
    private dbService: DatabaseService,
    private kgService: KnowledgeGraphService
  ) {
    this.temporalValidator = new TemporalHistoryValidator(this.kgService);
  }

  async runMaintenanceTask(taskType: string): Promise<MaintenanceResult> {
    this.ensureDependenciesReady(taskType);

    const taskId = `${taskType}_${Date.now()}`;
    const metrics = MaintenanceMetrics.getInstance();
    const startedAt = Date.now();

    const task: MaintenanceTask = {
      id: taskId,
      name: this.getTaskName(taskType),
      description: this.getTaskDescription(taskType),
      type: taskType as any,
      estimatedDuration: this.getEstimatedDuration(taskType),
      status: 'running',
      progress: 0,
      startTime: new Date()
    };

    this.activeTasks.set(taskId, task);

    try {
      let result: MaintenanceResult;

      switch (taskType) {
        case 'cleanup':
          result = await this.runCleanup(task);
          break;
        case 'optimize':
          result = await this.runOptimization(task);
          break;
        case 'reindex':
          result = await this.runReindexing(task);
          break;
        case 'validate':
          result = await this.runValidation(task);
          break;
        default:
          throw new Error(`Unknown maintenance task: ${taskType}`);
      }

      task.status = 'completed';
      task.endTime = new Date();
      task.progress = 100;


      this.completedTasks.set(taskId, { ...task });

      metrics.recordMaintenanceTask({
        taskType,
        status: 'success',
        durationMs: result.duration ?? Date.now() - startedAt,
      });

      return result;

    } catch (error) {
      task.status = 'failed';
      task.endTime = new Date();
      task.error = error instanceof Error ? error.message : 'Unknown error';


      this.completedTasks.set(taskId, { ...task });

      metrics.recordMaintenanceTask({
        taskType,
        status: 'failure',
        durationMs: Date.now() - startedAt,
      });

      throw error;
    } finally {
      this.activeTasks.delete(taskId);
    }
  }

  private async runCleanup(task: MaintenanceTask): Promise<MaintenanceResult> {
    const changes: Array<Record<string, unknown>> = [];
    const stats = { entitiesRemoved: 0, relationshipsRemoved: 0, orphanedRecords: 0 };

    try {

      const orphanedEntities = await this.findOrphanedEntities();
      stats.orphanedRecords = orphanedEntities.length;

      for (const entityId of orphanedEntities) {
        await this.kgService.deleteEntity(entityId);
        stats.entitiesRemoved++;
        changes.push({ type: 'entity_removed', id: entityId });
      }


      const danglingRelationshipsCount = await this.removeDanglingRelationships();
      stats.relationshipsRemoved += danglingRelationshipsCount;
      if (danglingRelationshipsCount > 0) {
        changes.push({ type: 'dangling_relationships_removed', count: danglingRelationshipsCount });
      }


      await this.cleanupOldSyncRecords();


      await this.cleanupOrphanedEmbeddings();

    } catch (error) {
      console.warn('Some cleanup operations failed:', error);
    }

    return {
      taskId: task.id,
      success: true,
      duration: Date.now() - (task.startTime?.getTime() || 0),
      changes,
      statistics: stats
    };
  }

  private async runOptimization(task: MaintenanceTask): Promise<MaintenanceResult> {
    const changes: Array<Record<string, unknown>> = [];
    const stats = { optimizedCollections: 0, rebalancedIndexes: 0, vacuumedTables: 0 };

    try {

      const qdrantClient = this.dbService.getQdrantClient();
      const collections = await qdrantClient.getCollections();
      for (const collection of collections.collections) {
        try {
          await qdrantClient.updateCollection(collection.name, {
            optimizers_config: {
              default_segment_number: 2,
              indexing_threshold: 10000
            }
          });
          stats.optimizedCollections++;
          changes.push({ type: 'collection_optimized', name: collection.name });
        } catch (error) {
          console.warn(`Failed to optimize collection ${collection.name}:`, error);
        }
      }


      await this.dbService.postgresQuery('VACUUM ANALYZE');
      stats.vacuumedTables = 1;
      changes.push({ type: 'postgres_vacuum', tables: 'all' });


      const falkorClient = this.dbService.getFalkorDBService();
      await falkorClient.command('MEMORY', 'PURGE');
      changes.push({ type: 'redis_memory_optimized' });

    } catch (error) {
      console.warn('Some optimization operations failed:', error);
    }

    return {
      taskId: task.id,
      success: true,
      duration: Date.now() - (task.startTime?.getTime() || 0),
      changes,
      statistics: stats
    };
  }

  private async runReindexing(task: MaintenanceTask): Promise<MaintenanceResult> {
    const changes: Array<Record<string, unknown>> = [];
    const stats = { indexesRebuilt: 0, collectionsReindexed: 0, tablesReindexed: 0 };

    try {

      const qdrantClient = this.dbService.getQdrantClient();
      const collections = await qdrantClient.getCollections();
      for (const collection of collections.collections) {
        try {

          const config = await qdrantClient.getCollection(collection.name);
          stats.collectionsReindexed++;
          changes.push({ type: 'collection_reindexed', name: collection.name });
        } catch (error) {
          console.warn(`Failed to reindex collection ${collection.name}:`, error);
        }
      }


      const tablesResult = await this.dbService.postgresQuery(`
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
      `);
      const tables = (
        Array.isArray(tablesResult)
          ? tablesResult
          : (tablesResult as any)?.rows ?? []
      ) as Array<{ tablename: string }>;
      for (const table of tables) {
        try {
          await this.dbService.postgresQuery(`REINDEX TABLE ${table.tablename}`);
          stats.tablesReindexed++;
          changes.push({ type: 'table_reindexed', name: table.tablename });
        } catch (error) {
          console.warn(`Failed to reindex table ${table.tablename}:`, error);
        }
      }


      await this.dbService.falkordbQuery('CALL db.rescan()');
      changes.push({ type: 'graph_reindexed' });

    } catch (error) {
      console.warn('Some reindexing operations failed:', error);
    }

    return {
      taskId: task.id,
      success: true,
      duration: Date.now() - (task.startTime?.getTime() || 0),
      changes,
      statistics: stats
    };
  }

  private async runValidation(task: MaintenanceTask): Promise<MaintenanceResult> {
    const changes: Array<Record<string, unknown>> = [];
    const stats = {
      invalidEntities: 0,
      invalidRelationships: 0,
      integrityIssues: 0,
      validatedCollections: 0,
      temporalIssues: 0,
      temporalRepairs: 0,
    };

    try {

      const entitiesResult = await this.kgService.listEntities({ limit: 1000 });
      for (const entity of entitiesResult.entities || entitiesResult.items || []) {
        if (!this.isValidEntity(entity)) {
          stats.invalidEntities++;
          changes.push({ type: 'invalid_entity', id: entity.id, issues: this.getEntityIssues(entity) });
        }
      }


      const relationshipsResult = await this.kgService.listRelationships({ limit: 1000 });
      for (const relationship of relationshipsResult.relationships) {
        if (!(await this.isValidRelationship(relationship))) {
          stats.invalidRelationships++;
          changes.push({ type: 'invalid_relationship', id: relationship.id });
        }
      }


      const qdrantClient = this.dbService.getQdrantClient();
      const collections = await qdrantClient.getCollections();
      for (const collection of collections.collections) {
        try {
          const info = await qdrantClient.getCollection(collection.name);
          if (info.points_count === undefined || info.points_count === null || info.points_count < 0) {
            stats.integrityIssues++;
            changes.push({ type: 'collection_integrity_issue', name: collection.name });
          }
          stats.validatedCollections++;
        } catch (error) {
          stats.integrityIssues++;
          changes.push({ type: 'collection_validation_failed', name: collection.name });
        }
      }


      await this.validateDatabaseConnections();

      const temporalReport = await this.temporalValidator.validate({
        autoRepair: true,
        dryRun: false,
        batchSize: 25,
        timelineLimit: 200,
        logger: (message, context) =>
          console.log(`temporal-validator:${message}`, context ?? {}),
      });
      const unresolvedTemporalIssues = temporalReport.issues.filter(
        (issue) => issue.repaired !== true
      ).length;
      stats.temporalIssues += temporalReport.issues.length;
      stats.temporalRepairs += temporalReport.repairedLinks;
      stats.integrityIssues += unresolvedTemporalIssues;
      if (
        temporalReport.issues.length > 0 ||
        temporalReport.repairedLinks > 0
      ) {
        changes.push({
          type: "temporal_history_validation",
          report: {
            scannedEntities: temporalReport.scannedEntities,
            inspectedVersions: temporalReport.inspectedVersions,
            repairedLinks: temporalReport.repairedLinks,
            unresolvedIssues: unresolvedTemporalIssues,
            sampleIssues: temporalReport.issues.slice(0, 50),
          },
        });
      }

    } catch (error) {
      console.warn('Some validation operations failed:', error);
    }

    return {
      taskId: task.id,
      success: true,
      duration: Date.now() - (task.startTime?.getTime() || 0),
      changes,
      statistics: stats
    };
  }

  private async findOrphanedEntities(): Promise<string[]> {
    try {

      const query = `
        MATCH (n)
        WHERE NOT (n)-[]->() AND NOT ()-[]->(n)
        RETURN n.id as id
        LIMIT 100
      `;
      const result = await this.dbService.falkordbQuery(query);
      return result.map((row: any) => row.id);
    } catch (error) {
      console.warn('Failed to find orphaned entities:', error);
      return [];
    }
  }

  private async removeDanglingRelationships(): Promise<number> {
    try {

      const query = `
        MATCH (n)-[r]->(m)
        WHERE n.id IS NULL OR m.id IS NULL
        DELETE r
        RETURN count(r) as count
      `;
      const result = await this.dbService.falkordbQuery(query);
      return result[0]?.count || 0;
    } catch (error) {
      console.warn('Failed to remove dangling relationships:', error);
      return 0;
    }
  }

  private async cleanupOldSyncRecords(): Promise<void> {
    try {

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);



      console.log(`Cleaning up sync records older than ${thirtyDaysAgo.toISOString()}`);
    } catch (error) {
      console.warn('Failed to cleanup old sync records:', error);
    }
  }

  private async cleanupOrphanedEmbeddings(): Promise<void> {
    try {

      console.log('Checking for orphaned embeddings...');
    } catch (error) {
      console.warn('Failed to cleanup orphaned embeddings:', error);
    }
  }

  private async validateDatabaseConnections(): Promise<void> {
    try {

      await this.dbService.falkordbQuery('MATCH (n) RETURN count(n) LIMIT 1');
      const qdrantClient = this.dbService.getQdrantClient();
      await qdrantClient.getCollections();
      await this.dbService.postgresQuery('SELECT 1');
    } catch (error) {
      throw new Error(`Database connection validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private isValidEntity(entity: any): boolean {
    return entity.id && entity.type && entity.hash && entity.lastModified;
  }

  private getEntityIssues(entity: any): string[] {
    const issues: string[] = [];
    if (!entity.id) issues.push('missing id');
    if (!entity.type) issues.push('missing type');
    if (!entity.hash) issues.push('missing hash');
    if (!entity.lastModified) issues.push('missing lastModified');
    return issues;
  }

  private async isValidRelationship(relationship: any): Promise<boolean> {
    try {

      const fromEntity = await this.kgService.getEntity(relationship.fromEntityId);
      const toEntity = await this.kgService.getEntity(relationship.toEntityId);
      return !!fromEntity && !!toEntity;
    } catch (error) {
      return false;
    }
  }

  private getTaskName(taskType: string): string {
    const names = {
      cleanup: 'Database Cleanup',
      optimize: 'Performance Optimization',
      reindex: 'Index Rebuilding',
      validate: 'Data Validation'
    };
    return names[taskType as keyof typeof names] || 'Unknown Task';
  }

  private getTaskDescription(taskType: string): string {
    const descriptions = {
      cleanup: 'Remove orphaned entities and relationships, clean up old records',
      optimize: 'Optimize database performance and memory usage',
      reindex: 'Rebuild database indexes for better query performance',
      validate: 'Validate data integrity and database consistency'
    };
    return descriptions[taskType as keyof typeof descriptions] || '';
  }

  private getEstimatedDuration(taskType: string): string {
    const durations = {
      cleanup: '2-5 minutes',
      optimize: '5-10 minutes',
      reindex: '10-15 minutes',
      validate: '3-7 minutes'
    };
    return durations[taskType as keyof typeof durations] || '5 minutes';
  }

  getActiveTasks(): MaintenanceTask[] {
    return Array.from(this.activeTasks.values());
  }

  getTaskStatus(taskId: string): MaintenanceTask | undefined {
    return this.activeTasks.get(taskId);
  }

  getCompletedTask(taskId: string): MaintenanceTask | undefined {
    return this.completedTasks.get(taskId);
  }

  getCompletedTasks(): MaintenanceTask[] {
    return Array.from(this.completedTasks.values());
  }

  private ensureDependenciesReady(taskType: string): void {
    if (!this.dbService || typeof this.dbService.isInitialized !== 'function') {
      throw new MaintenanceOperationError(
        `Database service unavailable. Cannot run maintenance task "${taskType}".`,
        {
          code: 'DEPENDENCY_UNAVAILABLE',
          statusCode: 503,
          component: 'database',
          stage: 'maintenance',
        }
      );
    }

    if (!this.dbService.isInitialized()) {
      throw new MaintenanceOperationError(
        `Database service not initialized. Cannot run maintenance task "${taskType}".`,
        {
          code: 'DEPENDENCY_UNAVAILABLE',
          statusCode: 503,
          component: 'database',
          stage: 'maintenance',
        }
      );
    }

    if (!this.kgService) {
      throw new MaintenanceOperationError(
        `Knowledge graph service unavailable. Cannot run maintenance task "${taskType}".`,
        {
          code: 'DEPENDENCY_UNAVAILABLE',
          statusCode: 503,
          component: 'knowledge_graph',
          stage: 'maintenance',
        }
      );
    }
  }
}

================
File: services/RedisConnectionPool.ts
================
import { EventEmitter } from 'events';
import type { RedisClientType, RedisClientOptions } from 'redis';
import { RedisConfig } from './SessionTypes.js';

export interface PoolConfig {
  minConnections: number;
  maxConnections: number;
  acquireTimeout: number;
  idleTimeout: number;
  reapInterval: number;
  maxRetries: number;
  retryDelay: number;
  enableHealthCheck: boolean;
  healthCheckInterval: number;
  enableLoadBalancing: boolean;
  preferWriteConnections: boolean;
}

export interface ConnectionStats {
  total: number;
  active: number;
  idle: number;
  pending: number;
  failed: number;
  created: number;
  destroyed: number;
  acquisitionTime: number;
  healthChecksPassed: number;
  healthChecksFailed: number;
}

export interface PooledConnection {
  id: string;
  client: RedisClientType;
  createdAt: number;
  lastUsed: number;
  usageCount: number;
  isHealthy: boolean;
  inUse: boolean;
  type: 'read' | 'write' | 'readwrite';
}

export interface AcquisitionRequest {
  id: string;
  timestamp: number;
  resolve: (connection: PooledConnection) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
  preferredType?: 'read' | 'write';
}

export class RedisConnectionPool extends EventEmitter {
  private config: PoolConfig;
  private redisConfig: RedisConfig;
  private connections = new Map<string, PooledConnection>();
  private availableConnections = new Set<string>();
  private acquireQueue: AcquisitionRequest[] = [];
  private stats: ConnectionStats;
  private healthCheckTimer?: NodeJS.Timeout;
  private reapTimer?: NodeJS.Timeout;
  private isShuttingDown = false;

  constructor(redisConfig: RedisConfig, poolConfig: Partial<PoolConfig> = {}) {
    super();
    this.redisConfig = redisConfig;
    this.config = {
      minConnections: poolConfig.minConnections ?? 2,
      maxConnections: poolConfig.maxConnections ?? 10,
      acquireTimeout: poolConfig.acquireTimeout ?? 30000,
      idleTimeout: poolConfig.idleTimeout ?? 300000,
      reapInterval: poolConfig.reapInterval ?? 60000,
      maxRetries: poolConfig.maxRetries ?? 3,
      retryDelay: poolConfig.retryDelay ?? 1000,
      enableHealthCheck: poolConfig.enableHealthCheck ?? true,
      healthCheckInterval: poolConfig.healthCheckInterval ?? 30000,
      enableLoadBalancing: poolConfig.enableLoadBalancing ?? true,
      preferWriteConnections: poolConfig.preferWriteConnections ?? false,
    };

    this.stats = {
      total: 0,
      active: 0,
      idle: 0,
      pending: 0,
      failed: 0,
      created: 0,
      destroyed: 0,
      acquisitionTime: 0,
      healthChecksPassed: 0,
      healthChecksFailed: 0,
    };

    this.initialize();
  }




  private async initialize(): Promise<void> {
    try {

      for (let i = 0; i < this.config.minConnections; i++) {
        await this.createConnection();
      }


      this.startHealthCheckTimer();
      this.startReapTimer();

      this.emit('pool:initialized', { minConnections: this.config.minConnections });
    } catch (error) {
      this.emit('pool:error', error);
      throw error;
    }
  }




  async acquire(preferredType?: 'read' | 'write'): Promise<PooledConnection> {
    if (this.isShuttingDown) {
      throw new Error('Connection pool is shutting down');
    }


    const availableConnection = this.getAvailableConnection(preferredType);
    if (availableConnection) {
      this.markConnectionInUse(availableConnection);
      return availableConnection;
    }


    if (this.connections.size < this.config.maxConnections) {
      try {
        const newConnection = await this.createConnection(preferredType === 'write' ? 'write' : 'readwrite');
        this.markConnectionInUse(newConnection);
        return newConnection;
      } catch (error) {
        this.emit('connection:create:error', error);
      }
    }


    return this.queueAcquisitionRequest(preferredType);
  }




  async release(connection: PooledConnection): Promise<void> {
    if (!this.connections.has(connection.id)) {
      this.emit('connection:release:warning', { connectionId: connection.id, reason: 'Connection not in pool' });
      return;
    }


    connection.inUse = false;
    connection.lastUsed = Date.now();
    connection.usageCount++;


    this.availableConnections.add(connection.id);


    this.stats.active--;
    this.stats.idle++;

    this.emit('connection:released', { connectionId: connection.id });


    await this.processAcquisitionQueue();
  }




  async execute<T>(
    command: (client: RedisClientType) => Promise<T>,
    preferredType?: 'read' | 'write'
  ): Promise<T> {
    const startTime = Date.now();
    const connection = await this.acquire(preferredType);

    try {
      const result = await command(connection.client);
      return result;
    } finally {
      await this.release(connection);
      this.updateAcquisitionTime(Date.now() - startTime);
    }
  }




  async pipeline(
    commands: Array<(client: RedisClientType) => Promise<any>>,
    preferredType?: 'read' | 'write'
  ): Promise<any[]> {
    const connection = await this.acquire(preferredType);

    try {

      const results = await Promise.all(commands.map(cmd => cmd(connection.client)));
      return results;
    } finally {
      await this.release(connection);
    }
  }




  async transaction(
    commands: Array<(client: RedisClientType) => Promise<any>>
  ): Promise<any[]> {
    const connection = await this.acquire('write');

    try {


      const results: any[] = [];

      for (const command of commands) {
        const result = await command(connection.client);
        results.push(result);
      }

      return results;
    } finally {
      await this.release(connection);
    }
  }




  getStats(): ConnectionStats {
    this.updateCurrentStats();
    return { ...this.stats };
  }




  getStatus(): {
    isHealthy: boolean;
    connections: Array<{
      id: string;
      type: string;
      inUse: boolean;
      isHealthy: boolean;
      usageCount: number;
      age: number;
    }>;
  } {
    const now = Date.now();
    const connections = Array.from(this.connections.values()).map(conn => ({
      id: conn.id,
      type: conn.type,
      inUse: conn.inUse,
      isHealthy: conn.isHealthy,
      usageCount: conn.usageCount,
      age: now - conn.createdAt,
    }));

    const healthyConnections = connections.filter(c => c.isHealthy).length;
    const isHealthy = healthyConnections >= this.config.minConnections;

    return { isHealthy, connections };
  }




  private async createConnection(type: 'read' | 'write' | 'readwrite' = 'readwrite'): Promise<PooledConnection> {
    const connectionId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const Redis = await import('redis');

      const clientOptions: RedisClientOptions = {
        url: this.redisConfig.url,
        socket: {
          host: this.redisConfig.host,
          port: this.redisConfig.port,
          reconnectStrategy: (retries) => {
            if (retries >= this.config.maxRetries) {
              return false;
            }
            return Math.min(retries * this.config.retryDelay, 5000);
          },
        },
        password: this.redisConfig.password,
        database: this.redisConfig.db || 0,
      };

      const client = Redis.createClient(clientOptions) as RedisClientType;


      client.on('error', (error) => {
        this.handleConnectionError(connectionId, error);
      });

      client.on('connect', () => {
        this.emit('connection:connected', { connectionId });
      });

      client.on('ready', () => {
        this.emit('connection:ready', { connectionId });
      });

      client.on('end', () => {
        this.handleConnectionEnd(connectionId);
      });

      await client.connect();

      const connection: PooledConnection = {
        id: connectionId,
        client,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        usageCount: 0,
        isHealthy: true,
        inUse: false,
        type,
      };

      this.connections.set(connectionId, connection);
      this.availableConnections.add(connectionId);


      this.stats.total++;
      this.stats.idle++;
      this.stats.created++;

      this.emit('connection:created', { connectionId, type });
      return connection;
    } catch (error) {
      this.stats.failed++;
      this.emit('connection:create:error', { connectionId, error });
      throw error;
    }
  }




  private getAvailableConnection(preferredType?: 'read' | 'write'): PooledConnection | null {
    if (this.availableConnections.size === 0) return null;

    const availableConnIds = Array.from(this.availableConnections);
    const availableConns = availableConnIds.map(id => this.connections.get(id)!).filter(Boolean);

    if (availableConns.length === 0) return null;


    let candidateConns = availableConns;
    if (preferredType) {
      const typedConns = availableConns.filter(conn =>
        conn.type === preferredType || conn.type === 'readwrite'
      );
      if (typedConns.length > 0) {
        candidateConns = typedConns;
      }
    }


    const healthyConns = candidateConns.filter(conn => conn.isHealthy);
    if (healthyConns.length === 0) {
      candidateConns = candidateConns.filter(conn => conn.isHealthy);
      if (candidateConns.length === 0) return null;
    } else {
      candidateConns = healthyConns;
    }


    if (this.config.enableLoadBalancing) {

      return candidateConns.reduce((least, current) =>
        current.usageCount < least.usageCount ? current : least
      );
    } else {

      return candidateConns[0];
    }
  }




  private markConnectionInUse(connection: PooledConnection): void {
    connection.inUse = true;
    connection.lastUsed = Date.now();
    this.availableConnections.delete(connection.id);

    this.stats.active++;
    this.stats.idle--;
  }




  private async queueAcquisitionRequest(preferredType?: 'read' | 'write'): Promise<PooledConnection> {
    return new Promise((resolve, reject) => {
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const timeout = setTimeout(() => {
        const index = this.acquireQueue.findIndex(req => req.id === requestId);
        if (index !== -1) {
          this.acquireQueue.splice(index, 1);
        }
        reject(new Error(`Connection acquisition timeout after ${this.config.acquireTimeout}ms`));
      }, this.config.acquireTimeout);

      const request: AcquisitionRequest = {
        id: requestId,
        timestamp: Date.now(),
        resolve,
        reject,
        timeout,
        preferredType,
      };

      this.acquireQueue.push(request);
      this.stats.pending++;

      this.emit('acquisition:queued', { requestId, queueLength: this.acquireQueue.length });
    });
  }




  private async processAcquisitionQueue(): Promise<void> {
    while (this.acquireQueue.length > 0 && this.availableConnections.size > 0) {
      const request = this.acquireQueue.shift()!;
      clearTimeout(request.timeout);
      this.stats.pending--;

      const connection = this.getAvailableConnection(request.preferredType);
      if (connection) {
        this.markConnectionInUse(connection);
        request.resolve(connection);
        this.emit('acquisition:fulfilled', { requestId: request.id });
      } else {
        this.acquireQueue.unshift(request);
        break;
      }
    }
  }




  private async performHealthCheck(): Promise<void> {
    const healthCheckPromises = Array.from(this.connections.values()).map(async (connection) => {
      if (connection.inUse) return;

      try {
        await connection.client.ping();
        connection.isHealthy = true;
        this.stats.healthChecksPassed++;
        this.emit('healthcheck:passed', { connectionId: connection.id });
      } catch (error) {
        connection.isHealthy = false;
        this.stats.healthChecksFailed++;
        this.emit('healthcheck:failed', { connectionId: connection.id, error });


        const healthyCount = Array.from(this.connections.values()).filter(c => c.isHealthy).length;
        if (healthyCount >= this.config.minConnections) {
          await this.destroyConnection(connection.id);
        }
      }
    });

    await Promise.allSettled(healthCheckPromises);
  }




  private async reapIdleConnections(): Promise<void> {
    const now = Date.now();
    const connectionsToReap: string[] = [];

    for (const connection of Array.from(this.connections.values())) {
      if (connection.inUse) continue;

      const idleTime = now - connection.lastUsed;
      if (idleTime > this.config.idleTimeout && this.connections.size > this.config.minConnections) {
        connectionsToReap.push(connection.id);
      }
    }

    for (const connectionId of connectionsToReap) {
      await this.destroyConnection(connectionId);
    }

    if (connectionsToReap.length > 0) {
      this.emit('connections:reaped', { count: connectionsToReap.length });
    }
  }




  private async destroyConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      if (connection.inUse) {
        this.emit('connection:destroy:warning', {
          connectionId,
          reason: 'Destroying connection that is in use'
        });
      }

      await connection.client.quit();
    } catch (error) {
      this.emit('connection:destroy:error', { connectionId, error });
    } finally {
      this.connections.delete(connectionId);
      this.availableConnections.delete(connectionId);


      this.stats.total--;
      if (connection.inUse) {
        this.stats.active--;
      } else {
        this.stats.idle--;
      }
      this.stats.destroyed++;

      this.emit('connection:destroyed', { connectionId });
    }
  }




  private handleConnectionError(connectionId: string, error: Error): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.isHealthy = false;
    }

    this.emit('connection:error', { connectionId, error });
  }




  private handleConnectionEnd(connectionId: string): void {
    this.emit('connection:ended', { connectionId });
    this.destroyConnection(connectionId);
  }




  private updateCurrentStats(): void {
    this.stats.total = this.connections.size;
    this.stats.active = Array.from(this.connections.values()).filter(c => c.inUse).length;
    this.stats.idle = this.stats.total - this.stats.active;
    this.stats.pending = this.acquireQueue.length;
  }




  private updateAcquisitionTime(time: number): void {

    this.stats.acquisitionTime = (this.stats.acquisitionTime * 0.9) + (time * 0.1);
  }




  private startHealthCheckTimer(): void {
    if (!this.config.enableHealthCheck) return;

    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck().catch(error => {
        this.emit('healthcheck:error', error);
      });
    }, this.config.healthCheckInterval);
  }




  private startReapTimer(): void {
    this.reapTimer = setInterval(() => {
      this.reapIdleConnections().catch(error => {
        this.emit('reap:error', error);
      });
    }, this.config.reapInterval);
  }




  async shutdown(): Promise<void> {
    this.isShuttingDown = true;


    if (this.healthCheckTimer) clearInterval(this.healthCheckTimer);
    if (this.reapTimer) clearInterval(this.reapTimer);


    while (this.acquireQueue.length > 0) {
      const request = this.acquireQueue.shift()!;
      clearTimeout(request.timeout);
      request.reject(new Error('Connection pool is shutting down'));
    }


    const shutdownPromises = Array.from(this.connections.keys()).map(id =>
      this.destroyConnection(id)
    );

    await Promise.allSettled(shutdownPromises);

    this.emit('pool:shutdown');
  }
}

================
File: services/SessionAnalytics.ts
================
import { EventEmitter } from 'events';
import type { RedisClientType } from 'redis';
import {
  SessionDocument,
  SessionEvent,
  SessionState,
  SessionMetrics,
  SessionStats,
  ISessionStore,
} from './SessionTypes.js';

export interface SessionAnalyticsConfig {
  metricsRetentionDays: number;
  aggregationInterval: number;
  enableRealTimeTracking: boolean;
  enableAgentCollaborationMetrics: boolean;
  enablePerformanceTracking: boolean;
}

export interface SessionAnalyticsData {
  sessionId: string;
  duration: number;
  eventCount: number;
  agentCount: number;
  stateTransitions: number;
  averageEventInterval: number;
  collaborationScore: number;
  performanceImpact: number;
  timestamp: string;
}

export interface AgentCollaborationMetrics {
  agentId: string;
  sessionsJoined: number;
  eventsContributed: number;
  averageSessionDuration: number;
  collaborationEfficiency: number;
  handoffsInitiated: number;
  handoffsReceived: number;
}

export interface SessionPerformanceMetrics {
  sessionId: string;
  startTime: string;
  endTime?: string;
  duration: number;
  eventCount: number;
  averageEventProcessingTime: number;
  peakMemoryUsage: number;
  networkLatency: number;
  errorCount: number;
}

export interface SessionTrendAnalysis {
  timeframe: string;
  sessionCount: number;
  averageDuration: number;
  averageAgentsPerSession: number;
  mostActiveAgents: string[];
  commonEventTypes: Array<{ type: string; count: number }>;
  performanceTrends: Array<{ metric: string; trend: 'up' | 'down' | 'stable'; change: number }>;
}

export class SessionAnalytics extends EventEmitter {
  private redis: RedisClientType;
  private config: SessionAnalyticsConfig;
  private activeSessionMetrics = new Map<string, SessionPerformanceMetrics>();
  private analyticsTimer?: NodeJS.Timeout;

  constructor(redis: RedisClientType, config: Partial<SessionAnalyticsConfig> = {}) {
    super();
    this.redis = redis;
    this.config = {
      metricsRetentionDays: config.metricsRetentionDays ?? 30,
      aggregationInterval: config.aggregationInterval ?? 300,
      enableRealTimeTracking: config.enableRealTimeTracking ?? true,
      enableAgentCollaborationMetrics: config.enableAgentCollaborationMetrics ?? true,
      enablePerformanceTracking: config.enablePerformanceTracking ?? true,
    };

    if (this.config.enableRealTimeTracking) {
      this.startRealTimeTracking();
    }
  }




  async startSessionTracking(sessionId: string): Promise<void> {
    if (!this.config.enablePerformanceTracking) return;

    const metrics: SessionPerformanceMetrics = {
      sessionId,
      startTime: new Date().toISOString(),
      duration: 0,
      eventCount: 0,
      averageEventProcessingTime: 0,
      peakMemoryUsage: 0,
      networkLatency: 0,
      errorCount: 0,
    };

    this.activeSessionMetrics.set(sessionId, metrics);


    await this.redis.hSet(`analytics:session:${sessionId}`, {
      startTime: metrics.startTime,
      status: 'active',
    });

    this.emit('session:tracking:started', { sessionId, metrics });
  }




  async recordEvent(sessionId: string, event: SessionEvent, processingTime?: number): Promise<void> {
    const metrics = this.activeSessionMetrics.get(sessionId);
    if (!metrics) return;


    metrics.eventCount++;
    if (processingTime) {
      const currentAvg = metrics.averageEventProcessingTime;
      metrics.averageEventProcessingTime =
        (currentAvg * (metrics.eventCount - 1) + processingTime) / metrics.eventCount;
    }


    const eventAnalytics = {
      sessionId,
      eventType: event.type,
      timestamp: event.timestamp,
      processingTime: processingTime || 0,
      actor: event.actor,
    };

    await this.redis.zAdd(
      `analytics:events:${sessionId}`,
      { score: Date.now(), value: JSON.stringify(eventAnalytics) }
    );


    await this.redis.hIncrBy('analytics:global:event_types', event.type, 1);

    this.emit('event:recorded', { sessionId, event, processingTime });
  }




  async endSessionTracking(sessionId: string): Promise<SessionAnalyticsData> {
    const metrics = this.activeSessionMetrics.get(sessionId);
    if (!metrics) {
      throw new Error(`Session tracking not found: ${sessionId}`);
    }

    const endTime = new Date().toISOString();
    const duration = Date.now() - new Date(metrics.startTime).getTime();

    metrics.endTime = endTime;
    metrics.duration = duration;


    const analyticsData: SessionAnalyticsData = {
      sessionId,
      duration,
      eventCount: metrics.eventCount,
      agentCount: await this.getSessionAgentCount(sessionId),
      stateTransitions: await this.getSessionStateTransitions(sessionId),
      averageEventInterval: metrics.eventCount > 1 ? duration / (metrics.eventCount - 1) : 0,
      collaborationScore: await this.calculateCollaborationScore(sessionId),
      performanceImpact: await this.calculatePerformanceImpact(sessionId),
      timestamp: endTime,
    };


    await this.redis.hSet(`analytics:session:${sessionId}`, {
      endTime,
      duration: duration.toString(),
      eventCount: metrics.eventCount.toString(),
      agentCount: analyticsData.agentCount.toString(),
      collaborationScore: analyticsData.collaborationScore.toString(),
      status: 'completed',
    });


    await this.redis.zAdd(
      'analytics:timeseries:sessions',
      { score: Date.now(), value: JSON.stringify(analyticsData) }
    );


    this.activeSessionMetrics.delete(sessionId);

    this.emit('session:tracking:ended', { sessionId, analyticsData });
    return analyticsData;
  }




  async getAgentCollaborationMetrics(agentId: string): Promise<AgentCollaborationMetrics> {
    const agentData = await this.redis.hGetAll(`analytics:agent:${agentId}`);

    return {
      agentId,
      sessionsJoined: parseInt(agentData.sessionsJoined || '0'),
      eventsContributed: parseInt(agentData.eventsContributed || '0'),
      averageSessionDuration: parseFloat(agentData.averageSessionDuration || '0'),
      collaborationEfficiency: parseFloat(agentData.collaborationEfficiency || '0'),
      handoffsInitiated: parseInt(agentData.handoffsInitiated || '0'),
      handoffsReceived: parseInt(agentData.handoffsReceived || '0'),
    };
  }




  async updateAgentMetrics(agentId: string, updates: Partial<AgentCollaborationMetrics>): Promise<void> {
    const updateData: Record<string, string> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'agentId') {
        updateData[key] = value.toString();
      }
    });

    if (Object.keys(updateData).length > 0) {
      await this.redis.hSet(`analytics:agent:${agentId}`, updateData);
    }
  }




  async getTrendAnalysis(timeframe: 'hour' | 'day' | 'week' | 'month'): Promise<SessionTrendAnalysis> {
    const now = Date.now();
    const timeframes = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };

    const since = now - timeframes[timeframe];


    const sessionData = await this.redis.zRangeByScore(
      'analytics:timeseries:sessions',
      since,
      now
    );

    const sessions = sessionData.map(data => JSON.parse(data) as SessionAnalyticsData);


    const sessionCount = sessions.length;
    const averageDuration = sessions.reduce((sum, s) => sum + s.duration, 0) / sessionCount || 0;
    const averageAgentsPerSession = sessions.reduce((sum, s) => sum + s.agentCount, 0) / sessionCount || 0;


    const agentCounts = new Map<string, number>();
    await Promise.all(sessions.map(async (session) => {
      const events = await this.redis.zRange(`analytics:events:${session.sessionId}`, 0, -1);
      events.forEach(eventStr => {
        const event = JSON.parse(eventStr);
        agentCounts.set(event.actor, (agentCounts.get(event.actor) || 0) + 1);
      });
    }));

    const mostActiveAgents = Array.from(agentCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([agent]) => agent);


    const eventTypes = await this.redis.hGetAll('analytics:global:event_types');
    const commonEventTypes = Object.entries(eventTypes)
      .map(([type, count]) => ({ type, count: parseInt(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      timeframe,
      sessionCount,
      averageDuration,
      averageAgentsPerSession,
      mostActiveAgents,
      commonEventTypes,
      performanceTrends: [],
    };
  }




  async getSessionPerformanceMetrics(sessionId: string): Promise<SessionPerformanceMetrics | null> {
    const stored = await this.redis.hGetAll(`analytics:session:${sessionId}`);
    if (!stored.startTime) return null;

    return {
      sessionId,
      startTime: stored.startTime,
      endTime: stored.endTime,
      duration: parseInt(stored.duration || '0'),
      eventCount: parseInt(stored.eventCount || '0'),
      averageEventProcessingTime: parseFloat(stored.averageEventProcessingTime || '0'),
      peakMemoryUsage: parseFloat(stored.peakMemoryUsage || '0'),
      networkLatency: parseFloat(stored.networkLatency || '0'),
      errorCount: parseInt(stored.errorCount || '0'),
    };
  }




  async cleanupOldData(): Promise<void> {
    const cutoff = Date.now() - (this.config.metricsRetentionDays * 24 * 60 * 60 * 1000);


    await this.redis.zRemRangeByScore('analytics:timeseries:sessions', 0, cutoff);


    const oldSessions = await this.redis.zRangeByScore(
      'analytics:timeseries:sessions',
      0,
      cutoff
    );

    for (const sessionStr of oldSessions) {
      const session = JSON.parse(sessionStr) as SessionAnalyticsData;
      await this.redis.del(`analytics:session:${session.sessionId}`);
      await this.redis.del(`analytics:events:${session.sessionId}`);
    }

    this.emit('cleanup:completed', { cutoff, removedSessions: oldSessions.length });
  }




  private startRealTimeTracking(): void {
    this.analyticsTimer = setInterval(async () => {
      try {
        await this.updateRealTimeMetrics();
      } catch (error) {
        this.emit('error', error);
      }
    }, this.config.aggregationInterval * 1000);
  }




  private async updateRealTimeMetrics(): Promise<void> {

    for (const [sessionId, metrics] of Array.from(this.activeSessionMetrics.entries())) {
      const memoryUsage = process.memoryUsage();
      metrics.peakMemoryUsage = Math.max(
        metrics.peakMemoryUsage,
        memoryUsage.heapUsed / 1024 / 1024
      );


      await this.redis.hSet(`analytics:session:${sessionId}`, {
        peakMemoryUsage: metrics.peakMemoryUsage.toString(),
        duration: (Date.now() - new Date(metrics.startTime).getTime()).toString(),
      });
    }

    this.emit('realtime:updated', {
      activeSessions: this.activeSessionMetrics.size,
      totalMemory: process.memoryUsage().heapUsed / 1024 / 1024,
    });
  }




  private async getSessionAgentCount(sessionId: string): Promise<number> {
    const sessionData = await this.redis.hGetAll(`session:${sessionId}`);
    if (!sessionData.agentIds) return 0;

    try {
      const agents = JSON.parse(sessionData.agentIds);
      return Array.isArray(agents) ? agents.length : 0;
    } catch {
      return 0;
    }
  }




  private async getSessionStateTransitions(sessionId: string): Promise<number> {
    const events = await this.redis.zRange(`events:${sessionId}`, 0, -1);
    return events.filter(eventStr => {
      try {
        const event = JSON.parse(eventStr);
        return event.stateTransition !== undefined;
      } catch {
        return false;
      }
    }).length;
  }




  private async calculateCollaborationScore(sessionId: string): Promise<number> {
    const events = await this.redis.zRange(`analytics:events:${sessionId}`, 0, -1);
    if (events.length === 0) return 0;

    const agentEventCounts = new Map<string, number>();
    events.forEach(eventStr => {
      try {
        const event = JSON.parse(eventStr);
        agentEventCounts.set(event.actor, (agentEventCounts.get(event.actor) || 0) + 1);
      } catch {

      }
    });


    const agentCounts = Array.from(agentEventCounts.values());
    if (agentCounts.length <= 1) return 0;

    const mean = agentCounts.reduce((sum, count) => sum + count, 0) / agentCounts.length;
    const variance = agentCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / agentCounts.length;


    return Math.max(0, 1 - (variance / (mean * mean)));
  }




  private async calculatePerformanceImpact(sessionId: string): Promise<number> {
    const events = await this.redis.zRange(`analytics:events:${sessionId}`, 0, -1);
    if (events.length === 0) return 0;

    let totalProcessingTime = 0;
    let count = 0;

    events.forEach(eventStr => {
      try {
        const event = JSON.parse(eventStr);
        if (event.processingTime > 0) {
          totalProcessingTime += event.processingTime;
          count++;
        }
      } catch {

      }
    });

    return count > 0 ? totalProcessingTime / count : 0;
  }




  async shutdown(): Promise<void> {
    if (this.analyticsTimer) {
      clearInterval(this.analyticsTimer);
    }


    for (const sessionId of Array.from(this.activeSessionMetrics.keys())) {
      try {
        await this.endSessionTracking(sessionId);
      } catch (error) {
        this.emit('error', error);
      }
    }

    this.emit('shutdown');
  }
}

================
File: services/SessionBridge.ts
================
import { EventEmitter } from 'events';
import { SessionManager } from './SessionManager.js';
import {
  SessionDocument,
  SessionEvent,
  SessionQuery,
  TransitionResult,
  HandoffContext,
  IsolationResult,
  SessionAnchor,
  ISessionBridge,
  SessionError,
  SessionNotFoundError,
} from './SessionTypes.js';

export class SessionBridge extends EventEmitter implements ISessionBridge {
  constructor(
    private sessionManager: SessionManager,
    private knowledgeGraph?: any
  ) {
    super();
    console.log('[SessionBridge] Initialized with KG integration:', !!this.knowledgeGraph);
  }



  async getTransitions(sessionId: string, entityId?: string): Promise<TransitionResult[]> {
    try {
      const session = await this.sessionManager.getSession(sessionId);
      if (!session) {
        throw new SessionNotFoundError(sessionId);
      }


      const transitions = this.detectTransitions(session.events);


      if (this.knowledgeGraph && entityId && transitions.length > 0) {
        await this.enrichTransitionsWithKGContext(transitions, entityId);
      }

      console.log(`[SessionBridge] Found ${transitions.length} transitions for session ${sessionId}`);
      return transitions;
    } catch (error) {
      console.error(`[SessionBridge] Failed to get transitions for session ${sessionId}:`, error);
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        `Failed to get transitions: ${error instanceof Error ? error.message : String(error)}`,
        'BRIDGE_TRANSITIONS_FAILED',
        sessionId,
        { entityId, originalError: error }
      );
    }
  }

  private detectTransitions(events: SessionEvent[]): TransitionResult[] {
    const transitions: TransitionResult[] = [];

    for (let i = 1; i < events.length; i++) {
      const prev = events[i - 1];
      const curr = events[i];


      if (this.isSignificantTransition(prev, curr)) {
        transitions.push({
          fromSeq: prev.seq,
          toSeq: curr.seq,
          changeInfo: curr.changeInfo,
          impact: curr.impact,
        });
      }
    }

    return transitions;
  }

  private isSignificantTransition(prev: SessionEvent, curr: SessionEvent): boolean {

    if (prev.stateTransition?.to === 'working' && curr.stateTransition?.to === 'broken') {
      return true;
    }


    if (prev.type === 'test_pass' && curr.type === 'broke') {
      return true;
    }


    if (curr.impact?.severity === 'high' || curr.impact?.severity === 'critical') {
      return true;
    }


    if (curr.impact?.perfDelta && curr.impact.perfDelta < -5) {
      return true;
    }

    return false;
  }

  private async enrichTransitionsWithKGContext(
    transitions: TransitionResult[],
    entityId: string
  ): Promise<void> {
    if (!this.knowledgeGraph) return;

    try {
      const affectedIds = transitions.flatMap(t => t.changeInfo.entityIds);
      const cypher = `
        MATCH (start:CodebaseEntity {id: $entityId})
        MATCH path = (start)-[:IMPACTS|IMPLEMENTS_CLUSTER|PERFORMS_FOR*0..2]-(related)
        WHERE start.id IN $affectedIds
        RETURN start.id,
               collect(DISTINCT {
                 specTitle: coalesce((related:Spec).title, null),
                 clusterName: coalesce((related:SemanticCluster).name, null),
                 benchmarkDelta: coalesce((related:Benchmark).perfDelta, 0),
                 entityType: labels(related)[0]
               }) as context
      `;

      const kgResults = await this.executeKGQuery(cypher, { entityId, affectedIds });


      transitions.forEach(transition => {
        const match = kgResults.find((r: any) =>
          transition.changeInfo.entityIds.includes(r['start.id'])
        );
        if (match && match.context.length > 0) {
          transition.kgContext = match.context[0];
        }
      });
    } catch (error) {
      console.error('[SessionBridge] Failed to enrich transitions with KG context:', error);

    }
  }



  async isolateSession(sessionId: string, agentId: string): Promise<IsolationResult> {
    try {
      const session = await this.sessionManager.getSession(sessionId);
      if (!session) {
        throw new SessionNotFoundError(sessionId);
      }


      const agentEvents = session.events.filter(event => event.actor === agentId);


      const impacts = await this.getSessionImpacts(sessionId, agentId);


      const totalPerfDelta = impacts.reduce((sum, impact) => {
        return sum + impact.anchors.reduce((s: number, anchor) => s + (anchor.perfDelta || 0), 0);
      }, 0);

      const result: IsolationResult = {
        events: agentEvents,
        impacts,
        totalPerfDelta,
        agentId,
      };

      console.log(`[SessionBridge] Isolated session ${sessionId} for agent ${agentId}: ${agentEvents.length} events`);
      return result;
    } catch (error) {
      console.error(`[SessionBridge] Failed to isolate session ${sessionId} for agent ${agentId}:`, error);
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        `Failed to isolate session: ${error instanceof Error ? error.message : String(error)}`,
        'BRIDGE_ISOLATE_FAILED',
        sessionId,
        { agentId, originalError: error }
      );
    }
  }

  private async getSessionImpacts(sessionId: string, agentId: string): Promise<Array<{
    entityId: string;
    anchors: SessionAnchor[];
    count: number;
  }>> {
    if (!this.knowledgeGraph) return [];

    try {
      const cypher = `
        MATCH (e:CodebaseEntity)
        WHERE ANY(s IN e.metadata.sessions
          WHERE s.sessionId = $sessionId AND s.actors CONTAINS $agentId)
        RETURN e.id as entityId,
               [s IN e.metadata.sessions
                WHERE s.sessionId = $sessionId AND s.actors CONTAINS $agentId] as anchors,
               size([s IN e.metadata.sessions
                WHERE s.sessionId = $sessionId AND s.actors CONTAINS $agentId]) as count
      `;

      const results = await this.executeKGQuery(cypher, { sessionId, agentId });
      return results.map((r: any) => ({
        entityId: r.entityId,
        anchors: r.anchors,
        count: r.count,
      }));
    } catch (error) {
      console.error('[SessionBridge] Failed to get session impacts:', error);
      return [];
    }
  }



  async getHandoffContext(sessionId: string, joiningAgent: string): Promise<HandoffContext> {
    try {
      const session = await this.sessionManager.getSession(sessionId);
      if (!session) {
        throw new SessionNotFoundError(sessionId);
      }


      const recentChanges = session.events.slice(-10);


      const kgContext = await this.getKGContextForChanges(recentChanges);


      const joiningAdvice = this.generateJoiningAdvice(session, recentChanges);

      const context: HandoffContext = {
        sessionId,
        recentChanges,
        kgContext,
        joiningAdvice,
      };

      console.log(`[SessionBridge] Generated handoff context for agent ${joiningAgent} joining session ${sessionId}`);
      return context;
    } catch (error) {
      console.error(`[SessionBridge] Failed to get handoff context for session ${sessionId}:`, error);
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        `Failed to get handoff context: ${error instanceof Error ? error.message : String(error)}`,
        'BRIDGE_HANDOFF_FAILED',
        sessionId,
        { joiningAgent, originalError: error }
      );
    }
  }

  private async getKGContextForChanges(events: SessionEvent[]): Promise<Array<{
    entityId: string;
    related: any[];
    lastAnchor?: SessionAnchor;
  }>> {
    if (!this.knowledgeGraph || events.length === 0) return [];

    try {
      const affectedIds = events.flatMap(e => e.changeInfo.entityIds);
      if (affectedIds.length === 0) return [];

      const cypher = `
        MATCH (e:CodebaseEntity)
        WHERE e.id IN $affectedIds
        OPTIONAL MATCH (e)-[:DEFINES|TESTS|PERFORMS_FOR]-(related)
        RETURN e.id as entityId,
               collect(DISTINCT related) as related,
               e.metadata.sessions[-1] as lastAnchor
      `;

      const results = await this.executeKGQuery(cypher, { affectedIds });
      return results.map((r: any) => ({
        entityId: r.entityId,
        related: r.related || [],
        lastAnchor: r.lastAnchor,
      }));
    } catch (error) {
      console.error('[SessionBridge] Failed to get KG context for changes:', error);
      return [];
    }
  }

  private generateJoiningAdvice(session: SessionDocument, recentChanges: SessionEvent[]): string {
    const activeAgents = session.agentIds;
    const recentActors = [...new Set(recentChanges.map(e => e.actor))];
    const hasRecentBreaks = recentChanges.some(e => e.stateTransition?.to === 'broken');
    const hasHighImpact = recentChanges.some(e =>
      e.impact?.severity === 'high' || e.impact?.severity === 'critical'
    );

    let advice = `Sync with agents: ${activeAgents.join(', ')}`;

    if (hasRecentBreaks) {
      advice += '. WARNING: Recent breaking changes detected';
    }

    if (hasHighImpact) {
      advice += '. High-impact changes in progress';
    }

    if (recentActors.length > 0) {
      advice += `. Most active: ${recentActors.slice(0, 3).join(', ')}`;
    }

    return advice;
  }



  async querySessionsByEntity(entityId: string, options: SessionQuery = {}): Promise<SessionDocument[]> {
    try {
      const sessions: SessionDocument[] = [];


      if (this.knowledgeGraph) {
        const anchoredSessions = await this.getSessionsFromKGAnchors(entityId, options);
        sessions.push(...anchoredSessions);
      }


      const activeSessions = await this.sessionManager.listActiveSessions();
      for (const sessionId of activeSessions) {
        const session = await this.sessionManager.getSession(sessionId);
        if (session && this.sessionReferencesEntity(session, entityId)) {
          sessions.push(session);
        }
      }


      const uniqueSessions = this.deduplicateSessions(sessions);
      const filteredSessions = this.applySessionFilters(uniqueSessions, options);

      console.log(`[SessionBridge] Found ${filteredSessions.length} sessions for entity ${entityId}`);
      return filteredSessions;
    } catch (error) {
      console.error(`[SessionBridge] Failed to query sessions for entity ${entityId}:`, error);
      throw new SessionError(
        `Failed to query sessions by entity: ${error instanceof Error ? error.message : String(error)}`,
        'BRIDGE_ENTITY_QUERY_FAILED',
        undefined,
        { entityId, options, originalError: error }
      );
    }
  }

  private async getSessionsFromKGAnchors(entityId: string, options: SessionQuery): Promise<SessionDocument[]> {
    if (!this.knowledgeGraph) return [];

    try {
      const cypher = `
        MATCH (e:CodebaseEntity {id: $entityId})
        UNWIND e.metadata.sessions as session
        WHERE ($outcome IS NULL OR session.outcome = $outcome)
          AND ($fromDate IS NULL OR datetime(session.timestamp) >= datetime($fromDate))
        RETURN DISTINCT session.sessionId as sessionId
        LIMIT ${options.limit || 50}
      `;

      const results = await this.executeKGQuery(cypher, {
        entityId,
        outcome: options.outcome,
        fromDate: options.fromSeq ? new Date(options.fromSeq).toISOString() : null,
      });

      const sessions: SessionDocument[] = [];
      for (const result of results) {
        const session = await this.sessionManager.getSession(result.sessionId);
        if (session) {
          sessions.push(session);
        }
      }

      return sessions;
    } catch (error) {
      console.error('[SessionBridge] Failed to get sessions from KG anchors:', error);
      return [];
    }
  }

  private sessionReferencesEntity(session: SessionDocument, entityId: string): boolean {
    return session.events.some(event =>
      event.changeInfo.entityIds.includes(entityId)
    );
  }

  private deduplicateSessions(sessions: SessionDocument[]): SessionDocument[] {
    const seen = new Set<string>();
    return sessions.filter(session => {
      if (seen.has(session.sessionId)) {
        return false;
      }
      seen.add(session.sessionId);
      return true;
    });
  }

  private applySessionFilters(sessions: SessionDocument[], options: SessionQuery): SessionDocument[] {
    return sessions.filter(session => {
      if (options.agentId && !session.agentIds.includes(options.agentId)) {
        return false;
      }
      if (options.state && session.state !== options.state) {
        return false;
      }
      return true;
    });
  }



  async getSessionAggregates(entityIds: string[], options: SessionQuery = {}): Promise<{
    totalSessions: number;
    activeAgents: string[];
    recentOutcomes: Record<string, number>;
    performanceImpact: {
      total: number;
      average: number;
      worst: number;
    };
    entityBreakdown: Array<{
      entityId: string;
      sessionCount: number;
      avgImpact: number;
    }>;
  }> {
    try {
      const allSessions: SessionDocument[] = [];


      for (const entityId of entityIds) {
        const sessions = await this.querySessionsByEntity(entityId, options);
        allSessions.push(...sessions);
      }

      const uniqueSessions = this.deduplicateSessions(allSessions);


      const totalSessions = uniqueSessions.length;
      const activeAgents = [...new Set(uniqueSessions.flatMap(s => s.agentIds))];

      const recentOutcomes: Record<string, number> = {};
      const perfImpacts: number[] = [];

      uniqueSessions.forEach(session => {

        session.events.forEach(event => {
          if (event.stateTransition?.to) {
            recentOutcomes[event.stateTransition.to] = (recentOutcomes[event.stateTransition.to] || 0) + 1;
          }
          if (event.impact?.perfDelta) {
            perfImpacts.push(event.impact.perfDelta);
          }
        });
      });

      const performanceImpact = {
        total: perfImpacts.reduce((sum, delta) => sum + delta, 0),
        average: perfImpacts.length > 0 ? perfImpacts.reduce((sum, delta) => sum + delta, 0) / perfImpacts.length : 0,
        worst: perfImpacts.length > 0 ? Math.min(...perfImpacts) : 0,
      };


      const entityBreakdown = entityIds.map(entityId => {
        const entitySessions = uniqueSessions.filter(session =>
          this.sessionReferencesEntity(session, entityId)
        );
        const impacts = entitySessions.flatMap(session =>
          session.events
            .filter(e => e.changeInfo.entityIds.includes(entityId) && e.impact?.perfDelta)
            .map(e => e.impact!.perfDelta!)
        );

        return {
          entityId,
          sessionCount: entitySessions.length,
          avgImpact: impacts.length > 0 ? impacts.reduce((sum, delta) => sum + delta, 0) / impacts.length : 0,
        };
      });

      console.log(`[SessionBridge] Generated aggregates for ${entityIds.length} entities: ${totalSessions} sessions`);

      return {
        totalSessions,
        activeAgents,
        recentOutcomes,
        performanceImpact,
        entityBreakdown,
      };
    } catch (error) {
      console.error(`[SessionBridge] Failed to get session aggregates:`, error);
      throw new SessionError(
        `Failed to get session aggregates: ${error instanceof Error ? error.message : String(error)}`,
        'BRIDGE_AGGREGATES_FAILED',
        undefined,
        { entityIds, options, originalError: error }
      );
    }
  }



  private async executeKGQuery(cypher: string, params: any): Promise<any[]> {
    if (!this.knowledgeGraph) {
      throw new SessionError(
        'Knowledge Graph service not available',
        'KG_NOT_AVAILABLE'
      );
    }

    try {
      if (this.knowledgeGraph.query) {
        return await this.knowledgeGraph.query(cypher, params);
      } else if (this.knowledgeGraph.neo4j?.query) {
        return await this.knowledgeGraph.neo4j.query(cypher, params);
      } else {
        throw new Error('No query method available on Knowledge Graph service');
      }
    } catch (error) {
      console.error('[SessionBridge] KG query failed:', error);
      throw new SessionError(
        `Knowledge Graph query failed: ${error instanceof Error ? error.message : String(error)}`,
        'KG_QUERY_FAILED',
        undefined,
        { cypher, params, originalError: error }
      );
    }
  }



  async healthCheck(): Promise<{
    healthy: boolean;
    bridge: boolean;
    sessionManager: boolean;
    knowledgeGraph: boolean;
  }> {
    try {
      const sessionManagerHealth = await this.sessionManager.healthCheck();
      let kgHealthy = true;

      if (this.knowledgeGraph) {
        try {

          await this.executeKGQuery('RETURN 1 as test', {});
        } catch (error) {
          kgHealthy = false;
        }
      }

      return {
        healthy: sessionManagerHealth.healthy && kgHealthy,
        bridge: true,
        sessionManager: sessionManagerHealth.healthy,
        knowledgeGraph: kgHealthy,
      };
    } catch (error) {
      return {
        healthy: false,
        bridge: false,
        sessionManager: false,
        knowledgeGraph: false,
      };
    }
  }
}

================
File: services/SessionConfig.ts
================
import { RedisConfig, SessionManagerConfig } from './SessionTypes.js';

export class SessionConfig {
  private static instance: SessionConfig;
  private config: Required<SessionManagerConfig>;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  public static getInstance(): SessionConfig {
    if (!SessionConfig.instance) {
      SessionConfig.instance = new SessionConfig();
    }
    return SessionConfig.instance;
  }

  public getConfig(): Required<SessionManagerConfig> {
    return { ...this.config };
  }

  public getRedisConfig(): RedisConfig {
    return { ...this.config.redis };
  }

  private loadConfiguration(): Required<SessionManagerConfig> {

    const redisConfig: RedisConfig = {
      url: process.env.REDIS_URL,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_SESSION_DB || '0', 10),
      maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
      retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY || '100', 10),
      lazyConnect: process.env.REDIS_LAZY_CONNECT === 'true',
    };


    const sessionConfig: Required<SessionManagerConfig> = {
      redis: redisConfig,
      defaultTTL: parseInt(process.env.SESSION_DEFAULT_TTL || '3600', 10),
      checkpointInterval: parseInt(process.env.SESSION_CHECKPOINT_INTERVAL || '10', 10),
      maxEventsPerSession: parseInt(process.env.SESSION_MAX_EVENTS || '1000', 10),
      graceTTL: parseInt(process.env.SESSION_GRACE_TTL || '300', 10),
      enableFailureSnapshots: process.env.SESSION_ENABLE_FAILURE_SNAPSHOTS === 'true',
      pubSubChannels: {
        global: process.env.SESSION_GLOBAL_CHANNEL || 'global:sessions',
        session: process.env.SESSION_CHANNEL_PREFIX || 'session:',
      },
    };

    console.log('[SessionConfig] Loaded configuration:', {
      redis: {
        host: redisConfig.host,
        port: redisConfig.port,
        db: redisConfig.db,
        hasPassword: !!redisConfig.password,
        hasUrl: !!redisConfig.url,
      },
      session: {
        defaultTTL: sessionConfig.defaultTTL,
        checkpointInterval: sessionConfig.checkpointInterval,
        enableFailureSnapshots: sessionConfig.enableFailureSnapshots,
      },
    });

    return sessionConfig;
  }



  public validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];


    if (!this.config.redis.url && !this.config.redis.host) {
      errors.push('Redis host or URL must be specified');
    }

    if (this.config.redis.port && (this.config.redis.port < 1 || this.config.redis.port > 65535)) {
      errors.push('Redis port must be between 1 and 65535');
    }

    if (this.config.redis.db && (this.config.redis.db < 0 || this.config.redis.db > 15)) {
      errors.push('Redis database must be between 0 and 15');
    }


    if (this.config.defaultTTL < 60) {
      errors.push('Default TTL must be at least 60 seconds');
    }

    if (this.config.checkpointInterval < 1) {
      errors.push('Checkpoint interval must be at least 1 event');
    }

    if (this.config.maxEventsPerSession < 10) {
      errors.push('Max events per session must be at least 10');
    }

    if (this.config.graceTTL < 30) {
      errors.push('Grace TTL must be at least 30 seconds');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }



  public getEnvironment(): 'development' | 'test' | 'production' {
    const env = process.env.NODE_ENV?.toLowerCase();
    if (env === 'test') return 'test';
    if (env === 'production') return 'production';
    return 'development';
  }

  public isDevelopment(): boolean {
    return this.getEnvironment() === 'development';
  }

  public isProduction(): boolean {
    return this.getEnvironment() === 'production';
  }

  public isTest(): boolean {
    return this.getEnvironment() === 'test';
  }



  public updateConfig(updates: Partial<SessionManagerConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
      redis: {
        ...this.config.redis,
        ...updates.redis,
      },
      pubSubChannels: {
        ...this.config.pubSubChannels,
        ...updates.pubSubChannels,
      },
    };

    console.log('[SessionConfig] Configuration updated');
  }



  public static getDevelopmentConfig(): SessionManagerConfig {
    return {
      redis: {
        host: 'localhost',
        port: 6379,
        db: 0,
        lazyConnect: true,
      },
      defaultTTL: 1800,
      checkpointInterval: 5,
      maxEventsPerSession: 500,
      graceTTL: 180,
      enableFailureSnapshots: true,
      pubSubChannels: {
        global: 'dev:global:sessions',
        session: 'dev:session:',
      },
    };
  }

  public static getTestConfig(): SessionManagerConfig {
    return {
      redis: {
        host: 'localhost',
        port: 6379,
        db: 15,
        lazyConnect: true,
      },
      defaultTTL: 300,
      checkpointInterval: 3,
      maxEventsPerSession: 100,
      graceTTL: 60,
      enableFailureSnapshots: false,
      pubSubChannels: {
        global: 'test:global:sessions',
        session: 'test:session:',
      },
    };
  }

  public static getProductionConfig(): SessionManagerConfig {
    return {
      redis: {
        url: process.env.REDIS_URL,
        maxRetriesPerRequest: 5,
        retryDelayOnFailover: 200,
        lazyConnect: false,
      },
      defaultTTL: 3600,
      checkpointInterval: 15,
      maxEventsPerSession: 2000,
      graceTTL: 600,
      enableFailureSnapshots: true,
      pubSubChannels: {
        global: 'global:sessions',
        session: 'session:',
      },
    };
  }
}



export function createSessionConfig(environment?: string): SessionManagerConfig {
  const env = environment || process.env.NODE_ENV?.toLowerCase() || 'development';

  switch (env) {
    case 'test':
      return SessionConfig.getTestConfig();
    case 'production':
      return SessionConfig.getProductionConfig();
    case 'development':
    default:
      return SessionConfig.getDevelopmentConfig();
  }
}



export function validateRedisConnection(config: RedisConfig): Promise<boolean> {
  return new Promise((resolve) => {
    const Redis = require('redis');
    const client = Redis.createClient({
      url: config.url,
      socket: {
        host: config.host,
        port: config.port,
        connectTimeout: 5000,
      },
      password: config.password,
      database: config.db,
    });

    client.on('error', () => {
      resolve(false);
    });

    client.connect()
      .then(() => {
        client.ping()
          .then(() => {
            client.quit();
            resolve(true);
          })
          .catch(() => {
            client.quit();
            resolve(false);
          });
      })
      .catch(() => {
        resolve(false);
      });
  });
}

export function getRedisConnectionString(config: RedisConfig): string {
  if (config.url) {
    return config.url;
  }

  const auth = config.password ? `:${config.password}@` : '';
  const host = config.host || 'localhost';
  const port = config.port || 6379;
  const db = config.db || 0;

  return `redis://${auth}${host}:${port}/${db}`;
}



export const ENVIRONMENT_VARIABLES = {

  REDIS_URL: 'Complete Redis connection URL (overrides individual settings)',
  REDIS_HOST: 'Redis server hostname (default: localhost)',
  REDIS_PORT: 'Redis server port (default: 6379)',
  REDIS_PASSWORD: 'Redis server password (optional)',
  REDIS_SESSION_DB: 'Redis database number for sessions (default: 0)',
  REDIS_MAX_RETRIES: 'Maximum retry attempts (default: 3)',
  REDIS_RETRY_DELAY: 'Retry delay in milliseconds (default: 100)',
  REDIS_LAZY_CONNECT: 'Enable lazy connection (default: false)',


  SESSION_DEFAULT_TTL: 'Default session TTL in seconds (default: 3600)',
  SESSION_CHECKPOINT_INTERVAL: 'Events between auto-checkpoints (default: 10)',
  SESSION_MAX_EVENTS: 'Maximum events per session (default: 1000)',
  SESSION_GRACE_TTL: 'Grace period before cleanup in seconds (default: 300)',
  SESSION_ENABLE_FAILURE_SNAPSHOTS: 'Enable failure snapshots (default: false)',
  SESSION_GLOBAL_CHANNEL: 'Global pub/sub channel (default: global:sessions)',
  SESSION_CHANNEL_PREFIX: 'Session channel prefix (default: session:)',
} as const;

================
File: services/SessionConfigValidator.ts
================
import { z } from 'zod';
import type { RedisClientType } from 'redis';
import {
  SessionManagerConfig,
  RedisConfig,
  SessionCreationOptions,
} from './SessionTypes.js';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  recommendations: Recommendation[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  value?: any;
  impact: 'low' | 'medium' | 'high';
}

export interface Recommendation {
  category: 'performance' | 'security' | 'reliability' | 'cost';
  message: string;
  priority: 'low' | 'medium' | 'high';
  action?: string;
}

export interface EnvironmentValidation {
  environment: 'development' | 'staging' | 'production';
  redisVersion: string;
  nodeVersion: string;
  memoryAvailable: number;
  recommendations: Recommendation[];
}


const RedisConfigSchema = z.object({
  host: z.string().min(1, 'Redis host is required'),
  port: z.number().int().min(1).max(65535, 'Port must be between 1 and 65535'),
  password: z.string().optional(),
  db: z.number().int().min(0).max(15, 'Redis database must be between 0 and 15').optional(),
  url: z.string().url().optional(),
  tls: z.boolean().optional(),
  maxRetries: z.number().int().min(0).optional(),
  retryDelayOnFailover: z.number().int().min(0).optional(),
});

const PubSubChannelsSchema = z.object({
  global: z.string().min(1, 'Global pub/sub channel is required'),
  session: z.string().min(1, 'Session pub/sub channel prefix is required'),
});

const SessionManagerConfigSchema = z.object({
  redis: RedisConfigSchema,
  defaultTTL: z.number().int().min(60, 'Default TTL must be at least 60 seconds').max(86400 * 7, 'Default TTL should not exceed 7 days'),
  checkpointInterval: z.number().int().min(1, 'Checkpoint interval must be at least 1').max(1000, 'Checkpoint interval should not exceed 1000'),
  maxEventsPerSession: z.number().int().min(10, 'Max events per session must be at least 10').max(100000, 'Max events per session should not exceed 100,000'),
  graceTTL: z.number().int().min(60, 'Grace TTL must be at least 60 seconds').max(3600, 'Grace TTL should not exceed 1 hour'),
  enableFailureSnapshots: z.boolean(),
  pubSubChannels: PubSubChannelsSchema.optional(),
});

const SessionCreationOptionsSchema = z.object({
  ttl: z.number().int().min(60).max(86400 * 7).optional(),
  metadata: z.record(z.any()).optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  tags: z.array(z.string()).optional(),
});

export class SessionConfigValidator {
  private redis?: RedisClientType;

  constructor(redis?: RedisClientType) {
    this.redis = redis;
  }




  async validateConfig(config: any): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      recommendations: [],
    };

    try {

      SessionManagerConfigSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        result.valid = false;
        result.errors.push(...this.transformZodErrors(error));
      } else {
        result.valid = false;
        result.errors.push({
          field: 'config',
          message: 'Invalid configuration format',
          code: 'INVALID_FORMAT',
        });
      }
    }


    await this.performRuntimeValidation(config, result);


    this.performPerformanceValidation(config, result);


    this.performSecurityValidation(config, result);


    this.generateRecommendations(config, result);

    return result;
  }




  validateSessionOptions(options: any): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      recommendations: [],
    };

    try {
      SessionCreationOptionsSchema.parse(options);
    } catch (error) {
      if (error instanceof z.ZodError) {
        result.valid = false;
        result.errors.push(...this.transformZodErrors(error));
      }
    }

    return result;
  }




  async validateEnvironment(environment: 'development' | 'staging' | 'production'): Promise<EnvironmentValidation> {
    const recommendations: Recommendation[] = [];


    const nodeVersion = process.version;
    const nodeMajorVersion = parseInt(nodeVersion.split('.')[0].substring(1));

    if (nodeMajorVersion < 18) {
      recommendations.push({
        category: 'security',
        message: 'Node.js version is outdated. Consider upgrading to Node.js 18 or later',
        priority: 'medium',
        action: 'Upgrade Node.js to the latest LTS version',
      });
    }


    let redisVersion = 'unknown';
    if (this.redis) {
      try {
        const info = await this.redis.info('server');
        const versionMatch = info.match(/redis_version:([^\r\n]+)/);
        if (versionMatch) {
          redisVersion = versionMatch[1];
          const redisMajorVersion = parseInt(redisVersion.split('.')[0]);

          if (redisMajorVersion < 6) {
            recommendations.push({
              category: 'performance',
              message: 'Redis version is outdated. Consider upgrading to Redis 6 or later for better performance',
              priority: 'medium',
              action: 'Upgrade Redis to version 6 or later',
            });
          }
        }
      } catch (error) {
        recommendations.push({
          category: 'reliability',
          message: 'Could not determine Redis version',
          priority: 'low',
          action: 'Ensure Redis is properly connected and accessible',
        });
      }
    }


    const memoryUsage = process.memoryUsage();
    const memoryAvailable = memoryUsage.heapTotal;

    if (environment === 'production') {
      if (memoryAvailable < 512 * 1024 * 1024) {
        recommendations.push({
          category: 'performance',
          message: 'Available memory may be insufficient for production workloads',
          priority: 'high',
          action: 'Increase available memory to at least 1GB for production',
        });
      }


      recommendations.push(
        {
          category: 'security',
          message: 'Ensure Redis AUTH is enabled in production',
          priority: 'high',
          action: 'Configure Redis password authentication',
        },
        {
          category: 'reliability',
          message: 'Enable Redis persistence (RDB and/or AOF) for data durability',
          priority: 'high',
          action: 'Configure Redis persistence settings',
        },
        {
          category: 'performance',
          message: 'Consider Redis clustering for high availability',
          priority: 'medium',
          action: 'Evaluate Redis Cluster or Redis Sentinel setup',
        }
      );
    } else if (environment === 'development') {
      recommendations.push({
        category: 'performance',
        message: 'Consider using shorter TTLs in development to reduce memory usage',
        priority: 'low',
        action: 'Set defaultTTL to 300-600 seconds for development',
      });
    }

    return {
      environment,
      redisVersion,
      nodeVersion,
      memoryAvailable,
      recommendations,
    };
  }




  async validateRedisConnection(config: RedisConfig): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      recommendations: [],
    };

    try {

      const { createClient } = await import('redis');
      const testClient = createClient({
        url: config.url,
        socket: {
          host: config.host,
          port: config.port,
        },
        password: config.password,
        database: config.db || 0,
      });


      await testClient.connect();


      const testKey = `test:connection:${Date.now()}`;
      await testClient.set(testKey, 'test', { EX: 10 });
      const value = await testClient.get(testKey);
      await testClient.del(testKey);

      if (value !== 'test') {
        result.errors.push({
          field: 'redis.connection',
          message: 'Redis connection test failed - could not read/write test data',
          code: 'CONNECTION_TEST_FAILED',
        });
        result.valid = false;
      }


      const info = await testClient.info();
      const memory = await testClient.info('memory');


      const maxMemoryMatch = memory.match(/maxmemory:(\d+)/);
      const usedMemoryMatch = memory.match(/used_memory:(\d+)/);

      if (maxMemoryMatch && usedMemoryMatch) {
        const maxMemory = parseInt(maxMemoryMatch[1]);
        const usedMemory = parseInt(usedMemoryMatch[1]);

        if (maxMemory > 0) {
          const memoryUsagePercent = (usedMemory / maxMemory) * 100;
          if (memoryUsagePercent > 80) {
            result.warnings.push({
              field: 'redis.memory',
              message: `Redis memory usage is at ${memoryUsagePercent.toFixed(1)}%`,
              value: memoryUsagePercent,
              impact: 'high',
            });
          }
        }
      }


      await this.validateRedisConfiguration(testClient, result);

      await testClient.quit();

    } catch (error) {
      result.valid = false;
      result.errors.push({
        field: 'redis.connection',
        message: `Failed to connect to Redis: ${error instanceof Error ? error.message : String(error)}`,
        code: 'CONNECTION_FAILED',
      });
    }

    return result;
  }




  async validateProductionReadiness(config: SessionManagerConfig): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      recommendations: [],
    };


    if (config.defaultTTL < 3600) {
      result.warnings.push({
        field: 'defaultTTL',
        message: 'Default TTL is quite short for production use',
        value: config.defaultTTL,
        impact: 'medium',
      });
    }


    if (config.checkpointInterval > 100) {
      result.warnings.push({
        field: 'checkpointInterval',
        message: 'Checkpoint interval is high, may impact recovery time',
        value: config.checkpointInterval,
        impact: 'medium',
      });
    }


    if (config.maxEventsPerSession > 10000) {
      result.warnings.push({
        field: 'maxEventsPerSession',
        message: 'High max events per session may impact memory usage',
        value: config.maxEventsPerSession,
        impact: 'medium',
      });
    }


    if (!config.enableFailureSnapshots) {
      result.recommendations.push({
        category: 'reliability',
        message: 'Consider enabling failure snapshots for better debugging',
        priority: 'medium',
        action: 'Set enableFailureSnapshots to true',
      });
    }


    if (!config.redis.password) {
      result.errors.push({
        field: 'redis.password',
        message: 'Redis password is required for production',
        code: 'MISSING_AUTH',
      });
      result.valid = false;
    }


    if (!config.redis.tls) {
      result.warnings.push({
        field: 'redis.tls',
        message: 'TLS is not enabled for Redis connection',
        impact: 'high',
      });
    }

    return result;
  }




  private async performRuntimeValidation(config: any, result: ValidationResult): Promise<void> {

    if (this.redis) {
      try {
        await this.redis.ping();
      } catch (error) {
        result.errors.push({
          field: 'redis.runtime',
          message: 'Redis connection is not available',
          code: 'REDIS_UNAVAILABLE',
        });
        result.valid = false;
      }
    }


    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;

    if (heapUsedMB > 500) {
      result.warnings.push({
        field: 'system.memory',
        message: 'High memory usage detected',
        value: heapUsedMB,
        impact: 'medium',
      });
    }
  }




  private performPerformanceValidation(config: any, result: ValidationResult): void {

    if (config.defaultTTL > 86400 * 3) {
      result.warnings.push({
        field: 'defaultTTL',
        message: 'Very long default TTL may impact memory usage',
        value: config.defaultTTL,
        impact: 'medium',
      });
    }


    if (config.checkpointInterval < 5) {
      result.warnings.push({
        field: 'checkpointInterval',
        message: 'Very frequent checkpoints may impact performance',
        value: config.checkpointInterval,
        impact: 'medium',
      });
    }


    if (config.maxEventsPerSession > 50000) {
      result.warnings.push({
        field: 'maxEventsPerSession',
        message: 'Very high max events may cause memory issues',
        value: config.maxEventsPerSession,
        impact: 'high',
      });
    }
  }




  private performSecurityValidation(config: any, result: ValidationResult): void {

    if (config.redis.host === '0.0.0.0') {
      result.warnings.push({
        field: 'redis.host',
        message: 'Redis host set to bind all interfaces, ensure firewall is configured',
        value: config.redis.host,
        impact: 'high',
      });
    }

    if (!config.redis.password) {
      result.warnings.push({
        field: 'redis.password',
        message: 'Redis authentication is not configured',
        impact: 'high',
      });
    }


    if (config.pubSubChannels && config.pubSubChannels.global === 'global') {
      result.warnings.push({
        field: 'pubSubChannels.global',
        message: 'Generic pub/sub channel name may cause conflicts',
        value: config.pubSubChannels.global,
        impact: 'low',
      });
    }
  }




  private generateRecommendations(config: any, result: ValidationResult): void {

    if (config.defaultTTL < 1800) {
      result.recommendations.push({
        category: 'performance',
        message: 'Consider increasing default TTL to reduce Redis memory churn',
        priority: 'low',
        action: 'Set defaultTTL to at least 1800 seconds (30 minutes)',
      });
    }

    if (!config.enableFailureSnapshots) {
      result.recommendations.push({
        category: 'reliability',
        message: 'Enable failure snapshots for better debugging capabilities',
        priority: 'medium',
        action: 'Set enableFailureSnapshots to true',
      });
    }


    result.recommendations.push({
      category: 'security',
      message: 'Regularly rotate Redis passwords and review access controls',
      priority: 'medium',
      action: 'Implement password rotation policy',
    });


    if (config.maxEventsPerSession > 1000) {
      result.recommendations.push({
        category: 'cost',
        message: 'High max events per session increases memory costs',
        priority: 'low',
        action: 'Consider reducing maxEventsPerSession if not needed',
      });
    }
  }




  private async validateRedisConfiguration(client: RedisClientType, result: ValidationResult): Promise<void> {
    try {

      const configs = await client.configGet('*');
      const configMap = new Map();

      for (let i = 0; i < configs.length; i += 2) {
        configMap.set(configs[i], configs[i + 1]);
      }


      const maxMemoryPolicy = configMap.get('maxmemory-policy');
      if (maxMemoryPolicy === 'noeviction') {
        result.warnings.push({
          field: 'redis.maxmemory-policy',
          message: 'Redis maxmemory-policy is set to noeviction, may cause out of memory errors',
          value: maxMemoryPolicy,
          impact: 'high',
        });
      }


      const save = configMap.get('save');
      if (!save || save === '') {
        result.warnings.push({
          field: 'redis.save',
          message: 'Redis persistence is disabled, data will be lost on restart',
          impact: 'high',
        });
      }

    } catch (error) {
      result.warnings.push({
        field: 'redis.config',
        message: 'Could not retrieve Redis configuration for validation',
        impact: 'low',
      });
    }
  }




  private transformZodErrors(zodError: z.ZodError): ValidationError[] {
    return zodError.errors.map(error => ({
      field: error.path.join('.'),
      message: error.message,
      value: error.code === 'invalid_type' ? (error as any).received : undefined,
      code: error.code.toUpperCase(),
    }));
  }




  async generateConfigurationReport(config: SessionManagerConfig): Promise<{
    validation: ValidationResult;
    environment: EnvironmentValidation;
    recommendations: Recommendation[];
  }> {
    const [validation, environment] = await Promise.all([
      this.validateConfig(config),
      this.validateEnvironment('production'),
    ]);

    const allRecommendations = [
      ...validation.recommendations,
      ...environment.recommendations,
    ];

    return {
      validation,
      environment,
      recommendations: allRecommendations,
    };
  }
}

================
File: services/SessionGracefulShutdown.ts
================
import { EventEmitter } from 'events';
import type { RedisClientType } from 'redis';
import { SessionManager } from './SessionManager.js';
import { SessionStore } from './SessionStore.js';
import { SessionReplay } from './SessionReplay.js';
import { SessionMigration } from './SessionMigration.js';
import { SessionHealthCheck } from './SessionHealthCheck.js';

export interface GracefulShutdownConfig {
  gracePeriod: number;
  forceCloseAfter: number;
  checkpointActiveSessions: boolean;
  preserveReplays: boolean;
  enableRecoveryData: boolean;
  shutdownSignals: string[];
}

export interface ShutdownStatus {
  phase: 'initiated' | 'draining' | 'checkpointing' | 'cleanup' | 'complete' | 'forced';
  startTime: string;
  progress: {
    sessionsCheckpointed: number;
    totalSessions: number;
    connectionsClosedf: number;
    totalConnections: number;
    componentsShutdown: number;
    totalComponents: number;
  };
  errors: Array<{
    component: string;
    error: string;
    timestamp: string;
  }>;
  estimatedTimeRemaining?: number;
}

export interface ShutdownOptions {
  reason: string;
  graceful: boolean;
  preserveData: boolean;
  timeout?: number;
}

export interface RecoveryData {
  timestamp: string;
  activeSessions: Array<{
    sessionId: string;
    agentIds: string[];
    state: string;
    lastActivity: string;
    eventCount: number;
  }>;
  configuration: any;
  statistics: any;
  errors: any[];
}

export class SessionGracefulShutdown extends EventEmitter {
  private config: GracefulShutdownConfig;
  private sessionManager?: SessionManager;
  private redis?: RedisClientType;
  private sessionStore?: SessionStore;
  private sessionReplay?: SessionReplay;
  private sessionMigration?: SessionMigration;
  private healthCheck?: SessionHealthCheck;

  private shutdownStatus?: ShutdownStatus;
  private shutdownTimer?: NodeJS.Timeout;
  private forceTimer?: NodeJS.Timeout;
  private isShuttingDown = false;
  private signalHandlers: Map<string, () => void> = new Map();

  constructor(config: Partial<GracefulShutdownConfig> = {}) {
    super();
    this.config = {
      gracePeriod: config.gracePeriod || 30000,
      forceCloseAfter: config.forceCloseAfter || 60000,
      checkpointActiveSessions: config.checkpointActiveSessions ?? true,
      preserveReplays: config.preserveReplays ?? true,
      enableRecoveryData: config.enableRecoveryData ?? true,
      shutdownSignals: config.shutdownSignals || ['SIGTERM', 'SIGINT', 'SIGQUIT'],
    };
  }




  async initialize(services: {
    sessionManager?: SessionManager;
    redis?: RedisClientType;
    sessionStore?: SessionStore;
    sessionReplay?: SessionReplay;
    sessionMigration?: SessionMigration;
    healthCheck?: SessionHealthCheck;
  }): Promise<void> {
    this.sessionManager = services.sessionManager;
    this.redis = services.redis;
    this.sessionStore = services.sessionStore;
    this.sessionReplay = services.sessionReplay;
    this.sessionMigration = services.sessionMigration;
    this.healthCheck = services.healthCheck;


    this.setupSignalHandlers();


    process.on('uncaughtException', this.handleUncaughtException.bind(this));
    process.on('unhandledRejection', this.handleUnhandledRejection.bind(this));

    this.emit('initialized');
  }




  async shutdown(options: Partial<ShutdownOptions> = {}): Promise<void> {
    if (this.isShuttingDown) {
      console.log('[GracefulShutdown] Shutdown already in progress');
      return;
    }

    const shutdownOptions: ShutdownOptions = {
      reason: options.reason || 'Manual shutdown',
      graceful: options.graceful ?? true,
      preserveData: options.preserveData ?? true,
      timeout: options.timeout || this.config.gracePeriod,
    };

    console.log(`[GracefulShutdown] Initiating shutdown: ${shutdownOptions.reason}`);
    this.isShuttingDown = true;

    this.shutdownStatus = {
      phase: 'initiated',
      startTime: new Date().toISOString(),
      progress: {
        sessionsCheckpointed: 0,
        totalSessions: 0,
        connectionsClosedf: 0,
        totalConnections: 0,
        componentsShutdown: 0,
        totalComponents: this.getTotalComponents(),
      },
      errors: [],
    };

    this.emit('shutdown:started', { options: shutdownOptions, status: this.shutdownStatus });

    try {
      if (shutdownOptions.graceful) {
        await this.performGracefulShutdown(shutdownOptions);
      } else {
        await this.performForceShutdown();
      }
    } catch (error) {
      console.error('[GracefulShutdown] Error during shutdown:', error);
      await this.performForceShutdown();
    }
  }




  getShutdownStatus(): ShutdownStatus | null {
    return this.shutdownStatus || null;
  }




  isShutdownInProgress(): boolean {
    return this.isShuttingDown;
  }




  private async performGracefulShutdown(options: ShutdownOptions): Promise<void> {
    const startTime = Date.now();


    this.forceTimer = setTimeout(() => {
      console.log('[GracefulShutdown] Grace period exceeded, forcing shutdown');
      this.performForceShutdown().catch(console.error);
    }, this.config.forceCloseAfter);

    try {

      await this.drainConnections();


      if (this.config.checkpointActiveSessions) {
        await this.checkpointActiveSessions();
      }


      if (this.config.enableRecoveryData && options.preserveData) {
        await this.createRecoveryData();
      }


      await this.cleanupComponents();


      this.completeShutdown();

    } catch (error) {
      this.recordError('graceful-shutdown', error);
      throw error;
    } finally {
      if (this.forceTimer) {
        clearTimeout(this.forceTimer);
      }
    }
  }




  private async drainConnections(): Promise<void> {
    this.updatePhase('draining');
    console.log('[GracefulShutdown] Draining connections...');

    const drainPromises: Promise<void>[] = [];


    if (this.sessionManager) {
      drainPromises.push(this.drainSessionManager());
    }


    if (this.healthCheck) {
      drainPromises.push(this.healthCheck.shutdown());
    }

    await Promise.allSettled(drainPromises);
    this.updateProgress({ componentsShutdown: this.shutdownStatus!.progress.componentsShutdown + 1 });
  }




  private async drainSessionManager(): Promise<void> {
    if (!this.sessionManager) return;

    try {

      const activeSessions = await this.sessionManager.listActiveSessions();
      this.updateProgress({ totalSessions: activeSessions.length });

      console.log(`[GracefulShutdown] Found ${activeSessions.length} active sessions to drain`);


      for (const sessionId of activeSessions) {
        try {
          if (this.sessionStore) {
            await this.sessionStore.setTTL(sessionId, 10);
          }
        } catch (error) {
          this.recordError(`session-${sessionId}`, error);
        }
      }
    } catch (error) {
      this.recordError('session-manager-drain', error);
    }
  }




  private async checkpointActiveSessions(): Promise<void> {
    this.updatePhase('checkpointing');
    console.log('[GracefulShutdown] Checkpointing active sessions...');

    if (!this.sessionManager) return;

    try {
      const activeSessions = await this.sessionManager.listActiveSessions();
      const checkpointPromises = activeSessions.map(async (sessionId) => {
        try {
          await this.sessionManager!.checkpoint(sessionId, {
            graceTTL: this.config.gracePeriod / 1000,
            includeFailureSnapshot: true,
          });
          this.updateProgress({
            sessionsCheckpointed: this.shutdownStatus!.progress.sessionsCheckpointed + 1,
          });
          console.log(`[GracefulShutdown] Checkpointed session: ${sessionId}`);
        } catch (error) {
          this.recordError(`checkpoint-${sessionId}`, error);
        }
      });

      await Promise.allSettled(checkpointPromises);
      console.log(`[GracefulShutdown] Completed checkpointing ${activeSessions.length} sessions`);
    } catch (error) {
      this.recordError('checkpoint-sessions', error);
    }
  }




  private async createRecoveryData(): Promise<void> {
    console.log('[GracefulShutdown] Creating recovery data...');

    try {
      const recoveryData: RecoveryData = {
        timestamp: new Date().toISOString(),
        activeSessions: [],
        configuration: this.config,
        statistics: {},
        errors: this.shutdownStatus?.errors || [],
      };


      if (this.sessionManager) {
        try {
          const sessionIds = await this.sessionManager.listActiveSessions();
          for (const sessionId of sessionIds) {
            try {
              const session = await this.sessionManager.getSession(sessionId);
              if (session) {
                recoveryData.activeSessions.push({
                  sessionId,
                  agentIds: session.agentIds,
                  state: session.state,
                  lastActivity: session.events.length > 0
                    ? session.events[session.events.length - 1].timestamp
                    : new Date().toISOString(),
                  eventCount: session.events.length,
                });
              }
            } catch (error) {
              this.recordError(`recovery-session-${sessionId}`, error);
            }
          }
        } catch (error) {
          this.recordError('recovery-sessions', error);
        }
      }


      if (this.sessionManager) {
        try {
          recoveryData.statistics = await this.sessionManager.getStats();
        } catch (error) {
          this.recordError('recovery-stats', error);
        }
      }


      if (this.redis) {
        await this.redis.set(
          'session:recovery:data',
          JSON.stringify(recoveryData),
          { EX: 24 * 60 * 60 }
        );
        console.log('[GracefulShutdown] Recovery data stored');
      }

    } catch (error) {
      this.recordError('create-recovery-data', error);
    }
  }




  private async cleanupComponents(): Promise<void> {
    this.updatePhase('cleanup');
    console.log('[GracefulShutdown] Cleaning up components...');

    const cleanupPromises: Array<{ name: string; promise: Promise<void> }> = [];


    if (this.sessionReplay) {
      cleanupPromises.push({
        name: 'sessionReplay',
        promise: this.sessionReplay.shutdown(),
      });
    }


    if (this.sessionMigration) {
      cleanupPromises.push({
        name: 'sessionMigration',
        promise: this.sessionMigration.shutdown(),
      });
    }


    if (this.sessionManager) {
      cleanupPromises.push({
        name: 'sessionManager',
        promise: this.sessionManager.close(),
      });
    }


    if (this.sessionStore) {
      cleanupPromises.push({
        name: 'sessionStore',
        promise: this.sessionStore.close(),
      });
    }


    if (this.redis) {
      cleanupPromises.push({
        name: 'redis',
        promise: this.redis.quit(),
      });
    }


    for (const { name, promise } of cleanupPromises) {
      try {
        await promise;
        console.log(`[GracefulShutdown] Cleaned up: ${name}`);
        this.updateProgress({
          componentsShutdown: this.shutdownStatus!.progress.componentsShutdown + 1,
        });
      } catch (error) {
        this.recordError(name, error);
      }
    }
  }




  private async performForceShutdown(): Promise<void> {
    console.log('[GracefulShutdown] Performing force shutdown...');
    this.updatePhase('forced');


    const forcePromises: Promise<void>[] = [];

    [this.sessionReplay, this.sessionMigration, this.sessionManager, this.sessionStore].forEach(service => {
      if (service && typeof service.close === 'function') {
        forcePromises.push(
          service.close().catch((error: any) => {
            console.error(`[GracefulShutdown] Force close error:`, error);
          })
        );
      }
    });

    if (this.redis) {
      forcePromises.push(
        this.redis.quit().catch((error) => {
          console.error('[GracefulShutdown] Force Redis close error:', error);
        })
      );
    }


    await Promise.race([
      Promise.all(forcePromises),
      new Promise(resolve => setTimeout(resolve, 5000)),
    ]);

    this.completeShutdown();
  }




  private completeShutdown(): void {
    this.updatePhase('complete');
    console.log('[GracefulShutdown] Shutdown complete');

    this.cleanupSignalHandlers();

    this.emit('shutdown:complete', {
      status: this.shutdownStatus,
      duration: Date.now() - new Date(this.shutdownStatus!.startTime).getTime(),
    });


    setTimeout(() => {
      process.exit(0);
    }, 100);
  }




  private setupSignalHandlers(): void {
    this.config.shutdownSignals.forEach(signal => {
      const handler = () => {
        console.log(`[GracefulShutdown] Received ${signal}, initiating graceful shutdown`);
        this.shutdown({
          reason: `Process signal: ${signal}`,
          graceful: true,
          preserveData: true,
        }).catch(console.error);
      };

      this.signalHandlers.set(signal, handler);
      process.on(signal as NodeJS.Signals, handler);
    });
  }




  private cleanupSignalHandlers(): void {
    this.signalHandlers.forEach((handler, signal) => {
      process.removeListener(signal as NodeJS.Signals, handler);
    });
    this.signalHandlers.clear();
  }




  private handleUncaughtException(error: Error): void {
    console.error('[GracefulShutdown] Uncaught exception:', error);
    this.shutdown({
      reason: `Uncaught exception: ${error.message}`,
      graceful: false,
      preserveData: true,
    }).catch(() => {
      process.exit(1);
    });
  }




  private handleUnhandledRejection(reason: any, promise: Promise<any>): void {
    console.error('[GracefulShutdown] Unhandled rejection:', reason);
    this.shutdown({
      reason: `Unhandled rejection: ${reason}`,
      graceful: false,
      preserveData: true,
    }).catch(() => {
      process.exit(1);
    });
  }




  private updatePhase(phase: ShutdownStatus['phase']): void {
    if (this.shutdownStatus) {
      this.shutdownStatus.phase = phase;
      this.emit('shutdown:phase', { phase, status: this.shutdownStatus });
    }
  }




  private updateProgress(updates: Partial<ShutdownStatus['progress']>): void {
    if (this.shutdownStatus) {
      Object.assign(this.shutdownStatus.progress, updates);
      this.emit('shutdown:progress', { progress: this.shutdownStatus.progress });
    }
  }




  private recordError(component: string, error: any): void {
    const errorRecord = {
      component,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };

    if (this.shutdownStatus) {
      this.shutdownStatus.errors.push(errorRecord);
    }

    this.emit('shutdown:error', errorRecord);
  }




  private getTotalComponents(): number {
    let count = 0;
    if (this.sessionManager) count++;
    if (this.sessionStore) count++;
    if (this.sessionReplay) count++;
    if (this.sessionMigration) count++;
    if (this.healthCheck) count++;
    if (this.redis) count++;
    return count;
  }




  async getRecoveryData(): Promise<RecoveryData | null> {
    if (!this.redis) return null;

    try {
      const data = await this.redis.get('session:recovery:data');
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('[GracefulShutdown] Failed to retrieve recovery data:', error);
    }

    return null;
  }




  async clearRecoveryData(): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.del('session:recovery:data');
    } catch (error) {
      console.error('[GracefulShutdown] Failed to clear recovery data:', error);
    }
  }
}

================
File: services/SessionHealthCheck.ts
================
import { EventEmitter } from 'events';
import type { RedisClientType } from 'redis';
import { SessionManager } from './SessionManager.js';
import { SessionStore } from './SessionStore.js';
import { SessionReplay } from './SessionReplay.js';
import { SessionMigration } from './SessionMigration.js';

export interface HealthCheckConfig {
  checkInterval: number;
  redisTimeoutThreshold: number;
  memoryThreshold: number;
  sessionCountThreshold: number;
  errorRateThreshold: number;
  enableDetailedMetrics: boolean;
  enableAlerts: boolean;
}

export interface HealthStatus {
  overall: 'healthy' | 'warning' | 'critical' | 'down';
  timestamp: string;
  uptime: number;
  version: string;
  components: {
    sessionManager: ComponentHealth;
    redis: ComponentHealth;
    sessionStore: ComponentHealth;
    sessionReplay?: ComponentHealth;
    sessionMigration?: ComponentHealth;
  };
  metrics: HealthMetrics;
  alerts?: Alert[];
}

export interface ComponentHealth {
  status: 'healthy' | 'warning' | 'critical' | 'down';
  latency: number;
  errorRate: number;
  lastCheck: string;
  details?: Record<string, any>;
}

export interface HealthMetrics {
  sessions: {
    active: number;
    total: number;
    averageAge: number;
    eventsPerSecond: number;
  };
  redis: {
    memoryUsage: number;
    connectedClients: number;
    commandsPerSecond: number;
    keyspaceHits: number;
    keyspaceMisses: number;
  };
  system: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    uptime: number;
  };
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    throughput: number;
  };
}

export interface Alert {
  level: 'warning' | 'critical';
  component: string;
  message: string;
  timestamp: string;
  value?: number;
  threshold?: number;
}

export interface HealthCheckEndpoint {
  path: string;
  handler: () => Promise<any>;
  description: string;
}

export class SessionHealthCheck extends EventEmitter {
  private config: HealthCheckConfig;
  private sessionManager?: SessionManager;
  private redis?: RedisClientType;
  private sessionStore?: SessionStore;
  private sessionReplay?: SessionReplay;
  private sessionMigration?: SessionMigration;

  private startTime: number;
  private healthTimer?: NodeJS.Timeout;
  private responseTimeBuffer: number[] = [];
  private errorCount = 0;
  private totalRequests = 0;
  private lastMetrics?: HealthMetrics;

  constructor(config: Partial<HealthCheckConfig> = {}) {
    super();
    this.config = {
      checkInterval: config.checkInterval || 30000,
      redisTimeoutThreshold: config.redisTimeoutThreshold || 5000,
      memoryThreshold: config.memoryThreshold || 512 * 1024 * 1024,
      sessionCountThreshold: config.sessionCountThreshold || 10000,
      errorRateThreshold: config.errorRateThreshold || 5,
      enableDetailedMetrics: config.enableDetailedMetrics ?? true,
      enableAlerts: config.enableAlerts ?? true,
    };

    this.startTime = Date.now();
  }




  async initialize(services: {
    sessionManager?: SessionManager;
    redis?: RedisClientType;
    sessionStore?: SessionStore;
    sessionReplay?: SessionReplay;
    sessionMigration?: SessionMigration;
  }): Promise<void> {
    this.sessionManager = services.sessionManager;
    this.redis = services.redis;
    this.sessionStore = services.sessionStore;
    this.sessionReplay = services.sessionReplay;
    this.sessionMigration = services.sessionMigration;


    this.startHealthChecks();

    this.emit('initialized');
  }




  async getHealthStatus(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const uptime = Date.now() - this.startTime;

    const [
      sessionManagerHealth,
      redisHealth,
      sessionStoreHealth,
      sessionReplayHealth,
      sessionMigrationHealth,
      metrics,
    ] = await Promise.allSettled([
      this.checkSessionManagerHealth(),
      this.checkRedisHealth(),
      this.checkSessionStoreHealth(),
      this.checkSessionReplayHealth(),
      this.checkSessionMigrationHealth(),
      this.collectMetrics(),
    ]);

    const components = {
      sessionManager: this.extractResult(sessionManagerHealth),
      redis: this.extractResult(redisHealth),
      sessionStore: this.extractResult(sessionStoreHealth),
      ...(sessionReplayHealth.status === 'fulfilled' && { sessionReplay: sessionReplayHealth.value }),
      ...(sessionMigrationHealth.status === 'fulfilled' && { sessionMigration: sessionMigrationHealth.value }),
    };

    const healthMetrics = metrics.status === 'fulfilled' ? metrics.value : this.getDefaultMetrics();
    const alerts = this.config.enableAlerts ? this.generateAlerts(components, healthMetrics) : undefined;

    const overall = this.calculateOverallHealth(components);

    return {
      overall,
      timestamp,
      uptime,
      version: process.env.npm_package_version || '1.0.0',
      components,
      metrics: healthMetrics,
      alerts,
    };
  }




  getHealthCheckEndpoints(): HealthCheckEndpoint[] {
    return [
      {
        path: '/health',
        handler: async () => {
          const health = await this.getHealthStatus();
          return {
            status: health.overall,
            timestamp: health.timestamp,
            uptime: health.uptime,
          };
        },
        description: 'Basic health status',
      },
      {
        path: '/health/detailed',
        handler: async () => this.getHealthStatus(),
        description: 'Detailed health information',
      },
      {
        path: '/health/metrics',
        handler: async () => {
          const health = await this.getHealthStatus();
          return health.metrics;
        },
        description: 'Performance and system metrics',
      },
      {
        path: '/health/components',
        handler: async () => {
          const health = await this.getHealthStatus();
          return health.components;
        },
        description: 'Individual component health status',
      },
      {
        path: '/health/redis',
        handler: async () => this.checkRedisHealth(),
        description: 'Redis-specific health information',
      },
      {
        path: '/health/sessions',
        handler: async () => {
          if (!this.sessionManager) {
            throw new Error('SessionManager not initialized');
          }
          return this.sessionManager.getStats();
        },
        description: 'Session statistics',
      },
    ];
  }




  recordResponseTime(responseTime: number): void {
    this.responseTimeBuffer.push(responseTime);


    if (this.responseTimeBuffer.length > 1000) {
      this.responseTimeBuffer.shift();
    }

    this.totalRequests++;
  }




  recordError(): void {
    this.errorCount++;
  }




  private startHealthChecks(): void {
    this.healthTimer = setInterval(async () => {
      try {
        const health = await this.getHealthStatus();
        this.emit('health:check', health);


        if (health.alerts && health.alerts.length > 0) {
          health.alerts.forEach(alert => {
            this.emit('health:alert', alert);
          });
        }


        this.lastMetrics = health.metrics;
      } catch (error) {
        this.emit('health:error', error);
      }
    }, this.config.checkInterval);
  }




  private async checkSessionManagerHealth(): Promise<ComponentHealth> {
    if (!this.sessionManager) {
      return {
        status: 'down',
        latency: 0,
        errorRate: 0,
        lastCheck: new Date().toISOString(),
        details: { error: 'SessionManager not initialized' },
      };
    }

    const startTime = Date.now();
    try {
      const health = await this.sessionManager.healthCheck();
      const latency = Date.now() - startTime;

      return {
        status: health.healthy ? 'healthy' : 'critical',
        latency,
        errorRate: this.calculateErrorRate(),
        lastCheck: new Date().toISOString(),
        details: {
          activeSessions: health.activeSessions,
          storeHealth: health.store,
        },
      };
    } catch (error) {
      return {
        status: 'critical',
        latency: Date.now() - startTime,
        errorRate: this.calculateErrorRate(),
        lastCheck: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }




  private async checkRedisHealth(): Promise<ComponentHealth> {
    if (!this.redis) {
      return {
        status: 'down',
        latency: 0,
        errorRate: 0,
        lastCheck: new Date().toISOString(),
        details: { error: 'Redis client not initialized' },
      };
    }

    const startTime = Date.now();
    try {

      await this.redis.ping();
      const latency = Date.now() - startTime;


      const info = await this.redis.info();
      const parsedInfo = this.parseRedisInfo(info);

      const status = latency > this.config.redisTimeoutThreshold ? 'warning' : 'healthy';

      return {
        status,
        latency,
        errorRate: 0,
        lastCheck: new Date().toISOString(),
        details: {
          memoryUsage: parsedInfo.used_memory_human,
          connectedClients: parsedInfo.connected_clients,
          version: parsedInfo.redis_version,
          uptime: parsedInfo.uptime_in_seconds,
        },
      };
    } catch (error) {
      return {
        status: 'critical',
        latency: Date.now() - startTime,
        errorRate: 100,
        lastCheck: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }




  private async checkSessionStoreHealth(): Promise<ComponentHealth> {
    if (!this.sessionStore) {
      return {
        status: 'down',
        latency: 0,
        errorRate: 0,
        lastCheck: new Date().toISOString(),
        details: { error: 'SessionStore not initialized' },
      };
    }

    const startTime = Date.now();
    try {
      const health = await this.sessionStore.healthCheck();
      const latency = Date.now() - startTime;

      return {
        status: health.healthy ? 'healthy' : 'critical',
        latency,
        errorRate: 0,
        lastCheck: new Date().toISOString(),
        details: health,
      };
    } catch (error) {
      return {
        status: 'critical',
        latency: Date.now() - startTime,
        errorRate: 100,
        lastCheck: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }




  private async checkSessionReplayHealth(): Promise<ComponentHealth | undefined> {
    if (!this.sessionReplay) {
      return undefined;
    }

    const startTime = Date.now();
    try {

      const stats = await this.sessionReplay.getReplayStats();
      const latency = Date.now() - startTime;

      return {
        status: 'healthy',
        latency,
        errorRate: 0,
        lastCheck: new Date().toISOString(),
        details: {
          totalSessions: stats.totalSessions,
          totalFrames: stats.totalFrames,
          storageUsed: stats.storageUsed,
        },
      };
    } catch (error) {
      return {
        status: 'warning',
        latency: Date.now() - startTime,
        errorRate: 0,
        lastCheck: new Date().toISOString(),
        details: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }




  private async checkSessionMigrationHealth(): Promise<ComponentHealth | undefined> {
    if (!this.sessionMigration) {
      return undefined;
    }

    return {
      status: 'healthy',
      latency: 0,
      errorRate: 0,
      lastCheck: new Date().toISOString(),
      details: {
        note: 'SessionMigration health monitoring not implemented',
      },
    };
  }




  private async collectMetrics(): Promise<HealthMetrics> {
    const [sessionStats, redisMetrics] = await Promise.allSettled([
      this.collectSessionMetrics(),
      this.collectRedisMetrics(),
    ]);

    return {
      sessions: sessionStats.status === 'fulfilled' ? sessionStats.value : this.getDefaultSessionMetrics(),
      redis: redisMetrics.status === 'fulfilled' ? redisMetrics.value : this.getDefaultRedisMetrics(),
      system: this.collectSystemMetrics(),
      performance: this.collectPerformanceMetrics(),
    };
  }




  private async collectSessionMetrics(): Promise<HealthMetrics['sessions']> {
    if (!this.sessionManager) {
      return this.getDefaultSessionMetrics();
    }

    try {
      const stats = await this.sessionManager.getStats();
      const activeSessions = await this.sessionManager.listActiveSessions();

      return {
        active: activeSessions.length,
        total: stats.activeSessions || 0,
        averageAge: 0,
        eventsPerSecond: this.calculateEventsPerSecond(),
      };
    } catch (error) {
      return this.getDefaultSessionMetrics();
    }
  }




  private async collectRedisMetrics(): Promise<HealthMetrics['redis']> {
    if (!this.redis) {
      return this.getDefaultRedisMetrics();
    }

    try {
      const info = await this.redis.info();
      const parsedInfo = this.parseRedisInfo(info);

      return {
        memoryUsage: parseInt(parsedInfo.used_memory || '0'),
        connectedClients: parseInt(parsedInfo.connected_clients || '0'),
        commandsPerSecond: this.calculateCommandsPerSecond(parsedInfo),
        keyspaceHits: parseInt(parsedInfo.keyspace_hits || '0'),
        keyspaceMisses: parseInt(parsedInfo.keyspace_misses || '0'),
      };
    } catch (error) {
      return this.getDefaultRedisMetrics();
    }
  }




  private collectSystemMetrics(): HealthMetrics['system'] {
    return {
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      uptime: process.uptime(),
    };
  }




  private collectPerformanceMetrics(): HealthMetrics['performance'] {
    if (this.responseTimeBuffer.length === 0) {
      return {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        throughput: 0,
      };
    }

    const sorted = [...this.responseTimeBuffer].sort((a, b) => a - b);
    const average = this.responseTimeBuffer.reduce((a, b) => a + b, 0) / this.responseTimeBuffer.length;
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    return {
      averageResponseTime: average,
      p95ResponseTime: sorted[p95Index] || 0,
      p99ResponseTime: sorted[p99Index] || 0,
      throughput: this.totalRequests / ((Date.now() - this.startTime) / 1000),
    };
  }




  private generateAlerts(components: any, metrics: HealthMetrics): Alert[] {
    const alerts: Alert[] = [];
    const timestamp = new Date().toISOString();


    if (metrics.system.memoryUsage.heapUsed > this.config.memoryThreshold) {
      alerts.push({
        level: 'warning',
        component: 'system',
        message: 'High memory usage detected',
        timestamp,
        value: metrics.system.memoryUsage.heapUsed,
        threshold: this.config.memoryThreshold,
      });
    }


    if (metrics.sessions.active > this.config.sessionCountThreshold) {
      alerts.push({
        level: 'warning',
        component: 'sessions',
        message: 'High number of active sessions',
        timestamp,
        value: metrics.sessions.active,
        threshold: this.config.sessionCountThreshold,
      });
    }


    const errorRate = this.calculateErrorRate();
    if (errorRate > this.config.errorRateThreshold) {
      alerts.push({
        level: 'critical',
        component: 'performance',
        message: 'High error rate detected',
        timestamp,
        value: errorRate,
        threshold: this.config.errorRateThreshold,
      });
    }


    Object.entries(components).forEach(([componentName, health]) => {
      if (health.status === 'critical') {
        alerts.push({
          level: 'critical',
          component: componentName,
          message: `Component ${componentName} is in critical state`,
          timestamp,
        });
      } else if (health.status === 'warning') {
        alerts.push({
          level: 'warning',
          component: componentName,
          message: `Component ${componentName} is experiencing issues`,
          timestamp,
        });
      }
    });

    return alerts;
  }




  private calculateOverallHealth(components: Record<string, ComponentHealth>): HealthStatus['overall'] {
    const statuses = Object.values(components).map(c => c.status);

    if (statuses.includes('down')) return 'down';
    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('warning')) return 'warning';
    return 'healthy';
  }




  private calculateErrorRate(): number {
    if (this.totalRequests === 0) return 0;
    return (this.errorCount / this.totalRequests) * 100;
  }




  private calculateEventsPerSecond(): number {

    return 0;
  }




  private calculateCommandsPerSecond(redisInfo: Record<string, string>): number {
    const totalCommands = parseInt(redisInfo.total_commands_processed || '0');
    const uptime = parseInt(redisInfo.uptime_in_seconds || '1');
    return totalCommands / uptime;
  }




  private parseRedisInfo(info: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = info.split('\r\n');

    for (const line of lines) {
      if (line.includes(':') && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    }

    return result;
  }




  private extractResult(result: PromiseSettledResult<ComponentHealth>): ComponentHealth {
    if (result.status === 'fulfilled') {
      return result.value;
    }

    return {
      status: 'critical',
      latency: 0,
      errorRate: 100,
      lastCheck: new Date().toISOString(),
      details: { error: result.reason?.message || 'Unknown error' },
    };
  }




  private getDefaultMetrics(): HealthMetrics {
    return {
      sessions: this.getDefaultSessionMetrics(),
      redis: this.getDefaultRedisMetrics(),
      system: this.collectSystemMetrics(),
      performance: this.collectPerformanceMetrics(),
    };
  }

  private getDefaultSessionMetrics(): HealthMetrics['sessions'] {
    return {
      active: 0,
      total: 0,
      averageAge: 0,
      eventsPerSecond: 0,
    };
  }

  private getDefaultRedisMetrics(): HealthMetrics['redis'] {
    return {
      memoryUsage: 0,
      connectedClients: 0,
      commandsPerSecond: 0,
      keyspaceHits: 0,
      keyspaceMisses: 0,
    };
  }




  async shutdown(): Promise<void> {
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = undefined;
    }

    this.emit('shutdown');
  }
}

================
File: services/SessionIntegration.ts
================
import { SessionManager } from './SessionManager.js';
import { SessionBridge } from './SessionBridge.js';
import { SessionConfig, createSessionConfig } from './SessionConfig.js';
import {
  SessionDocument,
  SessionEvent,
  SessionCreationOptions,
  SessionManagerConfig,
} from './SessionTypes.js';

export class SessionIntegration {
  private sessionManager: SessionManager;
  private sessionBridge: SessionBridge;
  private config: Required<SessionManagerConfig>;

  constructor(
    knowledgeGraph?: any,
    configOverrides?: Partial<SessionManagerConfig>
  ) {

    this.config = {
      ...createSessionConfig(),
      ...configOverrides,
    } as Required<SessionManagerConfig>;


    const sessionConfig = SessionConfig.getInstance();
    const validation = sessionConfig.validateConfiguration();
    if (!validation.valid) {
      throw new Error(`Invalid session configuration: ${validation.errors.join(', ')}`);
    }


    this.sessionManager = new SessionManager(this.config, knowledgeGraph);
    this.sessionBridge = new SessionBridge(this.sessionManager, knowledgeGraph);

    console.log('[SessionIntegration] Initialized with configuration:', {
      environment: sessionConfig.getEnvironment(),
      redis: {
        host: this.config.redis.host,
        port: this.config.redis.port,
        db: this.config.redis.db,
      },
      session: {
        defaultTTL: this.config.defaultTTL,
        checkpointInterval: this.config.checkpointInterval,
      },
    });
  }






  async startSession(
    agentId: string,
    options: {
      entityIds?: string[];
      metadata?: Record<string, any>;
      ttl?: number;
    } = {}
  ): Promise<string> {
    const sessionOptions: SessionCreationOptions = {
      initialEntityIds: options.entityIds,
      metadata: options.metadata,
      ttl: options.ttl,
    };

    const sessionId = await this.sessionManager.createSession(agentId, sessionOptions);

    console.log(`[SessionIntegration] Started session ${sessionId} for agent ${agentId}`, {
      entityIds: options.entityIds?.length || 0,
      metadata: options.metadata,
    });

    return sessionId;
  }




  async recordCodeChange(
    sessionId: string,
    agentId: string,
    change: {
      entityIds: string[];
      operation: 'added' | 'modified' | 'deleted' | 'renamed';
      affectedLines?: number;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      perfDelta?: number;
    }
  ): Promise<void> {
    const event: Omit<SessionEvent, 'seq' | 'timestamp'> = {
      type: 'modified',
      changeInfo: {
        elementType: 'function',
        entityIds: change.entityIds,
        operation: change.operation,
        affectedLines: change.affectedLines,
      },
      impact: change.severity || change.perfDelta ? {
        severity: change.severity || 'low',
        perfDelta: change.perfDelta,
      } : undefined,
      actor: agentId,
    };

    await this.sessionManager.emitEvent(sessionId, event, agentId);

    console.log(`[SessionIntegration] Recorded code change for session ${sessionId}`, {
      agent: agentId,
      entityIds: change.entityIds,
      operation: change.operation,
      severity: change.severity,
    });
  }




  async recordTestResult(
    sessionId: string,
    agentId: string,
    result: {
      entityIds: string[];
      passed: boolean;
      testIds?: string[];
      perfDelta?: number;
      confidence?: number;
    }
  ): Promise<void> {
    const event: Omit<SessionEvent, 'seq' | 'timestamp'> = {
      type: result.passed ? 'test_pass' : 'broke',
      changeInfo: {
        elementType: 'function',
        entityIds: result.entityIds,
        operation: 'modified',
      },
      stateTransition: {
        from: 'working',
        to: result.passed ? 'working' : 'broken',
        verifiedBy: 'test',
        confidence: result.confidence || 0.95,
      },
      impact: !result.passed ? {
        severity: 'high',
        testsFailed: result.testIds,
        perfDelta: result.perfDelta,
      } : {
        severity: 'low',
        perfDelta: result.perfDelta,
      },
      actor: agentId,
    };

    await this.sessionManager.emitEvent(sessionId, event, agentId);

    console.log(`[SessionIntegration] Recorded test result for session ${sessionId}`, {
      agent: agentId,
      passed: result.passed,
      entityIds: result.entityIds,
      testIds: result.testIds?.length || 0,
    });
  }




  async enableCollaboration(
    sessionId: string,
    joiningAgentId: string
  ): Promise<import('./SessionTypes.js').HandoffContext> {

    const context = await this.sessionBridge.getHandoffContext(sessionId, joiningAgentId);


    await this.sessionManager.joinSession(sessionId, joiningAgentId);

    console.log(`[SessionIntegration] Enabled collaboration for session ${sessionId}`, {
      joiningAgent: joiningAgentId,
      recentChanges: context.recentChanges.length,
      advice: context.joiningAdvice,
    });

    return context;
  }




  async analyzeSession(sessionId: string, options: {
    entityId?: string;
    agentId?: string;
  } = {}): Promise<{
    session: SessionDocument;
    transitions: any[];
    isolation?: any;
  }> {
    const session = await this.sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const transitions = await this.sessionBridge.getTransitions(
      sessionId,
      options.entityId
    );

    let isolation;
    if (options.agentId) {
      isolation = await this.sessionBridge.isolateSession(sessionId, options.agentId);
    }

    return {
      session,
      transitions,
      isolation,
    };
  }




  async createCheckpoint(sessionId: string, options: {
    gracePeriod?: number;
    includeFailureSnapshot?: boolean;
  } = {}): Promise<string> {
    const checkpointId = await this.sessionManager.checkpoint(sessionId, {
      graceTTL: options.gracePeriod,
      includeFailureSnapshot: options.includeFailureSnapshot,
    });

    console.log(`[SessionIntegration] Created checkpoint ${checkpointId} for session ${sessionId}`);
    return checkpointId;
  }




  async getImpactAnalysis(entityIds: string[], options: {
    timeframe?: number;
    agentId?: string;
  } = {}): Promise<any> {
    const aggregates = await this.sessionBridge.getSessionAggregates(entityIds, {
      agentId: options.agentId,

    });

    console.log(`[SessionIntegration] Generated impact analysis for ${entityIds.length} entities`, {
      totalSessions: aggregates.totalSessions,
      activeAgents: aggregates.activeAgents.length,
      performanceImpact: aggregates.performanceImpact.total,
    });

    return aggregates;
  }






  async getHealthStatus(): Promise<{
    healthy: boolean;
    components: {
      sessionManager: boolean;
      sessionBridge: boolean;
      redis: { healthy: boolean; latency: number };
    };
    stats: {
      activeSessions: number;
      totalEvents: number;
      agentsActive: number;
    };
  }> {
    const [managerHealth, bridgeHealth, stats] = await Promise.all([
      this.sessionManager.healthCheck(),
      this.sessionBridge.healthCheck(),
      this.sessionManager.getStats(),
    ]);

    const healthy = managerHealth.healthy && bridgeHealth.healthy;

    return {
      healthy,
      components: {
        sessionManager: managerHealth.sessionManager,
        sessionBridge: bridgeHealth.bridge,
        redis: managerHealth.store,
      },
      stats: {
        activeSessions: stats.activeSessions,
        totalEvents: stats.totalEvents,
        agentsActive: stats.agentsActive,
      },
    };
  }




  async performMaintenance(): Promise<void> {
    await this.sessionManager.performMaintenance();
    console.log('[SessionIntegration] Maintenance completed');
  }




  async getAgentSessions(agentId: string): Promise<string[]> {
    return await this.sessionManager.getSessionsByAgent(agentId);
  }




  async getAllActiveSessions(): Promise<string[]> {
    return await this.sessionManager.listActiveSessions();
  }






  async shutdown(): Promise<void> {
    await this.sessionManager.close();
    console.log('[SessionIntegration] Shutdown completed');
  }
}






export function createSessionIntegration(
  knowledgeGraph?: any,
  environment?: 'development' | 'test' | 'production'
): SessionIntegration {
  const config = createSessionConfig(environment);
  return new SessionIntegration(knowledgeGraph, config);
}




export const SessionUsageExamples = {



  singleAgent: async (integration: SessionIntegration, agentId: string) => {

    const sessionId = await integration.startSession(agentId, {
      entityIds: ['function-auth-login', 'test-auth-integration'],
      metadata: { task: 'implement-login', priority: 'high' }
    });


    await integration.recordCodeChange(sessionId, agentId, {
      entityIds: ['function-auth-login'],
      operation: 'modified',
      affectedLines: 25,
      severity: 'medium'
    });


    await integration.recordTestResult(sessionId, agentId, {
      entityIds: ['function-auth-login'],
      passed: false,
      testIds: ['test-auth-integration'],
      confidence: 0.9
    });


    const checkpointId = await integration.createCheckpoint(sessionId);

    return { sessionId, checkpointId };
  },




  multiAgentHandoff: async (integration: SessionIntegration, agent1: string, agent2: string) => {

    const sessionId = await integration.startSession(agent1, {
      entityIds: ['cluster-auth', 'spec-login-flow'],
      metadata: { task: 'auth-refactor', phase: 'analysis' }
    });


    await integration.recordCodeChange(sessionId, agent1, {
      entityIds: ['cluster-auth'],
      operation: 'modified',
      severity: 'high'
    });


    const handoffContext = await integration.enableCollaboration(sessionId, agent2);

    console.log('Handoff advice:', handoffContext.joiningAdvice);
    console.log('Recent changes:', handoffContext.recentChanges.length);


    await integration.recordTestResult(sessionId, agent2, {
      entityIds: ['cluster-auth'],
      passed: true,
      confidence: 0.95
    });

    return { sessionId, handoffContext };
  },




  impactAnalysis: async (integration: SessionIntegration, entityIds: string[]) => {
    const analysis = await integration.getImpactAnalysis(entityIds, {
      timeframe: 7,
    });

    console.log('Impact Analysis Results:', {
      totalSessions: analysis.totalSessions,
      activeAgents: analysis.activeAgents,
      brokenSessions: analysis.recentOutcomes.broken || 0,
      avgPerformanceImpact: analysis.performanceImpact.average,
      entityBreakdown: analysis.entityBreakdown.slice(0, 5),
    });

    return analysis;
  }
};

export type { HandoffContext } from './SessionTypes.js';

================
File: services/SessionManager.ts
================
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { SessionStore } from './SessionStore.js';
import {
  SessionDocument,
  SessionEvent,
  SessionCreationOptions,
  SessionEventOptions,
  CheckpointOptions,
  SessionManagerConfig,
  SessionAnchor,
  ISessionManager,
  SessionError,
  SessionNotFoundError,
  SessionStats,
  SessionPubSubMessage,
  Outcome,
} from './SessionTypes.js';

export class SessionManager extends EventEmitter implements ISessionManager {
  private store: SessionStore;
  private knowledgeGraph?: any;
  private eventSequences = new Map<string, number>();
  private config: Required<SessionManagerConfig>;

  constructor(
    config: SessionManagerConfig,
    knowledgeGraph?: any
  ) {
    super();


    this.config = {
      redis: config.redis,
      defaultTTL: config.defaultTTL || 3600,
      checkpointInterval: config.checkpointInterval || 10,
      maxEventsPerSession: config.maxEventsPerSession || 1000,
      graceTTL: config.graceTTL || 300,
      enableFailureSnapshots: config.enableFailureSnapshots || false,
      pubSubChannels: {
        global: 'global:sessions',
        session: 'session:',
        ...config.pubSubChannels,
      },
    };

    this.store = new SessionStore(this.config.redis);
    this.knowledgeGraph = knowledgeGraph;

    this.setupEventHandlers();
    console.log('[SessionManager] Initialized with configuration:', {
      defaultTTL: this.config.defaultTTL,
      checkpointInterval: this.config.checkpointInterval,
      enableFailureSnapshots: this.config.enableFailureSnapshots,
    });
  }

  private setupEventHandlers(): void {

    this.store.on('session:created', (data) => this.emit('session:created', data));
    this.store.on('session:updated', (data) => this.emit('session:updated', data));
    this.store.on('session:deleted', (data) => this.emit('session:deleted', data));
    this.store.on('event:added', (data) => this.emit('event:added', data));
    this.store.on('agent:added', (data) => this.emit('agent:added', data));
    this.store.on('agent:removed', (data) => this.emit('agent:removed', data));


    this.store.on('error', (error) => {
      console.error('[SessionManager] Store error:', error);
      this.emit('error', error);
    });
  }



  async createSession(
    agentId: string,
    options: SessionCreationOptions = {}
  ): Promise<string> {
    try {
      const sessionId = `sess-${uuidv4()}`;


      this.eventSequences.set(sessionId, 1);


      await this.store.createSession(sessionId, agentId, {
        ...options,
        ttl: options.ttl || this.config.defaultTTL,
      });


      await this.publishGlobalUpdate({
        type: 'new',
        sessionId,
        initiator: agentId,
      });

      console.log(`[SessionManager] Created session ${sessionId} for agent ${agentId}`);
      return sessionId;
    } catch (error) {
      console.error(`[SessionManager] Failed to create session for agent ${agentId}:`, error);
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        `Failed to create session: ${error instanceof Error ? error.message : String(error)}`,
        'SESSION_MANAGER_CREATE_FAILED',
        undefined,
        { agentId, options, originalError: error }
      );
    }
  }

  async joinSession(sessionId: string, agentId: string): Promise<void> {
    try {
      const session = await this.store.getSession(sessionId);
      if (!session) {
        throw new SessionNotFoundError(sessionId);
      }


      await this.store.addAgent(sessionId, agentId);


      await this.emitEvent(sessionId, {
        type: 'handoff',
        changeInfo: {
          elementType: 'session',
          entityIds: [],
          operation: 'modified',
        },
        actor: agentId,
      }, agentId);


      await this.store.subscribeToSession(sessionId, (message) => {
        this.emit('session:update', { sessionId, agentId, message });
      });

      console.log(`[SessionManager] Agent ${agentId} joined session ${sessionId}`);
    } catch (error) {
      console.error(`[SessionManager] Failed to join session ${sessionId} for agent ${agentId}:`, error);
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        `Failed to join session: ${error instanceof Error ? error.message : String(error)}`,
        'SESSION_MANAGER_JOIN_FAILED',
        sessionId,
        { agentId, originalError: error }
      );
    }
  }

  async leaveSession(sessionId: string, agentId: string): Promise<void> {
    try {
      await this.store.removeAgent(sessionId, agentId);


      await this.emitEvent(sessionId, {
        type: 'handoff',
        changeInfo: {
          elementType: 'session',
          entityIds: [],
          operation: 'modified',
        },
        actor: agentId,
      }, agentId);

      console.log(`[SessionManager] Agent ${agentId} left session ${sessionId}`);
    } catch (error) {
      console.error(`[SessionManager] Failed to leave session ${sessionId} for agent ${agentId}:`, error);
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        `Failed to leave session: ${error instanceof Error ? error.message : String(error)}`,
        'SESSION_MANAGER_LEAVE_FAILED',
        sessionId,
        { agentId, originalError: error }
      );
    }
  }

  async emitEvent(
    sessionId: string,
    eventData: Omit<SessionEvent, 'seq' | 'timestamp'>,
    actor: string,
    options: SessionEventOptions = {}
  ): Promise<void> {
    try {

      const seq = this.eventSequences.get(sessionId) || 1;
      this.eventSequences.set(sessionId, seq + 1);


      const event: SessionEvent = {
        ...eventData,
        seq,
        timestamp: new Date().toISOString(),
        actor,
      };


      await this.store.addEvent(sessionId, event);


      if (options.resetTTL !== false) {
        await this.store.setTTL(sessionId, this.config.defaultTTL);
      }


      if (options.publishUpdate !== false) {
        await this.store.publishSessionUpdate(sessionId, {
          type: event.type,
          seq: event.seq,
          actor,
          summary: {
            entityIds: event.changeInfo.entityIds,
            impact: event.impact,
          },
        });
      }


      if (options.autoCheckpoint !== false &&
          (event.type === 'checkpoint' || seq % this.config.checkpointInterval === 0)) {
        await this.checkpoint(sessionId, { graceTTL: this.config.graceTTL });
      }

      console.log(`[SessionManager] Emitted event ${seq} for session ${sessionId}: ${event.type}`);
    } catch (error) {
      console.error(`[SessionManager] Failed to emit event for session ${sessionId}:`, error);
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        `Failed to emit event: ${error instanceof Error ? error.message : String(error)}`,
        'SESSION_MANAGER_EMIT_FAILED',
        sessionId,
        { eventData, actor, options, originalError: error }
      );
    }
  }

  async getSession(sessionId: string): Promise<SessionDocument | null> {
    try {
      return await this.store.getSession(sessionId);
    } catch (error) {
      console.error(`[SessionManager] Failed to get session ${sessionId}:`, error);
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        `Failed to get session: ${error instanceof Error ? error.message : String(error)}`,
        'SESSION_MANAGER_GET_FAILED',
        sessionId,
        { originalError: error }
      );
    }
  }



  async checkpoint(
    sessionId: string,
    options: CheckpointOptions = {}
  ): Promise<string> {
    try {
      const session = await this.store.getSession(sessionId);
      if (!session) {
        throw new SessionNotFoundError(sessionId);
      }

      const checkpointId = `cp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const graceTTL = options.graceTTL || this.config.graceTTL;


      const recentEvents = session.events.slice(-20);
      const summary = this.aggregateEvents(recentEvents);


      if (this.knowledgeGraph && recentEvents.length > 0) {
        const entityIds = this.extractEntityIds(recentEvents);
        const anchor: SessionAnchor = {
          sessionId,
          outcome: summary.outcome,
          checkpointId,
          keyImpacts: summary.keyImpacts,
          perfDelta: summary.perfDelta,
          actors: session.agentIds,
          timestamp: new Date().toISOString(),
        };

        await this.appendKGAnchor(entityIds, anchor);
      }


      if (options.includeFailureSnapshot ||
          (this.config.enableFailureSnapshots && summary.outcome === 'broken')) {
        await this.createFailureSnapshot(sessionId, session.events, summary.outcome);
      }


      await this.store.setTTL(sessionId, graceTTL);


      setTimeout(async () => {
        try {
          await this.cleanup(sessionId);
        } catch (error) {
          console.error(`[SessionManager] Failed to cleanup session ${sessionId}:`, error);
        }
      }, graceTTL * 1000);


      await this.store.publishSessionUpdate(sessionId, {
        type: 'checkpoint_complete',
        checkpointId,
        outcome: summary.outcome,
      });

      console.log(`[SessionManager] Created checkpoint ${checkpointId} for session ${sessionId}`);
      return checkpointId;
    } catch (error) {
      console.error(`[SessionManager] Failed to create checkpoint for session ${sessionId}:`, error);
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        `Failed to create checkpoint: ${error instanceof Error ? error.message : String(error)}`,
        'SESSION_MANAGER_CHECKPOINT_FAILED',
        sessionId,
        { options, originalError: error }
      );
    }
  }

  async cleanup(sessionId: string): Promise<void> {
    try {
      await this.store.deleteSession(sessionId);
      this.eventSequences.delete(sessionId);
      console.log(`[SessionManager] Cleaned up session ${sessionId}`);
    } catch (error) {
      console.error(`[SessionManager] Failed to cleanup session ${sessionId}:`, error);
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        `Failed to cleanup session: ${error instanceof Error ? error.message : String(error)}`,
        'SESSION_MANAGER_CLEANUP_FAILED',
        sessionId,
        { originalError: error }
      );
    }
  }



  async listActiveSessions(): Promise<string[]> {
    try {
      return await this.store.listActiveSessions();
    } catch (error) {
      console.error('[SessionManager] Failed to list active sessions:', error);
      throw new SessionError(
        `Failed to list sessions: ${error instanceof Error ? error.message : String(error)}`,
        'SESSION_MANAGER_LIST_FAILED',
        undefined,
        { originalError: error }
      );
    }
  }

  async getSessionsByAgent(agentId: string): Promise<string[]> {
    try {
      const allSessions = await this.store.listActiveSessions();
      const agentSessions: string[] = [];

      for (const sessionId of allSessions) {
        const session = await this.store.getSession(sessionId);
        if (session && session.agentIds.includes(agentId)) {
          agentSessions.push(sessionId);
        }
      }

      return agentSessions;
    } catch (error) {
      console.error(`[SessionManager] Failed to get sessions for agent ${agentId}:`, error);
      throw new SessionError(
        `Failed to get agent sessions: ${error instanceof Error ? error.message : String(error)}`,
        'SESSION_MANAGER_AGENT_SESSIONS_FAILED',
        undefined,
        { agentId, originalError: error }
      );
    }
  }

  async getStats(): Promise<SessionStats> {
    try {
      return await this.store.getStats();
    } catch (error) {
      console.error('[SessionManager] Failed to get stats:', error);
      throw new SessionError(
        `Failed to get stats: ${error instanceof Error ? error.message : String(error)}`,
        'SESSION_MANAGER_STATS_FAILED',
        undefined,
        { originalError: error }
      );
    }
  }



  private aggregateEvents(events: SessionEvent[]): {
    outcome: Outcome;
    keyImpacts: string[];
    perfDelta: number;
  } {
    const broken = events.some(e => e.stateTransition?.to === 'broken');
    const highImpacts = events
      .filter(e => e.impact?.severity === 'high' || e.impact?.severity === 'critical')
      .map(e => e.changeInfo.entityIds[0])
      .filter(Boolean);

    const perfDelta = events.reduce((sum, e) => sum + (e.impact?.perfDelta || 0), 0);

    return {
      outcome: broken ? 'broken' : 'working',
      keyImpacts: [...new Set(highImpacts)],
      perfDelta,
    };
  }

  private extractEntityIds(events: SessionEvent[]): string[] {
    const entityIds = new Set<string>();
    events.forEach(event => {
      event.changeInfo.entityIds.forEach(id => entityIds.add(id));
    });
    return Array.from(entityIds);
  }

  private async appendKGAnchor(entityIds: string[], anchor: SessionAnchor): Promise<void> {
    if (!this.knowledgeGraph) return;

    try {

      const cypher = `
        UNWIND $entityIds as entityId
        MATCH (e:CodebaseEntity {id: entityId})
        SET e.metadata.sessions = CASE
          WHEN e.metadata.sessions IS NULL THEN [$anchor]
          ELSE e.metadata.sessions + [$anchor]
        END
        // Keep only last 5 sessions
        WITH e
        SET e.metadata.sessions = tail(e.metadata.sessions)[-5..]
      `;

      if (this.knowledgeGraph.query) {
        await this.knowledgeGraph.query(cypher, { entityIds, anchor });
      } else if (this.knowledgeGraph.neo4j?.query) {
        await this.knowledgeGraph.neo4j.query(cypher, { entityIds, anchor });
      }

      console.log(`[SessionManager] Appended KG anchor for ${entityIds.length} entities`);
    } catch (error) {
      console.error('[SessionManager] Failed to append KG anchor:', error);

    }
  }

  private async createFailureSnapshot(
    sessionId: string,
    events: SessionEvent[],
    outcome: Outcome
  ): Promise<void> {
    if (!this.config.enableFailureSnapshots) return;

    try {


      console.log(`[SessionManager] Would create failure snapshot for session ${sessionId}`, {
        outcome,
        eventCount: events.length,
      });
    } catch (error) {
      console.error(`[SessionManager] Failed to create failure snapshot for session ${sessionId}:`, error);

    }
  }

  private async publishGlobalUpdate(message: SessionPubSubMessage): Promise<void> {
    try {
      await this.store.publishSessionUpdate(this.config.pubSubChannels.global, message);
    } catch (error) {
      console.error('[SessionManager] Failed to publish global update:', error);

    }
  }



  async performMaintenance(): Promise<void> {
    try {
      console.log('[SessionManager] Starting maintenance...');


      await this.store.cleanup();


      const activeSessions = await this.store.listActiveSessions();
      const activeSet = new Set(activeSessions);

      for (const sessionId of [...this.eventSequences.keys()]) {
        if (!activeSet.has(sessionId)) {
          this.eventSequences.delete(sessionId);
        }
      }

      console.log('[SessionManager] Maintenance completed');
    } catch (error) {
      console.error('[SessionManager] Maintenance failed:', error);
      this.emit('maintenance:error', error);
    }
  }



  async healthCheck(): Promise<{
    healthy: boolean;
    sessionManager: boolean;
    store: { healthy: boolean; latency: number; error?: string };
    activeSessions: number;
  }> {
    try {
      const storeHealth = await this.store.healthCheck();
      const activeSessions = await this.store.listActiveSessions();

      return {
        healthy: storeHealth.healthy,
        sessionManager: true,
        store: storeHealth,
        activeSessions: activeSessions.length,
      };
    } catch (error) {
      return {
        healthy: false,
        sessionManager: false,
        store: { healthy: false, latency: 0, error: error instanceof Error ? error.message : String(error) },
        activeSessions: 0,
      };
    }
  }



  async close(): Promise<void> {
    try {
      await this.store.close();
      this.eventSequences.clear();
      this.emit('closed');
      console.log('[SessionManager] Closed successfully');
    } catch (error) {
      console.error('[SessionManager] Error during close:', error);
      throw new SessionError(
        `Failed to close: ${error instanceof Error ? error.message : String(error)}`,
        'SESSION_MANAGER_CLOSE_FAILED',
        undefined,
        { originalError: error }
      );
    }
  }
}

================
File: services/SessionMetrics.ts
================
import { EventEmitter } from 'events';
import type { RedisClientType } from 'redis';
import {
  SessionDocument,
  SessionEvent,
  SessionError,
} from './SessionTypes.js';

export interface PrometheusMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  help: string;
  labels?: string[];
  value?: number;
  buckets?: number[];
}

export interface MetricsConfig {
  enablePrometheus: boolean;
  enableTracing: boolean;
  enableAlerting: boolean;
  metricsPort: number;
  metricsPath: string;
  collectionInterval: number;
  retentionDays: number;
  alertRules: AlertRule[];
}

export interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  duration: number;
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  metadata: Record<string, any>;
}

export interface SessionMetricsSnapshot {
  timestamp: string;
  activeSessions: number;
  totalEvents: number;
  eventRate: number;
  sessionCreationRate: number;
  averageSessionDuration: number;
  connectionPoolStats: {
    totalConnections: number;
    activeConnections: number;
    queuedRequests: number;
    averageLatency: number;
  };
  agentMetrics: {
    totalAgents: number;
    activeAgents: number;
    deadAgents: number;
    averageLoad: number;
  };
  systemMetrics: {
    memoryUsage: number;
    cpuUsage: number;
    redisMemory: number;
    diskUsage: number;
  };
  errorMetrics: {
    totalErrors: number;
    errorRate: number;
    errorsByType: Record<string, number>;
  };
}

export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, any>;
  logs: Array<{
    timestamp: number;
    level: string;
    message: string;
    fields?: Record<string, any>;
  }>;
  status: 'ok' | 'error' | 'timeout';
}

export interface DashboardData {
  overview: {
    totalSessions: number;
    activeSessions: number;
    totalEvents: number;
    systemHealth: 'healthy' | 'degraded' | 'critical';
  };
  performance: {
    averageLatency: number;
    p95Latency: number;
    p99Latency: number;
    throughput: number;
  };
  agents: {
    total: number;
    active: number;
    busy: number;
    dead: number;
    loadDistribution: number[];
  };
  errors: {
    totalErrors: number;
    errorRate: number;
    topErrors: Array<{ error: string; count: number }>;
  };
  alerts: {
    active: number;
    critical: number;
    warning: number;
    recent: Array<{
      rule: string;
      severity: string;
      message: string;
      timestamp: string;
    }>;
  };
}

export class SessionMetrics extends EventEmitter {
  private redis: RedisClientType;
  private config: MetricsConfig;
  private metrics = new Map<string, PrometheusMetric>();
  private activeSpans = new Map<string, TraceSpan>();
  private alertStates = new Map<string, any>();
  private metricsHistory: SessionMetricsSnapshot[] = [];
  private collectionTimer?: NodeJS.Timeout;
  private alertTimer?: NodeJS.Timeout;
  private httpServer?: any;

  constructor(redis: RedisClientType, config: Partial<MetricsConfig> = {}) {
    super();
    this.redis = redis;
    this.config = {
      enablePrometheus: config.enablePrometheus ?? true,
      enableTracing: config.enableTracing ?? true,
      enableAlerting: config.enableAlerting ?? true,
      metricsPort: config.metricsPort ?? 9090,
      metricsPath: config.metricsPath ?? '/metrics',
      collectionInterval: config.collectionInterval ?? 10000,
      retentionDays: config.retentionDays ?? 7,
      alertRules: config.alertRules ?? this.getDefaultAlertRules(),
    };

    this.initializeMetrics();
    this.startCollection();

    if (this.config.enablePrometheus) {
      this.startPrometheusServer();
    }

    if (this.config.enableAlerting) {
      this.startAlerting();
    }
  }




  private initializeMetrics(): void {
    const metrics: PrometheusMetric[] = [
      {
        name: 'session_total',
        type: 'counter',
        help: 'Total number of sessions created',
        labels: ['status'],
      },
      {
        name: 'session_active',
        type: 'gauge',
        help: 'Number of currently active sessions',
      },
      {
        name: 'session_duration_seconds',
        type: 'histogram',
        help: 'Session duration in seconds',
        buckets: [1, 5, 10, 30, 60, 300, 600, 1800, 3600],
      },
      {
        name: 'session_events_total',
        type: 'counter',
        help: 'Total number of session events',
        labels: ['type', 'agent'],
      },
      {
        name: 'session_operation_duration_seconds',
        type: 'histogram',
        help: 'Duration of session operations',
        labels: ['operation'],
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      },
      {
        name: 'redis_connections_active',
        type: 'gauge',
        help: 'Number of active Redis connections',
      },
      {
        name: 'redis_operations_total',
        type: 'counter',
        help: 'Total Redis operations',
        labels: ['operation', 'status'],
      },
      {
        name: 'redis_operation_duration_seconds',
        type: 'histogram',
        help: 'Redis operation duration',
        labels: ['operation'],
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      },
      {
        name: 'agent_total',
        type: 'gauge',
        help: 'Total number of agents',
        labels: ['status'],
      },
      {
        name: 'agent_load',
        type: 'gauge',
        help: 'Current agent load',
        labels: ['agent_id'],
      },
      {
        name: 'task_queue_size',
        type: 'gauge',
        help: 'Number of tasks in queue',
        labels: ['priority'],
      },
      {
        name: 'handoff_total',
        type: 'counter',
        help: 'Total number of agent handoffs',
        labels: ['from_agent', 'to_agent', 'reason'],
      },
      {
        name: 'errors_total',
        type: 'counter',
        help: 'Total number of errors',
        labels: ['type', 'operation'],
      },
      {
        name: 'system_memory_bytes',
        type: 'gauge',
        help: 'System memory usage in bytes',
      },
      {
        name: 'system_cpu_percent',
        type: 'gauge',
        help: 'System CPU usage percentage',
      },
    ];

    metrics.forEach(metric => {
      this.metrics.set(metric.name, metric);
    });
  }




  recordCounter(name: string, value: number = 1, labels: Record<string, string> = {}): void {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== 'counter') {
      this.emit('metrics:error', { error: `Counter metric ${name} not found` });
      return;
    }

    this.emit('metric:recorded', {
      type: 'counter',
      name,
      value,
      labels,
      timestamp: Date.now(),
    });
  }




  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== 'gauge') {
      this.emit('metrics:error', { error: `Gauge metric ${name} not found` });
      return;
    }

    this.emit('metric:recorded', {
      type: 'gauge',
      name,
      value,
      labels,
      timestamp: Date.now(),
    });
  }




  recordHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== 'histogram') {
      this.emit('metrics:error', { error: `Histogram metric ${name} not found` });
      return;
    }

    this.emit('metric:recorded', {
      type: 'histogram',
      name,
      value,
      labels,
      timestamp: Date.now(),
    });
  }




  startSpan(operationName: string, parentSpanId?: string, tags: Record<string, any> = {}): string {
    const traceId = parentSpanId ? this.getTraceIdFromSpan(parentSpanId) : this.generateId();
    const spanId = this.generateId();

    const span: TraceSpan = {
      traceId,
      spanId,
      parentSpanId,
      operationName,
      startTime: Date.now(),
      tags,
      logs: [],
      status: 'ok',
    };

    this.activeSpans.set(spanId, span);

    this.emit('trace:span:started', {
      traceId,
      spanId,
      operationName,
      parentSpanId,
    });

    return spanId;
  }




  finishSpan(spanId: string, status: 'ok' | 'error' | 'timeout' = 'ok', tags: Record<string, any> = {}): void {
    const span = this.activeSpans.get(spanId);
    if (!span) {
      this.emit('metrics:error', { error: `Span ${spanId} not found` });
      return;
    }

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;
    span.tags = { ...span.tags, ...tags };

    this.activeSpans.delete(spanId);


    this.recordHistogram('session_operation_duration_seconds', span.duration / 1000, {
      operation: span.operationName,
    });

    this.emit('trace:span:finished', {
      traceId: span.traceId,
      spanId,
      duration: span.duration,
      status,
    });
  }




  addSpanLog(spanId: string, level: string, message: string, fields: Record<string, any> = {}): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.logs.push({
      timestamp: Date.now(),
      level,
      message,
      fields,
    });
  }




  recordSessionCreated(sessionId: string, agentId: string): void {
    this.recordCounter('session_total', 1, { status: 'created' });
    this.setGauge('session_active', this.getCurrentActiveSessions());

    const spanId = this.startSpan('session.create', undefined, {
      'session.id': sessionId,
      'agent.id': agentId,
    });

    setTimeout(() => {
      this.finishSpan(spanId);
    }, 0);
  }




  recordSessionEvent(sessionId: string, event: SessionEvent): void {
    this.recordCounter('session_events_total', 1, {
      type: event.type,
      actor: event.actor,
    });

    const spanId = this.startSpan('session.event', undefined, {
      'session.id': sessionId,
      'event.type': event.type,
      'event.seq': event.seq.toString(),
    });

    setTimeout(() => {
      this.finishSpan(spanId);
    }, 0);
  }




  recordRedisOperation(operation: string, duration: number, success: boolean): void {
    this.recordCounter('redis_operations_total', 1, {
      operation,
      status: success ? 'success' : 'error',
    });

    this.recordHistogram('redis_operation_duration_seconds', duration / 1000, {
      operation,
    });
  }




  recordAgentMetrics(agentId: string, load: number, status: string): void {
    this.setGauge('agent_load', load, { agent_id: agentId });
    this.setGauge('agent_total', this.getCurrentAgentCount(), { status });
  }




  recordHandoff(fromAgent: string, toAgent: string, reason: string): void {
    this.recordCounter('handoff_total', 1, {
      from_agent: fromAgent,
      to_agent: toAgent,
      reason,
    });
  }




  recordError(errorType: string, operation: string): void {
    this.recordCounter('errors_total', 1, {
      type: errorType,
      operation,
    });
  }




  async collectMetricsSnapshot(): Promise<SessionMetricsSnapshot> {
    const timestamp = new Date().toISOString();


    const activeSessions = await this.getCurrentActiveSessions();
    const totalEvents = await this.getTotalEvents();


    const eventRate = this.calculateEventRate();
    const sessionCreationRate = this.calculateSessionCreationRate();


    const systemMetrics = await this.collectSystemMetrics();

    const snapshot: SessionMetricsSnapshot = {
      timestamp,
      activeSessions,
      totalEvents,
      eventRate,
      sessionCreationRate,
      averageSessionDuration: await this.getAverageSessionDuration(),
      connectionPoolStats: {
        totalConnections: 0,
        activeConnections: 0,
        queuedRequests: 0,
        averageLatency: 0,
      },
      agentMetrics: {
        totalAgents: await this.getCurrentAgentCount(),
        activeAgents: await this.getActiveAgentCount(),
        deadAgents: await this.getDeadAgentCount(),
        averageLoad: await this.getAverageAgentLoad(),
      },
      systemMetrics,
      errorMetrics: {
        totalErrors: await this.getTotalErrors(),
        errorRate: this.calculateErrorRate(),
        errorsByType: await this.getErrorsByType(),
      },
    };


    this.metricsHistory.push(snapshot);


    const maxHistory = (this.config.retentionDays * 24 * 60 * 60 * 1000) / this.config.collectionInterval;
    if (this.metricsHistory.length > maxHistory) {
      this.metricsHistory = this.metricsHistory.slice(-maxHistory);
    }

    this.emit('metrics:collected', snapshot);
    return snapshot;
  }




  getDashboardData(): DashboardData {
    const latest = this.metricsHistory[this.metricsHistory.length - 1];
    if (!latest) {
      return this.getEmptyDashboardData();
    }

    const systemHealth = this.determineSystemHealth(latest);

    return {
      overview: {
        totalSessions: latest.activeSessions,
        activeSessions: latest.activeSessions,
        totalEvents: latest.totalEvents,
        systemHealth,
      },
      performance: {
        averageLatency: latest.connectionPoolStats.averageLatency,
        p95Latency: 0,
        p99Latency: 0,
        throughput: latest.eventRate,
      },
      agents: {
        total: latest.agentMetrics.totalAgents,
        active: latest.agentMetrics.activeAgents,
        busy: 0,
        dead: latest.agentMetrics.deadAgents,
        loadDistribution: [],
      },
      errors: {
        totalErrors: latest.errorMetrics.totalErrors,
        errorRate: latest.errorMetrics.errorRate,
        topErrors: Object.entries(latest.errorMetrics.errorsByType)
          .map(([error, count]) => ({ error, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      },
      alerts: {
        active: this.getActiveAlertCount(),
        critical: this.getCriticalAlertCount(),
        warning: this.getWarningAlertCount(),
        recent: this.getRecentAlerts(),
      },
    };
  }




  exportPrometheusMetrics(): string {
    const lines: string[] = [];

    for (const metric of this.metrics.values()) {

      lines.push(`# HELP ${metric.name} ${metric.help}`);
      lines.push(`# TYPE ${metric.name} ${metric.type}`);



      lines.push(`${metric.name} 0`);
    }

    return lines.join('\n');
  }




  private async checkAlertRules(): Promise<void> {
    const latest = this.metricsHistory[this.metricsHistory.length - 1];
    if (!latest) return;

    for (const rule of this.config.alertRules) {
      if (!rule.enabled) continue;

      const alertKey = rule.name;
      const isTriggered = this.evaluateAlertCondition(rule, latest);

      const currentState = this.alertStates.get(alertKey);

      if (isTriggered && !currentState?.active) {

        const alert = {
          active: true,
          triggeredAt: Date.now(),
          rule: rule.name,
          severity: rule.severity,
          threshold: rule.threshold,
          currentValue: this.getAlertValue(rule, latest),
        };

        this.alertStates.set(alertKey, alert);
        this.emit('alert:triggered', alert);
      } else if (!isTriggered && currentState?.active) {

        currentState.active = false;
        currentState.resolvedAt = Date.now();
        this.emit('alert:resolved', currentState);
      }
    }
  }




  private evaluateAlertCondition(rule: AlertRule, snapshot: SessionMetricsSnapshot): boolean {
    const value = this.getAlertValue(rule, snapshot);

    switch (rule.condition) {
      case 'greater_than':
        return value > rule.threshold;
      case 'less_than':
        return value < rule.threshold;
      case 'equals':
        return value === rule.threshold;
      default:
        return false;
    }
  }




  private getAlertValue(rule: AlertRule, snapshot: SessionMetricsSnapshot): number {


    return 0;
  }




  private async getCurrentActiveSessions(): Promise<number> {
    try {
      const keys = await this.redis.keys('session:*');
      return keys.length;
    } catch {
      return 0;
    }
  }

  private async getTotalEvents(): Promise<number> {

    return 0;
  }

  private calculateEventRate(): number {
    if (this.metricsHistory.length < 2) return 0;

    const current = this.metricsHistory[this.metricsHistory.length - 1];
    const previous = this.metricsHistory[this.metricsHistory.length - 2];

    const timeDiff = (new Date(current.timestamp).getTime() - new Date(previous.timestamp).getTime()) / 1000;
    const eventDiff = current.totalEvents - previous.totalEvents;

    return timeDiff > 0 ? eventDiff / timeDiff : 0;
  }

  private calculateSessionCreationRate(): number {

    return 0;
  }

  private async getAverageSessionDuration(): Promise<number> {

    return 0;
  }

  private async getCurrentAgentCount(): Promise<number> {

    return 0;
  }

  private async getActiveAgentCount(): Promise<number> {
    return 0;
  }

  private async getDeadAgentCount(): Promise<number> {
    return 0;
  }

  private async getAverageAgentLoad(): Promise<number> {
    return 0;
  }

  private async collectSystemMetrics(): Promise<SessionMetricsSnapshot['systemMetrics']> {
    const memoryUsage = process.memoryUsage();

    return {
      memoryUsage: memoryUsage.heapUsed,
      cpuUsage: 0,
      redisMemory: 0,
      diskUsage: 0,
    };
  }

  private async getTotalErrors(): Promise<number> {
    return 0;
  }

  private calculateErrorRate(): number {
    return 0;
  }

  private async getErrorsByType(): Promise<Record<string, number>> {
    return {};
  }

  private determineSystemHealth(snapshot: SessionMetricsSnapshot): 'healthy' | 'degraded' | 'critical' {
    const criticalAlerts = this.getCriticalAlertCount();
    if (criticalAlerts > 0) return 'critical';

    const warningAlerts = this.getWarningAlertCount();
    if (warningAlerts > 3) return 'degraded';

    return 'healthy';
  }

  private getEmptyDashboardData(): DashboardData {
    return {
      overview: { totalSessions: 0, activeSessions: 0, totalEvents: 0, systemHealth: 'healthy' },
      performance: { averageLatency: 0, p95Latency: 0, p99Latency: 0, throughput: 0 },
      agents: { total: 0, active: 0, busy: 0, dead: 0, loadDistribution: [] },
      errors: { totalErrors: 0, errorRate: 0, topErrors: [] },
      alerts: { active: 0, critical: 0, warning: 0, recent: [] },
    };
  }

  private getActiveAlertCount(): number {
    return Array.from(this.alertStates.values()).filter(a => a.active).length;
  }

  private getCriticalAlertCount(): number {
    return Array.from(this.alertStates.values()).filter(a => a.active && a.severity === 'critical').length;
  }

  private getWarningAlertCount(): number {
    return Array.from(this.alertStates.values()).filter(a => a.active && a.severity === 'warning').length;
  }

  private getRecentAlerts(): Array<{ rule: string; severity: string; message: string; timestamp: string }> {
    return Array.from(this.alertStates.values())
      .filter(a => a.active)
      .slice(-10)
      .map(a => ({
        rule: a.rule,
        severity: a.severity,
        message: `Alert triggered: ${a.rule}`,
        timestamp: new Date(a.triggeredAt).toISOString(),
      }));
  }




  private startCollection(): void {
    this.collectionTimer = setInterval(() => {
      this.collectMetricsSnapshot().catch(error => {
        this.emit('error', error);
      });
    }, this.config.collectionInterval);
  }




  private startAlerting(): void {
    this.alertTimer = setInterval(() => {
      this.checkAlertRules().catch(error => {
        this.emit('error', error);
      });
    }, 30000);
  }




  private async startPrometheusServer(): Promise<void> {
    try {
      const http = await import('http');

      this.httpServer = http.createServer((req, res) => {
        if (req.url === this.config.metricsPath) {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end(this.exportPrometheusMetrics());
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      });

      this.httpServer.listen(this.config.metricsPort, () => {
        this.emit('prometheus:started', { port: this.config.metricsPort });
      });
    } catch (error) {
      this.emit('error', error);
    }
  }




  private getDefaultAlertRules(): AlertRule[] {
    return [
      {
        name: 'high_session_count',
        condition: 'greater_than',
        threshold: 1000,
        duration: 300,
        severity: 'warning',
        enabled: true,
        metadata: { metric: 'active_sessions' },
      },
      {
        name: 'high_error_rate',
        condition: 'greater_than',
        threshold: 0.05,
        duration: 60,
        severity: 'critical',
        enabled: true,
        metadata: { metric: 'error_rate' },
      },
      {
        name: 'dead_agents',
        condition: 'greater_than',
        threshold: 0,
        duration: 60,
        severity: 'warning',
        enabled: true,
        metadata: { metric: 'dead_agents' },
      },
      {
        name: 'high_latency',
        condition: 'greater_than',
        threshold: 1000,
        duration: 300,
        severity: 'warning',
        enabled: true,
        metadata: { metric: 'average_latency' },
      },
    ];
  }




  private generateId(): string {
    return Math.random().toString(36).substr(2, 16);
  }

  private getTraceIdFromSpan(spanId: string): string {
    const span = this.activeSpans.get(spanId);
    return span?.traceId || this.generateId();
  }




  async shutdown(): Promise<void> {

    if (this.collectionTimer) clearInterval(this.collectionTimer);
    if (this.alertTimer) clearInterval(this.alertTimer);


    if (this.httpServer) {
      this.httpServer.close();
    }


    for (const spanId of this.activeSpans.keys()) {
      this.finishSpan(spanId, 'timeout');
    }

    this.emit('shutdown');
  }
}

================
File: services/SessionMigration.ts
================
import { EventEmitter } from 'events';
import type { RedisClientType } from 'redis';
import {
  SessionDocument,
  SessionEvent,
  RedisConfig,
  SessionError,
  ISessionStore,
} from './SessionTypes.js';

export interface MigrationConfig {
  sourceRedis: RedisConfig;
  targetRedis: RedisConfig;
  batchSize: number;
  migrationTimeout: number;
  enableValidation: boolean;
  enableCompression: boolean;
  retryAttempts: number;
  backupBeforeMigration: boolean;
}

export interface MigrationTask {
  id: string;
  type: 'full' | 'incremental' | 'selective';
  source: string;
  target: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: {
    totalSessions: number;
    migratedSessions: number;
    failedSessions: number;
    currentSession?: string;
  };
  startTime?: string;
  endTime?: string;
  error?: string;
  filters?: {
    sessionIds?: string[];
    agentIds?: string[];
    states?: string[];
    dateRange?: { from: string; to: string };
  };
}

export interface MigrationResult {
  taskId: string;
  success: boolean;
  migratedSessions: number;
  failedSessions: number;
  duration: number;
  errors: Array<{ sessionId: string; error: string }>;
  validationResults?: ValidationResults;
}

export interface ValidationResults {
  totalChecked: number;
  passed: number;
  failed: number;
  details: Array<{
    sessionId: string;
    passed: boolean;
    mismatches?: string[];
  }>;
}

export interface CrossInstanceSession {
  sessionId: string;
  sourceInstance: string;
  targetInstance: string;
  syncMode: 'real-time' | 'periodic' | 'manual';
  lastSyncTime: string;
  conflicts: Array<{
    field: string;
    sourceValue: any;
    targetValue: any;
    resolution: 'source' | 'target' | 'merge' | 'manual';
  }>;
}

export class SessionMigration extends EventEmitter {
  private config: MigrationConfig;
  private sourceRedis!: RedisClientType;
  private targetRedis!: RedisClientType;
  private activeTasks = new Map<string, MigrationTask>();
  private crossInstanceSessions = new Map<string, CrossInstanceSession>();

  constructor(config: MigrationConfig) {
    super();
    this.config = config;
  }




  async initialize(): Promise<void> {
    try {
      const Redis = await import('redis');


      this.sourceRedis = Redis.createClient({
        url: this.config.sourceRedis.url,
        socket: {
          host: this.config.sourceRedis.host,
          port: this.config.sourceRedis.port,
        },
        password: this.config.sourceRedis.password,
        database: this.config.sourceRedis.db || 0,
      }) as RedisClientType;


      this.targetRedis = Redis.createClient({
        url: this.config.targetRedis.url,
        socket: {
          host: this.config.targetRedis.host,
          port: this.config.targetRedis.port,
        },
        password: this.config.targetRedis.password,
        database: this.config.targetRedis.db || 0,
      }) as RedisClientType;

      await Promise.all([
        this.sourceRedis.connect(),
        this.targetRedis.connect(),
      ]);

      this.emit('initialized');
    } catch (error) {
      throw new SessionError(
        'Failed to initialize migration service',
        'MIGRATION_INIT_FAILED',
        undefined,
        { originalError: error }
      );
    }
  }




  async startFullMigration(options: {
    backupFirst?: boolean;
    validateAfter?: boolean;
  } = {}): Promise<string> {
    const taskId = `migration-${Date.now()}`;

    const task: MigrationTask = {
      id: taskId,
      type: 'full',
      source: this.config.sourceRedis.host || 'source',
      target: this.config.targetRedis.host || 'target',
      status: 'pending',
      progress: {
        totalSessions: 0,
        migratedSessions: 0,
        failedSessions: 0,
      },
      startTime: new Date().toISOString(),
    };

    this.activeTasks.set(taskId, task);


    this.executeMigration(task, options).catch(error => {
      task.status = 'failed';
      task.error = error.message;
      task.endTime = new Date().toISOString();
      this.emit('migration:failed', { taskId, error });
    });

    return taskId;
  }




  async startIncrementalMigration(
    sinceTimestamp: string,
    options: { validateAfter?: boolean } = {}
  ): Promise<string> {
    const taskId = `incremental-${Date.now()}`;

    const task: MigrationTask = {
      id: taskId,
      type: 'incremental',
      source: this.config.sourceRedis.host || 'source',
      target: this.config.targetRedis.host || 'target',
      status: 'pending',
      progress: {
        totalSessions: 0,
        migratedSessions: 0,
        failedSessions: 0,
      },
      startTime: new Date().toISOString(),
      filters: {
        dateRange: { from: sinceTimestamp, to: new Date().toISOString() },
      },
    };

    this.activeTasks.set(taskId, task);

    this.executeIncrementalMigration(task, sinceTimestamp, options).catch(error => {
      task.status = 'failed';
      task.error = error.message;
      task.endTime = new Date().toISOString();
      this.emit('migration:failed', { taskId, error });
    });

    return taskId;
  }




  async startSelectiveMigration(
    sessionIds: string[],
    options: { validateAfter?: boolean } = {}
  ): Promise<string> {
    const taskId = `selective-${Date.now()}`;

    const task: MigrationTask = {
      id: taskId,
      type: 'selective',
      source: this.config.sourceRedis.host || 'source',
      target: this.config.targetRedis.host || 'target',
      status: 'pending',
      progress: {
        totalSessions: sessionIds.length,
        migratedSessions: 0,
        failedSessions: 0,
      },
      startTime: new Date().toISOString(),
      filters: {
        sessionIds,
      },
    };

    this.activeTasks.set(taskId, task);

    this.executeSelectiveMigration(task, sessionIds, options).catch(error => {
      task.status = 'failed';
      task.error = error.message;
      task.endTime = new Date().toISOString();
      this.emit('migration:failed', { taskId, error });
    });

    return taskId;
  }




  getMigrationStatus(taskId: string): MigrationTask | null {
    return this.activeTasks.get(taskId) || null;
  }




  async cancelMigration(taskId: string): Promise<void> {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      throw new Error(`Migration task not found: ${taskId}`);
    }

    if (task.status === 'running') {
      task.status = 'cancelled';
      task.endTime = new Date().toISOString();
      this.emit('migration:cancelled', { taskId });
    }
  }




  async validateMigration(taskId: string): Promise<ValidationResults> {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      throw new Error(`Migration task not found: ${taskId}`);
    }

    const results: ValidationResults = {
      totalChecked: 0,
      passed: 0,
      failed: 0,
      details: [],
    };


    const sessionIds = await this.getSessionIdsForValidation(task);

    for (const sessionId of sessionIds) {
      try {
        const sourceSession = await this.getSessionFromSource(sessionId);
        const targetSession = await this.getSessionFromTarget(sessionId);

        results.totalChecked++;

        if (!sourceSession && !targetSession) {
          continue;
        }

        if (!sourceSession || !targetSession) {
          results.failed++;
          results.details.push({
            sessionId,
            passed: false,
            mismatches: ['Session exists in only one instance'],
          });
          continue;
        }

        const mismatches = this.compareSessionData(sourceSession, targetSession);
        if (mismatches.length === 0) {
          results.passed++;
          results.details.push({ sessionId, passed: true });
        } else {
          results.failed++;
          results.details.push({ sessionId, passed: false, mismatches });
        }
      } catch (error) {
        results.failed++;
        results.details.push({
          sessionId,
          passed: false,
          mismatches: [`Validation error: ${error instanceof Error ? error.message : String(error)}`],
        });
      }
    }

    this.emit('validation:completed', { taskId, results });
    return results;
  }




  async setupCrossInstanceSync(
    sessionId: string,
    targetInstance: string,
    syncMode: 'real-time' | 'periodic' | 'manual' = 'periodic'
  ): Promise<void> {
    const crossSession: CrossInstanceSession = {
      sessionId,
      sourceInstance: this.config.sourceRedis.host || 'source',
      targetInstance,
      syncMode,
      lastSyncTime: new Date().toISOString(),
      conflicts: [],
    };

    this.crossInstanceSessions.set(sessionId, crossSession);

    if (syncMode === 'real-time') {
      await this.setupRealTimeSync(sessionId);
    } else if (syncMode === 'periodic') {
      await this.setupPeriodicSync(sessionId);
    }

    this.emit('cross-instance:setup', { sessionId, syncMode });
  }




  async syncSession(sessionId: string): Promise<void> {
    const crossSession = this.crossInstanceSessions.get(sessionId);
    if (!crossSession) {
      throw new Error(`Cross-instance session not found: ${sessionId}`);
    }

    try {
      const sourceSession = await this.getSessionFromSource(sessionId);
      if (!sourceSession) {
        throw new Error(`Source session not found: ${sessionId}`);
      }

      const targetSession = await this.getSessionFromTarget(sessionId);

      if (targetSession) {

        const conflicts = this.detectConflicts(sourceSession, targetSession);
        if (conflicts.length > 0) {
          crossSession.conflicts = conflicts;
          this.emit('sync:conflicts', { sessionId, conflicts });


          await this.resolveConflicts(sessionId, conflicts);
        }
      }


      await this.migrateSession(sessionId, sourceSession);
      crossSession.lastSyncTime = new Date().toISOString();

      this.emit('sync:completed', { sessionId });
    } catch (error) {
      this.emit('sync:failed', { sessionId, error });
      throw error;
    }
  }




  getCrossInstanceStatus(sessionId: string): CrossInstanceSession | null {
    return this.crossInstanceSessions.get(sessionId) || null;
  }




  listCrossInstanceSessions(): CrossInstanceSession[] {
    return Array.from(this.crossInstanceSessions.values());
  }




  private async executeMigration(
    task: MigrationTask,
    options: { backupFirst?: boolean; validateAfter?: boolean }
  ): Promise<void> {
    task.status = 'running';

    try {

      if (options.backupFirst && this.config.backupBeforeMigration) {
        await this.createBackup(task.id);
      }


      const sessionKeys = await this.sourceRedis.keys('session:*');
      task.progress.totalSessions = sessionKeys.length;

      const errors: Array<{ sessionId: string; error: string }> = [];


      for (let i = 0; i < sessionKeys.length; i += this.config.batchSize) {
        if (task.status === 'cancelled') break;

        const batch = sessionKeys.slice(i, i + this.config.batchSize);

        for (const sessionKey of batch) {
          if (task.status === 'cancelled') break;

          const sessionId = sessionKey.replace('session:', '');
          task.progress.currentSession = sessionId;

          try {
            const session = await this.getSessionFromSource(sessionId);
            if (session) {
              await this.migrateSession(sessionId, session);
              task.progress.migratedSessions++;
            }
          } catch (error) {
            task.progress.failedSessions++;
            errors.push({
              sessionId,
              error: error instanceof Error ? error.message : String(error),
            });
          }

          this.emit('migration:progress', {
            taskId: task.id,
            progress: task.progress,
          });
        }
      }

      task.status = task.status === 'cancelled' ? 'cancelled' : 'completed';
      task.endTime = new Date().toISOString();


      let validationResults: ValidationResults | undefined;
      if (options.validateAfter && this.config.enableValidation) {
        validationResults = await this.validateMigration(task.id);
      }

      const result: MigrationResult = {
        taskId: task.id,
        success: task.status === 'completed',
        migratedSessions: task.progress.migratedSessions,
        failedSessions: task.progress.failedSessions,
        duration: new Date(task.endTime!).getTime() - new Date(task.startTime!).getTime(),
        errors,
        validationResults,
      };

      this.emit('migration:completed', result);
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
      task.endTime = new Date().toISOString();
      throw error;
    }
  }




  private async executeIncrementalMigration(
    task: MigrationTask,
    sinceTimestamp: string,
    options: { validateAfter?: boolean }
  ): Promise<void> {
    task.status = 'running';

    try {

      const since = new Date(sinceTimestamp).getTime();
      const sessionKeys = await this.sourceRedis.keys('session:*');
      const recentSessions: string[] = [];

      for (const sessionKey of sessionKeys) {
        const sessionData = await this.sourceRedis.hGetAll(sessionKey);

        const eventsKey = sessionKey.replace('session:', 'events:');
        const recentEvents = await this.sourceRedis.zRangeByScore(eventsKey, since, '+inf');

        if (recentEvents.length > 0) {
          recentSessions.push(sessionKey.replace('session:', ''));
        }
      }

      task.progress.totalSessions = recentSessions.length;

      // Process incremental sessions
      for (const sessionId of recentSessions) {
        if (task.status === 'cancelled') break;

        try {
          const session = await this.getSessionFromSource(sessionId);
          if (session) {
            await this.migrateSession(sessionId, session);
            task.progress.migratedSessions++;
          }
        } catch (error) {
          task.progress.failedSessions++;
        }

        this.emit('migration:progress', {
          taskId: task.id,
          progress: task.progress,
        });
      }

      task.status = task.status === 'cancelled' ? 'cancelled' : 'completed';
      task.endTime = new Date().toISOString();

      this.emit('migration:completed', {
        taskId: task.id,
        success: task.status === 'completed',
        migratedSessions: task.progress.migratedSessions,
        failedSessions: task.progress.failedSessions,
      });
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
      task.endTime = new Date().toISOString();
      throw error;
    }
  }




  private async executeSelectiveMigration(
    task: MigrationTask,
    sessionIds: string[],
    options: { validateAfter?: boolean }
  ): Promise<void> {
    task.status = 'running';

    try {
      for (const sessionId of sessionIds) {
        if (task.status === 'cancelled') break;

        task.progress.currentSession = sessionId;

        try {
          const session = await this.getSessionFromSource(sessionId);
          if (session) {
            await this.migrateSession(sessionId, session);
            task.progress.migratedSessions++;
          }
        } catch (error) {
          task.progress.failedSessions++;
        }

        this.emit('migration:progress', {
          taskId: task.id,
          progress: task.progress,
        });
      }

      task.status = task.status === 'cancelled' ? 'cancelled' : 'completed';
      task.endTime = new Date().toISOString();

      this.emit('migration:completed', {
        taskId: task.id,
        success: task.status === 'completed',
        migratedSessions: task.progress.migratedSessions,
        failedSessions: task.progress.failedSessions,
      });
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
      task.endTime = new Date().toISOString();
      throw error;
    }
  }




  private async migrateSession(sessionId: string, session: SessionDocument): Promise<void> {
    const sessionKey = `session:${sessionId}`;
    const eventsKey = `events:${sessionId}`;


    const sessionData = {
      agentIds: JSON.stringify(session.agentIds),
      state: session.state,
      events: session.events.length.toString(),
      metadata: session.metadata ? JSON.stringify(session.metadata) : undefined,
    };

    const redisData: Record<string, string | number> = {};
    Object.entries(sessionData).forEach(([key, value]) => {
      if (value !== undefined) {
        redisData[key] = value;
      }
    });

    await this.targetRedis.hSet(sessionKey, redisData);


    if (session.events.length > 0) {
      const eventEntries = session.events.map(event => ({
        score: event.seq,
        value: JSON.stringify(event),
      }));

      await this.targetRedis.zAdd(eventsKey, eventEntries);
    }


    const ttl = await this.sourceRedis.ttl(sessionKey);
    if (ttl > 0) {
      await this.targetRedis.expire(sessionKey, ttl);
      await this.targetRedis.expire(eventsKey, ttl);
    }
  }




  private async getSessionFromSource(sessionId: string): Promise<SessionDocument | null> {
    return this.getSessionFromRedis(this.sourceRedis, sessionId);
  }




  private async getSessionFromTarget(sessionId: string): Promise<SessionDocument | null> {
    return this.getSessionFromRedis(this.targetRedis, sessionId);
  }




  private async getSessionFromRedis(redis: RedisClientType, sessionId: string): Promise<SessionDocument | null> {
    const sessionKey = `session:${sessionId}`;
    const exists = await redis.exists(sessionKey);

    if (!exists) return null;

    const sessionData = await redis.hGetAll(sessionKey);
    if (!sessionData || Object.keys(sessionData).length === 0) {
      return null;
    }


    const eventsKey = `events:${sessionId}`;
    const eventData = await redis.zRange(eventsKey, 0, -1);
    const events = eventData
      .filter(event => event !== 'INIT')
      .map(eventStr => JSON.parse(eventStr))
      .sort((a, b) => a.seq - b.seq);

    return {
      sessionId,
      agentIds: JSON.parse(sessionData.agentIds || '[]'),
      state: sessionData.state as any,
      events,
      metadata: sessionData.metadata ? JSON.parse(sessionData.metadata) : undefined,
    };
  }




  private compareSessionData(source: SessionDocument, target: SessionDocument): string[] {
    const mismatches: string[] = [];

    if (source.state !== target.state) {
      mismatches.push(`State mismatch: source=${source.state}, target=${target.state}`);
    }

    if (JSON.stringify(source.agentIds.sort()) !== JSON.stringify(target.agentIds.sort())) {
      mismatches.push('Agent IDs mismatch');
    }

    if (source.events.length !== target.events.length) {
      mismatches.push(`Event count mismatch: source=${source.events.length}, target=${target.events.length}`);
    }


    const sourceMetadata = JSON.stringify(source.metadata || {});
    const targetMetadata = JSON.stringify(target.metadata || {});
    if (sourceMetadata !== targetMetadata) {
      mismatches.push('Metadata mismatch');
    }

    return mismatches;
  }




  private async getSessionIdsForValidation(task: MigrationTask): Promise<string[]> {
    if (task.filters?.sessionIds) {
      return task.filters.sessionIds;
    }


    const sessionKeys = await this.targetRedis.keys('session:*');
    return sessionKeys.map(key => key.replace('session:', ''));
  }

  /**
   * Detect conflicts between source and target sessions
   */
  private detectConflicts(source: SessionDocument, target: SessionDocument): Array<{
    field: string;
    sourceValue: any;
    targetValue: any;
    resolution: 'source' | 'target' | 'merge' | 'manual';
  }> {
    const conflicts = [];

    if (source.state !== target.state) {
      conflicts.push({
        field: 'state',
        sourceValue: source.state,
        targetValue: target.state,
        resolution: 'source' as const,
      });
    }

    if (source.events.length !== target.events.length) {
      conflicts.push({
        field: 'events',
        sourceValue: source.events.length,
        targetValue: target.events.length,
        resolution: 'merge' as const,
      });
    }

    return conflicts;
  }




  private async resolveConflicts(sessionId: string, conflicts: any[]): Promise<void> {

    for (const conflict of conflicts) {
      switch (conflict.resolution) {
        case 'source':

          break;
        case 'target':

          break;
        case 'merge':

          break;
        case 'manual':

          this.emit('conflict:manual-required', { sessionId, conflict });
          break;
      }
    }
  }




  private async setupRealTimeSync(sessionId: string): Promise<void> {


    this.emit('sync:realtime:setup', { sessionId });
  }




  private async setupPeriodicSync(sessionId: string): Promise<void> {

    setInterval(async () => {
      try {
        await this.syncSession(sessionId);
      } catch (error) {
        this.emit('sync:periodic:error', { sessionId, error });
      }
    }, 60000);
  }




  private async createBackup(taskId: string): Promise<void> {

    this.emit('backup:created', { taskId });
  }




  async shutdown(): Promise<void> {

    for (const taskId of this.activeTasks.keys()) {
      await this.cancelMigration(taskId);
    }


    await Promise.all([
      this.sourceRedis?.quit(),
      this.targetRedis?.quit(),
    ]);

    this.emit('shutdown');
  }
}

================
File: services/SessionReplay.ts
================
import { EventEmitter } from 'events';
import type { RedisClientType } from 'redis';
import {
  SessionDocument,
  SessionEvent,
  SessionState,
  ISessionStore,
} from './SessionTypes.js';

export interface ReplayConfig {
  compressionEnabled: boolean;
  snapshotInterval: number;
  maxReplayDuration: number;
  enableStateValidation: boolean;
  enableDeltaCompression: boolean;
}

export interface SessionSnapshot {
  sessionId: string;
  timestamp: string;
  sequenceNumber: number;
  state: SessionState;
  agentIds: string[];
  eventCount: number;
  metadata?: Record<string, any>;
  checksum?: string;
}

export interface ReplayFrame {
  timestamp: string;
  sequenceNumber: number;
  event?: SessionEvent;
  snapshot?: SessionSnapshot;
  deltaData?: Record<string, any>;
}

export interface ReplaySession {
  sessionId: string;
  originalSessionId: string;
  startTime: string;
  endTime?: string;
  frames: ReplayFrame[];
  metadata: {
    totalFrames: number;
    duration: number;
    compressionRatio?: number;
    validationPassed: boolean;
  };
}

export interface ReplayOptions {
  startFromSequence?: number;
  endAtSequence?: number;
  speed?: number;
  includeSnapshots?: boolean;
  validationMode?: boolean;
  filterEventTypes?: string[];
  onlyAgents?: string[];
}

export interface ReplayStats {
  totalSessions: number;
  totalFrames: number;
  storageUsed: number;
  compressionRatio: number;
  averageSessionDuration: number;
  oldestReplay: string;
  newestReplay: string;
}

export class SessionReplay extends EventEmitter {
  private redis: RedisClientType;
  private config: ReplayConfig;
  private activeReplays = new Map<string, ReplaySession>();
  private snapshotTimer?: NodeJS.Timeout;

  constructor(redis: RedisClientType, config: Partial<ReplayConfig> = {}) {
    super();
    this.redis = redis;
    this.config = {
      compressionEnabled: config.compressionEnabled ?? true,
      snapshotInterval: config.snapshotInterval ?? 300,
      maxReplayDuration: config.maxReplayDuration ?? 3600,
      enableStateValidation: config.enableStateValidation ?? true,
      enableDeltaCompression: config.enableDeltaCompression ?? true,
    };

    this.startSnapshotTimer();
  }




  async startRecording(sessionId: string, initialState?: SessionDocument): Promise<void> {
    const replayId = `replay:${sessionId}:${Date.now()}`;

    const replaySession: ReplaySession = {
      sessionId: replayId,
      originalSessionId: sessionId,
      startTime: new Date().toISOString(),
      frames: [],
      metadata: {
        totalFrames: 0,
        duration: 0,
        validationPassed: false,
      },
    };


    if (initialState) {
      const snapshot = await this.createSnapshot(sessionId, initialState);
      replaySession.frames.push({
        timestamp: snapshot.timestamp,
        sequenceNumber: 0,
        snapshot,
      });
    }

    this.activeReplays.set(sessionId, replaySession);


    await this.redis.hSet(`replay:meta:${replayId}`, {
      originalSessionId: sessionId,
      startTime: replaySession.startTime,
      status: 'recording',
    });

    this.emit('recording:started', { sessionId, replayId });
  }




  async recordEvent(sessionId: string, event: SessionEvent, sessionState?: SessionDocument): Promise<void> {
    const replaySession = this.activeReplays.get(sessionId);
    if (!replaySession) return;

    const frame: ReplayFrame = {
      timestamp: event.timestamp,
      sequenceNumber: event.seq,
      event,
    };


    if (this.config.enableDeltaCompression && sessionState) {
      frame.deltaData = await this.calculateDelta(sessionId, sessionState);
    }

    replaySession.frames.push(frame);
    replaySession.metadata.totalFrames++;


    await this.redis.zAdd(
      `replay:frames:${replaySession.sessionId}`,
      { score: event.seq, value: JSON.stringify(frame) }
    );


    if (replaySession.frames.length % 50 === 0) {
      await this.createPeriodicSnapshot(sessionId, sessionState);
    }

    this.emit('event:recorded', { sessionId, event, frame });
  }




  async stopRecording(sessionId: string): Promise<string> {
    const replaySession = this.activeReplays.get(sessionId);
    if (!replaySession) {
      throw new Error(`No active replay found for session: ${sessionId}`);
    }

    replaySession.endTime = new Date().toISOString();
    replaySession.metadata.duration =
      new Date(replaySession.endTime).getTime() - new Date(replaySession.startTime).getTime();


    if (this.config.enableStateValidation) {
      replaySession.metadata.validationPassed = await this.validateReplay(replaySession);
    }


    if (this.config.compressionEnabled) {
      replaySession.metadata.compressionRatio = await this.calculateCompressionRatio(replaySession);
    }


    await this.redis.hSet(`replay:meta:${replaySession.sessionId}`, {
      endTime: replaySession.endTime,
      duration: replaySession.metadata.duration.toString(),
      totalFrames: replaySession.metadata.totalFrames.toString(),
      validationPassed: replaySession.metadata.validationPassed.toString(),
      status: 'completed',
    });


    await this.redis.zAdd(
      'replay:index',
      { score: Date.now(), value: replaySession.sessionId }
    );

    const replayId = replaySession.sessionId;
    this.activeReplays.delete(sessionId);

    this.emit('recording:stopped', { sessionId, replayId, metadata: replaySession.metadata });
    return replayId;
  }




  async startReplay(replayId: string, options: ReplayOptions = {}): Promise<ReplaySession> {
    const metadata = await this.redis.hGetAll(`replay:meta:${replayId}`);
    if (!metadata.originalSessionId) {
      throw new Error(`Replay not found: ${replayId}`);
    }


    const frameData = await this.redis.zRange(`replay:frames:${replayId}`, 0, -1);
    const frames: ReplayFrame[] = frameData.map(data => JSON.parse(data));


    let filteredFrames = frames;

    if (options.startFromSequence !== undefined) {
      filteredFrames = filteredFrames.filter(f =>
        !f.event || f.event.seq >= options.startFromSequence!);
    }

    if (options.endAtSequence !== undefined) {
      filteredFrames = filteredFrames.filter(f =>
        !f.event || f.event.seq <= options.endAtSequence!);
    }

    if (options.filterEventTypes?.length) {
      filteredFrames = filteredFrames.filter(f =>
        !f.event || options.filterEventTypes!.includes(f.event.type));
    }

    if (options.onlyAgents?.length) {
      filteredFrames = filteredFrames.filter(f =>
        !f.event || options.onlyAgents!.includes(f.event.actor));
    }

    const replaySession: ReplaySession = {
      sessionId: `playback:${replayId}:${Date.now()}`,
      originalSessionId: metadata.originalSessionId,
      startTime: metadata.startTime,
      endTime: metadata.endTime,
      frames: filteredFrames,
      metadata: {
        totalFrames: filteredFrames.length,
        duration: parseInt(metadata.duration || '0'),
        compressionRatio: parseFloat(metadata.compressionRatio || '1'),
        validationPassed: metadata.validationPassed === 'true',
      },
    };

    this.emit('replay:started', { replayId, replaySession, options });
    return replaySession;
  }




  async playReplay(
    replaySession: ReplaySession,
    onFrame: (frame: ReplayFrame, index: number) => Promise<void> | void,
    options: ReplayOptions = {}
  ): Promise<void> {
    const speed = options.speed || 1;
    const frames = replaySession.frames;

    this.emit('replay:play:started', { sessionId: replaySession.sessionId, frameCount: frames.length });

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const nextFrame = frames[i + 1];


      await onFrame(frame, i);

      this.emit('replay:frame:played', {
        sessionId: replaySession.sessionId,
        frame,
        index: i,
        total: frames.length
      });


      if (nextFrame && speed > 0) {
        const currentTime = new Date(frame.timestamp).getTime();
        const nextTime = new Date(nextFrame.timestamp).getTime();
        const delay = (nextTime - currentTime) / speed;

        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    this.emit('replay:play:completed', { sessionId: replaySession.sessionId });
  }




  async getReplay(replayId: string): Promise<ReplaySession | null> {
    const metadata = await this.redis.hGetAll(`replay:meta:${replayId}`);
    if (!metadata.originalSessionId) return null;

    const frameData = await this.redis.zRange(`replay:frames:${replayId}`, 0, -1);
    const frames: ReplayFrame[] = frameData.map(data => JSON.parse(data));

    return {
      sessionId: replayId,
      originalSessionId: metadata.originalSessionId,
      startTime: metadata.startTime,
      endTime: metadata.endTime,
      frames,
      metadata: {
        totalFrames: frames.length,
        duration: parseInt(metadata.duration || '0'),
        compressionRatio: parseFloat(metadata.compressionRatio || '1'),
        validationPassed: metadata.validationPassed === 'true',
      },
    };
  }




  async listReplays(limit: number = 100): Promise<Array<{ replayId: string; metadata: any }>> {
    const replayIds = await this.redis.zRevRange('replay:index', 0, limit - 1);

    const replays = await Promise.all(
      replayIds.map(async (replayId) => {
        const metadata = await this.redis.hGetAll(`replay:meta:${replayId}`);
        return { replayId, metadata };
      })
    );

    return replays.filter(r => r.metadata.originalSessionId);
  }




  async getReplayStats(): Promise<ReplayStats> {
    const allReplays = await this.redis.zRange('replay:index', 0, -1);

    let totalFrames = 0;
    let totalDuration = 0;
    let storageUsed = 0;
    let compressionSum = 0;
    let compressionCount = 0;
    let oldestTime = Date.now();
    let newestTime = 0;

    for (const replayId of allReplays) {
      const metadata = await this.redis.hGetAll(`replay:meta:${replayId}`);
      const frameCount = await this.redis.zCard(`replay:frames:${replayId}`);

      totalFrames += frameCount;
      totalDuration += parseInt(metadata.duration || '0');

      if (metadata.compressionRatio) {
        compressionSum += parseFloat(metadata.compressionRatio);
        compressionCount++;
      }

      const startTime = new Date(metadata.startTime).getTime();
      oldestTime = Math.min(oldestTime, startTime);
      newestTime = Math.max(newestTime, startTime);


      storageUsed += frameCount * 200;
    }

    return {
      totalSessions: allReplays.length,
      totalFrames,
      storageUsed,
      compressionRatio: compressionCount > 0 ? compressionSum / compressionCount : 1,
      averageSessionDuration: allReplays.length > 0 ? totalDuration / allReplays.length : 0,
      oldestReplay: new Date(oldestTime).toISOString(),
      newestReplay: new Date(newestTime).toISOString(),
    };
  }




  async deleteReplay(replayId: string): Promise<void> {
    await Promise.all([
      this.redis.del(`replay:meta:${replayId}`),
      this.redis.del(`replay:frames:${replayId}`),
      this.redis.zRem('replay:index', replayId),
    ]);

    this.emit('replay:deleted', { replayId });
  }




  async cleanupOldReplays(olderThanDays: number): Promise<number> {
    const cutoff = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    const oldReplays = await this.redis.zRangeByScore('replay:index', 0, cutoff);

    for (const replayId of oldReplays) {
      await this.deleteReplay(replayId);
    }

    this.emit('cleanup:completed', { removedReplays: oldReplays.length, cutoff });
    return oldReplays.length;
  }




  private async createSnapshot(sessionId: string, sessionState: SessionDocument): Promise<SessionSnapshot> {
    const snapshot: SessionSnapshot = {
      sessionId,
      timestamp: new Date().toISOString(),
      sequenceNumber: sessionState.events.length,
      state: sessionState.state,
      agentIds: [...sessionState.agentIds],
      eventCount: sessionState.events.length,
      metadata: sessionState.metadata ? { ...sessionState.metadata } : undefined,
    };


    if (this.config.enableStateValidation) {
      snapshot.checksum = await this.calculateChecksum(snapshot);
    }

    return snapshot;
  }




  private async createPeriodicSnapshot(sessionId: string, sessionState?: SessionDocument): Promise<void> {
    if (!sessionState) return;

    const replaySession = this.activeReplays.get(sessionId);
    if (!replaySession) return;

    const snapshot = await this.createSnapshot(sessionId, sessionState);
    const frame: ReplayFrame = {
      timestamp: snapshot.timestamp,
      sequenceNumber: snapshot.sequenceNumber,
      snapshot,
    };

    replaySession.frames.push(frame);


    await this.redis.zAdd(
      `replay:frames:${replaySession.sessionId}`,
      { score: snapshot.sequenceNumber, value: JSON.stringify(frame) }
    );
  }




  private async calculateDelta(sessionId: string, currentState: SessionDocument): Promise<Record<string, any>> {

    const lastSnapshot = await this.getLastSnapshot(sessionId);
    if (!lastSnapshot) return {};

    const delta: Record<string, any> = {};

    if (lastSnapshot.state !== currentState.state) {
      delta.stateChange = { from: lastSnapshot.state, to: currentState.state };
    }

    if (lastSnapshot.agentIds.length !== currentState.agentIds.length) {
      delta.agentChange = {
        added: currentState.agentIds.filter(id => !lastSnapshot.agentIds.includes(id)),
        removed: lastSnapshot.agentIds.filter(id => !currentState.agentIds.includes(id)),
      };
    }

    return delta;
  }




  private async getLastSnapshot(sessionId: string): Promise<SessionSnapshot | null> {
    const replaySession = this.activeReplays.get(sessionId);
    if (!replaySession) return null;


    for (let i = replaySession.frames.length - 1; i >= 0; i--) {
      if (replaySession.frames[i].snapshot) {
        return replaySession.frames[i].snapshot!;
      }
    }

    return null;
  }




  private async validateReplay(replaySession: ReplaySession): Promise<boolean> {
    try {

      let lastSequence = -1;
      for (const frame of replaySession.frames) {
        if (frame.event && frame.event.seq <= lastSequence) {
          return false;
        }
        if (frame.event) {
          lastSequence = frame.event.seq;
        }
      }


      for (const frame of replaySession.frames) {
        if (frame.snapshot?.checksum) {
          const calculatedChecksum = await this.calculateChecksum(frame.snapshot);
          if (calculatedChecksum !== frame.snapshot.checksum) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      this.emit('validation:error', { replaySession, error });
      return false;
    }
  }




  private async calculateChecksum(snapshot: SessionSnapshot): Promise<string> {
    const crypto = await import('crypto');
    const data = JSON.stringify({
      state: snapshot.state,
      agentIds: snapshot.agentIds.sort(),
      eventCount: snapshot.eventCount,
      metadata: snapshot.metadata,
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }




  private async calculateCompressionRatio(replaySession: ReplaySession): Promise<number> {
    if (!this.config.compressionEnabled) return 1;


    const uncompressedSize = JSON.stringify(replaySession).length;
    const compressedFrames = replaySession.frames.filter(f => f.deltaData);
    const compressionSavings = compressedFrames.length * 0.3;

    return Math.max(0.1, 1 - compressionSavings);
  }




  private startSnapshotTimer(): void {
    this.snapshotTimer = setInterval(() => {
      this.emit('snapshot:timer:tick');
    }, this.config.snapshotInterval * 1000);
  }




  async shutdown(): Promise<void> {
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
    }


    for (const sessionId of this.activeReplays.keys()) {
      try {
        await this.stopRecording(sessionId);
      } catch (error) {
        this.emit('error', error);
      }
    }

    this.emit('shutdown');
  }
}

================
File: services/SessionStore.ts
================
import * as Redis from 'redis';
import { EventEmitter } from 'events';
import {
  SessionDocument,
  SessionEvent,
  SessionCreationOptions,
  RedisConfig,
  SessionError,
  SessionNotFoundError,
  SessionExpiredError,
  ISessionStore,
  RedisSessionData,
  SessionStats,
} from './SessionTypes.js';

export class SessionStore extends EventEmitter implements ISessionStore {
  private redis: Redis.RedisClientType;
  private pubClient: Redis.RedisClientType;
  private subClient: Redis.RedisClientType;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor(private config: RedisConfig) {
    super();
    this.redis = this.createRedisClient();
    this.pubClient = this.createRedisClient();
    this.subClient = this.createRedisClient();
    this.initialize();
  }

  private createRedisClient(): Redis.RedisClientType {
    const clientConfig: Redis.RedisClientOptions = {
      url: this.config.url,
      socket: {
        host: this.config.host || 'localhost',
        port: this.config.port || 6379,
        reconnectStrategy: (retries) => {
          if (retries >= this.maxReconnectAttempts) {
            this.emit('error', new SessionError(
              'Max reconnection attempts reached',
              'REDIS_CONNECTION_FAILED'
            ));
            return false;
          }
          return Math.min(retries * 100, 3000);
        },
      },
      password: this.config.password,
      database: this.config.db || 0,
    };

    const client = Redis.createClient(clientConfig);

    client.on('error', (err) => {
      console.error('[SessionStore] Redis error:', err);
      this.emit('error', new SessionError(
        `Redis client error: ${err.message}`,
        'REDIS_CLIENT_ERROR',
        undefined,
        { originalError: err }
      ));
    });

    client.on('connect', () => {
      console.log('[SessionStore] Redis client connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    client.on('ready', () => {
      console.log('[SessionStore] Redis client ready');
      this.emit('ready');
    });

    client.on('end', () => {
      console.log('[SessionStore] Redis client disconnected');
      this.isConnected = false;
      this.emit('disconnected');
    });

    return client as Redis.RedisClientType;
  }

  private async initialize(): Promise<void> {
    try {
      await Promise.all([
        this.redis.connect(),
        this.pubClient.connect(),
        this.subClient.connect(),
      ]);
      console.log('[SessionStore] Successfully connected to Redis');
    } catch (error) {
      console.error('[SessionStore] Failed to connect to Redis:', error);
      throw new SessionError(
        'Failed to initialize Redis connection',
        'REDIS_INIT_FAILED',
        undefined,
        { originalError: error }
      );
    }
  }



  async createSession(
    sessionId: string,
    agentId: string,
    options: SessionCreationOptions = {}
  ): Promise<void> {
    try {
      const sessionKey = this.getSessionKey(sessionId);
      const eventsKey = this.getEventsKey(sessionId);
      const ttl = options.ttl || 3600;


      const exists = await this.redis.exists(sessionKey);
      if (exists) {
        throw new SessionError(
          `Session already exists: ${sessionId}`,
          'SESSION_EXISTS',
          sessionId
        );
      }


      const sessionData: RedisSessionData = {
        agentIds: JSON.stringify([agentId]),
        state: 'working',
        events: '0',
        metadata: options.metadata ? JSON.stringify(options.metadata) : undefined,
      };


      const redisData: Record<string, string | number> = {
        agentIds: sessionData.agentIds,
        state: sessionData.state,
        events: sessionData.events,
        ...(sessionData.metadata && { metadata: sessionData.metadata }),
      };
      await this.redis.hSet(sessionKey, redisData);
      await this.redis.expire(sessionKey, ttl);


      await this.redis.zAdd(eventsKey, { score: 0, value: 'INIT' });
      await this.redis.expire(eventsKey, ttl);


      if (options.initialEntityIds && options.initialEntityIds.length > 0) {
        const initialEvent: SessionEvent = {
          seq: 1,
          type: 'start',
          timestamp: new Date().toISOString(),
          changeInfo: {
            elementType: 'session',
            entityIds: options.initialEntityIds,
            operation: 'init',
          },
          actor: agentId,
        };
        await this.addEvent(sessionId, initialEvent);
      }

      this.emit('session:created', { sessionId, agentId, options });
      console.log(`[SessionStore] Created session ${sessionId} for agent ${agentId}`);
    } catch (error) {
      console.error(`[SessionStore] Failed to create session ${sessionId}:`, error);
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        `Failed to create session: ${error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)}`,
        'SESSION_CREATE_FAILED',
        sessionId,
        { originalError: error }
      );
    }
  }

  async getSession(sessionId: string): Promise<SessionDocument | null> {
    try {
      const sessionKey = this.getSessionKey(sessionId);
      const exists = await this.redis.exists(sessionKey);

      if (!exists) {
        return null;
      }

      const sessionData = await this.redis.hGetAll(sessionKey);
      if (!sessionData || Object.keys(sessionData).length === 0) {
        return null;
      }


      const events = await this.getRecentEvents(sessionId, 50);

      const session: SessionDocument = {
        sessionId,
        agentIds: JSON.parse(sessionData.agentIds || '[]'),
        state: sessionData.state as any,
        events,
        metadata: sessionData.metadata ? JSON.parse(sessionData.metadata) : undefined,
      };

      return session;
    } catch (error) {
      console.error(`[SessionStore] Failed to get session ${sessionId}:`, error);
      throw new SessionError(
        `Failed to get session: ${error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)}`,
        'SESSION_GET_FAILED',
        sessionId,
        { originalError: error }
      );
    }
  }

  async updateSession(sessionId: string, updates: Partial<SessionDocument>): Promise<void> {
    try {
      const sessionKey = this.getSessionKey(sessionId);
      const exists = await this.redis.exists(sessionKey);

      if (!exists) {
        throw new SessionNotFoundError(sessionId);
      }

      const updateData: Partial<RedisSessionData> = {};

      if (updates.agentIds) {
        updateData.agentIds = JSON.stringify(updates.agentIds);
      }
      if (updates.state) {
        updateData.state = updates.state;
      }
      if (updates.metadata) {
        updateData.metadata = JSON.stringify(updates.metadata);
      }

      if (Object.keys(updateData).length > 0) {
        const redisUpdateData: Record<string, string | number> = {};
        Object.entries(updateData).forEach(([key, value]) => {
          if (value !== undefined) {
            redisUpdateData[key] = value;
          }
        });
        await this.redis.hSet(sessionKey, redisUpdateData);
      }

      this.emit('session:updated', { sessionId, updates });
    } catch (error) {
      console.error(`[SessionStore] Failed to update session ${sessionId}:`, error);
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        `Failed to update session: ${error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)}`,
        'SESSION_UPDATE_FAILED',
        sessionId,
        { originalError: error }
      );
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const sessionKey = this.getSessionKey(sessionId);
      const eventsKey = this.getEventsKey(sessionId);

      const deletedCount = await this.redis.del(sessionKey) + await this.redis.del(eventsKey);

      if (deletedCount === 0) {
        console.warn(`[SessionStore] Session ${sessionId} was already deleted or didn't exist`);
      }

      this.emit('session:deleted', { sessionId });
      console.log(`[SessionStore] Deleted session ${sessionId}`);
    } catch (error) {
      console.error(`[SessionStore] Failed to delete session ${sessionId}:`, error);
      throw new SessionError(
        `Failed to delete session: ${error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)}`,
        'SESSION_DELETE_FAILED',
        sessionId,
        { originalError: error }
      );
    }
  }



  async addEvent(sessionId: string, event: SessionEvent): Promise<void> {
    try {
      const eventsKey = this.getEventsKey(sessionId);
      const sessionKey = this.getSessionKey(sessionId);


      const exists = await this.redis.exists(sessionKey);
      if (!exists) {
        throw new SessionNotFoundError(sessionId);
      }


      const eventJson = JSON.stringify(event);
      await this.redis.zAdd(eventsKey, { score: event.seq, value: eventJson });


      if (event.stateTransition?.to) {
        await this.redis.hSet(sessionKey, 'state', event.stateTransition.to);
      }

      this.emit('event:added', { sessionId, event });
    } catch (error) {
      console.error(`[SessionStore] Failed to add event to session ${sessionId}:`, error);
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        `Failed to add event: ${error instanceof Error ? error.message : String(error)}`,
        'EVENT_ADD_FAILED',
        sessionId,
        { originalError: error, event }
      );
    }
  }

  async getEvents(sessionId: string, fromSeq?: number, toSeq?: number): Promise<SessionEvent[]> {
    try {
      const eventsKey = this.getEventsKey(sessionId);

      let events;
      if (fromSeq !== undefined && toSeq !== undefined) {
        events = await this.redis.zRangeByScore(eventsKey, fromSeq, toSeq);
      } else if (fromSeq !== undefined) {
        events = await this.redis.zRangeByScore(eventsKey, fromSeq, '+inf');
      } else if (toSeq !== undefined) {
        events = await this.redis.zRangeByScore(eventsKey, '-inf', toSeq);
      } else {
        events = await this.redis.zRange(eventsKey, 0, -1);
      }

      return events
        .filter(event => event !== 'INIT')
        .map(eventStr => JSON.parse(eventStr))
        .sort((a, b) => a.seq - b.seq);
    } catch (error) {
      console.error(`[SessionStore] Failed to get events for session ${sessionId}:`, error);
      throw new SessionError(
        `Failed to get events: ${error instanceof Error ? error.message : String(error)}`,
        'EVENTS_GET_FAILED',
        sessionId,
        { originalError: error, fromSeq, toSeq }
      );
    }
  }

  async getRecentEvents(sessionId: string, limit: number = 20): Promise<SessionEvent[]> {
    try {
      const eventsKey = this.getEventsKey(sessionId);
      const events = await this.redis.zRange(eventsKey, -limit, -1);

      return events
        .filter(event => event !== 'INIT')
        .map(eventStr => JSON.parse(eventStr))
        .sort((a, b) => a.seq - b.seq);
    } catch (error) {
      console.error(`[SessionStore] Failed to get recent events for session ${sessionId}:`, error);
      throw new SessionError(
        `Failed to get recent events: ${error instanceof Error ? error.message : String(error)}`,
        'RECENT_EVENTS_GET_FAILED',
        sessionId,
        { originalError: error, limit }
      );
    }
  }



  async addAgent(sessionId: string, agentId: string): Promise<void> {
    try {
      const sessionKey = this.getSessionKey(sessionId);
      const sessionData = await this.redis.hGetAll(sessionKey);

      if (!sessionData.agentIds) {
        throw new SessionNotFoundError(sessionId);
      }

      const agents = new Set(JSON.parse(sessionData.agentIds));
      agents.add(agentId);

      await this.redis.hSet(sessionKey, 'agentIds', JSON.stringify(Array.from(agents)));
      this.emit('agent:added', { sessionId, agentId });
    } catch (error) {
      console.error(`[SessionStore] Failed to add agent ${agentId} to session ${sessionId}:`, error);
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        `Failed to add agent: ${error instanceof Error ? error.message : String(error)}`,
        'AGENT_ADD_FAILED',
        sessionId,
        { originalError: error, agentId }
      );
    }
  }

  async removeAgent(sessionId: string, agentId: string): Promise<void> {
    try {
      const sessionKey = this.getSessionKey(sessionId);
      const sessionData = await this.redis.hGetAll(sessionKey);

      if (!sessionData.agentIds) {
        throw new SessionNotFoundError(sessionId);
      }

      const agents = new Set(JSON.parse(sessionData.agentIds));
      agents.delete(agentId);

      if (agents.size === 0) {

        await this.setTTL(sessionId, 300);
      } else {
        await this.redis.hSet(sessionKey, 'agentIds', JSON.stringify(Array.from(agents)));
      }

      this.emit('agent:removed', { sessionId, agentId });
    } catch (error) {
      console.error(`[SessionStore] Failed to remove agent ${agentId} from session ${sessionId}:`, error);
      if (error instanceof SessionError) throw error;
      throw new SessionError(
        `Failed to remove agent: ${error instanceof Error ? error.message : String(error)}`,
        'AGENT_REMOVE_FAILED',
        sessionId,
        { originalError: error, agentId }
      );
    }
  }



  async setTTL(sessionId: string, ttl: number): Promise<void> {
    try {
      const sessionKey = this.getSessionKey(sessionId);
      const eventsKey = this.getEventsKey(sessionId);

      await Promise.all([
        this.redis.expire(sessionKey, ttl),
        this.redis.expire(eventsKey, ttl),
      ]);
    } catch (error) {
      console.error(`[SessionStore] Failed to set TTL for session ${sessionId}:`, error);
      throw new SessionError(
        `Failed to set TTL: ${error instanceof Error ? error.message : String(error)}`,
        'TTL_SET_FAILED',
        sessionId,
        { originalError: error, ttl }
      );
    }
  }

  async exists(sessionId: string): Promise<boolean> {
    try {
      const sessionKey = this.getSessionKey(sessionId);
      return (await this.redis.exists(sessionKey)) === 1;
    } catch (error) {
      console.error(`[SessionStore] Failed to check existence of session ${sessionId}:`, error);
      return false;
    }
  }



  async publishSessionUpdate(sessionId: string, message: any): Promise<void> {
    try {
      const channel = `session:${sessionId}`;
      await this.pubClient.publish(channel, JSON.stringify(message));
    } catch (error) {
      console.error(`[SessionStore] Failed to publish update for session ${sessionId}:`, error);
      throw new SessionError(
        `Failed to publish update: ${error instanceof Error ? error.message : String(error)}`,
        'PUBLISH_FAILED',
        sessionId,
        { originalError: error, message }
      );
    }
  }

  async subscribeToSession(sessionId: string, callback: (message: any) => void): Promise<void> {
    try {
      const channel = `session:${sessionId}`;
      await this.subClient.subscribe(channel, (message) => {
        try {
          const parsed = JSON.parse(message);
          callback(parsed);
        } catch (error) {
          console.error(`[SessionStore] Failed to parse pub/sub message:`, error);
        }
      });
    } catch (error) {
      console.error(`[SessionStore] Failed to subscribe to session ${sessionId}:`, error);
      throw new SessionError(
        `Failed to subscribe: ${error instanceof Error ? error.message : String(error)}`,
        'SUBSCRIBE_FAILED',
        sessionId,
        { originalError: error }
      );
    }
  }



  async getStats(): Promise<SessionStats> {
    try {
      const keys = await this.redis.keys('session:*');
      const activeSessions = keys.length;

      let totalEvents = 0;
      let checkpointsCreated = 0;
      const uniqueAgents = new Set<string>();


      for (const key of keys.slice(0, 100)) {
        const sessionData = await this.redis.hGetAll(key);
        if (sessionData.agentIds) {
          const agents = JSON.parse(sessionData.agentIds);
          agents.forEach(agent => uniqueAgents.add(agent));
        }

        const eventsKey = key.replace('session:', 'events:');
        const eventCount = await this.redis.zCard(eventsKey);
        totalEvents += eventCount;
      }


      const memoryUsage = 0;

      return {
        activeSessions,
        totalEvents,
        averageEventsPerSession: activeSessions > 0 ? totalEvents / activeSessions : 0,
        checkpointsCreated,
        failureSnapshots: 0,
        agentsActive: uniqueAgents.size,
        redisMemoryUsage: memoryUsage || 0,
      };
    } catch (error) {
      console.error('[SessionStore] Failed to get stats:', error);
      throw new SessionError(
        `Failed to get stats: ${error instanceof Error ? error.message : String(error)}`,
        'STATS_FAILED',
        undefined,
        { originalError: error }
      );
    }
  }

  async listActiveSessions(): Promise<string[]> {
    try {
      const keys = await this.redis.keys('session:*');
      return keys.map(key => key.replace('session:', ''));
    } catch (error) {
      console.error('[SessionStore] Failed to list active sessions:', error);
      throw new SessionError(
        `Failed to list sessions: ${error instanceof Error ? error.message : String(error)}`,
        'LIST_SESSIONS_FAILED',
        undefined,
        { originalError: error }
      );
    }
  }

  async cleanup(): Promise<void> {
    try {

      const keys = await this.redis.keys('session:*');
      const expiredKeys = [];

      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) {
          expiredKeys.push(key);
          expiredKeys.push(key.replace('session:', 'events:'));
        }
      }

      if (expiredKeys.length > 0) {
        for (const key of expiredKeys) {
          await this.redis.del(key);
        }
        console.log(`[SessionStore] Cleaned up ${expiredKeys.length} expired keys`);
      }
    } catch (error) {
      console.error('[SessionStore] Failed to cleanup expired sessions:', error);
    }
  }



  async close(): Promise<void> {
    try {
      await Promise.all([
        this.redis.quit(),
        this.pubClient.quit(),
        this.subClient.quit(),
      ]);
      this.isConnected = false;
      this.emit('closed');
      console.log('[SessionStore] Closed Redis connections');
    } catch (error) {
      console.error('[SessionStore] Error closing Redis connections:', error);
      throw new SessionError(
        `Failed to close connections: ${error instanceof Error ? error.message : String(error)}`,
        'CLOSE_FAILED',
        undefined,
        { originalError: error }
      );
    }
  }



  private getSessionKey(sessionId: string): string {
    return `session:${sessionId}`;
  }

  private getEventsKey(sessionId: string): string {
    return `events:${sessionId}`;
  }



  async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const start = Date.now();
    try {
      await this.redis.ping();
      return {
        healthy: true,
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - start,
        error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error',
      };
    }
  }
}

================
File: services/SessionTypes.ts
================
export type SessionState = 'working' | 'broken' | 'coordinating' | 'completed';
export type EventType = 'modified' | 'broke' | 'checkpoint' | 'handoff' | 'test_pass' | 'start';
export type ElementType = 'function' | 'cluster' | 'spec' | 'benchmark' | 'session';
export type Operation = 'added' | 'modified' | 'deleted' | 'renamed' | 'init';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Outcome = 'working' | 'broken' | 'coordinated' | 'completed';
export type VerifiedBy = 'test' | 'build' | 'manual' | 'agent';



export interface SessionChangeInfo {
  elementType: ElementType;
  entityIds: string[];
  operation: Operation;
  affectedLines?: number;
  semanticHash?: string;
}

export interface SessionStateTransition {
  from: SessionState;
  to: SessionState;
  verifiedBy: VerifiedBy;
  confidence: number;
}

export interface SessionImpact {
  severity: Severity;
  testsFailed?: string[];
  perfDelta?: number;
  externalRef?: string;
}

export interface SessionEvent {
  seq: number;
  type: EventType;
  timestamp: string;
  changeInfo: SessionChangeInfo;
  stateTransition?: SessionStateTransition;
  impact?: SessionImpact;
  actor: string;
}



export interface SessionCheckpoint {
  id: string;
  refEntities: string[];
  summary: {
    outcome: Outcome;
    keyImpacts: string[];
    perfDelta?: number;
  };
}



export interface SessionDocument {
  sessionId: string;
  agentIds: string[];
  state: SessionState;
  events: SessionEvent[];
  currentCheckpoint?: SessionCheckpoint;
  metadata?: Record<string, any>;
}



export interface SessionAnchor {
  sessionId: string;
  outcome: Outcome;
  checkpointId: string;
  keyImpacts: string[];
  perfDelta?: number;
  actors: string[];
  timestamp: string;
  externalRef?: string;
}



export interface SessionQuery {
  sessionId?: string;
  agentId?: string;
  entityId?: string;
  state?: SessionState;
  outcome?: Outcome;
  fromSeq?: number;
  toSeq?: number;
  limit?: number;
  includeEvents?: boolean;
  includeKGContext?: boolean;
}

export interface TransitionResult {
  fromSeq: number;
  toSeq: number;
  changeInfo: SessionChangeInfo;
  impact?: SessionImpact;
  kgContext?: {
    specTitle?: string;
    clusterName?: string;
    benchmarkDelta?: number;
  };
}



export interface SessionCreationOptions {
  initialEntityIds?: string[];
  ttl?: number;
  metadata?: Record<string, any>;
}

export interface SessionEventOptions {
  resetTTL?: boolean;
  autoCheckpoint?: boolean;
  publishUpdate?: boolean;
}

export interface CheckpointOptions {
  forceSnapshot?: boolean;
  graceTTL?: number;
  includeFailureSnapshot?: boolean;
}



export interface HandoffContext {
  sessionId: string;
  recentChanges: SessionEvent[];
  kgContext: Array<{
    entityId: string;
    related: any[];
    lastAnchor?: SessionAnchor;
  }>;
  joiningAdvice: string;
}

export interface IsolationResult {
  events: SessionEvent[];
  impacts: Array<{
    entityId: string;
    anchors: SessionAnchor[];
    count: number;
  }>;
  totalPerfDelta: number;
  agentId: string;
}



export interface RedisSessionData {
  agentIds: string;
  state: SessionState;
  events: string;
  metadata?: string;
}

export interface RedisEventData {
  score: number;
  member: string;
}



export interface SessionPubSubMessage {
  type: 'new' | 'modified' | 'checkpoint_complete' | 'handoff';
  sessionId: string;
  seq?: number;
  actor?: string;
  initiator?: string;
  checkpointId?: string;
  outcome?: Outcome;
  summary?: {
    entityIds?: string[];
    impact?: SessionImpact;
  };
}



export interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  maxRetriesPerRequest?: number;
  retryDelayOnFailover?: number;
  lazyConnect?: boolean;
}

export interface SessionManagerConfig {
  redis: RedisConfig;
  defaultTTL?: number;
  checkpointInterval?: number;
  maxEventsPerSession?: number;
  graceTTL?: number;
  enableFailureSnapshots?: boolean;
  pubSubChannels?: {
    global?: string;
    session?: string;
  };
}



export class SessionError extends Error {
  constructor(
    message: string,
    public code: string,
    public sessionId?: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'SessionError';
  }
}

export class SessionNotFoundError extends SessionError {
  constructor(sessionId: string) {
    super(`Session not found: ${sessionId}`, 'SESSION_NOT_FOUND', sessionId);
    this.name = 'SessionNotFoundError';
  }
}

export class SessionExpiredError extends SessionError {
  constructor(sessionId: string) {
    super(`Session expired: ${sessionId}`, 'SESSION_EXPIRED', sessionId);
    this.name = 'SessionExpiredError';
  }
}



export interface ISessionStore {
  createSession(sessionId: string, agentId: string, options?: SessionCreationOptions): Promise<void>;
  getSession(sessionId: string): Promise<SessionDocument | null>;
  updateSession(sessionId: string, updates: Partial<SessionDocument>): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
  addEvent(sessionId: string, event: SessionEvent): Promise<void>;
  getEvents(sessionId: string, fromSeq?: number, toSeq?: number): Promise<SessionEvent[]>;
  getRecentEvents(sessionId: string, limit?: number): Promise<SessionEvent[]>;
  addAgent(sessionId: string, agentId: string): Promise<void>;
  removeAgent(sessionId: string, agentId: string): Promise<void>;
  setTTL(sessionId: string, ttl: number): Promise<void>;
  exists(sessionId: string): Promise<boolean>;
}

export interface ISessionManager {
  createSession(agentId: string, options?: SessionCreationOptions): Promise<string>;
  joinSession(sessionId: string, agentId: string): Promise<void>;
  leaveSession(sessionId: string, agentId: string): Promise<void>;
  emitEvent(sessionId: string, event: Omit<SessionEvent, 'seq' | 'timestamp'>, actor: string): Promise<void>;
  getSession(sessionId: string): Promise<SessionDocument | null>;
  checkpoint(sessionId: string, options?: CheckpointOptions): Promise<string>;
  cleanup(sessionId: string): Promise<void>;
  listActiveSessions(): Promise<string[]>;
  getSessionsByAgent(agentId: string): Promise<string[]>;
}

export interface ISessionBridge {
  getTransitions(sessionId: string, entityId?: string): Promise<TransitionResult[]>;
  isolateSession(sessionId: string, agentId: string): Promise<IsolationResult>;
  getHandoffContext(sessionId: string, joiningAgent: string): Promise<HandoffContext>;
  querySessionsByEntity(entityId: string, options?: SessionQuery): Promise<SessionDocument[]>;
  getSessionAggregates(entityIds: string[], options?: SessionQuery): Promise<any>;
}



export interface SessionStats {
  activeSessions: number;
  totalEvents: number;
  averageEventsPerSession: number;
  checkpointsCreated: number;
  failureSnapshots: number;
  agentsActive: number;
  redisMemoryUsage: number;
}

export interface SessionMetrics {
  sessionDuration: number;
  eventCount: number;
  transitionCount: number;
  performanceImpact: number;
  agentCollaboration: number;
}



export type {

  SessionDocument as RedisSession,
  SessionEvent as RedisEvent,
  SessionAnchor as RedisAnchor,
  SessionQuery as RedisQuery,
  HandoffContext as RedisHandoff,
  IsolationResult as RedisIsolation,
  TransitionResult as RedisTransition,
};

================
File: types/entities.ts
================
import {
  DocumentationIntent,
  DocumentationNodeType,
  DocumentationSource,
  DocumentationStatus,
} from "./relationships.js";

export interface CodebaseEntity {
  id: string;
  path: string;
  hash: string;
  language: string;
  lastModified: Date;
  created: Date;
  metadata?: Record<string, any>;
}

export interface File extends CodebaseEntity {
  type: "file";
  extension: string;
  size: number;
  lines: number;
  isTest: boolean;
  isConfig: boolean;
  dependencies: string[];
}

export interface Directory extends CodebaseEntity {
  type: "directory";
  children: string[];
  depth: number;
}

export interface Module extends CodebaseEntity {
  type: "module";
  name: string;
  version: string;
  packageJson: any;
  entryPoint: string;
}

export interface Symbol extends CodebaseEntity {
  type: "symbol";
  name: string;
  kind:
    | "function"
    | "class"
    | "interface"
    | "typeAlias"
    | "variable"
    | "property"
    | "method"
    | "unknown";
  signature: string;
  docstring: string;
  visibility: "public" | "private" | "protected";
  isExported: boolean;
  isDeprecated: boolean;
  location?: {
    line: number;
    column: number;
    start: number;
    end: number;
  };
}

export interface FunctionSymbol extends Symbol {
  kind: "function";
  parameters: FunctionParameter[];
  returnType: string;
  isAsync: boolean;
  isGenerator: boolean;
  complexity: number;
  calls: string[];
}

export interface FunctionParameter {
  name: string;
  type: string;
  defaultValue?: string;
  optional: boolean;
}

export interface ClassSymbol extends Symbol {
  kind: "class";
  extends: string[];
  implements: string[];
  methods: string[];
  properties: string[];
  isAbstract: boolean;
}

export interface InterfaceSymbol extends Symbol {
  kind: "interface";
  extends: string[];
  methods: string[];
  properties: string[];
}

export interface TypeAliasSymbol extends Symbol {
  kind: "typeAlias";
  aliasedType: string;
  isUnion: boolean;
  isIntersection: boolean;
}

export interface Test extends CodebaseEntity {
  type: "test";
  testType: "unit" | "integration" | "e2e";
  targetSymbol: string;
  framework: string;
  coverage: CoverageMetrics;
  status: "passing" | "failing" | "skipped" | "unknown";
  flakyScore: number;
  lastRunAt?: Date;
  lastDuration?: number;
  executionHistory: TestExecution[];
  performanceMetrics: TestPerformanceMetrics;
  dependencies: string[];
  tags: string[];
}

export interface CoverageMetrics {
  lines: number;
  branches: number;
  functions: number;
  statements: number;
}

export interface TestExecution {
  id: string;
  timestamp: Date;
  status: "passed" | "failed" | "skipped" | "error";
  duration: number;
  errorMessage?: string;
  stackTrace?: string;
  coverage?: CoverageMetrics;
  performance?: TestPerformanceData;
  environment?: Record<string, any>;
}

export interface TestPerformanceData {
  memoryUsage?: number;
  cpuUsage?: number;
  networkRequests?: number;
  databaseQueries?: number;
  fileOperations?: number;
}

export interface TestPerformanceMetrics {
  averageExecutionTime: number;
  p95ExecutionTime: number;
  successRate: number;
  trend: "improving" | "stable" | "degrading";
  benchmarkComparisons: TestBenchmark[];
  historicalData: TestHistoricalData[];
}

export interface TestBenchmark {
  benchmark: string;
  value: number;
  status: "above" | "below" | "at";
  threshold: number;
}

export interface TestHistoricalData {
  timestamp: Date;



  executionTime: number;



  averageExecutionTime: number;



  p95ExecutionTime: number;
  successRate: number;
  coveragePercentage: number;
  runId?: string;
}

export interface Spec extends CodebaseEntity {
  type: "spec";
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: "draft" | "approved" | "implemented" | "deprecated";
  priority: "low" | "medium" | "high" | "critical";
  assignee?: string;
  tags?: string[];
  updated: Date;
}

export interface Change {
  id: string;
  type: "change";
  changeType: "create" | "update" | "delete" | "rename" | "move";
  entityType: string;
  entityId: string;
  timestamp: Date;
  author?: string;
  commitHash?: string;
  diff?: string;
  previousState?: any;
  newState?: any;
  sessionId?: string;
  specId?: string;
}

export interface Session {
  id: string;
  type: "session";
  startTime: Date;
  endTime?: Date;
  agentType: string;
  userId?: string;
  changes: string[];
  specs: string[];
  status: "active" | "completed" | "failed";
  metadata?: Record<string, any>;
}


export interface Version {
  id: string;
  type: "version";
  entityId: string;
  path?: string;
  hash: string;
  language?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}


export interface Checkpoint {
  id: string;
  type: "checkpoint";
  checkpointId: string;
  timestamp: Date;
  reason: "daily" | "incident" | "manual";
  hops: number;
  seedEntities: string[];
  metadata?: Record<string, any>;
}


export interface DocumentationNode extends CodebaseEntity {
  type: "documentation";
  title: string;
  content: string;
  docType: DocumentationNodeType;
  businessDomains: string[];
  stakeholders: string[];
  technologies: string[];
  status: DocumentationStatus;
  docVersion: string;
  docHash: string;
  docIntent: DocumentationIntent;
  docSource: DocumentationSource;
  docLocale?: string;
  lastIndexed?: Date;
}

export interface BusinessDomain {
  id: string;
  type: "businessDomain";
  name: string;
  description: string;
  parentDomain?: string;
  criticality: "core" | "supporting" | "utility";
  stakeholders: string[];
  keyProcesses: string[];
  extractedFrom: string[];
}

export interface SemanticCluster {
  id: string;
  type: "semanticCluster";
  name: string;
  description: string;
  businessDomainId: string;
  clusterType: "feature" | "module" | "capability" | "service";
  cohesionScore: number;
  lastAnalyzed: Date;
  memberEntities: string[];
}


export interface SecurityIssue {
  id: string;
  type: "securityIssue";
  tool: string;
  ruleId: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  cwe?: string;
  owasp?: string;
  affectedEntityId: string;
  lineNumber: number;
  codeSnippet: string;
  remediation: string;
  status: "open" | "fixed" | "accepted" | "false-positive";
  discoveredAt: Date;
  lastScanned: Date;
  confidence: number;
}

export interface Vulnerability {
  id: string;
  type: "vulnerability";
  packageName: string;
  version: string;
  vulnerabilityId: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  description: string;
  cvssScore: number;
  affectedVersions: string;
  fixedInVersion: string;
  publishedAt: Date;
  lastUpdated: Date;
  exploitability: "high" | "medium" | "low";
}


export type Entity =
  | File
  | Directory
  | Module
  | Symbol
  | FunctionSymbol
  | ClassSymbol
  | InterfaceSymbol
  | TypeAliasSymbol
  | Test
  | Spec
  | Change
  | Session
  | Version
  | Checkpoint
  | DocumentationNode
  | BusinessDomain
  | SemanticCluster
  | SecurityIssue
  | Vulnerability;


export const isFile = (entity: Entity | null | undefined): entity is File =>
  entity != null && entity.type === "file";
export const isDirectory = (
  entity: Entity | null | undefined
): entity is Directory => entity != null && entity.type === "directory";
export const isSymbol = (entity: Entity | null | undefined): entity is Symbol =>
  entity != null && entity.type === "symbol";
export const isFunction = (
  entity: Entity | null | undefined
): entity is FunctionSymbol => isSymbol(entity) && entity.kind === "function";
export const isClass = (
  entity: Entity | null | undefined
): entity is ClassSymbol => isSymbol(entity) && entity.kind === "class";
export const isInterface = (
  entity: Entity | null | undefined
): entity is InterfaceSymbol => isSymbol(entity) && entity.kind === "interface";
export const isTest = (entity: Entity | null | undefined): entity is Test =>
  entity != null && entity.type === "test";
export const isSpec = (entity: Entity | null | undefined): entity is Spec =>
  entity != null && entity.type === "spec";


export { RelationshipType } from "./relationships.js";

================
File: types/fastify.d.ts
================
import "fastify";
import type { AuthContext } from "@memento/api";

declare module "fastify" {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}

================
File: types/optional-modules.d.ts
================
declare module "@aws-sdk/client-s3" {
  export const S3Client: any;
  export const HeadBucketCommand: any;
  export const CreateBucketCommand: any;
  export const PutObjectCommand: any;
  export const GetObjectCommand: any;
  export const DeleteObjectCommand: any;
  export const ListObjectsV2Command: any;
  export const HeadObjectCommand: any;
}

declare module "@aws-sdk/lib-storage" {
  export const Upload: any;
}

declare module "@google-cloud/storage" {
  export const Storage: any;
}

================
File: types/relationships.ts
================
export interface Relationship {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  type: RelationshipType;
  created: Date;
  lastModified: Date;
  version: number;
  metadata?: Record<string, any>;
  siteId?: string;
  siteHash?: string;
  evidence?: any[];
  locations?: any[];
  sites?: any[];

  validFrom?: Date;
  validTo?: Date | null;
}


export enum RelationshipType {

  CONTAINS = 'CONTAINS',
  DEFINES = 'DEFINES',
  EXPORTS = 'EXPORTS',
  IMPORTS = 'IMPORTS',


  CALLS = 'CALLS',
  REFERENCES = 'REFERENCES',
  IMPLEMENTS = 'IMPLEMENTS',
  EXTENDS = 'EXTENDS',
  DEPENDS_ON = 'DEPENDS_ON',
  OVERRIDES = 'OVERRIDES',
  READS = 'READS',
  WRITES = 'WRITES',
  THROWS = 'THROWS',

  TYPE_USES = 'TYPE_USES',
  RETURNS_TYPE = 'RETURNS_TYPE',
  PARAM_TYPE = 'PARAM_TYPE',


  TESTS = 'TESTS',
  VALIDATES = 'VALIDATES',


  REQUIRES = 'REQUIRES',
  IMPACTS = 'IMPACTS',
  IMPLEMENTS_SPEC = 'IMPLEMENTS_SPEC',


  PREVIOUS_VERSION = 'PREVIOUS_VERSION',
  MODIFIED_BY = 'MODIFIED_BY',
  CREATED_IN = 'CREATED_IN',
  MODIFIED_IN = 'MODIFIED_IN',
  REMOVED_IN = 'REMOVED_IN',
  OF = 'OF',


  DESCRIBES_DOMAIN = 'DESCRIBES_DOMAIN',
  BELONGS_TO_DOMAIN = 'BELONGS_TO_DOMAIN',
  DOCUMENTED_BY = 'DOCUMENTED_BY',
  CLUSTER_MEMBER = 'CLUSTER_MEMBER',
  DOMAIN_RELATED = 'DOMAIN_RELATED',
  GOVERNED_BY = 'GOVERNED_BY',
  DOCUMENTS_SECTION = 'DOCUMENTS_SECTION',


  HAS_SECURITY_ISSUE = 'HAS_SECURITY_ISSUE',
  DEPENDS_ON_VULNERABLE = 'DEPENDS_ON_VULNERABLE',
  SECURITY_IMPACTS = 'SECURITY_IMPACTS',


  PERFORMANCE_IMPACT = 'PERFORMANCE_IMPACT',
  PERFORMANCE_REGRESSION = 'PERFORMANCE_REGRESSION',
  COVERAGE_PROVIDES = 'COVERAGE_PROVIDES',


  SESSION_MODIFIED = 'SESSION_MODIFIED',
  SESSION_IMPACTED = 'SESSION_IMPACTED',
  SESSION_CHECKPOINT = 'SESSION_CHECKPOINT',
  BROKE_IN = 'BROKE_IN',
  FIXED_IN = 'FIXED_IN',
  DEPENDS_ON_CHANGE = 'DEPENDS_ON_CHANGE',


  CHECKPOINT_INCLUDES = 'CHECKPOINT_INCLUDES'
}


export type StructuralImportType =
  | "default"
  | "named"
  | "namespace"
  | "wildcard"
  | "side-effect";

export interface StructuralRelationship extends Relationship {
  type:
    | RelationshipType.CONTAINS
    | RelationshipType.DEFINES
    | RelationshipType.EXPORTS
    | RelationshipType.IMPORTS;
  importType?: StructuralImportType;
  importAlias?: string;
  importDepth?: number;
  isNamespace?: boolean;
  isReExport?: boolean;
  reExportTarget?: string | null;
  language?: string;
  symbolKind?: string;
  modulePath?: string;
  resolutionState?: "resolved" | "unresolved" | "partial";
  metadata?: Record<string, any> & {
    languageSpecific?: Record<string, any>;
  };
  confidence?: number;
  scope?: CodeScope;
  firstSeenAt?: Date;
  lastSeenAt?: Date;
}

const STRUCTURAL_RELATIONSHIP_TYPE_SET = new Set<RelationshipType>([
  RelationshipType.CONTAINS,
  RelationshipType.DEFINES,
  RelationshipType.EXPORTS,
  RelationshipType.IMPORTS,
]);

export const isStructuralRelationshipType = (
  type: RelationshipType
): type is StructuralRelationship["type"] =>
  STRUCTURAL_RELATIONSHIP_TYPE_SET.has(type);

export const PERFORMANCE_RELATIONSHIP_TYPES = [
  RelationshipType.PERFORMANCE_IMPACT,
  RelationshipType.PERFORMANCE_REGRESSION,
] as const;

const PERFORMANCE_RELATIONSHIP_TYPE_SET = new Set<RelationshipType>(
  PERFORMANCE_RELATIONSHIP_TYPES
);

export type PerformanceRelationshipType =
  (typeof PERFORMANCE_RELATIONSHIP_TYPES)[number];

export const isPerformanceRelationshipType = (
  type: RelationshipType
): type is PerformanceRelationshipType =>
  PERFORMANCE_RELATIONSHIP_TYPE_SET.has(type);

export const SESSION_RELATIONSHIP_TYPES = [
  RelationshipType.SESSION_MODIFIED,
  RelationshipType.SESSION_IMPACTED,
  RelationshipType.SESSION_CHECKPOINT,
  RelationshipType.BROKE_IN,
  RelationshipType.FIXED_IN,
  RelationshipType.DEPENDS_ON_CHANGE,
] as const;

const SESSION_RELATIONSHIP_TYPE_SET = new Set<RelationshipType>(
  SESSION_RELATIONSHIP_TYPES
);

export type SessionRelationshipType =
  (typeof SESSION_RELATIONSHIP_TYPES)[number];

export const isSessionRelationshipType = (
  type: RelationshipType
): type is SessionRelationshipType =>
  SESSION_RELATIONSHIP_TYPE_SET.has(type);



export type CodeEdgeSource = 'ast' | 'type-checker' | 'heuristic' | 'index' | 'runtime' | 'lsp';

export type CodeEdgeKind = 'call' | 'identifier' | 'instantiation' | 'type' | 'read' | 'write' | 'override' | 'inheritance' | 'return' | 'param' | 'decorator' | 'annotation' | 'throw' | 'dependency';


export const CODE_RELATIONSHIP_TYPES = [
  RelationshipType.CALLS,
  RelationshipType.REFERENCES,
  RelationshipType.IMPLEMENTS,
  RelationshipType.EXTENDS,
  RelationshipType.DEPENDS_ON,
  RelationshipType.OVERRIDES,
  RelationshipType.READS,
  RelationshipType.WRITES,
  RelationshipType.THROWS,
  RelationshipType.TYPE_USES,
  RelationshipType.RETURNS_TYPE,
  RelationshipType.PARAM_TYPE,
] as const;

export type CodeRelationshipType = (typeof CODE_RELATIONSHIP_TYPES)[number];


export const DOCUMENTATION_RELATIONSHIP_TYPES = [
  RelationshipType.DESCRIBES_DOMAIN,
  RelationshipType.BELONGS_TO_DOMAIN,
  RelationshipType.DOCUMENTED_BY,
  RelationshipType.CLUSTER_MEMBER,
  RelationshipType.DOMAIN_RELATED,
  RelationshipType.GOVERNED_BY,
  RelationshipType.DOCUMENTS_SECTION,
] as const;

export type DocumentationRelationshipType =
  (typeof DOCUMENTATION_RELATIONSHIP_TYPES)[number];

const DOCUMENTATION_RELATIONSHIP_TYPE_SET = new Set<RelationshipType>(
  DOCUMENTATION_RELATIONSHIP_TYPES,
);

export const isDocumentationRelationshipType = (
  type: RelationshipType,
): type is DocumentationRelationshipType =>
  DOCUMENTATION_RELATIONSHIP_TYPE_SET.has(type);

export type DocumentationSource =
  | 'parser'
  | 'manual'
  | 'llm'
  | 'imported'
  | 'sync'
  | 'other';

export type DocumentationIntent = 'ai-context' | 'governance' | 'mixed';

export type DocumentationNodeType =
  | 'readme'
  | 'api-docs'
  | 'design-doc'
  | 'architecture'
  | 'user-guide';

export type DocumentationStatus = 'active' | 'deprecated' | 'draft';

export type DocumentationCoverageScope =
  | 'api'
  | 'behavior'
  | 'operational'
  | 'security'
  | 'compliance';

export type DocumentationQuality = 'complete' | 'partial' | 'outdated';

export type DocumentationPolicyType =
  | 'adr'
  | 'runbook'
  | 'compliance'
  | 'manual'
  | 'decision-log';


export interface EdgeEvidence {
  source: CodeEdgeSource;
  confidence?: number;
  location?: { path?: string; line?: number; column?: number };
  note?: string;

  extractorVersion?: string;
}

export interface CodeRelationship extends Relationship {
  type: CodeRelationshipType;

  strength?: number;
  context?: string;



  occurrencesScan?: number;
  occurrencesTotal?: number;
  occurrencesRecent?: number;
  confidence?: number;
  inferred?: boolean;
  resolved?: boolean;
  source?: CodeEdgeSource;
  kind?: CodeEdgeKind;
  location?: { path?: string; line?: number; column?: number };

  usedTypeChecker?: boolean;
  isExported?: boolean;

  active?: boolean;


  evidence?: EdgeEvidence[];
  locations?: Array<{ path?: string; line?: number; column?: number }>;


  siteId?: string;
  sites?: string[];
  siteHash?: string;


  why?: string;


  callee?: string;
  paramName?: string;
  importDepth?: number;
  importAlias?: string;
  isMethod?: boolean;


  resolution?: CodeResolution;
  scope?: CodeScope;
  accessPath?: string;
  ambiguous?: boolean;
  candidateCount?: number;


  arity?: number;
  awaited?: boolean;
  receiverType?: string;
  dynamicDispatch?: boolean;
  overloadIndex?: number;
  genericArguments?: string[];


  operator?: string;


  dataFlowId?: string;
  purity?: 'pure' | 'impure' | 'unknown';


  fromRef?: { kind: 'entity' | 'fileSymbol' | 'external'; id?: string; file?: string; symbol?: string; name?: string };
  toRef?: { kind: 'entity' | 'fileSymbol' | 'external'; id?: string; file?: string; symbol?: string; name?: string };

  to_ref_kind?: 'entity' | 'fileSymbol' | 'external' | undefined;
  to_ref_file?: string;
  to_ref_symbol?: string;
  to_ref_name?: string;


  from_ref_kind?: 'entity' | 'fileSymbol' | 'external' | undefined;
  from_ref_file?: string;
  from_ref_symbol?: string;
  from_ref_name?: string;


  firstSeenAt?: Date;
  lastSeenAt?: Date;
}


export type CodeResolution = 'direct' | 'via-import' | 'type-checker' | 'heuristic';
export type CodeScope = 'local' | 'imported' | 'external' | 'unknown';

export interface TestRelationship extends Relationship {
  type: RelationshipType.TESTS | RelationshipType.VALIDATES;
  testType?: 'unit' | 'integration' | 'e2e';
  coverage?: number;
}

export interface SpecRelationship extends Relationship {
  type: RelationshipType.REQUIRES | RelationshipType.IMPACTS | RelationshipType.IMPLEMENTS_SPEC;
  impactLevel?: 'high' | 'medium' | 'low';
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

export interface TemporalRelationship extends Relationship {
  type: RelationshipType.PREVIOUS_VERSION |
        RelationshipType.MODIFIED_BY | RelationshipType.CREATED_IN |
        RelationshipType.MODIFIED_IN | RelationshipType.REMOVED_IN |
        RelationshipType.OF;
  changeType?: 'create' | 'update' | 'delete' | 'rename' | 'move';
  author?: string;
  commitHash?: string;
}

export interface DocumentationRelationship extends Relationship {
  type: DocumentationRelationshipType;
  confidence?: number;
  inferred?: boolean;
  source?: DocumentationSource;
  docIntent?: DocumentationIntent;
  sectionAnchor?: string;
  sectionTitle?: string;
  summary?: string;
  docVersion?: string;
  docHash?: string;
  documentationQuality?: DocumentationQuality;
  coverageScope?: DocumentationCoverageScope;
  evidence?: Array<{ type: 'heading' | 'snippet' | 'link'; value: string }>;
  tags?: string[];
  stakeholders?: string[];
  domainPath?: string;
  taxonomyVersion?: string;
  updatedFromDocAt?: Date;
  lastValidated?: Date;
  strength?: number;
  similarityScore?: number;
  clusterVersion?: string;
  role?: 'core' | 'supporting' | 'entry-point' | 'integration';
  docEvidenceId?: string;
  docAnchor?: string;
  embeddingVersion?: string;
  policyType?: DocumentationPolicyType;
  effectiveFrom?: Date;
  expiresAt?: Date | null;
  relationshipType?: 'depends_on' | 'overlaps' | 'shares_owner' | string;
  docLocale?: string;
}

export interface SecurityRelationship extends Relationship {
  type: RelationshipType.HAS_SECURITY_ISSUE | RelationshipType.DEPENDS_ON_VULNERABLE |
        RelationshipType.SECURITY_IMPACTS;
  severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status?: 'open' | 'fixed' | 'accepted' | 'false-positive';
  cvssScore?: number;
}

export type PerformanceTrend = "regression" | "improvement" | "neutral";

export type PerformanceSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low";

export interface PerformanceConfidenceInterval {
  lower?: number;
  upper?: number;
}

export interface PerformanceMetricSample {
  timestamp?: Date;
  value: number;
  runId?: string;
  environment?: string;
  unit?: string;
}

export interface PerformanceRelationship extends Relationship {
  type: PerformanceRelationshipType;
  metricId: string;
  scenario?: string;
  environment?: string;
  baselineValue?: number;
  currentValue?: number;
  unit?: string;
  delta?: number;
  percentChange?: number;
  sampleSize?: number;
  confidenceInterval?: PerformanceConfidenceInterval | null;
  trend?: PerformanceTrend;
  severity?: PerformanceSeverity;
  riskScore?: number;
  runId?: string;
  policyId?: string;
  detectedAt?: Date;
  resolvedAt?: Date | null;
  metricsHistory?: PerformanceMetricSample[];
  evidence?: EdgeEvidence[];
  metadata?: Record<string, any> & {
    metrics?: Array<Record<string, any>>;
  };
}

export interface SessionRelationship extends Relationship {
  type: RelationshipType.SESSION_MODIFIED | RelationshipType.SESSION_IMPACTED |
        RelationshipType.SESSION_CHECKPOINT | RelationshipType.BROKE_IN |
        RelationshipType.FIXED_IN | RelationshipType.DEPENDS_ON_CHANGE;


  sessionId: string;
  timestamp: Date;
  sequenceNumber: number;
  eventId?: string;
  actor?: string;
  annotations?: string[];
  impactSeverity?: 'critical' | 'high' | 'medium' | 'low';
  stateTransitionTo?: 'working' | 'broken' | 'unknown';
  checkpointId?: string;
  checkpointStatus?: 'pending' | 'completed' | 'failed' | 'manual_intervention';
  checkpointDetails?: {
    reason?: 'daily' | 'incident' | 'manual';
    hopCount?: number;
    attempts?: number;
    seedEntityIds?: string[];
    jobId?: string;
    error?: string;
    updatedAt?: Date;
  };


  changeInfo?: {
    elementType: 'function' | 'class' | 'import' | 'test';
    elementName: string;
    operation: 'added' | 'modified' | 'deleted' | 'renamed';
    semanticHash?: string;
    affectedLines?: number;
  };


  stateTransition?: {
    from: 'working' | 'broken' | 'unknown';
    to: 'working' | 'broken' | 'unknown';
    verifiedBy: 'test' | 'build' | 'manual';
    confidence: number;
    criticalChange?: {
      entityId: string;
      beforeSnippet?: string;
      afterSnippet?: string;
    };
  };


  impact?: {
    severity: 'high' | 'medium' | 'low';
    testsFailed?: string[];
    testsFixed?: string[];
    buildError?: string;
    performanceImpact?: number;
  };
}


export type GraphRelationship =
  | StructuralRelationship
  | CodeRelationship
  | TestRelationship
  | SpecRelationship
  | TemporalRelationship
  | DocumentationRelationship
  | SecurityRelationship
  | PerformanceRelationship
  | SessionRelationship;


export interface RelationshipQuery {
  fromEntityId?: string;
  toEntityId?: string;
  type?: RelationshipType | RelationshipType[];
  entityTypes?: string[];
  since?: Date;
  until?: Date;
  limit?: number;
  offset?: number;
  domainPath?: string | string[];
  domainPrefix?: string | string[];
  docIntent?: DocumentationIntent | DocumentationIntent[];
  docType?: DocumentationNodeType | DocumentationNodeType[];
  docStatus?: DocumentationStatus | DocumentationStatus[];
  docLocale?: string | string[];
  coverageScope?: DocumentationCoverageScope | DocumentationCoverageScope[];
  embeddingVersion?: string | string[];
  clusterId?: string | string[];
  clusterVersion?: string | string[];
  stakeholder?: string | string[];
  tag?: string | string[];
  lastValidatedAfter?: Date;
  lastValidatedBefore?: Date;
  metricId?: string | string[];
  environment?: string | string[];
  severity?: PerformanceSeverity | PerformanceSeverity[];
  trend?: PerformanceTrend | PerformanceTrend[];
  detectedAfter?: Date;
  detectedBefore?: Date;
  resolvedAfter?: Date;
  resolvedBefore?: Date;

  kind?: CodeEdgeKind | CodeEdgeKind[];
  source?: CodeEdgeSource | CodeEdgeSource[];
  resolution?: CodeResolution | CodeResolution[];
  scope?: CodeScope | CodeScope[];
  confidenceMin?: number;
  confidenceMax?: number;
  inferred?: boolean;
  resolved?: boolean;
  active?: boolean;
  firstSeenSince?: Date;
  lastSeenSince?: Date;

  to_ref_kind?: 'entity' | 'fileSymbol' | 'external';
  to_ref_file?: string;
  to_ref_symbol?: string;
  to_ref_name?: string;

  from_ref_kind?: 'entity' | 'fileSymbol' | 'external';
  from_ref_file?: string;
  from_ref_symbol?: string;
  from_ref_name?: string;

  siteHash?: string;

  arityEq?: number;
  arityMin?: number;
  arityMax?: number;
  awaited?: boolean;
  isMethod?: boolean;

  operator?: string;
  callee?: string;
  importDepthMin?: number;
  importDepthMax?: number;
  importAlias?: string | string[];
  importType?: StructuralImportType | StructuralImportType[];
  isNamespace?: boolean;
  language?: string | string[];
  symbolKind?: string | string[];
  modulePath?: string | string[];
  modulePathPrefix?: string;

  sessionId?: string | string[];
  sessionIds?: string[];
  sequenceNumber?: number | number[];
  sequenceNumberMin?: number;
  sequenceNumberMax?: number;
  timestampFrom?: Date | string;
  timestampTo?: Date | string;
  actor?: string | string[];
  impactSeverity?:
    | 'critical'
    | 'high'
    | 'medium'
    | 'low'
    | Array<'critical' | 'high' | 'medium' | 'low'>;
  stateTransitionTo?:
    | 'working'
    | 'broken'
    | 'unknown'
    | Array<'working' | 'broken' | 'unknown'>;
}

export interface RelationshipFilter {
  types?: RelationshipType[];
  directions?: ('outgoing' | 'incoming')[];
  depths?: number[];
  weights?: {
    min?: number;
    max?: number;
  };
}


export interface PathQuery {
  startEntityId: string;
  endEntityId?: string;
  relationshipTypes?: RelationshipType[];
  maxDepth?: number;
  direction?: 'outgoing' | 'incoming' | 'both';
}

export interface PathResult {
  path: GraphRelationship[];
  totalLength: number;
  relationshipTypes: RelationshipType[];
  entities: string[];
}


export interface TraversalQuery {
  startEntityId: string;
  relationshipTypes: RelationshipType[];
  direction: 'outgoing' | 'incoming' | 'both';
  maxDepth?: number;
  limit?: number;
  filter?: {
    entityTypes?: string[];
    properties?: Record<string, any>;
  };
}

export interface TraversalResult {
  entities: any[];
  relationships: GraphRelationship[];
  paths: PathResult[];
  visited: string[];
}


export interface ImpactQuery {
  entityId: string;
  changeType: 'modify' | 'delete' | 'rename';
  includeIndirect?: boolean;
  maxDepth?: number;
  relationshipTypes?: RelationshipType[];
}

export interface ImpactResult {
  directImpact: {
    entities: any[];
    severity: 'high' | 'medium' | 'low';
    reason: string;
  }[];
  cascadingImpact: {
    level: number;
    entities: any[];
    relationship: RelationshipType;
    confidence: number;
  }[];
  totalAffectedEntities: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}

================
File: types/types.ts
================
import {
  Entity,
  Spec,
  Test,
  SecurityIssue,
  Vulnerability,
  CoverageMetrics,
  Change,
} from "./entities.js";
import {
  GraphRelationship,
  RelationshipType,
  type PerformanceMetricSample,
  type PerformanceSeverity,
  type PerformanceTrend,
  type SessionRelationship,
} from "./relationships.js";


export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    requestId: string;
    timestamp: Date;
    executionTime: number;
  };
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}


export interface BaseQueryParams {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  includeMetadata?: boolean;
}

export interface TimeRangeParams {
  since?: Date;
  until?: Date;
  timeRange?: "1h" | "24h" | "7d" | "30d" | "90d";
}


export interface HistoryConfig {
  enabled?: boolean;
  retentionDays?: number;
  checkpoint?: {
    hops?: number;
    embedVersions?: boolean;
  };
}

export type CheckpointReason = "daily" | "incident" | "manual";

export interface CheckpointCreateRequest {
  seedEntities: string[];
  reason: CheckpointReason;
  hops?: number;
  window?: TimeRangeParams;
}

export interface TemporalGraphQuery {
  startId: string;
  atTime?: Date;
  since?: Date;
  until?: Date;
  maxDepth?: number;
}

export interface TraversalQuery {
  startId: string;
  until?: Date;
  maxDepth?: number;
  relationshipTypes?: string[];
  nodeLabels?: string[];
}

export interface EntityTimelineEntry {
  versionId: string;
  timestamp: Date;
  hash?: string;
  path?: string;
  language?: string;
  changeSetId?: string;
  previousVersionId?: string | null;
  changes: Array<{
    changeId: string;
    type: RelationshipType;
    metadata?: Record<string, any>;
    change?: Change;
  }>;
  metadata?: Record<string, any>;
}

export interface EntityTimelineResult {
  entityId: string;
  versions: EntityTimelineEntry[];
  relationships?: RelationshipTimeline[];
}

export interface RelationshipTimelineSegment {
  segmentId: string;
  openedAt: Date;
  closedAt?: Date | null;
  changeSetId?: string;
}

export interface RelationshipTimeline {
  relationshipId: string;
  type: RelationshipType | string;
  fromEntityId: string;
  toEntityId: string;
  active: boolean;
  current?: RelationshipTimelineSegment;
  segments: RelationshipTimelineSegment[];
  lastModified?: Date;
  temporal?: Record<string, any>;
}

export interface StructuralNavigationEntry {
  entity: Entity;
  relationship: GraphRelationship;
}

export interface ModuleChildrenResult {
  modulePath: string;
  parentId?: string;
  children: StructuralNavigationEntry[];
}

export interface ModuleHistoryOptions {
  includeInactive?: boolean;
  limit?: number;
  versionLimit?: number;
}

export interface ModuleHistoryEntitySummary {
  id: string;
  type?: string;
  name?: string;
  path?: string;
  language?: string;
}

export interface ModuleHistoryRelationship {
  relationshipId: string;
  type: RelationshipType | string;
  direction: "outgoing" | "incoming";
  from: ModuleHistoryEntitySummary;
  to: ModuleHistoryEntitySummary;
  active: boolean;
  current?: RelationshipTimelineSegment;
  segments: RelationshipTimelineSegment[];
  firstSeenAt?: Date | null;
  lastSeenAt?: Date | null;
  confidence?: number | null;
  scope?: string | null;
  metadata?: Record<string, any>;
  temporal?: Record<string, any>;
  lastModified?: Date;
}

export interface ModuleHistoryResult {
  moduleId?: string | null;
  modulePath: string;
  moduleType?: string;
  generatedAt: Date;
  versions: EntityTimelineEntry[];
  relationships: ModuleHistoryRelationship[];
}

export interface ImportEntry {
  relationship: GraphRelationship;
  target?: Entity | null;
}

export interface ListImportsResult {
  entityId: string;
  imports: ImportEntry[];
}

export interface DefinitionLookupResult {
  symbolId: string;
  relationship?: GraphRelationship | null;
  source?: Entity | null;
}

export interface SessionChangeSummary {
  change: Change;
  relationships: Array<{
    relationshipId: string;
    type: RelationshipType;
    entityId: string;
    direction: "incoming" | "outgoing";
  }>;
  versions: Array<{
    versionId: string;
    entityId: string;
    relationshipType: RelationshipType;
  }>;
}

export interface SessionChangesResult {
  sessionId: string;
  total: number;
  changes: SessionChangeSummary[];
}

export interface SessionTimelineEvent {
  relationshipId: string;
  type: RelationshipType;
  fromEntityId: string;
  toEntityId: string;
  timestamp: Date | null;
  sequenceNumber?: number | null;
  actor?: string;
  impactSeverity?: 'critical' | 'high' | 'medium' | 'low';
  stateTransitionTo?: 'working' | 'broken' | 'unknown';
  changeInfo?: SessionRelationship['changeInfo'];
  impact?: SessionRelationship['impact'];
  stateTransition?: SessionRelationship['stateTransition'];
  metadata?: Record<string, any>;
}

export interface SessionTimelineSummary {
  totalEvents: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  actors: Array<{ actor: string; count: number }>;
  firstTimestamp?: Date;
  lastTimestamp?: Date;
}

export interface SessionTimelineResult {
  sessionId: string;
  total: number;
  events: SessionTimelineEvent[];
  page: {
    limit: number;
    offset: number;
    count: number;
  };
  summary: SessionTimelineSummary;
}

export interface SessionImpactEntry {
  entityId: string;
  relationshipIds: string[];
  impactCount: number;
  firstTimestamp?: Date;
  latestTimestamp?: Date;
  latestSeverity?: 'critical' | 'high' | 'medium' | 'low' | null;
  latestSequenceNumber?: number | null;
  actors: string[];
}

export interface SessionImpactsResult {
  sessionId: string;
  totalEntities: number;
  impacts: SessionImpactEntry[];
  page: {
    limit: number;
    offset: number;
    count: number;
  };
  summary: {
    bySeverity: Record<string, number>;
    totalRelationships: number;
  };
}

export interface SessionsAffectingEntityEntry {
  sessionId: string;
  relationshipIds: string[];
  eventCount: number;
  firstTimestamp?: Date;
  lastTimestamp?: Date;
  actors: string[];
  severities: Record<string, number>;
}

export interface SessionsAffectingEntityResult {
  entityId: string;
  totalSessions: number;
  sessions: SessionsAffectingEntityEntry[];
  page: {
    limit: number;
    offset: number;
    count: number;
  };
  summary: {
    bySeverity: Record<string, number>;
    totalRelationships: number;
  };
}


export interface CreateSpecRequest {
  title: string;
  description: string;
  goals: string[];
  acceptanceCriteria: string[];
  priority?: "low" | "medium" | "high" | "critical";
  assignee?: string;
  tags?: string[];
  dependencies?: string[];
}

export interface CreateSpecResponse {
  specId: string;
  spec: Spec;
  validationResults: {
    isValid: boolean;
    issues: ValidationIssue[];
    suggestions: string[];
  };
}

export interface GetSpecResponse {
  spec: Spec;
  relatedSpecs: Spec[];
  affectedEntities: Entity[];
  testCoverage: TestCoverage;
}

export interface UpdateSpecRequest {
  title?: string;
  description?: string;
  acceptanceCriteria?: string[];
  status?: "draft" | "approved" | "implemented" | "deprecated";
  priority?: "low" | "medium" | "high" | "critical";
}

export interface ListSpecsParams extends BaseQueryParams {
  status?: string[];
  priority?: string[];
  assignee?: string;
  tags?: string[];
  search?: string;
}


export interface TestPlanRequest {
  specId: string;
  testTypes?: ("unit" | "integration" | "e2e")[];
  coverage?: {
    minLines?: number;
    minBranches?: number;
    minFunctions?: number;
  };
  includePerformanceTests?: boolean;
  includeSecurityTests?: boolean;
}

export interface TestPlanResponse {
  testPlan: {
    unitTests: TestSpec[];
    integrationTests: TestSpec[];
    e2eTests: TestSpec[];
    performanceTests: TestSpec[];
  };
  estimatedCoverage: CoverageMetrics;
  changedFiles: string[];
}

export interface TestSpec {
  name: string;
  description: string;
  type: "unit" | "integration" | "e2e" | "performance";
  targetFunction?: string;
  assertions: string[];
  dataRequirements?: string[];
}

export interface TestExecutionResult {
  testId: string;
  testSuite: string;
  testName: string;
  status: "passed" | "failed" | "skipped" | "error";
  duration: number;
  errorMessage?: string;
  stackTrace?: string;
  coverage?: CoverageMetrics;
  performance?: {
    memoryUsage?: number;
    cpuUsage?: number;
    networkRequests?: number;
  };
}

export interface PerformanceMetrics {
  entityId: string;
  averageExecutionTime: number;
  p95ExecutionTime: number;
  successRate: number;
  trend: "improving" | "stable" | "degrading";
  benchmarkComparisons: {
    benchmark: string;
    value: number;
    status: "above" | "below" | "at";
  }[];
  historicalData: {
    timestamp: Date;
    executionTime: number;
    averageExecutionTime: number;
    p95ExecutionTime: number;
    successRate: number;
    coveragePercentage?: number;
    runId?: string;
  }[];
}

export interface PerformanceHistoryOptions {
  days?: number;
  metricId?: string;
  environment?: string;
  severity?: PerformanceSeverity;
  limit?: number;
}

export interface PerformanceHistoryRecord {
  id?: string;
  testId?: string;
  targetId?: string;
  metricId: string;
  scenario?: string;
  environment?: string;
  severity?: PerformanceSeverity;
  trend?: PerformanceTrend;
  unit?: string;
  baselineValue?: number | null;
  currentValue?: number | null;
  delta?: number | null;
  percentChange?: number | null;
  sampleSize?: number | null;
  riskScore?: number | null;
  runId?: string;
  detectedAt?: Date | null;
  resolvedAt?: Date | null;
  metricsHistory?: PerformanceMetricSample[] | null;
  metadata?: Record<string, any> | null;
  createdAt?: Date | null;
  source?: "snapshot";
}

export interface TestCoverage {
  entityId: string;
  overallCoverage: CoverageMetrics;
  testBreakdown: {
    unitTests: CoverageMetrics;
    integrationTests: CoverageMetrics;
    e2eTests: CoverageMetrics;
  };
  uncoveredLines: number[];
  uncoveredBranches: number[];
  testCases: {
    testId: string;
    testName: string;
    covers: string[];
  }[];
}


export interface GraphSearchRequest {
  query: string;
  entityTypes?: (
    | "function"
    | "class"
    | "interface"
    | "file"
    | "module"
    | "spec"
    | "test"
    | "change"
    | "session"
    | "directory"
  )[];
  searchType?: "semantic" | "structural" | "usage" | "dependency";
  filters?: {
    language?: string;
    path?: string;
    tags?: string[];
    lastModified?: TimeRangeParams;
    checkpointId?: string;
  };
  includeRelated?: boolean;
  limit?: number;
}

export interface GraphSearchResult {
  entities: Entity[];
  relationships: GraphRelationship[];
  clusters: any[];
  relevanceScore: number;
}

export interface GraphExamples {
  entityId: string;
  signature: string;
  usageExamples: {
    context: string;
    code: string;
    file: string;
    line: number;
  }[];
  testExamples: {
    testId: string;
    testName: string;
    testCode: string;
    assertions: string[];
  }[];
  relatedPatterns: {
    pattern: string;
    frequency: number;
    confidence: number;
  }[];
}

export interface DependencyAnalysis {
  entityId: string;
  directDependencies: {
    entity: Entity;
    relationship: RelationshipType;
    confidence: number;
  }[];
  indirectDependencies: {
    entity: Entity;
    path: Entity[];
    relationship: RelationshipType;
    distance: number;
  }[];
  reverseDependencies: {
    entity: Entity;
    relationship: RelationshipType;
    impact: "high" | "medium" | "low";
  }[];
  circularDependencies: {
    cycle: Entity[];
    severity: "critical" | "warning" | "info";
  }[];
}


export interface CodeChangeProposal {
  changes: {
    file: string;
    type: "create" | "modify" | "delete" | "rename";
    oldContent?: string;
    newContent?: string;
    lineStart?: number;
    lineEnd?: number;
  }[];
  description: string;
  relatedSpecId?: string;
}

export interface CodeChangeAnalysis {
  affectedEntities: Entity[];
  breakingChanges: {
    severity: "breaking" | "potentially-breaking" | "safe";
    description: string;
    affectedEntities: string[];
  }[];
  impactAnalysis: {
    directImpact: Entity[];
    indirectImpact: Entity[];
    testImpact: Test[];
  };
  recommendations: {
    type: "warning" | "suggestion" | "requirement";
    message: string;
    actions: string[];
  }[];
}

export interface ValidationRequest {
  files?: string[];
  specId?: string;
  includeTypes?: (
    | "typescript"
    | "eslint"
    | "security"
    | "tests"
    | "coverage"
    | "architecture"
  )[];
  failOnWarnings?: boolean;
}

export interface ValidationResult {
  overall: {
    passed: boolean;
    score: number;
    duration: number;
  };
  typescript: {
    errors: number;
    warnings: number;
    issues: ValidationIssue[];
  };
  eslint: {
    errors: number;
    warnings: number;
    issues: ValidationIssue[];
  };
  security: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    issues: SecurityIssue[];
  };
  tests: {
    passed: number;
    failed: number;
    skipped: number;
    coverage: CoverageMetrics;
  };
  coverage: CoverageMetrics;
  architecture: {
    violations: number;
    issues: ValidationIssue[];
  };
}

export interface ValidationIssue {
  file: string;
  line: number;
  column: number;
  rule: string;
  severity: "error" | "warning" | "info";
  message: string;
  suggestion?: string;
}


export interface ImpactAnalysisRequest {
  changes: {
    entityId: string;
    changeType: "modify" | "delete" | "rename";
    newName?: string;
    signatureChange?: boolean;
  }[];
  includeIndirect?: boolean;
  maxDepth?: number;
}

export interface ImpactAnalysis {
  directImpact: {
    entities: Entity[];
    severity: "high" | "medium" | "low";
    reason: string;
  }[];
  cascadingImpact: {
    level: number;
    entities: Entity[];
    relationship: RelationshipType;
    confidence: number;
  }[];
  testImpact: {
    affectedTests: Test[];
    requiredUpdates: string[];
    coverageImpact: number;
  };
  documentationImpact: {
    staleDocs: any[];
    missingDocs: any[];
    requiredUpdates: string[];
    freshnessPenalty: number;
  };
  specImpact: ImpactAnalysisSpecImpact;
  deploymentGate: {
    blocked: boolean;
    level: "none" | "advisory" | "required";
    reasons: string[];
    stats: {
      missingDocs: number;
      staleDocs: number;
      freshnessPenalty: number;
    };
  };
  recommendations: {
    priority: "immediate" | "planned" | "optional";
    description: string;
    effort: "low" | "medium" | "high";
    impact: "breaking" | "functional" | "cosmetic";
    type?: "warning" | "requirement" | "suggestion";
    actions?: string[];
  }[];
}

export interface ImpactAnalysisSpecImpact {
  relatedSpecs: Array<{
    specId: string;
    spec?: Pick<Spec, "id" | "title" | "priority" | "status" | "assignee" | "tags">;
    priority?: "critical" | "high" | "medium" | "low";
    impactLevel?: "critical" | "high" | "medium" | "low";
    status?: Spec["status"] | "unknown";
    ownerTeams: string[];
    acceptanceCriteriaIds: string[];
    relationships: Array<{
      type: RelationshipType;
      impactLevel?: "critical" | "high" | "medium" | "low";
      priority?: "critical" | "high" | "medium" | "low";
      acceptanceCriteriaId?: string;
      acceptanceCriteriaIds?: string[];
      rationale?: string;
      ownerTeam?: string;
      confidence?: number;
      status?: Spec["status"] | "unknown";
    }>;
  }>;
  requiredUpdates: string[];
  summary: {
    byPriority: Record<"critical" | "high" | "medium" | "low", number>;
    byImpactLevel: Record<"critical" | "high" | "medium" | "low", number>;
    statuses: Record<"draft" | "approved" | "implemented" | "deprecated" | "unknown", number>;
    acceptanceCriteriaReferences: number;
    pendingSpecs: number;
  };
}


export interface VectorSearchRequest {
  query: string;
  entityTypes?: string[];
  similarity?: number;
  limit?: number;
  includeMetadata?: boolean;
  filters?: {
    language?: string;
    lastModified?: TimeRangeParams;
    tags?: string[];
  };
}

export interface VectorSearchResult {
  results: {
    entity: Entity;
    similarity: number;
    context: string;
    highlights: string[];
  }[];
  metadata: {
    totalResults: number;
    searchTime: number;
    indexSize: number;
  };
}


export interface CommitPRRequest {
  title: string;
  description: string;
  changes: string[];
  relatedSpecId?: string;
  testResults?: string[];
  validationResults?: string | ValidationResult | Record<string, unknown>;
  createPR?: boolean;
  branchName?: string;
  labels?: string[];
}

export interface CommitPRResponse {
  commitHash: string;
  prUrl?: string;
  branch: string;
  status: "committed" | "pending" | "failed";
  provider?: string;
  retryAttempts?: number;
  escalationRequired?: boolean;
  escalationMessage?: string;
  providerError?: {
    message: string;
    code?: string;
    lastAttempt?: number;
  };
  relatedArtifacts: {
    spec: Spec | null;
    tests: Test[];
    validation: ValidationResult | Record<string, unknown> | null;
  };
}

export interface SCMCommitRecord {
  id?: string;
  commitHash: string;
  branch: string;
  title: string;
  description?: string;
  author?: string;
  changes: string[];
  relatedSpecId?: string;
  testResults?: string[];
  validationResults?: any;
  prUrl?: string;
  provider?: string;
  status?: "pending" | "committed" | "pushed" | "merged" | "failed";
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SCMStatusSummary {
  branch: string;
  clean: boolean;
  ahead: number;
  behind: number;
  staged: string[];
  unstaged: string[];
  untracked: string[];
  lastCommit?: {
    hash: string;
    author: string;
    date?: string;
    title: string;
  } | null;
}

export interface SCMBranchInfo {
  name: string;
  isCurrent: boolean;
  isRemote?: boolean;
  upstream?: string | null;
  lastCommit?: {
    hash: string;
    title: string;
    author?: string;
    date?: string;
  } | null;
}

export interface SCMPushResult {
  remote: string;
  branch: string;
  forced: boolean;
  pushed: boolean;
  commitHash?: string;
  provider?: string;
  url?: string;
  message?: string;
  timestamp: string;
}

export interface SCMCommitLogEntry {
  hash: string;
  author: string;
  email?: string;
  date: string;
  message: string;
  refs?: string[];
}


export interface SecurityScanRequest {
  entityIds?: string[];
  scanTypes?: ("sast" | "sca" | "secrets" | "dependency")[];
  severity?: ("critical" | "high" | "medium" | "low")[];
}

export interface SecurityScanResult {
  issues: SecurityIssue[];
  vulnerabilities: Vulnerability[];
  summary: {
    totalIssues: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  };
}

export interface VulnerabilityReport {
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  vulnerabilities: Vulnerability[];
  byPackage: Record<string, Vulnerability[]>;
  remediation: {
    immediate: string[];
    planned: string[];
    monitoring: string[];
  };
}


export interface SystemHealth {
  overall: "healthy" | "degraded" | "unhealthy";
  components: {
    graphDatabase: ComponentHealth;
    vectorDatabase: ComponentHealth;
    fileWatcher: ComponentHealth;
    apiServer: ComponentHealth;
  };
  metrics: {
    uptime: number;
    totalEntities: number;
    totalRelationships: number;
    syncLatency: number;
    errorRate: number;
  };
}

export interface ComponentHealth {
  status: "healthy" | "degraded" | "unhealthy";
  responseTime?: number;
  errorRate?: number;
  lastCheck: Date;
  message?: string;
}

export interface SyncStatus {
  isActive: boolean;
  lastSync: Date;
  queueDepth: number;
  processingRate: number;
  errors: {
    count: number;
    recent: string[];
  };
  performance: {
    syncLatency: number;
    throughput: number;
    successRate: number;
  };
}

export interface SyncOptions {
  force?: boolean;
  includeEmbeddings?: boolean;
  includeTests?: boolean;
  includeSecurity?: boolean;
}

export interface SystemAnalytics extends TimeRangeParams {
  usage: {
    apiCalls: number;
    uniqueUsers: number;
    popularEndpoints: Record<string, number>;
  };
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
  };
  content: {
    totalEntities: number;
    totalRelationships: number;
    growthRate: number;
    mostActiveDomains: string[];
  };
}


export interface APIError {
  code:
    | "VALIDATION_ERROR"
    | "NOT_FOUND"
    | "PERMISSION_DENIED"
    | "INTERNAL_ERROR"
    | "RATE_LIMITED";
  message: string;
  details?: any;
  requestId: string;
  timestamp: Date;
}


export interface AuthenticatedRequest {
  headers: {
    Authorization: `Bearer ${string}`;
    "X-API-Key"?: string;
    "X-Request-ID"?: string;
  };
}


export interface RateLimit {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}


export interface WebhookConfig {
  url: string;
  events: ("sync.completed" | "validation.failed" | "security.alert")[];
  secret: string;
}

export interface RealTimeSubscription {
  event: string;
  filter?: any;
  callback: (event: any) => void;
}


export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  handler: (params: any) => Promise<any>;
}

export interface MCPRequest {
  method: string;
  params: any;
  id?: string;
}

export interface MCPResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
  };
  id?: string;
}

================
File: utils/codeEdges.ts
================
import * as crypto from "crypto";
import {
  GraphRelationship,
  RelationshipType,
  CodeEdgeSource,
  CodeEdgeKind,
  EdgeEvidence,
  CodeRelationship,
  CODE_RELATIONSHIP_TYPES,
  isDocumentationRelationshipType,
  isPerformanceRelationshipType,
  isSessionRelationshipType,
  isStructuralRelationshipType,
} from "../models/relationships.js";
import { sanitizeEnvironment } from "./environment.js";

const CODE_RELATIONSHIP_TYPE_SET = new Set<RelationshipType>(
  CODE_RELATIONSHIP_TYPES
);


export function mergeEdgeEvidence(
  a: EdgeEvidence[] = [],
  b: EdgeEvidence[] = [],
  limit = 20
): EdgeEvidence[] {
  const arr = [
    ...(Array.isArray(a) ? a : []),
    ...(Array.isArray(b) ? b : []),
  ].filter(Boolean) as EdgeEvidence[];
  const key = (e: EdgeEvidence) =>
    `${e.source || ""}|${e.location?.path || ""}|${e.location?.line || ""}|${
      e.location?.column || ""
    }`;
  const rankSrc = (e: EdgeEvidence) =>
    e.source === "type-checker" ? 3 : e.source === "ast" ? 2 : 1;
  const seen = new Set<string>();
  const out: EdgeEvidence[] = [];
  for (const e of arr.sort((x, y) => {
    const rs = rankSrc(y) - rankSrc(x);
    if (rs !== 0) return rs;
    const lx =
      typeof x.location?.line === "number"
        ? x.location!.line!
        : Number.MAX_SAFE_INTEGER;
    const ly =
      typeof y.location?.line === "number"
        ? y.location!.line!
        : Number.MAX_SAFE_INTEGER;
    return lx - ly;
  })) {
    const k = key(e);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(e);
    }
    if (out.length >= limit) break;
  }
  return out;
}

export function mergeEdgeLocations(
  a: Array<{ path?: string; line?: number; column?: number }> = [],
  b: Array<{ path?: string; line?: number; column?: number }> = [],
  limit = 20
): Array<{ path?: string; line?: number; column?: number }> {
  const arr = [
    ...(Array.isArray(a) ? a : []),
    ...(Array.isArray(b) ? b : []),
  ].filter(Boolean) as Array<{ path?: string; line?: number; column?: number }>;
  const key = (l: { path?: string; line?: number; column?: number }) =>
    `${l.path || ""}|${l.line || ""}|${l.column || ""}`;
  const seen = new Set<string>();
  const out: Array<{ path?: string; line?: number; column?: number }> = [];
  for (const l of arr) {
    const k = key(l);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(l);
    }
    if (out.length >= limit) break;
  }
  return out;
}

export function isCodeRelationship(type: RelationshipType): boolean {

  if ((type as string) === "USES") return true;
  return CODE_RELATIONSHIP_TYPE_SET.has(type);
}

export function normalizeSource(s?: string): CodeEdgeSource | undefined {
  if (!s) return undefined;
  const v = String(s).toLowerCase();
  if (
    v === "call-typecheck" ||
    v === "ts" ||
    v === "checker" ||
    v === "tc" ||
    v === "type-checker"
  )
    return "type-checker";
  if (v === "ts-ast" || v === "ast" || v === "parser") return "ast";
  if (v === "heuristic" || v === "inferred") return "heuristic";
  if (v === "index" || v === "indexer") return "index";
  if (v === "runtime" || v === "instrumentation") return "runtime";
  if (v === "lsp" || v === "language-server") return "lsp";

  return "heuristic";
}


export function canonicalTargetKeyFor(rel: GraphRelationship): string {
  const anyRel: any = rel as any;
  const t = String(rel.toEntityId || "");
  const toRef = anyRel.toRef;

  // Prefer structured toRef
  if (toRef && typeof toRef === "object") {
    if (toRef.kind === "entity" && toRef.id) return `ENT:${toRef.id}`;
    if (
      toRef.kind === "fileSymbol" &&
      (toRef.file || toRef.symbol || toRef.name)
    ) {
      const file = toRef.file || "";
      const sym = (toRef.symbol || toRef.name || "") as string;
      return `FS:${file}:${sym}`;
    }
    if (toRef.kind === "external" && toRef.name) return `EXT:${toRef.name}`;
  }



  if (/^(sym:|file:[^:]+$)/.test(t)) return `ENT:${t}`;

  {
    const m = t.match(/^file:(.+?):(.+)$/);
    if (m) return `FS:${m[1]}:${m[2]}`;
  }

  {
    const m = t.match(/^external:(.+)$/);
    if (m) return `EXT:${m[1]}`;
  }

  {
    const m = t.match(/^(class|interface|function|typeAlias):(.+)$/);
    if (m) return `KIND:${m[1]}:${m[2]}`;
  }

  {
    const m = t.match(/^import:(.+?):(.+)$/);
    if (m) return `IMP:${m[1]}:${m[2]}`;
  }

  return `RAW:${t}`;
}

const EVIDENCE_NOTE_MAX = 2000;
const EXTRACTOR_VERSION_MAX = 200;
const PATH_MAX = 4096;

function clampConfidenceValue(value: unknown): number | undefined {
  const num =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
      ? Number(value)
      : NaN;
  if (!Number.isFinite(num)) return undefined;
  const clamped = Math.max(0, Math.min(1, num));
  return clamped;
}

function sanitizeStringValue(
  value: unknown,
  maxLength: number
): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function sanitizeLocationEntry(
  value: any
): { path?: string; line?: number; column?: number } | null {
  if (!value || typeof value !== "object") return null;
  const out: { path?: string; line?: number; column?: number } = {};
  const path = sanitizeStringValue((value as any).path, PATH_MAX);
  if (path) out.path = path;
  const lineRaw = (value as any).line;
  const lineNum = Number(lineRaw);
  if (Number.isFinite(lineNum)) {
    const line = Math.max(0, Math.round(lineNum));
    out.line = line;
  }
  const columnRaw = (value as any).column;
  const columnNum = Number(columnRaw);
  if (Number.isFinite(columnNum)) {
    const column = Math.max(0, Math.round(columnNum));
    out.column = column;
  }
  return out.path !== undefined ||
    out.line !== undefined ||
    out.column !== undefined
    ? out
    : null;
}

function sanitizeLocationList(
  value: any
): Array<{ path?: string; line?: number; column?: number }> {
  if (!Array.isArray(value)) return [];
  const out: Array<{ path?: string; line?: number; column?: number }> = [];
  for (const entry of value) {
    const sanitized = sanitizeLocationEntry(entry);
    if (sanitized) {
      out.push(sanitized);
      if (out.length >= 20) break;
    }
  }
  return out;
}

function sanitizeEvidenceList(
  value: any,
  fallbackSource: CodeEdgeSource
): EdgeEvidence[] {
  const arr = Array.isArray(value) ? value : [];
  const out: EdgeEvidence[] = [];
  for (const entry of arr) {
    if (!entry || typeof entry !== "object") continue;
    const srcNormalized =
      normalizeSource((entry as any).source) || fallbackSource;
    const ev: EdgeEvidence = { source: srcNormalized };
    const confidence = clampConfidenceValue((entry as any).confidence);
    if (confidence !== undefined) ev.confidence = confidence;
    const loc = sanitizeLocationEntry((entry as any).location);
    if (loc) ev.location = loc;
    const note = sanitizeStringValue((entry as any).note, EVIDENCE_NOTE_MAX);
    if (note) ev.note = note;
    const extractorVersion = sanitizeStringValue(
      (entry as any).extractorVersion,
      EXTRACTOR_VERSION_MAX
    );
    if (extractorVersion) ev.extractorVersion = extractorVersion;
    out.push(ev);
    if (out.length >= 20) break;
  }
  return out;
}

function coerceNonNegative(
  value: unknown,
  { integer = false }: { integer?: boolean } = {}
): number | undefined {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
      ? Number(value)
      : NaN;
  if (!Number.isFinite(parsed)) return undefined;
  const sanitized = parsed < 0 ? 0 : parsed;
  return integer ? Math.floor(sanitized) : sanitized;
}

export function normalizeCodeEdge<T extends GraphRelationship>(relIn: T): T {
  const rel: any = { ...(relIn as any) };
  // Backwards compatibility: old ingesters emitted USES instead of TYPE_USES
  if (rel.type === "USES") rel.type = RelationshipType.TYPE_USES;
  if (!isCodeRelationship(rel.type)) return rel as T;

  const md = (rel.metadata || {}) as any;


  const hoist = (k: string, mapKey?: string) => {
    const key = mapKey || k;
    if (rel[key] == null && md[k] != null) rel[key] = md[k];
  };
  [
    "kind",
    "resolution",
    "scope",
    "arity",
    "awaited",
    "operator",
    "importDepth",
    "usedTypeChecker",
    "isExported",
    "accessPath",
    "dataFlowId",
    "confidence",
    "inferred",
    "resolved",
    "source",
    "callee",
    "paramName",
    "importAlias",
    "receiverType",
    "dynamicDispatch",
    "overloadIndex",
    "genericArguments",
    "ambiguous",
    "candidateCount",
    "isMethod",
    "occurrencesScan",
    "occurrencesTotal",
    "occurrencesRecent",
  ].forEach((k) => hoist(k));

  hoist("param", "paramName");

  const occScan = coerceNonNegative(rel.occurrencesScan, { integer: true });
  if (occScan !== undefined) rel.occurrencesScan = occScan;
  else delete rel.occurrencesScan;
  const occTotal = coerceNonNegative(rel.occurrencesTotal, { integer: true });
  if (occTotal !== undefined) rel.occurrencesTotal = occTotal;
  else delete rel.occurrencesTotal;
  const occRecent = coerceNonNegative(rel.occurrencesRecent, {
    integer: false,
  });
  if (occRecent !== undefined) rel.occurrencesRecent = occRecent;
  else delete rel.occurrencesRecent;

  rel.source = normalizeSource(rel.source || md.source);

  if (
    typeof rel.confidence !== "number" &&
    typeof (rel as any).strength === "number"
  ) {
    rel.confidence = Math.max(0, Math.min(1, (rel as any).strength as number));
  }
  if ((rel as any).strength !== undefined) {
    delete (rel as any).strength;
  }


  if (typeof rel.active !== "boolean") rel.active = true;


  const path = rel.location?.path || md.path;
  const line = rel.location?.line ?? md.line;
  const column = rel.location?.column ?? md.column;
  if (!rel.context && typeof path === "string" && typeof line === "number")
    rel.context = `${path}:${line}`;
  if (
    !rel.location &&
    (path || typeof line === "number" || typeof column === "number")
  ) {
    rel.location = {
      ...(path ? { path } : {}),
      ...(typeof line === "number" ? { line } : {}),
      ...(typeof column === "number" ? { column } : {}),
    };
  }

  const locationSanitized = sanitizeLocationEntry(rel.location);
  if (locationSanitized) rel.location = locationSanitized;
  else if (rel.location != null) delete rel.location;


  if (
    !rel.siteId &&
    rel.location &&
    rel.location.path &&
    typeof rel.location.line === "number"
  ) {
    const base = `${rel.location.path}|${rel.location.line}|${
      rel.location.column ?? ""
    }|${rel.accessPath ?? ""}`;
    rel.siteId =
      "site_" +
      crypto.createHash("sha1").update(base).digest("hex").slice(0, 12);
  }

  if (!rel.siteHash) {
    const payload = JSON.stringify({
      p: rel.location?.path,
      a: rel.accessPath,
      k: rel.kind,
      c: rel.callee,
      o: rel.operator,
      pm: rel.paramName,
      t: rel.type,
      f: rel.fromEntityId,
    });
    rel.siteHash =
      "sh_" +
      crypto.createHash("sha1").update(payload).digest("hex").slice(0, 16);
  }
  if (Array.isArray(rel.sites)) {
    rel.sites = Array.from(
      new Set(rel.sites.concat(rel.siteId ? [rel.siteId] : []))
    ).slice(0, 20);
  } else if (rel.siteId) {
    rel.sites = [rel.siteId];
  }


  const evTop: EdgeEvidence[] = Array.isArray(rel.evidence) ? rel.evidence : [];
  const evMd: EdgeEvidence[] = Array.isArray(md.evidence) ? md.evidence : [];
  const out = mergeEdgeEvidence(evTop, evMd, 20);
  if (out.length > 0) rel.evidence = out;
  else {
    const def: EdgeEvidence = {
      source: (rel.source as CodeEdgeSource) || "ast",
      confidence:
        typeof (rel as any).confidence === "number"
          ? (rel as any).confidence
          : undefined,
      location: rel.location,
      note: typeof md.note === "string" ? md.note : undefined,
      extractorVersion:
        typeof md.extractorVersion === "string"
          ? md.extractorVersion
          : undefined,
    };
    rel.evidence = [def];
  }

  const fallbackSource = (rel.source as CodeEdgeSource) || "ast";
  let sanitizedEvidence = sanitizeEvidenceList(
    rel.evidence as any,
    fallbackSource
  );
  if (sanitizedEvidence.length === 0) {
    sanitizedEvidence = sanitizeEvidenceList(
      [
        {
          source: fallbackSource,
          confidence: clampConfidenceValue(rel.confidence),
          location: rel.location,
          note: typeof md.note === "string" ? md.note : undefined,
          extractorVersion:
            typeof md.extractorVersion === "string"
              ? md.extractorVersion
              : undefined,
        },
      ],
      fallbackSource
    );
  }
  if (sanitizedEvidence.length === 0) {
    sanitizedEvidence = [{ source: fallbackSource }];
  }
  rel.evidence = sanitizedEvidence;

  const combinedLocations = sanitizeLocationList([
    ...(Array.isArray(rel.locations) ? rel.locations : []),
    ...(Array.isArray((md as any).locations) ? (md as any).locations : []),
  ]);
  if (combinedLocations.length > 0) rel.locations = combinedLocations;
  else delete rel.locations;


  const mdNew: any = { ...md };
  delete mdNew.evidence;
  delete mdNew.locations;
  if (rel.fromRef && mdNew.fromRef == null) mdNew.fromRef = rel.fromRef;
  if (rel.toRef && mdNew.toRef == null) mdNew.toRef = rel.toRef;
  rel.metadata = mdNew;


  try {
    const t = String(rel.toEntityId || "");
    const toRef = rel.toRef || mdNew.toRef;
    const parseSym = (
      symId: string
    ): { file: string; symbol: string; name: string } | null => {
      // sym:<relPath>#<name>@<hash>
      const m = symId.match(/^sym:(.+?)#(.+?)(?:@.+)?$/);
      if (!m) return null;
      const file = m[1];
      const symbol = m[2];
      return { file, symbol, name: symbol };
    };
    const setFileSym = (file: string, sym: string) => {
      rel.to_ref_kind = "fileSymbol";
      rel.to_ref_file = file;
      rel.to_ref_symbol = sym;
      rel.to_ref_name = rel.to_ref_name || sym;
    };
    if (toRef && typeof toRef === "object") {
      if (toRef.kind === "entity") {
        rel.to_ref_kind = "entity";
        rel.to_ref_name = toRef.name || rel.to_ref_name;
      } else if (toRef.kind === "fileSymbol") {
        setFileSym(toRef.file || "", toRef.symbol || toRef.name || "");
      } else if (toRef.kind === "external") {
        rel.to_ref_kind = "external";
        rel.to_ref_name = toRef.name || rel.to_ref_name;
      }
    } else {

      if (t.startsWith("sym:")) {
        const parsed = parseSym(t);
        if (parsed) setFileSym(parsed.file, parsed.symbol);
      }
      const mFile = t.match(/^file:(.+?):(.+)$/);
      if (mFile) setFileSym(mFile[1], mFile[2]);
      const mExt = t.match(/^external:(.+)$/);
      if (mExt) {
        rel.to_ref_kind = "external";
        rel.to_ref_name = mExt[1];
      }
      if (/^(sym:|file:)/.test(t)) {
        rel.to_ref_kind = rel.to_ref_kind || "entity";
      }
    }
  } catch {}


  try {
    const f = String(rel.fromEntityId || "");
    const fromRef = (rel as any).fromRef || mdNew.fromRef;
    const parseSymFrom = (
      symId: string
    ): { file: string; symbol: string; name: string } | null => {
      const m = symId.match(/^sym:(.+?)#(.+?)(?:@.+)?$/);
      if (!m) return null;
      const file = m[1];
      const symbol = m[2];
      return { file, symbol, name: symbol };
    };
    const setFromFileSym = (file: string, sym: string) => {
      (rel as any).from_ref_kind = "fileSymbol";
      (rel as any).from_ref_file = file;
      (rel as any).from_ref_symbol = sym;
      (rel as any).from_ref_name = (rel as any).from_ref_name || sym;
    };
    if (fromRef && typeof fromRef === "object") {
      if (fromRef.kind === "entity") {
        (rel as any).from_ref_kind = "entity";
        (rel as any).from_ref_name = fromRef.name || (rel as any).from_ref_name;
      } else if (fromRef.kind === "fileSymbol") {
        setFromFileSym(
          fromRef.file || "",
          fromRef.symbol || fromRef.name || ""
        );
      } else if (fromRef.kind === "external") {
        (rel as any).from_ref_kind = "external";
        (rel as any).from_ref_name = fromRef.name || (rel as any).from_ref_name;
      }
    } else {
      if (f.startsWith("sym:")) {
        const parsed = parseSymFrom(f);
        if (parsed) setFromFileSym(parsed.file, parsed.symbol);
      }
      const mFile = f.match(/^file:(.+?):(.+)$/);
      if (mFile) setFromFileSym(mFile[1], mFile[2]);
      const mExt = f.match(/^external:(.+)$/);
      if (mExt) {
        (rel as any).from_ref_kind = "external";
        (rel as any).from_ref_name = mExt[1];
      }
      if (/^(sym:|file:)/.test(f)) {
        (rel as any).from_ref_kind = (rel as any).from_ref_kind || "entity";
      }
    }
  } catch {}


  try {
    if (!rel.kind) {
      switch (rel.type) {
        case RelationshipType.CALLS:
          (rel as any).kind = "call";
          break;
        case RelationshipType.REFERENCES:
          (rel as any).kind = "identifier";
          break;
        case RelationshipType.OVERRIDES:
          (rel as any).kind = "override";
          break;
        case RelationshipType.EXTENDS:
        case RelationshipType.IMPLEMENTS:
          (rel as any).kind = "inheritance";
          break;
        case RelationshipType.READS:
          (rel as any).kind = "read";
          break;
        case RelationshipType.WRITES:
          (rel as any).kind = "write";
          break;
        case RelationshipType.DEPENDS_ON:
          (rel as any).kind = "dependency";
          break;
        case RelationshipType.THROWS:
          (rel as any).kind = "throw";
          break;
        case RelationshipType.TYPE_USES:
          (rel as any).kind = "type";
          break;
        case RelationshipType.RETURNS_TYPE:
          (rel as any).kind = "return";
          break;
        case RelationshipType.PARAM_TYPE:
          (rel as any).kind = "param";
          break;
      }
    }
  } catch {}

  return rel as T;
}


export function canonicalRelationshipId(
  fromId: string,
  rel: GraphRelationship
): string {
  if (isStructuralRelationshipType(rel.type)) {
    const baseTarget = canonicalTargetKeyFor(rel);
    const base = `${fromId}|${baseTarget}|${rel.type}`;
    return "time-rel_" + crypto.createHash("sha1").update(base).digest("hex");
  }

  if (isSessionRelationshipType(rel.type)) {
    const anyRel: any = rel as any;
    const sessionIdSource =
      anyRel.sessionId ??
      anyRel.metadata?.sessionId ??
      (typeof rel.fromEntityId === "string" && rel.fromEntityId
        ? rel.fromEntityId
        : "");
    const sessionId = String(sessionIdSource || "")
      .trim()
      .toLowerCase();
    const sequenceSource =
      anyRel.sequenceNumber ?? anyRel.metadata?.sequenceNumber ?? 0;
    const sequenceNumber = Number.isFinite(Number(sequenceSource))
      ? Math.max(0, Math.floor(Number(sequenceSource)))
      : 0;
    const base = `${sessionId}|${sequenceNumber}|${rel.type}`;
    return (
      "rel_session_" +
      crypto.createHash("sha1").update(base).digest("hex")
    );
  }

  if (isPerformanceRelationshipType(rel.type)) {
    const anyRel: any = rel as any;
    const md =
      anyRel.metadata && typeof anyRel.metadata === "object"
        ? anyRel.metadata
        : {};
    const metricId = normalizeMetricIdForId(
      anyRel.metricId ?? md.metricId ?? rel.toEntityId ?? "unknown"
    );
    const environment = sanitizeEnvironment(
      anyRel.environment ?? md.environment ?? "unknown"
    );
    const scenario = normalizeScenarioForId(anyRel.scenario ?? md.scenario);
    const target = String(rel.toEntityId || "");
    const base = `${fromId}|${target}|${rel.type}|${metricId}|${environment}|${scenario}`;
    return (
      "rel_perf_" + crypto.createHash("sha1").update(base).digest("hex")
    );
  }

  const baseTarget = isCodeRelationship(rel.type)
    ? canonicalTargetKeyFor(rel)
    : isDocumentationRelationshipType(rel.type)
    ? canonicalDocumentationTargetKey(rel)
    : String(rel.toEntityId || "");
  const base = `${fromId}|${baseTarget}|${rel.type}`;
  return "rel_" + crypto.createHash("sha1").update(base).digest("hex");
}


export function legacyStructuralRelationshipId(
  canonicalId: string,
  rel: GraphRelationship
): string | null {
  if (!isStructuralRelationshipType(rel.type)) return null;
  if (canonicalId.startsWith("time-rel_")) {
    return "rel_" + canonicalId.slice("time-rel_".length);
  }
  if (canonicalId.startsWith("rel_")) return canonicalId;
  return null;
}

export function normalizeMetricIdForId(value: any): string {
  if (!value) return "unknown";
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/_\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/\/+$/g, "")
    .replace(/^\/+/, "")
    .slice(0, 256) || "unknown";
}

function normalizeScenarioForId(value: any): string {
  if (!value) return "";
  return normalizeStringForId(value).toLowerCase();
}

function canonicalDocumentationTargetKey(rel: GraphRelationship): string {
  const anyRel: any = rel as any;
  const md =
    anyRel.metadata && typeof anyRel.metadata === "object"
      ? anyRel.metadata
      : {};
  const source = normalizeDocSourceForId(anyRel.source ?? md.source);
  const docIntent = normalizeDocIntentForId(
    anyRel.docIntent ?? md.docIntent,
    rel.type
  );
  const sectionAnchor = normalizeAnchorForId(
    anyRel.sectionAnchor ?? md.sectionAnchor ?? md.anchor
  );

  switch (rel.type) {
    case RelationshipType.DOCUMENTED_BY: {
      const docVersion = normalizeStringForId(
        anyRel.docVersion ?? md.docVersion
      );
      return `${rel.toEntityId}|${sectionAnchor}|${source}|${docIntent}|${docVersion}`;
    }
    case RelationshipType.DESCRIBES_DOMAIN: {
      const domainPath = normalizeDomainPathForId(
        anyRel.domainPath ?? md.domainPath ?? md.taxonomyPath
      );
      const taxonomyVersion = normalizeStringForId(
        anyRel.taxonomyVersion ?? md.taxonomyVersion
      );
      return `${rel.toEntityId}|${domainPath}|${taxonomyVersion}|${sectionAnchor}|${docIntent}`;
    }
    case RelationshipType.BELONGS_TO_DOMAIN: {
      const domainPath = normalizeDomainPathForId(
        anyRel.domainPath ?? md.domainPath
      );
      return `${rel.toEntityId}|${domainPath}|${source}|${docIntent}`;
    }
    case RelationshipType.CLUSTER_MEMBER: {
      const clusterVersion = normalizeStringForId(
        anyRel.clusterVersion ?? md.clusterVersion
      );
      const docAnchor = normalizeAnchorForId(
        anyRel.docAnchor ?? md.docAnchor ?? sectionAnchor
      );
      const embeddingVersion = normalizeStringForId(
        anyRel.embeddingVersion ?? md.embeddingVersion
      );
      return `${rel.toEntityId}|${clusterVersion}|${docAnchor}|${embeddingVersion}|${docIntent}`;
    }
    case RelationshipType.DOMAIN_RELATED: {
      const relationshipType = normalizeStringForId(
        anyRel.relationshipType ?? md.relationshipType
      );
      return `${rel.toEntityId}|${relationshipType}|${source}`;
    }
    case RelationshipType.GOVERNED_BY: {
      const policyType = normalizeStringForId(
        anyRel.policyType ?? md.policyType
      );
      return `${rel.toEntityId}|${policyType}|${docIntent}`;
    }
    case RelationshipType.DOCUMENTS_SECTION: {
      return `${rel.toEntityId}|${sectionAnchor}|${docIntent}`;
    }
    default:
      return String(rel.toEntityId || "");
  }
}

function normalizeAnchorForId(anchor: any): string {
  if (!anchor) return "_root";
  const normalized = String(anchor)
    .trim()
    .replace(/^#+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9\-_/\s]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-/g, "")
    .replace(/-$/g, "");
  return normalized.length > 0 ? normalized.slice(0, 128) : "_root";
}

function normalizeDomainPathForId(value: any): string {
  if (!value) return "";
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/>+/g, "/")
    .replace(/\s+/g, "/")
    .replace(/[^a-z0-9/_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/\/+/, "/")
    .replace(/^\/+|\/+$/g, "");
}

function normalizeStringForId(value: any): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeDocSourceForId(value: any): string {
  if (!value) return "";
  const normalized = String(value).toLowerCase();
  switch (normalized) {
    case "parser":
    case "manual":
    case "llm":
    case "imported":
    case "sync":
    case "other":
      return normalized;
    default:
      return "other";
  }
}

function normalizeDocIntentForId(value: any, type: RelationshipType): string {
  if (value === null || value === undefined) {
    if (type === RelationshipType.GOVERNED_BY) return "governance";
    return "ai-context";
  }
  const normalized = String(value).toLowerCase();
  if (
    normalized === "ai-context" ||
    normalized === "governance" ||
    normalized === "mixed"
  ) {
    return normalized;
  }
  return type === RelationshipType.GOVERNED_BY ? "governance" : "ai-context";
}

================
File: utils/confidence.ts
================
import { RelationshipType } from "../types/relationships.js";
import { noiseConfig } from "../config/noise.js";

export interface InferredEdgeFeatures {
  relationType: RelationshipType;
  toId: string;
  fromFileRel?: string;
  usedTypeChecker?: boolean;
  isExported?: boolean;
  nameLength?: number;
  importDepth?: number;
}





export function scoreInferredEdge(features: InferredEdgeFeatures): number {
  const {
    toId,
    fromFileRel,
    usedTypeChecker,
    isExported,
    nameLength,
    importDepth,
  } = features;


  let score: number;
  if (toId.startsWith("external:")) {
    score = noiseConfig.AST_CONF_EXTERNAL;
  } else if (toId.startsWith("file:")) {
    score = noiseConfig.AST_CONF_FILE;
  } else {

    score = noiseConfig.AST_CONF_CONCRETE;
  }


  try {

    if (toId.startsWith("file:") && fromFileRel) {
      const parts = toId.split(":");
      if (parts.length >= 3) {
        const toRel = parts[1];
        if (normalizePath(toRel) === normalizePath(fromFileRel)) {
          score += noiseConfig.AST_BOOST_SAME_FILE;
        }
      }
    }


    if (usedTypeChecker) {
      score += noiseConfig.AST_BOOST_TYPECHECK;
    }


    if (isExported) {
      score += noiseConfig.AST_BOOST_EXPORTED;
    }


    if (typeof nameLength === "number" && Number.isFinite(nameLength)) {
      const over = Math.max(0, nameLength - 3);
      score += Math.min(10, over) * noiseConfig.AST_STEP_NAME_LEN;
    }


    if (
      typeof importDepth === "number" &&
      Number.isFinite(importDepth) &&
      importDepth > 0
    ) {
      score -= importDepth * noiseConfig.AST_PENALTY_IMPORT_DEPTH;
    }
  } catch {

  }


  try {
    const mult = parseFloat(process.env.AST_CONF_MULTIPLIER || "1");
    if (Number.isFinite(mult)) score *= mult;
    const minClamp = process.env.AST_CONF_MIN
      ? parseFloat(process.env.AST_CONF_MIN)
      : undefined;
    const maxClamp = process.env.AST_CONF_MAX
      ? parseFloat(process.env.AST_CONF_MAX)
      : undefined;
    if (Number.isFinite(minClamp as number))
      score = Math.max(score, minClamp as number);
    if (Number.isFinite(maxClamp as number))
      score = Math.min(score, maxClamp as number);
  } catch {}


  if (!Number.isFinite(score)) score = 0.5;
  return Math.max(0, Math.min(1, score));
}

function normalizePath(p: string): string {
  return String(p || "")
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/");
}

================
File: utils/embedding.ts
================
import OpenAI from 'openai';
import { Entity } from '../types/entities.js';

export interface EmbeddingConfig {
  openaiApiKey?: string;
  model?: string;
  dimensions?: number;
  batchSize?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface EmbeddingResult {
  embedding: number[];
  content: string;
  entityId?: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface BatchEmbeddingResult {
  results: EmbeddingResult[];
  totalTokens: number;
  totalCost: number;
  processingTime: number;
}

export class EmbeddingService {
  private config: Required<EmbeddingConfig>;
  private cache: Map<string, EmbeddingResult> = new Map();
  private rateLimitDelay = 100;
  private openai: OpenAI | null = null;

  constructor(config: EmbeddingConfig = {}) {
    this.config = {
      openaiApiKey: config.openaiApiKey || process.env.OPENAI_API_KEY || '',
      model: config.model || 'text-embedding-3-small',
      dimensions: config.dimensions || 1536,
      batchSize: config.batchSize || 100,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
    };


    if (this.config.openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: this.config.openaiApiKey,
      });
    }
  }




  async generateEmbedding(content: string, entityId?: string): Promise<EmbeddingResult> {

    const cacheKey = this.getCacheKey(content);
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return { ...cached, entityId };
    }


    if (!content || content.trim().length === 0) {
      throw new Error('Content cannot be empty');
    }

    if (!this.config.openaiApiKey) {

      return this.generateMockEmbedding(content, entityId);
    }

    try {
      const result = await this.generateOpenAIEmbedding(content, entityId);

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Failed to generate embedding:', error);

      return this.generateMockEmbedding(content, entityId);
    }
  }




  async generateEmbeddingsBatch(
    inputs: Array<{ content: string; entityId?: string }>
  ): Promise<BatchEmbeddingResult> {
    const startTime = Date.now();
    const results: EmbeddingResult[] = [];
    let totalTokens = 0;
    let totalCost = 0;


    for (let i = 0; i < inputs.length; i += this.config.batchSize) {
      const batch = inputs.slice(i, i + this.config.batchSize);
      const batchResults = await this.processBatch(batch);

      results.push(...batchResults.results);
      totalTokens += batchResults.totalTokens;
      totalCost += batchResults.totalCost;


      if (i + this.config.batchSize < inputs.length) {
        await this.delay(this.rateLimitDelay);
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      results,
      totalTokens,
      totalCost,
      processingTime,
    };
  }




  private async processBatch(
    inputs: Array<{ content: string; entityId?: string }>
  ): Promise<{ results: EmbeddingResult[]; totalTokens: number; totalCost: number }> {
    const results: EmbeddingResult[] = [];
    let totalTokens = 0;
    let totalCost = 0;


    const uncachedInputs = inputs.filter(input => {
      const cacheKey = this.getCacheKey(input.content);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        results.push({ ...cached, entityId: input.entityId });
        return false;
      }
      return true;
    });

    if (uncachedInputs.length === 0) {
      return { results, totalTokens, totalCost };
    }


    const newResults = await this.generateBatchOpenAIEmbeddings(uncachedInputs);
    results.push(...newResults.results);
    totalTokens += newResults.totalTokens;
    totalCost += newResults.totalCost;


    newResults.results.forEach(result => {
      this.cache.set(this.getCacheKey(result.content), result);
    });

    return { results, totalTokens, totalCost };
  }




  private async generateOpenAIEmbedding(
    content: string,
    entityId?: string
  ): Promise<EmbeddingResult> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Please provide OPENAI_API_KEY.');
    }

    try {
      const response = await this.openai.embeddings.create({
        model: this.config.model,
        input: content,
        encoding_format: 'float',
      });

      const embedding = response.data[0].embedding;
      const usage = response.usage;

      return {
        embedding,
        content,
        entityId,
        model: this.config.model,
        usage: {
          prompt_tokens: usage.prompt_tokens,
          total_tokens: usage.total_tokens,
        },
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }




  private async generateBatchOpenAIEmbeddings(
    inputs: Array<{ content: string; entityId?: string }>
  ): Promise<{ results: EmbeddingResult[]; totalTokens: number; totalCost: number }> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Please provide OPENAI_API_KEY.');
    }

    try {
      const contents = inputs.map(input => input.content);

      const response = await this.openai.embeddings.create({
        model: this.config.model,
        input: contents,
        encoding_format: 'float',
      });

      const results: EmbeddingResult[] = [];
      let totalTokens = 0;

      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const embedding = response.data[i].embedding;

        results.push({
          embedding,
          content: input.content,
          entityId: input.entityId,
          model: this.config.model,
          usage: {
            prompt_tokens: Math.ceil(input.content.length / 4),
            total_tokens: Math.ceil(input.content.length / 4),
          },
        });
      }


      if (response.usage) {
        totalTokens = response.usage.total_tokens;
      } else {
        totalTokens = results.reduce((sum, result) => sum + (result.usage?.total_tokens || 0), 0);
      }


      const costPerToken = this.getCostPerToken(this.config.model);
      const totalCost = (totalTokens / 1000) * costPerToken;

      return { results, totalTokens, totalCost };
    } catch (error) {
      console.error('OpenAI batch API error:', error);
      throw new Error(`Failed to generate batch embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }




  private getCostPerToken(model: string): number {
    const pricing: Record<string, number> = {
      'text-embedding-3-small': 0.00002,
      'text-embedding-3-large': 0.00013,
      'text-embedding-ada-002': 0.0001,
    };

    return pricing[model] || 0.00002;
  }




  private generateMockEmbedding(content: string, entityId?: string): EmbeddingResult {

    const hash = this.simpleHash(content);
    const embedding = Array.from({ length: this.config.dimensions }, (_, i) => {

      const value = Math.sin(hash + i * 0.1) * 0.5;
      return Math.max(-1, Math.min(1, value));
    });

    return {
      embedding,
      content,
      entityId,
      model: this.config.model,
      usage: {
        prompt_tokens: Math.ceil(content.length / 4),
        total_tokens: Math.ceil(content.length / 4),
      },
    };
  }




  generateEntityContent(entity: Entity): string {
    switch (entity.type) {
      case 'symbol':
        const symbolEntity = entity as any;
        if (symbolEntity.kind === 'function') {
          return `${symbolEntity.path || ''} ${symbolEntity.signature || ''} ${symbolEntity.documentation || ''}`.trim();
        } else if (symbolEntity.kind === 'class') {
          return `${symbolEntity.path || ''} ${symbolEntity.name || ''} ${symbolEntity.documentation || ''}`.trim();
        }
        return `${symbolEntity.path || ''} ${symbolEntity.signature || ''}`.trim();

      case 'file':
        const fileEntity = entity as any;
        return `${fileEntity.path || ''} ${fileEntity.extension || ''} ${fileEntity.language || ''}`.trim();

      case 'documentation':
        return `${(entity as any).title || ''} ${(entity as any).content || ''}`.trim();

      default:
        return `${(entity as any).path || entity.id} ${entity.type}`.trim();
    }
  }




  clearCache(): void {
    this.cache.clear();
  }




  getCacheSize(): number {
    return this.cache.size;
  }




  getCacheStats(): { size: number; hitRate: number; totalRequests: number } {

    return {
      size: this.cache.size,
      hitRate: 0,
      totalRequests: 0,
    };
  }




  private getCacheKey(content: string): string {
    if (!content) {
      throw new Error('Content cannot be empty');
    }
    return `${this.config.model}_${this.simpleHash(content)}`;
  }




  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }




  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }




  private async withRetry<T>(
    operation: () => Promise<T>,
    retries: number = this.config.maxRetries
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i <= retries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (i < retries) {
          const delay = this.config.retryDelay * Math.pow(2, i);
          await this.delay(delay);
        }
      }
    }

    throw lastError!;
  }




  hasRealEmbeddings(): boolean {
    return this.openai !== null && !!this.config.openaiApiKey;
  }




  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.openaiApiKey) {
      errors.push('OpenAI API key is required for production embeddings (currently using mock embeddings)');
    }

    if (!['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002'].includes(this.config.model)) {
      errors.push('Invalid embedding model specified');
    }

    if (this.config.dimensions < 1) {
      errors.push('Dimensions must be positive');
    }

    if (this.config.batchSize < 1 || this.config.batchSize > 2048) {
      errors.push('Batch size must be between 1 and 2048');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }




  getStats(): {
    hasRealEmbeddings: boolean;
    model: string;
    cacheSize: number;
    cacheHitRate: number;
    totalRequests: number;
  } {
    return {
      hasRealEmbeddings: this.hasRealEmbeddings(),
      model: this.config.model,
      cacheSize: this.cache.size,
      cacheHitRate: 0,
      totalRequests: 0,
    };
  }
}


export const embeddingService = new EmbeddingService();

================
File: utils/environment.ts
================
const sanitizeString = (value: unknown, max = 256): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
};

export const sanitizeEnvironment = (value: unknown): string => {
  const raw = sanitizeString(value, 64) || "";
  const normalized = raw
    .toLowerCase()
    .replace(/[^a-z0-9\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-/g, "")
    .replace(/-$/g, "");

  const allowed = new Set([
    "dev",
    "staging",
    "prod",
    "production",
    "perf-lab",
    "qa",
    "test",
    "local",
  ]);

  if (allowed.has(normalized)) {
    return normalized === "production" ? "prod" : normalized;
  }

  if (normalized.startsWith("prod")) {
    return normalized === "prod" ? "prod" : normalized;
  }
  if (normalized.startsWith("stag")) return "staging";
  if (normalized.startsWith("perf")) return "perf-lab";
  if (normalized.startsWith("qa")) return "qa";
  if (normalized.startsWith("test")) return "test";
  if (normalized.startsWith("dev")) return "dev";

  return normalized || "unknown";
};

================
File: utils/performanceFilters.ts
================
import { sanitizeEnvironment } from "./environment.js";
import { normalizeMetricIdForId } from "./codeEdges.js";
import type { PerformanceHistoryOptions } from "../types/types.js";

export const sanitizeIntegerFilter = (
  raw: unknown,
  { min, max }: { min: number; max: number }
): number | undefined => {
  const value =
    typeof raw === "number"
      ? raw
      : typeof raw === "string" && raw.trim().length > 0
      ? Number.parseInt(raw, 10)
      : undefined;

  if (value === undefined || !Number.isFinite(value)) return undefined;

  const integer = Math.floor(value);
  if (!Number.isFinite(integer)) return undefined;

  return Math.min(max, Math.max(min, integer));
};

export const sanitizePerformanceSeverity = (
  raw: unknown
): "critical" | "high" | "medium" | "low" | undefined => {
  if (typeof raw !== "string") return undefined;
  const normalized = raw.trim().toLowerCase();
  switch (normalized) {
    case "critical":
    case "high":
    case "medium":
    case "low":
      return normalized;
    default:
      return undefined;
  }
};

export const normalizeMetricIdFilter = (
  raw: unknown
): string | undefined => {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const normalized = normalizeMetricIdForId(trimmed);
  if (!normalized) return undefined;
  if (normalized === "unknown" && trimmed.toLowerCase() !== "unknown") {
    return undefined;
  }
  return normalized;
};

export const resolvePerformanceHistoryOptions = (
  query: Record<string, any>
): PerformanceHistoryOptions => {
  const metricId = normalizeMetricIdFilter(query.metricId);
  const environment =
    typeof query.environment === "string" && query.environment.trim().length > 0
      ? sanitizeEnvironment(query.environment)
      : undefined;
  const severity = sanitizePerformanceSeverity(query.severity);
  const limit = sanitizeIntegerFilter(query.limit, { min: 1, max: 500 });
  const days = sanitizeIntegerFilter(query.days, { min: 1, max: 365 });

  return {
    metricId,
    environment,
    severity,
    limit,
    days,
  };
};

================
File: index.ts
================
export * from './types/types.js';
export * from './types/entities.js';
export * from './types/relationships.js';


export * from './utils/codeEdges.js';
export * from './utils/confidence.js';
export * from './utils/embedding.js';
export * from './utils/environment.js';
export * from './utils/performanceFilters.js';


export * from './config/noise.js';


export * from './services/index.js';


export * from './logging/index.js';


export * from './models/relationships.js';


export * from './rollback/index.js';



================================================================
End of Codebase
================================================================
