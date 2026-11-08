# Gap register — what the Oman Gulf mock assumes

Every row is an assumption or an open point. Nothing here is a discovered fact about Oman Gulf.

| # | Gap | Assumed in the mock | Confirm with |
|---|-----|---------------------|--------------|
| 1 | Entity shape | One legal entity, one VATIN, one CR, no VAT group. A fallback default; research confidence medium-low, from one thin directory profile. If a group or VAT group exists, the base template changes (rebuild, not edit) | Oman Gulf finance |
| 2 | Is the company active under this name | Assumed yes. The public client list looks dated | Oman Gulf; check before presenting |
| 3 | Sites | Salalah, Thumrait and Ghala are cost centres of one seller, shown only as a "Site" tag; not separate entities or Peppol participants | Oman Gulf finance |
| 4 | Seller city / registered address | Salalah on the seller block, an assumption. Which site is the registered address is unknown | Oman Gulf |
| 5 | Identifiers | VATIN, CR and Peppol participant are invented. Exact Oman scheme to confirm on the OTA onboarding portal | Oman Gulf, OTA |
| 6 | Finance system and integration method | Generic "finance system", Method 1 Direct API shown by default | Oman Gulf IT |
| 7 | The six streams | Inferred from "civil, earthmoving, transport" plus common practice; none observed. Plant hire (2) and imported services (6) are least supported | Oman Gulf finance |
| 8 | No B2C, no export | Assumed all customers are businesses in Oman. Aggregate, water or scrap sales to individuals would add a B2C stream | Oman Gulf finance |
| 9 | How works are billed | Re-measured interim payment certificates plus variations | Oman Gulf contracts |
| 10 | Certificate timing (position 1) | Approved certificate triggers the invoice; work date is not the tax point | OTA, Oman Gulf |
| 11 | Advance and retention rates and tax point (position 2) | Mobilisation advance recovered at 20% of each certificate; retention 10%; rates are placeholders. VAT on full certified value; retention a payment term, not on the e-invoice | OTA, Oman Gulf finance |
| 12 | Operator relief (position 3) | Standard rate by default; a hold if relief is claimed. The mock does not say any relief exists | OTA, Oman Gulf |
| 13 | Operator invoicing requirements | PO, contract and service-entry references carried in PINT-OM fields (BT-12, 13, 14, 15, 73/74). A generic industry pattern; the exact fields are to confirm against the field list | Oman Gulf customers |
| 14 | Imported services (position 4) | Reverse charge self-accounted; no e-document until OTA confirms | OTA |
| 15 | Hire billing | Hours or days from signed log sheets, monthly, with operators; log sheets without a signature are held, never auto-invoiced. Cut-off and signature timing unknown | Oman Gulf operations |
| 16 | Re-measurement and escalation | Issued as credit and debit notes referencing the original invoice, not a cancel-and-reissue | Oman Gulf finance, OTA |
| 17 | Variation orders | Billed as a line on the next certificate invoice, not a debit note | Oman Gulf finance |
| 18 | Volumes | Daily and monthly counts, the October hire cycle (about 20 customers) and the report figures are invented | Oman Gulf finance |
| 19 | Counterparty names | Customers and suppliers are invented. Checked for obvious look-alikes only, with no web access. Confirm none matches a real Omani company. Real operators from the directory are never used | Presenter, before the demo |
| 20 | Archive and data location | Not stated; agreed during solution design | Oman Gulf, Fawtara |
| 21 | Payment terms | 30 days (NT30) as a placeholder | Oman Gulf finance |
