export type AstNodeType = 'heading' | 'paragraph' | 'list_item' | 'blockquote';

export interface AstNode {
  type: AstNodeType;
  level?: number; // 1-6 for headings
  text: string;
  startLine: number;
  endLine: number;
}

export interface ParsedDocument {
  filePath: string;
  frontmatter?: Record<string, any>;
  nodes: AstNode[];
}

/**
 * Parses markdown content into a structured AST of semantic blocks,
 * rigorously filtering YAML frontmatter, code blocks, and raw HTML.
 */
export function parseMarkdown(filePath: string, content: string): ParsedDocument {
  const lines = content.split(/\r?\n/);
  const nodes: AstNode[] = [];

  let inFrontmatter = false;
  let inCodeBlock = false;
  let codeFenceChar = '';
  let inHtmlComment = false;

  let currentBlockType: AstNodeType | null = null;
  let currentBlockLines: string[] = [];
  let currentStartLine = 1;
  let currentLevel: number | undefined = undefined;

  function flushCurrentBlock(endLine: number) {
    if (!currentBlockType || currentBlockLines.length === 0) {
      currentBlockType = null;
      currentBlockLines = [];
      return;
    }

    const rawText = currentBlockLines.join('\n').trim();
    if (rawText.length > 0) {
      nodes.push({
        type: currentBlockType,
        level: currentLevel,
        text: rawText,
        startLine: currentStartLine,
        endLine: Math.max(currentStartLine, endLine)
      });
    }

    currentBlockType = null;
    currentBlockLines = [];
    currentLevel = undefined;
  }

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Check YAML Frontmatter
    if (i === 0 && (trimmed === '---' || trimmed === '+++')) {
      inFrontmatter = true;
      continue;
    }
    if (inFrontmatter) {
      if (trimmed === '---' || trimmed === '+++') {
        inFrontmatter = false;
      }
      continue;
    }

    // 2. Check HTML Comments
    if (!inCodeBlock && trimmed.startsWith('<!--')) {
      inHtmlComment = true;
    }
    if (inHtmlComment) {
      if (trimmed.includes('-->')) {
        inHtmlComment = false;
      }
      continue;
    }

    // 3. Check Code Blocks (fenced ``` or ~~~)
    const codeFenceMatch = trimmed.match(/^(`{3,}|~{3,})/);
    if (codeFenceMatch) {
      const fence = codeFenceMatch[1];
      if (!inCodeBlock) {
        flushCurrentBlock(lineNum - 1);
        inCodeBlock = true;
        codeFenceChar = fence[0];
        continue;
      } else if (fence.startsWith(codeFenceChar)) {
        inCodeBlock = false;
        codeFenceChar = '';
        continue;
      }
    }

    if (inCodeBlock) {
      continue;
    }

    // 4. Blank line triggers block flushing
    if (trimmed.length === 0) {
      flushCurrentBlock(lineNum - 1);
      continue;
    }

    // 5. Headings: # H1, ## H2, etc.
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushCurrentBlock(lineNum - 1);
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();
      nodes.push({
        type: 'heading',
        level,
        text: headingText,
        startLine: lineNum,
        endLine: lineNum
      });
      continue;
    }

    // 6. Blockquotes: > quote
    if (trimmed.startsWith('>')) {
      if (currentBlockType !== 'blockquote') {
        flushCurrentBlock(lineNum - 1);
        currentBlockType = 'blockquote';
        currentStartLine = lineNum;
      }
      currentBlockLines.push(line.replace(/^>\s?/, ''));
      continue;
    }

    // 7. List Items: - item, * item, 1. item
    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
    if (listMatch) {
      // If continuing an existing paragraph/list or new list item
      if (currentBlockType !== 'list_item' && currentBlockType !== 'paragraph') {
        flushCurrentBlock(lineNum - 1);
        currentBlockType = 'list_item';
        currentStartLine = lineNum;
      } else if (currentBlockType === null) {
        currentBlockType = 'list_item';
        currentStartLine = lineNum;
      }
      currentBlockLines.push(line);
      continue;
    }

    // 8. Normal prose paragraph
    if (currentBlockType === null) {
      currentBlockType = 'paragraph';
      currentStartLine = lineNum;
    }
    currentBlockLines.push(line);
  }

  // Flush remaining block
  flushCurrentBlock(lines.length);

  return {
    filePath,
    nodes
  };
}
