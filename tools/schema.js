/* ═══════════════════════════════════════════════════════════════════════════
   tools/schema.js — one entity graph, referenced by every page
   ═══════════════════════════════════════════════════════════════════════════

   Every page emits the same organisation, the same website and the same six
   services, by `@id`, rather than restating them. A crawler that reads two
   pages gets one Kingson, not two slightly different ones.

   WHAT IS NOT IN HERE, AND WHY

   No aggregateRating and no review: Kingson has no reviews on file, and
   inventing a star rating is fraud with a schema wrapper on it.
   No foundingDate, no numberOfEmployees, no award, no hasCredential: none is
   confirmed.
   No geo coordinates: the street address is confirmed, a latitude is not, and
   a guessed pin puts a crane at the wrong gate.
   No SearchAction on the WebSite: there is no site search, and declaring one
   describes a feature that does not exist.
   No priceRange: not confirmed.

   Everything that IS here comes through publish(), so a value that is not
   cleared for publication is absent from the graph rather than guessed into
   it — the same gate the visible page runs through.
   ═══════════════════════════════════════════════════════════════════════════ */

import { publish } from '../content/company.js';
import { CAPABILITIES, SPECS, FAQ, HERO, UPDATED } from '../content/copy.js';
import { SERVICES } from '../content/services.js';
import { ASSETS, src } from '../content/assets.js';
import { SITE } from './layout.js';

const ORG = `${SITE}/#organization`;
const WEB = `${SITE}/#website`;

/* Which route, if any, is the canonical page for a confirmed service. */
const pageFor = (serviceName) => {
  const s = SERVICES.find((x) => x.serviceName === serviceName
    || (x.alsoServes || []).includes(serviceName));
  return s ? `${SITE}/${s.slug}` : null;
};

const serviceId = (c) => `${SITE}/#service-${c.id}`;

/* ── the shared nodes ───────────────────────────────────────────────────── */

function organisation() {
  const hours = publish('hoursSpec');
  const addr = publish('address');
  return {
    '@type': ['Organization', 'LocalBusiness'],
    '@id': ORG,
    name: publish('name'),
    ...(publish('legalName') ? { legalName: publish('legalName') } : {}),
    ...(publish('tagline') ? { slogan: publish('tagline') } : {}),
    description: HERO.lede,
    url: SITE + '/',
    logo: {
      '@type': 'ImageObject',
      url: `${SITE}/assets/brand/kingson-logo-560.png`,
      width: 560, height: 229
    },
    image: `${SITE}/${src('portalFrame', 1320)}`,
    ...(publish('phone') ? { telephone: publish('phone') } : {}),
    ...(publish('email') ? { email: publish('email') } : {}),
    ...(addr ? {
      address: {
        '@type': 'PostalAddress',
        streetAddress: addr.replace(/,\s*Harare$/, ''),
        addressLocality: 'Harare',
        addressCountry: 'ZW'
      }
    } : {}),
    ...(hours ? {
      openingHoursSpecification: [{
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: hours.days, opens: hours.opens, closes: hours.closes
      }]
    } : {}),
    contactPoint: [
      ...(publish('phone') || publish('email') ? [{
        '@type': 'ContactPoint',
        contactType: 'sales',
        ...(publish('contactPerson') ? { name: publish('contactPerson') } : {}),
        ...(publish('phone') ? { telephone: publish('phone') } : {}),
        ...(publish('email') ? { email: publish('email') } : {}),
        availableLanguage: 'en'
      }] : []),
      ...(publish('emailTechnical') ? [{
        '@type': 'ContactPoint',
        contactType: 'technical support',
        email: publish('emailTechnical'),
        availableLanguage: 'en'
      }] : [])
    ],
    areaServed: [
      { '@type': 'Country', name: 'Zimbabwe' },
      { '@type': 'City', name: 'Harare' }
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Steelwork services',
      itemListElement: CAPABILITIES.map((c) => ({
        '@type': 'Offer', itemOffered: { '@id': serviceId(c) }
      }))
    },
    ...(publish('facebook') ? { sameAs: [publish('facebook')] } : {})
  };
}

const website = () => ({
  '@type': 'WebSite',
  '@id': WEB,
  url: SITE + '/',
  name: publish('name'),
  description: HERO.lede,
  publisher: { '@id': ORG },
  inLanguage: 'en-ZW'
});

/* Each confirmed service, once, with the figures Kingson confirmed for it as
   machine-readable properties rather than only as prose. */
function services() {
  return CAPABILITIES.map((c) => {
    const url = pageFor(c.title);
    return {
      '@type': 'Service',
      '@id': serviceId(c),
      name: c.title,
      serviceType: c.title,
      description: c.body,
      provider: { '@id': ORG },
      areaServed: [
        { '@type': 'Country', name: 'Zimbabwe' },
        { '@type': 'City', name: 'Harare' }
      ],
      ...(url ? { url } : {}),
      additionalProperty: c.facts.map(([name, value]) => ({
        '@type': 'PropertyValue', name, value
      }))
    };
  });
}

function breadcrumb(pageUrl, trail) {
  return {
    '@type': 'BreadcrumbList',
    '@id': pageUrl + '#breadcrumb',
    itemListElement: trail.map(([name, url], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      ...(url ? { item: url } : {})
    }))
  };
}

const questions = (list) => list.map((it) => ({
  '@type': 'Question',
  name: it.q,
  acceptedAnswer: { '@type': 'Answer', text: it.a }
}));

/* ── the page graph ─────────────────────────────────────────────────────────
   `faq` present types the page node as both WebPage and FAQPage, which is what
   gets a question its rich result — a separate FAQPage node sharing the same
   URL describes two pages at one address.                                   */

export function pageGraph({ path, name, description, image, trail, faq, about, extra = [] }) {
  const url = SITE + (path === '/' ? '/' : path);
  const img = ASSETS[image];
  const page = {
    '@type': faq && faq.length ? ['WebPage', 'FAQPage'] : 'WebPage',
    '@id': url + '#webpage',
    url,
    name,
    description,
    isPartOf: { '@id': WEB },
    about: about ? { '@id': about } : { '@id': ORG },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: `${SITE}/${src(image, 1320)}`,
      width: img.w, height: img.h,
      caption: img.alt
    },
    inLanguage: 'en-ZW',
    dateModified: UPDATED,
    ...(trail ? { breadcrumb: { '@id': url + '#breadcrumb' } } : {}),
    ...(faq && faq.length ? { mainEntity: questions(faq) } : {})
  };

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      organisation(),
      website(),
      page,
      ...(trail ? [breadcrumb(url, trail)] : []),
      ...services(),
      ...extra
    ]
  }, null, 2);
}

/** The confirmed questions matching a list of question strings, in order. */
export function pickFaq(names) {
  return names.map((q) => {
    const item = FAQ.items.find((i) => i.q === q);
    if (!item) { console.error(`unknown FAQ question: ${q}`); process.exit(2); }
    return item;
  });
}

/** The confirmed specification groups matching a list of ids, in order. */
export function pickSpecs(ids) {
  return ids.map((id) => {
    const g = SPECS.groups.find((x) => x.id === id);
    if (!g) { console.error(`unknown spec group: ${id}`); process.exit(2); }
    return g;
  });
}

export { serviceId, ORG, WEB };
