<script>
	import { onMount } from 'svelte';
	import GameLogic from '../../components/GameLogic.svelte';
	import PlayerName from '../../components/PlayerName.svelte';

	let showNameModal;

	onMount(() => {
		showNameModal = !localStorage.getItem('playerName');
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
