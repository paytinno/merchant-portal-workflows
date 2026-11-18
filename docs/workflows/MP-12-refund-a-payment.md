<!-- Generated from src/ by tools/build-docs.ps1. Edit src/workflows.js or src/model.js, not this file. -->

# MP-12 Refund a payment

[All workflows](../README.md) | Previous: [MP-11 See payments and one payment](MP-11-see-payments-and-one-payment.md) | Next: [MP-29 Payment links and QR codes](MP-29-payment-links-and-qr-codes.md)

Checks before sending: refundable amount, open dispute, the user's mandate. SCA binds amount and payment. The ledger effect comes only from NC2.

| | |
|---|---|
| Status | v8.7, gaps closed |
| For | Every merchant |
| Area | Payments |
| Source | WF11 steps 15 to 17; PRD refund link to disputes |
| Starts when | A user refunds all or part of a captured payment. |
| Object | Refund (BPC), posting through NC2 |
| Systems | Merchant (user), Portal (S3), Gateway, BFF (S18), Onboarding (S6), Admin (S4), Identity, SCA (S19), BPC (S10 via A09), Core (S21, S5), Reconciliation (S13) |
| Portal screens | One payment, Refunds |

## Sequence

```mermaid
sequenceDiagram
  autonumber
  participant MER as Merchant user
  participant S3 as Portal S3
  participant S18 as Gateway, BFF S18
  participant S6 as Onboarding S6
  participant S4 as Admin S4
  participant S19 as Identity, SCA S19
  participant S10 as BPC S10 via A09
  participant S21 as Core S21, S5
  participant S13 as Reconciliation S13
  MER->>S3: Refund on the payment page: full or part, and<br/>a reason.
  S3->>S18: Asks what can be refunded.
  S18->>S4: Is there an open dispute on this payment? S4<br/>answers from its DisputeCases, matched by<br/>payment. If so, refused.
  S18->>S21: Is there enough money? Allowed up to available<br/>plus pending. Above that, refused with 'top up<br/>by transfer'.
  S18->>S6: Role and mandate. Over the person's refund<br/>limit: approval request (MP-23).
  S18->>S19: SCA bound to amount, payment ID and card last<br/>4.
  S3->>S18: Sends the refund.
  S18->>S10: Refund through A09.
  S10->>S21: Refund posting through NC2: reduces what we<br/>owe the merchant.
  S18->>S3: Refund shown as sent, then as done when BPC<br/>confirms.
  S13->>S13: Refunds reconciled against the journal.
  Note over MER,S13: Not captured yet: cancel instead
  MER->>S3: Cancel on an authorised payment. Same roles as<br/>refund, no SCA because no money leaves.
  S18->>S10: Reversal of the authorisation through A09. The<br/>card holder's hold is released.
```

## Steps

| # | From | To | Step | Call | Notes |
|---|---|---|---|---|---|
| 1 | Merchant (user) | Portal (S3) | Refund on the payment page: full or part, and a reason. |  | WF11 15 |
| 2 | Portal (S3) | Gateway, BFF (S18) | Asks what can be refunded. | `GET /v1/payments/{id}/refundable` |  |
| 3 | Gateway, BFF (S18) | Admin (S4) | Is there an open dispute on this payment? S4 answers from its DisputeCases, matched by payment. If so, refused. |  | Time: [50 ms]<br>Rule: No refund on a payment with an open dispute<br>**If it fails:** S4 does not answer: refused, try again later (never sent unchecked)<br>**Decided:** [MP-Q24](../open-questions.md#mp-q24) |
| 4 | Gateway, BFF (S18) | Core (S21, S5) | Is there enough money? Allowed up to available plus pending. Above that, refused with "top up by transfer". | `A05 / M0391` | Rule: The balance is never negative<br>**Decided:** [MP-Q25](../open-questions.md#mp-q25) |
| 5 | Gateway, BFF (S18) | Onboarding (S6) | Role and mandate. Over the person's refund limit: approval request (MP-23). |  |  |
| 6 | Gateway, BFF (S18) | Identity, SCA (S19) | SCA bound to amount, payment ID and card last 4. |  | **SCA** |
| 7 | Portal (S3) | Gateway, BFF (S18) | Sends the refund. | `POST /v1/payments/{id}/refunds {amount, reason} + Idempotency-Key` | WF11 16<br>Time: 2 s |
| 8 | Gateway, BFF (S18) | BPC (S10 via A09) | Refund through A09. | `IF45 via A09` | WF11 17<br>**If it fails:** answer lost: retry with the same key |
| 9 | BPC (S10 via A09) | Core (S21, S5) | Refund posting through NC2: reduces what we owe the merchant. |  | WF11 12 |
| 10 | Gateway, BFF (S18) | Portal (S3) | Refund shown as sent; then as done when BPC confirms. |  |  |
| 11 | Reconciliation (S13) | Reconciliation (S13) | Refunds reconciled against the journal. |  | R08 |
| | | | **Not captured yet: cancel instead** | | |
| 12 | Merchant (user) | Portal (S3) | Cancel on an authorised payment. Same roles as refund; no SCA because no money leaves. |  | **Decided:** [MP-Q26](../open-questions.md#mp-q26)<br>Added to v8.7 |
| 13 | Gateway, BFF (S18) | BPC (S10 via A09) | Reversal of the authorisation through A09. The card holder's hold is released. | `POST /v1/payments/{id}/cancel + Idempotency-Key → IF45 via A09` | **If it fails:** already captured: refused, refund instead<br>**Decided:** [MP-Q26](../open-questions.md#mp-q26) |

## States

```mermaid
stateDiagram-v2
  direction LR
  state "REQUESTED" as s_REQUESTED
  state "AWAITING_APPROVAL" as s_AWAITING_APPROVAL
  state "REFUSED" as s_REFUSED
  state "SENT" as s_SENT
  state "DONE" as s_DONE
  state "FAILED" as s_FAILED
  [*] --> s_REQUESTED : requested
  s_REQUESTED --> s_AWAITING_APPROVAL : over mandate
  s_REQUESTED --> s_REFUSED : open dispute or not enough money
  s_REQUESTED --> s_SENT : SCA done
  s_SENT --> s_DONE : BPC confirms
  s_SENT --> s_FAILED : BPC refuses
```

| From | When | To |
|---|---|---|
| start | requested | REQUESTED |
| REQUESTED | over mandate | AWAITING_APPROVAL |
| REQUESTED | open dispute or not enough money | REFUSED |
| REQUESTED | SCA done | SENT |
| SENT | BPC confirms | DONE |
| SENT | BPC refuses | FAILED |

## Rules

- Total refunds never exceed the captured amount.
- A payment not yet captured is cancelled, not refunded.
- The card holder sees the money in 5 to 10 business days (bank dependent).

## Changes v8.7 needs

For the CTO's next version of the architecture.

- WF11 15 to 17: before the A09 call, S18 checks open disputes with S4 (MP-Q24) and funds with S21 (MP-Q25). Replaces the PRD's block in "S21a".
- WF11: add cancelling an authorisation that is not captured, through A09 (MP-Q26).

## Questions

### MP-Q24

Where does the "no refund while disputed" check run? The PRD says S21a; in v8.7 portal refunds go S18 to A09 to BPC.

**Decision:** S18 asks S4 synchronously (DisputeCase by payment) before the A09 call. S4 also re-checks on every stage change (PRD).

Decided, awaiting sign-off by: CTO

### MP-Q25

What if the merchant's balance is lower than the refund?

**Decision:** Allowed up to available plus pending; above that, refused with "top up by transfer". Never a negative balance.

Decided, awaiting sign-off by: Finance

### MP-Q26

Cancelling an authorisation that is not captured is not described anywhere.

**Decision:** A "Cancel" action on authorised payments through A09, same rights as refund, no SCA (no money leaves).

Decided, awaiting sign-off by: CTO
