/* ═══════════════════════════════════════════════════════════════════════════
   interface/image-viewer.js — the uncropped source
   ═══════════════════════════════════════════════════════════════════════════
   V2 §10 Scene 6: an accessible dialog showing the whole photograph, fit to
   screen. Escape closes and restores focus. It is an image viewer, not a
   fabricated project detail page — there is no title, client or date, only the
   neutral caption and the alt text.
   ═══════════════════════════════════════════════════════════════════════════ */

import { ASSETS, src } from '../content/assets.js';

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
    caption.textContent = 'Photograph';
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

  return { open, close };
}
