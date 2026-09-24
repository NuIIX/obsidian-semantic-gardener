export const refactorEngineSchema = {
  type: "OBJECT",
  properties: {
    isDuplicate: { 
      type: "BOOLEAN", 
      description: "True only if excerpts describe the exact same entity/concept in compatible domains. False if homonyms or cross-domain metaphors." 
    },
    conceptTitle: { 
      type: "STRING", 
      description: "Concise canonical title for the atomic note. If isDuplicate is false, leave empty." 
    },
    aliases: {
      type: "ARRAY",
      description: "Synonyms, acronyms, or inflected forms for YAML aliases frontmatter (e.g. ['WIP limit', 'лимит WIP']).",
      items: { type: "STRING" }
    },
    canonicalNoteMarkdown: { 
      type: "STRING", 
      description: "Comprehensive atomic note body in Markdown. If isDuplicate is false, leave empty." 
    },
    modifications: {
      type: "ARRAY",
      description: "REQUIRED when isDuplicate is true: list of exact replacements, one for EVERY input fragment.",
      items: {
        type: "OBJECT",
        properties: {
          filePath: { 
            type: "STRING",
            description: "The exact path of the source file being modified"
          },
          originalSpan: { 
            type: "STRING", 
            description: "Exact substring from the original fragment text to be replaced (must match verbatim)" 
          },
          suggestedInlineSpan: { 
            type: "STRING", 
            description: "Micro-surgical replacement embedding [[conceptTitle]] or [[conceptTitle|alias]]" 
          },
          transclusionSpan: { 
            type: "STRING", 
            description: "Transclusion replacement format ![[conceptTitle]]" 
          }
        },
        required: ["filePath", "originalSpan", "suggestedInlineSpan", "transclusionSpan"]
      }
    },
    rejectionReason: { 
      type: "STRING", 
      description: "Brief 1-sentence explanation ONLY if isDuplicate is false. MUST BE EMPTY STRING '' if isDuplicate is true." 
    }
  },
  required: ["isDuplicate"]
};

export interface GeminiRefactorResponse {
  isDuplicate: boolean;
  rejectionReason?: string;
  conceptTitle?: string;
  aliases?: string[];
  canonicalNoteMarkdown?: string;
  modifications?: Array<{
    filePath: string;
    originalSpan: string;
    suggestedInlineSpan: string;
    transclusionSpan: string;
  }>;
}
