/* ==========================================================
   app.js: renders the right shell (ERP desk or Hub console)
   for the current route and wires up shared interactions:
   clickable rows, global search, tree toggles, demo actions.
   ========================================================== */

const App = (() => {
  let shell = null;
  const root = () => document.getElementById('root');

  function erpTopbar() {
    return `<header class="tb">
      <label class="tb-search" data-t="search">${icon('search')}<input id="q" placeholder="Search invoices, customers, items…" autocomplete="off"><kbd>Ctrl K</kbd><div class="tb-results" id="qres"></div></label>
      <div class="tb-right">
        <a class="app-switch" href="#/hub/dashboard" data-t="to-hub">${icon('send')}<span>e-Invoice Hub</span></a>
        <button class="co-switch" data-t="company" data-act="company"><span class="dot">ID</span><span>Infy Demo Company</span>${icon('down')}</button>
        <button class="icon-btn" data-act="mock" aria-label="Notifications">${icon('bell')}<span class="badge"></span></button>
        <span class="avatar" title="Demo Employee 02 · Finance Manager">DE</span>
      </div></header>`;
  }
  function hubTopbar() {
    return `<header class="tb">
      <label class="tb-search">${icon('search')}<input id="q" placeholder="Search by document number or UUID…" autocomplete="off"><div class="tb-results" id="qres"></div></label>
      <div class="tb-right">
        <span class="co-switch"><span class="dot">ID</span><span>Infy Demo Company</span></span>
        <a class="app-switch" href="#/erp/home" data-t="to-erp">${icon('grid')}<span>Infinity ERP</span></a>
        <span class="avatar" title="Hub operator">OP</span>
      </div></header>`;
  }

  function render(r) {
    const app = r.parts[0] === 'hub' ? 'hub' : 'erp';
    if (shell !== app) {
      shell = app;
      document.body.classList.toggle('hub', app === 'hub');
      document.body.classList.toggle('erp', app === 'erp');
      root().innerHTML = `<aside class="sb" id="sb"></aside>${app === 'hub' ? hubTopbar() : erpTopbar()}<main class="content" id="view"></main>`;
    }
    document.getElementById('sb').innerHTML = app === 'hub' ? hubSidebar(r) : erpSidebar(r);
    const view = document.getElementById('view');
    try { view.innerHTML = app === 'hub' ? hubView(r) : erpView(r); } catch (e) { console.error(e); view.innerHTML = notFound(); }
    document.title = `${app === 'hub' ? 'Infinity e-Invoice Hub' : 'Infinity ERP'} · Demo`;
    window.scrollTo(0, 0);
  }

  /* ---------- Global search ---------- */
  const INDEX = Object.entries(DOCS).map(([k, d]) => {
    const [slug, ...rest] = k.split(':');
    const name = rest.join(':');
    return { slug, name, text: `${name} ${d.customer || d.supplier || d.party || d.item_name || d.employee_name || ''}`.toLowerCase(), sub: DOCTYPES[slug].one + (d.customer || d.supplier ? ' · ' + (d.customer || d.supplier) : '') };
  });
  function search(q) {
    const box = document.getElementById('qres');
    if (!box) return;
    q = q.trim().toLowerCase();
    if (!q) { box.classList.remove('open'); return; }
    const hub = shell === 'hub';
    const hits = hub
      ? window.HUB.filter((h) => `${h.erp_doc_id} ${h.uuid || ''}`.toLowerCase().includes(q)).slice(0, 10).map((h) => [`#/hub/doc/${h.erp_doc_id}`, h.erp_doc_id, TYPE_LABEL[h.type_code]])
      : INDEX.filter((x) => x.text.includes(q)).slice(0, 10).map((x) => [formHref(x.slug, x.name), x.name, x.sub]);
    box.innerHTML = hits.length ? hits.map(([h, n, s], i) => `<a href="${h}" class="${i ? '' : 'hl'}">${esc(n)}<span>${esc(s)}</span></a>`).join('') : '<a><span>No matches</span></a>';
    box.classList.add('open');
  }

  /* ---------- Interactions ---------- */
  document.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]');
    if (act) {
      const a = act.dataset.act;
      if (a === 'mock') toast('This action is not part of the demo.');
      if (a === 'company') toast('Company: Infy Demo Company (the only company in this demo).');
      if (a === 'amend') amendFlow(act.dataset.doc);
      if (a === 'fix-cust') fixCustomer(act.dataset.cust, act.dataset.field);
      if (a === 'tree-all') document.querySelectorAll('.tree tr').forEach((tr) => { tr.classList.remove('hide'); tr.classList.add('open'); });
      return;
    }
    const tg = e.target.closest('[data-tree]');
    if (tg) { toggleTree(tg.dataset.tree); return; }
    const row = e.target.closest('tr[data-href]');
    if (row && !e.target.closest('a,button')) { location.hash = row.dataset.href; return; }
    if (!e.target.closest('.tb-search')) document.getElementById('qres')?.classList.remove('open');
  });
  document.addEventListener('input', (e) => { if (e.target.id === 'q') search(e.target.value); });
  document.addEventListener('keydown', (e) => {
    if (e.target.id === 'q' && e.key === 'Enter') { const a = document.querySelector('#qres a[href]'); if (a) { location.hash = a.getAttribute('href'); e.target.value = ''; search(''); } }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); document.getElementById('q')?.focus(); }
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
      body: `<p>Infinity ERP will:</p><ol style="margin:10px 0 0 18px;line-height:1.8"><li>Cancel <b>${doc}</b> (it stays on record, marked Cancelled).</li><li>Create the amended copy <b class="mono">${doc}-1</b> using the corrected customer details.</li><li>On submit, the e-Invoice Hub picks up the amended copy automatically and delivers it.</li></ol>`,
      confirm: 'Cancel & amend',
      onConfirm: () => toast(`Demo: in the live system ${doc}-1 would now be created and sent to the hub. No demo data was changed.`, 4200),
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
      onConfirm: () => toast('Demo: saved in the live system. Next, cancel and amend the invoice so the hub sends a corrected copy.', 4200),
    });
  }

  return { render };
})();

window.addEventListener('DOMContentLoaded', () => Router.render(true));
