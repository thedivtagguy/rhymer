const http = require('http').createServer();
const { Server } = require('colyseus');
const RoomSchema = require('./RoomSchema');

const gameServer = new Server({
	server: http
});

gameServer.define('your_room_schema', RoomSchema);

gameServer.listen(2567);
