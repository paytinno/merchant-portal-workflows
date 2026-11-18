# Merchant portal workflows

The intended workflows behind the Paytinno merchant portal (module S3 in the CTO's architecture v8.1). They are written for review
with the CTO's team **before** anything is built.

**Start here: [docs/README.md](docs/README.md).** It lists all 41 workflows, the questions, the changes v8.1 needs,
the merchant types, the roles and rights, and the sources.

| Status | Meaning |
|---|---|
| In v8.1 | As the CTO's architecture v8.1 writes it |
| v8.1 with gaps | In v8.1, with open questions still to answer |
| v8.1, gaps closed | In v8.1; every gap closed by a decision that awaits its owner's sign-off |
| Proposed | Not in v8.1. Needs the CTO team's agreement |

Some workflows are only for certain merchant types, for example shops with card terminals or gambling operators. Whether
each type is in year-one scope is still to decide; see [docs/merchant-types.md](docs/merchant-types.md).

Every workflow has:
* a sequence diagram
* a step table: who calls whom, the API call, time limits, SCA, what happens when it fails, the decision behind a step
* states and rules
* the changes v8.1 needs, and what it depends on outside Paytinno
* questions, each with a proposed answer (or the decision) and an owner

## What is in this repository

| Path | What it is |
|---|---|
| `src/workflows.js` | **The source of truth.** All workflows, steps, states, rules, open questions, sources and contradictions |
| `src/model.js` | Roles, permissions, SCA and second-person rules, limits, timers, application status texts, the systems (lanes) |
| `docs/` | Markdown generated from `src/`, readable on GitHub (Mermaid diagrams). Do not edit by hand |
| `dist/merchant-portal-workflows.html` | **The whole viewer in one file** (about 160 KB) for sharing: it opens offline and can be emailed, put on Drive or added to a Claude project. Generated; do not edit |
| `index.html`, `viewer/` | A viewer with lane diagrams, filters and a full spec to print or save as PDF |
| `tools/` | The docs generator (`build-docs.ps1`, `md.js`, `build.html`) |

## Changing a workflow

1. Edit `src/workflows.js` (or `src/model.js`). The format is explained at the top of each file.
2. Regenerate the docs:
   ```
   powershell -NoProfile -ExecutionPolicy Bypass -File tools\build-docs.ps1
   ```
   The generator runs in headless Microsoft Edge, so it needs no Node or Python. It also rebuilds `dist/merchant-portal-workflows.html`.
3. Commit `src/`, `docs/` and `dist/` together.

Reviewers who only read can comment on the Markdown in `docs/`. Changes go into `src/`.

## Viewer

```
powershell -NoProfile -ExecutionPolicy Bypass -File serve-local.ps1 -Port 8772
```

Then open http://localhost:8772. In Claude Desktop the preview is called `merchant-portal-workflows`. You can also open `index.html`
directly in a browser.

## Relation to the portal prototype

The clickable prototype lives in its own folder, `../merchant-portal` (port 8771), on the Paytinno shared drive under
`Claude/Sve Code`. It is not on GitHub. It reads `src/model.js` and `src/workflows.js`
from this repository: its server maps `spec/` to `src/`, so it expects this repository next to it.
* Its roles and permissions come from `src/model.js`.
* Its "Behind this screen" panel comes from `src/workflows.js`.

As a result, the prototype and this design cannot drift apart. In the other direction, each workflow's "Portal screens" links
open the matching screen in the prototype.

## Sources

* CTO architecture v8.1 (13 Oct 2026): one-page modules, and low-level workflows WF02a, WF02b, WF10 and WF11.
* Module specs. The file is still v7.1, and its S3 page describes the old bought portal.
* PRD WF11 Acquiring v6 (V. Tulev, 15 Oct 2026).
* Admin and portal message spec v0.1 (`paytinno-admin/docs/portal-connector.md`).

See [docs/sources.md](docs/sources.md) for where these sources disagree.
