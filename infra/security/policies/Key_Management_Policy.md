---
title: "FitVibe Key Management Policy"
version: "v.1"
status: "Accepted"
owner: "Konstantinos Pilpilidis (Dr.)"
date: "2025-10-18"
license: "MIT"
contact: "kpilpilidis@gmail.com"
---

## 🔐 1. Purpose

This policy defines how **FitVibe** manages, rotates, and retires cryptographic keys used for authentication, encryption, and secure communication across all environments.

---

## 🧭 2. Scope

Applies to the following key types:

- **JWT signing keys** (RSA 4096-bit or ECDSA P-256)
- **Database encryption keys** (AES-256)
- **Transport Layer Security (TLS) certificates**
- **Infrastructure secrets** (Docker, GitHub Actions, Prometheus, Grafana)

---

## 🧩 3. Key Generation

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

## ⏱️ 4. Rotation Frequency

| Key Type               | Rotation Interval  | Method                       |
| ---------------------- | ------------------ | ---------------------------- |
| JWT signing key        | Every **14 days**  | Automated, JWKS updated      |
| TLS certificate        | Every **90 days**  | Auto-renew via Let’s Encrypt |
| DB encryption key      | Every **6 months** | Re-encrypt inactive data     |
| Infrastructure secrets | Every **3 months** | Manual rotation & validation |

Prometheus alerts trigger if JWT key age > **14 days** or rotation fails.

---

## 🔄 5. Rotation Process

1. Generate new key pair
2. Publish updated JWKS at `/.well-known/jwks.json`
3. Mark previous key as _deprecated_ (valid for 24 h overlap)
4. Revoke and archive old key (`archive/YYYY-MM-DD/`)
5. Verify new key usage for all services
6. Log rotation event (`audit.security.rotation`)

Automated by `infra/scripts/rotate_keys.sh`.

---

## 🔐 6. Storage & Access Control

- Only **two authorized maintainers** have access to the private vault.
- All key access logged via `auditd`.
- Keys encrypted using **AES-256-GCM** at rest.
- Two-person rule (4-eyes principle) required for production key operations.
- Temporary key copies automatically deleted post-deployment.

---

## 🚨 7. Revocation & Compromise Handling

If compromise is suspected:

1. Revoke key in JWKS (flag `revoked=true`)
2. Invalidate all active sessions signed by the key
3. Generate and deploy new key pair
4. Notify affected users within **72 hours** (GDPR Art. 33)
5. Record incident in `infra/security/incidents/YYYY-MM-DD.md`

---

## 🧾 8. Audit & Verification

- Quarterly key rotation reviews logged in `infra/security/audit/rotation_log.md`
- Annual penetration test includes key lifecycle review
- Records kept for **24 months**

---

## 📚 9. References

- **PRD §6.13** – Security & Compliance
- **TDD §10** – Authentication & Security Layer
- **QA Plan §12** – Security Testing & Key Lifecycle
- **FitVibe SECURITY.md** – Overall Security Policy

---

_© 2025 FitVibe Development – All Rights Reserved._
