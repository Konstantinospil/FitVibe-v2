---
title: "FitVibe Security Policy"
version: "v2.2 (extensive)"
status: "Accepted"
owner: "Konstantinos Pilpilidis (Dr.)"
date: "2025-10-18"
license: "MIT"
contact: "kpilpilidis@gmail.com"
---

# 1. Purpose & Scope

This policy explains how FitVibe protects user data, how to report vulnerabilities, how we triage and remediate issues, and what security researchers may test. It complements the PRD/TDD and aligns with **GDPR**, and is designed to support **ISO/IEC 27001** and **BSI TR-03174** control intent.

**Environments covered:** production, staging, and developer environments.

---

# 2. Supported Versions

| Version             | Supported | Notes                        |
| ------------------- | --------- | ---------------------------- |
| `main` (production) | ✅        | Security patches only        |
| `develop`           | ✅        | Under continuous integration |
| All others          | ❌        | No guaranteed updates        |

> Fixes are backported to the latest production release only.

---

# 3. Reporting a Vulnerability (Coordinated Disclosure)

Please contact us **privately**:

- **Email:** kpilpilidis@gmail.com (PGP fingerprint published in repo root when available)
- **Initial response:** within **48 hours**
- **Triage update:** within **5 business days**

**Include:** description, impacted component/endpoint (or commit), minimal PoC, impact, steps to reproduce.  
**Do not open** public GitHub issues for security findings.

## 3.1 Legal Safe Harbor

We welcome good-faith research and will not initiate or support legal action if you:

- Respect privacy (do not access/modify/exfiltrate others’ data).
- Avoid disruption (no DoS/resource-exhaustion/spam).
- Do not run automated scanners against **production** without written approval.
- Follow applicable laws in your and our jurisdictions.
- Provide reasonable time for remediation prior to any public disclosure.

**Bounties:** Not offered during MVP. We credit responsible reporters in release notes.

---

# 4. Scope for Testing

## 4.1 In Scope

- Web SPA and API under `/api/v1` (auth lifecycle: register/verify/login/refresh/logout/reset), RBAC, sharing/link-token endpoints.
- Client-side protections (CSP/CSRF) and upload pipeline (AV scan, type/size allow-list).
- Privacy/visibility boundaries for shared content.

## 4.2 Out of Scope (Prohibited)

- DoS or traffic floods; brute-force beyond documented limits.
- Social engineering or physical attacks.
- Access to third-party accounts (cloud, CI, email provider).
- Automated production scanning without written approval.
- Any access to other users’ data.

## 4.3 Test Environments

Prefer **staging/local**. For higher-volume tests, coordinate a staging window. Any production testing must be **read-only, low-impact, pre-approved**.

---

# 5. Coordinated Disclosure Workflow

1. Report received via email.
2. Private security tracker entry (GitHub Security Advisory).
3. Assign **CVSS v3.1** severity.
4. Develop fix on private branch → peer review → CI gates (lint/tests/typecheck/perf/a11y/security).
5. Deploy to staging → verify → production.
6. Notify reporter with resolution and timeline.
7. Publish advisory/release notes if user action is required.

---

# 6. CVSS Severity → Triage & Fix SLAs

| CVSS v3.1             | Example                        | Target Triage | Target Fix (Prod) |
| --------------------- | ------------------------------ | ------------- | ----------------- |
| **Critical 9.0–10.0** | RCE, auth bypass, mass exfil   | ≤ 24 h        | ≤ 72 h            |
| **High 7.0–8.9**      | Priv-esc, IDOR, SSRF           | ≤ 48 h        | ≤ 7 days          |
| **Medium 4.0–6.9**    | Stored XSS (scoped), CSRF edge | ≤ 5 biz days  | ≤ 30 days         |
| **Low 0.1–3.9**       | Non-exploitable header gaps    | Best effort   | Next release      |

Exceptions require an ADR plus compensating controls (e.g., feature flag/WAF).

---

# 7. Technical Controls

| Area               | Control                                                                                                                          | Notes                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **Authentication** | RS256 JWT access (≤15 min) + server-stored rotating refresh (`jti`) with reuse detection; optional TOTP 2FA                      | Short-lived access, rotating refresh        |
| **Transport**      | HTTPS/TLS 1.3 only, HSTS                                                                                                         | Modern ciphers only                         |
| **Headers**        | **CSP**, Referrer-Policy, Permissions-Policy, X-Frame-Options, X-Content-Type-Options                                            | Strict defaults                             |
| **CSRF**           | SameSite cookies + CSRF token (if cookies used)                                                                                  | Defense-in-depth                            |
| **Validation**     | Zod DTO validation & environment schema                                                                                          | Deny by default                             |
| **Rate Limiting**  | **100 req/min/IP** baseline (adjustable); stricter on auth; `Retry-After`                                                        | Tune per route                              |
| **Uploads**        | **AV scan**, MIME/size allow-list, EXIF strip, private ACL                                                                       | Quarantine on fail                          |
| **Idempotency**    | Idempotency keys for sensitive POST/PATCH, replay-safe                                                                           | Required for planner/logger writes          |
| **Observability**  | Pino structured logs + correlation IDs; Prometheus metrics; no PII in logs                                                       | Histograms for latency                      |
| **Privacy/GDPR**   | Privacy-by-default; DSR export/delete; data minimization                                                                         | See §9                                      |
| **Crypto at Rest** | Storage-provider/server-side encryption (e.g., S3 SSE) and/or disk-level encryption; field-level encryption for selected secrets | Avoid “Postgres TDE” wording unless enabled |
| **Supply Chain**   | **SCA (npm-audit/Snyk)**, **SBOM (CycloneDX or SPDX)**, **signed images**, **pinned digests**, CI security gates                 | Block on critical/high                      |

---

# 8. Contributor Security Requirements

All contributors must:

- Use **2FA** on GitHub and container registry accounts.
- **Sign commits** (`git config --global commit.gpgSign true`).
- Never commit `.env` or credentials.
- Use **security-scanned dependencies** (`pnpm audit`, `snyk test`).
- Run `pnpm test:security` locally before PR submission.
- Confirm PR checklist includes “No secrets committed”.

---

# 9. Data Protection & GDPR

FitVibe follows **privacy-by-design** and **privacy-by-default**.

| Obligation                        | Implementation                                       |
| --------------------------------- | ---------------------------------------------------- |
| **User consent**                  | Explicit opt-in for analytics/community feed         |
| **Data minimization**             | Store only required fields                           |
| **Right to access/export/delete** | `/users/export`, `/users/delete` endpoints           |
| **Retention**                     | Auto-purge after **24 months** inactivity            |
| **Backups purge**                 | Backups purge **≤ 14 days** after hard-delete        |
| **Logging policy**                | Pseudonymized UUIDs; **7-day** log retention; no PII |
| **Encryption**                    | TLS 1.3 in transit; encryption at rest as per §7     |

---

# 10. Key Management & Rotation Policy

## 10.1 Scope

- **JWT signing keys** (RSA-4096 or ECDSA P-256)
- **TLS certificates**
- **Database/object-store creds & encryption keys**
- **Infrastructure secrets** (Docker/GitHub Actions/Prometheus/Grafana)

## 10.2 Generation

- Generated via OpenSSL/Node `crypto`; unique per env (`dev`, `staging`, `prod`).
- Private keys never stored in VCS; stored via secrets manager/Docker secrets or hardware-backed vault.

```bash
openssl genrsa -out jwt_private.pem 4096
openssl rsa -in jwt_private.pem -pubout -out jwt_public.pem
```

## 10.3 Rotation Frequency

| Type                          | Interval                | Method                           |
| ----------------------------- | ----------------------- | -------------------------------- |
| **JWT signing key**           | **14 days**             | Automated; JWKS updated          |
| **TLS certificate**           | **90 days**             | Let’s Encrypt auto-renew         |
| **DB encryption key / creds** | **6 months / 3 months** | Re-encrypt inactive data; rotate |
| **Infrastructure secrets**    | **3 months**            | Manual rotation + validation     |

Prometheus alerts for JWT key age > **14 days** or rotation failure.

## 10.4 Rotation Process

1. Generate new key pair.
2. Publish updated **JWKS** at `/.well-known/jwks.json`.
3. Mark previous key **deprecated** (24 h overlap).
4. Revoke & archive old key (`archive/YYYY-MM-DD/`).
5. Verify new key usage; invalidate stale caches.
6. Log `audit.security.rotation`.

## 10.5 Storage & Access

- Two authorized maintainers; **four-eyes** rule for prod key ops.
- All access logged (**auditd** or equivalent).
- Keys at rest use **AES-256-GCM** (vault/secrets store).

## 10.6 Compromise Handling

1. Revoke key in JWKS (`revoked=true`).
2. Invalidate sessions signed by the key.
3. Generate/deploy new pair.
4. Notify affected users within **72 h** (GDPR Art. 33).
5. Record incident (see §11).

## 10.7 Audit & Verification

- Quarterly rotation review: `infra/security/audit/rotation_log.md`.
- Annual penetration test includes key lifecycle review.
- Records kept **24 months**.

---

# 11. Incident Response (IR)

| Phase           | Target | Action                                                   |
| --------------- | ------ | -------------------------------------------------------- |
| **Detection**   | ≤ 1 h  | Alerts via monitoring                                    |
| **Containment** | ≤ 2 h  | Isolate services; rotate secrets; reduce surface (flags) |
| **Eradication** | ≤ 12 h | Patch, remove artifacts, verify fix in staging           |
| **Recovery**    | ≤ 24 h | Restore; run regression/perf/a11y/security gates         |
| **Post-mortem** | ≤ 72 h | Root cause; ADR updates; action items tracked            |

All incidents are logged at `infra/security/incidents/YYYY-MM-DD.md`.  
If personal data is involved, prioritize DSR requests and apply the retention matrix (§9).

---

# 12. security.txt & PGP

- Serve `/.well-known/security.txt` with current contact.
- Publish PGP public key at `infra/security/pgp/fitvibe.asc` (fingerprint in README/security.txt).

---

# 13. Continuous Security Monitoring

- Nightly **npm-audit / Snyk** scans; weekly **Renovate** updates.
- Automated **OWASP ZAP** baseline + **k6** perf/security checks.
- **Prometheus alerts**:
  - 5xx rate > **1%**
  - Latency **p95 > 600 ms**
  - JWT signing key age **> 14 days**
  - Failed-login spike > **3σ** baseline

---

# 14. Standards Mapping (Guidance)

> These mappings are informative (aid audits) and show where FitVibe controls address common standards. They don’t substitute for certification audits.

## 14.1 ISO/IEC 27001:2022 Annex A (Selected)

| Annex A Control                                       | FitVibe Control/Section               |
| ----------------------------------------------------- | ------------------------------------- |
| A.5.1 Policies for Information Security               | This document (v2.2)                  |
| A.5.17 Authentication Information                     | §7 Authentication; §10 Key Mgmt       |
| A.5.18 Access Control                                 | RBAC (PRD/TDD), §7                    |
| A.5.23 Information Security for Use of Cloud Services | §7 Supply Chain; §13 Monitoring       |
| A.5.32 Logging                                        | §7 Observability; §13 Monitoring      |
| A.5.34 Protection of PII                              | §9 Data Protection & GDPR             |
| A.8.16 Monitoring Activities                          | §13 Monitoring; Prometheus alerts     |
| A.8.28 Secure Coding                                  | Contributor reqs (§8), CI gates (§5)  |
| A.8.32 Change Management                              | CI/CD gates (PRD/TDD), ADR process    |
| A.8.33 Test Data                                      | §4 Scope (no real-user data in tests) |

## 14.2 BSI TR‑03174 (Selected Intent Mapping)

| TR‑03174 Topic     | FitVibe Control/Section                 |
| ------------------ | --------------------------------------- |
| Identity & AuthN   | §7 Authentication; §10 Key Mgmt         |
| Session Management | Short-lived JWT + rotating refresh (§7) |
| Transport Security | TLS 1.3 + HSTS (§7)                     |
| Content Security   | CSP + XFO + XCTO (§7)                   |
| Input Validation   | Zod validation (§7)                     |
| Data Minimization  | §9 GDPR                                 |
| Logging/Monitoring | §7 Observability; §13 Monitoring        |
| Security Testing   | §4 Scope; §16 Testing Calendar          |

---

# 15. Data Classification & Handling

| Class                    | Description                      | Examples                      | Storage & Access                      | Transmission          | Retention/Deletion                    |
| ------------------------ | -------------------------------- | ----------------------------- | ------------------------------------- | --------------------- | ------------------------------------- |
| **Public**               | Safe for public                  | Marketing copy                | Public repos/CDN                      | TLS                   | As needed                             |
| **Internal**             | Non-public operational info      | CI configs, runbooks          | Private repos; RBAC                   | TLS                   | 24 months                             |
| **Restricted**           | Could harm org if leaked         | Rate-limit configs, infra IPs | Need-to-know; encrypted at rest       | TLS + mTLS (internal) | 24 months                             |
| **Sensitive (Personal)** | Personal data; strong protection | User email, workout logs      | Encrypted at rest; RBAC; access audit | TLS                   | Delete on request; backups purge ≤14d |

**Handling rules:** No PII in logs/labels; redact in traces; use pseudonymous IDs in analytics.

---

# 16. Threat Model Snapshot (STRIDE)

| Threat                     | Example in FitVibe           | Mitigations                                                                       |
| -------------------------- | ---------------------------- | --------------------------------------------------------------------------------- |
| **S**poofing               | Token theft / session hijack | RS256 JWT, short access TTL, rotating refresh with reuse detection, TLS/HSTS, 2FA |
| **T**ampering              | Altering workout logs        | Idempotency keys, RBAC, server-side validation, audit logs                        |
| **R**epudiation            | Denying actions              | Correlation IDs, signed audit events, clock sync                                  |
| **I**nfo Disclosure        | IDOR to view others’ data    | Strong authz checks, test coverage, privacy-by-default                            |
| **D**oS                    | Flooding APIs                | Per-IP/account rate limits, WAF/CDN, resource quotas                              |
| **E**levation of Privilege | Regular user → admin         | Role checks at endpoints, least privilege, admin MFA                              |

---

# 17. Third‑Party & Vendor Risk Management

- **Intake checklist:** data processed, region, sub-processors, breach history, DPAs, SOC2/ISO evidence, RBAC model.
- **Ownership:** each vendor has a business owner + security reviewer.
- **Review cadence:** annual security review; contract renewal gates include vulnerability posture and DPA updates.
- **Termination:** data return/erasure within 30 days; revoke keys and access, track via checklist.
- **Monitoring:** subscribe to vendor advisories; add rules to alert on CVEs affecting SDKs/agents.

---

# 18. Vulnerability Exceptions Process

- **When allowed:** fix introduces higher risk, dependency has no patch, near-term migration planned.
- **Required artifacts:** exception ticket (ID, CVSS, affected assets), compensating controls, expiry date (≤90 days), owner approval.
- **Compensating controls examples:** WAF rule, feature flag, narrowed RBAC, forced re-auth, increased monitoring.
- **Expiry/renewal:** auto-expire at 90 days; extensions require new risk assessment and approval.
- **Register:** `security/exceptions/EX-YYYY-####.md` (template stored in repo).

---

# 19. Audit, Logs & Records Retention Matrix

| Artifact            | Purpose                        | Retention     | Storage                     |
| ------------------- | ------------------------------ | ------------- | --------------------------- |
| App logs (no PII)   | Forensics & reliability        | **7 days**    | Central log store           |
| Security audit logs | Access/changes to secrets/keys | **24 months** | Encrypted, restricted       |
| CI/CD run artifacts | Traceability                   | **90 days**   | CI artifacts store          |
| SBOMs (per release) | Supply-chain evidence          | **24 months** | `artifacts/sbom/`           |
| Pen test reports    | Assurance                      | **24 months** | Encrypted vault             |
| Incident records    | Legal/learning                 | **24 months** | `infra/security/incidents/` |

---

# 20. SBOM & Supply‑Chain Details

- **Formats:** **CycloneDX** and/or **SPDX**.
- **Generation (example):**
  ```bash
  pnpm dlx @cyclonedx/cyclonedx-npm --output-format json --output-file artifacts/sbom/cyclonedx.json
  pnpm dlx spdx-sbom-generator -o artifacts/sbom/spdx/
  ```
- **CI/CD artifacts:** store under `artifacts/sbom/` with release tag.
- **Verification:** fail build on critical/high vulns; signed containers; deploy only **pinned digests**.
- **Image signing:** cosign (Sigstore).
- **Review:** quarterly SBOM diff review to detect unexpected deps.

---

# 21. Security Testing Calendar (Cadence)

| Activity                   | Cadence     | Owner                | Notes                             |
| -------------------------- | ----------- | -------------------- | --------------------------------- |
| OWASP ZAP baseline scan    | Weekly      | AppSec               | Against staging; low-risk ruleset |
| k6 perf/security checks    | Weekly      | QA                   | Thresholds aligned to SLOs        |
| Secrets scan (git history) | Weekly      | Dev Lead             | trufflehog/gitleaks               |
| Dependency SCA (npm/Snyk)  | Nightly     | CI                   | Blocks on high/critical           |
| DR/Restore drill           | Quarterly   | Ops                  | Include backup purge verification |
| Key rotation audit         | Quarterly   | Security             | Compare against §10.3             |
| Tabletop incident exercise | Semi-annual | Security             | Include GDPR comms flow           |
| External penetration test  | Annual      | Security/Third party | Scope: SPA/API and auth           |

---

# 22. Change Log

- **v2.2 (2025-10-18):** Added standards mapping (ISO 27001, TR‑03174), data classification & handling matrix, STRIDE threat model, vendor risk process, vulnerability exceptions workflow, audit/log retention matrix, detailed SBOM generation/paths, and a formal security testing calendar. Consolidated with v2.1 content.
- **v2.1 (2025-10-18):** Consolidated disclosure sections; normalized numbering; restored 48h initial response; added backups purge ≤14d; added `security.txt`; clarified SBOM format; grammar/formatting fixes.
- **v2.0 (2025-10-17):** Safe Harbor, scope matrices, CVSS SLAs, supply-chain controls, key-management details.

_© 2025 FitVibe Development – All Rights Reserved._
