const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPBASE_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
	if (event.httpMethod !== 'POST') {
		return { statusCode: 405, body: 'Method Not Allowed' };
	}

	const { roomId, maxPlayers } = JSON.parse(event.body);
	const { data, error } = await supabase
		.from('rooms')
		.insert([{ room_id: roomId, max_players: maxPlayers }]);

	if (error) {
		return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
	}

	return {
		statusCode: 200,
		body: JSON.stringify({ success: true, room: data })
	};
};
