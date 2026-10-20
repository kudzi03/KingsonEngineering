// Homepage composition. Captions describe the supplied work without inventing
// project names, clients, locations, dimensions, dates or completion status.
import { ASSETS, src, srcset, position, wideSrcset } from '../content/assets.js';
import { esc, ICON_ARROW } from './layout.js';
import { HERO } from '../content/copy.js';
import { publish } from '../content/company.js';

const picture = (key, sizes, eager = false) => {
  const a = ASSETS[key];
  return `<img src="/${src(key, 1100)}" srcset="${srcset(key).split(', ').map(s => '/'+s).join(', ')}" sizes="${sizes}" width="${a.w}" height="${a.h}" alt="${esc(a.alt)}" style="object-position:${position(key)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
};
const FILMS = {
  a: ['roof-a', 'Roof trusses & sheeting', 'A silent pan across roof trusses, purlins and sheeting inside a structure under construction.'],
  b: ['roof-b', 'Another view of the roof steelwork', 'A silent upward view of roof trusses and sheeting, moving towards the open edge of the structure.'],
  c: ['roof-c', 'Steel roof structure', 'A silent view along blue-painted rafters and purlins, with roof sheeting fixed over part of the structure and open bays beyond.'],
  workshop: ['workshop', 'Inside the Kingson workshop', 'A silent walkthrough from the workshop entrance, past equipment and stacked steel, to the exterior yard.']
};
export function filmLink(id, label = 'Watch film', cls = '') {
  const [file, title, description] = FILMS[id];
  const poster = id === 'workshop' ? 'workshopFilm' : 'roofFilm'+id.toUpperCase();
  return `<a class="film-link ${cls}" href="/assets/video/${file}.mp4" data-film data-film-poster="/${src(poster,512)}" data-film-title="${esc(title)}" data-film-description="${esc(description)}"><span class="film-play" aria-hidden="true">▶</span><span>${esc(label)}</span><span class="sr-only">: ${esc(title)}</span></a>`;
}

export function cinematicHero() {
  return `<div class="mh-media" aria-hidden="true">
    <picture class="mh-poster">
      <source media="(min-width:900px)" srcset="${wideSrcset('portalFrame').split(', ').map(s=>'/'+s).join(', ')}" sizes="100vw">
      <img src="/${src('roofFilmA',512)}" srcset="${srcset('roofFilmA').split(', ').map(s=>'/'+s).join(', ')}" sizes="100vw" width="512" height="808" alt="" fetchpriority="high" decoding="async">
    </picture>
    <video class="mh-video" data-hero-video muted loop playsinline preload="none" poster="/${src('roofFilmA',512)}" tabindex="-1"></video>
  </div>
  <div class="mh-shade" aria-hidden="true"></div>
  <div class="wrap mh-content">
    <p class="mh-eyebrow">${esc(publish('name'))} <span>${esc(HERO.eyebrow)}</span></p>
    <h1 class="display" id="hero-h">${HERO.title.split(/(?<=\.)\s+/).map(line=>`<span>${esc(line)}</span>`).join('')}</h1>
    <p class="mh-lede">${esc(HERO.lede).replace(/\n/g,'<br>')}</p>
    <div class="hero-act mh-actions"><a class="btn" href="#enquiry"><span>Request a quote</span>${ICON_ARROW}</a><a class="btn-ghost" href="#work">Our projects <span aria-hidden="true">↓</span></a></div>
  </div>
  <div class="wrap mh-bottom">
    <p><span class="mh-live" aria-hidden="true"></span>On site with Kingson <span class="mh-divider">/</span> Roof steelwork</p>
    <a class="mh-scroll" href="#work">Explore the work <span aria-hidden="true">↓</span></a>
    <button class="mh-motion" type="button" data-hero-toggle hidden><span data-hero-toggle-text>Play film</span><span data-hero-toggle-icon aria-hidden="true">▶</span></button>
  </div>`;
}

export function cinematicWork() {
  return `<section class="selected-work" id="work" aria-labelledby="work-h">
    <div class="wrap">
      <div class="work-intro">
        <div><p class="eyebrow">Selected work</p><h2 class="display" id="work-h">The structure.<br>The detail.</h2></div>
        <div class="work-intro-copy"><p>Steelwork takes shape in the workshop. It comes into its own on site. A closer look at Kingson’s roof structures and architectural details.</p><a class="text-link" href="/structural-steel-harare">Explore structural steelwork ${ICON_ARROW}</a></div>
      </div>
      <div class="work-roofs">
        <figure class="work-a" data-reveal="settle">
          <div class="work-image">${picture('roofFilmA','(max-width:760px) 100vw, 59vw')}${filmLink('a')}</div>
          <figcaption><div><span class="work-type">Roof steelwork</span><h3>Trusses & sheeting.</h3></div><a class="work-arrow" href="/roofing-and-trusses" aria-label="Explore roof steelwork and trusses">↗</a></figcaption>
          <p class="work-sub">An expansive view from inside the structure. ${filmLink('b','Watch another roof view','film-inline')}</p>
        </figure>
        <figure class="work-c" data-reveal="settle">
          <div class="work-image">${picture('roofFilmC','(max-width:760px) 100vw, 35vw')}${filmLink('c')}</div>
          <figcaption><div><span class="work-type">On site</span><h3>Steel roof structure.</h3></div><a class="work-arrow" href="/structural-steel-harare" aria-label="Explore structural steelwork">↗</a></figcaption>
          <p class="work-sub">Rafters, purlins and sheeting, seen from below.</p>
        </figure>
      </div>
      <div class="work-details-head"><h3 class="display">Measured in the details.</h3><a class="text-link" href="/steel-fabrication">Balustrades & fabrication ${ICON_ARROW}</a></div>
      <div class="work-details">
        <figure data-reveal="settle"><button class="zoom" type="button" data-open="architecturalGlass" aria-label="View the glass balustrade and stair detail">${picture('architecturalGlass','(max-width:760px) 100vw, 50vw')}<span class="detail-zoom" aria-hidden="true">↗</span></button><figcaption>Glass balustrade / stair detail</figcaption></figure>
        <figure data-reveal="settle"><button class="zoom" type="button" data-open="architecturalAtrium" aria-label="View the glass balustrade overlooking the atrium">${picture('architecturalAtrium','(max-width:760px) 100vw, 50vw')}<span class="detail-zoom" aria-hidden="true">↗</span></button><figcaption>Glass balustrade / atrium</figcaption></figure>
      </div>
    </div>
  </section>`;
}

export function filmDialog() {
  return `<dialog class="film-dialog" data-film-dialog aria-labelledby="film-title" aria-describedby="film-description">
    <div class="film-dialog-head"><h2 id="film-title" data-film-title-out>Project film</h2><button type="button" data-film-close>Close <span aria-hidden="true">×</span></button></div>
    <video controls playsinline preload="none" data-film-player aria-describedby="film-description"></video>
    <div class="film-dialog-footer"><p id="film-description" data-film-description-out></p><button type="button" data-film-close>Back to the work <span aria-hidden="true">↗</span></button></div>
  </dialog>`;
}
