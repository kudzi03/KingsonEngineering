/* ═══════════════════════════════════════════════════════════════════════════
   experience/masks.js — the two authorised traced masks
   ═══════════════════════════════════════════════════════════════════════════

   V2 §5 authorises exactly two hand-traced alpha masks and no others:

     1. the nearest right portal column and its connected upper member
     2. the crane body / boom silhouette where it occludes "Cranage"

   Both are polygons in normalised SOURCE coordinates, traced against the
   visible edges of the photograph at source resolution. They are applied to
   the same photograph they were traced from, so every pixel inside a mask is
   a real pixel of that picture. Nothing is filled, extended, generated or cut
   out of structure that is not visible.

   Because the points are in source space they travel through crops.project()
   — the same cover transform the photograph itself uses — so a mask stays
   registered at every viewport ratio instead of at the one it was drawn at.

   Everything else on the page is a straight polygon aperture. §5: "do not cut
   out every object."
   ═══════════════════════════════════════════════════════════════════════════ */

export const MASKS = {
  /* The near-right column of the leading portal frame, traced down both
     visible edges. Its very slight lean is real and is kept: a perfectly
     vertical trace would drift off the steel at the base. This is also the
     member the WebGL corner registers onto in Scene 1. */
  portalColumn: {
    plane: 'portalFrame',
    source: 'portalFrame',
    points: [
      [0.8110, 0.1745],
      [0.8282, 0.1745],
      [0.8252, 0.4880],
      [0.8221, 0.8016],
      [0.8023, 0.8016],
      [0.8067, 0.4880]
    ],
    /* Where the modelled corner has to land at the end of Scene 1: the
       column's own axis, top and base. geometry.js solves the final
       registration against these two landmarks. They are the midpoints of the
       traced edges, measured off the photograph rather than eyeballed: the
       column's two edges were fitted across 490 sampled rows, so the axis
       leans about 4px left over its height at 1440 and the model leans with
       it. (The v values carry the small rescale from cropping the black
       margin off the delivered derivatives; the u values are unaffected.) */
    landmarks: { top: [0.81961, 0.1745], base: [0.81222, 0.8016] },
    /* Half-width of the section in source units, for the model's I-section. */
    halfWidth: 0.00860
  },

  /* The yellow superstructure: boom, cab, counterweight body and front deck.
     The chassis and wheels are deliberately outside the mask — the treatment
     asks for the body and boom, and the wheels sit below the word. */
  craneBody: {
    plane: 'crane',
    source: 'crane',
    points: [
      [0.020, 0.4377], [0.048, 0.3723], [0.120, 0.3874], [0.300, 0.4347],
      [0.500, 0.4850], [0.680, 0.5313], [0.780, 0.5514], [0.880, 0.5685],
      [0.930, 0.6038], [0.945, 0.6943], [0.940, 0.7597], [0.640, 0.7648],
      [0.560, 0.7396], [0.430, 0.7346], [0.360, 0.7497], [0.150, 0.7547],
      [0.105, 0.7396], [0.108, 0.6943], [0.250, 0.6762], [0.330, 0.6943],
      [0.380, 0.6440], [0.300, 0.6038], [0.150, 0.5233], [0.055, 0.4729]
    ]
  }
};
