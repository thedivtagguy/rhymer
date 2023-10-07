import { getNewWord } from './gameLogic';
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
		return false;
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
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			if (data.stats.total <= 18) {
				retryCount--;
				if (retryCount <= 0) {
					throw new Error('Maximum retry count reached.');
				}
				const newWordContainer = await getNewWord();
				word = newWordContainer.wordToRhyme.word;
			} else {
				return data.words ? data : { words: [], stats: {} };
			}
		} catch (error) {
			console.error(error);
			retryCount--;

			if (retryCount <= 0) {
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

/**
 * Deletes a row from the rhymer_rooms table given the room ID.
 *
 * @param {string} roomId - The ID of the room.
 * @param {Object} party - The party object containing environment data.
 * @param {Object} party.env - The environment data.
 * @param {string} party.env.SUPABASE_URL - The URL for the Supabase API.
 * @param {string} party.env.SUPABASE_API_KEY - The API key for accessing Supabase.
 *
 * @returns {Promise<boolean>} - A boolean indicating success (true) or failure (false).
 *
 * @throws {Error} Throws an error if the delete operation fails.
 */
export async function deleteRoomById(roomId, party) {
	const response = await fetch(
		`${party.env.SUPABASE_URL}/rest/v1/rhymer_rooms?room_id=eq.${roomId}`,
		{
			method: 'DELETE',
			headers: {
				apikey: party.env.SUPABASE_API_KEY,
				'Content-Type': 'application/json'
			}
		}
	);

	if (!response.ok) {
		throw new Error('Failed to delete the room by ID.');
	}

	// The API usually returns the deleted data. If there's no data in the response,
	// the deletion failed or the row didn't exist in the first place.
	const data = await response.json();
	return !!data.length;
}
