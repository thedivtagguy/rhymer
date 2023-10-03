<script>
	// @ts-nocheck
	import { onMount, afterUpdate } from 'svelte';
	import PartySocket from 'partysocket';
	import Keyboard from './Keyboard.svelte';
	import { slide } from 'svelte/transition';
	import ShortUniqueId from 'short-unique-id';
	const uid = new ShortUniqueId({ length: 10 });
	let userId = uid.rnd();
	export let id = 'hello';
	let gameState = null;
	let newRhyme = '';
	let partySocket;
	let myTurn = true;
	let pressedKeys = [];
	let currentUserId;
	let nextPlayerId;
	let newItemAdded = false;
	let guessedRhymesLength = 0;
	let placeholderText = 'Enter a rhyme...';
	$: if (gameState) {
		placeholderText = myTurn ? 'Enter a rhyme...' : 'Wait your turn';
	}

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

	function submitRhyme(newRhymeValue, myTurn, id, userId) {
		if (!myTurn) return;
		if (newRhymeValue && (myTurn || gameState.session.players === 0)) {
			const newGuess = { word: newRhymeValue };
			partySocket.send(JSON.stringify({ type: 'rhyme', rhyme: newGuess, room: id, user: userId }));
			newRhyme = ''; // Clear the global variable
			newItemAdded = true;
		}
	}

	let players;
	let currentWord;
	let guessedRhymes;

	$: if (gameState) {
		players = gameState.session.players;
		currentWord = gameState.words[gameState.words.length - 1].wordToRhyme.word;
		guessedRhymes = gameState.words[gameState.words.length - 1].wordToRhyme.guesses;
	}
	onMount(() => {
		const isDevMode = process.env.NODE_ENV === 'development';
		const host = isDevMode ? 'localhost:1999' : 'rhymetime.thedivtagguy.partykit.dev';
		partySocket = new PartySocket({
			host: host,
			room: id,
			id: userId
		});

		partySocket.addEventListener('message', (e) => {
			const msg = JSON.parse(e.data);
			if (msg.type === 'sync') {
				gameState = msg.gameState;
				gameState.session.room = id;
				currentUserId = msg.currentPlayerId;
				nextPlayerId = msg.nextPlayerId;
				myTurn = msg.nextPlayerId === userId;
			}
		});

		partySocket.send(JSON.stringify({ type: 'initialize', room: id, multi: true }));
	});

	const onKeydown = (event) => {
		const key = event.detail;

		if (key === 'Enter') {
			submitRhyme(newRhyme, myTurn, id);
			pressedKeys = [];
		} else if (key === 'Backspace') {
			newRhyme = newRhyme.slice(0, -1);
			pressedKeys.pop();
		} else if (key.length === 1) {
			newRhyme += key;
			pressedKeys.push(key);
		}
	};

	let timelineElement;
	const scrollToBottom = async (node) => {
		node.scroll({ top: node.scrollHeight + 300, behavior: 'smooth' });
	};
	afterUpdate(() => {
		if (gameState && timelineElement && newItemAdded) {
			scrollToBottom(timelineElement);
			newItemAdded = false; // Reset the variable after scrolling
		}
	});
</script>

<main>
	{#if gameState}
		<div class="room-info">
			<p class="players">Players: <span class="player-no">{players}</span></p>
			<p class="room"><span class="room-name">{gameState.session.room}</span></p>
		</div>

		<div class="timeline" bind:this={timelineElement}>
			{#each gameState.words as wordData}
				<h2 class="target-word">{wordData.wordToRhyme.word}</h2>
				<div class="timeline-guesses">
					{#each wordData.wordToRhyme.guesses as guessedRhyme}
						<li
							class="timeline-guess-box"
							class:my-box={guessedRhyme.playerId === userId}
							in:slide={{ y: -20, duration: 500 }}
						>
							<span class="word-guess">
								<svg height="20" width="20">
									<circle
										cx="10"
										cy="10"
										r="8"
										fill={categories[guessedRhyme.category].fill}
										stroke={categories[guessedRhyme.category].stroke}
										stroke-width="1"
									/>
								</svg>
							</span>
							{guessedRhyme.word}
						</li>
					{/each}
				</div>
			{/each}
		</div>

		<div class="input-container">
			<input
				readonly
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
				on:keydown={onKeydown}
				highlightKeys={pressedKeys}
				layout="wordle"
				--height="3.5rem"
				--background="#efefef"
				--color="currentColor"
				--border="none"
				--border-radius="4px"
				--box-shadow="none"
				--flex="1"
				--font-family="Nunito Variable, sans-serif"
				--font-size="20px"
				--font-weight="400"
				--margin="0.125rem"
				--opacity="1"
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
		overflow-x: hidden;
	}
	.target-word {
		text-align: center;
		text-transform: uppercase;
		position: sticky;
		top: 0;
		z-index: 2;
		width: 100%;
		background-color: var(--color-bg-0);
	}

	.word-guess > svg {
		display: inline-block;
		vertical-align: middle;
		width: fit-content;
		margin-top: -4px;
	}
	.timeline {
		position: relative;
		height: 60vh;
		overflow-y: scroll;
	}

	.timeline-guess-box {
		position: relative;
		border: 1px solid #d2d2d2;
		background-color: #f5f5f5;
		color: #272727;
		border-radius: 8px;
		padding: 10px 20px;
		margin: 16px auto;
		min-width: 120px;
		width: fit-content;
		font-weight: 800;
		font-size: 20px;
		text-align: center;
		text-transform: uppercase;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		gap: 12px;
	}

	.timeline-guess-box.my-box {
		border: 1px solid #d2d2d2;
		background-color: #595959;
		color: #eeeeee;
	}

	.timeline-guess-box:before {
		content: '';
		position: absolute;
		left: 50%;
		top: -50%;
		bottom: 0;
		border-left: 2px #8a8a8a dashed;
		z-index: -1;
	}

	.input-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		max-width: 400px;
		width: 100%;
		gap: 10px;
		left: 50%;
		bottom: 2%;
		transform: translate(-50%, 0);
		position: absolute;
		padding: 8px 24px !important;
		z-index: 5;
	}

	.line-input {
		background: var(--color-bg-0);
		border: none;
		border-bottom: 2px solid #ccc;
		max-width: 400px;
		width: 100%;
		padding: 0px;
		outline: none;
	}

	/* .line-input:focus {
		border-bottom: 2px solid #000;
	} */

	input {
		color: #272727;
		font-size: larger;
		text-transform: uppercase;
		font-weight: 800;
		text-align: center;
	}

	li {
		list-style: none;
	}

	.room-info {
		display: flex;
		gap: 12px;
		justify-content: space-between;
		align-items: center;
		font-size: 12px;
		z-index: 5;
		background-color: var(--color-bg-0);
		height: 30px;
	}

	.players {
		background-color: #8a8a8a;
		color: #efefef;
		padding: 2px 6px;
		border-radius: 4px;
		font-weight: 700;
	}

	.room {
		text-transform: uppercase;
		font-weight: 600;
	}
</style>
