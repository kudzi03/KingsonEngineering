/* ═══════════════════════════════════════════════════════════════════════════
   views/files.js — drawings, BOQs and quotation PDFs
   ═══════════════════════════════════════════════════════════════════════════

   The bytes go to Supabase Storage in a private bucket; `public.files` holds
   only the index row that says which drawing belongs to which enquiry. No
   binary is ever written into a normal table.

   A download is a signed URL minted for the person clicking, valid for two
   minutes. The path on its own opens nothing, so a link pasted into a group
   chat is dead by the time anybody else follows it.
   ═══════════════════════════════════════════════════════════════════════════ */

import { api } from '../core/api.js';
import { esc, date, relative } from '../core/fmt.js';
import { card, empty, avatar } from '../ui/components.js';
import { icon } from '../ui/icons.js';
import { toast, after } from '../ui/form.js';

const MAX = 25 * 1024 * 1024;

const size = (b) => {
  if (!b && b !== 0) return '';
  if (b >= 1048576) return (b / 1048576).toFixed(1) + ' MB';
  if (b >= 1024) return Math.round(b / 1024) + ' KB';
  return b + ' B';
};

export const filesCard = (files) => card('Files', files.length ? `
  <ul class="mini files">
    ${files.map((f) => `<li>
      <button type="button" class="mini-btn" data-file="${esc(f.path)}" data-name="${esc(f.name)}">
        <span class="mini-main">${icon.file(13)}${esc(f.name)}</span>
        <span class="mini-sub">${esc(size(f.size_bytes))} · ${esc(date(f.created_at))}${f.profiles?.initials ? ' · ' + esc(f.profiles.initials) : ''}</span>
      </button>
      <span class="mini-side">${icon.download(15)}</span>
    </li>`).join('')}
  </ul>` : empty('No files yet.', 'Drawings, BOQs and quotation PDFs go here.', { tone: 'quiet' }),
  {
    tight: true,
    action: `<label class="btn-ghost btn-xs file-pick">
      ${icon.upload(13)}<span>Upload</span>
      <input type="file" data-upload hidden
             accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.dwg,.dxf,.xlsx,.xls,.docx,.doc,.zip,.csv,.txt">
    </label>`
  });

/**
 * @param link  one of { opportunity_id }, { project_id }, { contact_id }
 */
export function mountFiles(root, link, me, onDone) {
  root.addEventListener('change', async (e) => {
    const input = e.target.closest('[data-upload]');
    if (!input || !input.files?.length) return;
    const file = input.files[0];
    input.value = '';                      // so the same file can be retried

    if (file.size > MAX) {
      toast(`${file.name} is ${size(file.size)}. The limit is 25 MB — send larger drawing sets by transfer link.`, 'bad');
      return;
    }

    const label = root.querySelector('.file-pick span');
    const was = label?.textContent;
    if (label) label.textContent = 'Uploading…';
    try {
      const row = await api.uploadFile(file, link, me?.id);
      await api.logActivity({
        opportunity_id: link.opportunity_id || null,
        project_id: link.project_id || null,
        contact_id: link.contact_id || null,
        kind: 'file', body: `File added: ${file.name}`, actor_id: me?.id || null
      });
      void row;
      toast('Uploaded.');
      after(onDone);
    } catch (err) {
      toast(err.message || 'That file could not be uploaded.', 'bad');
      if (label) label.textContent = was;
    }
  });

  root.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-file]');
    if (!btn) return;
    const name = btn.dataset.name || 'file';
    const side = btn.parentElement?.querySelector('.mini-side');
    const wasSide = side?.innerHTML;
    if (side) side.textContent = '…';
    try {
      await saveFile(btn.dataset.file, name);
    } catch (err) {
      toast(err.message || 'That file could not be opened.', 'bad');
    } finally {
      if (side && wasSide !== undefined) side.innerHTML = wasSide;
    }
  });
}

/** Save one stored file under its own name. Shared with the quotation dialog. */
export async function saveFile(path, name = 'file') {
  const url = await api.downloadUrl(path);

  /* Fetched into a blob rather than pointed at with an anchor.
     `download` is ignored on a cross-origin href, so an anchor straight to
     Supabase navigates the tab to the file instead of saving it, and the
     person loses the screen they were on. It also swallows a failure: a
     404 becomes a blank page rather than a message. A blob URL is
     same-origin, so the name survives and an error is an error. */
  const res = await fetch(url);
  if (!res.ok) throw new Error(`That file could not be fetched (${res.status}).`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  /* Revoked on the next turn of the loop: immediately is too soon in
     Safari, which has not finished reading it when click() returns. */
  setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
}
