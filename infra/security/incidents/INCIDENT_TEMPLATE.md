# 🧯 Incident Record Template

> Store under: `infra/security/incidents/YYYY-MM-DD-<short-title>.md`

## 1) Metadata

- **Incident ID:** IR-YYYY-####
- **Date discovered (UTC):** YYYY-MM-DD HH:MM
- **Reporter:** <name or external contact>
- **Owner (DRI):** <name>
- **Severity (CVSS v3.1):** <score and vector, e.g., 8.8 (AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H)>
- **Category:** [Data exposure | Auth bypass | DoS | Code execution | Config | Other]
- **Status:** [Identified | Contained | Eradicated | Recovered | Monitoring | Closed]

## 2) Summary

Short, factual description (2–3 sentences).

## 3) Timeline (UTC)

| Time             | Event                      |
| ---------------- | -------------------------- |
| YYYY-MM-DD HH:MM | Detection (alert/source)   |
| YYYY-MM-DD HH:MM | Containment action         |
| YYYY-MM-DD HH:MM | Fix deployed to staging    |
| YYYY-MM-DD HH:MM | Fix deployed to production |
| YYYY-MM-DD HH:MM | Communications sent        |
| YYYY-MM-DD HH:MM | Post-mortem completed      |

## 4) Impact & Scope

- **Systems affected:** <apps/services/regions>
- **Data affected:** [None | Internal | Restricted | Sensitive (Personal)] — describe fields if any
- **Users impacted:** <counts/segments>
- **Downtime/SLO breach:** <y/n + duration>

## 5) Root Cause Analysis

- **Primary cause:** <what failed>
- **Contributing factors:** <list>
- **Why now?:** <trigger/conditions>
- **Evidence:** links to logs, dashboards, commits

## 6) Containment

Actions taken to stop ongoing harm (≤ 2 h target).

## 7) Eradication

Patch, removal of artifacts, key rotations (≤ 12 h target).

## 8) Recovery

Validate in staging → production restore; run regression/perf/a11y/security gates (≤ 24 h target).

## 9) Privacy & Compliance

- **Personal data involved:** [Yes/No]
- **DSR prioritization applied:** [Yes/No] (per policy §9)
- **Backups purge:** scheduled to complete **≤ 14 days** after hard-delete
- **Notifications (GDPR Art. 33):** if applicable, target **≤ 72 h**

## 10) Communications

- Internal notice link
- External advisory / release notes link

## 11) Action Items

| ID  | Action | Owner | Priority | Due |
| --- | ------ | ----- | -------- | --- |
| A1  |        |       |          |     |
| A2  |        |       |          |     |

## 12) Verification & Closure

- **Evidence of fix in monitoring:** links/screenshots
- **Residual risk:** <low/med/high + justification>
- **Date closed (UTC):** YYYY-MM-DD
- **Approver:** <security lead>
