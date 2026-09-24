export const refactorEngineSchema = {
  type: "OBJECT",
  properties: {
    isDuplicate: { 
      type: "BOOLEAN", 
      description: "True only if the excerpts describe the exact same entity/concept in compatible domains. False if homonyms or cross-domain metaphors." 
    },
    rejectionReason: { 
      type: "STRING", 
      description: "Brief 1-2 sentence explanation if isDuplicate is false. MUST BE EMPTY STRING '' if isDuplicate is true." 
    },
    conceptTitle: { 
      type: "STRING", 
      description: "Concise, canonical title for the new atomic note (no forbidden characters like : / \\ * ? \" < > |)" 
    },
    canonicalNoteMarkdown: { 
      type: "STRING", 
      description: "Comprehensive atomic note body in Markdown: definition, core mechanisms, formulas, and context." 
    },
    modifications: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          filePath: { 
            type: "STRING",
            description: "The path of the source file being modified"
          },
          originalSpan: { 
            type: "STRING", 
            description: "Exact substring from the original file to be replaced" 
          },
          suggestedInlineSpan: { 
            type: "STRING", 
            description: "Micro-surgical replacement that strictly preserves the author's tone, punctuation, and voice, embedding [[conceptTitle]] or [[conceptTitle|alias]]" 
          },
          transclusionSpan: { 
            type: "STRING", 
            description: "Transclusion replacement format ![[conceptTitle]]" 
          }
        },
        required: ["filePath", "originalSpan", "suggestedInlineSpan", "transclusionSpan"]
      }
    }
  },
  required: ["isDuplicate"]
};

export interface GeminiRefactorResponse {
  isDuplicate: boolean;
  rejectionReason?: string;
  conceptTitle?: string;
  canonicalNoteMarkdown?: string;
  modifications?: Array<{
    filePath: string;
    originalSpan: string;
    suggestedInlineSpan: string;
    transclusionSpan: string;
  }>;
}
