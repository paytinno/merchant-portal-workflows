<!-- Generated from src/ by tools/build-docs.ps1. Edit src/workflows.js or src/model.js, not this file. -->

# MP-25 Messages and notices

[All workflows](../README.md) | Previous: [MP-24 Business details, owners and periodic review](MP-24-business-details-owners-and-periodic-review.md) | Next: [MP-26 Suspension and restricted access](MP-26-suspension-and-restricted-access.md)

One inbox for requests, notices and support. Emails carry a link, not the content.

| | |
|---|---|
| Status | v8.7, gaps closed |
| For | Every merchant |
| Area | Business |
| Source | S17; admin spec 5.3 merchant.notify templates |
| Starts when | Paytinno sends a notice; a user writes to Paytinno. |
| Object | Notice, conversation |
| Systems | Merchant (user), Portal (S3), Gateway, BFF (S18), Admin (S4), Paytinno staff (OPS), Messages (S17) |
| Portal screens | Messages, Settings |

## Sequence

```mermaid
sequenceDiagram
  autonumber
  participant MER as Merchant user
  participant S3 as Portal S3
  participant S18 as Gateway, BFF S18
  participant S4 as Admin S4
  participant OPS as Paytinno staff OPS
  participant S17 as Messages S17
  S4->>S18: Notice from a fixed template.
  S17->>MER: Email (and portal) in Bulgarian or English.
  MER->>S3: Writes to support.
  OPS->>S4: Answers from the support inbox in S4 (phase<br/>1). A help desk tool can replace it later, the<br/>portal API stays the same.
  MER->>S3: Sets which notices to get by email. Regulatory<br/>notices cannot be turned off.
```

## Steps

| # | From | To | Step | Call | Notes |
|---|---|---|---|---|---|
| 1 | Admin (S4) | Gateway, BFF (S18) | Notice from a fixed template. | `merchant.notify {template, data}` | admin spec 5.3 |
| 2 | Messages (S17) | Merchant (user) | Email (and portal) in Bulgarian or English. |  |  |
| 3 | Merchant (user) | Portal (S3) | Writes to support. | `POST /v1/messages → webhook merchant.message` |  |
| 4 | Paytinno staff (OPS) | Admin (S4) | Answers from the support inbox in S4 (phase 1). A help desk tool can replace it later; the portal API stays the same. |  | **Decided:** [MP-Q37](../open-questions.md#mp-q37) |
| 5 | Merchant (user) | Portal (S3) | Sets which notices to get by email. Regulatory notices cannot be turned off. |  |  |

## States

No states of its own.

## Rules

- Templates: welcome, application received, application rejected, RFI reminder, tariff change, acceptance suspended, acceptance reactivated, account closing, payout account verified (admin spec P5).

## Changes v8.7 needs

For the CTO's next version of the architecture.

- S4 module: add a merchant support inbox for phase 1 (MP-Q37).
- S17: emails to merchants carry a link to the portal, not the content.

## Questions

### MP-Q37

Where are support conversations handled? The admin has no case management for them.

**Decision:** A simple inbox in S4 for phase 1; a help desk tool later.

Decided, awaiting sign-off by: COO
