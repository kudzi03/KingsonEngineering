// Project footage runs silently in its existing image frame. Only visible
// players request media; stills cover loading, blocked autoplay and preferences.
export function mountProjectFilms() {
  const videos = [...document.querySelectorAll('[data-project-video]')];
  if (!videos.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  const restricted = () => reduce.matches || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '');
  const players = videos.map(video => {
    const frame = video.closest('.project-media');
    const sources = video.dataset.projectSources.split(' ');
    const posters = video.dataset.projectPosters.split(' ');
    let visible = false, index = 0, failed = false;
    const sync = () => {
      if (!visible || document.hidden || restricted() || failed) {
        video.pause();
        if (restricted() || failed) frame.classList.remove('project-playing');
        return;
      }
      if (video.getAttribute('src') !== sources[index]) {
        frame.classList.remove('project-playing');
        video.poster = posters[index];
        video.src = sources[index];
        video.load();
      }
      video.muted = true;
      video.play().catch(() => frame.classList.remove('project-playing'));
    };
    video.addEventListener('playing', () => frame.classList.add('project-playing'));
    video.addEventListener('error', () => { failed = true; sync(); });
    // The first roof frame cycles both supplied angles without an extra CTA.
    video.addEventListener('ended', () => {
      if (sources.length > 1) index = (index + 1) % sources.length;
      sync();
    });
    // WebKit can rewind a native loop but leave the player paused.
    video.addEventListener('seeked', () => {
      if (video.loop && video.paused && video.currentTime < .1) sync();
    });
    return { frame, sync, visibility: value => { visible = value; sync(); } };
  });
  const syncAll = () => players.forEach(player => player.sync());
  document.addEventListener('visibilitychange', syncAll);
  reduce.addEventListener('change', syncAll);
  connection?.addEventListener('change', syncAll);
  if ('IntersectionObserver' in window) {
    const byFrame = new Map(players.map(player => [player.frame,player]));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => byFrame.get(entry.target).visibility(entry.isIntersecting));
    }, {threshold:0,rootMargin:'-88px 0px 0px'});
    players.forEach(player => observer.observe(player.frame));
  }
}
