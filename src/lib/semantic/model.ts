/**
 * Lazy-loading embedding model using transformers.js
 *
 * Loads the e5-small-v2 model on-demand for semantic search.
 * Model is cached after first load (~25-33MB download).
 */

import type { FeatureExtractionPipeline } from '@huggingface/transformers';

// Model configuration
const MODEL_NAME = 'Xenova/e5-small-v2';

// Singleton promise for lazy loading
let modelPromise: Promise<FeatureExtractionPipeline> | null = null;
let modelLoadError: Error | null = null;

/**
 * Get the embedding model, loading it on first call.
 * Subsequent calls return the cached instance.
 */
export async function getModel(): Promise<FeatureExtractionPipeline> {
	if (modelLoadError) {
		throw modelLoadError;
	}

	if (!modelPromise) {
		modelPromise = loadModel();
	}

	return modelPromise;
}

async function loadModel(): Promise<FeatureExtractionPipeline> {
	try {
		// Dynamic import to enable tree-shaking
		const { pipeline } = await import('@huggingface/transformers');

		const model = await pipeline('feature-extraction', MODEL_NAME, {
			// Use WebGPU if available, fall back to WASM
			device: 'webgpu',
			dtype: 'fp32'
		});

		return model as FeatureExtractionPipeline;
	} catch (e) {
		// Try without WebGPU
		try {
			const { pipeline } = await import('@huggingface/transformers');

			const model = await pipeline('feature-extraction', MODEL_NAME, {
				device: 'wasm',
				dtype: 'fp32'
			});

			return model as FeatureExtractionPipeline;
		} catch (fallbackError) {
			modelLoadError = fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError));
			modelPromise = null;
			throw modelLoadError;
		}
	}
}

/**
 * Embed a query string for semantic search.
 * E5 models expect "query: " prefix for queries.
 *
 * @returns Float32Array of embedding values (384 dimensions)
 */
export async function embedQuery(text: string): Promise<Float32Array> {
	const model = await getModel();

	// E5 models expect "query: " prefix for search queries
	const prefixedText = `query: ${text}`;

	const result = await model(prefixedText, {
		pooling: 'mean',
		normalize: true
	});

	// Result is a Tensor, extract the data
	return new Float32Array(result.data as ArrayLike<number>);
}

/**
 * Check if the model is already loaded
 */
export function isModelLoaded(): boolean {
	return modelPromise !== null && modelLoadError === null;
}

/**
 * Check if model loading failed
 */
export function hasModelError(): boolean {
	return modelLoadError !== null;
}

/**
 * Reset the model state (for testing or error recovery)
 */
export function resetModel(): void {
	modelPromise = null;
	modelLoadError = null;
}
