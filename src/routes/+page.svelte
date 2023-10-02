<script>
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	let dailyWord = '';
	let rhymes = [];
	const chain = writable([]);

	onMount(async () => {
		dailyWord = 'fairy'; // Replace with dynamic logic to get a daily word
		const res = await fetch(`https://rhymetimewords.netlify.app/words/debug/${dailyWord}.json`);
		const data = await res.json();
		rhymes = data.words.map((obj) => obj.word);
	});

	const addToChain = (word) => {
		if (rhymes.includes(word)) {
			$chain = [...$chain, word];
		} else {
			alert('Game Over! Invalid rhyme.');
			chain.set([]);
		}
	};
</script>

<h1>Rhyme Time</h1>
<h2>Daily word: {dailyWord}</h2>
<input placeholder="Enter rhyme" on:blur={(e) => addToChain(e.target.value)} />
<ul>
	{#each $chain as word}
		<li>{word}</li>
	{/each}
</ul>
