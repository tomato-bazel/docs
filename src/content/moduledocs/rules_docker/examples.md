---
title: "Usage"
module: "rules_docker"
---

Real usage, taken from the module's `examples/`.

### examples/configs_secrets/BUILD.bazel

```starlark
load("@bazel_skylib//rules:diff_test.bzl", "diff_test")
load(
    "@rules_docker_compose//compose:defs.bzl",
    "docker_compose",
    "docker_compose_config",
    "docker_compose_network",
    "docker_compose_secret",
    "docker_compose_service",
)

# Demonstrates the v0.2.0 top-level `configs:` + `secrets:` rules. Both
# replace the previous workaround of bind-mounting config files via the
# per-service `volumes:` block; compose-spec's `configs:` semantics
# (immutable, project-scoped, mountable into multiple services from a
# single source) are now first-class.

docker_compose_network(name = "appnet", driver = "bridge")

# Top-level config — file-backed. Referenced by `app` via the
# schema-derived `configs = ["prometheus"]` list.
docker_compose_config(
    name = "prometheus",
    src = "prometheus.yml",
)

# Top-level secret — file-backed. Referenced by `app` via `secrets`.
docker_compose_secret(
    name = "api_key",
    src = "api_key.txt",
)

# Top-level secret — environment-backed. Demonstrates the alternative
# source path; compose reads the env var's value at runtime.
docker_compose_secret(
    name = "session_key",
    environment = "SESSION_KEY",
)

docker_compose_service(
    name = "app",
    image = "nginx:1.27",
    configs = ["prometheus"],
    secrets = [
        "api_key",
        "session_key",
    ],
    networks = ["appnet"],
)

docker_compose(
    name = "stack",
    project_name = "configs_secrets",
    out = "compose.yaml",
    deps = [
        ":api_key",
        ":app",
        ":appnet",
        ":prometheus",
        ":session_key",
    ],
)

# Pin the rendered output so intentional rule changes show up in PR review.
diff_test(
    name = "stack_yaml_up_to_date",
    file1 = "expected.yaml",
    file2 = ":stack",
)
```

### examples/coverage/BUILD.bazel

```starlark
load("@bazel_skylib//rules:diff_test.bzl", "diff_test")
load(
    "@rules_docker_compose//compose:defs.bzl",
    "docker_compose",
    "docker_compose_network",
    "docker_compose_service_raw",
    "docker_compose_volume",
)

# Exercises the schema-derived raw rule's long-tail attrs (build, labels,
# shm_size, stop_grace_period, cap_add, sysctls, …) that aren't lifted
# into the v0.2 public façade. Consumers needing these reach for
# `docker_compose_service_raw`; the façade `docker_compose_service`
# covers the high-traffic 80% of services without exposing the full
# 95-attr schema-derived surface.
docker_compose_service = docker_compose_service_raw

docker_compose_network(
    name = "internal",
    driver = "bridge",
    driver_opts = {"com.docker.network.bridge.name": "covnet0"},
    internal = True,
    attachable = True,
    labels = {"tier": "internal"},
)

docker_compose_network(
    name = "external_net",
    external = True,
    name_override = "shared_public",
)

docker_compose_volume(
    name = "shared",
    driver = "local",
    driver_opts = {
        "type": "none",
        "device": "/var/lib/cov/shared",
        "o": "bind",
    },
    labels = {"backup": "nightly"},
    name_override = "cov_shared",
)

docker_compose_volume(
    name = "ext",
    external = True,
)

docker_compose_service(
    name = "api",
    build = json.encode({
        "context": "./api",
        "dockerfile": "Dockerfile.api",
        "target": "runtime",
        "args": {
            "BUILD_VERSION": "1.2.3",
            "GIT_SHA": "abc123",
        },
    }),
    entrypoint = ["/bin/sh", "-c"],
    command = ["./bin/api --listen :8080"],
    environment = {"LOG_LEVEL": "info"},
    env_file = [".env", ".env.local"],
    working_dir = "/srv/api",
    user = "1000:1000",
    hostname = "api-host",
    labels = {
        "traefik.enable": "true",
        "traefik.http.routers.api.rule": "Host(`api.example.com`)",
    },
    profiles = ["dev", "prod"],
    # Networks/volumes are addressed by their *Starlark name* (which
    # becomes the top-level compose key), not by their `name_override`
    # — the override is the runtime resource name, not the lookup key.
    networks = [
        "internal",
        "external_net",
    ],
    volumes = ["shared:/srv/shared"],
    healthcheck = json.encode({
        "test": ["CMD-SHELL", "curl -fsS http://localhost:8080/healthz || exit 1"],
        "interval": "30s",
        "timeout": "5s",
        "retries": 5,
        "start_period": "20s",
    }),
    # These used to require `extra_config`; with v0.2 codegen they're
    # first-class typed Bazel attrs derived from the spec.
    init = True,
    shm_size = "256m",
    stop_grace_period = "1m30s",
    cap_add = ["NET_ADMIN", "SYS_TIME"],
    sysctls = {"net.core.somaxconn": "1024"},
)

docker_compose(
    name = "stack",
    project_name = "coverage",
    deps = [
        ":api",
        ":ext",
        ":external_net",
        ":internal",
        ":shared",
    ],
    out = "compose.yaml",
)

diff_test(
    name = "stack_yaml_up_to_date",
    file1 = "expected.yaml",
    file2 = ":stack",
)
```

### examples/smoke/BUILD.bazel

```starlark
load("@bazel_skylib//rules:diff_test.bzl", "diff_test")
load(
    "@rules_docker_compose//compose:defs.bzl",
    "docker_compose",
    "docker_compose_command",
    "docker_compose_down",
    "docker_compose_exec",
    "docker_compose_network",
    "docker_compose_run",
    "docker_compose_service",
    "docker_compose_up",
    "docker_compose_volume",
)

# Two-service stack (nginx + redis) using one named volume and one
# private network. Plus a worker service whose image is supplied at
# build time from an OCI image layout label.
#
# This example exercises the v0.2 docker_compose_service façade:
#   * `deps`, `networks`, `named_volume_mounts` are label_lists / dicts.
#   * `oci_image` is a label that the façade resolves to
#     `<repo>@sha256:<digest>` at build time (replaces the separate
#     `docker_compose_oci_image_ref` target previously needed for that).
#   * `healthcheck` is JSON-encoded (no schema-derived typed attr exists
#     for the nested healthcheck object).

docker_compose_network(
    name = "appnet",
    driver = "bridge",
)

docker_compose_volume(name = "cache")

docker_compose_service(
    name = "redis",
    image = "redis:7",
    networks = [":appnet"],
    named_volume_mounts = {":cache": "/data"},
    healthcheck = json.encode({
        "test": ["CMD", "redis-cli", "ping"],
        "interval": "10s",
        "retries": 3,
    }),
)

docker_compose_service(
    name = "web",
    image = "nginx:1.27",
    ports = ["8080:80"],
    networks = [":appnet"],
    deps = [":redis"],
    restart = "unless-stopped",
    environment = {
        "NGINX_HOST": "example.local",
    },
)

# OCI image source — a real repo would point this at `oci_pull` or
# `oci_image`; the fixture keeps the test hermetic.
filegroup(
    name = "fake_alpine_layout",
    srcs = glob(["fake_oci_layout/**"]),
)

docker_compose_service(
    name = "worker",
    oci_image = ":fake_alpine_layout",
    oci_repo = "ghcr.io/fastverk/example-worker",
    command = ["echo", "hello from worker"],
    networks = [":appnet"],
)

docker_compose(
    name = "stack",
    project_name = "smoke",
    # Root services only — `_compose_transitive_aspect` walks each
    # service's `deps`/`networks`/`named_volume_mounts` to discover the
    # volume, network, and image-ref shards automatically.
    deps = [
        ":web",
        ":worker",
    ],
    out = "compose.yaml",
)

docker_compose_up(
    name = "stack.up",
    project = ":stack",
)

docker_compose_down(
    name = "stack.down",
    project = ":stack",
)

# `bazel run :redis.shell` -> docker compose -f <yml> exec -T redis redis-cli
docker_compose_exec(
    name = "redis.shell",
    project = ":stack",
    service = "redis",
    command = ["redis-cli"],
    no_tty = True,
)

# `bazel run :worker.once -- --extra-arg` -> docker compose -f <yml> run --rm
# worker echo "smoke run" --extra-arg
docker_compose_run(
    name = "worker.once",
    project = ":stack",
    service = "worker",
    command = ["echo", "smoke run"],
)

# `bazel run :stack.logs -- redis` -> docker compose -f <yml> logs -f redis
docker_compose_command(
    name = "stack.logs",
    project = ":stack",
    subcommand = "logs",
    args = ["-f"],
)

# Pins the entire end-to-end output. Refresh the committed
# `expected.yaml` after intentional rule changes with:
#   bazel build //examples/smoke:stack
#   cp bazel-bin/examples/smoke/compose.yaml examples/smoke/expected.yaml
diff_test(
    name = "stack_yaml_up_to_date",
    file1 = "expected.yaml",
    file2 = ":stack",
)
```
