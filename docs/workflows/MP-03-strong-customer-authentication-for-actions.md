<!-- Generated from src/ by tools/build-docs.ps1. Edit src/workflows.js or src/model.js, not this file. -->

# MP-03 Strong customer authentication for actions

[All workflows](../README.md) | Previous: [MP-02 Sign in, switch business and check rights](MP-02-sign-in-switch-business-and-check-rights.md) | Next: [MP-04 Lockout and lost passkey](MP-04-lockout-and-lost-passkey.md)

The passkey signs exactly what the user sees (amount and payee, or the key, or the person). S18 matches the evidence to the command before sending it on.

| | |
|---|---|
| Status | v8.7, gaps closed |
| For | Every merchant |
| Area | Access |
| Source | WF02c steps 1 to 5 (a skeleton in v8.7; in v8.1 it was WF02a steps 22 to 26) |
| Starts when | A user starts an action that moves money or changes who gets it or who can act. |
| Object | SCA challenge (S19), evidence ID |
| Systems | Merchant (user), Portal (S3), Gateway, BFF (S18), Identity, SCA (S19), Onboarding (S6) |
| Portal screens | One payment, Payouts, Developers, Team, Disputes |

## Sequence

```mermaid
sequenceDiagram
  autonumber
  participant MER as Merchant user
  participant S3 as Portal S3
  participant S18 as Gateway, BFF S18
  participant S19 as Identity, SCA S19
  participant S6 as Onboarding S6
  MER->>S3: Starts the action. In WF02c: refund, payout to<br/>an external account, payout account change,<br/>API key roll, invitation with a role above the<br/>threshold. Added: accepting or escalating a<br/>dispute, revealing or rolling a webhook<br/>secret, closing the account.
  S3->>S18: Sends the command with an Idempotency-Key. S18<br/>answers that SCA is needed.
  S18->>S6: Checks the role and the person's mandate for<br/>this amount. Over the mandate, the command<br/>becomes an approval request (MP-23).
  S18->>S19: SCA: Asks for a challenge bound to amount and<br/>payee, or to the key or person. Valid 5 min.
  S19->>S3: SCA: S19's web SDK in the portal shows what is<br/>being signed (sign-in uses S19's page, signing<br/>uses the SDK). The challenge holds a hash of<br/>it.
  S3->>S19: SCA: The browser signs with biometrics or PIN.<br/>S19 checks signature and binding.
  S19->>S18: SCA: ScaCompleted {evidenceId}.
  S18->>S18: Matches the evidence to the command (same<br/>hash) and sends it on: refund to WF11 step 16<br/>(A09), payout to MP-14 (M0391), payout account<br/>to MP-15, key roll to MP-20, dispute answer to<br/>MP-16 (S4), invitation to MP-22 (S6).
  S18->>S3: Result shown to the user. Evidence kept 5<br/>years.
```

## Steps

| # | From | To | Step | Call | Notes |
|---|---|---|---|---|---|
| 1 | Merchant (user) | Portal (S3) | Starts the action. In WF02c: refund, payout to an external account, payout account change, API key roll, invitation with a role above the threshold. Added: accepting or escalating a dispute, revealing or rolling a webhook secret, closing the account. |  | WF02c 1<br>**Decided:** [MP-Q14](../open-questions.md#mp-q14) |
| 2 | Portal (S3) | Gateway, BFF (S18) | Sends the command with an Idempotency-Key. S18 answers that SCA is needed. | `POST /v1/… → 202 {scaRequired, challengeId}` |  |
| 3 | Gateway, BFF (S18) | Onboarding (S6) | Checks the role and the person's mandate for this amount. Over the mandate, the command becomes an approval request (MP-23). |  | Rule: Mandates in S6 |
| 4 | Gateway, BFF (S18) | Identity, SCA (S19) | Asks for a challenge bound to amount and payee, or to the key or person. Valid 5 min. |  | WF02c 2<br>**SCA** |
| 5 | Identity, SCA (S19) | Portal (S3) | S19's web SDK in the portal shows what is being signed (sign-in uses S19's page, signing uses the SDK). The challenge holds a hash of it. |  | WF02c 3<br>**SCA**<br>**If it fails:** user declines: nothing is sent |
| 6 | Portal (S3) | Identity, SCA (S19) | The browser signs with biometrics or PIN. S19 checks signature and binding. |  | WF02c 4<br>**SCA** |
| 7 | Identity, SCA (S19) | Gateway, BFF (S18) | ScaCompleted {evidenceId}. |  | WF02c 5<br>**SCA** |
| 8 | Gateway, BFF (S18) | Gateway, BFF (S18) | Matches the evidence to the command (same hash) and sends it on: refund to WF11 step 16 (A09), payout to MP-14 (M0391), payout account to MP-15, key roll to MP-20, dispute answer to MP-16 (S4), invitation to MP-22 (S6). |  | **If it fails:** challenge expired: start again; hash differs: 409, logged<br>**Decided:** [MP-Q08](../open-questions.md#mp-q08) |
| 9 | Gateway, BFF (S18) | Portal (S3) | Result shown to the user. Evidence kept 5 years. |  | Rule: SCA evidence retention 5 years |

## States

```mermaid
stateDiagram-v2
  direction LR
  state "SCA_REQUIRED" as s_SCA_REQUIRED
  state "SUBMITTED" as s_SUBMITTED
  state "CANCELLED" as s_CANCELLED
  state "AWAITING_APPROVAL (MP-23)" as s_AWAITING_APPROVAL_MP_23_
  [*] --> s_SCA_REQUIRED : action started
  s_SCA_REQUIRED --> s_SUBMITTED : signed
  s_SCA_REQUIRED --> s_CANCELLED : declined or 5 min
  s_SCA_REQUIRED --> s_AWAITING_APPROVAL_MP_23_ : over mandate
```

| From | When | To |
|---|---|---|
| start | action started | SCA_REQUIRED |
| SCA_REQUIRED | signed | SUBMITTED |
| SCA_REQUIRED | declined or 5 min | CANCELLED |
| SCA_REQUIRED | over mandate | AWAITING_APPROVAL (MP-23) |

## Rules

- Dynamic linking: changing the amount or payee after signing voids the signature.
- For an approval, the requester signs the request and the approver signs the approval; it runs after both.
- One evidence ID per command; reuse is refused.

## Changes v8.7 needs

For the CTO's next version of the architecture.

- WF02c 1: add dispute Accept and Escalate (MP-Q14), webhook secret reveal or roll (MP-Q11) and account closure to the SCA list.
- WF02c 5: refund goes to WF11 step 16 (now right); name the WF10 targets for payout and payout account change, and add the states and failures WF02c still leaves to be written (MP-Q08).

## Questions

### MP-Q08

In v8.1, WF02a step 26 continued to the wrong steps. WF02c step 5 in v8.7 fixes the refund (WF11 step 16) but leaves payout and payout account change "to be specified".

**Decision:** Refund continues to WF11 step 16; payout to MP-14; payout account to MP-15; key roll to MP-20. WF02c still needs these and its states.

Decided, awaiting sign-off by: CTO

### MP-Q14

Accepting a dispute is final and costs money, but it is not on the SCA list in WF02c 1. WF11 15 says SCA for actions with a money effect.

**Decision:** Require SCA for Accept and Escalate. Add to the WF02c 1 list.

Decided, awaiting sign-off by: CTO
