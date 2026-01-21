// Version loading utilities for versioned API documentation
import { base } from '$app/paths';
import type { APIPackage } from './generated';

export interface VersionInfo {
	version: string;
	tag: string;
	released: string;
}

export interface PackageManifest {
	package: string;
	latestVersion: string;
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
 * Fetch versioned API data for a specific package version
 */
export async function getVersionedApiData(
	packageId: string,
	version: string,
	fetch: typeof globalThis.fetch
): Promise<APIPackage> {
	const url = `${base}/api/versions/${packageId}/v${version}.json`;
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Failed to load API data for ${packageId} v${version}: ${response.status}`);
	}

	return response.json();
}

/**
 * Resolve a version string to an actual version number
 * - 'latest' -> actual latest version from manifest
 * - undefined -> actual latest version from manifest
 * - 'v0.16' or '0.16' -> '0.16'
 */
export function resolveVersion(version: string | undefined, manifest: PackageManifest): string {
	if (!version || version === 'latest') {
		return manifest.latestVersion;
	}

	// Strip leading 'v' if present
	const normalized = version.startsWith('v') ? version.slice(1) : version;

	// Validate the version exists in manifest
	const exists = manifest.versions.some((v) => v.version === normalized);
	if (!exists) {
		throw new Error(`Version ${normalized} not found for ${manifest.package}`);
	}

	return normalized;
}

/**
 * Check if a version is the latest version
 */
export function isLatestVersion(version: string, manifest: PackageManifest): boolean {
	return version === manifest.latestVersion;
}

/**
 * Get the display label for a version
 */
export function getVersionLabel(version: string, manifest: PackageManifest): string {
	if (isLatestVersion(version, manifest)) {
		return `v${version} (latest)`;
	}
	return `v${version}`;
}
