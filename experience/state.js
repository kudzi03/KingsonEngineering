/* ═══════════════════════════════════════════════════════════════════════════
   experience/state.js — native scroll -> one complete visual state
   ═══════════════════════════════════════════════════════════════════════════

   V2 §18: "pure mapping from native scroll offset and viewport profile to a
   complete visual state". Nothing here touches the DOM, reads layout or holds
   a listener. stage.js writes what this returns; geometry.js reads the same
   object. That is how the canvas and the document can never disagree about
   where the scene is — there is only one answer and both are given it.
   ═══════════════════════════════════════════════════════════════════════════ */

import { SCENES, STAGE_TRAVEL_VH, sceneAt, globalVhFor } from './scene-map.js';
import { clamp } from './interp.js';
import { opening } from './scenes/opening.js';
import { frame } from './scenes/frame.js';
import { roof } from './scenes/roof.js';
import { cut } from './scenes/cut.js';
import { yard } from './scenes/yard.js';
import { views } from './scenes/views.js';

const SAMPLERS = { opening, frame, roof, cut, yard, views };

/**
 * @param {number} globalVh  0..620, position through the stage in vh units
 * @param {{w:number,h:number,profile:string,flat:boolean}} vp
 */
export function sampleStage(globalVh, vp) {
  const at = sceneAt(clamp(globalVh, 0, STAGE_TRAVEL_VH));
  const state = SAMPLERS[at.id](at.p, vp, { flat: vp.flat });
  state.scene = at.id;
  state.p = at.p;
  state.globalVh = globalVh;
  return state;
}

/** Scroll offset in px -> stage progress in vh units. */
export function stageProgressVh(scrollY, stageTop, vp) {
  const travelPx = (STAGE_TRAVEL_VH / 100) * vp.h;
  const t = clamp((scrollY - stageTop) / travelPx, 0, 1);
  return t * STAGE_TRAVEL_VH;
}

/** Where a scene's resting state sits in the document, for navigation. */
export function scrollTargetFor(sceneId, p, stageTop, vp) {
  const vhPos = globalVhFor(sceneId, p);
  return stageTop + (vhPos / 100) * vp.h;
}

/** Which photographs a state needs decoded right now. */
export function activeAssets(state) {
  const set = new Set();
  (state.planes || []).forEach((pl) => set.add(pl.asset || stripInstance(pl.key)));
  return Array.from(set);
}

function stripInstance(key) {
  const i = key.indexOf('#');
  return i === -1 ? key : key.slice(0, i);
}

export { SCENES, STAGE_TRAVEL_VH };
