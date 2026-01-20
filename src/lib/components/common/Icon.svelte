<script lang="ts">
	interface Props {
		name: string;
		size?: number;
	}

	let { name, size = 16 }: Props = $props();
</script>

{#if name === 'search'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<circle cx="11" cy="11" r="8"/>
		<line x1="21" y1="21" x2="16.65" y2="16.65"/>
	</svg>
{:else if name === 'menu'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<line x1="3" y1="12" x2="21" y2="12"/>
		<line x1="3" y1="6" x2="21" y2="6"/>
		<line x1="3" y1="18" x2="21" y2="18"/>
	</svg>
{:else if name === 'x'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<line x1="18" y1="6" x2="6" y2="18"/>
		<line x1="6" y1="6" x2="18" y2="18"/>
	</svg>
{:else if name === 'chevron-down'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<polyline points="6 9 12 15 18 9"/>
	</svg>
{:else if name === 'chevron-right'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<polyline points="9 18 15 12 9 6"/>
	</svg>
{:else if name === 'chevron-left'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<polyline points="15 18 9 12 15 6"/>
	</svg>
{:else if name === 'external-link'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
		<polyline points="15 3 21 3 21 9"/>
		<line x1="10" y1="14" x2="21" y2="3"/>
	</svg>
{:else if name === 'github'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
		<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
	</svg>
{:else if name === 'sun'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<circle cx="12" cy="12" r="5"/>
		<line x1="12" y1="1" x2="12" y2="3"/>
		<line x1="12" y1="21" x2="12" y2="23"/>
		<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
		<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
		<line x1="1" y1="12" x2="3" y2="12"/>
		<line x1="21" y1="12" x2="23" y2="12"/>
		<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
		<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
	</svg>
{:else if name === 'moon'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
	</svg>
{:else if name === 'play'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<polygon points="5 3 19 12 5 21 5 3"/>
	</svg>
{:else if name === 'play-filled'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
		<polygon points="5 3 19 12 5 21 5 3"/>
	</svg>
{:else if name === 'loader'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<path d="M21 12a9 9 0 1 1-6.219-8.56"/>
	</svg>
{:else if name === 'copy'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
		<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
	</svg>
{:else if name === 'check'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<polyline points="20 6 9 17 4 12"/>
	</svg>
{:else if name === 'book'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
		<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
	</svg>
{:else if name === 'code'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<polyline points="16 18 22 12 16 6"/>
		<polyline points="8 6 2 12 8 18"/>
	</svg>
{:else if name === 'home'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
		<polyline points="9 22 9 12 15 12 15 22"/>
	</svg>
{:else if name === 'file'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
		<polyline points="13 2 13 9 20 9"/>
	</svg>
{:else if name === 'folder'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
	</svg>
{:else if name === 'download'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
		<polyline points="7 10 12 15 17 10"/>
		<line x1="12" y1="15" x2="12" y2="3"/>
	</svg>
{:else if name === 'zap'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
	</svg>
{:else if name === 'activity'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
	</svg>
{:else if name === 'box'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
		<polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
		<line x1="12" y1="22.08" x2="12" y2="12"/>
	</svg>
{:else if name === 'flask'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<path d="M9 3h6v5.5L19 18c.4.7.1 1.5-.6 1.9-.2.1-.5.1-.7.1H6.3c-.8 0-1.3-.6-1.3-1.3 0-.2 0-.5.1-.7L9 8.5V3z"/>
		<path d="M9 3h6"/>
	</svg>
{:else if name === 'car'}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
		<circle cx="7" cy="17" r="2"/>
		<path d="M9 17h6"/>
		<circle cx="17" cy="17" r="2"/>
	</svg>
{:else}
	<span class="text-icon">{name}</span>
{/if}

<style>
	svg {
		display: inline-block;
		vertical-align: middle;
		flex-shrink: 0;
	}
	.text-icon {
		font-size: inherit;
	}
</style>
