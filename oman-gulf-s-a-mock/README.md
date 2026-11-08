# Oman Gulf Company S.A.O.C × Fawtara — E-Invoicing Scope Walkthrough

A demonstration prototype for an Oman Gulf alignment session. Oman Gulf is modelled as **one
legal entity** (one VATIN, one Commercial Registration, no VAT group): a civil-engineering,
earthmoving and transport-works contractor. It is shown raising and receiving invoices in **six
different ways**, all reaching the Oman Tax Authority (OTA) through one pipe, with **Fawtara as
the Accredited Service Provider (ASP)**.

It is a **discovery / alignment tool**, not a finished compliant flow. Where the OTA has not
settled a treatment (when a certificate triggers the invoice, mobilisation advance and retention,
relief claimed by an operator, imported services under the reverse charge) the mock shows
**Fawtara's recommended reading, always flagged "to confirm with OTA"**.

Served at `/oman-gulf-s-a-mock/`. Static HTML/CSS/JS, no build step. Structurally cloned from `mec-mock`.

## Confirmed versus assumed

**Confirmed (single-sourced, public directories — see `OMAN-GULF-REAL-FACTS.md`):** the legal
name; an Oman-incorporated civil-engineering, earthmoving and transport-works contractor in the
energy sector; a regional office in Salalah, a workshop in Thumrait and a facility in Ghala, Muscat.

**Assumed (all of the rest):** the single-entity shape (research confidence medium-low), the six
streams (inferred from three words of activity description plus common contracting practice;
none observed), the finance system and integration method, every identifier, customer, contract,
rate, quantity, volume and tax treatment. See `GAP-REGISTER.md`.

## The six streams (all inferred, none observed)

| # | Stream | Role | Mode | OTA position |
|---|--------|------|------|--------------|
| 1 | Measured works · interim payment certificates (earthworks, roads, pads) | Seller | Sent per document | Settled (certificate timing to confirm) |
| 2 | Plant, equipment & transport hire (with operator) | Seller | Sent per document | Settled |
| 3 | Credit & debit notes · re-measurement, rate escalation | Seller | Sent per document, references original | Settled |
| 4 | Mobilisation advance & retention release | Seller | Sent per document | To confirm |
| 5 | Subcontractors & suppliers in Oman (fuel, spares, haulage) | Buyer | Peppol inbound → finance-system draft | Settled |
| 6 | Imported services · reverse charge | Buyer | PDF → self-accounted draft | To confirm |

## Fawtara's recommended OTA positions (each "to confirm with OTA")

1. **When to invoice a certificate** — the certificate approved by the customer's engineer
   triggers the invoice; the date the work was physically done is not the tax point. The
   e-invoice carries the certificate reference and period.
2. **Advance and retention** — VAT on the mobilisation advance when invoiced or received; each
   certificate recovers part of it as a prepaid amount (BT-113) so it is not taxed twice;
   retention is a payment term on the full certified value and its release creates no new tax point.
3. **Supplies to oil and gas operators** — standard rate by default. If a customer claims relief,
   the hub holds the document until evidence is attached and archived. The mock does **not** say
   that any relief exists; it shows the control and asks the question.
4. **Imported services** — the hub records the foreign PDF, computes reverse-charge VAT and lands
   a flagged draft; a self-billed e-document only if the OTA requires one.

## Walkthrough (16 steps, 5 acts)

Generated from `WALKTHROUGH` / `ACTS` in `assets/js/shell.js`:

- **Act I · Opening:** 1. Signing in · 2. Six streams on one screen
- **Act II · One certificate, end to end:** 3. An interim payment certificate becomes an invoice
  (origin) · 4. Mapping finance-system fields to PINT-OM (interactive) · 5. Validated, sent to the
  ASP, reported · 6. The validated e-invoice, with QR information · 7. Three acknowledgements back
- **Act III · Hire and corrections:** 8. Plant and transport hire from signed log sheets (origin) ·
  9. Re-measurement credit and debit notes
- **Act IV · The open questions:** 10. Invoicing oil and gas operators · 11. Mobilisation advance
  and retention money
- **Act V · The other direction and the platform:** 12. Subcontractor invoices in, and the reverse
  charge · 13. Reports and reconciliation · 14. Who does what, and what we need from Oman Gulf ·
  15. Why Fawtara · 16. The answer, back on the invoice (origin)

`hub/history.html` stays reachable from the console but is not a guided step.

## The tracked invoice (all illustrative)

**OGC-INV-2026-00417** — contract OGC-C-2025-014 (fictional earthworks and graded access road,
fictional operator "Rimal Upstream Operating Company LLC"), certificate **IPC-07**, site Salalah region.

| Line | Quantity | Rate (OMR) | Net (OMR) |
|------|----------|-----------|-----------|
| Bulk excavation and cut-to-fill | 18,400 m³ (`MTQ`) | 2.850 | 52,440.000 |
| Graded access road, sub-base | 6,200 m (`MTR`) | 4.400 | 27,280.000 |
| Variation VO-02, culvert crossing | 1 lump sum (`C62`) | 9,860.000 | 9,860.000 |

Net **89,580.000** · VAT 5% **4,479.000** · Total **94,059.000**. It settles the same way on every
screen: advance recovery 20% of net + VAT = prepaid amount (BT-113) **18,811.800**; payable on the
e-invoice (BT-115) **75,247.200**; retention 10% of net held as a payment term **8,958.000**; cash
due now **66,289.200**. The advance and retention rates are placeholders. No two settlement
amounts are equal, so none reads as one number shown twice.

Outcomes are asynchronous: the ASP validates and may reject, the ASP reports to the OTA, and the
buyer's provider confirms delivery on a third leg. The OTA does not clear or reject invoices.

## Structure

- `index.html` — the scenario matrix (front door).
- `origin/` — Oman Gulf's finance system, shown **generically** ("finance system"; the real one is
  unknown): `billing.html`, `hire.html`, `sync.html`.
- `hub/` — the Fawtara console: `login, dashboard, queue, document, asp, mapping, adjustments,
  operators, retention, inbound, reports, boundary, value, history`.
- `assets/js/data.js` — single source of truth (entity, six streams, OTA positions, contract,
  hire cycle, pipeline, validation, ASP).
- `assets/js/shell.js` — sidebar/topbar/step-nav injector + the canonical walkthrough.
- `tools/verify.py` — static lint + Playwright browse (retargeted; run by the verifier phase).

## Verify

```
python3 tools/verify.py
```

## Honesty

The company name is real. Almost nothing attached to it is. Every VATIN, CR number, address,
customer, supplier, contract, rate, quantity, volume, person, email and tax treatment is
illustrative. The real operators named in the public directory's client list are deliberately
**not** used as counterparties. `GAP-REGISTER.md` lists what is deliberately assumed;
`OMAN-GULF-QUESTIONS.md` lists what to ask.
