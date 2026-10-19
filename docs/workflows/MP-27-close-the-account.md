<!-- Generated from src/ by tools/build-docs.ps1. Edit src/workflows.js or src/model.js, not this file. -->

# MP-27 Close the account

[All workflows](../README.md) | Previous: [MP-26 Suspension and restricted access](MP-26-suspension-and-restricted-access.md)

Acceptance stops on the date, the balance is paid out, the reserve is kept for the chargeback tail, and the portal stays readable.

| | |
|---|---|
| Status | Proposed |
| Area | Business |
| Source | S6 lifecycle and S4 closure (one-pager); admin spec P6 (5 years read access) |
| Starts when | The merchant asks to close, or Paytinno ends the agreement. |
| Object | Merchant lifecycle CLOSING to CLOSED |
| Systems | Merchant (user), Portal (S3), Gateway, BFF (S18), Onboarding (S6), Admin (S4), Paytinno staff (OPS), BPC (S10 via A09), Core (S21, S5), Messages (S17) |
| Portal screens | Settings |

## Sequence

```mermaid
sequenceDiagram
  autonumber
  participant MER as Merchant user
  participant S3 as Portal S3
  participant S18 as Gateway, BFF S18
  participant S6 as Onboarding S6
  participant S4 as Admin S4
  participant OPS as Paytinno staff OPS
  participant S10 as BPC S10 via A09
  participant S21 as Core S21, S5
  participant S17 as Messages S17
  MER->>S3: SCA: Admin asks to close: date and reason, SCA<br/>and a second admin.
  S18->>S4: Closure case: open disputes, reserve, last<br/>statement.
  S4->>S10: Acceptance stops on the date.
  S21->>S21: Final payout of available funds, reserve kept<br/>[180] days then released.
  S17->>MER: Notice account_closing with dates.
  S3->>MER: Read-only: statements, payments, documents for<br/>[5] years, disputes still answerable until the<br/>tail ends.
```

## Steps

| # | From | To | Step | Call | Notes |
|---|---|---|---|---|---|
| 1 | Merchant (user) | Portal (S3) | Admin asks to close: date and reason; SCA and a second admin. |  | **SCA** |
| 2 | Gateway, BFF (S18) | Admin (S4) | Closure case: open disputes, reserve, last statement. |  |  |
| 3 | Admin (S4) | BPC (S10 via A09) | Acceptance stops on the date. |  |  |
| 4 | Core (S21, S5) | Core (S21, S5) | Final payout of available funds; reserve kept [180] days then released. |  |  |
| 5 | Messages (S17) | Merchant (user) | Notice account_closing with dates. |  |  |
| 6 | Portal (S3) | Merchant (user) | Read-only: statements, payments, documents for [5] years; disputes still answerable until the tail ends. |  |  |

## States

```mermaid
stateDiagram-v2
  direction LR
  state "ACTIVE" as s_ACTIVE
  state "CLOSING" as s_CLOSING
  state "CLOSED (read-only)" as s_CLOSED_read_only_
  s_ACTIVE --> s_CLOSING : requested
  s_CLOSING --> s_CLOSED_read_only_ : reserve released and no open disputes
```

| From | When | To |
|---|---|---|
| ACTIVE | requested | CLOSING |
| CLOSING | reserve released and no open disputes | CLOSED (read-only) |

## Rules

- Paytinno-initiated closure follows the agreement's notice, or immediately for cause.

## Open questions

### MP-Q39

Who keeps read access after closure, and for how long?

**Proposed:** Admins and Finance, 5 years (AML record keeping), then the users are disabled.

Owner: Legal
