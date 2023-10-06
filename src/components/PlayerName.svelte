<script>
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
	let playerName = '';

	function saveName() {
		if (playerName.trim()) {
			localStorage.setItem('playerName', playerName);
			dispatch('nameSaved');
		}
	}
</script>

<div class="player-name-modal">
	<h2>Welcome! Please enter your player name:</h2>
	<input bind:value={playerName} placeholder="Enter your name" />
	<button on:click={saveName}>Save</button>
</div>
