import { words } from './shared';
async function getMaxPlayersForRoom(roomId, party) {
	const response = await fetch(
		`${party.env.SUPABASE_URL}/rest/v1/rhymer_rooms?select=max_players&room_id=eq.${roomId}`,
		{
			headers: {
				apikey: party.env.SUPABASE_API_KEY,
				'Content-Type': 'application/json'
			}
		}
	);

	if (!response.ok) {
		throw new Error('Failed to fetch max_players for the room.');
	}

	const data = await response.json();

	if (data && data.length > 0) {
		console.log(data[0].max_players);
		return data[0].max_players;
	} else {
		throw new Error('Room not found.');
	}
}

async function fetchValidRhymes(word) {
	console.log(word);
	try {
		const response = await fetch(`https://rhymetimewords.netlify.app/words/debug/${word}.json`);
		if (!response.ok) {
			console.error(`HTTP error! status: ${response.status}`);
			return { words: [], stats: {} };
		}
		const data = await response.json();
		if (!data.words) {
			console.error('No "words" property in the response');
			return { words: [], stats: {} };
		}
		return data;
	} catch (error) {
		console.error('There was a problem with the fetch operation:', error);
		return { words: [], stats: {} };
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
			startedAt: new Date().getTime(),
			currentPlayerId: null,
			timer: null,
			rhymeCounter: 0
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

		if (this.party.multi) {
			gameState.session.timer = setTimeout(this.changeWord, 300000); // 5 minutes
		}

		const fetchRhymePromises = gameState.words.map(async (wordContainer) => {
			if (wordContainer.wordToRhyme) {
				const word = wordContainer.wordToRhyme.word;
				const rhymesData = await fetchValidRhymes(word);
				const { words, stats } = rhymesData;

				if (Array.isArray(words)) {
					wordContainer.wordToRhyme.validRhymes = words.map((rhyme) => {
						return {
							...rhyme,
							category: categorizeRhyme(rhyme, stats)
						};
					});
					wordContainer.wordToRhyme.stats = stats;
				} else {
					console.error(`For word ${word}, fetched rhymes are not an array`);
				}
			}
		});

		await Promise.all(fetchRhymePromises);

		await this.party.storage.put('gameState', gameState);
	}

	async onConnect(connection) {
		const players = await this.party.storage.get('players');
		let gameState = await this.party.storage.get('gameState');
		const roomId = this.party.id; // assuming this is the room_id
		const maxPlayers = await getMaxPlayersForRoom(roomId, this.party);

		// Check if the room has reached its max_players
		if (players.size >= maxPlayers) {
			// Handle the case when the room is full. For example, send a message to the user.
			this.party.broadcast(
				JSON.stringify({
					type: 'room_full',
					room_full: true,
					connection_id: connection.id
				})
			);
			return; // Early return to stop further processing
		}
		// Check if gameState exists
		if (!gameState) {
			console.error('gameState is undefined. Make sure onStart has been called.');
			return;
		}

		players.add(connection.id);
		gameState.session.players = players.size; // assuming gameState has been initialized and has a session object
		gameState.session.room = this.party.id;

		// Check the size of the players set and set the currentPlayerId if it's the first player
		if (players.size === 1) {
			gameState.session.currentPlayerId = connection.id;
		}

		await this.party.storage.put('players', players);
		await this.party.storage.put('gameState', gameState);

		this.party.broadcast(
			JSON.stringify({
				type: 'sync',
				gameState,
				currentPlayerId: connection.id,
				nextPlayerId: gameState.session.currentPlayerId
			})
		);
	}

	async onMessage(message, connection) {
		const msg = JSON.parse(message);
		const players = await this.party.storage.get('players');
		const gameState = await this.party.storage.get('gameState');

		if (msg.type === 'rhyme' && msg.room === this.party.id) {
			const currentWord = gameState.words[gameState.words.length - 1].wordToRhyme;

			// const isValidRhyme = currentWord.validRhymes.some(
			// 	(validRhyme) => validRhyme.word.toLowerCase().trim() === msg.rhyme.word.toLowerCase().trim()
			// );

			const matchingRhymes = currentWord.validRhymes.filter(
				(validRhyme) => validRhyme.word.toLowerCase().trim() === msg.rhyme.word.toLowerCase().trim()
			);
			const isValidRhyme = matchingRhymes.length > 0;
			const newRhyme = {
				...msg.rhyme,
				playerId: connection.id,
				isValid: isValidRhyme,
				category: isValidRhyme ? categorizeRhyme(matchingRhymes[0], currentWord.stats) : 'nope'
			};

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
		console.log(connection.id);

		this.party.broadcast(
			JSON.stringify({ type: 'sync', gameState, currentPlayerId: connection.id })
		);

		if (gameState.session.currentPlayerId === connection.id) {
			gameState.session.currentPlayerId = getNextPlayerId(connection.id, players);
		}
		await this.party.storage.put('gameState', gameState);

		this.party.broadcast(
			JSON.stringify({ type: 'sync', gameState, nextPlayerId: gameState.session.currentPlayerId })
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

		if (gameState.session.currentPlayerId === connection.id) {
			gameState.session.currentPlayerId = getNextPlayerId(connection.id, players);
		}
		await this.party.storage.put('gameState', gameState);

		this.party.broadcast(
			JSON.stringify({
				type: 'sync',
				gameState,
				currentPlayerId: null,
				nextPlayerId: gameState.session.currentPlayerId
			})
		);
	}
}
