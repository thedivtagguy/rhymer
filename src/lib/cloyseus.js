import * as Colyseus from 'colyseus';

const client = new Colyseus.Client('ws://localhost:2567');

export default client;
