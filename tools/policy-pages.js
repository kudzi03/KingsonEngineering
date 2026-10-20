import { POLICIES, POLICY_DATE } from '../content/policies.js';
import { publish } from '../content/company.js';
import { SITE, esc, headHtml, chromeTop, chromeBottom, siteFooter } from './layout.js';
const homeQuote = html => html.replaceAll('href="#enquiry"','href="/#enquiry"');
export function policyPages() {
  return POLICIES.map(policy=>{
    const path='/'+policy.slug;
    const ld=JSON.stringify({'@context':'https://schema.org','@graph':[
      {'@type':'Organization','@id':SITE+'/#organization',name:publish('name'),legalName:publish('legalName'),url:SITE+'/',email:publish('email')},
      {'@type':'WebPage','@id':SITE+path+'#webpage',url:SITE+path,name:policy.title,description:policy.description,dateModified:POLICY_DATE,about:{'@id':SITE+'/#organization'},inLanguage:'en-ZW'}
    ]});
    return {file:policy.slug+'.html',html:`<!doctype html>
<html lang="en-ZW"><head>
${headHtml({title:policy.title+' | Kingson Engineering',description:policy.description,path,ogImage:'portalFrame',ld})}
</head><body id="top" class="policy-body">
${homeQuote(chromeTop({home:false}))}
<main id="main" tabindex="-1"><div class="policy-page wrap">
  <header class="policy-heading"><p class="eyebrow">Kingson Engineering</p><h1>${esc(policy.title)}</h1><p class="policy-date">Last updated: <time datetime="${POLICY_DATE}">20 October 2026</time></p><p class="policy-intro">${esc(policy.intro)}</p></header>
  <nav class="policy-nav" aria-label="Policies">${POLICIES.map(p=>`<a href="/${p.slug}"${p.slug===policy.slug?' aria-current="page"':''}>${esc(p.title)}</a>`).join('')}</nav>
  <article>${policy.sections.map(([title,paragraphs],i)=>`<section aria-labelledby="policy-${i}"><h2 id="policy-${i}">${esc(title)}</h2>${paragraphs.map(p=>`<p>${p}</p>`).join('\n')}</section>`).join('\n')}</article>
  <p class="policy-back"><a class="text-link" href="/">Back to Kingson Engineering <span aria-hidden="true">↗</span></a></p>
</div></main>
${siteFooter()}
${homeQuote(chromeBottom())}
</body></html>
`};
  });
}
