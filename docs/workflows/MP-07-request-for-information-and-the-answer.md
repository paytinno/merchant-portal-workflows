<!-- Generated from src/ by tools/build-docs.ps1. Edit src/workflows.js or src/model.js, not this file. -->

# MP-07 Request for information and the answer

[All workflows](../README.md) | Previous: [MP-06 Company checks, identity and screening](MP-06-company-checks-identity-and-screening.md) | Next: [MP-08 Underwriting decision and the offer](MP-08-underwriting-decision-and-the-offer.md)

Staff ask, the merchant answers in the portal with text and documents. The application status shows "We need something" while it is open.

| | |
|---|---|
| Status | v8.1 with gaps |
| Area | Onboarding |
| Source | Admin spec 5.2 rfi.send and merchant.message; not a v8.1 workflow |
| Starts when | Staff need a document or an answer, during onboarding or for a live merchant. |
| Object | RFI (S4), message thread |
| Systems | Merchant (user), Portal (S3), Gateway, BFF (S18), Admin (S4), Paytinno staff (OPS), Messages (S17) |
| Portal screens | Messages, Application |

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
  OPS->>S4: Writes the request: what is needed (item codes<br/>and plain text), due date.
  S4->>S18: Sends the request, for an application also the<br/>status INFO_REQUESTED.
  S18->>S17: Email: 'We need something from you' with a<br/>link only. The request itself is not in the<br/>email.
  MER->>S3: Opens Messages, writes an answer, attaches<br/>documents.
  S3->>S18: Sends the answer.
  S18->>S4: The answer arrives in the admin.
  OPS->>S4: Accepts it and closes the RFI, or asks again.
  S4->>S3: Status back to where it was.
  S17->>MER: Reminder 3 days before the due date.
```

## Steps

| # | From | To | Step | Call | Notes |
|---|---|---|---|---|---|
| 1 | Paytinno staff (OPS) | Admin (S4) | Writes the request: what is needed (item codes and plain text), due date. |  |  |
| 2 | Admin (S4) | Gateway, BFF (S18) | Sends the request; for an application also the status INFO_REQUESTED. | `POST /admin/v1/rfi {appId \| merchantId, text, items[], dueAt}` | admin spec 5.2 |
| 3 | Gateway, BFF (S18) | Messages (S17) | Email: "We need something from you" with a link only. The request itself is not in the email. |  | **Gap:** Proposed: no content in emails |
| 4 | Merchant (user) | Portal (S3) | Opens Messages, writes an answer, attaches documents. |  |  |
| 5 | Portal (S3) | Gateway, BFF (S18) | Sends the answer. | `POST /v1/messages {inReplyTo: rfiId, text, attachments[docRef]}` |  |
| 6 | Gateway, BFF (S18) | Admin (S4) | The answer arrives in the admin. | `webhook merchant.message` | admin spec 6 |
| 7 | Paytinno staff (OPS) | Admin (S4) | Accepts it and closes the RFI, or asks again. |  |  |
| 8 | Admin (S4) | Portal (S3) | Status back to where it was. | `application.status` |  |
| 9 | Messages (S17) | Merchant (user) | Reminder 3 days before the due date. | `merchant.notify rfi_reminder` |  |

## States

```mermaid
stateDiagram-v2
  direction LR
  state "OPEN" as s_OPEN
  state "ANSWERED" as s_ANSWERED
  state "CLOSED" as s_CLOSED
  state "OVERDUE" as s_OVERDUE
  [*] --> s_OPEN : sent
  s_OPEN --> s_ANSWERED : merchant answers
  s_ANSWERED --> s_CLOSED : staff accept
  s_ANSWERED --> s_OPEN : staff ask again
  s_OPEN --> s_OVERDUE : due date passes
```

| From | When | To |
|---|---|---|
| start | sent | OPEN |
| OPEN | merchant answers | ANSWERED |
| ANSWERED | staff accept | CLOSED |
| ANSWERED | staff ask again | OPEN |
| OPEN | due date passes | OVERDUE |

## Rules

- The merchant is told not to type ID or card numbers in messages; documents are attached as files.
- Text up to 4,000 characters.

## Open questions

### MP-Q18

What happens when an RFI is overdue?

**Proposed:** Onboarding: application paused, withdrawn after [30] days with notice. Live merchant: reminder, then a restriction decision in S4 (MP-26), never automatic.

Owner: Compliance
