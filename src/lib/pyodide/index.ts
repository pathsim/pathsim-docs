/**
 * Pyodide Bridge
 * Main-thread interface for executing Python code in documentation notebooks
 */

import { TIMEOUTS, ERROR_MESSAGES } from '$lib/config/pyodide';
import { pyodideState, updateState, setError, setReady } from '$lib/stores/pyodideStore';
import type { WorkerRequest, WorkerResponse, ExecutionResult } from './types';

let worker: Worker | null = null;
let initPromise: Promise<void> | null = null;

// Pending execution promises keyed by execution ID
const pendingExecutions = new Map<
	string,
	{
		resolve: (result: ExecutionResult) => void;
		reject: (error: Error) => void;
		stdout: string[];
		stderr: string[];
		plots: string[];
		startTime: number;
	}
>();

// Progress callback for initialization
let progressCallback: ((msg: string) => void) | null = null;

/**
 * Generate unique execution ID
 */
function generateId(): string {
	return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Handle messages from the worker
 */
function handleWorkerMessage(event: MessageEvent<WorkerResponse>): void {
	const response = event.data;

	switch (response.type) {
		case 'ready':
			setReady();
			break;

		case 'progress':
			updateState({ progress: response.message });
			if (progressCallback) {
				progressCallback(response.message);
			}
			break;

		case 'stdout': {
			const pending = pendingExecutions.get(response.id);
			if (pending) {
				pending.stdout.push(response.text);
			}
			break;
		}

		case 'stderr': {
			const pending = pendingExecutions.get(response.id);
			if (pending) {
				pending.stderr.push(response.text);
			}
			break;
		}

		case 'plot': {
			const pending = pendingExecutions.get(response.id);
			if (pending) {
				pending.plots.push(response.data);
			}
			break;
		}

		case 'result': {
			const pending = pendingExecutions.get(response.id);
			if (pending) {
				pendingExecutions.delete(response.id);
				const duration = Date.now() - pending.startTime;
				pending.resolve({
					stdout: pending.stdout.join(''),
					stderr: pending.stderr.join(''),
					plots: pending.plots,
					duration
				});
			}
			break;
		}

		case 'error': {
			if (response.id) {
				const pending = pendingExecutions.get(response.id);
				if (pending) {
					pendingExecutions.delete(response.id);
					const duration = Date.now() - pending.startTime;
					pending.resolve({
						stdout: pending.stdout.join(''),
						stderr: pending.stderr.join(''),
						plots: pending.plots,
						error: {
							message: response.error,
							traceback: response.traceback
						},
						duration
					});
				}
			} else {
				// Global error (e.g., initialization failure)
				setError(response.error);
			}
			break;
		}
	}
}

/**
 * Send a message to the worker
 */
function send(request: WorkerRequest): void {
	if (!worker) {
		throw new Error(ERROR_MESSAGES.WORKER_NOT_INITIALIZED);
	}
	worker.postMessage(request);
}

/**
 * Initialize Pyodide
 * Returns a promise that resolves when Pyodide is ready
 */
export async function initPyodide(): Promise<void> {
	// Return existing promise if already initializing
	if (initPromise) {
		return initPromise;
	}

	// Already initialized
	let state: { status: string } = { status: 'idle' };
	pyodideState.subscribe((s) => (state = s))();
	if (state.status === 'ready') {
		return;
	}

	initPromise = new Promise<void>((resolve, reject) => {
		// Create worker
		worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
		worker.onmessage = handleWorkerMessage;
		worker.onerror = (error) => {
			setError(error.message);
			reject(new Error(error.message));
		};

		// Wait for ready message
		const originalHandler = handleWorkerMessage;
		worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
			originalHandler(event);
			if (event.data.type === 'ready') {
				worker!.onmessage = originalHandler;
				resolve();
			} else if (event.data.type === 'error' && !event.data.id) {
				worker!.onmessage = originalHandler;
				reject(new Error(event.data.error));
			}
		};

		// Update state and send init message
		updateState({ status: 'loading', progress: 'Starting...', error: null });
		send({ type: 'init' });

		// Set timeout
		setTimeout(() => {
			if (state.status === 'loading') {
				const error = ERROR_MESSAGES.EXECUTION_TIMEOUT;
				setError(error);
				reject(new Error(error));
			}
		}, TIMEOUTS.INIT);
	});

	return initPromise;
}

/**
 * Execute Python code
 * Returns stdout, stderr, plots, and any error
 */
export async function execute(code: string): Promise<ExecutionResult> {
	// Ensure initialized
	await initPyodide();

	const id = generateId();

	return new Promise<ExecutionResult>((resolve, reject) => {
		// Store pending execution
		pendingExecutions.set(id, {
			resolve,
			reject,
			stdout: [],
			stderr: [],
			plots: [],
			startTime: Date.now()
		});

		// Set timeout
		const timeoutId = setTimeout(() => {
			if (pendingExecutions.has(id)) {
				pendingExecutions.delete(id);
				resolve({
					stdout: '',
					stderr: '',
					plots: [],
					error: {
						message: ERROR_MESSAGES.EXECUTION_TIMEOUT
					},
					duration: TIMEOUTS.EXECUTION
				});
			}
		}, TIMEOUTS.EXECUTION);

		// Clear timeout when execution completes
		const pending = pendingExecutions.get(id)!;
		const originalResolve = pending.resolve;
		pending.resolve = (result) => {
			clearTimeout(timeoutId);
			originalResolve(result);
		};

		// Send execution request
		send({ type: 'exec', id, code });
	});
}

/**
 * Reset the Python namespace
 * Clears all user-defined variables but keeps common imports (np, plt)
 */
export async function reset(): Promise<void> {
	await initPyodide();
	send({ type: 'reset' });
}

/**
 * Set callback for progress updates during initialization
 */
export function onProgress(callback: (msg: string) => void): void {
	progressCallback = callback;
}

/**
 * Terminate the worker
 * Use this to clean up resources when the component unmounts
 */
export function terminate(): void {
	if (worker) {
		worker.terminate();
		worker = null;
	}
	initPromise = null;
	pendingExecutions.clear();
	updateState({ status: 'idle', progress: '', error: null });
}

// Re-export types and store
export type { ExecutionResult, PyodideState, PyodideStatus } from './types';
export { pyodideState } from '$lib/stores/pyodideStore';
