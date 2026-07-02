#!/usr/bin/env python3
"""Generate src/modules.md from a bazel-registry checkout.

Reads <registry>/modules/*/metadata.json and emits a Markdown page listing every
module (latest version, version count, homepage) — rendered into the themed site
by mdBook. Run in CI before `bazel build //:site`. Stdlib only.
"""
import argparse
import json
import os
from pathlib import Path


def repo_url(repo):
    if repo.startswith("github:"):
        return "https://github.com/" + repo[len("github:"):]
    return repo


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--registry", required=True, help="path to a bazel-registry checkout")
    ap.add_argument("--out", default="src/modules.md")
    args = ap.parse_args()

    mroot = Path(args.registry) / "modules"
    mods = []
    for name in sorted(os.listdir(mroot)):
        meta_path = mroot / name / "metadata.json"
        if not meta_path.is_file():
            continue
        meta = json.loads(meta_path.read_text())
        versions = meta.get("versions", []) or []
        mods.append({
            "name": name,
            "latest": versions[-1] if versions else "",
            "count": len(versions),
            "homepage": meta.get("homepage", "") or "",
            "repository": (meta.get("repository") or [""])[0],
        })

    lines = [
        "# Modules",
        "",
        f"{len(mods)} modules in the [tomato-bazel registry]"
        "(https://github.com/tomato-bazel/bazel-registry). "
        "Add to your `.bazelrc`: `common --registry=https://registry.tbzl.dev/`.",
        "",
        "| Module | Latest | Versions | Source |",
        "| --- | --- | --- | --- |",
    ]
    for m in mods:
        src = repo_url(m["repository"]) or m["homepage"]
        src_cell = f"[{m['repository'] or 'link'}]({src})" if src else ""
        dep = f"`bazel_dep(name = \"{m['name']}\", version = \"{m['latest']}\")`"
        lines.append(f"| {dep} | {m['latest']} | {m['count']} | {src_cell} |")
    lines.append("")

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines))
    print(f"wrote {out} ({len(mods)} modules)")


if __name__ == "__main__":
    main()
