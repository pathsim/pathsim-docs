import { error } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { packages, type PackageId } from '$lib/config/packages';
import { getPackageManifest, resolveTag, type PackageManifest } from '$lib/api/versions';

const validPackageIds = new Set<string>(Object.keys(packages));

export const load: LayoutLoad = async ({ params, fetch }) => {
	const { package: packageId, version } = params;

	// Validate package ID
	if (!validPackageIds.has(packageId)) {
		throw error(404, `Package '${packageId}' not found`);
	}

	try {
		// Fetch package manifest (version list)
		const manifest = await getPackageManifest(packageId, fetch);

		// Resolve tag (latest, or specific like v0.16.4)
		const resolvedTag = resolveTag(version, manifest);

		return {
			packageId: packageId as PackageId,
			version,
			resolvedTag,
			manifest
		};
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Failed to load version';
		throw error(404, message);
	}
};
