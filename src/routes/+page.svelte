<script>
	import { onMount } from 'svelte';
	import PartySocket from 'partysocket';

	let gameState = null;
	let newRhyme = '';
	let partySocket;
	function submitRhyme() {
		if (newRhyme) {
			partySocket.send(JSON.stringify({ type: 'rhyme', rhyme: { word: newRhyme } }));
			newRhyme = '';
		}
	}
	onMount(() => {
		partySocket = new PartySocket({
			host: 'https://rhymetime.thedivtagguy.partykit.dev/',
			room: 'rhyme-room'
		});

		partySocket.addEventListener('message', (e) => {
			const msg = JSON.parse(e.data);

			if (msg.type === 'sync') {
				gameState = msg.gameState;
			} else if (msg.type === 'update') {
				gameState = { ...gameState, validRhymes: [...gameState.validRhymes, msg.rhyme.word] };
			}
		});
	});
</script>

<main>
	<h1>Rhyme Time</h1>

	{#if gameState}
		<div>
			<h2>Current Word: {gameState.word}</h2>
			<p>Players: {gameState.players}</p>
		</div>

		<div>
			<h3>Valid Rhymes:</h3>
			<ul>
				{#each gameState.validRhymes as rhyme}
					<li>{rhyme}</li>
				{/each}
			</ul>
		</div>

		<div>
			<input type="text" bind:value={newRhyme} placeholder="Enter a rhyme..." />
			<button on:click={submitRhyme}>Submit</button>
		</div>
	{:else}
		<p>Loading...</p>
	{/if}
</main>
