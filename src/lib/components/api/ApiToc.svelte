<script lang="ts">
	import type { APIModule } from '$lib/api/generated';
	import Icon from '$lib/components/common/Icon.svelte';

	interface Props {
		modules: APIModule[];
		onNavigate?: (id: string) => void;
	}

	let { modules, onNavigate }: Props = $props();

	// Group modules by top-level (e.g., pathsim.blocks vs pathsim)
	let moduleGroups = $derived.by(() => {
		const groups: Record<string, APIModule[]> = {};
		for (const mod of modules) {
			const parts = mod.name.split('.');
			const groupKey = parts.length > 1 ? parts.slice(0, 2).join('.') : mod.name;
			if (!groups[groupKey]) {
				groups[groupKey] = [];
			}
			groups[groupKey].push(mod);
		}
		return groups;
	});

	// Track expanded state for each module group
	let expandedGroups = $state<Set<string>>(new Set());

	// Track active element (from scroll position)
	let activeId = $state<string | null>(null);

	function toggleGroup(groupName: string) {
		const newExpanded = new Set(expandedGroups);
		if (newExpanded.has(groupName)) {
			newExpanded.delete(groupName);
		} else {
			newExpanded.add(groupName);
		}
		expandedGroups = newExpanded;
	}

	function scrollToElement(id: string) {
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'start' });
			activeId = id;
			onNavigate?.(id);
		}
	}

	function getModuleId(moduleName: string): string {
		return moduleName.replace(/\./g, '-');
	}

	// Set up intersection observer to track active section
	$effect(() => {
		if (typeof window === 'undefined') return;

		// Find the scroll container (.doc-main)
		const scrollContainer = document.querySelector('.doc-main');

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						activeId = entry.target.id;
					}
				}
			},
			{
				root: scrollContainer,
				rootMargin: '-10% 0px -80% 0px',
				threshold: 0
			}
		);

		// Observe all module and class elements
		for (const mod of modules) {
			const moduleEl = document.getElementById(getModuleId(mod.name));
			if (moduleEl) observer.observe(moduleEl);

			for (const cls of mod.classes) {
				const classEl = document.getElementById(cls.name);
				if (classEl) observer.observe(classEl);
			}
		}

		return () => observer.disconnect();
	});
</script>

<div class="api-toc">
	<div class="label-uppercase api-toc-header">On this page</div>
	<nav class="api-toc-nav">
		{#each Object.entries(moduleGroups) as [groupName, groupModules]}
			{@const groupId = getModuleId(groupName)}
			{@const isExpanded = expandedGroups.has(groupName)}
			{@const hasClasses = groupModules.some((m) => m.classes.length > 0)}

			<div class="api-toc-group">
				<button
					class="api-toc-module"
					class:active={activeId === groupId}
					class:has-children={hasClasses}
					onclick={() => {
						scrollToElement(groupId);
						if (hasClasses) toggleGroup(groupName);
					}}
				>
					{#if hasClasses}
						<span class="api-toc-icon" class:expanded={isExpanded}>
							<Icon name="chevron-down" size={12} />
						</span>
					{/if}
					<span class="api-toc-module-name">{groupName}</span>
				</button>

				{#if isExpanded && hasClasses}
					<div class="api-toc-classes">
						{#each groupModules as mod}
							{#each mod.classes as cls}
								<button
									class="api-toc-class"
									class:active={activeId === cls.name}
									onclick={() => scrollToElement(cls.name)}
								>
									{cls.name}
								</button>
							{/each}
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</nav>
</div>

<style>
	.api-toc {
		display: flex;
		flex-direction: column;
		padding: var(--space-md);
		border-top: 1px solid var(--border);
	}

	.api-toc-header {
		margin-bottom: var(--space-sm);
	}

	.api-toc-nav {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.api-toc-group {
		display: flex;
		flex-direction: column;
	}

	.api-toc-module {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: var(--space-xs);
		width: 100%;
		padding: var(--space-xs) var(--space-sm);
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		font-size: var(--font-sm);
		color: var(--text-muted);
		text-align: left;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.api-toc-module:hover {
		color: var(--text);
		background: var(--surface-hover);
	}

	.api-toc-module.active {
		color: var(--accent);
		background: var(--accent-bg);
	}

	.api-toc-module:not(.has-children) {
		padding-left: calc(var(--space-sm) + 12px + var(--space-xs));
	}

	.api-toc-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		transform: rotate(-90deg);
		transition: transform var(--transition-fast);
	}

	.api-toc-icon.expanded {
		transform: rotate(0deg);
	}

	.api-toc-module-name {
		font-family: var(--font-mono);
		font-size: var(--font-xs);
	}

	.api-toc-classes {
		display: flex;
		flex-direction: column;
		gap: 1px;
		padding-left: calc(var(--space-sm) + 12px + var(--space-xs));
	}

	.api-toc-class {
		display: flex;
		justify-content: flex-start;
		width: 100%;
		padding: var(--space-xs) var(--space-sm);
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		font-family: var(--font-mono);
		font-size: var(--font-xs);
		color: var(--text-muted);
		text-align: left;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.api-toc-class:hover {
		color: var(--text);
		background: var(--surface-hover);
	}

	.api-toc-class.active {
		color: var(--accent);
		background: var(--accent-bg);
	}
</style>
