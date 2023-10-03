<script>
	import { fly, fade } from 'svelte/transition';
	import ShortUniqueId from 'short-unique-id';
	import { clickToCopyAction } from 'svelte-legos';
	const uid = new ShortUniqueId({ length: 5 });
	let roomLink = '';

	function createRoom() {
		const roomId = uid.rnd();
		roomLink = `${window.location.origin}/room/?id=${roomId}`;
	}

	function copyToClipboard() {
		navigator.clipboard.writeText(roomLink);
	}

	function goToRoom() {
		window.location.href = roomLink;
	}
</script>

<main>
	<h1>Let's rhyme</h1>
	{#if roomLink}
		<div class="link" in:fly={{ y: 20, duration: 200 }}>
			<input type="text" readonly value={roomLink} onClick={copyToClipboard} />
			<button class="copy" use:clickToCopyAction={roomLink}>Copy Link</button>
			<button class="go" on:click={goToRoom}>Go to Room</button>
			<!-- New button -->
		</div>
	{:else}
		<button in:fade={{ duration: 400 }} on:click={createRoom}>Create Room</button>
	{/if}
</main>

<style>
	h1 {
		font-size: 4rem;
	}
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	button {
		padding: 10px 20px;
		margin-top: 10px;
		cursor: pointer;
		background-color: #272727;
		border-radius: 8px;
		font-family: 'Nunito Variable', sans-serif;
		font-size: x-large;
		color: rgb(232, 232, 232);
	}
	.copy {
		font-size: small;
		width: 100%;
	}
	input {
		width: 100%;
		padding: 5px;
		text-align: center;
		margin-top: 20px;
		font-size: x-large;
	}

	.link {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-around;
		height: 120px;
	}

	.go {
		appearance: button;
		background-color: #000;
		background-image: none;
		border: 1px solid #000;
		border-radius: 4px;
		box-shadow: #fff 4px 4px 0 0, #000 4px 4px 0 1px;
		box-sizing: border-box;
		color: #fff;
		cursor: pointer;
		display: inline-block;
		font-family: 'Nunito Variable', 'sans-serif';
		font-size: 28px;
		font-weight: 400;
		line-height: 20px;
		margin: 40px 5px 10px 0;
		overflow: visible;
		padding: 20px 40px;
		text-align: center;
		text-transform: none;
		touch-action: manipulation;
		user-select: none;
		-webkit-user-select: none;
		vertical-align: middle;
		white-space: nowrap;
	}

	.go:focus {
		text-decoration: none;
	}

	.go:hover {
		text-decoration: none;
	}

	.go:active {
		box-shadow: rgba(0, 0, 0, 0.125) 0 3px 5px inset;
		outline: 0;
	}

	.go:not([disabled]):active {
		box-shadow: #fff 2px 2px 0 0, #000 2px 2px 0 1px;
		transform: translate(2px, 2px);
	}

	@media (min-width: 768px) {
		.button-50 {
			padding: 12px 50px;
		}
	}
</style>
