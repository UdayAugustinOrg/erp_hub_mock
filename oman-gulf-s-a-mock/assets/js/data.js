/* ==========================================================================
   Oman Gulf Company S.A.O.C × Fawtara — E-Invoicing Scope Walkthrough · demonstration dataset

   REAL (single-sourced, from public directory profiles — see OMAN-GULF-REAL-FACTS.md):
   the legal name, that it is an Oman-incorporated civil-engineering, earthmoving
   and transport-works contractor in the energy sector, and that a directory lists
   a regional office in Salalah, a workshop in Thumrait and a facility in Ghala,
   Muscat. Nothing else here is known.
   INVENTED: every VATIN, CR number, address, customer, supplier, contract,
   quantity, rate, document number, volume, person and tax treatment below. None
   of it states how Oman Gulf actually invoices. Counterparties are fictional on
   purpose — the real operators named in the directory profile are never used.

   THIS MOCK IS A DISCOVERY / ALIGNMENT TOOL, not a finished compliant flow.
   Its spine is SIX invoice streams that are INFERRED from the activity
   description (civil, earthmoving, transport) and common contracting practice —
   none has been observed: measured works billed on interim payment
   certificates, plant and transport hire, credit and debit notes, mobilisation
   advance and retention, subcontractors and suppliers in Oman as buyer, and
   imported services under the reverse charge. Where a treatment is open, the
   mock shows Fawtara's RECOMMENDED reading, flagged "to confirm with OTA".

   Oman Gulf's finance system is not known, so the origin surface says "finance
   system" and names no product. Integration Method 1 is shown by default — an
   assumption.

   IDENTITY — one legal entity (a fallback default, not a confirmed shape). One
   VATIN, one Commercial Registration, one Peppol participant (scheme 0248, so
   0248:OM<VATIN>). No VAT group assumed. Salalah, Thumrait and Ghala are sites /
   cost centres of that one seller, not separate entities.

   Shapes are real: Omani VATIN OM + 10 digits, OMR to 3 decimals, 5% VAT.

   Demo clock: Thursday 5 November 2026, 10:42 GST (Oman's week runs Sun-Thu).
   ========================================================================== */

const DEMO_DATE  = '5 Nov 2026';
const DEMO_DAY   = 'Thursday';
const DEMO_CLOCK = '5 Nov 2026, 10:42 GST';
const VAT_RATE   = 5;

/* --- the entity ------------------------------------------------------------ */
const OGC = {
  id: 'OGC', name: 'Oman Gulf Company', legal: 'Oman Gulf Company S.A.O.C',
  vatin: 'OM1100294816', cr: '1048392', peppol: '0248:OM1100294816',
  city: 'Salalah', country: 'OM'
};
const TENANTS = [{ ...OGC, short: 'Oman Gulf', sector: 'Civil engineering, earthmoving & transport works',
  erp: 'Finance system', status: 'live', health: 'ok' }];

/* the three sites — cost centres of the one seller, shown only as a "Site" tag */
const SITES = {
  salalah: 'Salalah region',
  thumrait: 'Thumrait workshop',
  ghala: 'Ghala, Muscat'
};

/* --- the six streams — THE spine of this mock ------------------------------
   dir: in (Oman Gulf receives) | out (Oman Gulf issues)
   mode: live (sent per document; the outcome arrives asynchronously)
   position: settled | proposed (Fawtara's reading, to confirm)               */
const STREAMS = [
  { id: 'ipc',     n: 1, group: 'seller', dir: 'out', title: 'Measured works · interim payment certificates',
    role: 'Oman Gulf as seller', origin: 'Finance system', target: 'OTA — via the ASP',
    doc: 'Standard tax invoice', mode: 'live', position: 'settled',
    today: 4, mtd: 12,
    blurb: 'Earthworks, roads and pads billed on re-measured BOQ quantities plus variations. The finance system raises the invoice when the customer’s engineer approves a certificate; the Hub validates and sends it — the canonical flow. Certificate timing is a reading to confirm with the OTA.' },
  { id: 'hire',    n: 2, group: 'seller', dir: 'out', title: 'Plant, equipment & transport hire',
    role: 'Oman Gulf as seller', origin: 'Finance system', target: 'OTA — via the ASP',
    doc: 'Standard tax invoice', mode: 'live', position: 'settled',
    today: 9, mtd: 31,
    blurb: 'Excavators, dozers, graders, tippers and low-bed trailers hired out with an operator, billed monthly from signed log sheets — hours or days times the contract rate. Same B2B invoice, same pipe.' },
  { id: 'adjust',  n: 3, group: 'seller', dir: 'out', title: 'Credit & debit notes · re-measurement, rate disputes',
    role: 'Oman Gulf as seller', origin: 'Finance system', target: 'OTA — via the ASP',
    doc: 'Credit / debit note', mode: 'live', position: 'settled',
    today: 2, mtd: 6,
    blurb: 'Quantities re-measured after invoicing and rate escalation agreed later. Each note references the original invoice and is sent like any other document.' },
  { id: 'advret',  n: 4, group: 'seller', dir: 'out', title: 'Mobilisation advance & retention release',
    role: 'Oman Gulf as seller', origin: 'Finance system', target: 'OTA — via the ASP',
    doc: 'Standard tax invoice', mode: 'live', position: 'proposed',
    today: 1, mtd: 3,
    blurb: 'An advance invoice up front, recovered on each certificate as a prepaid amount; retention held back on every certificate and released at completion. When VAT is due on each is to confirm with the OTA.' },
  { id: 'subcon',  n: 5, group: 'buyer', dir: 'in',  title: 'Subcontractors & suppliers in Oman',
    role: 'Oman Gulf as buyer', origin: 'Peppol inbound', target: 'Finance system',
    doc: 'Supplier tax invoice', mode: 'live', position: 'settled',
    today: 6, mtd: 44,
    blurb: 'Fuel, spares and haulage subcontractors’ e-invoices, already reported through the OTA, arrive over Peppol. Fawtara matches them to Oman Gulf and the contract or cost centre, and lands them as draft purchase invoices — nobody keys them in.' },
  { id: 'rcm',     n: 6, group: 'buyer', dir: 'in',  title: 'Imported services · reverse charge',
    role: 'Oman Gulf as buyer', origin: 'Foreign supplier (PDF)', target: 'Finance system',
    doc: 'Self-accounted record', mode: 'live', position: 'proposed',
    today: 1, mtd: 4,
    blurb: 'Technical support or software bought from a supplier outside Oman, for example from an equipment manufacturer. No Peppol invoice arrives; Oman Gulf self-accounts the VAT. Whether that needs its own e-document is to confirm with the OTA.' }
];
function stream(id) { return STREAMS.find(s => s.id === id); }

/* --- Fawtara's recommended OTA positions ----------------------------------
   The mock's only load-bearing tax claims. Each renders with the "to confirm
   with OTA" tag.                                                             */
const OTA_POSITIONS = [
  { id: 'certificate', agenda: 'When to invoice a certificate',
    headline: 'The approved certificate triggers the invoice',
    basis: 'Measured works are billed on interim payment certificates, approved by the customer’s engineer some time after the work is physically done. Which date fixes the tax point is not settled for e-invoicing. How Oman Gulf’s contracts define certification is a discovery question.',
    treatment: [
      'Recommended: the invoice is raised when the customer’s engineer approves the certificate. The date the work was physically done is not the tax point.',
      'The e-invoice carries the certificate reference and the period it covers, so the customer can match it to the certificate.',
      'The signed certificate is archived with the invoice as the evidence behind it.'
    ],
    channels: 'Decides when the finance system may release a measured-works invoice to the Hub at all — so it is settled before build, not after.',
    tag: 'Fawtara’s reading — to confirm with OTA' },
  { id: 'advret', agenda: 'Mobilisation advance and retention money',
    headline: 'When is VAT due on an advance, and on retention?',
    basis: 'Illustratively, a customer pays a mobilisation advance that is recovered from later certificates, and holds back retention on each certificate until completion. Whether Oman Gulf’s contracts work this way, and at what rates, is a discovery question. When VAT falls due on each is not settled.',
    treatment: [
      'Recommended: VAT is due on the mobilisation advance when it is invoiced or received. The advance gets its own tax invoice.',
      'Each later certificate shows the part of the advance it recovers as a prepaid amount (BT-113) that references the advance invoice — VAT is not charged twice, and the payable (BT-115) is the invoice total less that amount.',
      'Retention is a payment term on the full certified value. It does not reduce the taxable amount, and releasing it later creates no new tax point and no new invoice.'
    ],
    channels: 'Touches every certificate, so it decides how the measured-works invoice itself is built.',
    tag: 'Fawtara’s reading — to confirm with OTA' },
  { id: 'operators', agenda: 'Supplies to oil and gas operators',
    headline: 'Standard rate by default — and a hold if relief is claimed',
    basis: 'Oil and gas operators are the likely customers. Whether any of them claims VAT relief under its own concession or contract is a discovery question; this mock does not say that any such relief exists. It shows the control, and asks the question.',
    treatment: [
      'Recommended: supplies are standard-rated at 5% unless the customer evidences otherwise.',
      'If a customer claims any relief, the Hub holds the document until the evidence is attached and archived with it — nothing is sent on an assumption.',
      'Operators usually need their own PO, contract and service-entry references on the invoice. Those travel in PINT-OM reference fields (see the mapping table on this screen).'
    ],
    channels: 'Decides whether a document can be released automatically or waits for evidence, per customer.',
    tag: 'Fawtara’s reading — to confirm with OTA' },
  { id: 'rcm', agenda: 'Imported services — reverse charge',
    headline: 'A foreign supplier’s invoice — self-accounted, but reported?',
    basis: 'Technical support or software bought from outside Oman, for example from an equipment manufacturer, arrives as a PDF, not over Peppol. Oman Gulf accounts for the VAT itself under the reverse charge. Whether e-invoicing also needs a self-billed document is not settled.',
    treatment: [
      'Recommended: the Hub records the foreign invoice, computes the reverse-charge VAT and lands a draft in the finance system flagged for self-accounting.',
      'The original PDF and the computation are archived together as the audit record.',
      'A self-billed e-document is built only if the OTA requires one — the Hub can build it if so.'
    ],
    channels: 'Low in count, but missed reverse-charge VAT is a common audit finding.',
    tag: 'Fawtara’s reading — to confirm with OTA' }
];
function position(id) { return OTA_POSITIONS.find(p => p.id === id); }

/* --- roll-up (single entity, all six streams) ------------------------------
   Outbound today = 4 + 9 + 2 + 1 = 16.                                       */
const GROUP = {
  name: 'Oman Gulf Company', trn: OGC.vatin, entity: OGC,
  streams: 6, settled: 4, proposed: 2,

  todayTotal: 16, todaySuccess: 13, todayFailed: 1, todayPending: 2,
  /* month to date, November 2026 (1–5 Nov): 12 + 31 + 6 + 3 = 52 */
  mtdTotal: 52, mtdFailed: 2,

  /* inbound today: subcontractors and suppliers 6 + imported services 1 = 7 */
  inboundToday: 7, inboundSubcon: 6, inboundRcm: 1,

  aspAvgMs: 351,
  /* the monthly hire billing run that carries plant and transport hire invoices */
  cycle: { id: 'OGC-HIRE-2026-10', period: 'October 2026', customers: 20, invoiced: 17,
           held: 3, window: '02–04 Nov 2026', sentAt: '04 Nov 2026, 15:40 GST' },

  /* Fri 30 Oct → Thu 5 Nov. Friday and Saturday are the Omani weekend. */
  week: [0, 0, 8, 10, 9, 9, 16],
  weekDays: ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
  prevSameDay: 12
};

/* --- connection methods (kept from the platform proposal) ------------------ */
const METHODS = {
  1: { n: 'Method 1 — Direct API', short: 'Direct API', onsite: 'None',
       use: 'Cloud and API-enabled systems',
       how: 'The Hub calls the finance system’s standard API.' },
  2: { n: 'Method 2 — On-site agent', short: 'On-site agent', onsite: 'Lightweight agent',
       use: 'On-premise and restricted-network systems',
       how: 'A lightweight agent connects outward to the Hub and carries work both ways. No inbound firewall access is required.' },
  3: { n: 'Method 3 — Secure file transfer', short: 'Secure file transfer', onsite: 'None',
       use: 'Batch and low-interface environments',
       how: 'Scheduled exports and imports use an agreed format and secure location — a fit for a month-end hire billing run.' }
};

/* --- customers (invented; none is a real operator) ------------------------- */
const CUSTOMERS = [
  { name: 'Rimal Upstream Operating Company LLC', vatin: 'OM1100618204', type: 'B2B', country: 'OM' },
  { name: 'Harmal Field Services LLC',            vatin: 'OM1100729315', type: 'B2B', country: 'OM' },
  { name: 'Wadi Ghul Midstream SAOC',             vatin: 'OM1100830426', type: 'B2B', country: 'OM' },
  { name: 'Sahil Camp & Logistics LLC',           vatin: 'OM1100941537', type: 'B2B', country: 'OM' },
  { name: 'Jabal Haql Quarry Products LLC',       vatin: 'OM1100152648', type: 'B2B', country: 'OM' }
];

/* subcontractors and suppliers inside Oman (on Peppol), and foreign suppliers
   of imported services (not on Peppol — reverse charge)                      */
const SUPPLIERS = [
  { name: 'Thumrait Fuel & Lubricants LLC',      vatin: 'OM1100221133', peppol: '0248:OM1100221133', country: 'OM', role: 'Fuel and lubricants supplier' },
  { name: 'Salalah Heavy Spares LLC',            vatin: 'OM1100332244', peppol: '0248:OM1100332244', country: 'OM', role: 'Spare parts supplier' },
  { name: 'Zufar Haulage Services LLC',          vatin: 'OM1100443355', peppol: '0248:OM1100443355', country: 'OM', role: 'Haulage subcontractor' },
  { name: 'Altenburg Earthmoving Support GmbH',  vatin: null, peppol: null, country: 'DE', foreignId: 'DE812345678',  role: 'Equipment manufacturer support (abroad)' },
  { name: 'Kestrel Fleet Telematics Ltd',        vatin: null, peppol: null, country: 'GB', foreignId: 'GB284917366',  role: 'Software supplier (abroad)' }
];

/* --- outbound stages (the pipeline shown once, for stream 1) --------------- */
const STAGES = ['Finance-system invoice', 'Collect & map', 'Build XML', 'Validate',
                'Record', 'ASP / Peppol', 'Track outcome', 'Result published', 'Archive'];
const STAGE_SHORT = ['Source', 'Map', 'XML', 'Validate', 'Record', 'Send', 'Outcome', 'Result', 'Archive'];
const STAGE_NOTE = [
  'Invoice and credit-note data from the Oman Gulf finance system',
  'Apply the Oman Gulf mapping profile',
  'UBL 2.1 · UUID · QR information',
  'Apply PINT-OM rules before sending',
  'Store XML and audit trail before anything is sent',
  'Transmit the valid XML',
  'Acknowledgement and final status',
  'UUID, status and QR held on the interface for the finance system to collect',
  'Acknowledgements and final status added to the record archived before sending'
];
const STAGE_COUNT = [2, 4, 3, 5, 2, 4, 2];

/* --- inbound stages -------------------------------------------------------- */
const IN_STAGES = ['Supplier sends', 'Match to Oman Gulf', 'Validate',
                   'Archive original', 'Create draft', 'Finance review'];
const IN_STAGE_NOTE = [
  'Document arrives via ASP / Peppol',
  'Match participant ID and CR to Oman Gulf, and the PO to a contract or cost centre',
  'Structure, identity and content checks',
  'Preserve the legal XML record',
  'Draft purchase invoice in the finance system, coded to the contract or cost centre',
  'Finance reviews and posts manually'
];

/* --- three acknowledgement legs -------------------------------------------- */
const LEGS = [
  { id: 'ack',   leg: 'Service provider → Hub', name: 'Validated and accepted by the ASP',
    at: '5 Nov 2026 09:12:41.508', el: '+0.4 s', st: 'ok',
    body: 'The ASP confirms the e-invoice was generated and validated. This is custody, not delivery.',
    ref: 'ASP-OM-2026-1105-61204' },
  { id: 'ota',   leg: 'Tax Authority → service provider', name: 'Reported to the Tax Authority',
    at: '5 Nov 2026 09:14:19.870', el: '+1 m 38 s', st: 'ok',
    body: 'The ASP reported the Tax Data Document to Fawtara and the OTA acknowledged it. The Hub never talks to the OTA directly.',
    ref: 'OTA-RPT-2026-1105-70417' },
  { id: 'deliv', leg: 'Buyer’s provider → service provider', name: 'Delivered to the buyer',
    at: '5 Nov 2026 09:15:02.336', el: '+2 m 21 s', st: 'ok',
    body: 'The customer’s access point confirmed receipt. This leg is outside Oman Gulf’s control and can take hours.',
    ref: 'MLS-DELIVERED' }
];
const LEGS_PENDING = [
  { id: 'ack',   name: 'Validated and accepted by the ASP', at: '5 Nov 2026 10:04:52.117', st: 'ok',
    body: 'Receipt issued 0.4 s after submission.' },
  { id: 'ota',   name: 'Reported to the Tax Authority',     at: 'awaiting', st: 'pending',
    body: 'Within the reporting window. No action required.' },
  { id: 'deliv', name: 'Delivered to the buyer',            at: 'awaiting', st: 'pending',
    body: 'The customer’s access point has not yet confirmed. Retried automatically by the ASP.' }
];

/* --- outbound documents ----------------------------------------------------
   stage indexes into STAGES; state: ok | active | failed | held
   site is a cost-centre tag only (SITES). INVOICES[0] is the tracked invoice
   OGC-INV-2026-00417 (interim payment certificate IPC-07 plus variation VO-02),
   followed end to end.                                                       */
const INVOICES = [
  { no: 'OGC-INV-2026-00417', stream: 'ipc', cust: 0, net: 89580.000, vat: 4479.000, total: 94059.000,
    cur: 'OMR', type: 'Invoice', scen: 'B2B', stage: 8, state: 'ok', retry: 0, created: '05 Nov 09:12:36',
    uuid: 'a41f7c28-3d9e-5b60-8e14-72c9d05b1fa3', ackNo: 'ASP-OM-2026-1105-61204', ref: 'PEP-1105-0417',
    lines: 3, po: 'RUOC-PO-5208', site: SITES.salalah },
  { no: 'OGC-INV-2026-00416', stream: 'ipc', cust: 1, net: 41250.000, vat: 2062.500, total: 43312.500,
    cur: 'OMR', type: 'Invoice', scen: 'B2B', stage: 8, state: 'ok', retry: 0, created: '05 Nov 09:20:11',
    uuid: 'b52a8d39-4eaf-5c71-9f25-83dae16c2ab4', ackNo: 'ASP-OM-2026-1105-61209', ref: 'PEP-1105-0418',
    lines: 2, po: 'HFS-PO-3302', site: SITES.salalah },
  { no: 'OGC-INV-2026-00421', stream: 'hire', cust: 3, net: 18638.000, vat: 931.900, total: 19569.900,
    cur: 'OMR', type: 'Invoice', scen: 'B2B', stage: 6, state: 'active', retry: 0, created: '05 Nov 10:04:51',
    uuid: 'c63b9e4a-5fb0-6d82-a036-94ebf27d3bc5', ackNo: 'ASP-OM-2026-1105-61247', ref: 'PEP-1105-0430',
    lines: 6, po: 'SCL-PO-8815', site: SITES.thumrait, awaiting: 'OTA report · buyer delivery' },
  { no: 'OGC-INV-2026-00425', stream: 'hire', cust: 1, net: 9120.000, vat: 456.000, total: 9576.000,
    cur: 'OMR', type: 'Invoice', scen: 'B2B', stage: 3, state: 'failed', retry: 2, created: '05 Nov 10:13:07',
    uuid: 'd74caf5b-60c1-7e93-b147-a5fcf38e4cd6', ackNo: null, ref: null, lines: 4, po: null,
    site: SITES.thumrait, owner: 'entity' },
  { no: 'OGC-INV-2026-00419', stream: 'hire', cust: 4, net: 12480.000, vat: 624.000, total: 13104.000,
    cur: 'OMR', type: 'Invoice', scen: 'B2B', stage: 8, state: 'ok', retry: 0, created: '05 Nov 09:38:24',
    uuid: 'e85dba6c-71d2-8fa4-c258-b60da49f5de7', ackNo: 'ASP-OM-2026-1105-61221', ref: 'PEP-1105-0424',
    lines: 5, po: 'JHQ-PO-1140', site: SITES.thumrait },
  { no: 'OGC-CRN-2026-00023', stream: 'adjust', cust: 1, net: -3420.000, vat: -171.000, total: -3591.000,
    cur: 'OMR', type: 'Credit Note', scen: 'B2B', stage: 8, state: 'ok', retry: 0, created: '05 Nov 10:24:40',
    uuid: 'f96ecb7d-82e3-90b5-d369-c71eb5a06ef8', ackNo: 'ASP-OM-2026-1105-61255', ref: 'PEP-1105-0436',
    lines: 1, po: null, against: 'OGC-INV-2026-00388', site: SITES.salalah },
  { no: 'OGC-DBN-2026-00009', stream: 'adjust', cust: 0, net: 3230.000, vat: 161.500, total: 3391.500,
    cur: 'OMR', type: 'Debit Note', scen: 'B2B', stage: 8, state: 'ok', retry: 0, created: '05 Nov 10:31:18',
    uuid: '0a7fdc8e-93f4-a1c6-e47a-d82fc6b17f09', ackNo: 'ASP-OM-2026-1105-61261', ref: 'PEP-1105-0439',
    lines: 1, po: null, against: 'OGC-INV-2026-00356', site: SITES.salalah },
  { no: 'OGC-INV-2026-00418', stream: 'advret', cust: 2, net: 120000.000, vat: 6000.000, total: 126000.000,
    cur: 'OMR', type: 'Invoice', scen: 'B2B', stage: 5, state: 'active', retry: 0, created: '05 Nov 10:17:45',
    uuid: '1b80ed9f-a405-b2d7-f58b-e93ad7c28a1a', ackNo: 'ASP-OM-2026-1105-61266', ref: 'PEP-1105-0442',
    lines: 1, po: 'WGM-PO-2207', site: SITES.ghala, awaiting: 'OTA report' },
  { no: 'OGC-INV-2026-00426', stream: 'ipc', cust: 2, net: 66500.000, vat: 3325.000, total: 69825.000,
    cur: 'OMR', type: 'Invoice', scen: 'B2B', stage: 2, state: 'active', retry: 0, created: '05 Nov 10:33:02',
    uuid: null, ackNo: null, ref: null, lines: 2, po: 'WGM-PO-2210', site: SITES.ghala },
  { no: 'OGC-INV-2026-00428', stream: 'hire', cust: 3, net: 15200.000, vat: 760.000, total: 15960.000,
    cur: 'OMR', type: 'Invoice', scen: 'B2B', stage: 1, state: 'active', retry: 0, created: '05 Nov 10:39:27',
    uuid: null, ackNo: null, ref: null, lines: 4, po: 'SCL-PO-8821', site: SITES.thumrait }
];

/* --- inbound supplier documents -------------------------------------------
   supplier indexes SUPPLIERS. Omani suppliers arrive over Peppol and land as
   finance-system drafts; the foreign supplier's PDF is recorded for the
   reverse charge. `project` is the contract or cost centre the draft is coded to. */
const INBOUND = [
  { no: 'TFL-INV-2026-00318', supplier: 0, stream: 'subcon', recv: '05 Nov 10:27:52', net: 21480.000,
    vat: 1074.000, total: 22554.000, stage: 5, state: 'ok', erpRef: 'PINV-2026-00706',
    erpState: 'Draft — awaiting review', lines: 3, po: 'OGC-PO-2026-0412', kind: 'peppol', project: 'OGC-C-2025-014',
    note: 'Diesel and lubricants delivered to the Salalah-region works site, October 2026.' },
  { no: 'SHS-INV-2026-00094', supplier: 1, stream: 'subcon', recv: '05 Nov 10:21:30', net: 8725.000,
    vat: 436.250, total: 9161.250, stage: 5, state: 'ok', erpRef: 'PINV-2026-00705',
    erpState: 'Draft — awaiting review', lines: 2, po: 'OGC-PO-2026-0398', kind: 'peppol', project: 'WORKSHOP-THUMRAIT',
    note: 'Hydraulic hoses and track-roller spares for the Thumrait workshop.' },
  { no: 'ZHS-INV-2026-01177', supplier: 2, stream: 'subcon', recv: '05 Nov 09:56:14', net: 14300.000,
    vat: 715.000, total: 15015.000, stage: 5, state: 'ok', erpRef: 'PINV-2026-00704',
    erpState: 'Draft — awaiting review', lines: 4, po: 'OGC-PO-2026-0377', kind: 'peppol', project: 'OGC-C-2025-014',
    note: 'Subcontracted haulage of fill material under the call-off order, October 2026.' },
  { no: 'AES-2026-7731', supplier: 3, stream: 'rcm', recv: '05 Nov 09:44:08', net: 11600.000,
    vat: 580.000, total: 11600.000, stage: 4, state: 'held', erpRef: 'PINV-2026-00703',
    erpState: 'Draft — reverse charge, to confirm', lines: 1, po: 'OGC-PO-2026-0350', kind: 'pdf', project: 'WORKSHOP-THUMRAIT',
    note: 'Remote technical support and diagnostic session. Received as a PDF; VAT self-accounted at 5% under the reverse charge.' },
  { no: 'UNK-INV-2026-00027', supplier: null, stream: 'subcon', recv: '05 Nov 09:39:55', net: 860.000,
    vat: 43.000, total: 903.000, stage: 1, state: 'failed', erpRef: null,
    erpState: 'Held — cannot match', lines: 1, po: null, kind: 'peppol',
    err: 'Participant 0248:OM1100778002 does not resolve to Oman Gulf. Confirming the registration.',
    owner: 'platform' }
];

/* --- archive --------------------------------------------------------------- */
const ARCHIVE_ITEMS = [
  { item: 'Generated UBL XML',                  why: 'The official compliance document created from finance-system invoice data.', size: '9.4 KB' },
  { item: 'UUID and QR information',            why: 'Unique identity and invoice verification information.',                size: '312 B' },
  { item: 'Submission and outcome timestamps',  why: 'The complete processing timeline.',                                    size: '1.1 KB' },
  { item: 'ASP acknowledgements and final status', why: 'Evidence of receipt, delivery or rejection.',                       size: '2.4 KB' },
  { item: 'Validation results and audit history', why: 'Traceability for corrections, support and audit.',                   size: '6.1 KB' },
  { item: 'Approved certificates and signed log sheets', why: 'The customer sign-off behind each invoice, held with it.',    size: '—' }
];

/* --- finance-system invoice list (origin screen · generic, no product named) */
const ERP_INVOICES = [
  { no: 'OGC-INV-2026-00417', cust: 'Rimal Upstream Operating Company LLC', date: '05-11-2026', due: '05-12-2026',
    net: 89580.000, vat: 4479.000, total: 94059.000, docStatus: 'Posted', eStatus: 'Acknowledged',
    ready: true, uuid: 'a41f7c28…1fa3', qr: true, project: 'OGC-C-2025-014', basis: 'IPC-07 + VO-02' },
  { no: 'OGC-INV-2026-00416', cust: 'Harmal Field Services LLC', date: '05-11-2026', due: '05-12-2026',
    net: 41250.000, vat: 2062.500, total: 43312.500, docStatus: 'Posted', eStatus: 'Acknowledged',
    ready: true, uuid: 'b52a8d39…2ab4', qr: true, project: 'OGC-C-2026-006', basis: 'IPC-04' },
  { no: 'OGC-INV-2026-00421', cust: 'Sahil Camp & Logistics LLC', date: '05-11-2026', due: '05-12-2026',
    net: 18638.000, vat: 931.900, total: 19569.900, docStatus: 'Posted', eStatus: 'In Progress',
    ready: true, uuid: null, qr: false, project: 'HIRE-SCL-2026-04', basis: 'Hire · October log sheets' },
  { no: 'OGC-CRN-2026-00023', cust: 'Harmal Field Services LLC', date: '05-11-2026', due: '—',
    net: -3420.000, vat: -171.000, total: -3591.000, docStatus: 'Posted', eStatus: 'Acknowledged',
    ready: true, uuid: 'f96ecb7d…6ef8', qr: false, credit: true, project: 'OGC-C-2026-006', basis: 'Re-measurement · IPC-03' },
  { no: 'OGC-INV-2026-00426', cust: 'Wadi Ghul Midstream SAOC', date: '05-11-2026', due: '05-12-2026',
    net: 66500.000, vat: 3325.000, total: 69825.000, docStatus: 'Draft', eStatus: 'Not Applicable',
    ready: false, uuid: null, qr: false, project: 'OGC-C-2026-011', basis: 'IPC-02' },
  { no: 'OGC-INV-2026-00415', cust: 'Wadi Ghul Midstream SAOC', date: '04-11-2026', due: '04-12-2026',
    net: 38200.000, vat: 1910.000, total: 40110.000, docStatus: 'Posted', eStatus: 'Acknowledged',
    ready: true, uuid: '2c91fe0a…3b2c', qr: true, project: 'OGC-C-2026-011', basis: 'IPC-01' },
  { no: 'OGC-INV-2026-00412', cust: 'Jabal Haql Quarry Products LLC', date: '03-11-2026', due: '03-12-2026',
    net: 6420.000, vat: 321.000, total: 6741.000, docStatus: 'Posted', eStatus: 'Rejected by ASP',
    ready: true, uuid: '3da20f1b…4c3d', qr: false, project: 'HIRE-JHQ-2026-02', basis: 'Hire · September log sheets' }
];

/* --- the tracked measured-works contract and its certificates (origin screen)
   Fictional. Net of each certificate; 20% of each is recovered against the
   mobilisation advance and 10% is held as retention (illustrative rates).    */
const CONTRACT = {
  no: 'OGC-C-2025-014', client: 'Rimal Upstream Operating Company LLC', po: 'RUOC-PO-5208',
  title: 'Earthworks and graded access road — fictional upstream development',
  value: 1640000.000, advanceNet: 246000.000, recoveryPct: 20, retentionPct: 10,
  certificate: { no: 'IPC-07', period: '1–31 Oct 2026', approved: '3 Nov 2026' },
  lines: [
    { boq: '2.1', desc: 'Bulk excavation and cut-to-fill', qty: 18400, unit: 'MTQ', uom: 'm³', rate: 2.850 },
    { boq: '3.4', desc: 'Graded access road — sub-base',   qty: 6200,  unit: 'MTR', uom: 'm',  rate: 4.400 },
    { boq: 'VO-02', desc: 'Variation VO-02 — culvert crossing', qty: 1, unit: 'C62', uom: 'lump sum', rate: 9860.000 }
  ],
  variation: { no: 'VO-02', name: 'Culvert crossing', value: 9860.000 },
  certificates: [
    { n: 'IPC-01', net: 120400.000, state: 'Invoiced', inv: 'OGC-INV-2026-00188' },
    { n: 'IPC-02', net: 210300.000, state: 'Invoiced', inv: 'OGC-INV-2026-00241' },
    { n: 'IPC-03', net: 188000.000, state: 'Invoiced', inv: 'OGC-INV-2026-00299' },
    { n: 'IPC-04', net: 150200.000, state: 'Invoiced', inv: 'OGC-INV-2026-00331' },
    { n: 'IPC-05', net: 96000.000,  state: 'Invoiced', inv: 'OGC-INV-2026-00356' },
    { n: 'IPC-06', net: 134500.000, state: 'Invoiced', inv: 'OGC-INV-2026-00383' },
    { n: 'IPC-07', net: 89580.000,  state: 'Invoiced', inv: 'OGC-INV-2026-00417' },
    { n: 'IPC-08', net: null,       state: 'Being measured', inv: null }
  ]
};

/* --- how the tracked invoice settles ---------------------------------------
   One place for the numbers, so the finance system, the XML, the retention
   screen and the mapping all agree. Under Fawtara's reading (to confirm):
     - VAT is due on the full certified value (net incl. VO-02);
     - the advance recovery is BT-113 (20% of net + its VAT), so the e-invoice
       payable (BT-115) is the invoice total less that amount;
     - retention is a payment term: it is held back in cash but is NOT a
       reduction of the taxable amount or of BT-115.                          */
const SETTLEMENT = (function () {
  const r3 = x => Math.round(x * 1000) / 1000;
  const net = r3(CONTRACT.lines.reduce((a, l) => a + l.qty * l.rate, 0));
  const vat = r3(net * VAT_RATE / 100);
  const total = r3(net + vat);
  const advNet = r3(net * CONTRACT.recoveryPct / 100);
  const prepaid = r3(advNet * (1 + VAT_RATE / 100));
  const retention = r3(net * CONTRACT.retentionPct / 100);
  const certNet = CONTRACT.certificates.filter(c => c.net !== null).reduce((a, c) => a + c.net, 0);
  const recoveredToDate = r3(certNet * CONTRACT.recoveryPct / 100);
  return { net, vat, total, advNet, prepaid, payable: r3(total - prepaid),
           retention, cashDue: r3(total - prepaid - retention),
           certNet, recoveredToDate, advanceLeft: r3(CONTRACT.advanceNet - recoveredToDate),
           retentionToDate: r3(certNet * CONTRACT.retentionPct / 100) };
})();   /* net 89,580.000 · VAT 4,479.000 · total 94,059.000 · prepaid 18,811.800 · payable 75,247.200 · retention 8,958.000 · cash due 66,289.200 */

/* --- plant & transport hire (origin screen) --------------------------------
   Monthly hire invoices are built from signed log sheets: hours (or days) by
   equipment class at the contract rate. Log sheets missing a customer signature
   are held back and never auto-invoiced.                                     */
const HIRE_DAILY = [72, 0, 60, 70, 74, 72, 70, 74, 0, 58, 72, 76, 74, 72, 70, 0, 62, 72, 78, 76, 72, 70, 0, 60, 70, 76, 74, 72, 70, 0, 46];  /* = 1,812 h; Fridays off */
const HIRE = {
  system: 'Finance system', module: 'Plant hire — log sheets & monthly hire billing',
  period: 'October 2026', days: 31,
  focus: { customer: 'Sahil Camp & Logistics LLC', contract: 'HIRE-SCL-2026-04',
           title: 'Plant and tipper hire with operators — Thumrait workshop dispatch', invoice: 'OGC-INV-2026-00421' },
  daily: HIRE_DAILY,
  lines: [
    { cls: 'Excavator 20 t, with operator',      code: 'EXC-20', units: 2, hours: 380, rate: 12.500 },
    { cls: 'Dozer, D6 class, with operator',     code: 'DOZ-06', units: 1, hours: 176, rate: 16.000 },
    { cls: 'Motor grader, with operator',        code: 'GRD-14', units: 1, hours: 160, rate: 15.000 },
    { cls: 'Tipper 20 m³, with driver',          code: 'TIP-20', units: 4, hours: 640, rate: 6.500 },
    { cls: 'Low-bed trailer and prime mover',    code: 'LBT-01', units: 1, hours: 120, rate: 18.000 },
    { cls: 'Water bowser, with driver',          code: 'WBS-01', units: 1, hours: 336, rate: 7.000 }
  ],
  note: 'Each month’s invoice is built from the log sheets the customer countersigned, by equipment class, at the contract rate. The finance system raises it; the Hub validates and sends it — the same pipe as every certificate invoice.',
  assumption: 'Assumption · to confirm with Oman Gulf: whether plant is hired out with operators, how usage is recorded (paper log sheets or telematics), the monthly cut-off, and whether the customer signs before or after the invoice is posted.',
  rows: [
    { cust: 'Sahil Camp & Logistics LLC',     contract: 'HIRE-SCL-2026-04', booked: 1812, approved: 1812, disputed: 0,  amount: 18638.000, no: 'OGC-INV-2026-00421', state: 'Invoiced', site: SITES.thumrait },
    { cust: 'Jabal Haql Quarry Products LLC', contract: 'HIRE-JHQ-2026-02', booked: 960,  approved: 960,  disputed: 0,  amount: 12480.000, no: 'OGC-INV-2026-00419', state: 'Invoiced', site: SITES.thumrait },
    { cust: 'Harmal Field Services LLC',      contract: 'HIRE-HFS-2026-03', booked: 412,  approved: 380,  disputed: 32, amount: 9120.000,  no: 'OGC-INV-2026-00425', state: 'Invoiced', site: SITES.thumrait },
    { cust: 'Rimal Upstream Operating Company LLC', contract: 'HIRE-RUOC-2026-01', booked: 640, approved: 600, disputed: 40, amount: 0, no: '—', state: 'Signature missing', site: SITES.salalah }
  ]
};

/* --- processing logs ------------------------------------------------------- */
const LOGS = [
  { ts: '09:12:37.114', lv: 'info', txt: 'Poll tick — finance system, watermark 2026-11-05T09:12:02Z · site Salalah region' },
  { ts: '09:12:37.288', lv: 'info', txt: 'Fetched raw payload · 14.2 KB · 33 fields (allowlist applied)' },
  { ts: '09:12:37.401', lv: 'ok',   txt: 'Idempotency check passed — OGC-INV-2026-00417 not previously seen' },
  { ts: '09:12:37.553', lv: 'info', txt: 'Mapping profile OGC/v1 applied — 47 of 48 fields resolved' },
  { ts: '09:12:37.700', lv: 'info', txt: 'Scenario detected: B2B measured-works certificate · services · standard rate 5%' },
  { ts: '09:12:37.846', lv: 'ok',   txt: 'BTOM-002 UUID derived — a41f7c28-3d9e-5b60-8e14-72c9d05b1fa3' },
  { ts: '09:12:38.019', lv: 'info', txt: 'UBL 2.1 Invoice built · 9.4 KB · 3 lines · contract OGC-C-2025-014' },
  { ts: '09:12:38.190', lv: 'info', txt: 'Oman CIUS Schematron — evaluating 150 assertions' },
  { ts: '09:12:40.466', lv: 'warn', txt: 'IBR-W-014 · payment means defaulted to 30' },
  { ts: '09:12:40.468', lv: 'ok',   txt: 'Validation passed — 148 passed, 0 failed, 2 warnings (278 ms)' },
  { ts: '09:12:40.611', lv: 'ok',   txt: 'Archived — XML, validation report and audit trail written before transmission' },
  { ts: '09:12:40.790', lv: 'ok',   txt: 'State → READY_FOR_ASP · queued on the Oman Gulf channel' }
];

/* --- ASP exchange ---------------------------------------------------------- */
const ASP = {
  provider: 'Accredited Service Provider — Fawtara X (licence reference illustrative)',
  endpoint: 'https://ap.asp-oman.om/peppol/v1/documents',
  auth: 'mTLS · client certificate held in the platform vault',
  sentAt: '5 Nov 2026 09:12:41.144 GST',
  ackAt:  '5 Nov 2026 09:12:41.508 GST',
  otaAt:  '5 Nov 2026 09:14:19.870 GST',
  mlsAt:  '5 Nov 2026 09:15:02.336 GST',
  rtt: 364,
  http: '202 Accepted',
  ref: 'PEP-1105-0417',
  ackNo: 'ASP-OM-2026-1105-61204',
  otaRef: 'OTA-RPT-2026-1105-70417',
  msgId: 'urn:uuid:a41f7c28-3d9e-5b60-8e14-72c9d05b1fa3',
  sender: '0248:OM1100294816',
  sellerVatin: 'OM1100294816',
  sellerCr: 'CR 1048392',
  receiver: '0248:OM1100618204',
  docType: 'Peppol PINT billing — Oman',
  process: 'Peppol BIS billing'
};

/* --- history --------------------------------------------------------------- */
const HISTORY = [
  { no: 'OGC-INV-2026-00417', stream: 'ipc', date: '5 Nov 09:12', total: 94059.000, type: 'Certificate invoice', dir: 'out', st: 'success', ack: 'ASP-OM-2026-1105-61204', retries: 0 },
  { no: 'OGC-INV-2026-00416', stream: 'ipc', date: '5 Nov 09:20', total: 43312.500, type: 'Certificate invoice', dir: 'out', st: 'success', ack: 'ASP-OM-2026-1105-61209', retries: 0 },
  { no: 'OGC-INV-2026-00419', stream: 'hire', date: '5 Nov 09:38', total: 13104.000, type: 'Hire invoice', dir: 'out', st: 'success', ack: 'ASP-OM-2026-1105-61221', retries: 0 },
  { no: 'OGC-INV-2026-00421', stream: 'hire', date: '5 Nov 10:04', total: 19569.900, type: 'Hire invoice', dir: 'out', st: 'pending', ack: null, retries: 0 },
  { no: 'OGC-INV-2026-00418', stream: 'advret', date: '5 Nov 10:17', total: 126000.000, type: 'Advance invoice', dir: 'out', st: 'pending', ack: null, retries: 0 },
  { no: 'OGC-CRN-2026-00023', stream: 'adjust', date: '5 Nov 10:24', total: -3591.000, type: 'Credit Note', dir: 'out', st: 'success', ack: 'ASP-OM-2026-1105-61255', retries: 0 },
  { no: 'OGC-DBN-2026-00009', stream: 'adjust', date: '5 Nov 10:31', total: 3391.500, type: 'Debit Note', dir: 'out', st: 'success', ack: 'ASP-OM-2026-1105-61261', retries: 0 },
  { no: 'TFL-INV-2026-00318', stream: 'subcon', date: '5 Nov 10:27', total: 22554.000, type: 'Supplier invoice', dir: 'in', st: 'success', ack: 'PINV-2026-00706', retries: 0 },
  { no: 'SHS-INV-2026-00094', stream: 'subcon', date: '5 Nov 10:21', total: 9161.250, type: 'Supplier invoice', dir: 'in', st: 'success', ack: 'PINV-2026-00705', retries: 0 },
  { no: 'AES-2026-7731', stream: 'rcm', date: '5 Nov 09:44', total: 11600.000, type: 'Imported service', dir: 'in', st: 'pending', ack: 'PINV-2026-00703', retries: 0 },
  { no: 'OGC-INV-2026-00425', stream: 'hire', date: '5 Nov 10:13', total: 9576.000, type: 'Hire invoice', dir: 'out', st: 'failed', ack: null, retries: 2, err: 'IBR-CO-15 · total mismatch' },
  { no: 'OGC-INV-2026-00412', stream: 'hire', date: '3 Nov 16:08', total: 6741.000, type: 'Hire invoice', dir: 'out', st: 'rejected', ack: null, retries: 0, err: 'ASP rejected — buyer participant not registered' },
  { no: 'OGC-INV-2026-00415', stream: 'ipc', date: '4 Nov 14:02', total: 40110.000, type: 'Certificate invoice', dir: 'out', st: 'success', ack: 'ASP-OM-2026-1104-61088', retries: 0 }
];

/* --- reporting — by stream, month to date November 2026 -------------------- */
const REPORT_ROWS = [
  { id: 'ipc',    name: 'Measured works · certificates', docs: 12, net: 806400.000, vat: 40320.000, zero: 0.000, failed: 1, ack: 11 },
  { id: 'hire',   name: 'Plant & transport hire',        docs: 31, net: 412500.000, vat: 20625.000, zero: 0.000, failed: 1, ack: 30 },
  { id: 'adjust', name: 'Credit & debit notes',          docs: 6,  net: -38400.000, vat: -1920.000, zero: 0.000, failed: 0, ack: 6 },
  { id: 'advret', name: 'Advance & retention',           docs: 3,  net: 164000.000, vat: 8200.000,  zero: 0.000, failed: 0, ack: 3 },
  { id: 'subcon', name: 'Subcontractors & suppliers',    docs: 44, net: 295000.000, vat: 14750.000, zero: 0.000, failed: 0, ack: 44 },
  { id: 'rcm',    name: 'Imported services (RCM)',       docs: 4,  net: 36200.000,  vat: 1810.000,  zero: 0.000, failed: 0, ack: 4 }
];

const REPORT_TYPES = [
  { n: 'VAT summary by stream',          d: 'Net, VAT and zero-rated totals for a period, per invoice stream.', tag: 'Finance' },
  { n: 'Reporting completeness',         d: 'Documents raised in the finance system against documents acknowledged by the ASP.', tag: 'Compliance' },
  { n: 'Billing by contract',            d: 'Certificates and hire invoiced per contract, against contract value, advance recovered and retention held.', tag: 'Contracts' },
  { n: 'Exception ageing',               d: 'Open failures by age and by who owns the fix.', tag: 'Operations' },
  { n: 'Inbound purchase log',           d: 'Supplier documents landed as drafts, and imported services self-accounted.', tag: 'Operations' },
  { n: 'OTA-position register',          d: 'The open treatments — certificate timing, advance and retention, operator relief, reverse charge — and their status.', tag: 'Programme' }
];

/* --- mapping: what the finance system exposes ------------------------------ */
const ERP_SCHEMA = [
  { f: 'InvoiceNumber',              t: 'string',  ex: 'OGC-INV-2026-00417' },
  { f: 'InvoiceDate',                t: 'date',    ex: '20261105' },
  { f: 'InvoiceType',                t: 'string',  ex: 'STD' },
  { f: 'IsCancelled',                t: 'boolean', ex: 'false' },
  { f: 'Currency',                   t: 'string',  ex: 'OMR' },
  { f: 'BillingEntity',              t: 'string',  ex: 'OGC-OM' },
  { f: 'CompanyRegistration',        t: 'string',  ex: '1048392' },
  { f: 'CompanyVATNumber',           t: 'string',  ex: '1100294816' },
  { f: 'CompanyAddressCity',         t: 'string',  ex: 'Salalah' },
  { f: 'CompanyCountry',             t: 'string',  ex: 'OM' },
  { f: 'AccountNumber',              t: 'string',  ex: 'CU-00014' },
  { f: 'CustomerName',               t: 'string',  ex: '  rimal upstream operating company llc ' },
  { f: 'CustomerVATNumber',          t: 'string',  ex: '1100618204' },
  { f: 'CustomerCountry',            t: 'string',  ex: 'OM' },
  { f: 'CustomerAddressStreet',      t: 'string',  ex: '(empty in this system)' },
  { f: 'ContractRef',                t: 'string',  ex: 'OGC-C-2025-014' },
  { f: 'CustomerPO',                 t: 'string',  ex: 'RUOC-PO-5208' },
  { f: 'CertificateNo',              t: 'string',  ex: 'IPC-07' },
  { f: 'PeriodStart',                t: 'date',    ex: '20261001' },
  { f: 'PeriodEnd',                  t: 'date',    ex: '20261031' },
  { f: 'ServiceEntryRef',            t: 'string',  ex: 'SES-IPC07-2026' },
  { f: 'Site',                       t: 'string',  ex: 'SALALAH' },
  { f: 'NetAmount',                  t: 'decimal', ex: '89580.00' },
  { f: 'TaxAmount',                  t: 'decimal', ex: '4479.00' },
  { f: 'InvoiceTotal',               t: 'decimal', ex: '94059.00' },
  { f: 'PrepaidAmount',              t: 'decimal', ex: '18811.80' },
  { f: 'AmountDue',                  t: 'decimal', ex: '75247.20' },
  { f: 'TaxRate',                    t: 'decimal', ex: '5.0' },
  { f: 'BoqItem',                    t: 'string',  ex: '2.1' },
  { f: 'BoqDescription',             t: 'string',  ex: 'Bulk excavation and cut-to-fill' },
  { f: 'Quantity',                   t: 'decimal', ex: '18400.0000' },
  { f: 'QuantityUnit',               t: 'string',  ex: 'M3' },
  { f: 'NetPriceAmount',             t: 'decimal', ex: '2.850' },
  { f: 'PaymentTerms',               t: 'string',  ex: 'NT30' }
];

const TRANSFORMS = [
  { v: '',                   n: 'Copy as-is' },
  { v: 'trim',               n: 'trim — remove surrounding spaces' },
  { v: 'trim|upper',         n: 'trim | upper — trim then upper-case' },
  { v: 'date:ISO8601',       n: 'date:ISO8601 — yyyymmdd to yyyy-mm-dd' },
  { v: 'decimal:3',          n: 'decimal:3 — force three decimal places' },
  { v: 'decimal:4',          n: 'decimal:4 — force four decimal places' },
  { v: 'codelist:UNCL1001',  n: 'codelist:UNCL1001 — map to document type code' },
  { v: 'codelist:UNECE20',   n: 'codelist:UNECE20 — map to unit of measure' },
  { v: 'iso:alpha2',         n: 'iso:alpha2 — country to two-letter code' },
  { v: 'prefix:OM',          n: 'prefix:OM — prepend the country prefix' },
  { v: 'lookup:company',     n: 'lookup:company — resolve from entity master' },
  { v: 'map:381',            n: 'map:381 — flag as credit note' },
  { v: 'pct',                n: 'pct — percentage as a number' },
  { v: 'nullable',           n: 'nullable — allow an empty value' },
  { v: 'derive:uuidv5',      n: 'derive:uuidv5 — generated by the Hub' },
  { v: 'derive:0248',        n: 'derive:0248 — build the Peppol participant ID' },
  { v: 'derive:txntype',     n: 'derive:txntype — Standard or Simplified' },
  { v: 'derive:itemkind',    n: 'derive:itemkind — goods or services, from the item group' },
  { v: 'const',              n: 'const — the same value on every document' },
  { v: 'const:0248',         n: 'const:0248 — fixed scheme identifier' },
  { v: 'const:CR',           n: 'const:CR — Commercial Registration scheme' },
  { v: 'const:VAT',          n: 'const:VAT — fixed tax scheme' }
];

const MAPPING = [
  { grp: 'Document header', rows: [
    { erp: 'InvoiceNumber',          std: 'BT-1',  stdName: 'Invoice number',        xf: '',            req: 'Mandatory', ok: true },
    { erp: 'InvoiceDate',            std: 'BT-2',  stdName: 'Issue date',            xf: 'date:ISO8601',req: 'Mandatory', ok: true },
    { erp: 'InvoiceType',            std: 'BT-3',  stdName: 'Invoice type code',     xf: 'codelist:UNCL1001', req: 'Mandatory', ok: true },
    { erp: 'Currency',               std: 'BT-5',  stdName: 'Document currency',     xf: '',            req: 'Mandatory', ok: true },
    { erp: 'IsCancelled',            std: 'BT-3',  stdName: 'Credit note flag',      xf: 'map:381',     req: 'Conditional', ok: true },
    { erp: 'PeriodStart',            std: 'BT-73', stdName: 'Invoicing period start date', xf: 'date:ISO8601', req: 'Optional', ok: true,
      dnote: 'The start of the period the certificate covers. Which period fields the OTA expects is to confirm with the OTA.' },
    { erp: 'PeriodEnd',              std: 'BT-74', stdName: 'Invoicing period end date', xf: 'date:ISO8601', req: 'Optional', ok: true },
    { erp: 'ContractRef',            std: 'BT-12', stdName: 'Contract reference',    xf: 'trim',        req: 'Optional', ok: true,
      dnote: 'Oman Gulf’s contract number, so the customer can match the invoice to the works contract.' },
    { erp: 'CustomerPO',             std: 'BT-13', stdName: 'Purchase order reference', xf: 'trim',     req: 'Optional', ok: true,
      dnote: 'The customer’s PO number. Oil and gas operators commonly require it on supplier invoices — a discovery question for Oman Gulf’s customers.' },
    { erp: 'CertificateNo',          std: 'BT-14', stdName: 'Sales order reference (certificate no.)', xf: 'trim', req: 'Optional', ok: true,
      dnote: 'Carries the interim payment certificate number. The exact field is to confirm against the PINT-OM field list.' },
    { erp: 'ServiceEntryRef',        std: 'BT-15', stdName: 'Receiving advice reference (service entry)', xf: 'trim', req: 'Optional', ok: true,
      dnote: 'Where a customer issues a service-entry or receipt number, it is carried here. The field choice is to confirm against the PINT-OM field list.' },
    { erp: '—',                      std: 'BTOM-002', stdName: 'Document UUID',      xf: 'derive:uuidv5', req: 'Mandatory', ok: true, derived: true,
      dnote: 'Built from the invoice number, the seller VAT identifier and the issue date. Stable — a resubmission of the same invoice produces the same UUID.' },
    { erp: '—',                      std: 'BTOM-001', stdName: 'Invoice transaction type', xf: 'derive:txntype', req: 'Mandatory', ok: true, derived: true,
      dnote: 'Standard for Omani B2B — decided from the customer’s registration and country.' },
    { erp: '—',                      std: 'IBT-024', stdName: 'Specification identifier', xf: 'const', req: 'Mandatory', ok: true, derived: true, constant: true,
      dnote: 'urn:peppol:pint:billing-1@om-1 — declares the OM-1.1 ruleset the document is validated against.' }
  ]},
  { grp: 'Seller party', rows: [
    { erp: 'BillingEntity',          std: 'BT-27', stdName: 'Seller name',           xf: 'lookup:company', req: 'Mandatory', ok: true },
    { erp: 'CompanyRegistration',    std: 'IBT-029', stdName: 'Seller identifier (CR)', xf: 'const:CR', req: 'Mandatory', ok: true,
      dnote: 'Oman Gulf’s Commercial Registration, scheme CR (code list CL-06-OM). The number shown is illustrative.' },
    { erp: 'CompanyVATNumber',       std: 'BT-31', stdName: 'Seller VAT identifier', xf: 'prefix:OM',   req: 'Mandatory', ok: true,
      dnote: 'The Omani VATIN OM1100294816 — an illustrative value.' },
    { erp: '—',                      std: 'BTOM-004', stdName: 'Seller participant ID', xf: 'derive:0248', req: 'Mandatory', ok: true, derived: true,
      dnote: 'Oman Gulf’s Peppol participant, 0248:OM<VATIN> — its endpoint, SMP entry and certificate. The exact Oman EAS scheme is confirmed on the OTA onboarding portal. Salalah, Thumrait and Ghala are sites of this one seller, not separate participants.' },
    { erp: 'CompanyAddressCity',     std: 'BT-37', stdName: 'Seller city',           xf: '',            req: 'Mandatory', ok: true,
      dnote: 'Salalah is an assumption — which site is the registered address is not known.' },
    { erp: 'CompanyCountry',         std: 'BT-40', stdName: 'Seller country code',   xf: 'iso:alpha2',  req: 'Mandatory', ok: true }
  ]},
  { grp: 'Buyer party', rows: [
    { erp: 'AccountNumber',          std: 'BT-46', stdName: 'Buyer identifier',      xf: '',            req: 'Mandatory', ok: true },
    { erp: 'CustomerName',           std: 'BT-44', stdName: 'Buyer name',            xf: 'trim|upper',  req: 'Mandatory', ok: true },
    { erp: 'CustomerVATNumber',      std: 'BT-48', stdName: 'Buyer VAT identifier',  xf: 'nullable',    req: 'Conditional', ok: true,
      dnote: 'Present for Omani customers. Its absence blocks the document until the customer’s registration is confirmed.' },
    { erp: 'CustomerCountry',        std: 'BT-55', stdName: 'Buyer country code',    xf: 'iso:alpha2',  req: 'Mandatory', ok: true },
    { erp: '',                       std: 'BT-50', stdName: 'Buyer address line 1',  xf: '',            req: 'Mandatory', ok: false,
      fallback: 'Address held in the Hub master',
      note: 'CustomerAddressStreet is present but empty on some customer records.' }
  ]},
  { grp: 'Monetary totals', rows: [
    { erp: 'NetAmount',              std: 'BT-109', stdName: 'Sum of line net amounts', xf: 'decimal:3', req: 'Mandatory', ok: true },
    { erp: 'TaxAmount',              std: 'BT-110', stdName: 'Invoice total VAT amount', xf: 'decimal:3', req: 'Mandatory', ok: true },
    { erp: 'InvoiceTotal',           std: 'BT-112', stdName: 'Invoice total with VAT',  xf: 'decimal:3', req: 'Mandatory', ok: true },
    { erp: 'PrepaidAmount',          std: 'BT-113', stdName: 'Prepaid amount',          xf: 'decimal:3', req: 'Conditional', ok: true,
      dnote: 'The part of the mobilisation advance recovered on this certificate (20% of net plus its VAT). Retention is not reported here — it is a payment term. To confirm with the OTA.' },
    { erp: 'AmountDue',              std: 'BT-115', stdName: 'Amount due for payment',  xf: 'decimal:3', req: 'Mandatory', ok: true,
      dnote: 'Invoice total less the prepaid amount. Retention held back in cash does not reduce it.' },
    { erp: 'TaxRate',                std: 'BT-119', stdName: 'VAT category rate',       xf: 'pct',       req: 'Mandatory', ok: true },
    { erp: '—',                      std: 'IBT-118-1', stdName: 'Tax scheme code',       xf: 'const:VAT', req: 'Mandatory', ok: true, derived: true, constant: true,
      dnote: 'Always VAT for Oman.' }
  ]},
  { grp: 'Line items', rows: [
    { erp: 'BoqItem',                std: 'BT-155', stdName: 'Item seller identifier', xf: '',          req: 'Mandatory', ok: true,
      dnote: 'The bill-of-quantities item number, so the customer can match each line to the contract.' },
    { erp: 'BoqDescription',         std: 'BT-153', stdName: 'Item name',              xf: 'trim',      req: 'Mandatory', ok: true },
    { erp: 'Quantity',               std: 'BT-129', stdName: 'Invoiced quantity',      xf: 'decimal:4', req: 'Mandatory', ok: true },
    { erp: 'QuantityUnit',           std: 'BT-130', stdName: 'Unit of measure code',   xf: 'codelist:UNECE20', req: 'Mandatory', ok: true,
      dnote: 'M3 becomes MTQ (cubic metre), M becomes MTR (metre), LS (lump sum) becomes C62 “one”. Hire lines stay HUR (hour) or DAY.' },
    { erp: 'NetPriceAmount',         std: 'BT-146', stdName: 'Item net price',         xf: 'decimal:3', req: 'Mandatory', ok: true },
    { erp: '—',                      std: 'BTOM-019', stdName: 'Goods or services indicator', xf: 'derive:itemkind', req: 'Mandatory', ok: true, derived: true,
      dnote: 'Services on every outbound line — works and hire are both services, read from the item group.' }
  ]}
];

/* --- validation ------------------------------------------------------------ */
const VALIDATION = {
  profile: 'PINT-OM · Oman CIUS Schematron', ran: '5 Nov 2026 09:12:40 GST', ms: 278,
  passed: 148, failed: 0, warned: 2,
  rules: [
    { st: 'pass', id: 'IBR-001-OM', txt: 'An invoice shall have a Specification identifier (BT-24).' },
    { st: 'pass', id: 'IBR-002-OM', txt: 'An invoice shall have an Invoice number (BT-1).' },
    { st: 'pass', id: 'BTOM-002',   txt: 'Document UUID shall be a deterministic UUIDv5 over seller ID, invoice number and issue date.' },
    { st: 'pass', id: 'IBR-CO-10',  txt: 'Sum of Invoice line net amounts (BT-106) = Σ Invoice line net amount (BT-131).' },
    { st: 'pass', id: 'IBR-CO-15',  txt: 'Invoice total with VAT (BT-112) = Invoice total without VAT (BT-109) + Invoice total VAT (BT-110).' },
    { st: 'pass', id: 'IBR-052-OM', txt: 'Seller VAT identifier shall match the Omani VATIN format OM + 10 digits.' },
    { st: 'warn', id: 'IBR-W-014',  txt: 'Payment means code (BT-81) not supplied — defaulted to 30 (credit transfer).',
      x: 'cac:PaymentMeans/cbc:PaymentMeansCode' },
    { st: 'warn', id: 'IBR-W-031',  txt: 'Buyer address line 1 (BT-50) sourced from the fallback mapping — field not exposed by the finance system.',
      x: 'cac:AccountingCustomerParty/cac:Party/cac:PostalAddress/cbc:StreetName' }
  ]
};

const VALIDATION_FAILED = {
  profile: 'PINT-OM · Oman CIUS Schematron', ran: '5 Nov 2026 10:13:21 GST', ms: 255,
  passed: 143, failed: 2, warned: 1,
  rules: [
    { st: 'fail', id: 'IBR-053-OM', txt: 'Buyer VAT identifier (BT-48) is absent and no substitute participant ID was derived.',
      x: 'cac:AccountingCustomerParty/cac:Party/cac:PartyTaxScheme/cbc:CompanyID' },
    { st: 'fail', id: 'IBR-CO-15',  txt: 'Invoice total with VAT (BT-112) does not equal BT-109 + BT-110. Expected 9576.000, found 9575.000.',
      x: 'cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount' },
    { st: 'warn', id: 'IBR-W-014',  txt: 'Payment means code (BT-81) not supplied — defaulted to 30 (credit transfer).',
      x: 'cac:PaymentMeans/cbc:PaymentMeansCode' },
    { st: 'pass', id: 'IBR-001-OM', txt: 'An invoice shall have a Specification identifier (BT-24).' },
    { st: 'pass', id: 'IBR-002-OM', txt: 'An invoice shall have an Invoice number (BT-1).' }
  ]
};

/* --- finance-system status sync steps (final origin screen) ---------------- */
const SYNC_STEPS = [
  { name: 'Invoice posted in the finance system', t: '5 Nov 09:12:36', st: 'ok',
    body: 'Invoice OGC-INV-2026-00417 posted against contract OGC-C-2025-014 once the customer’s engineer approved certificate IPC-07. Document status set to Posted.' },
  { name: 'Collected by the Hub', t: '5 Nov 09:12:37', st: 'ok',
    body: 'Method 1 — Direct API (an assumption to confirm). The Hub called the finance system’s standard interface. Raw payload 14.2 KB, field allowlist applied.' },
  { name: 'Mapped, built and validated', t: '5 Nov 09:12:40', st: 'ok',
    body: 'Profile OGC/v1 applied. UBL 2.1 built. Oman CIUS Schematron passed — 148 rules, 2 warnings.' },
  { name: 'Archived', t: '5 Nov 09:12:40', st: 'ok',
    body: 'XML, validation report and audit trail written to the compliance archive before anything was transmitted.' },
  { name: 'Transmitted to the ASP', t: '5 Nov 09:12:41', st: 'ok',
    body: 'Accepted by the accredited provider in 364 ms. Peppol reference PEP-1105-0417.' },
  { name: 'Outcomes tracked on three legs', t: '5 Nov 09:15:02', st: 'ok',
    body: 'ASP accepted it at 09:12:41. Reported to the Tax Authority at 09:14:19. The customer’s provider confirmed delivery at 09:15:02.' },
  { name: 'Result published on the interface', t: '5 Nov 09:15:04', st: 'ok',
    body: 'Held against this invoice and available to the finance system: UUID, e-invoice status, acknowledgement number, Peppol reference and QR information.' },
  { name: 'Collected by the finance system', t: '5 Nov 09:15:04', st: 'ok',
    body: 'The Oman Gulf-side connector read the result and stored it on the invoice, where the print format renders the QR on the customer copy.' }
];

/* --- delivery boundary ----------------------------------------------------- */
const BOUNDARY_ENTITY = [
  'Complete invoice data and the master data behind it — customers, contracts, BOQ rates, equipment classes',
  'An enabled interface, an integration user and a test environment',
  'The system-side connector that collects the result, and the fields to hold it',
  'System-side changes where a required field is missing',
  'Finance and contracts users for testing, exceptions and sign-off'
];
const BOUNDARY_HUB = [
  'Mapping, XML generation and PINT-OM validation',
  'ASP communication, outcome tracking and retry handling',
  'Secure XML archive and audit trail',
  'Inbound routing, contract coding and draft delivery',
  'Dashboard, monitoring and central technical operations'
];

/* --- why Fawtara — differentiators (value screen) -------------------------- */
const FAWTARA_VALUE = [
  { k: 'Accredited by the OTA', d: 'A licensed Accredited Service Provider (ASP) — the reporting leg to the OTA is ours, not a bolt-on.', ico: 'shield' },
  { k: 'Where the data is held', d: 'Where invoice data and the legal archive are held is agreed during solution design, not assumed here.', ico: 'lock' },
  { k: 'Built for contract billing', d: 'Approved certificates and signed log sheets travel with the invoice, so a customer query is answered from one record.', ico: 'queue' },
  { k: 'One pipe, every stream', d: 'Certificate, hire, credit-note, advance and retention, subcontractor and reverse-charge documents all run through one integration and one console.', ico: 'send' },
  { k: 'OTA-interface alignment', d: 'PINT-OM validation before anything is sent, and outcome tracking on all three Peppol legs after.', ico: 'check' },
  { k: 'We bring positions, not questions', d: 'On the unsettled treatments — certificate timing, advance and retention, operator relief, reverse charge — Fawtara comes with a recommended reading to take to the OTA.', ico: 'grid' }
];

/* --- helpers --------------------------------------------------------------- */
function tenant(id) { return TENANTS.find(t => t.id === id) || OGC; }
function omr(n) {
  if (n === null || n === undefined) return '—';
  return (n < 0 ? '−' : '') + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}
function pct(n) { return n === null || n === undefined ? '—' : n.toFixed(1) + '%'; }
function num(n) { return n === null || n === undefined ? '—' : n.toLocaleString('en-US'); }
function method(m) { return METHODS[m]; }
