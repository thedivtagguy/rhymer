<script>
	import './styles.css';
	import QuestionMark from '../lib/svg/QuestionMark.svelte';
	import { onlinePlayers } from '$lib/stores';
	import PeoplePresence from '$lib/svg/PeoplePresence.svelte';
	import { createDialog, melt } from '@melt-ui/svelte';
	/** Internal helpers */
	import { flyAndScale } from '$lib/utils/transitions';
	import { X } from 'lucide-svelte';
	import GuessMarker from '$lib/svg/GuessMarker.svelte';

	const {
		elements: { trigger, overlay, content, title, description, close, portalled },
		states: { open }
	} = createDialog();
</script>

<svelte:head>
	<title>Keyrime</title>
</svelte:head>
<div class="app">
	<header>
		<div class="placeholder">
			{#if $onlinePlayers !== 0}
				<PeoplePresence people={$onlinePlayers} />
			{:else}
				<div style="width:1em;" />
			{/if}
		</div>
		<a href="/">
			<h1>keyrime</h1>
		</a>
		<div use:melt={$trigger} class="trigger">
			<QuestionMark />
		</div>
	</header>
	<main>
		<slot />
	</main>
</div>

<div use:melt={$portalled}>
	{#if $open}
		<div use:melt={$overlay} class="overlay" />
		<div
			class="dialog-content"
			transition:flyAndScale={{ duration: 150, y: 8, start: 0.96 }}
			use:melt={$content}
		>
			<h2 use:melt={$title} class="dialog-title">Hullo, this is Rimer</h2>
			<p use:melt={$description} class="dialog-description">
				The rules are simple. Each game session has 5 rounds with five turns. Guess the best rhymes
				for the word. Each valid rhyme scores based on:
			</p>
			<ul class="score-criteria">
				<li>Variation from initial word</li>
				<li>Quality of rhyme</li>
				<li>Word length</li>
			</ul>
			<div class="rhyme-categories">
				<!-- Utilizing components is good for code reuse and cleanliness, but for the context of this example, I'll keep the original structure -->
				<div class="rhyme-category">
					<GuessMarker radius={25} category="nope" />
					<span>Missed the beat</span>
					<span class="points">0 points</span>
				</div>
				<div class="rhyme-category">
					<GuessMarker radius={25} category="good" />
					<span>Pretty neat</span>
					<span class="points">2 points</span>
				</div>
				<div class="rhyme-category">
					<GuessMarker radius={25} category="great" />
					<span>Rhyme elite</span>
					<span class="points">3 points</span>
				</div>
			</div>
			<p use:melt={$description} class="dialog-description">
				At the end, the player with the highest score wins!
			</p>
			<button use:melt={$close} aria-label="close" class="close-btn">
				<X />
			</button>
		</div>
	{/if}
</div>

<style>
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 2rem;
		color: var(--black);
		padding: 0 16px;
	}

	.placeholder {
		width: 1em;
		height: 1em;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		max-width: 500px;
		margin: auto;
		justify-content: space-between;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: start;
		padding-top: 4rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
	}

	.trigger {
		display: inline-flex;
		align-items: center;
		justify-content: center;

		padding: 0.5rem 1rem;

		border-radius: 0.375rem;

		font-weight: 500;
		line-height: 1;
	}

	.trigger:hover {
		opacity: 0.75;
		cursor: pointer;
	}

	.overlay {
		position: fixed;
		inset: 0;
		z-index: 40;

		background-color: rgb(var(--color-black) / 0.5);
	}

	.dialog-content {
		position: fixed;
		left: 50%;
		top: 50%;

		z-index: 50;

		max-height: 85vh;
		width: 90vw;
		max-width: 350px;

		transform: translate(-50%, -50%);

		border-radius: 0.375rem;

		background-color: rgb(var(--color-white) / 1);

		padding: 1.5rem;

		box-shadow: 0 10px 15px -3px rgb(var(--color-black) / 0.1),
			0 4px 6px -4px rgb(var(--color-black) / 0.1);
	}

	.dialog-content:focus {
		outline: 2px solid transparent;
		outline-offset: 2px;
	}

	.trigger {
		padding: 0.5rem;
		border-radius: 50%;
		transition: background 0.2s ease;
	}

	.trigger:hover {
		background: #ddd;
	}

	.dialog-title {
		margin-top: 0;
		font-size: 24px;
		text-align: center;
	}

	.dialog-description {
		margin: 1rem 0;
		font-size: 18px;
	}

	.score-criteria {
		margin: 1rem 0;
		padding-left: 1.5rem;
	}

	.score-criteria li {
		margin-bottom: 0.5rem;
	}

	.rhyme-categories {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-top: 1rem;
	}

	.rhyme-category {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.points {
		font-size: 16px;
		font-weight: bold;
	}

	.close-btn {
		position: absolute;
		top: 15px;
		right: 15px;
		color: #4f4f4f;
		background-color: transparent;
		border: none;
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		transition: background-color 0.2s ease;
		border-radius: 50%;
		width: 2rem;
		height: 2rem;
	}

	.close-btn:hover {
		background-color: rgba(0, 0, 0, 0.05);
	}
</style>
