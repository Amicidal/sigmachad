/**
 * ESLint rule to enforce maximum directory depth of 3 levels from project root
 */

const path = require('path');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce maximum directory depth of 3 levels from project root',
      category: 'Best Practices',
      recommended: true
    },
    fixable: null,
    schema: [{
      type: 'object',
      properties: {
        targetDepth: {
          type: 'integer',
          minimum: 1,
          default: 3
        },
        warnDepth: {
          type: 'integer',
          minimum: 1,
          default: 4
        },
        maxDepth: {
          type: 'integer',
          minimum: 1,
          default: 5
        },
        ignorePaths: {
          type: 'array',
          items: { type: 'string' },
          default: ['node_modules', 'dist', 'coverage', '.git']
        },
        complexDomains: {
          type: 'array',
          items: { type: 'string' },
          default: ['services/knowledge', 'services/testing', 'api/trpc']
        }
      },
      additionalProperties: false
    }],
    messages: {
      tooDeep: 'File exceeds maximum directory depth of {{maxDepth}} (current depth: {{currentDepth}}). Consider restructuring to reduce nesting.',
      exceedsTarget: 'File exceeds target directory depth of {{targetDepth}} (current depth: {{currentDepth}}). Consider restructuring for better organization.',
      exceedsWarn: 'File exceeds warning directory depth of {{warnDepth}} (current depth: {{currentDepth}}). This is only acceptable for complex domains.'
    }
  },

  create(context) {
    const options = context.options[0] || {};
    const targetDepth = options.targetDepth || 3;
    const warnDepth = options.warnDepth || 4;
    const maxDepth = options.maxDepth || 5;
    const ignorePaths = options.ignorePaths || ['node_modules', 'dist', 'coverage', '.git'];
    const complexDomains = options.complexDomains || ['services/knowledge', 'services/testing', 'api/trpc'];

    return {
      Program(node) {
        const filename = context.getFilename();

        // Skip if filename is not provided or is <input>
        if (!filename || filename === '<input>') {
          return;
        }

        // Get relative path from CWD
        const cwd = process.cwd();
        const relativePath = path.relative(cwd, filename);

        // Check if path should be ignored
        const shouldIgnore = ignorePaths.some(ignorePath =>
          relativePath.includes(ignorePath)
        );

        if (shouldIgnore) {
          return;
        }

        // Calculate depth (number of directory separators)
        const pathSegments = relativePath.split(path.sep);
        const currentDepth = pathSegments.length - 1; // Subtract 1 for the filename

        // Check if this is in a complex domain
        const isComplexDomain = complexDomains.some(domain =>
          relativePath.startsWith(domain)
        );

        // Check if this is in the packages directory (monorepo structure)
        const isInPackages = relativePath.startsWith('packages' + path.sep);

        // Adjust depth limits for packages directory
        const effectiveTargetDepth = isInPackages ? targetDepth + 1 : targetDepth;
        const effectiveWarnDepth = isInPackages ? warnDepth + 1 : warnDepth;
        const effectiveMaxDepth = isInPackages ? maxDepth + 1 : maxDepth;

        if (currentDepth > effectiveMaxDepth) {
          // Always error if exceeding absolute maximum
          context.report({
            node,
            messageId: 'tooDeep',
            data: {
              maxDepth: effectiveMaxDepth,
              currentDepth
            }
          });
        } else if (currentDepth > effectiveWarnDepth && !isComplexDomain) {
          // Error for non-complex domains exceeding warning threshold
          context.report({
            node,
            messageId: 'exceedsWarn',
            data: {
              warnDepth: effectiveWarnDepth,
              currentDepth
            }
          });
        } else if (currentDepth > effectiveTargetDepth && !isComplexDomain) {
          // Warn for files exceeding target in non-complex domains
          context.report({
            node,
            messageId: 'exceedsTarget',
            data: {
              targetDepth: effectiveTargetDepth,
              currentDepth
            }
          });
        }
      }
    };
  }
};