---
title: "Usage"
module: "rules_huggingface"
---

Real usage, taken from the module's `examples/`.

### examples/BUILD.bazel

```starlark
load(
    "@rules_huggingface//huggingface:defs.bzl",
    "hf_download",
    "hf_inference_endpoint",
    "hf_model",
    "hf_repo",
    "hf_upload",
)

# Smoke targets — verify the rules load + analyze + emit runners.

hf_model(
    name = "qwen_base",
    repo = "Qwen/Qwen2.5-1.5B-Instruct",
    revision = "main",
)

# → emits :demo_model.push
hf_upload(
    name = "demo_model",
    repo = "fastverk/demo-model",
    local_dir = "outputs/demo",
    private = True,
)

# → emits :demo_repo.create
hf_repo(
    name = "demo_repo",
    repo = "fastverk/demo-model",
    private = True,
)

# → emits :demo_fetch.download
hf_download(
    name = "demo_fetch",
    repo = "Qwen/Qwen2.5-1.5B-Instruct",
    local_dir = "outputs/qwen",
    files = ["config.json"],
)

# → emits :demo_endpoint.deploy/.pause/.resume/.scale_to_zero/.delete/.describe/.list
hf_inference_endpoint(
    name = "demo_endpoint",
    namespace = "fastverk",
    endpoint_name = "agora-parser",
    config = "endpoint_config.json",
)
```
