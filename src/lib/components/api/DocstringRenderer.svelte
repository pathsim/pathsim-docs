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

	// Render math with KaTeX (same approach as PathView)
	async function renderMath() {
		if (!container) return;

		const k = await loadKatex();
		katexLoaded = true;

		// Find all math elements - docutils MathJax output uses <div class="math"> with LaTeX content
		const mathElements = container.querySelectorAll('.math');

		for (const el of mathElements) {
			// Skip if already rendered
			if (el.classList.contains('katex-rendered')) continue;

			const latex = el.textContent || '';
			if (!latex.trim()) continue;

			try {
				// Clean up the LaTeX
				let cleaned = latex
					.replace(/^\\\(|\\\)$/g, '')  // Remove \( \) delimiters
					.replace(/^\\\[|\\\]$/g, '')  // Remove \[ \] delimiters
					.trim();

				// Convert unsupported environments
				cleaned = cleaned
					.replace(/\\begin\{eqnarray\*?\}/g, '\\begin{aligned}')
					.replace(/\\end\{eqnarray\*?\}/g, '\\end{aligned}');

				// Wrap multi-line equations in aligned environment if not already wrapped
				if (cleaned.includes('\\\\') && !cleaned.includes('\\begin{')) {
					cleaned = `\\begin{aligned}${cleaned}\\end{aligned}`;
				}

				const isDisplay = el.tagName === 'DIV' || latex.includes('\\[');

				const rendered = k.default.renderToString(cleaned, {
					displayMode: isDisplay,
					throwOnError: false,
					strict: false
				});

				el.innerHTML = rendered;
				el.classList.add('katex-rendered');
			} catch (e) {
				console.warn('KaTeX error for:', latex, e);
				// Leave original content
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

	// Track if we've done initial render
	let hasRendered = false;

	onMount(() => {
		// Add KaTeX CSS
		if (!document.querySelector('link[href*="katex"]')) {
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = getKatexCssUrl();
			document.head.appendChild(link);
		}

		// Watch for theme changes to re-render code blocks
		observer = new MutationObserver(() => {
			// Only re-render if we have existing editors
			if (editorViews.length > 0) {
				renderCodeBlocks();
			}
		});
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

		return () => {
			observer?.disconnect();
			for (const view of editorViews) {
				view.destroy();
			}
			editorViews = [];
		};
	});

	// Render when container is ready and html is set
	$effect(() => {
		// Access html to create dependency
		const currentHtml = html;

		if (currentHtml && container && !hasRendered) {
			hasRendered = true;
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
		color: var(--text-muted);
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

	/* Definition lists - styled as parameter cards */
	.docstring-content :global(dl.docutils) {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		margin: var(--space-md) 0;
	}

	.docstring-content :global(dl.docutils dt) {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		padding-bottom: 0;
		background: var(--surface-raised);
		border-radius: var(--radius-md) var(--radius-md) 0 0;
		font-family: var(--font-mono);
		font-size: var(--font-sm);
		color: var(--accent);
		font-weight: 500;
		margin: 0;
	}

	/* Type annotations in dt */
	.docstring-content :global(dl.docutils dt .classifier-delimiter) {
		color: var(--text-muted);
		margin: 0 var(--space-xs);
	}

	.docstring-content :global(dl.docutils dt .classifier) {
		font-family: var(--font-mono);
		font-size: var(--font-xs);
		color: var(--text-muted);
		font-weight: 400;
	}

	.docstring-content :global(dl.docutils dd) {
		margin: 0;
		padding: var(--space-xs) var(--space-md) var(--space-sm);
		background: var(--surface-raised);
		border-radius: 0 0 var(--radius-md) var(--radius-md);
		color: var(--text-muted);
		font-size: var(--font-sm);
		line-height: 1.5;
	}

	/* When dd follows dd (multiple descriptions), adjust spacing */
	.docstring-content :global(dl.docutils dd + dd) {
		margin-top: calc(-1 * var(--space-sm));
		padding-top: 0;
		border-radius: 0 0 var(--radius-md) var(--radius-md);
	}

	/* Generic dl fallback */
	.docstring-content :global(dl:not(.docutils)) {
		margin: var(--space-md) 0;
	}

	.docstring-content :global(dl:not(.docutils) dt) {
		font-family: var(--font-mono);
		font-size: var(--font-sm);
		color: var(--accent);
		margin-top: var(--space-sm);
		font-weight: 500;
	}

	.docstring-content :global(dl:not(.docutils) dd) {
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

	/* RST section containers - full width separator ABOVE */
	.docstring-content :global(.section) {
		position: relative;
		margin-top: var(--space-lg);
		padding-top: var(--space-lg);
	}

	.docstring-content :global(.section::before) {
		content: '';
		position: absolute;
		top: 0;
		left: calc(-1 * var(--space-lg));
		right: calc(-1 * var(--space-lg));
		height: 1px;
		background: var(--border);
	}

	.docstring-content :global(.section:first-child) {
		margin-top: var(--space-md);
		padding-top: 0;
	}

	.docstring-content :global(.section:first-child::before) {
		display: none;
	}

	/* Section headers - consistent style for h3, h4 */
	.docstring-content :global(h3),
	.docstring-content :global(h4) {
		font-family: var(--font-ui);
		font-size: var(--font-xs);
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin: 0 0 var(--space-sm) 0;
		padding: 0;
		border: none;
	}

	/* NumPy-style section headers converted to <p><strong> - full width separator ABOVE */
	.docstring-content :global(p:has(> strong:only-child)) {
		position: relative;
		font-family: var(--font-ui);
		font-size: var(--font-xs);
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-top: var(--space-lg);
		margin-bottom: var(--space-sm);
		padding-top: var(--space-lg);
	}

	.docstring-content :global(p:has(> strong:only-child)::before) {
		content: '';
		position: absolute;
		top: 0;
		left: calc(-1 * var(--space-lg));
		right: calc(-1 * var(--space-lg));
		height: 1px;
		background: var(--border);
	}

	.docstring-content :global(p:first-child:has(> strong:only-child)) {
		margin-top: 0;
		padding-top: 0;
	}

	.docstring-content :global(p:first-child:has(> strong:only-child)::before) {
		display: none;
	}

	/* Ensure strong inside header paragraphs inherits style */
	.docstring-content :global(p:has(> strong:only-child) > strong) {
		font-weight: inherit;
		color: inherit;
	}

	.docstring-content :global(strong) {
		font-weight: 600;
	}

	/* MathML styling (native browser rendering) */
	.docstring-content :global(math) {
		font-family: 'Latin Modern Math', 'STIX Two Math', 'Cambria Math', 'Times New Roman', serif;
		font-size: 1.1em;
		color: var(--text);
	}

	/* Block math (display mode) */
	.docstring-content :global(div > math[display="block"]),
	.docstring-content :global(math[display="block"]) {
		display: block;
		margin: var(--space-md) 0;
		text-align: center;
		overflow-x: auto;
	}

	/* Inline math */
	.docstring-content :global(p math),
	.docstring-content :global(math:not([display="block"])) {
		display: inline;
		vertical-align: middle;
	}

	/* Math container divs */
	.docstring-content :global(div:has(> math[display="block"])) {
		margin: var(--space-md) 0;
		padding: var(--space-sm) var(--space-md);
		background: var(--surface-raised);
		border-radius: var(--radius-md);
		overflow-x: auto;
	}

	/* KaTeX styling - use default sizing (~1.21em for better math readability) */
	.docstring-content :global(.katex) {
		/* Let KaTeX use its default font-size */
	}

	.docstring-content :global(.katex-display) {
		margin: var(--space-md) 0;
		overflow-x: auto;
	}

	/* Math fallback (before KaTeX renders) */
	.docstring-content :global(.katex-error),
	.docstring-content :global(.math:not(.katex-rendered)) {
		font-family: var(--font-mono);
		font-size: var(--font-sm);
		color: var(--text-muted);
	}

	/* Math container styling */
	.docstring-content :global(div.math) {
		margin: var(--space-md) 0;
		text-align: center;
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
