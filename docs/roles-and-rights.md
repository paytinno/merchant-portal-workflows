<!-- Generated from src/ by tools/build-docs.ps1. Edit src/workflows.js or src/model.js, not this file. -->

# Roles and rights

[All workflows](README.md)

Proposed (MP-Q01). v8.7 names only ONBOARDING_APPLICANT and MERCHANT_ADMIN. Roles live in S6; S18 checks them on every call. The screens hide what a role cannot do, but S18 is the control.

## Roles

| Role | Code | For |
|---|---|---|
| Admin | `MERCHANT_ADMIN` | Runs the account: people, payout account, keys, everything below. |
| Finance | `MERCHANT_FINANCE` | Money: balances, payouts, statements, refunds and disputes. |
| Developer | `MERCHANT_DEVELOPER` | Integration: API keys, webhooks, test data. Reads payments. |
| Support | `MERCHANT_SUPPORT` | Customer service: finds payments, refunds within a limit, answers disputes. |
| Viewer | `MERCHANT_VIEWER` | Reads everything except keys. Changes nothing. |
| Applicant | `ONBOARDING_APPLICANT` | Before activation: fills in and follows the application only (WF02a step 11). |

## Who can do what

SCA: the person signs with a passkey (dynamic linking). 2nd: a second person approves (MP-23), always or from the amount shown.

| Action | Admin | Finance | Developer | Support | Viewer | Applicant | Source |
|---|---|---|---|---|---|---|---|
| See payments and refunds `payments.view` | Yes | Yes | Yes | Yes | Yes | No |  |
| Refund a payment `refund.create` | Yes, SCA, 2nd from €500 | Yes, SCA, 2nd from €500 | No | Yes, SCA, 2nd from €500 | No | No | WF02a 22, WF11 15 |
| See disputes `dispute.view` | Yes | Yes | No | Yes | Yes | No |  |
| Escalate or accept a dispute `dispute.respond` | Yes, SCA | Yes, SCA | No | Yes, SCA | No | No | WF11 15 (money effect), not in WF02a 22 list (MP-Q14) |
| See balances and payouts `funds.view` | Yes | Yes | No | No | Yes | No |  |
| Pay out now `payout.create` | Yes, SCA, 2nd from €10,000 | Yes, SCA, 2nd from €10,000 | No | No | No | No | One-pager S3 item 5 |
| Change payout schedule or keep funds `payout.settings` | Yes, 2nd | Yes, 2nd | No | No | No | No |  |
| Change payout account `payout.account` | Yes, SCA, 2nd | No | No | No | No | No | WF02b invariant, WF02a 22 |
| Statements, invoices and fees `statements.view` | Yes | Yes | No | No | Yes | No |  |
| See API keys (masked) `keys.view` | Yes | No | Yes | No | No | No |  |
| Create, roll or revoke API keys `keys.manage` | Yes, SCA | No | Yes, SCA | No | No | No | WF02a 22 |
| Webhook endpoints and secrets `webhooks.manage` | Yes, SCA | No | Yes, SCA | No | No | No | Proposed: a webhook secret is a key (MP-Q11) |
| See team `team.view` | Yes | Yes | Yes | Yes | Yes | No |  |
| Invite, change or remove users `team.manage` | Yes, SCA | No | No | No | No | No | WF02a 22 (role above threshold) |
| Change business details, people, documents `business.edit` | Yes | No | No | No | No | No |  |
| Close the account `closure.request` | Yes, SCA, 2nd | No | No | No | No | No |  |
| Messages with Paytinno `messages` | Yes | Yes | Yes | Yes | Yes | Yes |  |
| Fill in the application `application` | Yes | No | No | No | No | Yes |  |
| Create and cancel payment links `links.create` | Yes | Yes | No | Yes | No | No | MP-29 |
| Capture an authorised payment `payment.capture` | Yes | Yes | No | Yes | No | No | MP-31 |
| Order, replace or return terminals `terminals.order` | Yes | No | No | No | No | No | MP-30 |
| Block a lost or stolen terminal `terminals.block` | Yes | Yes | No | Yes | No | No | MP-30 |
| Approve payouts to players (gambling) `players.payout` | Yes, SCA, 2nd from €2,000 | Yes, SCA, 2nd from €2,000 | No | No | No | No | MP-33 |
| See and delete saved cards `cards.manage` | Yes | No | No | Yes | No | No | MP-39 |
| Set up Apple Pay and Google Pay `wallets.manage` | Yes | No | Yes | No | No | No | MP-40 |
| See every user's activity `activity.view` | Yes | Yes | No | No | No | No | MP-34 (others see their own) |
| Ask for higher limits or new services `requests.create` | Yes | Yes | No | No | No | No | MP-38 |
| Make a complaint `complaints` | Yes | Yes | Yes | Yes | Yes | Yes | MP-32 |

## Default limits per person

| Role | Refund | Payout |
|---|---|---|
| Admin | €5,000 | €50,000 |
| Finance | €5,000 | €50,000 |
| Support | €100 | None |

An admin can lower a person's limit. Paytinno sets the business's maximum in the onboarding review (MP-Q05).

## Timers and limits

| Item | Value |
|---|---|
| Session | 8 h, idle [30] min |
| Refresh token | 30 days |
| SCA challenge | 5 min |
| Verification codes | 10 min, 5 attempts |
| Payout cut-off | [14:00 EET] |
| Minimum payout | [€100] |
| Reserve | 180 days |
| KYB review | 12 months high risk, 36 others |
| Old key after roll | [24] h |
| Invitation | [7] days |

Values in [brackets] are proposals.

## Application status texts

The portal shows its own fixed text for each state, never free text from staff (MP-Q09, no tipping off).

| State | Label | Text |
|---|---|---|
| `DRAFT` | Draft | Not sent yet. Your answers are saved as you go. |
| `STARTED` | Received | We have your application. |
| `KYB_PENDING` | Checking documents | We are checking your company, documents and the people you listed. |
| `INFO_REQUESTED` | We need something | We need more information from you. See Messages. |
| `MANUAL_REVIEW` | In review | We are reviewing your application. |
| `ONBOARDING_REVIEW` | Risk assessment | We are setting your limits and terms. |
| `OFFER_SENT` | Your offer | Approved. Please read and accept your offer. |
| `AWAITING_DEPOSIT` | Waiting for the deposit | Approved. Please transfer the guarantee deposit to start. |
| `PROVISIONING` | Setting up | Approved. We are setting up your account and keys. |
| `ACTIVE` | Active | You can take live payments. |
| `CLOSED_REJECTED` | Not approved | We cannot offer you the service. This decision is final. |
| `WITHDRAWN` | Withdrawn | You withdrew the application. |
