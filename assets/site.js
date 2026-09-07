/* ═══════════════════════════════════════════════════════════════════════════
   site.js — chrome
   ═══════════════════════════════════════════════════════════════════════════

   Everything that is not a scene: the header, the workshop-open indicator,
   the questions, the enquiry form, and writing the contact details out of
   content.js.

   All motion lives in scenes.js. This file registers on KE.onScroll rather
   than adding a listener, so the page still makes one scroll pass per frame.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var K  = window.KINGSON || {};
  var CO = K.COMPANY || {};
  var EQ = K.ENQUIRY || { mode: 'handoff', scopes: [], timing: [], contactPrefs: [] };
  var KE = window.KE;

  var doc = document;
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }


  /* ── header ────────────────────────────────────────────────────────────
     Solid once the first scene is behind it; hides on a downward scroll deep
     in the page so the photography gets the whole frame back. */

  (function () {
    var hdr = $('.hdr');
    if (!hdr || !KE) return;
    var lastY = 0;
    KE.onScroll(function (y, vh) {
      hdr.classList.toggle('solid', y > 40);
      hdr.classList.toggle('hide', y > lastY && y > vh * 1.4);
      lastY = y;
    });
  })();

  (function () {
    var links = $$('.nav a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var a = byId[e.target.id];
        if (a && e.isIntersecting) {
          links.forEach(function (l) { l.removeAttribute('aria-current'); });
          a.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) {
      var el = doc.getElementById(id);
      if (el) spy.observe(el);
    });
  })();


  /* ── workshop-open indicator ───────────────────────────────────────────
     Driven by COMPANY.hours. Says only what the hours say — open, or closed.
     Never "we reply in X". */

  (function () {
    var el = $('[data-status]');
    if (!el || !CO.hours) return;

    function toMin(hhmm) { var p = String(hhmm).split(':'); return (+p[0]) * 60 + (+p[1]); }

    function update() {
      var now = new Date(), day = now.getDay();
      var mins = now.getHours() * 60 + now.getMinutes();
      var open = false, closesAt = '';
      CO.hours.forEach(function (h) {
        if (h.days.indexOf(day) === -1) return;
        if (mins >= toMin(h.open) && mins < toMin(h.close)) { open = true; closesAt = h.close; }
      });
      el.classList.toggle('open', open);
      var txt = $('[data-status-text]', el);
      if (txt) txt.textContent = open ? 'Workshop open · until ' + closesAt : 'Workshop closed';
    }
    update();
    setInterval(update, 60000);
  })();


  /* ── questions ─────────────────────────────────────────────────────────*/

  $$('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-i');
      btn.setAttribute('aria-expanded', item.classList.toggle('on') ? 'true' : 'false');
    });
  });


  /* ── enquiry form ──────────────────────────────────────────────────────

     HOW SUBMISSION WORKS — read this before wiring a backend.

     There is no server. The form composes a message and hands it to WhatsApp
     or the visitor's mail client; the visitor presses send there. Nothing is
     stored by this website and nothing is persisted, which is why the
     confirmation says "ready to send" and never "received".

     buildPayload() already returns the shape a CRM would want. To make this
     send server-side: set ENQUIRY.mode = 'endpoint' and ENQUIRY.endpoint in
     content.js. Nothing else on the page has to change.                    */

  (function () {
    var form = $('#enquiry-form');
    if (!form) return;

    function fill(id, list, placeholder) {
      var sel = doc.getElementById(id);
      if (!sel || !list) return;
      sel.innerHTML = '';
      var ph = doc.createElement('option');
      ph.value = ''; ph.textContent = placeholder; ph.disabled = true; ph.selected = true;
      sel.appendChild(ph);
      list.forEach(function (v) {
        var o = doc.createElement('option');
        o.value = v; o.textContent = v;
        sel.appendChild(o);
      });
    }
    fill('f-scope', EQ.scopes, 'Select a scope');
    fill('f-timing', EQ.timing, 'Select timing');

    var seg = $('#f-pref');
    var pref = (EQ.contactPrefs && EQ.contactPrefs[0]) || 'WhatsApp';
    if (seg) {
      EQ.contactPrefs.forEach(function (v, i) {
        var b = doc.createElement('button');
        b.type = 'button';
        b.textContent = v;
        b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
        b.addEventListener('click', function () {
          pref = v;
          $$('button', seg).forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
          b.setAttribute('aria-pressed', 'true');
        });
        seg.appendChild(b);
      });
    }

    /* A file picker, not an uploader: it lists what the visitor intends to
       attach so the composed message names the drawings. The attachment
       itself happens in WhatsApp or the mail client. */
    var drop = $('.drop'), input = $('#f-files'), list = $('.file-list');
    var files = [];

    function renderFiles() {
      if (!list) return;
      list.innerHTML = '';
      files.forEach(function (f, i) {
        var li = doc.createElement('li');
        var name = doc.createElement('span');
        name.textContent = f.name + '  ·  ' + Math.max(1, Math.round(f.size / 1024)) + ' KB';
        var rm = doc.createElement('button');
        rm.type = 'button'; rm.textContent = '×';
        rm.setAttribute('aria-label', 'Remove ' + f.name);
        rm.addEventListener('click', function () { files.splice(i, 1); renderFiles(); });
        li.appendChild(name); li.appendChild(rm);
        list.appendChild(li);
      });
    }

    function addFiles(fl) {
      Array.prototype.forEach.call(fl, function (f) {
        if (files.length < 12 && !files.some(function (x) { return x.name === f.name && x.size === f.size; })) {
          files.push(f);
        }
      });
      renderFiles();
    }

    if (input) input.addEventListener('change', function () { addFiles(input.files); input.value = ''; });

    if (drop) {
      ['dragenter', 'dragover'].forEach(function (t) {
        drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); });
      });
      ['dragleave', 'drop'].forEach(function (t) {
        drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('over'); });
      });
      drop.addEventListener('drop', function (e) {
        if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
      });
    }

    function val(id) { var el = doc.getElementById(id); return el && el.value ? el.value.trim() : ''; }

    /* The shape a CRM, database or automation would consume. Kept separate
       from the message text so the two never drift apart. */
    function buildPayload() {
      return {
        name: val('f-name'), company: val('f-company'), phone: val('f-phone'),
        email: val('f-email'), scope: val('f-scope'), location: val('f-location'),
        timing: val('f-timing'), brief: val('f-brief'),
        preferredContact: pref,
        attachments: files.map(function (f) { return { name: f.name, size: f.size, type: f.type }; }),
        submittedAt: new Date().toISOString(),
        source: 'website'
      };
    }

    function buildMessage(p) {
      var L = ['KINGSON ENGINEERING — PROJECT ENQUIRY', ''];
      function line(k, v) { if (v) L.push(k + ': ' + v); }
      line('Name', p.name); line('Company', p.company);
      line('Phone / WhatsApp', p.phone); line('Email', p.email);
      L.push('');
      line('Scope', p.scope); line('Site location', p.location);
      line('Timing', p.timing); line('Preferred contact', p.preferredContact);
      if (p.brief) L.push('', 'Brief:', p.brief);
      if (p.attachments.length) {
        L.push('', 'Drawings to attach (' + p.attachments.length + '):');
        p.attachments.forEach(function (a) { L.push('  · ' + a.name); });
      }
      return L.join('\n');
    }

    var err = $('.form-err'), ready = $('.ready'), pre = $('.ready-pre'),
        waLink = $('#send-wa'), mailLink = $('#send-mail');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var p = buildPayload();
      var missing = [];
      if (!p.name) missing.push('your name');
      if (!p.phone && !p.email) missing.push('a phone number or an email address');
      if (!p.scope) missing.push('what the work is');

      if (missing.length) {
        if (err) { err.textContent = 'Still needed — ' + missing.join(', ') + '.'; err.classList.add('on'); }
        var first = missing.indexOf('your name') === 0 ? $('#f-name') : $('#f-phone');
        if (first) first.focus();
        return;
      }
      if (err) err.classList.remove('on');

      /* The seam. Today: compose and hand off. Later: POST the same payload
         to ENQUIRY.endpoint. */
      if (EQ.mode === 'endpoint' && EQ.endpoint && window.console) {
        console.warn('ENQUIRY.mode is "endpoint" but no client is implemented yet.');
      }

      var msg = buildMessage(p);
      if (pre) pre.textContent = msg;
      if (waLink) waLink.href = 'https://wa.me/' + CO.whatsapp + '?text=' + encodeURIComponent(msg);
      if (mailLink) {
        mailLink.href = 'mailto:' + CO.email +
          '?subject=' + encodeURIComponent('Project enquiry — ' + (p.company || p.name)) +
          '&body=' + encodeURIComponent(msg);
      }

      if (ready) {
        ready.classList.add('on');
        ready.setAttribute('tabindex', '-1');
        ready.focus({ preventScroll: true });
        ready.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' });
      }
      if (KE) KE.refresh();
    });

    var restart = $('#form-restart');
    if (restart) {
      restart.addEventListener('click', function () {
        form.reset();
        files = []; renderFiles();
        if (ready) ready.classList.remove('on');
        if (err) err.classList.remove('on');
        $('#f-name').focus();
        if (KE) KE.refresh();
      });
    }
  })();


  /* ── provisional spec figures ──────────────────────────────────────────
     Nothing renders while SHOW_PROVISIONAL_SPECS is false. When the figures
     are confirmed, flip the flag in content.js and the tables appear under
     the roofing and laser scenes, replacing the "issued with the quotation"
     notes. */

  (function () {
    if (!K.SHOW_PROVISIONAL_SPECS || !K.PROVISIONAL) return;
    var P = K.PROVISIONAL;

    function table(rows) {
      var t = doc.createElement('table');
      t.className = 'spec-table';
      var tb = doc.createElement('tbody');
      rows.forEach(function (r) {
        var tr = doc.createElement('tr');
        var th = doc.createElement('th'); th.scope = 'row'; th.textContent = r[0];
        var td = doc.createElement('td');
        var b = doc.createElement('b'); b.textContent = r[1]; td.appendChild(b);
        if (r[2]) { var s = doc.createElement('span'); s.textContent = r[2]; td.appendChild(s); }
        tr.appendChild(th); tr.appendChild(td); tb.appendChild(tr);
      });
      t.appendChild(tb);
      return t;
    }

    /* The scenes are pinned viewports with no room for a six-row table, so
       the confirmed figures are appended as a plain block after the questions
       rather than jammed into a photograph. */
    var host = doc.createElement('section');
    host.className = 'specs';
    host.innerHTML = '<p class="eyebrow">Profiles &amp; specifications</p>';

    (P.profiles || []).forEach(function (prof) {
      var h = doc.createElement('h3');
      h.className = 'spec-name';
      h.textContent = prof.name;
      host.appendChild(h);
      host.appendChild(table(prof.rows));
    });

    if (P.laser) {
      var lh = doc.createElement('h3');
      lh.className = 'spec-name';
      lh.textContent = P.laser.machine;
      host.appendChild(lh);
      var rows = P.laser.envelope.map(function (r) { return [r[0], r[1], r[2] + ' · ' + r[3]]; });
      rows.push(['Bed size', P.laser.bed, '']);
      rows.push(['Tolerance', P.laser.tolerance, 'Repeatability ' + P.laser.repeatability]);
      host.appendChild(table(rows));
    }

    var qa = $('#faq');
    if (qa && qa.parentNode) qa.parentNode.insertBefore(host, qa);
    $$('.spec-note').forEach(function (n) { n.hidden = true; });
    if (KE) KE.refresh();
  })();


  /* ── company details into the page ─────────────────────────────────────
     Contact details live in content.js and are written into the marked slots
     so a number is changed in exactly one place. The slots already hold the
     current values in the HTML, so a crawler running no JavaScript still
     reads the right number. */

  (function () {
    var map = {
      mobile: CO.mobile, office: CO.office, email: CO.email,
      address: CO.address, city: CO.city, name: CO.name, legal: CO.legal
    };
    $$('[data-k]').forEach(function (el) {
      var v = map[el.dataset.k];
      if (v) el.textContent = v;
    });
    $$('[data-href]').forEach(function (el) {
      var t = el.dataset.href;
      if (t === 'tel-mobile') el.href = 'tel:' + CO.mobileRaw;
      if (t === 'tel-office') el.href = 'tel:' + CO.officeRaw;
      if (t === 'mail')       el.href = 'mailto:' + CO.email;
      if (t === 'facebook')   el.href = CO.facebook;
      if (t === 'wa') {
        el.href = 'https://wa.me/' + CO.whatsapp + '?text=' +
          encodeURIComponent('Hello Kingson Engineering — I would like to enquire about ');
      }
    });
  })();
})();
