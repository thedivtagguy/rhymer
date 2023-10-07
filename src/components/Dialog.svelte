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
		elements: { trigger, overlay, content, title, description, close, portalled },
		states: { open }
	} = createDialog();
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
				<slot name="title">Edit profile</slot>
				<!-- slot for title -->
			</h3>
			<p use:melt={$description} class="description">
				<slot name="description" />
			</p>
			<slot name="fields" />
			<div class="actions">
				<button use:melt={$close} class="secondary"> Close </button>
				<button use:melt={$close} class="primary">Rematch</button>
			</div>
		</div>
	{/if}
</div>

<style lang="postcss">
	:root {
		font-family: 'Nunito Variable', sans-serif;
	}
	.trigger {
		display: inline-flex;
		align-items: center;
		justify-content: center;

		padding: 0.5rem 1rem;

		border-radius: 0.375rem;

		background-color: rgb(var(--color-white) / 1);

		font-weight: 500;
		line-height: 1;

		color: rgb(var(--color-magnum-700) / 1);

		box-shadow: 0 10px 15px -3px rgb(var(--color-black) / 0.1),
			0 4px 6px -4px rgb(var(--color-black) / 0.1);
	}

	.trigger:hover {
		opacity: 0.75;
	}

	.overlay {
		position: fixed;
		inset: 0;
		z-index: 40;

		background-color: rgb(var(--color-black) / 0.5);
	}

	.content {
		position: fixed;
		left: 50%;
		top: 50%;

		z-index: 50;

		max-height: 85vh;
		width: 90vw;
		max-width: 450px;

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

	.title {
		margin: 0;
		text-align: center;
		font-size: 1.425rem;
		line-height: 0;
		font-weight: 800;

		color: rgb(var(--color-black) / 1);
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
		justify-content: flex-end;
		gap: 1rem;

		margin-top: 1.5rem;
	}

	.actions button {
		display: inline-flex;
		align-items: center;
		justify-content: center;

		height: 2rem;

		border-radius: 0.25rem;

		padding: 0 1rem;

		font-weight: 500;
		line-height: 1;
	}

	.actions button.secondary {
		background-color: rgb(var(--color-zinc-100) / 1);

		color: rgb(var(--color-zinc-600) / 1);
	}

	.actions button.primary {
		background-color: rgb(var(--color-magnum-100) / 1);

		color: rgb(var(--color-magnum-900) / 1);
	}
</style>
