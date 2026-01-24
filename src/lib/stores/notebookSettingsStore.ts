/**
 * Notebook Execution Settings Store
 * Manages user preferences for notebook execution behavior
 */

import { writable } from 'svelte/store';

interface NotebookSettings {
	/** If true, always re-run prerequisites even if already successful */
	forcePrerequisites: boolean;
}

const defaultSettings: NotebookSettings = {
	forcePrerequisites: false
};

function createNotebookSettingsStore() {
	const { subscribe, update, set } = writable<NotebookSettings>(defaultSettings);

	return {
		subscribe,

		/**
		 * Toggle force prerequisites setting
		 */
		toggleForcePrerequisites() {
			update((settings) => ({
				...settings,
				forcePrerequisites: !settings.forcePrerequisites
			}));
		},

		/**
		 * Set force prerequisites setting
		 */
		setForcePrerequisites(value: boolean) {
			update((settings) => ({
				...settings,
				forcePrerequisites: value
			}));
		},

		/**
		 * Reset to defaults
		 */
		reset() {
			set(defaultSettings);
		}
	};
}

export const notebookSettingsStore = createNotebookSettingsStore();
