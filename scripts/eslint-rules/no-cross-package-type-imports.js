/**
 * Disallow cross-package type-only imports from @memento/* except @memento/shared-types
 * and the current package alias. This enforces that shared cross-package types
 * live in packages/shared-types.
 */

import path from 'path';

function getPackageNameFromFilename(filename) {
  // returns the package directory name under packages/<name>/...
  const rel = path.relative(process.cwd(), filename);
  const match = rel.match(/^packages[\\/]([^\\/]+)[\\/]/);
  return match ? match[1] : null;
}

function isTypeOnlyImport(node) {
  // import type { A } from 'x'
  if (node.importKind === 'type') return true;
  // import { type A } from 'x'
  if (Array.isArray(node.specifiers)) {
    return node.specifiers.some((s) => s.importKind === 'type');
  }
  return false;
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid type-only imports/exports across @memento/* packages except @memento/shared-types to centralize shared types',
      recommended: false,
    },
    schema: [
      {
        type: 'object',
        properties: {
          allow: {
            type: 'array',
            items: { type: 'string' },
            default: ['@memento/shared-types'],
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      forbiddenTypeImport:
        'Type-only imports from {{source}} are not allowed in package {{pkg}}. Move shared types to @memento/shared-types, or import values instead.',
      forbiddenTypeExport:
        'Type-only re-exports from {{source}} are not allowed in package {{pkg}}. Re-export from @memento/shared-types instead.',
    },
  },
  create(context) {
    const options = context.options?.[0] || {};
    const allow = new Set(options.allow || ['@memento/shared-types']);

    const filename = context.getFilename();
    if (!filename || filename === '<input>') return {};

    const rel = path.relative(process.cwd(), filename);
    // Apply only under packages/, and skip shared-types entirely
    if (!/^packages[\\/]/.test(rel) || /^packages[\\/]shared-types[\\/]/.test(rel)) {
      return {};
    }

    const pkg = getPackageNameFromFilename(filename);
    const selfAlias = pkg ? `@memento/${pkg}` : null;

    function isForbiddenSource(sourceValue) {
      if (typeof sourceValue !== 'string') return false;
      if (!sourceValue.startsWith('@memento/')) return false;
      // allow explicit or subpath under allowed entries
      for (const a of allow) {
        if (sourceValue === a || sourceValue.startsWith(a + '/')) return false;
      }
      // allow self-alias (package-local) exact or subpath
      if (selfAlias && (sourceValue === selfAlias || sourceValue.startsWith(selfAlias + '/'))) return false;
      return true;
    }

    return {
      ImportDeclaration(node) {
        if (!node.source) return;
        if (!isTypeOnlyImport(node)) return;
        const src = node.source.value;
        if (isForbiddenSource(src)) {
          context.report({
            node,
            messageId: 'forbiddenTypeImport',
            data: { source: String(src), pkg: pkg || 'unknown' },
          });
        }
      },
      ExportNamedDeclaration(node) {
        // export type { A } from 'x'
        if (!node.source) return;
        // eslint provides exportKind on ExportNamedDeclaration in recent versions
        if (node.exportKind !== 'type') return;
        const src = node.source.value;
        if (isForbiddenSource(src)) {
          context.report({
            node,
            messageId: 'forbiddenTypeExport',
            data: { source: String(src), pkg: pkg || 'unknown' },
          });
        }
      },
      ExportAllDeclaration(node) {
        // export type * from 'x'
        if (!node.source) return;
        if (node.exportKind !== 'type') return;
        const src = node.source.value;
        if (isForbiddenSource(src)) {
          context.report({
            node,
            messageId: 'forbiddenTypeExport',
            data: { source: String(src), pkg: pkg || 'unknown' },
          });
        }
      },
    };
  },
};
