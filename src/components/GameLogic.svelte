<script>
	// @ts-nocheck
	import { onMount } from 'svelte';
	import PartySocket from 'partysocket';

	export let id = 'hello';
	let gameState = null;
	let newRhyme = '';
	let partySocket;
	let myTurn = true;

	function submitRhyme(newRhyme, myTurn, id) {
		if (newRhyme && (myTurn || gameState.session.players === 0)) {
			const newGuess = { word: newRhyme };
			partySocket.send(JSON.stringify({ type: 'rhyme', rhyme: newGuess, room: id }));
			newRhyme = ''; // reset the input
		}
	}

	let players;
	let currentWord;
	let guessedRhymes;

	$: if (gameState) {
		console.log(gameState);
		players = gameState.session.players;
		currentWord = gameState.words[gameState.words.length - 1].wordToRhyme.word;
		guessedRhymes = gameState.words[gameState.words.length - 1].wordToRhyme.guesses;
	}

	onMount(() => {
		const isDevMode = process.env.NODE_ENV === 'development';
		const host = isDevMode ? 'localhost:1999' : 'rhymetime.thedivtagguy.partykit.dev';
		partySocket = new PartySocket({
			host: host,
			room: id
		});

		partySocket.addEventListener('message', (e) => {
			const msg = JSON.parse(e.data);
			if (msg.type === 'sync') {
				gameState = msg.gameState;
				gameState.session.room = id;
			} else if (msg.type === 'update') {
				myTurn = msg.nextPlayerId === partySocket.connection.id;
			}
		});
	});
</script>

<main>
	{#if gameState}
		<div>
			<p>Players: {players}</p>
			<h2 class="target-word">{currentWord}</h2>
			<p>Room: {gameState.session.room}</p>
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
				disabled={!myTurn || gameState.session.players === 0}
			/>
			<button
				on:click={() => submitRhyme(newRhyme, myTurn, id)}
				disabled={!myTurn || gameState.session.players === 0}>Submit</button
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

	.target-word {
		text-align: center;
		text-transform: uppercase;
	}
</style>
