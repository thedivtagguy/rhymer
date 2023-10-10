<script>
	import { onMount } from 'svelte';
	import { playerNameStore, onlinePlayers } from '$lib/stores';
	import PartySocket from 'partysocket';
	import { slide } from 'svelte/transition';
	import { page } from '$app/stores';
	import ShortUniqueId from 'short-unique-id';
	import Keyboard from './Keyboard.svelte';
	import { Confetti } from 'svelte-confetti';
	import ToggleConfetti from './ToggleConfetti.svelte';
	import GuessMarker from '$lib/svg/GuessMarker.svelte';
	import ProgressBar from './ProgressBar.svelte';
	import Dialog from './Dialog.svelte';
	import Toast from './Toast.svelte';

	const uid = new ShortUniqueId({ length: 10 });
	let userId = `${uid.rnd()}-${$playerNameStore}`;
	let roomId = $page.url.searchParams.get('id') || '';
	let partySocket;

	let gameState = null;
	let revealGuesses = false,
		myTurn = true,
		isRoomFull = false,
		gameFinished = false,
		userHasToWait = false;
	let progress = 0,
		maxMoves = 5,
		playerGuessCount,
		newRhyme = '',
		toastMessage = '',
		showToast = false;
	let rankings = [],
		activeKeys = [];
	let currentWord = null,
		currentGuesses = [];
	let placeholderText, inputElement;

	onMount(() => {
		init();
		window.addEventListener('keydown', handleActualKeyPress);
		window.addEventListener('keyup', handleActualKeyPress);
	});

	function init() {
		const isDevMode = process.env.NODE_ENV === 'development';
		const host = isDevMode ? 'localhost:1999' : 'rhymetime.thedivtagguy.partykit.dev';
		setupPartySocket(host);
		if (inputElement) inputElement.focus();
	}

	function setupPartySocket(host) {
		partySocket = new PartySocket({ host, room: roomId, id: userId });
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
				break;
			case 'played_word':
				if (msg.user === userId) {
					toastMessage = `The word "${msg.word}" has already been played!`;
					showToast = true;
				}
				break;
			case 'game_finished':
				gameFinished = true;
				rankings = msg.rankings;
				break;
			case 'reveal_guesses':
				revealGuesses = true;
				setTimeout(() => {
					proceedToNextRound();
				}, 5000);
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
		}
	}

	function extractPlayerNameFromUserId(uid) {
		return uid.split('-').pop();
	}

	function handleVirtualKeyPress(event) {
		const { detail } = event;
		if (detail === 'Backspace') newRhyme = newRhyme.slice(0, -1);
		else if (detail === 'Space') newRhyme += ' ';
		else if (detail === 'Enter') submitRhyme();
		else newRhyme += detail;
	}

	function handleActualKeyPress(event) {
		const key = event.key.toLowerCase();
		if (key.length === 1 || ['backspace', 'enter', 'shift'].includes(key)) {
			activeKeys =
				event.type === 'keydown' && !activeKeys.includes(key)
					? [...activeKeys, key]
					: activeKeys.filter((k) => k !== key);
		}
	}

	function proceedToNextRound() {
		partySocket.send(JSON.stringify({ type: 'next_round', room: roomId, user: userId }));
		revealGuesses = false;
	}

	$: placeholderText = myTurn ? 'Enter a rhyme...' : 'Wait your turn';
	$: if (gameState) {
		onlinePlayers.set(gameState.session.players);
		playerGuessCount = currentGuesses?.filter((guess) => guess.playerId === userId).length || 0;
	}
	$: if (gameState && gameState.words.length) {
		const latestWord = gameState.words[gameState.words.length - 1].wordToRhyme;
		currentWord = latestWord.word;
		currentGuesses = latestWord.guesses;
	}
	$: if (inputElement || (inputElement && myTurn)) inputElement.focus();
	$: if (showToast) setTimeout(() => (showToast = false), 3000);
</script>

<main>
	{#if gameState}
		{#if showToast}
			<Toast message={toastMessage} duration={3000} />
		{/if}

		{#if isRoomFull}
			<p>Oops, this room is full! You can still watch though</p>
		{:else if userHasToWait}
			<p>Wait for others to join!</p>
		{:else if gameFinished}
			<Dialog isOpen={gameFinished}>
				<!-- For fields slot -->
				<div slot="fields">
					<ul class="leaderboard">
						{#each rankings as playerRanking, index}
							<li class="leaderboard-item">
								<!-- {#if index === 0}<img src="gold-medal-icon.svg" class="medal" alt="Gold Medal" />{/if}
						{#if index === 1}<img src="silver-medal-icon.svg" class="medal" alt="Silver Medal" />{/if}
						{#if index === 2}<img src="bronze-medal-icon.svg" class="medal" alt="Bronze Medal" />{/if} -->
								<span class="rank">{index + 1}</span>
								<span class="player-name"
									>{extractPlayerNameFromUserId(playerRanking.playerId)}</span
								>
								<span class="score">{playerRanking.score} points</span>
							</li>
						{/each}
					</ul>
				</div>
			</Dialog>
		{/if}

		{#if currentWord}
			<div transition:slide={{ delay: 200, duration: 300 }}>
				<div class="gray-box">
					<ProgressBar currentValue={progress} maxValue={maxMoves} />
					<ToggleConfetti>
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
												category={guessedRhyme.category}
												radius={18}
												{userId}
												playerId={guessedRhyme.playerId}
												{gameFinished}
												{revealGuesses}
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
			<div class="field">
				<input
					bind:this={inputElement}
					type="text"
					class="line-input"
					bind:value={newRhyme}
					placeholder={placeholderText}
					disabled={!myTurn || gameState.session.players === 0 || playerGuessCount >= maxMoves}
					on:keydown={(e) => {
						if (e.key === 'Enter') {
							submitRhyme(partySocket, newRhyme, myTurn, userId);
						}
					}}
				/>

				<div class="line" />
			</div>

			<Keyboard
				on:keydown={handleVirtualKeyPress}
				keyClass={activeKeys.reduce((acc, key) => ({ ...acc, [key]: 'active' }), {})}
				layout="wordle"
				--height="3.7rem"
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
				below
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

	h2.target-word {
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
		width: 80%;
		max-width: 600px;
		position: absolute;
		bottom: 3%;
		display: flex;
		flex-direction: column;
		gap: 20px;
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
		max-width: 280px;
		height: 100px;
	}

	.my-guesses,
	.other-guesses {
		display: flex;
		flex-direction: row;
		justify-content: start;
		gap: 16px;
		width: 100%;
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

	.leaderboard {
		width: 100%;
		padding: 0;
		list-style-type: none;
		background: #f4f4f4;
		border-bottom: 1px solid #e1e1e1;
		border-radius: 5px;
	}

	.leaderboard-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 15px;
		border-bottom: 1px solid #e1e1e1;
		background-color: #fff;
	}

	.leaderboard-item:last-child {
		border-bottom: none;
	}

	.rank {
		font-weight: bold;
		color: #333;
		font-size: 1.2em;
	}

	.player-name {
		flex: 1;
		padding: 0 10px;
		font-weight: 600;
		text-transform: capitalize;
		color: #555;
	}

	.score {
		font-weight: bold;
		color: white;
		background-color: var(--orange);
		padding: 2px 4px;
		border-radius: 4px;
		font-size: 1.1em;
	}
</style>
