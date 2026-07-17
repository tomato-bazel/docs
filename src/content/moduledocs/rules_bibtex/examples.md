---
title: "Usage"
module: "rules_bibtex"
---

Real usage, taken from the module's `examples/`.

### examples/citations_only/BUILD.bazel

```starlark
load(
    "@rules_bibtex//bib:defs.bzl",
    "arxiv_paper",
    "doi_paper",
    "manual_citation",
    "research_graph",
)

# Three citations covering the three source kinds + a transitive
# edge for the research-graph demo.

arxiv_paper(
    name = "vaswani2017attention",
    arxiv_id = "1706.03762v7",
    doi = "10.5555/3295222.3295349",
    bibtex = """@inproceedings{vaswani2017attention,
  title = {Attention Is All You Need},
  author = {Vaswani, Ashish and Shazeer, Noam and Parmar, Niki and Uszkoreit, Jakob and Jones, Llion and Gomez, Aidan N. and Kaiser, Lukasz and Polosukhin, Illia},
  booktitle = {NeurIPS},
  year = {2017},
  eprint = {1706.03762},
  archivePrefix = {arXiv},
}""",
)

arxiv_paper(
    name = "lewis2020rag",
    arxiv_id = "2005.11401v4",
    doi = "10.5555/3495724.3496517",
    bibtex = """@inproceedings{lewis2020rag,
  title = {Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks},
  author = {Lewis, Patrick and Perez, Ethan and Piktus, Aleksandra and Petroni, Fabio and Karpukhin, Vladimir and Goyal, Naman and K{\\"u}ttler, Heinrich and Lewis, Mike and Yih, Wen-tau and Rockt{\\"a}schel, Tim and Riedel, Sebastian and Kiela, Douwe},
  booktitle = {NeurIPS},
  year = {2020},
  eprint = {2005.11401},
  archivePrefix = {arXiv},
}""",
    # lewis2020rag references attention-is-all-you-need; the research
    # graph picks this up.
    cites = [":vaswani2017attention"],
)

doi_paper(
    name = "banarescu2013amr",
    doi = "10.18653/v1/W13-2322",
    bibtex = """@inproceedings{banarescu2013amr,
  title = {Abstract Meaning Representation for Sembanking},
  author = {Banarescu, Laura and Bonial, Claire and Cai, Shu and Georgescu, Madalina and Griffitt, Kira and Hermjakob, Ulf and Knight, Kevin and Koehn, Philipp and Palmer, Martha and Schneider, Nathan},
  booktitle = {Proceedings of the 7th Linguistic Annotation Workshop at ACL},
  year = {2013},
}""",
)

manual_citation(
    name = "mcp2024",
    snapshot_url = "https://modelcontextprotocol.io/specification/2024-11-05",
    bibtex = """@misc{mcp2024,
  title = {Model Context Protocol},
  author = {{Anthropic}},
  year = {2024},
  url = {https://modelcontextprotocol.io/specification/2024-11-05},
  note = {Specification},
}""",
)

# Research graph over the four citations + the cites-edge between
# lewis2020rag and vaswani2017attention.
research_graph(
    name = "demo_closure",
    roots = [
        ":lewis2020rag",
        ":banarescu2013amr",
        ":mcp2024",
    ],
)
```
