import { RHYME_ROOM_ID } from './shared';

function getDefaultPlayers() {
	return new Set();
}

function getNewWord() {
	const word = 'fairy';
	return {
		word: word,
		validRhymes: [],
		players: 0,
		startedAt: new Date().getTime()
	};
}

export default class RhymeSession {
	constructor(party) {
		this.party = party;
	}

	async onStart() {
		if (this.party.id === RHYME_ROOM_ID) {
			console.log('onStart called');
			await this.party.storage.put('players', getDefaultPlayers());
			const gameState = getNewWord();

			await fetch(`https://rhymetimewords.netlify.app/words/debug/${gameState.word}.json`)
				.then((res) => res.json())
				.then((data) => {
					gameState.validRhymes = data.words.map((item) => item.word);
				});

			await this.party.storage.put('gameState', gameState);
		}
	}

	async onConnect(connection) {
		if (this.party.id === RHYME_ROOM_ID) {
			const gameState = await this.party.storage.get('gameState');
			console.log('Server gameState:', gameState); // Debugging line
			connection.send(JSON.stringify({ type: 'sync', gameState }));
			connection.send(JSON.stringify({ type: 'welcome', message: 'Welcome to Rhyme Time!' }));
		}
	}

	async onMessage(message, connection) {
		if (this.party.id === RHYME_ROOM_ID) {
			const msg = JSON.parse(message);
			const players = await this.party.storage.get('players');
			const gameState = await this.party.storage.get('gameState');

			if (msg.type === 'rhyme') {
				if (gameState.validRhymes.includes(msg.rhyme.word)) {
					players.add(connection.id);
					gameState.players = players.size;
					await this.party.storage.put('players', players);
					await this.party.storage.put('gameState', gameState);

					this.party.broadcast(JSON.stringify({ type: 'update', rhyme: msg.rhyme }));
				} else {
					connection.send(JSON.stringify({ type: 'error', message: 'Invalid rhyme' }));
				}
			}
		}
	}
}
