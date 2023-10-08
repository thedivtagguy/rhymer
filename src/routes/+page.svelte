<script>
	import { fly, fade } from 'svelte/transition';
	import ShortUniqueId from 'short-unique-id';
	import { clickToCopyAction } from 'svelte-legos';
	import Copy from '$lib/svg/Copy.svelte';
	import Arrow from '$lib/svg/Arrow.svelte';
	import { numberOfPlayers } from '$lib/stores';
	import PeoplePresence from '$lib/svg/PeoplePresence.svelte';
	const uid = new ShortUniqueId({ length: 5 });
	let roomLink = '';
	let step = 0;
	let numPlayers = 1;

	function goToRoom() {
		window.location.href = roomLink;
	}
	const isDevMode = process.env.NODE_ENV === 'development';
	const host = isDevMode
		? 'localhost:33141/.netlify/functions/create-room'
		: '/.netlify/my-functions/create-room';
	async function createRoom() {
		const roomId = uid.rnd();

		return new Promise(async (resolve, reject) => {
			try {
				const response = await fetch(host, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						roomId: roomId,
						maxPlayers: numPlayers
					})
				});

				const data = await response.json();

				if (response.ok) {
					roomLink = `${window.location.origin}/battle/?id=${roomId}`;
					step = 2;
					resolve(data);
				} else {
					console.error('Error creating room:', data);
					reject(data);
				}
			} catch (error) {
				console.error('Network request failed:', error);
				reject(error);
			}
		});
	}

	let roomCreation = null; // Holds the promise when createRoom is called
	function setNumPlayersAndProceed(value) {
		numberOfPlayers.set(value);
		roomCreation = createRoom();
	}
</script>

<main>
	{#if step === 0}
		<section in:fly={{ y: 20, duration: 200 }} class="box">
			<button in:fade={{ duration: 400 }}>today's special</button>
			<span>or</span>
			<button in:fade={{ duration: 400 }} on:click={() => (step = 1)}>get a room</button>
		</section>
	{:else if step === 1}
		<section in:fly={{ y: 20, duration: 200 }} class="gray-box">
			<p>And how many will you be?</p>
			<div class="num-people">
				{#each Array(2) as people, i}
					<PeoplePresence
						people={i + 2}
						width="3em"
						hoverEffects={true}
						active={numPlayers === i + 2}
						onClick={() => (numPlayers = i + 2)}
					/>
				{/each}
			</div>

			<!-- <input type="number" bind:value={numPlayers} min="1" max="3" /> -->
			<button on:click={() => setNumPlayersAndProceed(numPlayers)}>Create Room</button>
		</section>
		<Arrow width="2em" onClick={() => ((step = 0), (roomLink = ''))} ariaLabel="Close room link" />
		{#await roomCreation}
			<p>Loading...</p>
		{:catch error}
			<p>There was an error creating the room. Please try again. {error}</p>
		{/await}
	{:else if step === 2}
		<section in:fly={{ y: 20, duration: 200 }} class="gray-box">
			<button class="copy-link" use:clickToCopyAction={roomLink}>
				<Copy fill="#7d7d7d" width="2em" />
				<span>{roomLink}</span></button
			>
			<p>Ask your friends to join!</p>
			<button on:click={goToRoom}>Enter battle</button>
		</section>
		<Arrow width="2em" onClick={() => ((step = 1), (roomLink = ''))} ariaLabel="Close room link" />
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		/* padding-top: 10rem; */
		gap: 16px;
	}
	.gray-box {
		background-color: var(--box-gray);
		height: 300px;
		width: 250px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		border-radius: 8px;
		padding: 16px;
		gap: 16px;
		border: 2px rgb(182, 182, 182) solid;
		margin-bottom: 16px;
	}

	.gray-box > p {
		width: 60%;
		text-align: center;
	}

	.box {
		background-color: transparent;
		height: 300px;
		width: 300px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		border-radius: 8px;
		padding: 16px;
		gap: 16px;
	}
	.gray-box p {
		font-size: larger;
		color: #7d7d7d;
		font-weight: 700;
	}
	.copy-link:hover {
		box-shadow: rgba(45, 35, 66, 0.4) 0 4px 8px, rgba(45, 35, 66, 0.3) 0 7px 13px -3px,
			#d6d6e7 0 -3px 0 inset;
		transform: translateY(-2px);
	}

	.copy-link:active {
		box-shadow: #d6d6e7 0 3px 7px inset;
		transform: translateY(2px);
	}
	.copy-link {
		background-color: #fefefe;
		color: #7d7d7d;
		font-size: large;
		border: 2px #bbbbbb solid;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 4px;
	}

	.num-people {
		display: flex;
		justify-content: space-between;
		width: 80%;
	}
</style>
