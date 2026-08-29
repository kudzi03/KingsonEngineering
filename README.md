# Kingson Engineering

Static website for Kingson Trading (Pvt) Ltd — steelwork specialists, Harare, Zimbabwe.

No build step, no dependencies, no framework. Plain HTML, CSS and JavaScript in one file.
Edit `index.html`, push, and Vercel redeploys.

---

## Files

| File | What it is |
|---|---|
| `index.html` | The entire site — all five views, styles and scripts |
| `404.html` | Not-found page, styled to match |
| `robots.txt` | Crawler rules, including explicit AI-crawler permissions |
| `sitemap.xml` | One live URL; four future pages are written but commented out |
| `vercel.json` | Caching and security headers |
| `uploads/` | The seven workshop photographs |

---

## Deploying

**First time — connect the repo**

1. Push this folder to a new GitHub repository
2. Go to vercel.com → **Add New** → **Project**
3. Choose **Import Git Repository** and pick the repo
4. Framework preset: **Other**. Leave build command and output directory empty
5. **Deploy**

**Every time after that**

Push to `main`. Vercel redeploys automatically, same URL. No dragging, no new project.

---

## Changing the domain

The site URL is hard-coded in three places. When you move to `kingson.co.zw`,
change all three or Google will keep pointing at the old address:

1. `index.html` — the `<link rel="canonical">` and the `og:url` and `og:image` meta tags
2. `robots.txt` — the `Sitemap:` line at the bottom
3. `sitemap.xml` — every `<loc>` entry

Find and replace `https://kingson-site-4.vercel.app` with the new address.

**Adding the custom domain:** Vercel → Project → Settings → Domains → Add.
Then point the domain's DNS at Vercel using the records it shows you.

---

## Before this goes on a real domain

Two things must happen, in this order.

**1. Every figure and promise needs sign-off.** The site states, in the company's name:
quotations inside two working days; company profile, tax clearance, CR6 and CR14 the same
day; 3–5 day lead times on stock gauges; maximum purlin spacing 1800 mm at 0.53 mm;
minimum roof pitch 5°; laser envelope to 20 mm mild steel. These are standard
Southern African profile figures, but they have not been confirmed by the company.
A contractor will build to them.

**2. Delete the duplicate deployments.** Every extra copy of this site competes with the
real one in search results. Keep exactly one Vercel project.

---

## Still outstanding

- Custom domain and a `@kingson.co.zw` email address in place of the Gmail
- Google Business Profile with the real workshop street address — for a Harare
  fabricator this is worth more than the website itself
- FAQ answers, the laser table and the process steps are currently built by JavaScript.
  Google renders them; most AI crawlers do not. Moving them into the HTML would make
  the site visible to answer engines
- Splitting the five views into real URLs (`/profiles/`, `/process/`, `/portfolio/`,
  `/enquire/`) so each can rank independently. The commented block in `sitemap.xml`
  is ready for this
- Named reference projects, with client permission
- Company registration and CIFOZ membership numbers printed on the page

---

## How the enquiry form works

There is no server. Submitting builds a formatted message and hands it to WhatsApp or
to the visitor's email client, pre-filled. **The visitor still has to press send** in that
app — the site cannot send on their behalf. The confirmation says "Ready to send" rather
than "Received" for exactly that reason.

To make it send server-side later, the options are a form service (Web3Forms, Formspree)
or a Vercel serverless function with an email provider.

---

Contact — +263 772 262 869 · kingsonnkm@gmail.com
