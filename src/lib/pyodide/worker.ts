/**
 * Pyodide Web Worker
 * Executes Python code in a separate thread for documentation notebooks
 */

import {
	PYODIDE_CDN_URL,
	PYODIDE_PRELOAD,
	PYTHON_PACKAGES,
	PROGRESS_MESSAGES,
	ERROR_MESSAGES,
	type PackageConfig
} from '$lib/config/pyodide';
import type { WorkerRequest, WorkerResponse } from './types';

// Pyodide types (loaded dynamically from CDN)
interface PyodideInterface {
	runPythonAsync(code: string): Promise<unknown>;
	loadPackage(packages: readonly string[]): Promise<void>;
	setStdout(options: { batched: (msg: string) => void }): void;
	setStderr(options: { batched: (msg: string) => void }): void;
}

let pyodide: PyodideInterface | null = null;
let isInitialized = false;

// Execution tracking for stdout/stderr routing
let currentExecId: string | null = null;

/**
 * Send a response to the main thread
 */
function send(response: WorkerResponse): void {
	postMessage(response);
}

/**
 * Initialize Pyodide and install packages
 */
async function initialize(): Promise<void> {
	if (isInitialized) {
		send({ type: 'ready' });
		return;
	}

	send({ type: 'progress', message: PROGRESS_MESSAGES.LOADING_PYODIDE });

	// Dynamic import of Pyodide from CDN
	const { loadPyodide } = await import(
		/* @vite-ignore */
		PYODIDE_CDN_URL
	);

	pyodide = await loadPyodide();
	if (!pyodide) throw new Error(ERROR_MESSAGES.FAILED_TO_LOAD_PYODIDE);

	// Setup stdout/stderr capture with routing to current execution
	pyodide.setStdout({
		batched: (msg: string) => {
			if (currentExecId) {
				send({ type: 'stdout', id: currentExecId, text: msg });
			}
		}
	});
	pyodide.setStderr({
		batched: (msg: string) => {
			if (currentExecId) {
				send({ type: 'stderr', id: currentExecId, text: msg });
			}
		}
	});

	// Load preloaded packages (numpy, scipy, micropip)
	send({ type: 'progress', message: PROGRESS_MESSAGES.INSTALLING_DEPS });
	await pyodide.loadPackage([...PYODIDE_PRELOAD]);

	// Install packages via micropip
	for (const pkg of PYTHON_PACKAGES) {
		const progressKey = `INSTALLING_${pkg.import.toUpperCase()}` as keyof typeof PROGRESS_MESSAGES;
		send({
			type: 'progress',
			message: PROGRESS_MESSAGES[progressKey] ?? `Installing ${pkg.import}...`
		});

		try {
			const preFlag = pkg.pre ? ', pre=True' : '';
			await pyodide.runPythonAsync(`
import micropip
await micropip.install('${pkg.pip}'${preFlag})
			`);

			// Verify installation
			await pyodide.runPythonAsync(`
import ${pkg.import}
print(f"${pkg.import} {${pkg.import}.__version__} loaded successfully")
			`);
		} catch (error) {
			if (pkg.required) {
				throw new Error(`Failed to install required package ${pkg.pip}: ${error}`);
			}
			console.warn(`Optional package ${pkg.pip} failed to install:`, error);
		}
	}

	// Setup matplotlib backend for plot capture
	await pyodide.runPythonAsync(`
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import io
import base64

def _capture_plots():
    """Capture all open matplotlib figures as base64 PNGs."""
    plots = []
    for fig_num in plt.get_fignums():
        fig = plt.figure(fig_num)
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight', dpi=100)
        buf.seek(0)
        plots.append(base64.b64encode(buf.read()).decode('utf-8'))
        plt.close(fig)
    return plots
	`);

	// Import numpy as np globally (common convention)
	await pyodide.runPythonAsync(`import numpy as np`);

	// Initialize user namespace for persistent variables between cells
	await pyodide.runPythonAsync(`
_user_namespace = {
    'np': np,
    'plt': plt,
    '__builtins__': __builtins__
}
	`);

	isInitialized = true;
	send({ type: 'progress', message: PROGRESS_MESSAGES.READY });
	send({ type: 'ready' });
}

/**
 * Execute Python code in the user namespace
 */
async function executeCode(id: string, code: string): Promise<void> {
	if (!pyodide) throw new Error(ERROR_MESSAGES.WORKER_NOT_INITIALIZED);

	currentExecId = id;

	try {
		// Execute code in user namespace using exec
		// Encode code as base64 to avoid escaping issues
		const codeBase64 = btoa(unescape(encodeURIComponent(code)));
		await pyodide.runPythonAsync(`
import base64
_code = base64.b64decode('${codeBase64}').decode('utf-8')
exec(_code, _user_namespace)
del _code
		`);

		// Capture any matplotlib plots
		const plotsJson = (await pyodide.runPythonAsync(`
import json
json.dumps(_capture_plots())
		`)) as string;
		const plots: string[] = JSON.parse(plotsJson);

		// Send plots if any were captured
		for (const plotData of plots) {
			send({ type: 'plot', id, data: plotData });
		}

		send({ type: 'result', id });
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);

		// Try to get Python traceback
		let traceback: string | undefined;
		try {
			traceback = (await pyodide.runPythonAsync(`
import traceback
traceback.format_exc()
			`)) as string;
		} catch {
			// Ignore traceback extraction errors
		}

		send({ type: 'error', id, error: errorMsg, traceback });
	} finally {
		currentExecId = null;
	}
}

/**
 * Reset user namespace (clear all user-defined variables)
 */
async function resetNamespace(): Promise<void> {
	if (!pyodide) throw new Error(ERROR_MESSAGES.WORKER_NOT_INITIALIZED);

	await pyodide.runPythonAsync(`
# Reset namespace but keep common imports
_user_namespace = {
    'np': np,
    'plt': plt,
    '__builtins__': __builtins__
}
# Clear any open matplotlib figures
plt.close('all')
	`);
}

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
	const { type } = event.data;

	try {
		switch (type) {
			case 'init':
				await initialize();
				break;

			case 'exec': {
				const { id, code } = event.data;
				await executeCode(id, code);
				break;
			}

			case 'reset':
				await resetNamespace();
				send({ type: 'result', id: 'reset' });
				break;

			default:
				throw new Error(`Unknown message type: ${type}`);
		}
	} catch (error) {
		send({
			type: 'error',
			error: error instanceof Error ? error.message : String(error)
		});
	}
};
