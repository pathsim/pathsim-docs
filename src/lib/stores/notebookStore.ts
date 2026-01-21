/**
 * Notebook Execution Store
 * Manages cell registry, execution state, and prerequisite resolution
 */

import { writable, get } from 'svelte/store';

export type CellStatus = 'idle' | 'pending' | 'running' | 'success' | 'error';

export interface CellState {
	id: string;
	status: CellStatus;
	executionCount: number;
	/** Function to execute this cell (registered by NotebookCell) */
	execute: () => Promise<void>;
	/** IDs of cells this cell depends on */
	prerequisites: string[];
}

interface NotebookState {
	/** Registry of all cells by ID */
	cells: Map<string, CellState>;
}

const initialState: NotebookState = {
	cells: new Map()
};

function createNotebookStore() {
	const { subscribe, set, update } = writable<NotebookState>(initialState);

	/**
	 * Detect circular dependencies using DFS
	 */
	function detectCircularDeps(
		cellId: string,
		cells: Map<string, CellState>,
		visited: Set<string> = new Set(),
		path: Set<string> = new Set()
	): string[] | null {
		if (path.has(cellId)) {
			// Found cycle - return the cycle path
			return [...path, cellId];
		}
		if (visited.has(cellId)) {
			return null; // Already checked this branch
		}

		visited.add(cellId);
		path.add(cellId);

		const cell = cells.get(cellId);
		if (cell) {
			for (const prereqId of cell.prerequisites) {
				const cycle = detectCircularDeps(prereqId, cells, visited, path);
				if (cycle) return cycle;
			}
		}

		path.delete(cellId);
		return null;
	}

	/**
	 * Get execution order for a cell and its prerequisites (topological sort)
	 */
	function getExecutionOrder(
		cellId: string,
		cells: Map<string, CellState>,
		visited: Set<string> = new Set()
	): string[] {
		if (visited.has(cellId)) return [];
		visited.add(cellId);

		const cell = cells.get(cellId);
		if (!cell) return [];

		const order: string[] = [];

		// First, add prerequisites (depth-first)
		for (const prereqId of cell.prerequisites) {
			order.push(...getExecutionOrder(prereqId, cells, visited));
		}

		// Then add this cell
		order.push(cellId);

		return order;
	}

	return {
		subscribe,

		/**
		 * Register a cell with the store
		 */
		registerCell(
			id: string,
			execute: () => Promise<void>,
			prerequisites: string[] = []
		) {
			update((state) => {
				const cells = new Map(state.cells);
				cells.set(id, {
					id,
					status: 'idle',
					executionCount: 0,
					execute,
					prerequisites
				});
				return { ...state, cells };
			});
		},

		/**
		 * Unregister a cell (on component destroy)
		 */
		unregisterCell(id: string) {
			update((state) => {
				const cells = new Map(state.cells);
				cells.delete(id);
				return { ...state, cells };
			});
		},

		/**
		 * Update cell status
		 */
		setCellStatus(id: string, status: CellStatus) {
			update((state) => {
				const cells = new Map(state.cells);
				const cell = cells.get(id);
				if (cell) {
					cells.set(id, { ...cell, status });
				}
				return { ...state, cells };
			});
		},

		/**
		 * Increment execution count for a cell
		 */
		incrementExecutionCount(id: string) {
			update((state) => {
				const cells = new Map(state.cells);
				const cell = cells.get(id);
				if (cell) {
					cells.set(id, { ...cell, executionCount: cell.executionCount + 1 });
				}
				return { ...state, cells };
			});
		},

		/**
		 * Get cell state by ID
		 */
		getCell(id: string): CellState | undefined {
			return get({ subscribe }).cells.get(id);
		},

		/**
		 * Check if a cell has been successfully executed
		 */
		isExecuted(id: string): boolean {
			const cell = get({ subscribe }).cells.get(id);
			return cell?.status === 'success';
		},

		/**
		 * Run a cell with automatic prerequisite execution
		 * Returns list of cells that were run (in order)
		 */
		async runWithPrerequisites(cellId: string): Promise<{
			success: boolean;
			executedCells: string[];
			error?: string;
		}> {
			const state = get({ subscribe });
			const cells = state.cells;

			// Check for circular dependencies
			const cycle = detectCircularDeps(cellId, cells);
			if (cycle) {
				return {
					success: false,
					executedCells: [],
					error: `Circular dependency detected: ${cycle.join(' → ')}`
				};
			}

			// Get execution order
			const executionOrder = getExecutionOrder(cellId, cells);

			// Filter to only cells that need to run
			const cellsToRun = executionOrder.filter((id) => {
				const cell = cells.get(id);
				// Run if not yet successful, or if it's the target cell (always re-run target)
				return cell && (cell.status !== 'success' || id === cellId);
			});

			// Mark all cells as pending
			for (const id of cellsToRun) {
				this.setCellStatus(id, 'pending');
			}

			const executedCells: string[] = [];

			// Execute in order
			for (const id of cellsToRun) {
				const cell = get({ subscribe }).cells.get(id);
				if (!cell) continue;

				this.setCellStatus(id, 'running');

				try {
					await cell.execute();
					// Status will be set to 'success' or 'error' by the cell itself
					const updatedCell = get({ subscribe }).cells.get(id);
					if (updatedCell?.status === 'error') {
						// Stop execution chain on error
						// Reset remaining pending cells to idle
						for (const remainingId of cellsToRun) {
							const remaining = get({ subscribe }).cells.get(remainingId);
							if (remaining?.status === 'pending') {
								this.setCellStatus(remainingId, 'idle');
							}
						}
						return {
							success: false,
							executedCells,
							error: `Cell "${id}" failed`
						};
					}
					executedCells.push(id);
				} catch (err) {
					this.setCellStatus(id, 'error');
					// Reset remaining pending cells
					for (const remainingId of cellsToRun) {
						const remaining = get({ subscribe }).cells.get(remainingId);
						if (remaining?.status === 'pending') {
							this.setCellStatus(remainingId, 'idle');
						}
					}
					return {
						success: false,
						executedCells,
						error: err instanceof Error ? err.message : String(err)
					};
				}
			}

			return { success: true, executedCells };
		},

		/**
		 * Reset all cells (e.g., when navigating away)
		 */
		resetAllCells() {
			update((state) => {
				const cells = new Map(state.cells);
				for (const [id, cell] of cells) {
					cells.set(id, { ...cell, status: 'idle', executionCount: 0 });
				}
				return { ...state, cells };
			});
		},

		/**
		 * Full reset (clears everything)
		 */
		reset() {
			set(initialState);
		}
	};
}

export const notebookStore = createNotebookStore();
