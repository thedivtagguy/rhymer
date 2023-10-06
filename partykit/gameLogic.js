import { words } from './shared';
import { fetchValidRhymes } from './apiUtils';
/**
 * Returns a new set representing the default players.
 *
 * @returns {Set} - An empty set representing players.
 */
export function getDefaultPlayers() {
	return new Set();
}

/**
 * Categorizes a given rhyme based on its score and statistical data.
 *
 * @param {Object} rhyme - The rhyme object.
 * @param {number} rhyme.rhyme_score - The score of the rhyme.
 * @param {Object} stats - Statistical data to categorize rhyme.
 * @param {number} stats.mean - The mean score.
 * @param {Object} stats.cuts - The percentile cuts.
 * @returns {string} - The category of the rhyme: 'good', 'great', 'okay', or 'nope'.
 */
export function categorizeRhyme(rhyme, stats) {
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

/**
 * Determines the next player's ID.
 *
 * @param {string} currentPlayerId - The current player's ID.
 * @param {Set<string>} playersSet - Set of player IDs.
 * @returns {string} - The next player's ID.
 */
export function getNextPlayerId(currentPlayerId, playersSet) {
	const playersArray = Array.from(playersSet);
	const currentPlayerIndex = playersArray.indexOf(currentPlayerId);

	return currentPlayerIndex !== -1 && currentPlayerIndex < playersArray.length - 1
		? playersArray[currentPlayerIndex + 1]
		: playersArray[0];
}

/**
 * Word container structure.
 * @typedef {Object} WordContainer
 * @property {Object} wordToRhyme
 * @property {string} wordToRhyme.word - The word to rhyme.
 * @property {Array<Object>} wordToRhyme.validRhymes - List of valid rhymes for the word.
 * @property {Array<Object>} wordToRhyme.guesses - List of guesses made for the word.
 */

/**
 * Gets a new word for rhyming.
 *
 * @param {string} [option='date'] - The option to determine seed generation for the word. Defaults to 'date'.
 * @returns {Promise<WordContainer>} - A promise that resolves with a WordContainer object.
 */
export async function getNewWord(option = 'date') {
	let seed;

	if (option === 'date') {
		const today = new Date();
		seed = today.getDate() + (today.getMonth() + 1) * 100 + today.getFullYear() * 10000;
	} else {
		// Default to random
		seed = Math.floor(Math.random() * 10000);
	}

	const wordContainer = {
		wordToRhyme: {
			word: words[seed % words.length],
			validRhymes: [],
			guesses: []
		}
	};

	return await fetchRhymesForWord(wordContainer);
}

/**
 * Initializes the game state.
 *
 * @returns {Object} - The initial game state.
 */
export async function getInitialGameState() {
	const newWord = await getNewWord('random');
	return {
		words: [newWord],
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

/**
 * Fetches valid rhymes for a given word container and returns a new updated word container.
 *
 * @param {Object} wordContainer - The word container.
 * @returns {Promise<Object>} - A new word container with valid rhymes and stats.
 */
export async function fetchRhymesForWord(wordContainer) {
	if (!wordContainer.wordToRhyme) return wordContainer;

	const word = wordContainer.wordToRhyme.word;
	const rhymesData = await fetchValidRhymes(word);
	const { words, stats } = rhymesData;

	if (!Array.isArray(words)) {
		console.error(`For word ${word}, fetched rhymes are not an array`);
		return wordContainer; // Return the original unchanged object if there's an error
	}

	const validRhymes = words.map((rhyme) => ({
		...rhyme,
		category: categorizeRhyme(rhyme, stats)
	}));

	return {
		...wordContainer,
		wordToRhyme: {
			...wordContainer.wordToRhyme,
			validRhymes,
			stats
		}
	};
}

/**
 * Handles the rhyme message and returns the updated gameState and players.
 *
 * @param {Object} msg - The message object.
 * @param {Object} connection - The connection object.
 * @param {Set<string>} players - Set of player IDs.
 * @param {Object} gameState - The current game state.
 * @return {{ players: Set<string>, gameState: Object }}
 */
export function handleRhymeMessage(msg, connection, players, gameState) {
	const currentWord = gameState.words[gameState.words.length - 1].wordToRhyme;
	const matchingRhymes = currentWord.validRhymes.filter(
		(validRhyme) => validRhyme.word.toLowerCase().trim() === msg.rhyme.word.toLowerCase().trim()
	);
	const isValidRhyme = matchingRhymes.length > 0;

	const newGuess = {
		...msg.rhyme,
		playerId: connection.id,
		isValid: isValidRhyme,
		category: isValidRhyme ? categorizeRhyme(matchingRhymes[0], currentWord.stats) : 'nope'
	};

	const newGuesses = [...currentWord.guesses, newGuess];
	const newWords = [...gameState.words];
	newWords[newWords.length - 1].wordToRhyme.guesses = newGuesses;

	const newPlayers = new Set(players);
	newPlayers.add(connection.id);

	const newGameState = {
		...gameState,
		words: newWords,
		session: {
			...gameState.session,
			players: newPlayers.size
		}
	};

	return { players: newPlayers, gameState: newGameState };
}

/**
 * Checks if the current round is finished.
 *
 * @param {Object} gameState - The current game state.
 * @param {number} maxMoves - Maximum allowed moves in a round.
 * @returns {boolean}
 */
export function isRoundFinished(gameState, maxMoves = 5) {
	const currentWord = gameState.words[gameState.words.length - 1].wordToRhyme;
	return currentWord.guesses.length >= maxMoves;
}

/**
 * Checks if the game is finished.
 *
 * @param {Object} gameState - The current game state.
 * @param {number} maxWords - Maximum allowed words in a game.
 * @returns {boolean}
 */
export function isGameFinished(gameState, maxWords = 5) {
	return gameState.words.length >= maxWords;
}

/**
 * Calculates player rankings based on their valid rhyme guesses throughout the game.
 *
 * @param {Object} gameState - The current game state.
 * @returns {Array<Object>} - Rankings in descending order of scores.
 */
export function calculateRankings(gameState) {
	const scores = new Map();

	gameState.words.forEach((wordContainer) => {
		wordContainer.wordToRhyme.guesses.forEach((guess) => {
			if (!guess.isValid) return; // We only award points for valid rhymes

			// Assign points based on the category
			let points;
			switch (guess.category) {
				case 'okay':
					points = 1;
					break;
				case 'good':
					points = 2;
					break;
				case 'great':
					points = 3;
					break;
				default:
					points = 0;
					break;
			}

			// Add points to the player's score or initialize it if it doesn't exist
			scores.set(guess.playerId, (scores.get(guess.playerId) || 0) + points);
		});
	});

	// Convert the scores map into an array of [playerId, score] and then sort it
	const sortedScores = [...scores.entries()].sort((a, b) => b[1] - a[1]);

	const rankings = sortedScores.map(([playerId, score], index) => ({
		rank: index + 1,
		playerId,
		score
	}));

	return rankings;
}

/**
 * Checks if a word has already been played based on the provided guesses.
 *
 * @param {string} word - The word to check.
 * @param {Array<{ word: string }>} guesses - An array of guess objects.
 * @returns {boolean} Returns `true` if the word has been played, otherwise `false`.
 */
export function hasWordBeenPlayed(word, guesses) {
	return guesses.some((guess) => guess.word.toLowerCase().trim() === word.toLowerCase().trim());
}
