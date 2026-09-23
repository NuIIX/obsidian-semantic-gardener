# Semantic Gardener

[![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-purple?logo=obsidian)](https://obsidian.md)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Svelte 5](https://img.shields.io/badge/UI-Svelte%205-orange?logo=svelte)](https://svelte.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Semantic Gardener** is an automated knowledge-gardening assistant for Obsidian. It identifies semantic duplicates and fragmented definitions scattered across your vault, synthesizes canonical atomic notes, and surgically weaves `[[wikilinks]]` back into your writing — with zero loss of author voice and full human review.

Unlike basic search tools or blind background agents, Semantic Gardener uses a **hybrid local-vector + LLM pipeline** with a strict **Human-in-the-Loop review interface** and a **1-click transactional undo engine**.

---

## Key Highlights

* **Local In-Vault Embeddings:** Indexes notes in background Web Workers using `@xenova/transformers` (multilingual MiniLM ONNX). No raw vault text leaves your machine during scanning.
* **Context Breadcrumbs:** Deduplication considers structural hierarchy (`Folder > File > H1 > H2`). It avoids false positives by distinguishing homonyms across different domains (e.g., *bottleneck* in hardware vs. *bottleneck* in supply chain).
* **Gatekeeper AI Validation:** Integrates with Google Gemini 3.5 Flash via BYOK (Bring Your Own Key) to verify duplicate intent before suggesting modifications.
* **Micro-Surgical Replacements:** Preserves your natural writing style. The engine targets only the minimal defining clause, swapping it with an inline link, alias (`[[Concept|Alias]]`), or synced transclusion (`![[Concept]]`).
* **Interactive Diff Master:** Review every single proposal side-by-side (via word-level diffs). Accept, modify, or reject changes per file.
* **Rock-Solid Data Safety:** Every accepted batch writes a snapshot to the transaction journal. Made a mistake? Hit **Undo Last Refactor** to restore your exact previous state instantly.

---

## How It Works

```text
[ Obsidian Vault ]
       │
       ▼ (1. AST Parsing & Context Breadcrumbs)
[ Semantic Chunks ]
       │
       ▼ (2. Background Web Worker: @xenova/transformers)
[ Vector Index (IndexedDB) ] ──► Cosine Similarity Clustering (>0.82)
       │
       ▼ (3. Candidate Cluster to Gemini 3.5 Flash)
[ Gatekeeper & Surgical Replacer Engine ]
       │
       ▼ (4. Interactive Review Modal)
[ Svelte Diff Reviewer ] ──► (Accept / Inline / Transclude / Skip)
       │
       ▼ (5. Transaction Logging & Atomic Writes)
[ Vault Updated + 1-Click Snapshot Saved ]
