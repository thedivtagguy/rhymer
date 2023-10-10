import { writable } from 'svelte/store';
import { localStorageStore } from 'fractils';

export const numberOfPlayers = writable(1);
export const onlinePlayers = writable(0);

// Set the stored value or a sane default.
export const playerNameStore = localStorageStore('player', 'Anonymous');

export const dailyStore = localStorageStore('dailyStore', {});
