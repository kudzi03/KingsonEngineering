/* ═══════════════════════════════════════════════════════════════════════════
   interface/image-viewer.js — the uncropped source
   ═══════════════════════════════════════════════════════════════════════════
   An accessible dialog showing the whole photograph, fit to screen. Escape
   closes and restores focus, and Tab stays inside it.

   It is an image viewer, not a fabricated project detail page: there is no
   project title, client, date or value — only the caption already printed on
   the tile, and the alt text describing what is visible.
   ═══════════════════════════════════════════════════════════════════════════ */

import { ASSETS, src } from '../content/assets.js';
import { WORK } from '../content/copy.js';

export function mountViewer({ onOpen, onClose } = {}) {
  const dialog = document.querySelector('[data-viewer]');
  const img = dialog.querySelector('[data-viewer-img]');
  const caption = dialog.querySelector('[data-viewer-caption]');
  const altOut = dialog.querySelector('[data-viewer-alt]');
  const closeBtn = dialog.querySelector('[data-viewer-close]');
  let restoreTo = null;

  function open(key) {
    const a = ASSETS[key];
    if (!a) return;
    restoreTo = document.activeElement;
    img.src = src(key);
    img.alt = a.alt;
    caption.textContent = WORK.captions[key] || '';
    altOut.textContent = a.alt;
    dialog.dataset.open = 'true';
    dialog.removeAttribute('inert');
    document.body.style.overflow = 'hidden';
    onOpen && onOpen();
    closeBtn.focus();
  }

  function close() {
    if (dialog.dataset.open !== 'true') return;
    dialog.dataset.open = 'false';
    dialog.setAttribute('inert', '');
    img.removeAttribute('src');
    document.body.style.overflow = '';
    onClose && onClose();
    if (restoreTo && restoreTo.focus) restoreTo.focus();
    restoreTo = null;
  }

  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dialog.dataset.open === 'true') close();
  });

  /* aria-modal promises focus stays inside. Removing `inert` from the dialog
     does not put it back on the page behind, so the trap has to be explicit. */
  dialog.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || dialog.dataset.open !== 'true') return;
    const items = [...dialog.querySelectorAll('a[href], button')]
      .filter((n) => n.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  return { open, close };
}
