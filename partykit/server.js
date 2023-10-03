import { words } from './shared';

async function fetchValidRhymes(word) {
	const response = await fetch(`https://rhymetimewords.netlify.app/words/debug/${word}.json`);
	const data = await response.json();
	return data.words.map((item) => item.word);
}

function getDefaultPlayers() {
	return new Set();
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
		gameState.words[0].wordToRhyme.validRhymes = await fetchValidRhymes(
			gameState.words[0].wordToRhyme.word
		);
		await this.party.storage.put('gameState', gameState);
	}

	async onConnect(connection) {
		const players = await this.party.storage.get('players');
		console.log(players);
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

		this.party.broadcast(JSON.stringify({ type: 'sync', gameState }));
	}

	async onMessage(message, connection) {
		const msg = JSON.parse(message);
		const players = await this.party.storage.get('players');
		const gameState = await this.party.storage.get('gameState');

		if (msg.type === 'rhyme' && msg.room === this.party.id) {
			const currentWord = gameState.words[gameState.words.length - 1].wordToRhyme;
			const isValidRhyme = currentWord.validRhymes.includes(msg.rhyme.word);

			const newRhyme = { ...msg.rhyme, isValid: isValidRhyme };
			currentWord.guesses.push(newRhyme);

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
	}

	async onClose(connection) {
		const players = await this.party.storage.get('players');
		players.delete(connection.id);
		const gameState = await this.party.storage.get('gameState');
		gameState.session.players = players.size;

		await this.party.storage.put('players', players);
		await this.party.storage.put('gameState', gameState);

		this.party.broadcast(JSON.stringify({ type: 'player_left', playerId: connection.id }));
		this.party.broadcast(JSON.stringify({ type: 'sync', gameState }));
	}
}
