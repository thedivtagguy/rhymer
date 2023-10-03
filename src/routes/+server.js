import { words } from './shared';

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
		console.log('onStart called');
		await this.party.storage.put('players', getDefaultPlayers());
		const gameState = getNewWord();
		gameState.room = this.party.room; // Include room information in gameState

		await fetch(`https://rhymetimewords.netlify.app/words/debug/${gameState.word}.json`)
			.then((res) => res.json())
			.then((data) => {
				gameState.validRhymes = data.words.map((item) => item.word);
			});

		await this.party.storage.put('gameState', gameState);
	}

	async onConnect(connection) {
		const players = await this.party.storage.get('players');
		players.add(connection.id); // Add new player to the set
		const gameState = await this.party.storage.get('gameState');
		gameState.players = players.size; // Update the player count
		gameState.room = this.party.room; // Include room information in gameState

		await this.party.storage.put('players', players); // Save updated players set
		await this.party.storage.put('gameState', gameState); // Save updated gameState

		connection.send(JSON.stringify({ type: 'sync', gameState }));
		connection.send(JSON.stringify({ type: 'welcome', message: 'Welcome to Rhyme Time!' }));
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
}
