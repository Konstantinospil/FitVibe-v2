# ADR-006: Avatar Handling via Base64
**Date:** 2025-10-07  
**Status:** Accepted  
**Cross-References:** Chat 2025-10-05  

## Decision
Users upload avatars as base64 strings stored in DB, not filesystem.  
No external storage used (privacy by design).

## Consequences
✅ GDPR-friendly, portable  
⚠️ Slightly larger DB entries
