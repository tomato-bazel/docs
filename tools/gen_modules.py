#!/usr/bin/env python3
"""Generate src/data/modules.json from a bazel-registry checkout.

The reusable "rules documentation into the reference" plumbing (was: emitted
mdBook markdown; now: emits JSON the Astro reference page renders + Pagefind
indexes). Reads <registry>/modules/*/metadata.json and records every module
(latest version, version count, source repo, category). Run in CI before the
Astro build. Stdlib only.
"""
import argparse, json, os
from pathlib import Path


def repo_url(repo):
    return "https://github.com/" + repo[len("github:"):] if repo.startswith("github:") else repo


def category(name, repo):
    if name.startswith("rules_"):
        return "Bazel rules"
    return "Modules & tooling"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--registry", required=True, help="path to a bazel-registry checkout")
    ap.add_argument("--out", default="src/data/modules.json")
    args = ap.parse_args()

    mroot = Path(args.registry) / "modules"
    mods = []
    for name in sorted(os.listdir(mroot)):
        meta_path = mroot / name / "metadata.json"
        if not meta_path.is_file():
            continue
        meta = json.loads(meta_path.read_text())
        versions = meta.get("versions", []) or []
        repo = (meta.get("repository") or [""])[0]
        mods.append({
            "name": name,
            "latest": versions[-1] if versions else "",
            "versions": len(versions),
            "homepage": meta.get("homepage", "") or "",
            "repository": repo,
            "source": repo_url(repo) or meta.get("homepage", ""),
            "category": category(name, repo),
        })

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "generated_from": "https://github.com/tomato-bazel/bazel-registry",
        "count": len(mods),
        "modules": mods,
    }
    out.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"wrote {out} ({len(mods)} modules, "
          f"{sum(1 for m in mods if m['category']=='Bazel rules')} rules)")


if __name__ == "__main__":
    main()
