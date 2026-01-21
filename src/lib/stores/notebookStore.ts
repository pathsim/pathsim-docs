/**
 * Notebook Execution Store
 * Tracks executed cells across all CodeBlock instances for prerequisite checking
 */

import { writable, get } from 'svelte/store';

interface NotebookState {
	/** Set of cell IDs that have been successfully executed */
	executedCells: Set<string>;
	/** Whether Pyodide is currently initializing */
	pyodideLoading: boolean;
	/** Progress message during Pyodide initialization */
	pyodideProgress: string;
}

const initialState: NotebookState = {
	executedCells: new Set(),
	pyodideLoading: false,
	pyodideProgress: ''
};

function createNotebookStore() {
	const { subscribe, set, update } = writable<NotebookState>(initialState);

	return {
		subscribe,

		/**
		 * Mark a cell as executed
		 */
		markExecuted(cellId: string) {
			update((state) => {
				state.executedCells.add(cellId);
				return { ...state, executedCells: new Set(state.executedCells) };
			});
		},

		/**
		 * Check if a cell has been executed
		 */
		isExecuted(cellId: string): boolean {
			return get({ subscribe }).executedCells.has(cellId);
		},

		/**
		 * Check if all prerequisite cells have been executed
		 */
		checkPrerequisites(prerequisites: string[]): { satisfied: boolean; missing: string[] } {
			const state = get({ subscribe });
			const missing = prerequisites.filter((id) => !state.executedCells.has(id));
			return {
				satisfied: missing.length === 0,
				missing
			};
		},

		/**
		 * Clear a specific cell's executed status
		 */
		clearCell(cellId: string) {
			update((state) => {
				state.executedCells.delete(cellId);
				return { ...state, executedCells: new Set(state.executedCells) };
			});
		},

		/**
		 * Reset all notebook state (e.g., when navigating away)
		 */
		reset() {
			set(initialState);
		},

		/**
		 * Set Pyodide loading state
		 */
		setPyodideLoading(loading: boolean, progress: string = '') {
			update((state) => ({
				...state,
				pyodideLoading: loading,
				pyodideProgress: progress
			}));
		}
	};
}

export const notebookStore = createNotebookStore();
