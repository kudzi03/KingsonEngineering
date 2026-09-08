/* ═══════════════════════════════════════════════════════════════════════════
   content/copy.js — every customer-facing string
   ═══════════════════════════════════════════════════════════════════════════
   No copy is buried in animation code. Scene titles are subject descriptions
   of what is in the photograph, not service claims: V2 §15 forbids asserting
   an operating process, a capability or a capacity that is not verified.
   ═══════════════════════════════════════════════════════════════════════════ */

export const OPENING = {
  title: ['Built around', 'your work.'],   // §6: proposed positioning, not a claim
  context: 'Engineering & fabrication · Zimbabwe'
};

/* Two lines maximum, sentence case, no ghost text (§6). */
export const SCENE_TITLES = {
  frame: ['Structural', 'steel'],
  roof:  ['Roof steel'],
  cut:   ['Laser', 'cutting'],
  yard:  ['Cranage']
};

/* Small labels under a settled subject. Descriptions of the picture only. */
export const SCENE_LABELS = {
  cut:  'Machine detail',
  yard: 'Discuss access and lifting requirements.'   // an invitation, not a capacity
};

export const VIEWS = {
  title: 'Selected views',
  /* Neutral captions. No project name, client, value, date or location —
     none has been supplied, and a photograph is not a commission. */
  panels: [
    { asset: 'crane',      caption: 'Cranage · photograph' },
    { asset: 'portalFrame', caption: 'Structural steel · photograph' },
    { asset: 'roofFrame',  caption: 'Roof structure · photograph' }
  ]
};

export const BRIEF = {
  title: ['Bring the', 'brief.'],
  lede: 'Tell us what you need to make, cover or lift.',
  /* Prompts for the customer. Deliberately NOT a description of Kingson's
     delivery stages — that process is not verified. */
  rows: [
    ['The work',      'A description or drawing'],
    ['The place',     'Location and access'],
    ['The questions', 'What still needs to be resolved']
  ]
};

export const ENQUIRY = {
  title: ['Start a', 'conversation.'],
  fields: {
    name:        'Name',
    contact:     'Email or phone',
    scope:       'Your requirement',
    description: 'Tell us about the work',
    location:    'Location',
    timing:      'When you would like it done'
  },
  disclosure: 'Add location or timing',
  files: {
    label: 'Reference files',
    note:  'Files stay on this device. Attach them in your email or WhatsApp message.',
    choose: 'Choose files',
    remove: 'Remove'
  },
  review:   'Review enquiry',
  edit:     'Edit details',
  draftHead: 'Your draft is ready.',
  actions: { email: 'Open email', whatsapp: 'Open WhatsApp', copy: 'Copy enquiry' },
  copied:   'Enquiry copied.',
  handedOff: 'Complete sending in your email or WhatsApp app.',
  /* Shown instead of dead handoff buttons when no recipient is verified.
     This is honest staging behaviour, not a launch-ready substitute. */
  noRecipient: 'Contact details are being confirmed. Copy your enquiry and send it once they are published.',
  errors: {
    name:    'Add a name so we know who to reply to.',
    contact: 'Add an email address or a phone number.',
    scope:   'Say briefly what the work is.',
    summary: 'Check the highlighted fields.'
  }
};

export const NAV = {
  wordmark: ['KINGSON', 'ENGINEERING'],
  links: [
    { id: 'work',    label: 'Work' },
    { id: 'menu',    label: 'Menu' },
    { id: 'enquire', label: 'Enquire' }
  ],
  menu: [
    { id: 'frame', label: 'Structural steel' },
    { id: 'roof',  label: 'Roof steel' },
    { id: 'cut',   label: 'Laser cutting' },
    { id: 'yard',  label: 'Cranage' },
    { id: 'views', label: 'Selected views' },
    { id: 'enquiry', label: 'Enquiry' }
  ],
  close: 'Close',
  viewPhotograph: 'View photograph'
};
