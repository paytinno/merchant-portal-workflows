<!-- Generated from src/ by tools/build-docs.ps1. Edit src/workflows.js or src/model.js, not this file. -->

# Merchant portal workflows

Version 0.1. The intended workflows behind the Paytinno merchant portal (S3), for review with the CTO's team before build.

| Status | Meaning | Workflows |
|---|---|---|
| In v8.1 | As the CTO's architecture v8.1 writes it | 4 |
| v8.1, gaps closed | In v8.1; every gap closed by a decision. The changes v8.1 needs are listed | 11 |
| Proposed | Not in v8.1. Needs the CTO team's agreement | 13 |

Also: [Questions](open-questions.md) (20 open, 20 decided and awaiting sign-off), [Changes to v8.1](changes-to-v8.1.md), [Roles and rights](roles-and-rights.md), [Systems](systems.md), [Sources and contradictions](sources.md).

## Access

| ID | Workflow | Status | Source | Steps | Questions |
|---|---|---|---|---|---|
| MP-01 | [Register and create a passkey](workflows/MP-01-register-and-create-a-passkey.md)<br>No passwords. The person proves an email and a phone, saves a passkey, and gets the applicant role. Company data comes later in the application. | In v8.1 | WF02a steps 1 to 12 | 13 | 3 |
| MP-02 | [Sign in, switch business and check rights](workflows/MP-02-sign-in-switch-business-and-check-rights.md)<br>Passkey sign-in. Roles are not in the token: S18 asks S6 on every request which merchants and rights the person has. | v8.1, gaps closed | WF02a steps 13 to 21 | 11 | 2 |
| MP-03 | [Strong customer authentication for actions](workflows/MP-03-strong-customer-authentication-for-actions.md)<br>The passkey signs exactly what the user sees (amount and payee, or the key, or the person). S18 matches the evidence to the command before sending it on. | v8.1, gaps closed | WF02a steps 22 to 26 | 9 | 2 |
| MP-04 | [Lockout and lost passkey](workflows/MP-04-lockout-and-lost-passkey.md)<br>Recovery re-proves email and phone. For an admin of a live merchant, another admin approves; otherwise Paytinno staff check identity. | v8.1, gaps closed | WF02a steps 17 and 27 | 10 | 1 |

## Onboarding

| ID | Workflow | Status | Source | Steps | Questions |
|---|---|---|---|---|---|
| MP-05 | [Fill in and send the application](workflows/MP-05-fill-in-and-send-the-application.md)<br>Six steps: company, people, business, documents, payout account, review. Saved as a draft on every step; sent once complete. | v8.1, gaps closed | WF02b steps 1 to 4; admin spec application.submitted | 14 | 3 |
| MP-06 | [Company checks, identity and screening](workflows/MP-06-company-checks-identity-and-screening.md)<br>The representative does an IDV check inside the portal. The company and owners are checked and screened. The portal only ever says "Checking documents" or "In review". | In v8.1 | WF02b steps 5 to 9 | 7 | 1 |
| MP-07 | [Request for information and the answer](workflows/MP-07-request-for-information-and-the-answer.md)<br>Staff ask, the merchant answers in the portal with text and documents. The application status shows "We need something" while it is open. | v8.1, gaps closed | Admin spec 5.2 rfi.send and merchant.message; not a v8.1 workflow | 11 | 1 |
| MP-08 | [Underwriting decision and the offer](workflows/MP-08-underwriting-decision-and-the-offer.md)<br>Staff set limits, tariff, reserve and deposit with four eyes. Then the merchant sees the offer and accepts it with SCA before set-up starts. | v8.1, gaps closed | WF02b steps 10 to 12 | 8 | 1 |
| MP-09 | [Deposit, set-up and activation](workflows/MP-09-deposit-set-up-and-activation.md)<br>If a deposit is required, the merchant transfers it first. Then accounts in OraSYS and the merchant in BPC. Only when both confirm is the merchant active and the full portal opens. | v8.1, gaps closed | WF02b steps 13 to 17; PRD WF11 AWAITING_DEPOSIT; admin spec 5.4 access.grant | 11 | 1 |
| MP-10 | [Go live: from test to live payments](workflows/MP-10-go-live-from-test-to-live-payments.md)<br>The developer proves the integration with test cards; staff check the website; then live keys are issued. | Proposed | WF02b 17 ("sandbox first"); module spec v7.1 sandbox with test cards | 8 | 1 |

## Payments

| ID | Workflow | Status | Source | Steps | Questions |
|---|---|---|---|---|---|
| MP-11 | [See payments and one payment](workflows/MP-11-see-payments-and-one-payment.md)<br>Payment records come from BPC through A09 (masked). Money comes from OraSYS through M0391. Each part says when it was last updated; when they disagree, OraSYS wins. | In v8.1 | WF10 steps 13 to 16 | 5 | 2 |
| MP-12 | [Refund a payment](workflows/MP-12-refund-a-payment.md)<br>Checks before sending: refundable amount, open dispute, the user's mandate. SCA binds amount and payment. The ledger effect comes only from NC2. | v8.1, gaps closed | WF11 steps 15 to 17; PRD refund link to disputes | 13 | 3 |

## Disputes

| ID | Workflow | Status | Source | Steps | Questions |
|---|---|---|---|---|---|
| MP-16 | [Answer a chargeback](workflows/MP-16-answer-a-chargeback.md)<br>The money moves to a dispute account at once. The merchant gets a deadline, can upload documents, then escalates or accepts. Silence by the deadline means lost. | v8.1, gaps closed | WF11 steps 11 to 17; PRD WF11 Acquiring v6 | 13 | 2 |
| MP-17 | [Rolling reserve and reserve top-up](workflows/MP-17-rolling-reserve-and-reserve-top-up.md)<br>A share of each settlement is held for [180] days and released day by day. If Risk asks for more, the merchant transfers it; it is never taken from settlements. | Proposed | PRD WF11 (RR, RR_TOPUP); WF10 reserve release 180 days (proposed) | 7 | 1 |

## Money

| ID | Workflow | Status | Source | Steps | Questions |
|---|---|---|---|---|---|
| MP-13 | [Balances, settlement and automatic payouts](workflows/MP-13-balances-settlement-and-automatic-payouts.md)<br>Captured payments become payable after settlement, available after the reserve, and are paid out to the verified account on the merchant's schedule, if reconciliation is clean. | In v8.1 | WF10 steps 4 to 12 | 7 | 1 |
| MP-14 | [Pay out now, and payout settings](workflows/MP-14-pay-out-now-and-payout-settings.md)<br>Only to the verified payout account, only from available funds, with SCA. Over the person's limit a second person approves. | Proposed | One-pager S3 item 5 ("payout to an external account through M0391"); WF10 12 ("funds stay with us by choice") | 9 | 1 |
| MP-15 | [Change the payout account](workflows/MP-15-change-the-payout-account.md)<br>The highest-risk change in the portal. Name check, second admin, staff check, then a cooling-off period before the first payout. The old account stays in use until then. | Proposed | WF02b invariant (verified account in the merchant's name, SCA); admin spec payout.account.changed | 8 | 2 |
| MP-18 | [Statements, invoices and fees](workflows/MP-18-statements-invoices-and-fees.md)<br>Monthly statement and invoice, and the fee for every payment split into interchange, scheme fee and our fee. | Proposed | One-pager S3 item 3; S7 "fee breakdown to S3" (IFR Art. 12); S17 statements | 5 | 1 |
| MP-19 | [Tariff change notice](workflows/MP-19-tariff-change-notice.md)<br>The new version is scheduled with a notice period; the merchant sees old and new side by side and the right to end the agreement. | Proposed | S17 regulatory notices ("tariff change"); admin spec template tariff_change | 5 | 1 |

## Developers

| ID | Workflow | Status | Source | Steps | Questions |
|---|---|---|---|---|---|
| MP-20 | [API keys: create, roll, revoke](workflows/MP-20-api-keys-create-roll-revoke.md)<br>Secrets are shown once and never kept by Paytinno. Rolling keeps the old key working for [24 h] so the merchant can switch without downtime. | Proposed | One-pager S3 item 6; WF10 3 (keys through S3, S4 operator until the BPC API covers it) | 7 | 1 |
| MP-21 | [Webhooks](workflows/MP-21-webhooks.md)<br>One sender, one signature, one retry policy: Paytinno sends every event through S17. Only the result at checkout comes straight from the card processor's gateway, set per order. | v8.1, gaps closed | WF10 3 (BPC webhooks); WF21 (merchant notices through Q5, A07, Q4); PRD WF11 (chargeback webhooks through S17); module spec v7.1 | 9 | 2 |
| MP-28 | [Reports and exports](workflows/MP-28-reports-and-exports.md)<br>Small exports download at once; large ones run as a job and are ready to download in the portal. | Proposed | Not in v8.1 | 4 | 0 |

## Team

| ID | Workflow | Status | Source | Steps | Questions |
|---|---|---|---|---|---|
| MP-22 | [Invite, change and remove users](workflows/MP-22-invite-change-and-remove-users.md)<br>Invitations by email, accepted through the normal registration. Roles that can move money need SCA to grant. | Proposed | One-pager S3 item 7; WF02b 17 ("invites its other users with roles"); WF02a 22 (role above threshold) | 8 | 2 |
| MP-23 | [Approvals by a second person](workflows/MP-23-approvals-by-a-second-person.md)<br>The merchant's own four eyes. The request waits until someone else with the right role approves with SCA. | Proposed | One-pager S3 item 7 ("business roles, mandates and approvals"); not modelled in v8.1 | 5 | 1 |

## Business

| ID | Workflow | Status | Source | Steps | Questions |
|---|---|---|---|---|---|
| MP-24 | [Business details, owners and periodic review](workflows/MP-24-business-details-owners-and-periodic-review.md)<br>Contact details change at once. Legal name, address, owners, representative, what is sold and new websites are requests that staff check first. | Proposed | WF02b invariants (KYB refresh 12 or 36 months; owner change opens a case); admin spec application.updated | 8 | 1 |
| MP-25 | [Messages and notices](workflows/MP-25-messages-and-notices.md)<br>One inbox for requests, notices and support. Emails carry a link, not the content. | v8.1, gaps closed | S17; admin spec 5.3 merchant.notify templates | 5 | 1 |
| MP-26 | [Suspension and restricted access](workflows/MP-26-suspension-and-restricted-access.md)<br>Staff decide with four eyes. New payments stop; what the merchant can still do is limited but disputes stay answerable. | Proposed | Admin spec 5.4 access.revoke and P6; WF11 rule (chargeback ratio above 1%) | 5 | 1 |
| MP-27 | [Close the account](workflows/MP-27-close-the-account.md)<br>Acceptance stops on the date, the balance is paid out, the reserve is kept for the chargeback tail, and the portal stays readable. | Proposed | S6 lifecycle and S4 closure (one-pager); admin spec P6 (5 years read access) | 6 | 1 |
