/* ═══ Scene 4 · At the edge ═════════════════════════════════════════════════
   V2 §10 Scene 4. Close inspection of the actual machine, then its place, then
   a colour cut to the yard. No simulated cutting, no beam, no sparks, and no
   tolerance or capability claim anywhere in the copy.

   Hold the first 35%, then two staggered aperture moves.
   ═══════════════════════════════════════════════════════════════════════════ */
import { units, cutToYard, EDGE } from '../scene-map.js';
import { range, lerp, smooth } from '../interp.js';
import { SCENE_TITLES, SCENE_LABELS } from '../../content/copy.js';

export function cut(p, vp) {
  const u = units(vp);
  const exit = cutToYard(vp);

  /* An inspection, not ornamental drift: only the focal x moves, revealing
     more of the bed, and the translation is capped at 3vw. */
  const focalX = lerp(0.64, 0.60, smooth(range(p, 0.10, 0.35)));

  /* The workshop enters from the right and stops on the 58vw column. */
  const workshopLeft = lerp(100, EDGE.c, smooth(range(p, 0.44, 0.65)));
  /* The crane follows, stopping on 76vw. Already full height on arrival. */
  const craneLeft = lerp(100, EDGE.d, smooth(range(p, 0.70, 0.88)));

  const planes = [];
  if (p >= 0.66) {
    planes.push({ key: 'crane', box: { x: u.vw(craneLeft), y: 0, w: vp.w - u.vw(craneLeft), h: vp.h },
                  fit: { zoom: 1 }, z: 22 });
  }
  if (p >= 0.40) {
    planes.push({ key: 'laserMachine',
                  box: { x: u.vw(workshopLeft), y: 0, w: vp.w - u.vw(workshopLeft), h: vp.h },
                  fit: { zoom: 1 }, z: 21 });
  }
  /* The macro keeps the whole viewport underneath; the incoming planes cover
     it rather than pushing it, so nothing is ever stretched. */
  planes.push({ key: 'cuttingHead', box: u.full(), fit: { zoom: 1, focal: [focalX, 0.63] }, z: 20 });

  return {
    planes,
    edge: null,
    foreground: null,
    geometry: { visible: false, opacity: 0, p: 1 },
    title: {
      lines: SCENE_TITLES.cut, xVw: 4, yVh: 62, sizeVw: 7.5, maxVw: 52,
      opacity: 1 - range(p, 0.44, 0.55)
    },
    /* The title becomes a small label once the environment is on screen. */
    label: {
      text: 'Laser cutting · ' + SCENE_LABELS.cut, xVw: 4, yVh: 86,
      opacity: range(p, 0.58, 0.66) * (1 - range(p, 0.80, 0.88))
    },
    navTheme: 'light',
    subject: p < 0.7 ? 'Laser cutting' : 'Cranage'
  };
}
