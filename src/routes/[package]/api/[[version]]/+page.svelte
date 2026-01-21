<script lang="ts">
	import { PackageApi } from '$lib/components/pages';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<PackageApi
	packageId={data.packageId}
	version={data.resolvedVersion}
	manifest={data.manifest}
	apiData={data.apiData}
/>
