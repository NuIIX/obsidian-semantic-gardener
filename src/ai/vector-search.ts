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
 * Scans all chunks across different notes and groups them into candidate clusters
 * where cosine similarity is greater than or equal to the threshold (default >= 0.82).
 */
export function findCandidateClusters(
  chunks: SemanticChunk[],
  threshold: number = 0.82
): CandidateCluster[] {
  // Only consider chunks with valid embeddings
  const validChunks = chunks.filter(c => c.embedding && c.embedding.length > 0);
  if (validChunks.length < 2) {
    return [];
  }

  // Graph adjacency list for connected components
  const adj = new Map<number, Set<number>>();
  for (let i = 0; i < validChunks.length; i++) {
    adj.set(i, new Set<number>());
  }

  // Pairwise similarities between different files
  const pairScores = new Map<string, number>();

  for (let i = 0; i < validChunks.length; i++) {
    const chunkA = validChunks[i];
    const embA = chunkA.embedding!;

    for (let j = i + 1; j < validChunks.length; j++) {
      const chunkB = validChunks[j];
      // Rule: Candidates must originate from distinct files
      if (chunkA.filePath === chunkB.filePath) {
        continue;
      }

      const sim = cosineSimilarity(embA, chunkB.embedding!);
      if (sim >= threshold) {
        adj.get(i)!.add(j);
        adj.get(j)!.add(i);
        const pairKey = i < j ? `${i}_${j}` : `${j}_${i}`;
        pairScores.set(pairKey, sim);
      }
    }
  }

  // Find connected components
  const visited = new Set<number>();
  const rawClusters: number[][] = [];

  for (let i = 0; i < validChunks.length; i++) {
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

  // Convert components to CandidateCluster objects with aggregated similarity scores
  const candidateClusters: CandidateCluster[] = rawClusters.map((indices, idx) => {
    const clusterChunks = indices.map(i => validChunks[i]);
    
    // Calculate maximum/average similarity among pairs in this cluster
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

    return {
      id: `cluster-${idx + 1}-${Date.now()}`,
      similarity: Number(avgSim.toFixed(4)),
      chunks: clusterChunks
    };
  });

  // Sort clusters by highest similarity first
  candidateClusters.sort((a, b) => b.similarity - a.similarity);

  return candidateClusters;
}

/**
 * Finds duplicate candidate clusters specifically involving a given active note.
 */
export function findClustersForNote(
  notePath: string,
  chunks: SemanticChunk[],
  threshold: number = 0.82
): CandidateCluster[] {
  const allClusters = findCandidateClusters(chunks, threshold);
  return allClusters.filter(cluster => 
    cluster.chunks.some(chunk => chunk.filePath === notePath)
  );
}
