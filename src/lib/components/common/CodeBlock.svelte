<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';
	import { tooltip } from './Tooltip.svelte';
	import { loadCodeMirrorModules, createEditorExtensions, type CodeMirrorModules } from '$lib/utils/codemirror';

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

	onMount(async () => {
		if (!editorContainer) return;

		cmModules = await loadCodeMirrorModules();

		const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

		editorView = new cmModules.EditorView({
			doc: code,
			extensions: createEditorExtensions(cmModules, isDark, { readOnly: true }),
			parent: editorContainer
		});

		loading = false;

		// Watch for theme changes
		const observer = new MutationObserver(() => {
			if (editorView && cmModules && editorContainer) {
				const newIsDark = document.documentElement.getAttribute('data-theme') !== 'light';
				editorView.destroy();
				editorView = new cmModules.EditorView({
					doc: code,
					extensions: createEditorExtensions(cmModules, newIsDark, { readOnly: true }),
					parent: editorContainer
				});
			}
		});
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

		return () => {
			observer.disconnect();
			editorView?.destroy();
		};
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
	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100px;
		color: var(--text-muted);
		font-size: var(--font-sm);
	}
</style>
