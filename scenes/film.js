/* ═══════════════════════════════════════════════════════════════════════════
   scenes/film.js — project footage
   ═══════════════════════════════════════════════════════════════════════════

   The markup (tools/layout.js, projectFilm) ships a muted, inline video with
   preload="none", a poster and the browser's own controls, which is a
   complete, playable thing with this module absent. This turns it into a
   quiet loop that runs only while it is on screen:

   · Plays when at least a third of it is in view, pauses when it leaves.
     Nothing is downloaded until the first play — the poster is the frame
     until then.
   · Never starts by itself under Reduce Motion or Save-Data. The play
     control is there; pressing it is the visitor's choice, and is honoured.
   · Pausable at any time (WCAG 2.2.2): one button, its state in
     aria-pressed, the same control the hero's photographs use. A visitor
     who pauses it is not overruled by scrolling back into view.
   · Pauses when the tab is hidden.
   · If no source can play, the control goes away and the poster stays.
   ═══════════════════════════════════════════════════════════════════════════ */

export function mountFilms(root = document) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  /* Save-Data is a Chromium hint; elsewhere `connection` is absent and the
     answer is simply no. */
  const conn = /** @type {any} */ (navigator).connection;
  const saveData = Boolean(conn && conn.saveData);

  for (const film of root.querySelectorAll('[data-film]')) {
    const video = film.querySelector('video');
    const btn = film.querySelector('[data-video-toggle]');
    if (!video || !btn) continue;

    /* This module loads as the film comes near, so a keyboard user can
       already be on the video's own controls when it arrives. Taking the
       controls away would leave focus on an element that is no longer a
       control, with no ring: hand it to the control that replaces them. */
    const hadFocus = document.activeElement === video;
    video.controls = false;
    btn.hidden = false;
    if (hadFocus) btn.focus({ preventScroll: true });
    let visible = false;
    let held = reduce.matches || saveData;      // paused by choice, not by scrolling

    const show = () => {
      const paused = video.paused;
      btn.setAttribute('aria-pressed', String(paused));
      btn.setAttribute('aria-label', paused ? 'Play the footage' : 'Pause the footage');
      film.classList.toggle('is-playing', !paused);
    };
    const play = () => { const p = video.play(); if (p) p.catch(() => show()); };
    const sync = () => {
      if (visible && !held && !document.hidden) play();
      else if (!video.paused) video.pause();
    };

    btn.addEventListener('click', () => {
      held = !video.paused;
      if (held) video.pause(); else play();
    });
    video.addEventListener('play', show);
    video.addEventListener('pause', show);
    /* A <source> the browser cannot use fires `error` before it moves on to
       the next one — AV1 on an older iPhone does exactly that, and the H.264
       file then plays. Only the last source failing means nothing can. */
    const failed = () => { btn.hidden = true; film.classList.add('is-failed'); };
    const sources = video.querySelectorAll('source');
    (sources[sources.length - 1] || video).addEventListener('error', failed);
    video.addEventListener('error', failed);
    document.addEventListener('visibilitychange', sync);
    reduce.addEventListener?.('change', () => { if (reduce.matches) { held = true; sync(); } });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); },
        { threshold: 0.35 }).observe(film);
    }
    show();
  }
}
