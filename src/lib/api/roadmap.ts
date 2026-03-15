import { base } from '$app/paths';

export interface RoadmapIssue {
	number: number;
	title: string;
	body: string;
	labels: string[];
	url: string;
	created: string;
}

export interface RoadmapData {
	package: string;
	repo: string;
	updated: string;
	issues: RoadmapIssue[];
}

/**
 * Fetch roadmap data for a package.
 * Path: /{package}/roadmap.json
 */
export async function getRoadmapData(
	packageId: string,
	fetch: typeof globalThis.fetch
): Promise<RoadmapData> {
	const url = `${base}/${packageId}/roadmap.json`;
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Failed to load roadmap for ${packageId}: ${response.status}`);
	}

	return response.json();
}
