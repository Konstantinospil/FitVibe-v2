# 🤝 Vendor / Third-Party Risk Intake Checklist

> Store under: `security/vendors/VENDOR-<name>-INTAKE.md`

## 1) Vendor Profile

- **Name & URL:**
- **Service provided / Purpose:**
- **Data processed:** [None | Pseudonymous | Personal (Sensitive?)]
- **Data residency/regions:**
- **Sub-processors list URL:**
- **Support SLAs:**

## 2) Security Posture

- **Attestations:** [ISO/IEC 27001 | SOC 2 Type II | Other] (attach evidence)
- **Penetration test cadence & last report date:**
- **Vulnerability disclosure policy:** URL present?
- **Incident history (last 24 months):** summary + links

## 3) Access & Authentication

- **FitVibe data access level:** [metadata-only / content / admin]
- **Auth required:** [SSO/SAML | OAuth | API key | Other]
- **MFA supported/required:** [Yes/No]
- **IP allow-listing / mTLS options:**

## 4) Data Protection

- **Encryption in transit:** TLS 1.2/1.3; cipher suites?
- **Encryption at rest:** technology & key management model
- **Backups purge policy:** supports deletion **≤ 14 days** after hard-delete?
- **Data retention defaults:** <months> (configurable?)
- **Data minimization:** fields required vs. optional

## 5) Privacy & Compliance

- **DPA available:** [Yes/No] (attach)
- **Data subject rights support:** export/delete APIs?
- **Breach notification window:** <hours>
- **International transfers:** SCCs/adequacy decisions?

## 6) Operational & Supply Chain

- **SBOM provided:** [CycloneDX/SPDX] (how often?)
- **Dependency management & SCA:** process/tools
- **Image signing & provenance:** cosign/SLSA?
- **Change management notices:** advance notice period for breaking changes

## 7) Contractual

- **Security schedule / annex:** included?
- **Right to audit:** terms?
- **Termination & data return/erasure:** within 30 days?

## 8) Owner & Review

- **Business owner (FitVibe):**
- **Security reviewer:**
- **Legal reviewer:**
- **Next review date:** YYYY-MM-DD (annual)

## 9) Decision

- [ ] **Approved**
- [ ] **Approved with conditions** (list)
- [ ] **Rejected**
- **Notes/conditions:**
