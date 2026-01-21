<script lang="ts">
	/**
	 * RstRenderer - Renders RST content with same styling as DocstringRenderer
	 * Handles basic RST patterns: images, admonitions, cross-refs, text
	 * For full RST rendering, content should be pre-processed to HTML
	 */
	import { onMount, tick } from 'svelte';
	import { loadKatex, getKatexCssUrl } from '$lib/utils/katexLoader';
	import { loadCodeMirrorModules, createEditorExtensions, type CodeMirrorModules } from '$lib/utils/codemirror';
	import { theme } from '$lib/stores/themeStore';
	import { COPY_FEEDBACK_DURATION } from '$lib/config/timing';

	interface Props {
		/** RST source or pre-processed HTML */
		content: string;
		/** Whether content is already HTML (default: false, treats as RST) */
		isHtml?: boolean;
		/** Base path for resolving relative paths */
		basePath?: string;
	}

	let { content, isHtml = false, basePath = '' }: Props = $props();

	let container: HTMLDivElement | undefined = $state();
	let cmModules: CodeMirrorModules | null = null;
	let editorViews: import('@codemirror/view').EditorView[] = [];
	let codeBlocks: { wrapper: HTMLElement; code: string }[] = [];

	// RST parsing types
	interface ImageDirective {
		type: 'image';
		src: string;
		alt?: string;
		width?: string;
		align?: string;
	}

	interface AdmonitionDirective {
		type: 'admonition';
		kind: 'note' | 'warning' | 'tip' | 'important' | 'caution';
		content: string;
	}

	interface CodeBlockDirective {
		type: 'code';
		language: string;
		content: string;
	}

	interface MathDirective {
		type: 'math';
		content: string;
	}

	type ParsedBlock =
		| ImageDirective
		| AdmonitionDirective
		| CodeBlockDirective
		| MathDirective
		| { type: 'paragraph'; content: string }
		| { type: 'hidden' };

	/**
	 * Parse RST content into blocks
	 */
	function parseRst(source: string): ParsedBlock[] {
		const blocks: ParsedBlock[] = [];
		const lines = source.split('\n');
		let i = 0;

		while (i < lines.length) {
			const line = lines[i];
			const trimmed = line.trim();

			// Skip empty lines
			if (!trimmed) {
				i++;
				continue;
			}

			// Check for image directive
			const imageMatch = trimmed.match(/^\.\.\s+image::\s*(.+)/);
			if (imageMatch) {
				const src = imageMatch[1].trim();
				let width: string | undefined;
				let align: string | undefined;
				let alt: string | undefined;

				// Parse options on following lines
				i++;
				while (i < lines.length && lines[i].match(/^\s+:/)) {
					const optLine = lines[i].trim();
					const widthMatch = optLine.match(/:width:\s*(\d+)/);
					const alignMatch = optLine.match(/:align:\s*(\w+)/);
					const altMatch = optLine.match(/:alt:\s*(.+)/);
					if (widthMatch) width = widthMatch[1];
					if (alignMatch) align = alignMatch[1];
					if (altMatch) alt = altMatch[1];
					i++;
				}

				blocks.push({ type: 'image', src, width, align, alt });
				continue;
			}

			// Check for admonition directives
			const admonMatch = trimmed.match(/^\.\.\s+(note|warning|tip|important|caution)::\s*(.*)/i);
			if (admonMatch) {
				const kind = admonMatch[1].toLowerCase() as AdmonitionDirective['kind'];
				let content = admonMatch[2] || '';

				// Collect indented content
				i++;
				while (i < lines.length && (lines[i].startsWith('   ') || lines[i].trim() === '')) {
					if (lines[i].trim()) {
						content += (content ? '\n' : '') + lines[i].trim();
					}
					i++;
				}

				blocks.push({ type: 'admonition', kind, content });
				continue;
			}

			// Check for code-block directive
			const codeMatch = trimmed.match(/^\.\.\s+code-block::\s*(\w+)?/);
			if (codeMatch) {
				const language = codeMatch[1] || 'python';
				let codeContent = '';

				// Skip any options
				i++;
				while (i < lines.length && lines[i].match(/^\s+:/)) {
					i++;
				}

				// Collect code content
				while (i < lines.length && (lines[i].startsWith('   ') || lines[i].trim() === '')) {
					codeContent += (codeContent ? '\n' : '') + (lines[i].slice(3) || '');
					i++;
				}

				if (codeContent.trim()) {
					blocks.push({ type: 'code', language, content: codeContent.trim() });
				}
				continue;
			}

			// Check for math directive
			const mathMatch = trimmed.match(/^\.\.\s+math::/);
			if (mathMatch) {
				let mathContent = '';
				i++;
				while (i < lines.length && (lines[i].startsWith('   ') || lines[i].trim() === '')) {
					if (lines[i].trim()) {
						mathContent += (mathContent ? '\n' : '') + lines[i].trim();
					}
					i++;
				}
				if (mathContent) {
					blocks.push({ type: 'math', content: mathContent });
				}
				continue;
			}

			// Check for other RST directives we should hide
			if (trimmed.startsWith('..') && !trimmed.startsWith('...')) {
				// Skip this directive and any indented content
				i++;
				while (i < lines.length && (lines[i].startsWith('   ') || lines[i].trim() === '')) {
					i++;
				}
				continue;
			}

			// Regular paragraph - collect until empty line
			let para = trimmed;
			i++;
			while (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith('..')) {
				para += ' ' + lines[i].trim();
				i++;
			}

			// Clean up Sphinx cross-refs
			para = para
				.replace(/:class:`\.?([^`]+)`/g, '<code>$1</code>')
				.replace(/:func:`\.?([^`]+)`/g, '<code>$1()</code>')
				.replace(/:meth:`\.?([^`]+)`/g, '<code>$1()</code>')
				.replace(/:mod:`\.?([^`]+)`/g, '<code>$1</code>')
				.replace(/:ref:`([^`]+)`/g, '$1')
				.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
				.replace(/\*([^*]+)\*/g, '<em>$1</em>')
				.replace(/``([^`]+)``/g, '<code>$1</code>');

			blocks.push({ type: 'paragraph', content: para });
		}

		return blocks;
	}

	// Parse RST if not already HTML
	let parsedBlocks = $derived(isHtml ? [] : parseRst(content));

	function resolveImagePath(src: string): string {
		if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
			return src;
		}
		if (basePath) {
			return `${basePath}/${src}`.replace(/\/+/g, '/');
		}
		return src;
	}

	/**
	 * Render math with KaTeX
	 */
	async function renderMath() {
		if (!container) return;

		const k = await loadKatex();

		// Render math blocks
		const mathBlocks = container.querySelectorAll('.math-block:not(.katex-rendered)');
		for (const el of mathBlocks) {
			const latex = el.getAttribute('data-latex') || el.textContent || '';
			if (!latex.trim()) continue;

			try {
				const rendered = k.default.renderToString(latex.trim(), {
					displayMode: true,
					throwOnError: false,
					strict: false
				});
				el.innerHTML = rendered;
				el.classList.add('katex-rendered');
			} catch (e) {
				console.warn('KaTeX error:', e);
			}
		}
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
	 * Create copy button
	 */
	function createCopyButton(code: string): HTMLButtonElement {
		const button = document.createElement('button');
		button.className = 'code-copy-btn';
		button.title = 'Copy to clipboard';
		button.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

		button.addEventListener('click', async () => {
			try {
				await navigator.clipboard.writeText(code);
				button.classList.add('copied');
				button.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
				setTimeout(() => {
					button.classList.remove('copied');
					button.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
				}, COPY_FEEDBACK_DURATION);
			} catch (e) {
				console.warn('Failed to copy:', e);
			}
		});

		return button;
	}

	/**
	 * Render code blocks with CodeMirror
	 */
	async function renderCodeBlocks() {
		if (!container) return;

		for (const view of editorViews) {
			view.destroy();
		}
		editorViews = [];
		codeBlocks = [];

		cmModules = await loadCodeMirrorModules();
		const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

		const preElements = container.querySelectorAll('pre.code-block:not(.cm-processed)');

		for (const preEl of preElements) {
			const code = preEl.textContent || '';
			if (!code.trim()) continue;

			preEl.classList.add('cm-processed');

			const trimmedCode = code.trim();
			const language = detectLanguage(trimmedCode);

			const wrapper = document.createElement('div');
			wrapper.className = 'code-block-wrapper';

			const header = document.createElement('div');
			header.className = 'code-block-header';

			const label = document.createElement('span');
			label.className = 'label-uppercase';
			label.textContent = language === 'console' ? 'CONSOLE' : 'PYTHON';
			header.appendChild(label);

			header.appendChild(createCopyButton(trimmedCode));
			wrapper.appendChild(header);

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

	let hasRendered = false;

	onMount(() => {
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

	$effect(() => {
		const currentTheme = $theme;
		if (codeBlocks.length > 0) {
			updateCodeBlockTheme();
		}
	});

	$effect(() => {
		const _ = content;
		if (container && !hasRendered) {
			hasRendered = true;
			tick().then(() => {
				renderMath();
				renderCodeBlocks();
			});
		}
	});
</script>

<div class="rst-content" bind:this={container}>
	{#if isHtml}
		{@html content}
	{:else}
		{#each parsedBlocks as block}
			{#if block.type === 'paragraph'}
				<p>{@html block.content}</p>
			{:else if block.type === 'image'}
				<div class="image-block" style:text-align={block.align || 'center'}>
					<img
						src={resolveImagePath(block.src)}
						alt={block.alt || 'Image'}
						style:max-width={block.width ? `${block.width}px` : '100%'}
					/>
				</div>
			{:else if block.type === 'admonition'}
				<div class="admonition {block.kind}">
					<div class="admonition-title">{block.kind}</div>
					<div class="admonition-body">{block.content}</div>
				</div>
			{:else if block.type === 'code'}
				<pre class="code-block">{block.content}</pre>
			{:else if block.type === 'math'}
				<div class="math-block" data-latex={block.content}>{block.content}</div>
			{/if}
		{/each}
	{/if}
</div>

<style>
	/* Base styling - matches DocstringRenderer exactly */
	.rst-content {
		font-size: var(--font-sm);
		line-height: 1.7;
		color: var(--text-muted);
	}

	.rst-content :global(p) {
		margin-bottom: 0.75em;
	}

	.rst-content :global(p:last-child) {
		margin-bottom: 0;
	}

	/* Code block wrapper */
	.rst-content :global(.code-block-wrapper) {
		margin: var(--space-md) 0;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.rst-content :global(.code-block-header) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-xs) var(--space-md);
		background: var(--surface-raised);
		border-bottom: 1px solid var(--border);
	}

	.rst-content :global(.code-copy-btn) {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-xs);
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		cursor: pointer;
		transition: color var(--transition-fast), background var(--transition-fast);
	}

	.rst-content :global(.code-copy-btn:hover) {
		color: var(--text);
		background: var(--surface-hover);
	}

	.rst-content :global(.code-copy-btn.copied) {
		color: var(--success, #22c55e);
	}

	.rst-content :global(.cm-container) {
		background: var(--surface);
	}

	.rst-content :global(.cm-editor) {
		font-size: var(--font-sm);
		max-height: 300px;
	}

	/* Fallback pre for code blocks before CodeMirror */
	.rst-content :global(pre.code-block) {
		margin: var(--space-md) 0;
		padding: var(--space-md);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		font-family: var(--font-mono);
		font-size: var(--font-sm);
		overflow-x: auto;
	}

	/* Image blocks */
	.image-block {
		margin: var(--space-md) 0;
	}

	.image-block img {
		max-width: 100%;
		height: auto;
		border-radius: var(--radius-md);
	}

	/* Admonitions - styled like DocstringRenderer */
	.admonition {
		margin: var(--space-md) 0;
		padding: var(--space-md) var(--space-lg);
		border-radius: var(--radius-md);
		border-left: 4px solid;
	}

	.admonition.note {
		background: var(--accent-bg);
		border-color: var(--accent);
	}

	.admonition.warning,
	.admonition.caution {
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
		margin-bottom: var(--space-xs);
		font-size: var(--font-sm);
	}

	.note .admonition-title { color: var(--accent); }
	.warning .admonition-title,
	.caution .admonition-title { color: var(--warning); }
	.tip .admonition-title { color: var(--success); }
	.important .admonition-title { color: var(--error); }

	.admonition-body {
		font-size: var(--font-sm);
		color: var(--text-muted);
	}

	/* Math blocks */
	.math-block {
		margin: var(--space-md) 0;
		text-align: center;
	}

	.rst-content :global(.katex-display) {
		margin: var(--space-md) 0;
		overflow-x: auto;
	}

	/* Inline code */
	.rst-content :global(code) {
		font-family: var(--font-mono);
		font-size: 0.9em;
		background: var(--surface-raised);
		padding: 1px 4px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
	}

	/* Strong/emphasis */
	.rst-content :global(strong) {
		font-weight: 600;
	}

	.rst-content :global(em) {
		font-style: italic;
	}
</style>
