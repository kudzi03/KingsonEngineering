// The poster is the first paint. No video request for reduced motion, Save-Data,
// slow cellular connections, still-treatment review, or without JavaScript.
export function mountHeroFilm() {
  const video = document.querySelector('[data-hero-video]');
  if (!video) return;
  const hero = video.closest('.hero');
  const button = hero.querySelector('[data-hero-toggle]');
  const text = button.querySelector('[data-hero-toggle-text]');
  const icon = button.querySelector('[data-hero-toggle-icon]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const wide = matchMedia('(min-width:900px)');
  const connection = navigator.connection;
  const stillReview = new URLSearchParams(location.search).get('hero') === 'still';
  let userPaused = false, inView = true, manual = false, ready = document.readyState === 'complete';
  const restricted = () => reduce.matches || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '') || stillReview;
  const label = playing => {
    text.textContent = playing ? 'Pause film' : 'Play film';
    icon.textContent = playing ? 'Ⅱ' : '▶';
  };
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
    video.play().catch(() => { hero.classList.remove('film-playing'); label(false); });
  };
  const sync = () => {
    if (!ready && !manual) return;
    if (document.hidden || !inView || userPaused || document.documentElement.classList.contains('film-open') || (restricted() && !manual)) {
      video.pause();
      return;
    }
    play();
  };
  button.hidden = false;
  video.addEventListener('playing', () => { hero.classList.add('film-playing'); label(true); });
  video.addEventListener('pause', () => label(false));
  // Some WebKit media backends rewind a looping MP4 but remain paused after
  // the seek. Resume only through the same visibility/preference/intent guard.
  video.addEventListener('seeked', () => {
    if (video.loop && video.paused && video.currentTime < .1) sync();
  });
  video.addEventListener('error', () => { hero.classList.remove('film-playing'); label(false); });
  button.addEventListener('click', () => {
    if (video.paused) { manual = true; userPaused = false; play(); }
    else { userPaused = true; video.pause(); }
  });
  document.addEventListener('visibilitychange', sync);
  reduce.addEventListener('change', () => {
    manual = false;
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
  // Opening another film suspends the background; closing resumes only if the
  // visitor has not explicitly paused it or enabled a reduced-motion setting.
  document.addEventListener('project-film-change', sync);
  label(false);
  if (document.readyState === 'complete') sync();
  else window.addEventListener('load', () => { ready = true; sync(); }, {once:true});
}
