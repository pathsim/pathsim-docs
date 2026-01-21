<script lang="ts">
	/**
	 * MarkdownRenderer - Renders markdown content with same styling as DocstringRenderer
	 * Mirrors DocstringRenderer functionality: KaTeX math, CodeMirror code blocks, cross-refs
	 */
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { marked } from 'marked';
	import { loadKatex, getKatexCssUrl } from '$lib/utils/katexLoader';
	import { loadCodeMirrorModules, createEditorExtensions, type CodeMirrorModules } from '$lib/utils/codemirror';
	import { theme } from '$lib/stores/themeStore';
	import { processCrossRefs } from '$lib/utils/crossref';
	import { searchTarget } from '$lib/stores/searchNavigation';
	import { createCopyButton } from '$lib/utils/copyButton';

	interface Props {
		/** Markdown source to render */
		markdown: string;
	}

	let { markdown }: Props = $props();

	let container: HTMLDivElement | undefined = $state();
	let cmModules: CodeMirrorModules | null = null;
	let editorViews: import('@codemirror/view').EditorView[] = [];
	let codeBlocks: { wrapper: HTMLElement; code: string }[] = [];

	// Configure marked
	marked.setOptions({
		gfm: true,
		breaks: false
	});

	/**
	 * Protect math blocks from marked processing
	 * Replaces $$...$$ and $...$ with placeholders, returns map of placeholders
	 */
	function protectMath(text: string): { text: string; blocks: Map<string, { content: string; isDisplay: boolean }> } {
		const blocks = new Map<string, { content: string; isDisplay: boolean }>();
		let counter = 0;

		// Protect display math first ($$...$$) - can span multiple lines
		text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, content) => {
			const id = `MATHDISPLAY${counter++}ENDMATH`;
			blocks.set(id, { content: content.trim(), isDisplay: true });
			return id;
		});

		// Protect inline math ($...$) - single line only
		text = text.replace(/\$([^\s$][^$]*[^\s$]|\S)\$/g, (_, content) => {
			const id = `MATHINLINE${counter++}ENDMATH`;
			blocks.set(id, { content: content.trim(), isDisplay: false });
			return id;
		});

		return { text, blocks };
	}

	// Convert markdown to HTML and extract math blocks
	let processedMarkdown = $derived.by(() => {
		if (!markdown?.trim()) return { html: '', mathBlocks: new Map<string, { content: string; isDisplay: boolean }>() };
		// Protect math blocks before marked processes them
		const { text: protected_, blocks } = protectMath(markdown);
		const rawHtml = marked.parse(protected_, { async: false }) as string;
		return { html: processCrossRefs(rawHtml), mathBlocks: blocks };
	});

	let html = $derived(processedMarkdown.html);
	let mathBlocks = $derived(processedMarkdown.mathBlocks);

	/**
	 * Convert LaTeX environments not well-supported by KaTeX
	 */
	function preprocessLatex(latex: string): string {
		// Convert eqnarray to aligned (KaTeX doesn't support eqnarray well)
		latex = latex.replace(/\\begin\{eqnarray\*?\}/g, '\\begin{aligned}');
		latex = latex.replace(/\\end\{eqnarray\*?\}/g, '\\end{aligned}');
		// Convert =& to &= for aligned environment
		latex = latex.replace(/=&/g, '&=');
		return latex;
	}

	/**
	 * Render math by replacing placeholders with KaTeX HTML
	 */
	async function renderMath() {
		if (!container || mathBlocks.size === 0) return;

		const k = await loadKatex();

		let innerHTML = container.innerHTML;

		for (const [id, { content, isDisplay }] of mathBlocks) {
			try {
				// Preprocess LaTeX for KaTeX compatibility
				const processedContent = preprocessLatex(content);

				const rendered = k.default.renderToString(processedContent, {
					displayMode: isDisplay,
					throwOnError: true,
					strict: false,
					trust: true
				});

				const wrapper = isDisplay
					? `<div class="katex-display">${rendered}</div>`
					: `<span class="katex-inline">${rendered}</span>`;

				// Replace placeholder (may be wrapped in <p> tags by marked)
				innerHTML = innerHTML.replace(new RegExp(`(<p>)?${id}(</p>)?`, 'g'), wrapper);
			} catch (e) {
				console.warn('KaTeX error for:', content, e);
				// Show error with the original content
				const escaped = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
				innerHTML = innerHTML.replace(new RegExp(`(<p>)?${id}(</p>)?`, 'g'), `<code class="katex-error">${escaped}</code>`);
			}
		}

		container.innerHTML = innerHTML;
	}

	/**
	 * Detect language from code content
	 */
	function detectLanguage(code: string): 'python' | 'console' {
		if (code.includes('>>>') || code.includes('...')) {
			return 'console';
		}
		return 'python';
	}

	/**
	 * Render code blocks with CodeMirror
	 */
	async function renderCodeBlocks() {
		if (!container) return;

		// Clean up existing editors
		for (const view of editorViews) {
			view.destroy();
		}
		editorViews = [];
		codeBlocks = [];

		cmModules = await loadCodeMirrorModules();
		const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

		const preElements = container.querySelectorAll('pre');

		for (const preEl of preElements) {
			if (preEl.classList.contains('cm-processed')) continue;

			const codeEl = preEl.querySelector('code');
			const code = codeEl ? codeEl.textContent : preEl.textContent;
			if (!code?.trim()) continue;

			preEl.classList.add('cm-processed');

			const trimmedCode = code.trim();
			const language = detectLanguage(trimmedCode);

			// Create wrapper div
			const wrapper = document.createElement('div');
			wrapper.className = 'code-block-wrapper';

			// Create header
			const header = document.createElement('div');
			header.className = 'code-block-header';

			const label = document.createElement('span');
			label.className = 'label-uppercase';
			label.textContent = language === 'console' ? 'CONSOLE' : 'PYTHON';
			header.appendChild(label);

			header.appendChild(createCopyButton(trimmedCode));
			wrapper.appendChild(header);

			// Create editor container
			const editorDiv = document.createElement('div');
			editorDiv.className = 'cm-container';
			wrapper.appendChild(editorDiv);

			preEl.parentNode?.replaceChild(wrapper, preEl);

			codeBlocks.push({ wrapper, code: trimmedCode });

			const view = new cmModules.EditorView({
				doc: trimmedCode,
				extensions: createEditorExtensions(cmModules, isDark, { readOnly: true }),
				parent: editorDiv
			});

			editorViews.push(view);
		}
	}

	/**
	 * Update code blocks on theme change
	 */
	async function updateCodeBlockTheme() {
		if (!cmModules || codeBlocks.length === 0) return;

		const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

		for (const view of editorViews) {
			view.destroy();
		}
		editorViews = [];

		for (const { wrapper, code } of codeBlocks) {
			const editorDiv = wrapper.querySelector('.cm-container');
			if (!editorDiv) continue;

			editorDiv.innerHTML = '';

			const view = new cmModules.EditorView({
				doc: code,
				extensions: createEditorExtensions(cmModules, isDark, { readOnly: true }),
				parent: editorDiv as HTMLElement
			});

			editorViews.push(view);
		}
	}

	/**
	 * Handle clicks on cross-reference links
	 */
	function handleCrossRefClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		const link = target.closest('a.crossref') as HTMLAnchorElement;

		if (link) {
			event.preventDefault();
			const href = link.getAttribute('href');
			if (!href) return;

			// Extract the target name from the hash
			const hashIndex = href.indexOf('#');
			if (hashIndex >= 0) {
				const targetName = href.slice(hashIndex + 1);
				const linkType = link.classList.contains('crossref-class') ? 'class'
					: link.classList.contains('crossref-function') ? 'function'
					: link.classList.contains('crossref-method') ? 'method'
					: 'module';

				// Set search target to trigger expansion/scroll
				searchTarget.set({
					name: targetName,
					type: linkType as 'class' | 'function' | 'method' | 'module'
				});
			}

			// Navigate to the path
			goto(href);
		}
	}

	let hasRendered = false;

	onMount(() => {
		// Add KaTeX CSS
		if (!document.querySelector('link[href*="katex"]')) {
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = getKatexCssUrl();
			document.head.appendChild(link);
		}

		return () => {
			for (const view of editorViews) {
				view.destroy();
			}
			editorViews = [];
			codeBlocks = [];
		};
	});

	// Watch for theme changes
	$effect(() => {
		const currentTheme = $theme;
		if (codeBlocks.length > 0) {
			updateCodeBlockTheme();
		}
	});

	// Render when container and html are ready
	$effect(() => {
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

<div class="markdown-content" bind:this={container} onclick={handleCrossRefClick}>
	{@html html}
</div>

<style>
	/* Base styling - matches DocstringRenderer exactly */
	.markdown-content {
		font-size: var(--font-base);
		line-height: 1.7;
		color: var(--text-muted);
	}

	.markdown-content :global(p) {
		margin-bottom: 0.75em;
	}

	.markdown-content :global(p:last-child) {
		margin-bottom: 0;
	}

	/* Code block styles are in app.css */

	/* Lists */
	.markdown-content :global(ul),
	.markdown-content :global(ol) {
		margin: var(--space-sm) 0;
		padding-left: var(--space-xl);
	}

	.markdown-content :global(li) {
		margin-bottom: var(--space-xs);
	}

	/* Header and crossref styles are in app.css for consistency */

	/* Tables */
	.markdown-content :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin: var(--space-md) 0;
		font-size: var(--font-base);
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

	/* Inline code - plain style, no pill */
	.markdown-content :global(code) {
		font-family: var(--font-mono);
		font-size: inherit;
	}

	/* Blockquote */
	.markdown-content :global(blockquote) {
		margin: var(--space-md) 0;
		padding-left: var(--space-md);
		border-left: 3px solid var(--accent);
		color: var(--text-muted);
	}

	/* Strong */
	.markdown-content :global(strong) {
		font-weight: 600;
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

	/* KaTeX styling */
	.markdown-content :global(.katex-display) {
		margin: var(--space-md) 0;
		overflow-x: auto;
	}

	.markdown-content :global(.katex-error) {
		font-family: var(--font-mono);
		font-size: var(--font-base);
		color: var(--text-muted);
	}

	/* Cross-reference link styles are in app.css for consistency */
</style>
