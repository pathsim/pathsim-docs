import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getApiData } from '$lib/api/versions';

export const load: PageLoad = async ({ parent, fetch }) => {
	const { packageId, resolvedTag, manifest } = await parent();

	try {
		// Fetch versioned API data
		const apiData = await getApiData(packageId, resolvedTag, fetch);

		return {
			packageId,
			resolvedTag,
			manifest,
			apiData
		};
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Failed to load API documentation';
		throw error(404, message);
	}
};
