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

	// Check if the current player was found and if they are not the last in the array
	if (currentPlayerIndex !== -1 && currentPlayerIndex < playersArray.length - 1) {
		return playersArray[currentPlayerIndex + 1];
	}

	// If the current player is the last in the array or wasn't found, return the first player
	return playersArray[0];
}

function getNewWord() {
	const today = new Date();
	const seed = today.getDate() + (today.getMonth() + 1) * 100 + today.getFullYear() * 10000;
	const index = seed % words.length;
	const word = words[index];

	return {
		word: word,
		validRhymes: [],
		players: 0,
		startedAt: new Date().getTime(),
		room: '',
		guessedRhymes: []
	};
}

export default class RhymeSession {
	constructor(party) {
		this.party = party;
	}

	async onStart() {
		await this.party.storage.put('players', getDefaultPlayers());
		const gameState = getNewWord();
		gameState.room = this.party.room;
		gameState.validRhymes = await fetchValidRhymes(gameState.word);
		await this.party.storage.put('gameState', gameState);
	}

	async onConnect(connection) {
		const players = await this.party.storage.get('players');
		players.add(connection.id);
		const gameState = await this.party.storage.get('gameState');
		gameState.players = players.size;
		gameState.room = this.party.room;

		await this.party.storage.put('players', players);
		await this.party.storage.put('gameState', gameState);

		connection.send(JSON.stringify({ type: 'sync', gameState }));
		this.party.broadcast(JSON.stringify({ type: 'sync', gameState }));
	}

	async onMessage(message, connection) {
		console.log('Server: Received message:', message, 'from connection ID:', connection.id);

		const msg = JSON.parse(message);
		const players = await this.party.storage.get('players');
		const gameState = await this.party.storage.get('gameState');

		console.log('Server: Fetched gameState from storage:', gameState);

		if (msg.type === 'rhyme' && msg.room === this.party.room) {
			console.log('Server: Handling rhyme type message');

			if (gameState.validRhymes.includes(msg.rhyme.word)) {
				gameState.guessedRhymes.push(msg.rhyme);

				// Explicitly clone the array to ensure a new reference
				const newGuessedRhymes = [...gameState.guessedRhymes];

				// Add new player and update player count
				players.add(connection.id);
				gameState.players = players.size;

				// Create updated game state
				const updatedGameState = {
					...gameState,
					guessedRhymes: newGuessedRhymes,
					players: gameState.players
				};

				console.log('Server: Updated gameState:', updatedGameState);

				// Update stored game state
				await this.party.storage.put('gameState', updatedGameState);
				await this.party.storage.put('players', players);

				// Broadcast updated game state
				this.party.broadcast(
					JSON.stringify({
						type: 'update',
						gameState: updatedGameState,
						nextPlayerId: getNextPlayerId(connection.id, players)
					})
				);

				console.log('Server: Broadcasted updated gameState');
			} else {
				connection.send(JSON.stringify({ type: 'error', message: 'Invalid rhyme' }));
				console.log('Server: Invalid rhyme. Sent error to client.');
			}
		}
	}

	async onClose(connection) {
		const players = await this.party.storage.get('players');
		players.delete(connection.id);
		const gameState = await this.party.storage.get('gameState');
		gameState.players = players.size;

		await this.party.storage.put('players', players);
		await this.party.storage.put('gameState', gameState);

		this.party.broadcast(JSON.stringify({ type: 'player_left', playerId: connection.id }));
		this.party.broadcast(JSON.stringify({ type: 'sync', gameState }));
	}
}
