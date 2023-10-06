<script>
	export let width = '1em';
	export let height = width;
	export let viewBox = '0 0 44 50';
	export let fill = 'currentColor';
	export let people = 1;
	export let onClick;
	export let hoverEffects = false;
	export let active = false;

	let d = '';

	$: if (people === 1) {
		d =
			'M24 20a7 7 0 1 0 0-14a7 7 0 0 0 0 14ZM6 40.8V42h36v-1.2c0-4.48 0-6.72-.872-8.432a8 8 0 0 0-3.496-3.496C35.92 28 33.68 28 29.2 28H18.8c-4.48 0-6.72 0-8.432.872a8 8 0 0 0-3.496 3.496C6 34.08 6 36.32 6 40.8Z';
	} else if (people === 2) {
		d =
			'M19 20a7 7 0 1 0 0-14a7 7 0 0 0 0 14ZM32.608 7A6.996 6.996 0 0 1 36 13a6.996 6.996 0 0 1-3.392 6M4 40.8V42h30v-1.2c0-4.48 0-6.72-.872-8.432a8 8 0 0 0-3.496-3.496C27.92 28 25.68 28 21.2 28h-4.4c-4.48 0-6.72 0-8.432.872a8 8 0 0 0-3.496 3.496C4 34.08 4 36.32 4 40.8ZM44 42v-1.2c0-4.48 0-6.72-.872-8.432a8 8 0 0 0-3.496-3.496';
	} else if (people === 3) {
		d =
			'M24 20a7 7 0 1 0 0-14a7 7 0 0 0 0 14ZM12 7.255A6.992 6.992 0 0 0 9 13a6.996 6.996 0 0 0 3.392 6M36 7.255A6.992 6.992 0 0 1 39 13a6.992 6.992 0 0 1-3 5.745M12 40v2h24v-2c0-3.727 0-5.591-.609-7.062a8 8 0 0 0-4.33-4.329C29.591 28 27.727 28 24 28s-5.591 0-7.061.609a8 8 0 0 0-4.33 4.33C12 34.408 12 36.273 12 40Zm32 2v-1.2c0-4.48 0-6.72-.872-8.432a8 8 0 0 0-3.496-3.496M4 42v-1.2c0-4.48 0-6.72.872-8.432a8 8 0 0 1 3.496-3.496';
	}
</script>

{#key d}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		{width}
		{height}
		{viewBox}
		on:click={onClick}
		class:hover={hoverEffects}
		class:active
		{...$$props}
		role="{people} in the room"
	>
		<path
			color={fill}
			fill="none"
			stroke="currentColor"
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="4"
			{d}
		/>
	</svg>
{/key}

<style>
	svg {
		padding: 6px;
	}
	path {
		transition: all 300ms cubic-bezier(0.075, 0.82, 0.165, 1);
	}

	svg.hover:hover:not(.active) {
		cursor: pointer;
		filter: brightness(1.2);
		color: rgb(62, 62, 62);
	}

	svg.active {
		background-color: rgb(122, 122, 122);
		/* padding: 6px; */
		border-radius: 4px;
		color: #cbcbcb;
	}
</style>
