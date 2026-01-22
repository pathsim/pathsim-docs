<script lang="ts">
	/**
	 * ConsoleOutput - Reusable console output display component
	 * Based on PathView's ConsolePanel, adapted for per-cell output in documentation
	 */
	import Icon from './Icon.svelte';

	export interface LogEntry {
		id: number;
		level: 'info' | 'warning' | 'error' | 'output';
		message: string;
	}

	interface Props {
		/** Log entries to display */
		logs: LogEntry[];
		/** Maximum height before scrolling (default: 200px) */
		maxHeight?: number;
		/** Placeholder text when empty (optional) */
		placeholder?: string;
	}

	let { logs, maxHeight = 200, placeholder }: Props = $props();

	let scrollContainer: HTMLDivElement | undefined = $state();
	let autoScroll = $state(true);
	let lastLogId = -1;
	let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

	// Auto-scroll when new logs arrive
	$effect(() => {
		const latestId = logs.length > 0 ? logs[logs.length - 1].id : -1;
		if (latestId > lastLogId && autoScroll && scrollContainer) {
			// Clear any pending scroll
			if (scrollTimeout !== null) {
				clearTimeout(scrollTimeout);
			}
			// Use setTimeout to ensure DOM has updated
			scrollTimeout = setTimeout(() => {
				scrollTimeout = null;
				if (scrollContainer) {
					scrollContainer.scrollTop = scrollContainer.scrollHeight;
				}
			}, 0);
		}
		lastLogId = latestId;
	});

	// Cleanup timeout on unmount
	$effect(() => {
		return () => {
			if (scrollTimeout !== null) {
				clearTimeout(scrollTimeout);
			}
		};
	});

	function handleScroll() {
		if (!scrollContainer) return;
		// Disable auto-scroll if user scrolls up
		const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
		autoScroll = scrollTop + clientHeight >= scrollHeight - 20;
	}

	function scrollToBottom() {
		if (scrollContainer) {
			scrollContainer.scrollTop = scrollContainer.scrollHeight;
			autoScroll = true;
		}
	}
</script>

<div class="console-output" style:max-height="{maxHeight}px">
	<div class="console-content" bind:this={scrollContainer} onscroll={handleScroll}>
		{#if logs.length === 0 && placeholder}
			<div class="placeholder">
				<p>{placeholder}</p>
			</div>
		{:else}
			{#each logs as log (log.id)}
				<div class="log-entry {log.level}">
					<span class="log-message">{log.message}</span>
				</div>
			{/each}
		{/if}
	</div>
	{#if !autoScroll && logs.length > 0}
		<button class="scroll-to-bottom" onclick={scrollToBottom} aria-label="Scroll to bottom">
			<Icon name="chevron-down" size={14} />
		</button>
	{/if}
</div>

<style>
	.console-output {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: relative;
		background: var(--surface);
	}

	.console-content {
		flex: 1;
		overflow-y: auto;
	}

	.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-lg);
		color: var(--text-disabled);
		font-size: var(--font-base);
		text-align: center;
	}

	.log-entry,
	.log-message {
		font-family: var(--font-mono);
		font-size: var(--font-base);
		font-weight: 500;
		line-height: 1.5;
	}

	.log-entry {
		padding: var(--space-xs) var(--space-md);
	}

	.log-entry.output {
		color: var(--text);
	}

	.log-entry.info {
		color: var(--accent);
	}

	.log-entry.warning {
		color: var(--warning);
		background: var(--warning-bg);
	}

	.log-entry.error {
		color: var(--error);
		background: var(--error-bg);
	}

	.log-message {
		white-space: pre-wrap;
		word-break: break-word;
	}

	.scroll-to-bottom {
		position: absolute;
		bottom: var(--space-sm);
		left: 50%;
		transform: translateX(-50%);
		width: 24px;
		height: 24px;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--surface-raised);
		border: 1px solid var(--border);
		border-radius: 50%;
		color: var(--text-muted);
		cursor: pointer;
		transition: all var(--transition-fast);
		box-shadow: var(--shadow-sm);
	}

	.scroll-to-bottom:hover {
		background: var(--surface-hover);
		color: var(--text);
	}
</style>
