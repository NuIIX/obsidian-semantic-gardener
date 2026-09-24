import { diffLines, type Change } from 'diff';

export interface NoteComparisonResult {
  similarityScore: number; // 0.0 - 1.0
  similarityPercent: number; // 0 - 100
  isExactDuplicate: boolean;
  totalLinesA: number;
  totalLinesB: number;
  matchingLines: number;
  changes: Change[];
}

/**
 * Normalizes text for comparison (collapses multiple empty lines and normalizes line endings).
 */
function normalizeNoteText(text: string): string {
  return (text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

/**
 * Compares two note contents and returns detailed line-by-line diff and similarity metrics.
 */
export function compareNotes(contentA: string, contentB: string): NoteComparisonResult {
  const normA = normalizeNoteText(contentA);
  const normB = normalizeNoteText(contentB);

  if (normA === normB) {
    const lines = normA.length > 0 ? normA.split('\n').length : 0;
    return {
      similarityScore: 1.0,
      similarityPercent: 100,
      isExactDuplicate: true,
      totalLinesA: lines,
      totalLinesB: lines,
      matchingLines: lines,
      changes: [{ value: normA, count: lines }]
    };
  }

  const linesA = normA.length > 0 ? normA.split('\n') : [];
  const linesB = normB.length > 0 ? normB.split('\n') : [];

  const changes = diffLines(normA, normB);
  let matchingLines = 0;

  for (const part of changes) {
    if (!part.added && !part.removed) {
      matchingLines += part.count || 0;
    }
  }

  const totalLines = Math.max(linesA.length, linesB.length, 1);
  const similarityScore = Math.min(1.0, Math.max(0.0, matchingLines / totalLines));
  const similarityPercent = Math.round(similarityScore * 100);

  return {
    similarityScore,
    similarityPercent,
    isExactDuplicate: false,
    totalLinesA: linesA.length,
    totalLinesB: linesB.length,
    matchingLines,
    changes
  };
}
