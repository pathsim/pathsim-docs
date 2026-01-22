<script lang="ts">
	import type { APIModule } from '$lib/api/generated';
	import Icon from '$lib/components/common/Icon.svelte';

	interface Props {
		modules: APIModule[];
		onNavigate?: (id: string) => void;
	}

	interface TreeNode {
		name: string;
		fullPath: string;
		module: APIModule | null;
		children: Map<string, TreeNode>;
	}

	let { modules, onNavigate }: Props = $props();

	// Build a tree structure from flat module list
	let moduleTree = $derived.by(() => {
		const root: TreeNode = {
			name: '',
			fullPath: '',
			module: null,
			children: new Map()
		};

		for (const mod of modules) {
			const parts = mod.name.split('.');
			let current = root;

			for (let i = 0; i < parts.length; i++) {
				const part = parts[i];
				const fullPath = parts.slice(0, i + 1).join('.');

				if (!current.children.has(part)) {
					current.children.set(part, {
						name: part,
						fullPath,
						module: null,
						children: new Map()
					});
				}
				current = current.children.get(part)!;
			}

			// Assign the module to the leaf node
			current.module = mod;
		}

		return root;
	});

	// Track expanded state for each group path
	let expandedGroups = $state<Set<string>>(new Set());

	// Track active element (from scroll position)
	let activeId = $state<string | null>(null);

	function toggleGroup(path: string) {
		const newExpanded = new Set(expandedGroups);
		if (newExpanded.has(path)) {
			newExpanded.delete(path);
		} else {
			newExpanded.add(path);
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

	// Get sorted children entries
	function getSortedChildren(node: TreeNode): [string, TreeNode][] {
		return Array.from(node.children.entries()).sort((a, b) => a[0].localeCompare(b[0]));
	}

	// Check if a node has any content (classes or functions) in itself or descendants
	function hasContent(node: TreeNode): boolean {
		if (node.module && (node.module.classes.length > 0 || node.module.functions.length > 0)) {
			return true;
		}
		for (const child of node.children.values()) {
			if (hasContent(child)) return true;
		}
		return false;
	}

	// Set up intersection observer to track active section
	$effect(() => {
		if (typeof window === 'undefined') return;

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

{#snippet treeItem(node: TreeNode, depth: number)}
	{@const hasChildren = node.children.size > 0}
	{@const isExpanded = expandedGroups.has(node.fullPath)}
	{@const nodeId = getModuleId(node.fullPath)}
	{@const hasClasses = node.module?.classes && node.module.classes.length > 0}
	{@const hasFunctions = node.module?.functions && node.module.functions.length > 0}
	{@const hasModuleContent = hasClasses || hasFunctions}

	{#if hasContent(node)}
		<div class="api-toc-item" style="--depth: {depth}">
			<button
				class="api-toc-node"
				class:active={activeId === nodeId}
				class:has-children={hasChildren || hasModuleContent}
				onclick={() => {
					if (node.module) {
						scrollToElement(nodeId);
					}
					if (hasChildren || hasModuleContent) {
						toggleGroup(node.fullPath);
					}
				}}
			>
				{#if hasChildren || hasModuleContent}
					<span class="api-toc-icon" class:expanded={isExpanded}>
						<Icon name="chevron-down" size={12} />
					</span>
				{/if}
				<span class="api-toc-name">{node.name}</span>
			</button>

			{#if isExpanded}
				<div class="api-toc-children">
					<!-- Child submodules -->
					{#each getSortedChildren(node) as [, child]}
						{@render treeItem(child, depth + 1)}
					{/each}

					<!-- Classes in this module -->
					{#if hasClasses}
						{#each node.module!.classes as cls}
							<button
								class="api-toc-class"
								class:active={activeId === cls.name}
								style="--depth: {depth + 1}"
								onclick={() => scrollToElement(cls.name)}
							>
								{cls.name}
							</button>
						{/each}
					{/if}

					<!-- Functions in this module -->
					{#if hasFunctions}
						{#each node.module!.functions as func}
							<button
								class="api-toc-function"
								class:active={activeId === func.name}
								style="--depth: {depth + 1}"
								onclick={() => scrollToElement(func.name)}
							>
								{func.name}()
							</button>
						{/each}
					{/if}
				</div>
			{/if}
		</div>
	{/if}
{/snippet}

<div class="api-toc">
	<nav class="api-toc-nav">
		{#each getSortedChildren(moduleTree) as [, rootNode]}
			{@render treeItem(rootNode, 0)}
		{/each}
	</nav>
</div>

<style>
	.api-toc {
		display: flex;
		flex-direction: column;
		padding: var(--space-md);
		padding-top: 0;
	}

	.api-toc-nav {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.api-toc-item {
		display: flex;
		flex-direction: column;
	}

	.api-toc-node {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: var(--space-xs);
		width: 100%;
		padding: var(--space-xs) var(--space-sm);
		padding-left: calc(var(--space-sm) + var(--depth, 0) * var(--space-md));
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		font-size: var(--font-base);
		color: var(--text-muted);
		text-align: left;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.api-toc-node:hover {
		color: var(--text);
		background: var(--surface-hover);
	}

	.api-toc-node.active {
		color: var(--accent);
		background: var(--accent-bg);
	}

	.api-toc-node:not(.has-children) {
		padding-left: calc(var(--space-sm) + 12px + var(--space-xs) + var(--depth, 0) * var(--space-md));
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

	.api-toc-name {
		font-family: var(--font-mono);
		font-size: var(--font-base);
	}

	.api-toc-children {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.api-toc-class,
	.api-toc-function {
		display: flex;
		justify-content: flex-start;
		width: 100%;
		padding: var(--space-xs) var(--space-sm);
		padding-left: calc(var(--space-sm) + 12px + var(--space-xs) + var(--depth, 0) * var(--space-md));
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		font-family: var(--font-mono);
		font-size: var(--font-base);
		color: var(--text-muted);
		text-align: left;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.api-toc-class:hover,
	.api-toc-function:hover {
		color: var(--text);
		background: var(--surface-hover);
	}

	.api-toc-class.active,
	.api-toc-function.active {
		color: var(--accent);
		background: var(--accent-bg);
	}
</style>
