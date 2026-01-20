/**
 * Theme store - watches for theme changes via MutationObserver
 * Used by components that need to react to light/dark theme changes
 */
import { readable } from 'svelte/store';

export type Theme = 'light' | 'dark';

function getTheme(): Theme {
	if (typeof document === 'undefined') return 'dark';
	return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export const theme = readable<Theme>(getTheme(), (set) => {
	if (typeof window === 'undefined') return;

	// Set initial value
	set(getTheme());

	// Watch for theme changes
	const observer = new MutationObserver(() => {
		set(getTheme());
	});

	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['data-theme']
	});

	return () => observer.disconnect();
});

export const isDark = readable<boolean>(true, (set) => {
	return theme.subscribe((t) => set(t === 'dark'));
});
