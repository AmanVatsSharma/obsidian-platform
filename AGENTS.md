# Agent Instructions — Obsidian Platform

> This file is the cross-tool agent contract (Codex / Cursor / Copilot CLI / etc).
> **The source of truth is [`CLAUDE.md`](./CLAUDE.md) — read it first.** This
> file only carries agent-runtime essentials that don't fit cleanly into
> CLAUDE.md (shell-safety, beads workflow, push protocol).

## TL;DR

1. Read [`CLAUDE.md`](./CLAUDE.md) — architecture, hard rules, agent routing, design system, anti-patterns.
2. For Claude Code: specialist agents auto-discovered from `.claude/agents/` — see CLAUDE.md §1.
3. Use `bd` for ALL task tracking — never TodoWrite / markdown TODO lists.
4. Quality gates before any PR: `npm run quality:verify`.
5. Session is **NOT complete** until `git push` succeeds (see §"Session Completion" below).

## Specialist agents (Claude Code auto-routing)

| Agent | Use when |
|---|---|
| `backend-module-builder` | Scaffolding/extending a NestJS module under `apps/backend/src/modules/<name>/` |
| `nestjs-controller-reviewer` | After writing/modifying any `*.controller.ts` |
| `obsidian-ui-engineer` | Building or modifying UI in any frontend app |
| `db-migration-guard` | Before running an ALTER / NOT NULL / rename / drop / index migration |
| `contract-test-engineer` | Touching `execution-gateway/connectors/**` or `developer-platform/**` |
| `file-header-enforcer` | Backfilling missing/incomplete file headers |

Definitions live in `.claude/agents/<name>.md` — Claude Code loads them automatically.

## Non-interactive shell commands (mandatory)

Some systems alias `cp`/`mv`/`rm` to interactive (`-i`) mode, which hangs agents on a y/n prompt. **Always pass non-interactive flags** in agent shell commands:

```bash
cp -f src dst             # NOT: cp src dst
mv -f src dst             # NOT: mv src dst
rm -f file                # NOT: rm file
rm -rf dir                # NOT: rm -r dir
cp -rf src dst            # NOT: cp -r src dst

# Other commands that may prompt:
scp -o BatchMode=yes ...      # non-interactive ssh
ssh -o BatchMode=yes ...      # fail instead of prompting
apt-get install -y ...        # auto-confirm
HOMEBREW_NO_AUTO_UPDATE=1 brew ...
```

## File headers (every code file)

See CLAUDE.md §9 for the long form (preferred) and short form (grandfathered). Lint:

```bash
npm run check:headers          # all default scan roots
node tools/scripts/check-file-headers.mjs <path>   # specific file/dir
```

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
