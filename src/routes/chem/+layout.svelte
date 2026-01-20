<script lang="ts">
	import { DocLayout } from '$lib/components/layout';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<DocLayout packageId="chem">
	{@render children()}
</DocLayout>
