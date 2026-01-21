// Clipboard utility for copy operations with feedback

import { COPY_FEEDBACK_DURATION } from '$lib/config/timing';

/**
 * Copy text to clipboard and manage feedback state
 * @param text - Text to copy
 * @param onCopied - Callback when copy succeeds (set copied state to true)
 * @param onReset - Callback when feedback duration ends (set copied state to false)
 */
export async function copyToClipboard(
	text: string,
	onCopied?: () => void,
	onReset?: () => void
): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		onCopied?.();

		if (onReset) {
			setTimeout(onReset, COPY_FEEDBACK_DURATION);
		}

		return true;
	} catch (err) {
		console.error('Failed to copy to clipboard:', err);
		return false;
	}
}

/**
 * Simple copy without state management
 * @param text - Text to copy
 * @returns Promise resolving to success boolean
 */
export async function copy(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}
