/* ═══════════════════════════════════════════════════════════════════════════
   content/runtime-copy.js — the only strings the BROWSER needs
   ═══════════════════════════════════════════════════════════════════════════

   Everything else in content/copy.js is author-time: the renderer turns it
   into HTML and the browser never sees the source. These two are different.
   They are the strings that only exist once somebody does something — the
   enquiry form's states and errors, and the caption the photograph viewer
   shows when an image is opened — so they have to travel to the page.

   They used to live in copy.js, which meant `import { ENQUIRY }` pulled the
   whole content layer across: 23.5 KB of specification rows, FAQ answers and
   process copy, all of it already rendered into the HTML above it, for about
   two kilobytes of labels. Measured at 7.9 KB gzipped on every page load.

   copy.js re-exports both, so nothing that reads from there has to change,
   and tools/check-truth.js still sees one content surface.
   ═══════════════════════════════════════════════════════════════════════════ */

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
    laserCutting:   'Cutting sheet on the DXTECH laser',
    laserSparks:    'The head cutting, sparks off the nozzle',
    weldingBay:     'Welding in the fabrication bay',
    weldingHands:   'Grating welded up on the workshop floor',
    laserMachine:   'The machine from the loading side',
    crane:          'Our telescopic mobile crane'
  }
};

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
  optional: 'optional',
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
  filesNote: 'Your enquiry is logged with Kingson when you send it. Drawings are not — there is no upload here. Attach your DXF, DWG, STEP or PDF to the WhatsApp or email message this page prepares and it reaches the same estimator.',
  actions: {
    review: 'Send my enquiry',
    whatsapp: 'Send on WhatsApp',
    email: 'Send by email',
    copy: 'Copy the text'
  },
  choose: 'Choose one',
  draftTitle: 'Ready to send.',

  /* The form now actually reaches Kingson: the enquiry is written into their
     system and is on somebody's follow-up list. These three
     lines are the only place on the site that claims anything was sent, and
     they are only shown when the database has confirmed the row. */
  sending: 'Sending your enquiry…',
  /* The draft heading changes once the enquiry is already in: "ready to send"
     would be wrong there, because it has been. */
  draftAlsoTitle: 'Send it yourself as well, if you like.',
  sentTitle: 'Your enquiry has reached Kingson.',
  sentBody: 'It is logged with the office, and Kingson acknowledges enquiries the same working day. If you would rather also send it yourself — on WhatsApp or by email — the message is below.',
  /* Shown when the save failed. It must not read like a dead end: the handoff
     buttons underneath it still work, and they are how the enquiry gets
     through. */
  failedTitle: 'We could not log that automatically.',
  failedBody: 'Your enquiry has not been lost — it is written out below. Send it on WhatsApp or by email and it will reach the same estimator.',

  edit: 'Change something',
  copied: 'Copied. Paste it wherever you like.',
  handedOff: 'Your message is open in the app — press send there.',
  ack: 'Kingson acknowledges enquiries the same working day.',
  noRecipient: 'Contact details are being confirmed. Copy your enquiry and send it once they are published.',
  errors: {
    name:    'We need a name to reply to.',
    contact: 'A phone number or an email address, so we can come back to you.',
    contactFormat: 'That does not look like a full phone number or email address.',
    service: 'Pick the closest one — "not sure yet" is fine.',
    summary: 'A few things are missing.'
  }
};
