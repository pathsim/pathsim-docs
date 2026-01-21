/**
 * Markdown renderer with KaTeX math support
 */

import { marked } from 'marked';
import { loadKatex } from './katexLoader';

// Configure marked
marked.setOptions({
	gfm: true,
	breaks: false
});

/**
 * Render markdown to HTML with KaTeX math support
 */
export async function renderMarkdown(markdown: string): Promise<string> {
	if (!markdown?.trim()) {
		return '';
	}

	// First pass: protect math blocks from markdown processing
	const mathBlocks: { placeholder: string; latex: string; display: boolean }[] = [];
	let counter = 0;

	// Replace display math ($$...$$) with placeholders
	let processed = markdown.replace(/\$\$([\s\S]*?)\$\$/g, (_, latex) => {
		const placeholder = `__MATH_DISPLAY_${counter++}__`;
		mathBlocks.push({ placeholder, latex: latex.trim(), display: true });
		return placeholder;
	});

	// Replace inline math ($...$) with placeholders
	// Handles single chars like $x$ and expressions like $x + y$
	// Requires non-whitespace at start and end to avoid matching currency
	processed = processed.replace(/\$([^\s$](?:[^$]*[^\s$])?)\$/g, (_, latex) => {
		const placeholder = `__MATH_INLINE_${counter++}__`;
		mathBlocks.push({ placeholder, latex: latex.trim(), display: false });
		return placeholder;
	});

	// Render markdown
	let html = await marked.parse(processed);

	// Load KaTeX and replace placeholders with rendered math
	if (mathBlocks.length > 0) {
		const k = await loadKatex();

		for (const { placeholder, latex, display } of mathBlocks) {
			try {
				const rendered = k.default.renderToString(latex, {
					displayMode: display,
					throwOnError: false,
					strict: false
				});
				const wrapper = display
					? `<div class="katex-display">${rendered}</div>`
					: `<span class="katex-inline">${rendered}</span>`;
				html = html.replace(placeholder, wrapper);
			} catch (e) {
				console.warn('KaTeX error:', e);
				html = html.replace(placeholder, `<code class="katex-error">${latex}</code>`);
			}
		}
	}

	return html;
}

/**
 * Render markdown synchronously (without math support)
 * Use this when you don't need math or are in a sync context
 */
export function renderMarkdownSync(markdown: string): string {
	if (!markdown?.trim()) {
		return '';
	}
	return marked.parse(markdown, { async: false }) as string;
}
