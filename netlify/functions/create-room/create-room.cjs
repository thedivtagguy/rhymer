const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const handler = async (event) => {
	try {
		if (event.httpMethod !== 'POST') {
			return { statusCode: 405, body: 'Method Not Allowed' };
		}

		const { roomId, maxPlayers } = JSON.parse(event.body);
		const { data, error } = await supabase
			.from('rhymer_rooms')
			.insert([{ room_id: roomId, max_players: maxPlayers }]);
		console.log('maxPlayers', maxPlayers);

		if (error) {
			console.log(error);

			return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
		}

		return {
			statusCode: 200,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST', // allow both GET and POST requests
				'Access-Control-Allow-Headers': 'Content-Type' // allow Content-Type header
			},
			body: JSON.stringify({ success: true, room: data })
		};
	} catch (error) {
		console.log(error);
		return { statusCode: 500, body: error.toString() };
	}
};

module.exports = { handler };
