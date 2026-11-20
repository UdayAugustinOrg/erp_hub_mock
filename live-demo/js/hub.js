/* ==========================================================
   hub.js: Infinity e-Invoice Hub console views (overview,
   document queue, document detail with stage timeline,
   companies). Documents come from window.HUB and are joined
   to the ERP sales invoices for buyer and totals.
   ========================================================== */

const STAGES = [
  ['erp_detected', 'Picked up from Infinity ERP', 'Submitted invoice detected through the direct API connection'],
  ['mapped', 'Mapped to e-invoice fields', 'ERP data translated into the Oman e-invoice data model'],
  ['built', 'E-invoice document built', 'Structured XML e-invoice generated'],
  ['validated', 'Validated against Oman rules', 'Checked against the national e-invoicing business rules'],
  ['recorded', 'Recorded for audit', 'Tamper-evident copy stored in the audit log'],
  ['sent', 'Sent to the buyer', 'Transmitted over the e-invoicing network'],
  ['tracking', 'Delivery tracked', 'Waiting for the network acknowledgement'],
  ['published', 'Receipt confirmed', "Buyer's access point confirmed receipt"],
  ['archived', 'Delivered and archived', 'Final copy archived for the statutory retention period'],
];
const STAGE_IDX = Object.fromEntries(STAGES.map((s, i) => [s[0], i]));

/* Plain-language explanation and fix advice for each hub error */
const HUB_ERR = {
  MANDATORY_FIELD: {
    title: 'Customer address is missing',
    short: 'The customer has no address, and a buyer address is mandatory on an Oman e-invoice.',
    fixShort: 'add an address to the customer, then cancel and amend the invoice.',
    failAt: 'mapped',
    missing: ['Address line 1', 'City', 'Postal code', 'Country'],
  },
  SCHEMATRON_FATAL: {
    title: 'Buyer VAT number is not valid',
    short: 'The buyer VAT number “OM12345” is too short. Oman VAT numbers are 12 characters: OM followed by exactly 10 digits.',
    fixShort: 'correct the VAT number on the customer, then cancel and amend the invoice.',
    failAt: 'validated',
  },
};

function hubDocs() {
  return window.HUB.map((h) => {
    const s = getDoc('sales-invoice', h.erp_doc_id);
    return { ...h, inv: s, cust: CUSTOMER[s.customer], failed: !!h.error_code, status: h.error_code ? 'Needs attention' : h.stage === 'archived' ? 'Delivered' : 'In progress' };
  });
}
const typeTag = (code) => `<span class="type-tag ${code === '381' ? 'cn' : code === '383' ? 'dn' : ''}">${TYPE_LABEL[code]} <code>${code}</code></span>`;
const hubPill = (d) => pill(d.status, d.failed ? 'bad' : d.status === 'Delivered' ? 'ok' : 'warn');

/* Final run of the pipeline: last time each stage was reached */
function stageTimes(h) {
  const t = {};
  h.events.forEach((e) => { t[e.stage] = e.at; });
  return t;
}
function processingSeconds(h) {
  const t = stageTimes(h);
  if (!t.archived) return null;
  const lastPick = [...h.events].reverse().find((e) => e.stage === 'erp_detected').at;
  return (new Date(t.archived) - new Date(lastPick)) / 1000;
}

function hubSidebar(r) {
  const v = r.parts[1] || 'dashboard';
  const bad = window.HUB.filter((h) => h.error_code).length;
  const item = (key, href, ic, label, extra = '') => `<a class="sb-item ${v === key || (key === 'docs' && v === 'doc') ? 'on' : ''}" href="${href}">${icon(ic)}<span>${label}</span>${extra}</a>`;
  return `
  <div class="sb-brand"><span class="mark">${LOGO}</span><div><b>e-Invoice Hub</b><small>Infinity</small></div></div>
  <nav class="sb-nav" data-t="hub-sidebar">
    <div class="sb-sec">Console</div>
    ${item('dashboard', '#/hub/dashboard', 'activity', 'Overview')}
    ${item('docs', '#/hub/docs', 'inbox', 'Documents', bad ? `<span class="cnt">${bad}</span>` : '')}
    ${item('companies', '#/hub/companies', 'building', 'Companies')}
    <div class="sb-sec">Monitoring</div>
    <a class="sb-item" data-act="mock">${icon('shield')}<span>Audit log</span></a>
    <a class="sb-item" data-act="mock">${icon('settings')}<span>Settings</span></a>
  </nav>
  <div class="sb-foot">
    <a href="#/erp/home">${icon('grid')}<span>Infinity ERP</span></a>
    <a href="index.html">${icon('left')}<span>Demo home</span></a>
  </div>`;
}

function hubHead(title, sub, crumb) {
  return `${crumbs([['e-Invoice Hub', '#/hub/dashboard'], ...crumb])}
  <div class="page-h"><h1>${title}</h1><span class="sub">${sub}</span><div class="actions"><span class="env">Production</span></div></div>`;
}

function hubChart(docs) {
  const days = [...new Set(docs.map((d) => d.inv.posting_date))].sort();
  const W = 760, H = 230, pl = 34, pb = 40, pt = 16;
  const max = Math.max(...days.map((d) => docs.filter((x) => x.inv.posting_date === d).length));
  const ymax = Math.ceil(max / 2) * 2;
  const y = (v) => pt + (H - pt - pb) * (1 - v / ymax);
  const bw = (W - pl - 10) / days.length;
  let g = '';
  for (let t = 0; t <= ymax; t += 2) g += `<line x1="${pl}" x2="${W - 6}" y1="${y(t)}" y2="${y(t)}" stroke="#E3E8EF"/><text x="${pl - 8}" y="${y(t) + 4}" text-anchor="end" font-size="11" fill="#8693A4">${t}</text>`;
  days.forEach((d, i) => {
    const ok = docs.filter((x) => x.inv.posting_date === d && !x.failed).length;
    const bad = docs.filter((x) => x.inv.posting_date === d && x.failed).length;
    const x = pl + bw * i + bw * 0.18, w = bw * 0.64;
    if (ok) g += `<rect x="${x}" y="${y(ok)}" width="${w}" height="${y(0) - y(ok)}" rx="3" fill="#14A39A"><title>${fdate(d)}: ${ok} delivered</title></rect>`;
    if (bad) g += `<rect x="${x}" y="${y(ok + bad)}" width="${w}" height="${y(ok) - y(ok + bad)}" rx="3" fill="#C2352B"><title>${fdate(d)}: ${bad} need attention</title></rect>`;
    g += `<text x="${x + w / 2}" y="${y(ok + bad) - 5}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#3A4757">${ok + bad}</text>`;
    g += `<text x="${x + w / 2}" y="${H - 22}" text-anchor="middle" font-size="10.5" fill="#627083">${+d.slice(8)}</text>`;
    if (i === 0 || d.slice(5, 7) !== days[i - 1].slice(5, 7)) g += `<text x="${x + w / 2}" y="${H - 7}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#3A4757">${MONTHS[+d.slice(5, 7) - 1]}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Documents by invoice date">${g}</svg>`;
}

function hubDashboard() {
  const docs = hubDocs();
  const ok = docs.filter((d) => d.status === 'Delivered').length;
  const bad = docs.filter((d) => d.failed).length;
  const prog = docs.length - ok - bad;
  const secs = docs.map(processingSeconds).filter((x) => x != null).sort((a, b) => a - b);
  const median = secs[Math.floor(secs.length / 2)];
  const byType = (c) => docs.filter((d) => d.type_code === c).length;
  return `${hubHead('Overview', 'Infy Demo Company · all documents to date', [['Overview']])}
  <div class="grid g4" data-t="hub-kpis">
    <a class="card kpi accent" href="#/hub/docs"><div class="lbl">${icon('inbox')}Documents received</div><div class="val">${docs.length}</div><div class="foot">From Infinity ERP</div></a>
    <a class="card kpi ok" href="#/hub/docs?status=delivered"><div class="lbl">${icon('checkcircle')}Delivered</div><div class="val">${ok}</div><div class="foot">${pct((ok / docs.length) * 100)} delivery rate</div></a>
    <a class="card kpi bad" href="#/hub/docs?status=attention"><div class="lbl">${icon('alert')}Needs attention</div><div class="val">${bad}</div><div class="foot">Fix in Infinity ERP</div></a>
    <a class="card kpi warn" href="#/hub/docs"><div class="lbl">${icon('loader')}In progress</div><div class="val">${prog}</div><div class="foot">Nothing waiting right now</div></a>
  </div>
  <div class="grid g-2-1">
    <div class="card" data-t="hub-chart"><div class="card-h"><h3>Documents by invoice date</h3><div class="right legend"><span><i style="background:#14A39A"></i>Delivered</span><span><i style="background:#C2352B"></i>Needs attention</span></div></div>
      <div class="card-b chart">${hubChart(docs)}</div></div>
    <div class="stack">
      <div class="card"><div class="card-h"><h3>By document type</h3></div><table class="tbl"><tbody>
        ${[['380', 'Tax invoices'], ['381', 'Credit notes'], ['383', 'Debit notes']].map(([c, l]) => `<tr class="click" data-href="#/hub/docs?type=${c}"><td>${typeTag(c)}</td><td>${l}</td><td class="num"><b>${byType(c)}</b></td></tr>`).join('')}</tbody></table></div>
      <div class="card"><div class="card-b"><div class="muted small">Typical time from pickup to delivered</div><div style="font-size:24px;font-weight:800;margin-top:4px">${Math.round(median)} seconds</div><div class="small muted">Median across ${secs.length} delivered documents</div></div></div>
    </div>
  </div>
  <div class="card" data-t="hub-attn"><div class="card-h"><h3>${icon('alert')} Needs attention</h3><span class="sub">Each problem is fixed in Infinity ERP. The hub then picks up the corrected invoice by itself.</span></div>
    <table class="tbl"><tbody>${docs.filter((d) => d.failed).map((d) => `<tr class="click" data-href="#/hub/doc/${d.erp_doc_id}"><td class="link">${d.erp_doc_id}</td><td>${esc(d.inv.customer)}</td><td><b>${HUB_ERR[d.error_code].title}</b></td><td class="mono small">${d.error_code}</td><td class="num">${omr(d.inv.grand_total)}</td><td>${hubPill(d)}</td></tr>`).join('')}</tbody></table></div>`;
}

function hubQueue(q) {
  const docs = hubDocs();
  const st = q.status || 'all', ty = q.type || 'all';
  const rows = docs.filter((d) => (st === 'all' || (st === 'delivered' ? d.status === 'Delivered' : d.failed)) && (ty === 'all' || d.type_code === ty));
  const link = (s, t) => `#/hub/docs?status=${s}&type=${t}`;
  const cnt = (s, t) => docs.filter((d) => (s === 'all' || (s === 'delivered' ? d.status === 'Delivered' : d.failed)) && (t === 'all' || d.type_code === t)).length;
  const sChip = (s, l) => `<a class="chip ${st === s ? 'on' : ''}" href="${link(s, ty)}" data-f="${s}">${l} <span class="n">${cnt(s, ty)}</span></a>`;
  const tChip = (t, l) => `<a class="chip ${ty === t ? 'on' : ''}" href="${link(st, t)}" data-f="type-${t}">${l} <span class="n">${cnt(st, t)}</span></a>`;
  return `${hubHead('Documents', `${docs.length} documents from Infinity ERP`, [['Documents']])}
  <div class="card" data-t="hub-queue">
    <div class="toolbar" data-t="hub-filters">${sChip('all', 'All')}${sChip('delivered', 'Delivered')}${sChip('attention', 'Needs attention')}<span class="sep"></span>
      ${tChip('all', 'All types')}${tChip('380', 'Invoices')}${tChip('381', 'Credit notes')}${tChip('383', 'Debit notes')}<span class="right">${rows.length} shown</span></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Document</th><th>Type</th><th>Buyer</th><th>Invoice date</th><th class="num">Total (OMR)</th><th>Status</th><th>Stage</th><th>Updated</th></tr></thead>
    <tbody>${rows.map((d) => `<tr class="click" data-href="#/hub/doc/${d.erp_doc_id}" data-doc="${d.erp_doc_id}"><td class="link">${d.erp_doc_id}</td><td>${typeTag(d.type_code)}</td><td>${esc(d.inv.customer)}</td><td>${fdate(d.inv.posting_date)}</td>
      <td class="num">${num(d.inv.grand_total)}</td><td>${hubPill(d)}</td><td class="small">${d.failed ? `<span style="color:var(--bad);font-weight:600">${d.error_code}</span>` : STAGES[STAGE_IDX[d.stage]][1]}</td><td class="small muted mono">${ftime(d.updated_at)}</td></tr>`).join('')}</tbody></table></div>
  </div>`;
}

function timelineHtml(d) {
  const t = stageTimes(d);
  const failIdx = d.failed ? STAGE_IDX[HUB_ERR[d.error_code].failAt] : -1;
  const failTime = d.failed ? d.updated_at : null;
  return STAGES.map(([k, l, desc], i) => {
    let cls = 'pending', ic = '', time = '';
    if (d.failed && i === failIdx) { cls = 'fail'; ic = icon('x'); time = ftime(t[k] || failTime); }
    else if (t[k] && (failIdx < 0 || i < failIdx)) { cls = 'done' + (k === 'archived' ? ' final' : ''); ic = icon('check'); time = ftime(t[k]); }
    const dsc = cls === 'fail' ? `<span style="color:var(--bad)">${d.error_code} · ${HUB_ERR[d.error_code].title}</span>` : k === 'sent' && t[k] ? `${desc} · endpoint <span class="mono">${d.participant_to}</span>` : desc;
    return `<div class="tl-step ${cls}"><span class="tl-dot">${ic}</span><div><div class="tl-t">${l}</div><div class="tl-d">${dsc}</div></div><span class="tl-time">${time}</span></div>`;
  }).join('');
}

function partyBlock(title, name, rows) {
  return `<div class="party"><h4>${title}</h4><div class="nm">${esc(name)}</div><dl>${rows.map(([k, v, bad]) => `<dt>${k}</dt><dd class="${bad ? 'bad' : ''}">${v}</dd>`).join('')}</dl></div>`;
}

function hubDoc(id) {
  const d = hubDocs().find((x) => x.erp_doc_id === id);
  if (!d) return notFound();
  const s = d.inv, c = d.cust;
  const err = d.failed ? HUB_ERR[d.error_code] : null;
  const vatBad = c.tax_id && !/^OM\d{10}$/.test(c.tax_id);
  const noAddr = d.error_code === 'MANDATORY_FIELD';
  const rules = d.error_code === 'SCHEMATRON_FATAL' ? d.error_message.split(/;\s*(?=IBR-)/).map((m) => m.split(': ').slice(1).join(': ')) : [];
  const ref = s.return_against ? `<dt>Corrects</dt><dd>${s.return_against}</dd>` : '';
  const errCard = d.failed ? `
  <div class="card" data-t="hub-error" style="border-color:#F3C3BE">
    <div class="card-h" style="background:var(--bad-50)"><span style="color:var(--bad)">${icon('alert')}</span><h3 style="color:#8E2019">${err.title}</h3><span class="right mono small" style="color:var(--bad)">${d.error_code}</span></div>
    <div class="card-b">
      <p style="font-size:14px;line-height:1.6">${err.short}</p>
      ${noAddr ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">${err.missing.map((m) => `<span class="pill bad">${m}</span>`).join('')}</div>` : ''}
      ${rules.length ? `<div class="banner bad" style="margin-top:12px">${icon('xcircle')}<span><b>Rule IBR-003-OM</b> · Buyer VAT number (IBT-048) must be 12 characters: “OM” followed by exactly 10 digits. Received: <b class="mono">${esc(c.tax_id)}</b> (7 characters).</span></div>` : ''}
      <div class="sec-title" style="margin-top:18px">How to fix it in Infinity ERP</div>
      <ol class="fix-steps" data-t="hub-fix">
        <li><span>Open customer <b>${esc(c.name)}</b> and ${noAddr ? 'add a billing address: street, city, postal code and country (Oman).' : `correct the VAT number to the full 12 characters (OM + 10 digits).`}</span></li>
        <li><span>Open invoice <b>${s.name}</b>, <b>Cancel</b> it, then <b>Amend</b>. Infinity ERP creates the amended copy <b class="mono">${s.name}-1</b> with the corrected customer details.</span></li>
        <li><span>Submit the amended invoice. The hub picks it up automatically and delivers it. Nothing needs to be done in the hub.</span></li>
      </ol>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">
        <a class="btn btn-primary" href="${formHref('customer', c.name)}" data-t="fix-customer">${icon('edit')}Open customer in Infinity ERP</a>
        <a class="btn btn-ghost" href="${formHref('sales-invoice', s.name)}">${icon('ext')}Open invoice in Infinity ERP</a>
      </div>
      <details class="more" style="margin-top:16px"><summary>Technical details</summary><div class="raw">${esc(d.error_message)}</div>
        ${rules.length > 1 ? `<p class="small muted" style="margin-top:8px">The validator also listed HS-code advisories (IBR-079-OM, IBR-174-OM). The item already carries HS code ${ITEM['DEMO-MTR-75'].customs_tariff_number}; the blocking rule is IBR-003-OM.</p>` : ''}</details>
    </div></div>` : '';
  return `${hubHead(id, `${TYPE_LABEL[d.type_code]} for ${esc(s.customer)}`, [['Documents', '#/hub/docs'], [id]])}
  <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap" data-t="hub-doc-head">${typeTag(d.type_code)}${hubPill(d)}
    <span class="small muted">Received ${ftime(d.created_at, true)} · last update ${ftime(d.updated_at)} (Muscat time)</span>
    <span style="margin-left:auto;display:flex;gap:8px"><a class="btn btn-ghost" href="${formHref('sales-invoice', s.name)}">${icon('grid')}Open in Infinity ERP</a>
    <button class="btn btn-ghost" data-act="mock" ${d.failed ? 'disabled style="opacity:.5"' : ''}>${icon('download')}Download XML</button></span></div>
  <div class="grid g-3-2">
    <div class="stack">
      ${errCard}
      <div class="card" data-t="hub-fields"><div class="card-h"><h3>E-invoice content</h3><span class="sub">What the buyer receives</span></div><div class="card-b stack">
        <div class="grid g2">
          ${partyBlock('Seller', COMPANY.name, [['VAT number', COMPANY.vat], ['CR number', COMPANY.cr], ['Activity (ISIC)', COMPANY.isic], ['Country', 'OM · Oman']])}
          ${partyBlock('Buyer', c.name, [['VAT number', c.tax_id ? esc(c.tax_id) + (vatBad ? ' · invalid' : '') : '<span class="muted">Not registered</span>', vatBad], ['CR number', c.custom_cr_number || '—'], ['Endpoint', `<span class="mono">${d.participant_to}</span>`], ['Address', noAddr ? 'Missing' : 'On file', noAddr]])}
        </div>
        <div class="fields">
          <div class="fld"><div class="lbl">Document number</div><div class="val">${s.name}</div></div>
          <div class="fld"><div class="lbl">Issue date</div><div class="val">${fdate(s.posting_date)}</div></div>
          <div class="fld"><div class="lbl">Due date</div><div class="val">${fdate(s.due_date)}</div></div>
          <div class="fld"><div class="lbl">Type code</div><div class="val">${d.type_code} · ${TYPE_LABEL[d.type_code]}</div></div>
          <div class="fld"><div class="lbl">Currency</div><div class="val">OMR</div></div>
          <div class="fld"><div class="lbl">UUID</div><div class="val mono" style="font-size:11.5px">${d.uuid || '<span class="muted">Not assigned</span>'}</div></div>
          ${s.return_against ? `<div class="fld"><div class="lbl">Corrects invoice</div><div class="val">${s.return_against}</div></div><div class="fld"><div class="lbl">Reason</div><div class="val">${s.custom_cn_reason_code} · ${CN_REASON[s.custom_cn_reason_code]}</div></div>` : ''}
        </div>
        <table class="tbl" style="border:1px solid var(--line);border-radius:8px"><thead><tr><th>Line</th><th>HS code</th><th class="num">Qty</th><th class="num">Price</th><th class="num">VAT</th><th class="num">Amount</th></tr></thead>
          <tbody>${s.items.map((it) => `<tr><td><b>${esc(it.item_name)}</b><div class="small muted">${it.item_code}</div></td><td class="mono small">${ITEM[it.item_code].customs_tariff_number || '—'}</td><td class="num">${it.qty}</td><td class="num">${num(it.rate)}</td><td class="num">5%</td><td class="num">${num(it.amount)}</td></tr>`).join('')}</tbody></table>
        <table class="totals"><tr><td>Total excluding VAT</td><td class="num">${omr(s.net_total)}</td></tr><tr><td>VAT 5%</td><td class="num">${omr(s.total_taxes_and_charges)}</td></tr><tr class="gt"><td>Total including VAT</td><td class="num">${omr(s.grand_total)}</td></tr></table>
      </div></div>
    </div>
    <div class="stack">
      <div class="card" data-t="hub-timeline"><div class="card-h"><h3>Processing timeline</h3>${hubPill(d)}</div><div class="card-b"><div class="tl">${timelineHtml(d)}</div>
        <details class="more" style="margin-top:6px"><summary>Raw event log (${d.events.length} events)</summary>
          <table class="tbl small"><tbody>${d.events.map((e) => `<tr><td class="mono">${ftime(e.at)}</td><td>${e.stage}</td></tr>`).join('')}</tbody></table>
          <p class="small muted" style="margin-top:6px">Earlier pickups were polling cycles before the invoice was ready; the final cycle is shown above.</p></details></div></div>
      ${d.failed ? '' : `<div class="card"><div class="card-h"><h3>QR code</h3></div><div class="card-b" style="display:flex;gap:16px;align-items:center"><div class="qr">${qrSvg(d.uuid)}</div><div class="small muted">Printed on the invoice PDF so the buyer and the tax authority can verify the e-invoice. (Placeholder image.)</div></div></div>`}
    </div>
  </div>`;
}

function hubCompanies() {
  const docs = hubDocs();
  const last = docs.map((d) => d.updated_at).sort().pop();
  return `${hubHead('Companies', 'Businesses sending e-invoices through this hub', [['Companies']])}
  <div class="card" data-t="hub-company">
    <div class="co-card"><div class="logo">ID</div><div><h3>${COMPANY.name}</h3>
      <div class="co-meta"><span>VAT <b>${COMPANY.vat}</b></span><span>CR <b>${COMPANY.cr}</b></span><span>ISIC <b>${COMPANY.isic}</b></span><span>Currency <b>OMR</b></span></div></div>
      <div>${pill('Live', 'ok', 'lg')}</div></div>
    <div class="conn-line" data-t="hub-connection"><span class="node2">${icon('grid')}Infinity ERP</span><span class="wire"></span>
      <span style="font-weight:700">Infinity ERP · Method 1 — Direct API</span><span class="wire"></span><span class="node2">${icon('send')}e-Invoice Hub</span></div>
    <div class="grid g4" style="padding:0 18px 18px">
      <div class="card kpi"><div class="lbl">Documents</div><div class="val">${docs.length}</div></div>
      <div class="card kpi ok"><div class="lbl">Delivered</div><div class="val">${docs.filter((d) => d.status === 'Delivered').length}</div></div>
      <div class="card kpi bad"><div class="lbl">Needs attention</div><div class="val">${docs.filter((d) => d.failed).length}</div></div>
      <div class="card kpi"><div class="lbl">Last activity</div><div class="val" style="font-size:16px">${ftime(last, true)}</div></div>
    </div>
  </div>
  <div class="card"><div class="card-h"><h3>Connection settings</h3></div><div class="card-b"><div class="fields">
    <div class="fld"><div class="lbl">Source system</div><div class="val">Infinity ERP</div></div>
    <div class="fld"><div class="lbl">Integration method</div><div class="val">Method 1 — Direct API</div></div>
    <div class="fld"><div class="lbl">Documents picked up</div><div class="val">Submitted sales invoices, credit notes, debit notes</div></div>
    <div class="fld"><div class="lbl">Status written back to ERP</div><div class="val">E-invoice status and UUID on each invoice</div></div>
    <div class="fld"><div class="lbl">Corrections</div><div class="val">Cancel and amend in ERP; amended copy picked up automatically</div></div>
    <div class="fld"><div class="lbl">Environment</div><div class="val"><span class="env">Production</span></div></div>
  </div></div></div>`;
}

function hubView(r) {
  const [, view, a] = r.parts;
  if (!view || view === 'dashboard') return hubDashboard();
  if (view === 'docs') return hubQueue(r.query);
  if (view === 'doc') return hubDoc(a);
  if (view === 'companies') return hubCompanies();
  return notFound();
}
