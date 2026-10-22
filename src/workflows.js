/* Merchant portal (S3) workflows: the intended design, for review before the CTO's team builds it.
   This file is the source of truth. docs/ is generated from it (tools/build-docs.ps1); the viewer (index.html) reads it;
   the merchant-portal prototype loads it for its "Behind this screen" panel.

   status: "v81" = in v8.1 as written; "part" = in v8.1 with open gaps; "amended" = in v8.1, every gap closed by a decision
   (listed in amends: the changes v8.1 needs); "new" = not in v8.1, proposed here.
   question: decided: true = the proposed answer is adopted as the design, awaiting sign-off by its owner.
   deps: confirmations needed from outside (BPC, BNB, OraSYS); not design gaps.
   step: [from, to, text, opts]  opts: {api, ref, sla, sca, fail, rule, gap (open), dec (decided by MP-Qnn), added (not in v8.1)}
   group row: ["#", "title"].  from === to means work inside one system.
   lanes: system codes from src/model.js LANES. */
window.WF = (function () {
  "use strict";
  const list = [];
  const W = (id, o) => list.push(Object.assign({ id }, o));

  /* ================= ACCESS ================= */
  W("MP-01", {
    title: "Register and create a passkey", area: "Access", status: "v81", source: "WF02a steps 1 to 12",
    trigger: "A representative opens the portal for the first time.", object: "PortalUser (S19 realm merchant), person in S6",
    screens: ["register"], lanes: ["MER", "S3", "S18", "S19", "S17", "S6"],
    summary: "No passwords. The person proves an email and a phone, saves a passkey, and gets the applicant role. Company data comes later in the application.",
    steps: [
      ["#", "Register"],
      ["MER", "S3", "Enters business email, mobile number and name, and accepts the portal terms. No company data yet.", { ref: "WF02a 1" }],
      ["S3", "S18", "Sends the registration. Not signed in, behind the I4 rate limit and bot protection.", { api: "POST /v1/portal/users/register {email, phone, name, consentVersion}", sla: "2 s", fail: "429 on rate limit", gap: "v8.1 answers 409 when the email exists. That tells anyone which emails are registered (MP-Q02).", ref: "WF02a 2" }],
      ["S18", "S19", "Creates the user in realm merchant with status PENDING_VERIFICATION.", { fail: "S19 down: 503, nothing is stored", ref: "WF02a 3" }],
      ["S19", "S17", "Sends one code by email and another by SMS. Valid 10 min, 5 attempts, resend at most 3 times an hour.", { sla: "delivery 30 s", ref: "WF02a 4" }],
      ["S17", "MER", "Codes arrive.", { ref: "WF02a 5" }],
      ["MER", "S3", "Types both codes.", { ref: "WF02a 6" }],
      ["S3", "S18", "Sends the codes.", { api: "POST /v1/portal/users/verify {userId, emailCode, smsCode}", fail: "attempts used up: register again", ref: "WF02a 7" }],
      ["S18", "S19", "Marks email and phone verified (VERIFIED).", { ref: "WF02a 8" }],
      ["#", "Passkey"],
      ["S19", "S3", "Passkey creation options: rpId = portal, resident key and user verification required.", { fail: "browser without WebAuthn: message, no password fallback", ref: "WF02a 9" }],
      ["S3", "S19", "The browser creates the passkey (platform or security key). Attestation is checked against policy but is not a condition for access.", { sla: "60 s", fail: "authenticator refused: try another", ref: "WF02a 10" }],
      ["S19", "S3", "Tokens through PKCE (amr webauthn). Role ONBOARDING_APPLICANT. Session 8 h, refresh 30 days.", { ref: "WF02a 11" }],
      ["S18", "S6", "First call with the token registers the person in S6 and returns a person ID. No merchant yet.", { fail: "S6 down: 503, the token stays valid", ref: "WF02a 12" }],
      ["S3", "MER", "Offers to add a second passkey now, so a lost device does not mean recovery.", { gap: "Proposed, not in v8.1 (MP-Q04)" }]
    ],
    states: [["", "registration", "PENDING_VERIFICATION"], ["PENDING_VERIFICATION", "both codes right", "VERIFIED"], ["VERIFIED", "passkey saved", "ACTIVE (applicant)"], ["ACTIVE (applicant)", "merchant activated (MP-09)", "ACTIVE (business roles)"], ["ACTIVE (business roles)", "removed by the merchant's admin", "DISABLED"]],
    rules: ["Realms share no users, sessions or passkeys.", "The account belongs to the person; one person can work for several merchants.", "KYC of the person happens in the application (MP-06), not here.", "S19 events go to SEC2."],
    questions: [
      { id: "MP-Q02", q: "Registration with an email that already exists returns 409 in v8.1. That is an account lookup for anyone.", prop: "Always answer 202 \"if the address can be used, we sent codes\". If the email exists, send that person an email saying someone tried to register with it.", owner: "CTO" },
      { id: "MP-Q03", q: "The BNB has not confirmed a passkey with dynamic linking as SCA on the web. For the portal it is the only method (no password, no push to the app).", prop: "Ask the BNB in writing before build. Allow platform passkeys and security keys. Keep the design open for a push to S1 for people who have the app.", owner: "Compliance" },
      { id: "MP-Q04", q: "One passkey per person makes lost phones a frequent recovery case.", prop: "Prompt for a second passkey at registration. Require two for Admin and Finance after activation.", owner: "Product" }
    ]
  });

  W("MP-02", {
    title: "Sign in, switch business and check rights", area: "Access", status: "amended", source: "WF02a steps 13 to 21",
    trigger: "A person opens the portal without a valid session, or makes any request.", object: "Session (S19), roles and mandates (S6)",
    screens: ["home", "team"], lanes: ["MER", "S3", "S18", "S19", "S6"],
    summary: "Passkey sign-in. Roles are not in the token: S18 asks S6 on every request which merchants and rights the person has.",
    steps: [
      ["MER", "S3", "Opens the portal.", { ref: "WF02a 13" }],
      ["S3", "S18", "OIDC request with PKCE and state, realm merchant.", { sla: "1 s", ref: "WF02a 14" }],
      ["S18", "S19", "Sign-in screen. The email only hints which passkey to use.", { ref: "WF02a 15" }],
      ["S19", "S3", "Passkey request options, discoverable credential. Challenge valid 2 min.", { ref: "WF02a 16" }],
      ["S3", "S19", "The browser signs with user verification. S19 checks signature, counter and origin.", { fail: "5 failures: locked 15 min and an email (MP-04). A phishing domain fails on rpId.", ref: "WF02a 17" }],
      ["S19", "S3", "New session. Roles are not in the token.", { ref: "WF02a 18" }],
      ["#", "Every request"],
      ["S3", "S18", "Every call carries the token and, in a header, the business it is for. The sidebar business switcher sets it.", { api: "Authorization: Bearer, X-Merchant-Id: M-…", dec: "MP-Q07", ref: "WF02a 19" }],
      ["S18", "S18", "Checks the token against cached keys: expiry, realm, audience.", { sla: "5 ms", fail: "invalid: 401, refresh, then sign in", ref: "WF02a 19" }],
      ["S18", "S6", "Reads roles, mandates and merchants for the person, and checks the X-Merchant-Id is one of them. Cached per session with a short TTL.", { sla: "20 ms", fail: "no right: 403. No merchant yet: only application endpoints.", ref: "WF02a 20" }],
      ["S18", "S3", "Answer. Every refusal is logged to SEC2 with person, merchant and action.", { ref: "WF02a 21" }],
      ["#", "Session end"],
      ["S3", "S3", "Signs out after [30] min without activity and after 8 h in any case. Shows a warning 2 min before.", { dec: "MP-Q06" }]
    ],
    states: [["", "passkey sign-in", "SESSION"], ["SESSION", "8 h or [30] min idle", "ENDED"], ["SESSION", "role removed in S6", "403 on next call"]],
    rules: ["The menu shows only what the role can use; S18 still checks every call (the screen is not the control).", "A person with several businesses picks one in the sidebar; data never mixes on one screen.", "Portal requests: 1 s p95 (depends on the BPC API)."],
    amends: ["WF02a 19 to 20: the portal names the business in an X-Merchant-Id header; S18 checks it against the person's merchants in S6 on every call (MP-Q07).", "WF02a: add an idle timeout of [30] min next to the 8 h session; refresh only while active (MP-Q06)."],
    questions: [
      { id: "MP-Q06", q: "No idle timeout is defined (only 8 h session and 30 day refresh).", prop: "[30] min idle, 8 h absolute, refresh only while active. Money actions need SCA anyway.", owner: "CTO", decided: true },
      { id: "MP-Q07", q: "How does a call say which business it is for, when one person serves several?", prop: "Header X-Merchant-Id on every call; S18 checks it against S6. The sidebar business switcher sets it.", owner: "CTO", decided: true }
    ]
  });

  W("MP-03", {
    title: "Strong customer authentication for actions", area: "Access", status: "amended", source: "WF02a steps 22 to 26",
    trigger: "A user starts an action that moves money or changes who gets it or who can act.", object: "SCA challenge (S19), evidence ID",
    screens: ["payment", "payouts", "developers", "team", "disputes"], lanes: ["MER", "S3", "S18", "S19", "S6"],
    summary: "The passkey signs exactly what the user sees (amount and payee, or the key, or the person). S18 matches the evidence to the command before sending it on.",
    steps: [
      ["MER", "S3", "Starts the action. From v8.1: refund, payout to an external account, payout account change, API key roll, invitation with a role above the threshold. Added: accepting or escalating a dispute, revealing or rolling a webhook secret, closing the account.", { ref: "WF02a 22", dec: "MP-Q14" }],
      ["S3", "S18", "Sends the command with an Idempotency-Key. S18 answers that SCA is needed.", { api: "POST /v1/… → 202 {scaRequired, challengeId}" }],
      ["S18", "S6", "Checks the role and the person's mandate for this amount. Over the mandate, the command becomes an approval request (MP-23).", { rule: "Mandates in S6" }],
      ["S18", "S19", "Asks for a challenge bound to amount and payee, or to the key or person. Valid 5 min.", { ref: "WF02a 23", sca: true }],
      ["S19", "S3", "The web SDK shows what is being signed. The challenge holds a hash of it.", { ref: "WF02a 24", sca: true, fail: "user declines: nothing is sent" }],
      ["S3", "S19", "The browser signs with biometrics or PIN. S19 checks signature and binding.", { ref: "WF02a 25", sca: true }],
      ["S19", "S18", "ScaCompleted {evidenceId}.", { ref: "WF02a 26", sca: true }],
      ["S18", "S18", "Matches the evidence to the command (same hash) and sends it on: refund to WF11 step 16 (A09), payout to MP-14 (M0391), payout account to MP-15, key roll to MP-20, dispute answer to MP-16 (S4), invitation to MP-22 (S6).", { dec: "MP-Q08", fail: "challenge expired: start again; hash differs: 409, logged" }],
      ["S18", "S3", "Result shown to the user. Evidence kept 5 years.", { rule: "SCA evidence retention 5 years" }]
    ],
    states: [["", "action started", "SCA_REQUIRED"], ["SCA_REQUIRED", "signed", "SUBMITTED"], ["SCA_REQUIRED", "declined or 5 min", "CANCELLED"], ["SCA_REQUIRED", "over mandate", "AWAITING_APPROVAL (MP-23)"]],
    rules: ["Dynamic linking: changing the amount or payee after signing voids the signature.", "For an approval, the requester signs the request and the approver signs the approval; it runs after both.", "One evidence ID per command; reuse is refused."],
    amends: ["WF02a 22: add dispute Accept and Escalate (MP-Q14), webhook secret reveal or roll (MP-Q11) and account closure to the SCA list.", "WF02a 26: replace \"WF10 step 14, WF11 step 7\" with the targets listed in step 8 here (MP-Q08)."],
    questions: [
      { id: "MP-Q08", q: "WF02a step 26 continues to \"WF10 step 14, WF11 step 7\". WF10 14 is a read and WF11 7 is issuing.", prop: "Refund continues to WF11 step 16; payout to MP-14; payout account to MP-15; key roll to MP-20. Fix in v8.2.", owner: "CTO", decided: true },
      { id: "MP-Q14", q: "Accepting a dispute is final and costs money, but it is not on the SCA list in WF02a 22. WF11 15 says SCA for actions with a money effect.", prop: "Require SCA for Accept and Escalate. Add to the WF02a 22 list.", owner: "CTO", decided: true }
    ]
  });

  W("MP-04", {
    title: "Lockout and lost passkey", area: "Access", status: "amended", source: "WF02a steps 17 and 27",
    trigger: "Five failed signatures, or a person who lost every passkey.", object: "PortalUser LOCKED or RECOVERY",
    screens: ["security"], lanes: ["MER", "S3", "S18", "S19", "S17", "S4", "OPS"],
    summary: "Recovery re-proves email and phone. For an admin of a live merchant, another admin approves; otherwise Paytinno staff check identity.",
    steps: [
      ["S19", "S17", "After 5 failed signatures: lock for 15 min and email the person.", { ref: "WF02a 17" }],
      ["#", "Recovery"],
      ["MER", "S3", "Chooses \"I lost my passkey\" and enters the email.", { ref: "WF02a 27" }],
      ["S18", "S19", "New email and SMS codes, as in registration.", { sla: "codes 10 min" }],
      ["S18", "S6", "Is the person an admin of an active merchant?", {}],
      ["S6", "S3", "Yes, and there is a second admin: an approval request goes to that admin (MP-23).", { rule: "Second admin approves" }],
      ["S6", "S4", "Yes, and there is no second admin: a case for Paytinno staff.", {}],
      ["OPS", "S4", "Checks identity with a new IDV selfie check matched to the face from onboarding (no new documents), then approves with four eyes.", { dec: "MP-Q05b" }],
      ["S3", "S19", "New passkey registered; all old passkeys revoked; sessions ended.", {}],
      ["S19", "S17", "Email to the person and to every admin of each merchant the person works for. Payout account changes from this login are blocked for [24 h].", { added: true, dec: "MP-Q05b" }],
      ["#", "No access to email or phone"],
      ["MER", "S4", "Asks through support. Staff change email or phone with four eyes after an IDV check.", { ref: "WF02a 27" }]
    ],
    states: [["ACTIVE", "5 failures", "LOCKED"], ["LOCKED", "15 min", "ACTIVE"], ["ACTIVE", "recovery started", "RECOVERY"], ["RECOVERY", "new passkey", "ACTIVE"]],
    rules: ["Recovery never restores the old passkey.", "A recovered admin cannot change the payout account for [24 h] (account takeover pattern)."],
    amends: ["WF02a 27: without a second admin, the identity check is an IDV selfie matched to onboarding, then four eyes in S4 (MP-Q05b).", "WF02a 27: after recovery, notify the person and every admin, and block payout account changes for [24 h]."],
    questions: [
      { id: "MP-Q05b", q: "How do staff check identity in recovery without a second admin?", prop: "IDV selfie check matched to the face from onboarding (no new documents), then four eyes in S4. Block payout account changes for [24 h] after.", owner: "Compliance", decided: true }
    ]
  });

  /* ================= ONBOARDING ================= */
  W("MP-05", {
    title: "Fill in and send the application", area: "Onboarding", status: "amended", source: "WF02b steps 1 to 4; admin spec application.submitted",
    trigger: "An applicant (MP-01) starts an application.", object: "OnboardingCase (S6, type MERCHANT), from DRAFT",
    screens: ["application"], lanes: ["MER", "S3", "S18", "S6", "S4"],
    summary: "Six steps: company, people, business, documents, payout account, review. Saved as a draft on every step; sent once complete.",
    steps: [
      ["#", "Draft"],
      ["MER", "S3", "Enters the company ID (EIK).", {}],
      ["S3", "S18", "Looks up the company in the Commercial Register, through the KYB connector's lookup, to fill in name, form, address and managers. Pre-filled fields are marked and kept as the register gave them.", { api: "GET /v1/registry/companies/{eik}", dec: "MP-Q15", fail: "not found: the applicant types it" }],
      ["S3", "S18", "Saves the draft after every step. S18 only routes; S6 keeps the draft as an OnboardingCase in state DRAFT, for the person in the token.", { api: "PUT /v1/merchants/applications/drafts/{draftId} → S6", dec: "MP-Q16" }],
      ["S18", "S6", "Stores the draft. Kept [90] days without changes, then deleted with its documents.", { dec: "MP-Q16" }],
      ["MER", "S3", "People: the representative and the legal basis; every owner of 25% or more; managers. Each becomes a personRef. Only the representative does an IDV check (MP-06); owners are screened from these data.", { rule: "Owners listed must explain 100% of ownership or say why not", dec: "MP-Q17" }],
      ["MER", "S3", "Business: what it sells (MCC), websites, channels, expected monthly volume, average and largest payment, customer countries, whether the company is a micro-enterprise.", { rule: "Micro-enterprise status sets the notice period for tariff changes (MP-19)", dec: "MP-Q33" }],
      ["MER", "S3", "Uploads documents to the vault. PDF, JPG or PNG up to 10 MB, scanned for malware.", { api: "POST /v1/documents (multipart) → {docRef}", rule: "Documents stay in the vault; the admin sees references only" }],
      ["MER", "S3", "Payout account: IBAN, holder name, bank statement.", { rule: "Checked in MP-15 rules: in the merchant's name" }],
      ["MER", "S3", "Review and three statements: information is true; I may act for the company; I accept the merchant terms.", {}],
      ["#", "Send"],
      ["S3", "S18", "Sends the application. Needs permission application:create.", { api: "POST /v1/merchants/applications {legalName, eik, representativeRole, ubos[], mcc, expectedVolume, channels[], documents[]}", sla: "2 s", fail: "401, 403, 4xx", ref: "WF02b 2" }],
      ["S18", "S6", "Opens the case for the person in the token. The representative in the body is data, not proof of who applies.", { ref: "WF02b 3" }],
      ["S6", "S6", "Creates the customer ID for the company; links the person and the owners. State STARTED.", { ref: "WF02b 4" }],
      ["S6", "S4", "The application appears in the admin. Until S6 exists, the admin stands in for it.", { api: "webhook application.submitted", ref: "admin spec 6" }],
      ["S4", "S3", "Status line STARTED.", { api: "POST /admin/v1/applications/{appId}/status", ref: "admin spec 5.1" }]
    ],
    states: [["", "first save", "DRAFT"], ["DRAFT", "sent", "STARTED"], ["DRAFT", "[90] days untouched", "deleted"], ["STARTED and later", "withdrawn by the applicant", "WITHDRAWN"]],
    rules: ["No acceptance before the whole onboarding is done.", "Sales do not send applications for merchants at launch.", "The applicant can withdraw until a decision is made."],
    amends: ["WF02b states: add DRAFT before STARTED, kept by S6 for [90] days (MP-Q16).", "WF02b 1: Commercial Register pre-fill through the KYB connector's lookup (MP-Q15).", "WF02b 1: ask whether the company is a micro-enterprise; S6 keeps it for tariff notices (MP-Q33).", "WF02b 5: IDV check for the representative only; owners screened from data, IDV for owners only when high risk or the data disagree (MP-Q17)."],
    questions: [
      { id: "MP-Q15", q: "Should the portal pre-fill from the Commercial Register?", prop: "Yes. S18 routes to the register lookup the KYB connector already has. Pre-filled fields are marked and kept as the register said.", owner: "CTO", decided: true },
      { id: "MP-Q16", q: "Where is the draft kept before it is sent? v8.1 starts the case only at submission.", prop: "Draft in S6 as an OnboardingCase in state DRAFT, keyed by person, kept [90] days. S18 only routes (it holds no business logic). Documents uploaded to the draft are deleted with it.", owner: "CTO", decided: true },
      { id: "MP-Q17", q: "Who must do an identity check: only the representative (v8.1), or every owner (the design prototype)?", prop: "Representative always. Owners are screened from data; an IDV check for owners only for high-risk merchants or when the register and the declaration disagree.", owner: "Compliance", decided: true }
    ]
  });

  W("MP-06", {
    title: "Company checks, identity and screening", area: "Onboarding", status: "v81", source: "WF02b steps 5 to 9",
    trigger: "An application is sent (MP-05).", object: "OnboardingCase KYB_PENDING",
    screens: ["application"], lanes: ["MER", "S3", "S18", "S6", "S11", "S4"],
    summary: "The representative does an IDV check inside the portal. The company and owners are checked and screened. The portal only ever says \"Checking documents\" or \"In review\".",
    steps: [
      ["S6", "S11", "Starts KYB and owner checks; issues an IDV token for the representative.", { ref: "WF02b 5", sla: "async" }],
      ["S6", "S3", "Token for the IDV web SDK, through S18.", {}],
      ["MER", "S3", "The representative does the ID document and selfie check in the portal.", { ref: "WF02b 5" }],
      ["S11", "S6", "Results come back as webhooks: identity verified, company verified, owners screened. Bad signature: quarantine and SEC2.", { ref: "WF02b 6 to 8" }],
      ["S6", "S11", "AML system: risk and PEP or sanctions screening of the company, representative and every owner.", { sla: "1 s per person, 3 attempts", ref: "WF02b 9" }],
      ["S6", "S4", "Any hit, or the identity does not match the role: manual review case.", { rule: "A hit makes manual review mandatory" }],
      ["S4", "S3", "Status line KYB_PENDING, then UNDERWRITING or MANUAL_REVIEW.", { api: "application.status", rule: "Fixed texts, never the reason" }]
    ],
    states: [["STARTED", "IDs recorded", "KYB_PENDING"], ["KYB_PENDING", "checks clear", "UNDERWRITING"], ["KYB_PENDING", "hit or review", "MANUAL_REVIEW"], ["KYB_PENDING", "information missing", "INFO_REQUESTED (MP-07)"]],
    rules: ["No tipping off: the portal never names a screening hit, PEP, sanctions, MATCH or VMAS.", "The portal maps each state to its own fixed text (CONFIG.APP_STATES); the admin's label is a hint only."],
    questions: [
      { id: "MP-Q09", q: "Should the portal show the admin's free-text status label, or its own fixed text per state? (admin spec P7)", prop: "Fixed texts per state in the portal, in Bulgarian and English. Free text only inside an RFI, which staff write knowingly.", owner: "Compliance" }
    ]
  });

  W("MP-07", {
    title: "Request for information and the answer", area: "Onboarding", status: "amended", source: "Admin spec 5.2 rfi.send and merchant.message; not a v8.1 workflow",
    trigger: "Staff need a document or an answer, during onboarding or for a live merchant.", object: "RFI (S4), message thread",
    screens: ["messages", "application"], lanes: ["MER", "S3", "S18", "S4", "OPS", "S17"],
    summary: "Staff ask, the merchant answers in the portal with text and documents. The application status shows \"We need something\" while it is open.",
    steps: [
      ["OPS", "S4", "Writes the request: what is needed (item codes and plain text), due date.", {}],
      ["S4", "S18", "Sends the request; for an application also the status INFO_REQUESTED.", { api: "POST /admin/v1/rfi {appId | merchantId, text, items[], dueAt}", ref: "admin spec 5.2" }],
      ["S18", "S17", "Email: \"We need something from you\" with a link only. The request itself is not in the email.", { added: true, rule: "Emails carry a link, never the content" }],
      ["MER", "S3", "Opens Messages, writes an answer, attaches documents.", {}],
      ["S3", "S18", "Sends the answer.", { api: "POST /v1/messages {inReplyTo: rfiId, text, attachments[docRef]}" }],
      ["S18", "S4", "The answer arrives in the admin.", { api: "webhook merchant.message", ref: "admin spec 6" }],
      ["OPS", "S4", "Accepts it and closes the RFI, or asks again.", {}],
      ["S4", "S3", "Status back to where it was.", { api: "application.status" }],
      ["S17", "MER", "Reminder 3 days before the due date.", { api: "merchant.notify rfi_reminder" }],
      ["#", "Overdue"],
      ["S4", "S3", "Onboarding: the application is paused and shows \"We need something\"; after [30] more days it is withdrawn, with a notice.", { dec: "MP-Q18" }],
      ["OPS", "S4", "Live merchant: a reminder, then staff decide on restrictions (MP-26). Never automatic.", { dec: "MP-Q18" }]
    ],
    states: [["", "sent", "OPEN"], ["OPEN", "merchant answers", "ANSWERED"], ["ANSWERED", "staff accept", "CLOSED"], ["ANSWERED", "staff ask again", "OPEN"], ["OPEN", "due date passes", "OVERDUE"], ["OVERDUE", "merchant answers", "ANSWERED"], ["OVERDUE", "[30] days more, onboarding only", "WITHDRAWN"]],
    rules: ["The merchant is told not to type ID or card numbers in messages; documents are attached as files.", "Text up to 4,000 characters."],
    amends: ["Add the RFI to v8.1 as a sub-flow of WF02b and of periodic reviews, as in the admin spec 5.2 (rfi.send, merchant.message).", "Overdue RFI: onboarding withdrawn after [30] days; for a live merchant staff decide (MP-Q18)."],
    questions: [
      { id: "MP-Q18", q: "What happens when an RFI is overdue?", prop: "Onboarding: application paused, withdrawn after [30] days with notice. Live merchant: reminder, then a restriction decision in S4 (MP-26), never automatic.", owner: "Compliance", decided: true }
    ]
  });

  W("MP-08", {
    title: "Underwriting decision and the offer", area: "Onboarding", status: "amended", source: "WF02b steps 10 to 12",
    trigger: "Checks are complete (MP-06).", object: "Underwriting case (S4), offer",
    screens: ["application"], lanes: ["MER", "S3", "S18", "S6", "S4", "OPS", "S17"],
    summary: "Staff set limits, tariff, reserve and deposit with four eyes. Then the merchant sees the offer and accepts it with SCA before set-up starts.",
    steps: [
      ["S6", "S4", "Underwriting case. MCC 7995 gets extra sector checks.", { ref: "WF02b 10" }],
      ["OPS", "S4", "MATCH and VMAS checks; limits, tariff, rolling reserve %, guarantee deposit, MCC.", { sla: "2 business days", rule: "Four eyes above a threshold or for high-risk MCCs", ref: "WF02b 11" }],
      ["S4", "S6", "Approved with conditions, or rejected. Approver differs from preparer.", { ref: "WF02b 12" }],
      ["S4", "S3", "Rejected: status CLOSED_REJECTED and a neutral notice.", { api: "merchant.notify application_rejected", fail: "No reason is given in the portal" }],
      ["#", "Offer"],
      ["S4", "S3", "Approved: the offer appears: tariff, reserve %, deposit, limits, payout schedule, the agreement.", { dec: "MP-Q19", added: true }],
      ["MER", "S3", "The admin applicant accepts with SCA. The agreement version and evidence are stored.", { sca: true, dec: "MP-Q19" }],
      ["S3", "S18", "Acceptance.", { api: "POST /v1/merchants/applications/{appId}/offer/accept" }],
      ["S18", "S6", "Moves on to AWAITING_DEPOSIT or PROVISIONING (MP-09).", {}]
    ],
    states: [["UNDERWRITING", "approved", "OFFER_SENT"], ["OFFER_SENT", "accepted", "AWAITING_DEPOSIT or PROVISIONING"], ["OFFER_SENT", "[14] days", "WITHDRAWN"], ["UNDERWRITING", "rejected", "CLOSED_REJECTED"]],
    rules: ["The rejection text is the same whatever the reason.", "The decision record keeps rationale, policy version, tariff, reserve and approvers (WF02b 18)."],
    amends: ["WF02b: add state OFFER_SENT between approval (step 12) and set-up (step 13); the representative accepts the offer and agreement with SCA; the offer lapses after [14] days (MP-Q19)."],
    questions: [
      { id: "MP-Q19", q: "Where does the merchant agree to the tariff, reserve and agreement? v8.1 goes from approval straight to set-up.", prop: "Add OFFER_SENT: the offer in the portal, accepted with SCA by the applicant who is the representative. Qualified e-signature only if Legal requires it.", owner: "Legal", decided: true }
    ]
  });

  W("MP-09", {
    title: "Deposit, set-up and activation", area: "Onboarding", status: "amended", source: "WF02b steps 13 to 17; PRD WF11 AWAITING_DEPOSIT; admin spec 5.4 access.grant",
    trigger: "The offer is accepted (MP-08).", object: "OnboardingCase PROVISIONING to ACTIVE",
    screens: ["application", "home"], lanes: ["MER", "S3", "S18", "S6", "S4", "S21", "S10", "S13", "S17"],
    summary: "If a deposit is required, the merchant transfers it first. Then accounts in OraSYS and the merchant in BPC. Only when both confirm is the merchant active and the full portal opens.",
    steps: [
      ["#", "Deposit (when the offer has one)"],
      ["S3", "MER", "Shows the deposit amount, our IBAN and the payment reference.", { dec: "MP-Q20" }],
      ["MER", "EXT", "Transfers from the company's account.", {}],
      ["S21", "S21", "Credits the rolling reserve account.", {}],
      ["S13", "S6", "Reconciled: deposit received in full from an account in the merchant's name.", { rule: "S10 is not activated before the deposit is in and reconciled" }],
      ["#", "Set-up"],
      ["S6", "S21", "Merchant in M001; settlement, reserve and control accounts; payout account on the verified list.", { api: "A05 / M0391", ref: "WF02b 13" }],
      ["S6", "S10", "BPC merchant onboarding: acquirer merchant ID, terminals, hosted page and SDK keys.", { api: "IF45 via A09", sla: "10 s, 3 attempts, idempotent", fail: "persistent error: COMPENSATING and an S4 case", ref: "WF02b 14" }],
      ["S6", "S6", "Records the ID mapping and waits for both confirmations.", { ref: "WF02b 15" }],
      ["S6", "S21", "Accounts ACTIVE; tariff set in M008.", { ref: "WF02b 16" }],
      ["#", "Access"],
      ["S6", "S18", "The person gets MERCHANT_ADMIN on the merchant.", { api: "POST /admin/v1/merchants/{merchantId}/access/grant", ref: "WF02b 17, admin spec 5.4" }],
      ["S18", "S17", "Welcome notice.", { api: "merchant.notify welcome" }],
      ["S3", "MER", "The full portal opens: test keys, team, payouts. Live keys after the go-live check (MP-10).", { ref: "WF02b 17" }]
    ],
    states: [["OFFER_SENT", "accepted, deposit needed", "AWAITING_DEPOSIT"], ["AWAITING_DEPOSIT", "reconciled", "PROVISIONING"], ["PROVISIONING", "S5 and S10 both confirm", "ACTIVE"], ["PROVISIONING", "one fails", "COMPENSATING, S4 case"], ["AWAITING_DEPOSIT", "[30] days unpaid", "WITHDRAWN"]],
    rules: ["No acceptance until both OraSYS and BPC confirm.", "The deposit is paid by transfer only, never taken from settlements."],
    amends: ["WF02b states: add AWAITING_DEPOSIT between OFFER_SENT and PROVISIONING, as PRD WF11 needs; unpaid after [30] days the offer lapses (MP-Q20)."],
    questions: [
      { id: "MP-Q20", q: "AWAITING_DEPOSIT (PRD WF11) is not in the WF02b state machine.", prop: "Add it between the offer and PROVISIONING. Show the deposit IBAN and reference in the portal. Unpaid after [30] days: offer lapses.", owner: "CTO", decided: true }
    ]
  });

  W("MP-10", {
    title: "Go live: from test to live payments", area: "Onboarding", status: "new", source: "WF02b 17 (\"sandbox first\"); module spec v7.1 sandbox with test cards",
    trigger: "The merchant is active and wants live keys, or a new website is added.", object: "Go-live checklist",
    screens: ["developers", "home"], lanes: ["MER", "S3", "S18", "S10", "S4", "OPS"],
    summary: "The developer proves the integration with test cards; staff check the website; then live keys are issued.",
    steps: [
      ["S18", "S10", "Test keys for the BPC sandbox, issued at activation.", { gap: "Does BPC give a sandbox per merchant? (CTO question 21, MP-Q21)" }],
      ["MER", "S10", "The developer runs payments with test cards: success, decline, 3-D Secure challenge, refund, webhook.", {}],
      ["S3", "S18", "The checklist ticks itself from test data.", { api: "GET /v1/golive/checklist" }],
      ["MER", "S3", "Admin asks for live.", {}],
      ["S18", "S4", "Go-live request.", {}],
      ["OPS", "S4", "Website check: terms, refund policy, prices in EUR, contact details, card logos, what is sold matches the MCC.", { rule: "Scheme rules require a website review" }],
      ["S4", "S18", "Approved: live keys can be created (MP-20). Rejected: what to fix, as an RFI.", {}],
      ["S3", "MER", "First live payment is marked on Home.", {}]
    ],
    states: [["ACTIVE (test only)", "checklist done and asked", "GO_LIVE_REVIEW"], ["GO_LIVE_REVIEW", "approved", "LIVE"], ["GO_LIVE_REVIEW", "changes needed", "ACTIVE (test only)"]],
    rules: ["Live keys are never issued before the website check."],
    questions: [
      { id: "MP-Q21", q: "Can test keys be given as soon as the application is sent, so developers start during review (as the design prototype shows)?", prop: "Yes, if BPC offers a sandbox merchant without onboarding. Otherwise at activation as v8.1 says.", owner: "CTO" }
    ]
  });

  /* ================= PAYMENTS ================= */
  W("MP-11", {
    title: "See payments and one payment", area: "Payments", status: "v81", source: "WF10 steps 13 to 16",
    trigger: "A user opens Payments or a payment.", object: "AcquiringTransaction (BPC), balances (S5)",
    screens: ["payments", "payment", "home"], lanes: ["MER", "S3", "S18", "S10", "S21"],
    summary: "Payment records come from BPC through A09 (masked). Money comes from OraSYS through M0391. Each part says when it was last updated; when they disagree, OraSYS wins.",
    steps: [
      ["MER", "S3", "Opens Payments, filters by date, status, card brand, amount; searches by payment ID, order reference or last 4 digits.", { ref: "WF10 13" }],
      ["S3", "S18", "Rights checked on every call.", { api: "GET /v1/payments?from&to&status&q&cursor", sla: "1 s p95", ref: "WF10 14" }],
      ["S18", "S10", "Payments, settlements and disputes, masked card data only.", { api: "IF45 via A09", ref: "WF10 15", fail: "BPC down: the portal says payment data is unavailable; payments still work" }],
      ["S18", "S21", "Money state: pending, available, paid, reserve; fees by IFR Art. 12 from S7.", { api: "A05 / M0391", sla: "500 ms p95", ref: "WF10 16" }],
      ["S18", "S3", "Combined view with a \"last updated\" time for each source.", { rule: "S5 wins over BPC (R09)" }]
    ],
    states: [["AUTHORISED", "captured", "CAPTURED"], ["CAPTURED", "cleared and settled D+1", "PAYABLE"], ["PAYABLE", "reserve taken, eligible", "AVAILABLE"], ["AVAILABLE", "payout sent", "PAID_OUT"], ["CAPTURED or PAYABLE", "chargeback", "DISPUTED"]],
    rules: ["An authorisation is not money in the balance.", "D+1 is a service level, not a guarantee.", "A09 never reads balances and never writes the ledger.", "No full card number ever reaches the portal (SEC4 checks responses)."],
    questions: [
      { id: "MP-Q22", q: "Cache payment data in S18 when BPC is slow or down? (CTO question 22)", prop: "Yes, a read copy of the last [90] days refreshed every [5] min, always shown with its time. Search beyond 90 days goes to BPC live.", owner: "CTO" },
      { id: "MP-Q23", q: "Can the BPC API search by order reference, card last 4 and amount?", prop: "Confirm with BPC (question 21). If not, search runs on the S18 read copy only.", owner: "BPC" }
    ]
  });

  W("MP-12", {
    title: "Refund a payment", area: "Payments", status: "amended", source: "WF11 steps 15 to 17; PRD refund link to disputes",
    trigger: "A user refunds all or part of a captured payment.", object: "Refund (BPC), posting through NC2",
    screens: ["payment", "refunds"], lanes: ["MER", "S3", "S18", "S6", "S4", "S19", "S10", "S21"],
    summary: "Checks before sending: refundable amount, open dispute, the user's mandate. SCA binds amount and payment. The ledger effect comes only from NC2.",
    steps: [
      ["MER", "S3", "Refund on the payment page: full or part, and a reason.", { ref: "WF11 15" }],
      ["S3", "S18", "Asks what can be refunded.", { api: "GET /v1/payments/{id}/refundable" }],
      ["S18", "S4", "Is there an open dispute on this payment? S4 answers from its DisputeCases, matched by payment. If so, refused.", { sla: "[50 ms]", dec: "MP-Q24", rule: "No refund on a payment with an open dispute", fail: "S4 does not answer: refused, try again later (never sent unchecked)" }],
      ["S18", "S21", "Is there enough money? Allowed up to available plus pending. Above that, refused with \"top up by transfer\".", { api: "A05 / M0391", dec: "MP-Q25", rule: "The balance is never negative" }],
      ["S18", "S6", "Role and mandate. Over the person's refund limit: approval request (MP-23).", {}],
      ["S18", "S19", "SCA bound to amount, payment ID and card last 4.", { sca: true }],
      ["S3", "S18", "Sends the refund.", { api: "POST /v1/payments/{id}/refunds {amount, reason} + Idempotency-Key", sla: "2 s", ref: "WF11 16" }],
      ["S18", "S10", "Refund through A09.", { api: "IF45 via A09", ref: "WF11 17", fail: "answer lost: retry with the same key" }],
      ["S10", "S21", "Refund posting through NC2: reduces what we owe the merchant.", { ref: "WF11 12" }],
      ["S18", "S3", "Refund shown as sent; then as done when BPC confirms.", {}],
      ["S13", "S13", "Refunds reconciled against the journal.", { ref: "R08" }],
      ["#", "Not captured yet: cancel instead"],
      ["MER", "S3", "Cancel on an authorised payment. Same roles as refund; no SCA because no money leaves.", { dec: "MP-Q26", added: true }],
      ["S18", "S10", "Reversal of the authorisation through A09. The card holder's hold is released.", { api: "POST /v1/payments/{id}/cancel + Idempotency-Key → IF45 via A09", dec: "MP-Q26", fail: "already captured: refused, refund instead" }]
    ],
    states: [["", "requested", "REQUESTED"], ["REQUESTED", "over mandate", "AWAITING_APPROVAL"], ["REQUESTED", "open dispute or not enough money", "REFUSED"], ["REQUESTED", "SCA done", "SENT"], ["SENT", "BPC confirms", "DONE"], ["SENT", "BPC refuses", "FAILED"]],
    rules: ["Total refunds never exceed the captured amount.", "A payment not yet captured is cancelled, not refunded.", "The card holder sees the money in 5 to 10 business days (bank dependent)."],
    amends: ["WF11 15 to 17: before the A09 call, S18 checks open disputes with S4 (MP-Q24) and funds with S21 (MP-Q25). Replaces the PRD's block in \"S21a\".", "WF11: add cancelling an authorisation that is not captured, through A09 (MP-Q26)."],
    questions: [
      { id: "MP-Q24", q: "Where does the \"no refund while disputed\" check run? The PRD says S21a; in v8.1 portal refunds go S18 to A09 to BPC.", prop: "S18 asks S4 synchronously (DisputeCase by payment) before the A09 call. S4 also re-checks on every stage change (PRD).", owner: "CTO", decided: true },
      { id: "MP-Q25", q: "What if the merchant's balance is lower than the refund?", prop: "Allowed up to available plus pending; above that, refused with \"top up by transfer\". Never a negative balance.", owner: "Finance", decided: true },
      { id: "MP-Q26", q: "Cancelling an authorisation that is not captured is not described anywhere.", prop: "A \"Cancel\" action on authorised payments through A09, same rights as refund, no SCA (no money leaves).", owner: "CTO", decided: true }
    ]
  });

  /* ================= DISPUTES ================= */
  W("MP-16", {
    title: "Answer a chargeback", area: "Disputes", status: "amended", source: "WF11 steps 11 to 17; PRD WF11 Acquiring v6",
    trigger: "A card holder's bank disputes a payment.", object: "DisputeCase (S4)",
    screens: ["disputes", "dispute"], lanes: ["EXT", "S10", "S21", "S4", "S17", "MER", "S3", "S18", "OPS"],
    summary: "The money moves to a dispute account at once. The merchant gets a deadline, can upload documents, then escalates or accepts. Silence by the deadline means lost.",
    steps: [
      ["EXT", "S10", "Chargeback from Visa or Mastercard.", { ref: "WF11 11" }],
      ["S10", "S21", "Through NC2: the amount moves from the balance to the dispute account; any shortfall from the reserve; plus the chargeback fee.", { ref: "WF11 12 to 13", rule: "The balance is never negative" }],
      ["S21", "S4", "Opens the DisputeCase; deadline and reason code read through A09.", { ref: "WF11 14" }],
      ["S4", "S17", "Notice and webhook chargeback.created to the merchant.", { ref: "PRD notifications" }],
      ["MER", "S3", "Sees the case, the reason, days left and staff comments; uploads documents.", { ref: "WF11 15" }],
      ["#", "Merchant decides"],
      ["MER", "S3", "Escalate: reason \"Refund issued\" or \"See attached documents\" (at least one document unless refunded); amount up to the disputed amount, the rest accepted.", { sca: true, ref: "PRD Escalate" }],
      ["MER", "S3", "Or Accept: final, the case is lost.", { sca: true, ref: "PRD Accept" }],
      ["S3", "S18", "Sends the decision.", { api: "POST /v1/disputes/{caseId}/escalate | /accept + Idempotency-Key", sla: "2 s", ref: "WF11 16" }],
      ["S18", "S4", "Decision recorded on the DisputeCase in S4. The portal never sends it to BPC itself.", { dec: "MP-Q12" }],
      ["OPS", "EXT", "Paytinno chargeback analysts submit in Visa VROL or Mastercom, or decline to escalate weak evidence and tell the merchant why.", { ref: "PRD", dec: "MP-Q13" }],
      ["#", "Outcome"],
      ["S10", "S21", "Won: money back by origin. Lost: the dispute account is cleared.", {}],
      ["S4", "S17", "Every stage change and the result; reminders 72, 48 and 24 h before the merchant deadline.", { ref: "PRD notifications" }],
      ["S4", "S4", "No answer by the deadline: LOST automatically.", { fail: "Silence means loss" }]
    ],
    states: [["", "chargeback", "OPEN"], ["OPEN", "escalated", "SUBMITTED"], ["OPEN", "accepted or deadline", "LOST"], ["SUBMITTED", "issuer accepts or window passes", "WON"], ["SUBMITTED", "pre-arbitration", "OPEN"], ["SUBMITTED", "arbitration lost", "LOST"]],
    rules: ["Internal deadline = scheme deadline minus 3 days.", "Visa: 22 days for the merchant; Mastercard: 37 days for second presentment, 22 for pre-arbitration (PRD timers).", "Escalate and Accept are possible only while the stage waits for the merchant and the deadline has not passed.", "Staff comments are shown; internal notes are not."],
    amends: ["WF11 14 to 17: the merchant's Escalate or Accept goes to the DisputeCase in S4; chargeback analysts submit in VROL or Mastercom (PRD WF11 v6). Not through A09 at launch (MP-Q12).", "WF11 states: keep OPEN, SUBMITTED, WON, LOST, DECLINED for reporting; the portal shows the PRD stage names (MP-Q12).", "WF11 ledger: use the PRD's dispute (CB) sub-account; a shortfall comes from the reserve, then becomes a receivable from the merchant (MP-Q12).", "CTO question 29 answered: Paytinno chargeback analysts in S4 (MP-Q13)."],
    questions: [
      { id: "MP-Q12", q: "The PRD and v8.1 WF11 disagree: states (PRD stages vs OPEN/SUBMITTED/WON/LOST), channel (staff in VROL/Mastercom vs A09 to BPC), ledger (CB sub-account vs reserve and receivable).", prop: "Use the PRD for the merchant side and update WF11 in v8.2. The portal shows PRD stages and maps them to the v8.1 states for reporting.", owner: "CTO", decided: true },
      { id: "MP-Q13", q: "Who works disputes at launch? (CTO question 29)", prop: "Paytinno chargeback analysts in S4 (PRD), with the merchant answering in the portal.", owner: "COO", decided: true }
    ]
  });

  W("MP-17", {
    title: "Rolling reserve and reserve top-up", area: "Disputes", status: "new", source: "PRD WF11 (RR, RR_TOPUP); WF10 reserve release 180 days (proposed)",
    trigger: "Each settlement; a dispute larger than what is held; a Risk decision.", object: "Reserve account (S21), RR_TOPUP request (S4)",
    screens: ["balances", "messages"], lanes: ["S21", "S4", "OPS", "S17", "MER", "S3", "EXT", "S13"],
    summary: "A share of each settlement is held for [180] days and released day by day. If Risk asks for more, the merchant transfers it; it is never taken from settlements.",
    steps: [
      ["S21", "S21", "Holds the reserve % from each settlement; releases each day's amount after [180] days.", { rule: "Reserve % set in underwriting (MP-08)" }],
      ["S3", "MER", "Balances show the reserve and the release calendar.", {}],
      ["#", "Top-up"],
      ["OPS", "S4", "Risk sets a top-up amount and deadline (RR_TOPUP).", { ref: "PRD" }],
      ["S4", "S3", "Request in Messages with amount, IBAN and reference.", { api: "POST /admin/v1/rfi + merchant.notify" }],
      ["MER", "EXT", "Transfers from the company's account.", {}],
      ["S13", "S4", "Reconciled; request closed.", {}],
      ["S4", "OPS", "Not paid by the deadline: escalated to Risk; possible suspension (MP-26).", { fail: "Top-up overdue" }]
    ],
    states: [["", "requested", "TOPUP_OPEN"], ["TOPUP_OPEN", "reconciled", "PAID"], ["TOPUP_OPEN", "deadline", "ESCALATED"]],
    rules: ["The main balance is never negative.", "Top-ups only by transfer from the merchant."],
    questions: [
      { id: "MP-Q27", q: "Reserve release: v8.1 proposes 180 days; the PRD says \"on schedule\" with no number.", prop: "180 days rolling, daily release, per merchant override set in underwriting.", owner: "CRO" }
    ]
  });

  /* ================= MONEY ================= */
  W("MP-13", {
    title: "Balances, settlement and automatic payouts", area: "Money", status: "v81", source: "WF10 steps 4 to 12",
    trigger: "Daily settlement and payout cycle.", object: "MerchantPayout (S21)",
    screens: ["balances", "payouts", "home"], lanes: ["S10", "S21", "S7", "EXT", "S13", "S4", "S3", "MER"],
    summary: "Captured payments become payable after settlement, available after the reserve, and are paid out to the verified account on the merchant's schedule, if reconciliation is clean.",
    steps: [
      ["S10", "S21", "Authorisation, capture and clearing as separate states; one money effect even for late or duplicate files.", { ref: "WF10 4 to 5" }],
      ["S21", "S7", "MDR split into interchange, scheme and our fee (IFR Art. 12), applied once.", { ref: "WF10 6" }],
      ["EXT", "S21", "Scheme net settlement D+1 to our bank; files by 07:00.", { ref: "WF10 8 to 9" }],
      ["S13", "S4", "Reconciliation by 09:00. A difference holds the day's payouts (S4 through M0391, four eyes).", { ref: "WF10 10", fail: "Merchant sees \"Held while we check\"" }],
      ["S21", "S21", "Pays out only when eligible, before cut-off, with funds available and a verified account. Otherwise \"pending\".", { ref: "WF10 11" }],
      ["S21", "EXT", "SEPA credit transfer through BORICA (NC3). No retry; unknown result goes to status inquiry.", { ref: "WF10 12", fail: "Returned by the bank: the amount is back in available and the account is marked for check (MP-15)" }],
      ["S3", "MER", "Payouts list with what each payout contains (payments, refunds, fees, reserve).", {}]
    ],
    states: [["", "cycle", "SCHEDULED"], ["SCHEDULED", "reconciliation difference", "HELD"], ["SCHEDULED", "sent", "IN_TRANSIT"], ["IN_TRANSIT", "confirmed", "PAID"], ["IN_TRANSIT", "returned", "RETURNED"]],
    rules: ["Payouts only to a verified account in the merchant's name.", "Every money figure shows when it was last updated."],
    questions: [
      { id: "MP-Q28", q: "Which payout schedules does M0391 support (daily, weekly, monthly, minimum amount)?", prop: "Daily on business days as default; weekly and monthly as options; minimum [€100].", owner: "OraSYS" }
    ]
  });

  W("MP-14", {
    title: "Pay out now, and payout settings", area: "Money", status: "new", source: "One-pager S3 item 5 (\"payout to an external account through M0391\"); WF10 12 (\"funds stay with us by choice\")",
    trigger: "A user pays out available funds outside the schedule, or changes the schedule.", object: "Payout order (S21)",
    screens: ["balances", "payouts", "approvals"], lanes: ["MER", "S3", "S18", "S6", "S19", "S21", "EXT"],
    summary: "Only to the verified payout account, only from available funds, with SCA. Over the person's limit a second person approves.",
    steps: [
      ["MER", "S3", "Pay out now: amount up to available.", {}],
      ["S18", "S6", "Role and mandate. Over [€10,000] or the person's limit: approval (MP-23).", {}],
      ["S18", "S19", "SCA bound to amount and the masked IBAN.", { sca: true }],
      ["S3", "S18", "Payout order.", { api: "POST /v1/payouts {amount, accountRef} + Idempotency-Key" }],
      ["S18", "S21", "Through M0391; S21 checks eligibility and cut-off.", { api: "A05 / M0391", fail: "after cut-off: next business day, shown before signing" }],
      ["S21", "EXT", "SEPA credit transfer.", {}],
      ["#", "Settings"],
      ["MER", "S3", "Changes schedule, minimum amount, or chooses to keep funds with us.", {}],
      ["S18", "S6", "Second admin approves (MP-23).", {}],
      ["S18", "S21", "Settings stored for the next cycle.", { api: "PUT /v1/payouts/settings" }]
    ],
    states: [["", "requested", "REQUESTED"], ["REQUESTED", "over limit", "AWAITING_APPROVAL"], ["REQUESTED", "signed", "SCHEDULED"], ["SCHEDULED", "sent", "IN_TRANSIT"], ["IN_TRANSIT", "confirmed", "PAID"]],
    rules: ["Never to any account other than the verified payout account.", "No payout while a reconciliation hold is on."],
    questions: [
      { id: "MP-Q29", q: "\"Funds stay with us by choice\" (WF10 12): is that allowed, for how long, and how are those funds safeguarded?", prop: "Allowed up to [30] days, safeguarded like other client funds, shown as \"kept\". Longer needs a payment account under a separate agreement.", owner: "Compliance" }
    ]
  });

  W("MP-15", {
    title: "Change the payout account", area: "Money", status: "new", source: "WF02b invariant (verified account in the merchant's name, SCA); admin spec payout.account.changed",
    trigger: "An admin adds a new payout account.", object: "Payout account (S6, S21 verified list)",
    screens: ["payout-account", "approvals"], lanes: ["MER", "S3", "S18", "S6", "S19", "S4", "OPS", "S21", "S17"],
    summary: "The highest-risk change in the portal. Name check, second admin, staff check, then a cooling-off period before the first payout. The old account stays in use until then.",
    steps: [
      ["MER", "S3", "Admin enters IBAN and holder name and uploads a bank statement.", {}],
      ["S18", "S18", "IBAN format and SEPA reach; Verification of Payee name check: match, close match, no match.", { gap: "v8.1 does not say how \"in the merchant's name\" is checked (MP-Q30)." }],
      ["S18", "S19", "SCA bound to the new masked IBAN.", { sca: true }],
      ["S18", "S6", "Second admin approves, if there is one (MP-23).", {}],
      ["S18", "S4", "Change sent to the admin; payouts to the new account stopped until verified.", { api: "webhook payout.account.changed {accountRef, ibanMasked, holderMatches, verified, scaEvidenceId}", ref: "admin spec 6" }],
      ["OPS", "S4", "Checks the statement and the name; four eyes when the name check was not a match.", {}],
      ["S4", "S21", "Account on the verified list; becomes primary after [24 h].", { api: "M0391" }],
      ["S17", "MER", "Notice to every admin and to the company email: \"Your payout account was changed\".", { api: "merchant.notify payout_account_verified" }]
    ],
    states: [["", "added", "REQUESTED"], ["REQUESTED", "SCA and approval", "VERIFYING"], ["VERIFYING", "staff verify", "VERIFIED (cooling-off)"], ["VERIFIED (cooling-off)", "[24 h]", "PRIMARY"], ["VERIFYING", "refused", "REJECTED"]],
    rules: ["Payouts go only to a verified account in the merchant's name.", "No change for [24 h] after passkey recovery (MP-04).", "The old account stays primary until the new one is."],
    questions: [
      { id: "MP-Q30", q: "How is \"account in the merchant's name\" verified?", prop: "Verification of Payee name check plus a bank statement; no test transfer. A \"no match\" needs four eyes.", owner: "Compliance" },
      { id: "MP-Q31", q: "Cooling-off before the first payout to a new account?", prop: "[24 h], with notices to all admins so an account takeover is noticed in time.", owner: "CRO" }
    ]
  });

  W("MP-18", {
    title: "Statements, invoices and fees", area: "Money", status: "new", source: "One-pager S3 item 3; S7 \"fee breakdown to S3\" (IFR Art. 12); S17 statements",
    trigger: "Month end; or a user opens fees for a period.", object: "Statement (S7), invoice (S15)",
    screens: ["statements"], lanes: ["S7", "S21", "S18", "S3", "MER", "S17"],
    summary: "Monthly statement and invoice, and the fee for every payment split into interchange, scheme fee and our fee.",
    steps: [
      ["S7", "S7", "Month-end: fees per payment by IFR Art. 12 (interchange, scheme, ours), by brand and card category.", { gap: "Whether M008 can split per payment was open in v7.1 (MP-Q32)." }],
      ["S7", "S21", "Totals posted; invoice from ERP (S15).", {}],
      ["S18", "S3", "Statement and invoice available; daily fee report too.", { api: "GET /v1/statements, GET /v1/statements/{id}.pdf|csv" }],
      ["S17", "MER", "\"Your statement is ready\" with a link.", {}],
      ["MER", "S3", "Downloads; questions go to Messages.", {}]
    ],
    states: [["", "month closed", "ISSUED"], ["ISSUED", "correction", "REPLACED (new version)"]],
    rules: ["Kept 5 years.", "Merchants may ask for the fee split aggregated by brand and category (IFR Art. 12)."],
    questions: [
      { id: "MP-Q32", q: "Can M008 give the IFR Art. 12 split per payment?", prop: "Confirm with OraSYS. If not, S7 calculates it from the BPC clearing file.", owner: "OraSYS" }
    ]
  });

  W("MP-19", {
    title: "Tariff change notice", area: "Money", status: "new", source: "S17 regulatory notices (\"tariff change\"); admin spec template tariff_change",
    trigger: "Paytinno changes a merchant's tariff.", object: "Tariff version (S7)",
    screens: ["messages", "statements"], lanes: ["OPS", "S4", "S7", "S18", "S17", "MER", "S3"],
    summary: "The new version is scheduled with a notice period; the merchant sees old and new side by side and the right to end the agreement.",
    steps: [
      ["OPS", "S7", "New tariff version with an effective date; Legal approves the notice.", {}],
      ["S4", "S18", "Notice to the merchant.", { api: "merchant.notify tariff_change {tariff, effectiveAt}" }],
      ["S17", "MER", "Email and portal notice.", {}],
      ["MER", "S3", "Reads the change, old and new rates, the date, and the right to end the agreement free of charge before it applies.", {}],
      ["S7", "S7", "On the date the new version applies; statements show the version used.", {}]
    ],
    states: [["", "scheduled", "NOTIFIED"], ["NOTIFIED", "effective date", "APPLIED"], ["NOTIFIED", "merchant ends agreement", "CLOSURE (MP-27)"]],
    rules: ["Micro-enterprises: at least 2 months' notice (payment services rules); others as the agreement says."],
    questions: [
      { id: "MP-Q33", q: "Notice periods differ for micro-enterprises, but onboarding does not ask whether the merchant is one.", prop: "Ask in the application (MP-05) and keep it in S6; S7 refuses an effective date shorter than the notice period.", owner: "Legal", decided: true }
    ]
  });

  /* ================= DEVELOPERS ================= */
  W("MP-20", {
    title: "API keys: create, roll, revoke", area: "Developers", status: "new", source: "One-pager S3 item 6; WF10 3 (keys through S3, S4 operator until the BPC API covers it)",
    trigger: "A developer needs a key, or a key may be exposed.", object: "Gateway key (BPC)",
    screens: ["developers"], lanes: ["MER", "S3", "S18", "S19", "S10", "S4", "OPS", "S17"],
    summary: "Secrets are shown once and never kept by Paytinno. Rolling keeps the old key working for [24 h] so the merchant can switch without downtime.",
    steps: [
      ["MER", "S3", "Create a key (test or live) with a label, or roll or revoke one.", {}],
      ["S18", "S19", "SCA bound to the key label and action.", { sca: true, ref: "WF02a 22" }],
      ["S3", "S18", "Command.", { api: "POST /v1/keys {mode, label} | POST /v1/keys/{id}/roll | DELETE /v1/keys/{id}" }],
      ["S18", "S10", "Through A09.", { gap: "BPC API coverage for keys is open (questions 21, 33). Until then an S4 operator does it (MP-Q10).", api: "IF45 via A09" }],
      ["S10", "S3", "The secret, once. The portal shows it and forgets it.", { rule: "Shown once" }],
      ["S10", "S10", "Roll: the old key works for [24 h] more, then stops. Revoke: stops now.", {}],
      ["S17", "MER", "Email to admins and developers for every create, roll and revoke.", {}]
    ],
    states: [["", "created", "ACTIVE"], ["ACTIVE", "rolled", "EXPIRING"], ["EXPIRING", "time", "REVOKED"], ["ACTIVE", "revoked", "REVOKED"]],
    rules: ["Live keys only after go-live (MP-10).", "Secrets never in email, messages or logs."],
    questions: [
      { id: "MP-Q10", q: "If BPC cannot create keys through its API, how does the secret reach the merchant without staff seeing it?", prop: "Do not launch key self-service with an operator in the middle. Either BPC API support, or BPC's own console link for the first key. Confirm with BPC before build.", owner: "BPC" }
    ]
  });

  W("MP-21", {
    title: "Webhooks", area: "Developers", status: "amended", source: "WF10 3 (BPC webhooks); WF21 (merchant notices through Q5, A07, Q4); PRD WF11 (chargeback webhooks through S17); module spec v7.1",
    trigger: "A developer adds an endpoint; an event happens.", object: "Endpoint and delivery log (S17)",
    screens: ["developers"], lanes: ["MER", "S3", "S18", "S19", "S17", "S21", "S4", "S10"],
    summary: "One sender, one signature, one retry policy: Paytinno sends every event through S17. Only the result at checkout comes straight from the card processor's gateway, set per order.",
    steps: [
      ["#", "Set up"],
      ["MER", "S3", "Adds an HTTPS endpoint and chooses events: payments, refunds, payouts, disputes.", {}],
      ["S18", "S19", "SCA to add an endpoint, and to reveal or roll its signing secret.", { sca: true, dec: "MP-Q11" }],
      ["S18", "S17", "S17 keeps the endpoint, the secret and the delivery log. It sends a test event.", { api: "POST /v1/webhooks {url, events[]}", dec: "MP-Q34" }],
      ["#", "Events"],
      ["S21", "S17", "Payment, refund, settlement and payout events come from the core journal (Q5) through A07, as WF21 already routes merchant notices.", { ref: "WF21", dec: "MP-Q34" }],
      ["S4", "S17", "Dispute events: chargeback.created, updated, closed (PRD body, caseVersion).", { ref: "PRD" }],
      ["S17", "MER", "Delivery signed X-Paytinno-Signature = HMAC-SHA256(timestamp.body); success is 2xx in 10 s.", { ref: "PRD" }],
      ["S17", "S17", "Retries with backoff for 24 h, then marked failed. The merchant can read missed events through the API and resend any event with the same ID.", { api: "GET /v1/events?after= ; POST /v1/events/{id}/resend", dec: "MP-Q34", fail: "failing for [5] days: endpoint disabled, admins and developers told" }],
      ["MER", "S3", "Sees deliveries; ReNotify resends the same event ID.", { ref: "PRD ReNotify" }],
      ["#", "At checkout"],
      ["S10", "MER", "The gateway's own result callback for each payment (IF06). Set in the order request, not in the portal.", { ref: "WF10 3", rule: "Needs BPC to accept a callback URL per order (dependency)" }]
    ],
    states: [["", "added", "ACTIVE"], ["ACTIVE", "[5] days failing", "DISABLED"], ["DISABLED", "fixed and turned on again", "ACTIVE"]],
    rules: ["The merchant rejects messages older than 5 min.", "Event IDs are unique; resends keep the ID.", "Payment events from Paytinno follow the core journal, so they can arrive after the gateway's checkout callback."],
    amends: ["WF10 3 and PRD WF11: all merchant webhooks come from Paytinno through S17 with one signature (X-Paytinno-Signature) and one retry policy: backoff for 24 h, then pull through GET /v1/events. Replaces the PRD's \"once a day, 3 attempts\" (MP-Q34).", "WF10 3: the portal does not register webhooks at BPC. Only the per-order checkout callback stays with the BPC gateway.", "WF02a 22: webhook endpoints and secrets need SCA (MP-Q11)."],
    deps: ["BPC: the gateway accepts a result callback URL per order (CTO question 21)."],
    questions: [
      { id: "MP-Q11", q: "Is a webhook signing secret a key needing SCA? It lets anyone fake events to the merchant.", prop: "Yes: SCA to add an endpoint and to reveal or roll a secret.", owner: "CTO", decided: true },
      { id: "MP-Q34", q: "Two signing schemes and retry policies (BPC payment webhooks and Paytinno chargeback webhooks).", prop: "One sender: Paytinno sends all merchant events through S17 from the core journal and S4, with one signature, backoff for 24 h, then pull through the API. BPC webhooks are not taken at launch anyway (WF21); only the per-order checkout callback stays with the gateway.", owner: "CTO", decided: true }
    ]
  });


  W("MP-28", {
    title: "Reports and exports", area: "Developers", status: "new", source: "Not in v8.1",
    trigger: "A user exports payments, payouts or a reconciliation file.", object: "Export job",
    screens: ["payments", "payouts"], lanes: ["MER", "S3", "S18", "S10", "S21"],
    summary: "Small exports download at once; large ones run as a job and are ready to download in the portal.",
    steps: [
      ["MER", "S3", "Export with the current filters: CSV or Excel.", {}],
      ["S3", "S18", "Up to [10,000] rows at once; above that a job.", { api: "POST /v1/exports {type, filters} → {exportId}" }],
      ["S18", "S10", "Payments from BPC; money from S21.", {}],
      ["S18", "S3", "Ready: download link valid [24 h], logged.", {}]
    ],
    states: [["", "asked", "RUNNING"], ["RUNNING", "done", "READY"], ["READY", "[7] days", "DELETED"]],
    rules: ["Masked card data only.", "The payout reconciliation file lists every payment, refund, fee and reserve in a payout."],
    questions: []
  });

  /* ================= TEAM ================= */
  W("MP-22", {
    title: "Invite, change and remove users", area: "Team", status: "new", source: "One-pager S3 item 7; WF02b 17 (\"invites its other users with roles\"); WF02a 22 (role above threshold)",
    trigger: "An admin manages the team.", object: "Person to merchant link (S6)",
    screens: ["team"], lanes: ["MER", "S3", "S18", "S19", "S6", "S17"],
    summary: "Invitations by email, accepted through the normal registration. Roles that can move money need SCA to grant.",
    steps: [
      ["MER", "S3", "Admin invites: email, role, limits.", {}],
      ["S18", "S19", "SCA when the role is Admin or Finance.", { sca: true, ref: "WF02a 22" }],
      ["S18", "S6", "Invitation stored, valid [7] days.", { api: "POST /v1/team/invitations {email, role, mandate}" }],
      ["S17", "MER", "Email with a link.", {}],
      ["MER", "S19", "Invitee registers (MP-01) or signs in if they already have a portal account.", {}],
      ["S6", "S6", "Accepting links the person to the merchant with the role. Admins are told.", {}],
      ["#", "Change or remove"],
      ["MER", "S3", "Change role (SCA when raising it) or remove. The last admin cannot be removed.", {}],
      ["S6", "S19", "Removal: sessions for this merchant end at the next call; the person keeps other merchants.", {}]
    ],
    states: [["", "invited", "INVITED"], ["INVITED", "accepted", "ACTIVE"], ["INVITED", "[7] days or cancelled", "EXPIRED"], ["ACTIVE", "removed", "REMOVED"]],
    rules: ["At least one admin; two recommended (recovery, approvals).", "Every change is in the team history."],
    questions: [
      { id: "MP-Q35", q: "Do people with money roles (Admin, Finance) need an identity check?", prop: "Yes: IDV inside the portal when accepting an Admin or Finance invitation.", owner: "Compliance" },
      { id: "MP-Q01", q: "v8.1 names only ONBOARDING_APPLICANT and MERCHANT_ADMIN. There is no role list or permission table.", prop: "Admin, Finance, Developer, Support, Viewer with the table under Roles and rights.", owner: "Product" }
    ]
  });

  W("MP-23", {
    title: "Approvals by a second person", area: "Team", status: "new", source: "One-pager S3 item 7 (\"business roles, mandates and approvals\"); not modelled in v8.1",
    trigger: "An action over a person's limit, or one that always needs two people.", object: "Approval request (S6)",
    screens: ["approvals"], lanes: ["MER", "S3", "S18", "S6", "S19", "S17"],
    summary: "The merchant's own four eyes. The request waits until someone else with the right role approves with SCA.",
    steps: [
      ["MER", "S3", "Starts the action; signs the request.", { sca: true }],
      ["S18", "S6", "Over the limit: approval request, valid [48 h].", { api: "POST /v1/approvals" }],
      ["S17", "MER", "Notice to everyone who can approve.", {}],
      ["MER", "S3", "Another person approves or declines, with SCA.", { sca: true, rule: "Approver is never the requester" }],
      ["S18", "S18", "Runs the original command with its first Idempotency-Key.", {}]
    ],
    states: [["", "requested", "PENDING"], ["PENDING", "approved", "DONE"], ["PENDING", "declined", "DECLINED"], ["PENDING", "[48 h] or cancelled", "EXPIRED"]],
    rules: ["Always two people: payout account change, payout settings, closure, a new admin.", "Over the limit: refunds, payouts."],
    questions: [
      { id: "MP-Q05", q: "Who sets limits, and are there defaults?", prop: "Defaults per role (Support refunds up to [€100]); an admin can lower a person's limit, not raise it above the merchant's limit set by Paytinno.", owner: "Product" }
    ]
  });

  /* ================= BUSINESS ================= */
  W("MP-24", {
    title: "Business details, owners and periodic review", area: "Business", status: "new", source: "WF02b invariants (KYB refresh 12 or 36 months; owner change opens a case); admin spec application.updated",
    trigger: "The merchant changes details; a review date comes; a document expires.", object: "Change request (S6), review case (S4)",
    screens: ["business", "messages"], lanes: ["MER", "S3", "S18", "S6", "S11", "S4", "OPS"],
    summary: "Contact details change at once. Legal name, address, owners, representative, what is sold and new websites are requests that staff check first.",
    steps: [
      ["MER", "S3", "Changes contact email or phone: applied at once.", {}],
      ["MER", "S3", "Asks to change legal details, owners, representative, MCC, or add a website.", {}],
      ["S3", "S18", "Change request with documents.", { api: "POST /v1/merchant/changes → webhook application.updated" }],
      ["S6", "S11", "New owners screened; new representative does IDV in the portal.", {}],
      ["OPS", "S4", "Reviews; new website goes through the website check (MP-10).", {}],
      ["#", "Periodic review"],
      ["S6", "S4", "Review due: 12 months high risk, 36 others.", { ref: "WF02b invariant" }],
      ["S4", "S3", "RFI listing what to confirm or upload (MP-07).", {}],
      ["MER", "S3", "Confirms details, uploads documents.", {}]
    ],
    states: [["", "asked", "REQUESTED"], ["REQUESTED", "approved", "APPLIED"], ["REQUESTED", "refused", "REFUSED"]],
    rules: ["Ongoing sanctions screening runs in the AML system; the merchant sees nothing of it.", "Documents with an expiry date get reminders 30 days before."],
    questions: [
      { id: "MP-Q36", q: "What happens when a periodic review is overdue?", prop: "Reminders, then an S4 decision on restrictions (MP-26). Never automatic.", owner: "Compliance" }
    ]
  });

  W("MP-25", {
    title: "Messages and notices", area: "Business", status: "amended", source: "S17; admin spec 5.3 merchant.notify templates",
    trigger: "Paytinno sends a notice; a user writes to Paytinno.", object: "Notice, conversation",
    screens: ["messages", "settings"], lanes: ["MER", "S3", "S18", "S4", "OPS", "S17"],
    summary: "One inbox for requests, notices and support. Emails carry a link, not the content.",
    steps: [
      ["S4", "S18", "Notice from a fixed template.", { api: "merchant.notify {template, data}", ref: "admin spec 5.3" }],
      ["S17", "MER", "Email (and portal) in Bulgarian or English.", {}],
      ["MER", "S3", "Writes to support.", { api: "POST /v1/messages → webhook merchant.message" }],
      ["OPS", "S4", "Answers from the support inbox in S4 (phase 1). A help desk tool can replace it later; the portal API stays the same.", { dec: "MP-Q37" }],
      ["MER", "S3", "Sets which notices to get by email. Regulatory notices cannot be turned off.", {}]
    ],
    states: [],
    rules: ["Templates: welcome, application received, application rejected, RFI reminder, tariff change, acceptance suspended, acceptance reactivated, account closing, payout account verified (admin spec P5)."],
    amends: ["S4 module: add a merchant support inbox for phase 1 (MP-Q37).", "S17: emails to merchants carry a link to the portal, not the content."],
    questions: [
      { id: "MP-Q37", q: "Where are support conversations handled? The admin has no case management for them.", prop: "A simple inbox in S4 for phase 1; a help desk tool later.", owner: "COO", decided: true }
    ]
  });

  W("MP-26", {
    title: "Suspension and restricted access", area: "Business", status: "new", source: "Admin spec 5.4 access.revoke and P6; WF11 rule (chargeback ratio above 1%)",
    trigger: "Scheme programme, AML decision, unpaid top-up, overdue review.", object: "Merchant access",
    screens: ["home"], lanes: ["S4", "OPS", "S10", "S18", "S3", "MER", "S17"],
    summary: "Staff decide with four eyes. New payments stop; what the merchant can still do is limited but disputes stay answerable.",
    steps: [
      ["OPS", "S4", "Decision with four eyes.", {}],
      ["S4", "S10", "Acceptance profile suspended.", {}],
      ["S4", "S18", "Portal access restricted.", { api: "POST /admin/v1/merchants/{id}/access/revoke", ref: "admin spec 5.4" }],
      ["S17", "MER", "Notice acceptance_suspended, neutral text.", {}],
      ["S3", "MER", "Banner. Still possible: read payments and statements, answer disputes, messages. Not possible: refunds, payouts, keys, changes.", { gap: "admin spec 5.4 stops all actions; dispute answers must continue (MP-Q38)." }]
    ],
    states: [["ACTIVE", "suspended", "RESTRICTED"], ["RESTRICTED", "lifted", "ACTIVE"], ["RESTRICTED", "terminated", "CLOSING (MP-27)"]],
    rules: ["Text never says why when the reason is AML."],
    questions: [
      { id: "MP-Q38", q: "If revoked access stops every action, disputes go unanswered and are lost.", prop: "Two levels: RESTRICTED (disputes and messages work) and REVOKED (read-only, after closure).", owner: "CTO" }
    ]
  });

  W("MP-27", {
    title: "Close the account", area: "Business", status: "new", source: "S6 lifecycle and S4 closure (one-pager); admin spec P6 (5 years read access)",
    trigger: "The merchant asks to close, or Paytinno ends the agreement.", object: "Merchant lifecycle CLOSING to CLOSED",
    screens: ["settings"], lanes: ["MER", "S3", "S18", "S6", "S4", "OPS", "S10", "S21", "S17"],
    summary: "Acceptance stops on the date, the balance is paid out, the reserve is kept for the chargeback tail, and the portal stays readable.",
    steps: [
      ["MER", "S3", "Admin asks to close: date and reason; SCA and a second admin.", { sca: true }],
      ["S18", "S4", "Closure case: open disputes, reserve, last statement.", {}],
      ["S4", "S10", "Acceptance stops on the date.", {}],
      ["S21", "S21", "Final payout of available funds; reserve kept [180] days then released.", {}],
      ["S17", "MER", "Notice account_closing with dates.", {}],
      ["S3", "MER", "Read-only: statements, payments, documents for [5] years; disputes still answerable until the tail ends.", {}]
    ],
    states: [["ACTIVE", "requested", "CLOSING"], ["CLOSING", "reserve released and no open disputes", "CLOSED (read-only)"]],
    rules: ["Paytinno-initiated closure follows the agreement's notice, or immediately for cause."],
    questions: [
      { id: "MP-Q39", q: "Who keeps read access after closure, and for how long?", prop: "Admins and Finance, 5 years (AML record keeping), then the users are disabled.", owner: "Legal" }
    ]
  });

  /* portal screens a workflow runs on (ids are the prototype's routes: merchant-portal, #/<id>) */
  const SCREENS = {
    register: "Registration", application: "Application", home: "Home", payments: "Payments", payment: "One payment", refunds: "Refunds",
    disputes: "Disputes", dispute: "One dispute", balances: "Balances", payouts: "Payouts", "payout-account": "Payout account",
    statements: "Statements and fees", business: "Business", messages: "Messages", settings: "Settings", developers: "Developers",
    team: "Team", approvals: "Approvals", security: "Security"
  };
  const SOURCES = [
    "CTO architecture v8.1, 13 Oct 2026: one-page modules and workflows; low-level workflows WF02a, WF02b, WF10, WF11",
    "Module specs (file still v7.1, 2 Oct 2026; its S3 page describes the old bought portal)",
    "PRD WF11 Acquiring v6, V. Tulev, 15 Oct 2026",
    "Admin and merchant portal message spec v0.1, 15 Oct 2026 (paytinno-admin/docs/portal-connector.md)",
    "Merchant portal design boards, 14 Oct 2026 (screens only, no workflows)"
  ];
  const CONTRADICTIONS = [
    "The module spec file is v7.1 and still describes S3 as a portal bought from BPC. v8.1 has the portal built in house; there is no v8.1 S3 page.",
    "WF02a step 26 points to the wrong steps (MP-Q08).",
    "WF02b step 17 says the portal talks only to S18; WF02a has the portal talk to S19 directly through the web SDK (IF05 rows). Both can be true: S19's SDK for the passkey, S18 for everything else. Say so in v8.2.",
    "PRD WF11 and v8.1 WF11 disagree on dispute states, the channel to the schemes and the ledger accounts (MP-Q12). The PRD also uses component names S21a, S21b, S21c that v7.1 dropped.",
    "Chargeback ratio: v8.1 opens an underwriting case above about 1%; Visa VAMP and Mastercard ECP thresholds in the admin are different and still placeholders.",
    "Webhooks: payment events from BPC, dispute events from S17, with different signatures and retries (MP-Q34).",
    "The admin's access.revoke stops every action; WF11 needs dispute answers to keep working (MP-Q38)."
  ];
  const VERSION = "0.1";
  const AREAS = ["Access", "Onboarding", "Payments", "Disputes", "Money", "Developers", "Team", "Business"];
  const STATUS = { v81: ["v81", "In v8.1"], part: ["part", "v8.1 with gaps"], amended: ["amd", "v8.1, gaps closed"], new: ["new", "Proposed"] };
  const byId = id => list.find(w => w.id === id);
  const forScreen = s => list.filter(w => (w.screens || []).includes(s));
  const questions = () => { const out = []; list.forEach(w => (w.questions || []).forEach(q => out.push(Object.assign({ wf: w.id, wfTitle: w.title }, q)))); return out.sort((a, b) => parseFloat(a.id.slice(4)) - parseFloat(b.id.slice(4))); };
  list.sort((a, b) => AREAS.indexOf(a.area) - AREAS.indexOf(b.area) || a.id.localeCompare(b.id));
  return { list, AREAS, STATUS, SCREENS, SOURCES, CONTRADICTIONS, VERSION, byId, forScreen, questions };
})();
