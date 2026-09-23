import { TFile } from 'obsidian';

export interface SemanticChunk {
  id: string; // SHA-256 hash of text
  filePath: string;
  text: string;
  breadcrumbs: string; // e.g. "[Path/To/File.md > H1 > H2]"
  fullContext: string; // `${breadcrumbs}\n${text}`
  startLine: number;
  endLine: number;
  embedding?: Float32Array;
  lastUpdated?: number;
}

export interface CandidateCluster {
  id: string;
  similarity: number;
  chunks: SemanticChunk[];
}

export type ModificationMode = 'inline' | 'transclusion' | 'skip';

export interface RefactorModification {
  filePath: string;
  originalSpan: string;
  suggestedInlineSpan: string;
  transclusionSpan: string;
  selectedMode: ModificationMode;
}

export interface RefactorPlan {
  id: string;
  clusterId: string;
  isDuplicate: boolean;
  rejectionReason?: string;
  conceptTitle?: string;
  canonicalNoteMarkdown?: string;
  modifications: RefactorModification[];
}

export interface FileBackup {
  path: string;
  content: string;
}

export interface Transaction {
  id: string;
  timestamp: number;
  conceptTitle: string;
  createdPath: string;
  createdContent: string;
  backups: FileBackup[];
}

export interface PluginSettings {
  geminiApiKey: string;
  geminiModel: string;
  similarityThreshold: number;
  minChunkLength: number;
  conceptsFolder: string;
  maxHistoryLength: number;
  excludedFolders: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  geminiApiKey: '',
  geminiModel: 'gemini-3.5-flash',
  similarityThreshold: 0.82,
  minChunkLength: 40,
  conceptsFolder: 'Concepts',
  maxHistoryLength: 20,
  excludedFolders: '.obsidian, .trash, templates, archive'
};

export interface WorkerMessageInit {
  type: 'INIT';
}

export interface WorkerMessageEmbedBatch {
  type: 'EMBED_BATCH';
  id: string;
  items: Array<{ id: string; text: string }>;
}

export interface WorkerResponseReady {
  type: 'READY';
}

export interface WorkerResponseEmbedComplete {
  type: 'EMBED_COMPLETE';
  id: string;
  results: Array<{ id: string; embedding: Float32Array }>;
}

export interface WorkerResponseError {
  type: 'ERROR';
  id?: string;
  error: string;
}

export type WorkerInMessage = WorkerMessageInit | WorkerMessageEmbedBatch;
export type WorkerOutMessage = WorkerResponseReady | WorkerResponseEmbedComplete | WorkerResponseError;
