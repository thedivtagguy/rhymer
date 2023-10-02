import { Room, Client } from 'colyseus';
import { Schema, type, MapSchema } from '@colyseus/schema';

class State extends Schema {
  @type(['string'])
  chain: string[] = [];
}

export default class YourRoomSchema extends Room {
  onCreate() {
    this.setState(new State());
  }

  onMessage(client: Client, message: any) {
    if (message.action === 'add') {
      this.state.chain.push(message.word);
    }
  }
}
