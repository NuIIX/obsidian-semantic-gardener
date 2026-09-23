import type { SemanticChunk } from '../types/index.ts';
import { parseMarkdown } from './parser.ts';
import { sha256 } from './hasher.ts';

export interface ChunkingOptions {
  minChunkLength?: number;
}

interface HeadingItem {
  level: number;
  text: string;
}

/**
 * Splits a markdown document into semantic chunks with Context Breadcrumbs.
 * Each chunk incorporates hierarchical heading context:
 * [File: Folder/Note.md > H1 > H2 > H3]
 * to prevent false homonym matches across unrelated knowledge domains.
 */
export async function chunkMarkdown(
  filePath: string,
  content: string,
  options: ChunkingOptions = {}
): Promise<SemanticChunk[]> {
  const minLength = options.minChunkLength ?? 40;
  const parsed = parseMarkdown(filePath, content);
  const chunks: SemanticChunk[] = [];

  const headingStack: HeadingItem[] = [];

  for (const node of parsed.nodes) {
    if (node.type === 'heading') {
      const level = node.level || 1;

      // Pop headings from stack that are at or deeper than the current level
      while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
        headingStack.pop();
      }

      headingStack.push({ level, text: node.text });
      continue;
    }

    // Skip short or non-substantive text
    const cleanText = node.text.trim();
    if (cleanText.length < minLength) {
      continue;
    }

    // Skip blocks that are purely links or metadata (e.g. [[Link1]] [[Link2]])
    const strippedLinks = cleanText.replace(/\[\[[^\]]+\]\]/g, '').replace(/https?:\/\/\S+/g, '').trim();
    if (strippedLinks.length < 15) {
      continue;
    }

    // Format breadcrumbs: [Folder/Note.md > H1 > H2]
    const breadcrumbSegments = [filePath, ...headingStack.map(h => h.text)];
    const breadcrumbs = `[${breadcrumbSegments.join(' > ')}]`;
    const fullContext = `${breadcrumbs}\n${cleanText}`;
    const hash = await sha256(cleanText);

    chunks.push({
      id: hash,
      filePath,
      text: cleanText,
      breadcrumbs,
      fullContext,
      startLine: node.startLine,
      endLine: node.endLine
    });
  }

  return chunks;
}
