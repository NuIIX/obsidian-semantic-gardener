import { Diff, type Change } from 'diff';

/**
 * Unicode-aware word-level diffing that supports Cyrillic, Latin, and all UTF-8 scripts seamlessly.
 */
class UnicodeWordDiff extends Diff {
  tokenize(value: string): string[] {
    // Splits by unicode words or whitespace/punctuation delimiters, preserving delimiters
    return value.split(/([^\S\r\n]+|[^\p{L}\p{N}_]+)/u).filter(Boolean);
  }
}

const unicodeWordDiffInstance = new UnicodeWordDiff();

export function diffWordsUnicode(oldStr: string, newStr: string): Change[] {
  return unicodeWordDiffInstance.diff(oldStr || '', newStr || '');
}
