import { writable } from 'svelte/store';

export const numberOfPlayers = writable(1);
export const onlinePlayers = writable(0);
