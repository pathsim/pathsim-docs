<script lang="ts">
	/**
	 * MarkdownCell - Renders markdown content with KaTeX math support
	 * Uses same post-processing approach as DocstringRenderer
	 */
	import { onMount, tick } from 'svelte';
	import { marked } from 'marked';
	import { loadKatex, getKatexCssUrl } from '$lib/utils/katexLoader';
	import type { MarkdownCellData } from '$lib/notebook/types';

	interface Props {
		cell: MarkdownCellData;
	}

	let { cell }: Props = $props();

	let container: HTMLDivElement | undefined = $state();
	let loading = $state(true);

	// Configure marked
	marked.setOptions({
		gfm: true,
		breaks: false
	});

	/**
	 * Render math with KaTeX - same approach as DocstringRenderer
	 */
	async function renderMath() {
		if (!container) return;

		const k = await loadKatex();

		// Process the text content to find $...$ and $$...$$ patterns
		const walker = document.createTreeWalker(
			container,
			NodeFilter.SHOW_TEXT,
			null
		);

		const textNodes: Text[] = [];
		let node: Text | null;
		while ((node = walker.nextNode() as Text | null)) {
			if (node.textContent && (node.textContent.includes('$'))) {
				textNodes.push(node);
			}
		}

		for (const textNode of textNodes) {
			const text = textNode.textContent || '';

			// Skip if inside code/pre elements
			let parent = textNode.parentElement;
			let inCode = false;
			while (parent && parent !== container) {
				if (parent.tagName === 'CODE' || parent.tagName === 'PRE') {
					inCode = true;
					break;
				}
				parent = parent.parentElement;
			}
			if (inCode) continue;

			// Find and replace math patterns
			const fragment = document.createDocumentFragment();
			let lastIndex = 0;
			let hasMatch = false;

			// Combined regex for display ($$...$$) and inline ($...$) math
			const mathRegex = /\$\$([\s\S]*?)\$\$|\$([^\s$](?:[^$]*[^\s$])?)\$/g;
			let match;

			while ((match = mathRegex.exec(text)) !== null) {
				hasMatch = true;

				// Add text before match
				if (match.index > lastIndex) {
					fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
				}

				const isDisplay = match[1] !== undefined;
				const latex = (match[1] || match[2]).trim();

				try {
					const rendered = k.default.renderToString(latex, {
						displayMode: isDisplay,
						throwOnError: false,
						strict: false
					});

					if (isDisplay) {
						const div = document.createElement('div');
						div.className = 'katex-display';
						div.innerHTML = rendered;
						fragment.appendChild(div);
					} else {
						const span = document.createElement('span');
						span.className = 'katex-inline';
						span.innerHTML = rendered;
						fragment.appendChild(span);
					}
				} catch (e) {
					console.warn('KaTeX error for:', latex, e);
					const code = document.createElement('code');
					code.className = 'katex-error';
					code.textContent = latex;
					fragment.appendChild(code);
				}

				lastIndex = match.index + match[0].length;
			}

			if (hasMatch) {
				// Add remaining text
				if (lastIndex < text.length) {
					fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
				}
				textNode.parentNode?.replaceChild(fragment, textNode);
			}
		}
	}

	async function render() {
		if (!container) return;

		// Render markdown to HTML
		const html = await marked.parse(cell.source);
		container.innerHTML = html;

		// Post-process: render math with KaTeX
		await renderMath();

		loading = false;
	}

	onMount(async () => {
		// Ensure KaTeX CSS is loaded
		if (!document.querySelector('link[href*="katex"]')) {
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = getKatexCssUrl();
			document.head.appendChild(link);
		}

		await tick();
		await render();
	});

	// Re-render when source changes
	$effect(() => {
		const source = cell.source;
		if (container && !loading) {
			render();
		}
	});
</script>

<div class="markdown-cell">
	<div class="markdown-content" bind:this={container}>
		{#if loading}
			<div class="loading">Loading...</div>
		{/if}
	</div>
</div>

<style>
	.markdown-cell {
		padding: var(--space-md) 0;
	}

	/* Base content styling - matches DocstringRenderer */
	.markdown-content {
		font-size: var(--font-sm);
		line-height: 1.7;
		color: var(--text-muted);
	}

	/* Paragraphs */
	.markdown-content :global(p) {
		margin-bottom: 0.75em;
	}

	.markdown-content :global(p:last-child) {
		margin-bottom: 0;
	}

	/* Remove top margin from first element */
	.markdown-content :global(> *:first-child) {
		margin-top: 0;
	}

	/* Remove bottom margin from last element */
	.markdown-content :global(> *:last-child) {
		margin-bottom: 0;
	}

	/* Headings - H1 as notebook title */
	.markdown-content :global(h1) {
		font-size: var(--font-2xl);
		font-weight: 600;
		color: var(--text);
		margin-bottom: var(--space-lg);
		padding-bottom: var(--space-sm);
		border-bottom: 1px solid var(--border);
	}

	.markdown-content :global(h2) {
		font-size: var(--font-xl);
		font-weight: 600;
		color: var(--text);
		margin-top: var(--space-xl);
		margin-bottom: var(--space-md);
	}

	.markdown-content :global(h3) {
		font-size: var(--font-lg);
		font-weight: 600;
		color: var(--text);
		margin-top: var(--space-lg);
		margin-bottom: var(--space-sm);
	}

	.markdown-content :global(h4) {
		font-size: var(--font-base);
		font-weight: 600;
		color: var(--text);
		margin-top: var(--space-md);
		margin-bottom: var(--space-xs);
	}

	/* Inline code - matches DocstringRenderer */
	.markdown-content :global(code) {
		font-family: var(--font-mono);
		font-size: 0.9em;
		background: var(--surface-raised);
		padding: 1px 4px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
	}

	/* Code blocks - panel style */
	.markdown-content :global(pre) {
		margin: var(--space-md) 0;
		padding: var(--space-md);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		overflow-x: auto;
	}

	.markdown-content :global(pre code) {
		font-family: var(--font-mono);
		font-size: var(--font-sm);
		background: none;
		padding: 0;
		border: none;
		border-radius: 0;
	}

	/* Lists - matches DocstringRenderer */
	.markdown-content :global(ul),
	.markdown-content :global(ol) {
		margin: var(--space-sm) 0;
		padding-left: var(--space-xl);
	}

	.markdown-content :global(li) {
		margin-bottom: var(--space-xs);
	}

	/* Nested lists */
	.markdown-content :global(li > ul),
	.markdown-content :global(li > ol) {
		margin-top: var(--space-xs);
		margin-bottom: 0;
	}

	/* Blockquote - matches DocstringRenderer */
	.markdown-content :global(blockquote) {
		margin: var(--space-md) 0;
		padding-left: var(--space-md);
		border-left: 3px solid var(--accent);
		color: var(--text-muted);
	}

	.markdown-content :global(blockquote p) {
		margin-bottom: var(--space-xs);
	}

	/* Tables - matches DocstringRenderer */
	.markdown-content :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin: var(--space-md) 0;
		font-size: var(--font-sm);
	}

	.markdown-content :global(th),
	.markdown-content :global(td) {
		padding: var(--space-xs) var(--space-sm);
		border: 1px solid var(--border);
		text-align: left;
	}

	.markdown-content :global(th) {
		background: var(--surface-raised);
		font-weight: 600;
		color: var(--text-muted);
	}

	/* Strong/Bold */
	.markdown-content :global(strong) {
		font-weight: 600;
		color: var(--text);
	}

	/* Emphasis/Italic */
	.markdown-content :global(em) {
		font-style: italic;
	}

	/* Links */
	.markdown-content :global(a) {
		color: var(--accent);
		text-decoration: none;
	}

	.markdown-content :global(a:hover) {
		text-decoration: underline;
	}

	/* Horizontal rule */
	.markdown-content :global(hr) {
		margin: var(--space-lg) 0;
		border: none;
		border-top: 1px solid var(--border);
	}

	/* Images */
	.markdown-content :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: var(--radius-sm);
	}

	/* KaTeX math - matches DocstringRenderer */
	.markdown-content :global(.katex-display) {
		margin: var(--space-md) 0;
		overflow-x: auto;
	}

	.markdown-content :global(.katex-error) {
		font-family: var(--font-mono);
		font-size: var(--font-sm);
		color: var(--error);
	}

	.loading {
		color: var(--text-muted);
		font-size: var(--font-sm);
	}
</style>
