# Operations: maintenance, backup, restore, troubleshooting, monitoring

For whoever looks after the Kingson Engineering website. Written 12 November 2026.

## 1. Routine maintenance

| Task | How often | How |
|---|---|---|
| Check that the site loads and the form saves | Weekly | Open the home page. Send a test enquiry marked "TEST". Confirm the row arrives. Mark it Spam |
| Review the enquiry sheet's share list | Quarterly | Share button. Remove people who have left |
| Export the enquiry sheet | Monthly | File, Download, Excel or CSV. Store with business records |
| Review who has access to GitHub and Vercel | Quarterly | Remove accounts no longer needed. Confirm two-factor is on |
| Rotate the Google service-account key | Yearly, and when someone with Vercel access leaves | `docs/ENQUIRIES_GOOGLE_SHEETS.md`, "Rotate the key" |
| Check Search Console for indexing problems | Monthly | Pages report and Sitemaps report |
| Renew the domain | Before expiry | With the registrar. The renewal date and account holder were not verified in this work |
| Check that business details on the site are still right | When anything changes, and yearly | `content/company.js`, then build, render, checks |
| Update the privacy policy when data practices change | When they change | `content/policies.js`. Set `POLICY_DATE` to the publication day |
| Update esbuild | Only when needed | Change the pin in `tools/build-public.mjs` and `tools/build-crm.sh`, rebuild both bundles, run all checks and browser tests |
| Confirm the `checks` workflow is green | After every push | GitHub, Actions tab |

The site has no runtime dependencies, so there are no package updates to apply for the public pages.

## 2. What a backup of this site is

| Part | Where the master is | Backup |
|---|---|---|
| Website code, pages, images, films | The Git repository | Any full clone. Keep at least one copy outside GitHub |
| Enquiries | The Google Sheet. It is held in the developer's Google account until it is moved to the account Kingson names at handover | Google's own version history, plus the monthly export |
| Configuration | Vercel: three or four environment variables, the domain settings | Record the variable names (not the values) and the domain list in the account register. The key can always be re-created in Google Cloud |
| Original photographs and films | Root `*.jpeg`, `source-hd/`, root `*.zip` in the developer's repository | Must be copied to Kingson-owned storage. The clean Kingson repository should not carry the archives |
| CRM data | Supabase project in VelaBuilt's organisation | Kingson holds no backup today. See section 5 |

### Back up the repository

```bash
git clone --mirror <repository-url> kingson-website-backup.git
```

Store the folder, or a zip of it, in Kingson-owned storage. Repeat after significant changes.

### Back up the enquiry sheet

File, Download, Microsoft Excel. Or File, Make a copy, into a Kingson-owned Drive folder. Google Sheets also keeps version history: File, Version history.

## 3. Restore

### Restore the website into a new Vercel project

Use this if the Vercel project is lost, or when moving to a Kingson-owned Vercel account.

1. Make sure the repository is in a GitHub account Kingson controls.
2. In Vercel, add a new project and import that repository.
3. Framework preset: Other. Build command: none. Output directory: leave empty (the repository root). Install command: none.
4. Add the environment variables from `.env.example` to Production. Use the real values.
5. Deploy. Check the `*.vercel.app` address: pages load, `/api/enquiry` answers 405 to a browser visit, `/crm` answers 404 because the CRM is switched off.
6. Add the domains `www.kingsonengineering.co.zw` and `kingsonengineering.co.zw`. Make `www` primary so the apex redirects to it.
7. Point DNS at the new project using the records Vercel shows. Do this only in an agreed window. Wait for the certificate to be issued.
8. Send a test enquiry on the live domain.

`vercel.json` contains a redirect from the host `kingson-engineering.vercel.app` to the production domain. A new project will have a different `vercel.app` name. Update that host in `vercel.json` if the redirect is wanted for the new name.

### Restore an earlier version of the site

- In Vercel: Deployments, pick the last good production deployment, Instant Rollback or Promote to Production.
- In Git: `git revert <commit>` on `main`, push.

### Restore the enquiry sheet

- A row or cell was changed by mistake: File, Version history, restore the earlier version, or copy the values back.
- The sheet was deleted: restore it from Google Drive's bin within Google's retention period. If it is gone, create a new blank sheet, share it with the service account as Editor, set the new `GOOGLE_SHEET_ID` in Vercel, redeploy and send a test enquiry. The function writes the headings with it. Then import the latest export below the heading row.

### Restore the enquiry integration

Follow the setup steps in `docs/ENQUIRIES_GOOGLE_SHEETS.md` again. The service account and key can be re-created at any time. Nothing else depends on the old key.

### Move the enquiry sheet to another Google account

At handover the sheet moves from the developer's Google account to the account Kingson names. Follow "Move the sheet to another Google account" in `docs/ENQUIRIES_GOOGLE_SHEETS.md`.

## 4. Troubleshooting the public site

| Symptom | Check | Fix |
|---|---|---|
| Site does not load at all | Does `https://<project>.vercel.app` load? | If yes, the problem is DNS or the domain: check the domain's status in Vercel and the DNS records with the DNS provider (Liquid Telecom's nameservers serve the zone). If no, check the latest deployment in Vercel and roll back |
| Certificate warning | Vercel project, Domains | Vercel shows whether the certificate was issued. A DNS change is the usual cause |
| A page shows old content | Was the change pushed to `main`? Did the deployment succeed? | Deploy again. HTML is served with `max-age=0`, so caching is not the cause |
| Page has no styling or the menu does not work | Browser console | Usually a CSP block after an inline script changed without re-rendering. Run `node tools/render.js`, commit, deploy |
| Images missing | `node tools/check-truth.js` | It lists image files the pages ask for that are not in the repository |
| Form shows "We could not log that automatically" | Vercel Logs for `/api/enquiry` | `docs/ENQUIRIES_GOOGLE_SHEETS.md`, Troubleshooting |
| Form saves but nobody is told | Sheet notification settings | Each staff member turns on notifications in the sheet for their own account |
| Analytics shows nothing | Did the visitor allow analytics? Is the host the production host? | Analytics only runs after consent on `www.kingsonengineering.co.zw`. Ad blockers also stop it |
| Map does not appear | The visitor must press "Load Google map" | By design |
| `/crm` answers 404 | The CRM is switched off | Expected once the working branch is deployed. To bring the CRM back, see the note at the top of `.vercelignore` |
| `checks` workflow fails | Open the failed step in GitHub Actions | Run the same command locally. See "Common failures" in `README.md` |

## 5. The CRM's data

Stated plainly:

- The CRM is being switched off. On the working branch it is not deployed, so `/crm` answers 404 once that branch is deployed.
- The CRM database, sign-in records and stored files are in a Supabase project in VelaBuilt's organisation, on the free plan. The free plan has no scheduled platform backups.
- The only automated backup is a script on one Windows PC, described in `CRM_OPERATOR_BACKUPS.md`. On 12 November 2026 its runs were failing far more often than they succeeded.
- Kingson holds no CRM backup, key or passphrase that this work could confirm.
- One route for a CRM administrator is the encrypted export in the CRM's Settings screen. It works only while the CRM can be opened. No export was taken in this work.
- Database, first step: end every saved sign-in, disable the unused staff account, and turn on the database-level two-factor rule (`require_mfa = true`). Submitted but not applied. It waits for the developer's confirmation.
- Database, second step, after the new enquiry flow is live in production: close the anonymous enquiry entrance and pause the Supabase project. Pending.
- Pausing keeps the data. It does not delete it. A paused free-plan project can be restored only for a limited time. Confirm the period in the Supabase dashboard.

Still outstanding: an export of the six real enquiries for Kingson. Take it before the project is paused, confirm it opens, and give it to Kingson. If the file has a passphrase, Kingson keeps the passphrase separately from the file.

## 6. Monitoring

### What exists

| Signal | Where | Tells you |
|---|---|---|
| Deployment status | Vercel, Deployments | Whether each push built and went live |
| Function logs | Vercel, Logs | Enquiry endpoint errors (`[enquiry] …` lines). Retention depends on the Vercel plan |
| `checks` workflow | GitHub, Actions | Whether the gates and endpoint tests pass on each push |
| Search Console | Google | Indexing problems, once Kingson has verified ownership |
| Analytics | Google Analytics 4 | Visits by people who allowed analytics |
| Sheet notifications | Google Sheets | A new enquiry arrived, if staff have turned notifications on |

### What does not exist

- Uptime monitoring. Nothing tells anyone if the site goes down.
- Alerting on enquiry failures. A 502 from the endpoint is logged, not sent to anyone.
- Dependency or secret scanning in GitHub. Enable secret scanning and push protection on the Kingson repository if the plan allows.

A free external uptime monitor pointed at the home page, with email alerts to a Kingson address, would close the first gap. None is installed.
