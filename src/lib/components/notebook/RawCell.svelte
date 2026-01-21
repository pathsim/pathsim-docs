<script lang="ts">
	/**
	 * RawCell - Renders raw cell content (RST directives, etc.)
	 * Attempts to parse common patterns, falls back to hidden or preformatted
	 */
	import type { RawCellData } from '$lib/notebook/types';

	interface Props {
		cell: RawCellData;
		/** Base path for resolving relative image paths */
		basePath?: string;
	}

	let { cell, basePath = '' }: Props = $props();

	// Parse RST image directive
	interface ImageDirective {
		type: 'image';
		src: string;
		alt?: string;
		width?: string;
		align?: string;
	}

	// Parse RST note/warning directives
	interface AdmonitionDirective {
		type: 'note' | 'warning' | 'tip' | 'important';
		content: string;
	}

	type ParsedContent =
		| ImageDirective
		| AdmonitionDirective
		| { type: 'text'; content: string }
		| { type: 'hidden' };

	function parseRawContent(source: string): ParsedContent {
		const trimmed = source.trim();

		// Check for RST image directive
		const imageMatch = trimmed.match(/^\.\.\s+image::\s*(.+?)(?:\n|$)([\s\S]*)/);
		if (imageMatch) {
			const src = imageMatch[1].trim();
			const options = imageMatch[2] || '';

			// Parse options
			const widthMatch = options.match(/:width:\s*(\d+)/);
			const alignMatch = options.match(/:align:\s*(\w+)/);
			const altMatch = options.match(/:alt:\s*(.+?)(?:\n|$)/);

			return {
				type: 'image',
				src: src,
				width: widthMatch?.[1],
				align: alignMatch?.[1],
				alt: altMatch?.[1]
			};
		}

		// Check for RST note/warning directives
		const admonitionMatch = trimmed.match(
			/^\.\.\s+(note|warning|tip|important)::\s*([\s\S]*)/i
		);
		if (admonitionMatch) {
			return {
				type: admonitionMatch[1].toLowerCase() as 'note' | 'warning' | 'tip' | 'important',
				content: admonitionMatch[2].trim()
			};
		}

		// Check for Sphinx cross-references (just render as text)
		if (trimmed.includes(':class:') || trimmed.includes(':func:') || trimmed.includes(':meth:')) {
			// Convert Sphinx refs to plain text
			const cleaned = trimmed
				.replace(/:class:`\.?([^`]+)`/g, '$1')
				.replace(/:func:`\.?([^`]+)`/g, '$1')
				.replace(/:meth:`\.?([^`]+)`/g, '$1')
				.replace(/:mod:`\.?([^`]+)`/g, '$1')
				.replace(/:ref:`([^`]+)`/g, '$1');
			return { type: 'text', content: cleaned };
		}

		// Check if it looks like RST that we can't parse - hide it
		if (trimmed.startsWith('..') && !trimmed.startsWith('...')) {
			return { type: 'hidden' };
		}

		// Plain text
		if (trimmed) {
			return { type: 'text', content: trimmed };
		}

		return { type: 'hidden' };
	}

	let parsed = $derived(parseRawContent(cell.source));

	function resolveImagePath(src: string): string {
		// If absolute URL, use as-is
		if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
			return src;
		}
		// Combine with base path
		if (basePath) {
			return `${basePath}/${src}`.replace(/\/+/g, '/');
		}
		return src;
	}
</script>

{#if parsed.type === 'image'}
	<div class="raw-cell image-cell" style:text-align={parsed.align || 'center'}>
		<img
			src={resolveImagePath(parsed.src)}
			alt={parsed.alt || 'Notebook image'}
			style:max-width={parsed.width ? `${parsed.width}px` : '100%'}
		/>
	</div>
{:else if parsed.type === 'note' || parsed.type === 'warning' || parsed.type === 'tip' || parsed.type === 'important'}
	<div class="raw-cell admonition {parsed.type}">
		<div class="admonition-title">{parsed.type}</div>
		<div class="admonition-content">{parsed.content}</div>
	</div>
{:else if parsed.type === 'text'}
	<div class="raw-cell text-cell">
		<p>{parsed.content}</p>
	</div>
{:else}
	<!-- Hidden raw cell - render nothing -->
{/if}

<style>
	.raw-cell {
		padding: var(--space-md) 0;
	}

	/* Image cell */
	.image-cell img {
		max-width: 100%;
		height: auto;
		border-radius: var(--radius-md);
	}

	/* Admonition cells */
	.admonition {
		padding: var(--space-md) var(--space-lg);
		border-radius: var(--radius-md);
		border-left: 4px solid;
	}

	.admonition.note {
		background: var(--accent-bg);
		border-color: var(--accent);
	}

	.admonition.warning {
		background: var(--warning-bg);
		border-color: var(--warning);
	}

	.admonition.tip {
		background: var(--success-bg);
		border-color: var(--success);
	}

	.admonition.important {
		background: var(--error-bg);
		border-color: var(--error);
	}

	.admonition-title {
		font-weight: 600;
		text-transform: capitalize;
		margin-bottom: var(--space-sm);
		font-size: var(--font-sm);
	}

	.note .admonition-title {
		color: var(--accent);
	}

	.warning .admonition-title {
		color: var(--warning);
	}

	.tip .admonition-title {
		color: var(--success);
	}

	.important .admonition-title {
		color: var(--error);
	}

	.admonition-content {
		color: var(--text-muted);
		font-size: var(--font-sm);
	}

	/* Text cell */
	.text-cell p {
		margin: 0;
		color: var(--text-muted);
	}
</style>
