const http = require('http').createServer();
const { Server } = require('colyseus');
const YourRoomSchema = require('./YourRoomSchema');

const gameServer = new Server({
	server: http
});

gameServer.define('your_room_schema', YourRoomSchema);

gameServer.listen(2567);
