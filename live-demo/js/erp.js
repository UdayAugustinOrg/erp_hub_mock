/* ==========================================================
   erp.js: Infinity ERP desk views (dashboard, workspaces,
   list views, form views, reports). Every figure comes from
   window.ERP; derived totals are computed here.
   ========================================================== */


/* ---------- Sidebar: the live Infinity ERP entries the demo needs, in live order ---------- */
const RAIL = [
  { id: 'home', label: 'Home', icon: 'home' },
  { label: 'Accounting', icon: 'document-list', group: [
    ['#/erp/list/sales-invoice', 'Sales Invoice', 'document-list'], ['#/erp/list/purchase-invoice', 'Purchase Invoice', 'document-list'],
    ['#/erp/list/payment-entry', 'Payment Entry', 'document-list'], ['#/erp/list/journal-entry', 'Journal Entry', 'document-list'],
    ['#/erp/report/coa', 'Chart of Accounts', 'grid-3'], ['#/erp/report/pl', 'Profit and Loss', 'grid-3'], ['#/erp/report/bs', 'Balance Sheet', 'grid-3'],
    ['#/erp/report/gl', 'General Ledger', 'grid-3'], ['#/erp/report/ar', 'Accounts Receivable', 'grid-3'], ['#/erp/report/ap', 'Accounts Payable', 'grid-3']] },
  { id: 'buying', label: 'Buying', icon: 'check-list-3' },
  { id: 'selling', label: 'Selling', icon: 'briefcase' },
  { id: 'assets', label: 'Assets', icon: 'document-report' },
  { id: 'stock', label: 'Stock', icon: 'clipboard' },
  { id: 'support', label: 'Support', icon: 'chat-bubble' },
];
const WS_LABEL = { home: 'Home', accounting: 'Accounting', buying: 'Buying', selling: 'Selling', assets: 'Assets', stock: 'Stock', support: 'Support' };
const REPORTS = {
  coa: { label: 'Chart of Accounts', icon: 'tree', module: 'accounting' },
  gl: { label: 'General Ledger', icon: 'book', module: 'accounting' },
  pl: { label: 'Profit and Loss Statement', icon: 'chart', module: 'accounting' },
  bs: { label: 'Balance Sheet', icon: 'scale', module: 'accounting' },
  ar: { label: 'Accounts Receivable', icon: 'inbox', module: 'accounting' },
  ap: { label: 'Accounts Payable', icon: 'send', module: 'accounting' },
  stock: { label: 'Stock Balance', icon: 'box', module: 'stock' },
};
const wsHref = (id) => (id === 'home' ? '#/erp/home' : `#/erp/ws/${id}`);

/* ---------- Ledger helpers ---------- */
const GL = Object.fromEntries(D.gl_by_account.map((g) => [g.account_number, g]));
const ACC = Object.fromEntries(D.accounts_tree_top.map((a) => [a.name, a]));
const accByNo = Object.fromEntries(D.accounts_tree_top.filter((a) => a.account_number).map((a) => [a.account_number, a]));
const glBal = (no) => (GL[no] ? GL[no].bal : 0);
const parentOf = (no) => ACC[accByNo[no].parent_account];
/* Groups GL balances of one root type by their parent account (e.g. 4000 Equipment Sales) */
function glGroups(root, sign = 1) {
  const groups = {};
  for (const g of D.gl_by_account.filter((x) => x.root_type === root)) {
    const p = parentOf(g.account_number);
    const k = p.account_number;
    (groups[k] = groups[k] || { no: k, name: p.account_name, rows: [], total: 0 }).rows.push({ no: g.account_number, name: g.account_name, amt: r3(g.bal * sign) });
    groups[k].total = r3(groups[k].total + g.bal * sign);
  }
  return Object.values(groups).sort((a, b) => a.no.localeCompare(b.no));
}
const rootTotal = (root, sign = 1) => r3(sum(D.gl_by_account.filter((x) => x.root_type === root), 'bal') * sign);
/* Account tree helpers for the standard statements */
const KIDS = {};
D.accounts_tree_top.forEach((a) => { (KIDS[a.parent_account || ''] = KIDS[a.parent_account || ''] || []).push(a); });
Object.values(KIDS).forEach((l) => l.sort((x, y) => (x.account_number || '').localeCompare(y.account_number || '')));
const accTotal = (a) => (a.is_group ? sum(KIDS[a.name] || [], accTotal) : glBal(a.account_number));
const groupTotal = (no) => r3(accTotal(accByNo[no]));
const FIN = (() => {
  const income = rootTotal('Income', -1);
  const expense = rootTotal('Expense');
  const cogs = groupTotal('5100');
  return {
    income, expense, cogs, opIncome: income, net: r3(income - expense), gross: r3(income - cogs),
    assets: rootTotal('Asset'), liabilities: rootTotal('Liability', -1), equity: rootTotal('Equity', -1),
    receivable: glBal('1310'), payable: r3(-(glBal('2110') + glBal('2130'))), stock: glBal('1410'),
    cash: r3(groupTotal('1100') + groupTotal('1200')),
    sales: sum(D.sales_by_month, 'v'), purchases: r3(sum(D.purchase_by_month, 'v')),
  };
})();

/* ---------- Cell formatting ---------- */
const LINK_FIELDS = ['customer', 'supplier', 'item_code', 'party', 'party_name', 'return_against', '_receipt', '_claim', 'asset', 'asset_category', 'target_asset'];
function cell(row, [f, , type], slug) {
  const v = row[f];
  if (type === 'money') return money(v, row.currency || 'OMR');
  if (type === 'omr') return num(v);
  if (type === 'date') return fdate(v);
  if (type === 'month') return v ? `${MONTHS[+v.slice(5, 7) - 1]} ${v.slice(0, 4)}` : '—';
  if (type === 'cat') return docLink(v);
  if (type === 'pct') return v == null ? '—' : `<div style="display:flex;align-items:center;gap:8px;min-width:110px"><div class="progress" style="flex:1"><i style="width:${v}%"></i></div><span class="small">${Math.round(v)}%</span></div>`;
  if (type === 'einv') return pill(v === 'Failed' ? 'Failed' : v, v === 'Failed' ? 'bad' : v === 'Not sent' ? 'mute' : 'ok');
  if (type === 'clip') return `<span title="${esc(v)}" style="display:inline-block;max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:bottom">${esc(v)}</span>`;
  if (type === 'n1') return num(v, 2).replace(/\.00$/, '.0');
  if (v == null || v === '') return '<span class="muted">—</span>';
  if (LINK_FIELDS.includes(f) || type === 'party') return docLink(v);
  return esc(v);
}
const isNum = (type) => ['money', 'omr', 'n1'].includes(type);

/* ---------- Shell (icon rail) ---------- */
function currentWs(r) {
  const [, view, a] = r.parts;
  if (!view || view === 'home') return 'home';
  if (view === 'ws') return a;
  if (view === 'list' || view === 'form') return DOCTYPES[a]?.module;
  if (view === 'report') return REPORTS[a]?.module;
  return null;
}
function erpSidebar(r) {
  const cur = currentWs(r);
  const path = '#' + r.raw.split('?')[0];
  const chev = '<svg class="rail-chev" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>';
  const subOn = (href) => path === href || (path.startsWith(href.replace('/list/', '/form/') + '/'));
  return `
  <div class="rail-logo"><a href="#/erp/home" title="Infinity ERP"><img src="img/infinity-logo.png" alt="Infinity ERP"></a></div>
  <div class="rail-nav" data-t="sidebar"><ul class="rail-list">
    ${RAIL.map((it) => {
      if (!it.group) return `<li class="rail-li ${cur === it.id ? 'active' : ''}"><a class="rail-a" href="${wsHref(it.id)}" title="${esc(it.label)}">${lmd(it.icon)}<span class="rail-label">${esc(it.label)}</span></a></li>`;
      const has = cur === 'accounting';
      return `<li class="rail-li group ${has ? 'open has-active' : ''}"><a class="rail-a" href="javascript:void(0)" data-rail-group title="${esc(it.label)}">${lmd(it.icon)}<span class="rail-label">${esc(it.label)}</span>${chev}</a>
        <ul class="rail-box">${it.group.map(([href, l, ic]) => `<li><a class="rail-sub ${subOn(href) ? 'active' : ''}" href="${href}">${lmd(ic)}<span>${esc(l)}</span></a></li>`).join('')}</ul></li>`;
    }).join('')}
  </ul></div>`;
}

/* ---------- Charts ---------- */
function salesChart() {
  const months = D.sales_by_month.map((s) => s.m);
  const sales = D.sales_by_month.map((s) => s.v);
  const purch = months.map((m) => (D.purchase_by_month.find((p) => p.m === m) || {}).v || 0);
  const W = 900, H = 300, pl = 64, pb = 34, pt = 22, max = 60000;
  const y = (v) => pt + (H - pt - pb) * (1 - v / max);
  const gw = (W - pl - 20) / months.length;
  const bw = Math.min(80, gw / 3.6);
  let g = '';
  for (let t = 0; t <= max; t += 15000) g += `<line x1="${pl}" x2="${W - 10}" y1="${y(t)}" y2="${y(t)}" stroke="#EDEDED"/><text x="${pl - 10}" y="${y(t) + 4}" text-anchor="end" font-size="11" fill="#525252">${t ? num(t).replace(/\.\d+$/, '') : '0'}</text>`;
  months.forEach((m, i) => {
    const cx = pl + gw * i + gw / 2;
    const bar = (v, x, c) => `<rect x="${x}" y="${y(v)}" width="${bw}" height="${y(0) - y(v)}" fill="${c}"><title>${num(v)}</title></rect>
      <text x="${x + bw / 2}" y="${y(v) - 7}" text-anchor="middle" font-size="11.5" font-weight="600" fill="#082f32">${num(v).replace(/\.\d+$/, '')}</text>`;
    g += bar(sales[i], cx - bw - 3, '#0f626a') + bar(purch[i], cx + 3, '#4db6ac');
    g += `<text x="${cx}" y="${H - 10}" text-anchor="middle" font-size="11.5" fill="#525252">${MONTHS[+m.slice(5) - 1]} ${m.slice(0, 4)}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Monthly sales and purchases" font-family="Outfit, sans-serif">${g}</svg>`;
}

/* Shortcut card (Quick Access) and link-card helpers, as on live workspaces */
function shortcutOf(key) {
  if (key.startsWith('report:')) { const k = key.slice(7); return `<a class="shortcut" href="#/erp/report/${k}"><b>${REPORTS[k].label}</b>${icon('arrowur', 'arr')}</a>`; }
  const t = DOCTYPES[key];
  const open = { 'sales-invoice': ['Unpaid', 'Partly Paid'], 'purchase-invoice': ['Unpaid'], 'sales-order': ['To Deliver and Bill'], 'purchase-order': ['To Receive', 'To Receive and Bill'], 'warranty-claim': ['Open'], lead: ['Open'], opportunity: ['Open'] }[key];
  const n = open ? t.rows.filter((r) => open.includes(statusOf(key, r))).length : 0;
  const badge = open && n ? `<span class="count warn">${n} ${open[0] === 'To Deliver and Bill' ? 'To Deliver' : open[0].replace('To Receive and Bill', 'To Receive')}</span>` : `<span class="count">${t.rows.length}</span>`;
  return `<a class="shortcut" href="#/erp/list/${key}"><b>${t.one}</b>${icon('arrowur', 'arr')}${badge}</a>`;
}
function linkItem(key) {
  if (key.startsWith('report:')) { const k = key.slice(7); return `<a class="link-item" href="#/erp/report/${k}">${REPORTS[k].label}${icon('right')}</a>`; }
  return `<a class="link-item" href="#/erp/list/${key}">${DOCTYPES[key].one}<span class="cnt">${DOCTYPES[key].rows.length}</span>${icon('right')}</a>`;
}
function shortcutsHtml(keys, title = 'Quick Access') {
  return `<div class="ws-section" data-t="ws-tiles"><div class="ws-h">${title}</div><div class="shortcuts">${keys.map(shortcutOf).join('')}</div></div>`;
}
function linkCardsHtml(cards) {
  return `<div class="ws-section"><div class="ws-h">Reports &amp; Masters</div><div class="linkcards">${cards.map(([t, keys]) => `<div class="card linkcard"><h4>${t}</h4>${keys.map(linkItem).join('')}</div>`).join('')}</div></div>`;
}
function pageTitle(title, actions = '', side = false) {
  return `<div class="page-h">${side ? `<span class="ph-side">${icon('sidebar')}</span>` : ''}<h1>${esc(title)}</h1>${actions ? `<div class="actions">${actions}</div>` : ''}</div>`;
}

/* ---------- Home ---------- */
function erpHome() {
  const tiles = [
    ['Sales (net)', FIN.sales, 'chart', '#/erp/list/sales-invoice', 'Oct + Nov 2026, before VAT', ''],
    ['Purchases', FIN.purchases, 'cart', '#/erp/list/purchase-invoice', 'Oct + Nov 2026, in OMR', 'c3'],
    ['Receivables', FIN.receivable, 'inbox', '#/erp/report/ar', 'Owed by customers', 'c1'],
    ['Payables', FIN.payable, 'send', '#/erp/report/ap', 'Owed to suppliers', 'c2'],
    ['Stock Value', FIN.stock, 'box', '#/erp/report/stock', 'All warehouses', 'c5'],
    ['Cash & Bank', FIN.cash, 'bank', '#/erp/report/bs', 'Petty cash + bank', 'c4'],
  ];
  const inv = D.sales_invoices;
  const failed = inv.filter((s) => EINV_ERR[s.name]);
  const sent = inv.filter((s) => ['Delivered', 'Accepted'].includes(s.custom_einvoice_status)).length;
  const byCust = {};
  inv.filter((s) => !s.is_return).forEach((s) => { byCust[s.customer] = (byCust[s.customer] || 0) + s.grand_total; });
  const top = Object.entries(byCust).sort((a, b) => b[1] - a[1]).slice(0, 6);
  return `${pageTitle('Home')}
  <div class="grid g3" data-t="kpis">
    ${tiles.map(([l, v, ic, href, foot, c]) => `<a class="card kpi ${c}" href="${href}"><span class="kpi-ic">${icon(ic)}</span><div class="val"><small>OMR</small>${num(v)}</div><div class="lbl">${l}</div><div class="foot">${foot}</div></a>`).join('')}
  </div>
  <div class="grid g-2-1">
    <div class="card" data-t="sales-chart"><div class="card-h"><h3>Sales Vs Purchases</h3><span class="sub">OMR, net of VAT</span></div>
      <div class="card-b chart">${salesChart()}<div class="legend" style="margin:6px 0 0 50px"><span><i style="background:#0f626a"></i>Sales</span><span><i style="background:#4db6ac"></i>Purchases</span></div></div></div>
    <div class="card" data-t="home-einv"><div class="card-h"><h3>E-Invoicing</h3><span class="right">${pill('Live', 'ok')}</span></div>
      <div class="card-b">
        <div class="grid g2" style="gap:12px">
          <div><div class="muted small">Delivered</div><div style="font-size:30px;font-weight:700;color:var(--green)">${sent}</div></div>
          <div><div class="muted small">Failed</div><div style="font-size:30px;font-weight:700;color:var(--red)">${failed.length}</div></div>
        </div>
        <div class="progress" style="margin:14px 0 6px;height:8px;background:var(--red-bg)"><i style="width:${(sent / (sent + failed.length)) * 100}%;background:var(--green)"></i></div>
        <div class="small muted">E-invoice status recorded on ${sent + failed.length} sales invoices, credit and debit notes.</div>
        <div style="margin-top:14px;display:grid;gap:8px">
          ${failed.map((s) => `<a class="banner bad" href="${formHref('sales-invoice', s.name)}" style="padding:9px 12px;text-decoration:none">${icon('alert')}<span><b>${s.name}</b><br><span class="small">${EINV_HELP[EINV_ERR[s.name].code].title}</span></span></a>`).join('')}
        </div>
      </div></div>
  </div>
  <div class="grid g2">
    <div class="card"><div class="card-h"><h3>Top Customers By Billing</h3><span class="sub">Incl. VAT</span></div>
      <div class="card-b bar-list">${top.map(([c, v]) => `<div class="row"><div><div class="name">${docLink(c)}</div><div class="bar"><i style="width:${(v / top[0][1]) * 100}%"></i></div></div><div class="num" style="font-weight:600">${omr(v)}</div></div>`).join('')}</div></div>
    <div class="card"><div class="card-h"><h3>Latest Sales Invoices</h3><a class="right small" style="color:var(--primary);font-weight:500" href="#/erp/list/sales-invoice">View all</a></div>
      <div class="tbl-pad"><table class="tbl"><tbody>${[...inv].sort((a, b) => b.posting_date.localeCompare(a.posting_date) || b.name.localeCompare(a.name)).slice(0, 7).map((s) => `<tr class="click" data-href="${formHref('sales-invoice', s.name)}"><td class="link">${esc(s.customer)}</td><td>${pill(s.status, statusTone(s.status))}</td><td class="num">${num(s.grand_total)}</td><td class="muted">${s.name}</td></tr>`).join('')}</tbody></table></div></div>
  </div>
  ${shortcutsHtml(['item', 'customer', 'supplier', 'sales-invoice'], 'Your Shortcuts')}
  ${linkCardsHtml([['Accounting', ['report:coa', 'payment-entry', 'journal-entry']], ['Stock', ['item', 'stock-entry', 'report:stock']], ['Selling', ['lead', 'opportunity', 'customer']]])}`;
}

/* ---------- Workspaces ---------- */
const WS = {
  accounting: { flow: ['Record to report', [['sales-invoice', 'Sales post automatically'], ['purchase-invoice', 'Purchases post automatically'], ['payment-entry', 'Receipts and payments'], ['journal-entry', 'Adjustments and accruals']]],
    quick: ['sales-invoice', 'purchase-invoice', 'payment-entry', 'journal-entry', 'report:coa', 'report:gl', 'report:pl', 'report:bs'],
    cards: [['Accounting Masters', ['report:coa', 'customer', 'supplier']], ['Payables', ['purchase-invoice', 'payment-entry', 'report:ap']], ['Receivables', ['sales-invoice', 'payment-entry', 'report:ar']]] },
  buying: { flow: ['Procure to pay', [['material-request', 'Stores ask for stock'], ['rfq', 'Invite suppliers'], ['supplier-quotation', 'Compare offers'], ['purchase-order', 'Order the best offer'], ['purchase-receipt', 'Receive the goods'], ['purchase-invoice', 'Book the bill'], ['payment-entry', 'Pay the supplier']]],
    quick: ['purchase-order', 'purchase-receipt', 'purchase-invoice', 'landed-cost-voucher', 'material-request', 'rfq', 'supplier-quotation', 'supplier'],
    cards: [['Buying', ['material-request', 'purchase-order', 'purchase-invoice']], ['Supplier', ['supplier', 'supplier-quotation', 'rfq']], ['Imports', ['purchase-receipt', 'landed-cost-voucher', 'report:ap']]] },
  selling: { flow: ['Lead to cash', [['lead', 'Capture the enquiry'], ['opportunity', 'Qualify the deal'], ['quotation', 'Send the price'], ['sales-order', 'Confirm the order'], ['delivery-note', 'Ship the goods'], ['sales-invoice', 'Bill + e-invoice'], ['payment-entry', 'Collect payment']]],
    quick: ['sales-invoice', 'quotation', 'sales-order', 'delivery-note', 'lead', 'opportunity', 'customer', 'item'],
    cards: [['Selling', ['customer', 'quotation', 'sales-order']], ['Fulfilment And Billing', ['delivery-note', 'sales-invoice', 'report:ar']], ['Pipeline', ['lead', 'opportunity']]] },
  stock: { flow: ['Stock and landed cost', [['purchase-receipt', 'Goods come in'], ['landed-cost-voucher', 'Add freight, duty, clearing'], ['stock-entry', 'Move or issue stock'], ['delivery-note', 'Goods go out']]],
    quick: ['item', 'landed-cost-voucher', 'purchase-receipt', 'delivery-note', 'stock-entry', 'report:stock'],
    cards: [['Items', ['item', 'report:stock']], ['Stock Transactions', ['purchase-receipt', 'delivery-note', 'stock-entry']], ['Landed Cost', ['landed-cost-voucher']]] },
  assets: { flow: ['Buy, capitalize, depreciate', [['purchase-invoice', 'Asset or CWIP bill'], ['asset-capitalization', 'Capitalize work in progress'], ['asset', 'Asset register'], ['asset-depreciation-schedule', 'Monthly schedule'], ['journal-entry', 'Depreciation posted']]],
    quick: ['asset', 'asset-category', 'asset-capitalization', 'asset-depreciation-schedule', 'journal-entry', 'report:bs'],
    cards: [['Assets', ['asset', 'asset-category']], ['Depreciation', ['asset-depreciation-schedule', 'journal-entry']], ['Capital Work In Progress', ['asset-capitalization', 'purchase-invoice']]] },
  support: { flow: ['Complaint to repair invoice', [['sales-invoice', 'Motor sold'], ['warranty-claim', 'Customer complaint'], ['maintenance-visit', 'Engineer visit'], ['sales-invoice', 'Repair invoice']]],
    quick: ['warranty-claim', 'maintenance-visit', 'sales-invoice'], cards: [['Warranty', ['warranty-claim']], ['Maintenance', ['maintenance-visit']], ['Billing', ['sales-invoice', 'report:ar']]] },
};
function flowCard(title, steps) {
  return `<div class="card" data-t="ws-flow"><div class="card-h"><h3>${title}</h3><span class="sub">Click a step to open its documents</span></div><div class="card-b"><div class="chain">${steps.map(([s, sub], i) => `${i ? `<span class="arrow">${icon('arrow')}</span>` : ''}<a class="node" href="#/erp/list/${s}"><div class="k">${icon(DOCTYPES[s].icon)}Step ${i + 1}</div><div class="t">${DOCTYPES[s].one}</div><div class="s">${sub}</div></a>`).join('')}</div></div></div>`;
}
function workspace(id) {
  const w = WS[id];
  if (!w) return notFound();
  return `${pageTitle(WS_LABEL[id])}
  ${w.flow ? flowCard(w.flow[0], w.flow[1]) : ''}
  ${shortcutsHtml(w.quick)}
  ${linkCardsHtml(w.cards)}`;
}
/* ---------- List view (live layout: filter inputs, rounded header row, title + status first) ---------- */
const TITLE_FIELDS = ['customer', 'supplier', 'party', 'employee_name', 'asset_name', 'project_name', 'subject', 'item_name', 'lead_name', 'party_name', 'stock_entry_type', 'voucher_type', 'material_request_type'];
function titleField(slug) {
  if (slug === 'customer' || slug === 'supplier') return null;
  const t = DOCTYPES[slug];
  return TITLE_FIELDS.find((f) => t.rows.some((r) => r[f] != null));
}
function listView(slug, query) {
  const t = DOCTYPES[slug];
  if (!t) return notFound();
  const statuses = {};
  t.rows.forEach((r) => { const s = statusOf(slug, r); if (s) statuses[s] = (statuses[s] || 0) + 1; });
  const sel = query.status;
  const rows = sel ? t.rows.filter((r) => statusOf(slug, r) === sel) : t.rows;
  const tf = titleField(slug);
  const cols = t.cols.filter((c) => c[0] !== tf);
  const partyLabel = { customer: 'Customer', supplier: 'Supplier', party: 'Party', employee_name: 'Employee' }[tf];
  const actions = `<button class="btn btn-default" data-act="mock">${icon('list')}List View${icon('down', 'caret')}</button><button class="btn btn-icon" data-act="refresh" aria-label="Refresh">${icon('refresh')}</button><button class="btn btn-icon" data-act="mock" aria-label="Menu">${icon('more')}</button><button class="btn btn-primary" data-act="mock">${icon('plus')}Add ${t.one}</button>`;
  return `${crumbs([[WS_LABEL[t.module], wsHref(t.module)], [t.one]])}
  ${pageTitle(t.one, actions, true)}
  ${slug === 'asset' ? assetRegisterSummary() : ''}
  <div class="layout-card" data-t="list">
    <div class="toolbar" data-t="list-filters">
      <span class="fbox">ID</span>
      ${partyLabel ? `<span class="fbox">${partyLabel}</span>` : ''}
      <span class="fbox filled">Infy Demo Company</span>
      ${Object.keys(statuses).length > 1 ? `<select class="fbox" data-status-filter="${slug}" aria-label="Status"><option value="">Status</option>${Object.entries(statuses).map(([s, n]) => `<option value="${esc(s)}" ${sel === s ? 'selected' : ''}>${esc(s)} (${n})</option>`).join('')}</select>` : ''}
      <span class="right"><span class="btn-group"><button class="btn btn-default" data-act="mock">${icon('filter')}Filter</button>${sel ? `<a class="btn btn-default" href="#/erp/list/${slug}" aria-label="Clear filter">${icon('x')}</a>` : ''}</span>
        <span class="btn-group"><button class="btn btn-default" data-act="mock" aria-label="Sort">${icon('sort')}</button><button class="btn btn-default" data-act="mock">Last Updated On</button></span></span>
    </div>
    <div class="tbl-wrap tbl-pad"><table class="tbl" data-t="list-table">
      <thead><tr><th style="width:34px"><span class="chk"></span></th><th>${tf ? (FIELD_LABELS[tf] || 'Title') : 'Name'}</th><th>Status</th>${cols.map((c) => `<th class="${isNum(c[2]) ? 'num' : ''}">${c[1]}</th>`).join('')}${tf ? '<th>ID</th>' : ''}<th class="num">${rows.length} of ${rows.length}</th></tr></thead>
      <tbody>${rows.map((r) => `<tr class="click" data-href="${formHref(slug, r[t.id])}" data-name="${esc(r[t.id])}">
        <td><span class="chk"></span></td><td class="link">${esc(tf ? r[tf] ?? r[t.id] : r[t.id])}</td><td>${pill(statusOf(slug, r))}</td>
        ${cols.map((c) => `<td class="${isNum(c[2]) ? 'num' : ''}">${cell(r, c, slug)}</td>`).join('')}${tf ? `<td class="muted">${esc(r[t.id])}</td>` : ''}
        <td class="num"><span class="row-meta">${icon('chat')} 0 · ${icon('heart')}</span></td></tr>`).join('')}</tbody>
    </table></div>
  </div>`;
}

/* ---------- Form view ---------- */
const FIELD_LABELS = {
  location: 'Location', purchase_date: 'Purchase date', purchase_invoice: 'Purchase invoice', purchase_receipt: 'Purchase receipt', is_composite_asset: 'Composite asset (built from CWIP)',
  calculate_depreciation: 'Calculate depreciation', depreciation_booked: 'Depreciation booked', asset: 'Asset', depreciation_method: 'Depreciation method',
  total_number_of_depreciations: 'Total number of depreciations', frequency_of_depreciation: 'Frequency (months)', enable_cwip_accounting: 'Enable CWIP accounting',
  frequency_months: 'Frequency (months)', life_months: 'Useful life (months)', life_years: 'Useful life (years)', capitalization_method: 'Capitalization method',
  target_asset: 'Target asset', target_asset_name: 'Target asset name', target_item_code: 'Target item', total_value: 'Total value', target_fixed_asset_account: 'Target fixed asset account',
  customer: 'Customer', supplier: 'Supplier', party_name: 'Party', posting_date: 'Posting date', transaction_date: 'Date', due_date: 'Due date',
  delivery_date: 'Delivery date', currency: 'Currency', bill_no: 'Supplier invoice no.', conversion_rate: 'Exchange rate', customer_group: 'Customer group',
  territory: 'Territory', tax_id: 'VAT number', custom_cr_number: 'CR number', supplier_group: 'Supplier group', country: 'Country', default_currency: 'Billing currency',
  item_name: 'Item name', item_group: 'Item group', stock_uom: 'Unit', customs_tariff_number: 'HS code (customs tariff)', lead_name: 'Contact person',
  company_name: 'Organisation', source: 'Source', sales_stage: 'Sales stage', opportunity_amount: 'Expected amount', material_request_type: 'Purpose',
  payment_type: 'Payment type', party_type: 'Party type', party: 'Party', paid_amount: 'Amount', mode_of_payment: 'Mode of payment', voucher_type: 'Entry type',
  total_debit: 'Total debit', user_remark: 'Remark', stock_entry_type: 'Purpose', total_outgoing_value: 'Outgoing value', total_incoming_value: 'Incoming value',
  item_code: 'Item', serial_no: 'Serial no.', complaint_date: 'Complaint date', mntc_date: 'Visit date', maintenance_type: 'Visit type', completion_status: 'Completion',
  project_name: 'Project name', percent_complete: '% Complete', estimated_costing: 'Estimated cost', total_billed_amount: 'Total billed', subject: 'Subject', project: 'Project',
  exp_end_date: 'Expected end', employee_name: 'Employee', total_hours: 'Total hours', total_billable_amount: 'Billable amount', designation: 'Designation',
  department: 'Department', date_of_joining: 'Date of joining', start_date: 'Payroll period', gross_pay: 'Gross pay', total_deduction: 'Total deductions', net_pay: 'Net pay',
  leave_type: 'Leave type', from_date: 'From', to_date: 'To', asset_name: 'Asset name', asset_category: 'Category', gross_purchase_amount: 'Gross purchase amount',
  available_for_use_date: 'Available for use', distribute_charges_based_on: 'Distribute charges by', total_taxes_and_charges: 'Total charges',
  grand_total: 'Grand total', base_grand_total: 'Grand total (OMR)', outstanding_amount: 'Outstanding', per_delivered: '% Delivered', per_billed: '% Billed', per_received: '% Received',
  net_total: 'Net total', is_stock_item: 'Maintain stock', standard_rate: 'Standard rate', valuation_rate: 'Valuation rate', value_after_depreciation: 'Value after depreciation',
};
const HIDE = ['name', 'items', 'status', 'taxes', 'receipts', 'custom_einvoice_status', 'custom_einvoice_uuid', 'custom_cn_reason_code', 'is_return', 'is_debit_note',
  'return_against', 'net_total', 'total_taxes_and_charges', 'grand_total', 'outstanding_amount', 'per_delivered', 'per_billed', 'per_received', 'complaint', 'resolution_details',
  'base_grand_total', 'conversion_rate', 'currency', 'standard_rate', 'valuation_rate', 'value_after_depreciation'];
const MONEY_F = ['depreciation_booked', 'total_value', 'opportunity_amount', 'paid_amount', 'total_debit', 'total_outgoing_value', 'total_incoming_value', 'estimated_costing', 'total_billed_amount',
  'total_billable_amount', 'gross_pay', 'total_deduction', 'net_pay', 'gross_purchase_amount', 'total_taxes_and_charges'];

function fieldVal(k, v, d) {
  if (v == null || v === '') return '<span class="muted">—</span>';
  if (k.endsWith('_date') || k === 'transaction_date' || k === 'mntc_date') return fdate(v);
  if (k === 'start_date') return `${MONTHS[+v.slice(5, 7) - 1]} ${v.slice(0, 4)}`;
  if (MONEY_F.includes(k)) return omr(v);
  if (k === 'is_stock_item') return v ? 'Yes' : 'No';
  if (k === 'percent_complete') return pct(v);
  if (['customer', 'supplier', 'party', 'party_name', 'item_code', 'asset', 'asset_category', 'purchase_invoice', 'purchase_receipt', 'target_asset'].includes(k)) return docLink(v);
  if (['is_composite_asset', 'calculate_depreciation', 'enable_cwip_accounting'].includes(k)) return v ? 'Yes' : 'No';
  return esc(v);
}
function detailsCard(d, extraFields = []) {
  const keys = Object.keys(d).filter((k) => !HIDE.includes(k) && !k.startsWith('_') && d[k] != null && d[k] !== '' && typeof d[k] !== 'object');
  const fields = keys.map((k) => [FIELD_LABELS[k] || k, fieldVal(k, d[k], d)]).concat(extraFields);
  return `<div class="card" data-t="details"><div class="card-h"><h3>Details</h3></div><div class="card-b"><div class="fields">
    ${fields.map(([l, v, cls]) => `<div class="fld ${cls || ''}"><div class="lbl">${l}</div><div class="val">${v}</div></div>`).join('')}</div></div></div>`;
}

function itemsCard(d, cur) {
  const { items, from } = itemsOf(d);
  if (!items) return '';
  const usd = cur === 'USD';
  return `<div class="card" data-t="items"><div class="card-h"><h3>Items</h3><span class="sub">${items.length} line${items.length > 1 ? 's' : ''}${from ? ` · lines as on ${docLink(from)}` : ''}</span></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th class="idx">#</th><th>Item</th><th>HS code</th><th class="num">Qty</th><th>Unit</th><th class="num">Rate (${cur})</th><th class="num">Amount (${cur})</th>${usd ? '<th class="num">Amount (OMR)</th>' : ''}</tr></thead>
    <tbody>${items.map((it, i) => `<tr data-item="${it.item_code}"><td class="idx">${i + 1}</td><td><a class="link" href="${formHref('item', it.item_code)}">${it.item_code}</a><div class="small muted">${esc(it.item_name)}</div></td>
      <td class="mono muted">${ITEM[it.item_code]?.customs_tariff_number || '—'}</td><td class="num">${num(it.qty, 2).replace(/\.00$/, '')}</td><td>${it.uom}</td>
      <td class="num">${num(it.rate, usd ? 2 : 3)}</td><td class="num"><b>${num(it.amount, usd ? 2 : 3)}</b></td>${usd ? `<td class="num">${num(it.amount * USD_RATE)}</td>` : ''}</tr>`).join('')}</tbody></table></div></div>`;
}

const CN_REASON = { QTY: 'Quantity returned or corrected', CAN: 'Invoice cancelled', OTH: 'Other reason', VAL: 'Price / value adjustment' };
function totalsCard(slug, d, cur) {
  const { items } = itemsOf(d);
  let net = d.net_total ?? (items ? sum(items, 'amount') : null);
  if (net == null) return '';
  net = r3(net);
  const tax = d.total_taxes_and_charges ?? r3(d.grand_total - net);
  const selling = ['quotation', 'sales-order', 'delivery-note', 'sales-invoice'].includes(slug);
  const rcm = !selling && cur === 'USD';
  const rows = [['Net total', money(net, cur)]];
  if (tax) rows.push([`VAT 5% ${selling ? '<span class="small muted">· 2320 Output VAT 5%</span>' : '<span class="small muted">· 1510 Input VAT 5%</span>'}`, money(tax, cur)]);
  else if (!rcm) rows.push(['VAT', '<span class="muted">Not charged</span>']);
  return `<div class="card" data-t="totals"><div class="card-h"><h3>Taxes and totals</h3></div><div class="card-b" style="display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start">
    <div style="flex:1;min-width:240px" class="small muted">${rcm ? `<div class="banner info">${icon('info')}<span><b>Reverse-charge VAT.</b> The foreign supplier charges no VAT. Infinity ERP self-assesses 5% import VAT of <b>${omr(r3(d.base_grand_total * 0.05))}</b> to 2330 VAT Reverse Charge (RCM) Payable, so it can be reclaimed in the same return.</span></div>` : selling ? 'VAT is calculated per line at the standard 5% rate and posted to Output VAT. The same figures go into the e-invoice.' : 'Input VAT is posted to 1510 Input VAT 5% and offsets output VAT in the VAT return.'}</div>
    <table class="totals">${rows.map(([l, v]) => `<tr><td>${l}</td><td class="num">${v}</td></tr>`).join('')}
      <tr class="gt"><td>Grand total</td><td class="num">${money(d.grand_total, cur)}</td></tr>
      ${cur === 'USD' && d.base_grand_total ? `<tr><td>In company currency (× ${USD_RATE})</td><td class="num"><b>${omr(d.base_grand_total)}</b></td></tr>` : ''}
      ${d.outstanding_amount != null ? `<tr class="${d.outstanding_amount ? 'os' : ''}"><td>Outstanding</td><td class="num">${money(d.outstanding_amount, cur)}</td></tr>` : ''}
    </table></div></div>`;
}

function currencyCard(d) {
  if (d.currency !== 'USD') return '';
  const base = d.base_grand_total ?? r3(d.grand_total * USD_RATE);
  return `<div class="card" data-t="currency-box"><div class="card-h"><h3>Currency and exchange rate</h3>${pill('Foreign currency', 'info')}</div>
    <div class="card-b"><div class="grid g4" style="align-items:center">
      <div class="fld"><div class="lbl">Supplier currency</div><div class="val" style="font-size:18px">USD</div></div>
      <div class="fld"><div class="lbl">Exchange rate</div><div class="val" style="font-size:18px">1 USD = ${USD_RATE} OMR</div></div>
      <div class="fld"><div class="lbl">Amount in USD</div><div class="val" style="font-size:18px">${money(d.grand_total, 'USD')}</div></div>
      <div class="fld"><div class="lbl">Booked in OMR</div><div class="val" style="font-size:18px;color:var(--brand-700)">${omr(base)}</div></div>
    </div></div></div>`;
}

function progressCard(d) {
  const rows = [['per_delivered', 'Delivered'], ['per_received', 'Received'], ['per_billed', 'Billed']].filter(([k]) => d[k] != null);
  if (!rows.length) return '';
  return `<div class="card" data-t="progress"><div class="card-h"><h3>Fulfilment</h3></div><div class="card-b">
    ${rows.map(([k, l]) => `<div class="prog-row"><span>${l}</span><div class="progress"><i style="width:${d[k]}%"></i></div><span class="num">${Math.round(d[k])}%</span></div>`).join('')}</div></div>`;
}

/* Document-flow strip: where this record sits in its business process */
const CHAINS = {
  sell: ['opportunity', 'quotation', 'sales-order', 'delivery-note', 'sales-invoice', 'payment-entry'],
  buy: ['material-request', 'rfq', 'supplier-quotation', 'purchase-order', 'purchase-receipt', 'purchase-invoice', 'payment-entry'],
  imp: ['purchase-order', 'purchase-receipt', 'purchase-invoice', 'landed-cost-voucher', 'payment-entry'],
};
function chainHtml(nodes, curName) {
  return `<div class="card" data-t="chain"><div class="card-h"><h3>Document flow</h3><span class="sub">Click any step to open it</span></div><div class="card-b"><div class="chain">
    ${nodes.map((n, i) => {
      const d = n.name ? getDoc(n.slug, n.name) : null;
      const st = d ? statusOf(n.slug, d) : null;
      const inner = `<div class="k">${icon(DOCTYPES[n.slug].icon)}${n.label || DOCTYPES[n.slug].one}</div><div class="t">${n.name ? esc(n.name) : '—'}</div><div class="s">${d ? (d.grand_total != null ? money(d.grand_total, d.currency || 'OMR') : d.paid_amount != null ? omr(d.paid_amount) : esc(st || '')) : 'Not used here'}</div>`;
      return `${i ? `<span class="arrow">${icon('arrow')}</span>` : ''}${n.name ? `<a class="node ${n.name === curName ? 'cur' : 'done'}" href="${formHref(n.slug, n.name)}">${inner}</a>` : `<div class="node" style="opacity:.55">${inner}</div>`}`;
    }).join('')}</div></div></div>`;
}
function docChain(slug, d) {
  if (slug === 'sales-invoice' && (d.is_return || d.is_debit_note)) return '';
  let types = null;
  if (CHAINS.sell.includes(slug) && slug !== 'payment-entry') types = CHAINS.sell;
  if (slug === 'payment-entry') types = d.party_type === 'Customer' ? CHAINS.sell : CHAINS.buy;
  if (CHAINS.buy.includes(slug) && slug !== 'payment-entry') types = CHAINS.buy;
  if (d.currency === 'USD' || slug === 'landed-cost-voucher') types = CHAINS.imp;
  if (slug === 'payment-entry' && linkedOf(d.name, 'purchase-invoice').some((p) => getDoc('purchase-invoice', p).currency === 'USD')) types = CHAINS.imp;
  if (slug === 'purchase-invoice' && d.currency === 'OMR' && linked(d.name).some((n) => slugOf(n) === 'landed-cost-voucher')) return '';
  if (!types) return '';
  const found = chainFor(d.name, types);
  if (Object.keys(found).length < 2) return '';
  return chainHtml(types.map((s) => ({ slug: s, name: found[s] })), d.name);
}
/* Service journey: sold invoice -> claim -> visit -> repair invoice */
function serviceChain(claimName, curName) {
  const c = getDoc('warranty-claim', claimName);
  const sinvs = linkedOf(claimName, 'sales-invoice');
  const repair = sinvs.find((s) => getDoc('sales-invoice', s).items.some((i) => ['DEMO-LAB-HR', 'DEMO-SRV-REWIND'].includes(i.item_code)));
  const sold = sinvs.find((s) => s !== repair);
  const visit = linkedOf(claimName, 'maintenance-visit').sort()[0] && linkedOf(claimName, 'maintenance-visit').find((v) => linkedOf(v, 'timesheet').length) || linkedOf(claimName, 'maintenance-visit')[0];
  return chainHtml([
    { slug: 'sales-invoice', name: sold, label: 'Motor sold' }, { slug: 'warranty-claim', name: claimName }, { slug: 'maintenance-visit', name: visit },
    { slug: 'sales-invoice', name: repair, label: c.status === 'Closed' && !repair ? 'Free under warranty' : 'Repair invoice' },
  ], curName);
}

function connectionsCard(name, slug) {
  const groups = {};
  const add = (n) => { const s = slugOf(n); if (s && getDoc(s, n)) (groups[s] = groups[s] || new Set()).add(n); };
  linked(name).forEach(add);
  if (slug === 'asset-category') D.assets.filter((a) => a.asset_category === name).forEach((a) => add(a.name));
  if (slug === 'customer' || slug === 'supplier') {
    for (const t of Object.values(DOCTYPES)) for (const r of t.rows) if ((r.customer || r.supplier || r.party || r.party_name) === name && r[t.id] !== name) add(r[t.id]);
  }
  if (slug === 'item') {
    for (const t of Object.values(DOCTYPES)) for (const r of t.rows) if (r.items && r.items.some((i) => i.item_code === name)) add(r.name);
  }
  const keys = Object.keys(groups);
  const body = keys.length ? `<div class="conn">${keys.map((s) => {
    const list = [...groups[s]].sort();
    return `<div class="conn-g"><h4>${icon(DOCTYPES[s].icon)}${DOCTYPES[s].label}<span class="n">${list.length}</span></h4>
      ${list.slice(0, 8).map((n) => { const d = getDoc(s, n); return `<a href="${formHref(s, n)}" data-conn="${esc(n)}">${esc(n)}<span>${d.grand_total != null ? num(d.grand_total) : d.paid_amount != null ? num(d.paid_amount) : esc(statusOf(s, d) || '')}</span></a>`; }).join('')}
      ${list.length > 8 ? `<a href="#/erp/list/${s}"><span>+ ${list.length - 8} more</span></a>` : ''}</div>`;
  }).join('')}</div>` : '<div class="muted small">No linked documents.</div>';
  return `<div class="card" data-t="connections"><div class="card-h"><h3>Connections</h3><span class="sub">Linked documents</span></div><div class="card-b">${body}</div></div>`;
}

/* ---------- E-Invoice section on sales invoices (what Infinity ERP itself stores) ---------- */
const TYPE_LABEL = { 380: 'Tax invoice', 381: 'Credit note', 383: 'Debit note' };
const typeCode = (d) => (d.is_return ? '381' : d.is_debit_note ? '383' : '380');
const EINV_HELP = {
  MANDATORY_FIELD: {
    title: 'Customer address is missing',
    short: 'The customer has no billing address, and a buyer address is mandatory on an Oman e-invoice (street, city, postal code and country).',
    fix: (d) => [`Open customer <b>${esc(d.customer)}</b> and add a billing address: street, city, postal code and country (Oman).`],
  },
  SCHEMATRON_FATAL: {
    title: 'Buyer VAT number is not valid',
    short: 'The buyer VAT number “OM12345” is too short. Oman VAT numbers are 12 characters: OM followed by exactly 10 digits (rule IBR-003-OM).',
    fix: (d) => [`Open customer <b>${esc(d.customer)}</b> and correct the VAT number to the full 12 characters (OM + 10 digits).`],
  },
};
function einvoiceCard(d) {
  if (!d.custom_einvoice_status && !EINV_ERR[d.name]) return '';
  const err = EINV_ERR[d.name];
  const help = err && EINV_HELP[err.code];
  const st = err ? 'Failed' : d.custom_einvoice_status;
  const code = typeCode(d);
  return `<div class="card" data-t="einvoice"><div class="card-h"><h3>E-Invoice</h3><span class="right">${pill(st, err ? 'bad' : 'ok')}</span></div>
    <div class="card-b">
    <div class="fields c2" data-t="einv-fields">
      <div class="fld"><div class="lbl">E-Invoice Status</div><div class="val" ${err ? 'style="color:var(--red)"' : ''}>${esc(st)}</div></div>
      <div class="fld"><div class="lbl">E-Invoice UUID</div><div class="val">${d.custom_einvoice_uuid ? esc(d.custom_einvoice_uuid) : '<span class="muted">Not assigned</span>'}</div></div>
      <div class="fld"><div class="lbl">E-Invoice Type</div><div class="val">${code} · ${TYPE_LABEL[code]}</div></div>
      ${d.custom_cn_reason_code ? `<div class="fld"><div class="lbl">Credit/Debit Note Reason</div><div class="val">${d.custom_cn_reason_code} · ${CN_REASON[d.custom_cn_reason_code]}</div></div>` : ''}
      ${err ? `<div class="fld wide" data-t="einv-error"><div class="lbl">E-Invoice Error</div><div class="raw">${esc(err.code)}: ${esc(err.message)}</div></div>` : ''}
    </div>
    ${err ? `<div class="banner bad" style="margin-top:16px" data-t="einv-fail">${icon('alert')}<div><b>${help.title}.</b> ${help.short}
        <div class="sec-title" style="font-size:14px;margin:12px 0 6px;color:inherit">How to fix it</div>
        <ol class="fix-steps">${help.fix(d).map((f) => `<li><span>${f}</span></li>`).join('')}<li><span>Open this invoice, <b>Cancel</b> it, then <b>Amend</b>. Infinity ERP creates the amended copy <b>${d.name}-1</b> with the corrected customer details.</span></li><li><span>Submit the amended invoice. It is e-invoiced again automatically.</span></li></ol>
        <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><a class="btn btn-default" style="text-decoration:none" href="${formHref('customer', d.customer)}">${icon('edit')}Open customer</a><button class="btn btn-primary" data-act="amend" data-doc="${d.name}" data-t="amend-btn">${icon('undo')}Cancel &amp; amend</button></div></div></div>` : ''}
    </div></div>`;
}

/* ---------- Type-specific sections ---------- */
function lcvSections(d) {
  const rec = d.receipts[0];
  const pr = getDoc('purchase-receipt', rec.receipt_document);
  const { items } = itemsOf(pr);
  const rate = pr.currency === 'USD' ? USD_RATE : 1;
  const base = items.map((it) => ({ ...it, omr: r3(it.amount * rate) }));
  const baseTotal = sum(base, 'omr');
  let left = d.total_taxes_and_charges;
  base.forEach((b, i) => {
    b.share = i === base.length - 1 ? r3(left) : r3((d.total_taxes_and_charges * b.omr) / baseTotal);
    left -= b.share;
    b.after = r3(b.omr + b.share);
  });
  const kinds = [['Freight', '5130', '#136D9C'], ['Insurance', '5160', '#5BA4CF'], ['Customs duty', '5140', '#14A39A'], ['Clearing', '5150', '#E0A43A']];
  const amtOf = (no) => sum(d.taxes.filter((t) => t.expense_account.startsWith(no)), 'amount');
  return `
  <div class="card"><div class="card-h"><h3>Purchase receipt being costed</h3></div>
    <table class="tbl"><thead><tr><th>Receipt</th><th>Supplier</th><th class="num">Value (${pr.currency})</th><th class="num">Value (OMR)</th></tr></thead>
    <tbody><tr><td>${docLink(rec.receipt_document)}</td><td>${docLink(rec.supplier)}</td><td class="num">${money(pr.grand_total, pr.currency)}</td><td class="num"><b>${omr(rec.grand_total)}</b></td></tr></tbody></table></div>
  <div class="card" data-t="lcv-charges"><div class="card-h"><h3>Import charges added to stock cost</h3><span class="sub">From the freight, customs and clearing bills</span></div>
    <div class="card-b" style="padding-bottom:6px">
      <div style="display:flex;height:14px;border-radius:999px;overflow:hidden;margin-bottom:8px">${kinds.map(([l, no, c]) => amtOf(no) ? `<i title="${l}" style="width:${(amtOf(no) / d.total_taxes_and_charges) * 100}%;background:${c}"></i>` : '').join('')}</div>
      <div class="legend" style="flex-wrap:wrap;margin-bottom:6px">${kinds.map(([l, no, c]) => amtOf(no) ? `<span><i style="background:${c}"></i>${l} ${num(amtOf(no))}</span>` : '').join('')}</div></div>
    <table class="tbl"><thead><tr><th>Charge</th><th>Charged by</th><th>Source bill</th><th>Expense account</th><th class="num">Amount (OMR)</th></tr></thead>
    <tbody>${d.taxes.map((t) => { const pinv = (t.description.match(/INFY-PINV-\d{4}-\d{5}/) || [])[0]; const p = pinv && getDoc('purchase-invoice', pinv);
      return `<tr><td><b>${esc(t.description.replace(/\s*\(INFY-PINV.*\)/, ''))}</b></td><td>${p ? docLink(p.supplier) : '—'}</td><td>${pinv ? docLink(pinv) : '—'}</td><td class="small muted">${esc(t.expense_account.replace(/ - INFY$/, ''))}</td><td class="num">${num(t.amount)}</td></tr>`; }).join('')}</tbody>
    <tfoot><tr><td colspan="4">Total charges</td><td class="num">${num(d.total_taxes_and_charges)}</td></tr></tfoot></table></div>
  <div class="card" data-t="lcv-impact"><div class="card-h"><h3>Effect on stock cost</h3><span class="sub">Charges shared by item value (${d.distribute_charges_based_on.toLowerCase()})</span></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Cost before (OMR)</th><th class="num">Share of charges</th><th class="num">Landed cost (OMR)</th><th class="num">Per unit before</th><th class="num">Per unit after</th><th class="num">Uplift</th></tr></thead>
    <tbody>${base.map((b) => `<tr><td><a class="link" href="${formHref('item', b.item_code)}">${b.item_code}</a><div class="small muted">${esc(b.item_name)}</div></td><td class="num">${b.qty}</td><td class="num">${num(b.omr)}</td><td class="num">+ ${num(b.share)}</td><td class="num"><b>${num(b.after)}</b></td>
      <td class="num">${num(b.omr / b.qty)}</td><td class="num" style="color:var(--brand-700);font-weight:800">${num(b.after / b.qty)}</td><td class="num">${pill('+' + pct((b.share / b.omr) * 100), 'info')}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="2">Total</td><td class="num">${num(baseTotal)}</td><td class="num">+ ${num(d.total_taxes_and_charges)}</td><td class="num">${num(baseTotal + d.total_taxes_and_charges)}</td><td colspan="3"></td></tr></tfoot></table></div>
    <div class="card-b small muted" style="border-top:1px solid var(--line-2)">Per-unit figures are derived: receipt value in USD × ${USD_RATE}, plus charges shared in proportion to item value.</div></div>`;
}

function rfqCompare(d) {
  const qs = linkedOf(d.name, 'supplier-quotation').map((n) => getDoc('supplier-quotation', n)).sort((a, b) => a.grand_total - b.grand_total);
  const low = qs[0];
  return `<div class="card" data-t="sq-compare"><div class="card-h"><h3>Quotation comparison</h3><span class="sub">${qs.length} suppliers replied</span></div>
    <table class="tbl"><thead><tr><th>Supplier</th><th>Quotation</th><th>Date</th><th class="num">Grand total (OMR)</th><th class="num">vs lowest</th><th></th></tr></thead>
    <tbody>${qs.map((q) => { const po = linkedOf(q.name, 'purchase-order')[0]; return `<tr class="${q === low ? 'hl' : ''}"><td><b>${docLink(q.supplier)}</b></td><td>${docLink(q.name)}</td><td>${fdate(q.transaction_date)}</td><td class="num"><b>${num(q.grand_total)}</b></td>
      <td class="num">${q === low ? '—' : '+ ' + num(q.grand_total - low.grand_total)}</td><td>${q === low ? pill('Lowest · ordered', 'ok') : ''} ${po ? docLink(po) : ''}</td></tr>`; }).join('')}</tbody></table></div>`;
}

function claimSections(d) {
  const tone = d.status === 'Closed' ? 'ok' : 'warn';
  return `<div class="grid g2">
    <div class="card" data-t="complaint"><div class="card-h"><h3>${icon('chat')} Customer complaint</h3><span class="right small muted">${fdate(d.complaint_date)}</span></div>
      <div class="card-b" style="font-size:14px;line-height:1.6">“${esc(d.complaint)}”<div class="small muted" style="margin-top:10px">Item: ${docLink(d.item_code)} · ${esc(ITEM[d.item_code].item_name)}</div></div></div>
    <div class="card" data-t="resolution"><div class="card-h"><h3>${icon('wrench')} Resolution</h3><span class="right">${pill(d.status, tone)}</span></div>
      <div class="card-b" style="font-size:14px;line-height:1.6">${d.resolution_details ? esc(d.resolution_details) : '<span class="muted">Not resolved yet. Engineer visit to be scheduled.</span>'}</div></div>
  </div>`;
}

function visitSections(d) {
  const claim = linkedOf(d.name, 'warranty-claim')[0];
  const c = claim && getDoc('warranty-claim', claim);
  return `<div class="card" data-t="visit-purpose"><div class="card-h"><h3>Visit purpose and work done</h3></div>
    <table class="tbl"><thead><tr><th>Item</th><th>Against</th><th>Work done</th></tr></thead>
    <tbody><tr><td>${c ? docLink(c.item_code) : '—'}</td><td>${claim ? docLink(claim) : '—'}</td><td style="max-width:520px">${c ? esc(c.resolution_details || c.complaint) : '—'}</td></tr></tbody></table></div>
    ${claim ? serviceChain(claim, d.name) : ''}`;
}

/* Depreciation schedule table (monthly straight-line rows; booked rows carry their journal entry) */
function scheduleTable(ds) {
  if (!ds) return '';
  const rows = ds.depreciation_schedule;
  const booked = rows.filter((r) => r.journal_entry);
  return `<div class="card" data-t="asset-schedule"><div class="card-h"><h3>Depreciation schedule</h3><span class="sub">${docLink(ds.name)} · ${esc(ds.depreciation_method)} · ${ds.total_number_of_depreciations} monthly depreciations</span>
      <span class="right">${pill(`${booked.length} booked`, 'ok')} ${pill(`${ds.total_number_of_depreciations - booked.length} to come`, 'mute')}</span></div>
    <div class="sched-wrap"><table class="tbl"><thead><tr><th class="idx">#</th><th>Schedule date</th><th class="num">Depreciation (OMR)</th><th class="num">Accumulated (OMR)</th><th>Journal entry</th></tr></thead>
    <tbody>${rows.map((r, i) => `<tr class="${r.journal_entry ? '' : 'future'}"><td class="idx">${i + 1}</td><td>${fdate(r.schedule_date)}</td><td class="num">${num(r.depreciation_amount)}</td><td class="num">${num(r.accumulated_depreciation_amount)}</td>
      <td>${r.journal_entry ? `${docLink(r.journal_entry)} ${pill('Booked', 'ok')}` : pill('Not yet booked', 'mute')}</td></tr>`).join('')}</tbody></table></div>
    <div class="card-b small muted" style="border-top:1px solid var(--border-2)">Showing the first ${rows.length} of ${ds.total_number_of_depreciations} monthly rows from the demo export. The first month is pro-rated from the in-use date; depreciation is booked to 30 Nov 2026.</div></div>`;
}
const CAT = Object.fromEntries(D.asset_categories.map((c) => [c.name, c]));
function assetSections(d) {
  const ds = ADS_OF[d.name];
  const cat = CAT[d.asset_category];
  const src = d.purchase_invoice || d.purchase_receipt || linkedOf(d.name, 'asset-capitalization')[0];
  const fb = (d.finance_books || [])[0] || {};
  return `<div class="card" data-t="asset-dep"><div class="card-h"><h3>Value and depreciation</h3>${pill(d.status)}</div><div class="card-b">
    <div class="grid g4">
      <div class="kpi card flat"><div class="lbl">Gross purchase amount</div><div class="val" style="font-size:22px"><small>OMR</small>${num(d.gross_purchase_amount)}</div><div class="foot">${src ? `From ${docLink(src)}` : 'Recorded directly'}</div></div>
      <div class="kpi card flat"><div class="lbl">Depreciation booked</div><div class="val" style="font-size:22px"><small>OMR</small>${num(d.depreciation_booked)}</div><div class="foot">${fb.total_number_of_booked_depreciations || 0} monthly entries to 30 Nov 2026</div></div>
      <div class="kpi card flat"><div class="lbl">Net book value</div><div class="val" style="font-size:22px;color:var(--primary)"><small>OMR</small>${num(fb.value_after_depreciation ?? d._nbv)}</div><div class="foot">Gross less depreciation booked</div></div>
      <div class="kpi card flat"><div class="lbl">Useful life</div><div class="val" style="font-size:22px">${cat ? cat.life_years : '—'} years</div><div class="foot">${docLink(d.asset_category)} · straight line</div></div>
    </div>
    ${cat ? `<div class="fields" style="margin-top:16px"><div class="fld"><div class="lbl">Fixed asset account</div><div class="val">${esc(cat._fa)}</div></div><div class="fld"><div class="lbl">Accumulated depreciation account</div><div class="val">${esc(cat._ad)}</div></div><div class="fld"><div class="lbl">Depreciation expense account</div><div class="val">${esc(cat._de)}</div></div></div>` : ''}
    </div></div>
  ${scheduleTable(ds)}`;
}
/* Register summary above the asset list: cost, depreciation booked and net book value by category */
function assetRegisterSummary() {
  const by = {};
  D.assets.forEach((a) => { const r = (by[a.asset_category] = by[a.asset_category] || { n: 0, cost: 0, dep: 0 }); r.n += 1; r.cost += a.gross_purchase_amount; r.dep += a.depreciation_booked || 0; });
  const tot = { n: D.assets.length, cost: sum(D.assets, 'gross_purchase_amount'), dep: sum(D.assets, 'depreciation_booked') };
  return `<div class="card" data-t="asset-summary"><div class="card-h"><h3>Fixed asset register</h3><span class="sub">To 30 Nov 2026</span></div>
    <table class="tbl"><thead><tr><th>Category</th><th class="num">Life</th><th class="num">Assets</th><th class="num">Cost (OMR)</th><th class="num">Depreciation booked</th><th class="num">Net book value</th></tr></thead>
    <tbody>${Object.entries(by).sort((a, b) => CAT[b[0]].life_years - CAT[a[0]].life_years).map(([c, r]) => `<tr><td>${docLink(c)}</td><td class="num">${CAT[c].life_years} yrs</td><td class="num">${r.n}</td><td class="num">${num(r.cost)}</td><td class="num">${num(r.dep)}</td><td class="num"><b>${num(r.cost - r.dep)}</b></td></tr>`).join('')}</tbody>
    <tfoot><tr><td>Total</td><td></td><td class="num">${tot.n}</td><td class="num">${num(tot.cost)}</td><td class="num">${num(tot.dep)}</td><td class="num">${num(tot.cost - tot.dep)}</td></tr></tfoot></table></div>`;
}
function categorySections(d) {
  const assets = D.assets.filter((a) => a.asset_category === d.name);
  return `<div class="card" data-t="cat-accounts"><div class="card-h"><h3>Accounts</h3><span class="sub">Where assets in this category post</span></div><div class="card-b"><div class="fields c2">
      <div class="fld"><div class="lbl">Fixed asset account</div><div class="val">${esc(d._fa)}</div></div><div class="fld"><div class="lbl">Accumulated depreciation account</div><div class="val">${esc(d._ad)}</div></div>
      <div class="fld"><div class="lbl">Depreciation expense account</div><div class="val">${esc(d._de)}</div></div><div class="fld"><div class="lbl">Capital work in progress account</div><div class="val">${esc(d._cwip)}</div></div></div></div></div>
    <div class="card"><div class="card-h"><h3>Assets in this category</h3><span class="sub">${assets.length}</span></div>
    <table class="tbl"><thead><tr><th>Asset</th><th>Name</th><th class="num">Gross (OMR)</th><th class="num">Monthly depreciation</th><th class="num">Net book value</th></tr></thead>
    <tbody>${assets.map((a) => { const row = ADS_OF[a.name]?.depreciation_schedule.find((r, i) => i > 0) || {}; return `<tr class="click" data-href="${formHref('asset', a.name)}"><td class="link">${a.name}</td><td>${esc(a.asset_name)}</td><td class="num">${num(a.gross_purchase_amount)}</td><td class="num">${num(row.depreciation_amount)}</td><td class="num">${num(a.finance_books?.[0]?.value_after_depreciation)}</td></tr>`; }).join('')}</tbody></table></div>`;
}
function capitalizationSections(d) {
  const a = ASSET_OF[d.target_asset];
  const cwipTotal = sum(d.cwip_bills, 'base_net_amount');
  const dr = sum(d.gl, 'debit'), cr = sum(d.gl, 'credit');
  return `${chainHtml([{ slug: 'purchase-invoice', name: d.cwip_bills[0]?.name, label: 'CWIP bill 1' }, { slug: 'purchase-invoice', name: d.cwip_bills[1]?.name, label: 'CWIP bill 2' }, { slug: 'asset-capitalization', name: d.name }, { slug: 'asset', name: d.target_asset }, { slug: 'asset-depreciation-schedule', name: ADS_OF[d.target_asset]?.name }], d.name)}
  <div class="card" data-t="cwip-bills"><div class="card-h"><h3>Capital work in progress bills</h3><span class="sub">Booked to 1790 CWIP Account while the work was under way</span></div>
    <table class="tbl"><thead><tr><th>Purchase invoice</th><th>Supplier</th><th>Supplier bill</th><th>Date</th><th>Work</th><th class="num">Net (OMR)</th></tr></thead>
    <tbody>${d.cwip_bills.map((b) => `<tr><td>${docLink(b.name)}</td><td>${docLink(b.supplier)}</td><td class="mono">${esc(b.bill_no)}</td><td>${fdate(b.posting_date)}</td><td style="max-width:360px">${esc(b.description)}</td><td class="num"><b>${num(b.base_net_amount)}</b></td></tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="5">Total in CWIP</td><td class="num">${num(cwipTotal)}</td></tr></tfoot></table></div>
  <div class="card" data-t="acap-target"><div class="card-h"><h3>Capitalized into</h3></div><div class="card-b"><div class="fields">
      <div class="fld"><div class="lbl">Target asset</div><div class="val">${docLink(d.target_asset)} · ${esc(d.target_asset_name)}</div></div>
      <div class="fld"><div class="lbl">Asset category</div><div class="val">${a ? `${docLink(a.asset_category)} · ${CAT[a.asset_category]?.life_years} years` : '—'}</div></div>
      <div class="fld"><div class="lbl">Fixed asset account</div><div class="val">${esc(d.target_fixed_asset_account.replace(/ - INFY$/, ''))}</div></div>
      <div class="fld"><div class="lbl">Capitalized value</div><div class="val">${omr(d.total_value)}</div></div>
      <div class="fld"><div class="lbl">Capitalization date</div><div class="val">${fdate(d.posting_date)}</div></div>
      <div class="fld"><div class="lbl">Available for use</div><div class="val">${a ? fdate(a.available_for_use_date) : '—'}</div></div></div></div></div>
  <div class="card" data-t="acap-gl"><div class="card-h"><h3>CWIP account movements</h3><span class="sub">1790 CWIP Account is cleared to zero</span></div>
    <table class="tbl"><thead><tr><th>Date</th><th>Voucher</th><th>Account</th><th class="num">Debit (OMR)</th><th class="num">Credit (OMR)</th></tr></thead>
    <tbody>${d.gl.map((g) => `<tr><td>${fdate(g.posting_date)}</td><td>${esc(g.voucher_type)} ${docLink(g.voucher_no)}</td><td>${esc(g.account.replace(/ - INFY$/, ''))}</td><td class="num">${g.debit ? num(g.debit) : ''}</td><td class="num">${g.credit ? num(g.credit) : ''}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="3">Balance on 1790 CWIP Account</td><td class="num">${num(dr)}</td><td class="num">${num(cr)} → ${num(r3(dr - cr))}</td></tr></tfoot></table></div>`;
}
function scheduleSections(d) { return scheduleTable(d); }

function customerSections(d) {
  const vatOk = /^OM\d{10}$/.test(d.tax_id || '');
  const noAddr = d.name === 'Demo Walk-in Customer';
  const invs = D.sales_invoices.filter((s) => s.customer === d.name);
  const os = sum(invs, 'outstanding_amount');
  const checks = [
    ['VAT number', d.tax_id ? (vatOk ? `${d.tax_id}` : `${d.tax_id} · must be OM + 10 digits`) : 'Not registered (B2C)', d.tax_id ? vatOk : true, 'cust-tax'],
    ['CR number', d.custom_cr_number || 'Not provided', !!d.custom_cr_number || !d.tax_id || true, ''],
    ['Billing address', noAddr ? 'Missing street, city, postal code and country' : 'On file', !noAddr, 'cust-address'],
  ];
  return `<div class="grid g-2-1">
    <div class="card" data-t="cust-einv"><div class="card-h"><h3>E-invoice readiness</h3>${checks.every((c) => c[2]) ? pill('Ready', 'ok') : pill('Action needed', 'bad')}</div>
      <table class="tbl"><tbody>${checks.map(([l, v, ok, t]) => `<tr ${t ? `data-t="${t}"` : ''} class="${ok ? '' : 'hl'}"><td style="width:34px">${ok ? `<span style="color:var(--ok)">${icon('checkcircle')}</span>` : `<span style="color:var(--bad)">${icon('xcircle')}</span>`}</td><td><b>${l}</b></td><td class="${ok ? '' : 'neg'}" style="font-weight:600">${esc(v)}</td>
        <td class="num">${ok ? '' : `<button class="btn btn-ghost" data-act="fix-cust" data-field="${l}" data-cust="${esc(d.name)}">${icon('edit')}Fix</button>`}</td></tr>`).join('')}</tbody></table></div>
    <div class="card"><div class="card-h"><h3>Account summary</h3></div><div class="card-b"><table class="totals" style="max-width:none">
      <tr><td>Invoices issued</td><td class="num">${invs.filter((s) => !s.is_return).length}</td></tr>
      <tr><td>Credit notes</td><td class="num">${invs.filter((s) => s.is_return).length}</td></tr>
      <tr><td>Billed (incl. VAT, net of credits)</td><td class="num">${omr(sum(invs, 'grand_total'))}</td></tr>
      <tr class="gt"><td>Outstanding</td><td class="num">${omr(os)}</td></tr></table></div></div></div>`;
}

function itemSections(d) {
  const sb = D.stock_balance.filter((s) => s.item_code === d.item_code);
  if (!sb.length) return '';
  return `<div class="card"><div class="card-h"><h3>Stock levels</h3></div><table class="tbl"><thead><tr><th>Warehouse</th><th class="num">Qty</th><th class="num">Value (OMR)</th><th class="num">Avg cost / unit</th></tr></thead>
    <tbody>${sb.map((s) => `<tr><td>${s.warehouse}</td><td class="num">${s.actual_qty}</td><td class="num">${num(s.stock_value)}</td><td class="num">${num(s.stock_value / s.actual_qty)}</td></tr>`).join('')}</tbody></table></div>`;
}

/* Stock entries carry only totals; lines below are derived where the values reconcile exactly */
const STE_LINES = {
  'INFY-STE-2026-00001': { note: 'Derived: matches the stock now held in Finished Goods - INFY (1 compressor at 2,400.000 + 10 filters at 18.000 = 2,580.000).', from: 'Stores - INFY', to: 'Finished Goods - INFY', lines: [['DEMO-CMP-15', 1, 2400], ['DEMO-FLT-01', 10, 18]] },
  'INFY-STE-2026-00003': { note: 'Derived: parts replaced free of charge under warranty claim INFY-WRN-2026-00002, booked to 5121 Warranty Repairs and Replacements (13.000).', from: 'Stores - INFY', to: null, lines: [['DEMO-FAN-01', 1, 7], ['DEMO-BRG-01', 1, 6]] },
};
function steSections(d) {
  const x = STE_LINES[d.name];
  if (!x) return '';
  return `<div class="card" data-t="items"><div class="card-h"><h3>Items</h3><span class="sub">${x.from}${x.to ? ' → ' + x.to : ' → issued'}</span></div>
    <table class="tbl"><thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Valuation rate</th><th class="num">Value (OMR)</th></tr></thead>
    <tbody>${x.lines.map(([c, q, r]) => `<tr><td><a class="link" href="${formHref('item', c)}">${c}</a><div class="small muted">${ITEM[c].item_name}</div></td><td class="num">${q}</td><td class="num">${num(r)}</td><td class="num">${num(q * r)}</td></tr>`).join('')}</tbody></table>
    <div class="card-b small muted" style="border-top:1px solid var(--line-2)">${x.note}</div></div>`;
}

function paymentSections(d) {
  const refs = [...linkedOf(d.name, 'sales-invoice'), ...linkedOf(d.name, 'purchase-invoice')];
  const fx = linkedOf(d.name, 'journal-entry')[0];
  const bank = GL['1210'];
  return `<div class="card" data-t="pay-refs"><div class="card-h"><h3>Payment references</h3></div>
    <table class="tbl"><thead><tr><th>Against</th><th>Date</th><th class="num">Invoice total</th><th class="num">Allocated (OMR)</th></tr></thead>
    <tbody>${refs.length ? refs.map((n) => { const s = slugOf(n); const i = getDoc(s, n); return `<tr><td>${docLink(n)}</td><td>${fdate(i.posting_date)}</td><td class="num">${money(i.grand_total, i.currency || 'OMR')}</td><td class="num"><b>${num(d.paid_amount)}</b></td></tr>`; }).join('')
      : `<tr><td colspan="4" class="muted">Unallocated: held on account as an advance from ${esc(d.party)}.</td></tr>`}</tbody></table>
    <div class="card-b small muted" style="border-top:1px solid var(--line-2)">${d.payment_type === 'Receive' ? 'Received into' : 'Paid from'} ${bank.account_number} · ${esc(bank.account_name)}${fx ? `. Exchange difference posted by ${docLink(fx)} (${omr(getDoc('journal-entry', fx).total_debit)}).` : ''}</div></div>`;
}

function formExtras(slug, d) {
  const cur = d.currency || 'OMR';
  const parts = [];
  if (['purchase-order', 'purchase-receipt', 'purchase-invoice'].includes(slug)) parts.push(currencyCard(d));
  if (['sales-order', 'purchase-order'].includes(slug)) parts.push(progressCard(d));
  parts.push(docChain(slug, d));
  if (['quotation', 'sales-order', 'delivery-note', 'sales-invoice', 'supplier-quotation', 'purchase-order', 'purchase-receipt', 'purchase-invoice'].includes(slug)) {
    parts.push(itemsCard(d, cur), totalsCard(slug, d, cur));
  }
  if (slug === 'landed-cost-voucher') parts.push(lcvSections(d));
  if (slug === 'rfq') parts.push(rfqCompare(d));
  if (slug === 'warranty-claim') parts.push(claimSections(d), serviceChain(d.name, d.name));
  if (slug === 'maintenance-visit') parts.push(visitSections(d));
  if (slug === 'asset') parts.push(assetSections(d));
  if (slug === 'asset-category') parts.push(categorySections(d));
  if (slug === 'asset-capitalization') parts.push(capitalizationSections(d));
  if (slug === 'asset-depreciation-schedule') parts.push(scheduleSections(d));
  if (slug === 'customer') parts.push(customerSections(d));
  if (slug === 'item') parts.push(itemSections(d));
  if (slug === 'stock-entry') parts.push(steSections(d));
  if (slug === 'payment-entry') parts.push(paymentSections(d));
  return parts.join('');
}

/* ---------- Form view (live layout: title + status in the page head, pill tabs, one white form card) ---------- */
const FORM_TABS = { 'sales-invoice': ['Details', 'Payments', 'Address & Contact', 'Terms', 'More Info', 'Connections'], 'purchase-invoice': ['Details', 'Payments', 'Address & Contact', 'Terms', 'More Info', 'Connections'],
  'sales-order': ['Details', 'Address & Contact', 'Terms', 'More Info', 'Connections'], 'purchase-order': ['Details', 'Address & Contact', 'Terms', 'More Info', 'Connections'],
  customer: ['Details', 'Address & Contact', 'Accounting', 'Connections'], supplier: ['Details', 'Address & Contact', 'Accounting', 'Connections'] };
function formView(slug, name) {
  const t = DOCTYPES[slug];
  const d = t && getDoc(slug, name);
  if (!d) return notFound();
  const st = statusOf(slug, d);
  const title = d.customer || d.supplier || d.party || d.asset_name || d._asset_name || d.target_asset_name || d.item_name || d.lead_name || name;
  const extra = [];
  if (slug === 'maintenance-visit') extra.push(['Engineer', esc(d._engineer)]);
  let banner = '';
  if (slug === 'sales-invoice' && d.is_return) banner = `<div class="banner info" data-t="return-banner">${icon('undo')}<span><b>Credit note</b> against ${docLink(d.return_against)} · reason <b>${d.custom_cn_reason_code}</b>: ${CN_REASON[d.custom_cn_reason_code]}. It reduces what ${esc(d.customer)} owes by ${omr(-d.grand_total)} and is e-invoiced as type 381.</span></div>`;
  if (slug === 'sales-invoice' && d.is_debit_note) banner = `<div class="banner warn" data-t="return-banner">${icon('plus')}<span><b>Debit note</b> against ${docLink(d.return_against)} · reason <b>${d.custom_cn_reason_code}</b>: ${CN_REASON[d.custom_cn_reason_code]}. It adds ${omr(d.grand_total)} to the original invoice and is e-invoiced as type 383.</span></div>`;
  if (slug === 'customer' && d.name === 'Demo Walk-in Customer') banner = `<div class="banner bad">${icon('alert')}<span><b>No billing address.</b> E-invoice for ${docLink('INFY-SINV-2026-00025')} failed because the buyer address is mandatory.</span></div>`;
  const badVat = slug === 'customer' && d.tax_id && !/^OM\d{10}$/.test(d.tax_id);
  if (badVat) banner = `<div class="banner bad">${icon('alert')}<span><b>VAT number “${esc(d.tax_id)}” is not valid.</b> Oman VAT numbers are 12 characters: OM followed by 10 digits. E-invoice for ${docLink('INFY-SINV-2026-00026')} failed for this reason.</span></div>`;
  let details = detailsCard(d, extra);
  if (badVat) details = details.replace(`<div class="fld "><div class="lbl">VAT number</div><div class="val">${esc(d.tax_id)}</div></div>`, `<div class="fld bad"><div class="lbl">VAT number</div><div class="val">${esc(d.tax_id)}<span class="flag">Invalid format</span></div></div>`);
  const tabs = FORM_TABS[slug] || ['Details', 'More Info', 'Connections'];
  const isSubmitted = !['customer', 'supplier', 'item', 'lead', 'asset-category'].includes(slug);
  const failed = slug === 'sales-invoice' && EINV_ERR[name];
  const actions = `${isSubmitted ? `<button class="btn btn-default" data-act="mock">View${icon('down', 'caret')}</button><button class="btn btn-primary" data-act="mock">Create${icon('down', 'caret')}</button>` : ''}
    <button class="btn btn-default" data-act="mock">Actions${icon('down', 'caret')}</button><button class="btn btn-icon" data-act="mock" aria-label="Print">${icon('printer')}</button>
    <button class="btn btn-icon" data-act="mock" aria-label="Previous">${icon('left')}</button><button class="btn btn-icon" data-act="mock" aria-label="Next">${icon('right')}</button><button class="btn btn-icon" data-act="mock" aria-label="Menu">${icon('more')}</button>
    ${isSubmitted ? `<button class="btn btn-outline" ${failed ? `data-act="amend" data-doc="${name}"` : 'data-act="mock"'}>Cancel</button>` : `<button class="btn btn-primary" data-act="mock">Save</button>`}`;
  return `${crumbs([[WS_LABEL[t.module], wsHref(t.module)], [t.one, `#/erp/list/${slug}`], [name]])}
  <div class="page-h" data-t="form-head"><span class="ph-side">${icon('sidebar')}</span><h1>${esc(title)}</h1>${pill(st)}
    <div class="actions">${actions}</div></div>
  <div class="form-page" data-t="form-page">
    <div class="form-tabs">${tabs.map((x, i) => `<a href="javascript:void(0)" class="${i ? '' : 'on'}" data-tab="${esc(x)}">${esc(x)}</a>`).join('')}</div>
    ${banner}
    ${slug === 'sales-invoice' ? einvoiceCard(d) : ''}
    ${details}
    ${formExtras(slug, d)}
    ${connectionsCard(name, slug)}
  </div>`;
}

/* ---------- Reports ---------- */
const REP_FILTERS = {
  pl: ['Infy Demo Company', 'Finance Book', 'Fiscal Year', '01-10-2026', '20-11-2026', 'Yearly'],
  bs: ['Infy Demo Company', 'Finance Book', 'Fiscal Year', '01-10-2026', '20-11-2026', 'Yearly'],
  gl: ['Infy Demo Company', 'Finance Book', '01-10-2026', '20-11-2026', 'Account', 'Categorize by Voucher'],
  ar: ['Infy Demo Company', '20-11-2026', 'Due Date', 'Customer', 'Customer Group', '30-60-90-120'],
  ap: ['Infy Demo Company', '20-11-2026', 'Due Date', 'Supplier', 'Supplier Group', '30-60-90-120'],
  stock: ['Infy Demo Company', '01-10-2026', '20-11-2026', 'Item Group', 'Item', 'Warehouse'],
  coa: ['Infy Demo Company'],
};
const FILLED = /Infy|20\d\d|Yearly|Categorize|30-60|Summarized|November|Due Date/;
function reportHead(k, sub, extra = '') {
  const r = REPORTS[k];
  const actions = `${extra}<button class="btn btn-default" data-act="mock">Actions${icon('down', 'caret')}</button><button class="btn btn-icon" data-act="refresh" aria-label="Refresh">${icon('refresh')}</button><button class="btn btn-icon" data-act="mock" aria-label="Menu">${icon('more')}</button>`;
  const f = REP_FILTERS[k] || [];
  return `${crumbs([[WS_LABEL[r.module], wsHref(r.module)], [r.label]])}
  ${pageTitle(r.label, actions)}
  <div class="layout-card"><div class="rep-filters">${f.map((x) => `<span class="fbox ${FILLED.test(x) ? 'filled' : ''}">${esc(x)}</span>`).join('')}</div>
    <div style="padding:10px 16px 0" class="demo-note">${icon('info')}${esc(sub)} · figures from the demo company's ledger</div></div>`;
}

function coaReport() {
  const kids = {};
  D.accounts_tree_top.forEach((a) => { (kids[a.parent_account || ''] = kids[a.parent_account || ''] || []).push(a); });
  const total = (a) => (a.is_group ? sum(kids[a.name] || [], total) : glBal(a.account_number));
  const rows = [];
  const walk = (a, depth, parentKey) => {
    const bal = r3(total(a));
    const k = a.name;
    rows.push(`<tr class="${depth === 0 ? 'root open' : a.is_group ? 'grp' : ''} ${depth > 1 ? 'hide' : ''} ${bal ? '' : 'zero'}" data-key="${esc(k)}" data-parent="${esc(parentKey)}" data-depth="${depth}">
      <td style="padding-left:${14 + depth * 22}px"><span class="tw">${a.is_group ? `<button class="tg" data-tree="${esc(k)}">${icon('right')}</button>` : '<span style="width:18px;display:inline-block"></span>'}
      ${a.account_number ? `<span class="acno">${a.account_number}</span>` : ''}${esc(a.account_name)}</span></td>
      <td>${depth === 0 ? a.root_type : a.is_group ? '<span class="small muted">Group</span>' : '<span class="small muted">Ledger</span>'}</td>
      <td class="num">${bal ? num(bal > 0 ? bal : -bal) + (bal > 0 ? ' Dr' : ' Cr') : '—'}</td></tr>`);
    (kids[a.name] || []).sort((x, y) => (x.account_number || '').localeCompare(y.account_number || '')).forEach((c) => walk(c, depth + 1, k));
  };
  const order = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];
  kids[''].sort((a, b) => order.indexOf(a.root_type) - order.indexOf(b.root_type)).forEach((r) => walk(r, 0, ''));
  const map = {};
  D.coa_mapping.forEach((m) => { map[m.action] = (map[m.action] || 0) + 1; });
  const extra = D.coa_mapping.filter((m) => m.action.startsWith('new extra'));
  return `${reportHead('coa', `${D.coa_summary.template} · ${D.coa_summary.accounts} accounts (${D.coa_summary.groups} groups, ${D.coa_summary.leaves} ledgers)`, `<button class="btn btn-ghost" data-act="tree-all">${icon('layers')}Expand all</button>`)}
  <div class="grid g-3-2"><div class="card" data-t="coa-tree"><table class="tbl tree"><thead><tr><th>Account</th><th>Type</th><th class="num">Balance (OMR)</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>
  <div class="stack"><div class="card" data-t="coa-info"><div class="card-h"><h3>Standard numbered chart</h3></div><div class="card-b" style="line-height:1.75">
    ${kids[''].map((r) => `<div><span class="acno" style="margin-right:10px">${r.account_number}</span>${esc(r.account_name)}</div>`).join('')}
    <p class="small muted" style="margin-top:8px">The standard chart with account codes, so the standard reports (P&amp;L, Balance Sheet, General Ledger, ageing) come out automatically. The client's own codes were added inside it wherever needed.</p></div></div>
    <div class="card"><div class="card-h"><h3>Client account codes</h3><span class="sub">${D.coa_mapping.length} codes from the client's list</span></div><table class="tbl"><tbody>
      <tr><td>Merged into a standard account</td><td class="num"><b>${map['merged into standard account'] || 0}</b></td></tr>
      <tr><td>Merged into an added client account</td><td class="num"><b>${map['merged into extra account'] || 0}</b></td></tr>
      <tr><td>Added as new client accounts</td><td class="num"><b>${extra.length}</b></td></tr></tbody></table>
      <div class="card-b small muted">Examples: ${extra.slice(0, 4).map((m) => `${m.new_number} ${esc(m.new_account)}`).join(' · ')}</div></div>
    <div class="card"><div class="card-h"><h3>Accounts by type</h3></div><table class="tbl"><tbody>${order.map((rt) => `<tr><td><b>${rt}</b></td><td class="num">${D.accounts_tree_top.filter((a) => a.root_type === rt && !a.is_group).length} ledgers</td><td class="num">${D.accounts_tree_top.filter((a) => a.root_type === rt && a.is_group && a.parent_account).length} groups</td></tr>`).join('')}</tbody></table></div></div></div>`;
}

function glReport() {
  const order = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];
  const rows = [...D.gl_by_account].sort((a, b) => a.account_number.localeCompare(b.account_number));
  const dr = sum(rows.filter((r) => r.bal > 0), 'bal'), cr = -sum(rows.filter((r) => r.bal < 0), 'bal');
  return `${reportHead('gl', 'Closing balance of every ledger with activity')}
  <div class="grid g-3-2"><div class="card" data-t="gl-table"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Account</th><th>Type</th><th class="num">Debit (OMR)</th><th class="num">Credit (OMR)</th></tr></thead>
    <tbody>${order.map((rt) => `<tr class="sub"><td colspan="4">${rt}</td></tr>` + rows.filter((r) => r.root_type === rt).map((r) => `<tr><td><span class="mono" style="color:var(--brand-700);font-weight:700;margin-right:8px">${r.account_number}</span>${esc(r.account_name)}</td><td class="small muted">${esc(parentOf(r.account_number).account_name)}</td>
      <td class="num">${r.bal > 0 ? num(r.bal) : ''}</td><td class="num">${r.bal < 0 ? num(-r.bal) : ''}</td></tr>`).join('')).join('')}</tbody>
    <tfoot><tr><td colspan="2">Total</td><td class="num">${num(dr)}</td><td class="num">${num(cr)}</td></tr></tfoot></table></div></div>
    <div class="stack"><div class="card"><div class="card-b"><div class="banner ok" data-t="gl-check">${icon('checkcircle')}<span><b>Ledger is in balance.</b> Total debits ${omr(dr)} equal total credits ${omr(cr)}.</span></div>
    <p class="small muted" style="margin-top:12px;line-height:1.6">Every invoice, payment, stock movement, journal and depreciation entry posts here automatically, with no re-keying. ${D.gl_by_account.length} ledgers have activity in the period.</p></div></div>
    <div class="card"><div class="card-h"><h3>Totals by type</h3></div><table class="tbl"><tbody>${order.map((rt) => { const v = rootTotal(rt); return `<tr><td><b>${rt}</b></td><td class="num">${num(Math.abs(v))} ${v >= 0 ? 'Dr' : 'Cr'}</td></tr>`; }).join('')}</tbody></table></div></div></div>`;
}

/* Standard statement layout: the numbered group tree with subtotals, as the standard reports show it */
function stmtTree(no, sign) {
  const out = [];
  const walk = (a, depth) => {
    const v = r3(accTotal(a) * sign);
    if (!v) return;
    out.push(`<tr class="${a.is_group ? 'sub' : ''}"><td style="padding-left:${12 + depth * 22}px">${a.account_number ? `<span class="acno" style="margin-right:6px">${a.account_number}</span>` : ''}${esc(a.account_name)}</td><td class="num">${num(v)}</td></tr>`);
    (KIDS[a.name] || []).forEach((c) => walk(c, depth + 1));
  };
  (KIDS[accByNo[no].name] || []).forEach((c) => walk(c, 1));
  return out.join('');
}
const rootRow = (no, cls = 'grand') => `<tr class="${cls}"><td><span class="acno" style="margin-right:6px">${no}</span>${esc(accByNo[no].account_name)}</td><td class="num"></td></tr>`;
function plReport() {
  const netTone = FIN.net >= 0 ? 'pos' : 'neg';
  return `${reportHead('pl', 'Profit and Loss Statement, 1 Oct – 30 Nov 2026')}
  <div class="card" data-t="pl-summary"><div class="rep-summary">
    <div class="s"><div class="l">Total Income This Period</div><div class="v">${omr(FIN.income)}</div></div><span class="op">-</span>
    <div class="s"><div class="l">Total Expense This Period</div><div class="v">${omr(FIN.expense)}</div></div><span class="op">=</span>
    <div class="s"><div class="l">${FIN.net >= 0 ? 'Profit' : 'Loss'} This Period</div><div class="v" style="color:${FIN.net >= 0 ? 'var(--green)' : 'var(--red)'}">${omr(FIN.net)}</div></div></div>
    <div class="grid g4" style="padding:0 16px 16px;gap:12px">
      <div class="card kpi flat"><div class="lbl">Income (4000)</div><div class="val" style="font-size:22px"><small>OMR</small>${num(FIN.income)}</div></div>
      <div class="card kpi flat"><div class="lbl">Direct expenses (5100)</div><div class="val" style="font-size:22px"><small>OMR</small>${num(FIN.cogs)}</div></div>
      <div class="card kpi flat ok"><div class="lbl">Gross profit</div><div class="val" style="font-size:22px"><small>OMR</small>${num(FIN.gross)}</div><div class="foot">${pct((FIN.gross / FIN.income) * 100)} of income</div></div>
      <div class="card kpi flat ${FIN.net >= 0 ? 'ok' : 'bad'}"><div class="lbl">${FIN.net >= 0 ? 'Net profit' : 'Net loss'}</div><div class="val" style="font-size:22px"><small>OMR</small>${num(FIN.net)}</div><div class="foot">After indirect expenses (5200)</div></div>
    </div></div>
  <div class="grid g-3-2"><div class="card" data-t="pl-table"><div class="tbl-wrap"><table class="tbl dt"><thead><tr><th>Account</th><th class="num">1 Oct – 30 Nov 2026</th></tr></thead><tbody>
    ${rootRow('4000')}${stmtTree('4000', -1)}<tr class="grand"><td>Total Income (Credit)</td><td class="num">${num(FIN.income)}</td></tr>
    ${rootRow('5000')}${stmtTree('5000', 1)}<tr class="grand"><td>Total Expense (Debit)</td><td class="num">${num(FIN.expense)}</td></tr>
    <tr class="grand" data-t="pl-net"><td>${FIN.net >= 0 ? 'Profit' : 'Loss'} for the period</td><td class="num ${netTone}">${num(FIN.net)}</td></tr></tbody></table></div></div>
    <div class="card"><div class="card-h"><h3>What the numbers say</h3></div><div class="card-b" style="line-height:1.6;color:var(--subtle)">Trading is profitable at gross level. In these first two months the indirect costs (salaries ${omr(glBal('5213'))}, office rent ${omr(glBal('5209'))}, depreciation ${omr(sum(D.gl_by_account.filter((g) => g.account_number.startsWith('523')), 'bal'))}) are larger than the gross profit, which is typical for a new company building its customer base.</div></div></div>`;
}

function bsReport() {
  const eq = r3(FIN.equity + FIN.net);
  return `${reportHead('bs', 'Balance Sheet as at 30 Nov 2026')}
  <div class="grid g-3-2"><div class="card" data-t="bs-table"><div class="tbl-wrap"><table class="tbl dt"><thead><tr><th>Account</th><th class="num">30 Nov 2026</th></tr></thead><tbody>
    ${rootRow('1000')}${stmtTree('1000', 1)}<tr class="grand"><td>Total Asset (Debit)</td><td class="num">${num(FIN.assets)}</td></tr>
    ${rootRow('2000')}${stmtTree('2000', -1)}<tr class="grand"><td>Total Liability (Credit)</td><td class="num">${num(FIN.liabilities)}</td></tr>
    ${rootRow('3000')}${stmtTree('3000', -1)}<tr class="grand"><td>Total Equity (Credit)</td><td class="num">${num(FIN.equity)}</td></tr>
    <tr class="sub"><td>Provisional Profit / Loss (Credit)</td><td class="num ${FIN.net < 0 ? 'neg' : ''}">${num(FIN.net)}</td></tr>
    <tr class="grand"><td>Total (Credit)</td><td class="num">${num(r3(FIN.liabilities + eq))}</td></tr></tbody></table></div></div>
    <div class="stack"><div class="banner ok" data-t="bs-check">${icon('checkcircle')}<span><b>Balanced.</b> Total assets ${omr(FIN.assets)} = liabilities ${omr(FIN.liabilities)} + equity ${omr(FIN.equity)} ${FIN.net < 0 ? '−' : '+'} ${num(Math.abs(FIN.net))} ${FIN.net < 0 ? 'loss' : 'profit'} for the period.</span></div>
    <div class="card"><div class="card-h"><h3>Fixed assets at a glance</h3></div><table class="tbl"><tbody>
      <tr><td>Cost (1700 group, gross)</td><td class="num">${num(sum(D.gl_by_account.filter((g) => g.account_number.startsWith('17') && !g.account_number.startsWith('178')), 'bal'))}</td></tr>
      <tr><td>Accumulated depreciation</td><td class="num">${num(sum(D.gl_by_account.filter((g) => g.account_number.startsWith('178')), 'bal'))}</td></tr>
      <tr class="grand"><td>Net book value</td><td class="num">${num(groupTotal('1700'))}</td></tr></tbody></table></div></div></div>`;
}

function agingBucket(due) {
  const days = Math.round((new Date(AS_OF) - new Date(due)) / 86400000);
  if (days <= 0) return 0;
  if (days <= 30) return 1;
  if (days <= 60) return 2;
  if (days <= 90) return 3;
  return 4;
}
const BUCKETS = ['Not yet due', '1–30 days', '31–60 days', '61–90 days', '90+ days'];
function arReport() {
  const open = D.sales_invoices.filter((s) => s.outstanding_amount);
  const by = {};
  open.forEach((s) => { const r = (by[s.customer] = by[s.customer] || [0, 0, 0, 0, 0]); r[agingBucket(s.due_date)] += s.outstanding_amount; });
  const tot = [0, 0, 0, 0, 0];
  Object.values(by).forEach((r) => r.forEach((v, i) => { tot[i] += v; }));
  const grand = r3(sum(tot, (x) => x));
  return `${reportHead('ar', `Amounts owed by customers as at ${fdate(AS_OF)}, by due date`)}
  <div class="grid g3" data-t="ar-kpis">${[['Total receivable', grand, ''], ['Not yet due', tot[0], 'ok'], ['Overdue', tot[1] + tot[2] + tot[3] + tot[4], 'bad']].map(([l, v, c]) => `<div class="card kpi flat ${c}"><div class="lbl">${l}</div><div class="val" style="font-size:22px"><small>OMR</small>${num(v)}</div></div>`).join('')}</div>
  <div class="card" data-t="ar-table"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Customer</th>${BUCKETS.map((b) => `<th class="num">${b}</th>`).join('')}<th class="num">Total (OMR)</th></tr></thead>
    <tbody>${Object.entries(by).sort((a, b) => sum(b[1], (x) => x) - sum(a[1], (x) => x)).map(([c, r]) => `<tr><td>${docLink(c)}</td>${r.map((v) => `<td class="num ${v < 0 ? 'neg' : ''}">${v ? num(v) : '<span class="muted">—</span>'}</td>`).join('')}<td class="num"><b>${num(sum(r, (x) => x))}</b></td></tr>`).join('')}</tbody>
    <tfoot><tr><td>Total</td>${tot.map((v) => `<td class="num">${num(v)}</td>`).join('')}<td class="num">${num(grand)}</td></tr></tfoot></table></div>
    <div class="card-b small muted" style="border-top:1px solid var(--border-2)">Total agrees with ledger 1310 Debtors (${omr(FIN.receivable)}). Credit notes appear as negative amounts.</div></div>
  <div class="card"><div class="card-h"><h3>Open invoices</h3><span class="sub">${open.length} documents</span></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Due</th><th class="num">Total</th><th class="num">Outstanding</th><th>Status</th></tr></thead>
    <tbody>${open.sort((a, b) => a.due_date.localeCompare(b.due_date)).map((s) => `<tr class="click" data-href="${formHref('sales-invoice', s.name)}"><td class="link">${s.name}</td><td>${esc(s.customer)}</td><td>${fdate(s.posting_date)}</td><td>${fdate(s.due_date)}</td><td class="num">${num(s.grand_total)}</td><td class="num ${s.outstanding_amount < 0 ? 'neg' : ''}"><b>${num(s.outstanding_amount)}</b></td><td>${pill(s.status)}</td></tr>`).join('')}</tbody></table></div></div>`;
}

function apReport() {
  const open = D.purchase_invoices.filter((p) => p.outstanding_amount);
  const omrOf = (p) => r3(p.outstanding_amount * (p.currency === 'USD' ? p.conversion_rate : 1));
  const total = sum(open, omrOf);
  const usd = sum(open.filter((p) => p.currency === 'USD'), omrOf);
  return `${reportHead('ap', `Amounts owed to suppliers as at ${fdate(AS_OF)}`)}
  <div class="grid g3" data-t="ap-kpis">${[['Total payable', total, ''], ['Local suppliers (OMR)', total - usd, ''], ['Foreign suppliers (USD → OMR)', usd, 'warn']].map(([l, v, c]) => `<div class="card kpi ${c}"><div class="lbl">${l}</div><div class="val"><small>OMR</small>${num(v)}</div></div>`).join('')}</div>
  <div class="card" data-t="ap-table"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Invoice</th><th>Supplier</th><th>Supplier bill</th><th>Date</th><th class="num">Outstanding (invoice currency)</th><th class="num">Rate</th><th class="num">Outstanding (OMR)</th></tr></thead>
    <tbody>${open.sort((a, b) => omrOf(b) - omrOf(a)).map((p) => `<tr class="click" data-href="${formHref('purchase-invoice', p.name)}"><td class="link">${p.name}</td><td>${esc(p.supplier)}</td><td class="mono">${esc(p.bill_no)}</td><td>${fdate(p.posting_date)}</td>
      <td class="num">${money(p.outstanding_amount, p.currency)}</td><td class="num">${p.currency === 'USD' ? p.conversion_rate : '1'}</td><td class="num ${p.outstanding_amount < 0 ? 'neg' : ''}"><b>${num(omrOf(p))}</b></td></tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="6">Total</td><td class="num">${num(total)}</td></tr></tfoot></table></div>
    <div class="card-b small muted" style="border-top:1px solid var(--line-2)">Agrees with ledgers 2110 Creditors (${omr(-glBal('2110'))}) and 2130 Creditors - Foreign Suppliers (USD) (${omr(-glBal('2130'))}).</div></div>`;
}

function stockReport() {
  const rows = [...D.stock_balance].sort((a, b) => b.stock_value - a.stock_value);
  const total = sum(rows, 'stock_value');
  const byGroup = {};
  rows.forEach((r) => { const g = ITEM[r.item_code].item_group; byGroup[g] = (byGroup[g] || 0) + r.stock_value; });
  return `${reportHead('stock', `Quantity and value on hand, ${fdate(AS_OF)}`)}
  <div class="grid g-3-2"><div class="card" data-t="stock-table"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Item</th><th>Warehouse</th><th class="num">Qty</th><th class="num">Avg cost</th><th class="num">Value (OMR)</th></tr></thead>
    <tbody>${rows.map((r) => `<tr class="click" data-href="${formHref('item', r.item_code)}" ${r.item_code === 'DEMO-CMP-15' && r.warehouse.startsWith('Stores') ? 'data-t="stock-cmp15"' : ''}><td><span class="link" style="color:var(--brand-700);font-weight:600">${r.item_code}</span><div class="small muted">${esc(r.item_name)}</div></td><td class="small">${r.warehouse}</td><td class="num">${r.actual_qty}</td><td class="num">${num(r.stock_value / r.actual_qty)}</td><td class="num"><b>${num(r.stock_value)}</b></td></tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="4">Total stock value</td><td class="num">${num(total)}</td></tr></tfoot></table></div></div>
    <div class="stack"><div class="card"><div class="card-h"><h3>Value by item group</h3></div><div class="card-b bar-list">${Object.entries(byGroup).sort((a, b) => b[1] - a[1]).map(([g, v]) => `<div class="row"><div><div class="name">${g}</div><div class="bar"><i style="width:${(v / total) * 100}%"></i></div></div><div class="num" style="font-weight:700">${num(v)}</div></div>`).join('')}</div></div>
    <div class="banner ok">${icon('checkcircle')}<span>Stock value ${omr(total)} agrees with ledger 1410 Stock In Hand. Imported items carry their freight, duty and clearing (landed cost).</span></div></div></div>`;
}

function reportView(k) {
  return ({ coa: coaReport, gl: glReport, pl: plReport, bs: bsReport, ar: arReport, ap: apReport, stock: stockReport }[k] || notFound)();
}
function notFound() {
  return `${pageTitle('Page not found')}<div class="card card-b" style="text-align:center;padding:60px"><p class="muted"><a href="#/erp/home" style="color:var(--primary)">Back to Home</a></p></div>`;
}

function erpView(r) {
  const [, view, a, b] = r.parts;
  if (!view || view === 'home') return erpHome();
  if (view === 'ws') return workspace(a);
  if (view === 'list') return listView(a, r.query);
  if (view === 'form') return formView(a, b);
  if (view === 'report') return reportView(a);
  return notFound();
}
