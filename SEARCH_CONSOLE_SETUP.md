# Google Search Console setup

Prepared for `https://www.kingsonengineering.co.zw/`. This document does not
claim ownership verification, indexing or sitemap submission has happened.

## URL-prefix verification (website change only)

1. In [Search Console](https://search.google.com/search-console/), choose **Add
   property → URL prefix** and enter exactly
   `https://www.kingsonengineering.co.zw/`.
2. Choose **HTML tag**. Copy only the token from the supplied meta tag's
   `content` attribute.
3. Put that token in `SEO.googleSiteVerification` in `content/seo.js`. Leave the
   field empty until Google supplies it; never publish a made-up token.
4. Run `node tools/render.js` and `node tools/check-truth.js`. The generator
   emits the verification meta tag only on the home page. Commit source and
   generated HTML together, then deploy after approval.
5. View the deployed home page source, confirm the exact tag is in `<head>`,
   and select **Verify** in Search Console. Keep the token in the site after
   verification so ownership can be rechecked.

This property covers the HTTPS www site; other hosts/protocols are outside its
scope. No DNS or email change is needed for the HTML-tag method.

## Domain-property verification (Liquid Telecom assistance)

1. Choose **Add property → Domain**, enter `kingsonengineering.co.zw` without a
   protocol or path, and copy Google's exact TXT verification value.
2. Ask Liquid Telecom, which manages the domain's DNS, to add the supplied TXT
   record at the hostname Google specifies. This is a separate, owner-managed
   DNS task; do not replace or remove existing website, MX, SPF, DKIM or DMARC
   records.
3. Allow propagation and select **Verify**. The actual successful response in
   Search Console is the confirmation of ownership.

A Domain property includes subdomains and protocols. The site still advertises
the single canonical HTTPS www origin. These instructions make no DNS changes.

## After the redesign is approved and published

- Submit `https://www.kingsonengineering.co.zw/sitemap.xml` in **Sitemaps**.
  It lists the home page and five current service URLs, with no CRM, 404,
  preview-domain, duplicate `.html` or old Vercel URLs.
- Inspect the home page and each service URL using **URL Inspection → Test
  live URL**. Check 200 responses, indexing allowed, rendered content, and the
  declared canonical. Google's selected canonical appears only after processing.
- Check indexing reports for unexpected exclusions and old alternate domains.
  The old Vercel host must retain its permanent redirects. The legacy American
  spelling `/fiber-laser-cutting-harare` redirects to `/fibre-laser-cutting-harare`.
- Retest a home page and a service page in [Schema.org
  Validator](https://validator.schema.org/) and [Google Rich Results
  Test](https://search.google.com/test/rich-results). Valid Schema.org markup
  is not a guarantee of a Google enhancement, ranking or AI citation. Service
  data is useful even when it has no standalone Google rich-result feature.
- Keep genuine company identity, service area, opening hours and contact
  details consistent with the Google Business Profile. The workshop address is
  a real base, not evidence of a public walk-in storefront. Business Profile
  verification is separate from Search Console ownership.

Search and AI readiness here means crawlable, useful HTML, clear services,
verified specifications, linked evidence and consistent entities. No extra
AI-specific files or claims of guaranteed citations are used.

Sources: [Google ownership verification](https://support.google.com/webmasters/answer/9008080),
[property scope](https://support.google.com/webmasters/answer/34592),
[sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap),
[Google AI-search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).
