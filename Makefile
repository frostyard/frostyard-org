# The make gate triad (frostyard/core ADR-0043, ADR-0044). CI and agents
# call these targets; the npm scripts stay for developers.
NODE_MAJOR := $(shell node -p "process.versions.node.split('.')[0]" 2>/dev/null)

.PHONY: verify check ci verify-template check-snapshots

## verify-template: the template gate (symlinks, docs index, risk paths, corrections, vendored copies) and its tests
verify-template:
	@if ! command -v node >/dev/null 2>&1; then echo "FAIL: make verify requires Node.js 22 or later (run: mise install)"; exit 1; fi
	@if [ "$(NODE_MAJOR)" = "" ] || [ "$(NODE_MAJOR)" -lt 22 ]; then echo "FAIL: make verify requires Node.js 22 or later (found: $$(node --version 2>/dev/null || echo missing)); run: mise install"; exit 1; fi
	node scripts/check-template.mjs
	node --test test/*.test.mjs

## verify: credential-free gate: template checks, workflow pins, agent governance, npm run ci, snapshots
verify: verify-template
	@if [ ! -d node_modules ]; then echo "FAIL: make verify requires the locked dependencies (run: npm ci)"; exit 1; fi
	node scripts/check-workflow-pins.mjs
	node scripts/check-agent-governance.mjs
	npm run ci
	$(MAKE) check-snapshots

## check-snapshots: compare both committed data snapshots with HEAD, including staged changes
check-snapshots:
	node scripts/check-snapshots.mjs

## check: the developer gate; the repository has no formatter, so it is verify
check: verify

## ci: verify, plus the append-only corrections check against BASE when BASE is set
ci: verify
	@if [ -n "$(BASE)" ]; then node scripts/check-corrections.mjs --base "$(BASE)"; fi
