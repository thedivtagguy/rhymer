<script>
	import './styles.css';
	import QuestionMark from '../lib/svg/QuestionMark.svelte';
	import { onlinePlayers } from '$lib/stores';
	import PeoplePresence from '$lib/svg/PeoplePresence.svelte';
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
		<QuestionMark />
	</header>
	<main>
		<slot />
	</main>
</div>

<style>
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 2rem;
		color: var(--black);
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
</style>
