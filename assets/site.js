/* ═══════════════════════════════════════════════════════════════════════════
   site.js — behaviour
   ═══════════════════════════════════════════════════════════════════════════

   No framework, no build step, no dependencies. Loads after content.js.

   A deliberate omission: there is no scroll hijacking. A transform-based
   smooth-scroll layer breaks position:sticky, and the sticky WebGL stage is
   the centrepiece of this page. Native scrolling plus scroll-linked motion
   gets the same feel without trading the thing it is decorating.

   Sections below:
     1  helpers                     6  the sticky steel stage
     2  header                      7  capability index
     3  workshop-open indicator     8  FAQ
     4  reveals                     9  enquiry form
     5  parallax                   10  provisional spec tables
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var K = window.KINGSON || {};
  var CO = K.COMPANY || {};
  var EQ = K.ENQUIRY || { mode: 'handoff', scopes: [], timing: [], contactPrefs: [] };

  var doc = document;
  var root = doc.documentElement;
  root.classList.add('js');

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }


  /* ── 1. helpers ────────────────────────────────────────────────────────
     One shared scroll loop. Everything that reacts to scroll registers here
     rather than adding its own listener, so a long page still only does one
     pass per frame. */

  var readers = [];
  var ticking = false;

  function onScroll(fn) { readers.push(fn); }

  function frame() {
    ticking = false;
    var y = window.pageYOffset || root.scrollTop;
    var vh = window.innerHeight;
    for (var i = 0; i < readers.length; i++) readers[i](y, vh);
  }

  function requestFrame() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }

  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', requestFrame, { passive: true });


  /* ── 2. header ─────────────────────────────────────────────────────────
     Solid once the hero is behind it; hides on a downward scroll deep in the
     page so the photography gets the full frame back. */

  var hdr = $('.hdr');
  var lastY = 0;

  if (hdr) {
    onScroll(function (y) {
      hdr.classList.toggle('solid', y > 40);
      var down = y > lastY;
      hdr.classList.toggle('hide', down && y > window.innerHeight * 1.4);
      lastY = y;
    });
  }

  /* section highlight in the nav */
  var navLinks = $$('.nav a[href^="#"]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var a = byId[e.target.id];
        if (a && e.isIntersecting) {
          navLinks.forEach(function (l) { l.removeAttribute('aria-current'); });
          a.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) {
      var el = doc.getElementById(id);
      if (el) spy.observe(el);
    });
  }


  /* ── 3. workshop-open indicator ────────────────────────────────────────
     Driven by COMPANY.hours in content.js. Says only what the hours say —
     open, or closed with the next opening. No "we reply in X". */

  (function () {
    var el = $('[data-status]');
    if (!el || !CO.hours) return;

    function toMin(hhmm) {
      var p = String(hhmm).split(':');
      return (+p[0]) * 60 + (+p[1]);
    }

    function update() {
      var now = new Date();
      var day = now.getDay();                       // 0 = Sunday
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


  /* ── 4. reveals ────────────────────────────────────────────────────────
     Elements opt in with .r-up / .r-fade / .r-line / [data-stagger], and the
     photographic frames with .reveal-img inside a container that gets .in.

     If IntersectionObserver is missing, everything is revealed immediately —
     a page nobody can read is a worse failure than a page that does not
     animate. */

  var revealSel = '.r-up, .r-fade, .r-line, [data-stagger], .reveals';

  if (!('IntersectionObserver' in window) || REDUCED) {
    $$(revealSel).forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    $$(revealSel).forEach(function (el) { io.observe(el); });
  }


  /* ── 5. parallax ───────────────────────────────────────────────────────
     data-par="0.12" moves the element against the scroll by that fraction of
     the distance it has travelled through the viewport. Rects are cached and
     only re-measured on resize. */

  (function () {
    if (REDUCED) return;
    var items = $$('[data-par]');
    if (!items.length) return;

    var cache = [];

    function measure() {
      var y = window.pageYOffset;
      cache = items.map(function (el) {
        var r = el.getBoundingClientRect();
        return { el: el, top: r.top + y, h: r.height, amt: parseFloat(el.dataset.par) || 0.1 };
      });
    }

    measure();
    window.addEventListener('resize', measure, { passive: true });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(measure);
    window.addEventListener('load', measure);

    onScroll(function (y, vh) {
      for (var i = 0; i < cache.length; i++) {
        var c = cache[i];
        var end = c.top + c.h;
        if (end < y - 200 || c.top > y + vh + 200) continue;   // off screen
        // -1 above the viewport, +1 below it
        var p = ((c.top + c.h / 2) - (y + vh / 2)) / (vh / 2 + c.h / 2);
        c.el.style.transform = 'translate3d(0,' + (p * c.amt * 100).toFixed(2) + 'px,0)';
      }
    });
  })();


  /* ── 6. the sticky steel stage ─────────────────────────────────────────
     Drives the WebGL scene's progress from the scroll position through the
     stage, and fades the hero copy out as the structure takes the frame. */

  (function () {
    var stage = $('#stage');
    var canvas = $('#steel');
    var copy = $('.stage-copy');
    if (!stage || !canvas) return;

    var scene = null;
    try {
      scene = window.SteelFrame ? window.SteelFrame(canvas) : null;
    } catch (e) { scene = null; }

    if (!scene) {
      // No WebGL, a failed compile, or a driver that refuses the context.
      // The photographic hero is already on screen — it is the default — so
      // there is nothing to swap in and nothing to hide.
      return;
    }

    // Live scene confirmed: fade the photograph out from behind it.
    root.classList.add('webgl');

    onScroll(function (y, vh) {
      var top = stage.offsetTop;
      var travel = stage.offsetHeight - vh;
      var p = travel > 0 ? clamp((y - top) / travel, 0, 1) : 0;
      scene.setProgress(p);

      if (copy) {
        // copy clears the frame over the first third of the stage
        var f = clamp(p / 0.34, 0, 1);
        copy.style.opacity = String(1 - f);
        copy.style.transform = 'translate3d(0,' + (-f * 42).toFixed(1) + 'px,0)';
        copy.style.pointerEvents = f > 0.6 ? 'none' : '';
      }
    });

    // Only run the loop while the stage is actually on screen.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.isIntersecting ? scene.start() : scene.stop(); });
      }, { rootMargin: '120px' }).observe(stage);
    } else {
      scene.start();
    }

    // gentle camera parallax — enough to feel alive, not enough to chase
    if (!scene.reducedMotion && window.matchMedia('(hover: hover)').matches) {
      window.addEventListener('pointermove', function (e) {
        scene.setPointer((e.clientX / window.innerWidth) * 2 - 1,
                         (e.clientY / window.innerHeight) * 2 - 1);
      }, { passive: true });
    }

    doc.addEventListener('visibilitychange', function () {
      doc.hidden ? scene.stop() : scene.start();
    });

    requestFrame();
  })();


  /* ── 7. capability index ───────────────────────────────────────────────
     On a pointer device the photograph follows the cursor across the index.
     Touch devices get the image inline in the markup instead — no hover, no
     hidden content. */

  (function () {
    var peek = $('.cap-peek');
    var img = peek && $('img', peek);
    var rows = $$('.cap');
    if (!peek || !img || !rows.length) return;
    if (!window.matchMedia('(hover: hover)').matches || REDUCED) return;

    var tx = 0, ty = 0, cx = 0, cy = 0, on = false, raf = 0;

    function loop() {
      cx += (tx - cx) * 0.14;
      cy += (ty - cy) * 0.14;
      peek.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)' +
                             ' translate(-50%,-50%) scale(' + (on ? 1 : 0.94) + ')';
      if (on || Math.abs(tx - cx) > 0.5) raf = requestAnimationFrame(loop);
      else raf = 0;
    }

    rows.forEach(function (row) {
      row.addEventListener('pointerenter', function () {
        var src = row.dataset.peek;
        if (src && img.getAttribute('src') !== src) img.setAttribute('src', src);
        img.alt = row.dataset.peekAlt || '';
        on = true;
        peek.classList.add('on');
        if (!raf) raf = requestAnimationFrame(loop);
      });
      row.addEventListener('pointerleave', function () {
        on = false;
        peek.classList.remove('on');
      });
    });

    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (on && !raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
  })();


  /* ── 8. FAQ ────────────────────────────────────────────────────────────*/

  $$('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-i');
      var open = item.classList.toggle('on');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });


  /* ── 9. enquiry form ───────────────────────────────────────────────────

     HOW SUBMISSION WORKS — read this before wiring a backend.

     There is no server. The form composes a message and hands it to WhatsApp
     or the visitor's mail client; the visitor presses send there. Nothing is
     stored by this website and nothing is persisted, which is why the
     confirmation says "ready to send" and never "received".

     buildPayload() below already returns the shape a CRM would want. To make
     this send server-side: set ENQUIRY.mode = 'endpoint' and ENQUIRY.endpoint
     in content.js. Nothing else on the page has to change.                  */

  (function () {
    var form = $('#enquiry-form');
    if (!form) return;

    /* dropdowns come from content.js so the options are edited in one place */
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

    /* preferred contact — a segmented control, not a third dropdown */
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

    /* file picker. Deliberately does NOT upload: it lists what the visitor
       intends to attach so the composed message names the drawings, and the
       real attachment happens in WhatsApp or their mail client. */
    var drop = $('.drop');
    var input = $('#f-files');
    var list = $('.file-list');
    var files = [];

    function renderFiles() {
      if (!list) return;
      list.innerHTML = '';
      files.forEach(function (f, i) {
        var li = doc.createElement('li');
        var name = doc.createElement('span');
        name.textContent = f.name + '  ·  ' + Math.max(1, Math.round(f.size / 1024)) + ' KB';
        var rm = doc.createElement('button');
        rm.type = 'button';
        rm.textContent = '×';
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

    function val(id) {
      var el = doc.getElementById(id);
      return el && el.value ? el.value.trim() : '';
    }

    /* The shape a CRM, database or automation would consume. Kept separate
       from the message text so the two never drift apart. */
    function buildPayload() {
      return {
        name:      val('f-name'),
        company:   val('f-company'),
        phone:     val('f-phone'),
        email:     val('f-email'),
        scope:     val('f-scope'),
        location:  val('f-location'),
        timing:    val('f-timing'),
        brief:     val('f-brief'),
        preferredContact: pref,
        attachments: files.map(function (f) { return { name: f.name, size: f.size, type: f.type }; }),
        submittedAt: new Date().toISOString(),
        source: 'website'
      };
    }

    function buildMessage(p) {
      var L = ['KINGSON ENGINEERING — PROJECT ENQUIRY', ''];
      function line(k, v) { if (v) L.push(k + ': ' + v); }
      line('Name', p.name);
      line('Company', p.company);
      line('Phone / WhatsApp', p.phone);
      line('Email', p.email);
      L.push('');
      line('Scope', p.scope);
      line('Site location', p.location);
      line('Timing', p.timing);
      line('Preferred contact', p.preferredContact);
      if (p.brief) { L.push('', 'Brief:', p.brief); }
      if (p.attachments.length) {
        L.push('', 'Drawings to attach (' + p.attachments.length + '):');
        p.attachments.forEach(function (a) { L.push('  · ' + a.name); });
      }
      return L.join('\n');
    }

    var err = $('.form-err');
    var ready = $('.ready');
    var pre = $('.ready-pre');
    var waLink = $('#send-wa');
    var mailLink = $('#send-mail');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var p = buildPayload();
      var missing = [];
      if (!p.name) missing.push('your name');
      if (!p.phone && !p.email) missing.push('a phone number or an email address');
      if (!p.scope) missing.push('what the work is');

      if (missing.length) {
        if (err) {
          err.textContent = 'Still needed — ' + missing.join(', ') + '.';
          err.classList.add('on');
        }
        var first = missing.indexOf('your name') === 0 ? $('#f-name') : $('#f-phone');
        if (first) first.focus();
        return;
      }
      if (err) err.classList.remove('on');

      /* This is the seam. Today: compose and hand off. Later: POST the same
         payload to ENQUIRY.endpoint. */
      if (EQ.mode === 'endpoint' && EQ.endpoint) {
        // Not built. Left explicit rather than silently pretending to send.
        if (window.console) console.warn('ENQUIRY.mode is "endpoint" but no client is implemented yet.');
      }

      var msg = buildMessage(p);
      if (pre) pre.textContent = msg;

      if (waLink) {
        waLink.href = 'https://wa.me/' + CO.whatsapp + '?text=' + encodeURIComponent(msg);
      }
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
    });

    var restart = $('#form-restart');
    if (restart) {
      restart.addEventListener('click', function () {
        form.reset();
        files = []; renderFiles();
        if (ready) ready.classList.remove('on');
        if (err) err.classList.remove('on');
        $('#f-name').focus();
      });
    }
  })();


  /* ── 10. provisional spec tables ───────────────────────────────────────
     Nothing here renders while SHOW_PROVISIONAL_SPECS is false. When the
     figures are confirmed, flip the flag in content.js and the tables appear
     under the roofing profiles and the laser section — and the "issued with
     the quotation" notes step aside for them. */

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
        var b = doc.createElement('b'); b.textContent = r[1];
        td.appendChild(b);
        if (r[2]) { var s = doc.createElement('span'); s.textContent = r[2]; td.appendChild(s); }
        tr.appendChild(th); tr.appendChild(td); tb.appendChild(tr);
      });
      t.appendChild(tb);
      return t;
    }

    /* roofing profiles */
    var slots = $$('[data-spec-profile]');
    slots.forEach(function (slot, i) {
      var prof = P.profiles && P.profiles[i];
      if (prof) slot.appendChild(table(prof.rows));
    });

    /* laser envelope */
    var laserSlot = $('[data-spec-laser]');
    if (laserSlot && P.laser) {
      var rows = P.laser.envelope.map(function (r) {
        return [r[0], r[1], r[2] + ' · ' + r[3]];
      });
      rows.push(['Bed size', P.laser.bed, '']);
      rows.push(['Tolerance', P.laser.tolerance, 'Repeatability ' + P.laser.repeatability]);
      laserSlot.appendChild(table(rows));
    }

    /* the placeholders those tables replace */
    $$('.spec-note').forEach(function (n) { n.hidden = true; });
  })();


  /* ── company details into the page ─────────────────────────────────────
     Contact details live in content.js and are written into the marked slots
     so a number is changed in exactly one place. The slots already contain
     the current values in the HTML, so a crawler that runs no JavaScript
     still reads the correct number. */

  (function () {
    var map = {
      'mobile':   CO.mobile,
      'office':   CO.office,
      'email':    CO.email,
      'address':  CO.address,
      'city':     CO.city,
      'name':     CO.name,
      'legal':    CO.legal
    };
    $$('[data-k]').forEach(function (el) {
      var v = map[el.dataset.k];
      if (v) el.textContent = v;
    });
    $$('[data-href]').forEach(function (el) {
      var t = el.dataset.href;
      if (t === 'tel-mobile')  el.href = 'tel:' + CO.mobileRaw;
      if (t === 'tel-office')  el.href = 'tel:' + CO.officeRaw;
      if (t === 'mail')        el.href = 'mailto:' + CO.email;
      if (t === 'facebook')    el.href = CO.facebook;
      if (t === 'wa') {
        el.href = 'https://wa.me/' + CO.whatsapp + '?text=' +
          encodeURIComponent('Hello Kingson Engineering — I would like to enquire about ');
      }
    });
  })();


  /* first paint of everything scroll-driven */
  requestFrame();
})();
