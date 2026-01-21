<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { lookupRef } from '$lib/utils/crossref';
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
		target?: ReturnType<typeof lookupRef>;
	}

	let parts = $derived.by(() => {
		const result: TypePart[] = [];

		// Regex to match potential class names (PascalCase or known types)
		// Split by common type syntax characters while preserving them
		const tokens = type.split(/(\[|\]|,\s*|\s*\|\s*)/);

		for (const token of tokens) {
			if (!token) continue;

			// Check if this token looks like a class name (PascalCase)
			if (/^[A-Z][a-zA-Z0-9_]*$/.test(token)) {
				const target = lookupRef(token);
				if (target) {
					result.push({ text: token, isLink: true, target });
				} else {
					result.push({ text: token, isLink: false });
				}
			} else {
				result.push({ text: token, isLink: false });
			}
		}

		return result;
	});

	function handleClick(e: MouseEvent, target: ReturnType<typeof lookupRef>) {
		if (!target) return;
		e.preventDefault();

		searchTarget.set({
			name: target.name,
			type: target.type as 'class' | 'function' | 'method' | 'module'
		});

		// target.path is absolute like /pathsim/api#ClassName, prepend base for deployment
		goto(`${base}${target.path}`);
	}
</script>

<span class="type-ref">{#each parts as part}{#if part.isLink && part.target}<a
		href="{base}{part.target.path}"
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
