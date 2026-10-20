// Native dialog provides focus containment and makes the background inert.
// Real local films remain ordinary downloadable links when JS is unavailable.
export function mountProjectFilms() {
  const dialog = document.querySelector('[data-film-dialog]');
  if (!dialog?.showModal) return;
  const player = dialog.querySelector('[data-film-player]');
  let trigger = null;
  document.querySelectorAll('[data-film]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    trigger = link;
    dialog.querySelector('[data-film-title-out]').textContent = link.dataset.filmTitle;
    dialog.querySelector('[data-film-description-out]').textContent = link.dataset.filmDescription;
    player.src = link.href;
    player.poster = link.dataset.filmPoster;
    dialog.showModal();
    document.documentElement.classList.add('film-open');
    document.dispatchEvent(new Event('project-film-change'));
    dialog.querySelector('[data-film-close]').focus();
    player.play().catch(() => {});
  }));
  const closeButtons = [...dialog.querySelectorAll('[data-film-close]')];
  closeButtons.forEach(button => button.addEventListener('click', () => dialog.close()));
  // Keep boundary Tab presses inside the page even when browser-native media
  // controls use a closed shadow tree. Intermediate video controls stay native.
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const first = closeButtons[0], last = closeButtons[closeButtons.length-1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    player.pause();
    player.removeAttribute('src');
    player.load();
    document.documentElement.classList.remove('film-open');
    document.dispatchEvent(new Event('project-film-change'));
    trigger?.focus({preventScroll:true});
  });
}
