<!-- Generated from src/ by tools/build-docs.ps1. Edit src/workflows.js or src/model.js, not this file. -->

# Open questions

[All workflows](README.md)

Decisions the portal needs before build. Each has a proposed answer to agree or change. CTO question numbers refer to the v8.1 question list.

| ID | Question | Owner | Workflow |
|---|---|---|---|
| [MP-Q01](#mp-q01) | v8.1 names only ONBOARDING_APPLICANT and MERCHANT_ADMIN. There is no role list or permission table. | Product | [MP-22](workflows/MP-22-invite-change-and-remove-users.md) |
| [MP-Q02](#mp-q02) | Registration with an email that already exists returns 409 in v8.1. That is an account lookup for anyone. | CTO | [MP-01](workflows/MP-01-register-and-create-a-passkey.md) |
| [MP-Q03](#mp-q03) | The BNB has not confirmed a passkey with dynamic linking as SCA on the web. For the portal it is the only method (no password, no push to the app). | Compliance | [MP-01](workflows/MP-01-register-and-create-a-passkey.md) |
| [MP-Q04](#mp-q04) | One passkey per person makes lost phones a frequent recovery case. | Product | [MP-01](workflows/MP-01-register-and-create-a-passkey.md) |
| [MP-Q05b](#mp-q05b) | How do staff check identity in recovery without a second admin? | Compliance | [MP-04](workflows/MP-04-lockout-and-lost-passkey.md) |
| [MP-Q05](#mp-q05) | Who sets limits, and are there defaults? | Product | [MP-23](workflows/MP-23-approvals-by-a-second-person.md) |
| [MP-Q06](#mp-q06) | No idle timeout is defined (only 8 h session and 30 day refresh). | CTO | [MP-02](workflows/MP-02-sign-in-switch-business-and-check-rights.md) |
| [MP-Q07](#mp-q07) | How does a call say which business it is for, when one person serves several? | CTO | [MP-02](workflows/MP-02-sign-in-switch-business-and-check-rights.md) |
| [MP-Q08](#mp-q08) | WF02a step 26 continues to "WF10 step 14, WF11 step 7". WF10 14 is a read and WF11 7 is issuing. | CTO | [MP-03](workflows/MP-03-strong-customer-authentication-for-actions.md) |
| [MP-Q09](#mp-q09) | Should the portal show the admin's free-text status label, or its own fixed text per state? (admin spec P7) | Compliance | [MP-06](workflows/MP-06-company-checks-identity-and-screening.md) |
| [MP-Q10](#mp-q10) | If BPC cannot create keys through its API, how does the secret reach the merchant without staff seeing it? | BPC | [MP-20](workflows/MP-20-api-keys-create-roll-revoke.md) |
| [MP-Q11](#mp-q11) | Is a webhook signing secret a key needing SCA? It lets anyone fake events to the merchant. | CTO | [MP-21](workflows/MP-21-webhooks.md) |
| [MP-Q12](#mp-q12) | The PRD and v8.1 WF11 disagree: states (PRD stages vs OPEN/SUBMITTED/WON/LOST), channel (staff in VROL/Mastercom vs A09 to BPC), ledger (CB sub-account vs reserve and receivable). | CTO | [MP-16](workflows/MP-16-answer-a-chargeback.md) |
| [MP-Q13](#mp-q13) | Who works disputes at launch? (CTO question 29) | COO | [MP-16](workflows/MP-16-answer-a-chargeback.md) |
| [MP-Q14](#mp-q14) | Accepting a dispute is final and costs money, but it is not on the SCA list in WF02a 22. WF11 15 says SCA for actions with a money effect. | CTO | [MP-03](workflows/MP-03-strong-customer-authentication-for-actions.md) |
| [MP-Q15](#mp-q15) | Should the portal pre-fill from the Commercial Register? | CTO | [MP-05](workflows/MP-05-fill-in-and-send-the-application.md) |
| [MP-Q16](#mp-q16) | Where is the draft kept before it is sent? v8.1 starts the case only at submission. | CTO | [MP-05](workflows/MP-05-fill-in-and-send-the-application.md) |
| [MP-Q17](#mp-q17) | Who must do an identity check: only the representative (v8.1), or every owner (the design prototype)? | Compliance | [MP-05](workflows/MP-05-fill-in-and-send-the-application.md) |
| [MP-Q18](#mp-q18) | What happens when an RFI is overdue? | Compliance | [MP-07](workflows/MP-07-request-for-information-and-the-answer.md) |
| [MP-Q19](#mp-q19) | Where does the merchant agree to the tariff, reserve and agreement? v8.1 goes from approval straight to set-up. | Legal | [MP-08](workflows/MP-08-underwriting-decision-and-the-offer.md) |
| [MP-Q20](#mp-q20) | AWAITING_DEPOSIT (PRD WF11) is not in the WF02b state machine. | CTO | [MP-09](workflows/MP-09-deposit-set-up-and-activation.md) |
| [MP-Q21](#mp-q21) | Can test keys be given as soon as the application is sent, so developers start during review (as the design prototype shows)? | CTO | [MP-10](workflows/MP-10-go-live-from-test-to-live-payments.md) |
| [MP-Q22](#mp-q22) | Cache payment data in S18 when BPC is slow or down? (CTO question 22) | CTO | [MP-11](workflows/MP-11-see-payments-and-one-payment.md) |
| [MP-Q23](#mp-q23) | Can the BPC API search by order reference, card last 4 and amount? | BPC | [MP-11](workflows/MP-11-see-payments-and-one-payment.md) |
| [MP-Q24](#mp-q24) | Where does the "no refund while disputed" check run? The PRD says S21a; in v8.1 portal refunds go S18 to A09 to BPC. | CTO | [MP-12](workflows/MP-12-refund-a-payment.md) |
| [MP-Q25](#mp-q25) | What if the merchant's balance is lower than the refund? | Finance | [MP-12](workflows/MP-12-refund-a-payment.md) |
| [MP-Q26](#mp-q26) | Cancelling an authorisation that is not captured is not described anywhere. | CTO | [MP-12](workflows/MP-12-refund-a-payment.md) |
| [MP-Q27](#mp-q27) | Reserve release: v8.1 proposes 180 days; the PRD says "on schedule" with no number. | CRO | [MP-17](workflows/MP-17-rolling-reserve-and-reserve-top-up.md) |
| [MP-Q28](#mp-q28) | Which payout schedules does M0391 support (daily, weekly, monthly, minimum amount)? | OraSYS | [MP-13](workflows/MP-13-balances-settlement-and-automatic-payouts.md) |
| [MP-Q29](#mp-q29) | "Funds stay with us by choice" (WF10 12): is that allowed, for how long, and how are those funds safeguarded? | Compliance | [MP-14](workflows/MP-14-pay-out-now-and-payout-settings.md) |
| [MP-Q30](#mp-q30) | How is "account in the merchant's name" verified? | Compliance | [MP-15](workflows/MP-15-change-the-payout-account.md) |
| [MP-Q31](#mp-q31) | Cooling-off before the first payout to a new account? | CRO | [MP-15](workflows/MP-15-change-the-payout-account.md) |
| [MP-Q32](#mp-q32) | Can M008 give the IFR Art. 12 split per payment? | OraSYS | [MP-18](workflows/MP-18-statements-invoices-and-fees.md) |
| [MP-Q33](#mp-q33) | Notice periods differ for micro-enterprises, but onboarding does not ask whether the merchant is one. | Legal | [MP-19](workflows/MP-19-tariff-change-notice.md) |
| [MP-Q34](#mp-q34) | Two signing schemes and retry policies (BPC payment webhooks and Paytinno chargeback webhooks). | CTO | [MP-21](workflows/MP-21-webhooks.md) |
| [MP-Q35](#mp-q35) | Do people with money roles (Admin, Finance) need an identity check? | Compliance | [MP-22](workflows/MP-22-invite-change-and-remove-users.md) |
| [MP-Q36](#mp-q36) | What happens when a periodic review is overdue? | Compliance | [MP-24](workflows/MP-24-business-details-owners-and-periodic-review.md) |
| [MP-Q37](#mp-q37) | Where are support conversations handled? The admin has no case management for them. | COO | [MP-25](workflows/MP-25-messages-and-notices.md) |
| [MP-Q38](#mp-q38) | If revoked access stops every action, disputes go unanswered and are lost. | CTO | [MP-26](workflows/MP-26-suspension-and-restricted-access.md) |
| [MP-Q39](#mp-q39) | Who keeps read access after closure, and for how long? | Legal | [MP-27](workflows/MP-27-close-the-account.md) |

By owner: BPC 2, COO 2, CRO 2, CTO 16, Compliance 9, Finance 1, Legal 3, OraSYS 2, Product 3.

### MP-Q01

v8.1 names only ONBOARDING_APPLICANT and MERCHANT_ADMIN. There is no role list or permission table.

**Proposed:** Admin, Finance, Developer, Support, Viewer with the table under Roles and rights.

Owner: Product. Workflow: [MP-22 Invite, change and remove users](workflows/MP-22-invite-change-and-remove-users.md)

### MP-Q02

Registration with an email that already exists returns 409 in v8.1. That is an account lookup for anyone.

**Proposed:** Always answer 202 "if the address can be used, we sent codes". If the email exists, send that person an email saying someone tried to register with it.

Owner: CTO. Workflow: [MP-01 Register and create a passkey](workflows/MP-01-register-and-create-a-passkey.md)

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

**Proposed:** IDV selfie check matched to the face from onboarding (no new documents), then four eyes in S4. Block payout account changes for [24 h] after.

Owner: Compliance. Workflow: [MP-04 Lockout and lost passkey](workflows/MP-04-lockout-and-lost-passkey.md)

### MP-Q05

Who sets limits, and are there defaults?

**Proposed:** Defaults per role (Support refunds up to [€100]); an admin can lower a person's limit, not raise it above the merchant's limit set by Paytinno.

Owner: Product. Workflow: [MP-23 Approvals by a second person](workflows/MP-23-approvals-by-a-second-person.md)

### MP-Q06

No idle timeout is defined (only 8 h session and 30 day refresh).

**Proposed:** [30] min idle, 8 h absolute, refresh only while active. Money actions need SCA anyway.

Owner: CTO. Workflow: [MP-02 Sign in, switch business and check rights](workflows/MP-02-sign-in-switch-business-and-check-rights.md)

### MP-Q07

How does a call say which business it is for, when one person serves several?

**Proposed:** Header X-Merchant-Id on every call; S18 checks it against S6. The sidebar business switcher sets it.

Owner: CTO. Workflow: [MP-02 Sign in, switch business and check rights](workflows/MP-02-sign-in-switch-business-and-check-rights.md)

### MP-Q08

WF02a step 26 continues to "WF10 step 14, WF11 step 7". WF10 14 is a read and WF11 7 is issuing.

**Proposed:** Refund continues to WF11 step 16; payout to MP-14; payout account to MP-15; key roll to MP-20. Fix in v8.2.

Owner: CTO. Workflow: [MP-03 Strong customer authentication for actions](workflows/MP-03-strong-customer-authentication-for-actions.md)

### MP-Q09

Should the portal show the admin's free-text status label, or its own fixed text per state? (admin spec P7)

**Proposed:** Fixed texts per state in the portal, in Bulgarian and English. Free text only inside an RFI, which staff write knowingly.

Owner: Compliance. Workflow: [MP-06 Company checks, identity and screening](workflows/MP-06-company-checks-identity-and-screening.md)

### MP-Q10

If BPC cannot create keys through its API, how does the secret reach the merchant without staff seeing it?

**Proposed:** Do not launch key self-service with an operator in the middle. Either BPC API support, or BPC's own console link for the first key. Confirm with BPC before build.

Owner: BPC. Workflow: [MP-20 API keys: create, roll, revoke](workflows/MP-20-api-keys-create-roll-revoke.md)

### MP-Q11

Is a webhook signing secret a key needing SCA? It lets anyone fake events to the merchant.

**Proposed:** Yes: SCA to reveal or roll.

Owner: CTO. Workflow: [MP-21 Webhooks](workflows/MP-21-webhooks.md)

### MP-Q12

The PRD and v8.1 WF11 disagree: states (PRD stages vs OPEN/SUBMITTED/WON/LOST), channel (staff in VROL/Mastercom vs A09 to BPC), ledger (CB sub-account vs reserve and receivable).

**Proposed:** Use the PRD for the merchant side and update WF11 in v8.2. The portal shows PRD stages and maps them to the v8.1 states for reporting.

Owner: CTO. Workflow: [MP-16 Answer a chargeback](workflows/MP-16-answer-a-chargeback.md)

### MP-Q13

Who works disputes at launch? (CTO question 29)

**Proposed:** Paytinno chargeback analysts in S4 (PRD), with the merchant answering in the portal.

Owner: COO. Workflow: [MP-16 Answer a chargeback](workflows/MP-16-answer-a-chargeback.md)

### MP-Q14

Accepting a dispute is final and costs money, but it is not on the SCA list in WF02a 22. WF11 15 says SCA for actions with a money effect.

**Proposed:** Require SCA for Accept and Escalate. Add to the WF02a 22 list.

Owner: CTO. Workflow: [MP-03 Strong customer authentication for actions](workflows/MP-03-strong-customer-authentication-for-actions.md)

### MP-Q15

Should the portal pre-fill from the Commercial Register?

**Proposed:** Yes. S18 calls the same register lookup the KYB connector uses. Pre-filled fields are marked and kept as the register said.

Owner: CTO. Workflow: [MP-05 Fill in and send the application](workflows/MP-05-fill-in-and-send-the-application.md)

### MP-Q16

Where is the draft kept before it is sent? v8.1 starts the case only at submission.

**Proposed:** Draft in S18 (or S6) keyed by person, kept [90] days. Documents uploaded to the draft are deleted with it.

Owner: CTO. Workflow: [MP-05 Fill in and send the application](workflows/MP-05-fill-in-and-send-the-application.md)

### MP-Q17

Who must do an identity check: only the representative (v8.1), or every owner (the design prototype)?

**Proposed:** Representative always. Owners are screened from data; an IDV check for owners only for high-risk merchants or when the register and the declaration disagree.

Owner: Compliance. Workflow: [MP-05 Fill in and send the application](workflows/MP-05-fill-in-and-send-the-application.md)

### MP-Q18

What happens when an RFI is overdue?

**Proposed:** Onboarding: application paused, withdrawn after [30] days with notice. Live merchant: reminder, then a restriction decision in S4 (MP-26), never automatic.

Owner: Compliance. Workflow: [MP-07 Request for information and the answer](workflows/MP-07-request-for-information-and-the-answer.md)

### MP-Q19

Where does the merchant agree to the tariff, reserve and agreement? v8.1 goes from approval straight to set-up.

**Proposed:** Add OFFER_SENT: the offer in the portal, accepted with SCA by the applicant who is the representative. Qualified e-signature only if Legal requires it.

Owner: Legal. Workflow: [MP-08 Underwriting decision and the offer](workflows/MP-08-underwriting-decision-and-the-offer.md)

### MP-Q20

AWAITING_DEPOSIT (PRD WF11) is not in the WF02b state machine.

**Proposed:** Add it between the offer and PROVISIONING. Show the deposit IBAN and reference in the portal. Unpaid after [30] days: offer lapses.

Owner: CTO. Workflow: [MP-09 Deposit, set-up and activation](workflows/MP-09-deposit-set-up-and-activation.md)

### MP-Q21

Can test keys be given as soon as the application is sent, so developers start during review (as the design prototype shows)?

**Proposed:** Yes, if BPC offers a sandbox merchant without onboarding. Otherwise at activation as v8.1 says.

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

Where does the "no refund while disputed" check run? The PRD says S21a; in v8.1 portal refunds go S18 to A09 to BPC.

**Proposed:** S18 asks S4 synchronously (DisputeCase by payment) before the A09 call. S4 also re-checks on every stage change (PRD).

Owner: CTO. Workflow: [MP-12 Refund a payment](workflows/MP-12-refund-a-payment.md)

### MP-Q25

What if the merchant's balance is lower than the refund?

**Proposed:** Allowed up to available plus pending; above that, refused with "top up by transfer". Never a negative balance.

Owner: Finance. Workflow: [MP-12 Refund a payment](workflows/MP-12-refund-a-payment.md)

### MP-Q26

Cancelling an authorisation that is not captured is not described anywhere.

**Proposed:** A "Cancel" action on authorised payments through A09, same rights as refund, no SCA (no money leaves).

Owner: CTO. Workflow: [MP-12 Refund a payment](workflows/MP-12-refund-a-payment.md)

### MP-Q27

Reserve release: v8.1 proposes 180 days; the PRD says "on schedule" with no number.

**Proposed:** 180 days rolling, daily release, per merchant override set in underwriting.

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

**Proposed:** Ask in the application (MP-05) and keep it in S6; S7 refuses an effective date shorter than the notice period.

Owner: Legal. Workflow: [MP-19 Tariff change notice](workflows/MP-19-tariff-change-notice.md)

### MP-Q34

Two signing schemes and retry policies (BPC payment webhooks and Paytinno chargeback webhooks).

**Proposed:** Merchant sees one: Paytinno relays BPC payment events through S17 with the same signature, retries with backoff for 24 h, then pull through the API.

Owner: CTO. Workflow: [MP-21 Webhooks](workflows/MP-21-webhooks.md)

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

**Proposed:** A simple inbox in S4 for phase 1; a help desk tool later.

Owner: COO. Workflow: [MP-25 Messages and notices](workflows/MP-25-messages-and-notices.md)

### MP-Q38

If revoked access stops every action, disputes go unanswered and are lost.

**Proposed:** Two levels: RESTRICTED (disputes and messages work) and REVOKED (read-only, after closure).

Owner: CTO. Workflow: [MP-26 Suspension and restricted access](workflows/MP-26-suspension-and-restricted-access.md)

### MP-Q39

Who keeps read access after closure, and for how long?

**Proposed:** Admins and Finance, 5 years (AML record keeping), then the users are disabled.

Owner: Legal. Workflow: [MP-27 Close the account](workflows/MP-27-close-the-account.md)
