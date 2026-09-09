/* ═══════════════════════════════════════════════════════════════════════════
   content/copy.js — every customer-facing string
   ═══════════════════════════════════════════════════════════════════════════

   Written for the person who arrived because they need something made, roofed,
   cut or lifted. They want three things, fast: is this the right company, can
   it do my job, how do I reach it. Every string below serves one of those.

   The truth rule has not changed. Each capability describes what is visible in
   Kingson's own photographs plus what a customer may ask for. No capacity, no
   tolerance, no lead time, no client, no certification, no year founded — none
   of that has been supplied, and an invitation is not a claim.
   ═══════════════════════════════════════════════════════════════════════════ */

/* Small centred eyebrows above each section heading, as in the reference. */
export const EYEBROWS = {
  services: 'What we make',
  process:  'How it works',
  work:     'Recent work',
  enquiry:  'Get a price',
  contact:  'Talk to us'
};

export const HERO = {
  title: 'Steel, roofing and cranage.',
  lede: 'Fabrication and erection for builders, farmers and industry across Zimbabwe. Send a drawing or a description — we will come back to you.',
  eyebrow: 'Engineering & fabrication'
};

/* The four things a customer can actually ask Kingson for. `ask` is the line
   that tells them what to send. */
export const CAPABILITIES = [
  {
    id: 'structural',
    asset: 'portalFrame',
    title: 'Structural steel',
    body: 'Portal frames, columns, rafters and purlins — fabricated in the workshop and erected on site with our own crane.',
    ask: 'Send drawings, or the span, height and bay spacing you need.'
  },
  {
    id: 'roofing',
    asset: 'roofTrusses',
    title: 'Roof steel',
    body: 'Trusses, purlins and sheeting for long-span roofs, new build or re-roof.',
    ask: 'Send the floor area, the pitch you want, and whether the walls are up.'
  },
  {
    id: 'cutting',
    asset: 'cuttingHead',
    title: 'Laser cutting',
    body: 'Plate and sheet cut on a fiber laser, straight from your file.',
    ask: 'Send a DXF or DWG, the material and the thickness.'
  },
  {
    id: 'cranage',
    asset: 'crane',
    title: 'Cranage',
    body: 'Mobile crane hire for lifting and placing steel, on our jobs or yours.',
    ask: 'Tell us the load, the site access and the date.'
  }
];

/* Three steps, all of them customer-side or already established elsewhere on
   this page. No turnaround, no lead time, no capacity: the site does not
   promise a date, because no date has been confirmed. */
export const PROCESS = {
  title: 'Three steps to a price.',
  lede: 'No drawings? A photo and a few dimensions is enough to start.',
  steps: [
    { n: '01', title: 'Send what you have',
      body: 'A drawing, a sketch, a photograph, or a description. Spans, heights and site access if you know them.' },
    { n: '02', title: 'We come back to you',
      body: 'We price the work and tell you anything else we need to know before starting.' },
    { n: '03', title: 'We make it and put it up',
      body: 'Fabricated in our own workshop, delivered and erected on site with our own crane.' }
  ]
};

export const WORK = {
  title: 'Recent work',
  lede: 'Photographs from our own jobs and workshop.',
  captions: {
    portalFrame:  'Portal frame under erection',
    roofTrusses:  'Long-span roof trusses and purlins',
    roofFrame:    'Roof structure from inside',
    cuttingHead:  'Fiber laser cutting plate',
    laserMachine: 'The laser in the workshop',
    crane:        'Our mobile crane on site'
  }
};

export const ENQUIRY = {
  title: 'Get a price.',
  lede: 'Tell us what you need. Attach a drawing if you have one — or just describe it.',
  fields: {
    name:        'Your name',
    contact:     'Phone or email',
    scope:       'What do you need?',
    description: 'Describe the job',
    location:    'Where is the site?',
    timing:      'When do you need it?'
  },
  placeholders: {
    scope: 'e.g. roof over a 20 × 40 m shed',
    description: 'Spans, heights, access, anything already decided.'
  },
  more: 'Add site and timing',
  files: {
    label: 'Drawings or photos',
    choose: 'Choose files',
    note: 'Files stay on your device. Attach them to the message you send.',
    remove: 'Remove'
  },
  actions: {
    review: 'Review my enquiry',
    whatsapp: 'Send on WhatsApp',
    email: 'Send by email',
    copy: 'Copy the text'
  },
  draftTitle: 'Ready to send.',
  edit: 'Edit',
  copied: 'Copied. Paste it wherever you like.',
  handedOff: 'Your message is open in the app — press send there.',
  errors: {
    name:    'We need a name to reply to.',
    contact: 'A phone number or an email address, so we can come back to you.',
    scope:   'A line about what you need.',
    summary: 'A few things are missing.'
  }
};

export const CONTACT = {
  title: 'Talk to us.',
  lede: 'Call during working hours, or send a message any time.',
  labels: {
    phone: 'Mobile', office: 'Office', email: 'Email',
    whatsapp: 'WhatsApp', address: 'Workshop', hours: 'Open'
  }
};

export const NAV = {
  work: 'Work', services: 'What we do', contact: 'Contact',
  call: 'Call', whatsapp: 'WhatsApp', enquire: 'Get a price'
};
