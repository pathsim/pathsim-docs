import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { packages, type PackageId } from '$lib/config/packages';
import { getVersionManifest, getVersionedApiData, resolveVersion } from '$lib/api/versions';

const validPackageIds = new Set<string>(Object.keys(packages));

export const load: PageLoad = async ({ params, fetch }) => {
	const { package: packageId, version } = params;

	// Validate package ID
	if (!validPackageIds.has(packageId)) {
		throw error(404, `Package '${packageId}' not found`);
	}

	try {
		// Fetch manifest
		const manifest = await getVersionManifest(packageId, fetch);

		// Resolve version (latest, undefined, or specific)
		const resolvedVersion = resolveVersion(version, manifest);

		// Fetch versioned API data
		const apiData = await getVersionedApiData(packageId, resolvedVersion, fetch);

		return {
			packageId: packageId as PackageId,
			version: version || 'latest',
			resolvedVersion,
			manifest,
			apiData
		};
	} catch (e) {
		// If versioned data fails, throw 404
		const message = e instanceof Error ? e.message : 'Failed to load API documentation';
		throw error(404, message);
	}
};
