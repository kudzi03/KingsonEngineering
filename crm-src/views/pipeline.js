/* ═══════════════════════════════════════════════════════════════════════════
   views/pipeline.js — the board
   ═══════════════════════════════════════════════════════════════════════════

   Eight columns, one per stage. A card can be dragged, and it can equally be
   moved from a <select> on the card itself — the select is not a fallback, it
   is the primary control on a phone and the only one that works from a
   keyboard. Drag is the addition, not the other way round.

   Every stage change is persisted immediately and written onto the
   opportunity's timeline by the database. If the write fails the card goes
   back where it was and says why, because a board that shows a move which did
   not happen is worse than one that refuses the move.
   ═══════════════════════════════════════════════════════════════════════════ */

import { api } from '../core/api.js';
import { STAGES, STAGE, attention, isOverdue, sum } from '../core/model.js';
import { money, moneyShort, date, relative, esc, pluralise } from '../core/fmt.js';
import { avatar, attentionPill, sourceTag, priorityPill, empty } from '../ui/components.js';
import { icon } from '../ui/icons.js';
import { dialog, field, textarea, toast } from '../ui/form.js';

export const title = 'Pipeline';

let cache = [];

export async function render() {
  cache = await api.openOpportunities();
  const closed = await api.opportunities('stage=in.(won,lost)&order=decided_at.desc&limit=40');
  const all = [...cache, ...closed];

  if (!all.length) {
    return empty('No opportunities yet.',
      'An enquiry from the website appears here automatically. You can also add one by hand.',
      { tone: 'quiet' });
  }

  return `
  <div class="board" role="list">
    ${STAGES.map((s) => {
      const rows = all.filter((o) => o.stage === s.id);
      const value = sum(rows, (o) => o.estimated_value);
      const late = rows.filter(isOverdue).length;
      return `
      <section class="col" data-group="${esc(s.group)}" data-stage="${esc(s.id)}" role="listitem">
        <header class="col-head">
          <span class="col-name">${esc(s.name)}</span>
          <span class="col-n num">${rows.length}</span>
          <span class="col-v num">${value ? esc(moneyShort(value)) : ''}</span>
          ${late ? `<span class="col-alarm" title="${esc(pluralise(late, 'overdue follow-up'))}">${icon.alert(12)}${late}</span>` : ''}
        </header>
        <div class="col-body" data-drop="${esc(s.id)}">
          ${rows.length
            ? rows.sort((a, b) => attention(b).sort - attention(a).sort).map(cardHtml).join('')
            : '<p class="col-empty">Nothing here</p>'}
        </div>
      </section>`;
    }).join('')}
  </div>`;
}

function cardHtml(o) {
  const a = attention(o);
  const alarm = a.level === 'overdue' || a.level === 'unbooked';
  return `
  <article class="deal${alarm ? ' deal-alarm' : ''}" draggable="true" data-deal="${esc(o.id)}">
    <a class="deal-hit" href="#/opportunity/${esc(o.id)}">
      <span class="deal-co">${esc(o.company_name || o.contact_name || 'No company')}</span>
      <span class="deal-title">${esc(o.title)}</span>
    </a>
    <div class="deal-meta">
      <span class="deal-value num">${o.estimated_value ? esc(money(o.estimated_value, o.currency)) : '<span class="dim">no value</span>'}</span>
      ${sourceTag(o.source)}
    </div>
    ${Number(o.live_quotes) ? `<p class="deal-quote">${icon.doc(12)}${esc(pluralise(Number(o.live_quotes), 'quotation'))} out${o.last_quote_sent ? ' · ' + esc(relative(o.last_quote_sent)) : ''}</p>` : ''}
    <div class="deal-foot">
      ${attentionPill(o)}
      ${priorityPill(o.priority)}
      <span class="deal-right">
        ${avatar(o.owner_name ? { full_name: o.owner_name, initials: o.owner_initials } : null, 22)}
        <span class="deal-move">
          <label class="sr-only" for="mv-${esc(o.id)}">Move ${esc(o.title)} to another stage</label>
          <select class="deal-select" id="mv-${esc(o.id)}" data-move="${esc(o.id)}">
            ${STAGES.map((s) => `<option value="${esc(s.id)}"${s.id === o.stage ? ' selected' : ''}>${esc(s.short)}</option>`).join('')}
          </select>
          <span class="deal-move-ic" aria-hidden="true">${icon.chevron(12)}</span>
        </span>
      </span>
    </div>
  </article>`;
}

export function mount(root, rerender) {
  /* One handler for the select and one for drag, both ending in `move()`. */
  async function move(id, stage, revertTo) {
    const opp = cache.find((o) => o.id === id)
      || { id, title: 'this opportunity', stage: revertTo };
    if (opp.stage === stage) return;

    if (stage === 'lost') return askWhyLost(id, opp, rerender, revertTo, root);

    try {
      await api.setStage(id, stage);
      toast(`Moved to ${STAGE[stage].name}.`);
      await rerender();
    } catch (e) {
      toast(e.message || 'That move could not be saved.', 'bad');
      /* Put the control back where it was — the board must not show a state
         the database rejected. */
      const sel = root.querySelector(`[data-move="${CSS.escape(id)}"]`);
      if (sel && revertTo) sel.value = revertTo;
    }
  }

  root.addEventListener('change', (e) => {
    const sel = e.target.closest('[data-move]');
    if (!sel) return;
    const id = sel.dataset.move;
    const was = cache.find((o) => o.id === id)?.stage;
    move(id, sel.value, was);
  });

  let dragging = null;
  root.addEventListener('dragstart', (e) => {
    const card = e.target.closest('[data-deal]');
    if (!card) return;
    dragging = card.dataset.deal;
    card.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', dragging); } catch { /* some browsers refuse */ }
  });
  root.addEventListener('dragend', (e) => {
    e.target.closest('[data-deal]')?.classList.remove('is-dragging');
    root.querySelectorAll('.is-over').forEach((n) => n.classList.remove('is-over'));
    dragging = null;
  });
  root.addEventListener('dragover', (e) => {
    const zone = e.target.closest('[data-drop]');
    if (!zone || !dragging) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!zone.classList.contains('is-over')) {
      root.querySelectorAll('.is-over').forEach((n) => n.classList.remove('is-over'));
      zone.classList.add('is-over');
    }
  });
  root.addEventListener('drop', (e) => {
    const zone = e.target.closest('[data-drop]');
    if (!zone || !dragging) return;
    e.preventDefault();
    const id = dragging;
    dragging = null;
    move(id, zone.dataset.drop, cache.find((o) => o.id === id)?.stage);
  });
}

/* A lost deal has to say why — the database refuses it otherwise, and the
   reason is the only thing anybody learns from a loss. */
function askWhyLost(id, opp, rerender, revertTo, root) {
  dialog({
    title: 'Mark as lost',
    sub: opp.title,
    width: 460,
    submitLabel: 'Mark lost',
    body: field('lost_reason', 'Why was it lost?',
      textarea('lost_reason', '', 3, 'required placeholder="Price — a competitor came in 14% below"'),
      { hint: 'Recorded on the timeline. This is the part somebody reads back in six months.' }),
    onSubmit: async (v) => {
      if (!v.lost_reason) throw Object.assign(new Error('Give a reason.'), { field: 'lost_reason' });
      await api.setStage(id, 'lost', { lostReason: v.lost_reason });
      toast('Marked lost.');
      await rerender();
    }
  });
  /* If the dialog is abandoned the select still shows "Lost". Put it back. */
  const sel = root.querySelector(`[data-move="${CSS.escape(id)}"]`);
  const obs = new MutationObserver(() => {
    if (!document.querySelector('.modal')) {
      if (sel && document.contains(sel) && revertTo) sel.value = revertTo;
      obs.disconnect();
    }
  });
  obs.observe(document.body, { childList: true });
}

export function sub() {
  const open = cache.filter((o) => STAGE[o.stage]?.open);
  return `${esc(pluralise(open.length, 'open opportunity', 'open opportunities'))} · <span class="num">${esc(money(sum(open, (o) => o.estimated_value)))}</span>`;
}

export const actions = () =>
  `<button type="button" class="btn btn-sm" data-new-opp>${icon.plus(14)}<span>New opportunity</span></button>`;
