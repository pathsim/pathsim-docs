/**
 * Pyodide REPL Types
 * Message protocol for main thread ↔ worker communication
 */

// ============================================================================
// Request Messages (Main Thread → Worker)
// ============================================================================

/** Package versions to install (package name → version without 'v' prefix) */
export type PackageVersions = Record<string, string>;

export type WorkerRequest =
	| { type: 'init'; packageVersions?: PackageVersions }
	| { type: 'exec'; id: string; code: string }
	| { type: 'reset' };

// ============================================================================
// Response Messages (Worker → Main Thread)
// ============================================================================

export type WorkerResponse =
	| { type: 'ready' }
	| { type: 'progress'; message: string }
	| { type: 'stdout'; id: string; text: string }
	| { type: 'stderr'; id: string; text: string }
	| { type: 'plot'; id: string; data: string } // base64 PNG
	| { type: 'result'; id: string; value?: string }
	| { type: 'error'; id?: string; error: string; traceback?: string };

// ============================================================================
// Execution Result
// ============================================================================

export interface ExecutionResult {
	stdout: string;
	stderr: string;
	plots: string[]; // base64 PNGs
	error?: {
		message: string;
		traceback?: string;
	};
	duration: number; // ms
}

// ============================================================================
// Pyodide State
// ============================================================================

export type PyodideStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface PyodideState {
	status: PyodideStatus;
	progress: string;
	error: string | null;
}
