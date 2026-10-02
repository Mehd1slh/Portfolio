/* Projects filter: multi-label tags, OR inside a group, AND across groups.
   Load AFTER switcher.js. Cards declare their tags in HTML:
   <div class="project-container proj-card" data-topic="rag geo" data-context="academic" data-event="optional event name"> */
(function () {
  'use strict';

  var root = document.getElementById('proj-filters');
  var cards = [].slice.call(document.querySelectorAll('#Projects .proj-card'));
  if (!root || !cards.length) return;

  // [EN, FR]. Add or rename labels here; the filter bar builds itself from this.
  var LABELS = {
    topic: {
      rag: ['RAG & LLMs', 'RAG & LLM'],
      multiagent: ['Multi-agent', 'Multi-agents'],
      fullstack: ['Full-stack', 'Full-stack'],
      geo: ['Geospatial', 'Géospatial'],
      data: ['Data & BI', 'Données & BI']
    },
    context: {
      research: ['Research', 'Recherche'],
      hackathon: ['Hackathon', 'Hackathon'],
      academic: ['Academic', 'Académique'],
      internship: ['Internship', 'Stage']
    }
  };
  var GROUPS = { topic: ['Topic', 'Thème'], context: ['Context', 'Contexte'] };
  var UI = {
    clear: ['Clear filters', 'Réinitialiser les filtres'],
    empty: ['No project matches these filters.', 'Aucun projet ne correspond à ces filtres.'],
    count: [
      function (n, t) { return 'Showing ' + n + ' of ' + t + ' projects'; },
      function (n, t) { return n + ' projet' + (n > 1 ? 's' : '') + ' sur ' + t; }
    ]
  };

  var active = {};
  Object.keys(LABELS).forEach(function (g) { active[g] = {}; });

  function lang() {
    var b = document.querySelector('.ctl-lang [aria-pressed="true"]');
    return b && b.getAttribute('data-set-lang') === 'fr' ? 1 : 0;
  }
  function tags(card, g) { return (card.getAttribute('data-' + g) || '').split(/\s+/).filter(Boolean); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function bi(node, pair) {
    node.setAttribute('data-en', pair[0]);
    node.setAttribute('data-fr', pair[1]);
    node.textContent = pair[lang()];
    return node;
  }

  // ---- Filter bar (counts are computed, never hand-maintained) ----
  Object.keys(LABELS).forEach(function (g) {
    var wrap = el('div', 'proj-group');
    wrap.setAttribute('role', 'group');
    var label = bi(el('span', 'proj-group-label'), GROUPS[g]);
    wrap.appendChild(label);
    var row = el('div', 'proj-group-chips');
    Object.keys(LABELS[g]).forEach(function (key) {
      var n = cards.filter(function (c) { return tags(c, g).indexOf(key) > -1; }).length;
      if (!n) return;
      var b = el('button', 'proj-chip-btn');
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('data-group', g);
      b.setAttribute('data-key', key);
      b.appendChild(bi(el('span', 't'), LABELS[g][key]));
      b.appendChild(el('span', 'n', '(' + n + ')'));
      row.appendChild(b);
    });
    wrap.appendChild(row);
    root.appendChild(wrap);
  });

  var status = el('div', 'proj-status');
  var count = el('span');
  count.setAttribute('aria-live', 'polite');
  var clear = bi(el('button', 'proj-link-btn'), UI.clear);
  clear.type = 'button';
  clear.hidden = true;
  status.appendChild(count);
  status.appendChild(clear);
  root.appendChild(status);

  var empty = el('div', 'proj-empty');
  empty.hidden = true;
  empty.appendChild(bi(el('p'), UI.empty));
  var emptyBtn = bi(el('button', 'proj-link-btn'), UI.clear);
  emptyBtn.type = 'button';
  empty.appendChild(emptyBtn);
  root.parentNode.insertBefore(empty, root.nextSibling);

  // ---- Meta row on each card: context badge + topic names ----
  cards.forEach(function (card) {
    var h3 = card.querySelector('h3');
    if (!h3) return;
    var ctx = tags(card, 'context')[0];
    var ev = card.getAttribute('data-event');
    var evFr = card.getAttribute('data-event-fr') || ev;
    var meta = el('div', 'proj-meta');
    if (ctx && LABELS.context[ctx]) {
      var badge = el('span', 'proj-badge');
      var pair = LABELS.context[ctx].map(function (s, i) { var e = i ? evFr : ev; return e ? s + ': ' + e : s; });
      meta.appendChild(bi(badge, pair));
    }
    var names = [0, 1].map(function (i) {
      return tags(card, 'topic').map(function (k) { return LABELS.topic[k] ? LABELS.topic[k][i] : k; }).join(', ');
    });
    meta.appendChild(bi(el('span', 'proj-topics'), names));
    h3.parentNode.insertBefore(meta, h3.nextSibling);
  });

  // ---- Filtering ----
  function selected(g) { return Object.keys(active[g]); }
  function anyActive() { return Object.keys(active).some(function (g) { return selected(g).length; }); }

  function apply() {
    var shown = 0;
    cards.forEach(function (card) {
      var ok = Object.keys(active).every(function (g) {
        var sel = selected(g);
        if (!sel.length) return true;                       // no filter in this group
        var t = tags(card, g);
        return sel.some(function (k) { return t.indexOf(k) > -1; });  // OR within group
      });                                                   // every() = AND across groups
      card.hidden = !ok;
      if (ok) shown++;
    });
    count.textContent = UI.count[lang()](shown, cards.length);
    clear.hidden = !anyActive();
    empty.hidden = shown > 0;
    root.querySelectorAll('.proj-chip-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', active[b.getAttribute('data-group')][b.getAttribute('data-key')] ? 'true' : 'false');
    });
    saveUrl();
  }

  function reset() { Object.keys(active).forEach(function (g) { active[g] = {}; }); apply(); }

  root.addEventListener('click', function (ev) {
    var b = ev.target.closest('.proj-chip-btn');
    if (!b) return;
    var g = b.getAttribute('data-group'), k = b.getAttribute('data-key');
    if (active[g][k]) delete active[g][k]; else active[g][k] = true;
    apply();
  });
  clear.addEventListener('click', reset);
  emptyBtn.addEventListener('click', reset);

  // ---- Shareable state: ?topic=rag,geo&context=hackathon (the #Projects hash is left alone) ----
  function saveUrl() {
    try {
      var p = new URLSearchParams();
      Object.keys(active).forEach(function (g) { if (selected(g).length) p.set(g, selected(g).join(',')); });
      var q = p.toString();
      history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash);
    } catch (e) { /* file:// or sandboxed: ignore */ }
  }
  function loadUrl() {
    try {
      var p = new URLSearchParams(location.search);
      Object.keys(active).forEach(function (g) {
        (p.get(g) || '').split(',').forEach(function (k) { if (LABELS[g][k]) active[g][k] = true; });
      });
    } catch (e) { /* ignore */ }
  }

  // ---- EN/FR sync with your existing switcher (no changes to translations.js needed) ----
  function translate() {
    var i = lang();
    document.querySelectorAll('#Projects [data-en]').forEach(function (n) {
      var v = n.getAttribute(i ? 'data-fr' : 'data-en');
      if (v != null) n.textContent = v;
    });
    count.textContent = UI.count[i](cards.filter(function (c) { return !c.hidden; }).length, cards.length);
  }
  var langBox = document.querySelector('.ctl-lang');
  if (langBox && window.MutationObserver) {
    new MutationObserver(translate).observe(langBox, { attributes: true, subtree: true, attributeFilter: ['aria-pressed'] });
  }
  window.addEventListener('load', translate);

  loadUrl();
  apply();
  translate();
})();