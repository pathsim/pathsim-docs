/**
 * Jupyter Notebook Parser
 * Parses .ipynb JSON into structured NotebookData
 */

import type {
	NotebookData,
	CellData,
	MarkdownCellData,
	CodeCellData,
	RawCellData,
	RawNotebook,
	RawCell,
	CellOutput
} from './types';

/**
 * Normalize source to single string (can be string or string[])
 */
function normalizeSource(source: string | string[]): string {
	if (Array.isArray(source)) {
		return source.join('');
	}
	return source;
}

/**
 * Generate stable cell ID from index and content hash
 */
function generateCellId(index: number, source: string): string {
	// Simple hash based on first 50 chars of source
	const contentSnippet = source.slice(0, 50).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
	return `cell-${index}-${contentSnippet.slice(0, 20) || 'empty'}`;
}

/**
 * Extract title from first markdown cell's H1 heading
 */
function extractTitle(cells: CellData[]): string | null {
	for (const cell of cells) {
		if (cell.cell_type === 'markdown') {
			const match = cell.source.match(/^#\s+(.+)$/m);
			if (match) {
				return match[1].trim();
			}
		}
	}
	return null;
}

/**
 * Parse a single cell
 */
function parseCell(raw: RawCell, index: number): CellData {
	const source = normalizeSource(raw.source);
	const id = raw.id || generateCellId(index, source);

	switch (raw.cell_type) {
		case 'markdown':
			return {
				id,
				cell_type: 'markdown',
				source,
				metadata: raw.metadata
			} as MarkdownCellData;

		case 'code':
			return {
				id,
				cell_type: 'code',
				source,
				outputs: raw.outputs || [],
				execution_count: raw.execution_count ?? null,
				metadata: raw.metadata
			} as CodeCellData;

		case 'raw':
			return {
				id,
				cell_type: 'raw',
				source,
				metadata: raw.metadata
			} as RawCellData;

		default:
			// Treat unknown cell types as raw
			return {
				id,
				cell_type: 'raw',
				source,
				metadata: raw.metadata
			} as RawCellData;
	}
}

/**
 * Parse notebook JSON string into NotebookData
 */
export function parseNotebook(json: string, filename?: string): NotebookData {
	const raw: RawNotebook = JSON.parse(json);

	const cells = raw.cells.map((cell, index) => parseCell(cell, index));

	// Extract title from markdown or use filename
	const extractedTitle = extractTitle(cells);
	const title = extractedTitle || filename?.replace(/\.ipynb$/, '') || 'Notebook';

	return {
		cells,
		metadata: raw.metadata || {},
		title,
		filename
	};
}

/**
 * Parse notebook from fetch response
 */
export async function fetchNotebook(url: string): Promise<NotebookData> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch notebook: ${response.status} ${response.statusText}`);
	}
	const json = await response.text();
	const filename = url.split('/').pop();
	return parseNotebook(json, filename);
}

/**
 * Check if a code cell should be hidden (nbsphinx pattern)
 */
export function isCellHidden(cell: CellData): boolean {
	if (cell.cell_type !== 'code') return false;

	// Check for # hidden comment at start
	const source = cell.source.trim();
	if (source.startsWith('# hidden') || source.startsWith('#hidden')) {
		return true;
	}

	// Check metadata
	if (cell.metadata?.tags && Array.isArray(cell.metadata.tags)) {
		if (cell.metadata.tags.includes('hidden') || cell.metadata.tags.includes('hide-cell')) {
			return true;
		}
	}

	return false;
}

/**
 * Transform code for Pyodide compatibility
 */
export function transformCodeForPyodide(code: string): string {
	let transformed = code;

	// Remove plt.style.use with relative paths (not available in browser)
	transformed = transformed.replace(
		/plt\.style\.use\s*\(\s*['"][^'"]*\.mplstyle['"]\s*\)/g,
		'# plt.style.use removed for browser'
	);

	// plt.show() is handled automatically by our plot capture, but keep it for clarity
	// No transformation needed

	return transformed;
}

/**
 * Get output text content, normalizing arrays to strings
 */
export function getOutputText(text: string | string[] | undefined): string {
	if (!text) return '';
	if (Array.isArray(text)) return text.join('');
	return text;
}
