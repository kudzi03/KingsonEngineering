/* ═══════════════════════════════════════════════════════════════════════════
   content/services.js — the dedicated service routes
   ═══════════════════════════════════════════════════════════════════════════

   The homepage was carrying all of the site's search responsibility on one
   URL. These give each major service its own indexable page.

   EVERY FIGURE HERE IS ALREADY CONFIRMED. Nothing on a service page is a new
   claim: the specification groups are pulled straight out of SPECS in copy.js
   (the transcript of the returned document), the process is §7 verbatim, and
   the service area is what §6 states. A service page is a different
   ARRANGEMENT of confirmed facts, never an extension of them.

   WHY FIVE AND NOT SEVEN

   Balustrades and gates, and stainless fabrication, are both confirmed
   services — but the only figures Kingson has confirmed for either are the
   3 000 mm fold length, the 0.4–3.0 mm material range and the 10 mm stainless
   laser capacity, and there is no photograph of either. Three pages sharing
   four numbers and no imagery would be three thin duplicates, which is the
   one thing a service-page architecture must not produce. Both are covered in
   depth inside `/steel-fabrication`, each with its own heading and anchor, and
   both are linked by name from the homepage and from the other service pages.
   When Kingson supplies photographs of that work, splitting them out is a
   matter of adding two entries here.

   `specGroups` names groups in SPECS; `faq` names questions in FAQ. Both are
   referenced by content rather than copied, so a correction to the transcript
   reaches every page that shows it.
   ═══════════════════════════════════════════════════════════════════════════ */

export const SERVICES = [
  {
    slug: 'structural-steel-harare',
    nav: 'Structural steel',
    /* Matches the confirmed service name in CAPABILITIES, so the Service
       schema on this page and the one on the homepage describe one thing. */
    serviceName: 'Structural steelwork',
    title: 'Structural Steel Fabrication & Erection, Harare | Kingson',
    description: 'Portal frames, columns, rafters and purlins fabricated in our Harare workshop and erected with our own 25-tonne crane. Six to ten weeks from order.',
    h1: 'Structural steel fabrication and erection in Harare',
    eyebrow: 'Structural steelwork',
    hero: 'portalFrame',
    intro: 'Kingson Engineering fabricates structural steelwork at No. 1262 Tynwald Industries in Harare and erects it on site with its own mobile crane. Portal frames, columns, rafters and purlins, set out from your drawings and put up by the same company that made them.',
    figures: [['Portal frame programme', 'six to ten weeks from order'],
              ['Erection', 'Harare and nationally'],
              ['Own crane', '25 tonnes, telescopic mobile']],
    sendTitle: 'What to send for a structural steel quotation',
    send: ['Drawings in DXF, DWG, STEP or PDF — or the span, height and bay spacing if drawings do not exist yet.',
           'The site address, and anything tight about access for a crane and a delivery vehicle.',
           'Whether you need fabrication only, or fabrication and erection.'],
    specGroups: ['cranage'],
    /* The only confirmed figures that bear on structural steelwork are the
       crane's, and a section headed "Full specification" over four crane rows
       reads as though the crane WERE the structural specification. Kingson has
       confirmed no spans, sections, grades, tonnages or erection limits — a
       fabricator working to a client's drawings would not have them — so this
       page names the section for what it actually contains instead of
       inventing a table to fill it. */
    spec: {
      eyebrow: 'Erection capability',
      head: 'The plant that puts it up.',
      lede: 'Structural steelwork is set out from your drawings, so the sections, grades and spans come from your engineer rather than from a catalogue here. What Kingson confirms is the plant that erects it.'
    },
    faq: ['How long does a steel structure take?', 'Do you deliver outside Harare?',
          'How big a lift can you do?'],
    related: ['roofing-and-trusses', 'mobile-cranage-harare', 'fiber-laser-cutting-harare'],
    aside: 'roofFrame'
  },

  {
    slug: 'roofing-and-trusses',
    nav: 'Roofing and trusses',
    serviceName: 'Roof steelwork and trusses',
    title: 'Roof Trusses, IBR & Corrugated Sheeting, Harare | Kingson',
    description: 'Roof trusses, purlins and sheeting. IBR at 686 mm cover, corrugated at 762 mm, cut to 12 m, galvanised or pre-painted. Flashings folded to match.',
    h1: 'Roof steelwork, trusses and sheeting',
    eyebrow: 'Roofing',
    hero: 'roofTrusses',
    intro: 'Trusses, purlins and sheeting for long-span roofs — new build or re-roof. Both profiles are cut to length in the workshop before they leave it, and the flashings are folded to match the roof they go on.',
    figures: [['IBR cover width', '686 mm over five ribs'],
              ['Corrugated cover width', '762 mm over 10.5 corrugations'],
              ['Maximum sheet length', 'cut to 12 m']],
    sendTitle: 'What to send for a roofing quotation',
    send: ['The floor area to be covered, and the roof pitch you want.',
           'Whether this is a new build or a re-roof, and whether the walls are already up.',
           'The profile and finish if you have decided — IBR or corrugated, galvanised or pre-painted.'],
    specGroups: ['ibr', 'corrugated', 'flashings'],
    /* The two sections are drawn to scale from these same figures. */
    profiles: true,
    faq: ['What roof sheeting do you supply?', 'What roof pitch do I need?',
          'Can you make flashings to match?'],
    related: ['structural-steel-harare', 'steel-fabrication', 'mobile-cranage-harare'],
    aside: 'roofFrame'
  },

  {
    slug: 'fiber-laser-cutting-harare',
    nav: 'Fiber laser cutting',
    serviceName: 'Fiber laser cutting',
    title: 'Fiber Laser Cutting in Harare — DXTECH | Kingson',
    description: 'Plate and sheet cut on a DXTECH fiber laser in Harare. 3 000 × 1 500 mm bed, mild steel to 20 mm, ± 0.1 mm. Send DXF, DWG, STEP or PDF.',
    h1: 'Fiber laser cutting in Harare',
    eyebrow: 'Laser cutting',
    hero: 'laserFloor',
    intro: 'Plate and sheet cut on a DXTECH fiber laser at our Tynwald workshop, nested from the drawing you send. Mild steel, stainless, aluminium and galvanised sheet, cut to ± 0.1 mm on a 3 000 × 1 500 mm bed.',
    figures: [['Bed size', '3 000 × 1 500 mm'],
              ['Mild steel', 'to 20 mm on oxygen'],
              ['Cutting tolerance', '± 0.1 mm, repeating to ± 0.03 mm']],
    sendTitle: 'What to send for a laser cutting quotation',
    send: ['A DXF, DWG, STEP or PDF of the part. A flat DXF cuts fastest.',
           'The material and thickness — mild steel, stainless, aluminium or galvanised sheet.',
           'The quantity, and whether you want the parts deburred or left as cut.'],
    specGroups: ['laser'],
    bed: true,
    faq: ['What thickness can you laser cut?', 'What file formats do you accept for cutting?',
          'Can I get a price without drawings?'],
    related: ['steel-fabrication', 'structural-steel-harare', 'roofing-and-trusses'],
    strip: ['gantry', 'cuttingHead', 'nestingStation']
  },

  {
    slug: 'steel-fabrication',
    nav: 'Fabrication',
    serviceName: 'Balustrades and gates',
    /* This page covers two confirmed services. The Service schema names both
       rather than pretending it is one. */
    alsoServes: ['Stainless fabrication'],
    title: 'Steel Fabrication, Balustrades & Gates, Harare | Kingson',
    description: 'Balustrading, handrails, gates, stainless work and custom flashings, folded in Harare to 3 000 mm in 0.4 – 3.0 mm steel or aluminium.',
    h1: 'Steel fabrication, balustrades, gates and stainless',
    eyebrow: 'Fabrication',
    hero: 'gantry',
    intro: 'Balustrading, handrails, gates and stainless work, fabricated to your opening and finish. Sheet is folded in-house to 3 000 mm, and flashings are made to match the roof they go on rather than ordered in a standard length.',
    figures: [['Maximum fold length', '3 000 mm'],
              ['Material range', '0.4 – 3.0 mm'],
              ['In', 'mild steel · galvanised · stainless · aluminium']],
    sendTitle: 'What to send for a fabrication quotation',
    send: ['The opening dimensions, and a photograph of the site or a sketch.',
           'The grade and thickness for stainless work, and the finish you want.',
           'A drawing if one exists — DXF, DWG, STEP or PDF all cut straight from file.'],
    specGroups: ['flashings'],
    folds: true,
    /* Two confirmed services get their own heading and anchor here rather
       than a thin page each. See the note at the top of this file. */
    parts: [
      { id: 'balustrades', title: 'Balustrades, handrails and gates',
        body: 'Fabricated to your opening and finish. Send the opening dimensions and a photograph of the site, or a sketch, and we will price it.' },
      { id: 'stainless', title: 'Stainless fabrication',
        body: 'Stainless sheet and section work, cut, folded and fabricated to drawing. Stainless is cut on the fiber laser to 10 mm on nitrogen and folded to the same 3 000 mm as everything else.' },
      { id: 'flashings', title: 'Flashings and custom folding',
        body: 'Ridge, barge and valley are standard items. Custom folds run to 3 000 mm across the full material range, and a stock gauge is three to five days.' }
    ],
    faq: ['Can you make flashings to match?', 'What thickness can you laser cut?',
          'Can I get a price without drawings?'],
    related: ['fiber-laser-cutting-harare', 'roofing-and-trusses', 'structural-steel-harare']
  },

  {
    slug: 'mobile-cranage-harare',
    nav: 'Mobile cranage',
    serviceName: 'Mobile cranage',
    title: '25-Tonne Mobile Crane Hire, Harare | Kingson',
    description: 'A 25-tonne telescopic mobile crane for hire in Harare and nationally, worked on our own erection contracts. Transport priced per load.',
    h1: 'Mobile cranage and steel erection',
    eyebrow: 'Cranage',
    hero: 'crane',
    intro: 'Kingson runs one telescopic mobile crane with a 25-tonne lifting capacity. It works our own erection contracts and is hired out for other jobs, in Harare and nationally, with transport priced per load.',
    figures: [['Lifting capacity', '25 tonnes'],
              ['Crane type', 'telescopic mobile'],
              ['Area', 'Harare and nationally']],
    sendTitle: 'What to tell us for a cranage quotation',
    send: ['The load — what it is and roughly what it weighs.',
           'The site address and the access: gate width, overhead lines, ground conditions.',
           'The date you need it, and for how long.'],
    specGroups: ['cranage'],
    faq: ['How big a lift can you do?', 'Do you deliver outside Harare?',
          'Do you hire out the crane on its own?'],
    related: ['structural-steel-harare', 'roofing-and-trusses', 'steel-fabrication']
  }
];

export const BY_SLUG = Object.fromEntries(SERVICES.map((s) => [s.slug, s]));

/* Shared copy for the parts of a service page that are the same everywhere.
   The process is §7 of the returned document, which is already in PROCESS —
   this is only the framing around it. */

export const SERVICE_PAGE = {
  breadcrumbHome: 'Home',
  breadcrumbServices: 'What we do',
  figuresTitle: 'Confirmed capability',
  specTitle: 'Full specification',
  specLede: 'Every figure below was checked and signed off by Kingson.',
  processTitle: 'What happens after you send it',
  /* `{n}` is the number of commitments this particular page shows. A service
     with no confirmed programme shows four, not five — see PROCESS in
     content/copy.js — and the sentence has to say the number it is looking at. */
  processLede: '{n} commitments Kingson confirmed in writing. Each applies to this service exactly as it applies to any other.',
  areaTitle: 'Where we work',
  areaBody: 'The workshop is at No. 1262 Tynwald Industries, Harare, and it is open Monday to Saturday, 07:30 – 17:00. Erection and delivery are national, with transport priced per load.',
  relatedTitle: 'Related services',
  faqTitle: 'Questions we get asked about this',
  ctaTitle: 'Send us the brief.',
  ctaLede: 'Tell us what you need. Enquiries are acknowledged the same working day.',
  backHome: 'Everything Kingson does'
};
