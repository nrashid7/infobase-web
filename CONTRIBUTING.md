# Contributing to INFOBASE

## Development Setup

1. Install dependencies: `npm install`
2. Create local env file: `cp .env.example .env`
3. Start dev server: `npm run dev`

## Required Checks Before PR

Run all checks and ensure they pass:

```bash
npm run lint
npm run test
npm run build
```

If an existing baseline issue is outside your scope, call it out clearly in the PR description.

## Change Expectations

- Keep changes focused and avoid unrelated refactors.
- Add or update tests for any behavior change.
- Update docs (`README.md`, `DOCUMENTATION.md`, or related files) when workflows/configs change.
- Avoid hardcoding secrets or sensitive operational details.

## Pull Request Checklist

- [ ] Scope is limited to the intended task
- [ ] Lint/test/build have been run locally
- [ ] New behavior is covered by tests or documented manual verification
- [ ] Documentation has been updated
- [ ] Security-impacting changes were reviewed carefully

## AI-Assisted Changes

When using AI agents:

- Keep `AGENTS.md` and `.cursor/rules/guardrails.mdc` in force.
- Require explicit human approval for destructive/risky operations.
- Review generated changes before merge.
