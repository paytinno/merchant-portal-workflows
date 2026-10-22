/* Roles, permissions, limits, application status texts and the systems (lanes) behind the merchant portal.
   Part of the intended design: the merchant-portal prototype runs on this file too.
   Values in [brackets] are proposals for the CTO's review; nothing here is agreed yet.
   Role names ONBOARDING_APPLICANT and MERCHANT_ADMIN come from WF02a/WF02b (v8.1); the others are proposed (MP-Q01). */
window.CONFIG = (function () {
  "use strict";

  const ROLES = {
    admin:     { label: "Admin",     code: "MERCHANT_ADMIN",       desc: "Runs the account: people, payout account, keys, everything below." },
    finance:   { label: "Finance",   code: "MERCHANT_FINANCE",     desc: "Money: balances, payouts, statements, refunds and disputes." },
    developer: { label: "Developer", code: "MERCHANT_DEVELOPER",   desc: "Integration: API keys, webhooks, test data. Reads payments." },
    support:   { label: "Support",   code: "MERCHANT_SUPPORT",     desc: "Customer service: finds payments, refunds within a limit, answers disputes." },
    viewer:    { label: "Viewer",    code: "MERCHANT_VIEWER",      desc: "Reads everything except keys. Changes nothing." },
    applicant: { label: "Applicant", code: "ONBOARDING_APPLICANT", desc: "Before activation: fills in and follows the application only (WF02a step 11)." }
  };

  /* roles: who may start it. sca: needs SCA with dynamic linking (WF02a step 22, extended where marked).
     second: who must approve as a second person, and from which amount (merchant-side dual control, MP-Q05). */
  const PERMS = {
    "payments.view":   { label: "See payments and refunds", roles: ["admin", "finance", "developer", "support", "viewer"] },
    "refund.create":   { label: "Refund a payment", roles: ["admin", "finance", "support"], sca: true, second: { roles: ["admin", "finance"], from: 500 }, src: "WF02a 22, WF11 15" },
    "dispute.view":    { label: "See disputes", roles: ["admin", "finance", "support", "viewer"] },
    "dispute.respond": { label: "Escalate or accept a dispute", roles: ["admin", "finance", "support"], sca: true, src: "WF11 15 (money effect), not in WF02a 22 list (MP-Q14)" },
    "funds.view":      { label: "See balances and payouts", roles: ["admin", "finance", "viewer"] },
    "payout.create":   { label: "Pay out now", roles: ["admin", "finance"], sca: true, second: { roles: ["admin", "finance"], from: 10000 }, src: "One-pager S3 item 5" },
    "payout.settings": { label: "Change payout schedule or keep funds", roles: ["admin", "finance"], second: { roles: ["admin"], from: 0 } },
    "payout.account":  { label: "Change payout account", roles: ["admin"], sca: true, second: { roles: ["admin"], from: 0 }, src: "WF02b invariant, WF02a 22" },
    "statements.view": { label: "Statements, invoices and fees", roles: ["admin", "finance", "viewer"] },
    "keys.view":       { label: "See API keys (masked)", roles: ["admin", "developer"] },
    "keys.manage":     { label: "Create, roll or revoke API keys", roles: ["admin", "developer"], sca: true, src: "WF02a 22" },
    "webhooks.manage": { label: "Webhook endpoints and secrets", roles: ["admin", "developer"], sca: true, src: "Proposed: a webhook secret is a key (MP-Q11)" },
    "team.view":       { label: "See team", roles: ["admin", "finance", "developer", "support", "viewer"] },
    "team.manage":     { label: "Invite, change or remove users", roles: ["admin"], sca: true, src: "WF02a 22 (role above threshold)" },
    "business.edit":   { label: "Change business details, people, documents", roles: ["admin"] },
    "closure.request": { label: "Close the account", roles: ["admin"], sca: true, second: { roles: ["admin"], from: 0 } },
    "messages":        { label: "Messages with Paytinno", roles: ["admin", "finance", "developer", "support", "viewer", "applicant"] },
    "application":     { label: "Fill in the application", roles: ["admin", "applicant"] },
    /* added with MP-29 to MP-41 */
    "links.create":    { label: "Create and cancel payment links", roles: ["admin", "finance", "support"], src: "MP-29" },
    "payment.capture": { label: "Capture an authorised payment", roles: ["admin", "finance", "support"], src: "MP-31" },
    "terminals.order": { label: "Order, replace or return terminals", roles: ["admin"], src: "MP-30" },
    "terminals.block": { label: "Block a lost or stolen terminal", roles: ["admin", "finance", "support"], src: "MP-30" },
    "players.payout":  { label: "Approve payouts to players (gambling)", roles: ["admin", "finance"], sca: true, second: { roles: ["admin", "finance"], from: 2000 }, src: "MP-33" },
    "cards.manage":    { label: "See and delete saved cards", roles: ["admin", "support"], src: "MP-39" },
    "wallets.manage":  { label: "Set up Apple Pay and Google Pay", roles: ["admin", "developer"], src: "MP-40" },
    "activity.view":   { label: "See every user's activity", roles: ["admin", "finance"], src: "MP-34 (others see their own)" },
    "requests.create": { label: "Ask for higher limits or new services", roles: ["admin", "finance"], src: "MP-38" },
    "complaints":      { label: "Make a complaint", roles: ["admin", "finance", "developer", "support", "viewer", "applicant"], src: "MP-32" }
  };

  /* limits a role carries by default (mandates in S6, MP-Q05). Admin can lower them per person. */
  const MANDATE = {
    admin:   { refund: 5000, payout: 50000 },
    finance: { refund: 5000, payout: 50000 },
    support: { refund: 100,  payout: 0 }
  };

  /* systems (lanes in the workflow diagrams), CTO architecture v8.1 names */
  const LANES = {
    MER:  ["Merchant", "user"],
    S3:   ["Portal", "S3"],
    S18:  ["Gateway, BFF", "S18"],
    S19:  ["Identity, SCA", "S19"],
    S6:   ["Onboarding", "S6"],
    S4:   ["Admin", "S4"],
    OPS:  ["Paytinno staff", "OPS"],
    S21:  ["Core", "S21, S5"],
    S7:   ["Fees", "S7 M008"],
    S10:  ["BPC", "S10 via A09"],
    S11:  ["IDV, AML", "S11 via A01"],
    S17:  ["Messages", "S17"],
    S13:  ["Reconciliation", "S13"],
    EXT:  ["Outside", "bank, scheme"],
    CH:   ["Card holder", "customer"],
    TMS:  ["Terminal supplier", "devices, TMS"],
    WAL:  ["Apple, Google", "wallets"],
    SHOP: ["Shop platform", "WooCommerce etc."]
  };

  /* the application's status line: fixed portal texts per state (MP-Q09, contract P7: no free text, no tipping off) */
  const APP_STATES = [
    { k: "DRAFT",           label: "Draft",                   text: "Not sent yet. Your answers are saved as you go." },
    { k: "STARTED",         label: "Received",                text: "We have your application." },
    { k: "KYB_PENDING",     label: "Checking documents",      text: "We are checking your company, documents and the people you listed." },
    { k: "INFO_REQUESTED",  label: "We need something",       text: "We need more information from you. See Messages." },
    { k: "MANUAL_REVIEW",   label: "In review",               text: "We are reviewing your application." },
    { k: "UNDERWRITING",    label: "Risk assessment",         text: "We are setting your limits and terms." },
    { k: "AWAITING_DEPOSIT",label: "Waiting for the deposit", text: "Approved. Please transfer the guarantee deposit to start." },
    { k: "PROVISIONING",    label: "Setting up",              text: "Approved. We are setting up your account and keys." },
    { k: "ACTIVE",          label: "Active",                  text: "You can take live payments." },
    { k: "CLOSED_REJECTED", label: "Not approved",            text: "We cannot offer you the service. This decision is final." },
    { k: "WITHDRAWN",       label: "Withdrawn",               text: "You withdrew the application." }
  ];

  const LIMITS = {
    sessionHours: 8, idleMinutes: "[30]", refreshDays: 30, scaMinutes: 5, codeMinutes: 10,
    payoutCutoff: "[14:00 EET]", minPayout: "[€100]", reserveDays: 180, kybHigh: 12, kybStd: 36,
    keyOverlapHours: "[24]", inviteDays: "[7]"
  };

  return { ROLES, PERMS, MANDATE, LANES, APP_STATES, LIMITS };
})();
