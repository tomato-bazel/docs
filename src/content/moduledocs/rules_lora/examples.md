---
title: "Usage"
module: "rules_lora"
---

Real usage, taken from the module's `examples/`.

### examples/corpus_smoke/BUILD.bazel

```starlark
load("@rules_python//python:defs.bzl", "py_binary")
load(
    "@rules_lora//lora:defs.bzl",
    "lora_corpus",
    "lora_dataset",
)

# Smoke example for `lora_corpus` (v0.0.3).
#
# Two corpora chained: `base_corpus` transforms a raw text file into
# messages_v1 SFT rows; `derived_corpus` takes `base_corpus` as a dep
# AND its own raw source, exercising both `source` and `deps`.

py_binary(
    name = "smoke_transform",
    srcs = ["transform.py"],
    main = "transform.py",
)

lora_corpus(
    name = "base_corpus",
    source = ["raw_prompts.txt"],
    transform = ":smoke_transform",
    schema = "messages_v1",
    min_examples = 3,
)

lora_corpus(
    name = "derived_corpus",
    source = ["raw_prompts.txt"],
    transform = ":smoke_transform",
    deps = [":base_corpus"],
    schema = "messages_v1",
    # 3 (source) + 3 (dep) = 6 rows expected.
    min_examples = 6,
)

# Demonstrate that a `lora_corpus` plugs in wherever `lora_dataset`
# is accepted: alias the corpus as a dataset for downstream training
# pipelines.
alias(
    name = "derived_corpus_as_dataset",
    actual = ":derived_corpus",
)
```

### examples/smoke/BUILD.bazel

```starlark
load(
    "@rules_lora//lora:defs.bzl",
    "lora_base_model",
    "lora_dataset",
    "lora_lineage",
    "lora_merge",
    "lora_recipe",
    "lora_train",
)

# Smoke test exercising all four public macros end-to-end.
# `bazel build //examples/smoke:smoke_jobspec` produces a
# TrainingJobSpec JSON; no actual training happens (the `run`
# subcommand of runpod_orchestrator is v0.1).

lora_dataset(
    name = "tiny_sft",
    src = "sft.jsonl",
    min_examples = 3,
    schema = "messages_v1",
)

lora_recipe(
    name = "tiny_recipe",
    alpha = 8,
    epochs = 1,
    framework = "torchtune",
    grad_accum_steps = 1,
    learning_rate = "5e-4",
    micro_batch_size = 1,
    rank = 4,
    target_modules = [
        "q_proj",
        "v_proj",
    ],
)

lora_base_model(
    name = "tiny_base",
    repo = "Qwen/Qwen2.5-0.5B-Instruct",
    revision = "main",
)

lora_train(
    name = "smoke_jobspec",
    base = ":tiny_base",
    dataset = ":tiny_sft",
    recipe = ":tiny_recipe",
    # Backend is per-platform now: defaults to runpod; build with
    # --platforms=@rules_lora//lora/backend:local_platform for the local path.
)

# Exercises the lora_merge macro (rule + .run wrapper). No execution
# here — `bazel build //examples/smoke:smoke_merge` just checks the
# rule analyzes and the wrapper script is generated.
lora_merge(
    name = "smoke_merge",
    adapter_dir = "outputs/adapter-smoke_jobspec",
    base = ":tiny_base",
    out_dir = "outputs/merged-smoke",
    # No push_repo here — merge-only, so the smoke build stays
    # side-effect-free. Set push_repo + `bazel run :smoke_merge.run`
    # to also push the merged dir to the hub.
)

# Provenance: trace smoke_jobspec's transitive dataset/recipe/base lineage.
# `bazel build //examples/smoke:smoke_lineage` -> smoke_lineage.lineage.json.
lora_lineage(
    name = "smoke_lineage",
    target = ":smoke_jobspec",
)
```
