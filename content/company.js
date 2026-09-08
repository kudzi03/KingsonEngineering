/* ═══════════════════════════════════════════════════════════════════════════
   content/company.js — business values behind publication gates
   ═══════════════════════════════════════════════════════════════════════════

   V2 §15. A comment cannot stop an unverified claim from rendering, so every
   value carries a status and the interface asks for it by status rather than
   reading it directly.

     user_context    supplied by the site owner in conversation. Safe.
     observed_photo  visible in a photograph in this repository. Safe as a
                     description of the picture; never as ownership.
     draft           written for approval. Marketing tone only — never an
                     operational claim.
     owner_verified  confirmed by Kingson in writing. Only these may render
                     as factual business information.

   `publish()` returns null for anything not cleared for public rendering, and
   the interface is built to handle null — that is why the enquiry can show an
   honest "contact details are being confirmed" state instead of a dead button.
   ═══════════════════════════════════════════════════════════════════════════ */

const FIELDS = {
  /* ── cleared ──────────────────────────────────────────────────────────── */
  name:     { value: 'Kingson Engineering', status: 'user_context',
              evidence: 'Supplied by the site owner.' },
  sector:   { value: 'Engineering & fabrication · Zimbabwe', status: 'user_context',
              evidence: 'Supplied by the site owner.' },

  /* ── NOT cleared for publication ──────────────────────────────────────────
     Every one of these appears in the repository or a public directory, and
     the recovered "Information Required" PDF marks them as awaiting the
     owner's answer. Public listings conflict over the address and the legal
     name. They stay unpublished until Kingson confirms them in writing.

     Setting a status to 'owner_verified' here is the single switch that makes
     a value public — and it is the switch that turns the enquiry's recipient
     handoff buttons on. Do not flip one without the written confirmation. */
  legalName: { value: 'Kingson Trading (Pvt) Ltd', status: 'draft',
               evidence: 'Repository content. Public listings disagree.' },
  email:     { value: 'kingsonnkm@gmail.com', status: 'draft',
               evidence: 'Repository content. Not confirmed as the enquiry destination.' },
  phone:     { value: '+263 772 262 869', status: 'draft',
               evidence: 'Repository content and crane livery. Not confirmed as the enquiry destination.' },
  whatsapp:  { value: '263772262869', status: 'draft',
               evidence: 'Derived from the phone number above. Not confirmed.' },
  office:    { value: '+263 242 304 341', status: 'draft',
               evidence: 'Repository content. Not confirmed.' },
  address:   { value: 'No. 1262 Tynwald Industries, Harare', status: 'draft',
               evidence: 'Repository content. Public listings disagree.' },
  hours:     { value: 'Mon–Fri 07:30–17:00', status: 'draft',
               evidence: 'Repository content. Never rendered as an open/closed indicator.' },
  facebook:  { value: 'https://www.facebook.com/share/18GoTdrLBD/', status: 'draft',
               evidence: 'Repository content. Not confirmed as an official page.' }
};

/** The whole record, for tools/check-truth.js. Never import this to render. */
export const VALUES = FIELDS;

/** Public value, or null when the field is not cleared to render as fact. */
export function publish(key) {
  const f = FIELDS[key];
  return f && f.status === 'owner_verified' ? f.value : null;
}

/** Values the owner supplied directly — safe as page copy. */
export function context(key) {
  const f = FIELDS[key];
  return f && (f.status === 'owner_verified' || f.status === 'user_context') ? f.value : null;
}

/** True only when a destination exists that an enquiry can actually be sent to. */
export function hasVerifiedRecipient() {
  return publish('email') !== null || publish('whatsapp') !== null;
}

export function recipients() {
  return { email: publish('email'), whatsapp: publish('whatsapp'), phone: publish('phone') };
}

/** For the footer: every cleared identity/contact value, in order. */
export function verifiedContactLines() {
  return ['legalName', 'address', 'phone', 'email']
    .map((k) => ({ key: k, value: publish(k) }))
    .filter((row) => row.value !== null);
}

/* Exposed so the pending-verification notice can name what is outstanding
   rather than being vague about it. */
export function unverifiedKeys() {
  return Object.keys(FIELDS).filter((k) => FIELDS[k].status !== 'owner_verified'
                                        && FIELDS[k].status !== 'user_context');
}
