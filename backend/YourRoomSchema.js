const { Room, Client } = require('colyseus');
const { Schema, type, MapSchema } = require('@colyseus/schema');

class State extends Schema {
	@type(['string'])
	chain = new Array();
}

class YourRoomSchema extends Room {
	onCreate() {
		this.setState(new State());
	}

	onMessage(client, message) {
		if (message.action === 'add') {
			this.state.chain.push(message.word);
		}
	}
}

module.exports = YourRoomSchema;
