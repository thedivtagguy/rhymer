<script>
	import { onMount } from 'svelte';
	import PartySocket from 'partysocket';

	export let id = 'hello';
	let gameState = null;
	let newRhyme = '';
	let partySocket;
	let myTurn = true; // Initialize to true for demonstration.
	let guessedRhymes = []; // To hold the guessed rhymes
	let isCorrectGuess = false; // To track if the last guess was correct

	function submitRhyme() {
		if (newRhyme && (myTurn || gameState.players === 0)) {
			const isValidRhyme = gameState.validRhymes.includes(newRhyme);
			guessedRhymes = [...guessedRhymes, { word: newRhyme, isValid: isValidRhyme }];
			partySocket.send(JSON.stringify({ type: 'rhyme', rhyme: { word: newRhyme }, room: id }));
			newRhyme = '';
			isCorrectGuess = isValidRhyme;
			myTurn = gameState.players === 0 ? true : false;
		}
	}

	let players;
	$: if (gameState) {
		players = gameState.players;
	}

	onMount(() => {
		partySocket = new PartySocket({
			host: 'rhymetime.thedivtagguy.partykit.dev',
			room: id
		});

		partySocket.addEventListener('message', (e) => {
			const msg = JSON.parse(e.data);
			if (msg.type === 'sync') {
				gameState = msg.gameState;
				gameState.room = id;
			} else if (msg.type === 'update') {
				gameState = { ...gameState, validRhymes: [...gameState.validRhymes, msg.rhyme.word] };
				myTurn = true; // Enable user input after an update.
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
				disabled={!myTurn || gameState.players !== 0}
			/>
			<button on:click={submitRhyme} disabled={!myTurn || gameState.players !== 0}>Submit</button>
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
