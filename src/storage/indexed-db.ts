import { openDB, IDBPDatabase } from 'idb';
import { SemanticChunk } from '../types';

const DB_NAME = 'semantic-gardener-db';
const DB_VERSION = 1;

interface FileIndexRecord {
  filePath: string;
  chunkHashes: string[];
  mtime: number;
  lastIndexed: number;
}

export class VectorStorage {
  private dbPromise: Promise<IDBPDatabase> | null = null;

  private async getDB(): Promise<IDBPDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('chunks')) {
            const chunkStore = db.createObjectStore('chunks', { keyPath: 'id' });
            chunkStore.createIndex('filePath', 'filePath', { unique: false });
          }
          if (!db.objectStoreNames.contains('fileIndex')) {
            db.createObjectStore('fileIndex', { keyPath: 'filePath' });
          }
        }
      });
    }
    return this.dbPromise;
  }

  async getChunk(id: string): Promise<SemanticChunk | undefined> {
    const db = await this.getDB();
    const record = await db.get('chunks', id);
    if (!record) return undefined;
    if (record.embedding && !(record.embedding instanceof Float32Array)) {
      record.embedding = new Float32Array(record.embedding);
    }
    return record as SemanticChunk;
  }

  async getChunks(ids: string[]): Promise<SemanticChunk[]> {
    const db = await this.getDB();
    const tx = db.transaction('chunks', 'readonly');
    const store = tx.objectStore('chunks');
    const chunks: SemanticChunk[] = [];
    for (const id of ids) {
      const record = await store.get(id);
      if (record) {
        if (record.embedding && !(record.embedding instanceof Float32Array)) {
          record.embedding = new Float32Array(record.embedding);
        }
        chunks.push(record as SemanticChunk);
      }
    }
    await tx.done;
    return chunks;
  }

  async saveChunk(chunk: SemanticChunk): Promise<void> {
    const db = await this.getDB();
    const toStore = {
      ...chunk,
      lastUpdated: Date.now()
    };
    await db.put('chunks', toStore);
  }

  async saveChunks(chunks: SemanticChunk[]): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('chunks', 'readwrite');
    const store = tx.objectStore('chunks');
    const now = Date.now();
    for (const chunk of chunks) {
      const toStore = {
        ...chunk,
        lastUpdated: now
      };
      await store.put(toStore);
    }
    await tx.done;
  }

  async getAllChunksWithEmbeddings(): Promise<SemanticChunk[]> {
    const db = await this.getDB();
    const all = await db.getAll('chunks');
    return all
      .filter((c: any) => c.embedding)
      .map((c: any) => {
        if (!(c.embedding instanceof Float32Array)) {
          c.embedding = new Float32Array(c.embedding);
        }
        return c as SemanticChunk;
      });
  }

  async getFileChunks(filePath: string): Promise<SemanticChunk[]> {
    const db = await this.getDB();
    const index = db.transaction('chunks').store.index('filePath');
    const records = await index.getAll(filePath);
    return records.map((c: any) => {
      if (c.embedding && !(c.embedding instanceof Float32Array)) {
        c.embedding = new Float32Array(c.embedding);
      }
      return c as SemanticChunk;
    });
  }

  async getFileIndex(filePath: string): Promise<FileIndexRecord | undefined> {
    const db = await this.getDB();
    return (await db.get('fileIndex', filePath)) as FileIndexRecord | undefined;
  }

  async setFileIndex(filePath: string, chunkHashes: string[], mtime: number): Promise<void> {
    const db = await this.getDB();
    const record: FileIndexRecord = {
      filePath,
      chunkHashes,
      mtime,
      lastIndexed: Date.now()
    };
    await db.put('fileIndex', record);
  }

  async deleteFile(filePath: string): Promise<void> {
    const db = await this.getDB();
    const fileRecord = await this.getFileIndex(filePath);
    if (fileRecord && fileRecord.chunkHashes.length > 0) {
      const tx = db.transaction(['chunks', 'fileIndex'], 'readwrite');
      const chunkStore = tx.objectStore('chunks');
      for (const hash of fileRecord.chunkHashes) {
        await chunkStore.delete(hash);
      }
      await tx.objectStore('fileIndex').delete(filePath);
      await tx.done;
    } else {
      await db.delete('fileIndex', filePath);
    }
  }

  async clearAll(): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(['chunks', 'fileIndex'], 'readwrite');
    await tx.objectStore('chunks').clear();
    await tx.objectStore('fileIndex').clear();
    await tx.done;
  }

  async close(): Promise<void> {
    if (this.dbPromise) {
      const db = await this.dbPromise;
      db.close();
      this.dbPromise = null;
    }
  }
}
