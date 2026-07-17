---
title: "Usage"
module: "rules_autoconf"
---

Real usage, taken from the module's `examples/`.

### examples/hello/BUILD.bazel

```starlark
load(
    "@rules_autoconf//autoconf:defs.bzl",
    "cc_check_function",
    "cc_check_header",
    "config_header",
)

# Header probes — should succeed for std headers, fail for the fake one.
cc_check_header(
    name = "have_stdio_h",
    header = "stdio.h",
)

cc_check_header(
    name = "have_string_h",
    header = "string.h",
)

cc_check_header(
    name = "have_fake_h",
    header = "this_header_does_not_exist.h",
)

# Function probes — strlen is libc; nonexistent_function_42 isn't.
cc_check_function(
    name = "have_strlen",
    function = "strlen",
    header = "string.h",
)

cc_check_function(
    name = "have_nonexistent",
    define_name = "HAVE_NONEXISTENT_FUNCTION_42",
    function = "nonexistent_function_42",
)

# Compose probes + static defines into config.h.
config_header(
    name = "config_h",
    out = "config.h",
    defines = {
        "PACKAGE_NAME": "\"hello\"",
        "PACKAGE_VERSION": "\"0.1.0\"",
    },
    probes = [
        ":have_stdio_h",
        ":have_string_h",
        ":have_fake_h",
        ":have_strlen",
        ":have_nonexistent",
    ],
    template = "config.h.in",
)
```
