<script>
	import { onMount } from 'svelte';
	import { playerNameStore } from '$lib/stores';
	import GameLogic from '../../components/GameLogic.svelte';
	import PlayerName from '../../components/PlayerName.svelte';

	let showNameModal;

	onMount(() => {
		// Use the store's value to determine if the name modal should be shown
		$playerNameStore === 'Anonymous' ? (showNameModal = true) : (showNameModal = false);
	});

	function handleNameSaved() {
		showNameModal = false;
	}
</script>

{#if showNameModal}
	<PlayerName on:nameSaved={handleNameSaved} />
{:else}
	<GameLogic />
{/if}
