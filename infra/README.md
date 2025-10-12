# Infrastructure & Deployment
## Overview
Docker, GitHub Actions, NGINX, Prometheus.
### CI/CD Pipeline
lint → test → build → docker push → manual deploy.
### Rollback
`docker compose pull <prev>` → redeploy.
