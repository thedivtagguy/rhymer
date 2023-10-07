<script>
	import { createEventDispatcher } from 'svelte';
	import { playerNameStore } from '$lib/stores';
	const dispatch = createEventDispatcher();
	let playerName = '';

	function saveName() {
		if (playerName.trim()) {
			playerNameStore.set(playerName);
			dispatch('nameSaved');
		}
	}
</script>

<div class="player-name-modal">
	<h2>Welcome! Please enter your player name:</h2>
	<input bind:value={playerName} placeholder="Enter your name" />
	<button on:click={saveName}>Save</button>
</div>
