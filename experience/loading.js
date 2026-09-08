/* ═══════════════════════════════════════════════════════════════════════════
   experience/loading.js — decode priority and the hold rule
   ═══════════════════════════════════════════════════════════════════════════
   V2 §16. The hero decodes first; the adjacent roof starts after it; the rest
   arrive one scene ahead. The gallery is never preloaded.

   THE HOLD RULE: if an incoming photograph is not decoded yet, the outgoing
   composition is held and the transition resolves when it is ready. A blank
   field is never shown.
   ═══════════════════════════════════════════════════════════════════════════ */

import { ASSETS, SEQUENCE, src, srcset } from '../content/assets.js';

export function createLoader(onReady) {
  const ready = new Set();
  const started = new Set();

  function begin(key) {
    if (started.has(key) || !ASSETS[key]) return;
    started.add(key);
    const img = new Image();
    img.decoding = 'async';
    img.srcset = srcset(key);
    img.sizes = '100vw';
    img.src = src(key);
    const done = () => { ready.add(key); if (onReady) onReady(key); };
    if (img.decode) img.decode().then(done, done);
    else { img.onload = done; img.onerror = done; }
  }

  return {
    /** Hero first, then its neighbour — nothing else until first paint. */
    prime() {
      begin(SEQUENCE[0]);
      const next = () => begin(SEQUENCE[1]);
      if (document.readyState === 'complete') next();
      else window.addEventListener('load', next, { once: true });
    },

    /** Everything the current state draws, plus one scene ahead. */
    want(state) {
      const active = new Set();
      (state.planes || []).forEach((pl) => active.add(pl.asset || pl.key.split('#')[0]));
      active.forEach(begin);

      const i = SEQUENCE.findIndex((k) => active.has(k));
      if (i >= 0 && SEQUENCE[i + 1]) begin(SEQUENCE[i + 1]);
    },

    isReady: (key) => ready.has(key),
    /** True when every asset a state needs can be drawn without a blank. */
    canShow(state) {
      return (state.planes || []).every((pl) => ready.has(pl.asset || pl.key.split('#')[0]));
    }
  };
}
