/* ═══════════════════════════════════════════════════════════════════════════
   content/company.js — business values behind publication gates
   ═══════════════════════════════════════════════════════════════════════════

   Primary source: the returned "Information required" document, completed by
   Kingson and dated 1 September 2026. Every `owner_verified` value below is
   ticked or handwritten on that document. See SOURCE_OF_TRUTH.md.

     user_context    supplied by the owner in conversation
     observed_photo  visible in a photograph Kingson supplied
     owner_verified  confirmed on the returned document — publishable as fact
     draft           written for approval, never confirmed — NOT published
     unreadable      returned but cannot be transcribed safely — NOT published

   `publish()` returns null for anything not cleared, and every consumer
   handles null. That is why an unreadable Facebook URL produces no link at all
   rather than a broken one.
   ═══════════════════════════════════════════════════════════════════════════ */

const FIELDS = {
  /* ── identity ─────────────────────────────────────────────────────────── */
  name: {
    value: 'Kingson Engineering', status: 'owner_verified',
    evidence: 'Returned document §1, trading name, ticked.'
  },
  legalName: {
    value: 'Kingson Trading (Pvt) Ltd', status: 'owner_verified',
    evidence: 'Returned document §1, registered name, ticked.'
  },
  tagline: {
    value: 'Steelwork Specialists', status: 'owner_verified',
    evidence: 'The logo artwork supplied by the owner, 12 September 2026.'
  },

  /* ── how a customer reaches Kingson ────────────────────────────────────
     The draft published kingsonnkm@gmail.com. Kingson struck it out and wrote
     two addresses on its own domain. The gmail address is gone. */
  email: {
    value: 'admin1@kingsonengineering.co.zw', status: 'owner_verified',
    evidence: 'Returned document §1, handwritten, replacing the struck-out gmail address.'
  },
  emailTechnical: {
    value: 'technical@kingsonengineering.co.zw', status: 'owner_verified',
    evidence: 'Returned document §1, handwritten, second address given for enquiries.'
  },
  phone: {
    value: '+263 772 262 869', status: 'owner_verified',
    evidence: 'Returned document §1, ticked. Also painted on the crane in the supplied photograph.'
  },
  whatsapp: {
    value: '263772262869', status: 'owner_verified',
    evidence: 'The same number, confirmed in §1 as the WhatsApp line.'
  },
  office: {
    value: '+263 242 304 341', status: 'owner_verified',
    evidence: 'Returned document §1, office landline, ticked.'
  },
  address: {
    value: 'No. 1262 Tynwald Industries, Harare', status: 'owner_verified',
    evidence: 'Returned document §1, ticked.'
  },
  hours: {
    /* The draft said nothing; the previous live site guessed Mon–Fri. Wrong. */
    value: 'Monday to Saturday, 07:30 – 17:00', status: 'owner_verified',
    evidence: 'Returned document §1, handwritten: "Monday - Saturday 0730hrs - 1700hrs".'
  },
  hoursSpec: {
    /* The same handwritten entry as `hours`, expressed for structured data.
       Not a second fact — one fact in two shapes. */
    value: { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
             opens: '07:30', closes: '17:00' },
    status: 'owner_verified',
    evidence: 'Returned document §1, the same handwritten entry as `hours`.'
  },
  contactPerson: {
    value: 'Mr Murandu', status: 'owner_verified',
    evidence: 'Returned document §1, "Who enquiries reach", handwritten.'
  },

  /* ── returned but not publishable ──────────────────────────────────────
     The printed facebook.com/share/18GoTdrLBD was struck out. The handwritten
     replacement reads facebook.com/share/186ZR… and the last five characters
     are genuinely ambiguous between zr05C, zroSC and zr0SC. A share URL is a
     case-sensitive random string: it cannot be inferred, and a wrong one sends
     customers nowhere. Kingson has been asked to send the link itself. */
  facebook: {
    value: null, status: 'unreadable',
    evidence: 'Returned document §1. Handwritten correction cannot be transcribed safely.'
  }
};

/* Values that belong to the project, not to the website. The person who
   returned the document is not a customer-facing contact, and their personal
   numbers are deliberately absent from FIELDS so they cannot leak into a
   render by accident. Recorded in SOURCE_OF_TRUTH.md §F only. */

export const VALUES = FIELDS;

/** Public value, or null when the field is not cleared to render as fact. */
export function publish(key) {
  const f = FIELDS[key];
  return f && (f.status === 'owner_verified' || f.status === 'user_context')
    ? f.value : null;
}

/** True only when a destination exists that an enquiry can actually reach. */
export function hasVerifiedRecipient() {
  return publish('email') !== null || publish('whatsapp') !== null;
}

export function recipients() {
  return {
    email: publish('email'),
    emailTechnical: publish('emailTechnical'),
    whatsapp: publish('whatsapp'),
    phone: publish('phone')
  };
}

/** Everything not cleared for publication, so a notice can name it. */
export function unverifiedKeys() {
  return Object.keys(FIELDS).filter((k) =>
    FIELDS[k].status !== 'owner_verified' && FIELDS[k].status !== 'user_context');
}
