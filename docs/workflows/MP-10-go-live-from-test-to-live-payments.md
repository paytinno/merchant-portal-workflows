<!-- Generated from src/ by tools/build-docs.ps1. Edit src/workflows.js or src/model.js, not this file. -->

# MP-10 Go live: from test to live payments

[All workflows](../README.md) | Previous: [MP-09 Deposit, set-up and activation](MP-09-deposit-set-up-and-activation.md) | Next: [MP-11 See payments and one payment](MP-11-see-payments-and-one-payment.md)

The developer proves the integration with test cards; staff check the website; then live keys are issued.

| | |
|---|---|
| Status | Proposed |
| For | Every merchant |
| Area | Onboarding |
| Source | WF02b 17 ("sandbox first"); module spec v7.1 sandbox with test cards |
| Starts when | The merchant is active and wants live keys, or a new website is added. |
| Object | Go-live checklist |
| Systems | Merchant (user), Portal (S3), Gateway, BFF (S18), BPC (S10 via A09), Admin (S4), Paytinno staff (OPS) |
| Portal screens | Developers, Home |

## Sequence

```mermaid
sequenceDiagram
  autonumber
  participant MER as Merchant user
  participant S3 as Portal S3
  participant S18 as Gateway, BFF S18
  participant S10 as BPC S10 via A09
  participant S4 as Admin S4
  participant OPS as Paytinno staff OPS
  S18->>S10: Test keys for the BPC sandbox, issued at<br/>activation.
  MER->>S10: The developer runs payments with test cards:<br/>success, decline, 3-D Secure challenge,<br/>refund, webhook.
  S3->>S18: The checklist ticks itself from test data.
  MER->>S3: Admin asks for live.
  S18->>S4: Go-live request.
  OPS->>S4: Website check: terms, refund policy, prices in<br/>EUR, contact details, card logos, what is sold<br/>matches the MCC.
  S4->>S18: Approved: live keys can be created (MP-20).<br/>Rejected: what to fix, as an RFI.
  S3->>MER: First live payment is marked on Home.
```

## Steps

| # | From | To | Step | Call | Notes |
|---|---|---|---|---|---|
| 1 | Gateway, BFF (S18) | BPC (S10 via A09) | Test keys for the BPC sandbox, issued at activation. |  | **Open gap:** Does BPC give a sandbox per merchant? (CTO question 21, MP-Q21) |
| 2 | Merchant (user) | BPC (S10 via A09) | The developer runs payments with test cards: success, decline, 3-D Secure challenge, refund, webhook. |  |  |
| 3 | Portal (S3) | Gateway, BFF (S18) | The checklist ticks itself from test data. | `GET /v1/golive/checklist` |  |
| 4 | Merchant (user) | Portal (S3) | Admin asks for live. |  |  |
| 5 | Gateway, BFF (S18) | Admin (S4) | Go-live request. |  |  |
| 6 | Paytinno staff (OPS) | Admin (S4) | Website check: terms, refund policy, prices in EUR, contact details, card logos, what is sold matches the MCC. |  | Rule: Scheme rules require a website review |
| 7 | Admin (S4) | Gateway, BFF (S18) | Approved: live keys can be created (MP-20). Rejected: what to fix, as an RFI. |  |  |
| 8 | Portal (S3) | Merchant (user) | First live payment is marked on Home. |  |  |

## States

```mermaid
stateDiagram-v2
  direction LR
  state "ACTIVE (test only)" as s_ACTIVE_test_only_
  state "GO_LIVE_REVIEW" as s_GO_LIVE_REVIEW
  state "LIVE" as s_LIVE
  s_ACTIVE_test_only_ --> s_GO_LIVE_REVIEW : checklist done and asked
  s_GO_LIVE_REVIEW --> s_LIVE : approved
  s_GO_LIVE_REVIEW --> s_ACTIVE_test_only_ : changes needed
```

| From | When | To |
|---|---|---|
| ACTIVE (test only) | checklist done and asked | GO_LIVE_REVIEW |
| GO_LIVE_REVIEW | approved | LIVE |
| GO_LIVE_REVIEW | changes needed | ACTIVE (test only) |

## Rules

- Live keys are never issued before the website check.

## Questions

### MP-Q21

Can test keys be given as soon as the application is sent, so developers start during review (as the design prototype shows)?

**Proposed:** Yes, if BPC offers a sandbox merchant without onboarding. Otherwise at activation as v8.7 says.

Owner: CTO
