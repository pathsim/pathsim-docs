/**
 * Semantic search module - tree-shakeable exports.
 *
 * Import only what you need to avoid loading the full model.
 */

export { embedQuery, getModel, isModelLoaded, hasModelError, resetModel } from './model';
export {
	cosineSimilarity,
	computeSimilarities,
	topK,
	decodeEmbeddings
} from './similarity';
