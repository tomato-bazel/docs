// Docs client runtime: theme toggle, mobile drawer, sidebar collapse, command
// palette (Pagefind full-text with a nav-index fallback), scrollspy TOC, copy.

interface NavEntry { title: string; href: string; group: string; snip: string; }
interface Result { title: string; snip: string; url: string; group: string; }

export function initDocs(): void {
  const root = document.documentElement;

  // ── theme ──
  const themeBtn = document.getElementById("themeBtn");
  themeBtn?.addEventListener("click", () => {
    let cur = root.getAttribute("data-theme");
    if (!cur) cur = matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light";
    const next = cur === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("tbzl-docs-theme", next); } catch (e) {}
  });

  // ── mobile drawer ──
  const sb = document.getElementById("sidebar");
  const sc2 = document.getElementById("scrim2");
  document.getElementById("menuBtn")?.addEventListener("click", () => {
    sb?.classList.toggle("open"); sc2?.classList.toggle("open");
  });
  sc2?.addEventListener("click", () => { sb?.classList.remove("open"); sc2?.classList.remove("open"); });

  // ── sidebar group collapse (keep the active group open) ──
  document.querySelectorAll<HTMLElement>(".navgroup > .gh").forEach((gh) => {
    gh.addEventListener("click", () => gh.parentElement?.classList.toggle("collapsed"));
  });

  // ── copy buttons on code blocks ──
  document.querySelectorAll<HTMLElement>("article pre.astro-code").forEach((pre) => {
    const btn = document.createElement("button");
    btn.className = "copybtn"; btn.type = "button"; btn.textContent = "Copy";
    btn.addEventListener("click", () => {
      const txt = (pre.innerText || "").replace(/^\$\s?/gm, "");
      const done = () => { btn.textContent = "Copied ✓"; setTimeout(() => (btn.textContent = "Copy"), 1300); };
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(txt).then(done, done); else done();
    });
    pre.appendChild(btn);
  });

  // ── scrollspy TOC ──
  const tocLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>(".toc a[href^='#']"));
  if (tocLinks.length && "IntersectionObserver" in window) {
    const map: Record<string, HTMLAnchorElement> = {};
    tocLinks.forEach((a) => (map[decodeURIComponent(a.getAttribute("href")!.slice(1))] = a));
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => {
        if (en.isIntersecting) {
          tocLinks.forEach((a) => a.classList.remove("on"));
          map[en.target.id]?.classList.add("on");
        }
      });
    }, { rootMargin: "-72px 0px -70% 0px", threshold: 0 });
    Object.keys(map).forEach((id) => { const h = document.getElementById(id); if (h) io.observe(h); });
  }

  // ── command palette ──
  const scrim = document.getElementById("palScrim")!;
  const input = document.getElementById("palInput") as HTMLInputElement;
  const resBox = document.getElementById("palRes")!;
  const engineEl = document.getElementById("palEngine");
  let navIndex: NavEntry[] = [];
  try { navIndex = JSON.parse(document.getElementById("navindex")?.textContent || "[]"); } catch (e) {}
  let results: Result[] = [], sel = 0, open = false, reqId = 0;

  let pf: any = null; // Pagefind module, false if unavailable
  async function ensurePagefind(): Promise<any> {
    if (pf !== null) return pf;
    try {
      const p = "/pagefind/pagefind" + ".js";
      // @ts-ignore - resolved at runtime from the built site
      pf = await import(/* @vite-ignore */ p);
      await pf.init();
      if (engineEl) engineEl.textContent = "Full-text · Pagefind";
    } catch (e) { pf = false; }
    return pf;
  }

  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
  function groupFor(url: string): string {
    const path = url.split("#")[0].replace(/\/+$/, "") || "/";
    const hit = navIndex.find((n) => n.href.replace(/\/+$/, "") === path);
    return hit ? hit.group : "Docs";
  }

  async function suggested(): Promise<Result[]> {
    const pick = ["Overview", "Using the registry", "Blast radius", "Modules", "Authoring a module"];
    return navIndex.filter((n) => pick.includes(n.title))
      .sort((a, b) => pick.indexOf(a.title) - pick.indexOf(b.title))
      .map((n) => ({ title: n.title, snip: n.snip, url: n.href, group: n.group }));
  }

  function fallbackSearch(q: string): Result[] {
    const score = (n: NavEntry) => {
      const t = n.title.toLowerCase(), k = (n.snip + " " + n.group).toLowerCase();
      if (t === q) return 100; if (t.startsWith(q)) return 80;
      if ((" " + t).includes(" " + q)) return 66; if (t.includes(q)) return 55; if (k.includes(q)) return 35; return 0;
    };
    return navIndex.map((n) => ({ n, s: score(n) })).filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s).slice(0, 9)
      .map((x) => ({ title: x.n.title, snip: x.n.snip, url: x.n.href, group: x.n.group }));
  }

  async function pagefindSearch(q: string): Promise<Result[]> {
    const mod = await ensurePagefind();
    if (!mod) return fallbackSearch(q);
    const r = await mod.search(q);
    const data = await Promise.all(r.results.slice(0, 8).map((x: any) => x.data()));
    return data.map((d: any) => ({
      title: (d.meta && d.meta.title) || d.url,
      snip: d.excerpt || "",
      url: d.url,
      group: groupFor(d.url),
    }));
  }

  function hlTitle(text: string, q: string) {
    if (!q) return esc(text);
    const i = text.toLowerCase().indexOf(q);
    if (i < 0) return esc(text);
    return esc(text.slice(0, i)) + "<mark>" + esc(text.slice(i, i + q.length)) + "</mark>" + esc(text.slice(i + q.length));
  }
  function snipHtml(s: string, q: string) {
    // Pagefind excerpts are sanitized HTML with <mark> hit highlights; keep them.
    if (s.includes("<mark>")) return s;
    if (!q) return esc(s);
    const i = s.toLowerCase().indexOf(q);
    if (i < 0) return esc(s);
    return esc(s.slice(0, i)) + "<mark>" + esc(s.slice(i, i + q.length)) + "</mark>" + esc(s.slice(i + q.length));
  }

  async function render(raw: string) {
    const q = (raw || "").trim().toLowerCase();
    const my = ++reqId;
    let list: Result[], forceGroup: string | null = null;
    if (!q) { list = await suggested(); forceGroup = "Suggested"; }
    else { list = await pagefindSearch(q); }
    if (my !== reqId) return; // stale
    results = list; sel = 0; paint(q, forceGroup);
  }

  function paint(q: string, forceGroup: string | null) {
    if (!results.length) {
      resBox.innerHTML = '<div class="empty">No matches for <b>' + esc(q) +
        '</b><br><span style="font-size:13px">Try “registry”, “rdeps”, “rules_lean”, or “publish”.</span></div>';
      return;
    }
    let html = "", last: string | null = null;
    results.forEach((it, i) => {
      const grp = forceGroup || it.group;
      if (grp !== last) { html += '<div class="grp">' + esc(grp) + "</div>"; last = grp; }
      html += '<div class="r' + (i === sel ? " sel" : "") + '" data-i="' + i + '">' +
        '<div class="ri">' + esc((it.group[0] || "#")) + "</div>" +
        '<div class="rt"><div class="rtt">' + hlTitle(it.title, forceGroup ? "" : q) +
        '</div><div class="rts">' + snipHtml(it.snip, forceGroup ? "" : q) + "</div></div>" +
        '<div class="rr">↵</div></div>';
    });
    resBox.innerHTML = html;
    resBox.querySelectorAll<HTMLElement>(".r").forEach((r) => {
      r.addEventListener("mouseenter", () => { sel = +r.dataset.i!; mark(); });
      r.addEventListener("click", () => choose());
    });
  }
  function mark() {
    resBox.querySelectorAll<HTMLElement>(".r").forEach((r) => r.classList.toggle("sel", +r.dataset.i! === sel));
    resBox.querySelector(".r.sel")?.scrollIntoView({ block: "nearest" });
  }
  function choose() { const it = results[sel]; if (it) location.href = it.url; }
  function openPal() { open = true; scrim.classList.add("open"); input.value = ""; render(""); setTimeout(() => input.focus(), 10); ensurePagefind(); }
  function closePal() { open = false; scrim.classList.remove("open"); }

  document.getElementById("searchTrigger")?.addEventListener("click", openPal);
  scrim.addEventListener("click", (e) => { if (e.target === scrim) closePal(); });
  input.addEventListener("input", () => render(input.value));
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); open ? closePal() : openPal(); return; }
    const tag = (document.activeElement?.tagName || "");
    if (!open && e.key === "/" && !/^(INPUT|TEXTAREA)$/.test(tag)) { e.preventDefault(); openPal(); return; }
    if (!open) return;
    if (e.key === "Escape") closePal();
    else if (e.key === "ArrowDown") { e.preventDefault(); if (results.length) { sel = (sel + 1) % results.length; mark(); } }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (results.length) { sel = (sel - 1 + results.length) % results.length; mark(); } }
    else if (e.key === "Enter") { e.preventDefault(); choose(); }
  });
}
