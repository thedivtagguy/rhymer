<script>
	import {
		categorizeRhyme,
		getInitialGameState,
		getNewWord,
		calculateRankings,
		hasWordBeenPlayed
	} from '../lib/game/gameLogic';
	import { onMount, onDestroy } from 'svelte';
	import { dailyStore } from '$lib/stores';
	import Toast from './Toast.svelte';
	import Dialog from './Dialog.svelte';
	import ToggleConfetti from './ToggleConfetti.svelte';
	import ProgressBar from './ProgressBar.svelte';
	import Keyboard from './Keyboard.svelte';
	import GuessMarker from '$lib/svg/GuessMarker.svelte';
	import Confetti from 'svelte-confetti';
	import { slide } from 'svelte/transition';

	let timeRemaining = 30;
	let timer;
	let gameState;
	let newRhyme = '';
	let currentWord = null;
	let currentGuesses = [];
	let gameFinished = false;
	let showToast = false;
	let toastMessage = '';
	let inputElement;
	let playerGuessCount;

	function startTimer() {
		timer = setInterval(() => {
			timeRemaining -= 1;
			if (timeRemaining <= 0) {
				clearInterval(timer);
				gameFinished = true;
				const rankings = calculateRankings(gameState);
				$dailyStore += rankings.score;
				initializeGame();
			}
		}, 1000);
	}

	async function initializeGame() {
		try {
			gameState = await getInitialGameState();
			const newWordContainer = await getNewWord('date');
			gameState.words.push(newWordContainer);
			setCurrentWordAndGuesses();
		} catch (error) {
			console.error('Error initializing the game:', error);
		}
	}

	function setCurrentWordAndGuesses() {
		currentWord = gameState.words[gameState.words.length - 1].wordToRhyme;
		currentGuesses = currentWord.guesses;
	}

	function submitRhyme() {
		if (hasWordBeenPlayed(newRhyme, currentGuesses)) {
			showToast = true;
			toastMessage = 'Word has already been played!';
			return;
		}

		const guessedWord = newRhyme.toLowerCase().trim();
		const matchingRhymes = currentWord.validRhymes.filter(
			(validRhyme) => validRhyme.word.toLowerCase().trim() === guessedWord
		);
		const isValidRhyme = matchingRhymes.length > 0;

		if (isValidRhyme) {
			const newGuess = {
				word: guessedWord,
				playerId: 'currentPlayer',
				isValid: true,
				category: categorizeRhyme(matchingRhymes[0], currentWord.stats)
			};
			gameState.words[gameState.words.length - 1].wordToRhyme.guesses.push(newGuess);
			setCurrentWordAndGuesses();
		} else {
			gameState.words[gameState.words.length - 1].wordToRhyme.guesses.push({
				word: guessedWord,
				playerId: 'currentPlayer',
				isValid: false,
				category: 'nope'
			});
			setCurrentWordAndGuesses();
		}

		newRhyme = '';
	}

	onMount(() => {
		initializeGame();
		startTimer();
	});

	onDestroy(() => {
		clearInterval(timer);
	});
</script>

<main>
	{#if showToast}
		<Toast message={toastMessage} duration={3000} />
	{/if}

	{#if gameFinished}
		<Dialog isOpen={gameFinished}>
			<!-- For fields slot -->
			<div slot="title">
				<h2>Hilloo</h2>
			</div>
		</Dialog>
	{/if}

	{#if currentWord}
		<div transition:slide={{ delay: 200, duration: 300 }}>
			<div class="gray-box">
				<ProgressBar currentValue={timeRemaining} maxValue={30} />
				<ToggleConfetti>
					<h2 class="target-word" slot="label">
						{currentWord.word}
					</h2>
					<Confetti />
				</ToggleConfetti>

				<!-- Display guesses organized by player -->
				<div class="guess-list">
					<div class="my-guesses">
						{#each currentWord.guesses as guessedRhyme}
							<div class="guess my-box">
								<span class="word-guess">
									<GuessMarker
										category={guessedRhyme.category}
										radius={18}
										{gameFinished}
										singleplayer={true}
									/>
								</span>
							</div>
						{/each}
					</div>
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
				placeholder="Enter your rhyme"
				disabled={playerGuessCount}
				on:keydown={(e) => {
					if (e.key === 'Enter') {
						submitRhyme();
					}
				}}
			/>

			<div class="line" />
		</div>

		<Keyboard
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
			--text-transform="uppercase"
			--active-background="#cdcdcd"
			--active-border="none"
			--active-box-shadow="none"
			--active-color="currentColor"
			--active-opacity="1"
			--active-transform="none"
		/>
	</div>
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
