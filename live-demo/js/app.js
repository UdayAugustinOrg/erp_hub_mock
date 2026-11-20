/* ==========================================================
   app.js: renders the Infinity ERP shell (icon rail, top bar,
   sticky page head, footer) and wires up shared interactions:
   clickable rows, awesome-bar search, rail toggle and groups,
   list status filter, form tabs, tree toggles, demo actions.
   ========================================================== */

const App = (() => {
  let built = false;
  const root = () => document.getElementById('root');

  /* Rail state: collapsed by default (as on the live system); the toggle pins it open. Per-viewer only. */
  const store = {
    get: () => { try { return localStorage.getItem('infinity-rail') === 'open'; } catch (e) { return false; } },
    set: (v) => { try { localStorage.setItem('infinity-rail', v ? 'open' : 'closed'); } catch (e) { /* storage blocked */ } },
  };
  function applyRail(open) {
    document.body.classList.toggle('rail-pinned', open);
    const t = document.querySelector('.tb-toggle');
    if (t) t.innerHTML = lmd(open ? 'menu-fold-left' : 'menu-fold-right');
  }

  function buildShell() {
    root().innerHTML = `
      <nav class="rail" id="sb"></nav>
      <div class="app-content">
        <header class="tb">
          <button class="tb-toggle" data-act="rail" aria-label="Toggle sidebar"></button>
          <div class="tb-crumbs" id="crumbs"></div>
          <div class="tb-right">
            <label class="tb-search" data-t="search"><input id="q" placeholder="Search or type a command (Ctrl + G)" autocomplete="off"><div class="tb-results" id="qres"></div></label>
            <button class="tb-bell" data-act="mock" aria-label="Notifications">${lmd('bell')}</button>
            <span class="tb-divider"></span>
            <button class="tb-help" data-act="mock">Help${icon('down')}</button>
            <span class="tb-avatar" title="Administrator">A</span>
          </div>
        </header>
        <div class="page-head" id="pagehead"></div>
        <main class="content" id="view"></main>
      </div>
      <footer class="app-footer">Infinity Information Technology Solutions © 2026</footer>`;
    document.body.classList.add('erp');
    applyRail(store.get());
    built = true;
  }

  function render(r) {
    if (r.parts[0] !== 'erp') { history.replaceState(null, '', location.pathname + location.search + '#/erp/home'); r = Router.parse(); }
    if (!built) buildShell();
    document.getElementById('sb').innerHTML = erpSidebar(r);
    const view = document.getElementById('view');
    try { view.innerHTML = erpView(r); } catch (e) { console.error(e); view.innerHTML = notFound(); }
    /* Breadcrumbs go to the top bar and the page title row to the sticky page head, as on the live desk */
    const c = view.querySelector(':scope > .crumbs');
    document.getElementById('crumbs').innerHTML = c ? c.innerHTML : '';
    if (c) c.remove();
    const ph = document.getElementById('pagehead');
    ph.innerHTML = '';
    const h = view.querySelector(':scope > .page-h');
    if (h) ph.appendChild(h);
    const title = h?.querySelector('h1')?.textContent;
    document.title = `${title ? title + ' · ' : ''}Infinity ERP`;
    window.scrollTo(0, 0);
  }

  /* ---------- Awesome-bar search ---------- */
  const INDEX = Object.entries(DOCS).map(([k, d]) => {
    const [slug, ...rest] = k.split(':');
    const name = rest.join(':');
    return { slug, name, text: `${name} ${d.customer || d.supplier || d.party || d.item_name || d.employee_name || ''}`.toLowerCase(), sub: DOCTYPES[slug].one + (d.customer || d.supplier ? ' · ' + (d.customer || d.supplier) : '') };
  });
  const PAGES = [
    ...Object.entries(DOCTYPES).map(([s, t]) => [`#/erp/list/${s}`, `${t.one} List`, 'List']),
    ...Object.entries(REPORTS).map(([k, r]) => [`#/erp/report/${k}`, `${r.label} Report`, 'Report']),
    ...Object.entries(WS_LABEL).map(([id, l]) => [wsHref(id), `${l} Workspace`, 'Workspace']),
  ];
  function search(q) {
    const box = document.getElementById('qres');
    if (!box) return;
    q = q.trim().toLowerCase();
    if (!q) { box.classList.remove('open'); return; }
    const words = q.split(/\s+/);
    const pages = PAGES.filter(([, l]) => words.every((w) => l.toLowerCase().includes(w))).slice(0, 4);
    const docs = INDEX.filter((x) => words.every((w) => x.text.includes(w))).slice(0, 8).map((x) => [formHref(x.slug, x.name), x.name, x.sub]);
    const hits = [...pages, ...docs];
    const mark = (s) => esc(s).replace(new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'ig'), '<mark>$1</mark>');
    const extra = `<a data-act="mock"><b style="font-weight:600">Search for ${esc(q)}</b></a><a data-act="mock">Help on Search</a>`;
    box.innerHTML = (hits.length ? hits.map(([h, n, s], i) => `<a href="${h}" class="${i ? '' : 'hl'}"><span class="q-name">${mark(n)}</span><span>${esc(s)}</span></a>`).join('') : '') + extra;
    box.classList.add('open');
  }

  /* ---------- Interactions ---------- */
  document.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]');
    if (act) {
      const a = act.dataset.act;
      if (a === 'mock') toast('This action is not part of the demo.');
      if (a === 'refresh') Router.render(true);
      if (a === 'rail') { const open = !document.body.classList.contains('rail-pinned'); store.set(open); applyRail(open); }
      if (a === 'amend') amendFlow(act.dataset.doc);
      if (a === 'fix-cust') fixCustomer(act.dataset.cust, act.dataset.field);
      if (a === 'tree-all') document.querySelectorAll('.tree tr').forEach((tr) => { tr.classList.remove('hide'); tr.classList.add('open'); });
      return;
    }
    const grp = e.target.closest('[data-rail-group]');
    if (grp) { e.preventDefault(); grp.parentElement.classList.toggle('open'); return; }
    const tab = e.target.closest('[data-tab]');
    if (tab) {
      tab.parentElement.querySelectorAll('a').forEach((x) => x.classList.toggle('on', x === tab));
      if (tab.dataset.tab === 'Connections') document.querySelector('[data-t="connections"]')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      else if (tab.dataset.tab === 'Details') window.scrollTo({ top: 0, behavior: 'smooth' });
      else toast(`The ${tab.dataset.tab} tab is not part of the demo.`);
      return;
    }
    const tg = e.target.closest('[data-tree]');
    if (tg) { toggleTree(tg.dataset.tree); return; }
    const row = e.target.closest('tr[data-href]');
    if (row && !e.target.closest('a,button')) { location.hash = row.dataset.href; return; }
    if (!e.target.closest('.tb-search')) document.getElementById('qres')?.classList.remove('open');
  });
  document.addEventListener('change', (e) => {
    const s = e.target.closest('[data-status-filter]');
    if (s) location.hash = `#/erp/list/${s.dataset.statusFilter}${s.value ? '?status=' + encodeURIComponent(s.value) : ''}`;
  });
  document.addEventListener('input', (e) => { if (e.target.id === 'q') search(e.target.value); });
  document.addEventListener('keydown', (e) => {
    if (e.target.id === 'q' && e.key === 'Enter') { const a = document.querySelector('#qres a[href]'); if (a) { location.hash = a.getAttribute('href'); e.target.value = ''; search(''); e.target.blur(); } }
    if (e.target.id === 'q' && e.key === 'Escape') { e.target.value = ''; search(''); e.target.blur(); }
    if ((e.ctrlKey || e.metaKey) && ['g', 'k'].includes(e.key.toLowerCase())) { e.preventDefault(); document.getElementById('q')?.focus(); }
  });

  function toggleTree(key) {
    const tr = document.querySelector(`.tree tr[data-key="${CSS.escape(key)}"]`);
    const open = !tr.classList.contains('open');
    tr.classList.toggle('open', open);
    const hideAll = (k) => document.querySelectorAll(`.tree tr[data-parent="${CSS.escape(k)}"]`).forEach((c) => { c.classList.add('hide'); c.classList.remove('open'); hideAll(c.dataset.key); });
    if (open) document.querySelectorAll(`.tree tr[data-parent="${CSS.escape(key)}"]`).forEach((c) => c.classList.remove('hide'));
    else hideAll(key);
  }

  function amendFlow(doc) {
    modal({
      title: `Cancel and amend ${doc}`,
      body: `<p>Infinity ERP will:</p><ol style="margin:10px 0 0 18px;line-height:1.8"><li>Cancel <b>${doc}</b> (it stays on record, marked Cancelled).</li><li>Create the amended copy <b>${doc}-1</b> with the corrected customer details.</li><li>On submit, the amended invoice is e-invoiced again automatically and its status updates here.</li></ol>`,
      confirm: 'Cancel & amend',
      onConfirm: () => toast(`Demo: in the live system ${doc}-1 would now be created and e-invoiced. No demo data was changed.`, 4200),
    });
  }
  function fixCustomer(cust, field) {
    const addr = field === 'Billing address';
    modal({
      title: addr ? `Add billing address · ${cust}` : `Correct VAT number · ${cust}`,
      body: addr
        ? `<div class="fields c2"><div class="fld"><div class="lbl">Address line 1</div><div class="val muted">Street and building</div></div><div class="fld"><div class="lbl">City</div><div class="val muted">e.g. Muscat</div></div><div class="fld"><div class="lbl">Postal code</div><div class="val muted">3-digit code</div></div><div class="fld"><div class="lbl">Country</div><div class="val">Oman</div></div></div>`
        : `<div class="fld bad"><div class="lbl">Current VAT number</div><div class="val">${esc(CUSTOMER[cust].tax_id)} <span class="flag">7 characters</span></div></div><p style="margin-top:12px">Enter the customer's full VAT number: <b>OM</b> followed by <b>10 digits</b> (12 characters), as shown on their VAT certificate.</p>`,
      confirm: 'Save',
      onConfirm: () => toast('Demo: saved in the live system. Next, cancel and amend the invoice so a corrected e-invoice is sent.', 4200),
    });
  }

  return { render };
})();

window.addEventListener('DOMContentLoaded', () => Router.render(true));
