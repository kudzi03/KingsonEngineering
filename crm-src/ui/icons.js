/* ═══════════════════════════════════════════════════════════════════════════
   ui/icons.js — one stroke weight, one grid, no icon font
   ═══════════════════════════════════════════════════════════════════════════

   Hand-written 24-grid paths at 1.8 stroke, inlined. An icon set is 40KB of
   dependency for fourteen shapes; these are eleven hundred bytes and they
   inherit `currentColor`, which is what makes the status colouring work.

   Every icon in this application appears BESIDE A WORD, never instead of one.
   The overdue red and the won green fail a deuteranopia separation check
   against each other — that is a fact about the brand palette, not something
   to design around — so neither is ever the only thing carrying the meaning.
   ═══════════════════════════════════════════════════════════════════════════ */

const svg = (paths, size = 16) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
        aria-hidden="true" focusable="false">${paths}</svg>`;

export const icon = {
  dashboard: (s) => svg('<rect x="3" y="3" width="7" height="8" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>', s),
  pipeline:  (s) => svg('<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="9.5" y="4" width="5" height="11" rx="1.5"/><rect x="16" y="4" width="5" height="7" rx="1.5"/>', s),
  bell:      (s) => svg('<path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/>', s),
  alert:     (s) => svg('<path d="M12 3.5 2.6 19.2a1.4 1.4 0 0 0 1.2 2.1h16.4a1.4 1.4 0 0 0 1.2-2.1L12 3.5z"/><path d="M12 9.5v4.2"/><path d="M12 17.4h.01"/>', s),
  clock:     (s) => svg('<circle cx="12" cy="12" r="8.6"/><path d="M12 7.2V12l3.1 1.9"/>', s),
  check:     (s) => svg('<path d="M20 6.5 9.4 17.1 4 11.7"/>', s),
  cross:     (s) => svg('<path d="M18 6 6 18M6 6l12 12"/>', s),
  phone:     (s) => svg('<path d="M21.5 16.9v2.6a1.8 1.8 0 0 1-2 1.8 17.8 17.8 0 0 1-7.7-2.8 17.5 17.5 0 0 1-5.4-5.4A17.8 17.8 0 0 1 3.6 5.4a1.8 1.8 0 0 1 1.8-2h2.6a1.8 1.8 0 0 1 1.8 1.5c.1.9.3 1.7.5 2.5a1.8 1.8 0 0 1-.4 1.9L8.8 10.4a14 14 0 0 0 5.2 5.2l1.1-1.1a1.8 1.8 0 0 1 1.9-.4c.8.2 1.6.4 2.5.5a1.8 1.8 0 0 1 1.5 1.8z"/>', s),
  whatsapp:  (s) => svg('<path d="M20.5 11.6a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.6-4.5a8.4 8.4 0 1 1 15.4-4.4z"/><path d="M9 9.3c.3-.5.6-.5.9-.5h.5c.2 0 .4.1.6.5l.6 1.4c.1.2 0 .4-.1.6l-.5.6a7 7 0 0 0 3 3l.6-.5c.2-.2.4-.2.6-.1l1.4.6c.4.2.5.4.5.6v.5c0 .3 0 .6-.5.9a2.5 2.5 0 0 1-2.4.2 11.6 11.6 0 0 1-4.6-4.6A2.5 2.5 0 0 1 9 9.3z"/>', s),
  mail:      (s) => svg('<rect x="2.8" y="4.8" width="18.4" height="14.4" rx="2"/><path d="m3.4 6.4 8.6 6 8.6-6"/>', s),
  globe:     (s) => svg('<circle cx="12" cy="12" r="8.8"/><path d="M3.4 12h17.2"/><path d="M12 3.2a13 13 0 0 1 0 17.6 13 13 0 0 1 0-17.6z"/>', s),
  users:     (s) => svg('<path d="M16.5 20v-1.8a3.6 3.6 0 0 0-3.6-3.6H6.6A3.6 3.6 0 0 0 3 18.2V20"/><circle cx="9.8" cy="7.6" r="3.6"/><path d="M21 20v-1.8a3.6 3.6 0 0 0-2.7-3.5"/><path d="M15.4 4.2a3.6 3.6 0 0 1 0 7"/>', s),
  pin:       (s) => svg('<path d="M20 10.4c0 5.5-8 11.2-8 11.2s-8-5.7-8-11.2a8 8 0 0 1 16 0z"/><circle cx="12" cy="10.2" r="2.8"/>', s),
  doc:       (s) => svg('<path d="M14 2.8H7.2a2 2 0 0 0-2 2v14.4a2 2 0 0 0 2 2h9.6a2 2 0 0 0 2-2V7.8z"/><path d="M14 2.8v5h4.8"/><path d="M8.8 13h6.4M8.8 16.6h4.4"/>', s),
  calendar:  (s) => svg('<rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M16 3v4M8 3v4M3.4 10.2h17.2"/>', s),
  note:      (s) => svg('<path d="M4.4 4.6h15.2v10.2l-4.8 4.6H4.4z"/><path d="M19.6 14.8h-4.8v4.6"/>', s),
  arrowRight:(s) => svg('<path d="M5 12h13M12.5 5.5 19 12l-6.5 6.5"/>', s),
  chevron:   (s) => svg('<path d="m9 5.5 6.5 6.5L9 18.5"/>', s),
  plus:      (s) => svg('<path d="M12 5.5v13M5.5 12h13"/>', s),
  refresh:   (s) => svg('<path d="M20.5 11a8.5 8.5 0 1 0-.6 5"/><path d="M20.5 4.8V11h-6.2"/>', s),
  menu:      (s) => svg('<path d="M4 7h16M4 12h16M4 17h16"/>', s),
  move:      (s) => svg('<path d="M9 6.5 12 3.5l3 3M15 17.5 12 20.5l-3-3M6.5 9 3.5 12l3 3M17.5 9l3 3-3 3"/>', s),
  briefcase: (n) => svg('<rect x="2.8" y="7" width="18.4" height="13.5" rx="2"/><path d="M8.5 7V5.2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2V7"/><path d="M2.8 12.5h18.4"/>', n),
  file: (n) => svg('<path d="M14 2.8H7.2a2 2 0 0 0-2 2v14.4a2 2 0 0 0 2 2h9.6a2 2 0 0 0 2-2V7.8z"/><path d="M14 2.8v5h4.8"/>', n),
  upload: (n) => svg('<path d="M21 15.5v3.2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3.2"/><path d="M7.5 8.5 12 4l4.5 4.5"/><path d="M12 4v12"/>', n),
  download: (n) => svg('<path d="M21 15.5v3.2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3.2"/><path d="M7.5 11.5 12 16l4.5-4.5"/><path d="M12 16V4"/>', n),
  search: (n) => svg('<circle cx="10.8" cy="10.8" r="7"/><path d="m20.5 20.5-4.7-4.7"/>', n),
  logout: (n) => svg('<path d="M9.5 20.5H5.4a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2h4.1"/><path d="m15.5 16.5 4.5-4.5-4.5-4.5"/><path d="M20 12H9.5"/>', n),
  shield: (n) => svg('<path d="M12 21.3s7.5-3.6 7.5-9.3V5.6L12 2.8 4.5 5.6v6.4c0 5.7 7.5 9.3 7.5 9.3z"/><path d="m9 12 2.2 2.2L15.4 10"/>', n),
  edit: (n) => svg('<path d="M16.5 3.9a2.1 2.1 0 0 1 3 3L8.2 18.2l-4 1 1-4z"/>', n),
  filter: (n) => svg('<path d="M3.5 5.5h17l-6.6 7.8v5.4l-3.8 2v-7.4z"/>', n),
  building: (n) => svg('<path d="M4 20.5V5.2a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v15.3"/><path d="M15 10.5h3a2 2 0 0 1 2 2v8"/><path d="M2.6 20.5h18.8"/><path d="M7.5 7.5h4M7.5 11h4M7.5 14.5h4"/>', n),
  task: (n) => svg('<rect x="3.4" y="4.5" width="17.2" height="16" rx="2"/><path d="M8 3v3M16 3v3"/><path d="m8.6 13.2 2.2 2.2 4.6-4.6"/>', n),
  trend:     (s) => svg('<path d="M3.5 16.5 9 11l4 4 7.5-7.5"/><path d="M14.5 7.5h6v6"/>', s)
};

/* The channel an enquiry arrived through, as its own mark — because "where
   did this come from" is a question the dashboard answers at a glance. */
export const sourceIcon = {
  Phone: icon.phone, WhatsApp: icon.whatsapp, Email: icon.mail,
  Website: icon.globe, Referral: icon.users
};

export const activityIcon = {
  enquiry: icon.bell, call: icon.phone, whatsapp: icon.whatsapp, email: icon.mail,
  visit: icon.pin, quote: icon.doc, stage: icon.move, note: icon.note, task: icon.clock
};
