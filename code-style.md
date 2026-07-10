# Code Style Rules — Kasper Fleet

Loaded automatically for every coding task. Follow these without exception.

## JavaScript

- **Vanilla JS only** — no frameworks, no bundlers, no imports in Phase 1
- **ES2020+ syntax** — const/let, arrow functions, template literals, optional chaining
- **No var** — ever
- **Class methods**: underscore prefix for private (`_tickFuel`, `_sync`)
- **No TypeScript** in Phase 1 — plain .js files
- **Naming**: camelCase for variables/functions, PascalCase for classes, SCREAMING_SNAKE for constants
- **No semicolons** are optional — be consistent with existing code (existing code uses semicolons)
- **Max line length**: 100 characters — break long template literals across lines

## Comments

- One-line comment per function describing what it does, not how
- Block comments only at section boundaries (e.g. `// ── FUEL MODEL ──`)
- No commented-out code in final output

## DOM manipulation

- Use `document.getElementById()` — no querySelector chains for IDs
- Build HTML strings in template literals — no createElement loops for complex markup
- innerHTML is fine for dashboard panels — no XSS risk (all data is simulated)

## Error handling

- No try/catch in simulator code — fail loudly so bugs are visible
- Guard for null: `a.coolant ?? '—'` pattern, not `a.coolant ? a.coolant : '—'`
- No console.log in production code — use `// DEBUG:` comment prefix if temporarily needed

## SVG

- All SVGs inline — no external files
- Use `viewBox` always — no fixed width/height attributes on SVG root
- Use CSS variables for colours: `var(--green)`, `var(--red)`, `var(--accent)`
- Numbers: `.toFixed(1)` for coordinates in SVG paths

## HTML

- Single-file architecture — everything in `kasper_fleet_final.html`
- Styles: CSS custom properties (`--var`) for all colours and shared values
- No external CSS files
- No frameworks — plain HTML + inline SVG

## Surgical change rule

When editing existing code:
- Touch ONLY the lines that the task requires
- Do NOT reformat adjacent code
- Do NOT rename existing variables/functions
- Do NOT add whitespace-only changes
- Match the indentation style of the surrounding code (2-space indent)
- State explicitly what lines you changed and why
