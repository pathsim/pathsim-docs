// Version loading utilities for versioned API documentation
import { base } from '$app/paths';
import type { APIPackage } from './generated';

export interface VersionInfo {
	tag: string;
	released: string;
}

export interface PackageManifest {
	package: string;
	latestTag: string;
	versions: VersionInfo[];
}

/**
 * Fetch the version manifest for a package
 */
export async function getVersionManifest(
	packageId: string,
	fetch: typeof globalThis.fetch
): Promise<PackageManifest> {
	const url = `${base}/api/versions/${packageId}/manifest.json`;
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Failed to load version manifest for ${packageId}: ${response.status}`);
	}

	return response.json();
}

/**
 * Fetch versioned API data for a specific package version tag
 */
export async function getVersionedApiData(
	packageId: string,
	tag: string,
	fetch: typeof globalThis.fetch
): Promise<APIPackage> {
	// Ensure tag has 'v' prefix
	const normalizedTag = tag.startsWith('v') ? tag : `v${tag}`;
	const url = `${base}/api/versions/${packageId}/${normalizedTag}.json`;
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Failed to load API data for ${packageId} ${normalizedTag}: ${response.status}`);
	}

	return response.json();
}

/**
 * Resolve a version/tag string to an actual tag
 * - 'latest' -> actual latest tag from manifest
 * - undefined -> actual latest tag from manifest
 * - 'v0.16.4' or '0.16.4' -> 'v0.16.4'
 */
export function resolveTag(tagOrVersion: string | undefined, manifest: PackageManifest): string {
	if (!tagOrVersion || tagOrVersion === 'latest') {
		return manifest.latestTag;
	}

	// Normalize to have 'v' prefix
	const normalized = tagOrVersion.startsWith('v') ? tagOrVersion : `v${tagOrVersion}`;

	// Validate the tag exists in manifest
	const exists = manifest.versions.some((v) => v.tag === normalized);
	if (!exists) {
		throw new Error(`Version ${normalized} not found for ${manifest.package}`);
	}

	return normalized;
}

/**
 * Check if a tag is the latest tag
 */
export function isLatestTag(tag: string, manifest: PackageManifest): boolean {
	const normalized = tag.startsWith('v') ? tag : `v${tag}`;
	return normalized === manifest.latestTag;
}

/**
 * Get the display label for a tag
 */
export function getTagLabel(tag: string, manifest: PackageManifest): string {
	if (isLatestTag(tag, manifest)) {
		return `${tag} (latest)`;
	}
	return tag;
}
