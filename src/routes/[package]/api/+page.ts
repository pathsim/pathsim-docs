import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { packages, type PackageId } from '$lib/config/packages';
import { getPackageManifest } from '$lib/api/versions';
import { versionStore } from '$lib/stores/versionStore';

const validPackageIds = new Set<string>(Object.keys(packages));

/**
 * Redirect /[package]/api to /[package]/[version]/api
 * Uses stored version or latest if none stored.
 */
export const load: PageLoad = async ({ params, fetch }) => {
	const { package: packageId } = params;

	if (!validPackageIds.has(packageId)) {
		throw redirect(307, '/');
	}

	try {
		const manifest = await getPackageManifest(packageId, fetch);

		// Check for stored version preference
		const storedVersion = versionStore.getVersionSync(packageId as PackageId);
		const targetTag = storedVersion || manifest.latestTag;

		throw redirect(307, `/${packageId}/${targetTag}/api`);
	} catch (e) {
		// If redirect was thrown, re-throw it
		if (e && typeof e === 'object' && 'status' in e) {
			throw e;
		}
		// Fallback to package overview if manifest fails
		throw redirect(307, `/${packageId}`);
	}
};
