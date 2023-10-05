import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl: string = process.env.SUPABASE_URL as string;
const supabaseKey: string = process.env.SUPBASE_API_KEY as string;

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

interface RoomData {
    roomId: string;
    maxPlayers: number;
}

exports.handler = async (event: any, context: any) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { roomId, maxPlayers }: RoomData = JSON.parse(event.body);
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
