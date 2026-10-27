<!-- Generated from src/ by tools/build-docs.ps1. Edit src/workflows.js or src/model.js, not this file. -->

# MP-09 Deposit, set-up and activation

[All workflows](../README.md) | Previous: [MP-08 Onboarding review and the offer](MP-08-onboarding-review-and-the-offer.md) | Next: [MP-10 Go live: from test to live payments](MP-10-go-live-from-test-to-live-payments.md)

If a deposit is required, the merchant transfers it first. Then accounts in OraSYS and the merchant in BPC. Only when both confirm is the merchant active and the full portal opens.

| | |
|---|---|
| Status | v8.1 with gaps |
| For | Every merchant |
| Area | Onboarding |
| Source | WF02b steps 13 to 17; PRD WF11 AWAITING_DEPOSIT; admin spec 5.4 access.grant |
| Starts when | The offer is accepted (MP-08). |
| Object | OnboardingCase PROVISIONING to ACTIVE |
| Systems | Merchant (user), Portal (S3), Gateway, BFF (S18), Onboarding (S6), Admin (S4), Core (S21, S5), BPC (S10 via A09), Reconciliation (S13), Outside (bank, scheme), Messages (S17) |
| Portal screens | Application, Home |

## Sequence

```mermaid
sequenceDiagram
  autonumber
  participant MER as Merchant user
  participant S3 as Portal S3
  participant S18 as Gateway, BFF S18
  participant S6 as Onboarding S6
  participant S4 as Admin S4
  participant S21 as Core S21, S5
  participant S10 as BPC S10 via A09
  participant S13 as Reconciliation S13
  participant EXT as Outside bank, scheme
  participant S17 as Messages S17
  Note over MER,S17: Deposit (when the offer has one)
  S3->>MER: Shows the deposit amount, our IBAN and the<br/>payment reference.
  MER->>EXT: Transfers from the company's account.
  S21->>S21: Credits the rolling reserve account.
  S13->>S6: Reconciled: deposit received in full from an<br/>account in the merchant's name.
  Note over MER,S17: Set-up
  S6->>S21: Merchant in M001, settlement, reserve and<br/>control accounts, payout account on the<br/>verified list.
  S6->>S10: BPC merchant onboarding: acquirer merchant ID,<br/>terminals, hosted page and SDK keys.
  S6->>S6: Records the ID mapping and waits for both<br/>confirmations.
  S6->>S21: Accounts ACTIVE, tariff set in M008.
  Note over MER,S17: Access
  S6->>S18: The person gets MERCHANT_ADMIN on the<br/>merchant.
  S18->>S17: Welcome notice.
  S3->>MER: The full portal opens: test keys, team,<br/>payouts. Live keys after the go-live check<br/>(MP-10).
```

## Steps

| # | From | To | Step | Call | Notes |
|---|---|---|---|---|---|
| | | | **Deposit (when the offer has one)** | | |
| 1 | Portal (S3) | Merchant (user) | Shows the deposit amount, our IBAN and the payment reference. |  | **Decided:** [MP-Q20](../open-questions.md#mp-q20) |
| 2 | Merchant (user) | Outside (bank, scheme) | Transfers from the company's account. |  |  |
| 3 | Core (S21, S5) | Core (S21, S5) | Credits the rolling reserve account. |  |  |
| 4 | Reconciliation (S13) | Onboarding (S6) | Reconciled: deposit received in full from an account in the merchant's name. |  | Rule: S10 is not activated before the deposit is in and reconciled |
| | | | **Set-up** | | |
| 5 | Onboarding (S6) | Core (S21, S5) | Merchant in M001; settlement, reserve and control accounts; payout account on the verified list. | `A05 / M0391` | WF02b 13 |
| 6 | Onboarding (S6) | BPC (S10 via A09) | BPC merchant onboarding: acquirer merchant ID, terminals, hosted page and SDK keys. | `IF45 via A09` | WF02b 14<br>Time: 10 s, 3 attempts, idempotent<br>**If it fails:** persistent error: COMPENSATING and an S4 case (MP-Q63)<br>**Open gap:** Can the BPC API create merchants, terminals and keys at all? (CTO question 21, MP-Q62) |
| 7 | Onboarding (S6) | Onboarding (S6) | Records the ID mapping and waits for both confirmations. |  | WF02b 15 |
| 8 | Onboarding (S6) | Core (S21, S5) | Accounts ACTIVE; tariff set in M008. |  | WF02b 16 |
| | | | **Access** | | |
| 9 | Onboarding (S6) | Gateway, BFF (S18) | The person gets MERCHANT_ADMIN on the merchant. | `POST /admin/v1/merchants/{merchantId}/access/grant` | WF02b 17, admin spec 5.4 |
| 10 | Gateway, BFF (S18) | Messages (S17) | Welcome notice. | `merchant.notify welcome` |  |
| 11 | Portal (S3) | Merchant (user) | The full portal opens: test keys, team, payouts. Live keys after the go-live check (MP-10). |  | WF02b 17 |

## States

```mermaid
stateDiagram-v2
  direction LR
  state "OFFER_SENT" as s_OFFER_SENT
  state "AWAITING_DEPOSIT" as s_AWAITING_DEPOSIT
  state "PROVISIONING" as s_PROVISIONING
  state "ACTIVE" as s_ACTIVE
  state "COMPENSATING, S4 case" as s_COMPENSATING_S4_case
  state "WITHDRAWN" as s_WITHDRAWN
  s_OFFER_SENT --> s_AWAITING_DEPOSIT : accepted, deposit needed
  s_AWAITING_DEPOSIT --> s_PROVISIONING : reconciled
  s_PROVISIONING --> s_ACTIVE : S5 and S10 both confirm
  s_PROVISIONING --> s_COMPENSATING_S4_case : one fails
  s_AWAITING_DEPOSIT --> s_WITHDRAWN : [30] days unpaid
```

| From | When | To |
|---|---|---|
| OFFER_SENT | accepted, deposit needed | AWAITING_DEPOSIT |
| AWAITING_DEPOSIT | reconciled | PROVISIONING |
| PROVISIONING | S5 and S10 both confirm | ACTIVE |
| PROVISIONING | one fails | COMPENSATING, S4 case |
| AWAITING_DEPOSIT | [30] days unpaid | WITHDRAWN |

## Rules

- No acceptance until both OraSYS and BPC confirm.
- The deposit is paid by transfer only, never taken from settlements.

## Changes v8.1 needs

For the CTO's next version of the architecture (v8.2).

- WF02b states: add AWAITING_DEPOSIT between OFFER_SENT and PROVISIONING, as PRD WF11 needs; unpaid after [30] days the offer lapses (MP-Q20).

## Questions

### MP-Q20

AWAITING_DEPOSIT (PRD WF11) is not in the WF02b state machine.

**Decision:** Add it between the offer and PROVISIONING. Show the deposit IBAN and reference in the portal. Unpaid after [30] days: offer lapses.

Decided, awaiting sign-off by: CTO

### MP-Q62

Can the BPC API create the merchant, its terminals and its hosted page and SDK keys? (CTO question 21)

**Proposed:** Confirm with BPC. If not, set-up in BPC is a manual task in S4 with its own state (SETUP_MANUAL), an SLA of [2] business days and four eyes on the data typed into BPC. ACTIVE still needs both confirmations.

Owner: CTO

### MP-Q63

What happens when set-up half-fails, for example OraSYS opens the accounts but BPC keeps failing? v8.1 only says compensation and an S4 case (risk R10).

**Proposed:** OraSYS first, then BPC, each with an idempotency key per case. On a persistent failure the accounts stay blocked, not deleted, and an S4 case either retries or reverses: deactivate the BPC merchant if it was created, then close the empty accounts. Never active on one side only. Staff see both sides' state in the case.

Owner: CTO
