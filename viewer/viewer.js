/* Viewer for the workflow catalogue: list, one workflow with its lane diagram, open questions, roles and rights,
   sources, and a full spec to print. Reads src/workflows.js (WF) and src/model.js (CONFIG). No build step. */
(function () {
  "use strict";
  const PORTAL = "http://localhost:8771/#/";   // the merchant-portal prototype, for "Portal screens" links
  const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const eur = n => new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
  const st = (cls, t) => '<span class="st ' + cls + '">' + esc(t) + "</span>";
  const wfb = s => { const x = WF.STATUS[s] || ["", s]; return '<span class="wfb ' + x[0] + '">' + esc(x[1]) + "</span>"; };
  const strip = items => '<div class="strip">' + items.map(([l, v, cls]) => '<div><div class="l">' + esc(l) + '</div><div class="v ' + (cls || "") + '">' + v + "</div></div>").join("") + "</div>";
  function table(cols, rows, opts) {
    opts = opts || {};
    if (!rows.length) return '<p class="empty">' + esc(opts.empty || "Nothing here.") + "</p>";
    return '<div class="tw"><table' + (opts.cls ? ' class="' + opts.cls + '"' : "") + "><thead><tr>" + cols.map(c => "<th" + (c.r ? ' class="r"' : "") + ">" + esc(c.h) + "</th>").join("") + "</tr></thead><tbody>" +
      rows.map(r => "<tr" + (opts.href ? ' class="click" data-href="' + esc(opts.href(r)) + '"' : "") + ">" + cols.map(c => "<td" + (c.r ? ' class="r"' : "") + ">" + c.v(r) + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>";
  }
  const ICON = {
    workflows: '<rect x="3" y="4" width="6" height="5" rx="1"/><rect x="15" y="4" width="6" height="5" rx="1"/><rect x="9" y="15" width="6" height="5" rx="1"/><path d="M6 9v3h12V9M12 12v3"/>',
    questions: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01"/>',
    roles: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 4v16"/>',
    sources: '<path d="M4 5h7v15H4zM13 5h7v15h-7z"/>',
    changes: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
    spec: '<path d="M5 4h11l3 3v13H5z"/><path d="M9 10h6M9 14h6"/>',
    portal: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>'
  };
  const icon = k => '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICON[k] || "") + "</svg>";

  function lanesOf(w) {
    const ids = w.lanes.slice();
    w.steps.forEach(s => { if (s[0] !== "#") [s[0], s[1]].forEach(l => { if (!ids.includes(l)) ids.push(l); }); });
    return ids;
  }

  /* lane diagram: one column per system, one row per step, an arrow from sender to receiver */
  function diagram(w) {
    const L = lanesOf(w); const cols = "grid-template-columns:repeat(" + L.length + ",minmax(62px,78px)) minmax(320px,1fr)";
    let n = 0;
    const head = '<div class="row hd" style="' + cols + '">' + L.map(l => "<div>" + esc(CONFIG.LANES[l][0]) + "<small>" + esc(CONFIG.LANES[l][1]) + "</small></div>").join("") + '<div class="txt">Step</div></div>';
    const rows = w.steps.map(s => {
      if (s[0] === "#") return '<div class="row grp" style="' + cols + '">' + L.map(() => '<div class="c"></div>').join("") + '<div class="t">' + esc(s[1]) + "</div></div>";
      n++; const [from, to, text, o] = [s[0], s[1], s[2], s[3] || {}];
      const i = L.indexOf(from), j = L.indexOf(to); const lo = Math.min(i, j), hi = Math.max(i, j);
      const cells = L.map((_, k) => {
        if (i === j) return '<div class="c">' + (k === i ? '<span class="nr">' + n + "</span>" : "") + "</div>";
        let cls = "c"; let inner = "";
        if (k >= lo && k <= hi) cls += " ln" + (k === lo ? " from" : "") + (k === hi ? " to" : "");
        if (k === i) inner += '<span class="nr">' + n + "</span>";
        if (k === j) inner += '<span class="hd2 ' + (j > i ? "r" : "l") + '"></span>';
        return '<div class="' + cls + '">' + inner + "</div>";
      }).join("");
      const tags = [];
      if (o.ref) tags.push('<span class="tg">' + esc(o.ref) + "</span>");
      if (o.sla) tags.push('<span class="tg">' + esc(o.sla) + "</span>");
      if (o.sca) tags.push('<span class="tg sca">SCA</span>');
      if (o.rule) tags.push('<span class="tg rule">' + esc(o.rule) + "</span>");
      if (o.added) tags.push('<span class="tg add">Added to v8.1</span>');
      if (o.dec) tags.push('<a class="tg dec" href="#/questions?s=decided&q=' + esc(o.dec) + '">Decided: ' + esc(o.dec) + "</a>");
      return '<div class="row' + (o.sca ? " sca" : "") + '" style="' + cols + '">' + cells + '<div class="t">' + esc(text) + (o.api ? '<span class="api">' + esc(o.api) + "</span>" : "") +
        (o.fail ? '<span class="if">If it fails: ' + esc(o.fail) + "</span>" : "") +
        (o.gap ? '<span class="if" style="color:var(--amber)">Gap: ' + esc(o.gap) + "</span>" : "") +
        (tags.length ? '<span class="tags">' + tags.join("") + "</span>" : "") + "</div></div>";
    }).join("");
    return '<div class="lanes">' + head + rows + '</div><div class="legend"><span><b>1</b>step, starts at the sender</span><span><i></i>call or message</span><span><i class="sca"></i>signed with SCA</span><span style="color:var(--red)">If it fails</span><span style="color:var(--amber)">Open gap in v8.1</span><span style="color:var(--green)">Decided (closes a gap)</span></div>';
  }

  function qcard(q, withWf) {
    const d = !!q.decided;
    return '<div class="q' + (d ? " decided" : "") + '" id="' + esc(q.id) + '"><div class="qh"><b>' + esc(q.id) + "</b><span>" + esc(q.q) + '</span><span class="r">' + (d ? st("green", "Decided") + '<span class="chip">Sign-off: ' + esc(q.owner) + "</span>" : '<span class="chip">' + esc(q.owner) + "</span>") + (withWf ? '<a class="wfid" href="#/workflow/' + q.wf + '">' + q.wf + "</a>" : "") + '</span></div><p class="prop"><b>' + (d ? "Decision:" : "Proposed:") + "</b> " + esc(q.prop) + "</p></div>";
  }
  const listBox = (title, items, note) => items && items.length ? "<section><h2>" + esc(title) + "</h2>" + (note ? '<p class="small muted mb">' + esc(note) + "</p>" : "") + '<ul class="list">' + items.map(t => '<li><span class="what">' + esc(t) + "</span></li>").join("") + "</ul></section>" : "";

  function detail(w, print) {
    const screens = (w.screens || []).map(s => '<a class="chip" href="' + PORTAL + s + '" target="_blank" rel="noopener">' + esc(WF.SCREENS[s] || s) + "</a>").join(" ");
    return '<dl class="facts mb"><dt>Status</dt><dd>' + wfb(w.status) + "</dd><dt>Area</dt><dd>" + esc(w.area) + "</dd><dt>Source</dt><dd>" + esc(w.source) + "</dd><dt>Starts when</dt><dd>" + esc(w.trigger) + "</dd><dt>Object</dt><dd>" + esc(w.object) + "</dd><dt>Portal screens</dt><dd>" + (screens || "None") + (print ? "" : ' <span class="small muted">open in the prototype</span>') + "</dd></dl>" +
      "<section><h2>Steps</h2>" + diagram(w) + "</section>" +
      '<div class="cols"><section><h2>States</h2>' + (w.states.length ? table([{ h: "From", v: s => '<span class="mono">' + esc(s[0] || "start") + "</span>" }, { h: "When", v: s => esc(s[1]) }, { h: "To", v: s => '<span class="mono">' + esc(s[2]) + "</span>" }], w.states) : '<p class="empty">No states of its own.</p>') + "</section>" +
      "<section><h2>Rules</h2>" + (w.rules.length ? '<ul class="list">' + w.rules.map(r => '<li><span class="what">' + esc(r) + "</span></li>").join("") + "</ul>" : '<p class="empty">None.</p>') + "</section></div>" +
      listBox("Changes v8.1 needs", w.amends, "For the CTO's next version of the architecture (v8.2).") +
      listBox("Depends on", w.deps, "Confirmations needed from outside Paytinno. Not design gaps.") +
      "<section><h2>Open questions</h2>" + (w.questions.length ? '<div class="qs">' + w.questions.map(q => qcard(Object.assign({ wf: w.id }, q))).join("") + "</div>" : '<p class="empty">None.</p>') + "</section>";
  }

  const pages = {};
  pages.workflows = {
    nav: "Workflows", icon: "workflows", title: "Merchant portal workflows",
    render(_, q) {
      const f = q.get("s") || ""; const all = WF.list; const rows = all.filter(w => !f || w.status === f); const qs = WF.questions().filter(x => !x.decided);
      const tabs = [["", "All"]].concat(Object.keys(WF.STATUS).filter(k => all.some(w => w.status === k)).map(k => [k, WF.STATUS[k][1]]));
      return {
        sub: "The intended workflows behind the Paytinno merchant portal (S3), for review with the CTO's team before build. Each says what the merchant does, which systems take part, what each call is, and what is still open. Proposed means not in the CTO's architecture v8.1 and needs the team's agreement.",
        tools: '<a class="btn" href="#/spec">Full spec to print</a>',
        html: strip([["Workflows", String(all.length)]].concat(tabs.slice(1).map(([k, l]) => [l, String(all.filter(w => w.status === k).length), k === "part" ? "amber" : ""])).concat([["Open questions", String(qs.length), "amber"], ["Decided, awaiting sign-off", String(WF.questions().length - qs.length)]])) +
          '<div class="tabs">' + tabs.map(([k, l]) => '<a href="#/workflows' + (k ? "?s=" + k : "") + '"' + (f === k ? ' aria-current="page"' : "") + ">" + l + "<span>" + all.filter(w => !k || w.status === k).length + "</span></a>").join("") + "</div>" +
          WF.AREAS.map(a => { const ws = rows.filter(w => w.area === a); if (!ws.length) return ""; return "<section><h2>" + esc(a) + "</h2>" + table([
            { h: "ID", v: w => '<span class="wfid">' + w.id + "</span>" },
            { h: "Workflow", v: w => '<a href="#/workflow/' + w.id + '">' + esc(w.title) + '</a><span class="sub">' + esc(w.summary) + "</span>" },
            { h: "Status", v: w => wfb(w.status) },
            { h: "Source", v: w => '<span class="small">' + esc(w.source) + "</span>" },
            { h: "Steps", r: 1, v: w => String(w.steps.filter(s => s[0] !== "#").length) },
            { h: "Questions", r: 1, v: w => w.questions.length ? '<span class="warn">' + w.questions.length + "</span>" : "0" }
          ], ws, { href: w => "#/workflow/" + w.id }) + "</section>"; }).join("") +
          '<section><h2>Systems in the diagrams</h2><div class="card small">' + Object.entries(CONFIG.LANES).map(([, v]) => "<b>" + esc(v[0]) + "</b> " + esc(v[1])).join(". ") + ". A01 and A05 are client libraries in S18 and S6; A09 is the BPC API library, which never writes the ledger.</div></section>"
      };
    }
  };
  pages.workflow = {
    nav: "Workflow", parent: "workflows", title: "Workflow",
    render(params) {
      const w = WF.byId(params[0]); if (!w) return { html: '<p class="empty">Not found.</p>' };
      const i = WF.list.indexOf(w); const prev = WF.list[i - 1], next = WF.list[i + 1];
      return {
        title: w.id + " " + w.title, sub: esc(w.summary),
        tools: (prev ? '<a class="btn" href="#/workflow/' + prev.id + '" title="' + esc(prev.title) + '">Previous</a>' : "") + (next ? '<a class="btn" href="#/workflow/' + next.id + '" title="' + esc(next.title) + '">Next</a>' : "") + '<a class="btn" href="#/workflows">All workflows</a>',
        html: detail(w)
      };
    }
  };
  pages.questions = {
    nav: "Open questions", icon: "questions", title: "Open questions",
    badge: () => WF.questions().filter(x => !x.decided).length,
    render(_, q) {
      const s = q.get("s") || "open", own = q.get("o") || "", jump = q.get("q");
      const all = WF.questions(); const inS = x => s === "all" || (s === "decided" ? !!x.decided : !x.decided);
      const owners = [...new Set(all.filter(inS).map(x => x.owner))].sort();
      const rows = all.filter(x => inS(x) && (!own || x.owner === own));
      const link = (k, v) => { const n = new URLSearchParams(q); n.delete("q"); if (v) n.set(k, v); else n.delete(k); if (k === "s") n.delete("o"); return "#/questions?" + n.toString(); };
      return {
        sub: s === "decided" ? "Answers adopted as the design. Each still needs sign-off by its owner, who can change it; tell Claude and the workflows are updated." : "Decisions the portal still needs. Each has a proposed answer to agree or change. CTO question numbers refer to the v8.1 question list.",
        html: '<div class="tabs">' + [["open", "Open"], ["decided", "Decided, awaiting sign-off"], ["all", "All"]].map(([k, l]) => '<a href="' + link("s", k === "open" ? "" : k) + '"' + (s === k ? ' aria-current="page"' : "") + ">" + l + "<span>" + all.filter(x => k === "all" || (k === "decided" ? !!x.decided : !x.decided)).length + "</span></a>").join("") + "</div>" +
          '<div class="flt"><span class="small muted">Owner</span>' + [""].concat(owners).map(o => '<a class="chip" href="' + link("o", o) + '"' + (own === o ? ' style="border-color:var(--accent);color:var(--ink)"' : "") + ">" + esc(o || "Everyone") + "</a>").join(" ") + "</div>" +
          (rows.length ? '<div class="qs">' + rows.map(x => qcard(x, true)).join("") + "</div>" : '<p class="empty">None.</p>'),
        after() { if (jump) { const el = document.getElementById(jump); if (el) { el.scrollIntoView(); el.style.boxShadow = "0 0 0 2px var(--accent)"; } } }
      };
    }
  };
  pages.changes = {
    nav: "Changes to v8.1", icon: "changes", title: "Changes to v8.1",
    badge: () => WF.list.reduce((n, w) => n + (w.amends || []).length, 0),
    render() {
      const ws = WF.list.filter(w => (w.amends || []).length || (w.deps || []).length);
      const deps = []; WF.list.forEach(w => (w.deps || []).forEach(d => deps.push([w, d])));
      return {
        sub: "What the CTO's architecture needs to change (v8.2) so it matches the decided workflows. Each line names the v8.1 workflow or step and the decision behind it.",
        html: ws.map(w => (w.amends || []).length ? '<section><h2><a href="#/workflow/' + w.id + '">' + w.id + " " + esc(w.title) + "</a> " + wfb(w.status) + '</h2><ul class="list">' + w.amends.map(t => '<li><span class="what">' + esc(t) + "</span></li>").join("") + "</ul></section>" : "").join("") +
          (deps.length ? '<section><h2>Depends on</h2><p class="small muted mb">Confirmations needed from outside Paytinno.</p><ul class="list">' + deps.map(([w, d]) => '<li><span class="what">' + esc(d) + '</span><a class="wfid" href="#/workflow/' + w.id + '">' + w.id + "</a></li>").join("") + "</ul></section>" : "")
      };
    }
  };
  pages.roles = {
    nav: "Roles and rights", icon: "roles", title: "Roles and rights",
    render() {
      const R = Object.keys(CONFIG.ROLES);
      const cell = (p, r) => { if (!p.roles.includes(r)) return '<span class="no">No</span>'; let t = '<span class="y">Yes</span>'; if (p.sca) t += ' <span class="s">SCA</span>'; if (p.second) t += ' <span class="a">' + (p.second.from ? "2nd from " + eur(p.second.from) : "2nd") + "</span>"; return t; };
      const L = CONFIG.LIMITS;
      return {
        sub: "Proposed (MP-Q01). v8.1 names only ONBOARDING_APPLICANT and MERCHANT_ADMIN. Roles live in S6; S18 checks them on every call. The screens hide what a role cannot do, but S18 is the control.",
        html: '<section><h2>Who can do what</h2>' + table([{ h: "Action", v: x => esc(x[1].label) + '<span class="sub mono">' + esc(x[0]) + "</span>" + (x[1].src ? '<span class="sub">' + esc(x[1].src) + "</span>" : "") }].concat(R.map(r => ({ h: CONFIG.ROLES[r].label, v: x => cell(x[1], r) }))), Object.entries(CONFIG.PERMS), { cls: "matrix" }) + '<p class="note"><span class="s">SCA</span> the person signs with a passkey (dynamic linking). <span class="a">2nd</span> a second person approves (MP-23), always or from the amount shown.</p></section>' +
          '<div class="cols"><section><h2>Roles</h2>' + table([{ h: "Role", v: r => "<b>" + esc(CONFIG.ROLES[r].label) + '</b><span class="sub mono">' + CONFIG.ROLES[r].code + "</span>" }, { h: "For", v: r => esc(CONFIG.ROLES[r].desc) }], R) + "</section>" +
          "<section><h2>Default limits per person</h2>" + table([{ h: "Role", v: r => esc(CONFIG.ROLES[r].label) }, { h: "Refund", r: 1, v: r => eur(CONFIG.MANDATE[r].refund) }, { h: "Payout", r: 1, v: r => CONFIG.MANDATE[r].payout ? eur(CONFIG.MANDATE[r].payout) : "None" }], Object.keys(CONFIG.MANDATE)) + '<p class="note">An admin can lower a person\'s limit. Paytinno sets the business\'s maximum in underwriting (MP-Q05).</p>' +
          '<h2 style="font-size:14px;margin:18px 0 10px">Timers and limits</h2><dl class="facts">' + [["Session", L.sessionHours + " h, idle " + L.idleMinutes + " min"], ["Refresh token", L.refreshDays + " days"], ["SCA challenge", L.scaMinutes + " min"], ["Verification codes", L.codeMinutes + " min, 5 attempts"], ["Payout cut-off", L.payoutCutoff], ["Minimum payout", L.minPayout], ["Reserve", L.reserveDays + " days"], ["KYB review", L.kybHigh + " months high risk, " + L.kybStd + " others"], ["Old key after roll", L.keyOverlapHours + " h"], ["Invitation", L.inviteDays + " days"]].map(([a, b]) => "<dt>" + esc(a) + "</dt><dd>" + esc(b) + "</dd>").join("") + '</dl><p class="note">Values in [brackets] are proposals.</p></section></div>' +
          '<section><h2>Application status texts</h2><p class="small muted mb">The portal shows its own fixed text for each state, never free text from staff (MP-Q09, no tipping off).</p>' + table([{ h: "State", v: s => '<span class="mono">' + s.k + "</span>" }, { h: "Label", v: s => esc(s.label) }, { h: "Text", v: s => esc(s.text) }], CONFIG.APP_STATES) + "</section>"
      };
    }
  };
  pages.sources = {
    nav: "Sources", icon: "sources", title: "Sources and contradictions",
    render() {
      return {
        sub: "What the workflows are built from, and where those sources disagree.",
        html: '<section><h2>Sources</h2><ul class="list">' + WF.SOURCES.map(s => '<li><span class="what">' + esc(s) + "</span></li>").join("") + "</ul></section>" +
          '<section><h2>Contradictions found in the sources</h2><ul class="list">' + WF.CONTRADICTIONS.map(s => '<li><span class="what">' + esc(s) + "</span></li>").join("") + "</ul></section>"
      };
    }
  };
  pages.spec = {
    nav: "Full spec", icon: "spec", title: "Merchant portal workflows",
    render() {
      const qs = WF.questions();
      return {
        sub: "Paytinno merchant portal (S3): workflows for review, version " + WF.VERSION + ". Based on CTO architecture v8.1, PRD WF11 Acquiring v6 and the admin-portal message spec v0.1.",
        tools: '<button class="btn primary" type="button" onclick="window.print()">Print or save as PDF</button>',
        html: '<section><h2>Contents</h2><div class="toc card">' + WF.list.map(w => '<a href="#/spec" data-go="' + w.id + '"><span class="wfid">' + w.id + '</span><span class="tt">' + esc(w.title) + "</span> " + wfb(w.status) + "</a>").join("") + "</div></section>" +
          WF.list.map(w => '<section id="s-' + w.id + '" style="margin-top:36px"><h2 style="font-size:17px">' + w.id + " " + esc(w.title) + '</h2><p class="mb">' + esc(w.summary) + "</p>" + detail(w, true) + "</section>").join("") +
          '<section style="margin-top:36px"><h2 style="font-size:17px">Open questions (' + qs.filter(x => !x.decided).length + ')</h2><div class="qs">' + qs.filter(x => !x.decided).map(x => qcard(x, true)).join("") + "</div></section>" +
          '<section style="margin-top:36px"><h2 style="font-size:17px">Decided, awaiting sign-off (' + qs.filter(x => x.decided).length + ')</h2><div class="qs">' + qs.filter(x => x.decided).map(x => qcard(x, true)).join("") + "</div></section>" +
          '<section style="margin-top:36px"><h2 style="font-size:17px">Changes v8.1 needs</h2>' + WF.list.filter(w => (w.amends || []).length).map(w => "<h3 style=\"font-size:14px;margin:14px 0 6px\">" + w.id + " " + esc(w.title) + "</h3><ul class=\"plain\">" + w.amends.map(t => "<li>" + esc(t) + "</li>").join("") + "</ul>").join("") + "</section>",
        after(root) { root.querySelectorAll("[data-go]").forEach(a => a.onclick = e => { e.preventDefault(); document.getElementById("s-" + a.dataset.go).scrollIntoView(); }); }
      };
    }
  };

  const NAV = ["workflows", "questions", "changes", "roles", "sources", "spec"];
  let current = null;
  function render() {
    const h = location.hash.replace(/^#\/?/, "") || "workflows";
    const [path, query] = h.split("?"); const parts = path.split("/").map(decodeURIComponent);
    const id = pages[parts[0]] ? parts[0] : "workflows"; const page = pages[id];
    let out; try { out = page.render(parts.slice(1), new URLSearchParams(query || "")) || {}; } catch (e) { console.error(e); out = { html: '<p class="bad">This page could not be drawn: ' + esc(e.message) + "</p>" }; }
    document.getElementById("pageTitle").textContent = out.title || page.title;
    document.getElementById("pageSub").innerHTML = out.sub || ""; document.getElementById("pageSub").classList.toggle("hide", !out.sub);
    document.getElementById("pageTools").innerHTML = out.tools || "";
    document.getElementById("envTag").innerHTML = '<span class="tag" style="background:var(--blue-bg);color:var(--blue)">Draft ' + esc(WF.VERSION) + "</span>";
    document.getElementById("main").innerHTML = out.html || "";
    document.title = (out.title || page.title) + " - Paytinno";
    if (out.after) out.after(document.querySelector("main"));
    const parent = page.parent || id;
    document.getElementById("nav").innerHTML = NAV.map(k => { const p = pages[k]; const b = p.badge ? p.badge() : null; return '<a href="#/' + k + '" title="' + esc(p.nav) + '" aria-label="' + esc(p.nav) + '"' + (parent === k ? ' aria-current="page"' : "") + '><span class="ico">' + icon(p.icon) + "</span>" + esc(p.nav) + (b ? '<span class="n">' + b + "</span>" : "") + "</a>"; }).join("") +
      '<div class="grp">Prototype</div><a href="' + PORTAL + 'home" target="_blank" rel="noopener" title="Merchant portal prototype" aria-label="Merchant portal prototype"><span class="ico">' + icon("portal") + "</span>Merchant portal</a>";
    window.scrollTo(0, current === location.hash ? window.scrollY : 0); current = location.hash;
  }
  function setLook(look, save) {
    const el = document.documentElement;
    if (look === "light") { el.dataset.look = "light"; el.dataset.theme = "light"; } else { delete el.dataset.look; if (el.dataset.theme === "light") delete el.dataset.theme; }
    document.querySelectorAll(".envtoggle button[data-look]").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.look === look)));
    if (save) try { localStorage.setItem("mpw.look", look); } catch (e) { /* private window */ }
  }
  setLook(document.documentElement.dataset.look || "standard");
  document.querySelectorAll(".envtoggle button[data-look]").forEach(b => b.onclick = () => setLook(b.dataset.look, true));
  document.addEventListener("click", e => { const tr = e.target.closest("tr[data-href]"); if (tr && !e.target.closest("a,button")) location.hash = tr.dataset.href; });
  window.addEventListener("hashchange", render);
  render();
})();
