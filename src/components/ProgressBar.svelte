<script lang="ts">
	import { createProgress, melt } from '@melt-ui/svelte';
	import { writable } from 'svelte/store';

	export let currentValue;
	export let maxValue = 5;

	const value = writable(currentValue);

	const {
		elements: { root },
		options: { max }
	} = createProgress({
		value,
		max: maxValue
	});

	$: value.set(currentValue);
	$: max.set(maxValue);
</script>

<div use:melt={$root} class="outer">
	<div
		class="inner"
		style={`transform: translateX(-${100 - (100 * ($value ?? 0)) / ($max ?? 1)}%)`}
	/>
</div>

<style>
	.outer {
		position: relative;
		height: 16px;
		width: 250px;
		overflow: hidden;
		border-radius: 9999px;
		background-color: rgb(174, 174, 174);
	}

	.inner {
		height: 100%;
		width: 100%;
		background-color: #679436;
		transition: all 660ms cubic-bezier(0.65, 0, 0.35, 1);
	}
</style>
