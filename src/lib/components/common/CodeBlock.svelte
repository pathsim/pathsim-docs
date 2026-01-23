<script lang="ts">
	/**
	 * CodeBlock - Static code display component
	 * For executable code, use NotebookCell which wraps this component
	 */
	import { onMount, onDestroy } from 'svelte';
	import Icon from './Icon.svelte';
	import { tooltip } from './Tooltip.svelte';
	import {
		loadCodeMirrorModules,
		createEditorExtensions,
		createThemeExtensions,
		type CodeMirrorModules
	} from '$lib/utils/codemirror';
	import { theme } from '$lib/stores/themeStore';
	import { copyToClipboard as copy } from '$lib/utils/clipboard';

	interface Props {
		/** The code to display */
		code: string;
		/** Title shown in header */
		title?: string;
		/** Whether code can be edited */
		editable?: boolean;
		/** Callback when code changes (for editable blocks) */
		onchange?: (code: string) => void;
		/** Callback for run action (Ctrl+Shift+Enter - execute only) */
		onrun?: () => void;
		/** Callback for run and advance action (Ctrl+Enter - execute and move to next) */
		onrunadvance?: () => void;
		/** Additional header actions (slot content) */
		headerActions?: import('svelte').Snippet;
	}

	let {
		code,
		title = 'Example',
		editable = false,
		onchange = undefined,
		onrun = undefined,
		onrunadvance = undefined,
		headerActions
	}: Props = $props();

	// State
	let copied = $state(false);
	let editorContainer = $state<HTMLDivElement | undefined>(undefined);
	let editorView: import('@codemirror/view').EditorView | null = null;
	let cmModules: CodeMirrorModules | null = null;
	let themeCompartment: import('@codemirror/state').Compartment | null = null;
	let loading = $state(true);

	// Track current code (IIFE to capture initial value without reactive warning)
	let currentCode = $state((() => code)());

	function handleCopy() {
		copy(getCurrentCode(), () => (copied = true), () => (copied = false));
	}

	/** Get current code from editor */
	export function getCurrentCode(): string {
		if (editorView) {
			return editorView.state.doc.toString();
		}
		return currentCode;
	}

	/** Update code programmatically */
	export function setCode(newCode: string) {
		if (editorView) {
			editorView.dispatch({
				changes: { from: 0, to: editorView.state.doc.length, insert: newCode }
			});
		}
		currentCode = newCode;
	}

	/** Focus the editor */
	export function focus() {
		editorView?.focus();
	}

	onMount(() => {
		if (!editorContainer) return;

		loadCodeMirrorModules().then((modules) => {
			cmModules = modules;

			const isDark = $theme === 'dark';

			// Create theme compartment for efficient theme switching
			themeCompartment = new cmModules.Compartment();

			// Setup update listener for editable mode
			const updateListener = editable
				? cmModules.EditorView.updateListener.of((update) => {
						if (update.docChanged) {
							currentCode = update.state.doc.toString();
							onchange?.(currentCode);
						}
					})
				: [];

			// Create keymaps for run actions and navigation
			// Ctrl+Enter: Run and advance to next cell
			// Ctrl+Shift+Enter: Run only (stay in current cell)
			// Escape: Unfocus the editor
			const runKeymaps: { key: string; run: (view: import('@codemirror/view').EditorView) => boolean }[] = [];
			if (onrunadvance) {
				runKeymaps.push({ key: 'Ctrl-Enter', run: () => { onrunadvance(); return true; } });
			}
			if (onrun) {
				runKeymaps.push({ key: 'Ctrl-Shift-Enter', run: () => { onrun(); return true; } });
			}
			// Always add Escape to blur
			runKeymaps.push({ key: 'Escape', run: (view) => { view.contentDOM.blur(); return true; } });

			editorView = new cmModules.EditorView({
				doc: code,
				extensions: [
					createEditorExtensions(cmModules, isDark, {
						readOnly: !editable,
						themeCompartment,
						keymaps: runKeymaps
					}),
					...(Array.isArray(updateListener) ? updateListener : [updateListener])
				],
				parent: editorContainer!
			});

			loading = false;
		});
	});

	// Watch for theme changes - use compartment reconfigure for efficiency
	$effect(() => {
		const currentTheme = $theme;
		if (editorView && cmModules && themeCompartment) {
			const isDark = currentTheme === 'dark';
			// Reconfigure theme compartment without recreating editor
			editorView.dispatch({
				effects: themeCompartment.reconfigure(createThemeExtensions(cmModules, isDark))
			});
		}
	});

	// Watch for external code changes (only in non-editable mode)
	$effect(() => {
		if (editorView && code !== currentCode && !editable) {
			currentCode = code;
			editorView.dispatch({
				changes: { from: 0, to: editorView.state.doc.length, insert: code }
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
			{#if headerActions}
				{@render headerActions()}
			{/if}
			<button class="icon-btn" class:copied onclick={handleCopy} use:tooltip={copied ? 'Copied!' : 'Copy'}>
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
