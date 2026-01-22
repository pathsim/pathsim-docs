import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
	const { selectedTag } = await parent();
	throw redirect(307, `${base}/pathsim/${selectedTag}/examples`);
};
