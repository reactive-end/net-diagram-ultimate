# Agents Guide — Net Diagram Ultimate

This document describes the code agents available for working on this repository. Use these agents to delegate tasks during development — never attempt exploration, diagnosis, or multi-file changes manually.

## Orchestrator

**Atlas** is the principal orchestrator. It delegates all work to specialized subagents. Atlas never writes code directly for non-trivial changes; it coordinates, plans, and routes tasks.

## Agent Catalog

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| **Pathfinder** | File and symbol search, codebase exploration | Any codebase search, pattern hunt, finding where a function/selector is used |
| **Archivist** | External documentation, API references | Looking up PHP/JS/MySQL docs, third-party library references |
| **Elder** | Architecture decisions, complex debugging | Major architectural changes, persistent bugs (2+ failed attempts), high-risk refactors |
| **Artisan** | UI/UX, visual design, CSS | Any user-facing visual changes, styling, layout adjustments |
| **Mender** | Implementation, tests, code edits | Code changes >20 lines, multi-file modifications, test writing |
| **Inspector** | Error diagnosis, stack traces | Any error/exception, broken tests, compilation failures, runtime bugs |
| **Scribe** | Documentation | JSDoc, README, PR descriptions, changelogs, code comments |
| **Curator** | Refactoring (no behavior change) | Extract duplicates, rename symbols, SRP splits, dead code removal |
| **Alchemist** | Performance profiling | Profiler output, "why is this slow", bundle size analysis |
| **Magistrate** | Code/PR review | Reviewing diffs, spotting bugs, assessing change impact |
| **Envoy** | API design | REST/GraphQL/gRPC contracts, OpenAPI specs, route design |
| **Quartermaster** | Dependency management | Package upgrades, conflict resolution, breaking change assessment |
| **Tactician** | Test strategy | Coverage gaps, test plans, unit/integration/e2e strategy |
| **Tribunal** | Critical multi-LLM decisions | Security-sensitive changes, irreversible architectural choices |
| **Squire** | Quick verification | Simple checks, fast confirmations, syntax validation |
| **Sentinel** | Security audit | OWASP analysis, vulnerability assessment, input sanitization review |
| **Lorekeeper** | Schema/DB design | Migrations, query optimization, schema changes |
| **Herald** | CI/CD, infrastructure | Dockerfiles, pipelines, deployment configuration |

## How to Work in This Repository

### Task Delegation Pattern

1. **Trivial tasks** (typos, single-line edits, renames) — fix immediately, no delegation needed
2. **Moderate tasks** (single-file, targeted fix) — brief plan, then delegate to the appropriate agent
3. **Complex tasks** (multi-file, architecture, ambiguous) — ask clarifying questions, flag risks, propose a plan, wait for approval, then delegate

### Key Conventions

- **PHP**: native, no framework. Classes under `src/` with simple autoloading. Controllers handle routes, Models handle DB queries.
- **JavaScript**: vanilla ES6+, no bundler. Each module is an IIFE (`const ModuleName = (() => { ... })();`) exposing a public API via the returned object. Modules depend on each other through global scope — order matters in script tags.
- **CSS**: single `main.css` file. No preprocessor. Uses CSS custom properties for theming (`--navy-800`, `--gray-300`, `--radius`, etc.).
- **Database**: MySQL via `mysqli`. Schema in `netdiagram_v2.sql`. Uses native columns, not serialized CSS blobs.
- **Session-based auth**: all API calls are authenticated via PHP sessions.
- **DOM-based diagram**: the canvas is a positioned `<div>`, not an HTML5 Canvas. Lines are thin rotated `<div>` elements.

### Module Loading Order

JavaScript modules must load in this order (defined in `views/diagram-editor.php`):

```
1. api.js          — fetch wrapper (depends on window.BASE_PATH)
2. state.js        — diagram state
3. dom-helpers.js  — utilities + IP inputs
4. devices.js      — device DOM creation
5. forms.js        — dynamic forms
6. drag.js         — drag & drop
7. links.js        — connection lines
8. boxes.js        — bounding boxes
9. ping.js         — single ping
10. ping-serie.js  — serial ping
11. ping-trace.js  — path trace
12. export.js      — PNG export
13. context-menu.js
14. modals.js
15. keyboard.js
16. editor.js      — main wiring (must load last)
```

### Common Debugging Patterns

- **Check script load order**: if `DOMHelpers` is undefined, `dom-helpers.js` loaded after a dependent module
- **Check `BASE_PATH`**: if API calls 404, verify `window.BASE_PATH` is set before `api.js` loads
- **IP input not initializing**: the hidden input must be inside or an immediate sibling of `.ip-input-container`
- **Lines not deleting in pairs**: verify `data-brother` attribute exists; legacy data may have `brotherLine = 0`
- **Modal click-through**: modals use `pointer-events: none` on `.selecting` state for canvas interaction

### File Reference

| Purpose | File |
|---------|------|
| Front controller | `public/index.php` |
| Router | `src/Router.php` |
| Database | `src/Database.php` |
| Configuration | `src/config.php` + `.env` |
| All CSS | `public/assets/css/main.css` |
| v2 Schema | `netdiagram_v2.sql` |
| Migration | `migrate_v2.sql` |
| Editor view | `views/diagram-editor.php` |
| Main menu | `views/main-menu.php` |
| Login | `views/login.php` |
| Layouts | `views/layouts/base.php`, `auth.php` |
