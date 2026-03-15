import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import type { PageLoad } from './$types';
import { packages, type PackageId } from '$lib/config/packages';
import { getPackageManifest, packageHasRoadmap } from '$lib/api/versions';
import { getRoadmapData } from '$lib/api/roadmap';

const validPackageIds = new Set<string>(Object.keys(packages));

export const load: PageLoad = async ({ params, fetch }) => {
	const { package: packageId } = params;

	if (!validPackageIds.has(packageId)) {
		throw redirect(307, '/');
	}

	try {
		const manifest = await getPackageManifest(packageId, fetch);

		// If no roadmap, redirect to package overview
		if (!packageHasRoadmap(manifest)) {
			throw redirect(307, `${base}/${packageId}`);
		}

		const roadmap = await getRoadmapData(packageId, fetch);

		return {
			packageId: packageId as PackageId,
			manifest,
			resolvedTag: manifest.latestTag,
			roadmap
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) {
			throw e;
		}
		throw redirect(307, `${base}/${packageId}`);
	}
};
