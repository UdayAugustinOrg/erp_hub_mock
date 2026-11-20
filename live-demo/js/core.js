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
    cols: [['customer', 'Customer'], ['mntc_date', 'Visit date', 'date'], ['maintenance_type', 'Type'], ['_engineer', 'Engineer']] },
  asset: { src: 'assets', label: 'Assets', one: 'Asset', module: 'assets', icon: 'building',
    cols: [['asset_name', 'Asset'], ['asset_category', 'Category'], ['available_for_use_date', 'In use from', 'date'], ['gross_purchase_amount', 'Gross value', 'omr'], ['_dep', 'Depreciation booked', 'omr'], ['_nbv', 'Net book value', 'omr']] },
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
const SERIES = [['ACC-SINV', 'sales-invoice'], ['ACC-PINV', 'purchase-invoice'], ['ACC-PAY', 'payment-entry'], ['ACC-JV', 'journal-entry'],
  ['ACC-ASS', 'asset'], ['SAL-QTN', 'quotation'], ['SAL-ORD', 'sales-order'], ['MAT-DN', 'delivery-note'], ['MAT-MR', 'material-request'],
  ['PUR-RFQ', 'rfq'], ['PUR-SQTN', 'supplier-quotation'], ['PUR-ORD', 'purchase-order'], ['MAT-PRE', 'purchase-receipt'],
  ['MAT-LCV', 'landed-cost-voucher'], ['MAT-STE', 'stock-entry'], ['SER-WRN', 'warranty-claim'], ['MAT-MVS', 'maintenance-visit'],
  ['PROJ-', 'project'], ['TASK-', 'task'], ['TS-', 'timesheet'], ['HR-EMP', 'employee'], ['HR-LAP', 'leave-application'],
  ['Sal Slip', 'salary-slip'], ['CRM-LEAD', 'lead'], ['CRM-OPP', 'opportunity']];
function slugOf(name) {
  const s = SERIES.find(([p]) => String(name).startsWith(p));
  if (s) return s[1];
  if (CUSTOMER[name]) return 'customer';
  if (SUPPLIER[name]) return 'supplier';
  if (ITEM[name]) return 'item';
  return null;
}
const formHref = (slug, name) => `#/erp/form/${slug}/${encodeURIComponent(name)}`;
function docLink(name, label) {
  const slug = slugOf(name);
  if (!slug || !getDoc(slug, name)) return esc(label ?? name);
  return `<a href="${formHref(slug, name)}">${esc(label ?? name)}</a>`;
}

/* ---------- Document links ----------
   The demo extract has no explicit link fields, so the chains below are
   derived by matching party, date and amount (e.g. QTN 7,560 -> SO 7,560
   -> DN 7,560 -> SINV 7,560 -> payment 7,560). */
const S = (n) => `ACC-SINV-2026-000${n}`, P = (n) => `ACC-PINV-2026-000${n}`, PAY = (n) => `ACC-PAY-2026-000${n}`;
const EDGE_LIST = [
  // selling
  ['CRM-LEAD-2026-00003', 'CRM-OPP-2026-00001'], ['CRM-LEAD-2026-00004', 'CRM-OPP-2026-00003'], ['CRM-OPP-2026-00003', 'SAL-QTN-2026-00004'],
  ['CRM-OPP-2026-00002', 'SAL-QTN-2026-00003'],
  ['SAL-QTN-2026-00001', 'SAL-ORD-2026-00001'], ['SAL-ORD-2026-00001', 'MAT-DN-2026-00001'], ['MAT-DN-2026-00001', S('03')], [S('03'), PAY('02')],
  ['SAL-QTN-2026-00002', 'SAL-ORD-2026-00005'], ['SAL-ORD-2026-00005', 'MAT-DN-2026-00005'], ['MAT-DN-2026-00005', S(10)], [S(10), PAY('06')],
  ['SAL-ORD-2026-00002', 'MAT-DN-2026-00002'], ['MAT-DN-2026-00002', S('04')], [S('04'), PAY('03')],
  ['SAL-ORD-2026-00003', 'MAT-DN-2026-00004'], ['MAT-DN-2026-00004', S('09')],
  ['SAL-ORD-2026-00004', 'MAT-DN-2026-00003'],
  ['SAL-ORD-2026-00006', 'MAT-DN-2026-00006'], ['MAT-DN-2026-00006', S(16)], [S(16), PAY(26)],
  [S('05'), PAY('05')], [S(13), PAY(10)], [S(15), PAY(25)], [S(17), PAY(29)], [S(18), PAY(30)], [S(19), PAY(27)], [S(21), PAY(28)],
  // project billing
  ['PROJ-0001', S(12)], ...['01', '02', '03', '04'].map((n) => ['PROJ-0001', `TS-2026-000${n}`]), ...['01', '02', '03', '04'].map((n) => [`TS-2026-000${n}`, S(12)]),
  ['TASK-2026-00001', 'PROJ-0001'], ['TASK-2026-00002', 'PROJ-0001'], ['TASK-2026-00003', 'PROJ-0001'],
  // service and repair
  [S(13), 'SER-WRN-2026-00001'], ['SER-WRN-2026-00001', 'MAT-MVS-2026-00002'], ['MAT-MVS-2026-00002', 'TS-2026-00005'], ['TS-2026-00005', S(14)], ['SER-WRN-2026-00001', S(14)],
  [S(15), 'SER-WRN-2026-00002'], ['SER-WRN-2026-00002', 'MAT-MVS-2026-00003'], ['SER-WRN-2026-00002', 'MAT-MVS-2026-00001'], ['MAT-MVS-2026-00003', 'TS-2026-00006'], ['SER-WRN-2026-00002', 'MAT-STE-2026-00003'],
  [S(16), 'SER-WRN-2026-00003'], ['SER-WRN-2026-00003', 'MAT-MVS-2026-00004'], ['MAT-MVS-2026-00004', 'TS-2026-00007'], ['TS-2026-00007', S(21)], ['SER-WRN-2026-00003', S(21)],
  [S(17), 'SER-WRN-2026-00004'], ['SER-WRN-2026-00004', 'MAT-MVS-2026-00005'], ['MAT-MVS-2026-00005', 'TS-2026-00008'], ['TS-2026-00008', S(22)], ['SER-WRN-2026-00004', S(22)],
  [S(18), 'SER-WRN-2026-00005'],
  // buying (local)
  ['MAT-MR-2026-00004', 'PUR-RFQ-2026-00002'], ['PUR-RFQ-2026-00002', 'PUR-SQTN-2026-00002'], ['PUR-RFQ-2026-00002', 'PUR-SQTN-2026-00003'],
  ['PUR-SQTN-2026-00003', 'PUR-ORD-2026-00006'], ['PUR-ORD-2026-00006', 'MAT-PRE-2026-00004'], ['MAT-PRE-2026-00004', P('05')],
  ['PUR-ORD-2026-00003', 'MAT-PRE-2026-00002'], ['MAT-PRE-2026-00002', P('01')], [P('01'), PAY('01')],
  ['PUR-ORD-2026-00004', 'MAT-PRE-2026-00003'], ['MAT-PRE-2026-00003', P('02')], ['MAT-PRE-2026-00003', 'MAT-PRE-2026-00005'], ['MAT-PRE-2026-00005', P('06')], [P('06'), P('02')],
  [P('04'), PAY('04')], [P(26), PAY(24)],
  // fixed assets
  [P('07'), PAY('07')], [P('07'), 'ACC-ASS-2026-00001'], [P('08'), PAY('08')], [P('08'), 'ACC-ASS-2026-00002'], [P('09'), PAY('09')], [P('09'), 'ACC-ASS-2026-00003'],
  ['ACC-ASS-2026-00001', 'ACC-JV-2026-00010'], ['ACC-ASS-2026-00002', 'ACC-JV-2026-00009'], ['ACC-ASS-2026-00003', 'ACC-JV-2026-00008'],
  // imports
  ['PUR-ORD-2026-00007', 'MAT-PRE-2026-00006'], ['MAT-PRE-2026-00006', P(11)], [P(11), PAY(11)], [P(11), 'ACC-JV-2026-00013'], [PAY(11), 'ACC-JV-2026-00013'],
  ['MAT-LCV-2026-00001', 'MAT-PRE-2026-00006'], [P(12), PAY(12)], [P(13), PAY(13)], [P(14), PAY(14)],
  ['PUR-ORD-2026-00008', 'MAT-PRE-2026-00007'], ['MAT-PRE-2026-00007', P(15)], [P(15), PAY(18)], [P(15), 'ACC-JV-2026-00014'], [PAY(18), 'ACC-JV-2026-00014'],
  ['MAT-LCV-2026-00002', 'MAT-PRE-2026-00007'], [P(16), PAY(15)], [P(17), PAY(16)], [P(18), PAY(17)],
  ['PUR-ORD-2026-00009', 'MAT-PRE-2026-00008'], ['MAT-PRE-2026-00008', P(19)], ['MAT-LCV-2026-00003', 'MAT-PRE-2026-00008'], [P(20), PAY(19)], [P(21), PAY(20)],
  ['PUR-ORD-2026-00010', 'MAT-PRE-2026-00009'], ['MAT-PRE-2026-00009', P(22)], ['MAT-LCV-2026-00004', 'MAT-PRE-2026-00009'], [P(23), PAY(21)], [P(24), PAY(22)], [P(25), PAY(23)],
  // payroll
  ...D.salary_slips.flatMap((s) => [[s.name, 'ACC-JV-2026-00011'], [s.name, 'ACC-JV-2026-00012']]),
  ...D.salary_slips.map((s, i) => [s.name, `HR-EMP-0000${i + 1}`]),
  ['HR-EMP-00004', 'HR-LAP-2026-00001'],
];
/* Landed cost charges point at their source invoices: "(ACC-PINV-2026-00012)" */
for (const l of D.landed_costs) for (const t of l.taxes) {
  const m = t.description.match(/ACC-PINV-\d{4}-\d{5}/);
  if (m) EDGE_LIST.push([l.name, m[0]]);
}
/* Credit / debit notes link to the invoice they correct */
for (const s of D.sales_invoices) if (s.return_against) EDGE_LIST.push([s.name, s.return_against]);
/* Timesheets by employee */
for (const t of D.timesheets) { const e = D.employees.find((x) => x.employee_name === t.employee_name); if (e) EDGE_LIST.push([t.name, e.name]); }

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

/* Engineer for a maintenance visit / service job, from the linked timesheet */
function engineerFor(name) {
  const ts = linkedOf(name, 'timesheet')[0];
  const t = ts && D.timesheets.find((x) => x.name === ts);
  return t ? t.employee_name : null;
}

/* Derived helper columns */
D.rfqs.forEach((r) => { r._suppliers = linkedOf(r.name, 'supplier-quotation').map((q) => getDoc('supplier-quotation', q).supplier).join(', '); });
D.landed_costs.forEach((l) => { l._receipt = l.receipts[0]?.receipt_document; l._supplier = l.receipts[0]?.supplier; });
D.maintenance_visits.forEach((m) => {
  m._engineer = engineerFor(m.name) || '—';
});
D.timesheets.forEach((t) => {
  const p = linkedOf(t.name, 'project')[0];
  const v = linkedOf(t.name, 'maintenance-visit')[0];
  t._activity = p ? `${p} · Compressor overhaul` : v ? `${v} · Motor repair` : '—';
});
D.assets.forEach((a) => {
  const jv = linkedOf(a.name, 'journal-entry')[0];
  a._dep = jv ? getDoc('journal-entry', jv).total_debit : 0;
  a._nbv = r3(a.gross_purchase_amount - a._dep);
});
D.sales_invoices.forEach((s) => {
  s._einv = EINV_ERR[s.name] ? 'Failed' : s.custom_einvoice_status || 'Not sent';
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
