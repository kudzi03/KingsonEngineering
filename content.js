/* ═══════════════════════════════════════════════════════════════════════════
   KINGSON ENGINEERING — CONTENT / CONFIG LAYER
   ═══════════════════════════════════════════════════════════════════════════

   Plain script, no modules, no build step. Loaded before assets/site.js and
   assigned to window.KINGSON.

   ── WHERE TO CHANGE WHAT ───────────────────────────────────────────────────

     Phone, email, address, hours, WhatsApp number   → COMPANY, in this file
     Enquiry form dropdown options                   → ENQUIRY, in this file
     Withheld technical figures                      → PROVISIONAL, in this file
     Everything the visitor reads as prose           → index.html

   Prose lives in index.html on purpose. Text built by JavaScript is rendered
   by Google but NOT by most AI answer engines, and this site is meant to be
   found by both. index.html is one file with one clearly commented section
   per part of the page — search it for VERIFY_WITH_KINGSON.

   ── THE FLAGS ──────────────────────────────────────────────────────────────

   VERIFY_WITH_KINGSON   Marks a value nobody at the company has confirmed.
                         Confirm it, then delete the comment.

   PROVISIONAL           Every technical figure the previous site published
                         that the README recorded as unconfirmed:

                           "These are standard Southern African profile
                            figures, but they have not been confirmed by the
                            company. A contractor will build to them."

                         Nothing in PROVISIONAL reaches the page while
                         SHOW_PROVISIONAL_SPECS is false. The site states the
                         capability without the number, and says the figures
                         are issued with the quotation.

   ── CLAIMS REMOVED FROM THE VISIBLE SITE ───────────────────────────────────
   Kept in PROVISIONAL.promises as a record of what was taken out:

     · Quotations inside two working days
     · Company profile, tax clearance, CR6 and CR14 the same day
     · 3–5 day lead times on stock gauges
     · Site visits in greater Harare within two working days
     · Enquiries acknowledged the same working day; quotation within the week
     · Six to ten weeks for a single-span portal frame shed

   None of these appears anywhere in index.html. Do not reinstate any of them
   without written sign-off — a contractor will programme to them.
   ═══════════════════════════════════════════════════════════════════════════ */

window.KINGSON = (function () {
  'use strict';

  /* Flip to true only once every figure in PROVISIONAL is confirmed.
     The roofing and laser spec tables appear on the page when you do. */
  var SHOW_PROVISIONAL_SPECS = false;


  /* ─── Company ───────────────────────────────────────────────────────────
     Phone, email and Facebook were live on the previous site and are in use.
     Address, hours and coordinates were carried over unconfirmed. */
  var COMPANY = {
    name:      'Kingson Engineering',
    legal:     'Kingson Trading (Pvt) Ltd',
    tagline:   'Steelwork Specialists',

    mobile:    '+263 772 262 869',
    mobileRaw: '+263772262869',
    whatsapp:  '263772262869',
    office:    '+263 242 304 341',
    officeRaw: '+263242304341',
    email:     'kingsonnkm@gmail.com',
    facebook:  'https://www.facebook.com/share/18GoTdrLBD/',

    // VERIFY_WITH_KINGSON — street address as published on the previous site.
    address:   'No. 1262 Tynwald Industries',
    city:      'Harare',
    country:   'Zimbabwe',

    // VERIFY_WITH_KINGSON — approximate Harare coordinates, not a surveyed pin.
    geo: { lat: -17.8252, lng: 31.0335 },

    // VERIFY_WITH_KINGSON — trading hours carried over unconfirmed.
    // Drives the "workshop open / closed" indicator in the header.
    hours: [
      { label: 'Mon – Fri', days: [1, 2, 3, 4, 5], open: '07:30', close: '17:00' },
      { label: 'Saturday',  days: [6],             open: '08:00', close: '12:30' }
    ],

    origin: 'https://kingson-engineering.vercel.app'
  };


  /* ─── Enquiry ───────────────────────────────────────────────────────────
     SUBMISSION IS NOT SERVER-SIDE.

     mode 'handoff'  — the form composes a message and opens WhatsApp or the
                       visitor's mail client with it written out. The visitor
                       presses send. Nothing is stored, nothing is persisted,
                       no database is faked. This is what is live.

     mode 'endpoint' — POST the same payload to ENQUIRY.endpoint as JSON. The
                       payload shape is already what a CRM would want (see
                       buildPayload in assets/site.js). Not built — Demo 2.

     To connect a backend later: set mode to 'endpoint', set endpoint to the
     URL, and nothing else on the page has to change. */
  var ENQUIRY = {
    mode: 'handoff',
    endpoint: null,

    scopes: [
      'Structural steel',
      'Roof steelwork',
      'Roof sheeting',
      'Laser cutting',
      'Stainless & fabrication',
      'Cranage',
      'Not sure yet'
    ],

    timing: [
      'As soon as possible',
      'Within a month',
      'One to three months',
      'Later than that',
      'Budget stage only'
    ],

    contactPrefs: ['WhatsApp', 'Phone call', 'Email']
  };


  /* ═════════════════════════════════════════════════════════════════════════
     PROVISIONAL — NOT RENDERED while SHOW_PROVISIONAL_SPECS is false
     ═════════════════════════════════════════════════════════════════════════
     Preserved verbatim so nothing is lost. Confirm, then flip the flag.
     ═════════════════════════════════════════════════════════════════════════ */
  var PROVISIONAL = {

    /* Roof sheeting profiles. Rendered as three spec tables in the roofing
       section when the flag is on. */
    profiles: [
      {
        name: 'IBR Sheeting', use: 'Industrial · low pitch',
        rows: [
          ['Cover width',        '686 mm',                'Five ribs per sheet'],
          ['Rib height / pitch', '36 mm / 200 mm',        'Trapezoidal'],
          ['Gauges',             '0.47 · 0.53 · 0.58 mm', 'Galvanised or pre-painted'],
          ['Minimum roof pitch', '5°',                    '7° with side laps'],
          ['Max purlin spacing', '1 800 mm',              '0.53 mm, single span'],
          ['Sheet length',       'Cut to 12 m',           'No end laps']
        ]
      },
      {
        name: 'Corrugated Sheeting', use: 'Domestic · curved work',
        rows: [
          ['Cover width',          '762 mm',               '10.5 corrugations'],
          ['Crest height / pitch', '17.5 mm / 76 mm',      'Sinusoidal'],
          ['Gauges',               '0.4 · 0.47 · 0.53 mm', 'Galvanised or Chromadek-type'],
          ['Minimum roof pitch',   '10°',                  '12° for exposed sites'],
          ['Max purlin spacing',   '1 200 mm',             '0.47 mm, single span'],
          ['Curving',              'From 6 m radius',      'Sprung curve on site']
        ]
      },
      {
        name: 'Custom & Flashings', use: 'Bespoke · finishing',
        rows: [
          ['Fold length',    'Up to 3 000 mm',         'Press brake'],
          ['Material range', '0.4 – 3.0 mm',           'MS · GI · SS · Al'],
          ['Standard items', 'Ridge · Barge · Valley', 'Matched to sheet colour'],
          ['Concealed fix',  'To specification',       'Clip-fix trays on request']
          /* ['Lead time', '3 – 5 days', 'Stock gauge, confirmed order'] ← REMOVED.
             That is a delivery promise, not a specification. It lives in
             PROVISIONAL.promises. Do not reinstate it as a spec row. */
        ]
      }
    ],

    /* Fiber laser. The make is legible on the machine in the photographs and
       is stated on the page. Everything below is not, and is withheld. */
    laser: {
      machine:       'DXTECH fiber laser',   // ← confirmed from the photographs
      bed:           '3000 × 1500 mm',
      tolerance:     '± 0.1 mm positional',
      repeatability: '± 0.03 mm',
      envelope: [
        ['Mild steel',       '20 mm', 'Oxygen',   'Square, light oxide'],
        ['Stainless steel',  '10 mm', 'Nitrogen', 'Bright, oxide-free'],
        ['Aluminium',        '8 mm',  'Nitrogen', 'Clean, minimal burr'],
        ['Galvanised sheet', '4 mm',  'Nitrogen', 'Coating preserved']
      ]
    },

    /* Time-based commitments. Treat these with MORE caution than the profile
       figures — they are promises, not measurements. They stay off the page
       even when SHOW_PROVISIONAL_SPECS is true; reinstating one is a
       deliberate edit to index.html. */
    promises: {
      quotationTurnaround: 'Quotations inside two working days',
      documents:           'Company profile, tax clearance, CR6 and CR14 the same day',
      sheetingLeadTime:    '3–5 working days on stock gauges',
      siteVisit:           'Site visits in greater Harare within two working days',
      acknowledgement:     'Enquiries acknowledged the same working day',
      writtenQuote:        'Written quotation within the week',
      portalFrame:         'Six to ten weeks from approved drawings, single-span shed'
    },

    /* Never published, and must not be until documented. Listed so that
       nobody invents them later to fill a gap in the layout. */
    neverStateWithoutProof: [
      'Lifting capacity, boom length, make, model or year of the crane',
      'Years in business, staff numbers, floor area',
      'Certifications, CIFOZ membership, company registration numbers',
      'Client names, contract values, project tonnages, completion dates',
      'Guarantees, warranties or insurance cover'
    ]
  };


  /* ─── Photography ledger ────────────────────────────────────────────────
     Which images are Kingson's own work and which are not.

     material-tube and material-sheet are stock material collages. The
     previous site captioned them as Kingson projects — "Multi-Storey Process
     Structure, Harare" and "Kingson Engineering mobile crane" — which they
     are not. They now appear only in a strip labelled "material reference",
     and never in the project grid.

     VERIFY_WITH_KINGSON — if Kingson has real photographs of tube stock and
     sheet stock on their own floor, swap these two out and delete the strip. */
  var PHOTOGRAPHY = {
    own: [
      'portal-frame',     // portal frame under erection, own crane in shot
      'crane',            // the Kingson-branded telescopic mobile crane
      'roof-frame',       // pitched roof steelwork, sheeted
      'roof-trusses',     // long-span trusses over an industrial floor
      'laser-machine',    // DXTECH fiber laser, workshop
      'laser-floor',      // the same machine, floor view
      'nesting-station',  // control station, part programme on screen
      'gantry',           // gantry and cable chain
      'cutting-head'      // cutting head over plate
    ],
    stock: [
      'material-tube',    // NOT Kingson work — stock collage, tube & section
      'material-sheet'    // NOT Kingson work — stock collage, sheet & plate
    ]
  };


  return {
    SHOW_PROVISIONAL_SPECS: SHOW_PROVISIONAL_SPECS,
    COMPANY: COMPANY,
    ENQUIRY: ENQUIRY,
    PROVISIONAL: PROVISIONAL,
    PHOTOGRAPHY: PHOTOGRAPHY
  };
})();
