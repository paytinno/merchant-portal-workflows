<!-- Generated from src/ by tools/build-docs.ps1. Edit src/workflows.js or src/model.js, not this file. -->

# Sources and contradictions

[All workflows](README.md)

## Sources

- CTO architecture v8.1, 13 Oct 2026: one-page modules and workflows; low-level workflows WF02a, WF02b, WF10, WF11
- Module specs (file still v7.1, 2 Oct 2026; its S3 page describes the old bought portal)
- PRD WF11 Acquiring v6, V. Tulev, 15 Oct 2026
- Admin and merchant portal message spec v0.1, 15 Oct 2026 (paytinno-admin/docs/portal-connector.md)
- Merchant portal design boards, 14 Oct 2026 (screens only, no workflows)

## Contradictions found in the sources

- The module spec file is v7.1 and still describes S3 as a portal bought from BPC. v8.1 has the portal built in house; there is no v8.1 S3 page.
- WF02a step 26 points to the wrong steps (MP-Q08).
- WF02b step 17 says the portal talks only to S18; WF02a has the portal talk to S19 directly through the web SDK (IF05 rows). Both can be true: S19's SDK for the passkey, S18 for everything else. Say so in v8.2.
- PRD WF11 and v8.1 WF11 disagree on dispute states, the channel to the schemes and the ledger accounts (MP-Q12). The PRD also uses component names S21a, S21b, S21c that v7.1 dropped.
- Chargeback ratio: v8.1 opens an underwriting case above about 1%; Visa VAMP and Mastercard ECP thresholds in the admin are different and still placeholders.
- Webhooks: payment events from BPC, dispute events from S17, with different signatures and retries (MP-Q34).
- The admin's access.revoke stops every action; WF11 needs dispute answers to keep working (MP-Q38).
