<script lang="ts">
	import { PackageOverview } from '$lib/components/pages';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<PackageOverview packageId="rf" manifest={data.manifest} selectedTag={data.selectedTag} />
