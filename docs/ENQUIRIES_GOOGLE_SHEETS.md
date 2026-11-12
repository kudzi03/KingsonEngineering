# Website enquiries to Google Sheets

How the enquiry form works, how to set it up, how to run it and how to fix it.

## Status on 12 November 2026

| Item | Status |
|---|---|
| Code (`api/enquiry.js`, form client, tests) | Done, on branch `claude/charming-euler-515w4y` |
| Tests against a faked Google | Done. 17 of 17 pass |
| Preview deployment on Vercel | Done. `GET /api/enquiry` answers 405 as designed |
| Kingson-owned Google account, spreadsheet, service account | Pending. Kingson must create them |
| Environment variables in Vercel | Pending |
| Test with real credentials | Pending. Not done |
| Production deployment | Pending. Needs approval |

The integration is built and tested against a faked Google only. It is not configured and not live. Until the three environment variables are set, the endpoint answers 503 and the form shows the WhatsApp and email handoff.

## 1. Architecture

```
Visitor's browser
   |  POST /api/enquiry  (JSON, same origin)
   v
api/enquiry.js  (Vercel serverless function, Node)
   |  1. checks the request and the fields
   |  2. gets a Google access token with the service-account key
   |  3. looks for a recent duplicate
   |  4. appends one row
   v
Google Sheets API v4
   v
Spreadsheet owned by Kingson Engineering, tab "Enquiries"
```

- The browser never contacts Google and holds no credential.
- The service-account key exists only in Vercel environment variables.
- The service account can reach only spreadsheets that have been shared with it. Share one sheet and it can reach one sheet.
- The function has no npm dependencies. It signs the token request with `node:crypto` and calls Google with the built-in `fetch`.

Files:

| File | Role |
|---|---|
| `api/enquiry.js` | The serverless function |
| `interface/send-enquiry.js` | The browser call |
| `interface/enquiry.js` | The form: validation, messages, WhatsApp and email handoff |
| `content/enquiry-endpoint.js` | The path the form posts to (`/api/enquiry`) |
| `content/runtime-copy.js` | Form labels, options and messages |
| `tools/test-enquiry-api.mjs` | Tests |
| `.env.example` | Variable names with placeholders |

## 2. What the function does

### Request

`POST /api/enquiry` with `Content-Type: application/json`, from a page on the same host.

| Field | Required | Limit | Rule |
|---|---|---|---|
| `company` | Yes | 160 | At least 2 characters |
| `contact` | Yes | 200 | Must contain an email address or at least 7 digits |
| `description` | Yes | 4000 | Not empty. Line breaks kept |
| `service` | No | 120 | Empty, or one of the options in `content/runtime-copy.js` |
| `drawings` | No | 120 | Empty, or one of the options in `content/runtime-copy.js` |
| `location` | No | 160 | |
| `orgdetails` | No | 300 | |
| `page` | No | 200 | Must look like a site path, otherwise recorded as `/` |
| `website` | Must be empty | | Honeypot. A filled value is refused |
| `elapsed` | Yes | | Milliseconds since the page script started. Under 2500 is refused |

Control characters are removed. Values longer than the limit are cut. Unknown fields are ignored.

### Responses

Checks run in the order shown. The first that fails decides the answer.

| Status | Body `reason` | When |
|---|---|---|
| 405 | `method` | Not a POST. `Allow: POST` is sent |
| 415 | `type` | Content type is not `application/json` |
| 403 | `origin` | `Origin` is missing, or its host differs from the request host, or `Sec-Fetch-Site` is present and not `same-origin` |
| 413 | `large` | Body over 16 KB |
| 400 | `invalid` | Body is not a JSON object |
| 400 | `rejected` | Honeypot filled, or submitted in under 2.5 seconds |
| 400 | `invalid` with `fields` | A field failed its rule. `fields` lists which |
| 429 | `busy` | Rate limit reached. `Retry-After: 600` is sent |
| 503 | `unconfigured` | A required environment variable is missing |
| 200 | none (`ok: true`, `ref`) | Row written. `ref` is the reference shown to the visitor |
| 200 | none (`ok: true`, `ref`, `duplicate: true`) | Same enquiry already in the sheet. No new row |
| 502 | `upstream` | Google refused or did not answer |

Every response has `Cache-Control: no-store`. The function sends no CORS headers, so a page on another site cannot read its answers.

The origin check stops other websites' pages from using the endpoint. It is not authentication. A script can forge headers. The rate limits and the Vercel Firewall rule are the controls for that.

### Rate limits

| Limit | Value |
|---|---|
| Per IP address | 5 accepted submissions in 10 minutes |
| All addresses | 60 accepted submissions in 1 hour |

These counters are held in memory. They apply per running function instance and reset when Vercel starts a new instance. Treat them as a first line only. Add a Vercel Firewall rate-limit rule as the durable limit (section 5).

### Duplicates

The function builds a fingerprint from the business name, the contact and the message (lower-cased, SHA-256, first 20 hex characters). It reads the last 100 rows. If the same fingerprint was written in the last 24 hours it returns that row's reference and writes nothing. If the read fails, the enquiry is still written.

The browser also refuses to send the same text twice in one page session.

### Spreadsheet formula injection

- Rows are written with `valueInputOption=RAW`. Google Sheets stores the text and never evaluates it.
- Any text cell that starts with `=`, `+`, `-`, `@`, tab or carriage return gets a leading apostrophe. This protects a later CSV export opened in another program.
- The phone cell is reduced to digits, spaces and `+ ( ) -`. It cannot hold a formula.

### Reference

`KE-YYMMDD-XXXX`. The date is Harare time. The last four characters are random, from an alphabet without `0`, `O`, `1` and `I`.

### Logging

The function writes two kinds of line to the Vercel function log:

- `[enquiry] not configured: Google Sheets environment variables are missing`
- `[enquiry] not saved <stage> <status>` where stage is `token` or `append`

It never logs the enquiry, the key, the token or Google's response body.

### Timeouts and retries

| Step | Timeout |
|---|---|
| Token request | 4 s |
| Duplicate read | 3 s |
| Append | 5 s |
| Browser waits | 12 s |

The append is retried once, after 0.4 s, only when Google answers 429 or 5xx. A timeout is not retried, because the row may already be in.

## 3. The spreadsheet

One tab, named `Enquiries` unless `GOOGLE_SHEET_TAB` says otherwise. Row 1 holds these headings, in this order. The function appends below them and never edits existing rows.

| Column | Heading | Filled by |
|---|---|---|
| A | Submitted (Harare time) | Function. Text, `YYYY-MM-DD HH:MM` |
| B | Reference | Function |
| C | Business name | Visitor |
| D | Phone | Function, from the contact field |
| E | Email | Function, from the contact field |
| F | Service requested | Visitor (list) |
| G | Site location | Visitor |
| H | Drawings | Visitor (list) |
| I | About the organisation | Visitor |
| J | Enquiry message | Visitor |
| K | Source page | Function. The page path the form was on |
| L | Status | Function writes `New`. Staff change it |
| M | Notes | Staff |
| N | Submission ID (system) | Function. The duplicate fingerprint. Do not edit |

Do not insert, delete or reorder columns A to N. Add your own columns from O onwards.

## 4. First-time setup

Kingson does this in accounts Kingson owns. Do not use a VelaBuilt or personal developer account. Google's screen labels change from time to time; the steps name what to look for.

### 4.1 Google account

1. Use a Google account that belongs to Kingson Engineering. A Google Workspace user on the company domain is best. A dedicated free Google account also works.
2. Turn on 2-Step Verification for that account.
3. Record the recovery phone and recovery email in Kingson's account register. They must belong to Kingson.

### 4.2 Spreadsheet

1. Create a new Google Sheets spreadsheet, for example "Kingson website enquiries".
2. Rename the first tab to `Enquiries`.
3. Type the 14 headings from section 3 into row 1, cells A1 to N1.
4. Copy the spreadsheet ID. It is the long string between `/d/` and `/edit` in the address.

### 4.3 Google Cloud project and service account

1. Open the Google Cloud console with the same Kingson account. Create a project, for example "kingson-website".
2. In APIs and Services, open the Library, find "Google Sheets API" and enable it.
3. In IAM and Admin, open Service Accounts. Create a service account, for example `enquiries`. Do not grant it any project role. Do not grant users access to it.
4. Open the service account, go to Keys, add a key, choose JSON. A file downloads. This file is the secret.
5. Note the service account's email address. It ends in `.iam.gserviceaccount.com`.

If key creation is blocked by an organisation policy, a Google Workspace or Cloud administrator must allow service-account key creation for this project. This applies to some Google Workspace organisations. It was not tested in this work.

Whether the Sheets API needs a billing account and whether it carries a charge at this volume was not verified in this work. Check the Cloud console when you enable the API.

### 4.4 Share the sheet

1. In the spreadsheet, press Share.
2. Add the service account's email address as an Editor. Untick the notification.
3. Leave general access as Restricted.

### 4.5 Vercel environment variables

In the Vercel project: Settings, Environment Variables. Add these for the Production environment.

| Name | Value |
|---|---|
| `GOOGLE_SHEET_ID` | The spreadsheet ID |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | The service account's email address |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | The `private_key` value from the JSON file, including the BEGIN and END lines. Mark it Sensitive |
| `GOOGLE_SHEET_TAB` | Optional. Only if the tab is not called `Enquiries` |

The key may be pasted with real line breaks or with `\n` in place of each line break. Both work.

Add the same variables to the Preview environment only if you want preview deployments to write to the sheet. Normally leave Preview empty.

### 4.6 Deploy and test

1. Redeploy production. Environment variable changes apply only to new deployments.
2. Open the live site, fill in the form with non-sensitive sample data, for example business name "TEST - please ignore", and send it.
3. Confirm the page shows a `KE-` reference and that a row with the same reference appears in the sheet.
4. Send the same text again from a fresh page load. Confirm the same reference comes back and no second row appears.
5. Delete the test row, or set its status to Spam.

### 4.7 Clean up

Delete the downloaded JSON key file from the computer and empty the recycle bin. Do not email it, do not put it in chat, and do not commit it. `.gitignore` excludes `.env` files, but not a key file saved under another name.

## 5. Recommended protections

| Protection | How |
|---|---|
| No link sharing | Keep general access Restricted. Share with named people only |
| Fewest editors | Give staff who only read the sheet Viewer or Commenter access |
| Protect the header row | Data, Protect sheets and ranges, row 1, only the owner can edit |
| Protect columns A, B and N | Same menu. Show a warning or restrict to the owner. The service account must stay able to edit |
| Status dropdown | Data, Data validation on column L: New, Contacted, Quoted, Won, Lost, Spam |
| Email on new rows | Tools, Notification settings (or notification rules): notify when any changes are made. Each staff member sets this for their own account |
| Durable rate limit | Vercel project, Firewall: add a rate-limit rule for path `/api/enquiry`, for example 10 requests per minute per IP. Whether this is available on your Vercel plan must be confirmed in the dashboard |

## 6. Routine operation

### Review enquiries

Open the spreadsheet. New rows appear at the bottom with status `New`. Change the status as the enquiry moves. Use Notes for anything staff need to remember.

### Change who can see the sheet

Share button. Add or remove named Google accounts. Remove people when they leave. Do not remove the service account, or enquiries stop being saved.

### Export

File, Download, then Microsoft Excel or CSV. Store exports where Kingson keeps other customer records. A CSV opened in Excel is safe from formula injection because of the leading apostrophe, which will be visible on affected cells.

### Rotate the key

Do this at least once a year, when someone with access to the Vercel project leaves, and immediately if the key may have been exposed.

1. In the Google Cloud console, open the service account, Keys, add a new JSON key.
2. In Vercel, replace `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` with the new `private_key` value.
3. Redeploy production.
4. Send a test enquiry and confirm the row arrives.
5. In the Google Cloud console, delete the old key.
6. Delete the downloaded key file.

### Move to a new spreadsheet

Create the new sheet with the same headings, share it with the service account, change `GOOGLE_SHEET_ID` in Vercel, redeploy, test.

## 7. Troubleshooting

Start with the Vercel function log: Vercel project, Logs, filter for `/api/enquiry`.

| Symptom | Log line | Usual cause | Fix |
|---|---|---|---|
| Form says it could not log automatically; response is 503 | `not configured` | A variable is missing in the Production environment, or the site was not redeployed after adding it | Add the variable, redeploy |
| Response 502 | `not saved token 400` or `401` | The private key was pasted wrongly, belongs to another service account, or was deleted in Google Cloud | Paste the key again from the JSON file, or create a new key. Redeploy |
| Response 502 | `not saved append 403` | The sheet is not shared with the service account as Editor, or the Sheets API is not enabled in the project | Share the sheet. Enable the API |
| Response 502 | `not saved append 404` | Wrong `GOOGLE_SHEET_ID` | Correct it, redeploy |
| Response 502 | `not saved append 400` | The tab name does not match `GOOGLE_SHEET_TAB` (default `Enquiries`) | Rename the tab or set the variable. Redeploy |
| Response 502 | `not saved TimeoutError` or `append 5xx` | Google was slow or down | Usually clears by itself. The visitor was shown the handoff |
| Response 429 | none | Rate limit reached | Wait 10 minutes. If it is abuse, add or tighten the Firewall rule |
| Response 403 | none | The form was submitted from a page on another host, or a proxy removed the `Origin` header | Use the site's own domain |
| Response 400 `rejected` | none | The hidden field was filled (often a browser extension) or the form was sent in under 2.5 seconds | Ask the visitor to retry, or to use WhatsApp or email |
| Response 400 `invalid`, `fields: ["service"]` | none | The option lists in `api/enquiry.js` and `content/runtime-copy.js` differ | Make them match. Run `node tools/test-enquiry-api.mjs` |
| Rows arrive but in the wrong columns | none | Columns A to N were reordered or a column was inserted | Restore the column order from section 3 |

## 8. Recovery from a failed integration

Nothing a visitor types is discarded when saving fails. The page says the enquiry could not be logged automatically, shows the text, and offers WhatsApp, email and copy. Enquiries sent that way arrive in the WhatsApp and email inboxes.

If saving stays broken:

1. Check the phone and the two mailboxes for enquiries sent by handoff.
2. Fix the cause using section 7.
3. If the cause is not found quickly, the form still works through the handoff. To make the form go straight to the handoff, set `ENQUIRY_ENDPOINT` to `''` in `content/enquiry-endpoint.js`, rebuild, render and deploy.
4. If a deployment caused the fault, roll back in Vercel.

## 9. Retention and access

These are recommendations for Kingson to decide. They are not legal advice.

- Name one person who owns the spreadsheet and one deputy.
- Review the share list every quarter.
- Decide how long enquiries that did not become work are kept, and delete or archive older rows on a schedule. The website privacy policy says enquiries are kept as needed to respond, manage the relationship and meet record-keeping duties.
- When a person asks what Kingson holds about them, or asks for deletion, search the sheet for their phone and email.
- Download a copy once a month and store it with Kingson's other business records.

## 10. Local testing

```bash
node tools/test-enquiry-api.mjs
```

The script replaces Google with an in-process fake and generates a throwaway key. Nothing leaves the machine. It covers validation, the column layout, formula injection, origin checks, body limits, duplicates, rate limits, retry, log content, the unconfigured state and token caching.

`node tools/preview-server.mjs` runs the real function at http://127.0.0.1:4173/api/enquiry. Without the Google variables it answers 503.
