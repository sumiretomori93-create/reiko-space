# Personal-site security and backups

The public site allows anonymous reading. Only the configured owner's verified
Sites identity may publish diary entries, comments, records, or download backups.
Authentication headers must come from Sites dispatch; do not expose the Worker
through another origin that accepts client-supplied `oai-authenticated-user-*` headers.

## Controls added 2026-10-14

- Same-origin writes, cross-site owner-operation rejection, JSON-only bodies,
  streaming 4 KiB size limit, malformed-input validation.
- Atomic D1 counters shared by Worker instances: each public read category allows
  120 requests/minute/IP; owner diary writes 10/minute, comments 20/minute,
  record uploads 120/minute, backup downloads 5/hour. Limits return 429 and
  Retry-After. Counter failures fail closed; old counters are pruned in bounded batches.
- Comments use 50-item cursor pages with explicit next-page buttons.
- CSP uses a fresh script nonce per response; no production unsafe-inline script
  allowance. Static style attributes remain allowed for existing layout/animations.
  Frame embedding is restricted to this site and the ChatGPT/OpenAI hosts needed
  for the existing site viewer. nosniff, Referrer-Policy, Permissions-Policy and
  HSTS are set on application responses.

These application counters are not a substitute for platform WAF/DDoS protection.
The platform's backup retention, edge quotas and account MFA are not configurable
or independently verified by this project.

## Backups

Sign in as Reiko, then use **导出备份** next to **写一页** in the 宵伽 diary area.
The owner-only `/api/backup` endpoint exports diary rows, all comments and highest
record metadata in a single D1 batch. Responses are no-store attachments. It refuses
an export rather than silently truncating any table over 10,000 rows.

Save downloads somewhere outside the site and public GitHub repository. Export
again after important new entries. This is a manual export feature, not a promise
of scheduled independent backups. Static images/music and source are versioned
separately in GitHub/Sites archives; they are not duplicated in the JSON.

Validate a downloaded file without touching the real database:

```sh
node scripts/verify-backup.mjs /private/path/reiko-backup-YYYY-MM-DD.json
```

The verifier restores into an isolated in-memory SQLite database and checks IDs,
relationships, text, row counts and score validity. It prints counts and a file hash,
not diary contents. Actual production restoration must use an authenticated database
maintenance flow after preserving another copy; there is intentionally no public
restore/delete endpoint.

## Dependency status and testing

`npm audit --omit=dev` reported zero findings after the dependency updates on
2026-10-14. The full audit still reported 6 high-severity package entries, all from
one unresolved `braces <=3.0.3` advisory propagated through Vinext's build-time
commonjs/dynamic-import glob tooling. There was no published patched braces version
at the time of this change. Website requests do not supply build glob patterns.
This residual finding is not marked fixed; re-check upstream releases regularly.

Do not blindly use `npm audit fix --force`, which recommended incompatible
framework downgrades. Run these before publishing dependency changes:

```sh
node --test tests/security.test.cjs
npx tsc --noEmit --incremental false
npm run build
npm audit --omit=dev
npm audit
```

Also check production-mode CSP, all four themes, owner sign-in/write flows,
comments pagination, music, mobile/desktop 2048, record sync and backup download.
Apply only new schema migrations; existing diary tables are never recreated or
modified by request handling.
