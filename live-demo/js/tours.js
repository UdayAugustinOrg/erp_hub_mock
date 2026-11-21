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
    body: 'This tour follows a real sale at <b>Infy Demo Company</b>: two 15 HP air compressors for <b>ABC Trading LLC</b>. We go from enquiry to payment and see the e-invoice status Infinity ERP records on every invoice. Use <b>Next</b> or the → key.',
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
    body: 'Enquiries arrive as leads (4 so far, from an exhibition, cold calls, an advert and a referral) and qualified ones become opportunities. <b>XYZ Engineering LLC</b> wants two 30 HP compressors: an opportunity worth <b>OMR 10,600.000</b>, now at proposal stage with quotation INFY-QTN-2026-00003 attached.',
    target: '[data-t="form-head"]', placement: 'bottom', setup: () => nav(F('opportunity', 'INFY-OPP-2026-00002')),
  },
  quotation: {
    chapter: 'Selling', title: 'A quotation in seconds, with VAT worked out',
    body: 'For ABC Trading LLC: 2 × Demo Air Compressor 15 HP at 3,150.000 plus installation for both units. Prices come from the item master and VAT 5% is added automatically: <b>OMR 7,560.000</b>.',
    target: '[data-t="items"]', placement: 'top', setup: () => nav(F('quotation', 'INFY-QTN-2026-00001')),
  },
  salesOrder: {
    chapter: 'Selling', title: 'The order tracks what is delivered and billed',
    body: 'Once the customer accepts, the quotation becomes sales order INFY-SO-2026-00001. These bars show at a glance that it is <b>100% delivered and 100% billed</b>.',
    why: 'No more chasing the warehouse or accounts to ask “did we ship it? did we bill it?”.',
    target: '[data-t="progress"]', placement: 'bottom', setup: () => nav(F('sales-order', 'INFY-SO-2026-00001')),
  },
  deliveryNote: {
    chapter: 'Selling', title: 'Delivery note: stock leaves the warehouse',
    body: 'Delivery note INFY-DN-2026-00001 records the compressors leaving stock on 13 Oct 2026. Stock levels and cost of goods sold update in the same step. The flow above shows exactly where this document sits.',
    target: '[data-t="chain"]', placement: 'bottom', setup: () => nav(F('delivery-note', 'INFY-DN-2026-00001')),
  },
  invoiceTotals: {
    chapter: 'Selling', title: 'The tax invoice, built from the delivery',
    body: 'Sales invoice INFY-SINV-2026-00001 is created from the delivery note with one click. Each line carries the item’s tax template, and the default template Oman VAT 5% adds VAT automatically: net <b>OMR 7,200.000</b>, VAT 5% <b>OMR 360.000</b>, total <b>OMR 7,560.000</b>.',
    target: '[data-t="totals"]', placement: 'top', setup: () => nav(F('sales-invoice', 'INFY-SINV-2026-00001')),
  },
  einvoice: {
    chapter: 'E-invoicing', title: 'E-invoice status right on the invoice',
    body: 'On submit, the invoice is e-invoiced automatically. Infinity ERP stores the result on the invoice itself: e-invoice status <b>Delivered</b>, the official invoice <b>UUID</b> and the document type (380, tax invoice).',
    why: 'Your team keeps working in the ERP. There is nothing to re-type and the proof of delivery sits on the invoice.',
    target: '[data-t="einvoice"]', placement: 'bottom', setup: () => nav(F('sales-invoice', 'INFY-SINV-2026-00001')),
  },
  payment: {
    chapter: 'Selling', title: 'Payment closes the loop',
    body: 'Connections link every related document. ABC Trading paid <b>OMR 7,560.000</b> by bank transfer on payment INFY-PAY-2026-00002. Click <b>Open the payment</b> to jump straight to it.',
    target: '[data-t="connections"]', placement: 'top', setup: () => nav(F('sales-invoice', 'INFY-SINV-2026-00001')),
    tryIt: { label: 'Open the payment', run: () => nav(F('payment-entry', 'INFY-PAY-2026-00002')) },
  },
  creditNote: {
    chapter: 'Corrections', title: 'Credit and debit notes go through the same channel',
    body: 'One generator was returned, so credit note INFY-SINV-2026-00022 reverses <b>OMR 7,087.500</b> against invoice INFY-SINV-2026-00002 (reason QTY) and is e-invoiced as type <b>381</b>. A price increase is a debit note (type <b>383</b>). Click <b>Show the debit note</b>.',
    target: '[data-t="return-banner"]', placement: 'bottom', setup: () => nav(F('sales-invoice', 'INFY-SINV-2026-00022')),
    tryIt: { label: 'Show the debit note', run: () => nav(F('sales-invoice', 'INFY-SINV-2026-00024')) },
  },
  homeEinv: {
    chapter: 'E-invoicing', title: 'E-invoicing at a glance',
    body: 'The home page counts the e-invoice status of every invoice, credit note and debit note: <b>24 delivered</b> and <b>2 failed</b>. Each failure links straight to its invoice.',
    why: 'You only look at the exceptions. Everything else simply happens.',
    target: '[data-t="home-einv"]', placement: 'left', setup: () => nav('/erp/home'),
  },
  fail28: {
    chapter: 'Exceptions', title: 'Failure 1: the customer has no address',
    body: 'Invoice INFY-SINV-2026-00025 for <b>Demo Walk-in Customer</b> shows e-invoice status <b>Failed</b>. Infinity ERP keeps the error on the invoice and explains it in plain language: a buyer address is mandatory on an Oman e-invoice.',
    target: '[data-t="einv-error"]', placement: 'bottom', setup: () => nav(F('sales-invoice', 'INFY-SINV-2026-00025')),
  },
  fix28: {
    chapter: 'Exceptions', title: 'Fix the customer first',
    body: 'Open the customer and add the billing address (street, city, postal code, country). The readiness check shows exactly what is missing. Click <b>Add address</b> to see the form.',
    target: '[data-t="cust-einv"]', placement: 'bottom', setup: () => nav(F('customer', 'Demo Walk-in Customer')),
    tryIt: { label: 'Add address', run: () => document.querySelector('[data-act="fix-cust"]').click() },
  },
  fail29: {
    chapter: 'Exceptions', title: 'Failure 2: an invalid VAT number',
    body: 'Invoice INFY-SINV-2026-00026 for <b>Sample Retail Co LLC</b> failed validation rule <b>IBR-003-OM</b>: the buyer VAT number “OM12345” is too short. Oman VAT numbers are OM followed by exactly 10 digits.',
    why: 'The mistake is caught before the invoice reaches the customer or the tax authority, not weeks later.',
    target: '[data-t="einv-error"]', placement: 'bottom', setup: () => nav(F('sales-invoice', 'INFY-SINV-2026-00026')),
  },
  fix29cust: {
    chapter: 'Exceptions', title: 'Correct the VAT number on the customer',
    body: 'The customer record flags the VAT number as invalid. Enter the full 12-character number from the customer’s VAT certificate. Click <b>Fix VAT number</b> to see it.',
    target: '[data-t="cust-einv"]', placement: 'bottom', setup: () => nav(F('customer', 'Sample Retail Co LLC')),
    tryIt: { label: 'Fix VAT number', run: () => document.querySelector('[data-act="fix-cust"]').click() },
  },
  fix29: {
    chapter: 'Exceptions', title: 'Then cancel and amend the invoice',
    body: 'With the customer corrected, the invoice is cancelled and amended as INFY-SINV-2026-00026-1, which is e-invoiced again automatically. Click <b>Cancel &amp; amend</b> to see what happens.',
    target: '[data-t="einv-fail"]', placement: 'top', setup: () => nav(F('sales-invoice', 'INFY-SINV-2026-00026')),
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
    body: 'Material request INFY-MR-2026-00001 asks purchasing to buy stock. Its status shows it is <b>partially received</b>, so everyone knows part of it is still on the way.',
    target: '[data-t="form-head"]', placement: 'bottom', setup: () => nav(F('material-request', 'INFY-MR-2026-00001')),
  },
  rfq: {
    chapter: 'Buying', title: 'One request for quotation, two suppliers',
    body: 'RFQ INFY-RFQ-2026-00001 went to <b>XYZ Supplies LLC</b> and <b>ABC Equipment Trading LLC</b>. Both replies are compared side by side: ABC Equipment is <b>OMR 349.125 cheaper</b> and got the order.',
    why: 'Every purchase has a documented competitive quote. That is good for cost and for audit.',
    target: '[data-t="sq-compare"]', placement: 'bottom', setup: () => nav(F('rfq', 'INFY-RFQ-2026-00001')),
  },
  po: {
    chapter: 'Buying', title: 'The purchase order follows the winning quote',
    body: 'INFY-PO-2026-00004: 30 gate valves and 5 centrifugal pumps, <b>OMR 4,837.875</b> including VAT. The bars show 71% received and 80% billed so far.',
    target: '[data-t="progress"]', placement: 'bottom', setup: () => nav(F('purchase-order', 'INFY-PO-2026-00004')),
  },
  pr: {
    chapter: 'Buying', title: 'Goods receipt adds the stock',
    body: 'Purchase receipt INFY-PR-2026-00003 records what actually arrived. Stock is updated immediately and the receipt is matched to the order and the supplier bill.',
    target: '[data-t="chain"]', placement: 'bottom', setup: () => nav(F('purchase-receipt', 'INFY-PR-2026-00003')),
  },
  pinv: {
    chapter: 'Buying', title: 'The supplier bill, with input VAT',
    body: 'Purchase invoice INFY-PINV-2026-00005 (supplier bill ABC-EQ-5512): <b>OMR 3,870.300</b> including <b>OMR 184.300</b> input VAT, which is reclaimed in the VAT return.',
    target: '[data-t="totals"]', placement: 'top', setup: () => nav(F('purchase-invoice', 'INFY-PINV-2026-00005')),
  },
  importPo: {
    chapter: 'Import', title: 'An import order in US dollars',
    body: 'Purchase order INFY-PO-2026-00005 to <b>Demo Industrial Machinery Co Ltd (China)</b>: 5 × 15 HP compressors at USD 5,200.00, <b>USD 26,000.00</b> in total.',
    target: '[data-t="currency-box"]', placement: 'bottom', setup: () => nav(F('purchase-order', 'INFY-PO-2026-00005')),
  },
  importInv: {
    chapter: 'Import', title: 'USD bill converted at 0.385',
    body: 'The supplier invoice CN-INV-88021 is entered in dollars. Infinity ERP converts it at <b>1 USD = 0.385 OMR</b>, so the books show <b>OMR 10,010.000</b>. It also self-assesses 5% reverse-charge import VAT.',
    target: '[data-t="currency-box"]', placement: 'bottom', setup: () => nav(F('purchase-invoice', 'INFY-PINV-2026-00010')),
  },
  importFx: {
    chapter: 'Import', title: 'Payment and the exchange difference',
    body: 'The bill was paid with <b>OMR 9,999.600</b> (INFY-PAY-2026-00010). The 10.400 difference against the booked 10,010.000 is posted automatically as an exchange gain (INFY-JV-2026-00010).',
    target: '[data-t="connections"]', placement: 'top', setup: () => nav(F('purchase-invoice', 'INFY-PINV-2026-00010')),
  },
  importCharges: {
    chapter: 'Import', title: 'Freight, customs duty and clearing',
    body: 'Three more bills arrive for the same shipment: <b>Demo Freight Forwarders LLC</b> (sea freight 420.000 + insurance 60.000), <b>Demo Customs Authority</b> (5% duty 524.500) and <b>Demo Customs Clearing LLC</b> (clearing 85.000).',
    target: '[data-t="lcv-charges"]', placement: 'top', setup: () => nav(F('landed-cost-voucher', 'INFY-LCV-2026-00001')),
  },
  lcvImpact: {
    chapter: 'Import', title: 'Landed cost: the real cost of each compressor',
    body: 'The Landed Cost Analysis report, filtered to receipt INFY-PR-2026-00005, shows the effect of the landed cost voucher: the purchase value of <b>OMR 10,010.000</b> plus <b>OMR 1,089.500</b> of charges. Each compressor goes from <b>OMR 2,002.000</b> (USD 5,200 × 0.385) to <b>OMR 2,219.900</b>, 10.9% more.',
    why: 'Margins and selling prices are based on what the goods really cost you, not just the supplier price.',
    target: '[data-t="lca-unit"]', placement: 'bottom', setup: () => nav('/erp/report/lca?pr=INFY-PR-2026-00005'),
  },
  stockRow: {
    chapter: 'Import', title: 'Stock value includes the landed cost',
    body: 'The 2 compressors still in Stores are valued at <b>OMR 4,439.800</b>, that is <b>2,219.900 each</b>: the import price plus their share of freight, duty and clearing. Stock value agrees with the ledger.',
    target: '[data-t="stock-cmp15"]', placement: 'right', setup: () => nav('/erp/report/stock'),
  },
  apReport: {
    chapter: 'Payables', title: 'What you owe, in both currencies',
    body: `Accounts payable shows each open bill in its own currency and in OMR: <b>${omr(FIN.payable)}</b> in total. The two unpaid USD bills (USD 52,400.00 and USD 6,260.00) are <b>${omr(-glBal('2130'))}</b> of it, on 2130 Creditors - Foreign Suppliers (USD).`,
    target: '[data-t="ap-kpis"]', placement: 'bottom', setup: () => nav('/erp/report/ap'),
  },

  /* ---------- Service & repair ---------- */
  svcWelcome: {
    chapter: 'Welcome', title: 'After-sales service and repairs',
    body: 'Follow a motor from sale to complaint, engineer visit, repair invoice and closed claim. Every step is linked, so anyone can see the full history.',
    target: '[data-t="ws-flow"]', placement: 'bottom', setup: () => nav('/erp/ws/support'),
  },
  motorSold: {
    chapter: 'Service', title: 'The motor is sold',
    body: 'Invoice INFY-SINV-2026-00011: one <b>Demo Electric Motor 7.5 kW</b> sold to <b>Sample Construction Co LLC</b> on 3 Nov 2026 for OMR 336.000 including VAT.',
    target: '[data-t="items"]', placement: 'top', setup: () => nav(F('sales-invoice', 'INFY-SINV-2026-00011')),
  },
  complaint: {
    chapter: 'Service', title: 'The customer complains: a warranty claim',
    body: 'On 14 Nov the customer reports the motor is <b>running hot and making a grinding noise</b>. Warranty claim INFY-WRN-2026-00001 records the complaint against the original invoice.',
    target: '[data-t="complaint"]', placement: 'bottom', setup: () => nav(F('warranty-claim', 'INFY-WRN-2026-00001')),
  },
  visit: {
    chapter: 'Service', title: 'An engineer visits',
    body: 'Maintenance visit INFY-MV-2026-00002 (breakdown, 15 Nov) records the engineer’s visit to the site and the work done: bearings replaced, windings cleaned, full-load test.',
    target: '[data-t="visit-purpose"]', placement: 'bottom', setup: () => nav(F('maintenance-visit', 'INFY-MV-2026-00002')),
  },
  journey: {
    chapter: 'Service', title: 'The whole repair on one line',
    body: 'Sale, complaint, engineer visit and repair invoice, all linked. Click any step to open it.',
    target: '[data-t="chain"]', placement: 'top', setup: () => nav(F('maintenance-visit', 'INFY-MV-2026-00002')),
  },
  repairInv: {
    chapter: 'Service', title: 'Repair invoice: labour hours plus parts',
    body: 'INFY-SINV-2026-00012 bills <b>3 hours of repair labour</b> (DEMO-LAB-HR at 20.000/h) and <b>2 bearing sets</b>: OMR 84.000 + VAT = <b>OMR 88.200</b>. Every labour hour is billed with the parts.',
    why: 'Every hour your engineers work gets billed. Nothing is lost between the workshop and accounts.',
    target: '[data-t="items"]', placement: 'top', setup: () => nav(F('sales-invoice', 'INFY-SINV-2026-00012')),
  },
  claimClosed: {
    chapter: 'Service', title: 'Claim closed, with the root cause',
    body: 'Resolution: bearings replaced, windings cleaned, 1 hour test at full load. Cause: <b>site supply voltage too low</b>. The claim is now Closed.',
    target: '[data-t="resolution"]', placement: 'bottom', setup: () => nav(F('warranty-claim', 'INFY-WRN-2026-00001')),
  },
  freeWarranty: {
    chapter: 'Service', title: 'Free-of-charge warranty work is tracked too',
    body: 'For ABC Trading LLC the cooling fan and bearing set were replaced <b>free of charge</b>. The parts (OMR 13.000) were issued from stock and booked as warranty cost, so you know what warranties really cost you.',
    target: '[data-t="resolution"]', placement: 'bottom', setup: () => nav(F('warranty-claim', 'INFY-WRN-2026-00002')),
  },
  rewind: {
    chapter: 'Service', title: 'A bigger job: motor rewinding',
    body: 'For XYZ Engineering LLC: rewinding service, a rewinding kit, <b>5 labour hours</b> and a new cooling fan, OMR 278.250 including VAT. Paid on 19 Nov.',
    target: '[data-t="items"]', placement: 'top', setup: () => nav(F('sales-invoice', 'INFY-SINV-2026-00019')),
  },
  openClaims: {
    chapter: 'Service', title: 'One claim is still open',
    body: 'Filter the warranty claims by status. Four are closed. One, for <b>Demo Industries SAOC</b>, is still <b>Open</b>.',
    target: '[data-t="list"]', placement: 'bottom', setup: () => nav('/erp/list/warranty-claim?status=Open'),
  },
  openClaim: {
    chapter: 'Service', title: 'Next action is clear',
    body: 'INFY-WRN-2026-00005: motor vibration at high speed, <b>engineer visit planned for 22 Nov</b>. No resolution yet, so the claim stays on the open list until the job is done.',
    target: '[data-t="resolution"]', placement: 'bottom', setup: () => nav(F('warranty-claim', 'INFY-WRN-2026-00005')),
  },
  svcEinv: {
    chapter: 'Service', title: 'Repair invoices are e-invoiced too',
    body: 'The repair invoice INFY-SINV-2026-00012 was e-invoiced like any other sale. Its status is <b>Delivered</b> and its UUID is stored on the invoice.',
    target: '[data-t="einvoice"]', placement: 'bottom', setup: () => nav(F('sales-invoice', 'INFY-SINV-2026-00012')),
  },

  /* ---------- Accounts & reports ---------- */
  accWelcome: {
    chapter: 'Welcome', title: 'Accounts and reports',
    body: 'Everything you saw in sales, buying and service has already posted to the books. This tour walks through the finance side: the chart of accounts, standard statements, receivables, payables, stock and fixed assets.',
    target: '[data-t="kpis"]', placement: 'bottom', setup: () => nav('/erp/home'),
  },
  coa: {
    chapter: 'Accounts', title: 'The standard numbered chart of accounts',
    body: `The standard chart with account codes (${D.coa_summary.accounts} accounts): 1000 Application of Funds, 2000 Source of Funds, 3000 Equity, 4000 Income, 5000 Expenses. The client's own codes were added inside it where needed, such as 1210 Demo National Bank and 1790 CWIP. Click a group to open it.`,
    why: 'Because it is the standard chart, the standard reports come out automatically, with nothing to build by hand.',
    target: '[data-t="coa-tree"]', placement: 'right', setup: () => nav('/erp/report/coa'),
  },
  pl: {
    chapter: 'Reports', title: 'Profit and loss, standard layout',
    body: `Income <b>${omr(FIN.income)}</b>, direct expenses (cost of goods sold and service costs) <b>${omr(FIN.cogs)}</b>, so gross profit is <b>${omr(FIN.gross)}</b>, ${pct((FIN.gross / FIN.income) * 100)} of income. The statement follows the standard groups: 4000 Income, 5000 Expenses.`,
    target: '[data-t="pl-summary"]', placement: 'bottom', setup: () => nav('/erp/report/pl'),
  },
  plNet: {
    chapter: 'Reports', title: 'The bottom line',
    body: `After salaries, rent and depreciation (5200 Indirect Expenses) the first two months show a <b>${FIN.net >= 0 ? 'net profit' : 'loss'} of ${omr(Math.abs(FIN.net))}</b>: income ${omr(FIN.income)} less expenses ${omr(FIN.expense)}. Every line is a numbered account from the chart.`,
    target: '[data-t="pl-net"]', placement: 'right', setup: () => nav('/erp/report/pl'),
  },
  bs: {
    chapter: 'Reports', title: 'Balance sheet, always in balance',
    body: `Assets of <b>${omr(FIN.assets)}</b> against liabilities of ${omr(FIN.liabilities)} and equity of ${omr(FIN.equity)} (including OMR 45,000.000 of extra capital, INFY-JV-2026-00027), ${FIN.net >= 0 ? 'plus' : 'less'} the ${omr(Math.abs(FIN.net))} ${FIN.net >= 0 ? 'profit' : 'loss'} for the period.`,
    target: '[data-t="bs-check"]', placement: 'left', setup: () => nav('/erp/report/bs'),
  },
  gl: {
    chapter: 'Reports', title: 'General ledger, account by account',
    body: 'Every ledger with activity, with debits and credits that always agree. Your accountant can drill from any figure on the reports to the account behind it.',
    target: '[data-t="gl-check"]', placement: 'left', setup: () => nav('/erp/report/gl'),
  },
  ar: {
    chapter: 'Reports', title: 'Who owes you, and since when',
    body: `Receivables of <b>${omr(FIN.receivable)}</b>, agreeing to ledger 1310 Debtors, aged by posting date in the ranges set on the ERP (30, 40, 120 days): <b>OMR 28,369.000</b> is 0-30 days, 336.000 is 31-40 and 1,680.000 is 41-120. Each invoice shows its age in days.`,
    why: 'Collections become a 2-minute daily check.',
    target: '[data-t="ar-kpis"]', placement: 'bottom', setup: () => nav('/erp/report/ar'),
  },
  stock: {
    chapter: 'Reports', title: 'Stock value',
    body: `<b>${omr(FIN.stock)}</b> of stock across Stores and Finished Goods, item by item, including landed import costs. It agrees with ledger 1410 Stock In Hand.`,
    target: '[data-t="stock-table"]', placement: 'right', setup: () => nav('/erp/report/stock'),
  },
  assetCats: {
    chapter: 'Assets', title: 'Asset categories with different useful lives',
    body: `Six categories, each depreciated over its own life: ${D.asset_categories.slice().sort((a, b) => b.life_years - a.life_years).map((c) => `${c.name} <b>${c.life_years} years</b>`).join(', ')}. Each category posts to its own fixed asset, accumulated depreciation and expense accounts.`,
    target: '[data-t="list-table"]', placement: 'bottom', setup: () => nav('/erp/list/asset-category'),
  },
  assetSchedule: {
    chapter: 'Assets', title: 'A monthly depreciation schedule',
    body: `The forklift (Plant and Machinery, 5 years) cost <b>OMR 9,500.000</b>, so it depreciates <b>OMR 158.333 a month</b>. October is pro-rated from 5 Oct (OMR 137.903). Two months are booked (OMR 296.236); the rest are scheduled and post automatically.`,
    target: '[data-t="asset-schedule"]', placement: 'top', setup: () => nav(F('asset', 'INFY-AST-2026-00001')),
  },
  cwipBills: {
    chapter: 'Assets', title: 'Capital work in progress',
    body: 'The warehouse fit-out was built during October: civil and racking works (INFY-PINV-2026-00033, OMR 18,000.000) and electrical works (INFY-PINV-2026-00034, OMR 6,500.000). Both bills went to <b>1790 CWIP Account</b>, not to expenses, while the work was under way.',
    target: '[data-t="cwip-bills"]', placement: 'bottom', setup: () => nav(F('asset-capitalization', 'INFY-ACAP-2026-00001')),
  },
  assetCap: {
    chapter: 'Assets', title: 'Asset capitalization',
    body: 'On 31 Oct, Asset Capitalization INFY-ACAP-2026-00001 moves <b>OMR 24,500.000</b> out of CWIP into 1760 Buildings as asset INFY-AST-2026-00009 Warehouse Fit-out. As a Building it depreciates over <b>20 years</b> (OMR 102.083 a month) from 1 Nov, and CWIP goes back to zero.',
    target: '[data-t="acap-target"]', placement: 'top', setup: () => nav(F('asset-capitalization', 'INFY-ACAP-2026-00001')),
  },
  assetRegister: {
    chapter: 'Assets', title: 'The fixed asset register',
    body: `${D.assets.length} assets costing <b>${omr(sum(D.assets, 'gross_purchase_amount'))}</b>, with <b>${omr(sum(D.assets, 'depreciation_booked'))}</b> of depreciation booked to 30 Nov in ${D.depreciation_journals.length} journals. The register groups them by category, with cost, depreciation and net book value.`,
    target: '[data-t="asset-summary"]', placement: 'bottom', setup: () => nav('/erp/list/asset'),
  },
  accWrap: {
    chapter: 'Wrap-up', title: 'One system, one set of numbers',
    body: 'Sales, purchases, imports, stock, service and assets all feed the same ledger. The dashboard figures are the same figures your accountant sees.',
    target: '[data-t="kpis"]', placement: 'bottom', setup: () => nav('/erp/home'),
  },

  /* ---------- VAT, landed cost & ageing ---------- */
  vatWelcome: {
    chapter: 'Welcome', title: 'VAT, landed cost and ageing',
    body: 'For the finance team: where prices and VAT are set up, how VAT lands on every invoice and reconciles to the ledger, what imports really cost after landed cost, and how old the receivables, payables and stock are.',
    target: '[data-t="ws-flow"]', placement: 'bottom', setup: () => nav('/erp/ws/accounting'),
  },
  itemPrice: {
    chapter: 'VAT setup', title: 'Where the selling price is set',
    body: 'Prices live in <b>Item Price</b> records on two price lists: <b>Standard Selling</b> fills the rate on quotations, orders and invoices; <b>Standard Buying</b> fills purchase documents. The 15 HP compressor sells at OMR 3,150.000 and is bought at OMR 2,400.000.',
    target: '[data-t="item-prices"]', placement: 'bottom', setup: () => nav(F('item', 'DEMO-CMP-15')),
  },
  itemTax: {
    chapter: 'VAT setup', title: 'VAT is tied to the item',
    body: 'Each item carries two <b>Item Tax Templates</b>: <b>VAT 5% Sales - INFY</b> (posts to 2320 Output VAT 5%) for sales, and <b>VAT 5% Purchase - INFY</b> (1510 Input VAT 5%) for purchases from suppliers in the Purchase VAT tax category.',
    why: 'Nobody types a VAT rate on an invoice: it follows the item, so it is always right.',
    target: '[data-t="item-tax"]', placement: 'top', setup: () => nav(F('item', 'DEMO-CMP-15')),
  },
  taxTemplates: {
    chapter: 'VAT setup', title: 'Default VAT templates',
    body: 'The default sales template <b>Oman VAT 5% - INFY</b> and the default purchase template <b>Oman VAT 5% Input - INFY</b> are added to every new document automatically. Imports use the reverse-charge template.',
    target: '[data-t="list-table"]', placement: 'bottom', setup: () => nav('/erp/list/taxes-template'),
  },
  invoiceVat: {
    chapter: 'VAT', title: 'VAT calculated on the invoice',
    body: 'On the invoice each line shows its item tax template, and the totals show the default template and the VAT: <b>OMR 360.000</b> on a net of OMR 7,200.000, posted to 2320 Output VAT 5%.',
    target: '[data-t="totals"]', placement: 'top', setup: () => nav(F('sales-invoice', 'INFY-SINV-2026-00001')),
  },
  vatRecon: {
    chapter: 'VAT', title: 'VAT Reconciliation: invoices against the ledger',
    body: 'Every invoice’s output, input and reverse-charge VAT, totalled and compared with the ledgers: output <b>3,399.100</b> (2320), input <b>6,710.080</b> (1510), reverse charge <b>2,147.530</b> (2330). The difference is <b>0.000</b>. Net VAT is <b>−1,163.450</b>, a refund position, because of the input VAT on assets and imports.',
    target: '[data-t="vat-gl"]', placement: 'bottom', setup: () => nav('/erp/report/vat-recon'),
  },
  vatMonth: {
    chapter: 'VAT', title: 'VAT Summary by Month',
    body: 'The same figures per month, beside the ledger balances, ready for the monthly VAT return. October and November both reconcile to the GL with no difference.',
    target: '[data-t="vat-month-table"]', placement: 'bottom', setup: () => nav('/erp/report/vat-month'),
  },
  lcaAll: {
    chapter: 'Landed cost', title: 'Landed Cost Analysis for all receipts',
    body: 'For every imported receipt line: purchase value, landed cost added, the new value and the unit cost before and after. In total <b>OMR 4,220.030</b> of freight, insurance, duty and clearing was added to stock. Filter by receipt, voucher or item.',
    target: '[data-t="lca-total"]', placement: 'top', setup: () => nav('/erp/report/lca'),
  },
  apAgeing: {
    chapter: 'Ageing', title: 'Payables ageing',
    body: `What you owe, ${omr(FIN.payable)} in total, aged by posting date with the same 30 / 40 / 120 ranges: <b>OMR 39,086.100</b> is 0-30 days, 3,780.000 is 31-40 and 178.000 is 41-120. Each bill shows its age in days.`,
    target: '[data-t="ap-kpis"]', placement: 'bottom', setup: () => nav('/erp/report/ap'),
  },
  stockAgeing: {
    chapter: 'Ageing', title: 'Stock ageing',
    body: 'How long stock has been on the shelf, item by item, in 0-30 / 31-60 / 61-90 / 90+ day bands, with quantity and value in each band and the average age.',
    why: 'Slow-moving stock ties up cash. This shows where.',
    target: '[data-t="stock-ageing-kpis"]', placement: 'bottom', setup: () => nav('/erp/report/stock-ageing'),
  },

  /* ---------- Manufacturing ---------- */
  mfgWelcome: {
    chapter: 'Welcome', title: 'Manufacturing a compressor package',
    body: 'Infy Demo Company also builds a product: the <b>Demo Compressor Package 15 HP</b>, a compressor and motor mounted on a skid with piping and a service kit. Follow it from the bill of materials to the sale.',
    target: '[data-t="ws-flow"]', placement: 'bottom', setup: () => nav('/erp/ws/manufacturing'),
  },
  bomItems: {
    chapter: 'BOM', title: 'The bill of materials',
    body: 'BOM-DEMO-PKG-15-001 lists what goes into one package: the 15 HP compressor, a 15 kW motor, a service kit, a steel skid and a piping set, at their current valuation rates: <b>OMR 3,135.920</b> of materials.',
    target: '[data-t="bom-items"]', placement: 'top', setup: () => nav(F('bom', 'BOM-DEMO-PKG-15-001')),
  },
  bomCost: {
    chapter: 'BOM', title: 'Product cost, including labour time',
    body: 'Assembly (6 hours) and the run test (2 hours) at the workstation rate add <b>OMR 96.000</b>, so one package costs <b>OMR 3,231.920</b> to build. It sells at OMR 4,250.000.',
    why: 'You know the margin on a product before you build it.',
    target: '[data-t="bom-cost"]', placement: 'top', setup: () => nav(F('bom', 'BOM-DEMO-PKG-15-001')),
  },
  workstation: {
    chapter: 'Setup', title: 'Workstation hour rate',
    body: 'The <b>Demo Assembly and Test Bay</b> costs <b>OMR 12.000 an hour</b>: labour 9, electricity 2, consumables 0.5 and rent 0.5. Every operation done here is costed at this rate.',
    target: '[data-t="ws-rate"]', placement: 'bottom', setup: () => nav(F('workstation', 'Demo Assembly and Test Bay')),
  },
  routing: {
    chapter: 'Setup', title: 'Routing: the steps to build it',
    body: 'The routing sets the sequence: <b>Skid Assembly</b> (360 minutes) then <b>Run Test</b> (120 minutes, load run, leak check, pressure and temperature readings). OMR 96.000 of operating cost per package.',
    target: '[data-t="routing-ops"]', placement: 'bottom', setup: () => nav(F('routing', 'Demo Compressor Package Routing')),
  },
  workOrder: {
    chapter: 'Production', title: 'Work order: build 2 packages',
    body: 'Work order INFY-WO-2026-00001 builds 2 packages from the BOM. It tracks material transferred (2 of 2) and quantity manufactured (2 of 2): <b>Completed</b>.',
    target: '[data-t="wo-progress"]', placement: 'bottom', setup: () => nav(F('work-order', 'INFY-WO-2026-00001')),
  },
  materialTransfer: {
    chapter: 'Production', title: 'Materials move to work in progress',
    body: 'Stock entry INFY-STE-2026-00004 moves the components for 2 packages from Stores to the Work In Progress warehouse: <b>OMR 6,535.898</b> of stock, at each item’s actual valuation.',
    target: '[data-t="ste-items"]', placement: 'top', setup: () => nav(F('stock-entry', 'INFY-STE-2026-00004')),
  },
  jobCards: {
    chapter: 'Production', title: 'Job cards on the shop floor',
    body: 'One job card per operation records the actual time: Skid Assembly 720 minutes and Run Test 240 minutes for the 2 packages. The second work order, INFY-WO-2026-00002, has its materials transferred and its job cards open.',
    target: '[data-t="wo-ops"]', placement: 'top', setup: () => nav(F('work-order', 'INFY-WO-2026-00001')),
  },
  manufacture: {
    chapter: 'Production', title: 'Finished goods into stock',
    body: 'The Manufacture entry INFY-STE-2026-00005 consumes the components (OMR 6,535.898) and adds the operating cost (OMR 192.000). The 2 packages enter Finished Goods at <b>OMR 3,363.949 each</b>.',
    why: 'Product cost is calculated from real material values and real time, not a guess.',
    target: '[data-t="ste-fg"]', placement: 'top', setup: () => nav(F('stock-entry', 'INFY-STE-2026-00005')),
  },
  packageSale: {
    chapter: 'Sales', title: 'Selling the package',
    body: 'Both packages are sold at the standard price of OMR 4,250.000 + VAT: INFY-SINV-2026-00036 to Demo Industries SAOC and INFY-SINV-2026-00037 to XYZ Engineering LLC (<b>OMR 4,462.500</b> each).',
    target: '[data-t="items"]', placement: 'top', setup: () => nav(F('sales-invoice', 'INFY-SINV-2026-00037')),
  },
  packageEinv: {
    chapter: 'Sales', title: 'E-invoiced like every sale',
    body: 'The package invoice was e-invoiced automatically: status <b>Delivered</b>, with its UUID stored on the invoice.',
    target: '[data-t="einvoice"]', placement: 'bottom', setup: () => nav(F('sales-invoice', 'INFY-SINV-2026-00037')),
  },

  /* ---------- Full demo extras ---------- */
  fullWelcome: {
    chapter: 'Welcome', title: 'Infinity ERP: the 12-minute tour',
    body: 'Infy Demo Company trades and services compressors, motors, pumps and generators in Oman. In the next few minutes: selling with e-invoicing, fixing an e-invoice error, an import with landed cost, building a product, a repair job, the finance reports and fixed assets.',
    target: '[data-t="kpis"]', placement: 'bottom', setup: () => nav('/erp/home'),
  },
  fullEnd: {
    chapter: 'Wrap-up', title: 'That is Infinity ERP',
    body: 'One system for selling, buying, imports, stock, manufacturing, service and accounts, with Oman e-invoicing built in. Open the <b>Guided tours</b> button any time to go deeper into one area.',
    setup: () => nav('/erp/home'),
  },
};

Tour.define('sales', { title: 'Sales & e-invoicing', minutes: 6 }, [
  STEP.salesWelcome, STEP.opportunity, STEP.quotation, STEP.salesOrder, STEP.deliveryNote, STEP.invoiceTotals, STEP.einvoice,
  STEP.payment, STEP.creditNote, STEP.homeEinv, STEP.fail28, STEP.fix28, STEP.fail29, STEP.fix29cust, STEP.fix29,
]);
Tour.define('purchase', { title: 'Purchase & import', minutes: 6 }, [
  STEP.buyWelcome, STEP.mr, STEP.rfq, STEP.po, STEP.pr, STEP.pinv, STEP.importPo, STEP.importInv, STEP.importFx,
  STEP.importCharges, STEP.lcvImpact, STEP.stockRow, STEP.apReport,
]);
Tour.define('service', { title: 'Service & repair', minutes: 4 }, [
  STEP.svcWelcome, STEP.motorSold, STEP.complaint, STEP.visit, STEP.journey, STEP.repairInv, STEP.claimClosed,
  STEP.freeWarranty, STEP.rewind, STEP.openClaims, STEP.openClaim, STEP.svcEinv,
]);
Tour.define('accounts', { title: 'Accounts & reports', minutes: 7 }, [
  STEP.accWelcome, STEP.coa, STEP.pl, STEP.plNet, STEP.bs, STEP.gl, STEP.ar, STEP.apReport, STEP.stock,
  STEP.assetCats, STEP.assetSchedule, STEP.cwipBills, STEP.assetCap, STEP.assetRegister, STEP.accWrap,
]);
Tour.define('full', { title: 'Full demo', minutes: 12 }, [
  STEP.fullWelcome, STEP.salesWelcome, STEP.einvoice, STEP.fail29, STEP.fix29,
  STEP.importInv, STEP.lcvImpact, STEP.bomCost, STEP.manufacture, STEP.complaint, STEP.repairInv, STEP.pl, STEP.bs, STEP.assetCap, STEP.fullEnd,
]);
Tour.define('vat', { title: 'VAT, landed cost & ageing', minutes: 6 }, [
  STEP.vatWelcome, STEP.itemPrice, STEP.itemTax, STEP.taxTemplates, STEP.invoiceVat, STEP.vatRecon, STEP.vatMonth,
  STEP.lcaAll, STEP.ar, STEP.apAgeing, STEP.stockAgeing,
]);
Tour.define('mfg', { title: 'Manufacturing', minutes: 5 }, [
  STEP.mfgWelcome, STEP.bomItems, STEP.bomCost, STEP.workstation, STEP.routing, STEP.workOrder, STEP.materialTransfer,
  STEP.jobCards, STEP.manufacture, STEP.packageSale, STEP.packageEinv,
]);

Tour.mount();
