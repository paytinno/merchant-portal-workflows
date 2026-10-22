<!-- Generated from src/ by tools/build-docs.ps1. Edit src/workflows.js or src/model.js, not this file. -->

# Changes to v8.1

[All workflows](README.md)

What the CTO's architecture needs to change (v8.2) so it matches the decided workflows. Each line names the v8.1 workflow or step and the decision behind it.

## [MP-02 Sign in, switch business and check rights](workflows/MP-02-sign-in-switch-business-and-check-rights.md)

- WF02a 19 to 20: the portal names the business in an X-Merchant-Id header; S18 checks it against the person's merchants in S6 on every call (MP-Q07).
- WF02a: add an idle timeout of [30] min next to the 8 h session; refresh only while active (MP-Q06).

## [MP-03 Strong customer authentication for actions](workflows/MP-03-strong-customer-authentication-for-actions.md)

- WF02a 22: add dispute Accept and Escalate (MP-Q14), webhook secret reveal or roll (MP-Q11) and account closure to the SCA list.
- WF02a 26: replace "WF10 step 14, WF11 step 7" with the targets listed in step 8 here (MP-Q08).

## [MP-04 Lockout and lost passkey](workflows/MP-04-lockout-and-lost-passkey.md)

- WF02a 27: without a second admin, the identity check is an IDV selfie matched to onboarding, then four eyes in S4 (MP-Q05b).
- WF02a 27: after recovery, notify the person and every admin, and block payout account changes for [24 h].

## [MP-05 Fill in and send the application](workflows/MP-05-fill-in-and-send-the-application.md)

- WF02b states: add DRAFT before STARTED, kept by S6 for [90] days (MP-Q16).
- WF02b 1: Commercial Register pre-fill through the KYB connector's lookup (MP-Q15).
- WF02b 1: ask whether the company is a micro-enterprise; S6 keeps it for tariff notices (MP-Q33).
- WF02b 5: IDV check for the representative only; owners screened from data, IDV for owners only when high risk or the data disagree (MP-Q17).

## [MP-07 Request for information and the answer](workflows/MP-07-request-for-information-and-the-answer.md)

- Add the RFI to v8.1 as a sub-flow of WF02b and of periodic reviews, as in the admin spec 5.2 (rfi.send, merchant.message).
- Overdue RFI: onboarding withdrawn after [30] days; for a live merchant staff decide (MP-Q18).

## [MP-08 Underwriting decision and the offer](workflows/MP-08-underwriting-decision-and-the-offer.md)

- WF02b: add state OFFER_SENT between approval (step 12) and set-up (step 13); the representative accepts the offer and agreement with SCA; the offer lapses after [14] days (MP-Q19).

## [MP-09 Deposit, set-up and activation](workflows/MP-09-deposit-set-up-and-activation.md)

- WF02b states: add AWAITING_DEPOSIT between OFFER_SENT and PROVISIONING, as PRD WF11 needs; unpaid after [30] days the offer lapses (MP-Q20).

## [MP-12 Refund a payment](workflows/MP-12-refund-a-payment.md)

- WF11 15 to 17: before the A09 call, S18 checks open disputes with S4 (MP-Q24) and funds with S21 (MP-Q25). Replaces the PRD's block in "S21a".
- WF11: add cancelling an authorisation that is not captured, through A09 (MP-Q26).

## [MP-29 Payment links and QR codes](workflows/MP-29-payment-links-and-qr-codes.md)

- WF10: add creating, sharing and cancelling payment links and QR codes in the portal. WF10 lists link and QR as checkout channels but has no flow for them.

## [MP-30 Card terminals](workflows/MP-30-card-terminals.md)

- WF02b 14 and the S4 module: add how a merchant orders, activates, blocks, replaces and returns terminals, and who ships and supports them.

## [MP-31 Capture later, or in part](workflows/MP-31-capture-later-or-in-part.md)

- WF10 4: add capture and part capture started by the merchant through A09, the capture mode per website, and the expiry of holds that are not captured.

## [MP-39 Saved cards and recurring payments](workflows/MP-39-saved-cards-and-recurring-payments.md)

- WF10: add saved cards (stored credentials) and merchant-initiated payments: the first payment with SCA and consent, later payments referring to it, tokens visible and deletable in the portal.

## [MP-16 Answer a chargeback](workflows/MP-16-answer-a-chargeback.md)

- WF11 14 to 17: the merchant's Escalate or Accept goes to the DisputeCase in S4; chargeback analysts submit in VROL or Mastercom (PRD WF11 v6). Not through A09 at launch (MP-Q12).
- WF11 states: keep OPEN, SUBMITTED, WON, LOST, DECLINED for reporting; the portal shows the PRD stage names (MP-Q12).
- WF11 ledger: use the PRD's dispute (CB) sub-account; a shortfall comes from the reserve, then becomes a receivable from the merchant (MP-Q12).
- CTO question 29 answered: Paytinno chargeback analysts in S4 (MP-Q13).

## [MP-35 Fraud and dispute ratio warnings](workflows/MP-35-fraud-and-dispute-ratio-warnings.md)

- S4 monitoring (VAMP, ECP, EFM): show the merchant its own ratios and send warning, programme and exit notices (new templates scheme_warning, scheme_programme, scheme_exit).

## [MP-33 Payouts to players](workflows/MP-33-payouts-to-players.md)

- WF02b 10: for gambling (MCC 7995) add the National Revenue Agency licence check and the Visa and Mastercard high-risk merchant registration before activation.
- Add a player payout workflow to v8.1: funded from the merchant balance, card payouts through A09 or SEPA through NC3, with the operator's own review rules.

## [MP-37 Money the merchant owes](workflows/MP-37-money-the-merchant-owes.md)

- WF11 13: describe the receivable: the notice and amount in the portal, netting from future payouts if the agreement allows, transfer, reminders and escalation.

## [MP-21 Webhooks](workflows/MP-21-webhooks.md)

- WF10 3 and PRD WF11: all merchant webhooks come from Paytinno through S17 with one signature (X-Paytinno-Signature) and one retry policy: backoff for 24 h, then pull through GET /v1/events. Replaces the PRD's "once a day, 3 attempts" (MP-Q34).
- WF10 3: the portal does not register webhooks at BPC. Only the per-order checkout callback stays with the BPC gateway.
- WF02a 22: webhook endpoints and secrets need SCA (MP-Q11).

## [MP-40 Apple Pay and Google Pay](workflows/MP-40-apple-pay-and-google-pay.md)

- S10 gateway: add Apple Pay and Google Pay for merchant checkouts; v8.1 mentions them only for card issuing.

## [MP-41 Shop plugins](workflows/MP-41-shop-plugins.md)

- One-pager S3 item 6 (gateway keys): add restricted keys, payments and refunds only, for plugins.

## [MP-34 Activity log](workflows/MP-34-activity-log.md)

- S18: write an activity event for every portal and API command (who, what, when, from where, SCA evidence and approval IDs), readable by the merchant.

## [MP-25 Messages and notices](workflows/MP-25-messages-and-notices.md)

- S4 module: add a merchant support inbox for phase 1 (MP-Q37).
- S17: emails to merchants carry a link to the portal, not the content.

## [MP-32 Complaints](workflows/MP-32-complaints.md)

- Add a merchant complaint workflow to v8.1: S4 complaint cases with a 15 business day timer, a holding reply up to 35, Compliance approval and a complaints register (PSD2 Art. 101).

## [MP-36 Incident and maintenance notices](workflows/MP-36-incident-and-maintenance-notices.md)

- v8.1 incident handling: add notices to merchants for major ICT incidents (DORA Art. 19(3)), a status page outside the platform, portal banners and planned maintenance notices.

## [MP-38 Ask for higher limits or new services](workflows/MP-38-ask-for-higher-limits-or-new-services.md)

- WF02b underwriting: add re-underwriting on the merchant's request (limits, channels, countries, reserve) with the same four-eyes rules, and new terms accepted like the offer (MP-08).

## Depends on

Confirmations needed from outside Paytinno.

- BPC: hosted page orders created through the API with an expiry of up to [30] days (pay by link). ([MP-29](workflows/MP-29-payment-links-and-qr-codes.md))
- BPC: creating terminal IDs and blocking terminals through A09, and how its terminal management works with the device supplier. ([MP-30](workflows/MP-30-card-terminals.md))
- BPC: manual capture, part capture, incremental authorisation and hold expiry through A09 (CTO question 21). ([MP-31](workflows/MP-31-capture-later-or-in-part.md))
- BPC: tokens that can be deleted through A09, merchant-initiated payment flags, and card updater services (Visa Account Updater, Mastercard ABU). ([MP-39](workflows/MP-39-saved-cards-and-recurring-payments.md))
- BPC: card payouts (original credit transactions) for gambling winnings through A09. ([MP-33](workflows/MP-33-payouts-to-players.md))
- OraSYS: payout orders to third parties from a merchant balance through M0391. ([MP-33](workflows/MP-33-payouts-to-players.md))
- BPC: the gateway accepts a result callback URL per order (CTO question 21). ([MP-21](workflows/MP-21-webhooks.md))
- BPC: Apple Pay and Google Pay on the hosted page and in the JS SDK, and whether BPC is Apple's payment platform for merchant domains. ([MP-40](workflows/MP-40-apple-pay-and-google-pay.md))
- BPC: existing plugins for WooCommerce and OpenCart, or an API that a Paytinno plugin can use. ([MP-41](workflows/MP-41-shop-plugins.md))
