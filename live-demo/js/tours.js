/* ==========================================================
   tours.js: the five guided tours. Steps are built from a
   shared library so the full demo reuses the same cards.
   Card text is written for a business owner, not IT.
   ========================================================== */

const nav = (p) => { go(p); return Tour.wait(60); };
const F = (slug, name) => `/erp/form/${slug}/${encodeURIComponent(name)}`;

const STEP = {
  /* ---------- Sales & e-invoicing ---------- */
  salesWelcome: {
    chapter: 'Welcome', title: 'From first enquiry to cash, with e-invoicing built in',
    body: 'This tour follows a real sale at <b>Infy Demo Company</b>: two 15 HP air compressors for <b>ABC Trading LLC</b>. We go from enquiry to payment, then watch the same invoice travel through the <b>Infinity e-Invoice Hub</b>. Use <b>Next</b> or the → key.',
    target: '[data-t="ws-flow"]', placement: 'bottom', setup: () => nav('/erp/ws/selling'),
  },
  leads: {
    chapter: 'Selling', title: 'Every enquiry is captured as a lead',
    body: 'Four leads came in from an exhibition, cold calls, an advert and a referral. Each one is tracked until it becomes an opportunity or a quotation, so nothing slips through the cracks.',
    why: 'Sales staff change; the pipeline stays. You can see which channel actually brings business.',
    target: '[data-t="list"]', placement: 'bottom', setup: () => nav('/erp/list/lead'),
  },
  opportunity: {
    chapter: 'Selling', title: 'Opportunities show the value in the pipeline',
    body: 'Enquiries arrive as leads (4 so far, from an exhibition, cold calls, an advert and a referral) and qualified ones become opportunities. <b>XYZ Engineering LLC</b> wants two 30 HP compressors: an opportunity worth <b>OMR 10,600.000</b>, now at proposal stage with quotation SAL-QTN-2026-00003 attached.',
    target: '[data-t="form-head"]', placement: 'bottom', setup: () => nav(F('opportunity', 'CRM-OPP-2026-00002')),
  },
  quotation: {
    chapter: 'Selling', title: 'A quotation in seconds, with VAT worked out',
    body: 'For ABC Trading LLC: 2 × Demo Air Compressor 15 HP at 3,150.000 plus installation for both units. Prices come from the item master and VAT 5% is added automatically: <b>OMR 7,560.000</b>.',
    target: '[data-t="items"]', placement: 'top', setup: () => nav(F('quotation', 'SAL-QTN-2026-00001')),
  },
  salesOrder: {
    chapter: 'Selling', title: 'The order tracks what is delivered and billed',
    body: 'Once the customer accepts, the quotation becomes sales order SAL-ORD-2026-00001. These bars show at a glance that it is <b>100% delivered and 100% billed</b>.',
    why: 'No more chasing the warehouse or accounts to ask “did we ship it? did we bill it?”.',
    target: '[data-t="progress"]', placement: 'bottom', setup: () => nav(F('sales-order', 'SAL-ORD-2026-00001')),
  },
  deliveryNote: {
    chapter: 'Selling', title: 'Delivery note: stock leaves the warehouse',
    body: 'Delivery note MAT-DN-2026-00001 records the compressors leaving stock on 13 Oct 2026. Stock levels and cost of goods sold update in the same step. The flow above shows exactly where this document sits.',
    target: '[data-t="chain"]', placement: 'bottom', setup: () => nav(F('delivery-note', 'MAT-DN-2026-00001')),
  },
  invoiceTotals: {
    chapter: 'Selling', title: 'The tax invoice, built from the delivery',
    body: 'Sales invoice ACC-SINV-2026-00003 is created from the delivery note with one click: net <b>OMR 7,200.000</b>, VAT 5% <b>OMR 360.000</b>, total <b>OMR 7,560.000</b>. It is already paid, so nothing is outstanding.',
    target: '[data-t="totals"]', placement: 'top', setup: () => nav(F('sales-invoice', 'ACC-SINV-2026-00003')),
  },
  einvoice: {
    chapter: 'E-invoicing', title: 'E-invoice status right on the invoice',
    body: 'On submit, the invoice is sent automatically to the Infinity e-Invoice Hub. The result comes back here: status <b>Delivered</b>, the official invoice <b>UUID</b> and a QR code for the printed copy.',
    why: 'Your team keeps working in the ERP. There is no separate portal to log into and nothing to re-type.',
    target: '[data-t="einvoice"]', placement: 'bottom', setup: () => nav(F('sales-invoice', 'ACC-SINV-2026-00003')),
  },
  payment: {
    chapter: 'Selling', title: 'Payment closes the loop',
    body: 'Connections link every related document. ABC Trading paid <b>OMR 7,560.000</b> by bank transfer on payment ACC-PAY-2026-00002. Click <b>Open the payment</b> to jump straight to it.',
    target: '[data-t="connections"]', placement: 'top', setup: () => nav(F('sales-invoice', 'ACC-SINV-2026-00003')),
    tryIt: { label: 'Open the payment', run: () => nav(F('payment-entry', 'ACC-PAY-2026-00002')) },
  },
  hubTimeline: {
    chapter: 'e-Invoice Hub', title: 'The same invoice in the e-Invoice Hub',
    body: 'Every step is time-stamped: picked up from Infinity ERP, mapped, built, <b>validated against the Oman rules</b>, recorded, sent to the buyer and confirmed. This invoice went from pickup to <b>Delivered</b> in about 10 seconds, carrying seller VAT OM1100099999 and CR 1100099.',
    why: 'If a customer says “we never got it”, you have proof of when it was delivered.',
    target: '[data-t="hub-timeline"]', placement: 'left', setup: () => nav('/hub/doc/ACC-SINV-2026-00003'),
  },
  hubFields: {
    chapter: 'e-Invoice Hub', title: 'Exactly what the buyer receives',
    body: 'Seller <b>Infy Demo Company</b> (VAT OM1100099999, CR 1100099), buyer ABC Trading LLC (VAT OM1000000101), every line with its HS code, and the totals. All of it comes straight from the ERP invoice.',
    target: '[data-t="hub-fields"]', placement: 'right', setup: () => nav('/hub/doc/ACC-SINV-2026-00003'),
  },
  creditNote: {
    chapter: 'Corrections', title: 'Credit and debit notes go through the same channel',
    body: 'One generator was returned, so credit note ACC-SINV-2026-00025 reverses <b>OMR 7,087.500</b> against invoice ACC-SINV-2026-00004 (reason QTY) and is e-invoiced as type <b>381</b>. A price increase is a debit note (type <b>383</b>). Click <b>Show the debit note</b>.',
    target: '[data-t="return-banner"]', placement: 'bottom', setup: () => nav(F('sales-invoice', 'ACC-SINV-2026-00025')),
    tryIt: { label: 'Show the debit note', run: () => nav(F('sales-invoice', 'ACC-SINV-2026-00027')) },
  },
  hubKpis: {
    chapter: 'e-Invoice Hub', title: 'One screen shows how e-invoicing is going',
    body: '<b>26</b> documents received from Infinity ERP: <b>24 delivered</b>, <b>2 need attention</b>, none stuck in progress.',
    why: 'You only look at exceptions. Everything else simply happens.',
    target: '[data-t="hub-kpis"]', placement: 'bottom', setup: () => nav('/hub/dashboard'),
  },
  fail28: {
    chapter: 'Exceptions', title: 'Failure 1: the customer has no address',
    body: 'Invoice ACC-SINV-2026-00028 for <b>Demo Walk-in Customer</b> was stopped because the customer has no address, and a buyer address is mandatory on an Oman e-invoice. The hub explains the problem in plain language and lists the fix.',
    target: '[data-t="hub-error"]', placement: 'right', setup: () => nav('/hub/doc/ACC-SINV-2026-00028'),
  },
  fix28: {
    chapter: 'Exceptions', title: 'The fix is made in Infinity ERP',
    body: 'Open the customer, add the billing address (street, city, postal code, country), then <b>cancel and amend</b> the invoice. The hub picks up the amended copy by itself. Click <b>Fix</b> to see the address form.',
    target: '[data-t="cust-einv"]', placement: 'bottom', setup: () => nav(F('customer', 'Demo Walk-in Customer')),
  },
  fail29: {
    chapter: 'Exceptions', title: 'Failure 2: an invalid VAT number',
    body: 'Invoice ACC-SINV-2026-00029 for <b>Sample Retail Co LLC</b> was rejected by validation rule <b>IBR-003-OM</b>: the buyer VAT number “OM12345” is too short. Oman VAT numbers are OM followed by exactly 10 digits.',
    why: 'The mistake is caught before the invoice reaches the customer or the tax authority, not weeks later.',
    target: '[data-t="hub-error"]', placement: 'right', setup: () => nav('/hub/doc/ACC-SINV-2026-00029'),
  },
  fix29: {
    chapter: 'Exceptions', title: 'Correct the customer, then cancel and amend',
    body: 'After the VAT number on Sample Retail Co LLC is corrected, the invoice is cancelled and amended as ACC-SINV-2026-00029-1. Click <b>Cancel &amp; amend</b> to see what happens next.',
    target: '[data-t="einvoice"]', placement: 'bottom', setup: () => nav(F('sales-invoice', 'ACC-SINV-2026-00029')),
    tryIt: { label: 'Cancel & amend', run: () => document.querySelector('[data-t="amend-btn"]').click() },
  },

  /* ---------- Purchase & import ---------- */
  buyWelcome: {
    chapter: 'Welcome', title: 'Buying, from request to payment',
    body: 'First a local purchase of valves and pumps, then a container of compressors imported from China in US dollars. The tour ends with the real landed cost per unit.',
    target: '[data-t="ws-flow"]', placement: 'bottom', setup: () => nav('/erp/ws/buying'),
  },
  mr: {
    chapter: 'Buying', title: 'Stores raise a material request',
    body: 'Material request MAT-MR-2026-00004 asks purchasing to buy stock. Its status shows it is <b>partially received</b>, so everyone knows part of it is still on the way.',
    target: '[data-t="form-head"]', placement: 'bottom', setup: () => nav(F('material-request', 'MAT-MR-2026-00004')),
  },
  rfq: {
    chapter: 'Buying', title: 'One request for quotation, two suppliers',
    body: 'RFQ PUR-RFQ-2026-00002 went to <b>XYZ Supplies LLC</b> and <b>ABC Equipment Trading LLC</b>. Both replies are compared side by side: ABC Equipment is <b>OMR 349.125 cheaper</b> and got the order.',
    why: 'Every purchase has a documented competitive quote. That is good for cost and for audit.',
    target: '[data-t="sq-compare"]', placement: 'bottom', setup: () => nav(F('rfq', 'PUR-RFQ-2026-00002')),
  },
  po: {
    chapter: 'Buying', title: 'The purchase order follows the winning quote',
    body: 'PUR-ORD-2026-00006: 30 gate valves and 5 centrifugal pumps, <b>OMR 4,837.875</b> including VAT. The bars show 71% received and 80% billed so far.',
    target: '[data-t="progress"]', placement: 'bottom', setup: () => nav(F('purchase-order', 'PUR-ORD-2026-00006')),
  },
  pr: {
    chapter: 'Buying', title: 'Goods receipt adds the stock',
    body: 'Purchase receipt MAT-PRE-2026-00004 records what actually arrived. Stock is updated immediately and the receipt is matched to the order and the supplier bill.',
    target: '[data-t="chain"]', placement: 'bottom', setup: () => nav(F('purchase-receipt', 'MAT-PRE-2026-00004')),
  },
  pinv: {
    chapter: 'Buying', title: 'The supplier bill, with input VAT',
    body: 'Purchase invoice ACC-PINV-2026-00005 (supplier bill ABC-EQ-5512): <b>OMR 3,870.300</b> including <b>OMR 184.300</b> input VAT, which is reclaimed in the VAT return.',
    target: '[data-t="totals"]', placement: 'top', setup: () => nav(F('purchase-invoice', 'ACC-PINV-2026-00005')),
  },
  importPo: {
    chapter: 'Import', title: 'An import order in US dollars',
    body: 'Purchase order PUR-ORD-2026-00007 to <b>Demo Industrial Machinery Co Ltd (China)</b>: 5 × 15 HP compressors at USD 5,200.00, <b>USD 26,000.00</b> in total.',
    target: '[data-t="currency-box"]', placement: 'bottom', setup: () => nav(F('purchase-order', 'PUR-ORD-2026-00007')),
  },
  importInv: {
    chapter: 'Import', title: 'USD bill converted at 0.385',
    body: 'The supplier invoice CN-INV-88021 is entered in dollars. Infinity ERP converts it at <b>1 USD = 0.385 OMR</b>, so the books show <b>OMR 10,010.000</b>. It also self-assesses 5% reverse-charge import VAT.',
    target: '[data-t="currency-box"]', placement: 'bottom', setup: () => nav(F('purchase-invoice', 'ACC-PINV-2026-00011')),
  },
  importFx: {
    chapter: 'Import', title: 'Payment and the exchange difference',
    body: 'The bill was paid with <b>OMR 9,999.600</b> (ACC-PAY-2026-00011). The 10.400 difference against the booked 10,010.000 is posted automatically as an exchange gain (ACC-JV-2026-00013).',
    target: '[data-t="connections"]', placement: 'top', setup: () => nav(F('purchase-invoice', 'ACC-PINV-2026-00011')),
  },
  importCharges: {
    chapter: 'Import', title: 'Freight, customs duty and clearing',
    body: 'Three more bills arrive for the same shipment: <b>Demo Freight Forwarders LLC</b> (sea freight 420.000 + insurance 60.000), <b>Demo Customs Authority</b> (5% duty 524.500) and <b>Demo Customs Clearing LLC</b> (clearing 85.000).',
    target: '[data-t="lcv-charges"]', placement: 'top', setup: () => nav(F('landed-cost-voucher', 'MAT-LCV-2026-00001')),
  },
  lcvImpact: {
    chapter: 'Import', title: 'Landed cost: the real cost of each compressor',
    body: 'The landed cost voucher adds <b>OMR 1,089.500</b> of charges to the stock. Each compressor goes from <b>OMR 2,002.000</b> (USD 5,200 × 0.385) to <b>OMR 2,219.900</b>, 10.9% more.',
    why: 'Margins and selling prices are based on what the goods really cost you, not just the supplier price.',
    target: '[data-t="lcv-impact"]', placement: 'top', setup: () => nav(F('landed-cost-voucher', 'MAT-LCV-2026-00001')),
  },
  stockRow: {
    chapter: 'Import', title: 'Stock value includes the landed cost',
    body: 'The 8 compressors in Stores are valued at <b>OMR 18,299.500</b>: 3 bought locally at 2,400.000 plus the 5 imported at 2,219.900. Stock value agrees with the ledger.',
    target: '[data-t="stock-cmp15"]', placement: 'right', setup: () => nav('/erp/report/stock'),
  },
  apReport: {
    chapter: 'Import', title: 'What you owe, in both currencies',
    body: 'Accounts payable shows each open bill in its own currency and in OMR. The two unpaid USD bills (USD 52,400.00 and USD 6,260.00) are <b>OMR 22,584.100</b> of the <b>OMR 30,397.100</b> total.',
    target: '[data-t="ap-kpis"]', placement: 'bottom', setup: () => nav('/erp/report/ap'),
  },

  /* ---------- Service & repair ---------- */
  svcWelcome: {
    chapter: 'Welcome', title: 'After-sales service and repairs',
    body: 'Follow a motor from sale to complaint, engineer visit, repair invoice and closed claim. Every step is linked, so anyone can see the full history.',
    target: '[data-t="ws-flow"]', placement: 'bottom', setup: () => nav('/erp/ws/service'),
  },
  motorSold: {
    chapter: 'Service', title: 'The motor is sold',
    body: 'Invoice ACC-SINV-2026-00013: one <b>Demo Electric Motor 7.5 kW</b> sold to <b>Sample Construction Co LLC</b> on 3 Nov 2026 for OMR 336.000 including VAT.',
    target: '[data-t="items"]', placement: 'top', setup: () => nav(F('sales-invoice', 'ACC-SINV-2026-00013')),
  },
  complaint: {
    chapter: 'Service', title: 'The customer complains: a warranty claim',
    body: 'On 14 Nov the customer reports the motor is <b>running hot and making a grinding noise</b>. Warranty claim SER-WRN-2026-00001 records the complaint against the original invoice.',
    target: '[data-t="complaint"]', placement: 'bottom', setup: () => nav(F('warranty-claim', 'SER-WRN-2026-00001')),
  },
  visit: {
    chapter: 'Service', title: 'An engineer visits',
    body: 'Maintenance visit MAT-MVS-2026-00002 (breakdown, 15 Nov) is assigned to <b>Demo Employee 04</b>, Engineer. The work done is recorded on the visit.',
    target: '[data-t="visit-purpose"]', placement: 'bottom', setup: () => nav(F('maintenance-visit', 'MAT-MVS-2026-00002')),
  },
  journey: {
    chapter: 'Service', title: 'The whole repair on one line',
    body: 'Sale, complaint, visit, engineer hours (timesheet TS-2026-00005, 3 hours) and the repair invoice. Click any step to open it.',
    target: '[data-t="chain"]', placement: 'top', setup: () => nav(F('maintenance-visit', 'MAT-MVS-2026-00002')),
  },
  repairInv: {
    chapter: 'Service', title: 'Repair invoice: labour hours plus parts',
    body: 'ACC-SINV-2026-00014 bills <b>3 hours of repair labour</b> (DEMO-LAB-HR at 20.000/h) and <b>2 bearing sets</b>: OMR 84.000 + VAT = <b>OMR 88.200</b>. The hours come from the engineer’s timesheet.',
    why: 'Every hour your engineers work gets billed. Nothing is lost between the workshop and accounts.',
    target: '[data-t="items"]', placement: 'top', setup: () => nav(F('sales-invoice', 'ACC-SINV-2026-00014')),
  },
  claimClosed: {
    chapter: 'Service', title: 'Claim closed, with the root cause',
    body: 'Resolution: bearings replaced, windings cleaned, 1 hour test at full load. Cause: <b>site supply voltage too low</b>. The claim is now Closed.',
    target: '[data-t="resolution"]', placement: 'bottom', setup: () => nav(F('warranty-claim', 'SER-WRN-2026-00001')),
  },
  freeWarranty: {
    chapter: 'Service', title: 'Free-of-charge warranty work is tracked too',
    body: 'For ABC Trading LLC the cooling fan and bearing set were replaced <b>free of charge</b>. The parts (OMR 13.000) were issued from stock and booked as warranty cost, so you know what warranties really cost you.',
    target: '[data-t="resolution"]', placement: 'bottom', setup: () => nav(F('warranty-claim', 'SER-WRN-2026-00002')),
  },
  rewind: {
    chapter: 'Service', title: 'A bigger job: motor rewinding',
    body: 'For XYZ Engineering LLC: rewinding service, a rewinding kit, <b>5 labour hours</b> and a new cooling fan, OMR 278.250 including VAT. Paid on 19 Nov.',
    target: '[data-t="items"]', placement: 'top', setup: () => nav(F('sales-invoice', 'ACC-SINV-2026-00021')),
  },
  openClaims: {
    chapter: 'Service', title: 'One claim is still open',
    body: 'Filter the warranty claims by status. Four are closed. One, for <b>Demo Industries SAOC</b>, is still <b>Open</b>.',
    target: '[data-t="list"]', placement: 'bottom', setup: () => nav('/erp/list/warranty-claim?status=Open'),
  },
  openClaim: {
    chapter: 'Service', title: 'Next action is clear',
    body: 'SER-WRN-2026-00005: motor vibration at high speed, <b>engineer visit planned for 22 Nov</b>. No resolution yet, so the claim stays on the open list until the job is done.',
    target: '[data-t="resolution"]', placement: 'bottom', setup: () => nav(F('warranty-claim', 'SER-WRN-2026-00005')),
  },
  svcHub: {
    chapter: 'Service', title: 'Repair invoices are e-invoiced as well',
    body: 'The repair invoice ACC-SINV-2026-00014 went through the e-Invoice Hub like any other sale and was <b>delivered</b> to Sample Construction Co LLC.',
    target: '[data-t="hub-timeline"]', placement: 'left', setup: () => nav('/hub/doc/ACC-SINV-2026-00014'),
  },

  /* ---------- Accounts, HR & reports ---------- */
  accWelcome: {
    chapter: 'Welcome', title: 'Accounts, people and reports',
    body: 'Everything you saw in sales, buying and service has already posted to the books. This tour looks at the finance and HR side.',
    target: '[data-t="kpis"]', placement: 'bottom', setup: () => nav('/erp/home'),
  },
  coa: {
    chapter: 'Accounts', title: 'A chart of accounts set up for Oman',
    body: '298 accounts with 4-digit numbers: 1xxx assets, 2xxx liabilities, 3xxx equity, 4xxx revenue, 5xxx–9xxx costs. Click a group to open it. Balances roll up automatically.',
    target: '[data-t="coa-tree"]', placement: 'right', setup: () => nav('/erp/report/coa'),
  },
  pl: {
    chapter: 'Reports', title: 'Profit and loss',
    body: 'Revenue <b>OMR 37,496.160</b>, cost of goods sold <b>OMR 27,818.693</b>, so gross profit is <b>OMR 9,656.307</b>, a 25.8% margin. All of it comes from posted documents, with no spreadsheets.',
    target: '[data-t="pl-summary"]', placement: 'left', setup: () => nav('/erp/report/pl'),
  },
  plNet: {
    chapter: 'Reports', title: 'The bottom line',
    body: 'After salaries, rent and depreciation the first two months show a <b>net loss of OMR 2,077.403</b>. Click any account group to see where the money went.',
    target: '[data-t="pl-net"]', placement: 'right', setup: () => nav('/erp/report/pl'),
  },
  bs: {
    chapter: 'Reports', title: 'Balance sheet, always in balance',
    body: 'Assets of <b>OMR 120,903.377</b> (most of it stock) against liabilities of OMR 35,105.780 and equity of OMR 85,797.597.',
    target: '[data-t="bs-check"]', placement: 'top', setup: () => nav('/erp/report/bs'),
  },
  gl: {
    chapter: 'Reports', title: 'General ledger, account by account',
    body: 'Every ledger with activity, with debits and credits that always agree. Your accountant can drill from any figure on the reports to the account behind it.',
    target: '[data-t="gl-check"]', placement: 'left', setup: () => nav('/erp/report/gl'),
  },
  ar: {
    chapter: 'Reports', title: 'Who owes you, and since when',
    body: 'Receivables by customer and due date: <b>OMR 16,643.000</b> in total, agreeing to the ledger. Credit notes and the one unallocated receipt are shown separately.',
    why: 'Collections become a 2-minute daily check.',
    target: '[data-t="ar-kpis"]', placement: 'bottom', setup: () => nav('/erp/report/ar'),
  },
  stock: {
    chapter: 'Reports', title: 'Stock value',
    body: '<b>OMR 77,790.937</b> of stock across Stores and Finished Goods, item by item, including landed import costs. It agrees with ledger 1640.',
    target: '[data-t="stock-table"]', placement: 'right', setup: () => nav('/erp/report/stock'),
  },
  assets: {
    chapter: 'Assets', title: 'Fixed assets with depreciation',
    body: 'The forklift cost <b>OMR 9,500.000</b>. October depreciation of <b>OMR 137.903</b> was posted automatically (ACC-JV-2026-00010), leaving a net book value of OMR 9,362.097.',
    target: '[data-t="asset-dep"]', placement: 'bottom', setup: () => nav(F('asset', 'ACC-ASS-2026-00001')),
  },
  employees: {
    chapter: 'HR', title: 'Employee records',
    body: 'Six employees, from the Managing Director to the engineers, each with designation, department and joining date.',
    target: '[data-t="list"]', placement: 'bottom', setup: () => nav('/erp/list/employee'),
  },
  attendance: {
    chapter: 'HR', title: 'Attendance and leave',
    body: '78 attendance days marked: <b>75 present</b>, 2 on approved leave, 1 absent, a 96.2% attendance rate. Leave is applied for and approved in the system.',
    target: '[data-t="att-tiles"]', placement: 'bottom', setup: () => nav('/erp/report/attendance'),
  },
  payroll: {
    chapter: 'HR', title: 'October payroll in one run',
    body: 'Six salary slips: gross <b>OMR 8,450.000</b>, deductions OMR 354.900, net paid <b>OMR 8,095.100</b>. The accrual and the bank payment are posted to the books automatically.',
    target: '[data-t="payroll-summary"]', placement: 'bottom', setup: () => nav('/erp/list/salary-slip'),
  },
  project: {
    chapter: 'Projects', title: 'Projects with tasks and timesheets',
    body: '<b>Demo Compressor Overhaul</b> for Demo Industries SAOC: 1 of 3 tasks done (33%), 29 engineer hours logged against an estimated cost of OMR 2,500.000.',
    target: '[data-t="project-tasks"]', placement: 'top', setup: () => nav(F('project', 'PROJ-0001')),
  },
  accWrap: {
    chapter: 'Wrap-up', title: 'One system, one set of numbers',
    body: 'Sales, purchases, stock, service, payroll and assets all feed the same ledger. The dashboard figures are the same figures your accountant sees.',
    target: '[data-t="kpis"]', placement: 'bottom', setup: () => nav('/erp/home'),
  },

  /* ---------- Full demo extras ---------- */
  fullWelcome: {
    chapter: 'Welcome', title: 'Infinity ERP: the 15-minute tour',
    body: 'Infy Demo Company trades and services compressors, motors, pumps and generators in Oman. In the next few minutes: selling with e-invoicing, fixing an e-invoice error, an import with landed cost, a repair job, and the finance reports.',
    target: '[data-t="kpis"]', placement: 'bottom', setup: () => nav('/erp/home'),
  },
  fullEnd: {
    chapter: 'Wrap-up', title: 'That is Infinity ERP',
    body: 'One system for selling, buying, stock, service, projects, HR and accounts, with Oman e-invoicing built in through the Infinity e-Invoice Hub. Open the <b>Guided tours</b> button any time to go deeper into one area.',
    setup: () => nav('/erp/home'),
  },
};

Tour.define('sales', { title: 'Sales & e-invoicing', minutes: 6 }, [
  STEP.salesWelcome, STEP.opportunity, STEP.quotation, STEP.salesOrder, STEP.deliveryNote, STEP.invoiceTotals, STEP.einvoice,
  STEP.payment, STEP.hubTimeline, STEP.creditNote, STEP.hubKpis, STEP.fail28, STEP.fix28, STEP.fail29, STEP.fix29,
]);
Tour.define('purchase', { title: 'Purchase & import', minutes: 6 }, [
  STEP.buyWelcome, STEP.mr, STEP.rfq, STEP.po, STEP.pr, STEP.pinv, STEP.importPo, STEP.importInv, STEP.importFx,
  STEP.importCharges, STEP.lcvImpact, STEP.stockRow, STEP.apReport,
]);
Tour.define('service', { title: 'Service & repair', minutes: 4 }, [
  STEP.svcWelcome, STEP.motorSold, STEP.complaint, STEP.visit, STEP.journey, STEP.repairInv, STEP.claimClosed,
  STEP.freeWarranty, STEP.rewind, STEP.openClaims, STEP.openClaim, STEP.svcHub,
]);
Tour.define('accounts', { title: 'Accounts, HR & reports', minutes: 6 }, [
  STEP.accWelcome, STEP.coa, STEP.pl, STEP.plNet, STEP.bs, STEP.gl, STEP.ar, STEP.stock, STEP.assets,
  STEP.employees, STEP.attendance, STEP.payroll, STEP.project, STEP.accWrap,
]);
Tour.define('full', { title: 'Full demo (15 min)', minutes: 15 }, [
  STEP.fullWelcome, STEP.salesWelcome, STEP.einvoice, STEP.hubTimeline, STEP.hubKpis, STEP.fail29, STEP.fix29,
  STEP.importInv, STEP.lcvImpact, STEP.complaint, STEP.repairInv, STEP.pl, STEP.bs, STEP.payroll, STEP.fullEnd,
]);

Tour.mount();
