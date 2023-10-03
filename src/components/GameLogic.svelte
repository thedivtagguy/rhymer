<script>
	// @ts-nocheck

	import { onMount } from 'svelte';
	import PartySocket from 'partysocket';

	export let id = 'hello';
	let gameState = null;
	let newRhyme = '';
	let partySocket;
	let myTurn = true;
	let guessedRhymes = [];

	function updateGameState(newGameState) {
		console.log('Client: Updating game state with new data:', newGameState);
		gameState = { ...gameState, ...newGameState };
		guessedRhymes = [...newGameState.guessedRhymes]; // Explicitly set this
	}

	function submitRhyme(newRhyme, myTurn, id) {
		if (newRhyme && (myTurn || gameState.players === 0)) {
			const newGuess = { word: newRhyme };
			partySocket.send(JSON.stringify({ type: 'rhyme', rhyme: newGuess, room: id }));
			newRhyme = ''; // reset the input
		}
	}

	let players;

	$: if (gameState) {
		players = gameState.players;
		console.log('Client: Reactive gameState:', gameState); // Debug line
	}

	onMount(() => {
		const isDevMode = process.env.NODE_ENV === 'development';
		const host = isDevMode ? 'localhost:1999' : 'rhymetime.thedivtagguy.partykit.dev';
		console.log(isDevMode);
		partySocket = new PartySocket({
			host: host,
			room: id
		});

		partySocket.addEventListener('message', (e) => {
			const msg = JSON.parse(e.data);
			if (msg.type === 'sync') {
				gameState = msg.gameState;
				gameState.room = id;
			} else if (msg.type === 'sync' || msg.type === 'update') {
				updateGameState(msg.gameState);
				if (msg.type === 'update') {
					myTurn = msg.nextPlayerId === partySocket.connection.id;
				}
			}
		});
	});
</script>

<main>
	<h1>Rhyme Time</h1>

	{#if gameState}
		<div>
			<h2>Current Word: {gameState.word}</h2>
			<p>Players: {players}</p>
			<p>Room: {gameState.room}</p>
		</div>

		<div>
			<h3>Guessed Rhymes:</h3>
			<ul>
				{#each guessedRhymes as guessedRhyme}
					<li class:correct={guessedRhyme.isValid}>{guessedRhyme.word}</li>
				{/each}
			</ul>
		</div>
		<div>
			<input
				type="text"
				bind:value={newRhyme}
				placeholder="Enter a rhyme..."
				disabled={!myTurn || gameState.players === 0}
			/>
			<button
				on:click={submitRhyme(newRhyme, myTurn, id)}
				disabled={!myTurn || gameState.players === 0}>Submit</button
			>
		</div>
	{:else}
		<p>Loading...</p>
	{/if}
</main>

<style>
	.correct {
		color: green;
	}
</style>
