/**
 * Shared copy button utility for code blocks
 */

import { COPY_FEEDBACK_DURATION } from '$lib/config/timing';

const COPY_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

const CHECK_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

/**
 * Create a copy button element that copies the given code to clipboard
 */
export function createCopyButton(code: string): HTMLButtonElement {
	const button = document.createElement('button');
	button.className = 'code-copy-btn';
	button.title = 'Copy to clipboard';
	button.innerHTML = COPY_ICON;

	button.addEventListener('click', async () => {
		try {
			await navigator.clipboard.writeText(code);
			button.classList.add('copied');
			button.innerHTML = CHECK_ICON;
			setTimeout(() => {
				button.classList.remove('copied');
				button.innerHTML = COPY_ICON;
			}, COPY_FEEDBACK_DURATION);
		} catch (e) {
			console.warn('Failed to copy:', e);
		}
	});

	return button;
}
