# Edge Security & TLS Runbook

This document explains the NGINX reverse proxy configuration that fronts the
FitVibe backend. The goal is to harden the edge, enforce modern TLS, and comply
with the security headers required by the PRD/QA plan.

## TLS configuration

- **Protocols:** TLS 1.2 and 1.3 only, with a modern cipher suite whitelist.
- **Certificates:** Issued via Let’s Encrypt (certbot). Private keys live under
  `/etc/letsencrypt/live/`.
- **OCSP stapling:** `ssl_stapling on; ssl_stapling_verify on;` with Cloudflare
  resolvers.
- **Session settings:** 1 day session cache, server cipher preference, HTTP/2.
- **HSTS:** `max-age=63072000; includeSubDomains; preload`. HTTP traffic is
  redirected to HTTPS.

## Security headers

| Header                         | Value / Rationale                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| `Strict-Transport-Security`    | 2-year preload to enforce HTTPS                                                           |
| `Content-Security-Policy`      | Locked to self for scripts/assets; inline styles restricted; API calls to `https://api.*` |
| `X-Content-Type-Options`       | `nosniff` prevents MIME guessing                                                          |
| `X-Frame-Options`              | `DENY` avoids clickjacking                                                                |
| `Referrer-Policy`              | `strict-origin-when-cross-origin` balances analytics & privacy                            |
| `Permissions-Policy`           | Disables camera/mic/geolocation unless explicitly granted                                 |
| `Cross-Origin-Opener-Policy`   | `same-origin` for improved cross-origin isolation                                         |
| `Cross-Origin-Embedder-Policy` | `require-corp` ensures shared array buffer eligibility without cross-origin leaks         |
| `Cross-Origin-Resource-Policy` | `same-origin` to reduce data exfiltration vectors                                         |

Headers are set with `always` to cover both success and error responses.

## Proxy behaviour

- Backend upstream `backend:4100` keeps 32 idle connections for reuse.
- `X-Forwarded-*` headers propagate client context for logging/auditing.
- Buffers sized to protect upstream against slowloris and oversize payloads.
- ACME challenge is served from `/var/www/certbot`.

## Operational checklist

1. Run `nginx -t` before reloading.
2. Certbot cron renews certificates; after renewal run `systemctl reload nginx`.
3. Monitor OCSP stapling with `openssl s_client -status -connect fitvibe.app:443`.
4. QA automation (`Q-15`) validates headers on every release.
