// Centralized timing constants for consistent behavior across components

/** Duration to show copy feedback before resetting (ms) */
export const COPY_FEEDBACK_DURATION = 2000;

/** Delay before showing tooltip (ms) */
export const TOOLTIP_SHOW_DELAY = 300;

/** Delay before hiding tooltip (ms) */
export const TOOLTIP_HIDE_DELAY = 100;

/** Animation durations matching CSS variables */
export const TRANSITION = {
	fast: 100,
	normal: 200,
	slow: 300
} as const;
