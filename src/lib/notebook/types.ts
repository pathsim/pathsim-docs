/**
 * Jupyter Notebook Types
 * TypeScript interfaces for .ipynb file structure
 */

// ============================================================================
// Cell Output Types
// ============================================================================

export interface StreamOutput {
	output_type: 'stream';
	name: 'stdout' | 'stderr';
	text: string | string[];
}

export interface ExecuteResultOutput {
	output_type: 'execute_result';
	data: {
		'text/plain'?: string | string[];
		'text/html'?: string | string[];
		'image/png'?: string;
		'image/svg+xml'?: string;
		[key: string]: string | string[] | undefined;
	};
	metadata?: Record<string, unknown>;
	execution_count?: number | null;
}

export interface DisplayDataOutput {
	output_type: 'display_data';
	data: {
		'text/plain'?: string | string[];
		'text/html'?: string | string[];
		'image/png'?: string;
		'image/svg+xml'?: string;
		[key: string]: string | string[] | undefined;
	};
	metadata?: Record<string, unknown>;
}

export interface ErrorOutput {
	output_type: 'error';
	ename: string;
	evalue: string;
	traceback: string[];
}

export type CellOutput = StreamOutput | ExecuteResultOutput | DisplayDataOutput | ErrorOutput;

// ============================================================================
// Cell Types
// ============================================================================

export interface BaseCellData {
	id: string; // Generated stable ID
	metadata?: Record<string, unknown>;
}

export interface MarkdownCellData extends BaseCellData {
	cell_type: 'markdown';
	source: string;
}

export interface CodeCellData extends BaseCellData {
	cell_type: 'code';
	source: string;
	outputs: CellOutput[];
	execution_count: number | null;
}

export interface RawCellData extends BaseCellData {
	cell_type: 'raw';
	source: string;
}

export type CellData = MarkdownCellData | CodeCellData | RawCellData;

// ============================================================================
// Notebook Types
// ============================================================================

export interface NotebookMetadata {
	kernelspec?: {
		display_name?: string;
		language?: string;
		name?: string;
	};
	language_info?: {
		name?: string;
		version?: string;
	};
	title?: string;
	[key: string]: unknown;
}

export interface NotebookData {
	cells: CellData[];
	metadata: NotebookMetadata;
	/** Extracted from first markdown H1 or filename */
	title: string;
	/** Original filename if known */
	filename?: string;
}

// ============================================================================
// Raw Notebook JSON (before parsing)
// ============================================================================

export interface RawCell {
	cell_type: 'markdown' | 'code' | 'raw';
	source: string | string[];
	metadata?: Record<string, unknown>;
	outputs?: CellOutput[];
	execution_count?: number | null;
	id?: string;
}

export interface RawNotebook {
	cells: RawCell[];
	metadata?: NotebookMetadata;
	nbformat?: number;
	nbformat_minor?: number;
}
