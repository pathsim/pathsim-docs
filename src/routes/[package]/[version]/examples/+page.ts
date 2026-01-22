import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { getVersionManifest, type VersionManifest } from '$lib/notebook/loader';

export const load: PageLoad = async ({ parent, fetch }) => {
	const { packageId, resolvedTag, manifest } = await parent();

	try {
		// Load version manifest (notebook list)
		const versionManifest = await getVersionManifest(packageId, resolvedTag, fetch);

		return {
			packageId,
			resolvedTag,
			manifest,
			versionManifest
		};
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Failed to load examples';
		throw error(404, message);
	}
};
