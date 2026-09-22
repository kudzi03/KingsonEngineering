/* Editing the enquiry itself: the details an estimator corrects after the
   first phone call, when the website form's guess at what the job is turns
   out to be half the story. There is no value field: the customer never
   gives one, and an opportunity's value is its latest quotation. Kept out of dialogs.js because it is the one form
   that touches nearly every column on the table. */

import { api } from '../core/api.js';
import { PRIORITIES, SOURCES, SOURCE_LABEL } from '../core/model.js';
import { esc } from '../core/fmt.js';
import { dialog, field, text, textarea, select, nul, toast, fieldError, after } from './form.js';

const titleCase = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export async function editOpportunity({ opp, me, onDone }) {
  const profiles = await api.profiles();
  dialog({
    title: 'Edit opportunity',
    sub: opp.ref,
    width: 620,
    submitLabel: 'Save',
    body: `
      ${field('title', 'What is the job?', text('title', opp.title, 'required'), { wide: true })}
      <div class="field-row">
        ${field('service', 'Service', select('service', ['', 'Structural steelwork', 'Roof steelwork and trusses',
          'Fiber laser cutting', 'Balustrades and gates', 'Stainless fabrication', 'Mobile cranage', 'Other'], opp.service || ''))}
        ${field('source', 'Source', select('source', SOURCES.map((s) => [s, SOURCE_LABEL[s]]), opp.source))}
      </div>
      ${field('location', 'Site', text('location', opp.location || ''), { wide: true })}
      <div class="field-row">
        ${field('owner_id', 'Owner', select('owner_id',
          [['', 'Unassigned']].concat(profiles.map((p) => [p.id, p.full_name])), opp.owner_id || ''))}
        ${field('priority', 'Priority', select('priority', PRIORITIES.map((p) => [p, titleCase(p)]), opp.priority))}
      </div>
      ${field('site_visit_required', 'Site visit',
        `<label class="check"><input type="checkbox" id="site_visit_required" name="site_visit_required"
           ${opp.site_visit_required ? 'checked' : ''}> <span>A site visit is needed before this can be priced</span></label>`,
        { wide: true })}
      ${field('description', 'What do they want?', textarea('description', opp.description || '', 4), { wide: true })}`,
    onSubmit: async (v) => {
      if (!v.title) throw fieldError('title', 'Give the job a name.');
      await api.updateOpportunity(opp.id, {
        title: v.title, service: nul(v.service), source: v.source,
        location: nul(v.location),
        owner_id: nul(v.owner_id), priority: v.priority,
        site_visit_required: Boolean(v.site_visit_required),
        description: nul(v.description)
      });
      toast('Saved.');
      after(onDone);
    }
  });
}
