---
title: "Usage"
module: "rules_runpod"
---

Real usage, taken from the module's `examples/`.

### examples/inference/BUILD.bazel

```starlark
load(
    "//runpod:defs.bzl",
    "runpod_inference_endpoint",
    "runpod_network_volume",
    "runpod_serverless_endpoint",
    "runpod_template",
)

package(default_visibility = ["//visibility:public"])

# A model-cache volume. Create it ONCE (`bazel run :model_cache.create`);
# the first worker downloads the model onto it, every subsequent cold
# worker mounts the cached weights instead of re-downloading. This is
# the fix for serverless-LLM cold-start cost.
#
# NOTE: the endpoint that references this MUST run in the same data
# center (the macro pins it automatically).
runpod_network_volume(
    name = "model_cache",
    size_gb = 100,
    data_center_id = "US-CA-2",
)

# A) The convenience form: one macro, vLLM-served LLM ready for an
#    OpenAI-compatible client (polyglot-pair-miner, llm_translate,
#    or any other consumer). Sized for Qwen 2.5 Coder 32B on a
#    single A100 80GB worker, with the model cached on the volume
#    so cold starts mount the weights (~seconds) instead of
#    re-downloading (~minutes).
runpod_inference_endpoint(
    name = "qwen_coder_32b",
    model = "Qwen/Qwen2.5-Coder-32B-Instruct",
    gpu_type_ids = ["NVIDIA A100 80GB PCIe"],
    max_model_len = 32768,
    min_workers = 0,
    max_workers = 2,
    idle_timeout_seconds = 30,
    network_volume = ":model_cache",
    readme = "Qwen 2.5 Coder 32B served via vLLM, OpenAI-compatible at /openai/v1/chat/completions",
)

# B) The decomposed form: declare the template + endpoint
#    separately. Useful when one template backs multiple endpoints
#    (e.g., a dev endpoint at min_workers=0 and a prod endpoint at
#    min_workers=1 sharing the same image+env).
runpod_template(
    name = "llama_3_70b_template",
    image = "runpod/worker-v1-vllm:v2.7.0stable-cuda12.1.0",
    template_name = "llama-3-70b-template",
    container_disk_gb = 200,
    env = {
        "MODEL_NAME": "meta-llama/Llama-3.3-70B-Instruct",
        "MAX_MODEL_LEN": "8192",
    },
    ports = ["8000/http"],
    is_serverless = True,
)

runpod_serverless_endpoint(
    name = "llama_3_70b_dev",
    template = ":llama_3_70b_template",
    gpu_type_ids = ["NVIDIA H100 80GB HBM3"],
    min_workers = 0,
    max_workers = 1,
    idle_timeout_seconds = 60,
    flashboot = True,
)
```

### examples/smoke/BUILD.bazel

```starlark
load(
    "@rules_runpod//runpod:defs.bzl",
    "runpod_job",
    "runpod_manifest",
    "runpod_pod",
)

# Smoke: exercise all three public macros end-to-end at build
# time. No actual pod is provisioned; the `bazel build` produces
# a JSON spec the CLI would consume at `bazel run` time once
# the v0.0.2 `runpod_job_run` action is in place.

runpod_manifest(
    name = "smoke",
    src = "runpod-smoke.toml",
    workdir = ".",
    outputs = ["out"],
)

runpod_job(
    name = "smoke_job",
    manifest = ":smoke",
    pod_type = "NVIDIA GeForce RTX 4090",
    image = "runpod/pytorch:2.5.1-py3.11-cuda12.4.1-devel-ubuntu22.04",
    env = {"PYTHONUNBUFFERED": "1"},
    secrets = ["RUNPOD_API_KEY"],
    max_minutes = 30,
)

runpod_pod(
    name = "smoke_service",
    image = "runpod/pytorch:2.5.1-py3.11-cuda12.4.1-devel-ubuntu22.04",
    pod_type = "NVIDIA GeForce RTX 4090",
    ports = [50063, 11434],
    secrets = ["RUNPOD_API_KEY", "HF_TOKEN"],
)
```
