/**
 * Source Control Management Routes
 * Handles Git operations, commits, pull requests, and version control
 */
export async function registerSCMRoutes(app, _kgService, _dbService) {
    const respondNotImplemented = (reply, feature) => {
        reply.status(501).send({
            success: false,
            error: {
                code: 'NOT_IMPLEMENTED',
                message: `${feature} is not available in this build.`,
            },
        });
    };
    const routes = [
        { method: 'post', url: '/scm/commit-pr', feature: 'Commit and PR automation' },
        { method: 'get', url: '/scm/status', feature: 'Repository status inspection' },
        { method: 'post', url: '/scm/commit', feature: 'Commit creation' },
        { method: 'post', url: '/scm/push', feature: 'Push to remote repositories' },
        { method: 'get', url: '/scm/branches', feature: 'Branch listing' },
        { method: 'post', url: '/scm/branch', feature: 'Branch creation' },
        { method: 'get', url: '/scm/changes', feature: 'Repository change listing' },
        { method: 'get', url: '/diff', feature: 'Diff inspection' },
        { method: 'get', url: '/log', feature: 'Commit history retrieval' },
    ];
    for (const route of routes) {
        app[route.method](route.url, async (_request, reply) => {
            respondNotImplemented(reply, route.feature);
        });
    }
}
//# sourceMappingURL=scm.js.map