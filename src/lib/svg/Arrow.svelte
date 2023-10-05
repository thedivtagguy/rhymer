<script>
	export let width = '1em';
	export let height = width;
	export let viewBox = '0 0 24 24';
	export let fill = 'currentColor';
	export let direction = 'left';
	export let onClick = null;
	export let href = null;
	export let ariaLabel = 'Interactive SVG'; // provide a meaningful default or ensure it's provided by the parent

	let rotate = '0deg';
	$: if (direction === 'right') {
		rotate = '180deg';
	} else if (direction === 'top') {
		rotate = '90deg';
	} else if (direction === 'bottom') {
		rotate = '-90deg';
	}
</script>

{#if href}
	<a {href} on:click={onClick} aria-label={ariaLabel}>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			{width}
			{height}
			{viewBox}
			{...$$props}
			transform="rotate({rotate})"
		>
			<path {fill} d="m7.825 13l5.6 5.6L12 20l-8-8l8-8l1.425 1.4l-5.6 5.6H20v2H7.825Z" />
		</svg>
	</a>
{:else}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		{width}
		{height}
		{viewBox}
		{...$$props}
		on:click={onClick}
		transform="rotate({rotate})"
		role="button"
		tabindex="0"
		aria-label={ariaLabel}
		on:keydown={(e) => e.key === 'Enter' && onClick && onClick()}
	>
		<path {fill} d="m7.825 13l5.6 5.6L12 20l-8-8l8-8l1.425 1.4l-5.6 5.6H20v2H7.825Z" />
	</svg>
{/if}

<style>
	svg:hover {
		cursor: pointer;
		transform: scale(1.2);
		transition: all cubic-bezier(0.215, 0.61, 0.355, 1);
	}
</style>
