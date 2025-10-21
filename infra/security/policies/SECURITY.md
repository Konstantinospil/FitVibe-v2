---
title: "FitVibe Security Policy"
version: "v2.2 (extensive)"
status: "Accepted"
owner: "Konstantinos Pilpilidis (Dr.)"
date: "2025-10-18"
license: "MIT"
contact: "kpilpilidis@gmail.com"
---

## 1. Purpose and Scope

This policy explains how the FitVibe platform protects member data, how we collaborate with the security community, and the minimum expectations for anyone building or testing the system. It complements the Product Requirements Document (`apps/docs/1. Product Requirements Document.md`) and Technical Design Document (`apps/docs/2. Technical Design Document.md`), which describe the underlying controls in detail.

---

## 2. Supported Versions

| Branch / Release | Supported | Notes                                                                      |
| ---------------- | --------- | -------------------------------------------------------------------------- |
| `main`           | Yes       | Production branch - receives security hotfixes.                            |
| `develop`        | Yes       | Active integration branch - fixed when issues affect production readiness. |
| Other branches   | No        | No guarantees; patch or rebase onto a supported branch.                    |

Fixes are backported to the latest production release only.

---

## 3. Report a Vulnerability

We prefer to work privately with researchers. If you believe you have found a vulnerability, email **kpilpilidis@gmail.com** with:

- A clear description of the issue and potential impact.
- Steps to reproduce or a minimal proof-of-concept.
- Affected endpoints, components, or commit SHA (if known).

Initial response: within 48 hours.  
Triage update: within 5 business days.  
Please avoid public GitHub issues or discussions.

### Safe Harbor

Good-faith security research is welcome. Following guidance from GitHub's security policy recommendations and the security.txt standard, we will not initiate legal action if you:

- Make every effort to avoid privacy violations, service disruption, or destruction of data.
- Do not access or modify data that does not belong to you.
- Give us a reasonable time to fix the issue before public disclosure.
- Comply with applicable laws.

### Security.txt

The `/.well-known/security.txt` file is managed through the NGINX configuration (see `infra/nginx/`). Ensure deployments serve this endpoint so researchers can verify the current contact details and encryption keys.

---

## 4. Coordinated Disclosure Lifecycle

1. Report received via email (see section 3).
2. Issue logged in the private security tracker (GitHub Security Advisories).
3. Severity scored using CVSS v3.1 and mapped to PRD risk classes.
4. Fix developed on a private branch, peer reviewed, and validated against automated tests (`pnpm lint`, `pnpm test`, `pnpm typecheck`).
5. Patch deployed to staging, then production after verification.
6. Reporter notified of resolution and public disclosure timeline.
7. Advisory published if user action is required (release notes plus SECURITY.md update).

We credit reporters in release notes when permitted.

---

## 5. Testing Guidelines for Researchers

- Use local or staging environments wherever possible.
- Do not run automated scanners against production without written approval.
- No denial-of-service, resource exhaustion, or brute-force testing.
- Never download, modify, or exfiltrate data that belongs to other users.
- Social engineering, phishing, or physical attacks are out of scope.
- Stop testing immediately if you encounter sensitive data and report your findings.

---

## 6. Security Controls Overview

| Area                   | Baseline Control                                                                                | Reference                    |
| ---------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------- |
| Authentication         | OAuth2-style JWT access tokens (RS256) with rotating refresh tokens.                            | TDD section 4 and section 10 |
| Transport              | TLS 1.3, HSTS, modern cipher suites, security headers.                                          | PRD section 6.6              |
| Data Protection        | Encrypted PostgreSQL and object storage, least-privilege IAM.                                   | PRD section 6.13             |
| Validation             | Zod DTO validation and centralized sanitisation middleware.                                     | TDD section 8                |
| Logging and Monitoring | Pino JSON logs, OpenTelemetry traces, Prometheus and Grafana dashboards.                        | TDD section 13               |
| Rate Limiting          | Adaptive limits at the API gateway (NGINX) and application middleware.                          | PRD section 6.13             |
| Secrets                | Managed via environment templates (`.env.example`), GitHub Actions secrets, and Docker secrets. | PRD section 6.12             |

---

## 7. Secure Development Requirements

All maintainers and contributors must:

- Enable multi-factor authentication on GitHub and any cloud accounts used for FitVibe.
- Keep local environments patched and free of known malware.
- Never commit secrets, access tokens, or personal data (use `.env` files listed in `.gitignore`).
- Run `pnpm install`, `pnpm lint`, `pnpm test`, and `pnpm typecheck` before opening a pull request.
- Follow the conventions documented in `apps/docs/project-structure.md` and `CONTRIBUTING.md`.
- Use signed commits whenever possible (`git config --global commit.gpgSign true`).
- Document security-relevant changes in the pull request description, including migration or infrastructure impacts.

---

## 8. Dependency and Supply-Chain Management

- Automated dependency and vulnerability checks run via `.github/workflows/security-scan.yml`.
- Review third-party packages for licence compatibility and maintenance status before adding them.
- Run `pnpm audit --prod` for production dependencies and address high severity findings promptly.
- Frontend and backend images are built via CI (`.github/workflows/cd-prod.yml`) and scanned before release.
- Verify downloads via checksums or signatures when adding binary dependencies to `infra/`.

---

## 9. Incident Response and Communication

| Phase                | Target Response | Notes                                                                                                                          |
| -------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Detection            | <= 1 hour       | Alert triggers via Prometheus or log anomaly detection.                                                                        |
| Containment          | <= 2 hours      | Isolate affected services, rotate credentials if necessary.                                                                    |
| Eradication          | <= 12 hours     | Apply patches, remove malicious artefacts, verify fix.                                                                         |
| Recovery             | <= 24 hours     | Restore services, re-enable traffic, run regression tests.                                                                     |
| Post-incident review | <= 72 hours     | Document root cause, update runbooks under `infra/security/policies/`, and capture lessons learned in an ADR when appropriate. |

Security incidents are tracked in a private register; a sanitized summary is shared with stakeholders as part of release notes or governance updates.

---

## 10. Contact and Encryption

- Email: kpilpilidis@gmail.com
- PGP: fingerprint and public key will be published under `infra/security/pgp/fitvibe.asc` (work in progress).
- Signal (optional): details available on request after initial email contact.

---

## 11. External References

- GitHub Docs - "Adding a security policy to your repository" (best practice for communication and disclosure timelines).
- securitytxt.org - guidance for maintaining a compliant `security.txt`.
- Open Source Guides - "Best Practices for Maintainers" (expectations for transparent processes and contributor safety).

---

Thank you for helping keep FitVibe members safe.
