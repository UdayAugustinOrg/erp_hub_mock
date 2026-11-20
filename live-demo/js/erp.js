/* ==========================================================
   erp.js: Infinity ERP desk views (dashboard, workspaces,
   list views, form views, reports). Every figure comes from
   window.ERP; derived totals are computed here.
   ========================================================== */

const MODULES = [
  { id: 'selling', label: 'Selling', icon: 'cart', items: ['lead', 'opportunity', 'quotation', 'sales-order', 'delivery-note', 'sales-invoice', 'customer'], reports: ['ar'] },
  { id: 'buying', label: 'Buying', icon: 'truck', items: ['material-request', 'rfq', 'supplier-quotation', 'purchase-order', 'purchase-receipt', 'purchase-invoice', 'supplier'], reports: ['ap'] },
  { id: 'stock', label: 'Stock', icon: 'box', items: ['item', 'stock-entry', 'landed-cost-voucher'], reports: ['stock'] },
  { id: 'accounts', label: 'Accounts', icon: 'coins', items: ['payment-entry', 'journal-entry'], reports: ['coa', 'gl', 'pl', 'bs', 'ar', 'ap'] },
  { id: 'service', label: 'Service', icon: 'wrench', items: ['warranty-claim', 'maintenance-visit'], reports: [] },
  { id: 'projects', label: 'Projects', icon: 'briefcase', items: ['project', 'task', 'timesheet'], reports: [] },
  { id: 'hr', label: 'HR & Payroll', icon: 'users', items: ['employee', 'leave-application', 'salary-slip'], reports: ['attendance'] },
  { id: 'assets', label: 'Assets', icon: 'building', items: ['asset'], reports: [] },
];
const MOD = Object.fromEntries(MODULES.map((m) => [m.id, m]));
const REPORTS = {
  coa: { label: 'Chart of Accounts', icon: 'tree', module: 'accounts' },
  gl: { label: 'General Ledger', icon: 'book', module: 'accounts' },
  pl: { label: 'Profit and Loss', icon: 'chart', module: 'accounts' },
  bs: { label: 'Balance Sheet', icon: 'scale', module: 'accounts' },
  ar: { label: 'Accounts Receivable', icon: 'inbox', module: 'accounts' },
  ap: { label: 'Accounts Payable', icon: 'send', module: 'accounts' },
  stock: { label: 'Stock Balance', icon: 'box', module: 'stock' },
  attendance: { label: 'Attendance', icon: 'calendar', module: 'hr' },
};

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
const FIN = (() => {
  const income = rootTotal('Income', -1);
  const expense = rootTotal('Expense');
  const cogs = r3(sum(D.gl_by_account.filter((g) => g.account_number.startsWith('50')), 'bal'));
  const opIncome = r3(income - glBal('4810') * -1);
  return {
    income, expense, cogs, opIncome, net: r3(income - expense), gross: r3(opIncome - cogs),
    assets: rootTotal('Asset'), liabilities: rootTotal('Liability', -1), equity: rootTotal('Equity', -1),
    receivable: glBal('1410'), payable: r3(-(glBal('2210') + glBal('2270'))), stock: glBal('1640'),
    cash: r3(glBal('1010') + glBal('1110')),
    sales: sum(D.sales_by_month, 'v'), purchases: r3(sum(D.purchase_by_month, 'v')),
  };
})();

/* ---------- Cell formatting ---------- */
const LINK_FIELDS = ['customer', 'supplier', 'item_code', 'project', 'party', 'party_name', 'return_against', '_receipt'];
function cell(row, [f, , type], slug) {
  const v = row[f];
  if (type === 'money') return money(v, row.currency || 'OMR');
  if (type === 'omr') return num(v);
  if (type === 'date') return fdate(v);
  if (type === 'month') return v ? `${MONTHS[+v.slice(5, 7) - 1]} ${v.slice(0, 4)}` : '—';
  if (type === 'pct') return v == null ? '—' : `<div style="display:flex;align-items:center;gap:8px;min-width:110px"><div class="progress" style="flex:1"><i style="width:${v}%"></i></div><span class="small">${Math.round(v)}%</span></div>`;
  if (type === 'einv') return pill(v === 'Failed' ? 'Failed' : v, v === 'Failed' ? 'bad' : v === 'Not sent' ? 'mute' : 'ok');
  if (type === 'clip') return `<span title="${esc(v)}" style="display:inline-block;max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:bottom">${esc(v)}</span>`;
  if (type === 'n1') return num(v, 2).replace(/\.00$/, '.0');
  if (v == null || v === '') return '<span class="muted">—</span>';
  if (LINK_FIELDS.includes(f) || type === 'party') return docLink(v);
  return esc(v);
}
const isNum = (type) => ['money', 'omr', 'n1'].includes(type);

/* ---------- Shell (sidebar) ---------- */
function erpSidebar(r) {
  const [, view, a] = r.parts;
  const curMod = view === 'ws' ? a : view === 'list' || view === 'form' ? DOCTYPES[a]?.module : view === 'report' ? REPORTS[a]?.module : null;
  const curSlug = view === 'list' || view === 'form' ? a : null;
  const curRep = view === 'report' ? a : null;
  return `
  <div class="sb-brand"><span class="mark">${LOGO}</span><div><b>Infinity ERP</b><small>Business suite</small></div></div>
  <nav class="sb-nav" data-t="sidebar">
    <a class="sb-item ${view === 'home' || !view ? 'on' : ''}" href="#/erp/home">${icon('home')}<span>Home</span></a>
    <div class="sb-sec">Modules</div>
    ${MODULES.map((m) => `
      <div class="sb-group ${curMod === m.id ? 'open' : ''}" data-mod="${m.id}">
        <a class="sb-item ${curMod === m.id && view === 'ws' ? 'on' : ''}" href="#/erp/ws/${m.id}">${icon(m.icon)}<span>${m.label}</span>${icon('right', 'chev')}</a>
        <div class="sb-sub">
          ${m.items.map((s) => `<a href="#/erp/list/${s}" class="${curSlug === s ? 'on' : ''}">${DOCTYPES[s].label}</a>`).join('')}
          ${m.reports.map((k) => `<a href="#/erp/report/${k}" class="${curRep === k ? 'on' : ''}">${REPORTS[k].label}</a>`).join('')}
        </div>
      </div>`).join('')}
  </nav>
  <div class="sb-foot">
    <a href="#/hub/dashboard">${icon('send')}<span>e-Invoice Hub</span></a>
    <a href="index.html">${icon('left')}<span>Demo home</span></a>
  </div>`;
}

/* ---------- Home dashboard ---------- */
function salesChart() {
  const months = D.sales_by_month.map((s) => s.m);
  const sales = D.sales_by_month.map((s) => s.v);
  const purch = months.map((m) => (D.purchase_by_month.find((p) => p.m === m) || {}).v || 0);
  const W = 640, H = 260, pl = 64, pb = 34, pt = 24, max = 60000;
  const y = (v) => pt + (H - pt - pb) * (1 - v / max);
  const gw = (W - pl - 20) / months.length;
  const bw = Math.min(70, gw / 3.2);
  let g = '';
  for (let t = 0; t <= max; t += 15000) g += `<line x1="${pl}" x2="${W - 10}" y1="${y(t)}" y2="${y(t)}" stroke="#E3E8EF"/><text x="${pl - 10}" y="${y(t) + 4}" text-anchor="end" font-size="11" fill="#8693A4">${t ? t / 1000 + 'k' : '0'}</text>`;
  months.forEach((m, i) => {
    const cx = pl + gw * i + gw / 2;
    const bar = (v, x, c, cls) => `<rect class="${cls}" x="${x}" y="${y(v)}" width="${bw}" height="${y(0) - y(v)}" rx="5" fill="${c}"><title>${num(v)}</title></rect>
      <text x="${x + bw / 2}" y="${y(v) - 7}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#22303F">${num(v).replace(/\.\d+$/, '')}</text>`;
    g += bar(sales[i], cx - bw - 4, '#136D9C', 'b-s') + bar(purch[i], cx + 4, '#14A39A', 'b-p');
    g += `<text x="${cx}" y="${H - 10}" text-anchor="middle" font-size="12" font-weight="600" fill="#3A4757">${MONTHS[+m.slice(5) - 1]} ${m.slice(0, 4)}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Monthly sales and purchases">${g}</svg>`;
}

function erpHome() {
  const tiles = [
    ['Sales (net)', FIN.sales, 'chart', '#/erp/list/sales-invoice', 'Oct + Nov 2026, before VAT'],
    ['Purchases', FIN.purchases, 'cart', '#/erp/list/purchase-invoice', 'Oct + Nov 2026, in OMR'],
    ['Receivables', FIN.receivable, 'inbox', '#/erp/report/ar', 'Owed by customers'],
    ['Payables', FIN.payable, 'send', '#/erp/report/ap', 'Owed to suppliers'],
    ['Stock value', FIN.stock, 'box', '#/erp/report/stock', 'All warehouses'],
    ['Cash & bank', FIN.cash, 'bank', '#/erp/report/bs', 'Petty cash + bank'],
  ];
  const hubOk = window.HUB.filter((h) => !h.error_code).length;
  const hubBad = window.HUB.length - hubOk;
  const byCust = {};
  D.sales_invoices.filter((s) => !s.is_return).forEach((s) => { byCust[s.customer] = (byCust[s.customer] || 0) + s.grand_total; });
  const top = Object.entries(byCust).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const recent = [...D.sales_invoices].sort((a, b) => b.posting_date.localeCompare(a.posting_date) || b.name.localeCompare(a.name)).slice(0, 7);
  return `
  ${crumbs([['Home']])}
  <div class="page-h"><h1>Good afternoon</h1><span class="sub">Infy Demo Company · overview to ${fdate(AS_OF)}</span>
    <div class="actions"><span class="demo-note">${icon('info')}Figures from the demo company</span></div></div>
  <div class="grid g6" data-t="kpis">
    ${tiles.map(([l, v, ic, href, foot]) => `<a class="card kpi accent" href="${href}"><div class="lbl">${icon(ic)}${l}</div><div class="val"><small>OMR</small>${num(v)}</div><div class="foot">${foot}</div></a>`).join('')}
  </div>
  <div class="grid g-2-1">
    <div class="card" data-t="sales-chart"><div class="card-h"><h3>Sales vs purchases by month</h3><span class="sub">OMR, net of VAT</span>
      <div class="right legend"><span><i style="background:#136D9C"></i>Sales</span><span><i style="background:#14A39A"></i>Purchases</span></div></div>
      <div class="card-b chart">${salesChart()}</div></div>
    <div class="card" data-t="home-einv"><div class="card-h"><h3>E-invoicing</h3><span class="right">${pill('Live', 'ok')}</span></div>
      <div class="card-b">
        <div class="grid g2" style="gap:12px">
          <div><div class="muted small">Delivered</div><div style="font-size:28px;font-weight:800;color:var(--ok)">${hubOk}</div></div>
          <div><div class="muted small">Needs attention</div><div style="font-size:28px;font-weight:800;color:var(--bad)">${hubBad}</div></div>
        </div>
        <div class="progress" style="margin:14px 0 6px;height:9px;background:var(--bad-50)"><i style="width:${(hubOk / window.HUB.length) * 100}%;background:var(--ok)"></i></div>
        <div class="small muted">${pct((hubOk / window.HUB.length) * 100)} of ${window.HUB.length} documents delivered to buyers through the Infinity e-Invoice Hub.</div>
        <div style="margin-top:16px;display:grid;gap:8px">
          ${window.HUB.filter((h) => h.error_code).map((h) => `<a class="banner bad" href="#/hub/doc/${h.erp_doc_id}" style="padding:9px 12px">${icon('alert')}<span><b>${h.erp_doc_id}</b><br><span class="small">${h.error_code === 'MANDATORY_FIELD' ? 'Customer address missing' : 'Buyer VAT number invalid'}</span></span></a>`).join('')}
        </div>
        <a class="btn btn-ghost" style="margin-top:14px;width:100%" href="#/hub/dashboard">${icon('send')}Open e-Invoice Hub</a>
      </div></div>
  </div>
  <div class="grid g2">
    <div class="card"><div class="card-h"><h3>Top customers by billing</h3><span class="sub">Invoices + debit notes, incl. VAT</span></div>
      <div class="card-b bar-list">${top.map(([c, v]) => `<div class="row"><div><div class="name">${docLink(c)}</div><div class="bar"><i style="width:${(v / top[0][1]) * 100}%"></i></div></div><div class="num" style="font-weight:700">${omr(v)}</div></div>`).join('')}</div></div>
    <div class="card"><div class="card-h"><h3>Latest sales invoices</h3><a class="right small" style="color:var(--brand-700);font-weight:600" href="#/erp/list/sales-invoice">View all</a></div>
      <table class="tbl"><tbody>${recent.map((s) => `<tr class="click" data-href="${formHref('sales-invoice', s.name)}"><td class="link">${s.name}</td><td>${esc(s.customer)}</td><td class="num">${num(s.grand_total)}</td><td>${pill(s.status)}</td></tr>`).join('')}</tbody></table></div>
  </div>`;
}

/* ---------- Workspaces ---------- */
const WS_FLOW = {
  selling: { title: 'Lead to cash', steps: [['lead', 'Capture the enquiry'], ['opportunity', 'Qualify the deal'], ['quotation', 'Send the price'], ['sales-order', 'Confirm the order'], ['delivery-note', 'Ship the goods'], ['sales-invoice', 'Bill + e-invoice'], ['payment-entry', 'Collect payment']] },
  buying: { title: 'Procure to pay', steps: [['material-request', 'Stores ask for stock'], ['rfq', 'Invite suppliers'], ['supplier-quotation', 'Compare offers'], ['purchase-order', 'Order the best offer'], ['purchase-receipt', 'Receive the goods'], ['purchase-invoice', 'Book the bill'], ['payment-entry', 'Pay the supplier']] },
  stock: { title: 'Stock and landed cost', steps: [['purchase-receipt', 'Goods come in'], ['landed-cost-voucher', 'Add freight, duty, clearing'], ['stock-entry', 'Move or issue stock'], ['delivery-note', 'Goods go out']] },
  accounts: { title: 'Record to report', steps: [['sales-invoice', 'Sales post automatically'], ['purchase-invoice', 'Purchases post automatically'], ['payment-entry', 'Receipts and payments'], ['journal-entry', 'Adjustments and accruals']] },
  service: { title: 'Complaint to repair invoice', steps: [['sales-invoice', 'Motor sold'], ['warranty-claim', 'Customer complaint'], ['maintenance-visit', 'Engineer visit'], ['timesheet', 'Labour hours'], ['sales-invoice', 'Repair invoice']] },
  projects: { title: 'Plan, track and bill', steps: [['project', 'Set up the job'], ['task', 'Break into tasks'], ['timesheet', 'Log hours'], ['sales-invoice', 'Bill the customer']] },
  hr: { title: 'Hire to pay', steps: [['employee', 'Employee records'], ['leave-application', 'Leave and attendance'], ['salary-slip', 'Monthly payroll'], ['journal-entry', 'Payroll posted to accounts']] },
  assets: { title: 'Buy, use, depreciate', steps: [['purchase-invoice', 'Asset purchased'], ['asset', 'Asset register'], ['journal-entry', 'Monthly depreciation']] },
};
function workspace(id) {
  const m = MOD[id];
  if (!m) return notFound();
  const f = WS_FLOW[id];
  const flow = `<div class="chain">${f.steps.map(([s, sub], i) => `${i ? `<span class="arrow">${icon('arrow')}</span>` : ''}<a class="node" href="#/erp/list/${s}"><div class="k">${icon(DOCTYPES[s].icon)}${i + 1}</div><div class="t">${DOCTYPES[s].one}</div><div class="s">${sub}</div></a>`).join('')}</div>`;
  return `
  ${crumbs([['Home', '#/erp/home'], [m.label]])}
  <div class="page-h"><h1>${m.label}</h1><span class="sub">Workspace</span></div>
  <div class="card ws-flow" data-t="ws-flow"><div class="sec-title">${f.title}</div>${flow}</div>
  <div><div class="sec-title">Documents</div><div class="ws-tiles" data-t="ws-tiles">
    ${m.items.map((s) => `<a class="card ws-tile" href="#/erp/list/${s}"><span class="ic">${icon(DOCTYPES[s].icon)}</span><div><b>${DOCTYPES[s].label}</b><span>${DOCTYPES[s].rows.length} records</span></div><span class="cnt">${DOCTYPES[s].rows.length}</span></a>`).join('')}
  </div></div>
  ${m.reports.length ? `<div><div class="sec-title">Reports</div><div class="ws-tiles">${m.reports.map((k) => `<a class="card ws-tile" href="#/erp/report/${k}"><span class="ic">${icon(REPORTS[k].icon)}</span><div><b>${REPORTS[k].label}</b><span>Report</span></div></a>`).join('')}</div></div>` : ''}`;
}

/* ---------- List view ---------- */
function listView(slug, query) {
  const t = DOCTYPES[slug];
  if (!t) return notFound();
  const statuses = {};
  t.rows.forEach((r) => { const s = statusOf(slug, r); if (s) statuses[s] = (statuses[s] || 0) + 1; });
  const sel = query.status;
  const rows = sel ? t.rows.filter((r) => statusOf(slug, r) === sel) : t.rows;
  const m = MOD[t.module];
  const showName = !['customer', 'supplier'].includes(slug);
  const totalCol = t.cols.find((c) => c[0] === 'grand_total' || c[0] === 'paid_amount' || c[0] === 'net_pay' || c[0] === 'stock_value');
  return `
  ${crumbs([['Home', '#/erp/home'], [m.label, `#/erp/ws/${m.id}`], [t.label]])}
  <div class="page-h"><h1>${t.label}</h1><span class="sub">${t.rows.length} records</span>
    <div class="actions"><button class="btn btn-ghost" data-act="mock">${icon('download')}Export</button><button class="btn btn-primary" data-act="mock">${icon('plus')}New ${t.one}</button></div></div>
  ${slug === 'salary-slip' ? payrollSummary() : ''}
  <div class="card" data-t="list">
    <div class="toolbar" data-t="list-chips">
      <a class="chip ${!sel ? 'on' : ''}" href="#/erp/list/${slug}">All <span class="n">${t.rows.length}</span></a>
      ${Object.entries(statuses).map(([s, n]) => `<a class="chip ${sel === s ? 'on' : ''}" href="#/erp/list/${slug}?status=${encodeURIComponent(s)}">${esc(s)} <span class="n">${n}</span></a>`).join('')}
      <span class="sep"></span>
      <span class="chip filter">${icon('filter')}Company: Infy Demo Company</span>
      <span class="right">${rows.length} shown</span>
    </div>
    <div class="tbl-wrap"><table class="tbl" data-t="list-table">
      <thead><tr>${showName ? `<th>${slug === 'item' ? 'Item code' : 'ID'}</th>` : '<th>Name</th>'}${t.cols.map((c) => `<th class="${isNum(c[2]) ? 'num' : ''}">${c[1]}</th>`).join('')}<th>Status</th></tr></thead>
      <tbody>${rows.map((r) => `<tr class="click" data-href="${formHref(slug, r[t.id])}" data-name="${esc(r[t.id])}">
        <td class="link">${esc(r[t.id])}</td>${t.cols.map((c) => `<td class="${isNum(c[2]) ? 'num' : ''}">${cell(r, c, slug)}</td>`).join('')}<td>${pill(statusOf(slug, r))}</td></tr>`).join('')}</tbody>
      ${totalCol && totalCol[2] !== 'money' ? `<tfoot><tr><td colspan="${t.cols.indexOf(totalCol) + 1}">Total</td><td class="num">${num(sum(rows, totalCol[0]))}</td><td colspan="${t.cols.length - t.cols.indexOf(totalCol)}"></td></tr></tfoot>` : ''}
    </table></div>
  </div>`;
}

/* ---------- Form view ---------- */
const FIELD_LABELS = {
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
const MONEY_F = ['opportunity_amount', 'paid_amount', 'total_debit', 'total_outgoing_value', 'total_incoming_value', 'estimated_costing', 'total_billed_amount',
  'total_billable_amount', 'gross_pay', 'total_deduction', 'net_pay', 'gross_purchase_amount', 'total_taxes_and_charges'];

function fieldVal(k, v, d) {
  if (v == null || v === '') return '<span class="muted">—</span>';
  if (k.endsWith('_date') || k === 'transaction_date' || k === 'mntc_date') return fdate(v);
  if (k === 'start_date') return `${MONTHS[+v.slice(5, 7) - 1]} ${v.slice(0, 4)}`;
  if (MONEY_F.includes(k)) return omr(v);
  if (k === 'is_stock_item') return v ? 'Yes' : 'No';
  if (k === 'percent_complete') return pct(v);
  if (['customer', 'supplier', 'party', 'party_name', 'item_code', 'project'].includes(k)) return docLink(v);
  return esc(v);
}
function detailsCard(d, extraFields = []) {
  const keys = Object.keys(d).filter((k) => !HIDE.includes(k) && !k.startsWith('_') && d[k] != null && d[k] !== '');
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
  if (tax) rows.push([`VAT 5% ${selling ? '<span class="small muted">· 2510 Output VAT</span>' : '<span class="small muted">· 1710 Input VAT recoverable</span>'}`, money(tax, cur)]);
  else if (!rcm) rows.push(['VAT', '<span class="muted">Not charged</span>']);
  return `<div class="card" data-t="totals"><div class="card-h"><h3>Taxes and totals</h3></div><div class="card-b" style="display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start">
    <div style="flex:1;min-width:240px" class="small muted">${rcm ? `<div class="banner info">${icon('info')}<span><b>Reverse-charge VAT.</b> The foreign supplier charges no VAT. Infinity ERP self-assesses 5% import VAT of <b>${omr(r3(d.base_grand_total * 0.05))}</b> to 2530 OTA Reverse Charge (RCM), so it can be reclaimed in the same return.</span></div>` : selling ? 'VAT is calculated per line at the standard 5% rate and posted to Output VAT. The same figures go into the e-invoice.' : 'Input VAT is posted to 1710 and offsets output VAT in the VAT return.'}</div>
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
/* Service journey: sold invoice -> claim -> visit -> timesheet -> repair invoice */
function serviceChain(claimName, curName) {
  const c = getDoc('warranty-claim', claimName);
  const sinvs = linkedOf(claimName, 'sales-invoice');
  const repair = sinvs.find((s) => getDoc('sales-invoice', s).items.some((i) => ['DEMO-LAB-HR', 'DEMO-SRV-REWIND'].includes(i.item_code)));
  const sold = sinvs.find((s) => s !== repair);
  const visit = linkedOf(claimName, 'maintenance-visit').sort()[0] && linkedOf(claimName, 'maintenance-visit').find((v) => linkedOf(v, 'timesheet').length) || linkedOf(claimName, 'maintenance-visit')[0];
  const ts = visit ? linkedOf(visit, 'timesheet')[0] : null;
  return chainHtml([
    { slug: 'sales-invoice', name: sold, label: 'Motor sold' }, { slug: 'warranty-claim', name: claimName }, { slug: 'maintenance-visit', name: visit },
    { slug: 'timesheet', name: ts, label: 'Engineer hours' }, { slug: 'sales-invoice', name: repair, label: c.status === 'Closed' && !repair ? 'Free under warranty' : 'Repair invoice' },
  ], curName);
}

function connectionsCard(name, slug) {
  const groups = {};
  const add = (n) => { const s = slugOf(n); if (s && getDoc(s, n)) (groups[s] = groups[s] || new Set()).add(n); };
  linked(name).forEach(add);
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

/* ---------- E-invoice section on sales invoices ---------- */
const TYPE_LABEL = { 380: 'Tax invoice', 381: 'Credit note', 383: 'Debit note' };
function einvoiceCard(d) {
  const h = HUBDOC[d.name];
  if (!h) return '';
  const failed = !!h.error_code;
  const st = failed ? 'Failed' : d.custom_einvoice_status;
  const reason = failed ? HUB_ERR[h.error_code] : null;
  return `<div class="card" data-t="einvoice"><div class="card-h"><h3>${icon('send')} E-Invoice</h3><span class="sub">${TYPE_LABEL[h.type_code]} · type code ${h.type_code}</span>
    <span class="right">${pill(st, failed ? 'bad' : 'ok', 'lg')}</span></div>
    <div class="card-b">
    ${failed ? `<div class="banner bad" style="margin-bottom:16px" data-t="einv-fail">${icon('alert')}<span><b>The e-invoice could not be sent.</b> ${reason.short}<br><span class="small">Fix: ${reason.fixShort}</span></span>
      <span class="act"><a class="btn btn-ghost" href="${formHref('customer', d.customer)}">${icon('edit')}Edit customer</a><button class="btn btn-danger" data-act="amend" data-doc="${d.name}" data-t="amend-btn">${icon('undo')}Cancel &amp; amend</button></span></div>` : ''}
    <div class="einv">
      <div><div class="qr">${failed ? `<div style="height:100%;display:grid;place-items:center;color:var(--ink-300);text-align:center;font-size:11px">${icon('xcircle')}<br>No QR yet</div>` : qrSvg(h.uuid)}</div><div class="qr-cap">${failed ? '' : 'QR code (placeholder)'}</div></div>
      <div class="fields c2">
        <div class="fld"><div class="lbl">E-invoice status</div><div class="val">${failed ? `<span style="color:var(--bad)">Failed · ${h.error_code}</span>` : `${esc(st)} to buyer`}</div></div>
        <div class="fld"><div class="lbl">Invoice UUID</div><div class="val">${h.uuid ? `<span class="uuid">${h.uuid}</span>` : '<span class="muted">Assigned on successful validation</span>'}</div></div>
        <div class="fld"><div class="lbl">Buyer endpoint</div><div class="val mono">${h.participant_to}</div></div>
        <div class="fld"><div class="lbl">Last update from hub</div><div class="val">${ftime(h.updated_at, true)}</div></div>
        ${d.custom_cn_reason_code ? `<div class="fld"><div class="lbl">Reason code</div><div class="val">${d.custom_cn_reason_code} · ${CN_REASON[d.custom_cn_reason_code]}</div></div>` : ''}
        <div class="fld"><div class="lbl">&nbsp;</div><div class="val"><a class="btn btn-ghost" href="#/hub/doc/${d.name}" data-t="open-hub">${icon('ext')}View in e-Invoice Hub</a></div></div>
      </div>
    </div></div></div>`;
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
    <tbody>${d.taxes.map((t) => { const pinv = (t.description.match(/ACC-PINV-\d{4}-\d{5}/) || [])[0]; const p = pinv && getDoc('purchase-invoice', pinv);
      return `<tr><td><b>${esc(t.description.replace(/\s*\(ACC-PINV.*\)/, ''))}</b></td><td>${p ? docLink(p.supplier) : '—'}</td><td>${pinv ? docLink(pinv) : '—'}</td><td class="small muted">${esc(t.expense_account.replace(/ - INFY$/, ''))}</td><td class="num">${num(t.amount)}</td></tr>`; }).join('')}</tbody>
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
  const eng = engineerFor(d.name);
  const emp = eng && D.employees.find((e) => e.employee_name === eng);
  return `<div class="card" data-t="visit-purpose"><div class="card-h"><h3>Visit purpose and work done</h3></div>
    <table class="tbl"><thead><tr><th>Item</th><th>Against</th><th>Service person</th><th>Work done</th></tr></thead>
    <tbody><tr><td>${c ? docLink(c.item_code) : '—'}</td><td>${claim ? docLink(claim) : '—'}</td><td>${emp ? `${docLink(emp.name, eng)}<div class="small muted">${emp.designation}</div>` : '<span class="muted">—</span>'}</td><td style="max-width:420px">${c ? esc(c.resolution_details || c.complaint) : '—'}</td></tr></tbody></table></div>
    ${claim ? serviceChain(claim, d.name) : ''}`;
}

function projectSections(d) {
  const tasks = D.tasks.filter((t) => t.project === d.name);
  const ts = linkedOf(d.name, 'timesheet').map((n) => getDoc('timesheet', n)).sort((a, b) => a.name.localeCompare(b.name));
  const inv = linkedOf(d.name, 'sales-invoice')[0];
  const cn = inv && D.sales_invoices.find((s) => s.return_against === inv);
  return `<div class="grid g-3-2" data-t="project-tasks">
    <div class="card"><div class="card-h"><h3>Tasks</h3><span class="sub">${tasks.filter((t) => t.status === 'Completed').length} of ${tasks.length} done</span></div>
      <table class="tbl"><tbody>${tasks.map((t) => `<tr class="click" data-href="${formHref('task', t.name)}"><td class="link">${t.name}</td><td><b>${esc(t.subject)}</b></td><td class="small muted">Due ${fdate(t.exp_end_date)}</td><td>${pill(t.status)}</td></tr>`).join('')}</tbody></table></div>
    <div class="card"><div class="card-h"><h3>Progress and billing</h3></div><div class="card-b">
      <div class="prog-row"><span>Complete</span><div class="progress"><i style="width:${d.percent_complete}%"></i></div><span class="num">${pct(d.percent_complete)}</span></div>
      <table class="totals" style="max-width:none;margin-top:12px">
        <tr><td>Estimated cost</td><td class="num">${omr(d.estimated_costing)}</td></tr>
        <tr><td>Hours logged</td><td class="num">${sum(ts, 'total_hours')} h</td></tr>
        <tr><td>Billable value of hours</td><td class="num">${omr(sum(ts, 'total_billable_amount'))}</td></tr>
        <tr class="gt"><td>Total billed</td><td class="num">${omr(d.total_billed_amount)}</td></tr></table>
      ${inv ? `<div class="banner info small" style="margin-top:10px">${icon('info')}<span>Hours were billed on ${docLink(inv)}${cn ? `, then reversed by credit note ${docLink(cn.name)} (reason ${cn.custom_cn_reason_code}: ${CN_REASON[cn.custom_cn_reason_code]})` : ''}. Net billed so far: ${omr(d.total_billed_amount)}.</span></div>` : ''}
    </div></div></div>
    <div class="card"><div class="card-h"><h3>Timesheets</h3></div>
      <table class="tbl"><thead><tr><th>Timesheet</th><th>Employee</th><th class="num">Hours</th><th class="num">Billable (OMR)</th><th>Status</th></tr></thead>
      <tbody>${ts.map((t) => `<tr class="click" data-href="${formHref('timesheet', t.name)}"><td class="link">${t.name}</td><td>${esc(t.employee_name)}</td><td class="num">${t.total_hours}</td><td class="num">${num(t.total_billable_amount)}</td><td>${pill(t.status)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="2">Total</td><td class="num">${sum(ts, 'total_hours')}</td><td class="num">${num(sum(ts, 'total_billable_amount'))}</td><td></td></tr></tfoot></table></div>`;
}

function assetSections(d) {
  const jv = linkedOf(d.name, 'journal-entry')[0];
  const pinv = linkedOf(d.name, 'purchase-invoice')[0];
  return `<div class="card" data-t="asset-dep"><div class="card-h"><h3>Value and depreciation</h3>${pill(d.status)}</div><div class="card-b">
    <div class="grid g4">
      <div class="kpi card"><div class="lbl">Gross purchase amount</div><div class="val"><small>OMR</small>${num(d.gross_purchase_amount)}</div><div class="foot">${pinv ? `Bought on ${docLink(pinv)}` : 'Recorded directly'}</div></div>
      <div class="kpi card"><div class="lbl">Depreciation booked</div><div class="val"><small>OMR</small>${num(d._dep)}</div><div class="foot">${jv ? `${docLink(jv)} · ${fdate(getDoc('journal-entry', jv).posting_date)}` : 'No depreciation posted yet'}</div></div>
      <div class="kpi card"><div class="lbl">Net book value</div><div class="val" style="color:var(--brand-700)"><small>OMR</small>${num(d._nbv)}</div><div class="foot">Gross less depreciation booked</div></div>
      <div class="kpi card"><div class="lbl">In use since</div><div class="val" style="font-size:18px">${fdate(d.available_for_use_date)}</div><div class="foot">${esc(d.asset_category)}</div></div>
    </div></div></div>`;
}

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
  'MAT-STE-2026-00001': { note: 'Derived: matches the stock now held in Finished Goods - INFY (1 compressor at 2,400.000 + 10 filters at 18.000 = 2,580.000).', from: 'Stores - INFY', to: 'Finished Goods - INFY', lines: [['DEMO-CMP-15', 1, 2400], ['DEMO-FLT-01', 10, 18]] },
  'MAT-STE-2026-00003': { note: 'Derived: parts replaced free of charge under warranty claim SER-WRN-2026-00002, booked to 5310 Warranty Repairs (13.000).', from: 'Stores - INFY', to: null, lines: [['DEMO-FAN-01', 1, 7], ['DEMO-BRG-01', 1, 6]] },
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
  const bank = GL['1110'];
  return `<div class="card" data-t="pay-refs"><div class="card-h"><h3>Payment references</h3></div>
    <table class="tbl"><thead><tr><th>Against</th><th>Date</th><th class="num">Invoice total</th><th class="num">Allocated (OMR)</th></tr></thead>
    <tbody>${refs.length ? refs.map((n) => { const s = slugOf(n); const i = getDoc(s, n); return `<tr><td>${docLink(n)}</td><td>${fdate(i.posting_date)}</td><td class="num">${money(i.grand_total, i.currency || 'OMR')}</td><td class="num"><b>${num(d.paid_amount)}</b></td></tr>`; }).join('')
      : `<tr><td colspan="4" class="muted">Unallocated: held on account as an advance from ${esc(d.party)}.</td></tr>`}</tbody></table>
    <div class="card-b small muted" style="border-top:1px solid var(--line-2)">${d.payment_type === 'Receive' ? 'Received into' : 'Paid from'} ${bank.account_number} · ${esc(bank.account_name)}${fx ? `. Exchange difference posted by ${docLink(fx)} (${omr(getDoc('journal-entry', fx).total_debit)}).` : ''}</div></div>`;
}

function salarySections(d) {
  return `<div class="card" data-t="slip"><div class="card-h"><h3>Pay summary</h3><span class="sub">October 2026</span></div><div class="card-b"><table class="totals">
    <tr><td>Gross pay</td><td class="num">${omr(d.gross_pay)}</td></tr><tr><td>Total deductions <span class="small muted">· posted to 2630 PASI Contributions Payable</span></td><td class="num">− ${num(d.total_deduction)}</td></tr>
    <tr class="gt"><td>Net pay</td><td class="num">${omr(d.net_pay)}</td></tr></table></div></div>`;
}

function formExtras(slug, d) {
  const cur = d.currency || 'OMR';
  const parts = [];
  if (['sales-invoice'].includes(slug)) parts.push(einvoiceCard(d));
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
  if (slug === 'project') parts.push(projectSections(d));
  if (slug === 'asset') parts.push(assetSections(d));
  if (slug === 'customer') parts.push(customerSections(d));
  if (slug === 'item') parts.push(itemSections(d));
  if (slug === 'stock-entry') parts.push(steSections(d));
  if (slug === 'payment-entry') parts.push(paymentSections(d));
  if (slug === 'salary-slip') parts.push(salarySections(d));
  return parts.join('');
}

function formView(slug, name) {
  const t = DOCTYPES[slug];
  const d = t && getDoc(slug, name);
  if (!d) return notFound();
  const m = MOD[t.module];
  const st = statusOf(slug, d);
  const party = d.customer || d.supplier || d.party || d.employee_name || d.item_name || d.project_name || d.asset_name || d.lead_name || d.party_name || '';
  const extra = [];
  if (slug === 'maintenance-visit') extra.push(['Engineer', esc(d._engineer)]);
  if (slug === 'timesheet') { extra.push(['Work for', esc(d._activity)]); extra.push(['Rate per hour', d.total_billable_amount ? omr(d.total_billable_amount / d.total_hours) : 'Not billable (warranty)']); }
  if (slug === 'customer' && d.tax_id && !/^OM\d{10}$/.test(d.tax_id)) {
    const i = Object.keys(d).indexOf('tax_id');
  }
  let banner = '';
  if (slug === 'sales-invoice' && d.is_return) banner = `<div class="banner info" data-t="return-banner">${icon('undo')}<span><b>Credit note</b> against ${docLink(d.return_against)} · reason <b>${d.custom_cn_reason_code}</b>: ${CN_REASON[d.custom_cn_reason_code]}. It reduces what ${esc(d.customer)} owes by ${omr(-d.grand_total)} and is e-invoiced as type 381.</span></div>`;
  if (slug === 'sales-invoice' && d.is_debit_note) banner = `<div class="banner warn" data-t="return-banner">${icon('plus')}<span><b>Debit note</b> against ${docLink(d.return_against)} · reason <b>${d.custom_cn_reason_code}</b>: ${CN_REASON[d.custom_cn_reason_code]}. It adds ${omr(d.grand_total)} to the original invoice and is e-invoiced as type 383.</span></div>`;
  if (slug === 'customer' && d.name === 'Demo Walk-in Customer') banner = `<div class="banner bad">${icon('alert')}<span><b>No billing address.</b> E-invoice ${docLink('ACC-SINV-2026-00028')} was stopped by the hub because the buyer address is mandatory.</span></div>`;
  if (slug === 'customer' && d.tax_id && !/^OM\d{10}$/.test(d.tax_id)) banner = `<div class="banner bad">${icon('alert')}<span><b>VAT number “${esc(d.tax_id)}” is not valid.</b> Oman VAT numbers are 12 characters: OM followed by 10 digits. E-invoice ${docLink('ACC-SINV-2026-00029')} was rejected for this reason.</span></div>`;
  const tax = slug === 'customer' && d.tax_id && !/^OM\d{10}$/.test(d.tax_id);
  const dd = tax ? { ...d } : d;
  return `
  ${crumbs([['Home', '#/erp/home'], [m.label, `#/erp/ws/${m.id}`], [t.label, `#/erp/list/${slug}`], [name]])}
  <div class="page-h" data-t="form-head"><span class="ws-tile" style="padding:0"><span class="ic" style="width:40px;height:40px">${icon(t.icon)}</span></span>
    <div><div class="small muted" style="font-weight:600">${t.one}</div><h1>${esc(name)}</h1></div>${pill(st, null, 'lg')}
    ${party && party !== name ? `<span class="sub">· ${esc(party)}</span>` : ''}
    <div class="actions"><button class="btn btn-ghost" data-act="mock">${icon('file')}Print</button><button class="btn btn-ghost" data-act="mock">${icon('menu')}</button></div></div>
  <div class="form-tabs"><span class="on">Details</span><span>${slug === 'sales-invoice' ? 'E-Invoice' : 'More info'}</span><span>Connections</span><span>Activity</span></div>
  ${banner}
  ${detailsCard(dd, extra).replace(tax ? `<div class="fld "><div class="lbl">VAT number</div><div class="val">${esc(d.tax_id)}</div></div>` : '@@', `<div class="fld bad"><div class="lbl">VAT number</div><div class="val">${esc(d.tax_id)}<span class="flag">Invalid format</span></div></div>`)}
  ${formExtras(slug, d)}
  ${connectionsCard(name, slug)}`;
}

/* ---------- Reports ---------- */
function reportHead(k, sub, extra = '') {
  const r = REPORTS[k];
  return `${crumbs([['Home', '#/erp/home'], [MOD[r.module].label, `#/erp/ws/${r.module}`], [r.label]])}
  <div class="page-h"><h1>${r.label}</h1><span class="sub">${sub}</span><div class="actions">${extra}<span class="chip filter">${icon('filter')}Infy Demo Company</span><span class="chip filter">${icon('calendar')}1 Oct – 20 Nov 2026</span></div></div>
  <div class="demo-note">${icon('info')}Figures from the demo company's ledger.</div>`;
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
  return `${reportHead('coa', `${D.accounts_tree_top.length} accounts · 4-digit numbering`, `<button class="btn btn-ghost" data-act="tree-all">${icon('layers')}Expand all</button>`)}
  <div class="grid g-3-2"><div class="card" data-t="coa-tree"><table class="tbl tree"><thead><tr><th>Account</th><th>Type</th><th class="num">Balance (OMR)</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>
  <div class="stack"><div class="card"><div class="card-h"><h3>How the numbering works</h3></div><div class="card-b" style="line-height:1.7">
    <div><span class="acno mono" style="color:var(--brand-700);font-weight:700">1xxx</span> Assets · <span class="acno mono" style="color:var(--brand-700);font-weight:700">2xxx</span> Liabilities</div>
    <div><span class="mono" style="color:var(--brand-700);font-weight:700">3xxx</span> Equity · <span class="mono" style="color:var(--brand-700);font-weight:700">4xxx</span> Revenue</div>
    <div><span class="mono" style="color:var(--brand-700);font-weight:700">5xxx–9xxx</span> Costs and expenses</div>
    <p class="small muted" style="margin-top:8px">Each group (e.g. 1600 Inventories) holds its ledgers (e.g. 1640 Inventory - Plant Equipment and Spares). Click a group to open it.</p></div></div>
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
    <p class="small muted" style="margin-top:12px;line-height:1.6">Every invoice, payment, stock movement, payroll run and depreciation posts here automatically, with no re-keying. ${D.gl_by_account.length} ledgers have activity in the period.</p></div></div>
    <div class="card"><div class="card-h"><h3>Totals by type</h3></div><table class="tbl"><tbody>${order.map((rt) => { const v = rootTotal(rt); return `<tr><td><b>${rt}</b></td><td class="num">${num(Math.abs(v))} ${v >= 0 ? 'Dr' : 'Cr'}</td></tr>`; }).join('')}</tbody></table></div></div></div>`;
}

function stmtRows(groups) {
  return groups.map((g) => `<tr class="sub"><td><span class="mono" style="color:var(--brand-700);margin-right:8px">${g.no}</span>${esc(g.name)}</td><td class="num">${num(g.total)}</td></tr>` +
    g.rows.map((r) => `<tr><td style="padding-left:40px"><span class="mono muted" style="margin-right:8px">${r.no}</span>${esc(r.name)}</td><td class="num">${num(r.amt)}</td></tr>`).join('')).join('');
}
function plReport() {
  const inc = glGroups('Income', -1), exp = glGroups('Expense');
  const netTone = FIN.net >= 0 ? 'pos' : 'neg';
  return `${reportHead('pl', 'Income statement, 1 Oct – 20 Nov 2026')}
  <div class="grid g-3-2"><div class="card" data-t="pl-table"><table class="tbl"><thead><tr><th>Account</th><th class="num">Amount (OMR)</th></tr></thead><tbody>
    <tr class="grand"><td>Income</td><td class="num">${num(FIN.income)}</td></tr>${stmtRows(inc)}
    <tr class="grand"><td>Expenses</td><td class="num">${num(FIN.expense)}</td></tr>${stmtRows(exp)}
    <tr class="grand" data-t="pl-net"><td>${FIN.net >= 0 ? 'Net profit' : 'Net loss'} for the period</td><td class="num ${netTone}">${num(FIN.net)}</td></tr></tbody></table></div>
    <div class="stack" data-t="pl-summary">
      <div class="grid g2"><div class="card kpi"><div class="lbl">Revenue</div><div class="val"><small>OMR</small>${num(FIN.income)}</div></div>
      <div class="card kpi"><div class="lbl">Cost of goods sold</div><div class="val"><small>OMR</small>${num(FIN.cogs)}</div></div>
      <div class="card kpi ok"><div class="lbl">Gross profit</div><div class="val"><small>OMR</small>${num(FIN.gross)}</div><div class="foot">${pct((FIN.gross / FIN.opIncome) * 100)} margin on sales</div></div>
      <div class="card kpi ${FIN.net >= 0 ? 'ok' : 'bad'}"><div class="lbl">${FIN.net >= 0 ? 'Net profit' : 'Net loss'}</div><div class="val"><small>OMR</small>${num(FIN.net)}</div><div class="foot">After salaries, rent and depreciation</div></div></div>
      <div class="card"><div class="card-b small" style="line-height:1.6;color:var(--ink-700)">Trading is profitable at gross level. In these first two months the overheads (salaries ${omr(sum(D.salary_slips, 'gross_pay'))}, office rent ${omr(glBal('7210'))}, depreciation) are larger than the gross profit, which is typical for a new company building its customer base.</div></div>
    </div></div>`;
}

function bsReport() {
  const a = glGroups('Asset'), l = glGroups('Liability', -1), e = glGroups('Equity', -1);
  const le = r3(FIN.liabilities + FIN.equity + FIN.net);
  return `${reportHead('bs', `As at ${fdate(AS_OF)}`)}
  <div class="grid g2" data-t="bs-table">
    <div class="card"><div class="card-h"><h3>Assets</h3></div><table class="tbl"><tbody>${stmtRows(a)}<tr class="grand"><td>Total assets</td><td class="num">${num(FIN.assets)}</td></tr></tbody></table></div>
    <div class="card"><div class="card-h"><h3>Liabilities and equity</h3></div><table class="tbl"><tbody>
      <tr class="grand"><td>Liabilities</td><td class="num">${num(FIN.liabilities)}</td></tr>${stmtRows(l)}
      <tr class="grand"><td>Equity</td><td class="num">${num(r3(FIN.equity + FIN.net))}</td></tr>${stmtRows(e)}
      <tr class="sub"><td>Profit / (loss) for the period</td><td class="num ${FIN.net < 0 ? 'neg' : ''}">${num(FIN.net)}</td></tr>
      <tr class="grand"><td>Total liabilities and equity</td><td class="num">${num(le)}</td></tr></tbody></table></div>
  </div>
  <div class="banner ok" data-t="bs-check">${icon('checkcircle')}<span><b>Balanced.</b> Total assets ${omr(FIN.assets)} = liabilities ${omr(FIN.liabilities)} + equity ${omr(r3(FIN.equity + FIN.net))}.</span></div>`;
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
  const unalloc = D.payments.filter((p) => p.payment_type === 'Receive' && !linked(p.name).length);
  const by = {};
  open.forEach((s) => { const r = (by[s.customer] = by[s.customer] || [0, 0, 0, 0, 0, 0]); r[agingBucket(s.due_date)] += s.outstanding_amount; });
  unalloc.forEach((p) => { const r = (by[p.party] = by[p.party] || [0, 0, 0, 0, 0, 0]); r[5] -= p.paid_amount; });
  const tot = [0, 0, 0, 0, 0, 0];
  Object.values(by).forEach((r) => r.forEach((v, i) => { tot[i] += v; }));
  const grand = sum(tot, (x) => x);
  return `${reportHead('ar', `Amounts owed by customers as at ${fdate(AS_OF)}, by due date`)}
  <div class="grid g4" data-t="ar-kpis">${[['Total receivable', grand, ''], ['Not yet due', tot[0], 'ok'], ['Overdue', tot[1] + tot[2] + tot[3] + tot[4], 'bad'], ['Unallocated receipts', tot[5], 'warn']].map(([l, v, c]) => `<div class="card kpi ${c}"><div class="lbl">${l}</div><div class="val"><small>OMR</small>${num(v)}</div></div>`).join('')}</div>
  <div class="card" data-t="ar-table"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Customer</th>${BUCKETS.map((b) => `<th class="num">${b}</th>`).join('')}<th class="num">Unallocated</th><th class="num">Total (OMR)</th></tr></thead>
    <tbody>${Object.entries(by).sort((a, b) => sum(b[1], (x) => x) - sum(a[1], (x) => x)).map(([c, r]) => `<tr><td>${docLink(c)}</td>${r.map((v) => `<td class="num ${v < 0 ? 'neg' : ''}">${v ? num(v) : '<span class="muted">—</span>'}</td>`).join('')}<td class="num"><b>${num(sum(r, (x) => x))}</b></td></tr>`).join('')}</tbody>
    <tfoot><tr><td>Total</td>${tot.map((v) => `<td class="num">${num(v)}</td>`).join('')}<td class="num">${num(grand)}</td></tr></tfoot></table></div>
    <div class="card-b small muted" style="border-top:1px solid var(--line-2)">Total agrees with ledger 1410 Trade Receivables (${omr(FIN.receivable)}). Credit notes appear as negative amounts; ${unalloc.map((p) => docLink(p.name)).join(', ')} is a receipt not yet matched to an invoice.</div></div>
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
    <div class="card-b small muted" style="border-top:1px solid var(--line-2)">Agrees with ledgers 2210 Trade Payables - Local (${omr(-glBal('2210'))}) and 2270 Trade Payables - Foreign (USD) (${omr(-glBal('2270'))}).</div></div>`;
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
    <div class="banner ok">${icon('checkcircle')}<span>Stock value ${omr(total)} agrees with ledger 1640 Inventory. Imported items carry their freight, duty and clearing (landed cost).</span></div></div></div>`;
}

function payrollSummary() {
  const s = D.salary_slips;
  return `<div class="card" data-t="payroll-summary"><div class="card-h"><h3>Payroll · October 2026</h3>${pill('Paid', 'ok')}<span class="right small muted">${s.length} employees</span></div>
    <div class="card-b"><div class="grid g4">
      <div><div class="muted small">Gross pay</div><div style="font-size:20px;font-weight:800">${omr(sum(s, 'gross_pay'))}</div></div>
      <div><div class="muted small">Deductions</div><div style="font-size:20px;font-weight:800">${omr(r3(sum(s, 'total_deduction')))}</div></div>
      <div><div class="muted small">Net paid</div><div style="font-size:20px;font-weight:800;color:var(--ok)">${omr(r3(sum(s, 'net_pay')))}</div></div>
      <div><div class="muted small">Posted to accounts</div><div style="font-weight:600;margin-top:4px">${docLink('ACC-JV-2026-00011')} accrual<br>${docLink('ACC-JV-2026-00012')} bank payment</div></div>
    </div></div></div>`;
}

function attendanceReport() {
  const a = Object.fromEntries(D.attendance_summary.map((x) => [x.status, x.n]));
  const total = sum(D.attendance_summary, 'n');
  return `${reportHead('attendance', 'Attendance marked for all employees, November 2026')}
  <div class="grid g4" data-t="att-tiles">
    <div class="card kpi"><div class="lbl">${icon('calendar')}Days marked</div><div class="val">${total}</div><div class="foot">${D.employees.length} employees</div></div>
    <div class="card kpi ok"><div class="lbl">${icon('check')}Present</div><div class="val">${a.Present}</div><div class="foot">${pct((a.Present / total) * 100)} attendance rate</div></div>
    <div class="card kpi warn"><div class="lbl">${icon('calendar')}On leave</div><div class="val">${a['On Leave']}</div><div class="foot">Approved leave</div></div>
    <div class="card kpi bad"><div class="lbl">${icon('x')}Absent</div><div class="val">${a.Absent}</div><div class="foot">Unplanned absence</div></div>
  </div>
  <div class="card"><div class="card-h"><h3>Leave applications</h3></div><table class="tbl"><thead><tr><th>Application</th><th>Employee</th><th>Leave type</th><th>From</th><th>To</th><th>Status</th></tr></thead>
    <tbody>${D.leaves.map((l) => `<tr class="click" data-href="${formHref('leave-application', l.name)}"><td class="link">${l.name}</td><td>${esc(l.employee_name)}</td><td>${l.leave_type}</td><td>${fdate(l.from_date)}</td><td>${fdate(l.to_date)}</td><td>${pill(l.status)}</td></tr>`).join('')}</tbody></table></div>`;
}

function reportView(k) {
  return ({ coa: coaReport, gl: glReport, pl: plReport, bs: bsReport, ar: arReport, ap: apReport, stock: stockReport, attendance: attendanceReport }[k] || notFound)();
}
function notFound() {
  return `<div class="card card-b" style="text-align:center;padding:60px"><h2>Page not found</h2><p class="muted" style="margin-top:8px"><a href="#/erp/home" style="color:var(--brand-700)">Back to home</a></p></div>`;
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
