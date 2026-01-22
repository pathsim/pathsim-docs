<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { crossrefIndexStore, type CrossRefTarget } from '$lib/utils/crossref';
	import { searchTarget } from '$lib/stores/searchNavigation';

	interface Props {
		type: string;
	}

	let { type }: Props = $props();

	// Parse the type string and identify linkable parts
	// Handles: ClassName, list[ClassName], Optional[ClassName], etc.
	interface TypePart {
		text: string;
		isLink: boolean;
		target?: CrossRefTarget;
	}

	// Subscribe to crossref store for reactivity - re-computes when index loads
	let crossrefIndex = $derived($crossrefIndexStore);

	let parts = $derived.by(() => {
		const result: TypePart[] = [];
		const index = crossrefIndex; // Use the reactive index

		// Tokenize type string by brackets, commas, and union operators
		// Example: "list[ClassName]" → ["list", "[", "ClassName", "]"]
		// Example: "Optional[int | str]" → ["Optional", "[", "int", " | ", "str", "]"]
		const tokens = type.split(/(\[|\]|,\s*|\s*\|\s*)/);

		for (const token of tokens) {
			if (!token) continue;

			// Match PascalCase class names (no dots)
			// Matches: "Integrator", "V1", "MyClass"
			// Does NOT match: "list", "pathsim.Connection"
			if (/^[A-Z][a-zA-Z0-9_]*$/.test(token)) {
				const target = index.get(token);
				if (target) {
					result.push({ text: token, isLink: true, target });
				} else {
					result.push({ text: token, isLink: false });
				}
			}
			// Match fully qualified module paths ending with class name
			// Format: module.submodule.ClassName
			// Matches: "pathsim.connection.Connection", "numpy.ndarray.ndarray"
			// Does NOT match: "Connection", "pathsim.connection"
			else if (/^[a-z][a-z0-9_]*(\.[a-z_][a-z0-9_]*)*\.[A-Z][a-zA-Z0-9_]*$/.test(token)) {
				// Try lookup by full path first
				let target = index.get(token);
				if (!target) {
					// Extract class name (last part) and try that
					const className = token.split('.').pop();
					if (className) {
						target = index.get(className);
					}
				}
				// Display just the class name but link to the full reference
				const displayName = token.split('.').pop() || token;
				if (target) {
					result.push({ text: displayName, isLink: true, target });
				} else {
					result.push({ text: displayName, isLink: false });
				}
			} else {
				result.push({ text: token, isLink: false });
			}
		}

		return result;
	});

	function handleClick(e: MouseEvent, target: CrossRefTarget | undefined) {
		if (!target) return;
		e.preventDefault();

		searchTarget.set({
			name: target.name,
			type: target.type as 'class' | 'function' | 'method' | 'module',
			source: 'crossref'
		});

		// target.path is relative like pathsim/api#ClassName, prepend base/ for absolute URL
		goto(`${base}/${target.path}`);
	}
</script>

<span class="type-ref">{#each parts as part}{#if part.isLink && part.target}<a
		href="{base}/{part.target.path}"
		class="type-link"
		onclick={(e) => handleClick(e, part.target)}
	>{part.text}</a>{:else}{part.text}{/if}{/each}</span>

<style>
	.type-ref {
		font-family: var(--font-mono);
	}

	.type-link {
		color: var(--accent);
		font-weight: 500;
		text-decoration: none;
		transition: color var(--transition-fast);
	}

	.type-link:hover {
		text-decoration: underline;
	}
</style>
