<script lang="ts">
	/**
	 * RstRenderer - Renders RST content with same styling as DocstringRenderer
	 * Handles basic RST patterns: images, admonitions, cross-refs, text
	 * For full RST rendering, content should be pre-processed to HTML
	 */
	import { onMount, tick } from 'svelte';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { loadKatex, getKatexCssUrl } from '$lib/utils/katexLoader';
	import { loadCodeMirrorModules, createEditorExtensions, type CodeMirrorModules } from '$lib/utils/codemirror';
	import { theme } from '$lib/stores/themeStore';
	import { processCrossRefs, crossrefIndexStore } from '$lib/utils/crossref';
	import { searchTarget } from '$lib/stores/searchNavigation';
	import { createCopyButton } from '$lib/utils/copyButton';

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

	interface SectionHeader {
		type: 'section';
		level: number;
		title: string;
	}

	type ParsedBlock =
		| ImageDirective
		| AdmonitionDirective
		| CodeBlockDirective
		| MathDirective
		| SectionHeader
		| { type: 'paragraph'; content: string }
		| { type: 'hidden' };

	/**
	 * Parse RST content into blocks
	 */
	function parseRst(source: string): ParsedBlock[] {
		const blocks: ParsedBlock[] = [];
		const lines = source.split('\n');
		let i = 0;

		// RST underline characters and their heading levels (order of first appearance)
		const underlineChars = ['=', '-', '~', '^', '"', "'", '`', '*', '+', '#'];
		const seenUnderlines: string[] = [];

		/**
		 * Check if a line is an RST underline (all same character, at least 3 chars)
		 */
		function isUnderline(line: string): string | null {
			const trimmed = line.trim();
			if (trimmed.length < 3) return null;
			const char = trimmed[0];
			if (!underlineChars.includes(char)) return null;
			if (trimmed.split('').every((c) => c === char)) {
				return char;
			}
			return null;
		}

		/**
		 * Get heading level for an underline character
		 */
		function getHeadingLevel(char: string): number {
			let idx = seenUnderlines.indexOf(char);
			if (idx === -1) {
				seenUnderlines.push(char);
				idx = seenUnderlines.length - 1;
			}
			// Return 2-6 (h1 reserved for page titles)
			return Math.min(idx + 2, 6);
		}

		while (i < lines.length) {
			const line = lines[i];
			const trimmed = line.trim();

			// Skip empty lines
			if (!trimmed) {
				i++;
				continue;
			}

			// Check for RST section header (title followed by underline)
			if (i + 1 < lines.length) {
				const nextLine = lines[i + 1];
				const underlineChar = isUnderline(nextLine);
				// Title must not start with directive syntax and underline must be at least as long as title
				if (underlineChar && !trimmed.startsWith('..') && nextLine.trim().length >= trimmed.length) {
					const level = getHeadingLevel(underlineChar);
					blocks.push({ type: 'section', level, title: trimmed });
					i += 2; // Skip both title and underline
					continue;
				}
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
				const mathLines: string[] = [];
				i++;
				// Collect all indented lines (preserve structure for multiline LaTeX)
				while (i < lines.length && (lines[i].startsWith('   ') || lines[i].trim() === '')) {
					// Preserve the line content (remove 3-space RST indent but keep LaTeX structure)
					if (lines[i].startsWith('   ')) {
						mathLines.push(lines[i].slice(3));
					} else {
						mathLines.push(''); // Preserve empty lines within math block
					}
					i++;
				}
				// Trim leading/trailing empty lines but preserve internal structure
				while (mathLines.length > 0 && mathLines[0].trim() === '') mathLines.shift();
				while (mathLines.length > 0 && mathLines[mathLines.length - 1].trim() === '') mathLines.pop();

				if (mathLines.length > 0) {
					blocks.push({ type: 'math', content: mathLines.join('\n') });
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

			// Clean up Sphinx cross-refs and convert to HTML
			para = para
				.replace(/:class:`\.?([^`]+)`/g, '<code>$1</code>')
				.replace(/:func:`\.?([^`]+)`/g, '<code>$1()</code>')
				.replace(/:meth:`\.?([^`]+)`/g, '<code>$1()</code>')
				.replace(/:mod:`\.?([^`]+)`/g, '<code>$1</code>')
				.replace(/:ref:`([^`]+)`/g, '$1')
				.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
				.replace(/\*([^*]+)\*/g, '<em>$1</em>')
				.replace(/``([^`]+)``/g, '<code>$1</code>');

			// Process cross-references for class/function names
			para = processCrossRefs(para, base);

			blocks.push({ type: 'paragraph', content: para });
		}

		return blocks;
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

	// Parse RST if not already HTML (reactive to crossref store)
	let parsedBlocks = $derived.by(() => {
		// Subscribe to crossref store to trigger re-processing when index loads
		$crossrefIndexStore;
		return isHtml ? [] : parseRst(content);
	});

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
				// Preserve multiline structure - only trim outer whitespace
				const rendered = k.default.renderToString(latex.trim(), {
					displayMode: true,
					throwOnError: false,
					strict: false,
					trust: true
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

<div class="rst-content" bind:this={container} onclick={handleCrossRefClick}>
	{#if isHtml}
		{@html content}
	{:else}
		{#each parsedBlocks as block}
			{#if block.type === 'section'}
				{#if block.level === 2}
					<h2>{block.title}</h2>
				{:else if block.level === 3}
					<h3>{block.title}</h3>
				{:else if block.level === 4}
					<h4>{block.title}</h4>
				{:else if block.level === 5}
					<h5>{block.title}</h5>
				{:else}
					<h6>{block.title}</h6>
				{/if}
			{:else if block.type === 'paragraph'}
				<p>{@html block.content}</p>
			{:else if block.type === 'image'}
				<div class="image-block" style:text-align={block.align || 'center'}>
					<img
						src={resolveImagePath(block.src)}
						alt={block.alt || 'Image'}
						style:max-width={block.width ? `min(${block.width}px, 100%)` : '100%'}
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
		font-size: var(--font-base);
		line-height: 1.7;
		color: var(--text-muted);
	}

	/* Section headers styled via global app.css rules for .rst-content h2-h4 */

	.rst-content :global(p) {
		margin-bottom: 0.75em;
	}

	.rst-content :global(p:last-child) {
		margin-bottom: 0;
	}

	/* Code block styles are in app.css */

	/* Fallback pre for code blocks before CodeMirror */
	.rst-content :global(pre.code-block) {
		margin: var(--space-md) 0;
		padding: var(--space-md);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		font-family: var(--font-mono);
		font-size: var(--font-base);
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
		font-size: var(--font-base);
	}

	.note .admonition-title { color: var(--accent); }
	.warning .admonition-title,
	.caution .admonition-title { color: var(--warning); }
	.tip .admonition-title { color: var(--success); }
	.important .admonition-title { color: var(--error); }

	.admonition-body {
		font-size: var(--font-base);
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

	/* Inline code - plain style, no pill */
	.rst-content :global(code) {
		font-family: var(--font-mono);
		font-size: inherit;
	}

	/* Strong/emphasis */
	.rst-content :global(strong) {
		font-weight: 600;
	}

	.rst-content :global(em) {
		font-style: italic;
	}

	/* Header and cross-reference link styles are in app.css for consistency */
</style>
