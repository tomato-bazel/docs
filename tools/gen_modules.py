#!/usr/bin/env python3
"""Generate the module/rule reference from the registry (+ optional repo fetch).

The reusable "rules documentation into the reference" plumbing, deepened. All
output is GENERATED so the docs never drift from what's published:

  src/data/modules.json            structured facts, deps, registry reverse-deps,
                                   per-version integrity, maintainers, compat,
                                   yanked, repo description, and which docs exist.
  src/content/moduledocs/<name>/   fetched README + checked-in Stardoc docs/*.md
    readme.md, <doc>.md            (with relative links rewritten to the repo),
                                   rendered by Astro on each detail page.

Registry-derived data is always regenerated (reads the local checkout). Repo
content (README + docs/*.md) is fetched only with --fetch (needs GH_TOKEN /
GITHUB_TOKEN for rate limits + private repos degrade gracefully). Without --fetch
the committed content files are kept and modules.json reflects them.

Usage:
  python3 tools/gen_modules.py --registry .registry \
    --out src/data/modules.json --content src/content/moduledocs [--fetch]
Stdlib only.
"""
import argparse, base64, json, os, posixpath, re, sys, urllib.request
from pathlib import Path

TOKEN = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN") or ""
UA = {"User-Agent": "tbzl-docs-gen", "Accept": "application/vnd.github+json"}
if TOKEN:
    UA["Authorization"] = "Bearer " + TOKEN


def gh(path):
    try:
        req = urllib.request.Request("https://api.github.com" + path, headers=UA)
        with urllib.request.urlopen(req, timeout=25) as r:
            return json.load(r)
    except Exception:
        return None


def owner_repo(repo):
    return repo[len("github:"):] if repo.startswith("github:") else ""


def repo_url(repo):
    or_ = owner_repo(repo)
    return "https://github.com/" + or_ if or_ else ""


def category(name):
    return "Bazel rules" if name.startswith("rules_") else "Modules & tooling"


BDEP = re.compile(r'bazel_dep\(\s*name\s*=\s*"([^"]+)"\s*,\s*version\s*=\s*"([^"]*)"(.*?)\)', re.S)
COMPAT = re.compile(r'compatibility_level\s*=\s*(\d+)')


def parse_module_bazel(text):
    deps = []
    for m in BDEP.finditer(text or ""):
        deps.append({"name": m.group(1), "version": m.group(2), "dev": "dev_dependency" in m.group(3) and "True" in m.group(3)})
    cl = COMPAT.search(text or "")
    return {"deps": deps, "compatibility_level": int(cl.group(1)) if cl else None}


LINK = re.compile(r'(!?)\[([^\]]*)\]\(([^)]+)\)')
HEAD = re.compile(r'^(#{1,5})(\s)', re.M)


def demote_headings(md, by=1):
    """Push ATX headings down `by` levels (## -> ###), so a doc's rule headings
    nest under the page's 'Rules & providers' h2."""
    return HEAD.sub(lambda m: "#" * min(6, len(m.group(1)) + by) + m.group(2), md)


def rewrite_links(md, repo, branch, base_dir="", doc_anchors=None):
    """Rewrite relative markdown links/images. Links that point at an ingested
    docs/*.md file are mapped to the on-page anchor (so a README's `docs/lean.md`
    scrolls to the rendered Stardoc, and `docs/lean.md#lean_test` to that rule);
    everything else becomes an absolute repo URL so it still resolves."""
    or_ = owner_repo(repo)
    if not or_:
        return md
    blob = f"https://github.com/{or_}/blob/{branch}/"
    raw = f"https://raw.githubusercontent.com/{or_}/{branch}/"
    doc_anchors = doc_anchors or {}

    def repl(m):
        bang, text, target = m.group(1), m.group(2), m.group(3).strip()
        if target.lower().startswith(("http://", "https://", "#", "mailto:", "//")):
            return m.group(0)
        path, _, frag = target.partition("#")
        resolved = posixpath.normpath(posixpath.join(base_dir, path.lstrip("./"))) if path else ""
        if not bang and resolved in doc_anchors:
            anchor = ("#" + frag.lower()) if frag else doc_anchors[resolved]
            return f"[{text}]({anchor})"
        clean = (path or target).lstrip("./")
        url = (raw if bang else blob) + clean + (("#" + frag) if (frag and not bang) else "")
        return f"{bang}[{text}]({url})"

    return LINK.sub(repl, md)


def strip_lead_h1(md):
    lines = md.splitlines()
    i = 0
    while i < len(lines) and not lines[i].strip():
        i += 1
    if i < len(lines) and lines[i].startswith("# "):
        i += 1
        while i < len(lines) and not lines[i].strip():
            i += 1
        return "\n".join(lines[i:])
    return md


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def write_doc(content_dir, name, slug, title, body):
    d = Path(content_dir) / name
    d.mkdir(parents=True, exist_ok=True)
    fm = f"---\ntitle: {json.dumps(title)}\nmodule: {json.dumps(name)}\n---\n\n"
    (d / f"{slug}.md").write_text(fm + body.rstrip() + "\n")


def _get_file(or_, path, branch):
    f = gh(f"/repos/{or_}/contents/{path}?ref={branch}")
    if f and f.get("content"):
        return base64.b64decode(f["content"]).decode("utf-8", "replace")
    return None


def fetch_repo_docs(repo, name, content_dir):
    """Fetch README, docs/*.md (Stardoc), examples/ BUILD files, and CHANGELOG for a
    module repo. Returns a dict of what was written. Degrades gracefully."""
    out = {"description": None, "has_readme": False, "docs": [], "has_examples": False, "has_changelog": False}
    or_ = owner_repo(repo)
    if not or_:
        return out
    info = gh(f"/repos/{or_}")
    if not info:
        return out
    branch = info.get("default_branch") or "main"
    out["description"] = (info.get("description") or "").strip() or None

    tree = gh(f"/repos/{or_}/git/trees/{branch}?recursive=1")
    paths = [t["path"] for t in tree["tree"]] if (tree and isinstance(tree.get("tree"), list)) else []

    # Stardoc docs (discover first, so README links can map to on-page anchors)
    md_paths = sorted(p for p in paths
                      if re.match(r"docs/[^/]+\.md$", p)
                      and os.path.basename(p).lower() not in ("readme.md", "index.md"))
    doc_anchors = {p: "#doc-" + slugify(os.path.splitext(os.path.basename(p))[0]) for p in md_paths}

    # README
    rd = gh(f"/repos/{or_}/readme")
    if rd and rd.get("content"):
        body = base64.b64decode(rd["content"]).decode("utf-8", "replace")
        body = rewrite_links(strip_lead_h1(body), repo, branch, base_dir="", doc_anchors=doc_anchors)
        write_doc(content_dir, name, "readme", "Overview", body)
        out["has_readme"] = True

    # docs/*.md
    for path in md_paths:
        body = _get_file(or_, path, branch)
        if body is None:
            continue
        body = rewrite_links(demote_headings(body, 1), repo, branch, base_dir="docs", doc_anchors=doc_anchors)
        base = os.path.splitext(os.path.basename(path))[0]
        out["docs"].append({"slug": "doc-" + slugify(base), "title": base})
        write_doc(content_dir, name, "doc-" + slugify(base), base, body)

    # examples/ BUILD files -> a Usage doc (real, copyable target usage)
    ex = sorted((p for p in paths if re.match(r"examples?/.*BUILD(\.bazel)?$", p)),
                key=lambda p: (p.count("/"), p))[:6]
    parts = []
    for p in ex:
        code = _get_file(or_, p, branch)
        if code is None:
            continue
        lines = code.splitlines()
        if len(lines) > 160:
            lines = lines[:160] + ["# … truncated — see the repo for the full example"]
        parts.append(f"### {p}\n\n```starlark\n" + "\n".join(lines).rstrip() + "\n```\n")
    if parts:
        write_doc(content_dir, name, "examples", "Usage",
                  "Real usage, taken from the module's `examples/`.\n\n" + "\n".join(parts))
        out["has_examples"] = True

    # CHANGELOG
    cl = next((p for p in paths if p.lower() in ("changelog.md", "changelog")), None)
    if cl:
        body = _get_file(or_, cl, branch)
        if body:
            body = rewrite_links(demote_headings(strip_lead_h1(body), 1), repo, branch, base_dir="", doc_anchors=doc_anchors)
            write_doc(content_dir, name, "changelog", "Changelog", body)
            out["has_changelog"] = True
    return out


def existing_docs(content_dir, name):
    d = Path(content_dir) / name
    out = {"description": None, "has_readme": False, "docs": [], "has_examples": False, "has_changelog": False}
    if not d.is_dir():
        return out
    out["has_readme"] = (d / "readme.md").is_file()
    out["has_examples"] = (d / "examples.md").is_file()
    out["has_changelog"] = (d / "changelog.md").is_file()
    for f in sorted(d.glob("doc-*.md")):
        m = re.search(r"^title:\s*(.+)$", f.read_text(), re.M)
        title = json.loads(m.group(1)) if m else f.stem
        out["docs"].append({"slug": f.stem, "title": title})
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--registry", required=True)
    ap.add_argument("--out", default="src/data/modules.json")
    ap.add_argument("--content", default="src/content/moduledocs")
    ap.add_argument("--fetch", action="store_true", help="fetch README + docs/*.md from repos")
    args = ap.parse_args()

    mroot = Path(args.registry) / "modules"
    raw = {}
    for name in sorted(os.listdir(mroot)):
        meta_path = mroot / name / "metadata.json"
        if not meta_path.is_file():
            continue
        meta = json.loads(meta_path.read_text())
        versions = meta.get("versions", []) or []
        repo = (meta.get("repository") or [""])[0]
        # per-version provenance (source.json is local + cheap)
        vdetail = []
        for v in versions:
            sj = mroot / name / v / "source.json"
            if sj.is_file():
                s = json.loads(sj.read_text())
                vdetail.append({"version": v, "integrity": s.get("integrity", ""), "url": s.get("url", "")})
            else:
                vdetail.append({"version": v, "integrity": "", "url": ""})
        latest = versions[-1] if versions else ""
        mb = mroot / name / latest / "MODULE.bazel"
        parsed = parse_module_bazel(mb.read_text() if mb.is_file() else "")
        raw[name] = {
            "name": name, "latest": latest, "versions": len(versions),
            "versions_list": versions, "versions_detail": vdetail,
            "repository": repo, "source": repo_url(repo),
            "homepage": meta.get("homepage", "") or "",
            "registry": f"https://registry.tbzl.dev/modules/{name}/",
            "category": category(name),
            "maintainers": meta.get("maintainers", []) or [],
            "yanked": sorted((meta.get("yanked_versions") or {}).keys()),
            "compatibility_level": parsed["compatibility_level"],
            "deps": parsed["deps"],
        }

    # registry reverse-deps ("used by"): who bazel_deps on each module (latest)
    known = set(raw)
    for m in raw.values():
        m["used_by"] = sorted(
            other["name"] for other in raw.values()
            if other["name"] != m["name"] and any(d["name"] == m["name"] for d in other["deps"])
        )
        # keep only registry-known deps flagged for linking; keep all for display
        for d in m["deps"]:
            d["in_registry"] = d["name"] in known

    # repo content (README + docs/*.md + examples + changelog)
    for name, m in raw.items():
        info = fetch_repo_docs(m["repository"], name, args.content) if args.fetch else existing_docs(args.content, name)
        if info.get("description"):
            m["description"] = info["description"]
        m["has_readme"] = info["has_readme"]
        m["docs"] = info["docs"]
        m["has_examples"] = info["has_examples"]
        m["has_changelog"] = info["has_changelog"]

    mods = [raw[k] for k in sorted(raw)]
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({
        "generated_from": "https://github.com/tomato-bazel/bazel-registry",
        "count": len(mods),
        "modules": mods,
    }, indent=2) + "\n")
    rules = sum(1 for m in mods if m["category"] == "Bazel rules")
    withdoc = sum(1 for m in mods if m.get("has_readme") or m.get("docs"))
    print(f"wrote {out} ({len(mods)} modules, {rules} rules, {withdoc} with README/docs)"
          + (" [fetched]" if args.fetch else " [registry-only]"))


if __name__ == "__main__":
    main()
