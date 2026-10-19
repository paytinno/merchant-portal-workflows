<!-- Generated from src/ by tools/build-docs.ps1. Edit src/workflows.js or src/model.js, not this file. -->

# MP-05 Fill in and send the application

[All workflows](../README.md) | Previous: [MP-04 Lockout and lost passkey](MP-04-lockout-and-lost-passkey.md) | Next: [MP-06 Company checks, identity and screening](MP-06-company-checks-identity-and-screening.md)

Six steps: company, people, business, documents, payout account, review. Saved as a draft on every step; sent once complete.

| | |
|---|---|
| Status | v8.1 with gaps |
| Area | Onboarding |
| Source | WF02b steps 1 to 4; admin spec application.submitted |
| Starts when | An applicant (MP-01) starts an application. |
| Object | Application (draft in S18), OnboardingCase (S6, type MERCHANT) |
| Systems | Merchant (user), Portal (S3), Gateway, BFF (S18), Onboarding (S6), Admin (S4) |
| Portal screens | Application |

## Sequence

```mermaid
sequenceDiagram
  autonumber
  participant MER as Merchant user
  participant S3 as Portal S3
  participant S18 as Gateway, BFF S18
  participant S6 as Onboarding S6
  participant S4 as Admin S4
  Note over MER,S4: Draft
  MER->>S3: Enters the company ID (EIK).
  S3->>S18: Looks up the company in the Commercial<br/>Register to fill in name, form, address and<br/>managers.
  S3->>S18: Saves the draft after every step.
  MER->>S3: People: the representative and the legal<br/>basis, every owner of 25% or more, managers.<br/>Each becomes a personRef.
  MER->>S3: Business: what it sells (MCC), websites,<br/>channels, expected monthly volume, average and<br/>largest payment, customer countries, whether<br/>the company is a micro-enterprise.
  MER->>S3: Uploads documents to the vault. PDF, JPG or<br/>PNG up to 10 MB, scanned for malware.
  MER->>S3: Payout account: IBAN, holder name, bank<br/>statement.
  MER->>S3: Review and three statements: information is<br/>true, I may act for the company, I accept the<br/>merchant terms.
  Note over MER,S4: Send
  S3->>S18: Sends the application. Needs permission<br/>application:create.
  S18->>S6: Opens the case for the person in the token.<br/>The representative in the body is data, not<br/>proof of who applies.
  S6->>S6: Creates the customer ID for the company, links<br/>the person and the owners. State STARTED.
  S6->>S4: The application appears in the admin. Until S6<br/>exists, the admin stands in for it.
  S4->>S3: Status line STARTED.
```

## Steps

| # | From | To | Step | Call | Notes |
|---|---|---|---|---|---|
| | | | **Draft** | | |
| 1 | Merchant (user) | Portal (S3) | Enters the company ID (EIK). |  |  |
| 2 | Portal (S3) | Gateway, BFF (S18) | Looks up the company in the Commercial Register to fill in name, form, address and managers. | `GET /v1/registry/companies/{eik}` | **If it fails:** not found: the applicant types it<br>**Gap:** No register lookup for the portal in v8.1; the KYB connector has one (MP-Q15). |
| 3 | Portal (S3) | Gateway, BFF (S18) | Saves the draft after every step. | `PUT /v1/merchants/applications/drafts/{draftId}` | **Gap:** v8.1 has no draft; the application is sent in one call (MP-Q16). |
| 4 | Merchant (user) | Portal (S3) | People: the representative and the legal basis; every owner of 25% or more; managers. Each becomes a personRef. |  | Rule: Owners listed must explain 100% of ownership or say why not |
| 5 | Merchant (user) | Portal (S3) | Business: what it sells (MCC), websites, channels, expected monthly volume, average and largest payment, customer countries, whether the company is a micro-enterprise. |  | **Gap:** Micro-enterprise status decides the notice periods for tariff changes (MP-19). Not collected in v8.1. |
| 6 | Merchant (user) | Portal (S3) | Uploads documents to the vault. PDF, JPG or PNG up to 10 MB, scanned for malware. | `POST /v1/documents (multipart) → {docRef}` | Rule: Documents stay in the vault; the admin sees references only |
| 7 | Merchant (user) | Portal (S3) | Payout account: IBAN, holder name, bank statement. |  | Rule: Checked in MP-15 rules: in the merchant's name |
| 8 | Merchant (user) | Portal (S3) | Review and three statements: information is true; I may act for the company; I accept the merchant terms. |  |  |
| | | | **Send** | | |
| 9 | Portal (S3) | Gateway, BFF (S18) | Sends the application. Needs permission application:create. | `POST /v1/merchants/applications {legalName, eik, representativeRole, ubos[], mcc, expectedVolume, channels[], documents[]}` | WF02b 2<br>Time: 2 s<br>**If it fails:** 401, 403, 4xx |
| 10 | Gateway, BFF (S18) | Onboarding (S6) | Opens the case for the person in the token. The representative in the body is data, not proof of who applies. |  | WF02b 3 |
| 11 | Onboarding (S6) | Onboarding (S6) | Creates the customer ID for the company; links the person and the owners. State STARTED. |  | WF02b 4 |
| 12 | Onboarding (S6) | Admin (S4) | The application appears in the admin. Until S6 exists, the admin stands in for it. | `webhook application.submitted` | admin spec 6 |
| 13 | Admin (S4) | Portal (S3) | Status line STARTED. | `POST /admin/v1/applications/{appId}/status` | admin spec 5.1 |

## States

```mermaid
stateDiagram-v2
  direction LR
  state "DRAFT" as s_DRAFT
  state "STARTED" as s_STARTED
  state "deleted" as s_deleted
  state "STARTED and later" as s_STARTED_and_later
  state "WITHDRAWN" as s_WITHDRAWN
  [*] --> s_DRAFT : first save
  s_DRAFT --> s_STARTED : sent
  s_DRAFT --> s_deleted : [90] days untouched
  s_STARTED_and_later --> s_WITHDRAWN : withdrawn by the applicant
```

| From | When | To |
|---|---|---|
| start | first save | DRAFT |
| DRAFT | sent | STARTED |
| DRAFT | [90] days untouched | deleted |
| STARTED and later | withdrawn by the applicant | WITHDRAWN |

## Rules

- No acceptance before the whole onboarding is done.
- Sales do not send applications for merchants at launch.
- The applicant can withdraw until a decision is made.

## Open questions

### MP-Q15

Should the portal pre-fill from the Commercial Register?

**Proposed:** Yes. S18 calls the same register lookup the KYB connector uses. Pre-filled fields are marked and kept as the register said.

Owner: CTO

### MP-Q16

Where is the draft kept before it is sent? v8.1 starts the case only at submission.

**Proposed:** Draft in S18 (or S6) keyed by person, kept [90] days. Documents uploaded to the draft are deleted with it.

Owner: CTO

### MP-Q17

Who must do an identity check: only the representative (v8.1), or every owner (the design prototype)?

**Proposed:** Representative always. Owners are screened from data; an IDV check for owners only for high-risk merchants or when the register and the declaration disagree.

Owner: Compliance
