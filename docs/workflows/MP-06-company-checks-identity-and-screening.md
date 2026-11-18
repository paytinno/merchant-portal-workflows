<!-- Generated from src/ by tools/build-docs.ps1. Edit src/workflows.js or src/model.js, not this file. -->

# MP-06 Company checks, identity and screening

[All workflows](../README.md) | Previous: [MP-05 Fill in and send the application](MP-05-fill-in-and-send-the-application.md) | Next: [MP-07 Request for information and the answer](MP-07-request-for-information-and-the-answer.md)

The representative does an IDV check inside the portal. The company and owners are checked and screened. A hit goes to manual review, which ends in one of three ways: cleared, more information, or rejected. The portal only ever says "Checking documents" or "In review".

| | |
|---|---|
| Status | v8.7 with gaps |
| For | Every merchant |
| Area | Onboarding |
| Source | WF02b steps 5 to 9 |
| Starts when | An application is sent (MP-05). |
| Object | OnboardingCase KYB_PENDING |
| Systems | Merchant (user), Portal (S3), Gateway, BFF (S18), Onboarding (S6), IDV, AML (S11 via A01), Admin (S4), Paytinno staff (OPS) |
| Portal screens | Application |

## Sequence

```mermaid
sequenceDiagram
  autonumber
  participant MER as Merchant user
  participant S3 as Portal S3
  participant S18 as Gateway, BFF S18
  participant S6 as Onboarding S6
  participant S11 as IDV, AML S11 via A01
  participant S4 as Admin S4
  participant OPS as Paytinno staff OPS
  S6->>S11: Starts KYB and owner checks, issues an IDV<br/>token for the representative.
  S6->>S3: Token for the IDV web SDK, through S18.
  MER->>S3: The representative does the ID document and<br/>selfie check in the portal.
  S11->>S6: Results come back as webhooks through S22 and<br/>Q1 (identity.verified, company.verified,<br/>ubo.screened), then as events to the saga:<br/>RepresentativeVerified, KybVerified,<br/>UboScreened or NeedsReview. Bad signature:<br/>quarantine and SEC2.
  S6->>S11: AML system: risk and PEP or sanctions<br/>screening of the company, representative and<br/>every owner.
  S6->>S4: Any hit, or the identity does not match the<br/>role: manual review case.
  S4->>S3: Status line KYB_PENDING, then<br/>ONBOARDING_REVIEW or MANUAL_REVIEW.
  Note over MER,OPS: Manual review
  OPS->>S4: Reviews the hit or mismatch and records the<br/>evidence. A false match is cleared with four<br/>eyes.
  OPS->>S4: Something is missing or unclear: an RFI to the<br/>merchant (MP-07). The question never names the<br/>hit.
  OPS->>S4: A confirmed PEP: enhanced due diligence<br/>(source of funds and wealth) and approval by<br/>senior management before the case goes on.<br/>Being a PEP is not a reason to reject.
  OPS->>S4: A confirmed sanctions match, false documents<br/>or a suspicion: the MLRO decides, rejected,<br/>with a report to the authorities where the law<br/>requires it. The merchant gets the same<br/>neutral rejection.
  S4->>S6: Outcome: cleared, information requested, or<br/>rejected.
```

## Steps

| # | From | To | Step | Call | Notes |
|---|---|---|---|---|---|
| 1 | Onboarding (S6) | IDV, AML (S11 via A01) | Starts KYB and owner checks; issues an IDV token for the representative. |  | WF02b 5<br>Time: async |
| 2 | Onboarding (S6) | Portal (S3) | Token for the IDV web SDK, through S18. |  |  |
| 3 | Merchant (user) | Portal (S3) | The representative does the ID document and selfie check in the portal. |  | WF02b 5 |
| 4 | IDV, AML (S11 via A01) | Onboarding (S6) | Results come back as webhooks through S22 and Q1 (identity.verified, company.verified, ubo.screened), then as events to the saga: RepresentativeVerified, KybVerified, UboScreened or NeedsReview. Bad signature: quarantine and SEC2. |  | WF02b 6 to 8 |
| 5 | Onboarding (S6) | IDV, AML (S11 via A01) | AML system: risk and PEP or sanctions screening of the company, representative and every owner. |  | WF02b 9<br>Time: 1 s per person, 3 attempts |
| 6 | Onboarding (S6) | Admin (S4) | Any hit, or the identity does not match the role: manual review case. |  | Rule: A hit makes manual review mandatory |
| 7 | Admin (S4) | Portal (S3) | Status line KYB_PENDING, then ONBOARDING_REVIEW or MANUAL_REVIEW. | `application.status` | Rule: Fixed texts, never the reason |
| | | | **Manual review** | | |
| 8 | Paytinno staff (OPS) | Admin (S4) | Reviews the hit or mismatch and records the evidence. A false match is cleared with four eyes. |  | Time: [5] business days<br>**Decided:** [MP-Q67](../open-questions.md#mp-q67)<br>Added to v8.7 |
| 9 | Paytinno staff (OPS) | Admin (S4) | Something is missing or unclear: an RFI to the merchant (MP-07). The question never names the hit. |  | **Decided:** [MP-Q67](../open-questions.md#mp-q67)<br>Added to v8.7 |
| 10 | Paytinno staff (OPS) | Admin (S4) | A confirmed PEP: enhanced due diligence (source of funds and wealth) and approval by senior management before the case goes on. Being a PEP is not a reason to reject. |  | Rule: Senior management approval for a PEP<br>**Decided:** [MP-Q67](../open-questions.md#mp-q67)<br>Added to v8.7 |
| 11 | Paytinno staff (OPS) | Admin (S4) | A confirmed sanctions match, false documents or a suspicion: the MLRO decides; rejected, with a report to the authorities where the law requires it. The merchant gets the same neutral rejection. |  | Rule: No tipping off<br>**Decided:** [MP-Q67](../open-questions.md#mp-q67)<br>Added to v8.7 |
| 12 | Admin (S4) | Onboarding (S6) | Outcome: cleared, information requested, or rejected. |  | Added to v8.7 |

## States

```mermaid
stateDiagram-v2
  direction LR
  state "STARTED" as s_STARTED
  state "KYB_PENDING" as s_KYB_PENDING
  state "ONBOARDING_REVIEW" as s_ONBOARDING_REVIEW
  state "MANUAL_REVIEW" as s_MANUAL_REVIEW
  state "INFO_REQUESTED (MP-07)" as s_INFO_REQUESTED_MP_07_
  state "INFO_REQUESTED (MP-07), then back to MANUAL_REVIEW" as s_INFO_REQUESTED_MP_07_then_back_to_MANUAL_REVIEW
  state "CLOSED_REJECTED" as s_CLOSED_REJECTED
  s_STARTED --> s_KYB_PENDING : IDs recorded
  s_KYB_PENDING --> s_ONBOARDING_REVIEW : checks clear
  s_KYB_PENDING --> s_MANUAL_REVIEW : hit or review
  s_KYB_PENDING --> s_INFO_REQUESTED_MP_07_ : information missing
  s_MANUAL_REVIEW --> s_ONBOARDING_REVIEW : cleared, or PEP approved
  s_MANUAL_REVIEW --> s_INFO_REQUESTED_MP_07_then_back_to_MANUAL_REVIEW : information needed
  s_MANUAL_REVIEW --> s_CLOSED_REJECTED : confirmed match, false documents or suspicion
```

| From | When | To |
|---|---|---|
| STARTED | IDs recorded | KYB_PENDING |
| KYB_PENDING | checks clear | ONBOARDING_REVIEW |
| KYB_PENDING | hit or review | MANUAL_REVIEW |
| KYB_PENDING | information missing | INFO_REQUESTED (MP-07) |
| MANUAL_REVIEW | cleared, or PEP approved | ONBOARDING_REVIEW |
| MANUAL_REVIEW | information needed | INFO_REQUESTED (MP-07), then back to MANUAL_REVIEW |
| MANUAL_REVIEW | confirmed match, false documents or suspicion | CLOSED_REJECTED |

## Rules

- No tipping off: the portal never names a screening hit, PEP, sanctions, MATCH or VMAS.
- The portal maps each state to its own fixed text (CONFIG.APP_STATES); the admin's label is a hint only.
- Manual review always ends in a decision; a case never waits in MANUAL_REVIEW without an owner and a due date.

## Changes v8.7 needs

For the CTO's next version of the architecture.

- WF02b states: add the exits from MANUAL_REVIEW: cleared to UNDERWRITING (our ONBOARDING_REVIEW), information needed to an RFI, confirmed match or suspicion to CLOSED_REJECTED (MP-Q67).

## Questions

### MP-Q09

Should the portal show the admin's free-text status label, or its own fixed text per state? (admin spec P7)

**Proposed:** Fixed texts per state in the portal, in Bulgarian and English. Free text only inside an RFI, which staff write knowingly.

Owner: Compliance

### MP-Q67

v8.7 sends a case to MANUAL_REVIEW but never says where it goes next. What are the exits?

**Decision:** Three: cleared (false match with four eyes, or a PEP approved by senior management after enhanced due diligence) to ONBOARDING_REVIEW; information needed to an RFI (MP-07) and back; confirmed sanctions match, false documents or suspicion to CLOSED_REJECTED, decided by the MLRO, with a report to the authorities where required. Target [5] business days.

Decided, awaiting sign-off by: Compliance
