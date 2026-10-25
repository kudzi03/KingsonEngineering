# Kingson CRM security work — 25 October 2026

Branch: `codex/crm-security-hardening`. Official CRM: https://www.kingsonengineering.co.zw/crm.
Email delivery (item 1) remains deliberately deferred. No DNS, DMARC, mailbox or billing changes.

## Live backend changes already applied

- Migration `crm_security_hardening`: Monday–Friday defaults and live settings; official CRM URL; fixed normalization-function search paths; reduced privilege on enum/calendar helpers; valid Auth-session checks in staff/admin authorization; new accounts default to inactive Staff, ignoring metadata role claims; metadata-only audit trail; anonymous enquiry limits (5/contact/hour, 120 total/hour) across RPC and direct insert; tightened storage UPDATE policy.
- All public and private application tables have RLS. Anonymous reads of contacts, enquiries and settings return permission denied. Genuine enquiries missing CRM records: 0. Existing accounts remain one active admin and one active staff member.
- Migration `crm_security_maintenance`: daily 02:15 UTC / 04:15 Harare security-state housekeeping and aggregate health snapshot; first run succeeded. Removes expired limiter/session state and aggregate health snapshots older than 90 days. Does not delete customer records, audit history or documents, and sends no email.
- New `crm-upload` Edge Function: checks active staff against the database; bounded multipart body; parent-record authorization; file signatures; archive traversal/executable/macro checks; random storage paths; server-controlled MIME and uploader attribution; storage cleanup if indexing fails. Unauthenticated POST verified denied (403). Authenticated live upload has not been tested with a real user.
- A daily 09:00 Codex heartbeat named **Kingson CRM health checks** is active. Read-only, quiet unless a meaningful change occurs. It depends on the user's computer/app being available; it is not an independent availability guarantee.

## Important rollout state

`private.crm_security_config.require_mfa` is **false**. This is intentional compatibility staging, not a claim that MFA is already enforced. The old production client has no MFA UI.

When true, the server additionally requires a verified MFA factor, an AAL2 token, an existing Auth session, and an established CRM session with a 30-minute inactivity limit and eight-hour maximum. Direct staff storage uploads/overwrites are then disabled: new bytes must pass through `crm-upload`.

Do not turn this on before releasing and verifying the new client. Do not silently reset or enroll anyone's authenticator on their behalf.

## Prepared client and hosting changes (not released to the public site)

- Mandatory TOTP enrollment/challenge before loading customer data; no inline execution of Auth's QR SVG; supports choosing among existing verified authenticators.
- Tokens move from persistent localStorage to per-tab sessionStorage. Old localStorage tokens are discarded rather than migrated. Cross-tab sign-out broadcasts; sign-out clears cached reads and rendered customer data.
- Trusted user activity drives a session heartbeat; idle/max-session checks also enforced in the database after activation. Auth/data requests have bounded timeouts.
- Password changes preserve the MFA session while checking the current password; other refresh sessions are revoked. Password-change/recovery UI requires 14 characters. **The platform minimum is not verified/changed yet**; UI validation is not a substitute for backend password policy.
- Correct reset redirects for `/crm`, `/crm/` and `/crm/index.html`; reset returns through MFA rather than bypassing it.
- Correct Monday–Friday calculation, source email templates and official-domain fallbacks. Email function/template edits are prepared for the later email rollout; existing email function was not redeployed.
- Admin Settings shows actual security rollout state and provides an encrypted application export. AES-256-GCM, random salt/IV, PBKDF2-SHA256 (310,000 iterations), at least 16-character passphrase, integrity/decryption check before download. Includes public application rows and indexed private file bytes. Files over an aggregate 100 MB require an operator backup. Export is sequential, not a transactionally consistent database snapshot. Excludes Auth credentials/secrets, private security tables and unindexed objects. **This is not an automated full disaster-recovery backup.**
- Public-site CSP now authorizes inline scripts by exact SHA-256 hashes and restricts script providers; CRM has no-store and DENY framing headers. Generator updates hashes when pages are rendered. Shared-origin risk is reduced, not eliminated; no separate domain has been configured.
- Portable CRM build script; preview server serves `/crm` with deployment-equivalent security headers; encrypted backup files excluded from Git and Vercel.

## Remaining requirements — do not report these as complete

1. **Auth dashboard access:** in-app browser sign-in attempts failed to load. Connector can update SQL/functions but exposes no Auth configuration write tool; Supabase CLI has no existing login. Public Auth settings confirm signup and anonymous signup are disabled and email confirmation is enabled. Still verify TOTP enrollment/verification, enforce a 14-character backend password minimum, current-password protection, tight login/reset limits, and exact official reset redirect URLs. Do not change SMTP/mailbox/DNS under this work.
2. **Staff and owner MFA:** each person must enroll their own authenticator and retain a protected recovery copy. Organization/GitHub/Vercel owner 2FA is not verified. Owner must verify identity before MFA recovery; remove a lost factor/revoke sessions using supported Auth administration, then have the person enroll again. Never share logins or remove MFA merely on an unverified request.
3. **Production client release and activation:** preview/review first according to the user's deployment preference. Once released, verify the live bundle hash, sign-in, enrollment, real authorized file upload/download, and recovery. Then enable the server switch and re-test denial of password-only/revoked/deactivated sessions. Existing password-only clients will need to reload and sign in again.
4. **Compromised-password protection:** Supabase's server-side feature is Pro-only and remains disabled on Free. No browser-only substitute is presented as enforcement. Pro pricing starts at US$25/month, with project/usage costs dependent on the organization. No upgrade purchased. See https://supabase.com/docs/guides/auth/password-security and https://supabase.com/pricing.
5. **Malware scanning:** signature/archive validation is implemented, but no antivirus/quarantine service is running. Do not claim files are malware-free. A real scanner and fail-closed quarantine/release pipeline still need configuration and a benign/known-test-signature verification. Do not upload customers' files to a new scanning provider without specific authorization.
6. **Backups and restore drill:** encrypted export is tested with synthetic records, not a live full restore. Scheduled transactional database backups, all private file bytes, recoverable off-device encryption keys and an isolated full restore drill still need provisioning. Free option: owner-controlled scheduled `pg_dump` + storage export + encryption on a reliable machine with protected operator credentials. Those credentials/runtime are not currently available; no scheduled full backup has been installed. Supabase Pro includes seven daily database backups; Storage bytes still require separate protection. Free-plan inactivity pausing cannot be guaranteed away by this code. No paid add-ons purchased.
7. **Retention and independent monitoring:** monthly access review/offboarding guidance is in Settings. Customer/audit history retained; obtain an approved business retention policy before automated deletion. Codex + database monitoring is active, but independent outage alerting and backup-failure alerting remain necessary for unattended service. Email delivery/outbox dispatch remains item 1, deliberately off.

## Validation

- 115 local Postgres/PGlite assertions pass, including all 83 existing regression checks, full enquiry → quotation → follow-up → won → project workflow, MFA/permissions/revocation/timeouts, provisioning, rate limits and maintenance. No synthetic production enquiry was submitted.
- Chromium and WebKit at 1440×900 and 390×844: enrollment/challenge, no CRM read before MFA, Settings/layout, sign-out clearing, recovery request routing. Actual encrypted-download/decryption round-trip with synthetic records covered by the updated browser suite.
- Unit/integration checks: encryption round-trip, wrong key, ciphertext tamper, file hashes, malicious archive names/macros, server upload authentication/origin/format checks. These are mocks/local tests, not a malware scan or a real Auth-provider enrollment.
- Public Chromium and WebKit privacy suites passed with strengthened CSP: no optional requests before consent; grant/withdrawal/persistence; form data excluded from analytics; map opt-in; policies; blocked-storage usability. WebKit needed a repeat after a transient click timeout; diagnostic capture was added, no consent behavior was weakened.
- Public rendering/truth/sharing checks pass. Canonicals, sitemap, robots and search-verification files were not changed. No indexing resubmission is needed for these changes.
- Security Advisor no longer reports mutable normalization search paths. Remaining privileged-function warnings are intentional exposed workflow APIs with server authorization (public enquiry RPC is intentionally anonymous and rate-limited). Private-table no-policy INFO notices represent deny-by-default tables. Compromised-password warning remains real and unresolved. References: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable and https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable.

## Rollout / recovery commands

Use the connected project's SQL editor or connector after approval and successful client verification:

```sql
-- Activate only after real-user enrollment and new-client verification.
update private.crm_security_config set require_mfa=true where id;
```

Partial Auth settings are prepared in `crm-src/supabase/config.toml` using the installed CLI's current configuration reference. They are not applied until authentication is available and a remote config diff has been reviewed. Do not push the generated local-development template: it contains insecure/local defaults and unrelated settings.

The additional live `bound_crm_calendar` migration rejects null/infinite dates and excessive day counts to avoid unbounded API computation; normal Monday–Friday calculations are verified live.

For an offline encrypted-export verification, run `tools/verify-crm-backup.ps1 -Path <your encrypted export>` and enter the passphrase privately. It verifies/decrypts in memory and prints counts, without restoring anything to production or writing plaintext customer records.

Do not disable MFA as a routine rollback. Prefer rolling forward with the verified client or correcting account/factor setup through the owner. Keep incident notes; do not delete audit/customer data during recovery.

For recurring checks inspect `cron.job` / `cron.job_run_details`, the latest `private.crm_health_checks` aggregate, and security advisors. Ignore pending notifications while email_mode=manual; alert on conversion failures, missing RLS, failed maintenance or a regression from the verified rollout state. Do not treat this document's expected state as proof: query live settings.
