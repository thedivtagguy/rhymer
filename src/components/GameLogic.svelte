<script>
	import { onMount, afterUpdate } from 'svelte';
	import PartySocket from 'partysocket';
	import { slide } from 'svelte/transition';
	import { page } from '$app/stores';
	import ShortUniqueId from 'short-unique-id';
	import Keyboard from '../components/Keyboard.svelte';
	import { onlinePlayers } from '$lib/stores';
	import { Confetti } from 'svelte-confetti';
	import ToggleConfetti from './ToggleConfetti.svelte';
	import GuessMarker from '$lib/svg/GuessMarker.svelte';
	import ProgressBar from './ProgressBar.svelte';

	const uid = new ShortUniqueId({ length: 10 });
	let roomId;
	let userId = uid.rnd();

	let partySocket;
	let gameState = null;
	let myTurn = true;
	let isRoomFull = false;
	let gameFinished = false;
	let rankings = [];
	let userHasToWait = false;
	let progress = 0;
	let maxMoves;

	let id;
	let newRhyme = '';
	let placeholderText = 'Enter a rhyme...';
	let categories = {
		okay: {
			fill: '#F6D682',
			stroke: '#D6B336'
		},
		good: {
			fill: '#C8D5BB',
			stroke: '#A0BE83'
		},
		great: {
			fill: '#A14EBF',
			stroke: '#632B78'
		},
		nope: {
			fill: '#3C3744',
			stroke: '#1E1B22'
		}
	};

	$: placeholderText = myTurn ? 'Enter a rhyme...' : 'Wait your turn';
	$: if (gameState) {
		onlinePlayers.set(gameState.session.players);
	}

	onMount(init);

	function init() {
		const isDevMode = process.env.NODE_ENV === 'development';
		const host = isDevMode ? 'localhost:1999' : 'rhymetime.thedivtagguy.partykit.dev';
		roomId = $page.url.searchParams.get('id') || '';
		setupPartySocket(host);
	}

	function setupPartySocket(host) {
		partySocket = new PartySocket({
			host: host,
			room: roomId,
			id: userId
		});
		partySocket.addEventListener('message', handleSocketMessage);
		partySocket.send(JSON.stringify({ type: 'initialize', room: roomId, multi: true }));
	}

	function handleSocketMessage(e) {
		const msg = JSON.parse(e.data);
		switch (msg.type) {
			case 'sync':
				handleSyncMessage(msg);
				break;
			case 'progress':
				maxMoves = msg.maxMoves;
				progress = msg.progress;
				break;
			case 'room_full':
				isRoomFull = msg.connection_id === userId && msg.room_full;
				break;
			case 'wait_for_others_to_join':
				userHasToWait = true;
			case 'played_word':
				alert(`The word "${msg.word}" has already been played!`);
				break;
			case 'game_finished':
				gameFinished = true;
				rankings = msg.rankings;
				break;
		}
	}

	function handleSyncMessage(msg) {
		gameState = msg.gameState;
		myTurn = msg.nextPlayerId === userId;
	}

	function submitRhyme() {
		if (myTurn && newRhyme) {
			partySocket.send(
				JSON.stringify({ type: 'rhyme', rhyme: { word: newRhyme }, room: roomId, user: userId })
			);
			newRhyme = '';
			newItemAdded = true;
		}
	}

	let currentWord = null;
	let currentGuesses = [];
	let confettiContainer;
	let previousWord = '';

	function triggerConfetti() {
		if (typeof confettiContainer === 'object' && confettiContainer.dispatchEvent) {
			confettiContainer.dispatchEvent(new CustomEvent('activate'));
		}
	}

	$: if (gameState && gameState.words.length) {
		currentWord = gameState.words[gameState.words.length - 1].wordToRhyme.word;
		currentGuesses = gameState.words[gameState.words.length - 1].wordToRhyme.guesses;
	}

	$: afterUpdate(() => {
		if (gameState && gameState.words.length) {
			const latestWord = gameState.words[gameState.words.length - 1].wordToRhyme.word;

			if (previousWord !== latestWord) {
				triggerConfetti();
				previousWord = latestWord;
			}

			currentWord = latestWord;
			currentGuesses = gameState.words[gameState.words.length - 1].wordToRhyme.guesses;
		}
	});
</script>

<main>
	{#if gameState}
		{#if isRoomFull}
			<p>Oops, this room is full! You can still watch though</p>
		{:else if userHasToWait}
			<p>Wait for others to join!</p>
		{/if}
		{#if gameFinished}
			<div class="rankings">
				<h3>Game Finished! Here are the rankings:</h3>
				<ul>
					{#each rankings as playerRanking}
						<li>{playerRanking.playerId}: {playerRanking.score}</li>
					{/each}
				</ul>
			</div>
		{/if}
		{#if currentWord}
			<div transition:slide={{ delay: 200, duration: 300 }}>
				<div class="gray-box">
					<ProgressBar currentValue={progress} maxValue={maxMoves} />
					<ToggleConfetti bind:this={confettiContainer}>
						<h2 class="target-word" slot="label">
							{currentWord}
						</h2>
						<Confetti />
					</ToggleConfetti>

					<!-- Display guesses organized by player -->
					<div class="guess-list">
						{#each Array.from(new Set(currentGuesses.map((g) => g.playerId))) as playerId}
							<div class={playerId === userId ? 'my-guesses' : 'other-guesses'}>
								{#each currentGuesses.filter((g) => g.playerId === playerId) as guessedRhyme}
									<div class="guess {guessedRhyme.playerId === userId ? 'my-box' : ''}">
										<span class="word-guess">
											<GuessMarker
												radius={18}
												fill={categories[guessedRhyme.category].fill}
												stroke={categories[guessedRhyme.category].stroke}
												strokeWidth={1}
												{userId}
												playerId={guessedRhyme.playerId}
												{gameFinished}
											/>
										</span>
									</div>
								{/each}
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<div class="input-container">
			<input
				type="text"
				class="line-input"
				bind:value={newRhyme}
				placeholder={placeholderText}
				disabled={!myTurn || gameState.session.players === 0}
				on:keydown={(e) => {
					if (e.key === 'Enter') {
						submitRhyme(newRhyme, myTurn, id, userId);
					} else if (e.key === 'Backspace') {
						newRhyme = newRhyme.slice(0, -1);
					}
				}}
			/>

			<Keyboard
				layout="wordle"
				--height="3.5rem"
				--background="#efefef"
				--color="currentColor"
				--border="none"
				--border-radius="2px"
				--box-shadow="none"
				--flex="1"
				--font-family="Nunito Variable, sans-serif"
				--font-size="20px"
				--font-weight="600"
				--margin="0.125rem"
				--opacity="1"
				--min-width="0.1rem"
				--stroke-width="3px"
				--text-transform="uppercase"
				--active-background="#cdcdcd"
				--active-border="none"
				--active-box-shadow="none"
				--active-color="currentColor"
				--active-opacity="1"
				--active-transform="none"
			/>
		</div>
	{:else}
		<p>Loading...</p>
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		max-width: 700px;
	}

	h2 {
		width: 250px;
		height: 81px;
		text-align: center;
		text-transform: uppercase;
		color: var(--color-bg-0);
		line-height: 1.6;
		font-size: 48px;
		border-radius: 8px;
		background: #242424;
		background: color(display-p3 0.1417 0.1417 0.1417);
		filter: drop-shadow(0px 8px 0px #da7a00) drop-shadow(0px 4px 0px #7e3739);
		filter: drop-shadow(0px 8px 0px color(display-p3 0.8042 0.4959 0.134))
			drop-shadow(0px 4px 0px color(display-p3 0.4583 0.2311 0.2311));
	}

	.input-container {
		max-width: 500px;
		position: absolute;
		bottom: 1%;
	}

	.gray-box {
		display: flex;
		flex-wrap: wrap;
	}

	.guess-list {
		margin-top: 16px;
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 250px;
		height: 100px;
	}

	.my-guesses,
	.other-guesses {
		display: flex;
		flex-direction: row;
		justify-content: start;
		gap: 8px;
	}
</style>
