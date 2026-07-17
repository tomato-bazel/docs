---
title: "defs"
module: "rules_markdown"
---

<!-- Generated with Stardoc: http://skydoc.bazel.build -->

Public API for rules_markdown.

```starlark
load("@rules_markdown//markdown:defs.bzl", "markdown_fragment", "markdown_document")
```

<a id="markdown_fragment"></a>

## markdown_fragment

<pre>
load("@rules_markdown//markdown:defs.bzl", "markdown_fragment")

markdown_fragment(<a href="#markdown_fragment-name">name</a>, <a href="#markdown_fragment-deps">deps</a>, <a href="#markdown_fragment-src">src</a>, <a href="#markdown_fragment-anchor">anchor</a>, <a href="#markdown_fragment-classifiers">classifiers</a>, <a href="#markdown_fragment-content">content</a>, <a href="#markdown_fragment-level">level</a>, <a href="#markdown_fragment-slot">slot</a>, <a href="#markdown_fragment-title">title</a>, <a href="#markdown_fragment-weight">weight</a>)
</pre>

Declare one composable markdown fragment (a section of a document).

**ATTRIBUTES**


| Name  | Description | Type | Mandatory | Default |
| :------------- | :------------- | :------------- | :------------- | :------------- |
| <a id="markdown_fragment-name"></a>name |  A unique name for this target.   | <a href="https://bazel.build/concepts/labels#target-names">Name</a> | required |  |
| <a id="markdown_fragment-deps"></a>deps |  Child fragments folded in transitively.   | <a href="https://bazel.build/concepts/labels">List of labels</a> | optional |  `[]`  |
| <a id="markdown_fragment-src"></a>src |  The fragment body (.md). Mutually exclusive with `content`.   | <a href="https://bazel.build/concepts/labels">Label</a> | optional |  `None`  |
| <a id="markdown_fragment-anchor"></a>anchor |  Explicit deep-link handle (defaults to the target name). Reference it elsewhere as `mdref:<handle>`.   | String | optional |  `""`  |
| <a id="markdown_fragment-classifiers"></a>classifiers |  Free-form classifiers (e.g. category/section); exposed in fragment metadata.   | List of strings | optional |  `[]`  |
| <a id="markdown_fragment-content"></a>content |  Inline fragment body. Mutually exclusive with `src`.   | String | optional |  `""`  |
| <a id="markdown_fragment-level"></a>level |  Heading level for `title` (default 2 -> `##`).   | Integer | optional |  `2`  |
| <a id="markdown_fragment-slot"></a>slot |  Target a named template placeholder `<!-- FRAGMENTS:<slot> -->` (for generated content placed at a specific spot). Default: the unnamed `<!-- FRAGMENTS -->`.   | String | optional |  `""`  |
| <a id="markdown_fragment-title"></a>title |  Section heading text. If set, md_gen injects a `level` heading; it's also the deep-link target.   | String | optional |  `""`  |
| <a id="markdown_fragment-weight"></a>weight |  Sort key within the document (ascending).   | Integer | optional |  `0`  |


<a id="MarkdownDocInfo"></a>

## MarkdownDocInfo

<pre>
load("@rules_markdown//markdown:defs.bzl", "MarkdownDocInfo")

MarkdownDocInfo(<a href="#MarkdownDocInfo-md">md</a>, <a href="#MarkdownDocInfo-anchor_index">anchor_index</a>, <a href="#MarkdownDocInfo-fragments">fragments</a>)
</pre>

A rendered markdown document — exposed so a doc can be embedded, link-checked, or published without re-rendering.

**FIELDS**

| Name  | Description |
| :------------- | :------------- |
| <a id="MarkdownDocInfo-md"></a>md |  File: the rendered document.    |
| <a id="MarkdownDocInfo-anchor_index"></a>anchor_index |  File: JSON map of deep-link handle -> final in-doc anchor slug.    |
| <a id="MarkdownDocInfo-fragments"></a>fragments |  depset of the fragment structs that composed it.    |


<a id="MarkdownFragmentInfo"></a>

## MarkdownFragmentInfo

<pre>
load("@rules_markdown//markdown:defs.bzl", "MarkdownFragmentInfo")

MarkdownFragmentInfo(<a href="#MarkdownFragmentInfo-fragments">fragments</a>)
</pre>

A markdown fragment + its metadata, gathered transitively by markdown_link_aspect. Each contribution is a hashable struct so it can ride a depset.

**FIELDS**

| Name  | Description |
| :------------- | :------------- |
| <a id="MarkdownFragmentInfo-fragments"></a>fragments |  depset of struct(frag_id, md_file, title, level, weight, handle, tags).    |


<a id="markdown_document"></a>

## markdown_document

<pre>
load("@rules_markdown//markdown:defs.bzl", "markdown_document")

markdown_document(<a href="#markdown_document-name">name</a>, <a href="#markdown_document-out">out</a>, <a href="#markdown_document-template">template</a>, <a href="#markdown_document-fragments">fragments</a>, <a href="#markdown_document-roots">roots</a>, <a href="#markdown_document-toc">toc</a>, <a href="#markdown_document-link_check">link_check</a>, <a href="#markdown_document-write_to">write_to</a>, <a href="#markdown_document-kwargs">**kwargs</a>)
</pre>

Aggregate fragments into one rendered markdown document.

**PARAMETERS**


| Name  | Description | Default Value |
| :------------- | :------------- | :------------- |
| <a id="markdown_document-name"></a>name |  target name.   |  none |
| <a id="markdown_document-out"></a>out |  output filename (defaults to `<name>.md`).   |  `None` |
| <a id="markdown_document-template"></a>template |  optional prose template with `<!-- FRAGMENTS -->` + `<!-- TOC -->`.   |  `None` |
| <a id="markdown_document-fragments"></a>fragments |  fragment targets to compose.   |  `[]` |
| <a id="markdown_document-roots"></a>roots |  arbitrary targets whose graph contributes fragments (via the aspect).   |  `[]` |
| <a id="markdown_document-toc"></a>toc |  emit a table of contents.   |  `True` |
| <a id="markdown_document-link_check"></a>link_check |  fail on a dangling `mdref:` deep link.   |  `True` |
| <a id="markdown_document-write_to"></a>write_to |  if set (a source-relative path), also create `<name>.write` (`bazel run` materializes the doc into the tree) + `<name>.write_test` (drift gate), via write_source_files.   |  `None` |
| <a id="markdown_document-kwargs"></a>kwargs |  forwarded (visibility, tags, …).   |  none |


<a id="markdown_link_aspect"></a>

## markdown_link_aspect

<pre>
load("@rules_markdown//markdown:defs.bzl", "markdown_link_aspect")

markdown_link_aspect()
</pre>

Walk deps/fragments/roots edges collecting markdown fragment contributions.

**ASPECT ATTRIBUTES**


| Name | Type |
| :------------- | :------------- |
| deps| String |
| fragments| String |
| roots| String |


**ATTRIBUTES**
