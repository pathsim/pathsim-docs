<script lang="ts">
	/**
	 * OutputViewer - Displays text output using CodeMirror for consistent styling
	 * Read-only, no syntax highlighting, matches editor font exactly
	 */
	import { onMount, onDestroy } from 'svelte';
	import { loadCodeMirrorModules, createOutputExtensions, type CodeMirrorModules } from '$lib/utils/codemirror';
	import { theme } from '$lib/stores/themeStore';

	interface Props {
		/** The text content to display */
		content: string;
		/** Custom text color (CSS variable or color value) */
		color?: string;
	}

	let { content, color = 'var(--text-muted)' }: Props = $props();

	let container = $state<HTMLDivElement | undefined>(undefined);
	let editorView: import('@codemirror/view').EditorView | null = null;
	let cmModules: CodeMirrorModules | null = null;

	onMount(() => {
		if (!container) return;

		loadCodeMirrorModules().then((modules) => {
			cmModules = modules;
			const isDark = $theme === 'dark';

			editorView = new modules.EditorView({
				doc: content,
				extensions: [
					...createOutputExtensions(modules, isDark),
					// Add custom text color
					modules.EditorView.theme({
						'.cm-content': {
							color: color
						}
					})
				],
				parent: container!
			});
		});
	});

	// Watch for theme changes
	$effect(() => {
		const currentTheme = $theme;
		if (editorView && cmModules && container) {
			const isDark = currentTheme === 'dark';
			const currentDoc = editorView.state.doc.toString();

			editorView.destroy();
			editorView = new cmModules.EditorView({
				doc: currentDoc,
				extensions: [
					...createOutputExtensions(cmModules, isDark),
					cmModules.EditorView.theme({
						'.cm-content': {
							color: color
						}
					})
				],
				parent: container
			});
		}
	});

	// Watch for content changes
	$effect(() => {
		if (editorView && content !== editorView.state.doc.toString()) {
			editorView.dispatch({
				changes: { from: 0, to: editorView.state.doc.length, insert: content }
			});
		}
	});

	onDestroy(() => {
		editorView?.destroy();
	});
</script>

<div class="output-viewer" bind:this={container}></div>

<style>
	.output-viewer {
		min-height: 1.5em;
	}

	.output-viewer :global(.cm-editor) {
		background: transparent !important;
	}

	.output-viewer :global(.cm-focused) {
		outline: none !important;
	}
</style>
