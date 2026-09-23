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
* **Context Breadcrumbs:** Deduplication considers structural hierarchy (`[Folder/Note.md > H1 > H2 > H3]`). It avoids false positives by distinguishing homonyms across different domains (e.g., *bottleneck* in hardware vs. *bottleneck* in supply chain).
* **Gatekeeper AI Validation:** Integrates with Google Gemini (Gemini 3.5 Flash Lite) via BYOK (Bring Your Own Key) to verify duplicate intent before suggesting modifications.
* **Micro-Surgical Replacements:** Preserves your natural writing style. The engine targets only the minimal defining clause, swapping it with an inline link, alias (`[[Concept|Alias]]`), or synced transclusion (`![[Concept]]`).
* **Interactive Diff Master:** Review every single proposal side-by-side with word-level diffs (supporting Cyrillic, Latin, and multilingual scripts). Accept, modify, or reject changes per file.
* **Rock-Solid Data Safety:** Every accepted batch writes a snapshot to the transaction journal (`history.json`). Made a mistake? Hit **Undo Last Refactor** to restore your exact previous state instantly and trash the created atomic note.

---

## Architecture Pipeline

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        OBSIDIAN RUNTIME                                │
│                                                                        │
│  [Markdown Vault] ──(Vault Events)──► [Markdown Parser (AST)]          │
│                                                │                       │
│                                                ▼                       │
│                                      [Semantic Chunker]                │
│                                 + Context Breadcrumbs Engine           │
│                                 (Path > H1 > H2 > H3 + Text)           │
│                                                │                       │
│                           ┌────────────────────┴────────────────────┐  │
│                           ▼                                         ▼  │
│                   [SHA-256 Cache]                           [Web Worker]│
│                  (IndexedDB Key-Val)               (@xenova/transformers│
│                           │                        multilingual ONNX)  │
│                           │                                         │  │
│                           └─────────────────┬───────────────────────┘  │
│                                             ▼                          │
│                                     [Vector Index DB]                  │
│                                    (Float32Array Cache)                │
│                                             │                          │
│                                     (Cosine Sim > 0.82)                │
│                                             │                          │
│                                             ▼                          │
│                                    [Cluster Aggregator]                │
└─────────────────────────────────────────────┬──────────────────────────┘
                                              │ Candidate Clusters + Breadcrumbs
                                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        AI & REVISION PIPELINE                          │
│                                                                        │
│  [Candidate Cluster] ──► [Gemini 3.5 Flash Lite (Gatekeeper Mode)]          │
│                                    │                                   │
│                        (isDuplicate == false?) ──► [Discard Cluster]   │
│                                    │                                   │
│                                    ▼ (isDuplicate == true)             │
│                      [Surgical Span Replacer]                          │
│              (Outputs: conceptTitle + originalSpan + replacement)      │
│                                    │                                   │
│                                    ▼                                   │
│  [Svelte Review View] ◄──(Inline vs Transclusion / Diff Viewer)        │
│  (Accept / Reject per file / Edit Title & Content)                     │
│                                    │                                   │
│                                    ▼ On "Apply Refactor"               │
│  [Transaction & Undo Manager] ────► Records snapshot to history.json   │
│                                    │                                   │
│                                    ▼ Atomic Mutations                  │
│  [Vault Mutation Engine] ──(vault.create & vault.process)──► Files     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Getting Started

### 1. Installation

1. Clone or copy this repository into your vault's plugin folder:
   ```bash
   cd <your-vault>/.obsidian/plugins/
   git clone https://github.com/NuIIX/obsidian-semantic-gardener.git
   cd obsidian-semantic-gardener
   npm install --ignore-scripts
   npm run build
   ```
2. In Obsidian, go to **Settings > Community plugins**, reload, and enable **Semantic Gardener**.

### 2. Configuration

Open **Settings > Semantic Gardener**:
* **Google AI Studio API Key:** Enter your Gemini API key ([get one free here](https://aistudio.google.com/)).
* **Gemini Model:** Default is `gemini-3.5-flash-lite`.
* **Similarity Threshold:** Default is `0.82` (adjust between 0.70 and 0.95).
* **Concepts Folder:** Target directory for generated canonical notes (default `Concepts`).
* **Excluded Folders:** Comma-separated paths to ignore (e.g. `.obsidian, .trash, templates, archive`).

### 3. Usage & Commands

| Command | Description |
|---|---|
| `Scan vault for semantic duplicates` | Full vault scan: chunks notes, vectors via Web Worker, clusters matches, calls Gatekeeper AI. |
| `Find duplicates for active note` | Focused scan comparing the currently open note against your entire knowledge base. |
| `Open review view` | Opens the interactive Svelte 5 review panel on the right sidebar. |
| `Undo last refactor` | Instantly rolls back the latest batch changes and trashes the generated atomic note. |

---

## Development & Testing

```bash
# Install dependencies
npm install --ignore-scripts

# Run unit tests
npm test

# Build production bundle (main.js + worker.js + styles.css)
npm run build

# Watch mode for active development
npm run dev
```

---

## License

[MIT](LICENSE) © 2026 NuIIX
