/**
 * Pyodide State Store
 * Tracks the state of the Pyodide runtime for UI updates
 */

import { writable } from 'svelte/store';
import type { PyodideState, PyodideStatus } from '$lib/pyodide/types';

const initialState: PyodideState = {
	status: 'idle',
	progress: '',
	error: null
};

function createPyodideStore() {
	const { subscribe, set, update } = writable<PyodideState>(initialState);

	return {
		subscribe,

		/**
		 * Update state partially
		 */
		update(changes: Partial<PyodideState>) {
			update((state) => ({ ...state, ...changes }));
		},

		/**
		 * Set status to loading with progress message
		 */
		setLoading(progress: string = '') {
			set({ status: 'loading', progress, error: null });
		},

		/**
		 * Set status to ready
		 */
		setReady() {
			set({ status: 'ready', progress: '', error: null });
		},

		/**
		 * Set status to error
		 */
		setError(error: string) {
			update((state) => ({ ...state, status: 'error', error }));
		},

		/**
		 * Reset to initial state
		 */
		reset() {
			set(initialState);
		}
	};
}

export const pyodideState = createPyodideStore();

// Convenience exports for internal use
export const updateState = pyodideState.update;
export const setError = pyodideState.setError;
export const setReady = pyodideState.setReady;
