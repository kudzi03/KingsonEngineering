/* ═══════════════════════════════════════════════════════════════════════════
   content/copy.js — every customer-facing string
   ═══════════════════════════════════════════════════════════════════════════

   Written for the person who arrived because they need something made, roofed,
   cut or lifted. Every number below appears on the returned "Information
   required" document with a tick or in Kingson's handwriting. Nothing else is
   a number. See SOURCE_OF_TRUTH.md.
   ═══════════════════════════════════════════════════════════════════════════ */

/* An eyebrow that repeats its own heading word for word is decoration. Each
   one here says something the heading does not. */
/* The date the content last meaningfully changed, for the sitemap.
   Deliberately NOT derived from `git log`: the sitemap is a generated file
   committed alongside the content it describes, so deriving its own lastmod
   from the commit that contains it can never agree with itself. Bump this by
   hand when a figure, a service or a photograph changes — a sitemap that
   claims a change every time the renderer runs teaches a crawler to ignore
   the field anyway. */
export const UPDATED = '2026-09-14';

export const EYEBROWS = {
  services: 'Six services',
  process:  'How it works',
  specs:    'Specifications',
  enquiry:  'Get a price',
  faq:      'Questions',
  contact:  'Where to find us'
};

/* The h1 carries the authority and the lede carries the comprehension. Both
   are needed: "Steelwork. Built here." says who this is in two words — and
   "here" is a confirmed fact, the workshop at No. 1262 Tynwald Industries —
   while the line under it still names all four things a buyer might be
   searching for. The full service list also sits in the title tag, the meta
   description, the chapter headings, the FAQ and the structured data, so
   nothing is lost by not cramming it into the h1. */

export const HERO = {
  eyebrow: 'Steelwork specialists · Tynwald, Harare',
  title: 'Steelwork. Built here.',
  lede: 'Structural steel, roofing, fiber laser cutting and cranage — fabricated in our own workshop and erected with our own crane. Send drawings or a description; enquiries are acknowledged the same working day.',
  /* The four the lede names, set as the sheet's reference line. */
  disciplines: ['Structural steel', 'Roofing', 'Fiber laser', 'Cranage'],
  /* The lede's promise is the one Kingson confirmed in §7. It is not a
     flourish; it is the commitment the office says it can meet every time. */
  actions: { quote: 'Get a price', call: 'Call', whatsapp: 'WhatsApp' }
};

/* ── the chooser under the hero ───────────────────────────────────────────── */

export const SERVICES_BLOCK = {
  eyebrow: 'Six services',
  title: 'What do you need made?',
  lede: 'Pick the one closest to your job. Each goes to a page with the full specification.',
  go: 'See the detail'
};

/* The two the browser also needs — see content/runtime-copy.js for why they
   live in a file of their own. Re-exported so every author-time reader can
   go on importing them from here. */
export { WORK, ENQUIRY } from './runtime-copy.js';

/* ── the 404 ─────────────────────────────────────────────────────────────────
   A dead URL is not an occasion for an apology. The person came to have
   something built and clicked a link that does not exist; the page's whole
   job is to get them to the right one of the six in a single move, or to let
   them send the brief from where they stand.                               */

export const NOT_FOUND = {
  title: 'Page not found',
  description:
    'That page is not on this site. Structural steel, roof steelwork, fiber laser '
    + 'cutting, fabrication and mobile cranage are all one click away.',
  hero: 'portalFrame',
  eyebrow: 'Error 404',
  h1: 'That page isn\u2019t here.',
  lede: 'Either the address is wrong or the page has moved. Everything else is where '
    + 'it was \u2014 every service, every specification, and the form that sends us '
    + 'your brief.',
  ctaTitle: 'Or just send us the brief.',
  ctaLede: 'Tell us what you need. Enquiries are acknowledged the same working day.'
};

/* ── the six services ────────────────────────────────────────────────────────
   All six were ticked "keep" in §8, and "anything missing" was left blank, so
   this list is complete and closed.

   `photo: null` is deliberate on two of them. Kingson supplied no photograph
   of a balustrade, a gate, or a stainless job, and the two stock collages in
   the repository are not Kingson's work. Those two carry a `plate` instead:
   the single confirmed figure a buyer of that work actually asks about, set
   large where the photograph would have been. An absent photograph then reads
   as a decision rather than as a missing file.

   Every `facts` list is two rows long, so the six cards sit level in the grid.
   The complete tables are in SPECS, one section further down.                */

/* `route` is the page this service owns, and `lead` is the one figure a buyer
   of that service actually asks about. Both exist so the chooser under the
   hero can put all six on a single screen: before it, the only way to find out
   whether Kingson does your job was to scroll seven screens of chapters.

   Every `lead` is a figure already confirmed elsewhere on this site — the
   chooser states them, it does not invent them. */
export const CAPABILITIES = [
  {
    id: 'structural', photo: 'portalFrame', route: 'structural-steel-harare',
    lead: ['6–10 weeks', 'portal frame programme'],
    title: 'Structural steelwork',
    body: 'Portal frames, columns, rafters and purlins — fabricated in the workshop and erected on site with our own crane.',
    ask: 'Send drawings, or the span, height and bay spacing.',
    facts: [['Programme', 'six to ten weeks'],
            ['Erection', 'Harare and nationally']]
  },
  {
    id: 'roofing', photo: 'roofTrusses', route: 'roofing-and-trusses',
    lead: ['12 m', 'maximum sheet length'],
    title: 'Roof steelwork and trusses',
    body: 'Trusses, purlins and sheeting for long-span roofs, new build or re-roof. IBR and corrugated profiles, galvanised or pre-painted.',
    ask: 'Send the floor area, the pitch you want, and whether the walls are up.',
    facts: [['IBR cover', '686 mm, five ribs'],
            ['Corrugated cover', '762 mm, 10.5 corrugations']]
  },
  {
    id: 'cutting', photo: 'laserFloor', route: 'fiber-laser-cutting-harare',
    lead: ['±0.1 mm', 'cutting tolerance'],
    title: 'Fiber laser cutting',
    body: 'Plate and sheet cut on a DXTECH fiber laser, straight from your file. Mild steel, stainless, aluminium and galvanised sheet.',
    ask: 'Send a DXF, DWG, STEP or PDF with the material and thickness.',
    facts: [['Bed size', '3 000 × 1 500 mm'],
            ['Mild steel', 'to 20 mm']]
  },
  {
    id: 'balustrades', photo: null, route: 'steel-fabrication',
    lead: ['3 000 mm', 'maximum fold length'],
    plate: ['3 000 mm', 'maximum fold length'],
    title: 'Balustrades and gates',
    body: 'Balustrading, handrails and gates, fabricated to your opening and finish.',
    ask: 'Send the opening dimensions and a photograph of the site, or a sketch.',
    facts: [['Material', '0.4 – 3.0 mm sheet'],
            ['Also in', 'galvanised, stainless, aluminium']]
  },
  {
    id: 'stainless', photo: null, route: 'steel-fabrication',
    lead: ['10 mm', 'stainless, cut on nitrogen'],
    plate: ['10 mm', 'stainless, cut on nitrogen'],
    title: 'Stainless fabrication',
    body: 'Stainless sheet and section work — cut, folded and fabricated to drawing.',
    ask: 'Send a drawing with the grade and thickness you need.',
    facts: [['Laser bed', '3 000 × 1 500 mm'],
            ['Folding', 'to 3 000 mm']]
  },
  {
    id: 'cranage', photo: 'crane', route: 'mobile-cranage-harare',
    lead: ['25 t', 'telescopic mobile crane'],
    title: 'Mobile cranage',
    body: 'Our 25-tonne telescopic mobile crane, for lifting and placing steel — on our jobs or yours.',
    ask: 'Tell us the load, the site access and the date.',
    facts: [['Capacity', '25 tonnes'],
            ['Area', 'Harare and nationally']]
  }
];

/* ── how it works ───────────────────────────────────────────────────────────
   These five are §7 of the returned document verbatim. Kingson was asked to
   strike out anything the office could not meet every time and struck out
   nothing. They are the most valuable thing on this page.

   `only` marks a step that is true of ONE service rather than of the office.
   The six-to-ten-week programme is the portal frame programme — §7 says so in
   as many words — and printing it on the laser, fabrication and cranage pages
   told four of five visitors a lead time that has nothing to do with the work
   they came for. Kingson has confirmed no programme for those services, so
   those pages now show the four commitments that ARE universal and no
   timeline at all. Inventing one to fill the row would be the worse error.

   The home page still shows all five: it is the page about the whole company,
   and the step names the service it belongs to.                             */

export const PROCESS = {
  title: 'What happens after you send it.',
  lede: 'Five things we hold to on every job. Not targets — what the office actually does.',
  steps: [
    { n: '01', title: 'Enquiry acknowledged',   body: 'Same working day.', bar: { week: 0 } },
    { n: '02', title: 'Site visit arranged',    body: 'Within two working days, where the job needs one.', bar: { week: 2 } },
    { n: '03', title: 'Written quotation',      body: 'Within the week.', bar: { week: 6 } },
    { n: '04', title: 'Portal frame programme', body: 'Six to ten weeks from order.', bar: { order: [6, 10] },
      only: 'structural-steel-harare' },
    { n: '05', title: 'Delivery outside Harare', body: 'Nationally, with transport priced per load.' }
  ],
  /* On the home page (desktop) steps 01–04 are also drawn as a programme bar
     chart with a broken axis, the way a construction programme is issued:
     the first working week in days (Monday to Saturday — the confirmed
     hours), a break line for the customer's own decision, then weeks from
     order. `bar.week` is the working day a commitment is met by; `bar.order`
     is the programme range in weeks. Step 05 has no duration and no bar. */
  axis: {
    week: 'First working week', order: 'Weeks from your order', gap: 'Your order',
    weekTicks: [[0, 'Enquiry'], [2, 'Day 2'], [6, 'End of week']],
    orderTicks: [[0, 'Order'], [6, 'Week 6'], [10, 'Week 10']]
  },
  close: 'That is the whole sequence. It starts when you send the drawings.',
  closeAction: 'Send us the brief'
};

/** The steps that are true on `slug`, renumbered so the rail never skips. */
export const processFor = (slug) => PROCESS.steps
  .filter((st) => !st.only || st.only === slug)
  .map((st, i) => ({ ...st, n: String(i + 1).padStart(2, '0') }));

/* ── confirmed specifications ───────────────────────────────────────────────
   Every figure ticked in §2 – §6. Grouped so a buyer opens only the one they
   need rather than reading a wall of tables.                                 */

export const SPECS = {
  title: 'The numbers we work to.',
  lede: 'Every figure Kingson confirmed, by material and profile.',
  groups: [
    { id: 'ibr', title: 'IBR sheeting', rows: [
      ['Cover width', '686 mm, five ribs'],
      ['Rib height / pitch', '36 mm / 200 mm'],
      ['Gauges stocked', '0.47 · 0.53 · 0.58 mm'],
      ['Minimum roof pitch', '5°; 7° with side laps'],
      ['Maximum purlin spacing', '1 800 mm at 0.53 mm'],
      ['Maximum sheet length', 'cut to 12 m'],
      ['Finishes', 'galvanised or pre-painted']
    ]},
    { id: 'corrugated', title: 'Corrugated sheeting', rows: [
      ['Cover width', '762 mm, 10.5 corrugations'],
      ['Crest height / pitch', '17.5 mm / 76 mm'],
      ['Gauges stocked', '0.4 · 0.47 · 0.53 mm'],
      ['Minimum roof pitch', '10°; 12° exposed'],
      ['Maximum purlin spacing', '1 200 mm at 0.47 mm'],
      ['Curving', 'from 6 m radius, sprung on site']
    ]},
    { id: 'flashings', title: 'Flashings and custom folding', rows: [
      ['Maximum fold length', '3 000 mm'],
      ['Material range', '0.4 – 3.0 mm · mild steel, galvanised, stainless, aluminium'],
      ['Standard items', 'ridge, barge, valley'],
      ['Lead time', '3 – 5 days on a stock gauge']
    ]},
    { id: 'laser', title: 'Fiber laser', rows: [
      ['Machine', 'DXTECH'],
      ['Bed size', '3 000 × 1 500 mm'],
      ['Mild steel', '20 mm on oxygen'],
      ['Stainless steel', '10 mm on nitrogen'],
      ['Aluminium', '8 mm on nitrogen'],
      ['Galvanised sheet', '4 mm on nitrogen'],
      ['Tolerance', '± 0.1 mm, repeatability ± 0.03 mm'],
      ['File formats accepted', 'DXF, DWG, STEP, PDF']
    ]},
    { id: 'cranage', title: 'Cranage and erection', rows: [
      ['Crane type', 'telescopic mobile'],
      ['Lifting capacity', '25 tonnes'],
      ['Cranes', 'one'],
      ['Erection area', 'Harare and nationally']
    ]}
  ]
};

/* ── the strip under the hero ────────────────────────────────────────────────
   Four facts, not four statistics. Every one is ticked or handwritten on the
   returned document. There is no project count, no years-in-business and no
   customer number here, because Kingson has confirmed none of those.          */

/* Label, headline figure, detail. Every figure is one confirmed elsewhere on
   the site; the band only states them large. */
export const STRIP = [
  ['Fiber laser',  '±0.1 mm',  'DXTECH · 3 000 × 1 500 mm bed'],
  ['Cranage',      '25 t',     'Our own telescopic mobile crane'],
  ['Workshop',     'Harare',   'No. 1262 Tynwald Industries'],
  ['Open',         'Mon–Sat',  '07:30 – 17:00 · enquiries acknowledged the same working day']
];


/* ── the enquiry ────────────────────────────────────────────────────────────
   Field set derived from what Kingson actually needs to price a job: which of
   the six services, where, what it is, and whether drawings exist. Nothing is
   here because a CRM usually has it.                                         */


/* ── FAQ ────────────────────────────────────────────────────────────────────
   Every answer is a confirmed fact. Phrased the way someone would ask an
   assistant rather than the way they would type a search query, because that
   is what an answer engine matches against.                                  */

/* `home: true` marks the six questions the HOME page asks.

   All fifteen stay here: ten of them are answered on the service page for
   that service, and every one of them feeds the structured data. But the home
   page was printing all fifteen — a screen and a half, below the enquiry
   form — and two pairs of them were near-duplicates written for different
   readers. "Where is the workshop?" and "Where is Kingson Engineering based?"
   answer the same question twice, as do "Do you deliver outside Harare?" and
   "What areas do you cover?". The home page keeps the general seven; the
   service-specific ones are on the pages that own them.                     */
export const FAQ = {
  title: 'Questions we get asked',
  items: [
    { q: 'What thickness can you laser cut?',
      a: 'On the DXTECH fiber laser: mild steel to 20 mm on oxygen, stainless to 10 mm on nitrogen, aluminium to 8 mm, and galvanised sheet to 4 mm. The bed is 3 000 × 1 500 mm and tolerance is ± 0.1 mm, repeating to ± 0.03 mm.' },
    { q: 'What file formats do you accept for cutting?',
      a: 'DXF, DWG, STEP and PDF.' },
    { q: 'Can you cut stainless steel?',
      a: 'Yes. The DXTECH fiber laser cuts stainless to 10 mm on nitrogen, and the workshop folds it to 3 000 mm and fabricates it to drawing — handrails, balustrades and sheet work.' },
    { home: true, q: 'How long does a quotation take?',
      a: 'Enquiries are acknowledged the same working day, and a written quotation follows within the week. Where the job needs someone on site first, the site visit is arranged within two working days.' },
    { home: true, q: 'How long does a steel structure take?',
      a: 'A portal frame programme runs six to ten weeks. A written quotation comes within the week of your enquiry, and a site visit is arranged within two working days where the job needs one.' },
    { q: 'Do you deliver outside Harare?',
      a: 'Yes — nationally, with transport priced per load. Erection is also covered nationally.' },
    { q: 'How big a lift can you do?',
      a: 'Kingson runs one telescopic mobile crane with a 25-tonne lifting capacity, used both on our own erection work and hired for other jobs.' },
    { q: 'What roof sheeting do you supply?',
      a: 'IBR at 686 mm cover width over five ribs, and corrugated at 762 mm over 10.5 corrugations. IBR is stocked in 0.47, 0.53 and 0.58 mm; corrugated in 0.4, 0.47 and 0.53 mm. Sheets are cut to 12 m and supplied galvanised or pre-painted.' },
    { q: 'What roof pitch do I need?',
      a: 'IBR goes down to 5°, or 7° where side laps are used. Corrugated needs 10°, or 12° when exposed. Corrugated can be curved from a 6 m radius, sprung on site.' },
    { q: 'Can you make flashings to match?',
      a: 'Yes — ridge, barge and valley are standard, and custom folding runs to 3 000 mm in 0.4 to 3.0 mm mild steel, galvanised, stainless or aluminium. Three to five days on a stock gauge.' },
    { q: 'Where is the workshop?',
      a: 'No. 1262 Tynwald Industries, Harare. Open Monday to Saturday, 07:30 to 17:00.' },
    { home: true, q: 'How do I get a price?',
      a: 'Send drawings or a description by WhatsApp on +263 772 262 869, or email admin1@kingsonengineering.co.zw. Technical drawings can go to technical@kingsonengineering.co.zw. Enquiries are acknowledged the same working day.' },
    { home: true, q: 'Where is Kingson Engineering based?',
      a: 'Kingson Engineering trades as Kingson Trading (Pvt) Ltd and works from one workshop at No. 1262 Tynwald Industries, Harare, Zimbabwe. It is open Monday to Saturday, 07:30 to 17:00, and enquiries reach Mr Murandu.' },
    { home: true, q: 'What areas do you cover?',
      a: 'Harare, and nationally across Zimbabwe. Erection is covered nationally and delivery outside Harare is priced per load.' },
    { home: true, q: 'Can I get a price without drawings?',
      a: 'Yes. Send the measurements and a photograph of the site, or a description of what you need. Where the job needs someone on site, a site visit is arranged within two working days, and a written quotation follows within the week.' },
    { q: 'Do you hire out the crane on its own?',
      a: 'Yes. The 25-tonne telescopic mobile crane works Kingson\u2019s own erection contracts and is hired out for other jobs. Tell us the load, the site access and the date.' },
    { home: true, q: 'What can Kingson Engineering do?',
      a: 'Six things: structural steelwork, roof steelwork and trusses, fiber laser cutting, balustrades and gates, stainless fabrication, and mobile cranage. All of it is fabricated at the Tynwald workshop and erected with Kingson\u2019s own crane.' }
  ]
};

/** The seven the home page asks. */
export const homeFaq = () => FAQ.items.filter((i) => i.home);


export const CONTACT = {
  title: 'Talk to us.',
  lede: 'Call the workshop during working hours, or send a message any time.',
  labels: {
    phone: 'Mobile', whatsapp: 'WhatsApp', office: 'Office',
    email: 'Enquiries', emailTechnical: 'Drawings and technical',
    address: 'Workshop', hours: 'Open', contactPerson: 'Ask for'
  }
};

export const NAV = {
  services: 'What we do', specs: 'Specifications',
  contact: 'Contact', quote: 'Get a price', call: 'Call', whatsapp: 'WhatsApp'
};
