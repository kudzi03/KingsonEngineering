# Local CRM operator and encrypted archives

The owner approved this free setup on 25 October 2026. It uses the existing Windows account, official Supabase CLI authorization and OneDrive. It does not configure DNS, mail or a paid service.

Use the user-profile folder below, not the Codex app's virtualized AppData folder. The Windows task must be able to see the same files as the owner's ordinary PowerShell session. Its directory ACL grants this Windows user and SYSTEM full access; descendants inherit those two grants. Do not apply container-only ACL flags directly to individual files.

## Installed locations

- Reviewed worker/runtime: `%USERPROFILE%\.kingson-crm-operator` (current user and SYSTEM only).
- Local ciphertext: `%USERPROFILE%\.kingson-crm-operator\backups`.
- OneDrive ciphertext: `C:\Users\pagiw\OneDrive\Kingson Engineering CRM Backups`.
- Windows task: **Kingson CRM scans and encrypted backups**, every 15 minutes while the owner is signed in. A verified backup is made at least 23 hours after the previous verified backup. Turning off the computer pauses this protection.
- The task launches a small reviewed Windows GUI executable compiled from `tools/CrmOperatorLauncher.cs` with the existing Windows .NET Framework compiler. It starts the pinned Node executable without shell interpretation or a console window, fixes the private operator home explicitly, and records an aggregate `launcher-status.json`. No extra downloaded launcher/runtime is required.
- Daily Codex heartbeat: **Kingson CRM health checks**. It reports meaningful changes/errors, not unchanged status. It is also dependent on the local app/computer.

No plaintext database backup or raw encryption key belongs in OneDrive. Temporary downloaded files and restore-test bytes are staged in the restricted local worker directory, then removed. Ordinary customer documents must not be submitted to an online scanner.

## Owner recovery step

Run in your own PowerShell:

```powershell
& "$env:USERPROFILE\.kingson-crm-operator\export-crm-recovery-key.ps1"
```

Choose a unique passphrase of at least 20 characters. Save it in an independent password manager/safe place. Do not put it in chat, source control or beside the archives. Only a passphrase-encrypted recovery key is written to OneDrive; the script decrypts that copy in memory to check it.

Wait for OneDrive to finish syncing. Verify the encrypted archive and `kingson-recovery-key.encrypted.json` are visible in your OneDrive account from a second device/browser. A matching local file hash does not prove cloud upload.

Until the recovery step is complete, the key is only protected with this Windows identity's DPAPI. Losing this computer/identity could make the backups unusable.

## Independent offline verification

The verifier uses the encrypted recovery key and passphrase, without the original Windows DPAPI identity or Supabase credentials:

```powershell
& "$env:USERPROFILE\.kingson-crm-operator\verify-crm-operator.ps1" -Archive 'C:\path\to\kingson-….kingson.enc'
```

On a replacement computer install Node 22+ and the pinned `@electric-sql/pglite@0.3.15` runtime, copy the reviewed verifier, archive module and PowerShell wrapper, and set `KINGSON_PGLITE_PATH` to that installation's `dist/index.js` if necessary. Supply `-RecoveryKey` if the encrypted key is elsewhere. The verifier checks whole-archive authentication before processing records, file hashes, typed rows and relational constraints in an isolated database. It prints aggregate counts, removes temporary files and never writes to production.

This verifier is a recovery check, not a command to overwrite production. A production recovery requires a reviewed restore plan: apply the repository migrations to a compatible Supabase project, load authorized application data, restore file bytes and references, verify ownership/RLS/workflows, and set up Auth/provider secrets through supported administration. Active sessions/refresh tokens and platform secrets are deliberately excluded. Stored MFA ciphertext may depend on the original Auth encryption configuration; cross-project Auth migration has not been tested. Do not copy old sessions or silently disable MFA.

## What an archive contains

- All 13 application tables, selected Auth identity/MFA rows, private security configuration/audit/health/worker records.
- Storage metadata and every object in `kingson-files`, including objects not indexed in `public.files`.
- Schema column/type/enum/function/index/policy/sequence/constraint metadata.
- Document bytes, streamed in chunks with SHA-256 hashes.

One SQL statement provides a consistent database snapshot. Object versions are checked after downloading so changed bytes cannot silently enter that snapshot. Archives use gzip plus AES-256-GCM with a random key and IV; the raw key is DPAPI protected outside OneDrive. The restore drill recreates typed tables and primary/unique/foreign-key constraints and compares all selected rows and file hashes. It does not recreate the full Supabase platform, roles, provider configuration or Storage service. Docker/`pg_dump` was unavailable; do not label this a physical/full-platform restore.

## Operator checks

- Inspect `last-run.json`, `last-scan.json`, `recovery-status.json` and the Windows task's last result. No customer document contents belong in logs.
- Inspect `private.crm_worker_runs` (aggregate only). `crm_security_health()` exposes limited status to authorized administrators.
- On CLI authorization failure, sign in using the official CLI in your own Windows account. Never paste access tokens, DB passwords or service-role keys into chat.
- Keep the computer on/signed in, OneDrive connected and antivirus definitions current. Failed/stale scans do not release files.
- Investigate quarantine alerts; never mark files clean manually to bypass a failed scanner. Existing browser-compatible production behavior remains until coordinated MFA/storage enforcement is enabled.
- Review access monthly and after staff changes. Deactivate departing staff and revoke sessions. Agree a customer/audit retention policy before deleting business history.
- New runtime/worker versions must be reviewed and tested before copying them into the installed operator directory. The task runs that reviewed copy, not whatever happens to be in a later Git branch.

The first live restore drill checked 23 tables, 207 rows, one file and 65 constraints. That is evidence for the selected logical backup, not proof that every future backup succeeds or that no future compromise is possible.

To rebuild the reviewed GUI launcher with the existing Windows compiler, run from this repository (no downloaded compiler):

```powershell
& "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /nologo /target:winexe "/out:$env:USERPROFILE\.kingson-crm-operator\CrmOperatorLauncher.exe" '.\tools\CrmOperatorLauncher.cs'
```

The launcher accepts only `--force-backup` and `--rescan`; other arguments are rejected. After replacing a reviewed binary or worker, run an isolated check and a real scheduled verification before trusting unattended execution.
