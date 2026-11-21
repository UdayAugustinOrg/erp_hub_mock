/* ==========================================================
   core.js: shared helpers for the demo mock.
   - number/date formatting (OMR 3 decimals, USD 2 decimals)
   - doctype registry over window.ERP data
   - document link graph (derived from matching parties/amounts)
   - hash router
   ========================================================== */

const AS_OF = '2026-11-20';
const USD_RATE = 0.385;
const COMPANY = { name: 'Infy Demo Company', vat: 'OM1100099999', cr: '1100099', isic: '466201', abbr: 'INFY' };

/* ---------- Formatting ---------- */
const NF3 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const NF2 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const r3 = (v) => Math.round((v + Number.EPSILON) * 1000) / 1000;
function num(v, dp = 3) {
  if (v == null || v === '') return '—';
  const s = (dp === 2 ? NF2 : NF3).format(Math.abs(v));
  return (v < 0 ? '−' : '') + s;
}
function money(v, cur = 'OMR') {
  if (v == null) return '—';
  return `${cur} ${num(v, cur === 'USD' ? 2 : 3)}`;
}
const omr = (v) => money(v, 'OMR');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fdate(d) {
  if (!d) return '—';
  const [y, m, dd] = d.slice(0, 10).split('-');
  return `${+dd} ${MONTHS[+m - 1]} ${y}`;
}
/* Timestamps are UTC; shown in Muscat time (UTC+4) */
function ftime(iso, withDate = false) {
  if (!iso) return '—';
  const t = new Date(new Date(iso).getTime() + 4 * 3600 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  const hms = `${p(t.getUTCHours())}:${p(t.getUTCMinutes())}:${p(t.getUTCSeconds())}`;
  return withDate ? `${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear()}, ${hms}` : hms;
}
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pct = (v) => `${Math.round(v * 10) / 10}%`;
const sum = (arr, f) => arr.reduce((a, x) => a + ((typeof f === 'function' ? f(x) : x[f]) || 0), 0);

/* ---------- Status colours ---------- */
const TONE = {
  ok: ['Paid', 'Completed', 'Delivered', 'Accepted', 'Closed', 'Active', 'Present', 'Approved', 'Fully Completed', 'Ordered', 'Live', 'Converted'],
  warn: ['Unpaid', 'To Bill', 'To Deliver and Bill', 'To Receive', 'To Receive and Bill', 'Open', 'Replied', 'Quotation', 'Opportunity', 'Partially Received'],
  yellow: ['Partly Paid', 'Partially Billed', 'Partly Billed', 'Working', 'On Leave', 'Partially Depreciated', 'In progress'],
  bad: ['Overdue', 'Failed', 'Cancelled', 'Absent', 'Rejected', 'Draft'],
  info: ['Submitted'],
  mute: ['Return', 'Credit Note', 'Debit Note Issued', 'Not sent'],
};
function toneOf(s) {
  for (const [t, list] of Object.entries(TONE)) if (list.includes(s)) return t;
  return 'mute';
}
const statusTone = toneOf;
const pill = (s, tone, cls = '') => s ? `<span class="pill ${tone || toneOf(s)} ${cls}">${esc(s)}</span>` : '';

/* ---------- Data index ---------- */
const D = window.ERP;
const DOCTYPES = {
  customer: { src: 'customers', id: 'name', label: 'Customers', one: 'Customer', module: 'selling', icon: 'users',
    cols: [['customer_group', 'Group'], ['territory', 'Territory'], ['tax_id', 'VAT number'], ['custom_cr_number', 'CR number']] },
  supplier: { src: 'suppliers', id: 'name', label: 'Suppliers', one: 'Supplier', module: 'buying', icon: 'building',
    cols: [['supplier_group', 'Group'], ['country', 'Country'], ['tax_id', 'VAT number'], ['default_currency', 'Currency']] },
  item: { src: 'items', id: 'item_code', label: 'Items', one: 'Item', module: 'stock', icon: 'box',
    cols: [['item_name', 'Item name'], ['item_group', 'Item group'], ['is_stock_item', 'Stock item', (v) => (v ? 'Yes' : 'No')], ['stock_uom', 'UOM'], ['customs_tariff_number', 'HS code']], status: (r) => r.item_group },
  lead: { src: 'leads', label: 'Leads', one: 'Lead', module: 'selling', icon: 'user',
    cols: [['lead_name', 'Contact'], ['company_name', 'Organisation'], ['source', 'Source']] },
  opportunity: { src: 'opportunities', label: 'Opportunities', one: 'Opportunity', module: 'selling', icon: 'star',
    cols: [['party_name', 'Party', 'party'], ['sales_stage', 'Sales stage'], ['opportunity_amount', 'Amount', 'money']] },
  quotation: { src: 'quotations', label: 'Quotations', one: 'Quotation', module: 'selling', icon: 'file',
    cols: [['party_name', 'Party', 'party'], ['transaction_date', 'Date', 'date'], ['grand_total', 'Grand total', 'money']] },
  'sales-order': { src: 'sales_orders', label: 'Sales Orders', one: 'Sales Order', module: 'selling', icon: 'clip',
    cols: [['customer', 'Customer'], ['transaction_date', 'Date', 'date'], ['delivery_date', 'Delivery by', 'date'], ['per_delivered', '% Delivered', 'pct'], ['per_billed', '% Billed', 'pct'], ['grand_total', 'Grand total', 'money']] },
  'delivery-note': { src: 'delivery_notes', label: 'Delivery Notes', one: 'Delivery Note', module: 'stock', icon: 'truck',
    cols: [['customer', 'Customer'], ['posting_date', 'Date', 'date'], ['grand_total', 'Grand total', 'money']] },
  'sales-invoice': { src: 'sales_invoices', label: 'Sales Invoices', one: 'Sales Invoice', module: 'accounting', icon: 'receipt',
    cols: [['customer', 'Customer'], ['posting_date', 'Date', 'date'], ['due_date', 'Due', 'date'], ['grand_total', 'Grand total', 'money'], ['outstanding_amount', 'Outstanding', 'money'], ['_einv', 'E-invoice', 'einv']] },
  'material-request': { src: 'material_requests', label: 'Material Requests', one: 'Material Request', module: 'buying', icon: 'clip',
    cols: [['material_request_type', 'Type'], ['transaction_date', 'Date', 'date']] },
  rfq: { src: 'rfqs', label: 'Requests for Quotation', one: 'Request for Quotation', module: 'buying', icon: 'send',
    cols: [['transaction_date', 'Date', 'date'], ['_suppliers', 'Suppliers invited']] },
  'supplier-quotation': { src: 'supplier_quotations', label: 'Supplier Quotations', one: 'Supplier Quotation', module: 'buying', icon: 'file',
    cols: [['supplier', 'Supplier'], ['transaction_date', 'Date', 'date'], ['grand_total', 'Grand total', 'money']] },
  'purchase-order': { src: 'purchase_orders', label: 'Purchase Orders', one: 'Purchase Order', module: 'buying', icon: 'cart',
    cols: [['supplier', 'Supplier'], ['transaction_date', 'Date', 'date'], ['per_received', '% Received', 'pct'], ['per_billed', '% Billed', 'pct'], ['grand_total', 'Grand total', 'money']] },
  'purchase-receipt': { src: 'purchase_receipts', label: 'Purchase Receipts', one: 'Purchase Receipt', module: 'stock', icon: 'inbox',
    cols: [['supplier', 'Supplier'], ['posting_date', 'Date', 'date'], ['grand_total', 'Grand total', 'money']] },
  'purchase-invoice': { src: 'purchase_invoices', label: 'Purchase Invoices', one: 'Purchase Invoice', module: 'accounting', icon: 'receipt',
    cols: [['supplier', 'Supplier'], ['bill_no', 'Supplier bill no.'], ['posting_date', 'Date', 'date'], ['grand_total', 'Grand total', 'money'], ['base_grand_total', 'In OMR', 'omr'], ['outstanding_amount', 'Outstanding', 'money']] },
  'landed-cost-voucher': { src: 'landed_costs', label: 'Landed Cost Vouchers', one: 'Landed Cost Voucher', module: 'stock', icon: 'anchor', status: () => 'Submitted',
    cols: [['_receipt', 'Purchase receipt'], ['_supplier', 'Supplier'], ['posting_date', 'Date', 'date'], ['total_taxes_and_charges', 'Charges added', 'omr']] },
  'payment-entry': { src: 'payments', label: 'Payment Entries', one: 'Payment Entry', module: 'accounting', icon: 'wallet', status: () => 'Submitted',
    cols: [['payment_type', 'Type'], ['party', 'Party'], ['posting_date', 'Date', 'date'], ['mode_of_payment', 'Mode'], ['paid_amount', 'Amount', 'omr']] },
  'journal-entry': { src: 'journals', label: 'Journal Entries', one: 'Journal Entry', module: 'accounting', icon: 'book', status: () => 'Submitted',
    cols: [['voucher_type', 'Entry type'], ['posting_date', 'Date', 'date'], ['user_remark', 'Remark'], ['total_debit', 'Total debit', 'omr']] },
  'stock-entry': { src: 'stock_entries', label: 'Stock Entries', one: 'Stock Entry', module: 'stock', icon: 'layers', status: () => 'Submitted',
    cols: [['stock_entry_type', 'Purpose'], ['posting_date', 'Date', 'date'], ['total_outgoing_value', 'Outgoing value', 'omr'], ['total_incoming_value', 'Incoming value', 'omr']] },
  'warranty-claim': { src: 'warranty_claims', label: 'Warranty Claims', one: 'Warranty Claim', module: 'support', icon: 'shield',
    cols: [['customer', 'Customer'], ['item_code', 'Item'], ['complaint_date', 'Reported', 'date'], ['complaint', 'Complaint', 'clip']] },
  'maintenance-visit': { src: 'maintenance_visits', label: 'Maintenance Visits', one: 'Maintenance Visit', module: 'support', icon: 'wrench', status: (r) => r.completion_status,
    cols: [['customer', 'Customer'], ['mntc_date', 'Visit date', 'date'], ['maintenance_type', 'Type'], ['_claim', 'Warranty claim']] },
  asset: { src: 'assets', label: 'Assets', one: 'Asset', module: 'assets', icon: 'building',
    cols: [['asset_name', 'Asset'], ['asset_category', 'Category', 'cat'], ['available_for_use_date', 'In use from', 'date'], ['gross_purchase_amount', 'Gross value', 'omr'], ['depreciation_booked', 'Depreciation booked', 'omr'], ['_nbv', 'Net book value', 'omr']] },
  'asset-category': { src: 'asset_categories', label: 'Asset Categories', one: 'Asset Category', module: 'assets', icon: 'layers', status: (r) => `${r.life_years} years`,
    cols: [['life_years', 'Useful life (years)', 'n1'], ['life_months', 'Months'], ['_fa', 'Fixed asset account'], ['_de', 'Depreciation expense account']] },
  'asset-depreciation-schedule': { src: 'asset_depreciation_schedules', label: 'Asset Depreciation Schedules', one: 'Asset Depreciation Schedule', module: 'assets', icon: 'calendar',
    cols: [['asset', 'Asset'], ['_asset_name', 'Asset name'], ['depreciation_method', 'Method'], ['total_number_of_depreciations', 'Depreciations (months)'], ['_booked', 'Booked to date', 'omr']] },
  'asset-capitalization': { src: 'asset_capitalizations', label: 'Asset Capitalizations', one: 'Asset Capitalization', module: 'assets', icon: 'box', status: () => 'Submitted',
    cols: [['target_asset_name', 'Asset'], ['posting_date', 'Date', 'date'], ['capitalization_method', 'Method'], ['total_value', 'Capitalized value', 'omr']] },
};
for (const [slug, t] of Object.entries(DOCTYPES)) { t.slug = slug; t.id = t.id || 'name'; t.rows = D[t.src]; }

const DOCS = {};
for (const t of Object.values(DOCTYPES)) for (const r of t.rows) DOCS[`${t.slug}:${r[t.id]}`] = r;
const getDoc = (slug, name) => DOCS[`${slug}:${name}`];
const statusOf = (slug, r) => (DOCTYPES[slug].status ? DOCTYPES[slug].status(r) : r.status);
const ITEM = Object.fromEntries(D.items.map((i) => [i.item_code, i]));
const CUSTOMER = Object.fromEntries(D.customers.map((c) => [c.name, c]));
const SUPPLIER = Object.fromEntries(D.suppliers.map((s) => [s.name, s]));
/* E-invoice errors Infinity ERP stores on invoices the e-invoicing service rejected */
const EINV_ERR = window.EINV_ERRORS || {};

/* Guess the doctype of a document name from its naming series */
const SERIES = [['INFY-SINV-', 'sales-invoice'], ['INFY-PINV-', 'purchase-invoice'], ['INFY-PAY-', 'payment-entry'], ['INFY-JV-', 'journal-entry'],
  ['INFY-AST-', 'asset'], ['INFY-ADS-', 'asset-depreciation-schedule'], ['INFY-ACAP-', 'asset-capitalization'], ['INFY-QTN-', 'quotation'], ['INFY-SO-', 'sales-order'],
  ['INFY-DN-', 'delivery-note'], ['INFY-MR-', 'material-request'], ['INFY-RFQ-', 'rfq'], ['INFY-SQTN-', 'supplier-quotation'], ['INFY-PO-', 'purchase-order'],
  ['INFY-PR-', 'purchase-receipt'], ['INFY-LCV-', 'landed-cost-voucher'], ['INFY-STE-', 'stock-entry'], ['INFY-WRN-', 'warranty-claim'], ['INFY-MV-', 'maintenance-visit'],
  ['INFY-LEAD-', 'lead'], ['INFY-OPP-', 'opportunity'],
];
function slugOf(name) {
  const s = SERIES.find(([p]) => String(name).startsWith(p));
  if (s) return s[1];
  if (CUSTOMER[name]) return 'customer';
  if (SUPPLIER[name]) return 'supplier';
  if (ITEM[name]) return 'item';
  if (D.asset_categories.some((c) => c.name === name)) return 'asset-category';
  return null;
}
const formHref = (slug, name) => `#/erp/form/${slug}/${encodeURIComponent(name)}`;
function docLink(name, label) {
  const slug = slugOf(name);
  if (!slug || !getDoc(slug, name)) return esc(label ?? name);
  return `<a href="${formHref(slug, name)}">${esc(label ?? name)}</a>`;
}

/* ---------- Document links ----------
   The demo extract has few explicit link fields, so the sales/buying chains below
   are derived by matching party, date and amount (e.g. QTN 7,560 -> SO 7,560
   -> DN 7,560 -> SINV 7,560 -> payment 7,560). Asset links come from the data. */
const S = (n) => `INFY-SINV-2026-000${n}`, P = (n) => `INFY-PINV-2026-000${n}`, PAY = (n) => `INFY-PAY-2026-000${n}`;
const PO = (n) => `INFY-PO-2026-0000${n}`, PR = (n) => `INFY-PR-2026-000${n}`, SO = (n) => `INFY-SO-2026-0000${n}`, DN = (n) => `INFY-DN-2026-0000${n}`;
const WRN = (n) => `INFY-WRN-2026-0000${n}`, MV = (n) => `INFY-MV-2026-0000${n}`;
const EDGE_LIST = [
  // selling
  ['INFY-LEAD-2026-00003', 'INFY-OPP-2026-00001'], ['INFY-LEAD-2026-00004', 'INFY-OPP-2026-00003'], ['INFY-OPP-2026-00003', 'INFY-QTN-2026-00004'],
  ['INFY-OPP-2026-00002', 'INFY-QTN-2026-00003'],
  ['INFY-QTN-2026-00001', SO(1)], [SO(1), DN(1)], [DN(1), S('01')], [S('01'), PAY('02')],
  ['INFY-QTN-2026-00002', SO(5)], [SO(5), DN(5)], [DN(5), S('08')], [S('08'), PAY('06')],
  [SO(2), DN(2)], [DN(2), S('02')], [S('02'), PAY('03')],
  [SO(3), DN(4)], [DN(4), S('07')],
  [SO(4), DN(3)],
  [SO(6), DN(6)], [DN(6), S(14)], [S(14), PAY(26)],
  [S('03'), PAY('05')], [S(11), PAY(14)], [S(13), PAY(25)], [S(15), PAY(34)], [S(16), PAY(35)], [S(17), PAY(27)], [S(19), PAY(28)],
  // service and repair
  [S(11), WRN(1)], [WRN(1), MV(2)], [WRN(1), S(12)], [MV(2), S(12)],
  [S(13), WRN(2)], [WRN(2), MV(3)], [WRN(2), MV(1)], [WRN(2), 'INFY-STE-2026-00003'],
  [S(14), WRN(3)], [WRN(3), MV(4)], [WRN(3), S(19)], [MV(4), S(19)],
  [S(15), WRN(4)], [WRN(4), MV(5)], [WRN(4), S(20)], [MV(5), S(20)],
  [S(16), WRN(5)],
  // buying (local)
  ['INFY-MR-2026-00001', 'INFY-RFQ-2026-00001'], ['INFY-RFQ-2026-00001', 'INFY-SQTN-2026-00001'], ['INFY-RFQ-2026-00001', 'INFY-SQTN-2026-00002'],
  ['INFY-SQTN-2026-00002', PO(4)], [PO(4), PR('03')], [PR('03'), P('05')],
  [PO(1), PR('01')], [PR('01'), P('01')], [P('01'), PAY('01')],
  [PO(2), PR('02')], [PR('02'), P('02')], [PR('02'), PR('04')], [PR('04'), P('06')], [P('06'), P('02')],
  [P('04'), PAY('04')], [P(26), PAY(24)],
  // imports
  [PO(5), PR('05')], [PR('05'), P(10)], [P(10), PAY(10)], [P(10), 'INFY-JV-2026-00010'], [PAY(10), 'INFY-JV-2026-00010'],
  [P(11), PAY(11)], [P(12), PAY(12)], [P(13), PAY(13)],
  [PO(6), PR('06')], [PR('06'), P(15)], [P(15), PAY(18)], [P(15), 'INFY-JV-2026-00011'], [PAY(18), 'INFY-JV-2026-00011'],
  [P(16), PAY(15)], [P(17), PAY(16)], [P(18), PAY(17)],
  [PO(7), PR('07')], [PR('07'), P(19)], [P(20), PAY(19)], [P(21), PAY(20)],
  [PO(8), PR('08')], [PR('08'), P(22)], [P(23), PAY(21)], [P(24), PAY(22)], [P(25), PAY(23)],
  // fixed assets: bills, payments, receipts
  [P('07'), PAY('07')], [P('08'), PAY('08')], [P('09'), PAY('09')], [P(28), PAY(29)], [P(29), PAY(30)], [P(30), PAY(31)], [P(32), PAY(32)], [P(33), PAY(33)],
  [P(31), PR('09')], [P(32), PR(10)],
];
/* Landed cost vouchers: their receipts and the bills their charges come from, e.g. "(INFY-PINV-2026-00011)" */
for (const l of D.landed_costs) {
  for (const r of l.receipts) EDGE_LIST.push([l.name, r.receipt_document]);
  for (const t of l.taxes) { const m = t.description.match(/INFY-PINV-\d{4}-\d{5}/); if (m) EDGE_LIST.push([l.name, m[0]]); }
}
/* Credit / debit notes link to the invoice they correct */
for (const s of D.sales_invoices) if (s.return_against) EDGE_LIST.push([s.name, s.return_against]);
/* Assets: source bill or receipt, depreciation schedule, its booked journals; capitalization and its CWIP bills */
for (const a of D.assets) { if (a.purchase_invoice) EDGE_LIST.push([a.name, a.purchase_invoice]); if (a.purchase_receipt) EDGE_LIST.push([a.name, a.purchase_receipt]); }
for (const ds of D.asset_depreciation_schedules) {
  EDGE_LIST.push([ds.asset, ds.name]);
  for (const row of ds.depreciation_schedule) if (row.journal_entry) { EDGE_LIST.push([ds.name, row.journal_entry]); EDGE_LIST.push([ds.asset, row.journal_entry]); }
}
for (const c of D.asset_capitalizations) { EDGE_LIST.push([c.name, c.target_asset]); for (const b of c.cwip_bills) EDGE_LIST.push([c.name, b.name]); }

const LINKS = {};
for (const [a, b] of EDGE_LIST) {
  (LINKS[a] = LINKS[a] || new Set()).add(b);
  (LINKS[b] = LINKS[b] || new Set()).add(a);
}
const linked = (name) => [...(LINKS[name] || [])];
const linkedOf = (name, slug) => linked(name).filter((n) => slugOf(n) === slug);

/* Walks the link graph to find the document of each type in a chain, e.g. quotation -> payment */
function chainFor(name, types) {
  const found = { [slugOf(name)]: name };
  const seen = new Set([name]);
  const q = [name];
  while (q.length) {
    const cur = q.shift();
    for (const n of linked(cur)) {
      const s = slugOf(n);
      if (seen.has(n) || !types.includes(s) || found[s]) continue;
      if (s === slugOf(name)) continue;
      seen.add(n); found[s] = n; q.push(n);
    }
  }
  return found;
}

/* Some records have no item lines in the extract; borrow them from a linked document with the same total */
function itemsOf(doc) {
  if (doc.items) return { items: doc.items, from: null };
  for (const n of linked(doc.name)) {
    const o = DOCS[`${slugOf(n)}:${n}`];
    if (o && o.items && doc.grand_total != null && Math.abs(o.grand_total - doc.grand_total) < 0.001) return { items: o.items, from: n };
  }
  return { items: null, from: null };
}

/* Derived helper columns */
D.rfqs.forEach((r) => { r._suppliers = linkedOf(r.name, 'supplier-quotation').map((q) => getDoc('supplier-quotation', q).supplier).join(', '); });
D.landed_costs.forEach((l) => { l._receipt = l.receipts[0]?.receipt_document; l._supplier = l.receipts[0]?.supplier; });
D.maintenance_visits.forEach((m) => { m._claim = linkedOf(m.name, 'warranty-claim')[0] || '—'; });
const ADS_OF = Object.fromEntries(D.asset_depreciation_schedules.map((x) => [x.asset, x]));
const ASSET_OF = Object.fromEntries(D.assets.map((x) => [x.name, x]));
D.assets.forEach((a) => { a._nbv = r3(a.gross_purchase_amount - (a.depreciation_booked || 0)); });
D.asset_categories.forEach((c) => {
  const f = (x) => (x ? `${x.account_number} - ${x.account_name}` : '—');
  c._fa = f(c.fixed_asset_account); c._ad = f(c.accumulated_depreciation_account); c._de = f(c.depreciation_expense_account); c._cwip = c.enable_cwip_accounting ? f(c.cwip_account) : 'Not used';
});
D.asset_depreciation_schedules.forEach((x) => {
  x._asset_name = ASSET_OF[x.asset]?.asset_name;
  x._booked = r3(sum(x.depreciation_schedule.filter((r) => r.journal_entry), 'depreciation_amount'));
});
/* The export caught a few e-invoice statuses mid-write-back (blank); every invoice except the two failures was delivered */
D.sales_invoices.forEach((s) => {
  if (!EINV_ERR[s.name] && !s.custom_einvoice_status) s.custom_einvoice_status = 'Delivered';
  s._einv = EINV_ERR[s.name] ? 'Failed' : s.custom_einvoice_status;
});

/* ---------- Router ---------- */
const Router = (() => {
  let last = null;
  function parse() {
    const raw = location.hash.replace(/^#/, '') || '/erp/home';
    const [path, qs] = raw.split('?');
    const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
    return { raw, parts, query: Object.fromEntries(new URLSearchParams(qs || '')) };
  }
  function go(path) {
    const target = path.startsWith('#') ? path : '#' + path;
    if (location.hash !== target) history.replaceState(null, '', location.pathname + location.search + target);
    render();
  }
  function render(force) {
    const r = parse();
    if (!force && r.raw === last) return;
    last = r.raw;
    App.render(r);
  }
  window.addEventListener('hashchange', () => render());
  return { go, render, parse };
})();
const go = (p) => Router.go(p);

/* ---------- Small UI helpers ---------- */
/* Breadcrumbs for the top bar: [[label, href], ...]; the last one is the current page */
function crumbs(list) {
  return `<div class="crumbs">${list.map((c, i) => (i ? `<span class="sep">${icon('right')}</span>` : '') + (c[1] && i < list.length - 1 ? `<a href="${c[1]}">${esc(c[0])}</a>` : `<span class="${i === list.length - 1 && i ? 'last' : ''}">${esc(c[0])}</span>`)).join('')}</div>`;
}
function modal({ title, body, confirm = 'Confirm', onConfirm }) {
  const el = document.createElement('div');
  el.className = 'modal-bg';
  el.innerHTML = `<div class="modal" role="dialog"><div class="card-h"><h3>${title}</h3></div><div class="card-b">${body}</div>
    <div class="modal-f"><button class="btn btn-ghost" data-m="x">Close</button>${onConfirm ? `<button class="btn btn-primary" data-m="ok">${confirm}</button>` : ''}</div></div>`;
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-m]');
    if (e.target === el || (b && b.dataset.m === 'x')) el.remove();
    if (b && b.dataset.m === 'ok') { el.remove(); onConfirm(); }
  });
  document.body.appendChild(el);
}
const closeModals = () => document.querySelectorAll('.modal-bg').forEach((m) => m.remove());

/* Pseudo QR code: deterministic pattern from the UUID (visual placeholder, not scannable) */
function qrSvg(seed) {
  const n = 25;
  let h = 2166136261;
  for (const c of String(seed)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };
  let cells = '';
  const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#0A3150"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#0A3150"/>`;
  const inFinder = (x, y) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!inFinder(x, y) && rnd() > 0.52) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  return `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><g fill="#0A3150">${cells}</g>${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}</svg>`;
}

const LOGO_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4z"/></svg>`;
