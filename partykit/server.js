import {
	getDefaultPlayers,
	categorizeRhyme,
	getNextPlayerId,
	getInitialGameState,
	isGameFinished,
	isRoundFinished,
	getNewWord,
	calculateRankings,
	hasWordBeenPlayed
} from './gameLogic.js';

import { getMaxPlayersForRoom, cleanUpState } from './apiUtils.js';
const maxMoves = 5;

export default class RhymeSession {
	constructor(party) {
		this.party = party;
		this.progress = 0;
	}

	async _getFromStorage(key) {
		return this.party.storage.get(key);
	}

	async _putToStorage(key, value) {
		return this.party.storage.put(key, value);
	}

	_broadcast(messageObj) {
		this.party.broadcast(JSON.stringify(messageObj));
	}

	_switchToNextPlayer(players, gameState) {
		gameState.session.currentPlayerId = getNextPlayerId(players, gameState.session.currentPlayerId);
	}

	async _updateSessionData(players, gameState) {
		return Promise.all([
			this._putToStorage('players', players),
			this._putToStorage('gameState', gameState)
		]);
	}

	async _fetchAndSetSessionData() {
		const [players, gameState] = await Promise.all([
			this._getFromStorage('players'),
			this._getFromStorage('gameState')
		]);
		return { players, gameState };
	}

	async onStart() {
		const gameState = await getInitialGameState();
		gameState.session.room = this.party.id;
		this.progress = 0;
		await this._updateSessionData(getDefaultPlayers(), gameState);
	}

	async onConnect(connection) {
		const [players, gameState] = await Promise.all([
			this._getFromStorage('players'),
			this._getFromStorage('gameState')
		]);
		const maxPlayers = await getMaxPlayersForRoom(this.party.id, this.party);

		if (players.length >= maxPlayers) {
			this._broadcast({ type: 'room_full', room_full: true, connection_id: connection.id });
			return;
		}

		if (!players.includes(connection.id)) {
			players.push(connection.id);
		}

		gameState.session.players = players.length;
		gameState.session.currentPlayerId = getNextPlayerId(players, gameState.session.currentPlayerId);
		gameState.session.room = this.party.id;

		if (players.length === 1 && !gameState.session.currentPlayerId) {
			gameState.session.currentPlayerId = connection.id;
		} else {
			this._switchToNextPlayer(players, gameState);
		}

		await Promise.all([
			this._putToStorage('players', players),
			this._putToStorage('gameState', gameState)
		]);

		this._broadcast({
			type: 'sync',
			gameState,
			currentPlayerId: connection.id,
			nextPlayerId: gameState.session.currentPlayerId
		});
	}

	_broadcastSync(currentPlayerId, gameState) {
		this._broadcast({
			type: 'sync',
			gameState,
			currentPlayerId,
			nextPlayerId: gameState.session.currentPlayerId
		});
	}

	async onMessage(message, connection) {
		const { players, gameState } = await this._fetchAndSetSessionData();
		const msg = JSON.parse(message);

		if (msg.type === 'rhyme' && msg.room === this.party.id && msg.rhyme.word) {
			const wordAlreadyPlayed = this._handleRhymeMessage(msg, connection, players, gameState);

			if (wordAlreadyPlayed) {
				return;
			}
		}

		if (isRoundFinished(gameState, maxMoves)) {
			// First, broadcast a message to reveal all guess markers.
			this._broadcast({ type: 'progress', maxMoves: maxMoves, progress: this.progress });
			this._broadcastSync(connection.id, gameState);
			this._broadcast({ type: 'reveal_guesses' });

			// After a delay (e.g., 5 seconds), either move to the next round or finish the game.
			setTimeout(async () => {
				if (isGameFinished(gameState)) {
					const rankings = calculateRankings(gameState);
					const gameStateWithoutRhymes = cleanUpState({ ...gameState });
					this.progress++;
					this._broadcast({ type: 'progress', maxMoves: maxMoves, progress: this.progress });
					this._broadcast({ type: 'game_finished', rankings: rankings });
					await this._updateSessionData(players, gameStateWithoutRhymes);
					return;
				}

				const newWordContainer = await getNewWord('random').catch((error) => {
					console.error('Error fetching new word:', error);
				});

				if (newWordContainer) {
					gameState.words.push(newWordContainer);
				}

				this.progress++; // Increment the progress
				this._broadcast({ type: 'progress', maxMoves: maxMoves, progress: this.progress });

				await this._updateSessionData(players, gameState);
				this._broadcastSync(connection.id, gameState);
			}, 5000); // 5 seconds delay for the reveal.

			return;
		}

		this._switchToNextPlayer(players, gameState);
		await this._updateSessionData(players, gameState);
		this._broadcastSync(connection.id, gameState);
	}

	_handleRhymeMessage(msg, connection, players, gameState) {
		const currentWord = gameState.words[gameState.words.length - 1].wordToRhyme;
		const guessedWord = msg.rhyme.word.toLowerCase().trim();

		if (hasWordBeenPlayed(guessedWord, currentWord.guesses)) {
			this._broadcast({ type: 'played_word', word: guessedWord, user: connection.id });
			return true; // Indicate that the word has already been played
		}
		const matchingRhymes = currentWord.validRhymes.filter(
			(validRhyme) => validRhyme.word.toLowerCase().trim() === guessedWord
		);

		const isValidRhyme = matchingRhymes.length > 0;
		currentWord.guesses.push({
			...msg.rhyme,
			playerId: connection.id,
			isValid: isValidRhyme,
			category: isValidRhyme ? categorizeRhyme(matchingRhymes[0], currentWord.stats) : 'nope'
		});

		if (!players.includes(connection.id)) {
			players.push(connection.id);
		}

		gameState.session.players = players.size;

		return false; // Indicate that the word has not been played before
	}

	async onClose(connection) {
		const { players, gameState } = await this._fetchAndSetSessionData();

		const index = players.indexOf(connection.id);
		if (index !== -1) {
			players.splice(index, 1);
		}
		// Remove player
		gameState.session.players = players.length; // Update player count

		// If no players left, reset the session data.
		if (!players.length) {
			await this._resetSessionData();
		} else {
			if (gameState.session.currentPlayerId === connection.id) {
				this._switchToNextPlayer(players, gameState);
			}
			await this._updateSessionData(players, gameState);
		}

		this._broadcast({ type: 'player_left', playerId: connection.id });
		this._broadcastSync(null, gameState);
	}

	async _resetSessionData() {
		const initialGameState = await getInitialGameState();
		initialGameState.session.room = this.party.id;
		await this._updateSessionData(getDefaultPlayers(), initialGameState);
	}
}
