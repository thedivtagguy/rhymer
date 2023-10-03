import { words } from './shared';
async function fetchValidRhymes(word) {
	const response = await fetch(`https://rhymetimewords.netlify.app/words/debug/${word}.json`);
	const data = await response.json();
	return data.words.map((item) => item.word);
}

function getDefaultPlayers() {
	return new Set();
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
		room: ''
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
		const msg = JSON.parse(message);
		const players = await this.party.storage.get('players');
		const gameState = await this.party.storage.get('gameState');

		if (msg.type === 'rhyme' && msg.room === this.party.room) {
			if (gameState.validRhymes.includes(msg.rhyme.word)) {
				players.add(connection.id);
				gameState.players = players.size;

				await this.party.storage.put('players', players);
				await this.party.storage.put('gameState', gameState);

				this.party.broadcast(
					JSON.stringify({ type: 'update', rhyme: msg.rhyme, nextPlayerId: connection.id })
				);
			} else {
				connection.send(JSON.stringify({ type: 'error', message: 'Invalid rhyme' }));
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
