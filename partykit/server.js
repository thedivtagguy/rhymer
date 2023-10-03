import { words } from './shared';

async function fetchValidRhymes(word) {
	try {
		const response = await fetch(`https://rhymetimewords.netlify.app/words/debug/${word}.json`);
		if (!response.ok) {
			console.error(`HTTP error! status: ${response.status}`);
			return [];
		}
		const data = await response.json();
		if (!data.words) {
			console.error('No "words" property in the response');
			return [];
		}
		return data.words.map((item) => item.word);
	} catch (error) {
		console.error('There was a problem with the fetch operation:', error);
		return [];
	}
}

function getDefaultPlayers() {
	return new Set();
}

function categorizeRhyme(rhyme, stats) {
	const { rhyme_score } = rhyme;
	const { mean, cuts } = stats;
	if (rhyme_score > cuts['50th'] && rhyme_score <= cuts['75th']) {
		return 'good';
	} else if (rhyme_score > cuts['75th']) {
		return 'great';
	} else if (rhyme_score < mean) {
		return 'okay';
	} else {
		return 'nope';
	}
}

function getNextPlayerId(currentPlayerId, playersSet) {
	const playersArray = Array.from(playersSet);
	const currentPlayerIndex = playersArray.indexOf(currentPlayerId);

	if (currentPlayerIndex !== -1 && currentPlayerIndex < playersArray.length - 1) {
		return playersArray[currentPlayerIndex + 1];
	}
	return playersArray[0];
}

function getNewWord() {
	const today = new Date();
	const seed = today.getDate() + (today.getMonth() + 1) * 100 + today.getFullYear() * 10000;
	const index = seed % words.length;
	const word = words[index];

	return {
		wordToRhyme: {
			word: word,
			validRhymes: [],
			guesses: []
		}
	};
}

function getInitialGameState() {
	return {
		words: [getNewWord()],
		session: {
			players: 0,
			room: '',
			startedAt: new Date().getTime()
		}
	};
}

export default class RhymeSession {
	constructor(party) {
		this.party = party;
	}

	async onStart() {
		await this.party.storage.put('players', getDefaultPlayers());
		const gameState = getInitialGameState();
		gameState.session.room = this.party.id;

		const rhymesData = await fetchValidRhymes(gameState.words[0].wordToRhyme.word);
		const { words, stats } = rhymesData;

		if (Array.isArray(gameState.words) && Array.isArray(words)) {
			gameState.words.forEach((wordContainer) => {
				if (wordContainer.wordToRhyme) {
					wordContainer.wordToRhyme.validRhymes = words.map((rhyme) => {
						return {
							...rhyme,
							category: categorizeRhyme(rhyme, stats)
						};
					});
				}
			});
		} else {
			console.error('Either gameState.words or words is not an array');
			console.log(gameState);
		}

		await this.party.storage.put('gameState', gameState);
	}

	async onConnect(connection) {
		const players = await this.party.storage.get('players');
		let gameState = await this.party.storage.get('gameState');

		// Check if gameState exists
		if (!gameState) {
			console.error('gameState is undefined. Make sure onStart has been called.');
			return;
		}

		players.add(connection.id);
		gameState.session.players = players.size; // assuming gameState has been initialized and has a session object
		gameState.session.room = this.party.id;

		await this.party.storage.put('players', players);
		await this.party.storage.put('gameState', gameState);
		this.party.broadcast(
			JSON.stringify({ type: 'setConnectionID', currentPlayerId: connection.id })
		);
		this.party.broadcast(
			JSON.stringify({ type: 'sync', gameState, currentPlayerId: connection.id })
		);
	}

	async onMessage(message, connection) {
		const msg = JSON.parse(message);
		const players = await this.party.storage.get('players');
		const gameState = await this.party.storage.get('gameState');

		if (msg.type === 'rhyme' && msg.room === this.party.id) {
			const currentWord = gameState.words[gameState.words.length - 1].wordToRhyme;
			const isValidRhyme = currentWord.validRhymes.some(
				(validRhyme) => validRhyme.word.toLowerCase() === msg.rhyme.word.toLowerCase()
			);

			console.log(isValidRhyme);

			const newRhyme = {
				...msg.rhyme,
				playerId: connection.id,
				isValid: isValidRhyme,
				category: isValidRhyme ? categorizeRhyme(msg.rhyme, currentWord.stats) : 'nope'
			};
			currentWord.guesses.push(newRhyme);
			console.log(msg.rhyme);
			players.add(connection.id);
			gameState.session.players = players.size;

			await this.party.storage.put('gameState', gameState);
			await this.party.storage.put('players', players);

			this.party.broadcast(
				JSON.stringify({
					type: 'sync',
					gameState,
					nextPlayerId: getNextPlayerId(connection.id, players)
				})
			);
		}
		console.log(connection.id);

		this.party.broadcast(
			JSON.stringify({ type: 'sync', gameState, currentPlayerId: connection.id })
		);
	}

	async onClose(connection) {
		const players = await this.party.storage.get('players');
		players.delete(connection.id);
		const gameState = await this.party.storage.get('gameState');
		gameState.session.players = players.size;

		// Check if this was the last player in the room
		if (players.size === 0) {
			// Reset the game state and players
			const initialGameState = getInitialGameState();
			initialGameState.session.room = this.party.id;
			await this.party.storage.put('gameState', initialGameState);
			await this.party.storage.put('players', getDefaultPlayers());
		} else {
			gameState.session.players = players.size;
			await this.party.storage.put('gameState', gameState);
			await this.party.storage.put('players', players);
		}
		this.party.broadcast(JSON.stringify({ type: 'player_left', playerId: connection.id }));
		this.party.broadcast(JSON.stringify({ type: 'sync', gameState, currentPlayerId: null }));
	}
}
