/* Turns src/workflows.js and src/model.js into the Markdown under docs/.
   Runs in a browser (tools/build.html, driven by tools/build-docs.ps1). Diagrams are Mermaid, which GitHub draws. */
window.buildDocs = function () {
  "use strict";
  const files = {};
  const C = window.CONFIG, W = window.WF;
  const cell = s => String(s == null ? "" : s).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
  const slug = w => w.id + "-" + w.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const file = w => "workflows/" + slug(w) + ".md";
  const lane = l => C.LANES[l][0] + " (" + C.LANES[l][1] + ")";
  const eur = n => "€" + Number(n).toLocaleString("en-GB");
  const status = s => W.STATUS[s][1];
  const steps = w => w.steps.filter(s => s[0] !== "#");
  const generated = "<!-- Generated from src/ by tools/build-docs.ps1. Edit src/workflows.js or src/model.js, not this file. -->\n\n";

  /* Mermaid text: no characters that end a statement, wrapped for width */
  function mtext(s, width) {
    const t = String(s).replace(/;/g, ",").replace(/#/g, "no. ").replace(/</g, "‹").replace(/>/g, "›").replace(/"/g, "'");
    const words = t.split(" "); const lines = [""];
    for (const x of words) { if ((lines[lines.length - 1] + " " + x).trim().length > (width || 46)) lines.push(x); else lines[lines.length - 1] = (lines[lines.length - 1] + " " + x).trim(); }
    return lines.join("<br/>");
  }
  function lanesOf(w) {
    const ids = w.lanes.slice();
    w.steps.forEach(s => { if (s[0] !== "#") [s[0], s[1]].forEach(l => { if (!ids.includes(l)) ids.push(l); }); });
    return ids;
  }
  function sequence(w) {
    const L = lanesOf(w); const out = ["```mermaid", "sequenceDiagram", "  autonumber"];
    L.forEach(l => out.push("  participant " + l + " as " + mtext(C.LANES[l][0] + " " + C.LANES[l][1], 20)));
    for (const s of w.steps) {
      if (s[0] === "#") { out.push("  Note over " + L[0] + "," + L[L.length - 1] + ": " + mtext(s[1], 80)); continue; }
      const o = s[3] || {};
      out.push("  " + s[0] + "->>" + s[1] + ": " + mtext((o.sca && !/^SCA/.test(s[2]) ? "SCA: " : "") + s[2]));
    }
    out.push("```"); return out.join("\n");
  }
  function states(w) {
    if (!w.states.length) return "";
    const id = x => x ? "s_" + x.replace(/[^A-Za-z0-9]+/g, "_") : "[*]";
    const names = new Set(); w.states.forEach(s => { if (s[0]) names.add(s[0]); names.add(s[2]); });
    const out = ["```mermaid", "stateDiagram-v2", "  direction LR"];
    names.forEach(n => out.push("  state \"" + n.replace(/"/g, "'") + "\" as " + id(n)));
    w.states.forEach(s => out.push("  " + id(s[0]) + " --> " + id(s[2]) + " : " + s[1].replace(/[:;]/g, ",")));
    out.push("```");
    return out.join("\n") + "\n\n| From | When | To |\n|---|---|---|\n" + w.states.map(s => "| " + cell(s[0] || "start") + " | " + cell(s[1]) + " | " + cell(s[2]) + " |").join("\n");
  }
  function qblock(q, link) {
    return "### " + q.id + "\n\n" + q.q + "\n\n" + (q.decided ? "**Decision:** " : "**Proposed:** ") + q.prop + "\n\n" + (q.decided ? "Decided, awaiting sign-off by: " : "Owner: ") + q.owner + (link ? ". Workflow: [" + q.wf + " " + q.wfTitle + "](" + link + ")" : "") + "\n";
  }
  const forText = w => (w.segments || []).length ? "Only " + w.segments.map(k => W.SEGMENTS[k][0] + " (" + W.SEGMENTS[k][1] + ")").join(", ") + ". " + W.SCOPE : "Every merchant";
  const bullets = (title, items, note) => items && items.length ? "## " + title + "\n\n" + (note ? note + "\n\n" : "") + items.map(t => "- " + t).join("\n") + "\n\n" : "";

  /* ---------- one file per workflow ---------- */
  W.list.forEach((w, i) => {
    const prev = W.list[i - 1], next = W.list[i + 1];
    let n = 0;
    const rows = w.steps.map(s => {
      if (s[0] === "#") return "| | | | **" + cell(s[1]) + "** | | |";
      n++; const o = s[3] || {}; const notes = [];
      if (o.ref) notes.push(o.ref); if (o.sla) notes.push("Time: " + o.sla); if (o.sca) notes.push("**SCA**"); if (o.rule) notes.push("Rule: " + o.rule);
      if (o.fail) notes.push("**If it fails:** " + o.fail); if (o.gap) notes.push("**Open gap:** " + o.gap);
      if (o.dec) notes.push("**Decided:** [" + o.dec + "](../open-questions.md#" + o.dec.toLowerCase() + ")"); if (o.added) notes.push("Added to v8.1");
      return "| " + n + " | " + cell(lane(s[0])) + " | " + cell(lane(s[1])) + " | " + cell(s[2]) + " | " + (o.api ? "`" + cell(o.api) + "`" : "") + " | " + cell(notes.join("<br>")) + " |";
    });
    files["docs/" + file(w)] = generated +
      "# " + w.id + " " + w.title + "\n\n" +
      "[All workflows](../README.md)" + (prev ? " | Previous: [" + prev.id + " " + prev.title + "](" + slug(prev) + ".md)" : "") + (next ? " | Next: [" + next.id + " " + next.title + "](" + slug(next) + ".md)" : "") + "\n\n" +
      w.summary + "\n\n" +
      "| | |\n|---|---|\n| Status | " + status(w.status) + " |\n| For | " + cell(forText(w)) + " |\n| Area | " + w.area + " |\n| Source | " + cell(w.source) + " |\n| Starts when | " + cell(w.trigger) + " |\n| Object | " + cell(w.object) + " |\n| Systems | " + cell(lanesOf(w).map(lane).join(", ")) + " |\n| Portal screens | " + cell((w.screens || []).length ? w.screens.map(s => W.SCREENS[s] || s).join(", ") : "Not in the prototype yet." + (w.placement ? " Would sit on: " + w.placement : "")) + " |\n\n" +
      "## Sequence\n\n" + sequence(w) + "\n\n" +
      "## Steps\n\n| # | From | To | Step | Call | Notes |\n|---|---|---|---|---|---|\n" + rows.join("\n") + "\n\n" +
      "## States\n\n" + (states(w) || "No states of its own.") + "\n\n" +
      "## Rules\n\n" + (w.rules.length ? w.rules.map(r => "- " + r).join("\n") : "None.") + "\n\n" +
      bullets("Changes v8.1 needs", w.amends, "For the CTO's next version of the architecture (v8.2).") +
      bullets("Depends on", w.deps, "Confirmations needed from outside Paytinno. Not design gaps.") +
      "## Questions\n\n" + (w.questions.length ? w.questions.map(q => qblock(q)).join("\n") : "None.\n");
  });

  /* ---------- index ---------- */
  const qs = W.questions(); const qOpen = qs.filter(q => !q.decided), qDone = qs.filter(q => q.decided);
  const count = s => W.list.filter(w => w.status === s).length;
  const MEANING = { v81: "As the CTO's architecture v8.1 writes it", part: "In v8.1, with gaps still open", amended: "In v8.1; every gap closed by a decision. The changes v8.1 needs are listed", new: "Not in v8.1. Needs the CTO team's agreement" };
  files["docs/README.md"] = generated +
    "# Merchant portal workflows\n\n" +
    "Version " + W.VERSION + ". The intended workflows behind the Paytinno merchant portal (S3), for review with the CTO's team before build.\n\n" +
    "| Status | Meaning | Workflows |\n|---|---|---|\n" + Object.keys(W.STATUS).filter(k => count(k)).map(k => "| " + status(k) + " | " + MEANING[k] + " | " + count(k) + " |").join("\n") + "\n\n" +
    "Also: [Questions](open-questions.md) (" + qOpen.length + " open, " + qDone.length + " decided and awaiting sign-off), [Changes to v8.1](changes-to-v8.1.md), [Merchant types](merchant-types.md), [Roles and rights](roles-and-rights.md), [Systems](systems.md), [Sources and contradictions](sources.md).\n\n" +
    W.AREAS.map(a => { const ws = W.list.filter(w => w.area === a); return ws.length ? "## " + a + "\n\n| ID | Workflow | Status | Source | Steps | Questions |\n|---|---|---|---|---|---|\n" + ws.map(w => "| " + w.id + " | [" + cell(w.title) + "](" + file(w) + ")" + ((w.segments || []).length ? " *(only: " + w.segments.map(k => W.SEGMENTS[k][0]).join(", ") + ")*" : "") + "<br>" + cell(w.summary) + " | " + status(w.status) + " | " + cell(w.source) + " | " + steps(w).length + " | " + w.questions.length + " |").join("\n") + "\n" : ""; }).join("\n");

  /* ---------- open questions ---------- */
  const qtable = list => "| ID | Question | Owner | Workflow |\n|---|---|---|---|\n" + list.map(q => { const w = W.byId(q.wf); return "| [" + q.id + "](#" + q.id.toLowerCase() + ") | " + cell(q.q) + " | " + q.owner + " | [" + q.wf + "](" + file(w) + ") |"; }).join("\n") + "\n\n";
  const byOwner = list => "By owner: " + [...new Set(list.map(q => q.owner))].sort().map(o => o + " " + list.filter(q => q.owner === o).length).join(", ") + ".\n\n";
  files["docs/open-questions.md"] = generated +
    "# Questions\n\n[All workflows](README.md)\n\n" + qOpen.length + " open, " + qDone.length + " decided and awaiting sign-off. CTO question numbers refer to the v8.1 question list.\n\n" +
    "## Open\n\nDecisions the portal still needs. Each has a proposed answer to agree or change.\n\n" + qtable(qOpen) + byOwner(qOpen) +
    "## Decided, awaiting sign-off\n\nAnswers adopted as the design to close gaps in v8.1. Each owner signs off or changes it.\n\n" + qtable(qDone) + byOwner(qDone) +
    "## Details\n\n" + qs.map(q => qblock(q, file(W.byId(q.wf)))).join("\n");

  /* ---------- merchant types ---------- */
  files["docs/merchant-types.md"] = generated +
    "# Merchant types\n\n[All workflows](README.md)\n\nMost workflows apply to every merchant. Some are only needed for certain kinds of merchant. " + W.SCOPE + " A type left out of scope drops its workflows from the build.\n\n" +
    "| Merchant type | Who | Workflows only for them | Year-one scope |\n|---|---|---|---|\n" +
    Object.keys(W.SEGMENTS).map(k => "| " + W.SEGMENTS[k][0] + " | " + cell(W.SEGMENTS[k][1]) + " | " + W.forSegment(k).map(w => "[" + w.id + " " + cell(w.title) + "](" + file(w) + ")").join("<br>") + " | To decide |").join("\n") +
    "\n\n" + W.list.filter(w => !(w.segments || []).length).length + " of " + W.list.length + " workflows apply to every merchant.\n";

  /* ---------- changes to v8.1 ---------- */
  const deps = []; W.list.forEach(w => (w.deps || []).forEach(d => deps.push("- " + d + " ([" + w.id + "](" + file(w) + "))")));
  files["docs/changes-to-v8.1.md"] = generated +
    "# Changes to v8.1\n\n[All workflows](README.md)\n\nWhat the CTO's architecture needs to change (v8.2) so it matches the decided workflows. Each line names the v8.1 workflow or step and the decision behind it.\n\n" +
    W.list.filter(w => (w.amends || []).length).map(w => "## [" + w.id + " " + w.title + "](" + file(w) + ")\n\n" + w.amends.map(t => "- " + t).join("\n") + "\n").join("\n") +
    (deps.length ? "\n## Depends on\n\nConfirmations needed from outside Paytinno.\n\n" + deps.join("\n") + "\n" : "");

  /* ---------- roles and rights ---------- */
  const R = Object.keys(C.ROLES);
  const rc = (p, r) => { if (!p.roles.includes(r)) return "No"; const t = ["Yes"]; if (p.sca) t.push("SCA"); if (p.second) t.push(p.second.from ? "2nd from " + eur(p.second.from) : "2nd"); return t.join(", "); };
  files["docs/roles-and-rights.md"] = generated +
    "# Roles and rights\n\n[All workflows](README.md)\n\nProposed (MP-Q01). v8.1 names only ONBOARDING_APPLICANT and MERCHANT_ADMIN. Roles live in S6; S18 checks them on every call. The screens hide what a role cannot do, but S18 is the control.\n\n" +
    "## Roles\n\n| Role | Code | For |\n|---|---|---|\n" + R.map(r => "| " + C.ROLES[r].label + " | `" + C.ROLES[r].code + "` | " + cell(C.ROLES[r].desc) + " |").join("\n") + "\n\n" +
    "## Who can do what\n\nSCA: the person signs with a passkey (dynamic linking). 2nd: a second person approves (MP-23), always or from the amount shown.\n\n" +
    "| Action | " + R.map(r => C.ROLES[r].label).join(" | ") + " | Source |\n|---|" + R.map(() => "---").join("|") + "|---|\n" +
    Object.entries(C.PERMS).map(([k, p]) => "| " + cell(p.label) + " `" + k + "` | " + R.map(r => rc(p, r)).join(" | ") + " | " + cell(p.src || "") + " |").join("\n") + "\n\n" +
    "## Default limits per person\n\n| Role | Refund | Payout |\n|---|---|---|\n" + Object.keys(C.MANDATE).map(r => "| " + C.ROLES[r].label + " | " + eur(C.MANDATE[r].refund) + " | " + (C.MANDATE[r].payout ? eur(C.MANDATE[r].payout) : "None") + " |").join("\n") +
    "\n\nAn admin can lower a person's limit. Paytinno sets the business's maximum in the onboarding review (MP-Q05).\n\n" +
    "## Timers and limits\n\n| Item | Value |\n|---|---|\n" + [["Session", C.LIMITS.sessionHours + " h, idle " + C.LIMITS.idleMinutes + " min"], ["Refresh token", C.LIMITS.refreshDays + " days"], ["SCA challenge", C.LIMITS.scaMinutes + " min"], ["Verification codes", C.LIMITS.codeMinutes + " min, 5 attempts"], ["Payout cut-off", C.LIMITS.payoutCutoff], ["Minimum payout", C.LIMITS.minPayout], ["Reserve", C.LIMITS.reserveDays + " days"], ["KYB review", C.LIMITS.kybHigh + " months high risk, " + C.LIMITS.kybStd + " others"], ["Old key after roll", C.LIMITS.keyOverlapHours + " h"], ["Invitation", C.LIMITS.inviteDays + " days"]].map(([a, b]) => "| " + a + " | " + b + " |").join("\n") +
    "\n\nValues in [brackets] are proposals.\n\n" +
    "## Application status texts\n\nThe portal shows its own fixed text for each state, never free text from staff (MP-Q09, no tipping off).\n\n| State | Label | Text |\n|---|---|---|\n" + C.APP_STATES.map(s => "| `" + s.k + "` | " + s.label + " | " + cell(s.text) + " |").join("\n") + "\n";

  /* ---------- systems ---------- */
  files["docs/systems.md"] = generated + "# Systems in the diagrams\n\n[All workflows](README.md)\n\nNames from the CTO's architecture v8.1. A01 and A05 are client libraries in S18 and S6; A09 is the BPC API library, which never writes the ledger.\n\n| Code | System | v8.1 module |\n|---|---|---|\n" +
    Object.entries(C.LANES).map(([k, v]) => "| `" + k + "` | " + v[0] + " | " + v[1] + " |").join("\n") + "\n\n| System | Workflows |\n|---|---|\n" +
    Object.keys(C.LANES).map(k => "| " + C.LANES[k][0] + " | " + W.list.filter(w => lanesOf(w).includes(k)).map(w => "[" + w.id + "](" + file(w) + ")").join(", ") + " |").join("\n") + "\n";

  /* ---------- sources ---------- */
  files["docs/sources.md"] = generated + "# Sources and contradictions\n\n[All workflows](README.md)\n\n## Sources\n\n" + W.SOURCES.map(s => "- " + s).join("\n") + "\n\n## Contradictions found in the sources\n\n" + W.CONTRADICTIONS.map(s => "- " + s).join("\n") + "\n";

  return files;
};
