# Oman Gulf Company S.A.O.C — Central Hub E-Invoicing Mock (design)
**Date:** 2026-11-08
**Prospect:** Oman Gulf Company S.A.O.C. No official website found. Sources are the Zawya profile (https://www.zawya.com/company/5000833868/oman-gulf) and a Gludo directory entry. See `docs/specs/2026-11-08-oman-gulf-s-a-research.md`.
**Purpose:** show a civil-engineering, earthmoving and transport contractor that serves oil and gas operators how its six invoice streams reach the OTA through one Fawtara pipe. The streams are measured works, plant and transport hire, corrections, advances and retention, subcontractors, and imported services. Where a treatment is still open, the mock brings a recommended position marked "to confirm with OTA".
**Base template:** clone `mec-mock` → new `oman-gulf-s-a-mock/`

---

## 1. Scope (decided)

- **One legal entity: one VATIN, one Commercial Registration, no VAT group.** This is a
  **fallback default, not a confirmed shape.** The research brief rates it medium-low
  confidence. All of it rests on one thin directory profile, and no group evidence turned up.
  Not finding a group does not prove there is none (see §7). No `portal/` surface.
- **Three sites are one entity.** Zawya lists a regional office in Salalah, a workshop in
  Thumrait and a facility in Ghala, Muscat. The mock treats them as **sites or cost centres of
  one seller**, not as separate legal entities or Peppol participants. They appear only as a
  "Site" tag on invoices and logs.
- **No B2C.** All three sources show a contractor whose customers are businesses (oil and gas
  operators). Every outbound document is a B2B tax invoice or a credit/debit note. *Assumption,
  to confirm:* no walk-in or retail sales, so no consumer stream and no batch reporting. If
  Oman Gulf does sell to individuals (for example aggregate or water-tanker sales), a B2C
  stream would need to be added.
- **No export stream.** Nothing in the brief suggests customers outside Oman, so none is
  invented. `mec-mock`'s `hub/export.html` is repurposed (see §4).
- **Every outbound document is validated by the ASP, with asynchronous outcomes on three legs.**
  No screen may say the OTA clears or rejects an invoice. The ASP validates and may reject, and
  the ASP reports the Tax Data Document to the OTA.
- **The ERP is unknown and nothing is public.** The origin surface stays generic, labelled
  "Oman Gulf finance system". No vendor product is named and no surface skin is added.
- **Counterparties are fictional.** The real operators on Zawya's client list (PDO, Japex
  Oman, "Philips Petroleum 66" as Zawya spells it, ELF, ARCO Oman) are **never** used as
  invoice counterparties. The list is dated and unconfirmed as current, and naming a real
  operator as a buyer would imply a relationship we cannot support. They appear only in
  `OMAN-GULF-REAL-FACTS.md`, quoted as "Zawya lists…".
- Out of scope: any second legal entity, export, B2C, commercial figures, retention periods,
  SLAs, data-residency claims, and any named ERP product.

## 2. The story this mock tells

> A contractor working on oil and gas concessions does not send one kind of invoice. Measured
> earthworks are billed on interim payment certificates. Plant and trucks are hired out by the
> hour from log sheets. Re-measurement produces credit and debit notes. A mobilisation advance
> is recovered and retention is held back on every certificate. On the buying side, fuel,
> spares and haulage subcontractors invoice in, and the occasional foreign service falls under
> the reverse charge. One pipe to the OTA carries all six. The hard parts are certificate
> timing, advance recovery and retention, and Fawtara brings a recommended reading on each,
> marked "to confirm with OTA".

Why this prospect is a reasonable hub case, even as a single entity:
- **Several document shapes.** Quantity-based certificates, hour-based hire invoices,
  corrections and inbound documents all need different mapping.
- **Settlement maths that must reconcile.** Advance recovery and retention change what is
  payable without changing the taxable amount. That is easy to get wrong in a spreadsheet-led
  process and easy to show correctly in a hub.
- **Demanding buyers.** Oil and gas operators usually require their own PO, contract and
  service-entry references on supplier invoices. The mock shows those references carried into
  PINT-OM fields. This is a generic industry pattern, not a confirmed Oman Gulf fact. It is
  phrased as a discovery question.

The walkthrough follows one interim payment certificate invoice end to end. It then covers
hire and corrections, the two open treatments, the inbound side, and the platform.

## 3. Entity roster

Single entity, so this is a profile rather than a roster table.

**Confirmed (single-sourced, from Zawya unless noted).** Oman Gulf Company S.A.O.C. is an
Oman-incorporated civil-engineering, earthmoving and transport-works contractor. Zawya puts it
in the energy / fossil fuels sector, which fits a contractor serving oil and gas operators.
Zawya lists a regional office in Salalah, a workshop in Thumrait, a facility in Ghala (Muscat)
and P.O. Box 223. Gludo lists it as a construction company in Zufar with a Salalah address.
Zawya gives an incorporation date of 1974-01-01, which looks like a placeholder; the year is
approximate at best.

**Not known, all illustrative in the mock.** VATIN, CR number, registered address and postcode,
which site is the head office, owners and any subsidiaries, headcount, fleet size, active
contracts, current customers, ERP, integration method, invoice volumes, people and email
addresses. The mock must show these as invented values, never as discovered facts.

## 4. What we build

**Why the base is `mec-mock` and not the skill default `vodafone-mock`.** Both are single-entity
mocks with `origin/` + `hub/` and no `portal/`. `vodafone-mock` is built around B2C postpaid and
prepaid batches, which a civil contractor does not have. `mec-mock` is B2B only, sends each
document individually, and already has the screens this story needs: a contract with milestones
or certificates, a variation order, an advance recovered as a prepaid amount (BT-113), retention
held as a payment term, credit/debit notes, inbound subcontractors and a reverse-charge stream.
It also already uses the corrected asynchronous-ASP wording, has no data-residency claim, and
has a 16-step, 5-act walkthrough with mapping, ASP legs and a delivery-boundary screen. The cost
is engineering-consultancy vocabulary (manhours, timesheets, FEED, PMC, owner's engineer, and
MEC's contract and customer names), which `CLONE_DRIFT` must catch.

### The six streams (the spine of this mock)

All six are **inferred** from the Zawya activity description (civil, earthmoving, transport) and
from common contracting practice. None of them has been observed.

| # | Stream | Role | Shape | Mode | OTA position |
|---|--------|------|-------|------|--------------|
| 1 | Measured works · interim payment certificates (earthworks, roads, pads) | Seller | Re-measured BOQ quantities (m³, m) plus variations | Per document · async outcome | Settled (certificate timing: to confirm) |
| 2 | Plant, equipment and transport hire (with operator) | Seller | Hours or days from signed log sheets, monthly | Per document · async outcome | Settled |
| 3 | Credit and debit notes · re-measurement, rate disputes | Seller | References the original invoice (BT-25) | Per document · async outcome | Settled |
| 4 | Mobilisation advance and retention release | Seller | Advance invoice up front, recovered per certificate; retention released at completion | Per document · async outcome | To confirm |
| 5 | Subcontractors and suppliers in Oman (fuel, spares, haulage) | Buyer | Peppol inbound → finance-system draft | Inbound, never auto-posted | Settled |
| 6 | Imported services · reverse charge (e.g. foreign OEM technical support) | Buyer | Foreign PDF → self-accounted draft | Captured, not sent | To confirm |

### The four OTA positions (each rendered "Fawtara's reading — to confirm with OTA")

1. **When to invoice a certificate.** The certificate approved by the customer's engineer
   triggers the invoice. The tax point is not the date the work was physically done. The
   e-invoice carries the certificate reference and period.
2. **Advance and retention.** VAT is due on the mobilisation advance when it is invoiced or
   received. Each certificate recovers part of the advance as a prepaid amount (BT-113), so it
   is not taxed twice. Retention is a payment term on the full certified value and does not
   reduce the taxable amount. Releasing retention does not create a new tax point. *(Same
   reading as `mec-mock`.)*
3. **Supplies to oil and gas operators.** Standard rate by default. If a customer claims any
   relief under its own concession or contract, the hub holds the document until the evidence
   is attached and archived. The mock does **not** say any such relief exists. It shows the
   control and asks the question.
4. **Imported services.** The hub records the foreign PDF, calculates reverse-charge VAT and
   lands a flagged draft. A self-billed e-document is built only if the OTA requires one.
   *(Same reading as `mec-mock`.)*

### File-by-file plan

- **`assets/js/data.js`**: rewrite the entity block (`OGC`, legal name "Oman Gulf Company
  S.A.O.C", sector "Civil engineering, earthmoving & transport works", sites Salalah / Thumrait /
  Ghala). Also rewrite `STREAMS` (six above), `OTA_POSITIONS` (four above), `CONTRACT` (fictional
  measured-works contract, IPC basis, VO-02), `SETTLEMENT` (see §5), `HIRE` (replaces
  `TIMESHEETS`: monthly hire cycle, equipment classes, log sheets held back),
  `CUSTOMERS`/`SUPPLIERS` (fictional), `INVOICES`, `INBOUND`, `ERP_INVOICES`, `REPORT_ROWS`,
  `HISTORY`, `LOGS`. Change `ERP_SCHEMA`/`MAPPING` from consultancy fields to contractor fields:
  certificate number, BOQ item, measured quantity and unit, rate, site, customer PO / contract /
  service-entry reference. Keep `STAGES`, `LEGS`, `VALIDATION` and `ASP` structurally, and
  rebrand them.
- **`assets/js/shell.js`** + **`index.html`**: BRAND/NAV/ENV changed to Oman Gulf; ACTS and
  WALKTHROUGH rewritten to the 16 steps below; the index scope line reads "single entity · six
  streams · 16 steps". The NAV group "Project billing" becomes "Contract billing".
- **`origin/billing.html`**: the IPC-07 invoice raised from the certificate, plus the contract
  certificate ledger. Replaces milestone invoicing.
- **`origin/hire.html`** (**new, replaces `origin/timesheets.html`**): the monthly hire cycle
  from signed log sheets, sorted by equipment class and site, with log sheets held back for
  missing customer signatures. They are never auto-invoiced.
- **`origin/sync.html`**: the outcome written back into the finance system.
- **`hub/adjustments.html`**: a re-measurement credit note and a rate-escalation debit note,
  each referencing its original.
- **`hub/operators.html`** (**new, replaces `hub/export.html`**): operator invoicing
  requirements (PO, contract and service-entry references mapped to PINT-OM fields) plus OTA
  position 3 (claimed relief held for evidence). Remove the export content entirely.
- **`hub/retention.html`**: keep the screen, labelled "Retention money" so it cannot be read as
  data retention. Re-populate it with the mobilisation advance, recovery schedule and retention
  ledger (OTA position 2).
- **`hub/inbound.html`**: fuel, spares and haulage subcontractor invoices over Peppol, plus the
  reverse-charge capture (streams 5–6, OTA position 4).
- Remaining hub screens rebranded and re-populated: `login, dashboard, mapping, queue, document,
  asp, history, reports, boundary, value`. `hub/value.html` must not claim data residency. It
  should say "where invoice data and the archive are held is agreed during solution design".
- **Docs:** `README.md`, `PRESENTER-SCRIPT.md`, `GAP-REGISTER.md`, `OMAN-GULF-QUESTIONS.md`,
  `OMAN-GULF-REAL-FACTS.md` (following the MEC-REAL-FACTS pattern; it records the Zawya and
  Gludo facts with URLs and the "single-sourced" caveat). No `-REAL-ENTITIES.md`, because this
  is a single entity.
- **Root `Dockerfile`:** add exactly one line,
  `COPY oman-gulf-s-a-mock/ /usr/share/nginx/html/oman-gulf-s-a-mock/`.
- **`tools/verify.py`** retargeted:
  - `CLONE_DRIFT`: `Muscat Engineering Consultancy`, `\bMEC\b`, `MEC-INV`, `manhour`,
    `timesheet`, `FEED`, `PMC`, `owner's engineer`, `Ghaba North`, `Duqm desalination`,
    `Duqm Water`, `C-2025-118`, `VO-03`, `consultancy`, `export of services`. Also keep the
    inherited IGC terms (`nomination`, `take-or-pay`, `MMBtu`).
  - `REAL_COMPANIES`: `Petroleum Development Oman`, `\bPDO\b`, `Japex`, `Phillips`, `Philips
    Petroleum`, `\bELF\b`, `ARCO`. Also add the look-alike names the brief warns about: `Oman Oil
    Company`, `Oman Gas Company`, `Oman Oil Marketing`, `Gulf Agency Company`, `\bOQ\b`. None
    may appear on any screen.
  - Tracked-invoice ID set to `OGC-INV-2026-00417`. Keep the bans on wording that says the OTA
    clears or rejects invoices, and on data-residency claims.

### The 16 steps (5 acts)

| # | Step id | Surface | Label |
|---|---------|---------|-------|
| | **Act I · Opening** | | |
| 1 | `hub-login` | hub | Signing in to the console |
| 2 | `hub-dashboard` | hub | Six streams on one screen |
| | **Act II · One certificate, end to end** | | |
| 3 | `erp-billing` | origin | An interim payment certificate becomes an invoice |
| 4 | `hub-mapping` | hub | Mapping finance-system fields to PINT-OM (interactive) |
| 5 | `hub-queue` | hub | Validated, sent to the ASP, reported |
| 6 | `hub-document` | hub | The validated e-invoice, with QR information |
| 7 | `hub-asp` | hub | Three acknowledgements back |
| | **Act III · Hire and corrections** | | |
| 8 | `erp-hire` | origin | Plant and transport hire from signed log sheets |
| 9 | `hub-adjustments` | hub | Re-measurement credit and debit notes |
| | **Act IV · The open questions** | | |
| 10 | `hub-operators` | hub | Invoicing oil and gas operators |
| 11 | `hub-retention` | hub | Mobilisation advance and retention money |
| | **Act V · The other direction and the platform** | | |
| 12 | `hub-inbound` | hub | Subcontractor invoices in, and the reverse charge |
| 13 | `hub-reports` | hub | Reports and reconciliation |
| 14 | `hub-boundary` | hub | Who does what, and what we need from Oman Gulf |
| 15 | `hub-value` | hub | Why Fawtara |
| 16 | `erp-sync` | origin | The answer, back on the invoice |

`hub-history` stays reachable from NAV but is not a walkthrough step, as in `mec-mock`.

## 5. Data-model notes

- **Identity, single entity.** One VATIN (BT-31, `OM` + 10 digits, **illustrative**), one CR
  (IBT-029, scheme `CR`, **illustrative**) and one Peppol participant `0248:OM<VATIN>`. The exact
  Oman scheme is to be confirmed on the OTA onboarding portal. The three sites are not separate
  identities.
- **Seller address.** The street, building and postcode are invented and labelled illustrative.
  Which site is the registered address is unknown, so the mock does not imply it. The city shown
  on the seller block is an assumption recorded in the gap register. P.O. Box 223 comes from
  Zawya and can only appear as such in `OMAN-GULF-REAL-FACTS.md`. The scaffolder may reuse it on
  screen only if the seller block is labelled illustrative.
- **Tracked invoice `OGC-INV-2026-00417`** (all illustrative). Contract `OGC-C-2025-014`, a
  fictional earthworks and graded access road contract for a fictional operator, "Rimal Upstream
  Operating Company LLC". The scaffolder must check that this name does not match a real Omani
  company and swap it if it does. Certificate **IPC-07**, site Salalah region.
  - Bulk excavation and cut-to-fill, 18,400 m³ (`MTQ`) × OMR 2.850 = 52,440.000
  - Graded access road, sub-base, 6,200 m (`MTR`) × OMR 4.400 = 27,280.000
  - Variation VO-02, culvert crossing, 1 lump sum (`C62`) = 9,860.000
  - **Net 89,580.000 · VAT 5% 4,479.000 · Total 94,059.000**
- **Settlement (must agree on billing, document, retention, sync and reports screens).**
  - Mobilisation advance recovery on IPC-07: 20% of net = 17,916.000 + VAT 895.800 =
    **18,811.800** → BT-113 prepaid amount.
  - BT-115 payable on the e-invoice: 94,059.000 − 18,811.800 = **75,247.200**.
  - Retention 10% of net = **8,958.000**, held as a payment term, not a reduction of the
    taxable amount.
  - Cash due now: 75,247.200 − 8,958.000 = **66,289.200**.
  - The figures were chosen so that no two settlement amounts are equal. That avoids the MEC
    problem where retention equalled VAT and read as one number shown twice.
- **Units.** Measured works use `MTQ`/`MTR`, hire uses `HUR` (hours) or `DAY`, lump sums use
  `C62`. BTOM-019 = services for all outbound streams. The contract reference goes in BT-12, the
  customer PO in BT-13, and the certificate number and period in BT-14 / the invoice period.
- **Hire cycle (illustrative).** October 2026 cycle, about 20 hire customers, a few log sheets
  held for missing customer signatures. Equipment classes are excavator, dozer, grader, tipper
  and low-bed trailer. All counts are invented and labelled.
- **Demo clock.** Thursday 5 November 2026, 10:42 GST (Oman week Sun–Thu).
- **Disclaimer.** Use the zubair/MEC pattern: "The company name is real. Almost nothing attached
  to it is." Every VATIN, CR, customer, supplier, contract, rate, quantity, volume, person, email
  and tax treatment is illustrative.

## 6. Discovery questions
→ mirrored into `oman-gulf-s-a-mock/OMAN-GULF-QUESTIONS.md`

1. Is Oman Gulf Company S.A.O.C still trading under this name, and who are its current main
   customers? The public client list (PDO, Japex, Phillips, ELF, ARCO) looks dated.
2. Is it one legal entity? Does it have a parent, subsidiaries or sister companies, and is it in,
   or planning to join, an Oman VAT group?
3. What are its TRN/VATIN, CR number and registered address? Which site is the head office?
4. Which ERP or finance system does it run (product, version, on-premise or cloud), and could it
   expose an API (Method 1), host an on-site agent (Method 2) or export files (Method 3)?
5. How are works billed: re-measured interim certificates, milestones, lump sum, or a mix? Who
   approves the certificate, and how long after measurement is the invoice raised?
6. Does it hire out plant, equipment or transport separately, with or without operators, and how
   is usage recorded (log sheets, telematics)?
7. Are mobilisation advances and retention standard terms? At what rates, and how are they
   currently shown on invoices?
8. What do the operator customers require on supplier invoices (PO, contract, service-entry
   numbers, their own portals)? Does any customer claim VAT relief under its concession or
   contract?
9. Roughly how many invoices a month go out and come in, split by type?
10. Does it sell anything to individuals (aggregate, water, scrap), which would create a B2C
    stream?
11. Does it buy services from abroad (OEM support, software, consultants) that fall under the
    reverse charge?
12. Who in finance and IT would own the e-invoicing rollout?

## 7. Open item for approval

Everything above is a checkpoint before building. Points for a human to check:

- **The single-entity shape is a low-confidence fallback, not a confirmed fact.** The research
  brief rates it medium-low. It rests on one thin directory profile, no ERP signal, no group
  evidence and a dated client list. Not finding a group does not prove there is none. If Oman
  Gulf turns out to sit in a group or VAT group, the base template changes to `zubair-mock` /
  `rah-mock` and a `portal/` is needed. That would be a rebuild, not an edit.
- **The company may not be active under this name.** The client list names companies that have
  since been renamed, merged or left Oman. Confirm the prospect is current before investing in
  the build or presenting.
- **The base template differs from the skill default.** A single entity would normally clone
  `vodafone-mock`. This spec clones `mec-mock`, as `peniel-mock` did, because Oman Gulf has no
  B2C and its billing (certificates, variations, advance, retention) matches MEC's structure.
  This is a deliberate choice, not caused by low confidence.
- **All six streams are inferred** from three words of activity description (civil, earthmoving,
  transport) and general contracting practice. Plant hire (stream 2) and imported services
  (stream 6) are the least supported. Remove them if discovery says otherwise.
- **All figures are illustrative assumptions:** ERP, integration method (Method 1 shown by
  default), VATIN, CR, address, volumes, advance and retention rates, and contract terms.
- **Real operator names are deliberately excluded** from screens. Counterparties are fictional,
  and the scaffolder must confirm the invented operator name does not collide with a real
  company.
- **OTA positions 1 and 3** (certificate timing, relief claimed by operators) are new to this
  mock and not carried over from a reviewed precedent. They are hedged ("to confirm with OTA")
  but deserve a tax-aware read before the demo.
