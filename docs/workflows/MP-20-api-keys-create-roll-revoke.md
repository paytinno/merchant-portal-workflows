<!-- Generated from src/ by tools/build-docs.ps1. Edit src/workflows.js or src/model.js, not this file. -->

# MP-20 API keys: create, roll, revoke

[All workflows](../README.md) | Previous: [MP-37 Money the merchant owes](MP-37-money-the-merchant-owes.md) | Next: [MP-21 Webhooks](MP-21-webhooks.md)

Secrets are shown once and never kept by Paytinno. Rolling keeps the old key working for [24 h] so the merchant can switch without downtime.

| | |
|---|---|
| Status | Proposed |
| For | Every merchant |
| Area | Developers |
| Source | One-pager S3 item 6; WF10 3 (keys through S3, S4 operator until the BPC API covers it) |
| Starts when | A developer needs a key, or a key may be exposed. |
| Object | Gateway key (BPC) |
| Systems | Merchant (user), Portal (S3), Gateway, BFF (S18), Identity, SCA (S19), BPC (S10 via A09), Admin (S4), Paytinno staff (OPS), Messages (S17) |
| Portal screens | Developers |

## Sequence

```mermaid
sequenceDiagram
  autonumber
  participant MER as Merchant user
  participant S3 as Portal S3
  participant S18 as Gateway, BFF S18
  participant S19 as Identity, SCA S19
  participant S10 as BPC S10 via A09
  participant S4 as Admin S4
  participant OPS as Paytinno staff OPS
  participant S17 as Messages S17
  MER->>S3: Create a key (test or live) with a label, or<br/>roll or revoke one.
  S18->>S19: SCA bound to the key label and action.
  S3->>S18: Command.
  S18->>S10: Through A09.
  S10->>S3: The secret, once. The portal shows it and<br/>forgets it.
  S10->>S10: Roll: the old key works for [24 h] more, then<br/>stops. Revoke: stops now.
  S17->>MER: Email to admins and developers for every<br/>create, roll and revoke.
```

## Steps

| # | From | To | Step | Call | Notes |
|---|---|---|---|---|---|
| 1 | Merchant (user) | Portal (S3) | Create a key (test or live) with a label, or roll or revoke one. |  |  |
| 2 | Gateway, BFF (S18) | Identity, SCA (S19) | SCA bound to the key label and action. |  | WF02c 1<br>**SCA** |
| 3 | Portal (S3) | Gateway, BFF (S18) | Command. | `POST /v1/keys {mode, label} \| POST /v1/keys/{id}/roll \| DELETE /v1/keys/{id}` |  |
| 4 | Gateway, BFF (S18) | BPC (S10 via A09) | Through A09. | `IF45 via A09` | **Open gap:** BPC API coverage for keys is open (questions 21, 33). Until then an S4 operator does it (MP-Q10). |
| 5 | BPC (S10 via A09) | Portal (S3) | The secret, once. The portal shows it and forgets it. |  | Rule: Shown once |
| 6 | BPC (S10 via A09) | BPC (S10 via A09) | Roll: the old key works for [24 h] more, then stops. Revoke: stops now. |  |  |
| 7 | Messages (S17) | Merchant (user) | Email to admins and developers for every create, roll and revoke. |  |  |

## States

```mermaid
stateDiagram-v2
  direction LR
  state "ACTIVE" as s_ACTIVE
  state "EXPIRING" as s_EXPIRING
  state "REVOKED" as s_REVOKED
  [*] --> s_ACTIVE : created
  s_ACTIVE --> s_EXPIRING : rolled
  s_EXPIRING --> s_REVOKED : time
  s_ACTIVE --> s_REVOKED : revoked
```

| From | When | To |
|---|---|---|
| start | created | ACTIVE |
| ACTIVE | rolled | EXPIRING |
| EXPIRING | time | REVOKED |
| ACTIVE | revoked | REVOKED |

## Rules

- At launch (v8.7 S3 scope), until the BPC API covers it, Paytinno staff do this in S4 through A09 on the merchant's request; the portal then sends a request and shows its status (questions 21 and 33, risk R07; MP-Q68).
- Live keys only after go-live (MP-10).
- Secrets never in email, messages or logs.

## Questions

### MP-Q10

If BPC cannot create keys through its API, how does the secret reach the merchant without staff seeing it?

**Proposed:** Do not launch key self-service with an operator in the middle. Either BPC API support, or S4 triggers the key through A09 and only the merchant sees the secret (MP-Q68). v8.7 does not use BPC's console, so a console link is out. Confirm with BPC before build.

Owner: BPC

### MP-Q68

v8.7 puts API keys and payout account changes after launch: Paytinno staff do them in S4 until the BPC API covers them (questions 21 and 33). How does the merchant ask on day one?

**Proposed:** The portal sends the same request either way, signed with SCA. Without the API, staff carry it out in S4 with four eyes within [1] business day and the portal shows the status. For a key, staff only trigger it: S4 asks A09 for the key and S18 shows the secret once to the merchant, so no one at Paytinno sees it (MP-Q10). When the API arrives nothing changes for merchants.

Owner: CTO
