<script>
	// @ts-nocheck
	import { onMount, afterUpdate } from 'svelte';
	import PartySocket from 'partysocket';
	import Keyboard from './Keyboard.svelte';
	import { slide } from 'svelte/transition';
	import { page } from '$app/stores';
	import ShortUniqueId from 'short-unique-id';
	import { onlinePlayers, numberOfPlayers } from '$lib/stores';
	let roomId;
	const uid = new ShortUniqueId({ length: 10 });
	let userId = uid.rnd();
	let id = roomId;
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
			partySocket.send(
				JSON.stringify({ type: 'rhyme', rhyme: newGuess, room: roomId, user: userId })
			);
			newRhyme = ''; // Clear the global variable
			newItemAdded = true;
		}
	}

	let players;
	let currentWord;
	let guessedRhymes;
	let maxPlayers = $numberOfPlayers;
	let roomIsFull = false;

	$: if (gameState) {
		players = gameState.session.players;
		onlinePlayers.set(players);
		currentWord = gameState.words[gameState.words.length - 1].wordToRhyme.word;
		guessedRhymes = gameState.words[gameState.words.length - 1].wordToRhyme.guesses;
	}
	onMount(() => {
		roomId = $page.url.searchParams.get('id') || '';
		const isDevMode = process.env.NODE_ENV === 'development';
		const host = isDevMode ? 'localhost:1999' : 'rhymetime.thedivtagguy.partykit.dev';
		partySocket = new PartySocket({
			host: host,
			room: roomId,
			id: userId
		});

		partySocket.addEventListener('message', (e) => {
			const msg = JSON.parse(e.data);
			if (msg.type === 'sync') {
				gameState = msg.gameState;
				if (players >= maxPlayers) {
					roomIsFull = true;
				}

				gameState.session.room = roomId;
				currentUserId = msg.currentPlayerId;
				nextPlayerId = msg.nextPlayerId;
				myTurn = msg.nextPlayerId === userId;
			}
		});

		partySocket.send(JSON.stringify({ type: 'initialize', room: roomId, multi: true }));
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
		{#if roomIsFull}
			<div class="full-room-alert">
				This room is full! Please try another room or wait for a spot to open up.
			</div>
		{/if}

		<div class="room-info">
			<p class="players">Players: <span class="player-no">{players}</span></p>
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
