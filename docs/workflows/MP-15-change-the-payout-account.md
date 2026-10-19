<!-- Generated from src/ by tools/build-docs.ps1. Edit src/workflows.js or src/model.js, not this file. -->

# MP-15 Change the payout account

[All workflows](../README.md) | Previous: [MP-14 Pay out now, and payout settings](MP-14-pay-out-now-and-payout-settings.md) | Next: [MP-18 Statements, invoices and fees](MP-18-statements-invoices-and-fees.md)

The highest-risk change in the portal. Name check, second admin, staff check, then a cooling-off period before the first payout. The old account stays in use until then.

| | |
|---|---|
| Status | Proposed |
| Area | Money |
| Source | WF02b invariant (verified account in the merchant's name, SCA); admin spec payout.account.changed |
| Starts when | An admin adds a new payout account. |
| Object | Payout account (S6, S21 verified list) |
| Systems | Merchant (user), Portal (S3), Gateway, BFF (S18), Onboarding (S6), Identity, SCA (S19), Admin (S4), Paytinno staff (OPS), Core (S21, S5), Messages (S17) |
| Portal screens | Payout account, Approvals |

## Sequence

```mermaid
sequenceDiagram
  autonumber
  participant MER as Merchant user
  participant S3 as Portal S3
  participant S18 as Gateway, BFF S18
  participant S6 as Onboarding S6
  participant S19 as Identity, SCA S19
  participant S4 as Admin S4
  participant OPS as Paytinno staff OPS
  participant S21 as Core S21, S5
  participant S17 as Messages S17
  MER->>S3: Admin enters IBAN and holder name and uploads<br/>a bank statement.
  S18->>S18: IBAN format and SEPA reach, Verification of<br/>Payee name check: match, close match, no<br/>match.
  S18->>S19: SCA bound to the new masked IBAN.
  S18->>S6: Second admin approves, if there is one<br/>(MP-23).
  S18->>S4: Change sent to the admin, payouts to the new<br/>account stopped until verified.
  OPS->>S4: Checks the statement and the name, four eyes<br/>when the name check was not a match.
  S4->>S21: Account on the verified list, becomes primary<br/>after [24 h].
  S17->>MER: Notice to every admin and to the company<br/>email: 'Your payout account was changed'.
```

## Steps

| # | From | To | Step | Call | Notes |
|---|---|---|---|---|---|
| 1 | Merchant (user) | Portal (S3) | Admin enters IBAN and holder name and uploads a bank statement. |  |  |
| 2 | Gateway, BFF (S18) | Gateway, BFF (S18) | IBAN format and SEPA reach; Verification of Payee name check: match, close match, no match. |  | **Gap:** v8.1 does not say how "in the merchant's name" is checked (MP-Q30). |
| 3 | Gateway, BFF (S18) | Identity, SCA (S19) | SCA bound to the new masked IBAN. |  | **SCA** |
| 4 | Gateway, BFF (S18) | Onboarding (S6) | Second admin approves, if there is one (MP-23). |  |  |
| 5 | Gateway, BFF (S18) | Admin (S4) | Change sent to the admin; payouts to the new account stopped until verified. | `webhook payout.account.changed {accountRef, ibanMasked, holderMatches, verified, scaEvidenceId}` | admin spec 6 |
| 6 | Paytinno staff (OPS) | Admin (S4) | Checks the statement and the name; four eyes when the name check was not a match. |  |  |
| 7 | Admin (S4) | Core (S21, S5) | Account on the verified list; becomes primary after [24 h]. | `M0391` |  |
| 8 | Messages (S17) | Merchant (user) | Notice to every admin and to the company email: "Your payout account was changed". | `merchant.notify payout_account_verified` |  |

## States

```mermaid
stateDiagram-v2
  direction LR
  state "REQUESTED" as s_REQUESTED
  state "VERIFYING" as s_VERIFYING
  state "VERIFIED (cooling-off)" as s_VERIFIED_cooling_off_
  state "PRIMARY" as s_PRIMARY
  state "REJECTED" as s_REJECTED
  [*] --> s_REQUESTED : added
  s_REQUESTED --> s_VERIFYING : SCA and approval
  s_VERIFYING --> s_VERIFIED_cooling_off_ : staff verify
  s_VERIFIED_cooling_off_ --> s_PRIMARY : [24 h]
  s_VERIFYING --> s_REJECTED : refused
```

| From | When | To |
|---|---|---|
| start | added | REQUESTED |
| REQUESTED | SCA and approval | VERIFYING |
| VERIFYING | staff verify | VERIFIED (cooling-off) |
| VERIFIED (cooling-off) | [24 h] | PRIMARY |
| VERIFYING | refused | REJECTED |

## Rules

- Payouts go only to a verified account in the merchant's name.
- No change for [24 h] after passkey recovery (MP-04).
- The old account stays primary until the new one is.

## Open questions

### MP-Q30

How is "account in the merchant's name" verified?

**Proposed:** Verification of Payee name check plus a bank statement; no test transfer. A "no match" needs four eyes.

Owner: Compliance

### MP-Q31

Cooling-off before the first payout to a new account?

**Proposed:** [24 h], with notices to all admins so an account takeover is noticed in time.

Owner: CRO
