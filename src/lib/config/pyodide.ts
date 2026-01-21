// Pyodide configuration for documentation notebooks

export const PYODIDE_VERSION = '0.26.2';
export const PYODIDE_CDN_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.mjs`;

// Packages preloaded with Pyodide (available as built-in Pyodide packages)
export const PYODIDE_PRELOAD = ['numpy', 'scipy', 'micropip'] as const;

export interface PackageConfig {
	pip: string;
	required: boolean;
	pre: boolean;
	import: string;
}

// Packages installed via micropip after Pyodide loads
export const PYTHON_PACKAGES: PackageConfig[] = [
	{
		pip: 'pathsim',
		required: true,
		pre: true,
		import: 'pathsim'
	},
	{
		pip: 'matplotlib',
		required: true,
		pre: false,
		import: 'matplotlib'
	}
];

// Timeouts in milliseconds
export const TIMEOUTS = {
	INIT: 120000, // 2 min for loading Pyodide + packages
	EXECUTION: 60000 // 1 min per cell
} as const;

// Progress messages
export const PROGRESS_MESSAGES = {
	LOADING_PYODIDE: 'Loading Python runtime...',
	INSTALLING_DEPS: 'Installing core packages...',
	INSTALLING_PATHSIM: 'Installing pathsim...',
	INSTALLING_MATPLOTLIB: 'Installing matplotlib...',
	READY: 'Python environment ready'
} as const;

// Error messages
export const ERROR_MESSAGES = {
	FAILED_TO_LOAD_PYODIDE: 'Failed to load Pyodide runtime',
	WORKER_NOT_INITIALIZED: 'Pyodide worker not initialized',
	EXECUTION_TIMEOUT: 'Code execution timed out'
} as const;
