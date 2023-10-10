<script lang="ts">
	import { createDialog, melt } from '@melt-ui/svelte';
	/** Internal helpers */
	import { flyAndScale } from '$lib/utils/transitions';
	import { X } from 'lucide-svelte';

	/**
	 * @param {boolean}
	 */
	export let isOpen = false;

	$: open.set(isOpen);

	const {
		elements: { overlay, content, title, description, close, portalled },
		states: { open }
	} = createDialog({
		closeOnOutsideClick: false,
		closeOnEscape: false
	});
</script>

<div use:melt={$portalled}>
	{#if $open}
		<div use:melt={$overlay} class="overlay" />
		<div
			class="content"
			transition:flyAndScale={{
				duration: 250,
				y: 8,
				start: 0.96
			}}
			use:melt={$content}
		>
			<h3 use:melt={$title} class="title">
				<slot name="title" />
			</h3>
			<p use:melt={$description} class="description">
				<slot name="description" />
			</p>
			<slot name="fields" />
			<div class="actions">
				<a href="/"><button use:melt={$close} class="secondary"> Back to home </button></a>
				<slot name="primary-button" />
			</div>
		</div>
	{/if}
</div>

<style lang="postcss">
	:root {
		font-family: 'Nunito Variable', sans-serif;
	}

	.overlay {
		position: fixed;
		inset: 0;
		z-index: 40;
		background-color: rgb(var(--color-black) / 0.5);
	}

	a {
		width: 100%;
	}
	.content {
		position: fixed;
		left: 50%;
		top: 50%;
		z-index: 50;
		max-height: 85vh;
		width: 90vw;
		max-width: 350px;
		transform: translate(-50%, -50%);
		border-radius: 0.375rem;
		background-color: rgb(var(--color-white) / 1);
		padding: 1.5rem;
		box-shadow: 0 10px 15px -3px rgb(var(--color-black) / 0.1),
			0 4px 6px -4px rgb(var(--color-black) / 0.1);
	}

	.content:focus {
		outline: 2px solid transparent;
		outline-offset: 2px;
	}

	.description {
		margin-bottom: 1.25rem;
		margin-top: 0.5rem;

		line-height: 1.5;
		font-size: large;
		color: rgb(var(--color-zinc-600) / 1);
	}

	.actions {
		display: flex;
		justify-content: center;
		margin-top: 1.5rem;
	}

	.actions button,
	a > button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--black) !important;
		height: 50px;
		width: 60%;
		color: white;
		border-radius: 8px;
		display: flex;
		gap: 8px;
	}
</style>
