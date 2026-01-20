import { writable } from 'svelte/store';
import type { APIModule } from '$lib/api/generated';

// Store for API modules that can be accessed by Sidebar when on API pages
export const apiModulesStore = writable<APIModule[]>([]);
