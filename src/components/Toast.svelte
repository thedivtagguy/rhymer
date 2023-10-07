<script>
	import { slide } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';

	export let message = '';
	export let duration = 3000;

	let toastVisible = true;

	setTimeout(() => {
		toastVisible = false;
	}, duration);
</script>

{#if toastVisible}
	<div
		in:slide={{ easing: elasticOut, delay: 0, duration: 500 }}
		out:slide={{ delay: 0, duration: 300 }}
		class="toast"
	>
		<p>{message}</p>
	</div>
{/if}

<style>
	.toast {
		position: fixed;
		top: 10%;
		left: 50%;
		transform: translateX(-50%);
		background-color: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 10px 20px;
		border-radius: 25px;
		z-index: 1000;
		font-size: 0.9em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 90%;
		box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.3);
	}
</style>
