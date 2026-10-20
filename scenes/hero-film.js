// The poster is the first paint. No video request for reduced motion, Save-Data,
// slow cellular connections, still-treatment review, or without JavaScript.
export function mountHeroFilm() {
  const video = document.querySelector('[data-hero-video]');
  if (!video) return;
  const hero = video.closest('.hero');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const wide = matchMedia('(min-width:900px)');
  const connection = navigator.connection;
  const stillReview = new URLSearchParams(location.search).get('hero') === 'still';
  let inView = true, ready = document.readyState === 'complete';
  const restricted = () => reduce.matches || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '') || stillReview;
  const load = () => {
    const shape = wide.matches ? 'wide' : 'portrait';
    // H.264 is smaller for the reviewed desktop edit and widely hardware
    // decoded on phones. Retain the VP9 export as a codec fallback.
    const ext = video.canPlayType('video/mp4; codecs="avc1.4D401F"') ? 'mp4' : 'webm';
    const url = `/assets/video/roof-hero-${shape}.${ext}`;
    if (!video.getAttribute('src')?.endsWith(url)) {
      hero.classList.remove('film-playing');
      video.src = url;
      video.load();
    }
  };
  const play = () => {
    load();
    video.muted = true;
    video.play().catch(() => { hero.classList.remove('film-playing'); });
  };
  const sync = () => {
    if (!ready) return;
    if (document.hidden || !inView || document.documentElement.classList.contains('film-open') || restricted()) {
      video.pause();
      return;
    }
    play();
  };
  video.addEventListener('playing', () => { hero.classList.add('film-playing'); });
  // Some WebKit media backends rewind a looping MP4 but remain paused after
  // the seek. Resume only through the same visibility/preference/intent guard.
  video.addEventListener('seeked', () => {
    if (video.loop && video.paused && video.currentTime < .1) sync();
  });
  video.addEventListener('error', () => { hero.classList.remove('film-playing'); });
  document.addEventListener('visibilitychange', sync);
  reduce.addEventListener('change', () => {
    if (reduce.matches) hero.classList.remove('film-playing');
    sync();
  });
  wide.addEventListener('change', sync);
  connection?.addEventListener('change', sync);
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    document.documentElement.classList.toggle('hero-passed', !inView);
    sync();
  }, {threshold:0,rootMargin:'-94px 0px 0px'}).observe(hero);
  // Opening another film suspends the background; closing resumes through the
  // same visibility and reduced-motion guards.
  document.addEventListener('project-film-change', sync);
  if (document.readyState === 'complete') sync();
  else window.addEventListener('load', () => { ready = true; sync(); }, {once:true});
}
