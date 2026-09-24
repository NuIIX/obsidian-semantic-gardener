import type { SemanticChunk, CandidateCluster } from '../types/index.ts';

/**
 * Computes cosine similarity between two Float32Array vectors.
 * Returns a value between -1.0 and 1.0 (typically 0.0 to 1.0 for normalized embeddings).
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const valA = a[i];
    const valB = b[i];
    dot += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Normalizes a vector to unit L2-norm.
 */
export function normalizeVector(vec: Float32Array): Float32Array {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) {
    sumSq += vec[i] * vec[i];
  }
  if (sumSq === 0) return vec;
  const norm = Math.sqrt(sumSq);
  if (Math.abs(norm - 1.0) < 1e-5) return vec;

  const out = new Float32Array(vec.length);
  const invNorm = 1.0 / norm;
  for (let i = 0; i < vec.length; i++) {
    out[i] = vec[i] * invNorm;
  }
  return out;
}

/**
 * Computes fast scalar dot product between two unit-normalized vectors.
 */
export function dotProduct(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

/**
 * Extracts top-level folder domain from a vault file path.
 * e.g. "Work/Project/File.md" -> "Work", "Note.md" -> "(Root)"
 */
export function getDomainFromPath(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const firstSlash = normalized.indexOf('/');
  if (firstSlash === -1) {
    return '(Root)';
  }
  return normalized.substring(0, firstSlash);
}

/**
 * Flat contiguous Float32Array matrix for cache-friendly vector operations.
 */
export class FlatVectorMatrix {
  public readonly count: number;
  public readonly dim: number;
  public readonly data: Float32Array;
  public readonly chunks: SemanticChunk[];

  constructor(validChunks: SemanticChunk[]) {
    this.chunks = validChunks;
    this.count = validChunks.length;
    this.dim = validChunks[0]?.embedding?.length || 0;
    this.data = new Float32Array(this.count * this.dim);

    for (let i = 0; i < this.count; i++) {
      const emb = normalizeVector(this.chunks[i].embedding!);
      this.data.set(emb, i * this.dim);
    }
  }

  /**
   * Fast dot product of row i and row j in contiguous memory buffer.
   */
  dotAt(i: number, j: number): number {
    const offA = i * this.dim;
    const offB = j * this.dim;
    let dot = 0;
    const d = this.dim;
    for (let k = 0; k < d; k++) {
      dot += this.data[offA + k] * this.data[offB + k];
    }
    return dot;
  }
}

/**
 * Scans all chunks across different notes and groups them into candidate clusters
 * using flat matrix dot-product acceleration.
 */
export function findCandidateClusters(
  chunks: SemanticChunk[],
  threshold: number = 0.82
): CandidateCluster[] {
  const validChunks = chunks.filter(c => c.embedding && c.embedding.length > 0);
  if (validChunks.length < 2) {
    return [];
  }

  const matrix = new FlatVectorMatrix(validChunks);
  const n = matrix.count;

  // Graph adjacency list for connected components
  const adj = new Map<number, Set<number>>();
  for (let i = 0; i < n; i++) {
    adj.set(i, new Set<number>());
  }

  // Pairwise similarities between different files
  const pairScores = new Map<string, number>();

  for (let i = 0; i < n; i++) {
    const pathA = validChunks[i].filePath;
    for (let j = i + 1; j < n; j++) {
      // Rule: Candidates must originate from distinct files
      if (pathA === validChunks[j].filePath) {
        continue;
      }

      const sim = matrix.dotAt(i, j);
      if (sim >= threshold) {
        adj.get(i)!.add(j);
        adj.get(j)!.add(i);
        const pairKey = `${i}_${j}`;
        pairScores.set(pairKey, sim);
      }
    }
  }

  // Find connected components
  const visited = new Set<number>();
  const rawClusters: number[][] = [];

  for (let i = 0; i < n; i++) {
    if (visited.has(i) || adj.get(i)!.size === 0) {
      continue;
    }

    const component: number[] = [];
    const queue: number[] = [i];
    visited.add(i);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      component.push(curr);

      for (const neighbor of adj.get(curr)!) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    if (component.length >= 2) {
      rawClusters.push(component);
    }
  }

  // Convert components to CandidateCluster objects with aggregated similarity and domain
  const candidateClusters: CandidateCluster[] = rawClusters.map((indices, idx) => {
    const clusterChunks = indices.map(i => validChunks[i]);
    
    let maxSim = 0;
    let sumSim = 0;
    let pairCount = 0;

    for (let a = 0; a < indices.length; a++) {
      for (let b = a + 1; b < indices.length; b++) {
        const i = indices[a];
        const j = indices[b];
        const pairKey = i < j ? `${i}_${j}` : `${j}_${i}`;
        const sim = pairScores.get(pairKey);
        if (sim !== undefined) {
          maxSim = Math.max(maxSim, sim);
          sumSim += sim;
          pairCount++;
        }
      }
    }

    const avgSim = pairCount > 0 ? sumSim / pairCount : maxSim;
    const domains = Array.from(new Set(clusterChunks.map(c => getDomainFromPath(c.filePath))));
    const domain = domains.length === 1 ? domains[0] : 'Cross-folder';

    return {
      id: `cluster-${idx + 1}-${Date.now()}`,
      similarity: Number(avgSim.toFixed(4)),
      chunks: clusterChunks,
      domain
    };
  });

  // Sort clusters by highest similarity first
  candidateClusters.sort((a, b) => b.similarity - a.similarity);

  return candidateClusters;
}

/**
 * Finds duplicate candidate clusters specifically involving a given active note.
 * Uses targeted O(M * N) search instead of O(N^2) full-vault search.
 */
export function findClustersForNote(
  notePath: string,
  chunks: SemanticChunk[],
  threshold: number = 0.82
): CandidateCluster[] {
  const validChunks = chunks.filter(c => c.embedding && c.embedding.length > 0);
  if (validChunks.length < 2) {
    return [];
  }

  const noteIndices: number[] = [];
  const otherIndices: number[] = [];

  for (let i = 0; i < validChunks.length; i++) {
    if (validChunks[i].filePath === notePath) {
      noteIndices.push(i);
    } else {
      otherIndices.push(i);
    }
  }

  if (noteIndices.length === 0 || otherIndices.length === 0) {
    return [];
  }

  const matrix = new FlatVectorMatrix(validChunks);

  const adj = new Map<number, Set<number>>();
  for (let i = 0; i < validChunks.length; i++) {
    adj.set(i, new Set<number>());
  }
  const pairScores = new Map<string, number>();

  for (const i of noteIndices) {
    for (const j of otherIndices) {
      const sim = matrix.dotAt(i, j);
      if (sim >= threshold) {
        adj.get(i)!.add(j);
        adj.get(j)!.add(i);
        const pairKey = i < j ? `${i}_${j}` : `${j}_${i}`;
        pairScores.set(pairKey, sim);
      }
    }
  }

  const visited = new Set<number>();
  const rawClusters: number[][] = [];

  for (const startIdx of noteIndices) {
    if (visited.has(startIdx) || adj.get(startIdx)!.size === 0) {
      continue;
    }

    const component: number[] = [];
    const queue: number[] = [startIdx];
    visited.add(startIdx);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      component.push(curr);

      for (const neighbor of adj.get(curr)!) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    if (component.length >= 2) {
      rawClusters.push(component);
    }
  }

  const candidateClusters: CandidateCluster[] = rawClusters.map((indices, idx) => {
    const clusterChunks = indices.map(i => validChunks[i]);
    let maxSim = 0;
    let sumSim = 0;
    let pairCount = 0;

    for (let a = 0; a < indices.length; a++) {
      for (let b = a + 1; b < indices.length; b++) {
        const i = indices[a];
        const j = indices[b];
        const pairKey = i < j ? `${i}_${j}` : `${j}_${i}`;
        const sim = pairScores.get(pairKey);
        if (sim !== undefined) {
          maxSim = Math.max(maxSim, sim);
          sumSim += sim;
          pairCount++;
        }
      }
    }

    const avgSim = pairCount > 0 ? sumSim / pairCount : maxSim;
    const domains = Array.from(new Set(clusterChunks.map(c => getDomainFromPath(c.filePath))));
    const domain = domains.length === 1 ? domains[0] : 'Cross-folder';

    return {
      id: `cluster-${idx + 1}-${Date.now()}`,
      similarity: Number(avgSim.toFixed(4)),
      chunks: clusterChunks,
      domain
    };
  });

  candidateClusters.sort((a, b) => b.similarity - a.similarity);
  return candidateClusters;
}
