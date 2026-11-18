<!-- Generated from src/ by tools/build-docs.ps1. Edit src/workflows.js or src/model.js, not this file. -->

# Sources and contradictions

[All workflows](README.md)

## Sources

- CTO architecture v8.7 (v8.7.1 for the core hosting), read 18 Nov 2026: S19 built in house (ADR-0025), portal sign-in on S19's pages (ADR-0026), sessions held in S18 (ADR-0009), S18 to S19 through A10 (ADR-0010)
- Low-level workflows v8.3, read 18 Nov 2026: WF02a at v8.7, WF02b at v8.5, WF02c (SCA in the portal, a skeleton), WF10, WF11 and WF21 unchanged since v8.1
- Module specs v8.7.1, read 18 Nov 2026: S3 page (own SPA on the BPC API, launch scope, questions 4, 9, 21 to 24, 29, 34 to 36, 38; risks R07 to R11) and S6 page (draft and frozen version, v8.5)
- Our first version was written against v8.1 (13 Oct 2026); the move to v8.7 is in the git history
- PRD WF11 Acquiring v6, V. Tulev, 15 Oct 2026
- Admin and merchant portal message spec v0.1, 15 Oct 2026 (paytinno-admin/docs/portal-connector.md)
- Merchant portal design boards, 14 Oct 2026 (screens only, no workflows)

## Contradictions found in the sources

- WF02c step 5 hands a signed refund to WF11 step 16, but leaves payout and payout account change in WF10 "to be specified"; WF02c's states and failures are still to be written (MP-Q08).
- The low-level workflows are v8.3 (WF02a v8.7, WF02b v8.5) while the architecture and module specs are v8.7 and v8.7.1. WF02b still has the v8.1 states and names only gambling for sector checks.
- The S3 page puts dispute answers, API keys and payout account changes after launch, worked by Paytinno staff in S4 until the BPC API covers them (questions 21, 29, 33). WF11 and WF02c still describe the merchant doing them in the portal.
- PRD WF11 and v8.7 WF11 disagree on dispute states, the channel to the schemes and the ledger accounts (MP-Q12). The PRD also uses component names S21a, S21b, S21c that v7.1 dropped.
- Chargeback ratio: v8.7 opens a review case (it says underwriting) above about 1%; Visa VAMP and Mastercard ECP thresholds in the admin are different and still placeholders.
- Webhooks: payment events from BPC, dispute events from S17, with different signatures and retries (MP-Q34).
- The admin's access.revoke stops every action; WF11 needs dispute answers to keep working (MP-Q38).
