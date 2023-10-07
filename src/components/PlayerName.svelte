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

<div class="gray-box">
	<div class="player-name-modal">
		<h2>Hola! First time here, eh? What do I call you?</h2>
		<div class="field">
			<input bind:value={playerName} class="line-input" placeholder="Enter your name" />
			<div class="line" />
		</div>
		<button on:click={saveName}>Save</button>
	</div>
</div>

<style>
	.player-name-modal {
		height: 100%;
		width: 90%;
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		align-items: center;
	}
	h2 {
		font-size: 1.5rem;
		text-align: center;
	}

	.line-input {
		background: 0;
		border: 0;
		outline: none;
		width: 80vw;
		max-width: 400px;
		font-size: 1.5em;
		transition: padding 0.3s 0.2s ease;
	}

	.line-input:focus {
		padding-bottom: 5px;
	}

	.line-input:focus + .line:after {
		transform: scaleX(1);
	}

	.field {
		position: relative;
		max-width: 250px;
	}

	.line {
		width: 100%;
		height: 3px;
		position: absolute;
		bottom: -8px;
		background: #bdc3c7;
	}

	.line:after {
		content: ' ';
		position: absolute;
		float: right;
		width: 100%;
		height: 3px;
		transform: scalex(0);
		transition: transform 0.3s ease;
		background: #da7a00;
	}
</style>
