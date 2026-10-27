/* Merchant portal (S3) workflows: the intended design, for review before the CTO's team builds it.
   This file is the source of truth. docs/ is generated from it (tools/build-docs.ps1); the viewer (index.html) reads it;
   the merchant-portal prototype loads it for its "Behind this screen" panel.

   status: "v81" = in v8.1 as written; "part" = in v8.1 with open gaps; "amended" = in v8.1, every gap closed by a decision
   (listed in amends: the changes v8.1 needs); "new" = not in v8.1, proposed here.
   question: decided: true = the proposed answer is adopted as the design, awaiting sign-off by its owner.
   deps: confirmations needed from outside (BPC, BNB, OraSYS); not design gaps.
   step: [from, to, text, opts]  opts: {api, ref, sla, sca, fail, rule, gap (open), dec (decided by MP-Qnn), added (not in v8.1)}
   group row: ["#", "title"].  from === to means work inside one system.
   lanes: system codes from src/model.js LANES.
   segments: merchant types the workflow is for (SEGMENTS); none means every merchant.
   placement: where a workflow would sit in the portal when the prototype has no screen for it yet (screens: []). */
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
    screens: ["security"], lanes: ["MER", "S3", "S18", "S19", "S17", "S4", "OPS", "S6"],
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
    title: "Fill in and send the application", area: "Onboarding", status: "part", source: "WF02b steps 1 to 4; admin spec application.submitted",
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
      ["S6", "S4", "The application appears in the admin. Until S6 exists, the admin stands in for it.", { api: "webhook application.submitted", ref: "admin spec 6", gap: "When does S6 exist, and how do cases move from the admin to it? (MP-Q64)" }],
      ["S4", "S3", "Status line STARTED.", { api: "POST /admin/v1/applications/{appId}/status", ref: "admin spec 5.1" }]
    ],
    states: [["", "first save", "DRAFT"], ["DRAFT", "sent", "STARTED"], ["DRAFT", "[90] days untouched", "deleted"], ["STARTED and later", "withdrawn by the applicant", "WITHDRAWN"]],
    rules: ["No acceptance before the whole onboarding is done.", "Sales do not send applications for merchants at launch.", "The applicant can withdraw until a decision is made."],
    amends: ["WF02b states: add DRAFT before STARTED, kept by S6 for [90] days (MP-Q16).", "WF02b 1: Commercial Register pre-fill through the KYB connector's lookup (MP-Q15).", "WF02b 1: ask whether the company is a micro-enterprise; S6 keeps it for tariff notices (MP-Q33).", "WF02b 5: IDV check for the representative only; owners screened from data, IDV for owners only when high risk or the data disagree (MP-Q17)."],
    questions: [
      { id: "MP-Q15", q: "Should the portal pre-fill from the Commercial Register?", prop: "Yes. S18 routes to the register lookup the KYB connector already has. Pre-filled fields are marked and kept as the register said.", owner: "CTO", decided: true },
      { id: "MP-Q16", q: "Where is the draft kept before it is sent? v8.1 starts the case only at submission.", prop: "Draft in S6 as an OnboardingCase in state DRAFT, keyed by person, kept [90] days. S18 only routes (it holds no business logic). Documents uploaded to the draft are deleted with it.", owner: "CTO", decided: true },
      { id: "MP-Q17", q: "Who must do an identity check: only the representative (v8.1), or every owner (the design prototype)?", prop: "Representative always. Owners are screened from data; an IDV check for owners only for high-risk merchants or when the register and the declaration disagree.", owner: "Compliance", decided: true },
      { id: "MP-Q64", q: "When will the onboarding service (S6) exist? Until then the admin stands in for it. Where do onboarding cases live in the meantime, and how do they move to S6?", prop: "The CTO to give a date. Until then the admin keeps the cases with the same states and IDs that S6 will use, so they move across as they are, without a second onboarding.", owner: "CTO" }
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
      ["S4", "S3", "Status line KYB_PENDING, then ONBOARDING_REVIEW or MANUAL_REVIEW.", { api: "application.status", rule: "Fixed texts, never the reason" }]
    ],
    states: [["STARTED", "IDs recorded", "KYB_PENDING"], ["KYB_PENDING", "checks clear", "ONBOARDING_REVIEW"], ["KYB_PENDING", "hit or review", "MANUAL_REVIEW"], ["KYB_PENDING", "information missing", "INFO_REQUESTED (MP-07)"]],
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
    title: "Onboarding review and the offer", area: "Onboarding", status: "amended", source: "WF02b steps 10 to 12 (v8.1 calls it underwriting)",
    trigger: "Checks are complete (MP-06).", object: "Onboarding review case (S4), offer",
    screens: ["application"], lanes: ["MER", "S3", "S18", "S6", "S4", "OPS", "EXT", "S17"],
    summary: "Staff review the merchant and set limits, tariff, reserve and deposit with four eyes. A credit review (underwriting) is added only when the merchant creates credit exposure for Paytinno. Then the merchant sees the offer and accepts it with SCA before set-up starts.",
    steps: [
      ["S6", "S4", "Onboarding review case. Every high-risk sector on Compliance's list gets its extra checks: licence, scheme registration, website and sales model.", { ref: "WF02b 10", dec: "MP-Q61" }],
      ["S4", "EXT", "MATCH and VMAS checks by API. Manual check in the scheme's own tool only when the API cannot be used; the result and evidence go into the case.", { ref: "WF02b 11", dec: "MP-Q65" }],
      ["OPS", "S4", "Limits, tariff, rolling reserve %, guarantee deposit, MCC.", { sla: "2 business days", rule: "Four eyes above a threshold or for high-risk sectors", ref: "WF02b 11" }],
      ["OPS", "S4", "Exposure test. If a credit trigger is met, a credit review (underwriting) by the credit approver sets the reserve, deposit and payout delay that cover the exposure.", { dec: "MP-Q60", added: true, rule: "Without a trigger there is no credit review" }],
      ["S4", "S6", "Approved with conditions, or rejected. Approver differs from preparer.", { ref: "WF02b 12" }],
      ["S4", "S3", "Rejected: status CLOSED_REJECTED and a neutral notice.", { api: "merchant.notify application_rejected", fail: "No reason is given in the portal" }],
      ["#", "Offer"],
      ["S4", "S3", "Approved: the offer appears: tariff, reserve %, deposit, limits, payout schedule, the agreement.", { dec: "MP-Q19", added: true }],
      ["MER", "S3", "The admin applicant accepts with SCA. The agreement version and evidence are stored.", { sca: true, dec: "MP-Q19" }],
      ["S3", "S18", "Acceptance.", { api: "POST /v1/merchants/applications/{appId}/offer/accept" }],
      ["S18", "S6", "Moves on to AWAITING_DEPOSIT or PROVISIONING (MP-09).", {}]
    ],
    states: [["ONBOARDING_REVIEW", "approved", "OFFER_SENT"], ["OFFER_SENT", "accepted", "AWAITING_DEPOSIT or PROVISIONING"], ["OFFER_SENT", "[14] days", "WITHDRAWN"], ["ONBOARDING_REVIEW", "rejected", "CLOSED_REJECTED"]],
    rules: ["The rejection text is the same whatever the reason.", "The decision record keeps rationale, policy version, tariff, reserve and approvers, and the credit approver when there was a credit review (WF02b 18).", "\"Underwriting\" means only the credit review. The rest is the onboarding review."],
    amends: ["WF02b 10 to 12: call it the onboarding review and the state ONBOARDING_REVIEW, not UNDERWRITING. Underwriting is only the credit review, when a credit trigger is met (MP-Q60).", "WF02b 10: extra sector checks for every high-risk sector on Compliance's list, not only MCC 7995 (MP-Q61).", "WF02b 11: MATCH and VMAS checks by API; manual only as a fallback, with evidence in the case (MP-Q65).", "WF02b: add state OFFER_SENT between approval (step 12) and set-up (step 13); the representative accepts the offer and agreement with SCA; the offer lapses after [14] days (MP-Q19)."],
    questions: [
      { id: "MP-Q19", q: "Where does the merchant agree to the tariff, reserve and agreement? v8.1 goes from approval straight to set-up.", prop: "Add OFFER_SENT: the offer in the portal, accepted with SCA by the applicant who is the representative. Qualified e-signature only if Legal requires it.", owner: "Legal", decided: true },
      { id: "MP-Q60", q: "When does onboarding need a credit review (underwriting), and who signs it?", prop: "Only when a credit trigger is met: goods or services delivered later (travel, tickets, events, pre-orders, memberships of more than [3] months); expected monthly volume above [€250,000]; payouts faster than the schemes pay Paytinno; or reserve and deposit below the estimated exposure (volume times days to delivery plus the refund and chargeback window). The CRO or a delegated credit approver signs; the onboarding review team cannot approve its own credit decision.", owner: "CRO", decided: true },
      { id: "MP-Q65", q: "How are MATCH and VMAS checked: through BPC, directly with Mastercard and Visa, or by hand?", prop: "By API, directly or through BPC, whichever the schemes and BPC allow. A manual check in the scheme's own tool only when the API cannot be used, with a screenshot or export kept in the case.", owner: "CTO", decided: true },
      { id: "MP-Q61", q: "Which sectors are high risk, and what extra checks does each get? v8.1 names only gambling (MCC 7995).", prop: "Compliance keeps one list in the risk policy, the same list the AML system scores on. At least: gambling (National Revenue Agency licence), crypto (registration or MiCA licence), online pharmacy and medicines (Bulgarian Drug Agency permit), adult content, dating, tobacco, e-cigarettes and alcohol (age checks), forex and CFDs (investment firm licence), nutraceuticals and free trials (subscription terms), travel and ticketing (credit review). Each gets a licence check where one applies, the scheme high-risk registration where Visa or Mastercard require it, a website and sales-model review, four eyes and KYB refresh every 12 months.", owner: "Compliance", decided: true }
    ]
  });

  W("MP-09", {
    title: "Deposit, set-up and activation", area: "Onboarding", status: "part", source: "WF02b steps 13 to 17; PRD WF11 AWAITING_DEPOSIT; admin spec 5.4 access.grant",
    trigger: "The offer is accepted (MP-08).", object: "OnboardingCase PROVISIONING to ACTIVE",
    screens: ["application", "home"], lanes: ["MER", "S3", "S18", "S6", "S4", "S21", "S10", "S13", "EXT", "S17"],
    summary: "If a deposit is required, the merchant transfers it first. Then accounts in OraSYS and the merchant in BPC. Only when both confirm is the merchant active and the full portal opens.",
    steps: [
      ["#", "Deposit (when the offer has one)"],
      ["S3", "MER", "Shows the deposit amount, our IBAN and the payment reference.", { dec: "MP-Q20" }],
      ["MER", "EXT", "Transfers from the company's account.", {}],
      ["S21", "S21", "Credits the rolling reserve account.", {}],
      ["S13", "S6", "Reconciled: deposit received in full from an account in the merchant's name.", { rule: "S10 is not activated before the deposit is in and reconciled" }],
      ["#", "Set-up"],
      ["S6", "S21", "Merchant in M001; settlement, reserve and control accounts; payout account on the verified list.", { api: "A05 / M0391", ref: "WF02b 13" }],
      ["S6", "S10", "BPC merchant onboarding: acquirer merchant ID, terminals, hosted page and SDK keys.", { api: "IF45 via A09", sla: "10 s, 3 attempts, idempotent", fail: "persistent error: COMPENSATING and an S4 case (MP-Q63)", ref: "WF02b 14", gap: "Can the BPC API create merchants, terminals and keys at all? (CTO question 21, MP-Q62)" }],
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
      { id: "MP-Q20", q: "AWAITING_DEPOSIT (PRD WF11) is not in the WF02b state machine.", prop: "Add it between the offer and PROVISIONING. Show the deposit IBAN and reference in the portal. Unpaid after [30] days: offer lapses.", owner: "CTO", decided: true },
      { id: "MP-Q62", q: "Can the BPC API create the merchant, its terminals and its hosted page and SDK keys? (CTO question 21)", prop: "Confirm with BPC. If not, set-up in BPC is a manual task in S4 with its own state (SETUP_MANUAL), an SLA of [2] business days and four eyes on the data typed into BPC. ACTIVE still needs both confirmations.", owner: "CTO" },
      { id: "MP-Q63", q: "What happens when set-up half-fails, for example OraSYS opens the accounts but BPC keeps failing? v8.1 only says compensation and an S4 case (risk R10).", prop: "OraSYS first, then BPC, each with an idempotency key per case. On a persistent failure the accounts stay blocked, not deleted, and an S4 case either retries or reverses: deactivate the BPC merchant if it was created, then close the empty accounts. Never active on one side only. Staff see both sides' state in the case.", owner: "CTO" }
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
    screens: ["payment", "refunds"], lanes: ["MER", "S3", "S18", "S6", "S4", "S19", "S10", "S21", "S13"],
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
      ["S21", "S21", "Holds the reserve % from each settlement; releases each day's amount after [180] days.", { rule: "Reserve % set in the onboarding review (MP-08)" }],
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
      { id: "MP-Q27", q: "Reserve release: v8.1 proposes 180 days; the PRD says \"on schedule\" with no number.", prop: "180 days rolling, daily release, per merchant override set in the onboarding review, or the credit review (MP-Q60).", owner: "CRO" }
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
      ["OPS", "S4", "Paytinno ends the agreement: staff record the reason. Only if it is a listing reason in the scheme rules (for example fraud, laundering, excessive chargebacks or fraud, a data breach) is the merchant added to MATCH and VMAS, by API, with four eyes and within the scheme deadline. Other closures are not listed.", { dec: "MP-Q66", rule: "Not every termination is a listing" }],
      ["S4", "S10", "Acceptance stops on the date.", {}],
      ["S21", "S21", "Final payout of available funds; reserve kept [180] days then released.", {}],
      ["S17", "MER", "Notice account_closing with dates.", {}],
      ["S3", "MER", "Read-only: statements, payments, documents for [5] years; disputes still answerable until the tail ends.", {}]
    ],
    states: [["ACTIVE", "requested", "CLOSING"], ["CLOSING", "reserve released and no open disputes", "CLOSED (read-only)"]],
    rules: ["Paytinno-initiated closure follows the agreement's notice, or immediately for cause.", "A MATCH or VMAS listing follows the scheme's reason list, not staff preference: listed when a reason applies, never otherwise."],
    amends: ["S4 closure: record the termination reason; add MATCH and VMAS listing by API only for the scheme listing reasons (MP-Q66)."],
    questions: [
      { id: "MP-Q39", q: "Who keeps read access after closure, and for how long?", prop: "Admins and Finance, 5 years (AML record keeping), then the users are disabled.", owner: "Legal" },
      { id: "MP-Q66", q: "When does a terminated merchant go on MATCH and VMAS?", prop: "Only when the termination reason is one the scheme rules list. When one applies, listing is required, so it is not optional for staff. Commercial reasons, the merchant's own request and inactivity are never listed. Compliance keeps the mapping from our reasons to the scheme reason codes.", owner: "Compliance", decided: true }
    ]
  });

  /* ================= ADDED 22 OCT 2026: needs found in v8.1 but not covered, and what merchants will expect ================= */
  W("MP-29", {
    title: "Payment links and QR codes", area: "Payments", status: "new", segments: ["links"],
    source: "WF10 trigger (checkout by \"HPP, link, QR, terminal\"); module spec v7.1 Merchant API (\"payments, links, status\")",
    trigger: "A merchant wants to be paid without a checkout: by phone, chat, social media, invoice or at an event.", object: "Payment link (a BPC hosted page order)",
    screens: [], placement: "Payments: a Links tab with Create link; a quick action on Home",
    lanes: ["MER", "S3", "S18", "S10", "CH", "S21", "S17"],
    summary: "The merchant creates a link for an amount, shares it or shows it as a QR code, and the customer pays on the hosted page. One link, one payment, unless the link is reusable.",
    steps: [
      ["#", "Create"],
      ["MER", "S3", "Creates a link: amount, description, own reference, expiry ([7] days by default, up to [30]), one payment or reusable.", {}],
      ["S3", "S18", "Sends it. Needs the right to create links; no SCA, because no money leaves.", { api: "POST /v1/payment-links {amount, description, reference, expiresAt, reusable} + Idempotency-Key", sla: "2 s" }],
      ["S18", "S10", "Creates a hosted page order at BPC through A09 and gets its address.", { api: "IF45 via A09", fail: "BPC refuses: the user is told, nothing is created" }],
      ["S18", "S3", "The link, and a QR code of it made in the portal. The merchant copies the link, downloads the QR code or prints it.", {}],
      ["MER", "CH", "The merchant sends the link or shows the QR code. Paytinno does not send it in phase 1 (MP-Q40).", {}],
      ["#", "Pay"],
      ["CH", "S10", "The customer opens the link and pays on the hosted page with 3-D Secure, like any online payment (MP-11).", { ref: "WF10 1 to 3" }],
      ["S10", "S21", "Posting through NC2, as for every payment.", { ref: "WF10 4 to 7" }],
      ["S17", "MER", "Webhook payment_link.paid and a notice in the portal (MP-21).", {}],
      ["#", "Manage"],
      ["MER", "S3", "Sees each link with its status and payments; cancels a link that is not paid yet.", { api: "GET /v1/payment-links; POST /v1/payment-links/{id}/cancel" }]
    ],
    states: [["", "created", "OPEN"], ["OPEN", "paid, one-payment link", "PAID"], ["OPEN", "expiry date", "EXPIRED"], ["OPEN", "merchant cancels", "CANCELLED"]],
    rules: ["The page shows the merchant's trading name, the amount and the description; card details are typed only on the hosted page.", "A one-payment link cannot be paid twice.", "Same limits, risk rules and fees as other online payments; refunds as MP-12.", "High-risk merchant categories get links only if the onboarding review allows it (MP-38)."],
    amends: ["WF10: add creating, sharing and cancelling payment links and QR codes in the portal. WF10 lists link and QR as checkout channels but has no flow for them."],
    deps: ["BPC: hosted page orders created through the API with an expiry of up to [30] days (pay by link)."],
    questions: [
      { id: "MP-Q40", q: "Should Paytinno send payment links to the merchant's customers by email or SMS?", prop: "Not in phase 1; the merchant shares the link itself. Sending would make Paytinno process the merchant's customer data, and messages with payment links from a payment company are a common phishing pattern.", owner: "Legal" },
      { id: "MP-Q41", q: "Which web address do links use: BPC's hosted page domain or one of ours?", prop: "Our own sub-domain (for example pay.paytinno.com) in front of the BPC hosted page, so customers see a name they can check.", owner: "CTO" }
    ]
  });

  W("MP-30", {
    title: "Card terminals", area: "Payments", status: "new", segments: ["pos"],
    source: "WF02b 14 (terminals created in BPC); one-pager S4 (\"terminals and keys\"); S10 gateway (terminals; SoftPOS in phase 2)",
    trigger: "A merchant with a shop wants a terminal, or one is lost, broken or no longer needed.", object: "Terminal (a terminal ID at BPC) at a shop location (merchant ID)",
    screens: [], placement: "Payments: a Terminals page; terminal payments show the terminal and shop they came from",
    lanes: ["MER", "S3", "S18", "S4", "OPS", "S10", "TMS", "S17"],
    summary: "The merchant orders terminals for a shop address; Paytinno sets them up at BPC and ships them; the merchant activates, blocks or returns them in the portal.",
    steps: [
      ["#", "Order"],
      ["MER", "S3", "Admin orders terminals: shop address, how many, model, delivery address.", {}],
      ["S3", "S18", "Sends the order.", { api: "POST /v1/terminals/orders {locationId, model, quantity, deliveryAddress}" }],
      ["S18", "S4", "Order case. If card-present payments or this shop address are not approved yet, it becomes a change request first (MP-38).", { rule: "Each shop address is a location with its own merchant ID" }],
      ["OPS", "S4", "Staff check the order and choose the devices.", {}],
      ["S4", "S10", "Terminal IDs created at BPC through A09, with the shop's MCC, address, receipt text and contactless limit.", { api: "IF45 via A09", ref: "WF02b 14" }],
      ["OPS", "TMS", "The supplier loads keys and settings and ships the terminal; the tracking number goes to the merchant.", {}],
      ["#", "Activate and use"],
      ["MER", "TMS", "Turns the terminal on and enters the activation code shown in the portal; the terminal downloads its settings.", {}],
      ["TMS", "S10", "First connection; the terminal is active.", {}],
      ["S10", "S3", "Terminal payments appear under Payments with their terminal and shop; settlement and payouts as for every payment (MP-13).", { ref: "WF10" }],
      ["#", "Lost, broken or not needed"],
      ["MER", "S3", "Blocks a lost terminal at once, asks for a replacement, or returns one.", { api: "POST /v1/terminals/{tid}/block | /replace | /return" }],
      ["S18", "S10", "Blocked through A09, or through the supplier's terminal management, whichever BPC supports.", { sla: "[1 min]" }],
      ["S4", "S17", "Notice to the merchant's admins for every order, block, replacement and return.", {}]
    ],
    states: [["", "ordered", "ORDERED"], ["ORDERED", "set up at BPC and shipped", "SHIPPED"], ["SHIPPED", "first connection", "ACTIVE"], ["ACTIVE", "lost or stolen", "BLOCKED"], ["ACTIVE", "faulty", "REPLACING"], ["REPLACING", "new device active", "REPLACED"], ["ACTIVE", "sent back", "RETURNED"]],
    rules: ["Refunds on the terminal are off by default; refunds go through the portal with limits (MP-12).", "A blocked terminal is never unblocked; it is replaced.", "Terminal payments are card-present: chip and PIN or contactless instead of 3-D Secure.", "SoftPOS (a phone as terminal) is phase 2."],
    amends: ["WF02b 14 and the S4 module: add how a merchant orders, activates, blocks, replaces and returns terminals, and who ships and supports them."],
    deps: ["BPC: creating terminal IDs and blocking terminals through A09, and how its terminal management works with the device supplier."],
    questions: [
      { id: "MP-Q42", q: "Who supplies, ships and supports terminals, and do merchants rent or buy them?", prop: "Rent through Paytinno from one supplier, delivered by courier, replaced within [2] business days, rent shown in the tariff.", owner: "COO" },
      { id: "MP-Q43", q: "Should shop staff be able to refund on the terminal?", prop: "Off by default. On request: protected by a supervisor PIN and a daily refund limit.", owner: "CRO" }
    ]
  });

  W("MP-31", {
    title: "Capture later, or in part", area: "Payments", status: "new", segments: ["later"],
    source: "WF10 4 (authorisation, capture and clearing are separate states)",
    trigger: "A merchant that charges on dispatch or at check-out authorises first and captures later.", object: "AcquiringTransaction from AUTHORISED to CAPTURED",
    screens: [], placement: "One payment: a Capture button next to Cancel; Payments: an Authorised tab; Developers: capture mode per website",
    lanes: ["MER", "S3", "S18", "S10", "S21", "S17"],
    summary: "With manual capture the card is only held at payment time. The merchant captures all or part later and the rest is released. Holds that are not captured in time expire.",
    steps: [
      ["#", "Set up"],
      ["MER", "S3", "Developer or admin chooses the capture mode for each website: automatic (the default) or manual. The API can also set it per order.", { api: "PUT /v1/websites/{id}/capture-mode" }],
      ["S18", "S10", "Mode set at BPC through A09.", { api: "IF45 via A09" }],
      ["#", "Capture"],
      ["MER", "S3", "On an authorised payment: Capture, in full or in part, never more than was authorised.", {}],
      ["S3", "S18", "Sends the capture. Same roles as refund; no SCA, because money comes in.", { api: "POST /v1/payments/{id}/capture {amount} + Idempotency-Key", sla: "2 s" }],
      ["S18", "S10", "Capture through A09. A part capture releases the rest of the hold at once.", { api: "IF45 via A09", fail: "hold expired: refused; the customer must pay again" }],
      ["S10", "S21", "Through NC2 the payment becomes CAPTURED; fees only on the captured amount.", { ref: "WF10 4 to 7" }],
      ["#", "Expiry"],
      ["S17", "MER", "Daily notice: payments whose hold ends tomorrow.", {}],
      ["S10", "S21", "Holds not captured in time expire and are released to the customer.", { rule: "[7] days by default; longer for hotels and car rental, by scheme rules" }]
    ],
    states: [["", "authorised", "AUTHORISED"], ["AUTHORISED", "captured in full", "CAPTURED"], ["AUTHORISED", "captured in part, rest released", "PARTLY_CAPTURED"], ["AUTHORISED", "cancelled (MP-12)", "CANCELLED"], ["AUTHORISED", "not captured in time", "EXPIRED"]],
    rules: ["Only captured money becomes payable (WF10).", "The customer sees the hold on the card until it is captured, cancelled or expires.", "Hotels and car rental can raise a hold (incremental authorisation) through the API, where BPC supports it."],
    amends: ["WF10 4: add capture and part capture started by the merchant through A09, the capture mode per website, and the expiry of holds that are not captured."],
    deps: ["BPC: manual capture, part capture, incremental authorisation and hold expiry through A09 (CTO question 21)."],
    questions: [
      { id: "MP-Q44", q: "Can an order that ships in parts be captured in several parts?", prop: "Yes, if BPC supports several captures on one authorisation; otherwise one capture and the rest released.", owner: "CTO" },
      { id: "MP-Q45", q: "Which capture mode do new merchants get?", prop: "Automatic. Manual only on request, for merchants that ship goods or take deposits, agreed in the onboarding review.", owner: "Product" }
    ]
  });

  W("MP-39", {
    title: "Saved cards and recurring payments", area: "Payments", status: "new", segments: ["recurring"],
    source: "PRD WF11 (paymentOptionId, the BPC gateway token); not in v8.1",
    trigger: "A customer saves a card at checkout, or a merchant charges a subscription.", object: "Saved card (BPC token), merchant-initiated payment",
    screens: [], placement: "Payments: a Saved cards tab; each payment shows whether the customer or the merchant started it",
    lanes: ["CH", "S10", "MER", "S3", "S18", "S17"],
    summary: "The first payment is made by the customer, with 3-D Secure and consent to save the card. Later payments are started by the merchant without the customer. Saved cards can be found and deleted in the portal.",
    steps: [
      ["#", "Save"],
      ["CH", "S10", "Pays with 3-D Secure and agrees to save the card for later payments.", { ref: "WF10 1" }],
      ["S10", "MER", "A token for the card (paymentOptionId), linked to the merchant's own customer reference. No card number leaves BPC.", {}],
      ["#", "Charge later"],
      ["MER", "S10", "The merchant's system charges the token through the gateway API as a merchant-initiated payment that refers to the first one. No 3-D Secure.", { ref: "IF06" }],
      ["S17", "MER", "Webhook payment.succeeded or payment.failed (MP-21).", {}],
      ["#", "Manage"],
      ["MER", "S3", "Finds saved cards by customer reference: masked card, expiry, created, last used.", { api: "GET /v1/saved-cards?customerRef" }],
      ["MER", "S3", "Deletes a saved card when the customer asks.", { api: "DELETE /v1/saved-cards/{id}" }],
      ["S18", "S10", "Deleted at BPC through A09.", { api: "IF45 via A09" }]
    ],
    states: [["", "first payment with consent", "ACTIVE"], ["ACTIVE", "card replaced by the bank (card updater)", "UPDATED"], ["UPDATED", "next payment", "ACTIVE"], ["ACTIVE", "card expires", "EXPIRED"], ["ACTIVE", "deleted", "DELETED"]],
    rules: ["A card is saved only with the customer's consent, at a payment with 3-D Secure.", "Never try again after a \"do not try again\" decline; follow the schemes' retry limits (Visa: at most 15 tries in 30 days).", "Subscriptions follow the schemes' rules on free trials and reminders.", "Deleting a saved card refunds nothing."],
    amends: ["WF10: add saved cards (stored credentials) and merchant-initiated payments: the first payment with SCA and consent, later payments referring to it, tokens visible and deletable in the portal."],
    deps: ["BPC: tokens that can be deleted through A09, merchant-initiated payment flags, and card updater services (Visa Account Updater, Mastercard ABU)."],
    questions: [
      { id: "MP-Q56", q: "Do we offer only saved cards and merchant-initiated payments, or also a subscription engine (plans, schedules, retries)?", prop: "Only saved cards and merchant-initiated payments through the API in phase 1; merchants run their own schedules.", owner: "Product" }
    ]
  });

  W("MP-35", {
    title: "Fraud and dispute ratio warnings", area: "Disputes", status: "new",
    source: "Paytinno Admin monitoring (Visa VAMP, Mastercard ECP and EFM by calendar month); WF11 rule (chargeback ratio above about 1%)",
    trigger: "A merchant's fraud or dispute ratio rises toward a card scheme programme threshold.", object: "The merchant's monthly ratios (S4)",
    screens: [], placement: "Disputes: a Your ratios panel; notices in Messages",
    lanes: ["S10", "S4", "OPS", "S3", "MER", "S17"],
    summary: "The merchant sees its own fraud and dispute ratios each month and is warned before it enters a scheme programme, with what to do about it.",
    steps: [
      ["S10", "S4", "Fraud reports and disputes per merchant, counted by calendar month, as on the admin's Monitoring page.", {}],
      ["S4", "S3", "The merchant's ratios against the warning level and the programme thresholds, this month and the last [3].", { api: "GET /v1/risk/ratios" }],
      ["S4", "S17", "Early warning when a ratio passes [70%] of a threshold: what it means and what helps (3-D Secure on every payment, refunding before a dispute, clear statement text, proof of delivery).", { api: "merchant.notify scheme_warning" }],
      ["#", "In a programme"],
      ["S4", "S17", "Notice that the merchant is in Visa VAMP or Mastercard ECP or EFM, with the fines the agreement lets us pass on.", { api: "merchant.notify scheme_programme" }],
      ["S4", "S3", "Request for a remediation plan within [10] days (MP-07).", {}],
      ["MER", "S3", "Sends the plan; staff follow it every month.", {}],
      ["OPS", "S4", "Still above after [3] months: staff decide on restrictions (MP-26).", {}],
      ["S4", "S17", "Notice when the merchant leaves the programme.", { api: "merchant.notify scheme_exit" }]
    ],
    states: [["", "month closed", "NORMAL"], ["NORMAL", "a ratio passes [70%] of a threshold", "EARLY_WARNING"], ["EARLY_WARNING", "threshold passed", "IN_PROGRAMME"], ["IN_PROGRAMME", "plan received", "REMEDIATION"], ["REMEDIATION", "[3] months below", "NORMAL"], ["REMEDIATION", "still above", "RESTRICTED"]],
    rules: ["Thresholds are the placeholders in Paytinno Admin until the schemes confirm them in writing.", "Scheme fines are passed on only as the agreement allows.", "The merchant sees only its own ratios."],
    amends: ["S4 monitoring (VAMP, ECP, EFM): show the merchant its own ratios and send warning, programme and exit notices (new templates scheme_warning, scheme_programme, scheme_exit)."],
    questions: [
      { id: "MP-Q52", q: "At what level do we warn merchants, and which scheme fines do we pass on?", prop: "Warn at [70%] of each threshold; pass on scheme fines in full while the merchant is in a programme, as the agreement says.", owner: "CRO" }
    ]
  });

  W("MP-33", {
    title: "Payouts to players", area: "Money", status: "new", segments: ["gambling"],
    source: "WF02b 10 (extra sector checks); the design boards (payout approvals for a gambling operator); not in v8.1",
    trigger: "A gambling operator pays a player's winnings or withdrawal.", object: "Player payout (S21): a card payout through BPC or a SEPA transfer",
    screens: [], placement: "Money: a Player payouts page with a review queue and review rules; Developers: payout keys",
    lanes: ["MER", "S3", "S18", "S4", "S6", "S19", "S21", "S10", "EXT", "S11", "S17"],
    summary: "Paid from the operator's available balance to the card the player deposited with, or to an account in the player's name. The operator's own review rules decide which payouts need a second look.",
    steps: [
      ["#", "Set up"],
      ["S4", "S6", "The onboarding review approves player payouts, with limits per payout and per day, and the methods: card payout, SEPA, or both.", { ref: "MP-08" }],
      ["MER", "S3", "The operator sets its review rules: amounts, new destinations, payouts per player per day. Below them, payouts go straight out.", {}],
      ["#", "Request"],
      ["MER", "S18", "A payout request, usually through the API with a payout-only key: player reference, destination (a card token from a deposit, or an IBAN and name), amount.", { api: "POST /v1/player-payouts {playerRef, destination, amount, reference} + Idempotency-Key" }],
      ["S18", "S21", "Checks: available balance, limits, and that this player deposited with the card in the last [180] days.", { api: "A05 / M0391", rule: "Return to source (MP-Q50)", fail: "not enough balance or over a limit: refused" }],
      ["S18", "S3", "Above the operator's rules: into the review queue in the portal.", {}],
      ["MER", "S3", "The operator's staff approve, hold or reject with a reason.", {}],
      ["S18", "S19", "Approving a batch is signed with SCA, bound to the number of payouts and the total.", { sca: true }],
      ["#", "Pay"],
      ["S21", "S10", "Card payout through BPC (an original credit transaction) to the player's card.", { api: "IF45 via A09" }],
      ["S21", "EXT", "Or a SEPA transfer, after a Verification of Payee name check.", { ref: "NC3" }],
      ["S11", "S11", "The AML system watches payouts against deposits per player, and many players paid to one card or account.", {}],
      ["S17", "MER", "Webhook player_payout.paid or player_payout.failed; a failed payout returns the money to the balance.", {}]
    ],
    states: [["", "requested", "REQUESTED"], ["REQUESTED", "above the operator's rules", "IN_REVIEW"], ["REQUESTED", "within the rules", "APPROVED"], ["IN_REVIEW", "approved", "APPROVED"], ["IN_REVIEW", "held", "HELD"], ["HELD", "approved", "APPROVED"], ["IN_REVIEW", "rejected", "REJECTED"], ["APPROVED", "sent", "SENT"], ["SENT", "confirmed", "PAID"], ["SENT", "declined or returned", "FAILED"]],
    rules: ["Paid only from the operator's available balance; never negative.", "Player data stays minimal: a player reference and a masked card or IBAN.", "Before go-live: the operator's licence from the National Revenue Agency is checked, and the operator is registered with Visa and Mastercard as a high-risk merchant category."],
    amends: ["WF02b 10: gambling is on the high-risk sector list (MP-Q61): the National Revenue Agency licence check and the Visa and Mastercard high-risk registration before activation.", "Add a player payout workflow to v8.1: funded from the merchant balance, card payouts through A09 or SEPA through NC3, with the operator's own review rules."],
    deps: ["BPC: card payouts (original credit transactions) for gambling winnings through A09.", "OraSYS: payout orders to third parties from a merchant balance through M0391."],
    questions: [
      { id: "MP-Q48", q: "Do our licence and the merchant agreement cover paying players from the operator's acquiring balance, and does that make the balance a payment account?", prop: "Legal to confirm before build. If it does, the operator gets a payment account with its own terms.", owner: "Legal" },
      { id: "MP-Q49", q: "Payouts sent through the API cannot be signed with SCA one by one. Is a payout-only key with an IP allow list and daily limits enough?", prop: "Yes, under the exemption for secure corporate payment processes (RTS Art. 17), if the BNB agrees; batches approved in the portal are signed with SCA.", owner: "Compliance" },
      { id: "MP-Q50", q: "Must payouts go back to the card or account the player deposited from?", prop: "Yes: card payouts only to a card that deposited in the last [180] days; otherwise SEPA to an account in the player's name.", owner: "CRO" }
    ]
  });

  W("MP-37", {
    title: "Money the merchant owes", area: "Money", status: "new",
    source: "WF11 13 (a shortfall becomes a receivable from the merchant and an S4 case); PRD WF11 (the balance is never negative)",
    trigger: "Chargebacks, fees or fines are larger than the merchant's balance and reserve.", object: "Receivable from the merchant (S21), collection case (S4)",
    screens: [], placement: "Balances: an Amount owed card with its history; Messages",
    lanes: ["S21", "S4", "OPS", "S3", "MER", "EXT", "S13", "S17"],
    summary: "When the balance and reserve do not cover what the merchant owes, the merchant sees the amount and why, and pays it by transfer or from the next payouts.",
    steps: [
      ["S21", "S21", "The part not covered by the balance and the reserve is recorded as owed by the merchant.", { ref: "WF11 13" }],
      ["S21", "S4", "Collection case.", { ref: "WF11 13" }],
      ["S4", "S17", "Notice: the amount, what it is for (chargebacks, fees, fines, terminal rent), how to pay, due in [14] days.", { api: "merchant.notify amount_owed" }],
      ["S4", "S3", "Amount owed shown on Balances, with its parts.", {}],
      ["S21", "S21", "Taken from the next payouts first, if the agreement allows it (MP-Q54).", {}],
      ["MER", "EXT", "Or the merchant transfers the rest, with the reference.", {}],
      ["S13", "S4", "Reconciled; the case closes.", {}],
      ["#", "Not paid"],
      ["S17", "MER", "Reminders at [7] and [14] days.", {}],
      ["OPS", "S4", "After [30] days staff decide: use the deposit, restrict the account (MP-26), or start recovery.", {}]
    ],
    states: [["", "shortfall", "OWED"], ["OWED", "part paid or netted", "PART_PAID"], ["OWED", "paid", "PAID"], ["PART_PAID", "paid", "PAID"], ["OWED", "[30] days", "OVERDUE"], ["OVERDUE", "paid", "PAID"], ["OVERDUE", "staff decide", "RECOVERY"]],
    rules: ["The main balance is never negative; what is owed is shown separately.", "Reserve top-ups (MP-17) stay transfer-only."],
    amends: ["WF11 13: describe the receivable: the notice and amount in the portal, netting from future payouts if the agreement allows, transfer, reminders and escalation."],
    questions: [
      { id: "MP-Q54", q: "May we take what a merchant owes from its next payouts, and do we charge late interest?", prop: "Yes to netting, written into the agreement; no late interest in phase 1.", owner: "Legal" }
    ]
  });

  W("MP-40", {
    title: "Apple Pay and Google Pay", area: "Developers", status: "new", segments: ["sdk"],
    source: "v8.1 names Apple Pay and Google Pay only for card issuing (push provisioning, IF03); S10 gateway",
    trigger: "A merchant wants to offer Apple Pay or Google Pay at its checkout.", object: "Wallet set-up per website",
    screens: [], placement: "Developers: a Wallets tab with the Apple Pay and Google Pay status of each website",
    lanes: ["MER", "S3", "S18", "S10", "WAL"],
    summary: "On the hosted page the merchant just switches the wallets on. On its own checkout (JS SDK), Apple Pay needs the merchant's domain verified and Google Pay needs the merchant's Google ID.",
    steps: [
      ["#", "Hosted page"],
      ["MER", "S3", "Switches on Apple Pay and Google Pay for the hosted page. Nothing else to do.", {}],
      ["S18", "S10", "Turned on at BPC through A09.", { api: "IF45 via A09" }],
      ["#", "Own checkout (JS SDK)"],
      ["MER", "S3", "Adds the domain, which must be one of its approved websites (MP-24), and downloads Apple's domain file.", {}],
      ["MER", "MER", "Places the file at /.well-known/apple-developer-merchantid-domain-association on the website.", {}],
      ["S18", "WAL", "The domain is registered and verified with Apple by the payment platform: BPC or Paytinno (MP-Q57).", {}],
      ["MER", "S3", "Google Pay: enters the merchant ID from Google's console; the SDK uses the processor's gateway ID.", {}],
      ["S3", "MER", "Status per website: verified, failed (with the reason), removed. Tested in the sandbox first.", {}]
    ],
    states: [["", "domain added", "ADDED"], ["ADDED", "file found and registered", "VERIFIED"], ["ADDED", "file missing", "FAILED"], ["FAILED", "fixed", "VERIFIED"], ["VERIFIED", "website removed", "REMOVED"]],
    rules: ["Wallet payments are card payments: same fees, refunds and disputes.", "Only approved websites can be added."],
    amends: ["S10 gateway: add Apple Pay and Google Pay for merchant checkouts; v8.1 mentions them only for card issuing."],
    deps: ["BPC: Apple Pay and Google Pay on the hosted page and in the JS SDK, and whether BPC is Apple's payment platform for merchant domains."],
    questions: [
      { id: "MP-Q57", q: "Who registers merchant domains with Apple: BPC as the processor, or Paytinno as a payment platform?", prop: "BPC, if it is already an Apple Pay payment platform; otherwise Paytinno applies to Apple.", owner: "CTO" }
    ]
  });

  W("MP-41", {
    title: "Shop plugins", area: "Developers", status: "new", segments: ["platforms"],
    source: "Not in v8.1; module spec v7.1 (sandbox certification of every merchant integration)",
    trigger: "A merchant with a WooCommerce, OpenCart, CloudCart or similar shop connects it to Paytinno.", object: "Plugin installation",
    screens: [], placement: "Developers: a Plugins tab with downloads, set-up steps and the plugin versions in use",
    lanes: ["MER", "S3", "S18", "SHOP", "S10", "S17"],
    summary: "The merchant installs the plugin, makes a key for it, adds the plugin's webhook address in the portal, tests and goes live. Paytinno tells merchants when a plugin needs a security update.",
    steps: [
      ["MER", "S3", "Chooses the shop platform; downloads the plugin or follows the link to the platform's store.", {}],
      ["MER", "S3", "Creates a test key for the plugin, limited to payments and refunds (MP-20).", { sca: true }],
      ["MER", "SHOP", "Installs the plugin and pastes the key. The plugin shows its webhook address.", {}],
      ["MER", "S3", "Adds that address as a webhook endpoint (MP-21).", { sca: true }],
      ["SHOP", "S10", "Test payments in the sandbox; the go-live checklist ticks itself (MP-10).", {}],
      ["MER", "S3", "Live key after go-live, pasted into the plugin.", {}],
      ["SHOP", "S18", "Every call names the plugin and its version.", { api: "User-Agent: paytinno-woocommerce/1.4.2" }],
      ["S17", "MER", "Notice when a plugin version has a security fix or stops being supported.", {}]
    ],
    states: [["", "installed with a test key", "TEST"], ["TEST", "live key", "LIVE"], ["LIVE", "version no longer supported", "OUTDATED"], ["OUTDATED", "updated", "LIVE"]],
    rules: ["Plugins use the hosted page or the JS SDK; card numbers never reach the shop's server.", "Plugin keys cannot pay out or change settings."],
    amends: ["One-pager S3 item 6 (gateway keys): add restricted keys, payments and refunds only, for plugins."],
    deps: ["BPC: existing plugins for WooCommerce and OpenCart, or an API that a Paytinno plugin can use."],
    questions: [
      { id: "MP-Q58", q: "Who builds and maintains the plugins, and for which platforms first?", prop: "Use BPC's plugins where they exist; otherwise build WooCommerce and OpenCart first, then CloudCart.", owner: "Product" },
      { id: "MP-Q59", q: "Can BPC issue keys limited to payments and refunds?", prop: "Needed for plugins. If BPC cannot, plugins use the hosted page only.", owner: "CTO" }
    ]
  });

  W("MP-34", {
    title: "Activity log", area: "Team", status: "new",
    source: "Not in v8.1; one-pager S3 item 7 (business roles, mandates and approvals)",
    trigger: "Anyone, or any API key, acts for the merchant; an admin wants to see who did what.", object: "Activity event (append-only)",
    screens: [], placement: "Settings: an Activity page; a History link on each payment, payout, key and user",
    lanes: ["MER", "S3", "S18", "S6", "S17"],
    summary: "Every action in the portal and the API is logged with who, what, when and from where. Admin and Finance see all of it; everyone else sees their own.",
    steps: [
      ["S18", "S18", "For every command: person or key, role, merchant, action, object, amount, time, IP address, SCA evidence and approval IDs, result.", { rule: "Written before the answer is returned" }],
      ["S18", "S18", "Stored in an append-only log per merchant (where: MP-Q51). Nobody can change or delete an entry.", {}],
      ["MER", "S3", "Opens Activity: filters by person, action, date or object; exports CSV.", { api: "GET /v1/activity?person&action&from&to" }],
      ["S18", "S6", "Rights: Admin and Finance see everything; everyone else sees their own actions.", {}],
      ["S17", "MER", "Optional alerts to admins on sensitive actions: new admin, key created or rolled, payout account changed, large refund.", {}]
    ],
    states: [],
    rules: ["Covers sign-ins, refunds, captures, links, payouts, keys, webhooks, team and settings changes, exports and statement downloads.", "API actions name the key's label.", "Actions kept [5] years; IP addresses [13] months."],
    amends: ["S18: write an activity event for every portal and API command (who, what, when, from where, SCA evidence and approval IDs), readable by the merchant."],
    questions: [
      { id: "MP-Q51", q: "Where does the merchant activity log live, and for how long?", prop: "An append-only store fed by S18, hash-chained like the admin journal; actions [5] years, IP addresses [13] months.", owner: "CTO" }
    ]
  });

  W("MP-32", {
    title: "Complaints", area: "Business", status: "new",
    source: "Module specs (complaint cases in S4); PSD2 Art. 101 (an answer within 15 business days)",
    trigger: "A merchant or applicant is unhappy with Paytinno's service and says so.", object: "Complaint case (S4)",
    screens: [], placement: "Messages: Make a complaint; the complaint's status and deadline in the conversation",
    lanes: ["MER", "S3", "S18", "S4", "OPS", "S17"],
    summary: "A complaint is not a support question. It gets an ID, a deadline of 15 business days, a handler who was not involved, an answer approved by Compliance, and the ways to escalate.",
    steps: [
      ["#", "Receive"],
      ["MER", "S3", "Makes a complaint: what about (a payment, payout, dispute, fees, onboarding, service), the references, the outcome wanted, documents.", {}],
      ["S3", "S18", "Sends it.", { api: "POST /v1/complaints {category, refs[], text, wantedOutcome, attachments[docRef]}" }],
      ["S18", "S4", "Complaint case with an ID, the date received and the deadline: 15 business days.", { rule: "PSD2 Art. 101" }],
      ["S4", "S17", "Acknowledgement to the merchant: ID, deadline, who handles it.", {}],
      ["OPS", "S4", "Staff can also turn a support message into a complaint when it expresses dissatisfaction (MP-25); the clock starts when that message arrived.", {}],
      ["#", "Handle"],
      ["OPS", "S4", "A handler who was not involved investigates and asks for information in the conversation if needed. The clock does not stop.", {}],
      ["S4", "S3", "If 15 business days are not enough: a holding reply with the reasons and a final date, no later than 35 business days.", { rule: "Exceptional cases only" }],
      ["OPS", "S4", "Final answer approved by Compliance (four eyes).", {}],
      ["S4", "S3", "Final answer in the portal and an email notice, with the ways to escalate if the merchant disagrees.", {}],
      ["MER", "S3", "Accepts, or replies that it disagrees; the case can be reopened.", {}],
      ["S4", "S4", "Complaints register: category, time to answer, outcome, root cause; reviewed every [quarter].", {}]
    ],
    states: [["", "received", "RECEIVED"], ["RECEIVED", "handler assigned", "IN_PROGRESS"], ["IN_PROGRESS", "15 business days not enough", "HOLDING_REPLY"], ["IN_PROGRESS", "final answer", "ANSWERED"], ["HOLDING_REPLY", "final answer", "ANSWERED"], ["ANSWERED", "merchant disagrees", "REOPENED"], ["REOPENED", "final answer", "ANSWERED"], ["ANSWERED", "[30] days", "CLOSED"]],
    rules: ["Free of charge, in Bulgarian or English.", "Kept [5] years.", "A complaint never moves a dispute deadline or an RFI due date."],
    amends: ["Add a merchant complaint workflow to v8.1: S4 complaint cases with a 15 business day timer, a holding reply up to 35, Compliance approval and a complaints register (PSD2 Art. 101)."],
    questions: [
      { id: "MP-Q46", q: "Who handles complaints and approves the answers?", prop: "Compliance owns the process and approves every final answer; the handler is never the person or team complained about.", owner: "Compliance" },
      { id: "MP-Q47", q: "Which escalation routes do we give merchants: the BNB, an out-of-court body, and later the UK ombudsman?", prop: "The BNB always; the conciliation committee for payment disputes where it applies to the merchant; the UK Financial Ombudsman only once there are UK merchants.", owner: "Legal" }
    ]
  });

  W("MP-36", {
    title: "Incident and maintenance notices", area: "Business", status: "new",
    source: "DORA Art. 19(3) (tell clients about major ICT incidents that affect their financial interests); v8.1 incident handling",
    trigger: "Something merchants feel breaks (payments, refunds, payouts, portal, API, webhooks), or maintenance is planned.", object: "Incident or maintenance notice",
    screens: [], placement: "A banner on every portal page; a status page outside the platform; Messages",
    lanes: ["OPS", "S4", "S17", "S3", "MER"],
    summary: "Merchants hear about problems from us first: a banner, a status page and notices, and afterwards what happened and what we changed.",
    steps: [
      ["#", "Incident"],
      ["OPS", "S4", "Incident declared and classified: is it a major ICT incident under DORA, and which services and merchants does it touch?", {}],
      ["S4", "S3", "Banner on every portal page for affected merchants: what does not work, and since when.", {}],
      ["OPS", "OPS", "Status page, hosted outside the main platform, updated every [60] min until resolved.", {}],
      ["S4", "S17", "Notice to affected merchants without undue delay when their money is affected (for example payouts delayed), with what we are doing about it.", { rule: "DORA Art. 19(3)" }],
      ["S4", "S17", "Resolved: final notice with the impact (which payments or payouts) and what we did; a written report for large merchants on request.", {}],
      ["#", "Planned maintenance"],
      ["S4", "S17", "Notice [5] business days before, at a quiet time, and a banner on the day.", {}],
      ["MER", "S3", "The merchant chooses who gets incident emails; anyone can follow the status page.", {}]
    ],
    states: [["", "declared", "INVESTIGATING"], ["INVESTIGATING", "cause found", "IDENTIFIED"], ["IDENTIFIED", "fix in place", "MONITORING"], ["MONITORING", "stable", "RESOLVED"], ["", "announced", "PLANNED"], ["PLANNED", "window starts", "IN_MAINTENANCE"], ["IN_MAINTENANCE", "done", "COMPLETED"]],
    rules: ["Notices never give details that would help an attacker.", "Texts approved by the incident manager; when DORA applies, also by Compliance.", "The status page must work when the platform does not."],
    amends: ["v8.1 incident handling: add notices to merchants for major ICT incidents (DORA Art. 19(3)), a status page outside the platform, portal banners and planned maintenance notices."],
    questions: [
      { id: "MP-Q53", q: "Is the status page public or only for signed-in merchants, and who approves the texts?", prop: "Public, without details on causes; the incident manager approves, and Compliance too when DORA applies.", owner: "COO" }
    ]
  });

  W("MP-38", {
    title: "Ask for higher limits or new services", area: "Business", status: "new",
    source: "WF02b 10 to 12 (the onboarding review sets limits, MCC and channels); not as a merchant request in v8.1",
    trigger: "A merchant needs a higher limit, a new channel (links, terminals, manual capture, saved cards), new customer countries, or a lower reserve.", object: "Change request (S4 review case)",
    screens: [], placement: "Business: a Limits and services tab with current limits, usage and Ask for a change",
    lanes: ["MER", "S3", "S18", "S4", "OPS", "S6", "S10", "S17"],
    summary: "The merchant sees its limits and how much it has used, and asks for changes. Staff review them like the onboarding review; new terms are accepted like the first offer.",
    steps: [
      ["S4", "S3", "Current limits and usage: monthly volume, largest payment, channels, countries, reserve.", { api: "GET /v1/merchant/limits" }],
      ["S4", "S17", "Warning at [80]% of the monthly limit.", {}],
      ["MER", "S3", "Asks for a change, with a reason and documents (forecast, new contracts, accounts).", {}],
      ["S3", "S18", "Sends it.", { api: "POST /v1/merchant/requests {type, requested, reason, docRefs}" }],
      ["S18", "S4", "Review case; staff may ask for more (MP-07). A credit trigger (MP-Q60) adds a credit review.", { sla: "[3] business days" }],
      ["OPS", "S4", "Decision with the same four-eyes rules as onboarding.", { ref: "WF02b 11" }],
      ["S4", "S10", "Approved: new limits or channels at BPC through A09.", { api: "IF45 via A09" }],
      ["S4", "S6", "Merchant profile updated. If fees or the reserve change, a new offer to accept with SCA, as in MP-08.", {}],
      ["S4", "S17", "Decision notice. A refusal says only that it is not possible now.", {}]
    ],
    states: [["", "asked", "REQUESTED"], ["REQUESTED", "staff start", "IN_REVIEW"], ["IN_REVIEW", "approved", "APPROVED"], ["IN_REVIEW", "new terms needed", "OFFER_SENT"], ["OFFER_SENT", "accepted", "APPROVED"], ["IN_REVIEW", "refused", "DECLINED"]],
    rules: ["Refusals use the same neutral words as onboarding (no tipping off)."],
    amends: ["WF02b onboarding review: add a new review on the merchant's request (limits, channels, countries, reserve) with the same four-eyes rules, and new terms accepted like the offer (MP-08)."],
    questions: [
      { id: "MP-Q55", q: "Who decides these requests, and how fast?", prop: "The onboarding review team, in [3] business days, with the credit approver when a credit trigger is met (MP-Q60); four eyes above the same thresholds as onboarding.", owner: "CRO" }
    ]
  });

  /* portal screens a workflow runs on (ids are the prototype's routes: merchant-portal, #/<id>) */
  const SCREENS = {
    register: "Registration", application: "Application", home: "Home", payments: "Payments", payment: "One payment", refunds: "Refunds",
    disputes: "Disputes", dispute: "One dispute", balances: "Balances", payouts: "Payouts", "payout-account": "Payout account",
    statements: "Statements and fees", business: "Business", messages: "Messages", settings: "Settings", developers: "Developers",
    team: "Team", approvals: "Approvals", security: "Security"
  };
  /* merchant types: a workflow with segments applies only to those merchants; without, to every merchant */
  const SEGMENTS = {
    links: ["Selling without a checkout", "Sales by phone, chat, social media, invoice or at events"],
    pos: ["Shops with card terminals", "Card-present sales in shops, cafés and restaurants"],
    later: ["Charging later", "Shops that charge on dispatch, hotels, car rental"],
    gambling: ["Gambling operators", "MCC 7995, licensed by the National Revenue Agency"],
    recurring: ["Subscriptions and saved cards", "Customers who pay again without typing their card"],
    sdk: ["Own checkout", "Merchants with the JS SDK on their own website"],
    platforms: ["Shop platforms", "WooCommerce, OpenCart, CloudCart and similar"]
  };
  const SCOPE = "Whether each merchant type is in year-one scope is still to decide.";
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
    "Chargeback ratio: v8.1 opens a review case (it says underwriting) above about 1%; Visa VAMP and Mastercard ECP thresholds in the admin are different and still placeholders.",
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
  const forSegment = k => list.filter(w => (w.segments || []).includes(k));
  return { list, AREAS, STATUS, SCREENS, SEGMENTS, SCOPE, SOURCES, CONTRADICTIONS, VERSION, byId, forScreen, forSegment, questions };
})();
