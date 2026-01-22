import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import type { PageLoad } from './$types';
import { getVersionManifest } from '$lib/notebook/loader';

export const load: PageLoad = async ({ parent, fetch }) => {
	const { packageId, resolvedTag, manifest } = await parent();

	// Load version manifest (notebook list)
	const versionManifest = await getVersionManifest(packageId, resolvedTag, fetch);

	// If no notebooks, redirect up to overview
	if (!versionManifest.notebooks || versionManifest.notebooks.length === 0) {
		throw redirect(307, `${base}/${packageId}`);
	}

	return {
		packageId,
		resolvedTag,
		manifest,
		versionManifest
	};
};
