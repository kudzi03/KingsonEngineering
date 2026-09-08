/* ═══════════════════════════════════════════════════════════════════════════
   interface/navigation.js — nav, subject label, menu
   ═══════════════════════════════════════════════════════════════════════════
   V2 §14. One owner for focus and overlay state. The menu freezes the stage at
   its current progress and makes the background inert; Escape and outside
   click close it and focus returns to Menu.
   ═══════════════════════════════════════════════════════════════════════════ */

import { NAV } from '../content/copy.js';

export function mountNavigation({ seek, onMenuOpen, onMenuClose }) {
  const nav = document.querySelector('.nav');
  const subject = document.querySelector('[data-subject]');
  const menu = document.querySelector('[data-menu]');
  const scrim = document.querySelector('[data-menu-scrim]');
  const openBtn = document.querySelector('[data-menu-open]');
  const closeBtn = document.querySelector('[data-menu-close]');
  const list = document.querySelector('[data-menu-list]');

  NAV.menu.forEach((item) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = item.label;
    b.addEventListener('click', () => { close(); seek(item.id); });
    li.appendChild(b);
    list.appendChild(li);
  });

  document.querySelectorAll('[data-go]').forEach((el) => {
    el.addEventListener('click', () => seek(el.dataset.go));
  });

  let open = false;

  function openMenu() {
    if (open) return;
    open = true;
    menu.dataset.open = 'true';
    scrim.dataset.open = 'true';
    menu.removeAttribute('inert');
    openBtn.setAttribute('aria-expanded', 'true');
    onMenuOpen && onMenuOpen();
    (list.querySelector('button') || closeBtn).focus();
  }

  function close() {
    if (!open) return;
    open = false;
    menu.dataset.open = 'false';
    scrim.dataset.open = 'false';
    menu.setAttribute('inert', '');
    openBtn.setAttribute('aria-expanded', 'false');
    onMenuClose && onMenuClose();
    openBtn.focus();
  }

  openBtn.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', close);
  scrim.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) close(); });

  let currentSubject = null;
  return {
    /* A small normal-case label beside Menu, and only after Scene 1 (§14). */
    setSubject(text) {
      if (text === currentSubject) return;
      currentSubject = text;
      if (!text) { subject.hidden = true; subject.textContent = ''; return; }
      subject.hidden = false;
      subject.textContent = text;
    },
    setTheme(theme) {
      if (nav.dataset.theme !== theme) nav.dataset.theme = theme;
    },
    closeMenu: close
  };
}
