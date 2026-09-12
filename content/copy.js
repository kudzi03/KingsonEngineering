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
export const UPDATED = '2026-09-12';

export const EYEBROWS = {
  services: 'Six services',
  process:  'How it works',
  specs:    'Confirmed specifications',
  work:     'Photographs',
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
  /* The lede's promise is the one Kingson confirmed in §7. It is not a
     flourish; it is the commitment the office says it can meet every time. */
  actions: { quote: 'Get a price', call: 'Call', whatsapp: 'WhatsApp' }
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

export const CAPABILITIES = [
  {
    id: 'structural', photo: 'portalFrame',
    title: 'Structural steelwork',
    body: 'Portal frames, columns, rafters and purlins — fabricated in the workshop and erected on site with our own crane.',
    ask: 'Send drawings, or the span, height and bay spacing.',
    facts: [['Programme', 'six to ten weeks'],
            ['Erection', 'Harare and nationally']]
  },
  {
    id: 'roofing', photo: 'roofTrusses',
    title: 'Roof steelwork and trusses',
    body: 'Trusses, purlins and sheeting for long-span roofs, new build or re-roof. IBR and corrugated profiles, galvanised or pre-painted.',
    ask: 'Send the floor area, the pitch you want, and whether the walls are up.',
    facts: [['IBR cover', '686 mm, five ribs'],
            ['Corrugated cover', '762 mm, 10.5 corrugations']]
  },
  {
    id: 'cutting', photo: 'laserFloor',
    title: 'Fiber laser cutting',
    body: 'Plate and sheet cut on a DXTECH fiber laser, straight from your file. Mild steel, stainless, aluminium and galvanised sheet.',
    ask: 'Send a DXF, DWG, STEP or PDF with the material and thickness.',
    facts: [['Bed size', '3 000 × 1 500 mm'],
            ['Mild steel', 'to 20 mm']]
  },
  {
    id: 'balustrades', photo: null,
    plate: ['3 000 mm', 'maximum fold length'],
    title: 'Balustrades and gates',
    body: 'Balustrading, handrails and gates, fabricated to your opening and finish.',
    ask: 'Send the opening dimensions and a photograph of the site, or a sketch.',
    facts: [['Material', '0.4 – 3.0 mm sheet'],
            ['Also in', 'galvanised, stainless, aluminium']]
  },
  {
    id: 'stainless', photo: null,
    plate: ['10 mm', 'stainless, cut on nitrogen'],
    title: 'Stainless fabrication',
    body: 'Stainless sheet and section work — cut, folded and fabricated to drawing.',
    ask: 'Send a drawing with the grade and thickness you need.',
    facts: [['Laser bed', '3 000 × 1 500 mm'],
            ['Folding', 'to 3 000 mm']]
  },
  {
    id: 'cranage', photo: 'crane',
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
   nothing. They are the most valuable thing on this page.                    */

export const PROCESS = {
  title: 'What happens after you send it.',
  lede: 'Five commitments Kingson confirmed in writing. Each one is what the office holds to, every time.',
  steps: [
    { n: '01', title: 'Enquiry acknowledged',   body: 'Same working day.' },
    { n: '02', title: 'Site visit arranged',    body: 'Within two working days, where the job needs one.' },
    { n: '03', title: 'Written quotation',      body: 'Within the week.' },
    { n: '04', title: 'Portal frame programme', body: 'Six to ten weeks from order.' },
    { n: '05', title: 'Delivery outside Harare', body: 'Nationally, with transport priced per load.' }
  ],
  close: 'That is the whole sequence. It starts when you send the drawings.',
  closeAction: 'Send us the brief'
};

/* ── confirmed specifications ───────────────────────────────────────────────
   Every figure ticked in §2 – §6. Grouped so a buyer opens only the one they
   need rather than reading a wall of tables.                                 */

export const SPECS = {
  title: 'The numbers, confirmed.',
  lede: 'Kingson checked and signed off every figure below. Open the one you need.',
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

export const STRIP = [
  ['Fiber laser',  'DXTECH · 3 000 × 1 500 mm bed'],
  ['Cranage',      'One 25-tonne telescopic mobile crane'],
  ['Workshop',     'Tynwald Industries, Harare'],
  ['Enquiries',    'Acknowledged the same working day']
];

export const WORK = {
  title: 'Recent work',
  lede: 'Photographs from our own jobs and workshop.',
  captions: {
    portalFrame:    'Portal frame under erection',
    roofTrusses:    'Long-span trusses and purlins',
    roofFrame:      'Roof structure from inside',
    laserFloor:     'The DXTECH laser on the workshop floor',
    cuttingHead:    'Plate loaded on the laser bed',
    nestingStation: 'Nesting at the control station',
    gantry:         'Gantry and cable chain over the bed',
    laserMachine:   'The machine from the loading side',
    crane:          'Our telescopic mobile crane'
  }
};

/* ── the enquiry ────────────────────────────────────────────────────────────
   Field set derived from what Kingson actually needs to price a job: which of
   the six services, where, what it is, and whether drawings exist. Nothing is
   here because a CRM usually has it.                                         */

export const ENQUIRY = {
  title: 'Send us the brief.',
  lede: 'Tell us what you need. Enquiries are acknowledged the same working day.',
  fields: {
    name:        'Your name',
    company:     'Company or organisation',
    contact:     'Phone or email',
    service:     'What do you need?',
    location:    'Where is the site?',
    description: 'Describe the job',
    drawings:    'Do you have drawings?'
  },
  placeholders: {
    location: 'Town or suburb, and access if it is tight',
    description: 'Spans, heights, quantities — anything already decided.'
  },
  serviceOptions: [
    'Structural steelwork', 'Roof steelwork and trusses', 'Fiber laser cutting',
    'Balustrades and gates', 'Stainless fabrication', 'Mobile cranage',
    'More than one of these', 'Not sure yet'
  ],
  drawingOptions: [
    'Yes — DXF or DWG', 'Yes — STEP', 'Yes — PDF or a drawing on paper',
    'No drawings, just measurements', 'No — I need help working it out'
  ],
  /* §5 confirms the formats the laser accepts. Saying so up front saves a
     round trip, and the note is honest about what this page does with files. */
  filesNote: 'Drawings are accepted as DXF, DWG, STEP or PDF. Attach them to the message this page prepares — nothing is uploaded from here.',
  actions: {
    review: 'Review my enquiry',
    whatsapp: 'Send on WhatsApp',
    email: 'Send by email',
    copy: 'Copy the text'
  },
  choose: 'Choose one',
  draftTitle: 'Ready to send.',
  edit: 'Change something',
  copied: 'Copied. Paste it wherever you like.',
  handedOff: 'Your message is open in the app — press send there.',
  ack: 'Kingson acknowledges enquiries the same working day.',
  noRecipient: 'Contact details are being confirmed. Copy your enquiry and send it once they are published.',
  errors: {
    name:    'We need a name to reply to.',
    contact: 'A phone number or an email address, so we can come back to you.',
    service: 'Pick the closest one — "not sure yet" is fine.',
    summary: 'A few things are missing.'
  }
};

/* ── FAQ ────────────────────────────────────────────────────────────────────
   Every answer is a confirmed fact. Phrased the way someone would ask an
   assistant rather than the way they would type a search query, because that
   is what an answer engine matches against.                                  */

export const FAQ = {
  title: 'Questions we get asked',
  items: [
    { q: 'What thickness can you laser cut?',
      a: 'On the DXTECH fiber laser: mild steel to 20 mm on oxygen, stainless to 10 mm on nitrogen, aluminium to 8 mm, and galvanised sheet to 4 mm. The bed is 3 000 × 1 500 mm and tolerance is ± 0.1 mm, repeating to ± 0.03 mm.' },
    { q: 'What file formats do you accept for cutting?',
      a: 'DXF, DWG, STEP and PDF.' },
    { q: 'How long does a steel structure take?',
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
    { q: 'How do I get a price?',
      a: 'Send drawings or a description by WhatsApp on +263 772 262 869, or email admin1@kingsonengineering.co.zw. Technical drawings can go to technical@kingsonengineering.co.zw. Enquiries are acknowledged the same working day.' }
  ]
};

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
  services: 'What we do', specs: 'Specifications', work: 'Work',
  contact: 'Contact', quote: 'Get a price', call: 'Call', whatsapp: 'WhatsApp'
};
