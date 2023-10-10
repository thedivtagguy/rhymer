<script>
	import { playerNameStore } from '$lib/stores';
	import GameLogic from '../../components/MultiPlayerGame.svelte';
	import PlayerName from '../../components/PlayerName.svelte';

	let showNameModal = false;

	$playerNameStore === 'Anonymous' ? (showNameModal = true) : (showNameModal = false);

	function handleNameSaved() {
		showNameModal = false;
	}
</script>

{#if showNameModal}
	<!-- <PlayerName /> -->
	<PlayerName on:nameSaved={handleNameSaved} />
{:else}
	<GameLogic />
{/if}
