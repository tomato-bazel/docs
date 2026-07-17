---
title: "Overview"
module: "pinax"
---

Document-to-structure extraction. Takes a binary document (PDF today; DOCX
and others on the roadmap) and emits a stream of typed `DocumentPart`
records — paragraphs, headings, tables, embedded images, page contexts —
via an [Apache Beam](https://beam.apache.org/) pipeline.

The name is from Greek *πίναξ*: a wax tablet or, more aptly, the *Pinakes*
that Callimachus compiled at the Library of Alexandria — a catalog of
works broken into their constituent parts.

## What's in it

| Surface | Where |
|---|---|
| Beam pipeline (main entry)        | [src/main/java/pinax/PdfBeamPipeline.java](https://github.com/mattmarshall/pinax/blob/main/src/main/java/pinax/PdfBeamPipeline.java) |
| Beam DoFns                        | [src/main/java/pinax/beam/dofns/](https://github.com/mattmarshall/pinax/blob/main/src/main/java/pinax/beam/dofns/) (11 files) |
| Beam transforms                   | [src/main/java/pinax/beam/transforms/](https://github.com/mattmarshall/pinax/blob/main/src/main/java/pinax/beam/transforms/) |
| Beam utilities                    | [src/main/java/pinax/beam/util/](https://github.com/mattmarshall/pinax/blob/main/src/main/java/pinax/beam/util/) |
| JSONL post-processors             | [src/main/java/pinax/process/](https://github.com/mattmarshall/pinax/blob/main/src/main/java/pinax/process/) |
| Service contract                  | [proto/pdf_extraction.proto](https://github.com/mattmarshall/pinax/blob/main/proto/pdf_extraction.proto) — `package pinax.v1` |
| `DocumentPart` record             | [proto/document_processing.proto](https://github.com/mattmarshall/pinax/blob/main/proto/document_processing.proto) — `package pinax.v1` |
| Low-level PDF model               | [proto/pdf_model.proto](https://github.com/mattmarshall/pinax/blob/main/proto/pdf_model.proto) — `package pdfmodel` |
| Tooling                           | [tools/](https://github.com/mattmarshall/pinax/blob/main/tools/) |

## Using pinax from a Bazel workspace

In the consumer's `MODULE.bazel`:

```python
bazel_dep(name = "pinax", version = "0.1.0")
local_path_override(
    module_name = "pinax",
    path = "../pinax",
)
```

In a `BUILD.bazel`:

```python
java_library(
    name = "my_extractor",
    srcs = [...],
    deps = [
        "@pinax//src/main/java/pinax:beam_pipeline",
        "@pinax//src/main/java/pinax/process",
        "@pinax//proto:document_processing_java_proto_library",
        "@pinax//proto:pdf_extraction_java_proto_library",
    ],
)
```

## Service contract

`PdfExtractionJob` (in [proto/pdf_extraction.proto](https://github.com/mattmarshall/pinax/blob/main/proto/pdf_extraction.proto))
is a Google-API-style long-running operation. Wire a host service that
runs the Beam pipeline on each `PdfExtractionJob` and reports completion
via the LRO.

## Running locally

```bash
bazel test //src/test/java/pinax/process:document_part_processor_test
bazel run  //tools:pdf_parts_beam_pipeline -- /path/to/input.pdf /path/to/output_dir
```

## Development

```bash
bazel build //...
bazel test //...
```

## Roadmap

- DOCX support (open the `pinax.v1.DocumentSource` to non-PDF sources).
- Add a generic `extract_document_part_v1` proto opcode the host service
  can issue without naming a concrete format.
- gRPC server reference impl for `PdfExtractionService`.

## License

TBD (private repo).
