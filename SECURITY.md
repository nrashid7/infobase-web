# Security Policy

## Reporting a Vulnerability

Please report vulnerabilities privately to project maintainers. Include:

- A clear description of the issue
- Reproduction steps
- Potential impact
- Suggested mitigation (if known)

Do not open public issues for unpatched vulnerabilities.

## Secret Handling

- Never commit `.env` with real values.
- Keep credentials only in local secret storage or managed platform secrets.
- Use `.env.example` for non-sensitive templates.
- Rotate any secret immediately if exposure is suspected.

## Authentication and Access Controls

- Do not remove or weaken auth checks without explicit approval.
- Treat admin-only functionality (such as bulk scraping workflows) as sensitive.
- Document any auth-related behavior changes in `DOCUMENTATION.md`.

## Secure Change Requirements

For security-sensitive changes:

1. Run `npm run lint`, `npm run test`, and `npm run build`
2. Validate no secrets are exposed in logs or docs
3. Request human review before release

## Incident Response Basics

- Contain first: disable vulnerable paths when necessary
- Rotate exposed secrets
- Patch and redeploy
- Document timeline, impact, and corrective actions
