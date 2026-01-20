<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Icon from './Icon.svelte';
	import { tooltip } from './Tooltip.svelte';
	import { loadCodeMirrorModules, createEditorExtensions, type CodeMirrorModules } from '$lib/utils/codemirror';
	import { theme } from '$lib/stores/themeStore';

	interface Props {
		code: string;
		title?: string;
	}

	let { code, title = 'Example' }: Props = $props();

	let copied = $state(false);
	let editorContainer = $state<HTMLDivElement | undefined>(undefined);
	let editorView: import('@codemirror/view').EditorView | null = null;
	let cmModules: CodeMirrorModules | null = null;
	let loading = $state(true);

	function copyToClipboard() {
		navigator.clipboard.writeText(code);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	onMount(() => {
		if (!editorContainer) return;

		loadCodeMirrorModules().then((modules) => {
			cmModules = modules;

			const isDark = $theme === 'dark';

			editorView = new cmModules.EditorView({
				doc: code,
				extensions: createEditorExtensions(cmModules, isDark, { readOnly: true }),
				parent: editorContainer!
			});

			loading = false;
		});
	});

	// Watch for theme changes
	$effect(() => {
		const currentTheme = $theme;
		if (editorView && cmModules && editorContainer) {
			const isDark = currentTheme === 'dark';
			editorView.destroy();
			editorView = new cmModules.EditorView({
				doc: code,
				extensions: createEditorExtensions(cmModules, isDark, { readOnly: true }),
				parent: editorContainer
			});
		}
	});

	onDestroy(() => {
		editorView?.destroy();
	});
</script>

<div class="code-panel">
	<div class="panel-header">
		<span>{title}</span>
		<div class="header-actions">
			<button class="icon-btn" onclick={copyToClipboard} use:tooltip={copied ? 'Copied!' : 'Copy'}>
				<Icon name={copied ? 'check' : 'copy'} size={14} />
			</button>
		</div>
	</div>
	<div class="panel-body" bind:this={editorContainer}>
		{#if loading}
			<div class="loading">Loading...</div>
		{/if}
	</div>
</div>

<style>
	/* Styles handled by global .code-panel rules in app.css */
</style>
