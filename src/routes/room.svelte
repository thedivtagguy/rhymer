<script>
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import client from '../lib/cloyseus';

	let room;
	const chain = writable([]);

	onMount(async () => {
		room = await client.joinOrCreate('your_room_schema');
		room.onStateChange((state) => {
			chain.set(state.chain);
		});
	});

	const addToChain = async (word) => {
		await room.send({ action: 'add', word });
	};
</script>

<h1>Collaborative Mode</h1>
<input placeholder="Enter rhyme" on:blur={(e) => addToChain(e.target.value)} />
<ul>
	{#each $chain as word}
		<li>{word}</li>
	{/each}
</ul>
