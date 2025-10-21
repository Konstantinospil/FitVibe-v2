# 🧩 Vulnerability Exception Request

> Store under: `security/exceptions/EX-YYYY-####.md` (auto-expire ≤ 90 days)

## 1) Request Metadata

- **Exception ID:** EX-YYYY-####
- **Date submitted (UTC):** YYYY-MM-DD
- **Requester / Team:** <name/team>
- **Reviewer (Security):** <name>
- **Affected asset(s):** <service/app/library/image digest>

## 2) Vulnerability Details

- **Title/CVE:** <e.g., CVE-2025-XXXX>
- **Source:** [Snyk | npm audit | Trivy/Grype | Vendor advisory | Other]
- **CVSS v3.1:** <score and vector>
- **Current status in CI:** [Failing gate | Warning | Informational]
- **Exploitability in our context:** <analysis>

## 3) Justification for Exception

- Patch unavailable / upgrade breaks prod / migration scheduled / false positive / other.
- Business impact if forced now:

## 4) Compensating Controls (Required)

- WAF rule / feature flag / narrowed RBAC / IP allow-list / forced re-auth / increased monitoring.
- Rollback/kill-switch defined: [Yes/No]

## 5) Expiry & Review

- **Expiry date (≤ 90 days):** YYYY-MM-DD
- **Interim reviews:** <cadence, e.g., every 14 days>
- **Auto-close conditions:** patch released; migration complete; control in place

## 6) Owner Sign-off

- **Requester:** _/s/_
- **Security reviewer:** _/s/_
- **Product/Engineering lead (if applicable):** _/s/_

## 7) Post-Expiry Actions

- Upgrade/patch plan tracked in issue: <link>
- Evidence of removal of compensating controls: <link>
