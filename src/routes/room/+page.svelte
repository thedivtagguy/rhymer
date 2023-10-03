<script>
	import GameLogic from '../../components/GameLogic.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let roomId;

	onMount(() => {
		// save the id parameter if it's in the url or an empty string
		roomId = $page.url.searchParams.get('id') || '';
	});
</script>

<GameLogic id={roomId} />
