/**
 * Vector similarity utilities for semantic search.
 *
 * Operates on Float32Arrays for efficiency.
 */

/**
 * Compute cosine similarity between two vectors.
 * Assumes vectors are already normalized (from e5 model output).
 *
 * For normalized vectors, cosine similarity = dot product
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
	if (a.length !== b.length) {
		throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
	}

	let dot = 0;
	for (let i = 0; i < a.length; i++) {
		dot += a[i] * b[i];
	}

	return dot;
}

/**
 * Compute similarities between a query vector and all document embeddings.
 *
 * @param query - Query embedding (384d Float32Array)
 * @param embeddings - Flattened document embeddings (count * dim Float32Array)
 * @param dim - Embedding dimension (384)
 * @param count - Number of documents
 * @returns Array of similarities, one per document
 */
export function computeSimilarities(
	query: Float32Array,
	embeddings: Float32Array,
	dim: number,
	count: number
): Float32Array {
	const similarities = new Float32Array(count);

	for (let i = 0; i < count; i++) {
		const offset = i * dim;
		let dot = 0;

		for (let j = 0; j < dim; j++) {
			dot += query[j] * embeddings[offset + j];
		}

		similarities[i] = dot;
	}

	return similarities;
}

/**
 * Get top-K indices by similarity score.
 *
 * @param similarities - Array of similarity scores
 * @param k - Number of top results to return
 * @param threshold - Minimum similarity threshold (default 0.3)
 * @returns Array of { index, score } sorted by descending score
 */
export function topK(
	similarities: Float32Array,
	k: number,
	threshold: number = 0.3
): Array<{ index: number; score: number }> {
	// Create index-score pairs and filter by threshold
	const pairs: Array<{ index: number; score: number }> = [];

	for (let i = 0; i < similarities.length; i++) {
		if (similarities[i] >= threshold) {
			pairs.push({ index: i, score: similarities[i] });
		}
	}

	// Sort by descending score
	pairs.sort((a, b) => b.score - a.score);

	// Return top K
	return pairs.slice(0, k);
}

/**
 * Decode base64-encoded Float32Array embeddings.
 *
 * @param base64 - Base64 encoded string of float32 values
 * @returns Float32Array
 */
export function decodeEmbeddings(base64: string): Float32Array {
	// Decode base64 to binary
	const binaryString = atob(base64);
	const bytes = new Uint8Array(binaryString.length);

	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}

	// View as Float32Array
	return new Float32Array(bytes.buffer);
}
