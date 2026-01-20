<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { loadKatex, getKatexCssUrl } from '$lib/utils/katexLoader';
	import { loadCodeMirrorModules, createEditorExtensions, type CodeMirrorModules } from '$lib/utils/codemirror';

	interface Props {
		html: string;
	}

	let { html }: Props = $props();

	let container: HTMLDivElement | undefined = $state();
	let katexLoaded = $state(false);
	let cmModules: CodeMirrorModules | null = null;
	let editorViews: import('@codemirror/view').EditorView[] = [];

	// Render math with KaTeX
	async function renderMath() {
		if (!container) return;

		const k = await loadKatex();
		katexLoaded = true;

		// Find all math elements
		const inlineEls = container.querySelectorAll('.math-inline, span.math');
		const blockEls = container.querySelectorAll('.math-block, div.math');

		for (const el of inlineEls) {
			const latex = el.textContent || '';
			try {
				el.innerHTML = k.default.renderToString(latex, {
					displayMode: false,
					throwOnError: false,
					strict: false
				});
			} catch (e) {
				console.warn('KaTeX inline error:', e);
			}
		}

		for (const el of blockEls) {
			const latex = el.textContent || '';
			try {
				el.innerHTML = k.default.renderToString(latex, {
					displayMode: true,
					throwOnError: false,
					strict: false
				});
			} catch (e) {
				console.warn('KaTeX block error:', e);
			}
		}
	}

	// Render code blocks with CodeMirror
	async function renderCodeBlocks() {
		if (!container) return;

		// Clean up existing editors
		for (const view of editorViews) {
			view.destroy();
		}
		editorViews = [];

		cmModules = await loadCodeMirrorModules();
		const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

		// Find all pre elements that contain code
		// Handles: <pre><code>...</code></pre> and <pre class="code">...</pre>
		const preElements = container.querySelectorAll('pre');

		for (const preEl of preElements) {
			// Skip if already processed
			if (preEl.classList.contains('cm-processed')) continue;

			// Get code content - either from nested code element or directly from pre
			const codeEl = preEl.querySelector('code');
			const code = codeEl ? codeEl.textContent : preEl.textContent;
			if (!code?.trim()) continue;

			// Mark as processed
			preEl.classList.add('cm-processed');

			// Create wrapper div
			const wrapper = document.createElement('div');
			wrapper.className = 'code-block-wrapper';

			// Create editor container
			const editorDiv = document.createElement('div');
			editorDiv.className = 'cm-container';
			wrapper.appendChild(editorDiv);

			// Replace pre with wrapper
			preEl.parentNode?.replaceChild(wrapper, preEl);

			// Create CodeMirror editor
			const view = new cmModules.EditorView({
				doc: code.trim(),
				extensions: createEditorExtensions(cmModules, isDark, { readOnly: true }),
				parent: editorDiv
			});

			editorViews.push(view);
		}
	}

	// Watch for theme changes
	let observer: MutationObserver | null = null;

	onMount(() => {
		// Add KaTeX CSS
		if (!document.querySelector('link[href*="katex"]')) {
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = getKatexCssUrl();
			document.head.appendChild(link);
		}

		// Initial render
		tick().then(() => {
			renderMath();
			renderCodeBlocks();
		});

		// Watch for theme changes to re-render code blocks
		observer = new MutationObserver(() => {
			renderCodeBlocks();
		});
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

		return () => {
			observer?.disconnect();
			for (const view of editorViews) {
				view.destroy();
			}
		};
	});

	// Re-render when html changes
	$effect(() => {
		if (html && container) {
			tick().then(() => {
				renderMath();
				renderCodeBlocks();
			});
		}
	});
</script>

<div class="docstring-content" bind:this={container}>
	{@html html}
</div>

<style>
	.docstring-content {
		font-size: var(--font-sm);
		line-height: 1.7;
	}

	.docstring-content :global(p) {
		margin-bottom: 0.75em;
	}

	.docstring-content :global(p:last-child) {
		margin-bottom: 0;
	}

	/* Code block wrapper */
	.docstring-content :global(.code-block-wrapper) {
		margin: var(--space-md) 0;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.docstring-content :global(.cm-container) {
		background: var(--surface);
	}

	.docstring-content :global(.cm-editor) {
		font-size: var(--font-sm);
		max-height: 300px;
	}

	.docstring-content :global(.cm-scroller) {
		padding: var(--space-sm);
	}

	/* Hide line numbers for inline snippets */
	.docstring-content :global(.cm-gutters) {
		display: none;
	}

	/* Definition lists */
	.docstring-content :global(dl) {
		margin: var(--space-md) 0;
	}

	.docstring-content :global(dt) {
		font-family: var(--font-mono);
		font-size: var(--font-sm);
		color: var(--accent);
		margin-top: var(--space-sm);
		font-weight: 500;
	}

	.docstring-content :global(dd) {
		margin-left: var(--space-lg);
		color: var(--text-muted);
		margin-top: var(--space-xs);
	}

	/* Lists */
	.docstring-content :global(ul),
	.docstring-content :global(ol) {
		margin: var(--space-sm) 0;
		padding-left: var(--space-xl);
	}

	.docstring-content :global(li) {
		margin-bottom: var(--space-xs);
	}

	/* Section headers */
	.docstring-content :global(strong) {
		display: block;
		font-size: var(--font-sm);
		color: var(--text);
		margin-top: var(--space-lg);
		margin-bottom: var(--space-sm);
	}

	.docstring-content :global(strong:first-child) {
		margin-top: 0;
	}

	/* KaTeX styling */
	.docstring-content :global(.katex) {
		font-size: 1em;
	}

	.docstring-content :global(.katex-display) {
		margin: var(--space-md) 0;
		overflow-x: auto;
	}

	/* Math fallback */
	.docstring-content :global(.katex-error),
	.docstring-content :global(.math-inline),
	.docstring-content :global(.math-block) {
		font-family: var(--font-mono);
		font-size: var(--font-sm);
		color: var(--text-muted);
	}

	/* Tables */
	.docstring-content :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin: var(--space-md) 0;
		font-size: var(--font-sm);
	}

	.docstring-content :global(th),
	.docstring-content :global(td) {
		padding: var(--space-xs) var(--space-sm);
		border: 1px solid var(--border);
		text-align: left;
	}

	.docstring-content :global(th) {
		background: var(--surface-raised);
		font-weight: 600;
		color: var(--text-muted);
	}

	/* Inline code */
	.docstring-content :global(code) {
		font-family: var(--font-mono);
		font-size: 0.9em;
		background: var(--surface-raised);
		padding: 1px 4px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
	}

	/* Don't style code inside pre/codemirror */
	.docstring-content :global(pre code),
	.docstring-content :global(.cm-content code) {
		background: none;
		padding: 0;
		border: none;
		border-radius: 0;
	}

	/* Blockquote */
	.docstring-content :global(blockquote) {
		margin: var(--space-md) 0;
		padding-left: var(--space-md);
		border-left: 3px solid var(--accent);
		color: var(--text-muted);
	}
</style>
