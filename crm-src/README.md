# Kingson CRM — source

The private half of the system. The public website is the rest of this
repository; both talk to the same Supabase project, which is what makes a
website enquiry appear on somebody's follow-up list without anybody retyping
it.

## Running it

Thirty ES modules, no build step, no package.json. Serve the directory and
open it:

    cd crm-src && python3 -m http.server 8100

Sign in with a Supabase account that has a row in `public.profiles`. There is
no sign-up: an admin creates people in Settings.

## Shipping it

`crm-src/` is the source. `crm/` is the bundle that actually gets served, at
`/crm` on the website's deployment. Never edit `crm/` by hand:

    ESBUILD=$(which esbuild) tools/build-crm.sh crm-src

It ships bundled because it is served from the same deployment as the site and
thirty round trips on a Harare connection is a slow morning. It is *written*
unbundled because that is what makes it possible to work on without tooling.

## The database

`tools/seed-demo.sql`  loads nine enquiries across every stage of the pipeline,
                       with the quotations, visits, activities and tasks that
                       go with them. Every row it writes carries `is_demo`.

`tools/wipe-demo.sql`  removes exactly those rows and nothing else. It matches
                       on `is_demo` alone — never on a name or a date — so a
                       real customer cannot be caught by a careless wipe.

Run the wipe first, then the seed; the seed is re-runnable and its dates are
relative to today, so a set loaded last month still shows three things overdue.

## Email

`supabase/functions/send-email` holds the provider abstraction and the three
templates. It sends nothing until a provider key is set — see the header of
`index.ts` for exactly which secret is missing and the two ways to supply it.
It never reports a message as sent when it was not.

## What is not here

No service-role key, and none belongs here. `core/config.js` carries the
project URL and the publishable key, both of which are public by design: what
the anonymous role may do is decided by row-level security in the database,
and on this project that is one thing — insert a row into `public.enquiries`.
