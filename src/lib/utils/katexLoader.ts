/**
 * Shared KaTeX loader - lazy loads KaTeX library on first use
 */

import { CDN } from '$lib/config/cdn';

let katex: typeof import('katex') | null = null;

export async function loadKatex(): Promise<typeof import('katex')> {
	if (katex) return katex;
	katex = await import('katex');
	return katex;
}

export function getKatexCssUrl(): string {
	return CDN.katex.css;
}

/**
 * Render LaTeX math to HTML string
 */
export async function renderMath(latex: string, displayMode = false): Promise<string> {
	const k = await loadKatex();
	try {
		return k.default.renderToString(latex, {
			displayMode,
			throwOnError: false,
			strict: false
		});
	} catch (e) {
		console.warn('KaTeX error:', e);
		return `<code class="katex-error">${latex}</code>`;
	}
}
