# 🔒 FitVibe – Security Policy

> **Version:** 1.0  
> **Last Updated:** 2025-10-06  
> **Maintainer:** Konstantinos Pilpilidis (FitVibe Development Lead)  
> **Contact:** kpilpilidis@gmail.com

---

## 🧭 1. Purpose

This document describes how the **FitVibe Training Planner & Logger Web App** protects user data, ensures compliance (GDPR, ISO 27001, TR-03174), and manages vulnerability reporting and disclosure.

---

## 🧱 2. Supported Versions

| Version | Supported | Notes |
|----------|------------|-------|
| `main` (production) | ✅ | Security patches only |
| `develop` | ✅ | Under continuous integration |
| All others | ❌ | No guaranteed updates |

> Fixes are backported to the latest production release only.

---

## 🧩 3. Reporting a Vulnerability

We take all reports seriously.  
If you believe you’ve discovered a vulnerability or data exposure, **please contact us privately**:

- 📧 Email: **kpilpilidis@gmail.com** (PGP key fingerprint will be published in repository root)
- ⏱️ Expected response: within **48 hours**
- 🧾 Triage report: within **5 working days**

Please include:
- Description of the issue  
- Affected endpoint or component  
- Reproduction steps  
- Potential impact  
- Proof-of-concept exploit (if safe)

Do **not** open public GitHub issues for security vulnerabilities.

---

## 🧪 4. Security Testing Guidelines

Security testing must follow **responsible disclosure** principles:
- Never attempt denial-of-service or brute-force attacks on production systems.  
- Use **staging environments** provided in your contributor onboarding.  
- Never access data belonging to other users.  
- Do not disclose vulnerabilities publicly until coordinated release is agreed.

---

## 🧰 5. Technical Controls

| Area | Control | Reference |
|-------|----------|-----------|
| **Authentication** | JWT RS256 + Refresh rotation (15 min / 14 days) | TDD § 10.2 |
| **Transport** | HTTPS / TLS 1.3 only + HSTS + CSP | PRD § 6.6 |
| **Data Protection** | AES-256 at rest (PostgreSQL TDE / S3 SSE) | PRD § 6.13 |
| **Input Validation** | Zod schema validation on all requests | TDD § 8 |
| **Logging** | Pino structured logs w/ correlation IDs; no PII | TDD § 13.1 |
| **Access Control** | RBAC + hierarchical permission model | PRD § 5.3 |
| **Rate Limiting** | 100 req / min per IP (adjustable) | PRD § 6.13 |
| **Audit & Monitoring** | Prometheus + Grafana + Loki; anomaly alerts | TDD § 13.3 |
| **Secrets Management** | `.env` + Docker secrets + GitHub Actions secrets | PRD § 6.12 |

---

## 🧾 6. Responsible Disclosure Process

1. Reporter contacts `kpilpilidis@gmail.com`  
2. Security triage confirms receipt and reproduces issue  
3. Severity rating assigned using **CVSS v3.1**  
4. Fix developed and peer-reviewed in private branch  
5. Patch deployed to staging, verified, and released  
6. Public disclosure (if applicable) coordinated with reporter  

No bounties are currently offered, but credit will be attributed in release notes for responsibly disclosed issues.

---

## ⚙️ 7. Development Security Requirements

All contributors must:
- Use **2FA** on GitHub and container registry accounts.  
- Sign commits (`git config --global commit.gpgSign true`).  
- Never commit `.env` or credentials.  
- Use **security-scanned dependencies** (`pnpm audit`, `snyk test`).  
- Run `pnpm test:security` locally before PR submission.  
- Confirm PR checklist includes “No secrets committed”.

---

## 🔐 8. Data Protection & GDPR

FitVibe follows **privacy-by-design** and **privacy-by-default** principles:

| Obligation | Implementation |
|-------------|----------------|
| **User consent** | Explicit opt-in for analytics / community feed |
| **Data minimization** | Only store fields needed for function |
| **Right to access/export/delete** | `/users/export`, `/users/delete` endpoints |
| **Retention** | Auto-purge after 24 months inactivity |
| **Encryption** | TLS 1.3 in transit / AES-256 at rest |
| **Logging policy** | Pseudonymized UUIDs; 7-day retention limit |

---

## 🧮 9. Continuous Security Monitoring

- Nightly **npm-audit / Snyk** scans  
- Weekly **dependency update checks** via Renovate  
- Automated **security test suite** (OWASP ZAP + k6)  
- Prometheus alerts on:
  - 5xx rate > 1 %  
  - latency p95 > 600 ms  
  - JWT key rotation > 14 days  
  - failed login spike > 3σ baseline  

---

## 🧩 10. Incident Response

| Phase | Target Time | Action |
|--------|--------------|--------|
| **Detection** | ≤ 1 h | Alert triggered via monitoring |
| **Containment** | ≤ 2 h | Disable affected services |
| **Eradication** | ≤ 12 h | Patch & verify fix |
| **Recovery** | ≤ 24 h | Restore service from backup |
| **Post-mortem** | ≤ 72 h | Root-cause + preventive measures documented in ADR |

All incidents are logged in `infra/security/incidents/YYYY-MM-DD.md`.

---

## 11. Key Management & Rotation Policy

This policy defines how **FitVibe** manages, rotates, and retires cryptographic keys used for authentication, encryption, and secure communication across all environments.

---

### 11.1 Scope

Applies to the following key types:
- **JWT signing keys** (RSA 4096-bit or ECDSA P-256)
- **Database encryption keys** (AES-256)
- **Transport Layer Security (TLS) certificates**
- **Infrastructure secrets** (Docker, GitHub Actions, Prometheus, Grafana)

---

### 11.2 Key Generation

- Keys are generated using OpenSSL or Node’s `crypto` module:
  
  ```bash
  openssl genrsa -out jwt_private.pem 4096
  openssl rsa -in jwt_private.pem -pubout -out jwt_public.pem
  ```

- Each environment (`dev`, `staging`, `prod`) has unique key pairs.
- Private keys are never stored in version control.
- Keys are stored securely via:
  - GitHub Actions Secrets (CI/CD)
  - Docker secrets (runtime)
  - Hardware-backed vault or encrypted volume (`/etc/fitvibe/keys`)

---

### 11.3 Rotation Frequency

| Key Type | Rotation Interval | Method |
|-----------|------------------|---------|
| JWT signing key | Every **14 days** | Automated, JWKS updated |
| TLS certificate | Every **90 days** | Auto-renew via Let’s Encrypt |
| DB encryption key | Every **6 months** | Re-encrypt inactive data |
| Infrastructure secrets | Every **3 months** | Manual rotation & validation |

Prometheus alerts trigger if JWT key age > **14 days** or rotation fails.

---

### 11.4 Rotation Process

1. Generate new key pair  
2. Publish updated JWKS at `/.well-known/jwks.json`  
3. Mark previous key as *deprecated* (valid for 24 h overlap)  
4. Revoke and archive old key (`archive/YYYY-MM-DD/`)  
5. Verify new key usage for all services  
6. Log rotation event (`audit.security.rotation`)  

Automated by `infra/scripts/rotate_keys.sh`.

---

### 11.5 Storage & Access Control

- Only **two authorized maintainers** have access to the private vault.
- All key access logged via `auditd`.
- Keys encrypted using **AES-256-GCM** at rest.
- Two-person rule (4-eyes principle) required for production key operations.
- Temporary key copies automatically deleted post-deployment.

---

### 11.6 Revocation & Compromise Handling

If compromise is suspected:
1. Revoke key in JWKS (flag `revoked=true`)
2. Invalidate all active sessions signed by the key
3. Generate and deploy new key pair
4. Notify affected users within **72 hours** (GDPR Art. 33)
5. Record incident in `infra/security/incidents/YYYY-MM-DD.md`

---

### 11.7 Audit & Verification

- Quarterly key rotation reviews logged in `infra/security/audit/rotation_log.md`
- Annual penetration test includes key lifecycle review
- Records kept for **24 months**

---

### 11.8 References

- **PRD §6.13** – Security & Compliance  
- **TDD §10** – Authentication & Security Layer  
- **QA Plan §12** – Security Testing & Key Lifecycle  
- **FitVibe SECURITY.md** – Overall Security Policy

---

## 🧩 12. Contact

**Email:** `kpilpilidis@gmail.com`  
**Lead:** Dr. Konstantinos Pilpilidis  
**Key Fingerprint:** will be published with PGP key in repository root  

---

*© 2025 FitVibe Development – All Rights Reserved.*
