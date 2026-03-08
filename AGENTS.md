# AI Agent Operating Guardrails

This file defines mandatory boundaries for AI agents working in this repository.

## Core Safety Rules

1. Never run destructive commands without explicit human approval.
   - Examples: `git reset --hard`, broad file deletion, destructive database operations.
2. Never commit or expose secrets.
   - Do not print, copy, or persist sensitive values from `.env`, Supabase secrets, or API keys.
3. Never delete or rewrite major documentation/configuration files unless explicitly requested.
4. Treat generated or auto-managed files as read-only unless a task explicitly requires updates.
5. Ask for confirmation before any action that can impact production behavior, data integrity, or access control.

## Required Workflow

1. Read existing relevant files before editing.
2. Prefer minimal, reversible changes.
3. Add or update tests for behavior changes when feasible.
4. Run validation commands (`lint`, `test`, `build`) after substantive updates.
5. Document known risks and unresolved issues in final handoff notes.

## Security Expectations

- Keep `.env` local-only and use `.env.example` for templates.
- Do not hardcode admin passwords or API keys in code/docs.
- Preserve authentication and authorization checks by default.
- Escalate unclear security decisions to a human reviewer.
