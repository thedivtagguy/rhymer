import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async (request, response) => {
	if (request.method !== 'POST') {
		return response.status(405).send('Method Not Allowed');
	}

	const { roomId, maxPlayers } = request.body;
	const { data, error } = await supabase
		.from('rhymer_rooms')
		.insert([{ room_id: roomId, max_players: maxPlayers }]);

	if (error) {
		console.log(error);
		return response.status(500).json({ error: error.message });
	}

	response.status(200).json({ success: true, room: data });
};
