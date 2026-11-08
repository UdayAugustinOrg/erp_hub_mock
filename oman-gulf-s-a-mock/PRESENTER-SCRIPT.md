# Presenter script — Oman Gulf × Fawtara (about 12 minutes)

**Before you start.** Say it up front: the company name is real, almost nothing attached to it is.
The single-entity shape, the six streams and the finance system are working assumptions we want to
confirm today. Every customer, number and treatment on screen is illustrative. Confirm Oman Gulf is
still trading under this name (the public client list looks dated) and that the invented customer
names do not match anyone real.

**Act I — opening (steps 1–2).** Sign in. On the dashboard, point at the six streams: four as
seller, two as buyer. Two are amber: the treatments we bring to the OTA. Mention the three sites
(Salalah, Thumrait, Ghala) are sites of one seller, not separate filers.

**Act II — one certificate (steps 3–7).** In the finance system the customer's engineer approves
interim payment certificate IPC-07 on contract OGC-C-2025-014; OGC-INV-2026-00417 is posted: OMR
89,580 net, including variation VO-02, OMR 94,059 total, OMR 75,247.200 payable on the e-invoice
after the advance recovered. The Mapping Studio shows how the finance-system fields point at PINT-OM,
an analyst's choice, no code; change a transform and the preview rebuilds. In the Hub it goes
through nine stages, and the document inspector shows the XML validated before sending. The ASP
exchange shows three acknowledgements coming back on their own timelines. The ASP validates; the OTA
does not clear or reject it.

**Act III — hire and corrections (steps 8–9).** October's plant and transport hire: signed log
sheets by equipment class become one invoice; a log sheet without the customer's signature is held,
never auto-invoiced. Quantities re-measured after invoicing go out as a credit note; agreed rate
escalation as a debit note, each referencing the original.

**Act IV — the open questions (steps 10–11).** Operators: the approved certificate triggers the
invoice; PO, contract and service-entry references travel in PINT-OM fields; if a customer claims
relief, the hub holds the document until evidence is attached. We do not say any relief exists; we
ask. Then mobilisation advance and retention: VAT on the full value, the advance taxed once and
recovered as a prepaid amount, retention a payment term and not on the e-invoice. Rates are
placeholders. Everything is tagged "to confirm with OTA".

**Act V — the other direction and the platform (steps 12–16).** Fuel, spares and haulage
subcontractor e-invoices land as drafts coded to the contract or cost centre; nothing is posted
automatically. A foreign manufacturer's support invoice arrives as a PDF and is self-accounted.
Reports by stream and by contract; who does what, and the questions we need answered; why Fawtara
(where data is held is agreed during solution design); finally the UUID and QR back on the original
invoice.

**Close.** Walk the discovery list in `OMAN-GULF-QUESTIONS.md`: entity and group shape first, then
the finance system, then how certificates, advance and retention work in their contracts.
