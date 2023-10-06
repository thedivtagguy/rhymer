/**
 * Fetches the maximum number of players allowed for a given room.
 *
 * @param {string} roomId - The ID of the room.
 * @param {Object} party - The party object containing environment data.
 * @param {Object} party.env - The environment data.
 * @param {string} party.env.SUPABASE_URL - The URL for the Supabase API.
 * @param {string} party.env.SUPABASE_API_KEY - The API key for accessing Supabase.
 *
 * @returns {Promise<number|null>} - The maximum number of players allowed for the room, or null if data is unavailable.
 *
 * @throws {Error} Throws an error if the fetch operation fails.
 */
export async function getMaxPlayersForRoom(roomId, party) {
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
	return data?.length ? data[0].max_players : null;
}

/**
 * Fetches valid rhymes for a given word.
 *
 * @param {string} word - The word for which to fetch rhymes.
 * @param {number} [retryCount=3] - Number of times to retry in case of 404 error.
 *
 * @returns {Promise<{words: Array<Object>, stats: Object}>} - An object containing an array of valid rhymes and statistical data.
 */
export async function fetchValidRhymes(word, retryCount = 3) {
	while (retryCount > 0) {
		try {
			const response = await fetch(`https://rhymetimewords.netlify.app/words/debug/${word}.json`);

			if (!response.ok) {
				if (response.status === 404 && retryCount > 1) {
					const newWordContainer = await getNewWord();
					word = newWordContainer.wordToRhyme.word;
					retryCount--;
					continue; // Retry with the new word
				} else {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
			}

			const data = await response.json();
			return data.words ? data : { words: [], stats: {} };
		} catch (error) {
			if (retryCount === 1 || error.message !== 'HTTP error! status: 404') {
				console.error(error);
				return { words: [], stats: {} };
			}
		}
	}
}

/**
 * Cleans up the given game state by removing specified properties from each wordContainer.
 *
 * The function mutates the provided game state object by iterating through each wordContainer
 * within the state's `words` property. For each wordContainer, if the specified properties exist
 * within the `wordToRhyme` object, those properties are deleted. This is useful for reducing the
 * size of the game state or for storage concerns.
 *
 * @param {Object} gameState - The current game state.
 * @param {Array<Object>} gameState.words - An array of wordContainer objects.
 * @param {Object} gameState.words[].wordToRhyme - An object containing details about the word to rhyme.
 * @param {Array<string>} [propertiesToDelete=['validRhymes']] - A list of property names to delete from wordToRhyme. Defaults to ['validRhymes'].
 *
 * @returns {Object} - The cleaned-up game state.
 */
export function cleanUpState(gameState, propertiesToDelete = ['validRhymes']) {
	gameState.words.forEach((wordContainer) => {
		if (wordContainer.wordToRhyme) {
			propertiesToDelete.forEach((prop) => {
				if (wordContainer.wordToRhyme.hasOwnProperty(prop)) {
					delete wordContainer.wordToRhyme[prop];
				}
			});
		}
	});
	return gameState;
}
