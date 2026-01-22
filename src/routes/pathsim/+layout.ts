import type { LayoutLoad } from './$types';
import { getPackageManifest } from '$lib/api/versions';
import { versionStore } from '$lib/stores/versionStore';

const PACKAGE_ID = 'pathsim';

/**
 * Load manifest for the pathsim package overview.
 * This allows the version selector to appear in the sidebar.
 */
export const load: LayoutLoad = async ({ fetch }) => {
	try {
		const manifest = await getPackageManifest(PACKAGE_ID, fetch);

		// Get stored version or use latest
		const storedVersion = versionStore.getVersionSync(PACKAGE_ID);
		const selectedTag = storedVersion || manifest.latestTag;

		return {
			packageId: PACKAGE_ID,
			manifest,
			selectedTag
		};
	} catch (e) {
		// Manifest not available, continue without version selector
		return {
			packageId: PACKAGE_ID,
			manifest: null,
			selectedTag: null
		};
	}
};
