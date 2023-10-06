import { words } from './shared';

export async function getMaxPlayersForRoom(roomId, env) {
	const response = await fetch(
		`${env.SUPABASE_URL}/rest/v1/rhymer_rooms?select=max_players&room_id=eq.${roomId}`,
		{
			headers: {
				apikey: env.SUPABASE_API_KEY,
				'Content-Type': 'application/json'
			}
		}
	);

	if (!response.ok) {
		throw new Error('Failed to fetch max_players for the room.');
	}

	const data = await response.json();

	if (data && data.length > 0) {
		return data[0].max_players;
	} else {
		throw new Error('Room not found.');
	}
}

export async function fetchValidRhymes(word) {
	const response = await fetch(`https://rhymetimewords.netlify.app/words/debug/${word}.json`);
	if (!response.ok) {
		return { words: [], stats: {} };
	}
	return await response.json();
}

export function getDefaultPlayers() {
	return new Set();
}

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

export function getNextPlayerId(currentPlayerId, playersSet) {
	const playersArray = Array.from(playersSet);
	const currentPlayerIndex = playersArray.indexOf(currentPlayerId);

	if (currentPlayerIndex !== -1 && currentPlayerIndex < playersArray.length - 1) {
		return playersArray[currentPlayerIndex + 1];
	}
	return playersArray[0];
}

export function getNewWord(words) {
	const today = new Date();
	const seed = today.getDate() + (today.getMonth() + 1) * 100 + today.getFullYear() * 10000;
	const index = seed % words.length;
	return {
		wordToRhyme: {
			word: words[index],
			validRhymes: [],
			guesses: []
		}
	};
}

export function getInitialGameState() {
	return {
		words: [getNewWord(words)],
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
