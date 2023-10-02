import http from 'http';
import { Server } from 'colyseus';
import RoomSchema from './RoomSchema';

const gameServer = new Server({
  server: http.createServer(),
});

gameServer.define('your_room_schema', RoomSchema);

gameServer.listen(2567);
