# Coding Standards

## Import Paths
- Prefer package aliases (`@memento/<package>` and `@memento/<package>/*`) for cross-package references.
- Keep relative imports within two directory levels (`./`, `../`, or `../../`). Create shared entry points when a deeper hop would be required.
- ESLint enforces a `no-restricted-imports` rule that blocks paths containing three or more `../` segments. Update exports or add aliases instead of suppressing the warning.
- Config files that need filesystem access should resolve from a computed base directory (for example, `path.resolve(__dirname, '..', '..')`) rather than embedding deep `../` sequences.
