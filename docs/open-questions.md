<!-- Generated from src/ by tools/build-docs.ps1. Edit src/workflows.js or src/model.js, not this file. -->

# Questions

[All workflows](README.md)

43 open, 26 decided and awaiting sign-off. CTO question numbers refer to the v8.7 question list.

## Open

Decisions the portal still needs. Each has a proposed answer to agree or change.

| ID | Question | Owner | Workflow |
|---|---|---|---|
| [MP-Q01](#mp-q01) | v8.7 names only ONBOARDING_APPLICANT and MERCHANT_ADMIN. There is no role list or permission table. | Product | [MP-22](workflows/MP-22-invite-change-and-remove-users.md) |
| [MP-Q03](#mp-q03) | The BNB has not confirmed a passkey with dynamic linking as SCA on the web. For the portal it is the only method (no password, no push to the app). | Compliance | [MP-01](workflows/MP-01-register-and-create-a-passkey.md) |
| [MP-Q04](#mp-q04) | One passkey per person makes lost phones a frequent recovery case. | Product | [MP-01](workflows/MP-01-register-and-create-a-passkey.md) |
| [MP-Q05](#mp-q05) | Who sets limits, and are there defaults? | Product | [MP-23](workflows/MP-23-approvals-by-a-second-person.md) |
| [MP-Q09](#mp-q09) | Should the portal show the admin's free-text status label, or its own fixed text per state? (admin spec P7) | Compliance | [MP-06](workflows/MP-06-company-checks-identity-and-screening.md) |
| [MP-Q10](#mp-q10) | If BPC cannot create keys through its API, how does the secret reach the merchant without staff seeing it? | BPC | [MP-20](workflows/MP-20-api-keys-create-roll-revoke.md) |
| [MP-Q21](#mp-q21) | Can test keys be given as soon as the application is sent, so developers start during review (as the design prototype shows)? | CTO | [MP-10](workflows/MP-10-go-live-from-test-to-live-payments.md) |
| [MP-Q22](#mp-q22) | Cache payment data in S18 when BPC is slow or down? (CTO question 22) | CTO | [MP-11](workflows/MP-11-see-payments-and-one-payment.md) |
| [MP-Q23](#mp-q23) | Can the BPC API search by order reference, card last 4 and amount? | BPC | [MP-11](workflows/MP-11-see-payments-and-one-payment.md) |
| [MP-Q27](#mp-q27) | Reserve release: v8.7 proposes 180 days; the PRD says "on schedule" with no number. | CRO | [MP-17](workflows/MP-17-rolling-reserve-and-reserve-top-up.md) |
| [MP-Q28](#mp-q28) | Which payout schedules does M0391 support (daily, weekly, monthly, minimum amount)? | OraSYS | [MP-13](workflows/MP-13-balances-settlement-and-automatic-payouts.md) |
| [MP-Q29](#mp-q29) | "Funds stay with us by choice" (WF10 12): is that allowed, for how long, and how are those funds safeguarded? | Compliance | [MP-14](workflows/MP-14-pay-out-now-and-payout-settings.md) |
| [MP-Q30](#mp-q30) | How is "account in the merchant's name" verified? | Compliance | [MP-15](workflows/MP-15-change-the-payout-account.md) |
| [MP-Q31](#mp-q31) | Cooling-off before the first payout to a new account? | CRO | [MP-15](workflows/MP-15-change-the-payout-account.md) |
| [MP-Q32](#mp-q32) | Can M008 give the IFR Art. 12 split per payment? | OraSYS | [MP-18](workflows/MP-18-statements-invoices-and-fees.md) |
| [MP-Q35](#mp-q35) | Do people with money roles (Admin, Finance) need an identity check? | Compliance | [MP-22](workflows/MP-22-invite-change-and-remove-users.md) |
| [MP-Q36](#mp-q36) | What happens when a periodic review is overdue? | Compliance | [MP-24](workflows/MP-24-business-details-owners-and-periodic-review.md) |
| [MP-Q38](#mp-q38) | If revoked access stops every action, disputes go unanswered and are lost. | CTO | [MP-26](workflows/MP-26-suspension-and-restricted-access.md) |
| [MP-Q39](#mp-q39) | Who keeps read access after closure, and for how long? | Legal | [MP-27](workflows/MP-27-close-the-account.md) |
| [MP-Q40](#mp-q40) | Should Paytinno send payment links to the merchant's customers by email or SMS? | Legal | [MP-29](workflows/MP-29-payment-links-and-qr-codes.md) |
| [MP-Q41](#mp-q41) | Which web address do links use: BPC's hosted page domain or one of ours? | CTO | [MP-29](workflows/MP-29-payment-links-and-qr-codes.md) |
| [MP-Q42](#mp-q42) | Who supplies, ships and supports terminals, and do merchants rent or buy them? | COO | [MP-30](workflows/MP-30-card-terminals.md) |
| [MP-Q43](#mp-q43) | Should shop staff be able to refund on the terminal? | CRO | [MP-30](workflows/MP-30-card-terminals.md) |
| [MP-Q44](#mp-q44) | Can an order that ships in parts be captured in several parts? | CTO | [MP-31](workflows/MP-31-capture-later-or-in-part.md) |
| [MP-Q45](#mp-q45) | Which capture mode do new merchants get? | Product | [MP-31](workflows/MP-31-capture-later-or-in-part.md) |
| [MP-Q46](#mp-q46) | Who handles complaints and approves the answers? | Compliance | [MP-32](workflows/MP-32-complaints.md) |
| [MP-Q47](#mp-q47) | Which escalation routes do we give merchants: the BNB, an out-of-court body, and later the UK ombudsman? | Legal | [MP-32](workflows/MP-32-complaints.md) |
| [MP-Q48](#mp-q48) | Do our licence and the merchant agreement cover paying players from the operator's acquiring balance, and does that make the balance a payment account? | Legal | [MP-33](workflows/MP-33-payouts-to-players.md) |
| [MP-Q49](#mp-q49) | Payouts sent through the API cannot be signed with SCA one by one. Is a payout-only key with an IP allow list and daily limits enough? | Compliance | [MP-33](workflows/MP-33-payouts-to-players.md) |
| [MP-Q50](#mp-q50) | Must payouts go back to the card or account the player deposited from? | CRO | [MP-33](workflows/MP-33-payouts-to-players.md) |
| [MP-Q51](#mp-q51) | Where does the merchant activity log live, and for how long? | CTO | [MP-34](workflows/MP-34-activity-log.md) |
| [MP-Q52](#mp-q52) | At what level do we warn merchants, and which scheme fines do we pass on? | CRO | [MP-35](workflows/MP-35-fraud-and-dispute-ratio-warnings.md) |
| [MP-Q53](#mp-q53) | Is the status page public or only for signed-in merchants, and who approves the texts? | COO | [MP-36](workflows/MP-36-incident-and-maintenance-notices.md) |
| [MP-Q54](#mp-q54) | May we take what a merchant owes from its next payouts, and do we charge late interest? | Legal | [MP-37](workflows/MP-37-money-the-merchant-owes.md) |
| [MP-Q55](#mp-q55) | Who decides these requests, and how fast? | CRO | [MP-38](workflows/MP-38-ask-for-higher-limits-or-new-services.md) |
| [MP-Q56](#mp-q56) | Do we offer only saved cards and merchant-initiated payments, or also a subscription engine (plans, schedules, retries)? | Product | [MP-39](workflows/MP-39-saved-cards-and-recurring-payments.md) |
| [MP-Q57](#mp-q57) | Who registers merchant domains with Apple: BPC as the processor, or Paytinno as a payment platform? | CTO | [MP-40](workflows/MP-40-apple-pay-and-google-pay.md) |
| [MP-Q58](#mp-q58) | Who builds and maintains the plugins, and for which platforms first? | Product | [MP-41](workflows/MP-41-shop-plugins.md) |
| [MP-Q59](#mp-q59) | Can BPC issue keys limited to payments and refunds? | CTO | [MP-41](workflows/MP-41-shop-plugins.md) |
| [MP-Q62](#mp-q62) | Can the BPC API create the merchant, its terminals and its hosted page and SDK keys? (CTO question 21) | CTO | [MP-09](workflows/MP-09-deposit-set-up-and-activation.md) |
| [MP-Q63](#mp-q63) | What happens when set-up half-fails, for example OraSYS opens the accounts but BPC keeps failing? v8.7 only says compensation and an S4 case (risk R10). | CTO | [MP-09](workflows/MP-09-deposit-set-up-and-activation.md) |
| [MP-Q64](#mp-q64) | When will the onboarding service (S6) exist? Until then the admin stands in for it. Where do onboarding cases live in the meantime, and how do they move to S6? | CTO | [MP-05](workflows/MP-05-fill-in-and-send-the-application.md) |
| [MP-Q68](#mp-q68) | v8.7 puts API keys and payout account changes after launch: Paytinno staff do them in S4 until the BPC API covers them (questions 21 and 33). How does the merchant ask on day one? | CTO | [MP-20](workflows/MP-20-api-keys-create-roll-revoke.md) |

By owner: BPC 2, COO 2, CRO 6, CTO 12, Compliance 8, Legal 5, OraSYS 2, Product 6.

## Decided, awaiting sign-off

Answers adopted as the design to close gaps in v8.7. Each owner signs off or changes it.

| ID | Question | Owner | Workflow |
|---|---|---|---|
| [MP-Q02](#mp-q02) | Registration with an email that already exists returned 409 in v8.1. That is an account lookup for anyone. | CTO | [MP-01](workflows/MP-01-register-and-create-a-passkey.md) |
| [MP-Q05b](#mp-q05b) | How do staff check identity in recovery without a second admin? | Compliance | [MP-04](workflows/MP-04-lockout-and-lost-passkey.md) |
| [MP-Q06](#mp-q06) | Session times in S18 are open in v8.7 (S18 and Security). | CTO | [MP-02](workflows/MP-02-sign-in-switch-business-and-check-rights.md) |
| [MP-Q07](#mp-q07) | How does a call say which business it is for, when one person serves several? v8.7 says the request carries the merchant ID but not how. | CTO | [MP-02](workflows/MP-02-sign-in-switch-business-and-check-rights.md) |
| [MP-Q08](#mp-q08) | In v8.1, WF02a step 26 continued to the wrong steps. WF02c step 5 in v8.7 fixes the refund (WF11 step 16) but leaves payout and payout account change "to be specified". | CTO | [MP-03](workflows/MP-03-strong-customer-authentication-for-actions.md) |
| [MP-Q11](#mp-q11) | Is a webhook signing secret a key needing SCA? It lets anyone fake events to the merchant. | CTO | [MP-21](workflows/MP-21-webhooks.md) |
| [MP-Q12](#mp-q12) | The PRD and v8.7 WF11 disagree: states (PRD stages vs OPEN/SUBMITTED/WON/LOST), channel (staff in VROL/Mastercom vs A09 to BPC), ledger (CB sub-account vs reserve and receivable). | CTO | [MP-16](workflows/MP-16-answer-a-chargeback.md) |
| [MP-Q13](#mp-q13) | Who works disputes at launch? (CTO question 29) | COO | [MP-16](workflows/MP-16-answer-a-chargeback.md) |
| [MP-Q14](#mp-q14) | Accepting a dispute is final and costs money, but it is not on the SCA list in WF02c 1. WF11 15 says SCA for actions with a money effect. | CTO | [MP-03](workflows/MP-03-strong-customer-authentication-for-actions.md) |
| [MP-Q15](#mp-q15) | Should the portal pre-fill from the Commercial Register? | CTO | [MP-05](workflows/MP-05-fill-in-and-send-the-application.md) |
| [MP-Q16](#mp-q16) | Where is the draft kept before it is sent, and for how long? v8.1 started the case only at submission. v8.5 adopted the DRAFT state in S6; the period is DC-12. | DPO and MLRO | [MP-05](workflows/MP-05-fill-in-and-send-the-application.md) |
| [MP-Q17](#mp-q17) | Who must do an identity check: only the representative (v8.7), or every owner (the design prototype)? | Compliance | [MP-05](workflows/MP-05-fill-in-and-send-the-application.md) |
| [MP-Q18](#mp-q18) | What happens when an RFI is overdue? | Compliance | [MP-07](workflows/MP-07-request-for-information-and-the-answer.md) |
| [MP-Q19](#mp-q19) | Where does the merchant agree to the tariff, reserve and agreement? v8.7 goes from approval straight to set-up. | Legal | [MP-08](workflows/MP-08-onboarding-review-and-the-offer.md) |
| [MP-Q20](#mp-q20) | AWAITING_DEPOSIT (PRD WF11) is not in the WF02b state machine. | CTO | [MP-09](workflows/MP-09-deposit-set-up-and-activation.md) |
| [MP-Q24](#mp-q24) | Where does the "no refund while disputed" check run? The PRD says S21a; in v8.7 portal refunds go S18 to A09 to BPC. | CTO | [MP-12](workflows/MP-12-refund-a-payment.md) |
| [MP-Q25](#mp-q25) | What if the merchant's balance is lower than the refund? | Finance | [MP-12](workflows/MP-12-refund-a-payment.md) |
| [MP-Q26](#mp-q26) | Cancelling an authorisation that is not captured is not described anywhere. | CTO | [MP-12](workflows/MP-12-refund-a-payment.md) |
| [MP-Q33](#mp-q33) | Notice periods differ for micro-enterprises, but onboarding does not ask whether the merchant is one. | Legal | [MP-19](workflows/MP-19-tariff-change-notice.md) |
| [MP-Q34](#mp-q34) | Two signing schemes and retry policies (BPC payment webhooks and Paytinno chargeback webhooks). | CTO | [MP-21](workflows/MP-21-webhooks.md) |
| [MP-Q37](#mp-q37) | Where are support conversations handled? The admin has no case management for them. | COO | [MP-25](workflows/MP-25-messages-and-notices.md) |
| [MP-Q60](#mp-q60) | When does onboarding need a credit review (underwriting), and who signs it? | CRO | [MP-08](workflows/MP-08-onboarding-review-and-the-offer.md) |
| [MP-Q61](#mp-q61) | Which sectors are high risk, and what extra checks does each get? v8.7 names only gambling (MCC 7995). | Compliance | [MP-08](workflows/MP-08-onboarding-review-and-the-offer.md) |
| [MP-Q65](#mp-q65) | How are MATCH and VMAS checked: through BPC, directly with Mastercard and Visa, or by hand? | CTO | [MP-08](workflows/MP-08-onboarding-review-and-the-offer.md) |
| [MP-Q66](#mp-q66) | When does a terminated merchant go on MATCH and VMAS? | Compliance | [MP-27](workflows/MP-27-close-the-account.md) |
| [MP-Q67](#mp-q67) | v8.7 sends a case to MANUAL_REVIEW but never says where it goes next. What are the exits? | Compliance | [MP-06](workflows/MP-06-company-checks-identity-and-screening.md) |

By owner: COO 2, CRO 1, CTO 13, Compliance 6, DPO and MLRO 1, Finance 1, Legal 2.

## Details

### MP-Q01

v8.7 names only ONBOARDING_APPLICANT and MERCHANT_ADMIN. There is no role list or permission table.

**Proposed:** Admin, Finance, Developer, Support, Viewer with the table under Roles and rights.

Owner: Product. Workflow: [MP-22 Invite, change and remove users](workflows/MP-22-invite-change-and-remove-users.md)

### MP-Q02

Registration with an email that already exists returned 409 in v8.1. That is an account lookup for anyone.

**Decision:** The same answer whatever the email; an existing user gets an email instead. Adopted by the CTO in WF02a step 2.

Decided, awaiting sign-off by: CTO. Workflow: [MP-01 Register and create a passkey](workflows/MP-01-register-and-create-a-passkey.md)

### MP-Q03

The BNB has not confirmed a passkey with dynamic linking as SCA on the web. For the portal it is the only method (no password, no push to the app).

**Proposed:** Ask the BNB in writing before build. Allow platform passkeys and security keys. Keep the design open for a push to S1 for people who have the app.

Owner: Compliance. Workflow: [MP-01 Register and create a passkey](workflows/MP-01-register-and-create-a-passkey.md)

### MP-Q04

One passkey per person makes lost phones a frequent recovery case.

**Proposed:** Prompt for a second passkey at registration. Require two for Admin and Finance after activation.

Owner: Product. Workflow: [MP-01 Register and create a passkey](workflows/MP-01-register-and-create-a-passkey.md)

### MP-Q05b

How do staff check identity in recovery without a second admin?

**Decision:** IDV selfie check matched to the face from onboarding (no new documents), then four eyes in S4. Block payout account changes for [24 h] after.

Decided, awaiting sign-off by: Compliance. Workflow: [MP-04 Lockout and lost passkey](workflows/MP-04-lockout-and-lost-passkey.md)

### MP-Q05

Who sets limits, and are there defaults?

**Proposed:** Defaults per role (Support refunds up to [€100]); an admin can lower a person's limit, not raise it above the merchant's limit set by Paytinno.

Owner: Product. Workflow: [MP-23 Approvals by a second person](workflows/MP-23-approvals-by-a-second-person.md)

### MP-Q06

Session times in S18 are open in v8.7 (S18 and Security).

**Decision:** [30] min idle, 8 h absolute, the refresh token used only while active. Money actions need SCA anyway.

Decided, awaiting sign-off by: CTO. Workflow: [MP-02 Sign in, switch business and check rights](workflows/MP-02-sign-in-switch-business-and-check-rights.md)

### MP-Q07

How does a call say which business it is for, when one person serves several? v8.7 says the request carries the merchant ID but not how.

**Decision:** Header X-Merchant-Id on every call; S18 checks it against S6. The sidebar business switcher sets it.

Decided, awaiting sign-off by: CTO. Workflow: [MP-02 Sign in, switch business and check rights](workflows/MP-02-sign-in-switch-business-and-check-rights.md)

### MP-Q08

In v8.1, WF02a step 26 continued to the wrong steps. WF02c step 5 in v8.7 fixes the refund (WF11 step 16) but leaves payout and payout account change "to be specified".

**Decision:** Refund continues to WF11 step 16; payout to MP-14; payout account to MP-15; key roll to MP-20. WF02c still needs these and its states.

Decided, awaiting sign-off by: CTO. Workflow: [MP-03 Strong customer authentication for actions](workflows/MP-03-strong-customer-authentication-for-actions.md)

### MP-Q09

Should the portal show the admin's free-text status label, or its own fixed text per state? (admin spec P7)

**Proposed:** Fixed texts per state in the portal, in Bulgarian and English. Free text only inside an RFI, which staff write knowingly.

Owner: Compliance. Workflow: [MP-06 Company checks, identity and screening](workflows/MP-06-company-checks-identity-and-screening.md)

### MP-Q10

If BPC cannot create keys through its API, how does the secret reach the merchant without staff seeing it?

**Proposed:** Do not launch key self-service with an operator in the middle. Either BPC API support, or S4 triggers the key through A09 and only the merchant sees the secret (MP-Q68). v8.7 does not use BPC's console, so a console link is out. Confirm with BPC before build.

Owner: BPC. Workflow: [MP-20 API keys: create, roll, revoke](workflows/MP-20-api-keys-create-roll-revoke.md)

### MP-Q11

Is a webhook signing secret a key needing SCA? It lets anyone fake events to the merchant.

**Decision:** Yes: SCA to add an endpoint and to reveal or roll a secret.

Decided, awaiting sign-off by: CTO. Workflow: [MP-21 Webhooks](workflows/MP-21-webhooks.md)

### MP-Q12

The PRD and v8.7 WF11 disagree: states (PRD stages vs OPEN/SUBMITTED/WON/LOST), channel (staff in VROL/Mastercom vs A09 to BPC), ledger (CB sub-account vs reserve and receivable).

**Decision:** Use the PRD for the merchant side and update WF11 in the next version. The portal shows PRD stages and maps them to the v8.7 states for reporting.

Decided, awaiting sign-off by: CTO. Workflow: [MP-16 Answer a chargeback](workflows/MP-16-answer-a-chargeback.md)

### MP-Q13

Who works disputes at launch? (CTO question 29)

**Decision:** Paytinno chargeback analysts in S4 (PRD), with the merchant answering in the portal.

Decided, awaiting sign-off by: COO. Workflow: [MP-16 Answer a chargeback](workflows/MP-16-answer-a-chargeback.md)

### MP-Q14

Accepting a dispute is final and costs money, but it is not on the SCA list in WF02c 1. WF11 15 says SCA for actions with a money effect.

**Decision:** Require SCA for Accept and Escalate. Add to the WF02c 1 list.

Decided, awaiting sign-off by: CTO. Workflow: [MP-03 Strong customer authentication for actions](workflows/MP-03-strong-customer-authentication-for-actions.md)

### MP-Q15

Should the portal pre-fill from the Commercial Register?

**Decision:** Yes. S18 routes to the register lookup the KYB connector already has. Pre-filled fields are marked and kept as the register said.

Decided, awaiting sign-off by: CTO. Workflow: [MP-05 Fill in and send the application](workflows/MP-05-fill-in-and-send-the-application.md)

### MP-Q16

Where is the draft kept before it is sent, and for how long? v8.1 started the case only at submission. v8.5 adopted the DRAFT state in S6; the period is DC-12.

**Decision:** Draft in S6 as an OnboardingCase in state DRAFT, bound to the person. Kept [90] days untouched, then deleted with its documents. Our answer to DC-12.

Decided, awaiting sign-off by: DPO and MLRO. Workflow: [MP-05 Fill in and send the application](workflows/MP-05-fill-in-and-send-the-application.md)

### MP-Q17

Who must do an identity check: only the representative (v8.7), or every owner (the design prototype)?

**Decision:** Representative always. Owners are screened from data; an IDV check for owners only for high-risk merchants or when the register and the declaration disagree.

Decided, awaiting sign-off by: Compliance. Workflow: [MP-05 Fill in and send the application](workflows/MP-05-fill-in-and-send-the-application.md)

### MP-Q18

What happens when an RFI is overdue?

**Decision:** Onboarding: application paused, withdrawn after [30] days with notice. Live merchant: reminder, then a restriction decision in S4 (MP-26), never automatic.

Decided, awaiting sign-off by: Compliance. Workflow: [MP-07 Request for information and the answer](workflows/MP-07-request-for-information-and-the-answer.md)

### MP-Q19

Where does the merchant agree to the tariff, reserve and agreement? v8.7 goes from approval straight to set-up.

**Decision:** Add OFFER_SENT: the offer in the portal, accepted with SCA by the applicant who is the representative. Qualified e-signature only if Legal requires it.

Decided, awaiting sign-off by: Legal. Workflow: [MP-08 Onboarding review and the offer](workflows/MP-08-onboarding-review-and-the-offer.md)

### MP-Q20

AWAITING_DEPOSIT (PRD WF11) is not in the WF02b state machine.

**Decision:** Add it between the offer and PROVISIONING. Show the deposit IBAN and reference in the portal. Unpaid after [30] days: offer lapses.

Decided, awaiting sign-off by: CTO. Workflow: [MP-09 Deposit, set-up and activation](workflows/MP-09-deposit-set-up-and-activation.md)

### MP-Q21

Can test keys be given as soon as the application is sent, so developers start during review (as the design prototype shows)?

**Proposed:** Yes, if BPC offers a sandbox merchant without onboarding. Otherwise at activation as v8.7 says.

Owner: CTO. Workflow: [MP-10 Go live: from test to live payments](workflows/MP-10-go-live-from-test-to-live-payments.md)

### MP-Q22

Cache payment data in S18 when BPC is slow or down? (CTO question 22)

**Proposed:** Yes, a read copy of the last [90] days refreshed every [5] min, always shown with its time. Search beyond 90 days goes to BPC live.

Owner: CTO. Workflow: [MP-11 See payments and one payment](workflows/MP-11-see-payments-and-one-payment.md)

### MP-Q23

Can the BPC API search by order reference, card last 4 and amount?

**Proposed:** Confirm with BPC (question 21). If not, search runs on the S18 read copy only.

Owner: BPC. Workflow: [MP-11 See payments and one payment](workflows/MP-11-see-payments-and-one-payment.md)

### MP-Q24

Where does the "no refund while disputed" check run? The PRD says S21a; in v8.7 portal refunds go S18 to A09 to BPC.

**Decision:** S18 asks S4 synchronously (DisputeCase by payment) before the A09 call. S4 also re-checks on every stage change (PRD).

Decided, awaiting sign-off by: CTO. Workflow: [MP-12 Refund a payment](workflows/MP-12-refund-a-payment.md)

### MP-Q25

What if the merchant's balance is lower than the refund?

**Decision:** Allowed up to available plus pending; above that, refused with "top up by transfer". Never a negative balance.

Decided, awaiting sign-off by: Finance. Workflow: [MP-12 Refund a payment](workflows/MP-12-refund-a-payment.md)

### MP-Q26

Cancelling an authorisation that is not captured is not described anywhere.

**Decision:** A "Cancel" action on authorised payments through A09, same rights as refund, no SCA (no money leaves).

Decided, awaiting sign-off by: CTO. Workflow: [MP-12 Refund a payment](workflows/MP-12-refund-a-payment.md)

### MP-Q27

Reserve release: v8.7 proposes 180 days; the PRD says "on schedule" with no number.

**Proposed:** 180 days rolling, daily release, per merchant override set in the onboarding review, or the credit review (MP-Q60).

Owner: CRO. Workflow: [MP-17 Rolling reserve and reserve top-up](workflows/MP-17-rolling-reserve-and-reserve-top-up.md)

### MP-Q28

Which payout schedules does M0391 support (daily, weekly, monthly, minimum amount)?

**Proposed:** Daily on business days as default; weekly and monthly as options; minimum [€100].

Owner: OraSYS. Workflow: [MP-13 Balances, settlement and automatic payouts](workflows/MP-13-balances-settlement-and-automatic-payouts.md)

### MP-Q29

"Funds stay with us by choice" (WF10 12): is that allowed, for how long, and how are those funds safeguarded?

**Proposed:** Allowed up to [30] days, safeguarded like other client funds, shown as "kept". Longer needs a payment account under a separate agreement.

Owner: Compliance. Workflow: [MP-14 Pay out now, and payout settings](workflows/MP-14-pay-out-now-and-payout-settings.md)

### MP-Q30

How is "account in the merchant's name" verified?

**Proposed:** Verification of Payee name check plus a bank statement; no test transfer. A "no match" needs four eyes.

Owner: Compliance. Workflow: [MP-15 Change the payout account](workflows/MP-15-change-the-payout-account.md)

### MP-Q31

Cooling-off before the first payout to a new account?

**Proposed:** [24 h], with notices to all admins so an account takeover is noticed in time.

Owner: CRO. Workflow: [MP-15 Change the payout account](workflows/MP-15-change-the-payout-account.md)

### MP-Q32

Can M008 give the IFR Art. 12 split per payment?

**Proposed:** Confirm with OraSYS. If not, S7 calculates it from the BPC clearing file.

Owner: OraSYS. Workflow: [MP-18 Statements, invoices and fees](workflows/MP-18-statements-invoices-and-fees.md)

### MP-Q33

Notice periods differ for micro-enterprises, but onboarding does not ask whether the merchant is one.

**Decision:** Ask in the application (MP-05) and keep it in S6; S7 refuses an effective date shorter than the notice period.

Decided, awaiting sign-off by: Legal. Workflow: [MP-19 Tariff change notice](workflows/MP-19-tariff-change-notice.md)

### MP-Q34

Two signing schemes and retry policies (BPC payment webhooks and Paytinno chargeback webhooks).

**Decision:** One sender: Paytinno sends all merchant events through S17 from the core journal and S4, with one signature, backoff for 24 h, then pull through the API. BPC webhooks are not taken at launch anyway (WF21); only the per-order checkout callback stays with the gateway.

Decided, awaiting sign-off by: CTO. Workflow: [MP-21 Webhooks](workflows/MP-21-webhooks.md)

### MP-Q35

Do people with money roles (Admin, Finance) need an identity check?

**Proposed:** Yes: IDV inside the portal when accepting an Admin or Finance invitation.

Owner: Compliance. Workflow: [MP-22 Invite, change and remove users](workflows/MP-22-invite-change-and-remove-users.md)

### MP-Q36

What happens when a periodic review is overdue?

**Proposed:** Reminders, then an S4 decision on restrictions (MP-26). Never automatic.

Owner: Compliance. Workflow: [MP-24 Business details, owners and periodic review](workflows/MP-24-business-details-owners-and-periodic-review.md)

### MP-Q37

Where are support conversations handled? The admin has no case management for them.

**Decision:** A simple inbox in S4 for phase 1; a help desk tool later.

Decided, awaiting sign-off by: COO. Workflow: [MP-25 Messages and notices](workflows/MP-25-messages-and-notices.md)

### MP-Q38

If revoked access stops every action, disputes go unanswered and are lost.

**Proposed:** Two levels: RESTRICTED (disputes and messages work) and REVOKED (read-only, after closure).

Owner: CTO. Workflow: [MP-26 Suspension and restricted access](workflows/MP-26-suspension-and-restricted-access.md)

### MP-Q39

Who keeps read access after closure, and for how long?

**Proposed:** Admins and Finance, 5 years (AML record keeping), then the users are disabled.

Owner: Legal. Workflow: [MP-27 Close the account](workflows/MP-27-close-the-account.md)

### MP-Q40

Should Paytinno send payment links to the merchant's customers by email or SMS?

**Proposed:** Not in phase 1; the merchant shares the link itself. Sending would make Paytinno process the merchant's customer data, and messages with payment links from a payment company are a common phishing pattern.

Owner: Legal. Workflow: [MP-29 Payment links and QR codes](workflows/MP-29-payment-links-and-qr-codes.md)

### MP-Q41

Which web address do links use: BPC's hosted page domain or one of ours?

**Proposed:** Our own sub-domain (for example pay.paytinno.com) in front of the BPC hosted page, so customers see a name they can check.

Owner: CTO. Workflow: [MP-29 Payment links and QR codes](workflows/MP-29-payment-links-and-qr-codes.md)

### MP-Q42

Who supplies, ships and supports terminals, and do merchants rent or buy them?

**Proposed:** Rent through Paytinno from one supplier, delivered by courier, replaced within [2] business days, rent shown in the tariff.

Owner: COO. Workflow: [MP-30 Card terminals](workflows/MP-30-card-terminals.md)

### MP-Q43

Should shop staff be able to refund on the terminal?

**Proposed:** Off by default. On request: protected by a supervisor PIN and a daily refund limit.

Owner: CRO. Workflow: [MP-30 Card terminals](workflows/MP-30-card-terminals.md)

### MP-Q44

Can an order that ships in parts be captured in several parts?

**Proposed:** Yes, if BPC supports several captures on one authorisation; otherwise one capture and the rest released.

Owner: CTO. Workflow: [MP-31 Capture later, or in part](workflows/MP-31-capture-later-or-in-part.md)

### MP-Q45

Which capture mode do new merchants get?

**Proposed:** Automatic. Manual only on request, for merchants that ship goods or take deposits, agreed in the onboarding review.

Owner: Product. Workflow: [MP-31 Capture later, or in part](workflows/MP-31-capture-later-or-in-part.md)

### MP-Q46

Who handles complaints and approves the answers?

**Proposed:** Compliance owns the process and approves every final answer; the handler is never the person or team complained about.

Owner: Compliance. Workflow: [MP-32 Complaints](workflows/MP-32-complaints.md)

### MP-Q47

Which escalation routes do we give merchants: the BNB, an out-of-court body, and later the UK ombudsman?

**Proposed:** The BNB always; the conciliation committee for payment disputes where it applies to the merchant; the UK Financial Ombudsman only once there are UK merchants.

Owner: Legal. Workflow: [MP-32 Complaints](workflows/MP-32-complaints.md)

### MP-Q48

Do our licence and the merchant agreement cover paying players from the operator's acquiring balance, and does that make the balance a payment account?

**Proposed:** Legal to confirm before build. If it does, the operator gets a payment account with its own terms.

Owner: Legal. Workflow: [MP-33 Payouts to players](workflows/MP-33-payouts-to-players.md)

### MP-Q49

Payouts sent through the API cannot be signed with SCA one by one. Is a payout-only key with an IP allow list and daily limits enough?

**Proposed:** Yes, under the exemption for secure corporate payment processes (RTS Art. 17), if the BNB agrees; batches approved in the portal are signed with SCA.

Owner: Compliance. Workflow: [MP-33 Payouts to players](workflows/MP-33-payouts-to-players.md)

### MP-Q50

Must payouts go back to the card or account the player deposited from?

**Proposed:** Yes: card payouts only to a card that deposited in the last [180] days; otherwise SEPA to an account in the player's name.

Owner: CRO. Workflow: [MP-33 Payouts to players](workflows/MP-33-payouts-to-players.md)

### MP-Q51

Where does the merchant activity log live, and for how long?

**Proposed:** An append-only store fed by S18, hash-chained like the admin journal; actions [5] years, IP addresses [13] months.

Owner: CTO. Workflow: [MP-34 Activity log](workflows/MP-34-activity-log.md)

### MP-Q52

At what level do we warn merchants, and which scheme fines do we pass on?

**Proposed:** Warn at [70%] of each threshold; pass on scheme fines in full while the merchant is in a programme, as the agreement says.

Owner: CRO. Workflow: [MP-35 Fraud and dispute ratio warnings](workflows/MP-35-fraud-and-dispute-ratio-warnings.md)

### MP-Q53

Is the status page public or only for signed-in merchants, and who approves the texts?

**Proposed:** Public, without details on causes; the incident manager approves, and Compliance too when DORA applies.

Owner: COO. Workflow: [MP-36 Incident and maintenance notices](workflows/MP-36-incident-and-maintenance-notices.md)

### MP-Q54

May we take what a merchant owes from its next payouts, and do we charge late interest?

**Proposed:** Yes to netting, written into the agreement; no late interest in phase 1.

Owner: Legal. Workflow: [MP-37 Money the merchant owes](workflows/MP-37-money-the-merchant-owes.md)

### MP-Q55

Who decides these requests, and how fast?

**Proposed:** The onboarding review team, in [3] business days, with the credit approver when a credit trigger is met (MP-Q60); four eyes above the same thresholds as onboarding.

Owner: CRO. Workflow: [MP-38 Ask for higher limits or new services](workflows/MP-38-ask-for-higher-limits-or-new-services.md)

### MP-Q56

Do we offer only saved cards and merchant-initiated payments, or also a subscription engine (plans, schedules, retries)?

**Proposed:** Only saved cards and merchant-initiated payments through the API in phase 1; merchants run their own schedules.

Owner: Product. Workflow: [MP-39 Saved cards and recurring payments](workflows/MP-39-saved-cards-and-recurring-payments.md)

### MP-Q57

Who registers merchant domains with Apple: BPC as the processor, or Paytinno as a payment platform?

**Proposed:** BPC, if it is already an Apple Pay payment platform; otherwise Paytinno applies to Apple.

Owner: CTO. Workflow: [MP-40 Apple Pay and Google Pay](workflows/MP-40-apple-pay-and-google-pay.md)

### MP-Q58

Who builds and maintains the plugins, and for which platforms first?

**Proposed:** Use BPC's plugins where they exist; otherwise build WooCommerce and OpenCart first, then CloudCart.

Owner: Product. Workflow: [MP-41 Shop plugins](workflows/MP-41-shop-plugins.md)

### MP-Q59

Can BPC issue keys limited to payments and refunds?

**Proposed:** Needed for plugins. If BPC cannot, plugins use the hosted page only.

Owner: CTO. Workflow: [MP-41 Shop plugins](workflows/MP-41-shop-plugins.md)

### MP-Q60

When does onboarding need a credit review (underwriting), and who signs it?

**Decision:** Only when a credit trigger is met: goods or services delivered later (travel, tickets, events, pre-orders, memberships of more than [3] months); expected monthly volume above [€250,000]; payouts faster than the schemes pay Paytinno; or reserve and deposit below the estimated exposure (volume times days to delivery plus the refund and chargeback window). The CRO or a delegated credit approver signs; the onboarding review team cannot approve its own credit decision.

Decided, awaiting sign-off by: CRO. Workflow: [MP-08 Onboarding review and the offer](workflows/MP-08-onboarding-review-and-the-offer.md)

### MP-Q61

Which sectors are high risk, and what extra checks does each get? v8.7 names only gambling (MCC 7995).

**Decision:** Compliance keeps one list in the risk policy, the same list the AML system scores on. At least: gambling (National Revenue Agency licence), crypto (registration or MiCA licence), online pharmacy and medicines (Bulgarian Drug Agency permit), adult content, dating, tobacco, e-cigarettes and alcohol (age checks), forex and CFDs (investment firm licence), nutraceuticals and free trials (subscription terms), travel and ticketing (credit review). Each gets a licence check where one applies, the scheme high-risk registration where Visa or Mastercard require it, a website and sales-model review, four eyes and KYB refresh every 12 months.

Decided, awaiting sign-off by: Compliance. Workflow: [MP-08 Onboarding review and the offer](workflows/MP-08-onboarding-review-and-the-offer.md)

### MP-Q62

Can the BPC API create the merchant, its terminals and its hosted page and SDK keys? (CTO question 21)

**Proposed:** Confirm with BPC. If not, set-up in BPC is a manual task in S4 with its own state (SETUP_MANUAL), an SLA of [2] business days and four eyes on the data typed into BPC. ACTIVE still needs both confirmations.

Owner: CTO. Workflow: [MP-09 Deposit, set-up and activation](workflows/MP-09-deposit-set-up-and-activation.md)

### MP-Q63

What happens when set-up half-fails, for example OraSYS opens the accounts but BPC keeps failing? v8.7 only says compensation and an S4 case (risk R10).

**Proposed:** OraSYS first, then BPC, each with an idempotency key per case. On a persistent failure the accounts stay blocked, not deleted, and an S4 case either retries or reverses: deactivate the BPC merchant if it was created, then close the empty accounts. Never active on one side only. Staff see both sides' state in the case.

Owner: CTO. Workflow: [MP-09 Deposit, set-up and activation](workflows/MP-09-deposit-set-up-and-activation.md)

### MP-Q64

When will the onboarding service (S6) exist? Until then the admin stands in for it. Where do onboarding cases live in the meantime, and how do they move to S6?

**Proposed:** The CTO to give a date. Until then the admin keeps the cases with the same states and IDs that S6 will use, so they move across as they are, without a second onboarding.

Owner: CTO. Workflow: [MP-05 Fill in and send the application](workflows/MP-05-fill-in-and-send-the-application.md)

### MP-Q65

How are MATCH and VMAS checked: through BPC, directly with Mastercard and Visa, or by hand?

**Decision:** By API, directly or through BPC, whichever the schemes and BPC allow. A manual check in the scheme's own tool only when the API cannot be used, with a screenshot or export kept in the case.

Decided, awaiting sign-off by: CTO. Workflow: [MP-08 Onboarding review and the offer](workflows/MP-08-onboarding-review-and-the-offer.md)

### MP-Q66

When does a terminated merchant go on MATCH and VMAS?

**Decision:** Only when the termination reason is one the scheme rules list. When one applies, listing is required, so it is not optional for staff. Commercial reasons, the merchant's own request and inactivity are never listed. Compliance keeps the mapping from our reasons to the scheme reason codes.

Decided, awaiting sign-off by: Compliance. Workflow: [MP-27 Close the account](workflows/MP-27-close-the-account.md)

### MP-Q67

v8.7 sends a case to MANUAL_REVIEW but never says where it goes next. What are the exits?

**Decision:** Three: cleared (false match with four eyes, or a PEP approved by senior management after enhanced due diligence) to ONBOARDING_REVIEW; information needed to an RFI (MP-07) and back; confirmed sanctions match, false documents or suspicion to CLOSED_REJECTED, decided by the MLRO, with a report to the authorities where required. Target [5] business days.

Decided, awaiting sign-off by: Compliance. Workflow: [MP-06 Company checks, identity and screening](workflows/MP-06-company-checks-identity-and-screening.md)

### MP-Q68

v8.7 puts API keys and payout account changes after launch: Paytinno staff do them in S4 until the BPC API covers them (questions 21 and 33). How does the merchant ask on day one?

**Proposed:** The portal sends the same request either way, signed with SCA. Without the API, staff carry it out in S4 with four eyes within [1] business day and the portal shows the status. For a key, staff only trigger it: S4 asks A09 for the key and S18 shows the secret once to the merchant, so no one at Paytinno sees it (MP-Q10). When the API arrives nothing changes for merchants.

Owner: CTO. Workflow: [MP-20 API keys: create, roll, revoke](workflows/MP-20-api-keys-create-roll-revoke.md)
